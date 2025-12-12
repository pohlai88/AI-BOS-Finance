import { useState, useRef, useEffect } from 'react';
import { Plus, X, Filter, ChevronDown, Check } from 'lucide-react';
import clsx from 'clsx';
import { MetadataRecord } from '../../types/metadata';

// --- TYPES ---

interface FilterDimension {
  id: string;
  field: {
    key: keyof MetadataRecord;
    label: string;
    type: 'select' | 'text' | 'multi';
  };
  selectedValues: string[];
}

interface FlexibleFilterBarProps {
  data: MetadataRecord[];
  activeDimensions: FilterDimension[];
  onDimensionsChange: (dims: FilterDimension[]) => void;
  onClearAll: () => void;
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
];

// --- SUB-COMPONENT: FILTER PILL ---

const FilterPill = ({
  dimension,
  data,
  onRemove,
  onUpdate,
}: {
  dimension: FilterDimension;
  data: MetadataRecord[];
  onRemove: () => void;
  onUpdate: (values: string[]) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate unique values dynamically
  const uniqueValues = Array.from(
    new Set(
      data
        .map((item) => {
          const value = item[dimension.field.key];
          if (Array.isArray(value)) {
            return value.join(', ');
          }
          return String(value);
        })
        .filter(Boolean),
    ),
  ).sort();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleValue = (val: string) => {
    const current = dimension.selectedValues;
    const next = current.includes(val) ? current.filter((v) => v !== val) : [...current, val];
    onUpdate(next);
  };

  return (
    <div className="relative group" ref={containerRef}>
      <div className="flex items-center bg-[#111] border border-[#333] rounded overflow-hidden h-9">
        {/* Label Section - Sans-serif for business terms */}
        <div className="px-3 h-full flex items-center bg-[#1A1A1A] border-r border-[#333] text-[#888] uppercase tracking-wide text-[11px] font-medium">
          {dimension.field.label}
        </div>

        {/* Value Section */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 h-full flex items-center gap-2 text-[#CCC] hover:text-white hover:bg-[#1A1A1A] transition-colors min-w-[120px]"
        >
          <span className="truncate max-w-[150px] text-[12px]">
            {dimension.selectedValues.length === 0
              ? 'Any'
              : dimension.selectedValues.length === 1
                ? dimension.selectedValues[0]
                : `${dimension.selectedValues.length} selected`}
          </span>
          <ChevronDown className="w-3 h-3 text-[#666] flex-shrink-0 ml-auto" />
        </button>

        {/* Remove Button */}
        <button
          onClick={onRemove}
          className="h-full px-2 hover:bg-[#2F1515] hover:text-red-400 text-[#666] border-l border-[#333] transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-[#0A0A0A] border border-[#333] rounded shadow-2xl z-50 overflow-hidden ring-1 ring-black/50">
          <div className="max-h-64 overflow-y-auto custom-scrollbar p-1">
            {uniqueValues.length === 0 ? (
              <div className="px-3 py-4 text-center text-[#444] text-[11px]">
                No values available
              </div>
            ) : (
              uniqueValues.map((val) => {
                const isSelected = dimension.selectedValues.includes(val);
                return (
                  <div
                    key={val}
                    onClick={() => toggleValue(val)}
                    className={clsx(
                      'flex items-center justify-between px-3 py-2 cursor-pointer rounded hover:bg-[#1A1A1A] transition-colors text-[12px]',
                      isSelected ? 'text-[#28E7A2]' : 'text-[#888]',
                    )}
                  >
                    <span className="truncate">{val}</span>
                    {isSelected && <Check className="w-3 h-3 flex-shrink-0 ml-2" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---

export function FlexibleFilterBar({
  data,
  activeDimensions,
  onDimensionsChange,
  onClearAll,
}: FlexibleFilterBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddDimension = (key: keyof MetadataRecord, label: string) => {
    // Check if already active to prevent duplicates
    if (activeDimensions.some((dim) => dim.field.key === key)) {
      setIsMenuOpen(false);
      return;
    }

    const newDim: FilterDimension = {
      id: Math.random().toString(36).substr(2, 9),
      field: { key, label, type: 'select' },
      selectedValues: [],
    };
    onDimensionsChange([...activeDimensions, newDim]);
    setIsMenuOpen(false);
  };

  const handleRemoveDimension = (id: string) => {
    onDimensionsChange(activeDimensions.filter((d) => d.id !== id));
  };

  const handleUpdateDimension = (id: string, newValues: string[]) => {
    onDimensionsChange(
      activeDimensions.map((d) => (d.id === id ? { ...d, selectedValues: newValues } : d)),
    );
  };

  // Get available options (exclude already active ones)
  const availableOptions = FILTER_OPTIONS.filter(
    (opt) => !activeDimensions.some((dim) => dim.field.key === opt.key),
  );

  return (
    <div className="border border-[#1F1F1F] rounded-lg bg-[#050505]/50 h-full flex flex-col">
      {/* UNIFIED HEADER ROW */}
      <div className="px-4 py-3 flex items-center justify-between gap-4 border-b border-[#1F1F1F]">
        {/* LEFT: Label */}
        <span className="text-[#444] tracking-wider uppercase text-[11px] font-medium">
          Multi-dimensional Filters
        </span>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-3">
          {activeDimensions.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-[11px] text-[#666] hover:text-[#FF4D4D] transition-colors hover:underline decoration-dotted"
            >
              Clear all
            </button>
          )}

          {/* Add Filter Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              disabled={availableOptions.length === 0}
              className="flex items-center gap-2 px-3 h-8 bg-[#0A0A0A] border border-[#1F1F1F] rounded text-[#28E7A2] hover:bg-[#28E7A2]/10 hover:border-[#28E7A2] transition-colors disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap text-[11px] font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ADD FILTER</span>
            </button>

            {/* Add Filter Dropdown */}
            {isMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-[#0A0A0A] border border-[#333] rounded shadow-2xl z-50">
                <div className="px-3 py-2 border-b border-[#1F1F1F] uppercase text-[#666] tracking-wider text-[10px] font-medium">
                  Select Dimension
                </div>
                <div className="p-1 max-h-64 overflow-y-auto custom-scrollbar">
                  {availableOptions.length === 0 ? (
                    <div className="px-3 py-4 text-center text-[#444] text-[11px]">
                      All filters active
                    </div>
                  ) : (
                    availableOptions.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => handleAddDimension(opt.key, opt.label)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left text-[#CCC] hover:bg-[#1A1A1A] rounded transition-colors text-[12px] group"
                      >
                        <Filter className="w-3 h-3 text-[#666] group-hover:text-[#28E7A2]" />
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
      <div className="px-4 py-3 flex flex-wrap items-center gap-2 min-h-[64px] flex-1">
        {activeDimensions.length === 0 ? (
          <div className="w-full flex items-center justify-center text-[#333] h-full">
            <span className="text-[11px] uppercase tracking-wider">No filters active</span>
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
  );
}
