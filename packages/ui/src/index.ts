// ============================================================================
// @aibos/ui - Self-Contained UI Components Package
// ============================================================================
// The "Proteins" layer - Governed atomic building blocks
// 🛡️ GOVERNANCE: Only uses design tokens (no hardcoded colors)
// ============================================================================
// 
// This package is COMPLETELY SELF-CONTAINED:
// - lib/utils.ts: The "Brain" (cn utility)
// - atoms/: Governed atomic components (Surface, Txt, Btn, Input, StatusDot)
// - primitives/: Radix UI wrappers (Badge, Card, Dialog, ScrollArea, etc.)
// 
// All components follow the "Biological Monorepo" architecture:
// - DNA (Schemas) → C-DataLogic
// - Proteins (Atoms) → @aibos/ui (this package)
// - Cells (BioSkin) → @aibos/bioskin
// - Tissue (Domain) → src/components
// - Skin (Pages) → app/
// ============================================================================

// 1. Utilities (The Brain)
export { cn } from './lib/utils'

// 2. Atoms (Governed Components)
export * from './atoms'

// 3. Primitives (Radix UI Wrappers)
export * from './primitives/badge'
export * from './primitives/card'
export * from './primitives/dialog'
export * from './primitives/scroll-area'
export * from './primitives/separator'
export * from './primitives/popover'
