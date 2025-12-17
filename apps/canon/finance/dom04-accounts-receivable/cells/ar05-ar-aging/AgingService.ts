/**
 * AR-05 AR Aging & Collection - Aging Service
 * 
 * Domain service for accounts receivable aging analysis and collection management.
 * Implements snapshot generation, aging bucket calculations, and collection actions.
 * 
 * @module AR-05
 */

import {
  AgingSnapshot,
  CustomerAging,
  InvoiceAging,
  CollectionAction,
  AgingRepositoryPort,
  AgingFilter,
  AgingBucket,
  CollectionActionType,
  CollectionStatus,
} from '@aibos/kernel-core';
import { AgingCellError, AgingErrorCode } from './errors';

// =============================================================================
// Types
// =============================================================================

export interface ActorContext {
  tenantId: string;
  userId: string;
  permissions?: string[];
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

export interface CustomerPort {
  getById(
    id: string,
    tenantId: string
  ): Promise<{
    id: string;
    customerCode: string;
    legalName: string;
  } | null>;
  updateCollectionStatus(
    id: string,
    tenantId: string,
    status: CollectionStatus
  ): Promise<void>;
}

// =============================================================================
// Aging Bucket Calculation
// =============================================================================

/**
 * Calculate aging bucket based on days overdue.
 * Buckets: CURRENT, 1-30, 31-60, 61-90, 91-120, OVER_120
 */
function calculateAgingBucket(daysOverdue: number): AgingBucket {
  if (daysOverdue <= 0) return 'CURRENT';
  if (daysOverdue <= 30) return '1_30';
  if (daysOverdue <= 60) return '31_60';
  if (daysOverdue <= 90) return '61_90';
  if (daysOverdue <= 120) return '91_120';
  return 'OVER_120';
}

/**
 * Determine collection status based on days overdue.
 * Status progression: CURRENT → OVERDUE → COLLECTION
 */
function determineCollectionStatus(
  daysOverdue: number,
  _totalOverdue: number
): CollectionStatus {
  if (daysOverdue <= 0) return 'CURRENT';
  if (daysOverdue <= 90) return 'OVERDUE';
  return 'COLLECTION';
}

// =============================================================================
// Service Implementation
// =============================================================================

export class AgingService {
  constructor(
    private readonly agingRepo: AgingRepositoryPort,
    private readonly auditPort: AuditOutboxPort,
    private readonly customerPort: CustomerPort
  ) {}

  // ---------------------------------------------------------------------------
  // Generate Aging Snapshot
  // ---------------------------------------------------------------------------

  async generateSnapshot(
    asOfDate: Date,
    actor: ActorContext
  ): Promise<AgingSnapshot> {
    const ctx = await this.agingRepo.beginTransaction();

    try {
      // Create snapshot header
      const snapshot = await this.agingRepo.createSnapshot(
        actor.tenantId,
        asOfDate,
        actor.userId,
        ctx
      );

      // Get all outstanding invoices
      const invoices = await this.agingRepo.getOutstandingInvoices(
        actor.tenantId,
        asOfDate,
        ctx
      );

      // Group invoices by customer
      const customerMap = new Map<string, Array<typeof invoices[0]>>();
      for (const inv of invoices) {
        const list = customerMap.get(inv.customerId) || [];
        list.push(inv);
        customerMap.set(inv.customerId, list);
      }

      // Initialize totals
      let totalOutstanding = 0;
      let current = 0;
      let days1to30 = 0;
      let days31to60 = 0;
      let days61to90 = 0;
      let days91to120 = 0;
      let over120Days = 0;

      // Process each customer
      for (const [customerId, custInvoices] of customerMap) {
        const customer = await this.customerPort.getById(
          customerId,
          actor.tenantId
        );
        if (!customer) continue;

        // Initialize customer totals
        let custTotal = 0;
        let custCurrent = 0;
        let cust1to30 = 0;
        let cust31to60 = 0;
        let cust61to90 = 0;
        let cust91to120 = 0;
        let custOver120 = 0;
        let oldestDate = new Date();
        let totalDaysOverdue = 0;

        // Process each invoice for this customer
        for (const inv of custInvoices) {
          const daysOverdue = Math.max(
            0,
            Math.floor(
              (asOfDate.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)
            )
          );
          const bucket = calculateAgingBucket(daysOverdue);

          // Save invoice aging record
          await this.agingRepo.saveInvoiceAging(
            {
              snapshotId: snapshot.id,
              tenantId: actor.tenantId,
              invoiceId: inv.invoiceId,
              invoiceNumber: inv.invoiceNumber,
              customerId,
              invoiceDate: inv.invoiceDate,
              dueDate: inv.dueDate,
              outstandingAmount: inv.outstandingAmount,
              daysOverdue,
              agingBucket: bucket,
            },
            ctx
          );

          // Accumulate customer totals
          custTotal += inv.outstandingAmount;
          totalDaysOverdue += daysOverdue;
          if (inv.invoiceDate < oldestDate) {
            oldestDate = inv.invoiceDate;
          }

          // Accumulate bucket totals
          switch (bucket) {
            case 'CURRENT':
              custCurrent += inv.outstandingAmount;
              break;
            case '1_30':
              cust1to30 += inv.outstandingAmount;
              break;
            case '31_60':
              cust31to60 += inv.outstandingAmount;
              break;
            case '61_90':
              cust61to90 += inv.outstandingAmount;
              break;
            case '91_120':
              cust91to120 += inv.outstandingAmount;
              break;
            case 'OVER_120':
              custOver120 += inv.outstandingAmount;
              break;
          }
        }

        // Calculate average days overdue
        const avgDaysOverdue =
          custInvoices.length > 0
            ? Math.round(totalDaysOverdue / custInvoices.length)
            : 0;

        // Determine collection status
        const collectionStatus = determineCollectionStatus(
          avgDaysOverdue,
          custTotal
        );

        // Save customer aging record
        await this.agingRepo.saveCustomerAging(
          {
            snapshotId: snapshot.id,
            tenantId: actor.tenantId,
            customerId,
            customerCode: customer.customerCode,
            customerName: customer.legalName,
            totalOutstanding: custTotal,
            current: custCurrent,
            days1to30: cust1to30,
            days31to60: cust31to60,
            days61to90: cust61to90,
            days91to120: cust91to120,
            over120Days: custOver120,
            oldestInvoiceDate: oldestDate,
            averageDaysOverdue: avgDaysOverdue,
            collectionStatus,
          },
          ctx
        );

        // Update customer collection status
        await this.customerPort.updateCollectionStatus(
          customerId,
          actor.tenantId,
          collectionStatus
        );

        // Accumulate global totals
        totalOutstanding += custTotal;
        current += custCurrent;
        days1to30 += cust1to30;
        days31to60 += cust31to60;
        days61to90 += cust61to90;
        days91to120 += cust91to120;
        over120Days += custOver120;
      }

      // Commit transaction
      await this.agingRepo.commitTransaction(ctx);

      // Emit audit event
      await this.auditPort.writeEvent(
        actor.tenantId,
        'AGING_SNAPSHOT_GENERATED',
        snapshot.id,
        'AgingSnapshot',
        {
          snapshotDate: asOfDate,
          totalOutstanding,
          customersProcessed: customerMap.size,
          invoicesProcessed: invoices.length,
          generatedBy: actor.userId,
        }
      );

      return {
        ...snapshot,
        totalOutstanding,
        current,
        days1to30,
        days31to60,
        days61to90,
        days91to120,
        over120Days,
      };
    } catch (error) {
      // Rollback on error
      await this.agingRepo.rollbackTransaction(ctx);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Get Latest Snapshot
  // ---------------------------------------------------------------------------

  async getLatestSnapshot(actor: ActorContext): Promise<AgingSnapshot | null> {
    return this.agingRepo.getLatestSnapshot(actor.tenantId);
  }

  // ---------------------------------------------------------------------------
  // Get Snapshot by ID
  // ---------------------------------------------------------------------------

  async getSnapshotById(
    snapshotId: string,
    actor: ActorContext
  ): Promise<AgingSnapshot | null> {
    return this.agingRepo.getSnapshotById(snapshotId, actor.tenantId);
  }

  // ---------------------------------------------------------------------------
  // List Snapshots
  // ---------------------------------------------------------------------------

  async listSnapshots(
    limit: number,
    actor: ActorContext
  ): Promise<AgingSnapshot[]> {
    return this.agingRepo.listSnapshots(actor.tenantId, limit);
  }

  // ---------------------------------------------------------------------------
  // Get Customer Aging
  // ---------------------------------------------------------------------------

  async getCustomerAging(
    snapshotId: string,
    filter: AgingFilter,
    actor: ActorContext
  ): Promise<{ data: CustomerAging[]; total: number }> {
    const snapshot = await this.agingRepo.getSnapshotById(
      snapshotId,
      actor.tenantId
    );
    if (!snapshot) {
      throw new AgingCellError(
        AgingErrorCode.SNAPSHOT_NOT_FOUND,
        `Snapshot not found: ${snapshotId}`,
        { snapshotId }
      );
    }

    return this.agingRepo.getCustomerAging(snapshotId, actor.tenantId, filter);
  }

  // ---------------------------------------------------------------------------
  // Get Invoice Aging
  // ---------------------------------------------------------------------------

  async getInvoiceAging(
    snapshotId: string,
    filter: AgingFilter,
    actor: ActorContext
  ): Promise<{ data: InvoiceAging[]; total: number }> {
    const snapshot = await this.agingRepo.getSnapshotById(
      snapshotId,
      actor.tenantId
    );
    if (!snapshot) {
      throw new AgingCellError(
        AgingErrorCode.SNAPSHOT_NOT_FOUND,
        `Snapshot not found: ${snapshotId}`,
        { snapshotId }
      );
    }

    return this.agingRepo.getInvoiceAging(snapshotId, actor.tenantId, filter);
  }

  // ---------------------------------------------------------------------------
  // Create Collection Action
  // ---------------------------------------------------------------------------

  async createCollectionAction(
    input: {
      customerId: string;
      invoiceId?: string;
      actionType: CollectionActionType;
      description: string;
      followUpDate?: Date;
      assignedTo?: string;
    },
    actor: ActorContext
  ): Promise<CollectionAction> {
    // Validate customer exists
    const customer = await this.customerPort.getById(
      input.customerId,
      actor.tenantId
    );
    if (!customer) {
      throw new AgingCellError(
        AgingErrorCode.CUSTOMER_NOT_FOUND,
        `Customer not found: ${input.customerId}`,
        { customerId: input.customerId }
      );
    }

    // Create collection action
    const action = await this.agingRepo.createCollectionAction({
      tenantId: actor.tenantId,
      customerId: input.customerId,
      invoiceId: input.invoiceId,
      actionType: input.actionType,
      actionDate: new Date(),
      description: input.description,
      followUpDate: input.followUpDate,
      assignedTo: input.assignedTo,
      createdBy: actor.userId,
    });

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'COLLECTION_ACTION_CREATED',
      action.id,
      'CollectionAction',
      {
        customerId: input.customerId,
        invoiceId: input.invoiceId,
        actionType: input.actionType,
        createdBy: actor.userId,
      }
    );

    return action;
  }

  // ---------------------------------------------------------------------------
  // Get Collection Actions
  // ---------------------------------------------------------------------------

  async getCollectionActions(
    customerId: string,
    actor: ActorContext
  ): Promise<CollectionAction[]> {
    // Validate customer exists
    const customer = await this.customerPort.getById(
      customerId,
      actor.tenantId
    );
    if (!customer) {
      throw new AgingCellError(
        AgingErrorCode.CUSTOMER_NOT_FOUND,
        `Customer not found: ${customerId}`,
        { customerId }
      );
    }

    return this.agingRepo.getCollectionActions(customerId, actor.tenantId);
  }

  // ---------------------------------------------------------------------------
  // Update Collection Action
  // ---------------------------------------------------------------------------

  async updateCollectionAction(
    id: string,
    input: { outcome?: string; followUpDate?: Date; version: number },
    actor: ActorContext
  ): Promise<CollectionAction> {
    const updated = await this.agingRepo.updateCollectionAction(
      id,
      actor.tenantId,
      input,
      input.version
    );

    if (!updated) {
      throw new AgingCellError(
        AgingErrorCode.VERSION_CONFLICT,
        'Collection action was modified by another user. Please refresh and try again.',
        { actionId: id, expectedVersion: input.version }
      );
    }

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'COLLECTION_ACTION_UPDATED',
      id,
      'CollectionAction',
      {
        outcome: input.outcome,
        followUpDate: input.followUpDate,
        updatedBy: actor.userId,
      }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Complete Collection Action
  // ---------------------------------------------------------------------------

  async completeCollectionAction(
    id: string,
    input: { outcome: string; version: number },
    actor: ActorContext
  ): Promise<CollectionAction> {
    const updated = await this.agingRepo.updateCollectionAction(
      id,
      actor.tenantId,
      {
        outcome: input.outcome,
        completedAt: new Date(),
        completedBy: actor.userId,
      },
      input.version
    );

    if (!updated) {
      throw new AgingCellError(
        AgingErrorCode.VERSION_CONFLICT,
        'Collection action was modified by another user. Please refresh and try again.',
        { actionId: id, expectedVersion: input.version }
      );
    }

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'COLLECTION_ACTION_COMPLETED',
      id,
      'CollectionAction',
      {
        outcome: input.outcome,
        completedBy: actor.userId,
      }
    );

    return updated;
  }
}
