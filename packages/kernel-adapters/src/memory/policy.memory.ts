/**
 * Policy Adapter - In-Memory Implementation
 * 
 * Mock implementation for development and testing.
 * Implements basic SoD and approval limit rules.
 */

import type {
  PolicyPort,
  SoDResult,
  ApprovalLimit,
  ApprovalRequirement,
} from '@aibos/kernel-core';

// ============================================================================
// 1. DEFAULT CONFIGURATION
// ============================================================================

// Approval thresholds define the MINIMUM amount at which each role level is required.
// These should align with DEFAULT_APPROVAL_LIMITS.maxAmount for each role.
const DEFAULT_APPROVAL_THRESHOLDS = {
  AUTO_APPROVE: '500',        // Amounts <= $500: Auto-approve (no approval needed)
  MANAGER_REQUIRED: '25000',  // Amounts <= $25K: Manager+ can approve
  DIRECTOR_REQUIRED: '50000', // Amounts <= $50K: Director+ can approve  
  VP_REQUIRED: '100000',      // Amounts <= $100K: VP+ can approve
  CFO_REQUIRED: 'UNLIMITED',  // Amounts > $100K: CFO only
};

const DEFAULT_APPROVAL_LIMITS: ApprovalLimit[] = [
  {
    roleId: 'ROLE_MANAGER',
    minAmount: '0',
    maxAmount: '25000',
    currency: 'USD',
    level: 1,
    isFinal: true,
  },
  {
    roleId: 'ROLE_DIRECTOR',
    minAmount: '0',
    maxAmount: '50000',
    currency: 'USD',
    level: 1,
    isFinal: true,
  },
  {
    roleId: 'ROLE_VP',
    minAmount: '0',
    maxAmount: '100000',
    currency: 'USD',
    level: 1,
    isFinal: true,
  },
  {
    roleId: 'ROLE_CFO',
    minAmount: '0',
    maxAmount: 'UNLIMITED',
    currency: 'USD',
    level: 1,
    isFinal: true,
  },
];

// ============================================================================
// 2. IN-MEMORY STORES
// ============================================================================

// User to role mappings (for testing)
const userRoles = new Map<string, string[]>();

// Custom SoD exemptions (for testing)
const sodExemptions = new Set<string>();

// ============================================================================
// 3. HELPER FUNCTIONS
// ============================================================================

function parseAmount(amount: string): number {
  if (amount === 'UNLIMITED') return Infinity;
  return parseFloat(amount);
}

function getUserRoles(userId: string): string[] {
  return userRoles.get(userId) || ['ROLE_STAFF'];
}

// ============================================================================
// 4. ADAPTER IMPLEMENTATION
// ============================================================================

export function createMemoryPolicyAdapter(): PolicyPort {
  return {
    async evaluateSoD(creatorId: string, approverId: string): Promise<SoDResult> {
      // Check if pair is exempt
      const exemptionKey = `${creatorId}:${approverId}`;
      if (sodExemptions.has(exemptionKey)) {
        return {
          allowed: true,
          policyCode: 'POLICY_SOD_EXEMPT',
        };
      }

      // Core SoD rule: creator cannot approve their own payment
      if (creatorId === approverId) {
        return {
          allowed: false,
          reason: 'Maker cannot be Checker: the payment creator cannot approve their own payment',
          policyCode: 'POLICY_SOD_001',
          violation: {
            creatorId,
            approverId,
            violationType: 'SELF_APPROVAL',
          },
        };
      }

      // Additional role-based checks could be added here
      // For now, different users can approve each other's payments

      return {
        allowed: true,
        policyCode: 'POLICY_SOD_001',
      };
    },

    async getApprovalLimits(
      roleId: string,
      _tenantId: string
    ): Promise<ApprovalLimit[]> {
      return DEFAULT_APPROVAL_LIMITS.filter(
        (limit) => limit.roleId === roleId
      );
    },

    async getApprovalRequirements(
      amount: string,
      _currency: string,
      _tenantId: string
    ): Promise<ApprovalRequirement> {
      const amountNum = parseFloat(amount);

      // Auto-approve small amounts (<= $500)
      if (amountNum <= parseAmount(DEFAULT_APPROVAL_THRESHOLDS.AUTO_APPROVE)) {
        return {
          levels: 0,
          requiredRoles: [],
          threshold: DEFAULT_APPROVAL_THRESHOLDS.AUTO_APPROVE,
          requiresExecutive: false,
        };
      }

      // Manager can approve up to $25K
      if (amountNum <= parseAmount(DEFAULT_APPROVAL_THRESHOLDS.MANAGER_REQUIRED)) {
        return {
          levels: 1,
          requiredRoles: [['ROLE_MANAGER', 'ROLE_DIRECTOR', 'ROLE_VP', 'ROLE_CFO']],
          threshold: DEFAULT_APPROVAL_THRESHOLDS.MANAGER_REQUIRED,
          requiresExecutive: false,
        };
      }

      // Director required for $25K-$50K
      if (amountNum <= parseAmount(DEFAULT_APPROVAL_THRESHOLDS.DIRECTOR_REQUIRED)) {
        return {
          levels: 1,
          requiredRoles: [['ROLE_DIRECTOR', 'ROLE_VP', 'ROLE_CFO']],
          threshold: DEFAULT_APPROVAL_THRESHOLDS.DIRECTOR_REQUIRED,
          requiresExecutive: false,
        };
      }

      // VP required for $50K-$100K
      if (amountNum <= parseAmount(DEFAULT_APPROVAL_THRESHOLDS.VP_REQUIRED)) {
        return {
          levels: 1,
          requiredRoles: [['ROLE_VP', 'ROLE_CFO']],
          threshold: DEFAULT_APPROVAL_THRESHOLDS.VP_REQUIRED,
          requiresExecutive: true,
        };
      }

      // CFO required for $100K+
      return {
        levels: 1,
        requiredRoles: [['ROLE_CFO']],
        threshold: DEFAULT_APPROVAL_THRESHOLDS.CFO_REQUIRED,
        requiresExecutive: true,
      };
    },

    async canApprove(
      userId: string,
      amount: string,
      currency: string,
      tenantId: string,
      _level: number
    ): Promise<{
      allowed: boolean;
      reason?: string;
      userRole?: string;
      requiredRole?: string;
    }> {
      const roles = getUserRoles(userId);
      const requirements = await this.getApprovalRequirements(amount, currency, tenantId);

      // Auto-approve threshold
      if (requirements.levels === 0) {
        return {
          allowed: true,
          userRole: roles[0],
        };
      }

      // Check if user has any of the required roles
      const requiredRoles = requirements.requiredRoles[0] || [];
      const hasRequiredRole = roles.some((role) => requiredRoles.includes(role));

      if (hasRequiredRole) {
        return {
          allowed: true,
          userRole: roles.find((r) => requiredRoles.includes(r)),
        };
      }

      return {
        allowed: false,
        reason: `Amount $${amount} requires approval from: ${requiredRoles.join(' or ')}`,
        userRole: roles[0],
        requiredRole: requiredRoles[0],
      };
    },
  };
}

// ============================================================================
// 5. TEST HELPERS
// ============================================================================

/**
 * Set user roles (for testing)
 */
export function setUserRoles(userId: string, roles: string[]): void {
  userRoles.set(userId, roles);
}

/**
 * Add SoD exemption (for testing)
 */
export function addSoDExemption(creatorId: string, approverId: string): void {
  sodExemptions.add(`${creatorId}:${approverId}`);
}

/**
 * Clear all test data
 */
export function clearPolicyData(): void {
  userRoles.clear();
  sodExemptions.clear();
}
