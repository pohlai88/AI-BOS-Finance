/**
 * @aibos/bioskin - Introspector (Layer 0)
 * 
 * Schema processing utilities per CONT_10 BioSkin Architecture
 * The "RNA" that translates Zod schemas into field definitions.
 */

export {
  introspectZodSchema,
  getFieldSchema,
  validateField,
  type BioFieldDefinition,
  type BioSchemaDefinition,
} from './ZodSchemaIntrospector';
