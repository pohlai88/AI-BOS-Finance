/**
 * @fileoverview BioRegistry Type Definitions
 * 
 * Defines TypeScript interfaces for the industry adapter system.
 * Per CONT_12: BioRegistry & Industry Adapters
 * 
 * @module @aibos/bioskin/registry
 * @version 1.0.0
 */

import type { LucideIcon } from 'lucide-react';

// ============================================================
// ADAPTER CLUSTERS
// ============================================================

/**
 * Industry adapter cluster identifiers
 * Per CONT_12: 5 clusters covering all industries
 */
export type AdapterCluster =
  | 'agriops'      // Plantation, Vertical Farming, Greenhouse
  | 'production'   // Manufacturing, Central Kitchen, Food Processing
  | 'outlet'       // F&B, Franchise, Retail, E-commerce
  | 'supplychain'  // Cold Chain, Warehouse, Logistics
  | 'corporate';   // Holding, Trading, Intercompany

// ============================================================
// MODULE CONFIGURATION
// ============================================================

/**
 * Module configuration for navigation and routing
 */
export interface ModuleConfig {
  /** Unique module code (e.g., 'ap', 'ar', 'warehouse') */
  code: string;
  /** Display name */
  name: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Route path (must start with /) */
  route: string;
  /** Available capabilities for this module */
  capabilities?: string[];
  /** Parent module code for hierarchical modules */
  parent?: string;
}

// ============================================================
// EMPTY STATE CONFIGURATION
// ============================================================

/**
 * Quick action for empty states and entity context
 */
export interface QuickAction {
  /** Unique action ID */
  id: string;
  /** Display label */
  label: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Navigation route (optional) */
  route?: string;
  /** Click handler (optional, alternative to route) */
  handler?: () => void;
  /** Required permissions to show this action */
  permissions?: string[];
  /** Keyboard shortcut (optional) */
  shortcut?: string;
}

/**
 * Empty state configuration per module/entity
 */
export interface EmptyStateConfig {
  /** Lucide icon to display */
  icon: LucideIcon;
  /** Title text */
  title: string;
  /** Description text */
  description: string;
  /** Primary action button */
  action: {
    /** Button label */
    label: string;
    /** Navigation route (optional) */
    route?: string;
    /** Click handler (optional) */
    handler?: () => void;
    /** Button variant */
    variant?: 'primary' | 'secondary';
  };
  /** Helpful hints to display */
  hints?: string[];
  /** Quick action buttons */
  quickActions?: QuickAction[];
  /** Link to documentation */
  docsUrl?: string;
  /** Link to video tutorial */
  videoUrl?: string;
}

// ============================================================
// COMMAND PALETTE CONFIGURATION
// ============================================================

/**
 * Command palette command configuration
 */
export interface CommandConfig {
  /** Unique command ID */
  id: string;
  /** Display label */
  label: string;
  /** Search keywords for fuzzy matching */
  keywords?: string[];
  /** Module this command belongs to */
  module: string;
  /** Category for grouping */
  category?: string;
  /** Lucide icon component */
  icon?: LucideIcon;
  /** Keyboard shortcut (e.g., 'Ctrl+N') */
  shortcut?: string;
  /** Navigation route */
  route?: string;
  /** Click handler (alternative to route) */
  handler?: () => void;
  /** Required permissions */
  permissions?: string[];
  /** Priority for sorting (higher = first) */
  priority?: number;
}

/**
 * Command category for grouping in palette
 */
export interface CommandCategory {
  /** Category ID */
  id: string;
  /** Display label */
  label: string;
  /** Sort order */
  order?: number;
}

// ============================================================
// FILTER CONFIGURATION
// ============================================================

/**
 * Filter operator types
 */
export type FilterOperator =
  | 'eq'        // Equal
  | 'neq'       // Not equal
  | 'gt'        // Greater than
  | 'gte'       // Greater than or equal
  | 'lt'        // Less than
  | 'lte'       // Less than or equal
  | 'contains'  // Contains (string)
  | 'startsWith'// Starts with
  | 'endsWith'  // Ends with
  | 'between'   // Between (range)
  | 'in'        // In list
  | 'notIn'     // Not in list
  | 'isNull'    // Is null
  | 'isNotNull';// Is not null

/**
 * Filter definition
 */
export interface FilterDefinition {
  /** Field to filter on */
  field: string;
  /** Filter operator */
  operator: FilterOperator;
  /** Filter value */
  value: unknown;
  /** Human-readable label */
  label?: string;
}

/**
 * Filter preset for quick filtering
 */
export interface FilterPreset {
  /** Unique preset ID */
  id: string;
  /** Display name */
  name: string;
  /** Filter definitions */
  filters: FilterDefinition[];
  /** Is this the default preset? */
  isDefault?: boolean;
  /** Is this a shared/team preset? */
  isShared?: boolean;
  /** Icon for the preset */
  icon?: LucideIcon;
}

// ============================================================
// EXCEPTION CONFIGURATION
// ============================================================

/**
 * Exception severity levels
 */
export type ExceptionSeverity = 'critical' | 'warning' | 'info';

/**
 * Exception type configuration for exception dashboard
 */
export interface ExceptionTypeConfig {
  /** Unique exception code */
  code: string;
  /** Display label */
  label: string;
  /** Severity level */
  severity: ExceptionSeverity;
  /** Module this exception belongs to */
  module: string;
  /** Resolution guidance */
  resolution?: string;
  /** Link to documentation */
  docsUrl?: string;
  /** Auto-resolve after duration (ms) */
  autoResolveAfter?: number;
}

// ============================================================
// DESIGN TOKEN OVERRIDES
// ============================================================

/**
 * Design token overrides for industry theming
 */
export interface DesignTokenOverrides {
  colors?: {
    primary?: string;
    primaryHover?: string;
    primaryLight?: string;
    secondary?: string;
  };
  status?: {
    success?: string;
    warning?: string;
    danger?: string;
    info?: string;
  };
  // Extend as needed for other token categories
}

// ============================================================
// VALIDATION MESSAGE OVERRIDES
// ============================================================

/**
 * Validation message overrides for industry-specific terminology
 */
export type ValidationMessages = Record<string, string>;

// ============================================================
// INDUSTRY ADAPTER INTERFACE
// ============================================================

/**
 * Industry adapter interface
 * 
 * Each adapter cluster implements this interface to provide
 * industry-specific configuration to BioSkin components.
 * 
 * @example
 * ```typescript
 * const SupplyChainAdapter: IndustryAdapter = {
 *   id: 'supplychain',
 *   name: 'Supply Chain & Cold Chain',
 *   modules: [...],
 *   emptyStates: {...},
 *   commands: [...],
 *   filterPresets: {...},
 *   exceptionTypes: [...],
 * };
 * ```
 */
export interface IndustryAdapter {
  /** Unique adapter identifier */
  id: AdapterCluster;

  /** Display name for the adapter */
  name: string;

  /** Module configurations for navigation */
  modules: ModuleConfig[];

  /** Empty state configurations keyed by module/entity */
  emptyStates: Record<string, EmptyStateConfig>;

  /** Command palette commands */
  commands: CommandConfig[];

  /** Command categories for grouping */
  commandCategories?: CommandCategory[];

  /** Filter presets keyed by module */
  filterPresets: Record<string, FilterPreset[]>;

  /** Validation message overrides */
  validationMessages?: ValidationMessages;

  /** Quick actions keyed by entity type */
  quickActions?: Record<string, QuickAction[]>;

  /** Exception type definitions */
  exceptionTypes: ExceptionTypeConfig[];

  /** Design token overrides for theming */
  tokens?: DesignTokenOverrides;

  /** Adapter version */
  version?: string;

  /** Adapter description */
  description?: string;
}

// ============================================================
// REGISTRY RESULT TYPES
// ============================================================

/**
 * Result of adapter lookup operations
 */
export interface AdapterLookupResult<T> {
  /** The found value */
  value: T | undefined;
  /** The source adapter ID */
  source: AdapterCluster | null;
  /** Whether a value was found */
  found: boolean;
}
