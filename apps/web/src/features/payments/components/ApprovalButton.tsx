/**
 * ApprovalButton Component
 * 
 * @improvement Server Action-powered approval button (Next.js 16)
 * @benefit Progressive enhancement, automatic pending state
 */

'use client';

import { useTransition } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { Btn } from '@aibos/bioskin';
import { toast } from 'sonner';
import { approvePaymentAction, rejectPaymentAction } from '@/app/payments/_actions';

interface ApprovalButtonProps {
  paymentId: string;
  version: number;
  variant: 'approve' | 'reject';
  disabled?: boolean;
  onComplete?: () => void;
}

export function ApprovalButton({
  paymentId,
  version,
  variant,
  disabled,
  onComplete,
}: ApprovalButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const action = variant === 'approve' ? approvePaymentAction : rejectPaymentAction;
      const result = await action(paymentId, version);

      if (result.success) {
        toast.success(variant === 'approve' ? 'Payment approved' : 'Payment rejected');
        onComplete?.();
      } else {
        toast.error(result.error || `Failed to ${variant} payment`);
      }
    });
  };

  const Icon = isPending ? Loader2 : variant === 'approve' ? Check : X;
  const tooltipText = variant === 'approve' ? 'Approve payment' : 'Reject payment';

  return (
    <Btn
      variant={variant === 'approve' ? 'primary' : 'danger'}
      size="sm"
      onClick={handleClick}
      disabled={disabled || isPending}
      loading={isPending}
      className="h-8 w-8 p-0"
      title={tooltipText}
      aria-label={tooltipText}
    >
      <Icon className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
    </Btn>
  );
}
