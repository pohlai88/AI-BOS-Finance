// ============================================================================
// BIOSKIN - The Morphology Layer
// ============================================================================
// Schema-driven UI components that map Kernel metadata to atomic components
// 🛡️ GOVERNANCE: Only composes Surface, Txt, Btn, Input, StatusDot
// ============================================================================

// Core BioSkin Components
export { BioCell, type BioCellProps, type Intent } from './BioCell'
export { BioObject } from './BioObject'
export { BioList, type BioListProps } from './BioList'
export {
  FieldContextSidebar,
  type FieldContextSidebarProps,
} from './FieldContextSidebar'

// Zod Integration (Generative UI)
export { ZodBioObject, ZodBioList } from './ZodBioObject'
export type { ZodBioObjectProps, ZodBioListProps } from './ZodBioObject'
export { introspectZodSchema, createBioSchema } from './ZodSchemaIntrospector'
export { ZodBioDemo } from './ZodBioDemo'

// Types
export type {
  ExtendedMetadataField,
  BioIntent,
  FieldErrors,
  BioObjectPropsWithSchema,
  BioObjectPropsWithoutSchema,
} from './types'
