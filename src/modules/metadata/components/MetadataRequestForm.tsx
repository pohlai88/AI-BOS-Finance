// ============================================================================
// METADATA REQUEST FORM
// Governance-first metadata creation/edit workflow
// ============================================================================
// PHILOSOPHY: Users don't "edit" the kernel - they "Request Changes"
// Registry (Read) → Request (Write) → Approval (Governance)
// ============================================================================

import React, { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MetadataType } from '@/kernel'

// ============================================================================
// TYPES
// ============================================================================

interface MetadataRequestData {
  business_term: string
  technical_name: string
  domain: string
  data_type: MetadataType
  is_critical: boolean
  description: string
  justification: string
}

interface MetadataRequestFormProps {
  initialData?: Partial<MetadataRequestData>
  onCancel: () => void
  onSubmit: (data: MetadataRequestData) => void
  isEditMode?: boolean
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
]

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
]

// ============================================================================
// COMPONENT
// ============================================================================

export function MetadataRequestForm({
  initialData,
  onCancel,
  onSubmit,
  isEditMode = false,
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
  })

  const [errors, setErrors] = useState<
    Partial<Record<keyof MetadataRequestData, string>>
  >({})

  // === AUTO-GENERATE TECHNICAL NAME ===
  useEffect(() => {
    if (!isEditMode && formData.business_term) {
      const slug = formData.business_term
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50)

      setFormData((prev) => ({ ...prev, technical_name: slug }))
    }
  }, [formData.business_term, isEditMode])

  // === VALIDATION ===
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof MetadataRequestData, string>> = {}

    if (!formData.business_term.trim()) {
      newErrors.business_term = 'Business term is required'
    }

    if (!formData.technical_name.trim()) {
      newErrors.technical_name = 'Technical name is required'
    } else if (!/^[a-z][a-z0-9_]*$/.test(formData.technical_name)) {
      newErrors.technical_name =
        'Must be snake_case (lowercase, underscores only)'
    }

    if (!formData.justification.trim()) {
      newErrors.justification = 'Governance justification is required'
    } else if (formData.justification.length < 20) {
      newErrors.justification = 'Please provide more detail (min 20 characters)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // === HANDLERS ===
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  const updateField = <K extends keyof MetadataRequestData>(
    field: K,
    value: MetadataRequestData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  // === RENDER ===
  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col bg-[#050505]">
      {/* ================================================================ */}
      {/* HEADER */}
      {/* ================================================================ */}
      <div className="flex items-center justify-between border-b border-[#1F1F1F] bg-[#0A0A0A] px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              isEditMode
                ? 'border border-blue-800 bg-blue-900/30'
                : 'border border-[#28E7A2]/30 bg-[#28E7A2]/10'
            )}
          >
            {isEditMode ? (
              <FileText className="h-5 w-5 text-blue-400" />
            ) : (
              <Database className="h-5 w-5 text-[#28E7A2]" />
            )}
          </div>
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              {isEditMode ? 'Edit Definition' : 'New Metadata Request'}
              {formData.is_critical && (
                <ShieldAlert className="h-4 w-4 text-[#FFD600]" />
              )}
            </h2>
            <p className="font-mono text-[11px] text-[#666]">
              {isEditMode
                ? 'Modify existing schema contract'
                : 'Propose a new field for the Global Registry'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-2 text-[#666] transition-colors hover:bg-[#1F1F1F] hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* ================================================================ */}
      {/* FORM BODY */}
      {/* ================================================================ */}
      <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-6">
        {/* SECTION 1: Identity */}
        <section className="space-y-4">
          <div className="mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-[#28E7A2]" />
            <h3 className="font-mono text-[11px] uppercase tracking-wider text-[#888]">
              Identity
            </h3>
          </div>

          {/* Business Term */}
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-[#666]">
              Business Term *
            </label>
            <input
              type="text"
              placeholder="e.g. Total Revenue Amount"
              className={cn(
                'w-full rounded-lg border bg-[#111] px-4 py-2.5 text-white',
                'outline-none focus:border-[#28E7A2] focus:ring-1 focus:ring-[#28E7A2]',
                'font-mono text-sm placeholder-[#444] transition-all',
                errors.business_term ? 'border-[#FF4D4D]' : 'border-[#222]'
              )}
              value={formData.business_term}
              onChange={(e) => updateField('business_term', e.target.value)}
              autoFocus
            />
            {errors.business_term && (
              <p className="mt-1 text-[10px] text-[#FF4D4D]">
                {errors.business_term}
              </p>
            )}
          </div>

          {/* Technical Name + Domain */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block flex justify-between font-mono text-[10px] uppercase tracking-wider text-[#666]">
                Technical Name
                <span className="lowercase text-[#444]">snake_case</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="font-mono text-xs text-[#444]">db.</span>
                </div>
                <input
                  type="text"
                  readOnly={!isEditMode}
                  className={cn(
                    'w-full rounded-lg border bg-[#0A0A0A] py-2.5 pl-9 pr-4',
                    'font-mono text-xs text-[#28E7A2] outline-none',
                    !isEditMode && 'cursor-not-allowed opacity-80',
                    errors.technical_name ? 'border-[#FF4D4D]' : 'border-[#222]'
                  )}
                  value={formData.technical_name}
                  onChange={(e) =>
                    updateField('technical_name', e.target.value)
                  }
                />
              </div>
              {errors.technical_name && (
                <p className="mt-1 text-[10px] text-[#FF4D4D]">
                  {errors.technical_name}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-[#666]">
                Domain Owner
              </label>
              <select
                className={cn(
                  'w-full rounded-lg border border-[#222] bg-[#111] px-3 py-2.5',
                  'text-white outline-none focus:ring-1 focus:ring-[#28E7A2]',
                  'cursor-pointer appearance-none font-mono text-sm'
                )}
                value={formData.domain}
                onChange={(e) => updateField('domain', e.target.value)}
              >
                {DOMAINS.map((d) => (
                  <option key={d} value={d} className="bg-[#111]">
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-[#666]">
              Description
            </label>
            <textarea
              placeholder="Brief explanation of what this metadata represents..."
              className={cn(
                'w-full rounded-lg border border-[#222] bg-[#111] px-4 py-2.5',
                'text-white outline-none focus:ring-1 focus:ring-[#28E7A2]',
                'min-h-[60px] resize-none font-mono text-sm placeholder-[#444] transition-all'
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
              <Type className="h-4 w-4 text-[#28E7A2]" />
              <h3 className="font-mono text-[11px] uppercase tracking-wider text-[#888]">
                Schema Configuration
              </h3>
            </div>

            {/* Critical Toggle */}
            <label className="group flex cursor-pointer items-center gap-3">
              <span className="font-mono text-[10px] uppercase text-[#666] transition-colors group-hover:text-[#888]">
                Critical?
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={formData.is_critical}
                  onChange={(e) => updateField('is_critical', e.target.checked)}
                />
                <div
                  className={cn(
                    'h-5 w-10 rounded-full transition-colors',
                    'bg-[#222] peer-checked:bg-[#FFD600]',
                    "after:absolute after:left-0.5 after:top-0.5 after:content-['']",
                    'after:h-4 after:w-4 after:rounded-full after:bg-white',
                    'after:transition-all peer-checked:after:translate-x-5'
                  )}
                />
              </div>
            </label>
          </div>

          {/* Data Type Grid */}
          <div className="grid grid-cols-3 gap-2">
            {DATA_TYPES.map((type) => (
              <label
                key={type.value}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-all',
                  formData.data_type === type.value
                    ? 'border-[#28E7A2] bg-[#28E7A2]/10 text-white'
                    : 'border-[#222] bg-[#0A0A0A] text-[#666] hover:border-[#333] hover:bg-[#111]'
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
                <span className="font-mono text-xs">{type.label}</span>
              </label>
            ))}
          </div>
        </section>

        <hr className="border-[#1F1F1F]" />

        {/* SECTION 3: Governance Justification */}
        <section className="rounded-lg border border-blue-900/30 bg-blue-900/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-medium text-blue-200">
                Governance Justification *
              </h4>
              <p className="text-[10px] text-blue-300/70">
                Every schema change requires documented reasoning for the
                Governance Council.
              </p>
              <textarea
                placeholder="Why do we need this field? Who is the downstream consumer? What business process does it support?"
                className={cn(
                  'w-full rounded-lg border bg-[#050505] p-3',
                  'text-sm text-[#CCC] focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
                  'min-h-[100px] resize-none font-mono outline-none',
                  errors.justification
                    ? 'border-[#FF4D4D]'
                    : 'border-blue-900/30'
                )}
                value={formData.justification}
                onChange={(e) => updateField('justification', e.target.value)}
              />
              {errors.justification && (
                <p className="text-[10px] text-[#FF4D4D]">
                  {errors.justification}
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ================================================================ */}
      {/* FOOTER ACTIONS */}
      {/* ================================================================ */}
      <div className="flex items-center justify-between border-t border-[#1F1F1F] bg-[#0A0A0A] p-4">
        <p className="font-mono text-[10px] text-[#444]">
          * Required for governance approval
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 font-mono text-sm text-[#666] transition-colors hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={cn(
              'flex items-center gap-2 px-5 py-2',
              'bg-[#28E7A2] text-black hover:bg-[#28E7A2]/80',
              'rounded-lg font-mono text-sm font-bold transition-all',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            <Send className="h-4 w-4" />
            {isEditMode ? 'Update' : 'Submit Request'}
          </button>
        </div>
      </div>
    </form>
  )
}

export default MetadataRequestForm
