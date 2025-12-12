// ============================================================================
// CARD SECTION COMPONENT
// Canonical card architecture for NexusCanon bento grids
// Enforces Guidelines.md Section III (1px borders, forensic aesthetic)
// ============================================================================

import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { NexusCard } from './NexusCard'
import { NexusBadge } from './NexusBadge'
import { Save, CheckCircle2, RotateCcw } from 'lucide-react'

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
} as const

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CardSectionProps {
  // Header
  icon?: LucideIcon
  title: string
  subtitle?: string
  badge?: ReactNode
  headerActions?: ReactNode

  // Body
  children: ReactNode
  bodyClassName?: string
  scrollable?: boolean

  // Footer
  footerLeft?: ReactNode
  footerRight?: ReactNode

  // Save State
  onSave?: () => void
  onRevert?: () => void
  saveState?: {
    isSaving: boolean
    saveSuccess: boolean
    hasChanges: boolean
  }

  // Layout
  className?: string
  compact?: boolean
  height?: string // e.g., 'h-[400px]'

  // Dirty Indicator
  showDirtyIndicator?: boolean
}

// ============================================================================
// SAVE BUTTON SUB-COMPONENT
// ============================================================================

interface SaveButtonProps {
  onClick: () => void
  disabled: boolean
  isSaving: boolean
  saveSuccess: boolean
  hasChanges: boolean
}

function SaveButton({
  onClick,
  disabled,
  isSaving,
  saveSuccess,
  hasChanges,
}: SaveButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative h-8 border px-3 font-mono text-[9px] uppercase tracking-[0.15em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] ${
        hasChanges && !isSaving
          ? 'border-emerald-500/40 bg-[#0A0A0A] text-emerald-500 hover:border-emerald-500 hover:bg-emerald-950/20'
          : 'cursor-not-allowed border-[#1F1F1F] bg-[#050505] text-zinc-700'
      } `}
    >
      {/* Top micro-glow when active */}
      {hasChanges && !isSaving && (
        <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
      )}

      <div className="flex items-center gap-1.5">
        {isSaving ? (
          <>
            <div className="h-2.5 w-2.5 animate-spin rounded-full border border-emerald-500 border-t-transparent" />
            <span>Saving</span>
          </>
        ) : saveSuccess ? (
          <>
            <CheckCircle2 className="h-2.5 w-2.5" />
            <span>Saved</span>
          </>
        ) : (
          <>
            <Save className="h-2.5 w-2.5" />
            <span>Save</span>
          </>
        )}
      </div>
    </button>
  )
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
  const tokens = compact ? CARD_TOKENS.compactMode : CARD_TOKENS

  return (
    <NexusCard
      className={`relative flex flex-col overflow-hidden p-0 ${height || ''} ${className} `}
    >
      {/* ================================================================ */}
      {/* HEADER */}
      {/* ================================================================ */}
      <div
        className={`flex flex-shrink-0 items-center justify-between ${tokens.header.border} ${tokens.header.padding} ${CARD_TOKENS.header.glow} `}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          {Icon && (
            <div
              className={` ${tokens.header.iconPadding} border border-[#1F1F1F] bg-[#050505] text-zinc-500`}
            >
              <Icon className={tokens.header.iconSize} />
            </div>
          )}

          {/* Title & Subtitle */}
          <div className="flex items-center gap-2">
            {/* Dirty Indicator */}
            {showDirtyIndicator && saveState.hasChanges && (
              <div
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"
                aria-label="Unsaved changes"
              />
            )}

            <div>
              <h2
                className={`tracking-tight text-white ${compact ? 'text-sm' : ''}`}
              >
                {title}
              </h2>
              {subtitle && (
                <p className="font-mono text-[10px] tracking-[0.1em] text-zinc-600">
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
          <div className="flex items-center gap-2">{headerActions}</div>
        )}
      </div>

      {/* ================================================================ */}
      {/* BODY */}
      {/* ================================================================ */}
      <div
        className={`flex-1 ${scrollable ? 'overflow-y-auto' : 'overflow-hidden'} ${bodyClassName || tokens.body.padding} `}
      >
        {children}
      </div>

      {/* ================================================================ */}
      {/* FOOTER */}
      {/* ================================================================ */}
      {(footerLeft || footerRight || onSave) && (
        <div
          className={`flex flex-shrink-0 items-center justify-between ${tokens.footer.border} ${tokens.footer.background} ${tokens.footer.padding} `}
        >
          {/* Left Actions */}
          <div className="flex items-center gap-2">{footerLeft}</div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Revert Button */}
            {onRevert && saveState.hasChanges && (
              <button
                onClick={onRevert}
                className={`h-8 border border-[#1F1F1F] bg-[#050505] px-3 font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-500 transition-colors hover:border-amber-900/40 hover:text-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]`}
              >
                <RotateCcw className="mr-1 inline h-2.5 w-2.5" />
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
  )
}
