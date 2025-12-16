/**
 * Policy Port (K_POLICY)
 * 
 * Interface for business policy evaluation.
 * Used by AP-05 to enforce Segregation of Duties and approval limits.
 * 
 * Anti-Gravity: This is a PORT, not an adapter.
 * It defines WHAT we need, not HOW it's implemented.
 */

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * Segregation of Duties check result
 */
export interface SoDResult {
  /** Is the action allowed? */
  allowed: boolean;
  /** Reason for denial (if not allowed) */
  reason?: string;
  /** Policy code that was evaluated */
  policyCode?: string;
  /** Violation details (for audit) */
  violation?: {
    creatorId: string;
    approverId: string;
    violationType: 'SELF_APPROVAL' | 'ROLE_CONFLICT' | 'OTHER';
  };
}

/**
 * Approval limit configuration
 */
export interface ApprovalLimit {
  /** Role that this limit applies to */
  roleId: string;
  /** Minimum amount for this approval level */
  minAmount: string; // String for precision
  /** Maximum amount for this approval level */
  maxAmount: string; // String for precision
  /** Currency code */
  currency: string;
  /** Approval level (1 = first approver, 2 = second, etc.) */
  level: number;
  /** Is this the final approval? */
  isFinal: boolean;
}

/**
 * Approval requirement based on amount
 */
export interface ApprovalRequirement {
  /** Required approval levels */
  levels: number;
  /** Specific roles required at each level */
  requiredRoles: string[][];
  /** Amount threshold that triggered this requirement */
  threshold: string;
  /** Is CFO or equivalent required? */
  requiresExecutive: boolean;
}

// ============================================================================
// 2. PORT INTERFACE
// ============================================================================

export interface PolicyPort {
  /**
   * Evaluate Segregation of Duties
   * 
   * @param creatorId - ID of the user who created the payment
   * @param approverId - ID of the user attempting to approve
   * @returns SoD evaluation result
   * 
   * Business Rules:
   * - Maker cannot be Checker (self-approval blocked)
   * - Same role exclusions may apply
   * - Certain roles may be exempt (e.g., system auto-approvals)
   */
  evaluateSoD(creatorId: string, approverId: string): Promise<SoDResult>;

  /**
   * Get approval limits for a role
   * 
   * @param roleId - Role identifier
   * @param tenantId - Tenant identifier
   * @returns Approval limits for the role
   */
  getApprovalLimits(roleId: string, tenantId: string): Promise<ApprovalLimit[]>;

  /**
   * Get approval requirements for an amount
   * 
   * @param amount - Payment amount (as string)
   * @param currency - Currency code
   * @param tenantId - Tenant identifier
   * @returns Required approval levels and roles
   */
  getApprovalRequirements(
    amount: string,
    currency: string,
    tenantId: string
  ): Promise<ApprovalRequirement>;

  /**
   * Check if a user can approve a specific amount
   * 
   * @param userId - User attempting to approve
   * @param amount - Payment amount (as string)
   * @param currency - Currency code
   * @param tenantId - Tenant identifier
   * @param level - Approval level (1, 2, etc.)
   * @returns Whether the user can approve at this level
   */
  canApprove(
    userId: string,
    amount: string,
    currency: string,
    tenantId: string,
    level: number
  ): Promise<{
    allowed: boolean;
    reason?: string;
    userRole?: string;
    requiredRole?: string;
  }>;
}
