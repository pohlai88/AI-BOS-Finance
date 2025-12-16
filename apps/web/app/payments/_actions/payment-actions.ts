/**
 * Payment Server Actions
 * 
 * AP-05 Payment Execution Cell - Server Actions for UI mutations.
 * Use these for React UI forms and buttons (progressive enhancement).
 * 
 * @improvement Next.js 16 Server Actions pattern
 * @benefit Auto-revalidation, optimistic updates, progressive enhancement
 * 
 * Usage in components:
 * ```tsx
 * import { approvePaymentAction } from '../_actions/payment-actions';
 * <form action={approvePaymentAction.bind(null, paymentId, version)}>
 *   <button type="submit">Approve</button>
 * </form>
 * ```
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  getPaymentService,
  getApprovalService,
  getExecutionService,
  getActorContext,
} from '@/lib/payment-services.server';
import type { BeneficiarySnapshot } from '@/modules/payment/schemas';

// ============================================================================
// RESULT TYPES
// ============================================================================

export interface ActionResult {
  success: boolean;
  error?: string;
  errorCode?: string;
}

// ============================================================================
// CREATE PAYMENT
// ============================================================================

export async function createPaymentAction(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await getActorContext();
    const service = await getPaymentService();

    const idempotencyKey = crypto.randomUUID();

    await service.create(
      {
        vendorId: formData.get('vendorId') as string,
        vendorName: formData.get('vendorName') as string,
        amount: formData.get('amount') as string,
        currency: (formData.get('currency') as string) || 'USD',
        paymentDate: new Date(formData.get('paymentDate') as string),
        dueDate: formData.get('dueDate')
          ? new Date(formData.get('dueDate') as string)
          : undefined,
        sourceDocumentId: formData.get('sourceDocumentId') as string | undefined,
        sourceDocumentType: formData.get('sourceDocumentType') as
          | 'invoice'
          | 'tax'
          | 'payroll'
          | undefined,
      },
      actor,
      idempotencyKey
    );

    revalidatePath('/payments');
    return { success: true };
  } catch (error) {
    console.error('createPaymentAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment',
      errorCode: error instanceof Error ? error.name : 'UNKNOWN',
    };
  }
}

// ============================================================================
// SUBMIT FOR APPROVAL
// ============================================================================

export async function submitPaymentAction(
  paymentId: string,
  version: number
): Promise<ActionResult> {
  try {
    const actor = await getActorContext();
    const service = await getExecutionService();

    await service.submit(paymentId, actor, version);

    revalidatePath('/payments');
    revalidatePath(`/payments/${paymentId}`);
    return { success: true };
  } catch (error) {
    console.error('submitPaymentAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit payment',
      errorCode: error instanceof Error ? error.name : 'UNKNOWN',
    };
  }
}

// ============================================================================
// APPROVE PAYMENT
// ============================================================================

export async function approvePaymentAction(
  paymentId: string,
  version: number,
  comment?: string
): Promise<ActionResult> {
  try {
    const actor = await getActorContext();
    const service = await getApprovalService();

    await service.approve(paymentId, actor, version, comment);

    revalidatePath('/payments');
    revalidatePath(`/payments/${paymentId}`);
    return { success: true };
  } catch (error) {
    console.error('approvePaymentAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve payment',
      errorCode: error instanceof Error ? error.name : 'UNKNOWN',
    };
  }
}

// ============================================================================
// REJECT PAYMENT
// ============================================================================

export async function rejectPaymentAction(
  paymentId: string,
  version: number,
  comment?: string
): Promise<ActionResult> {
  try {
    const actor = await getActorContext();
    const service = await getApprovalService();

    await service.reject(paymentId, actor, version, comment);

    revalidatePath('/payments');
    revalidatePath(`/payments/${paymentId}`);
    return { success: true };
  } catch (error) {
    console.error('rejectPaymentAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject payment',
      errorCode: error instanceof Error ? error.name : 'UNKNOWN',
    };
  }
}

// ============================================================================
// EXECUTE PAYMENT
// ============================================================================

export async function executePaymentAction(
  paymentId: string,
  version: number,
  beneficiary: BeneficiarySnapshot
): Promise<ActionResult> {
  try {
    const actor = await getActorContext();
    const service = await getExecutionService();

    await service.execute(paymentId, actor, version, beneficiary);

    revalidatePath('/payments');
    revalidatePath(`/payments/${paymentId}`);
    return { success: true };
  } catch (error) {
    console.error('executePaymentAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute payment',
      errorCode: error instanceof Error ? error.name : 'UNKNOWN',
    };
  }
}

// ============================================================================
// COMPLETE PAYMENT
// ============================================================================

export async function completePaymentAction(
  paymentId: string,
  version: number,
  bankConfirmationRef: string
): Promise<ActionResult> {
  try {
    const actor = await getActorContext();
    const service = await getExecutionService();

    await service.complete(paymentId, actor, version, bankConfirmationRef);

    revalidatePath('/payments');
    revalidatePath(`/payments/${paymentId}`);
    return { success: true };
  } catch (error) {
    console.error('completePaymentAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete payment',
      errorCode: error instanceof Error ? error.name : 'UNKNOWN',
    };
  }
}

// ============================================================================
// FAIL PAYMENT
// ============================================================================

export async function failPaymentAction(
  paymentId: string,
  version: number,
  failureReason: string
): Promise<ActionResult> {
  try {
    const actor = await getActorContext();
    const service = await getExecutionService();

    await service.fail(paymentId, actor, version, failureReason);

    revalidatePath('/payments');
    revalidatePath(`/payments/${paymentId}`);
    return { success: true };
  } catch (error) {
    console.error('failPaymentAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark payment as failed',
      errorCode: error instanceof Error ? error.name : 'UNKNOWN',
    };
  }
}

// ============================================================================
// RETRY PAYMENT
// ============================================================================

export async function retryPaymentAction(
  paymentId: string,
  version: number
): Promise<ActionResult> {
  try {
    const actor = await getActorContext();
    const service = await getExecutionService();

    await service.retry(paymentId, actor, version);

    revalidatePath('/payments');
    revalidatePath(`/payments/${paymentId}`);
    return { success: true };
  } catch (error) {
    console.error('retryPaymentAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retry payment',
      errorCode: error instanceof Error ? error.name : 'UNKNOWN',
    };
  }
}

// ============================================================================
// BATCH ACTIONS
// ============================================================================

export async function batchApproveAction(
  payments: Array<{ id: string; version: number }>
): Promise<ActionResult> {
  try {
    const actor = await getActorContext();
    const service = await getApprovalService();

    const results = await Promise.allSettled(
      payments.map(({ id, version }) => service.approve(id, actor, version))
    );

    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      return {
        success: false,
        error: `${failed.length} of ${payments.length} approvals failed`,
        errorCode: 'PARTIAL_FAILURE',
      };
    }

    revalidatePath('/payments');
    return { success: true };
  } catch (error) {
    console.error('batchApproveAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Batch approval failed',
      errorCode: error instanceof Error ? error.name : 'UNKNOWN',
    };
  }
}
