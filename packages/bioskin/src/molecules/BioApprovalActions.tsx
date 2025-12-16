/**
 * BioApprovalActions - Document Approval Workflow UI
 *
 * Sprint E6+: Access Control 100%
 * Provides Approve, Reject, Return to Draft buttons with permission-aware rendering.
 *
 * @example
 * <BioApprovalActions
 *   state="submitted"
 *   onApprove={() => approveInvoice(id)}
 *   onReject={(reason) => rejectInvoice(id, reason)}
 *   onReturn={() => returnToDraft(id)}
 * />
 */

'use client';

import * as React from 'react';
import { Check, X, RotateCcw, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '../atoms/utils';
import { usePermissions, type BioDocumentState } from '../providers/BioPermissionProvider';

// ============================================================
// Types
// ============================================================

export interface BioApprovalActionsProps {
  /** Current document state */
  state: BioDocumentState;
  /** Called when document is approved */
  onApprove?: () => void | Promise<void>;
  /** Called when document is rejected (with optional reason) */
  onReject?: (reason?: string) => void | Promise<void>;
  /** Called when document is returned to draft */
  onReturn?: () => void | Promise<void>;
  /** Called when document is cancelled */
  onCancel?: () => void | Promise<void>;
  /** Called when document is resubmitted */
  onResubmit?: () => void | Promise<void>;
  /** Loading state */
  loading?: boolean;
  /** Disable all actions */
  disabled?: boolean;
  /** Require reason for rejection */
  requireRejectReason?: boolean;
  /** Placeholder for rejection reason input */
  rejectReasonPlaceholder?: string;
  /** Custom class name */
  className?: string;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
}

// ============================================================
// Component
// ============================================================

export function BioApprovalActions({
  state,
  onApprove,
  onReject,
  onReturn,
  onCancel,
  onResubmit,
  loading = false,
  disabled = false,
  requireRejectReason = false,
  rejectReasonPlaceholder = 'Enter reason for rejection...',
  className,
  size = 'md',
  direction = 'horizontal',
}: BioApprovalActionsProps) {
  const { canActInState, canTransition, audit } = usePermissions();
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState('');
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  };

  const iconSize = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  // Handle async action with loading state
  const handleAction = async (
    actionName: string,
    handler?: () => void | Promise<void>
  ) => {
    if (!handler || loading || disabled) return;

    setActionLoading(actionName);
    try {
      await handler();
      audit({
        action: actionName === 'approve' ? 'approve' : actionName === 'reject' ? 'reject' : 'custom',
        resource: 'document',
        metadata: { fromState: state, action: actionName },
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle rejection with reason
  const handleReject = async () => {
    if (requireRejectReason && !rejectReason.trim()) return;

    setActionLoading('reject');
    try {
      await onReject?.(rejectReason || undefined);
      audit({
        action: 'reject',
        resource: 'document',
        metadata: { fromState: state, reason: rejectReason },
      });
      setShowRejectDialog(false);
      setRejectReason('');
    } finally {
      setActionLoading(null);
    }
  };

  // Button base classes
  const buttonBase = cn(
    'inline-flex items-center justify-center rounded-md font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:pointer-events-none',
    sizeClasses[size]
  );

  // Render action buttons based on state
  const renderActions = () => {
    const buttons: React.ReactNode[] = [];

    // DRAFT state: Submit (handled elsewhere), Cancel
    if (state === 'draft') {
      if (canActInState('draft', 'delete') && onCancel) {
        buttons.push(
          <button
            key="cancel"
            onClick={() => handleAction('cancel', onCancel)}
            disabled={disabled || loading || actionLoading !== null}
            className={cn(buttonBase, 'bg-red-50 text-red-700 hover:bg-red-100')}
            aria-label="Cancel document"
          >
            {actionLoading === 'cancel' ? (
              <Loader2 size={iconSize[size]} className="animate-spin" />
            ) : (
              <X size={iconSize[size]} />
            )}
            Cancel
          </button>
        );
      }
    }

    // SUBMITTED state: Approve, Reject, Return
    if (state === 'submitted') {
      if (canActInState('submitted', 'approve') && onApprove) {
        buttons.push(
          <button
            key="approve"
            onClick={() => handleAction('approve', onApprove)}
            disabled={disabled || loading || actionLoading !== null}
            className={cn(buttonBase, 'bg-green-600 text-white hover:bg-green-700')}
            aria-label="Approve document"
          >
            {actionLoading === 'approve' ? (
              <Loader2 size={iconSize[size]} className="animate-spin" />
            ) : (
              <Check size={iconSize[size]} />
            )}
            Approve
          </button>
        );
      }

      if (canActInState('submitted', 'reject') && onReject) {
        buttons.push(
          <button
            key="reject"
            onClick={() =>
              requireRejectReason ? setShowRejectDialog(true) : handleAction('reject', () => onReject())
            }
            disabled={disabled || loading || actionLoading !== null}
            className={cn(buttonBase, 'bg-red-600 text-white hover:bg-red-700')}
            aria-label="Reject document"
          >
            {actionLoading === 'reject' ? (
              <Loader2 size={iconSize[size]} className="animate-spin" />
            ) : (
              <X size={iconSize[size]} />
            )}
            Reject
          </button>
        );
      }

      if (canTransition('submitted', 'draft') && onReturn) {
        buttons.push(
          <button
            key="return"
            onClick={() => handleAction('return', onReturn)}
            disabled={disabled || loading || actionLoading !== null}
            className={cn(buttonBase, 'bg-gray-100 text-gray-700 hover:bg-gray-200')}
            aria-label="Return to draft"
          >
            {actionLoading === 'return' ? (
              <Loader2 size={iconSize[size]} className="animate-spin" />
            ) : (
              <RotateCcw size={iconSize[size]} />
            )}
            Return to Draft
          </button>
        );
      }
    }

    // REJECTED state: Resubmit
    if (state === 'rejected') {
      if (canTransition('rejected', 'draft') && onResubmit) {
        buttons.push(
          <button
            key="resubmit"
            onClick={() => handleAction('resubmit', onResubmit)}
            disabled={disabled || loading || actionLoading !== null}
            className={cn(buttonBase, 'bg-blue-600 text-white hover:bg-blue-700')}
            aria-label="Resubmit document"
          >
            {actionLoading === 'resubmit' ? (
              <Loader2 size={iconSize[size]} className="animate-spin" />
            ) : (
              <RotateCcw size={iconSize[size]} />
            )}
            Resubmit
          </button>
        );
      }
    }

    // APPROVED state: Cancel (if allowed)
    if (state === 'approved') {
      if (canActInState('approved', 'cancel') && onCancel) {
        buttons.push(
          <button
            key="cancel"
            onClick={() => handleAction('cancel', onCancel)}
            disabled={disabled || loading || actionLoading !== null}
            className={cn(buttonBase, 'bg-red-50 text-red-700 hover:bg-red-100')}
            aria-label="Cancel approved document"
          >
            {actionLoading === 'cancel' ? (
              <Loader2 size={iconSize[size]} className="animate-spin" />
            ) : (
              <X size={iconSize[size]} />
            )}
            Cancel
          </button>
        );
      }
    }

    return buttons;
  };

  const actions = renderActions();

  if (actions.length === 0) {
    return null; // No actions available for this state/permissions
  }

  return (
    <>
      <div
        className={cn(
          'flex',
          direction === 'horizontal' ? 'flex-row gap-2' : 'flex-col gap-2',
          className
        )}
        data-testid="bio-approval-actions"
        data-state={state}
      >
        {actions}
      </div>

      {/* Rejection reason dialog */}
      {showRejectDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-dialog-title"
        >
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 id="reject-dialog-title" className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare size={20} />
              Rejection Reason
            </h3>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={rejectReasonPlaceholder}
              className="w-full h-32 p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Rejection reason"
              autoFocus
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectReason('');
                }}
                className={cn(buttonBase, 'bg-gray-100 text-gray-700 hover:bg-gray-200')}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={requireRejectReason && !rejectReason.trim()}
                className={cn(buttonBase, 'bg-red-600 text-white hover:bg-red-700')}
              >
                {actionLoading === 'reject' ? (
                  <Loader2 size={iconSize[size]} className="animate-spin" />
                ) : (
                  <X size={iconSize[size]} />
                )}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// Component Meta
// ============================================================

export const COMPONENT_META = {
  code: 'BIOSKIN_BioApprovalActions',
  version: '1.0.0',
  layer: 'molecules',
  family: 'GOVERNANCE',
  status: 'stable',
} as const;
