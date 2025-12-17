/**
 * @fileoverview Compliance Rules for BioCapabilities
 *
 * Defines non-negotiable compliance rules that override adapter defaults.
 * Per CONT_13: BioCapabilities Feature Flag System
 *
 * @module @aibos/bioskin/capabilities
 * @version 1.0.0
 */

import type { ComplianceRule, ComplianceRuleId, CapabilityOverride } from './types';
import type { AdapterCluster } from '../registry/types';

// ============================================================
// COMPLIANCE RULES DEFINITIONS
// ============================================================

/**
 * Compliance rules - cannot be overridden by adapter or role
 */
export const ComplianceRules: Record<ComplianceRuleId, ComplianceRule> = {
  // SOX - Sarbanes-Oxley (Finance/Corporate)
  sox: {
    id: 'sox',
    name: 'Sarbanes-Oxley (SOX)',
    description: 'US federal law for financial transparency and accountability',
    overrides: [
      {
        path: 'audit.rollback',
        enabled: false,
        reason: 'SOX: Audit rollback disabled for financial integrity',
      },
      {
        path: 'actions.void',
        enabled: true,
        requiresApproval: true,
        reason: 'SOX: Void requires dual approval',
      },
    ],
  },

  // HIPAA - Health Insurance Portability and Accountability Act
  hipaa: {
    id: 'hipaa',
    name: 'HIPAA',
    description: 'US law for protecting patient health information',
    overrides: [
      {
        path: 'table.bulkDelete',
        enabled: false,
        reason: 'HIPAA: Bulk delete disabled for patient records',
      },
      {
        path: 'table.inlineEdit',
        enabled: false,
        reason: 'HIPAA: Direct edit disabled, use formal amendment process',
      },
      {
        path: 'table.csvExport',
        enabled: true,
        requiresRedaction: true,
        reason: 'HIPAA: Export requires PHI redaction',
      },
      {
        path: 'audit.rollback',
        enabled: false,
        reason: 'HIPAA: Rollback disabled for audit integrity',
      },
    ],
  },

  // FDA 21 CFR Part 11 - Electronic Records
  fda21cfr11: {
    id: 'fda21cfr11',
    name: 'FDA 21 CFR Part 11',
    description: 'FDA regulations for electronic records in manufacturing',
    overrides: [
      {
        path: 'audit.rollback',
        enabled: false,
        reason: 'FDA: Rollback disabled for electronic records integrity',
      },
      {
        path: 'form.autoRepair',
        enabled: false,
        reason: 'FDA: Automatic data correction disabled for compliance',
      },
      {
        path: 'audit.exportHistory',
        enabled: false,
        reason: 'FDA: Controlled document export only',
      },
    ],
  },

  // FEFO - First Expiry First Out (Supply Chain)
  fefo: {
    id: 'fefo',
    name: 'FEFO (First Expiry First Out)',
    description: 'Inventory management rule for perishable goods',
    overrides: [
      {
        path: 'actions.void',
        enabled: true,
        requiresReason: true,
        reason: 'FEFO: Override requires documented reason',
      },
    ],
  },

  // GDPR - General Data Protection Regulation
  gdpr: {
    id: 'gdpr',
    name: 'GDPR',
    description: 'EU regulation for data protection and privacy',
    overrides: [
      {
        path: 'table.csvExport',
        enabled: true,
        requiresRedaction: true,
        reason: 'GDPR: Export may require PII redaction',
      },
      {
        path: 'sharing.shareLink',
        enabled: false,
        reason: 'GDPR: Direct sharing disabled, use controlled access',
      },
    ],
  },
};

// ============================================================
// ADAPTER TO COMPLIANCE MAPPING
// ============================================================

/**
 * Mapping of adapter clusters to applicable compliance rules
 */
export const AdapterComplianceMap: Record<AdapterCluster, ComplianceRuleId[]> = {
  corporate: ['sox'],
  supplychain: ['fefo'],
  production: ['fda21cfr11'],
  agriops: ['fefo'],
  outlet: [],
};

// ============================================================
// COMPLIANCE UTILITY FUNCTIONS
// ============================================================

/**
 * Get all compliance overrides for an adapter
 *
 * @param adapterId - The adapter cluster ID
 * @returns Array of capability overrides from all applicable compliance rules
 *
 * @example
 * ```typescript
 * const overrides = getComplianceOverrides('corporate');
 * // Returns SOX overrides
 * ```
 */
export function getComplianceOverrides(adapterId: AdapterCluster): CapabilityOverride[] {
  const ruleIds = AdapterComplianceMap[adapterId] ?? [];
  return ruleIds.flatMap((id) => ComplianceRules[id]?.overrides ?? []);
}

/**
 * Check if a specific capability is blocked by compliance
 *
 * @param adapterId - The adapter cluster ID
 * @param path - The capability path
 * @returns The blocking override if found, undefined otherwise
 *
 * @example
 * ```typescript
 * const block = getComplianceBlock('corporate', 'audit.rollback');
 * // Returns { enabled: false, reason: 'SOX: ...', ... }
 * ```
 */
export function getComplianceBlock(
  adapterId: AdapterCluster,
  path: string
): CapabilityOverride | undefined {
  const overrides = getComplianceOverrides(adapterId);
  return overrides.find((o) => o.path === path && !o.enabled);
}

/**
 * Get all compliance rules for an adapter
 *
 * @param adapterId - The adapter cluster ID
 * @returns Array of compliance rule definitions
 */
export function getAdapterComplianceRules(adapterId: AdapterCluster): ComplianceRule[] {
  const ruleIds = AdapterComplianceMap[adapterId] ?? [];
  return ruleIds.map((id) => ComplianceRules[id]).filter(Boolean);
}

/**
 * Check if an adapter requires a specific compliance
 *
 * @param adapterId - The adapter cluster ID
 * @param ruleId - The compliance rule ID
 * @returns True if the adapter requires this compliance
 */
export function adapterRequiresCompliance(
  adapterId: AdapterCluster,
  ruleId: ComplianceRuleId
): boolean {
  return AdapterComplianceMap[adapterId]?.includes(ruleId) ?? false;
}
