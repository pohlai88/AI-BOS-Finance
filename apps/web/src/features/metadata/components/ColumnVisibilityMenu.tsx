// ============================================================================
// COLUMN VISIBILITY MENU
// Dropdown panel for toggling column visibility
// ============================================================================
// USAGE: Place this in the TableToolbar, not inside the header
// PATTERN: Uses CSS-only hover dropdown - upgrade to Radix UI for production
// ============================================================================

import React from 'react';
import { Settings2, Eye, EyeOff, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ColumnDef } from './SuperTableHeader';

interface ColumnVisibilityMenuProps<T> {
  columns: ColumnDef<T>[];
  onToggle: (key: string) => void;
  className?: string;
}

export const ColumnVisibilityMenu = <T,>({ 
  columns, 
  onToggle,
  className 
}: ColumnVisibilityMenuProps<T>) => {
  const visibleCount = columns.filter(col => col.visible !== false).length;
  const totalCount = columns.length;

  return (
    <div className={cn("relative group", className)}>
      {/* Trigger Button */}
      <button 
        className={cn(
          "flex items-center gap-2 px-3 py-2",
          "bg-[#111] border border-[#222] rounded",
          "text-[11px] font-mono text-[#888] uppercase tracking-wider",
          "hover:bg-[#1A1A1A] hover:border-[#333] hover:text-[#AAA]",
          "transition-all duration-200"
        )}
      >
        <Settings2 className="w-4 h-4" />
        <span className="hidden sm:inline">Columns</span>
        <span className="text-[#28E7A2]">{visibleCount}/{totalCount}</span>
      </button>
       
      {/* Dropdown Panel - CSS-only hover (prefer Radix UI for production) */}
      <div className={cn(
        "absolute right-0 top-full mt-1 w-56",
        "bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg shadow-xl",
        "hidden group-hover:block z-50",
        "before:absolute before:-top-2 before:right-4 before:w-3 before:h-3",
        "before:bg-[#0A0A0A] before:border-l before:border-t before:border-[#1F1F1F]",
        "before:rotate-45 before:z-[-1]"
      )}>
        {/* Header */}
        <div className="px-3 py-2 border-b border-[#1F1F1F]">
          <span className="text-[10px] font-mono text-[#666] uppercase tracking-wider">
            Toggle Columns
          </span>
        </div>

        {/* Column List */}
        <div className="max-h-64 overflow-y-auto py-1">
          {columns.map(col => {
            const colKey = String(col.key);
            const isVisible = col.visible !== false;

            return (
              <label 
                key={colKey} 
                className={cn(
                  "flex items-center gap-3 px-3 py-2 cursor-pointer",
                  "hover:bg-[#111] transition-colors",
                  !isVisible && "opacity-50"
                )}
              >
                {/* Custom Checkbox */}
                <div className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center",
                  "transition-colors",
                  isVisible 
                    ? "bg-[#28E7A2] border-[#28E7A2]" 
                    : "bg-transparent border-[#333]"
                )}>
                  {isVisible && <Check className="w-3 h-3 text-black" />}
                </div>

                {/* Icon */}
                {isVisible ? (
                  <Eye className="w-3.5 h-3.5 text-[#28E7A2]" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-[#444]" />
                )}

                {/* Label */}
                <span className={cn(
                  "text-xs font-mono",
                  isVisible ? "text-white" : "text-[#666]"
                )}>
                  {col.header}
                </span>

                {/* Hidden Actual Checkbox */}
                <input 
                  type="checkbox" 
                  checked={isVisible} 
                  onChange={() => onToggle(colKey)}
                  className="sr-only"
                />
              </label>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="px-3 py-2 border-t border-[#1F1F1F] flex gap-2">
          <button
            className={cn(
              "flex-1 px-2 py-1.5 text-[10px] font-mono uppercase",
              "bg-[#111] border border-[#222] rounded",
              "text-[#666] hover:text-[#28E7A2] hover:border-[#28E7A2]/30",
              "transition-colors"
            )}
            onClick={() => columns.forEach(col => {
              if (col.visible === false) onToggle(String(col.key));
            })}
          >
            Show All
          </button>
          <button
            className={cn(
              "flex-1 px-2 py-1.5 text-[10px] font-mono uppercase",
              "bg-[#111] border border-[#222] rounded",
              "text-[#666] hover:text-[#FF6B6B] hover:border-[#FF6B6B]/30",
              "transition-colors"
            )}
            onClick={() => columns.forEach(col => {
              if (col.visible !== false) onToggle(String(col.key));
            })}
          >
            Hide All
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColumnVisibilityMenu;

