/**
 * useAudit - Standardized Audit Logging Hook
 *
 * Sprint E6: Governance Layer
 * Provides a consistent API for audit logging across components.
 *
 * @example
 * const audit = useAudit('invoice');
 *
 * // On create
 * audit.create(newInvoice);
 *
 * // On update
 * audit.update(invoiceId, oldValue, newValue);
 *
 * // On delete
 * audit.delete(invoiceId, deletedInvoice);
 *
 * // On state change
 * audit.stateChange(invoiceId, 'draft', 'submitted');
 */

'use client';

import * as React from 'react';
import { usePermissions, type BioAuditEvent, type BioDocumentState } from './BioPermissionProvider';

// ============================================================
// Types
// ============================================================

export interface AuditActions {
  /** Log a create action */
  create: (newValue: unknown, metadata?: Record<string, unknown>) => void;
  /** Log a read/view action */
  read: (resourceId: string, metadata?: Record<string, unknown>) => void;
  /** Log an update action */
  update: (resourceId: string, previousValue: unknown, newValue: unknown, metadata?: Record<string, unknown>) => void;
  /** Log a delete action */
  delete: (resourceId: string, deletedValue: unknown, metadata?: Record<string, unknown>) => void;
  /** Log a submit action */
  submit: (resourceId: string, metadata?: Record<string, unknown>) => void;
  /** Log an approve action */
  approve: (resourceId: string, metadata?: Record<string, unknown>) => void;
  /** Log a reject action */
  reject: (resourceId: string, reason?: string, metadata?: Record<string, unknown>) => void;
  /** Log a state change */
  stateChange: (resourceId: string, fromState: BioDocumentState, toState: BioDocumentState, metadata?: Record<string, unknown>) => void;
  /** Log a custom action */
  custom: (action: string, resourceId?: string, data?: unknown, metadata?: Record<string, unknown>) => void;
}

// ============================================================
// Hook
// ============================================================

/**
 * Hook for standardized audit logging
 *
 * @param resource - Resource type (e.g., 'invoice', 'payment', 'employee')
 * @returns Audit action methods
 */
export function useAudit(resource: string): AuditActions {
  const { audit } = usePermissions();

  const create = React.useCallback(
    (newValue: unknown, metadata?: Record<string, unknown>) => {
      audit({
        action: 'create',
        resource,
        newValue,
        metadata,
      });
    },
    [audit, resource]
  );

  const read = React.useCallback(
    (resourceId: string, metadata?: Record<string, unknown>) => {
      audit({
        action: 'read',
        resource,
        resourceId,
        metadata,
      });
    },
    [audit, resource]
  );

  const update = React.useCallback(
    (
      resourceId: string,
      previousValue: unknown,
      newValue: unknown,
      metadata?: Record<string, unknown>
    ) => {
      audit({
        action: 'update',
        resource,
        resourceId,
        previousValue,
        newValue,
        metadata,
      });
    },
    [audit, resource]
  );

  const deleteAction = React.useCallback(
    (resourceId: string, deletedValue: unknown, metadata?: Record<string, unknown>) => {
      audit({
        action: 'delete',
        resource,
        resourceId,
        previousValue: deletedValue,
        metadata,
      });
    },
    [audit, resource]
  );

  const submit = React.useCallback(
    (resourceId: string, metadata?: Record<string, unknown>) => {
      audit({
        action: 'submit',
        resource,
        resourceId,
        metadata,
      });
    },
    [audit, resource]
  );

  const approve = React.useCallback(
    (resourceId: string, metadata?: Record<string, unknown>) => {
      audit({
        action: 'approve',
        resource,
        resourceId,
        metadata,
      });
    },
    [audit, resource]
  );

  const reject = React.useCallback(
    (resourceId: string, reason?: string, metadata?: Record<string, unknown>) => {
      audit({
        action: 'reject',
        resource,
        resourceId,
        metadata: { ...metadata, reason },
      });
    },
    [audit, resource]
  );

  const stateChange = React.useCallback(
    (
      resourceId: string,
      fromState: BioDocumentState,
      toState: BioDocumentState,
      metadata?: Record<string, unknown>
    ) => {
      audit({
        action: 'custom',
        resource,
        resourceId,
        previousValue: fromState,
        newValue: toState,
        metadata: { ...metadata, type: 'state_change' },
      });
    },
    [audit, resource]
  );

  const custom = React.useCallback(
    (action: string, resourceId?: string, data?: unknown, metadata?: Record<string, unknown>) => {
      audit({
        action: 'custom',
        resource,
        resourceId,
        newValue: data,
        metadata: { ...metadata, customAction: action },
      });
    },
    [audit, resource]
  );

  return {
    create,
    read,
    update,
    delete: deleteAction,
    submit,
    approve,
    reject,
    stateChange,
    custom,
  };
}
