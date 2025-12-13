// ============================================================================
// COLUMN VISIBILITY MENU
// Dropdown panel for toggling column visibility
// ============================================================================
// USAGE: Place this in the TableToolbar, not inside the header
// PATTERN: Uses CSS-only hover dropdown - upgrade to Radix UI for production
// ============================================================================

import React from 'react'
import { Settings2, Eye, EyeOff, Check } from 'lucide-react'
import { cn } from '@aibos/ui'
import type { ColumnDef } from './SuperTableHeader'

interface ColumnVisibilityMenuProps<T> {
  columns: ColumnDef<T>[]
  onToggle: (key: string) => void
  className?: string
}

export const ColumnVisibilityMenu = <T,>({
  columns,
  onToggle,
  className,
}: ColumnVisibilityMenuProps<T>) => {
  const visibleCount = columns.filter((col) => col.visible !== false).length
  const totalCount = columns.length

  return (
    <div className={cn('group relative', className)}>
      {/* Trigger Button */}
      <button
        className={cn(
          'flex items-center gap-2 px-3 py-2',
          'rounded border border-[#222] bg-[#111]',
          'font-mono text-[11px] uppercase tracking-wider text-[#888]',
          'hover:border-[#333] hover:bg-[#1A1A1A] hover:text-[#AAA]',
          'transition-all duration-200'
        )}
      >
        <Settings2 className="h-4 w-4" />
        <span className="hidden sm:inline">Columns</span>
        <span className="text-[#28E7A2]">
          {visibleCount}/{totalCount}
        </span>
      </button>

      {/* Dropdown Panel - CSS-only hover (prefer Radix UI for production) */}
      <div
        className={cn(
          'absolute right-0 top-full mt-1 w-56',
          'rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] shadow-xl',
          'z-50 hidden group-hover:block',
          'before:absolute before:-top-2 before:right-4 before:h-3 before:w-3',
          'before:border-l before:border-t before:border-[#1F1F1F] before:bg-[#0A0A0A]',
          'before:z-[-1] before:rotate-45'
        )}
      >
        {/* Header */}
        <div className="border-b border-[#1F1F1F] px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
            Toggle Columns
          </span>
        </div>

        {/* Column List */}
        <div className="max-h-64 overflow-y-auto py-1">
          {columns.map((col) => {
            const colKey = String(col.key)
            const isVisible = col.visible !== false

            return (
              <label
                key={colKey}
                className={cn(
                  'flex cursor-pointer items-center gap-3 px-3 py-2',
                  'transition-colors hover:bg-[#111]',
                  !isVisible && 'opacity-50'
                )}
              >
                {/* Custom Checkbox */}
                <div
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded border',
                    'transition-colors',
                    isVisible
                      ? 'border-[#28E7A2] bg-[#28E7A2]'
                      : 'border-[#333] bg-transparent'
                  )}
                >
                  {isVisible && <Check className="h-3 w-3 text-black" />}
                </div>

                {/* Icon */}
                {isVisible ? (
                  <Eye className="h-3.5 w-3.5 text-[#28E7A2]" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 text-[#444]" />
                )}

                {/* Label */}
                <span
                  className={cn(
                    'font-mono text-xs',
                    isVisible ? 'text-white' : 'text-[#666]'
                  )}
                >
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
            )
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 border-t border-[#1F1F1F] px-3 py-2">
          <button
            className={cn(
              'flex-1 px-2 py-1.5 font-mono text-[10px] uppercase',
              'rounded border border-[#222] bg-[#111]',
              'text-[#666] hover:border-[#28E7A2]/30 hover:text-[#28E7A2]',
              'transition-colors'
            )}
            onClick={() =>
              columns.forEach((col) => {
                if (col.visible === false) onToggle(String(col.key))
              })
            }
          >
            Show All
          </button>
          <button
            className={cn(
              'flex-1 px-2 py-1.5 font-mono text-[10px] uppercase',
              'rounded border border-[#222] bg-[#111]',
              'text-[#666] hover:border-[#FF6B6B]/30 hover:text-[#FF6B6B]',
              'transition-colors'
            )}
            onClick={() =>
              columns.forEach((col) => {
                if (col.visible !== false) onToggle(String(col.key))
              })
            }
          >
            Hide All
          </button>
        </div>
      </div>
    </div>
  )
}

export default ColumnVisibilityMenu
