// ============================================================================
// COLUMN VISIBILITY SELECTOR
// Set-based visibility control (parent manages state)
// ============================================================================
// PATTERN: Uses Set<string> for visible keys
// - Parent component controls visibility state
// - More explicit control vs ColumnVisibilityMenu (modifies column.visible)
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { Settings2, Check, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ColumnDef } from './SuperTableHeader';

interface ColumnVisibilitySelectorProps<T> {
  allColumns: ColumnDef<T>[];
  visibleKeys: Set<string>;
  onChange: (newVisibleKeys: Set<string>) => void;
  className?: string;
}

export const ColumnVisibilitySelector = <T,>({ 
  allColumns, 
  visibleKeys, 
  onChange,
  className,
}: ColumnVisibilitySelectorProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleColumn = (key: string) => {
    const newSet = new Set(visibleKeys);
    if (newSet.has(key)) {
      // Prevent hiding all columns
      if (newSet.size > 1) {
        newSet.delete(key);
      }
    } else {
      newSet.add(key);
    }
    onChange(newSet);
  };

  const showAll = () => {
    onChange(new Set(allColumns.map(col => String(col.key))));
  };

  const hideAll = () => {
    // Keep at least the first column visible
    const firstKey = String(allColumns[0]?.key);
    onChange(new Set([firstKey]));
  };

  const visibleCount = visibleKeys.size;
  const totalCount = allColumns.length;

  return (
    <div className={cn("relative", className)} ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2",
          "bg-[#111] border rounded",
          "text-[11px] font-mono uppercase tracking-wider",
          "transition-all duration-200",
          isOpen 
            ? "border-[#28E7A2] text-[#28E7A2] bg-[#28E7A2]/10" 
            : "border-[#222] text-[#888] hover:border-[#333] hover:text-[#AAA]"
        )}
      >
        <Settings2 className="w-4 h-4" />
        <span className="hidden sm:inline">Columns</span>
        <span className={cn(
          "px-1.5 py-0.5 rounded text-[10px]",
          visibleCount === totalCount 
            ? "bg-[#28E7A2]/20 text-[#28E7A2]" 
            : "bg-[#333] text-[#888]"
        )}>
          {visibleCount}/{totalCount}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={cn(
          "absolute right-0 top-full mt-2 w-56",
          "bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg shadow-2xl",
          "z-50 overflow-hidden",
          "animate-in fade-in slide-in-from-top-2 duration-150"
        )}>
          {/* Header */}
          <div className="px-3 py-2 border-b border-[#1F1F1F] bg-[#111]">
            <span className="text-[10px] font-mono text-[#666] uppercase tracking-wider">
              Toggle Visibility
            </span>
          </div>

          {/* Column List */}
          <div className="max-h-64 overflow-y-auto p-1">
            {allColumns.map((col) => {
              const key = String(col.key);
              const isVisible = visibleKeys.has(key);
              const isOnlyVisible = isVisible && visibleKeys.size === 1;
              
              return (
                <label 
                  key={key} 
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded cursor-pointer",
                    "transition-colors group",
                    isVisible 
                      ? "hover:bg-[#28E7A2]/10" 
                      : "hover:bg-[#1A1A1A] opacity-60",
                    isOnlyVisible && "cursor-not-allowed"
                  )}
                >
                  {/* Custom Checkbox */}
                  <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center",
                    "transition-all duration-200",
                    isVisible 
                      ? "bg-[#28E7A2] border-[#28E7A2]" 
                      : "bg-transparent border-[#333] group-hover:border-[#666]"
                  )}>
                    {isVisible && <Check className="w-3 h-3 text-black" />}
                  </div>
                  
                  {/* Hidden native checkbox */}
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={isVisible}
                    disabled={isOnlyVisible}
                    onChange={() => toggleColumn(key)}
                  />

                  {/* Icon */}
                  {isVisible ? (
                    <Eye className="w-3.5 h-3.5 text-[#28E7A2]" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-[#444]" />
                  )}

                  {/* Label */}
                  <span className={cn(
                    "text-xs font-mono flex-1",
                    isVisible ? "text-white" : "text-[#666]"
                  )}>
                    {col.header}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="px-3 py-2 border-t border-[#1F1F1F] bg-[#111] flex gap-2">
            <button
              onClick={showAll}
              disabled={visibleCount === totalCount}
              className={cn(
                "flex-1 px-2 py-1.5 text-[10px] font-mono uppercase rounded",
                "border transition-colors",
                visibleCount === totalCount
                  ? "border-[#222] text-[#444] cursor-not-allowed"
                  : "border-[#222] text-[#888] hover:text-[#28E7A2] hover:border-[#28E7A2]/30"
              )}
            >
              Show All
            </button>
            <button
              onClick={hideAll}
              disabled={visibleCount === 1}
              className={cn(
                "flex-1 px-2 py-1.5 text-[10px] font-mono uppercase rounded",
                "border transition-colors",
                visibleCount === 1
                  ? "border-[#222] text-[#444] cursor-not-allowed"
                  : "border-[#222] text-[#888] hover:text-[#FF6B6B] hover:border-[#FF6B6B]/30"
              )}
            >
              Hide All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnVisibilitySelector;

