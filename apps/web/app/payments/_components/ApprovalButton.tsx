/**
 * ApprovalButton Component
 * 
 * @improvement Server Action-powered approval button (Next.js 16)
 * @benefit Progressive enhancement, automatic pending state
 */

'use client';

import { useTransition } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { approvePaymentAction, rejectPaymentAction } from '../_actions';

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

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant === 'approve' ? 'default' : 'destructive'}
            size="icon"
            onClick={handleClick}
            disabled={disabled || isPending}
            className="h-8 w-8"
          >
            <Icon className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {variant === 'approve' ? 'Approve payment' : 'Reject payment'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
