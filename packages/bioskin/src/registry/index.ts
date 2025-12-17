/**
 * @fileoverview BioRegistry Module Exports
 * 
 * Industry adapter registry for multi-industry UI support.
 * Per CONT_12: BioRegistry & Industry Adapters
 * 
 * @module @aibos/bioskin/registry
 * @version 1.0.0
 */

// ============================================================
// REGISTRY SINGLETON
// ============================================================

export { BioRegistry, type BioRegistryImpl, type RegistryEvent, type RegistryEventListener } from './BioRegistry';

// ============================================================
// REACT PROVIDER
// ============================================================

export {
  BioRegistryProvider,
  useRegistryContext,
  useRegistryReady,
  useActiveAdapter,
  type BioRegistryContextValue,
  type BioRegistryProviderProps,
} from './BioRegistryProvider';

// ============================================================
// TYPE EXPORTS
// ============================================================

export type {
  // Adapter Cluster
  AdapterCluster,

  // Module Configuration
  ModuleConfig,

  // Empty State Configuration
  EmptyStateConfig,
  QuickAction,

  // Command Configuration
  CommandConfig,
  CommandCategory,

  // Filter Configuration
  FilterOperator,
  FilterDefinition,
  FilterPreset,

  // Exception Configuration
  ExceptionSeverity,
  ExceptionTypeConfig,

  // Design Token Overrides
  DesignTokenOverrides,

  // Validation Messages
  ValidationMessages,

  // Industry Adapter Interface
  IndustryAdapter,

  // Lookup Results
  AdapterLookupResult,
} from './types';

// ============================================================
// VALIDATION EXPORTS
// ============================================================

export {
  // Schemas (for external validation)
  AdapterClusterSchema,
  IndustryAdapterSchema,
  ModuleConfigSchema,
  EmptyStateConfigSchema,
  CommandConfigSchema,
  FilterPresetSchema,
  ExceptionTypeConfigSchema,

  // Validation Functions
  validateAdapter,
  validateAdapterOrThrow,
  formatValidationErrors,

  // Types
  type ValidationResult,
} from './validation';
