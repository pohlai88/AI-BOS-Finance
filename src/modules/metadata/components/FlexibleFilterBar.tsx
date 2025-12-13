import { useState, useRef, useEffect } from 'react'
import { Plus, X, Filter, ChevronDown, Check } from 'lucide-react'
import clsx from 'clsx'
import { MetadataRecord } from '@/modules/metadata/types/metadata'

// --- TYPES ---

interface FilterDimension {
  id: string
  field: {
    key: keyof MetadataRecord
    label: string
    type: 'select' | 'text' | 'multi'
  }
  selectedValues: string[]
}

interface FlexibleFilterBarProps {
  data: MetadataRecord[]
  activeDimensions: FilterDimension[]
  onDimensionsChange: (dims: FilterDimension[]) => void
  onClearAll: () => void
}

// Configuration based on your Metadata Registry needs
const FILTER_OPTIONS: { key: keyof MetadataRecord; label: string }[] = [
  { key: 'canon_status', label: 'Status' },
  { key: 'data_owner', label: 'Owner' },
  { key: 'domain', label: 'Domain' },
  { key: 'data_type_tech', label: 'Type' },
  { key: 'criticality', label: 'Criticality' },
  { key: 'entity_group', label: 'Entity Group' },
  { key: 'data_steward', label: 'Data Steward' },
  { key: 'classification', label: 'Classification' },
  { key: 'data_type_biz', label: 'Business Type' },
  { key: 'source_of_truth', label: 'Source of Truth' },
]

// --- SUB-COMPONENT: FILTER PILL ---

const FilterPill = ({
  dimension,
  data,
  onRemove,
  onUpdate,
}: {
  dimension: FilterDimension
  data: MetadataRecord[]
  onRemove: () => void
  onUpdate: (values: string[]) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate unique values dynamically
  const uniqueValues = Array.from(
    new Set(
      data
        .map((item) => {
          const value = item[dimension.field.key]
          if (Array.isArray(value)) {
            return value.join(', ')
          }
          return String(value)
        })
        .filter(Boolean)
    )
  ).sort()

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleValue = (val: string) => {
    const current = dimension.selectedValues
    const next = current.includes(val)
      ? current.filter((v) => v !== val)
      : [...current, val]
    onUpdate(next)
  }

  return (
    <div className="group relative" ref={containerRef}>
      <div className="flex h-9 items-center overflow-hidden rounded border border-[#333] bg-[#111]">
        {/* Label Section - Sans-serif for business terms */}
        <div className="flex h-full items-center border-r border-[#333] bg-[#1A1A1A] px-3 text-[11px] font-medium uppercase tracking-wide text-[#888]">
          {dimension.field.label}
        </div>

        {/* Value Section */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-full min-w-[120px] items-center gap-2 px-3 text-[#CCC] transition-colors hover:bg-[#1A1A1A] hover:text-white"
        >
          <span className="max-w-[150px] truncate text-[12px]">
            {dimension.selectedValues.length === 0
              ? 'Any'
              : dimension.selectedValues.length === 1
                ? dimension.selectedValues[0]
                : `${dimension.selectedValues.length} selected`}
          </span>
          <ChevronDown className="ml-auto h-3 w-3 flex-shrink-0 text-[#666]" />
        </button>

        {/* Remove Button */}
        <button
          onClick={onRemove}
          className="h-full border-l border-[#333] px-2 text-[#666] transition-colors hover:bg-[#2F1515] hover:text-red-400"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded border border-[#333] bg-[#0A0A0A] shadow-2xl ring-1 ring-black/50">
          <div className="custom-scrollbar max-h-64 overflow-y-auto p-1">
            {uniqueValues.length === 0 ? (
              <div className="px-3 py-4 text-center text-[11px] text-[#444]">
                No values available
              </div>
            ) : (
              uniqueValues.map((val) => {
                const isSelected = dimension.selectedValues.includes(val)
                return (
                  <div
                    key={val}
                    onClick={() => toggleValue(val)}
                    className={clsx(
                      'flex cursor-pointer items-center justify-between rounded px-3 py-2 text-[12px] transition-colors hover:bg-[#1A1A1A]',
                      isSelected ? 'text-[#28E7A2]' : 'text-[#888]'
                    )}
                  >
                    <span className="truncate">{val}</span>
                    {isSelected && (
                      <Check className="ml-2 h-3 w-3 flex-shrink-0" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// --- MAIN COMPONENT ---

export function FlexibleFilterBar({
  data,
  activeDimensions,
  onDimensionsChange,
  onClearAll,
}: FlexibleFilterBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAddDimension = (key: keyof MetadataRecord, label: string) => {
    // Check if already active to prevent duplicates
    if (activeDimensions.some((dim) => dim.field.key === key)) {
      setIsMenuOpen(false)
      return
    }

    const newDim: FilterDimension = {
      id: Math.random().toString(36).substr(2, 9),
      field: { key, label, type: 'select' },
      selectedValues: [],
    }
    onDimensionsChange([...activeDimensions, newDim])
    setIsMenuOpen(false)
  }

  const handleRemoveDimension = (id: string) => {
    onDimensionsChange(activeDimensions.filter((d) => d.id !== id))
  }

  const handleUpdateDimension = (id: string, newValues: string[]) => {
    onDimensionsChange(
      activeDimensions.map((d) =>
        d.id === id ? { ...d, selectedValues: newValues } : d
      )
    )
  }

  // Get available options (exclude already active ones)
  const availableOptions = FILTER_OPTIONS.filter(
    (opt) => !activeDimensions.some((dim) => dim.field.key === opt.key)
  )

  return (
    <div className="flex h-full flex-col rounded-lg border border-[#1F1F1F] bg-[#050505]/50">
      {/* UNIFIED HEADER ROW */}
      <div className="flex items-center justify-between gap-4 border-b border-[#1F1F1F] px-4 py-3">
        {/* LEFT: Label */}
        <span className="text-[11px] font-medium uppercase tracking-wider text-[#444]">
          Multi-dimensional Filters
        </span>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-3">
          {activeDimensions.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-[11px] text-[#666] decoration-dotted transition-colors hover:text-[#FF4D4D] hover:underline"
            >
              Clear all
            </button>
          )}

          {/* Add Filter Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              disabled={availableOptions.length === 0}
              className="flex h-8 items-center gap-2 whitespace-nowrap rounded border border-[#1F1F1F] bg-[#0A0A0A] px-3 text-[11px] font-medium text-[#28E7A2] transition-colors hover:border-[#28E7A2] hover:bg-[#28E7A2]/10 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>ADD FILTER</span>
            </button>

            {/* Add Filter Dropdown */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded border border-[#333] bg-[#0A0A0A] shadow-2xl">
                <div className="border-b border-[#1F1F1F] px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-[#666]">
                  Select Dimension
                </div>
                <div className="custom-scrollbar max-h-64 overflow-y-auto p-1">
                  {availableOptions.length === 0 ? (
                    <div className="px-3 py-4 text-center text-[11px] text-[#444]">
                      All filters active
                    </div>
                  ) : (
                    availableOptions.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => handleAddDimension(opt.key, opt.label)}
                        className="group flex w-full items-center gap-3 rounded px-3 py-2 text-left text-[12px] text-[#CCC] transition-colors hover:bg-[#1A1A1A]"
                      >
                        <Filter className="h-3 w-3 text-[#666] group-hover:text-[#28E7A2]" />
                        <span>{opt.label}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FILTER PILLS AREA */}
      <div className="flex min-h-[64px] flex-1 flex-wrap items-center gap-2 px-4 py-3">
        {activeDimensions.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center text-[#333]">
            <span className="text-[11px] uppercase tracking-wider">
              No filters active
            </span>
          </div>
        ) : (
          activeDimensions.map((dim) => (
            <FilterPill
              key={dim.id}
              dimension={dim}
              data={data}
              onRemove={() => handleRemoveDimension(dim.id)}
              onUpdate={(values) => handleUpdateDimension(dim.id, values)}
            />
          ))
        )}
      </div>
    </div>
  )
}
