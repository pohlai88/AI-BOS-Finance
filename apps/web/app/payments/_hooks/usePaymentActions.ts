/**
 * usePaymentActions Hook
 * 
 * @improvement React hook for Server Actions with state management (Next.js 16)
 * @benefit Proper loading/error states, optimistic updates, toast notifications
 */

'use client';

import { useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  type ActionResult,
  submitPaymentAction,
  approvePaymentAction,
  rejectPaymentAction,
  executePaymentAction,
  completePaymentAction,
  failPaymentAction,
  retryPaymentAction,
  batchApproveAction,
} from '../_actions';
import type { BeneficiarySnapshot } from '@/modules/payment/schemas';

// ============================================================================
// TYPES
// ============================================================================

interface PaymentActionOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  successMessage?: string;
  errorMessage?: string;
}

interface UsePaymentActionsReturn {
  isPending: boolean;
  submit: (paymentId: string, version: number, options?: PaymentActionOptions) => Promise<void>;
  approve: (paymentId: string, version: number, comment?: string, options?: PaymentActionOptions) => Promise<void>;
  reject: (paymentId: string, version: number, comment?: string, options?: PaymentActionOptions) => Promise<void>;
  execute: (paymentId: string, version: number, beneficiary: BeneficiarySnapshot, options?: PaymentActionOptions) => Promise<void>;
  complete: (paymentId: string, version: number, bankRef: string, options?: PaymentActionOptions) => Promise<void>;
  fail: (paymentId: string, version: number, reason: string, options?: PaymentActionOptions) => Promise<void>;
  retry: (paymentId: string, version: number, options?: PaymentActionOptions) => Promise<void>;
  batchApprove: (payments: Array<{ id: string; version: number }>, options?: PaymentActionOptions) => Promise<void>;
}

// ============================================================================
// ERROR MESSAGE MAPPING
// ============================================================================

const ERROR_TITLES: Record<string, string> = {
  ConcurrencyConflictError: 'Payment was modified by another user',
  SoDViolationError: 'You cannot approve your own payment',
  IllegalStateTransitionError: 'Invalid action for current status',
  PaymentNotFoundError: 'Payment not found',
  PeriodClosedError: 'Fiscal period is closed',
  PARTIAL_FAILURE: 'Some operations failed',
};

function getErrorMessage(result: ActionResult, fallback: string): string {
  if (result.errorCode && ERROR_TITLES[result.errorCode]) {
    return ERROR_TITLES[result.errorCode];
  }
  return result.error || fallback;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function usePaymentActions(): UsePaymentActionsReturn {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleResult = useCallback(
    (
      result: ActionResult,
      options?: PaymentActionOptions,
      defaultSuccess = 'Action completed',
      defaultError = 'Action failed'
    ) => {
      if (result.success) {
        toast.success(options?.successMessage || defaultSuccess);
        options?.onSuccess?.();
        router.refresh();
      } else {
        const errorMsg = getErrorMessage(result, defaultError);
        toast.error(options?.errorMessage || errorMsg);
        options?.onError?.(errorMsg);
      }
    },
    [router]
  );

  const submit = useCallback(
    async (paymentId: string, version: number, options?: PaymentActionOptions) => {
      startTransition(async () => {
        const result = await submitPaymentAction(paymentId, version);
        handleResult(result, options, 'Payment submitted for approval', 'Failed to submit payment');
      });
    },
    [handleResult]
  );

  const approve = useCallback(
    async (paymentId: string, version: number, comment?: string, options?: PaymentActionOptions) => {
      startTransition(async () => {
        const result = await approvePaymentAction(paymentId, version, comment);
        handleResult(result, options, 'Payment approved', 'Failed to approve payment');
      });
    },
    [handleResult]
  );

  const reject = useCallback(
    async (paymentId: string, version: number, comment?: string, options?: PaymentActionOptions) => {
      startTransition(async () => {
        const result = await rejectPaymentAction(paymentId, version, comment);
        handleResult(result, options, 'Payment rejected', 'Failed to reject payment');
      });
    },
    [handleResult]
  );

  const execute = useCallback(
    async (
      paymentId: string,
      version: number,
      beneficiary: BeneficiarySnapshot,
      options?: PaymentActionOptions
    ) => {
      startTransition(async () => {
        const result = await executePaymentAction(paymentId, version, beneficiary);
        handleResult(result, options, 'Payment sent for execution', 'Failed to execute payment');
      });
    },
    [handleResult]
  );

  const complete = useCallback(
    async (paymentId: string, version: number, bankRef: string, options?: PaymentActionOptions) => {
      startTransition(async () => {
        const result = await completePaymentAction(paymentId, version, bankRef);
        handleResult(result, options, 'Payment completed', 'Failed to complete payment');
      });
    },
    [handleResult]
  );

  const fail = useCallback(
    async (paymentId: string, version: number, reason: string, options?: PaymentActionOptions) => {
      startTransition(async () => {
        const result = await failPaymentAction(paymentId, version, reason);
        handleResult(result, options, 'Payment marked as failed', 'Failed to update payment');
      });
    },
    [handleResult]
  );

  const retry = useCallback(
    async (paymentId: string, version: number, options?: PaymentActionOptions) => {
      startTransition(async () => {
        const result = await retryPaymentAction(paymentId, version);
        handleResult(result, options, 'Payment resubmitted for approval', 'Failed to retry payment');
      });
    },
    [handleResult]
  );

  const batchApprove = useCallback(
    async (payments: Array<{ id: string; version: number }>, options?: PaymentActionOptions) => {
      startTransition(async () => {
        const result = await batchApproveAction(payments);
        handleResult(
          result,
          options,
          `${payments.length} payments approved`,
          'Batch approval failed'
        );
      });
    },
    [handleResult]
  );

  return {
    isPending,
    submit,
    approve,
    reject,
    execute,
    complete,
    fail,
    retry,
    batchApprove,
  };
}
