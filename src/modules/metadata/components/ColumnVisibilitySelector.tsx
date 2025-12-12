// ============================================================================
// COLUMN VISIBILITY SELECTOR
// Set-based visibility control (parent manages state)
// ============================================================================
// PATTERN: Uses Set<string> for visible keys
// - Parent component controls visibility state
// - More explicit control vs ColumnVisibilityMenu (modifies column.visible)
// ============================================================================

import React, { useState, useRef, useEffect } from 'react'
import { Settings2, Check, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ColumnDef } from './SuperTableHeader'

interface ColumnVisibilitySelectorProps<T> {
  allColumns: ColumnDef<T>[]
  visibleKeys: Set<string>
  onChange: (newVisibleKeys: Set<string>) => void
  className?: string
}

export const ColumnVisibilitySelector = <T,>({
  allColumns,
  visibleKeys,
  onChange,
  className,
}: ColumnVisibilitySelectorProps<T>) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleColumn = (key: string) => {
    const newSet = new Set(visibleKeys)
    if (newSet.has(key)) {
      // Prevent hiding all columns
      if (newSet.size > 1) {
        newSet.delete(key)
      }
    } else {
      newSet.add(key)
    }
    onChange(newSet)
  }

  const showAll = () => {
    onChange(new Set(allColumns.map((col) => String(col.key))))
  }

  const hideAll = () => {
    // Keep at least the first column visible
    const firstKey = String(allColumns[0]?.key)
    onChange(new Set([firstKey]))
  }

  const visibleCount = visibleKeys.size
  const totalCount = allColumns.length

  return (
    <div className={cn('relative', className)} ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2',
          'rounded border bg-[#111]',
          'font-mono text-[11px] uppercase tracking-wider',
          'transition-all duration-200',
          isOpen
            ? 'border-[#28E7A2] bg-[#28E7A2]/10 text-[#28E7A2]'
            : 'border-[#222] text-[#888] hover:border-[#333] hover:text-[#AAA]'
        )}
      >
        <Settings2 className="h-4 w-4" />
        <span className="hidden sm:inline">Columns</span>
        <span
          className={cn(
            'rounded px-1.5 py-0.5 text-[10px]',
            visibleCount === totalCount
              ? 'bg-[#28E7A2]/20 text-[#28E7A2]'
              : 'bg-[#333] text-[#888]'
          )}
        >
          {visibleCount}/{totalCount}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute right-0 top-full mt-2 w-56',
            'rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] shadow-2xl',
            'z-50 overflow-hidden',
            'duration-150 animate-in fade-in slide-in-from-top-2'
          )}
        >
          {/* Header */}
          <div className="border-b border-[#1F1F1F] bg-[#111] px-3 py-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
              Toggle Visibility
            </span>
          </div>

          {/* Column List */}
          <div className="max-h-64 overflow-y-auto p-1">
            {allColumns.map((col) => {
              const key = String(col.key)
              const isVisible = visibleKeys.has(key)
              const isOnlyVisible = isVisible && visibleKeys.size === 1

              return (
                <label
                  key={key}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded px-3 py-2',
                    'group transition-colors',
                    isVisible
                      ? 'hover:bg-[#28E7A2]/10'
                      : 'opacity-60 hover:bg-[#1A1A1A]',
                    isOnlyVisible && 'cursor-not-allowed'
                  )}
                >
                  {/* Custom Checkbox */}
                  <div
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded border',
                      'transition-all duration-200',
                      isVisible
                        ? 'border-[#28E7A2] bg-[#28E7A2]'
                        : 'border-[#333] bg-transparent group-hover:border-[#666]'
                    )}
                  >
                    {isVisible && <Check className="h-3 w-3 text-black" />}
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
                    <Eye className="h-3.5 w-3.5 text-[#28E7A2]" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5 text-[#444]" />
                  )}

                  {/* Label */}
                  <span
                    className={cn(
                      'flex-1 font-mono text-xs',
                      isVisible ? 'text-white' : 'text-[#666]'
                    )}
                  >
                    {col.header}
                  </span>
                </label>
              )
            })}
          </div>

          {/* Footer Actions */}
          <div className="flex gap-2 border-t border-[#1F1F1F] bg-[#111] px-3 py-2">
            <button
              onClick={showAll}
              disabled={visibleCount === totalCount}
              className={cn(
                'flex-1 rounded px-2 py-1.5 font-mono text-[10px] uppercase',
                'border transition-colors',
                visibleCount === totalCount
                  ? 'cursor-not-allowed border-[#222] text-[#444]'
                  : 'border-[#222] text-[#888] hover:border-[#28E7A2]/30 hover:text-[#28E7A2]'
              )}
            >
              Show All
            </button>
            <button
              onClick={hideAll}
              disabled={visibleCount === 1}
              className={cn(
                'flex-1 rounded px-2 py-1.5 font-mono text-[10px] uppercase',
                'border transition-colors',
                visibleCount === 1
                  ? 'cursor-not-allowed border-[#222] text-[#444]'
                  : 'border-[#222] text-[#888] hover:border-[#FF6B6B]/30 hover:text-[#FF6B6B]'
              )}
            >
              Hide All
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ColumnVisibilitySelector
