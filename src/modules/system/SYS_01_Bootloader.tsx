// ============================================================================
// SYS_01 - SYSTEM BOOTLOADER
// The Control Panel for NexusCanon ERP Core Settings
// ============================================================================
// The final piece of the Triad: Kernel → Module → System
// This proves the architecture handles not just data, but configuration.
// ============================================================================

import React, { useState, useMemo } from 'react';
import { 
  Settings, 
  Shield, 
  Palette, 
  Bell, 
  Database,
  Globe,
  Lock,
  Power,
  AlertTriangle,
  CheckCircle2,
  Info,
  Save,
  RotateCcw,
  Terminal,
  Cpu,
  Server,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// 1. SYSTEM CONFIG SCHEMA
// ============================================================================

interface ConfigField {
  key: string;
  label: string;
  description: string;
  type: 'text' | 'toggle' | 'select' | 'number';
  category: 'identity' | 'security' | 'appearance' | 'notifications' | 'advanced';
  is_critical?: boolean;
  options?: { value: string; label: string }[];
  default_value: string | boolean | number;
}

const SYSTEM_CONFIG_SCHEMA: ConfigField[] = [
  // Identity
  {
    key: 'system_name',
    label: 'System Name',
    description: 'Display name for the ERP instance',
    type: 'text',
    category: 'identity',
    default_value: 'NexusCanon ERP',
  },
  {
    key: 'organization_name',
    label: 'Organization',
    description: 'Legal entity name',
    type: 'text',
    category: 'identity',
    default_value: 'Acme Corporation',
  },
  {
    key: 'environment',
    label: 'Environment',
    description: 'Current deployment environment',
    type: 'select',
    category: 'identity',
    is_critical: true,
    options: [
      { value: 'development', label: 'Development' },
      { value: 'staging', label: 'Staging' },
      { value: 'production', label: 'Production' },
    ],
    default_value: 'development',
  },

  // Security
  {
    key: 'maintenance_mode',
    label: 'Maintenance Mode',
    description: 'Block all non-admin access during maintenance',
    type: 'toggle',
    category: 'security',
    is_critical: true,
    default_value: false,
  },
  {
    key: 'session_timeout',
    label: 'Session Timeout (minutes)',
    description: 'Auto-logout after inactivity',
    type: 'number',
    category: 'security',
    default_value: 30,
  },
  {
    key: 'require_mfa',
    label: 'Require MFA',
    description: 'Force multi-factor authentication for all users',
    type: 'toggle',
    category: 'security',
    is_critical: true,
    default_value: false,
  },
  {
    key: 'password_policy',
    label: 'Password Policy',
    description: 'Minimum password complexity',
    type: 'select',
    category: 'security',
    options: [
      { value: 'basic', label: 'Basic (8+ chars)' },
      { value: 'medium', label: 'Medium (12+ chars, mixed case)' },
      { value: 'strong', label: 'Strong (16+ chars, symbols)' },
    ],
    default_value: 'medium',
  },

  // Appearance
  {
    key: 'theme_mode',
    label: 'Theme Mode',
    description: 'Global UI theme preference',
    type: 'select',
    category: 'appearance',
    options: [
      { value: 'dark', label: 'Dark (NexusCanon)' },
      { value: 'light', label: 'Light' },
      { value: 'system', label: 'System Preference' },
    ],
    default_value: 'dark',
  },
  {
    key: 'accent_color',
    label: 'Accent Color',
    description: 'Primary brand color throughout the UI',
    type: 'select',
    category: 'appearance',
    options: [
      { value: '#28E7A2', label: 'Emerald (Default)' },
      { value: '#3B82F6', label: 'Blue' },
      { value: '#8B5CF6', label: 'Purple' },
      { value: '#F59E0B', label: 'Amber' },
    ],
    default_value: '#28E7A2',
  },
  {
    key: 'compact_mode',
    label: 'Compact Mode',
    description: 'Reduce spacing for dense data views',
    type: 'toggle',
    category: 'appearance',
    default_value: false,
  },

  // Notifications
  {
    key: 'email_notifications',
    label: 'Email Notifications',
    description: 'Send system alerts via email',
    type: 'toggle',
    category: 'notifications',
    default_value: true,
  },
  {
    key: 'slack_integration',
    label: 'Slack Integration',
    description: 'Push critical alerts to Slack channel',
    type: 'toggle',
    category: 'notifications',
    default_value: false,
  },

  // Advanced
  {
    key: 'api_rate_limit',
    label: 'API Rate Limit (req/min)',
    description: 'Maximum API requests per minute per user',
    type: 'number',
    category: 'advanced',
    default_value: 100,
  },
  {
    key: 'debug_mode',
    label: 'Debug Mode',
    description: 'Enable verbose logging (performance impact)',
    type: 'toggle',
    category: 'advanced',
    is_critical: true,
    default_value: false,
  },
  {
    key: 'data_retention_days',
    label: 'Data Retention (days)',
    description: 'Audit log retention period',
    type: 'number',
    category: 'advanced',
    default_value: 365,
  },
];

// ============================================================================
// 2. CATEGORY METADATA
// ============================================================================

const CATEGORIES = {
  identity: { 
    label: 'Identity', 
    icon: Globe, 
    description: 'System identification and branding' 
  },
  security: { 
    label: 'Security', 
    icon: Shield, 
    description: 'Access control and authentication' 
  },
  appearance: { 
    label: 'Appearance', 
    icon: Palette, 
    description: 'Theme and visual preferences' 
  },
  notifications: { 
    label: 'Notifications', 
    icon: Bell, 
    description: 'Alerts and communication channels' 
  },
  advanced: { 
    label: 'Advanced', 
    icon: Terminal, 
    description: 'Performance and developer options' 
  },
};

// ============================================================================
// 3. MAIN COMPONENT
// ============================================================================

type ConfigValues = Record<string, string | boolean | number>;

export function SYS01Bootloader() {
  // Initialize config from defaults
  const [config, setConfig] = useState<ConfigValues>(() => {
    const initial: ConfigValues = {};
    SYSTEM_CONFIG_SCHEMA.forEach((field) => {
      initial[field.key] = field.default_value;
    });
    return initial;
  });

  const [activeCategory, setActiveCategory] = useState<keyof typeof CATEGORIES>('identity');
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Group fields by category
  const fieldsByCategory = useMemo(() => {
    const grouped: Record<string, ConfigField[]> = {};
    SYSTEM_CONFIG_SCHEMA.forEach((field) => {
      if (!grouped[field.category]) grouped[field.category] = [];
      grouped[field.category].push(field);
    });
    return grouped;
  }, []);

  // === HANDLERS ===
  const handleChange = (key: string, value: string | boolean | number) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const handleSave = () => {
    setSaveStatus('saving');
    // Simulate API call
    setTimeout(() => {
      setSaveStatus('saved');
      setHasChanges(false);
      console.log('💾 Config saved:', config);
    }, 1000);
  };

  const handleReset = () => {
    const initial: ConfigValues = {};
    SYSTEM_CONFIG_SCHEMA.forEach((field) => {
      initial[field.key] = field.default_value;
    });
    setConfig(initial);
    setHasChanges(true);
    setSaveStatus('idle');
  };

  // === RENDER FIELD ===
  const renderField = (field: ConfigField) => {
    const value = config[field.key];

    switch (field.type) {
      case 'toggle':
        return (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={Boolean(value)}
              onChange={(e) => handleChange(field.key, e.target.checked)}
            />
            <div className={cn(
              "w-11 h-6 rounded-full transition-colors",
              "peer-checked:bg-[#28E7A2] bg-[#333]",
              "after:content-[''] after:absolute after:top-0.5 after:left-0.5",
              "after:bg-white after:rounded-full after:h-5 after:w-5",
              "after:transition-all peer-checked:after:translate-x-5"
            )} />
          </label>
        );

      case 'select':
        return (
          <select
            value={String(value)}
            onChange={(e) => handleChange(field.key, e.target.value)}
            className={cn(
              "bg-[#111] border border-[#333] rounded-lg px-3 py-2",
              "text-white text-sm font-mono focus:ring-1 focus:ring-[#28E7A2]",
              "outline-none appearance-none cursor-pointer min-w-[200px]"
            )}
          >
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#111]">
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            value={Number(value)}
            onChange={(e) => handleChange(field.key, parseInt(e.target.value) || 0)}
            className={cn(
              "bg-[#111] border border-[#333] rounded-lg px-3 py-2 w-24",
              "text-white text-sm font-mono focus:ring-1 focus:ring-[#28E7A2]",
              "outline-none text-right"
            )}
          />
        );

      default:
        return (
          <input
            type="text"
            value={String(value)}
            onChange={(e) => handleChange(field.key, e.target.value)}
            className={cn(
              "bg-[#111] border border-[#333] rounded-lg px-3 py-2 w-64",
              "text-white text-sm font-mono focus:ring-1 focus:ring-[#28E7A2]",
              "outline-none"
            )}
          />
        );
    }
  };

  // === MAIN RENDER ===
  return (
    <div className="min-h-screen bg-[#050505]">
      
      {/* HEADER */}
      <header className="border-b border-[#1F1F1F] bg-[#0A0A0A]">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#28E7A2]/10 border border-[#28E7A2]/30 flex items-center justify-center">
                <Cpu className="w-6 h-6 text-[#28E7A2]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-[#28E7A2] font-mono">SYS_01</span>
                  <span className="text-[#333]">/</span>
                  <span>System Bootloader</span>
                </h1>
                <p className="text-[11px] text-[#666] font-mono">
                  Core Configuration • {SYSTEM_CONFIG_SCHEMA.length} Settings • Schema-Driven
                </p>
              </div>
            </div>
            
            {/* SAVE ACTIONS */}
            <div className="flex items-center gap-3">
              {hasChanges && (
                <div className="flex items-center gap-2 text-amber-500 text-xs font-mono">
                  <AlertTriangle className="w-4 h-4" />
                  Unsaved Changes
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-2 text-[#28E7A2] text-xs font-mono">
                  <CheckCircle2 className="w-4 h-4" />
                  Saved
                </div>
              )}
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-[#1F1F1F] border border-[#333] text-gray-300 rounded-lg hover:text-white hover:border-[#444] text-xs font-mono transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || saveStatus === 'saving'}
                className={cn(
                  "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all",
                  hasChanges
                    ? "bg-[#28E7A2] text-black hover:bg-[#28E7A2]/80 shadow-[0_0_15px_rgba(40,231,162,0.3)]"
                    : "bg-[#1F1F1F] text-[#666] cursor-not-allowed"
                )}
              >
                <Save className="w-4 h-4" />
                {saveStatus === 'saving' ? 'Saving...' : 'Save Config'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* SIDEBAR NAV */}
          <nav className="lg:w-64 shrink-0">
            <div className="sticky top-8 space-y-2">
              {Object.entries(CATEGORIES).map(([key, cat]) => {
                const Icon = cat.icon;
                const isActive = activeCategory === key;
                const fieldCount = fieldsByCategory[key]?.length || 0;
                
                return (
                  <button
                    key={key}
                    onClick={() => setActiveCategory(key as keyof typeof CATEGORIES)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all",
                      isActive
                        ? "bg-[#28E7A2]/10 border border-[#28E7A2]/30 text-white"
                        : "bg-[#0A0A0A] border border-[#1F1F1F] text-[#888] hover:text-white hover:border-[#333]"
                    )}
                  >
                    <Icon className={cn(
                      "w-5 h-5",
                      isActive ? "text-[#28E7A2]" : "text-[#666]"
                    )} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{cat.label}</div>
                      <div className="text-[10px] text-[#666]">{fieldCount} settings</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* CONFIG PANEL */}
          <div className="flex-1">
            {/* Category Header */}
            <div className="mb-6 pb-4 border-b border-[#1F1F1F]">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {React.createElement(CATEGORIES[activeCategory].icon, {
                  className: "w-5 h-5 text-[#28E7A2]"
                })}
                {CATEGORIES[activeCategory].label}
              </h2>
              <p className="text-sm text-[#666] mt-1">
                {CATEGORIES[activeCategory].description}
              </p>
            </div>

            {/* Fields */}
            <div className="space-y-1">
              {fieldsByCategory[activeCategory]?.map((field) => (
                <div
                  key={field.key}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg",
                    "bg-[#0A0A0A] border border-[#1F1F1F] hover:border-[#333] transition-colors"
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{field.label}</span>
                      {field.is_critical && (
                        <Lock className="w-3 h-3 text-amber-500" />
                      )}
                    </div>
                    <p className="text-xs text-[#666] mt-0.5 flex items-start gap-1">
                      <Info className="w-3 h-3 mt-0.5 shrink-0" />
                      {field.description}
                    </p>
                    <div className="text-[10px] font-mono text-[#444] mt-1">
                      key: {field.key}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    {renderField(field)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SYSTEM STATUS FOOTER */}
        <div className="mt-12 p-6 bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg">
          <h3 className="text-[11px] font-mono text-[#666] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Server className="w-4 h-4" />
            System Status
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#28E7A2] animate-pulse" />
              <div>
                <div className="text-xs text-[#666]">Database</div>
                <div className="text-sm text-white font-mono">Connected</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#28E7A2] animate-pulse" />
              <div>
                <div className="text-xs text-[#666]">API Gateway</div>
                <div className="text-sm text-white font-mono">Healthy</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#28E7A2] animate-pulse" />
              <div>
                <div className="text-xs text-[#666]">Cache</div>
                <div className="text-sm text-white font-mono">98% Hit Rate</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <div>
                <div className="text-xs text-[#666]">Queue</div>
                <div className="text-sm text-amber-400 font-mono">3 Pending</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SYS01Bootloader;

