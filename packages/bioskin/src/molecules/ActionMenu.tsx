/**
 * ActionMenu - Dropdown action menu
 * 
 * Layer 2 (molecules) per CONT_10 BioSkin Architecture
 */

'use client';

import * as React from 'react';
import { cn } from '../atoms/utils';
import { Btn } from '../atoms/Btn';
import { Txt } from '../atoms/Txt';
import { MoreHorizontal, type LucideIcon } from 'lucide-react';

export interface ActionMenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

export interface ActionMenuProps {
  items: ActionMenuItem[];
  trigger?: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function ActionMenu({
  items,
  trigger,
  align = 'right',
  className,
}: ActionMenuProps) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Close on escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  return (
    <div ref={menuRef} className={cn('relative inline-block', className)}>
      {/* Trigger */}
      <div onClick={() => setOpen(!open)}>
        {trigger || (
          <Btn variant="ghost" size="sm" aria-label="Open menu">
            <MoreHorizontal className="w-4 h-4" />
          </Btn>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-50 mt-1 min-w-[160px]',
            'bg-surface-card border border-default rounded-lg shadow-lg',
            'py-1',
            'animate-in fade-in-0 zoom-in-95',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-2 text-left',
                  'transition-colors',
                  'focus:outline-none focus:bg-surface-hover',
                  item.disabled && 'opacity-50 cursor-not-allowed',
                  item.variant === 'danger'
                    ? 'text-status-danger hover:bg-status-danger/10'
                    : 'text-text-primary hover:bg-surface-hover'
                )}
              >
                {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
                <Txt variant="small">{item.label}</Txt>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

ActionMenu.displayName = 'ActionMenu';

export const COMPONENT_META = {
  code: 'BIOSKIN_ActionMenu',
  version: '1.0.0',
  layer: 'molecules',
  family: 'NAVIGATION',
  status: 'stable',
} as const;
