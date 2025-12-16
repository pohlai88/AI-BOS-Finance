// ============================================================================
// CARD SECTION COMPONENT
// Canonical card architecture for NexusCanon bento grids
// Enforces Guidelines.md Section III (1px borders, forensic aesthetic)
// 
// Moved from components/nexus/ to components/canon/ per CONT_09 cleanup.
// Now uses ForensicCard (shadcn Card variant) instead of NexusCard.
// ============================================================================

import { ReactNode } from 'react';
import { LucideIcon, Save, CheckCircle2, RotateCcw } from 'lucide-react';
import { ForensicCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ============================================================================
// DESIGN TOKENS - Machine-Enforceable
// ============================================================================

const CARD_TOKENS = {
  border: 'border border-border-default',
  background: {
    base: 'bg-background',
    nested: 'bg-surface-nested',
  },
  header: {
    border: 'border-b border-border-default',
    padding: 'px-6 py-4',
    glow: 'border-t border-border-subtle/0 hover:border-border-subtle/100 transition-colors duration-300',
    iconSize: 'w-4 h-4',
    iconPadding: 'p-2',
  },
  body: {
    padding: 'p-6',
  },
  footer: {
    border: 'border-t border-border-default',
    background: 'bg-surface-nested',
    padding: 'px-6 py-3',
  },
  compactMode: {
    header: {
      padding: 'px-5 py-3',
      iconSize: 'w-3.5 h-3.5',
      iconPadding: 'p-1.5',
    },
    body: {
      padding: 'p-5',
    },
    footer: {
      padding: 'px-5 py-2.5',
    },
  },
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CardSectionProps {
  // Header
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  headerActions?: ReactNode;

  // Body
  children: ReactNode;
  bodyClassName?: string;
  scrollable?: boolean;

  // Footer
  footerLeft?: ReactNode;
  footerRight?: ReactNode;

  // Save State
  onSave?: () => void;
  onRevert?: () => void;
  saveState?: {
    isSaving: boolean;
    saveSuccess: boolean;
    hasChanges: boolean;
  };

  // Layout
  className?: string;
  compact?: boolean;
  height?: string; // e.g., 'h-[400px]'

  // Dirty Indicator
  showDirtyIndicator?: boolean;
}

// ============================================================================
// SAVE BUTTON SUB-COMPONENT
// ============================================================================

interface SaveButtonProps {
  onClick: () => void;
  disabled: boolean;
  isSaving: boolean;
  saveSuccess: boolean;
  hasChanges: boolean;
}

function SaveButton({ onClick, disabled, isSaving, saveSuccess, hasChanges }: SaveButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative h-8 px-3 font-mono text-[9px] uppercase tracking-[0.15em]',
        'border transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        hasChanges && !isSaving
          ? 'bg-background border-primary/40 text-primary hover:bg-primary/10 hover:border-primary'
          : 'bg-surface-nested border-border-default text-text-disabled cursor-not-allowed'
      )}
    >
      {/* Top micro-glow when active */}
      {hasChanges && !isSaving && (
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      )}

      <div className="flex items-center gap-1.5">
        {isSaving ? (
          <>
            <div className="w-2.5 h-2.5 border border-primary border-t-transparent rounded-full animate-spin" />
            <span>Saving</span>
          </>
        ) : saveSuccess ? (
          <>
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>Saved</span>
          </>
        ) : (
          <>
            <Save className="w-2.5 h-2.5" />
            <span>Save</span>
          </>
        )}
      </div>
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CardSection({
  icon: Icon,
  title,
  subtitle,
  badge,
  headerActions,
  children,
  bodyClassName = '',
  scrollable = false,
  footerLeft,
  footerRight,
  onSave,
  onRevert,
  saveState = { isSaving: false, saveSuccess: false, hasChanges: false },
  className = '',
  compact = false,
  height,
  showDirtyIndicator = true,
}: CardSectionProps) {
  const tokens = compact ? CARD_TOKENS.compactMode : CARD_TOKENS;

  return (
    <ForensicCard
      className={cn(
        'p-0 relative overflow-hidden flex flex-col gap-0',
        height || '',
        className
      )}
    >
      {/* ================================================================ */}
      {/* HEADER */}
      {/* ================================================================ */}
      <div
        className={cn(
          'flex items-center justify-between flex-shrink-0',
          tokens.header.border,
          tokens.header.padding,
          CARD_TOKENS.header.glow
        )}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          {Icon && (
            <div
              className={cn(
                tokens.header.iconPadding,
                'bg-surface-nested border border-border-default text-text-secondary'
              )}
            >
              <Icon className={tokens.header.iconSize} />
            </div>
          )}

          {/* Title & Subtitle */}
          <div className="flex items-center gap-2">
            {/* Dirty Indicator */}
            {showDirtyIndicator && saveState.hasChanges && (
              <div
                className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"
                aria-label="Unsaved changes"
              />
            )}

            <div>
              <h2 className={cn('tracking-tight text-text-primary', compact ? 'text-sm' : '')}>
                {title}
              </h2>
              {subtitle && (
                <p className="text-[10px] font-mono text-text-tertiary tracking-[0.1em]">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Badge */}
          {badge && <div className="ml-2">{badge}</div>}
        </div>

        {/* Header Actions */}
        {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
      </div>

      {/* ================================================================ */}
      {/* BODY */}
      {/* ================================================================ */}
      <div
        className={cn(
          'flex-1',
          scrollable ? 'overflow-y-auto' : 'overflow-hidden',
          bodyClassName || tokens.body.padding
        )}
      >
        {children}
      </div>

      {/* ================================================================ */}
      {/* FOOTER */}
      {/* ================================================================ */}
      {(footerLeft || footerRight || onSave) && (
        <div
          className={cn(
            'flex items-center justify-between flex-shrink-0',
            tokens.footer.border,
            tokens.footer.background,
            tokens.footer.padding
          )}
        >
          {/* Left Actions */}
          <div className="flex items-center gap-2">{footerLeft}</div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Revert Button */}
            {onRevert && saveState.hasChanges && (
              <button
                onClick={onRevert}
                className={cn(
                  'h-8 px-3 font-mono text-[9px] uppercase tracking-[0.15em]',
                  'border border-border-default text-text-secondary',
                  'hover:border-status-warning/40 hover:text-status-warning',
                  'transition-colors bg-surface-nested',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-warning/40',
                  'focus-visible:ring-offset-2 focus-visible:ring-offset-surface-nested'
                )}
              >
                <RotateCcw className="w-2.5 h-2.5 inline mr-1" />
                Discard
              </button>
            )}

            {/* Custom Footer Right */}
            {footerRight}

            {/* Save Button */}
            {onSave && (
              <SaveButton
                onClick={onSave}
                disabled={!saveState.hasChanges || saveState.isSaving}
                isSaving={saveState.isSaving}
                saveSuccess={saveState.saveSuccess}
                hasChanges={saveState.hasChanges}
              />
            )}
          </div>
        </div>
      )}
    </ForensicCard>
  );
}

// ============================================================================
// COMPONENT_META - Canon Governance
// ============================================================================

export const COMPONENT_META = {
  code: 'COMP_CardSection',
  version: '2.0.0',
  family: 'CARD',
  purpose: 'DISPLAY',
  status: 'active',
  layer: 3,
  dependencies: ['@/components/ui/card', '@/components/ui/badge'],
} as const;
