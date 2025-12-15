// metadata-studio/services/policy.service.ts

/**
 * Policy Service
 * 
 * Implements GRCD Section 2.3 Mandatory Services:
 * - policy.dataAccess.check(actor, resource, intent)
 * - policy.controlStatus.list(standard, scope)
 * 
 * This service enforces governance policies based on:
 * - Actor roles (kernel_architect, metadata_steward, business_admin, user)
 * - Resource governance tiers (tier1-tier5)
 * - Intended actions (read, write, delete, approve)
 */

import { db } from '../db/client';
import { mdmGlobalMetadata } from '../db/schema/metadata.tables';
import { mdmBusinessRule } from '../db/schema/business-rule.tables';
import { eq, and } from 'drizzle-orm';
import type { Role } from '../middleware/auth.middleware';
import type { GovernanceTier } from '../schemas/business-rule.schema';

// ============================================================================
// Types
// ============================================================================

export type Intent = 'read' | 'write' | 'delete' | 'approve' | 'create';

export interface AccessCheckRequest {
  actorId: string;
  actorRole: Role;
  resourceType: 'METADATA' | 'KPI' | 'GLOSSARY' | 'BUSINESS_RULE' | 'LINEAGE' | 'TAG';
  resourceId?: string;       // Optional: specific resource ID
  canonicalKey?: string;     // Optional: lookup by canonical key
  intent: Intent;
  tenantId: string;
}

export interface AccessCheckResult {
  allowed: boolean;
  tier: GovernanceTier | null;
  reason: string;
  requiresApproval: boolean;
  requiredApprovalRole?: Role;
  policies: string[];  // List of policies that were evaluated
}

export interface ControlStatus {
  standard: string;
  scope: string;
  status: 'compliant' | 'non_compliant' | 'pending_review' | 'not_applicable';
  coverage: number;  // 0-100
  lastChecked: string;
  findings: string[];
}

// ============================================================================
// Access Control Matrix
// ============================================================================

/**
 * Role-based access control matrix by tier
 * 
 * GRCD Section 4 - Autonomy & Risk Tiers:
 * - Tier 0: Read-only
 * - Tier 1: Suggest only
 * - Tier 2: Propose (requires approval)
 * - Tier 3: Auto-apply (guarded)
 */
const ACCESS_MATRIX: Record<GovernanceTier, Record<Role, Intent[]>> = {
  tier1: {
    kernel_architect: ['read', 'write', 'delete', 'approve', 'create'],
    metadata_steward: ['read', 'write', 'approve'],
    business_admin: ['read'],
    user: ['read'],
  },
  tier2: {
    kernel_architect: ['read', 'write', 'delete', 'approve', 'create'],
    metadata_steward: ['read', 'write', 'delete', 'approve', 'create'],
    business_admin: ['read', 'write'],  // Requires approval
    user: ['read'],
  },
  tier3: {
    kernel_architect: ['read', 'write', 'delete', 'approve', 'create'],
    metadata_steward: ['read', 'write', 'delete', 'approve', 'create'],
    business_admin: ['read', 'write', 'delete', 'create'],
    user: ['read', 'write'],  // Limited write
  },
  tier4: {
    kernel_architect: ['read', 'write', 'delete', 'approve', 'create'],
    metadata_steward: ['read', 'write', 'delete', 'approve', 'create'],
    business_admin: ['read', 'write', 'delete', 'approve', 'create'],
    user: ['read', 'write', 'create'],
  },
  tier5: {
    kernel_architect: ['read', 'write', 'delete', 'approve', 'create'],
    metadata_steward: ['read', 'write', 'delete', 'approve', 'create'],
    business_admin: ['read', 'write', 'delete', 'approve', 'create'],
    user: ['read', 'write', 'delete', 'create'],
  },
};

/**
 * Approval requirements by tier and intent
 */
const APPROVAL_REQUIRED: Record<GovernanceTier, Record<Intent, Role | null>> = {
  tier1: {
    read: null,
    write: 'kernel_architect',
    delete: 'kernel_architect',
    approve: null,
    create: 'kernel_architect',
  },
  tier2: {
    read: null,
    write: 'metadata_steward',
    delete: 'metadata_steward',
    approve: null,
    create: 'metadata_steward',
  },
  tier3: {
    read: null,
    write: null,
    delete: 'business_admin',
    approve: null,
    create: null,
  },
  tier4: {
    read: null,
    write: null,
    delete: null,
    approve: null,
    create: null,
  },
  tier5: {
    read: null,
    write: null,
    delete: null,
    approve: null,
    create: null,
  },
};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Check if an actor can perform an intent on a resource.
 * 
 * GRCD Service: policy.dataAccess.check(actor, resource, intent)
 * 
 * @param request - Access check parameters
 * @returns AccessCheckResult with allowed status and reasoning
 */
export async function checkDataAccess(
  request: AccessCheckRequest,
): Promise<AccessCheckResult> {
  const {
    actorId,
    actorRole,
    resourceType,
    resourceId,
    canonicalKey,
    intent,
    tenantId,
  } = request;

  const policies: string[] = [];
  let tier: GovernanceTier | null = null;

  // 1. Resolve resource tier
  if (resourceType === 'METADATA' && (resourceId || canonicalKey)) {
    const metadata = await getMetadataTier(resourceId, canonicalKey, tenantId);
    if (metadata) {
      tier = metadata.tier as GovernanceTier;
      policies.push(`Resource tier: ${tier}`);
    }
  } else if (resourceType === 'BUSINESS_RULE' && resourceId) {
    const rule = await getBusinessRuleTier(resourceId, tenantId);
    if (rule) {
      tier = rule.tier as GovernanceTier;
      policies.push(`Business rule tier: ${tier}`);
    }
  }

  // Default to tier3 if no tier found (moderate governance)
  if (!tier) {
    tier = 'tier3';
    policies.push('Default tier applied: tier3');
  }

  // 2. Check role-based access
  const allowedIntents = ACCESS_MATRIX[tier][actorRole] ?? [];
  const isAllowed = allowedIntents.includes(intent);

  if (!isAllowed) {
    return {
      allowed: false,
      tier,
      reason: `Role "${actorRole}" is not permitted to "${intent}" ${tier} resources`,
      requiresApproval: false,
      policies,
    };
  }

  policies.push(`Role "${actorRole}" can "${intent}" on ${tier}`);

  // 3. Check if approval is required
  const requiredApprovalRole = APPROVAL_REQUIRED[tier][intent];
  const requiresApproval = requiredApprovalRole !== null && actorRole !== requiredApprovalRole && actorRole !== 'kernel_architect';

  if (requiresApproval) {
    policies.push(`Approval required from: ${requiredApprovalRole}`);
  }

  return {
    allowed: true,
    tier,
    reason: `Access granted for "${intent}" on ${tier} resource`,
    requiresApproval,
    requiredApprovalRole: requiresApproval ? requiredApprovalRole! : undefined,
    policies,
  };
}

/**
 * List control status for a standard and scope.
 * 
 * GRCD Service: policy.controlStatus.list(standard, scope)
 * 
 * @param standard - Standard identifier (e.g., "MFRS", "IFRS", "GDPR", "SOC2")
 * @param scope - Scope identifier (e.g., "FINANCE", "HR", "ALL")
 * @param tenantId - Tenant ID
 * @returns Array of control status entries
 */
export async function listControlStatus(
  standard: string,
  scope: string,
  tenantId: string,
): Promise<ControlStatus[]> {
  // Get all business rules for the standard
  const rules = await db
    .select()
    .from(mdmBusinessRule)
    .where(
      and(
        eq(mdmBusinessRule.tenantId, tenantId),
        eq(mdmBusinessRule.isActive, true),
      ),
    );

  // Filter by scope if not "ALL"
  const filteredRules = scope === 'ALL' 
    ? rules 
    : rules.filter(r => r.domain === scope);

  // Calculate coverage based on rules
  const totalRules = filteredRules.length;
  const activeRules = filteredRules.filter(r => r.isActive).length;
  const coverage = totalRules > 0 ? Math.round((activeRules / totalRules) * 100) : 0;

  // Build control status
  const status: ControlStatus = {
    standard,
    scope,
    status: coverage >= 80 ? 'compliant' : coverage >= 50 ? 'pending_review' : 'non_compliant',
    coverage,
    lastChecked: new Date().toISOString(),
    findings: [],
  };

  if (coverage < 100) {
    status.findings.push(`${totalRules - activeRules} inactive rules need review`);
  }

  if (filteredRules.some(r => r.tier === 'tier1' && !r.standardPackId)) {
    status.findings.push('Some Tier1 rules missing standard pack reference');
  }

  return [status];
}

/**
 * Check if a specific action can be auto-applied (Tier 3 autonomy)
 * 
 * GRCD Section 4 - Tier 3: Auto-Apply (Guarded)
 */
export function canAutoApply(
  tier: GovernanceTier,
  actorRole: Role,
  intent: Intent,
): boolean {
  // Only tier4 and tier5 can auto-apply
  if (tier !== 'tier4' && tier !== 'tier5') {
    return false;
  }

  // Kernel architects and metadata stewards can auto-apply more
  if (actorRole === 'kernel_architect' || actorRole === 'metadata_steward') {
    return true;
  }

  // Business admins can auto-apply in tier5
  if (actorRole === 'business_admin' && tier === 'tier5') {
    return true;
  }

  // Regular users can only auto-apply reads
  return intent === 'read';
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the governance tier for a metadata resource
 */
async function getMetadataTier(
  resourceId: string | undefined,
  canonicalKey: string | undefined,
  tenantId: string,
): Promise<{ tier: string } | null> {
  if (resourceId) {
    const [result] = await db
      .select({ tier: mdmGlobalMetadata.tier })
      .from(mdmGlobalMetadata)
      .where(
        and(
          eq(mdmGlobalMetadata.id, resourceId),
          eq(mdmGlobalMetadata.tenantId, tenantId),
        ),
      )
      .limit(1);
    return result ?? null;
  }

  if (canonicalKey) {
    const [result] = await db
      .select({ tier: mdmGlobalMetadata.tier })
      .from(mdmGlobalMetadata)
      .where(
        and(
          eq(mdmGlobalMetadata.canonicalKey, canonicalKey),
          eq(mdmGlobalMetadata.tenantId, tenantId),
        ),
      )
      .limit(1);
    return result ?? null;
  }

  return null;
}

/**
 * Get the governance tier for a business rule
 */
async function getBusinessRuleTier(
  ruleId: string,
  tenantId: string,
): Promise<{ tier: string } | null> {
  const [result] = await db
    .select({ tier: mdmBusinessRule.tier })
    .from(mdmBusinessRule)
    .where(
      and(
        eq(mdmBusinessRule.id, ruleId),
        eq(mdmBusinessRule.tenantId, tenantId),
      ),
    )
    .limit(1);
  return result ?? null;
}

