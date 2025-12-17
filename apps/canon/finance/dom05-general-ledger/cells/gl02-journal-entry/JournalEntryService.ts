/**
 * GL-02 Journal Entry - Service Implementation
 * 
 * Domain service for journal entry operations.
 * Implements lifecycle, state machine, SoD enforcement, and business rules.
 * 
 * @module GL-02
 */

import {
  JournalEntry,
  JournalEntryLine,
  JournalEntryStatus,
  JournalEntryType,
  CreateJournalEntryInput,
  SubmitForApprovalInput,
  ApproveJournalEntryInput,
  RejectJournalEntryInput,
  ReverseJournalEntryInput,
  JournalEntryFilter,
  JournalEntryRepositoryPort,
  SequencePort,
  AuditOutboxPort,
  PolicyPort,
  PeriodServicePort,
  COAServicePort,
  PostingEnginePort,
  ActorContext,
} from './types';
import { JournalEntryError } from './errors';

// =============================================================================
// State Machine
// =============================================================================

const VALID_TRANSITIONS: Record<JournalEntryStatus, JournalEntryStatus[]> = {
  [JournalEntryStatus.DRAFT]: [JournalEntryStatus.SUBMITTED, JournalEntryStatus.CANCELLED],
  [JournalEntryStatus.SUBMITTED]: [JournalEntryStatus.APPROVED, JournalEntryStatus.REJECTED],
  [JournalEntryStatus.APPROVED]: [JournalEntryStatus.POSTED],
  [JournalEntryStatus.REJECTED]: [JournalEntryStatus.DRAFT, JournalEntryStatus.CANCELLED],
  [JournalEntryStatus.POSTED]: [JournalEntryStatus.CLOSED],
  [JournalEntryStatus.CANCELLED]: [], // Terminal
  [JournalEntryStatus.CLOSED]: [],    // Terminal
};

function canTransition(from: JournalEntryStatus, to: JournalEntryStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Calculate total debits from journal entry lines
 */
function calculateTotalDebit(lines: { debitAmount?: string; creditAmount?: string }[]): string {
  const total = lines.reduce((sum, line) => {
    if (line.debitAmount) {
      return sum + parseFloat(line.debitAmount);
    }
    return sum;
  }, 0);
  return total.toFixed(2);
}

/**
 * Calculate total credits from journal entry lines
 */
function calculateTotalCredit(lines: { debitAmount?: string; creditAmount?: string }[]): string {
  const total = lines.reduce((sum, line) => {
    if (line.creditAmount) {
      return sum + parseFloat(line.creditAmount);
    }
    return sum;
  }, 0);
  return total.toFixed(2);
}

/**
 * Check if entry is balanced
 */
function isBalanced(totalDebit: string, totalCredit: string): boolean {
  const debit = parseFloat(totalDebit);
  const credit = parseFloat(totalCredit);
  // Allow 0.01 tolerance for rounding
  return Math.abs(debit - credit) < 0.01;
}

/**
 * Determine required approver role based on entry amount
 */
function getRequiredApproverRole(totalAmount: number): string {
  if (totalAmount >= 1_000_000) {
    return 'controller,cfo'; // Multi-level approval
  } else if (totalAmount >= 100_000) {
    return 'controller';
  } else if (totalAmount >= 10_000) {
    return 'manager';
  } else {
    return 'senior_accountant';
  }
}

/**
 * Get allowed journal entry types based on period status
 * ⚠️ CRITICAL FIX #7: Enforce entry type restrictions
 */
function getAllowedEntryTypes(periodStatus: string): JournalEntryType[] {
  switch (periodStatus) {
    case 'open':
      // All types allowed during open period
      return [
        JournalEntryType.ADJUSTING,
        JournalEntryType.ACCRUAL,
        JournalEntryType.RECLASSIFICATION,
        JournalEntryType.OPENING,
        JournalEntryType.CLOSING,
        JournalEntryType.REVERSAL,
        JournalEntryType.CORRECTION,
      ];
    
    case 'soft_close':
      // Only adjusting and accrual entries during soft close
      return [
        JournalEntryType.ADJUSTING,
        JournalEntryType.ACCRUAL,
      ];
    
    case 'controlled_reopen':
      // Only correction entries during controlled reopen
      return [
        JournalEntryType.CORRECTION,
      ];
    
    case 'hard_close':
    case 'closed':
    default:
      // No entries allowed
      return [];
  }
}

// =============================================================================
// Service Implementation
// =============================================================================

export class JournalEntryService {
  constructor(
    private readonly repo: JournalEntryRepositoryPort,
    private readonly sequencePort: SequencePort,
    private readonly auditPort: AuditOutboxPort,
    private readonly policyPort: PolicyPort,
    private readonly periodService: PeriodServicePort,
    private readonly coaService: COAServicePort,
    private readonly postingEngine: PostingEnginePort
  ) {}

  // ---------------------------------------------------------------------------
  // Helper: Get Allowed Entry Types (⚠️ CRITICAL FIX #7)
  // ---------------------------------------------------------------------------

  private getAllowedEntryTypes(periodStatus: string): JournalEntryType[] {
    return getAllowedEntryTypes(periodStatus);
  }

  // ---------------------------------------------------------------------------
  // Create Journal Entry (DRAFT)
  // ---------------------------------------------------------------------------

  async create(
    input: CreateJournalEntryInput,
    actor: ActorContext
  ): Promise<JournalEntry> {
    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 1: Business Validations                                   │
    // └─────────────────────────────────────────────────────────────────┘

    // Validate required fields
    if (!input.description || input.description.trim() === '') {
      throw JournalEntryError.descriptionRequired();
    }

    if (!input.reference || input.reference.trim() === '') {
      throw JournalEntryError.referenceRequired();
    }

    // Validate minimum lines
    if (!input.lines || input.lines.length < 2) {
      throw JournalEntryError.minimumLinesRequired(input.lines?.length ?? 0);
    }

    // Validate each line has debit XOR credit
    input.lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const hasDebit = !!line.debitAmount;
      const hasCredit = !!line.creditAmount;

      if (!hasDebit && !hasCredit) {
        throw JournalEntryError.lineDebitCreditMissing(lineNumber);
      }

      if (hasDebit && hasCredit) {
        throw JournalEntryError.lineDebitCreditBoth(lineNumber);
      }
    });

    // Validate auto-reverse + recurring conflict
    if (input.autoReverse && input.isRecurring) {
      throw JournalEntryError.autoReverseRecurringConflict();
    }

    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 2: Compute Totals & Validate Balance                      │
    // └─────────────────────────────────────────────────────────────────┘

    const totalDebit = calculateTotalDebit(input.lines);
    const totalCredit = calculateTotalCredit(input.lines);
    const balanced = isBalanced(totalDebit, totalCredit);

    if (!balanced) {
      throw JournalEntryError.entryNotBalanced(totalDebit, totalCredit);
    }

    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 3: Period Validation (K_TIME) + Entry Type Restriction   │
    // └─────────────────────────────────────────────────────────────────┘

    const periodCheck = await this.periodService.isPeriodOpen(
      input.companyId,
      input.entryDate
    );

    if (!periodCheck.canPost) {
      throw JournalEntryError.periodNotOpen(periodCheck.reason || 'Period is closed');
    }

    // ⚠️ CRITICAL FIX #7: Enforce entry type restrictions based on period status
    // SOFT_CLOSE → only 'adjusting' or 'accrual'
    // CONTROLLED_REOPEN → only 'correction'
    const allowedTypes = this.getAllowedEntryTypes(periodCheck.periodStatus);
    if (!allowedTypes.includes(input.entryType)) {
      throw JournalEntryError.entryTypeNotAllowedInPeriodStatus(
        input.entryType,
        periodCheck.periodStatus,
        allowedTypes
      );
    }

    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 4: Account Validations (GL-01)                            │
    // └─────────────────────────────────────────────────────────────────┘

    for (let i = 0; i < input.lines.length; i++) {
      const line = input.lines[i];
      const lineNumber = i + 1;

      const accountValidation = await this.coaService.validateAccount(
        input.companyId,
        line.accountCode,
        input.entryDate
      );

      if (!accountValidation.valid) {
        throw JournalEntryError.invalidAccountCode(
          line.accountCode,
          lineNumber,
          accountValidation.errorMessage
        );
      }

      // Check if account is postable (not a summary account)
      // Note: GL-01 v1.1 fixed the constraint, so this should work correctly
      if (accountValidation.errorCode === 'ACCOUNT_NOT_POSTABLE') {
        throw JournalEntryError.accountNotPostable(line.accountCode, lineNumber);
      }

      if (accountValidation.errorCode === 'ACCOUNT_NOT_ACTIVE') {
        throw JournalEntryError.accountNotActive(line.accountCode, lineNumber);
      }
    }

    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 5: Generate Entry Number                                  │
    // └─────────────────────────────────────────────────────────────────┘

    const entryNumber = await this.sequencePort.nextSequence(
      actor.tenantId,
      'journal_entry'
    );

    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 6: Create Entry (Transactional)                           │
    // └─────────────────────────────────────────────────────────────────┘

    const entry = await this.repo.create({
      tenantId: actor.tenantId,
      companyId: input.companyId,
      entryNumber,
      entryDate: input.entryDate,
      entryType: input.entryType,
      reference: input.reference,
      description: input.description,
      totalDebit,
      totalCredit,
      currency: 'USD', // TODO: Get from company settings
      isBalanced: balanced,
      status: JournalEntryStatus.DRAFT,
      autoReverse: input.autoReverse ?? false,
      reverseDate: input.reverseDate,
      hasReversal: false,
      isRecurring: input.isRecurring ?? false,
      recurringFrequency: input.recurringSchedule?.frequency,
      recurringStartDate: input.recurringSchedule?.startDate,
      recurringEndDate: input.recurringSchedule?.endDate,
      attachments: [],
      createdBy: actor.userId,
      version: 1,
    });

    // Create lines
    await this.repo.createLines(entry.id, input.lines);

    // Create attachments
    if (input.attachments && input.attachments.length > 0) {
      // Validate attachment sizes
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      input.attachments.forEach((att) => {
        if (att.fileSizeBytes > MAX_SIZE) {
          throw JournalEntryError.attachmentTooLarge(att.filename, att.fileSizeBytes, MAX_SIZE);
        }
      });

      await this.repo.createAttachments(entry.id, input.attachments);
    }

    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 7: Audit Event                                            │
    // └─────────────────────────────────────────────────────────────────┘

    await this.auditPort.writeEvent(
      actor.tenantId,
      'gl.journal.created',
      entry.id,
      'journal_entry',
      {
        entryNumber: entry.entryNumber,
        entryType: entry.entryType,
        totalDebit: entry.totalDebit,
        totalCredit: entry.totalCredit,
        lineCount: input.lines.length,
        createdBy: actor.userId,
      }
    );

    return entry;
  }

  // ---------------------------------------------------------------------------
  // Submit for Approval
  // ---------------------------------------------------------------------------

  async submit(
    input: SubmitForApprovalInput,
    actor: ActorContext
  ): Promise<JournalEntry> {
    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 1: Load Entry                                             │
    // └─────────────────────────────────────────────────────────────────┘

    const entry = await this.repo.findByIdWithLines(input.journalEntryId);
    if (!entry) {
      throw JournalEntryError.entryNotFound(input.journalEntryId);
    }

    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 2: State Machine Validation                               │
    // └─────────────────────────────────────────────────────────────────┘

    if (entry.status !== JournalEntryStatus.DRAFT) {
      throw JournalEntryError.entryNotInDraftStatus(entry.status);
    }

    if (!canTransition(entry.status, JournalEntryStatus.SUBMITTED)) {
      throw JournalEntryError.invalidStateTransition(entry.status, JournalEntryStatus.SUBMITTED);
    }

    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 3: Re-validate Balance & Period                           │
    // └─────────────────────────────────────────────────────────────────┘

    if (!entry.isBalanced) {
      throw JournalEntryError.entryNotBalanced(entry.totalDebit, entry.totalCredit);
    }

    const periodCheck = await this.periodService.isPeriodOpen(
      entry.companyId,
      entry.entryDate
    );

    if (!periodCheck.canPost) {
      throw JournalEntryError.periodClosed(periodCheck.periodName, entry.entryDate);
    }

    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 4: Determine Approval Routing (K_POLICY)                  │
    // └─────────────────────────────────────────────────────────────────┘

    const totalAmount = parseFloat(entry.totalDebit);
    const requiredRole = getRequiredApproverRole(totalAmount);

    // Store approval routing in metadata (for notification service)
    const approvalMetadata = {
      requiredRole,
      totalAmount,
      entryType: entry.entryType,
    };

    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 5: Update Status                                          │
    // └─────────────────────────────────────────────────────────────────┘

    const updated = await this.repo.update(entry.id, {
      status: JournalEntryStatus.SUBMITTED,
      submittedAt: new Date(),
      submittedBy: actor.userId,
      updatedBy: actor.userId,
      updatedAt: new Date(),
      version: entry.version + 1,
    });

    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 6: Audit Event                                            │
    // └─────────────────────────────────────────────────────────────────┘

    await this.auditPort.writeEvent(
      actor.tenantId,
      'gl.journal.submitted',
      entry.id,
      'journal_entry',
      {
        entryNumber: entry.entryNumber,
        submittedBy: actor.userId,
        requiredApproverRole: requiredRole,
        totalAmount,
      }
    );

    // TODO: Emit notification event for approvers

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Approve Journal Entry
  // ---------------------------------------------------------------------------

  async approve(
    input: ApproveJournalEntryInput,
    actor: ActorContext
  ): Promise<JournalEntry> {
    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 1: Load Entry                                             │
    // └─────────────────────────────────────────────────────────────────┘

    const entry = await this.repo.findById(input.journalEntryId);
    if (!entry) {
      throw JournalEntryError.entryNotFound(input.journalEntryId);
    }

    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 2: State Machine Validation                               │
    // └─────────────────────────────────────────────────────────────────┘

    if (entry.status !== JournalEntryStatus.SUBMITTED) {
      throw JournalEntryError.entryNotInSubmittedStatus(entry.status);
    }

    if (!canTransition(entry.status, JournalEntryStatus.APPROVED)) {
      throw JournalEntryError.invalidStateTransition(entry.status, JournalEntryStatus.APPROVED);
    }

    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 3: SoD Enforcement (CRITICAL)                             │
    // └─────────────────────────────────────────────────────────────────┘

    if (entry.createdBy === actor.userId) {
      throw JournalEntryError.approverCannotBeCreator(actor.userId, entry.createdBy);
    }

    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 4: Authorization Check (K_POLICY)                         │
    // └─────────────────────────────────────────────────────────────────┘

    const totalAmount = parseFloat(entry.totalDebit);
    const requiredRole = getRequiredApproverRole(totalAmount);

    const policyCheck = await this.policyPort.evaluate(
      actor.tenantId,
      `journal_entry.approve.${requiredRole}`,
      {
        userId: actor.userId,
        entryAmount: totalAmount,
        entryType: entry.entryType,
      }
    );

    if (!policyCheck.allowed) {
      throw JournalEntryError.approvalNotAuthorized(
        actor.userId,
        entry.totalDebit
      );
    }

    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 5: Re-validate Period (Still Open?)                       │
    // └─────────────────────────────────────────────────────────────────┘

    const periodCheck = await this.periodService.isPeriodOpen(
      entry.companyId,
      entry.entryDate
    );

    if (!periodCheck.canPost) {
      throw JournalEntryError.periodClosed(periodCheck.periodName, entry.entryDate);
    }

    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 6: Update Status → APPROVED                               │
    // └─────────────────────────────────────────────────────────────────┘

    const updated = await this.repo.update(entry.id, {
      status: JournalEntryStatus.APPROVED,
      approvedAt: new Date(),
      approvedBy: actor.userId,
      updatedBy: actor.userId,
      updatedAt: new Date(),
      version: entry.version + 1,
    });

    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 7: Audit Event                                            │
    // └─────────────────────────────────────────────────────────────────┘

    await this.auditPort.writeEvent(
      actor.tenantId,
      'gl.journal.approved',
      entry.id,
      'journal_entry',
      {
        entryNumber: entry.entryNumber,
        approvedBy: actor.userId,
        totalAmount,
      }
    );

    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 8: Queue for Posting (GL-03)                              │
    // └─────────────────────────────────────────────────────────────────┘

    // Async call to posting engine (don't await - fire and forget)
    this.postingEngine.postJournalEntry(entry.id).catch((error) => {
      // Log error but don't fail approval
      console.error(`Failed to post journal entry ${entry.id}:`, error);
      // TODO: Emit alert event
    });

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Reject Journal Entry
  // ---------------------------------------------------------------------------

  async reject(
    input: RejectJournalEntryInput,
    actor: ActorContext
  ): Promise<JournalEntry> {
    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 1: Validate Input                                         │
    // └─────────────────────────────────────────────────────────────────┘

    if (!input.rejectionReason || input.rejectionReason.trim() === '') {
      throw JournalEntryError.rejectionReasonRequired();
    }

    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 2: Load Entry                                             │
    // └─────────────────────────────────────────────────────────────────┘

    const entry = await this.repo.findById(input.journalEntryId);
    if (!entry) {
      throw JournalEntryError.entryNotFound(input.journalEntryId);
    }

    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 3: State Machine Validation                               │
    // └─────────────────────────────────────────────────────────────────┘

    if (entry.status !== JournalEntryStatus.SUBMITTED) {
      throw JournalEntryError.entryNotInSubmittedStatus(entry.status);
    }

    if (!canTransition(entry.status, JournalEntryStatus.REJECTED)) {
      throw JournalEntryError.invalidStateTransition(entry.status, JournalEntryStatus.REJECTED);
    }

    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 4: Update Status → REJECTED                               │
    // └─────────────────────────────────────────────────────────────────┘

    const updated = await this.repo.update(entry.id, {
      status: JournalEntryStatus.REJECTED,
      rejectedAt: new Date(),
      rejectedBy: actor.userId,
      rejectionReason: input.rejectionReason,
      updatedBy: actor.userId,
      updatedAt: new Date(),
      version: entry.version + 1,
    });

    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 5: Audit Event                                            │
    // └─────────────────────────────────────────────────────────────────┘

    await this.auditPort.writeEvent(
      actor.tenantId,
      'gl.journal.rejected',
      entry.id,
      'journal_entry',
      {
        entryNumber: entry.entryNumber,
        rejectedBy: actor.userId,
        rejectionReason: input.rejectionReason,
      }
    );

    // TODO: Emit notification event to creator

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Reverse Journal Entry (Create Reversal)
  // ---------------------------------------------------------------------------

  async reverse(
    input: ReverseJournalEntryInput,
    actor: ActorContext
  ): Promise<JournalEntry> {
    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 1: Load Original Entry                                    │
    // └─────────────────────────────────────────────────────────────────┘

    const originalEntry = await this.repo.findByIdWithLines(input.originalJournalEntryId);
    if (!originalEntry) {
      throw JournalEntryError.entryNotFound(input.originalJournalEntryId);
    }

    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 2: Validate Original Entry is POSTED                      │
    // └─────────────────────────────────────────────────────────────────┘

    if (originalEntry.status !== JournalEntryStatus.POSTED) {
      throw JournalEntryError.entryNotInPostedStatus(originalEntry.status);
    }

    if (originalEntry.hasReversal) {
      throw JournalEntryError.entryAlreadyReversed(
        originalEntry.id,
        originalEntry.reversalEntryId!
      );
    }

    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 3: Validate Reversal Date                                 │
    // └─────────────────────────────────────────────────────────────────┘

    if (input.reversalDate <= originalEntry.entryDate) {
      throw JournalEntryError.reversalDateInvalid(input.reversalDate, originalEntry.entryDate);
    }

    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 4: Create Reversal Entry (Flip Debit/Credit)              │
    // └─────────────────────────────────────────────────────────────────┘

    const reversalLines = originalEntry.lines!.map((line) => ({
      accountCode: line.accountCode,
      // Flip debit/credit
      debitAmount: line.creditAmount,
      creditAmount: line.debitAmount,
      costCenter: line.costCenter,
      department: line.department,
      project: line.project,
      memo: line.memo ? `Reversal: ${line.memo}` : undefined,
    }));

    const reversalEntry = await this.create(
      {
        companyId: originalEntry.companyId,
        entryDate: input.reversalDate,
        entryType: JournalEntryType.REVERSAL,
        reference: `REV-${originalEntry.reference}`,
        description: `Reversal of ${originalEntry.entryNumber}: ${input.reversalReason}`,
        lines: reversalLines,
      },
      actor
    );

    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 5: Link Original → Reversal                               │
    // └─────────────────────────────────────────────────────────────────┘

    await this.repo.update(originalEntry.id, {
      hasReversal: true,
      reversalEntryId: reversalEntry.id,
      updatedBy: actor.userId,
      updatedAt: new Date(),
    });

    await this.repo.update(reversalEntry.id, {
      originalEntryId: originalEntry.id,
    });

    // ┌─────────────────────────────────────────────────────────────────┐
    // │ PHASE 6: Audit Event                                            │
    // └─────────────────────────────────────────────────────────────────┘

    await this.auditPort.writeEvent(
      actor.tenantId,
      'gl.journal.reversal_created',
      reversalEntry.id,
      'journal_entry',
      {
        originalEntryId: originalEntry.id,
        originalEntryNumber: originalEntry.entryNumber,
        reversalEntryNumber: reversalEntry.entryNumber,
        reversalReason: input.reversalReason,
        createdBy: actor.userId,
      }
    );

    return reversalEntry;
  }

  // ---------------------------------------------------------------------------
  // Get Journal Entry by ID
  // ---------------------------------------------------------------------------

  async getById(entryId: string, includeLines = false): Promise<JournalEntry> {
    const entry = includeLines
      ? await this.repo.findByIdWithLines(entryId)
      : await this.repo.findById(entryId);

    if (!entry) {
      throw JournalEntryError.entryNotFound(entryId);
    }

    return entry;
  }

  // ---------------------------------------------------------------------------
  // List Journal Entries (with filters)
  // ---------------------------------------------------------------------------

  async list(filter: JournalEntryFilter): Promise<{ entries: JournalEntry[]; nextPageToken?: string }> {
    return this.repo.list(filter);
  }
}
