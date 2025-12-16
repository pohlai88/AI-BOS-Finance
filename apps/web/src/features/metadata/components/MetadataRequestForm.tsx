// ============================================================================
// METADATA REQUEST FORM
// Governance-first metadata creation/edit workflow
// ============================================================================
// PHILOSOPHY: Users don't "edit" the kernel - they "Request Changes"
// Registry (Read) → Request (Write) → Approval (Governance)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  AlertCircle, 
  Type, 
  ShieldAlert,
  Database,
  Tag,
  FileText,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MetadataType } from '@/kernel';

// ============================================================================
// TYPES
// ============================================================================

interface MetadataRequestData {
  business_term: string;
  technical_name: string;
  domain: string;
  data_type: MetadataType;
  is_critical: boolean;
  description: string;
  justification: string;
}

interface MetadataRequestFormProps {
  initialData?: Partial<MetadataRequestData>;
  onCancel: () => void;
  onSubmit: (data: MetadataRequestData) => void;
  isEditMode?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DOMAINS = [
  'Finance', 
  'HR', 
  'Inventory', 
  'Compliance', 
  'CRM', 
  'Logistics',
  'Operations',
  'Sales',
  'Marketing',
];

const DATA_TYPES: { value: MetadataType; label: string; icon: string }[] = [
  { value: 'text', label: 'Text', icon: '📝' },
  { value: 'number', label: 'Number', icon: '#️⃣' },
  { value: 'currency', label: 'Currency', icon: '💰' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'datetime', label: 'DateTime', icon: '🕐' },
  { value: 'status', label: 'Status', icon: '🏷️' },
  { value: 'boolean', label: 'Boolean', icon: '✓' },
  { value: 'code', label: 'Code/ID', icon: '🔑' },
  { value: 'percentage', label: 'Percentage', icon: '%' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function MetadataRequestForm({ 
  initialData, 
  onCancel, 
  onSubmit,
  isEditMode = false 
}: MetadataRequestFormProps) {
  
  // === FORM STATE ===
  const [formData, setFormData] = useState<MetadataRequestData>({
    business_term: initialData?.business_term || '',
    technical_name: initialData?.technical_name || '',
    domain: initialData?.domain || DOMAINS[0],
    data_type: initialData?.data_type || 'text',
    is_critical: initialData?.is_critical || false,
    description: initialData?.description || '',
    justification: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof MetadataRequestData, string>>>({});

  // === AUTO-GENERATE TECHNICAL NAME ===
  useEffect(() => {
    if (!isEditMode && formData.business_term) {
      const slug = formData.business_term
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
      
      setFormData(prev => ({ ...prev, technical_name: slug }));
    }
  }, [formData.business_term, isEditMode]);

  // === VALIDATION ===
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof MetadataRequestData, string>> = {};

    if (!formData.business_term.trim()) {
      newErrors.business_term = 'Business term is required';
    }

    if (!formData.technical_name.trim()) {
      newErrors.technical_name = 'Technical name is required';
    } else if (!/^[a-z][a-z0-9_]*$/.test(formData.technical_name)) {
      newErrors.technical_name = 'Must be snake_case (lowercase, underscores only)';
    }

    if (!formData.justification.trim()) {
      newErrors.justification = 'Governance justification is required';
    } else if (formData.justification.length < 20) {
      newErrors.justification = 'Please provide more detail (min 20 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // === HANDLERS ===
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const updateField = <K extends keyof MetadataRequestData>(
    field: K, 
    value: MetadataRequestData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // === RENDER ===
  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col bg-[#050505]">
      
      {/* ================================================================ */}
      {/* HEADER */}
      {/* ================================================================ */}
      <div className="px-6 py-4 border-b border-[#1F1F1F] flex items-center justify-between bg-[#0A0A0A]">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            isEditMode 
              ? "bg-blue-900/30 border border-blue-800" 
              : "bg-[#28E7A2]/10 border border-[#28E7A2]/30"
          )}>
            {isEditMode ? (
              <FileText className="w-5 h-5 text-blue-400" />
            ) : (
              <Database className="w-5 h-5 text-[#28E7A2]" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {isEditMode ? 'Edit Definition' : 'New Metadata Request'}
              {formData.is_critical && (
                <ShieldAlert className="w-4 h-4 text-[#FFD600]" />
              )}
            </h2>
            <p className="text-[11px] text-[#666] font-mono">
              {isEditMode 
                ? 'Modify existing schema contract' 
                : 'Propose a new field for the Global Registry'}
            </p>
          </div>
        </div>
        <button 
          type="button"
          onClick={onCancel} 
          className="p-2 hover:bg-[#1F1F1F] rounded-lg text-[#666] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ================================================================ */}
      {/* FORM BODY */}
      {/* ================================================================ */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        
        {/* SECTION 1: Identity */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-[#28E7A2]" />
            <h3 className="text-[11px] font-mono text-[#888] uppercase tracking-wider">
              Identity
            </h3>
          </div>

          {/* Business Term */}
          <div>
            <label className="block text-[10px] font-mono text-[#666] uppercase tracking-wider mb-1.5">
              Business Term *
            </label>
            <input
              type="text"
              placeholder="e.g. Total Revenue Amount"
              className={cn(
                "w-full bg-[#111] border rounded-lg px-4 py-2.5 text-white",
                "focus:ring-1 focus:ring-[#28E7A2] focus:border-[#28E7A2] outline-none",
                "transition-all placeholder-[#444] font-mono text-sm",
                errors.business_term ? "border-[#FF4D4D]" : "border-[#222]"
              )}
              value={formData.business_term}
              onChange={(e) => updateField('business_term', e.target.value)}
              autoFocus
            />
            {errors.business_term && (
              <p className="text-[10px] text-[#FF4D4D] mt-1">{errors.business_term}</p>
            )}
          </div>

          {/* Technical Name + Domain */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono text-[#666] uppercase tracking-wider mb-1.5 flex justify-between">
                Technical Name
                <span className="text-[#444] lowercase">snake_case</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-[#444] font-mono text-xs">db.</span>
                </div>
                <input
                  type="text"
                  readOnly={!isEditMode}
                  className={cn(
                    "w-full bg-[#0A0A0A] border rounded-lg pl-9 pr-4 py-2.5",
                    "font-mono text-xs text-[#28E7A2] outline-none",
                    !isEditMode && "cursor-not-allowed opacity-80",
                    errors.technical_name ? "border-[#FF4D4D]" : "border-[#222]"
                  )}
                  value={formData.technical_name}
                  onChange={(e) => updateField('technical_name', e.target.value)}
                />
              </div>
              {errors.technical_name && (
                <p className="text-[10px] text-[#FF4D4D] mt-1">{errors.technical_name}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-mono text-[#666] uppercase tracking-wider mb-1.5">
                Domain Owner
              </label>
              <select
                className={cn(
                  "w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2.5",
                  "text-white focus:ring-1 focus:ring-[#28E7A2] outline-none",
                  "appearance-none cursor-pointer font-mono text-sm"
                )}
                value={formData.domain}
                onChange={(e) => updateField('domain', e.target.value)}
              >
                {DOMAINS.map(d => (
                  <option key={d} value={d} className="bg-[#111]">{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-mono text-[#666] uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              placeholder="Brief explanation of what this metadata represents..."
              className={cn(
                "w-full bg-[#111] border border-[#222] rounded-lg px-4 py-2.5",
                "text-white focus:ring-1 focus:ring-[#28E7A2] outline-none",
                "transition-all placeholder-[#444] font-mono text-sm min-h-[60px] resize-none"
              )}
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
            />
          </div>
        </section>

        <hr className="border-[#1F1F1F]" />

        {/* SECTION 2: Schema Configuration */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-[#28E7A2]" />
              <h3 className="text-[11px] font-mono text-[#888] uppercase tracking-wider">
                Schema Configuration
              </h3>
            </div>
            
            {/* Critical Toggle */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <span className="text-[10px] font-mono text-[#666] uppercase group-hover:text-[#888] transition-colors">
                Critical?
              </span>
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={formData.is_critical}
                  onChange={(e) => updateField('is_critical', e.target.checked)} 
                />
                <div className={cn(
                  "w-10 h-5 rounded-full transition-colors",
                  "peer-checked:bg-[#FFD600] bg-[#222]",
                  "after:content-[''] after:absolute after:top-0.5 after:left-0.5",
                  "after:bg-white after:rounded-full after:h-4 after:w-4",
                  "after:transition-all peer-checked:after:translate-x-5"
                )} />
              </div>
            </label>
          </div>

          {/* Data Type Grid */}
          <div className="grid grid-cols-3 gap-2">
            {DATA_TYPES.map((type) => (
              <label 
                key={type.value}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all",
                  formData.data_type === type.value 
                    ? "bg-[#28E7A2]/10 border-[#28E7A2] text-white" 
                    : "bg-[#0A0A0A] border-[#222] text-[#666] hover:border-[#333] hover:bg-[#111]"
                )}
              >
                <input 
                  type="radio" 
                  name="dataType"
                  className="hidden"
                  checked={formData.data_type === type.value}
                  onChange={() => updateField('data_type', type.value)}
                />
                <span className="text-sm">{type.icon}</span>
                <span className="text-xs font-mono">{type.label}</span>
              </label>
            ))}
          </div>
        </section>

        <hr className="border-[#1F1F1F]" />

        {/* SECTION 3: Governance Justification */}
        <section className="bg-blue-900/10 border border-blue-900/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-medium text-blue-200">
                Governance Justification *
              </h4>
              <p className="text-[10px] text-blue-300/70">
                Every schema change requires documented reasoning for the Governance Council.
              </p>
              <textarea
                placeholder="Why do we need this field? Who is the downstream consumer? What business process does it support?"
                className={cn(
                  "w-full bg-[#050505] border rounded-lg p-3",
                  "text-sm text-[#CCC] focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
                  "outline-none min-h-[100px] resize-none font-mono",
                  errors.justification ? "border-[#FF4D4D]" : "border-blue-900/30"
                )}
                value={formData.justification}
                onChange={(e) => updateField('justification', e.target.value)}
              />
              {errors.justification && (
                <p className="text-[10px] text-[#FF4D4D]">{errors.justification}</p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ================================================================ */}
      {/* FOOTER ACTIONS */}
      {/* ================================================================ */}
      <div className="p-4 border-t border-[#1F1F1F] bg-[#0A0A0A] flex justify-between items-center">
        <p className="text-[10px] text-[#444] font-mono">
          * Required for governance approval
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-mono text-[#666] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={cn(
              "flex items-center gap-2 px-5 py-2",
              "bg-[#28E7A2] hover:bg-[#28E7A2]/80 text-black",
              "font-mono font-bold text-sm rounded-lg transition-all",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4" />
            {isEditMode ? 'Update' : 'Submit Request'}
          </button>
        </div>
      </div>
    </form>
  );
}

export default MetadataRequestForm;

