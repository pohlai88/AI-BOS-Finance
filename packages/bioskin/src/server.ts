import 'server-only'

/**
 * @aibos/bioskin/server - Server-Safe Exports
 * 
 * Directive-based architecture per CONT_10 v2.1 BioSkin Architecture
 * These utilities are safe to use in Server Components.
 * 
 * The 'server-only' import ensures build will fail if accidentally
 * imported in a Client Component.
 * 
 * @see packages/canon/A-Governance/A-CONT/CONT_10_BioSkinArchitecture.md
 */

// ============================================================
// INTROSPECTOR (Layer 0) - Schema processing
// ============================================================
export {
  introspectZodSchema,
  getFieldSchema,
  validateField,
  type BioFieldDefinition,
  type BioSchemaDefinition,
} from './introspector';

// ============================================================
// UTILITIES - Server-safe helpers
// ============================================================
export { cn } from './atoms/utils';

// Re-export types that are useful in server context
export type { FieldDefinition } from './atoms/Field';
