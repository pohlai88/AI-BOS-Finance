/**
 * AP-04: Invoice Approval Workflow — Types & Constants
 * 
 * Defines approval states, decisions, and route configurations.
 */

// ============================================================================
// APPROVAL STATES
// ============================================================================

/**
 * Approval status for individual approval records
 */
export type ApprovalDecision = 'pending' | 'approved' | 'rejected' | 'request_changes';

export const APPROVAL_DECISIONS: ApprovalDecision[] = [
  'pending',
  'approved',
  'rejected',
  'request_changes',
];

/**
 * Invoice approval status (aggregate)
 */
export type InvoiceApprovalStatus =
  | 'not_submitted'
  | 'pending_match'
  | 'pending_approval'
  | 'approved_level_1'
  | 'approved_level_2'
  | 'approved_level_3'
  | 'approved'
  | 'rejected';

export const INVOICE_APPROVAL_STATUSES: InvoiceApprovalStatus[] = [
  'not_submitted',
  'pending_match',
  'pending_approval',
  'approved_level_1',
  'approved_level_2',
  'approved_level_3',
  'approved',
  'rejected',
];

// ============================================================================
// APPROVAL ROLES
// ============================================================================

export type ApprovalRole =
  | 'finance_clerk'
  | 'finance_manager'
  | 'department_head'
  | 'project_lead'
  | 'controller'
  | 'cfo';

export const APPROVAL_ROLES: ApprovalRole[] = [
  'finance_clerk',
  'finance_manager',
  'department_head',
  'project_lead',
  'controller',
  'cfo',
];

export const APPROVAL_ROLE_LABELS: Record<ApprovalRole, string> = {
  finance_clerk: 'Finance Clerk',
  finance_manager: 'Finance Manager',
  department_head: 'Department Head',
  project_lead: 'Project Lead',
  controller: 'Controller',
  cfo: 'CFO',
};

// ============================================================================
// ROUTING CONFIGURATION
// ============================================================================

export interface ApprovalLevelConfig {
  level: number;
  role: ApprovalRole;
  amountThresholdCents?: number; // If amount >= this, this level is required
  description?: string;
}

export interface ApprovalRouteConfig {
  levels: ApprovalLevelConfig[];
  policySource: 'tenant' | 'vendor' | 'category' | 'amount' | 'default';
}

export const DEFAULT_APPROVAL_THRESHOLDS = {
  level1: 0,        // All invoices need at least 1 approval
  level2: 1000000,  // $10,000+
  level3: 5000000,  // $50,000+
} as const;

// ============================================================================
// APPROVAL ENTITIES
// ============================================================================

export interface ApprovalRecord {
  id: string;
  invoiceId: string;
  tenantId: string;
  approvalLevel: number;
  totalLevels: number;
  approverId: string;
  approverRole?: ApprovalRole;
  decision: ApprovalDecision;
  comments?: string;
  isDelegated: boolean;
  delegatedFromUserId?: string;
  delegationReason?: string;
  actionedAt?: Date;
  createdAt: Date;
}

export interface ApprovalRoute {
  id: string;
  invoiceId: string;
  tenantId: string;
  totalLevels: number;
  routePolicySource: string;
  routeConfig: ApprovalRouteConfig;
  isComplete: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalInboxItem {
  approval: ApprovalRecord;
  invoiceId: string;
  invoiceNumber: string;
  vendorName: string;
  totalAmountCents: number;
  currency: string;
  currentLevel: number;
  totalLevels: number;
  submittedAt: Date;
  waitingDays: number;
}

// ============================================================================
// DELEGATION
// ============================================================================

export interface Delegation {
  id: string;
  tenantId: string;
  delegatorUserId: string;
  delegateUserId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  isActive: boolean;
  createdAt: Date;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface RequestApprovalInput {
  invoiceId: string;
}

export interface ApproveInput {
  comments?: string;
}

export interface RejectInput {
  reason: string;
}

export interface RequestChangesInput {
  reason: string;
  requestedChanges: string[];
}

export interface CreateDelegationInput {
  delegateUserId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if an invoice has completed all approval levels
 */
export function isFullyApproved(currentLevel: number, totalLevels: number): boolean {
  return currentLevel >= totalLevels;
}

/**
 * Get the next approval level
 */
export function getNextApprovalLevel(currentLevel: number): number {
  return currentLevel + 1;
}

/**
 * Calculate number of approval levels needed based on amount
 */
export function calculateApprovalLevels(amountCents: number): number {
  if (amountCents >= DEFAULT_APPROVAL_THRESHOLDS.level3) {
    return 3;
  }
  if (amountCents >= DEFAULT_APPROVAL_THRESHOLDS.level2) {
    return 2;
  }
  return 1;
}
