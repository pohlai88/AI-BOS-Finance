// metadata-studio/naming/index.ts

/**
 * Naming Convention System
 * 
 * Central module for managing naming variants across different contexts.
 * 
 * SSOT: canonical_key in mdm_global_metadata is ALWAYS snake_case.
 * All other variants are generated or stored in mdm_naming_variant.
 */

export {
  resolveNameForConcept,
  batchResolveNames,
  preGenerateStandardVariants,
} from './name-resolver';

export {
  snakeToCamel,
  snakeToPascal,
  snakeToUpperSnake,
  snakeToKebab,
  isValidSnakeCase,
  toSnakeCase,
} from './case-helpers';

export type { NamingContext, NamingStyle } from '../db/schema/naming-variant.tables';
export { NAMING_CONTEXTS, NAMING_STYLES, DEFAULT_STYLE_BY_CONTEXT } from '../db/schema/naming-variant.tables';

