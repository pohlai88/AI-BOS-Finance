/**
 * Approval Service
 * 
 * AP-01 Vendor Master Cell - Vendor approval workflow.
 * 
 * Responsibilities:
 * - Approve vendors (submitted → approved)
 * - Reject vendors (submitted → draft)
 * - Suspend vendors (approved → suspended)
 * - Reactivate vendors (suspended → approved)
 * - Archive vendors (approved/suspended → archived)
 * - Enforce Segregation of Duties (SoD)
 * - Emit transactional audit events
 */

import type {
  VendorRepositoryPort,
  Vendor,
  TransactionContext,
  PolicyPort,
  AuditPort,
  AuditEvent,
} from '@aibos/kernel-core';
import type { ActorContext } from '@aibos/canon-governance';
import { VendorStateMachine, IllegalVendorStateTransitionError } from './VendorStateMachine';
import {
  VendorNotFoundError,
  ConcurrencyConflictError,
  SoDViolationError,
  InvalidVendorStatusError,
} from './errors';

// ============================================================================
// 1. TYPES
// ============================================================================

export interface ApprovalResult {
  success: boolean;
  vendor: Vendor;
}

export interface RejectionResult {
  success: boolean;
  vendor: Vendor;
}

// ============================================================================
// 2. SERVICE
// ============================================================================

/**
 * ApprovalService - Manages vendor approval workflow
 */
export class ApprovalService {
  constructor(
    private vendorRepo: VendorRepositoryPort,
    private auditPort: AuditPort,
    private policyPort: PolicyPort
  ) { }

  /**
   * Approve a vendor
   * 
   * @param vendorId - Vendor ID
   * @param actor - Who is approving
   * @param expectedVersion - Expected version (optimistic locking)
   * @returns Approval result
   */
  async approve(
    vendorId: string,
    actor: ActorContext,
    expectedVersion: number
  ): Promise<ApprovalResult> {
    return this.vendorRepo.withTransaction(async (txContext) => {
      // 1. Fetch vendor with version check
      const vendor = await this.vendorRepo.findByIdForUpdate(
        vendorId,
        actor.tenantId,
        txContext
      );

      if (!vendor) {
        throw new VendorNotFoundError(vendorId);
      }

      // 2. Version check (concurrency control)
      if (vendor.version !== expectedVersion) {
        throw new ConcurrencyConflictError(expectedVersion, vendor.version);
      }

      // 3. State machine check
      if (!VendorStateMachine.canTransition(vendor.status, 'approve')) {
        throw new InvalidVendorStatusError(vendor.status, 'approve');
      }

      // 4. SoD check (Maker cannot be Checker)
      const sodResult = await this.policyPort.evaluateSoD(
        vendor.createdBy,
        actor.userId
      );

      if (!sodResult.allowed) {
        throw new SoDViolationError(
          sodResult.reason || `Approver (${actor.userId}) cannot be the same as creator (${vendor.createdBy})`
        );
      }

      // 5. Update status to approved
      // Note: Permission checks are done in BFF layer, not in service
      const nextStatus = VendorStateMachine.getNextStatus(vendor.status, 'approve');
      const updated = await this.vendorRepo.updateStatus(
        vendorId,
        {
          tenantId: actor.tenantId,
          status: nextStatus,
          approvedBy: actor.userId,
          approvedAt: new Date(),
        },
        txContext
      );

      // 6. Emit audit
      const auditEvent: AuditEvent = {
        eventType: 'finance.ap.vendor.approved',
        entityId: vendor.id,
        entityUrn: `urn:finance:vendor:${vendor.id}`,
        actor: {
          userId: actor.userId,
          tenantId: actor.tenantId,
        },
        action: 'approve',
        payload: {
          fromStatus: vendor.status,
          toStatus: nextStatus,
          createdBy: vendor.createdBy,
          approvedBy: actor.userId,
        },
        correlationId: txContext.correlationId,
        timestamp: new Date(),
      };

      await this.auditPort.emitTransactional(auditEvent, txContext);

      return {
        success: true,
        vendor: updated,
      };
    });
  }

  /**
   * Reject a vendor
   * 
   * @param vendorId - Vendor ID
   * @param actor - Who is rejecting
   * @param expectedVersion - Expected version (optimistic locking)
   * @returns Rejection result
   */
  async reject(
    vendorId: string,
    actor: ActorContext,
    expectedVersion: number
  ): Promise<RejectionResult> {
    return this.vendorRepo.withTransaction(async (txContext) => {
      // 1. Fetch vendor
      const vendor = await this.vendorRepo.findByIdForUpdate(
        vendorId,
        actor.tenantId,
        txContext
      );

      if (!vendor) {
        throw new VendorNotFoundError(vendorId);
      }

      // 2. Version check
      if (vendor.version !== expectedVersion) {
        throw new ConcurrencyConflictError(expectedVersion, vendor.version);
      }

      // 3. State machine check
      if (!VendorStateMachine.canTransition(vendor.status, 'reject')) {
        throw new InvalidVendorStatusError(vendor.status, 'reject');
      }

      // 4. Update status to draft
      // Note: Permission checks are done in BFF layer, not in service
      const nextStatus = VendorStateMachine.getNextStatus(vendor.status, 'reject');
      const updated = await this.vendorRepo.updateStatus(
        vendorId,
        {
          tenantId: actor.tenantId,
          status: nextStatus,
        },
        txContext
      );

      // 6. Emit audit
      const auditEvent: AuditEvent = {
        eventType: 'finance.ap.vendor.rejected',
        entityId: vendor.id,
        entityUrn: `urn:finance:vendor:${vendor.id}`,
        actor: {
          userId: actor.userId,
          tenantId: actor.tenantId,
        },
        action: 'reject',
        payload: {
          fromStatus: vendor.status,
          toStatus: nextStatus,
        },
        correlationId: txContext.correlationId,
        timestamp: new Date(),
      };

      await this.auditPort.emitTransactional(auditEvent, txContext);

      return {
        success: true,
        vendor: updated,
      };
    });
  }

  /**
   * Suspend a vendor
   * 
   * @param vendorId - Vendor ID
   * @param actor - Who is suspending
   * @param expectedVersion - Expected version (optimistic locking)
   * @returns Updated vendor
   */
  async suspend(
    vendorId: string,
    actor: ActorContext,
    expectedVersion: number
  ): Promise<Vendor> {
    return this.vendorRepo.withTransaction(async (txContext) => {
      // 1. Fetch vendor
      const vendor = await this.vendorRepo.findByIdForUpdate(
        vendorId,
        actor.tenantId,
        txContext
      );

      if (!vendor) {
        throw new VendorNotFoundError(vendorId);
      }

      // 2. Version check
      if (vendor.version !== expectedVersion) {
        throw new ConcurrencyConflictError(expectedVersion, vendor.version);
      }

      // 3. State machine check
      if (!VendorStateMachine.canTransition(vendor.status, 'suspend')) {
        throw new InvalidVendorStatusError(vendor.status, 'suspend');
      }

      // 4. Update status
      // Note: Permission checks are done in BFF layer, not in service
      const nextStatus = VendorStateMachine.getNextStatus(vendor.status, 'suspend');
      const updated = await this.vendorRepo.updateStatus(
        vendorId,
        {
          tenantId: actor.tenantId,
          status: nextStatus,
        },
        txContext
      );

      // 6. Emit audit
      const auditEvent: AuditEvent = {
        eventType: 'finance.ap.vendor.suspended',
        entityId: vendor.id,
        entityUrn: `urn:finance:vendor:${vendor.id}`,
        actor: {
          userId: actor.userId,
          tenantId: actor.tenantId,
        },
        action: 'suspend',
        payload: {
          fromStatus: vendor.status,
          toStatus: nextStatus,
        },
        correlationId: txContext.correlationId,
        timestamp: new Date(),
      };

      await this.auditPort.emitTransactional(auditEvent, txContext);

      return updated;
    });
  }

  /**
   * Reactivate a vendor
   * 
   * @param vendorId - Vendor ID
   * @param actor - Who is reactivating
   * @param expectedVersion - Expected version (optimistic locking)
   * @returns Updated vendor
   */
  async reactivate(
    vendorId: string,
    actor: ActorContext,
    expectedVersion: number
  ): Promise<Vendor> {
    return this.vendorRepo.withTransaction(async (txContext) => {
      // 1. Fetch vendor
      const vendor = await this.vendorRepo.findByIdForUpdate(
        vendorId,
        actor.tenantId,
        txContext
      );

      if (!vendor) {
        throw new VendorNotFoundError(vendorId);
      }

      // 2. Version check
      if (vendor.version !== expectedVersion) {
        throw new ConcurrencyConflictError(expectedVersion, vendor.version);
      }

      // 3. State machine check
      if (!VendorStateMachine.canTransition(vendor.status, 'reactivate')) {
        throw new InvalidVendorStatusError(vendor.status, 'reactivate');
      }

      // 4. Update status
      // Note: Permission checks are done in BFF layer, not in service
      const nextStatus = VendorStateMachine.getNextStatus(vendor.status, 'reactivate');
      const updated = await this.vendorRepo.updateStatus(
        vendorId,
        {
          tenantId: actor.tenantId,
          status: nextStatus,
        },
        txContext
      );

      // 6. Emit audit
      const auditEvent: AuditEvent = {
        eventType: 'finance.ap.vendor.reactivated',
        entityId: vendor.id,
        entityUrn: `urn:finance:vendor:${vendor.id}`,
        actor: {
          userId: actor.userId,
          tenantId: actor.tenantId,
        },
        action: 'reactivate',
        payload: {
          fromStatus: vendor.status,
          toStatus: nextStatus,
        },
        correlationId: txContext.correlationId,
        timestamp: new Date(),
      };

      await this.auditPort.emitTransactional(auditEvent, txContext);

      return updated;
    });
  }

  /**
   * Archive a vendor
   * 
   * @param vendorId - Vendor ID
   * @param actor - Who is archiving
   * @param expectedVersion - Expected version (optimistic locking)
   * @returns Updated vendor
   */
  async archive(
    vendorId: string,
    actor: ActorContext,
    expectedVersion: number
  ): Promise<Vendor> {
    return this.vendorRepo.withTransaction(async (txContext) => {
      // 1. Fetch vendor
      const vendor = await this.vendorRepo.findByIdForUpdate(
        vendorId,
        actor.tenantId,
        txContext
      );

      if (!vendor) {
        throw new VendorNotFoundError(vendorId);
      }

      // 2. Version check
      if (vendor.version !== expectedVersion) {
        throw new ConcurrencyConflictError(expectedVersion, vendor.version);
      }

      // 3. State machine check
      if (!VendorStateMachine.canTransition(vendor.status, 'archive')) {
        throw new InvalidVendorStatusError(vendor.status, 'archive');
      }

      // 4. Update status
      // Note: Permission checks (including archive permission) are done in BFF layer
      const nextStatus = VendorStateMachine.getNextStatus(vendor.status, 'archive');
      const updated = await this.vendorRepo.updateStatus(
        vendorId,
        {
          tenantId: actor.tenantId,
          status: nextStatus,
        },
        txContext
      );

      // 6. Emit audit
      const auditEvent: AuditEvent = {
        eventType: 'finance.ap.vendor.archived',
        entityId: vendor.id,
        entityUrn: `urn:finance:vendor:${vendor.id}`,
        actor: {
          userId: actor.userId,
          tenantId: actor.tenantId,
        },
        action: 'archive',
        payload: {
          fromStatus: vendor.status,
          toStatus: nextStatus,
        },
        correlationId: txContext.correlationId,
        timestamp: new Date(),
      };

      await this.auditPort.emitTransactional(auditEvent, txContext);

      return updated;
    });
  }
}
