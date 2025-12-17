/**
 * AP-04: Invoice Approval Workflow — Repository Port
 * 
 * Defines the interface for approval persistence.
 * 
 * OPTIMIZED: Inlined types to avoid circular dependency with cell module.
 */

// ============================================================================
// INLINE TYPES (Avoid circular import from cell module)
// ============================================================================

export type ApprovalDecision = 'pending' | 'approved' | 'rejected' | 'request_changes';

export type ApprovalRole =
  | 'finance_clerk'
  | 'finance_manager'
  | 'department_head'
  | 'project_lead'
  | 'controller'
  | 'cfo';

export interface ApprovalLevelConfig {
  level: number;
  role: ApprovalRole;
  amountThresholdCents?: number;
  description?: string;
}

export interface ApprovalRouteConfig {
  levels: ApprovalLevelConfig[];
  policySource: 'tenant' | 'vendor' | 'category' | 'amount' | 'default';
}

// ============================================================================
// TRANSACTION CONTEXT
// ============================================================================

export interface ApprovalTransactionContext {
  tx: unknown;
  correlationId: string;
}

// ============================================================================
// ENTITIES
// ============================================================================

export interface ApprovalRecord {
  id: string;
  invoiceId: string;
  tenantId: string;
  approvalLevel: number;
  totalLevels: number;
  approverId: string;
  approverRole?: string;
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

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateApprovalInput {
  invoiceId: string;
  tenantId: string;
  approvalLevel: number;
  totalLevels: number;
  approverId: string;
  approverRole?: string;
  decision: ApprovalDecision;
  comments?: string;
  isDelegated?: boolean;
  delegatedFromUserId?: string;
  delegationReason?: string;
}

export interface UpdateApprovalInput {
  tenantId: string;
  decision?: ApprovalDecision;
  comments?: string;
  actionedAt?: Date;
  approverId?: string;
}

export interface CreateRouteInput {
  invoiceId: string;
  tenantId: string;
  totalLevels: number;
  routePolicySource: string;
  routeConfig: ApprovalRouteConfig;
}

export interface UpdateRouteInput {
  tenantId: string;
  isComplete?: boolean;
  completedAt?: Date;
}

// ============================================================================
// REPOSITORY PORT
// ============================================================================

export interface ApprovalRepositoryPort {
  withTransaction<T>(callback: (txContext: ApprovalTransactionContext) => Promise<T>): Promise<T>;

  // Approval operations
  createApproval(input: CreateApprovalInput, txContext: ApprovalTransactionContext): Promise<ApprovalRecord>;
  findApprovalById(id: string, tenantId: string): Promise<ApprovalRecord | null>;
  listApprovalsForInvoice(invoiceId: string, tenantId: string): Promise<ApprovalRecord[]>;
  updateApproval(id: string, input: UpdateApprovalInput, txContext: ApprovalTransactionContext): Promise<ApprovalRecord>;
  listPendingApprovals(approverId: string, tenantId: string, limit?: number, offset?: number): Promise<{ items: ApprovalRecord[]; total: number }>;
  invalidateApprovals(invoiceId: string, tenantId: string, txContext: ApprovalTransactionContext): Promise<void>;

  // Route operations
  createRoute(input: CreateRouteInput, txContext: ApprovalTransactionContext): Promise<ApprovalRoute>;
  findRouteByInvoiceId(invoiceId: string, tenantId: string): Promise<ApprovalRoute | null>;
  updateRoute(id: string, input: UpdateRouteInput, txContext: ApprovalTransactionContext): Promise<ApprovalRoute>;
}
