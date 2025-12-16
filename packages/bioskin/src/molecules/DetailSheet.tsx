/**
 * DetailSheet - Side drawer for detail views
 * 
 * Layer 2 (molecules) per CONT_10 BioSkin Architecture
 * Opens from the right side with focus trap and escape handling.
 */

'use client';

import * as React from 'react';
import { cn } from '../atoms/utils';
import { Surface } from '../atoms/Surface';
import { Txt } from '../atoms/Txt';
import { Btn } from '../atoms/Btn';
import { X } from 'lucide-react';

export interface DetailSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const widthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function DetailSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 'md',
  className,
}: DetailSheetProps) {
  const sheetRef = React.useRef<HTMLDivElement>(null);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  // Focus trap
  React.useEffect(() => {
    if (open && sheetRef.current) {
      const focusableElements = sheetRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      firstElement?.focus();
    }
  }, [open]);

  // Prevent body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-sheet-title"
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full',
          widthClasses[width],
          'flex flex-col',
          'bg-background border-l border-default',
          'shadow-2xl',
          'animate-in slide-in-from-right duration-300',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-layout-md border-b border-default">
          <div>
            <Txt id="detail-sheet-title" variant="heading" weight="semibold">
              {title}
            </Txt>
            {subtitle && (
              <Txt variant="small" color="secondary" className="mt-1">
                {subtitle}
              </Txt>
            )}
          </div>
          <Btn
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close"
            className="flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Btn>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-layout-md">
          {children}
        </div>
      </div>
    </>
  );
}

DetailSheet.displayName = 'DetailSheet';

export const COMPONENT_META = {
  code: 'BIOSKIN_DetailSheet',
  version: '1.0.0',
  layer: 'molecules',
  family: 'OVERLAY',
  status: 'stable',
} as const;
