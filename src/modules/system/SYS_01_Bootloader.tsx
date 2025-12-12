// ============================================================================
// SYS_01 - SYSTEM BOOTLOADER
// The Control Panel for NexusCanon ERP Core Settings
// ============================================================================
// The final piece of the Triad: Kernel → Module → System
// This proves the architecture handles not just data, but configuration.
// ============================================================================

import React, { useState, useMemo } from 'react'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// 1. SYSTEM CONFIG SCHEMA
// ============================================================================

interface ConfigField {
  key: string
  label: string
  description: string
  type: 'text' | 'toggle' | 'select' | 'number'
  category:
    | 'identity'
    | 'security'
    | 'appearance'
    | 'notifications'
    | 'advanced'
  is_critical?: boolean
  options?: { value: string; label: string }[]
  default_value: string | boolean | number
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
]

// ============================================================================
// 2. CATEGORY METADATA
// ============================================================================

const CATEGORIES = {
  identity: {
    label: 'Identity',
    icon: Globe,
    description: 'System identification and branding',
  },
  security: {
    label: 'Security',
    icon: Shield,
    description: 'Access control and authentication',
  },
  appearance: {
    label: 'Appearance',
    icon: Palette,
    description: 'Theme and visual preferences',
  },
  notifications: {
    label: 'Notifications',
    icon: Bell,
    description: 'Alerts and communication channels',
  },
  advanced: {
    label: 'Advanced',
    icon: Terminal,
    description: 'Performance and developer options',
  },
}

// ============================================================================
// 3. MAIN COMPONENT
// ============================================================================

type ConfigValues = Record<string, string | boolean | number>

export function SYS01Bootloader() {
  // Initialize config from defaults
  const [config, setConfig] = useState<ConfigValues>(() => {
    const initial: ConfigValues = {}
    SYSTEM_CONFIG_SCHEMA.forEach((field) => {
      initial[field.key] = field.default_value
    })
    return initial
  })

  const [activeCategory, setActiveCategory] =
    useState<keyof typeof CATEGORIES>('identity')
  const [hasChanges, setHasChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  )

  // Group fields by category
  const fieldsByCategory = useMemo(() => {
    const grouped: Record<string, ConfigField[]> = {}
    SYSTEM_CONFIG_SCHEMA.forEach((field) => {
      if (!grouped[field.category]) grouped[field.category] = []
      grouped[field.category].push(field)
    })
    return grouped
  }, [])

  // === HANDLERS ===
  const handleChange = (key: string, value: string | boolean | number) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
    setSaveStatus('idle')
  }

  const handleSave = () => {
    setSaveStatus('saving')
    // Simulate API call
    setTimeout(() => {
      setSaveStatus('saved')
      setHasChanges(false)
      console.log('💾 Config saved:', config)
    }, 1000)
  }

  const handleReset = () => {
    const initial: ConfigValues = {}
    SYSTEM_CONFIG_SCHEMA.forEach((field) => {
      initial[field.key] = field.default_value
    })
    setConfig(initial)
    setHasChanges(true)
    setSaveStatus('idle')
  }

  // === RENDER FIELD ===
  const renderField = (field: ConfigField) => {
    const value = config[field.key]

    switch (field.type) {
      case 'toggle':
        return (
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={Boolean(value)}
              onChange={(e) => handleChange(field.key, e.target.checked)}
            />
            <div
              className={cn(
                'h-6 w-11 rounded-full transition-colors',
                'bg-[#333] peer-checked:bg-[#28E7A2]',
                "after:absolute after:left-0.5 after:top-0.5 after:content-['']",
                'after:h-5 after:w-5 after:rounded-full after:bg-white',
                'after:transition-all peer-checked:after:translate-x-5'
              )}
            />
          </label>
        )

      case 'select':
        return (
          <select
            value={String(value)}
            onChange={(e) => handleChange(field.key, e.target.value)}
            className={cn(
              'rounded-lg border border-[#333] bg-[#111] px-3 py-2',
              'font-mono text-sm text-white focus:ring-1 focus:ring-[#28E7A2]',
              'min-w-[200px] cursor-pointer appearance-none outline-none'
            )}
          >
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#111]">
                {opt.label}
              </option>
            ))}
          </select>
        )

      case 'number':
        return (
          <input
            type="number"
            value={Number(value)}
            onChange={(e) =>
              handleChange(field.key, parseInt(e.target.value) || 0)
            }
            className={cn(
              'w-24 rounded-lg border border-[#333] bg-[#111] px-3 py-2',
              'font-mono text-sm text-white focus:ring-1 focus:ring-[#28E7A2]',
              'text-right outline-none'
            )}
          />
        )

      default:
        return (
          <input
            type="text"
            value={String(value)}
            onChange={(e) => handleChange(field.key, e.target.value)}
            className={cn(
              'w-64 rounded-lg border border-[#333] bg-[#111] px-3 py-2',
              'font-mono text-sm text-white focus:ring-1 focus:ring-[#28E7A2]',
              'outline-none'
            )}
          />
        )
    }
  }

  // === MAIN RENDER ===
  return (
    <div className="min-h-screen bg-[#050505]">
      {/* HEADER */}
      <header className="border-b border-[#1F1F1F] bg-[#0A0A0A]">
        <div className="mx-auto max-w-[1400px] px-6 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#28E7A2]/30 bg-[#28E7A2]/10">
                <Cpu className="h-6 w-6 text-[#28E7A2]" />
              </div>
              <div>
                <h1 className="flex items-center gap-2 text-xl font-bold text-white">
                  <span className="font-mono text-[#28E7A2]">SYS_01</span>
                  <span className="text-[#333]">/</span>
                  <span>System Bootloader</span>
                </h1>
                <p className="font-mono text-[11px] text-[#666]">
                  Core Configuration • {SYSTEM_CONFIG_SCHEMA.length} Settings •
                  Schema-Driven
                </p>
              </div>
            </div>

            {/* SAVE ACTIONS */}
            <div className="flex items-center gap-3">
              {hasChanges && (
                <div className="flex items-center gap-2 font-mono text-xs text-amber-500">
                  <AlertTriangle className="h-4 w-4" />
                  Unsaved Changes
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-2 font-mono text-xs text-[#28E7A2]">
                  <CheckCircle2 className="h-4 w-4" />
                  Saved
                </div>
              )}
              <button
                onClick={handleReset}
                className="flex items-center gap-2 rounded-lg border border-[#333] bg-[#1F1F1F] px-4 py-2 font-mono text-xs text-gray-300 transition-colors hover:border-[#444] hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || saveStatus === 'saving'}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-bold transition-all',
                  hasChanges
                    ? 'bg-[#28E7A2] text-black shadow-[0_0_15px_rgba(40,231,162,0.3)] hover:bg-[#28E7A2]/80'
                    : 'cursor-not-allowed bg-[#1F1F1F] text-[#666]'
                )}
              >
                <Save className="h-4 w-4" />
                {saveStatus === 'saving' ? 'Saving...' : 'Save Config'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* SIDEBAR NAV */}
          <nav className="shrink-0 lg:w-64">
            <div className="sticky top-8 space-y-2">
              {Object.entries(CATEGORIES).map(([key, cat]) => {
                const Icon = cat.icon
                const isActive = activeCategory === key
                const fieldCount = fieldsByCategory[key]?.length || 0

                return (
                  <button
                    key={key}
                    onClick={() =>
                      setActiveCategory(key as keyof typeof CATEGORIES)
                    }
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-all',
                      isActive
                        ? 'border border-[#28E7A2]/30 bg-[#28E7A2]/10 text-white'
                        : 'border border-[#1F1F1F] bg-[#0A0A0A] text-[#888] hover:border-[#333] hover:text-white'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        isActive ? 'text-[#28E7A2]' : 'text-[#666]'
                      )}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{cat.label}</div>
                      <div className="text-[10px] text-[#666]">
                        {fieldCount} settings
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </nav>

          {/* CONFIG PANEL */}
          <div className="flex-1">
            {/* Category Header */}
            <div className="mb-6 border-b border-[#1F1F1F] pb-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                {React.createElement(CATEGORIES[activeCategory].icon, {
                  className: 'w-5 h-5 text-[#28E7A2]',
                })}
                {CATEGORIES[activeCategory].label}
              </h2>
              <p className="mt-1 text-sm text-[#666]">
                {CATEGORIES[activeCategory].description}
              </p>
            </div>

            {/* Fields */}
            <div className="space-y-1">
              {fieldsByCategory[activeCategory]?.map((field) => (
                <div
                  key={field.key}
                  className={cn(
                    'flex flex-col justify-between gap-4 rounded-lg p-4 sm:flex-row sm:items-center',
                    'border border-[#1F1F1F] bg-[#0A0A0A] transition-colors hover:border-[#333]'
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {field.label}
                      </span>
                      {field.is_critical && (
                        <Lock className="h-3 w-3 text-amber-500" />
                      )}
                    </div>
                    <p className="mt-0.5 flex items-start gap-1 text-xs text-[#666]">
                      <Info className="mt-0.5 h-3 w-3 shrink-0" />
                      {field.description}
                    </p>
                    <div className="mt-1 font-mono text-[10px] text-[#444]">
                      key: {field.key}
                    </div>
                  </div>
                  <div className="flex justify-end">{renderField(field)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SYSTEM STATUS FOOTER */}
        <div className="mt-12 rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] p-6">
          <h3 className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#666]">
            <Server className="h-4 w-4" />
            System Status
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 animate-pulse rounded-full bg-[#28E7A2]" />
              <div>
                <div className="text-xs text-[#666]">Database</div>
                <div className="font-mono text-sm text-white">Connected</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 animate-pulse rounded-full bg-[#28E7A2]" />
              <div>
                <div className="text-xs text-[#666]">API Gateway</div>
                <div className="font-mono text-sm text-white">Healthy</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 animate-pulse rounded-full bg-[#28E7A2]" />
              <div>
                <div className="text-xs text-[#666]">Cache</div>
                <div className="font-mono text-sm text-white">98% Hit Rate</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <div>
                <div className="text-xs text-[#666]">Queue</div>
                <div className="font-mono text-sm text-amber-400">
                  3 Pending
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SYS01Bootloader
