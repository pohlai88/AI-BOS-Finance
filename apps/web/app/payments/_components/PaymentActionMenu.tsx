/**
 * PaymentActionMenu Component
 * 
 * @improvement Server Action-powered dropdown menu (Next.js 16)
 * @benefit Context-aware actions based on payment status
 */

'use client';

import { useTransition, useState } from 'react';
import {
  MoreHorizontal,
  Send,
  Check,
  X,
  Play,
  CheckCircle,
  XCircle,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  submitPaymentAction,
  approvePaymentAction,
  rejectPaymentAction,
  retryPaymentAction,
} from '../_actions';

interface PaymentActionMenuProps {
  paymentId: string;
  version: number;
  status: string;
  createdBy?: string;
  currentUserId?: string;
  onActionComplete?: () => void;
}

// Define available actions per status
const STATUS_ACTIONS: Record<string, string[]> = {
  draft: ['submit'],
  pending_approval: ['approve', 'reject'],
  approved: [], // Execute is typically system-triggered
  rejected: [], // Terminal
  processing: [], // Waiting for bank
  completed: [], // Terminal
  failed: ['retry'],
};

export function PaymentActionMenu({
  paymentId,
  version,
  status,
  createdBy,
  currentUserId,
  onActionComplete,
}: PaymentActionMenuProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const availableActions = STATUS_ACTIONS[status] || [];

  // Check SoD - cannot approve own payment
  const canApprove = createdBy !== currentUserId;

  const executeAction = async (action: string) => {
    setOpen(false);

    startTransition(async () => {
      let result;
      let successMsg: string;

      switch (action) {
        case 'submit':
          result = await submitPaymentAction(paymentId, version);
          successMsg = 'Payment submitted for approval';
          break;
        case 'approve':
          result = await approvePaymentAction(paymentId, version);
          successMsg = 'Payment approved';
          break;
        case 'reject':
          result = await rejectPaymentAction(paymentId, version);
          successMsg = 'Payment rejected';
          break;
        case 'retry':
          result = await retryPaymentAction(paymentId, version);
          successMsg = 'Payment resubmitted for approval';
          break;
        default:
          return;
      }

      if (result.success) {
        toast.success(successMsg);
        onActionComplete?.();
      } else {
        toast.error(result.error || `Failed to ${action} payment`);
      }
    });
  };

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {availableActions.includes('submit') && (
          <DropdownMenuItem onClick={() => executeAction('submit')}>
            <Send className="mr-2 h-4 w-4" />
            Submit for Approval
          </DropdownMenuItem>
        )}

        {availableActions.includes('approve') && (
          <DropdownMenuItem
            onClick={() => executeAction('approve')}
            disabled={!canApprove}
            className={!canApprove ? 'opacity-50' : ''}
          >
            <Check className="mr-2 h-4 w-4 text-green-600" />
            Approve
            {!canApprove && <span className="ml-2 text-xs">(SoD)</span>}
          </DropdownMenuItem>
        )}

        {availableActions.includes('reject') && (
          <DropdownMenuItem onClick={() => executeAction('reject')}>
            <X className="mr-2 h-4 w-4 text-red-600" />
            Reject
          </DropdownMenuItem>
        )}

        {availableActions.includes('retry') && (
          <DropdownMenuItem onClick={() => executeAction('retry')}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Retry Payment
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
