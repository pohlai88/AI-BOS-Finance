/**
 * @fileoverview BioCapabilities Type Definitions
 *
 * Defines TypeScript interfaces for the capability/feature flag system.
 * Per CONT_13: BioCapabilities Feature Flag System
 *
 * @module @aibos/bioskin/capabilities
 * @version 1.0.0
 */

// ============================================================
// CAPABILITY TREE
// ============================================================

/**
 * Complete capability tree
 * Hierarchical: category.feature
 */
export interface CapabilityTree {
  table: {
    inlineEdit: boolean;
    bulkEdit: boolean;
    bulkDelete: boolean;
    csvImport: boolean;
    csvExport: boolean;
    excelExport: boolean;
    virtualization: boolean;
    columnPinning: boolean;
    columnReorder: boolean;
    rowSelection: boolean;
    keyboardNavigation: boolean;
  };

  form: {
    templates: boolean;
    cloning: boolean;
    smartDefaults: boolean;
    autoRepair: boolean;
    draftSave: boolean;
    offlineMode: boolean;
  };

  timeline: {
    comments: boolean;
    attachments: boolean;
    diffs: boolean;
    export: boolean;
    filtering: boolean;
  };

  navigation: {
    tabs: boolean;
    splitView: boolean;
    breadcrumbs: boolean;
    recentHistory: boolean;
    bookmarks: boolean;
  };

  actions: {
    create: boolean;
    update: boolean;
    delete: boolean;
    approve: boolean;
    reject: boolean;
    void: boolean;
    clone: boolean;
    archive: boolean;
  };

  audit: {
    viewHistory: boolean;
    exportHistory: boolean;
    compareVersions: boolean;
    rollback: boolean; // Usually false for compliance
  };

  sharing: {
    shareLink: boolean;
    shareFilters: boolean;
    exportPdf: boolean;
    print: boolean;
  };
}

// ============================================================
// CAPABILITY CATEGORIES
// ============================================================

/**
 * All capability categories
 */
export type CapabilityCategory = keyof CapabilityTree;

/**
 * Table capability keys
 */
export type TableCapability = keyof CapabilityTree['table'];

/**
 * Form capability keys
 */
export type FormCapability = keyof CapabilityTree['form'];

/**
 * Timeline capability keys
 */
export type TimelineCapability = keyof CapabilityTree['timeline'];

/**
 * Navigation capability keys
 */
export type NavigationCapability = keyof CapabilityTree['navigation'];

/**
 * Actions capability keys
 */
export type ActionsCapability = keyof CapabilityTree['actions'];

/**
 * Audit capability keys
 */
export type AuditCapability = keyof CapabilityTree['audit'];

/**
 * Sharing capability keys
 */
export type SharingCapability = keyof CapabilityTree['sharing'];

// ============================================================
// CAPABILITY PATH
// ============================================================

/**
 * Dot-notation path to a specific capability
 */
export type CapabilityPath =
  | `table.${TableCapability}`
  | `form.${FormCapability}`
  | `timeline.${TimelineCapability}`
  | `navigation.${NavigationCapability}`
  | `actions.${ActionsCapability}`
  | `audit.${AuditCapability}`
  | `sharing.${SharingCapability}`;

// ============================================================
// CAPABILITY RESULT
// ============================================================

/**
 * Source of the capability decision
 */
export type CapabilitySource = 'adapter' | 'role' | 'context' | 'compliance' | 'default';

/**
 * Result of a capability check
 */
export interface CapabilityResult {
  /** Whether the capability is enabled */
  enabled: boolean;
  /** Human-readable reason if disabled */
  reason?: string;
  /** Source of the decision */
  source: CapabilitySource;
}

// ============================================================
// CAPABILITY CONTEXT
// ============================================================

/**
 * Context for capability evaluation
 */
export interface CapabilityContext {
  /** Current user ID */
  userId?: string;
  /** Current user role */
  userRole?: string;
  /** Entity state (e.g., 'draft', 'approved', 'posted') */
  entityState?: string;
  /** Period status for accounting */
  periodStatus?: 'open' | 'closed';
  /** Entity type being operated on */
  entityType?: string;
  /** Module code */
  moduleCode?: string;
}

// ============================================================
// COMPLIANCE TYPES
// ============================================================

/**
 * Compliance rule identifier
 */
export type ComplianceRuleId = 'sox' | 'hipaa' | 'fda21cfr11' | 'fefo' | 'gdpr';

/**
 * Capability override from compliance rules
 */
export interface CapabilityOverride {
  /** The capability path this override applies to */
  path: CapabilityPath;
  /** Whether the capability is enabled */
  enabled: boolean;
  /** Reason for the override */
  reason: string;
  /** Requires special handling (e.g., redaction) */
  requiresRedaction?: boolean;
  /** Requires approval workflow */
  requiresApproval?: boolean;
  /** Requires documented reason */
  requiresReason?: boolean;
}

/**
 * Compliance rule definition
 */
export interface ComplianceRule {
  /** Rule identifier */
  id: ComplianceRuleId;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Capability overrides */
  overrides: CapabilityOverride[];
}

// ============================================================
// CAPABILITY PROFILE
// ============================================================

/**
 * Deep partial of capability tree for profiles
 */
export type PartialCapabilityTree = {
  [K in keyof CapabilityTree]?: Partial<CapabilityTree[K]>;
};

// ============================================================
// EVENTS
// ============================================================

/**
 * Capability event types
 */
export type CapabilityEvent =
  | { type: 'profile:updated'; adapterId: string }
  | { type: 'role:registered'; role: string }
  | { type: 'context:changed'; context: CapabilityContext };

/**
 * Capability event listener
 */
export type CapabilityEventListener = (event: CapabilityEvent) => void;
