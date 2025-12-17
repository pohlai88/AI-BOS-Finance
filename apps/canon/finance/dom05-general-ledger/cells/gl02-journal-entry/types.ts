/**
 * GL-02 Journal Entry - Type Definitions
 * 
 * Domain types for journal entry operations.
 * 
 * @module GL-02
 */

// =============================================================================
// Enums
// =============================================================================

export enum JournalEntryType {
  ADJUSTING = 'adjusting',
  ACCRUAL = 'accrual',
  RECLASSIFICATION = 'reclassification',
  OPENING = 'opening',
  CLOSING = 'closing',
  REVERSAL = 'reversal',
  CORRECTION = 'correction',
}

export enum JournalEntryStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  POSTED = 'posted',
  CANCELLED = 'cancelled',
  CLOSED = 'closed',
}

// =============================================================================
// Core Domain Entities
// =============================================================================

export interface JournalEntry {
  // Identity
  id: string;
  tenantId: string;
  companyId: string;

  // Entry Metadata
  entryNumber: string;
  entryDate: Date;
  entryType: JournalEntryType;
  reference: string;
  description: string;

  // Amounts
  totalDebit: string;
  totalCredit: string;
  currency: string;
  isBalanced: boolean;

  // Lifecycle
  status: JournalEntryStatus;

  // Reversal Handling
  autoReverse: boolean;
  reverseDate?: Date;
  originalEntryId?: string;
  hasReversal: boolean;
  reversalEntryId?: string;

  // Recurring
  isRecurring: boolean;
  recurringFrequency?: 'monthly' | 'quarterly' | 'yearly';
  recurringStartDate?: Date;
  recurringEndDate?: Date;

  // Workflow
  submittedAt?: Date;
  submittedBy?: string;
  approvedAt?: Date;
  approvedBy?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  rejectionReason?: string;
  postedAt?: Date;
  postedBy?: string;
  glPostingReference?: string;

  // Attachments
  attachments: JournalEntryAttachment[];

  // Audit
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
  version: number;

  // Relations (loaded optionally)
  lines?: JournalEntryLine[];
}

export interface JournalEntryLine {
  id: string;
  journalEntryId: string;
  lineNumber: number;

  accountCode: string;
  accountName: string;

  debitAmount?: string;
  creditAmount?: string;

  costCenter?: string;
  department?: string;
  project?: string;

  memo?: string;

  createdAt: Date;
}

export interface JournalEntryAttachment {
  id: string;
  journalEntryId: string;
  filename: string;
  fileUrl: string;
  fileType: string;
  fileSizeBytes: number;
  uploadedBy: string;
  uploadedAt: Date;
}

// =============================================================================
// Input DTOs
// =============================================================================

export interface CreateJournalEntryInput {
  companyId: string;
  entryDate: Date;
  entryType: JournalEntryType;
  reference: string;
  description: string;

  lines: CreateJournalEntryLineInput[];

  isRecurring?: boolean;
  recurringSchedule?: {
    frequency: 'monthly' | 'quarterly' | 'yearly';
    startDate: Date;
    endDate?: Date;
  };

  autoReverse?: boolean;
  reverseDate?: Date;

  attachments?: CreateAttachmentInput[];
  tags?: string[];
}

export interface CreateJournalEntryLineInput {
  accountCode: string;
  debitAmount?: string;
  creditAmount?: string;
  costCenter?: string;
  department?: string;
  project?: string;
  memo?: string;
}

export interface CreateAttachmentInput {
  filename: string;
  fileUrl: string;
  fileType: string;
  fileSizeBytes: number;
}

export interface SubmitForApprovalInput {
  journalEntryId: string;
  submissionNotes?: string;
}

export interface ApproveJournalEntryInput {
  journalEntryId: string;
  approvalNotes?: string;
}

export interface RejectJournalEntryInput {
  journalEntryId: string;
  rejectionReason: string;
  suggestedChanges?: string;
}

export interface ReverseJournalEntryInput {
  originalJournalEntryId: string;
  reversalDate: Date;
  reversalReason: string;
}

// =============================================================================
// Filter/Query DTOs
// =============================================================================

export interface JournalEntryFilter {
  companyId?: string;
  status?: JournalEntryStatus[];
  entryType?: JournalEntryType[];
  entryDateFrom?: Date;
  entryDateTo?: Date;
  createdBy?: string;
  approvedBy?: string;
  searchTerm?: string;
  pageSize?: number;
  pageToken?: string;
}

// =============================================================================
// Repository Port
// =============================================================================

export interface JournalEntryRepositoryPort {
  create(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry>;
  findById(id: string): Promise<JournalEntry | null>;
  findByIdWithLines(id: string): Promise<JournalEntry | null>;
  update(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry>;
  list(filter: JournalEntryFilter): Promise<{ entries: JournalEntry[]; nextPageToken?: string }>;
  
  // Line operations
  createLines(journalEntryId: string, lines: CreateJournalEntryLineInput[]): Promise<JournalEntryLine[]>;
  
  // Attachment operations
  createAttachments(journalEntryId: string, attachments: CreateAttachmentInput[]): Promise<JournalEntryAttachment[]>;
}

// =============================================================================
// Kernel Ports
// =============================================================================

export interface SequencePort {
  nextSequence(tenantId: string, sequenceType: string): Promise<string>;
}

export interface AuditOutboxPort {
  writeEvent(
    tenantId: string,
    eventType: string,
    aggregateId: string,
    aggregateType: string,
    payload: Record<string, unknown>
  ): Promise<void>;
}

export interface PolicyPort {
  evaluate(
    tenantId: string,
    policyCode: string,
    context: Record<string, unknown>
  ): Promise<{ allowed: boolean; reason?: string }>;
}

export interface PeriodServicePort {
  isPeriodOpen(companyId: string, date: Date): Promise<{ 
    canPost: boolean; 
    periodName: string; 
    periodStatus: string;  // ⚠️ CRITICAL FIX #7: Need period status for entry type validation
    reason?: string;
  }>;
}

export interface COAServicePort {
  validateAccount(companyId: string, accountCode: string, postingDate: Date): Promise<{
    valid: boolean;
    accountId?: string;
    accountType?: string;
    normalBalance?: 'debit' | 'credit';
    errorCode?: string;
    errorMessage?: string;
  }>;
}

export interface PostingEnginePort {
  postJournalEntry(journalEntryId: string): Promise<{ posted: boolean; postingReference?: string; error?: string }>;
}

// =============================================================================
// Actor Context
// =============================================================================

export interface ActorContext {
  tenantId: string;
  userId: string;
  permissions?: string[];
}
