/**
 * @fileoverview BioCapabilities Module Exports
 *
 * Feature flag system for multi-industry compliance.
 * Per CONT_13: BioCapabilities Feature Flag System
 *
 * @module @aibos/bioskin/capabilities
 * @version 1.0.0
 */

// ============================================================
// CAPABILITIES SINGLETON
// ============================================================

export { BioCapabilities, type BioCapabilitiesImpl } from './BioCapabilities';

// ============================================================
// REACT HOOKS
// ============================================================

export {
  useCapability,
  useCapabilities,
  useCategoryCapabilities,
  useCapabilityEnabled,
  useCapabilityStats,
} from './useCapability';

// ============================================================
// REACT COMPONENTS
// ============================================================

export {
  CapabilityGate,
  CapabilitySwitch,
  RequireCapability,
  RequireAnyCapability,
  type CapabilityGateProps,
  type CapabilitySwitchCase,
  type CapabilitySwitchProps,
  type RequireCapabilityProps,
  type RequireAnyCapabilityProps,
} from './CapabilityGate';

// ============================================================
// TYPE EXPORTS
// ============================================================

export type {
  // Capability Tree
  CapabilityTree,
  CapabilityCategory,
  TableCapability,
  FormCapability,
  TimelineCapability,
  NavigationCapability,
  ActionsCapability,
  AuditCapability,
  SharingCapability,

  // Capability Path & Result
  CapabilityPath,
  CapabilitySource,
  CapabilityResult,

  // Context
  CapabilityContext,

  // Compliance
  ComplianceRuleId,
  CapabilityOverride,
  ComplianceRule,

  // Profiles
  PartialCapabilityTree,

  // Events
  CapabilityEvent,
  CapabilityEventListener,
} from './types';

// ============================================================
// COMPLIANCE EXPORTS
// ============================================================

export {
  ComplianceRules,
  AdapterComplianceMap,
  getComplianceOverrides,
  getComplianceBlock,
  getAdapterComplianceRules,
  adapterRequiresCompliance,
} from './compliance';

// ============================================================
// PROFILE EXPORTS
// ============================================================

export {
  DefaultCapabilities,
  CapabilityProfiles,
  getCapabilityProfile,
  getProfileCapability,
  mergeProfiles,
} from './profiles';
