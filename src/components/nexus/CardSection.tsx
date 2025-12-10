// ============================================================================
// CARD SECTION COMPONENT
// Canonical card architecture for NexusCanon bento grids
// Enforces Guidelines.md Section III (1px borders, forensic aesthetic)
// ============================================================================

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { NexusCard } from './NexusCard';
import { NexusBadge } from './NexusBadge';
import { Save, CheckCircle2, RotateCcw } from 'lucide-react';

// ============================================================================
// DESIGN TOKENS - Machine-Enforceable
// ============================================================================

const CARD_TOKENS = {
  border: 'border border-[#1F1F1F]',
  background: {
    base: 'bg-[#0A0A0A]',
    nested: 'bg-[#050505]',
  },
  header: {
    border: 'border-b border-[#1F1F1F]',
    padding: 'px-6 py-4',
    glow: 'border-t border-[#333]/0 hover:border-[#333]/100 transition-colors duration-300',
    iconSize: 'w-4 h-4',
    iconPadding: 'p-2',
  },
  body: {
    padding: 'p-6',
  },
  footer: {
    border: 'border-t border-[#1F1F1F]',
    background: 'bg-[#050505]',
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
      className={`
        relative h-8 px-3 font-mono text-[9px] uppercase tracking-[0.15em]
        border transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 
        focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]
        ${hasChanges && !isSaving
          ? 'bg-[#0A0A0A] border-emerald-500/40 text-emerald-500 hover:bg-emerald-950/20 hover:border-emerald-500' 
          : 'bg-[#050505] border-[#1F1F1F] text-zinc-700 cursor-not-allowed'
        }
      `}
    >
      {/* Top micro-glow when active */}
      {hasChanges && !isSaving && (
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
      )}
      
      <div className="flex items-center gap-1.5">
        {isSaving ? (
          <>
            <div className="w-2.5 h-2.5 border border-emerald-500 border-t-transparent rounded-full animate-spin" />
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
    <NexusCard 
      className={`
        p-0 relative overflow-hidden flex flex-col
        ${height || ''}
        ${className}
      `}
    >
      
      {/* ================================================================ */}
      {/* HEADER */}
      {/* ================================================================ */}
      <div className={`
        flex items-center justify-between flex-shrink-0
        ${tokens.header.border}
        ${tokens.header.padding}
        ${CARD_TOKENS.header.glow}
      `}>
        <div className="flex items-center gap-3">
          {/* Icon */}
          {Icon && (
            <div className={`
              ${tokens.header.iconPadding}
              bg-[#050505] border border-[#1F1F1F] text-zinc-500
            `}>
              <Icon className={tokens.header.iconSize} />
            </div>
          )}
          
          {/* Title & Subtitle */}
          <div className="flex items-center gap-2">
            {/* Dirty Indicator */}
            {showDirtyIndicator && saveState.hasChanges && (
              <div 
                className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"
                aria-label="Unsaved changes"
              />
            )}
            
            <div>
              <h2 className={`tracking-tight text-white ${compact ? 'text-sm' : ''}`}>
                {title}
              </h2>
              {subtitle && (
                <p className="text-[10px] font-mono text-zinc-600 tracking-[0.1em]">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Badge */}
          {badge && <div className="ml-2">{badge}</div>}
        </div>

        {/* Header Actions */}
        {headerActions && (
          <div className="flex items-center gap-2">
            {headerActions}
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* BODY */}
      {/* ================================================================ */}
      <div 
        className={`
          flex-1
          ${scrollable ? 'overflow-y-auto' : 'overflow-hidden'}
          ${bodyClassName || tokens.body.padding}
        `}
      >
        {children}
      </div>

      {/* ================================================================ */}
      {/* FOOTER */}
      {/* ================================================================ */}
      {(footerLeft || footerRight || onSave) && (
        <div className={`
          flex items-center justify-between flex-shrink-0
          ${tokens.footer.border}
          ${tokens.footer.background}
          ${tokens.footer.padding}
        `}>
          {/* Left Actions */}
          <div className="flex items-center gap-2">
            {footerLeft}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Revert Button */}
            {onRevert && saveState.hasChanges && (
              <button
                onClick={onRevert}
                className={`
                  h-8 px-3 font-mono text-[9px] uppercase tracking-[0.15em]
                  border border-[#1F1F1F] text-zinc-500 
                  hover:border-amber-900/40 hover:text-amber-500 
                  transition-colors bg-[#050505]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 
                  focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]
                `}
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
    </NexusCard>
  );
}