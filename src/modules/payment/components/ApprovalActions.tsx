// ============================================================================
// COM_PAY_05: APPROVAL ACTIONS - Approve/Reject Button Group
// ============================================================================
// Reusable approval action buttons with SoD and IC validation
// 🛡️ GOVERNANCE: Uses Btn component (no fake buttons)
// ============================================================================

import {
  CheckCircle2,
  XCircle,
  Ban,
  ArrowRightLeft,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Btn, Txt } from '@aibos/ui'

// ============================================================================
// TYPES
// ============================================================================

interface ApprovalActionsProps {
  paymentId: string;
  canApprove: boolean;
  canReject?: boolean;
  isLoading?: boolean;
  blockReason?: string;
  showSettleIC?: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSettleIC?: (id: string) => void;
  approverName?: string;
  layout?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// ============================================================================
// SIZE CONFIGURATIONS
// ============================================================================

const SIZE_CONFIG = {
  sm: {
    button: 'py-1.5 px-3 text-xs gap-1.5',
    icon: 'w-3.5 h-3.5',
    footer: 'text-[8px]',
  },
  md: {
    button: 'py-2.5 px-4 text-sm gap-2',
    icon: 'w-4 h-4',
    footer: 'text-[9px]',
  },
  lg: {
    button: 'py-3 px-6 text-base gap-2',
    icon: 'w-5 h-5',
    footer: 'text-[10px]',
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ApprovalActions({
  paymentId,
  canApprove,
  canReject = true,
  isLoading = false,
  blockReason,
  showSettleIC = false,
  onApprove,
  onReject,
  onSettleIC,
  approverName = 'You',
  layout = 'horizontal',
  size = 'md',
  className,
}: ApprovalActionsProps) {
  const config = SIZE_CONFIG[size];
  const isHorizontal = layout === 'horizontal';

  // If IC settlement is needed
  if (showSettleIC) {
    return (
      <div className={cn('space-y-3', className)}>
        {/* 🛡️ GOVERNANCE: Uses Txt component for text */}
        <div className="flex items-center justify-center gap-2 py-2">
          <Ban className="w-4 h-4 text-status-error" />
          <Txt variant="small" className="text-status-error">
            {blockReason || 'Cannot approve - settlement required'}
          </Txt>
        </div>
        {/* 🛡️ GOVERNANCE: Uses Btn component (no fake button) */}
        {onSettleIC && (
          <Btn
            variant="secondary"
            size={size}
            onClick={() => onSettleIC(paymentId)}
            disabled={isLoading}
            loading={isLoading}
            className="w-full"
          >
            <ArrowRightLeft className={cn(config.icon)} />
            Initiate IC Settlement
          </Btn>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className={cn(
        'gap-3',
        isHorizontal ? 'grid grid-cols-2' : 'flex flex-col'
      )}>
        {/* 🛡️ GOVERNANCE: Reject Button uses Btn component */}
        <Btn
          variant="secondary"
          size={size}
          onClick={() => onReject(paymentId)}
          disabled={isLoading || !canReject}
          loading={isLoading}
          className="border-status-error/30 text-status-error hover:bg-status-error/10"
        >
          <XCircle className={cn(config.icon)} />
          Reject
        </Btn>

        {/* 🛡️ GOVERNANCE: Approve Button uses Btn component */}
        <Btn
          variant={canApprove ? "primary" : "secondary"}
          size={size}
          onClick={() => canApprove && onApprove(paymentId)}
          disabled={!canApprove || isLoading}
          loading={isLoading}
          title={!canApprove ? blockReason : undefined}
        >
          {!canApprove ? (
            <Ban className={cn(config.icon)} />
          ) : (
            <CheckCircle2 className={cn(config.icon)} />
          )}
          {canApprove ? 'Approve' : 'Blocked'}
        </Btn>
      </div>

      {/* Footer - Who is approving */}
      {/* 🛡️ GOVERNANCE: Uses Txt component */}
      {canApprove && approverName && (
        <Txt variant="small" className="text-center mt-2 text-text-tertiary">
          Approving as: <span className="text-text-secondary">{approverName}</span>
        </Txt>
      )}

      {/* Block reason message */}
      {/* 🛡️ GOVERNANCE: Uses Txt component with status-error token */}
      {!canApprove && blockReason && (
        <Txt variant="small" className="text-status-error/70 text-center mt-2">
          {blockReason}
        </Txt>
      )}
    </div>
  );
}

// ============================================================================
// BATCH APPROVAL BUTTON
// ============================================================================

interface BatchApprovalButtonProps {
  clusterName: string;
  count: number;
  totalAmount: number;
  canApprove: boolean;
  isLoading?: boolean;
  onApprove: () => void;
  onReview: () => void;
  className?: string;
}

export function BatchApprovalButton({
  clusterName,
  count,
  totalAmount,
  canApprove,
  isLoading = false,
  onApprove,
  onReview,
  className,
}: BatchApprovalButtonProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);

  // 🛡️ GOVERNANCE: Uses Btn component (no fake buttons)
  if (canApprove) {
    return (
      <Btn
        variant="primary"
        size="md"
        onClick={onApprove}
        disabled={isLoading}
        loading={isLoading}
        className={cn("w-full", className)}
      >
        <CheckCircle2 className="w-4 h-4" />
        Approve {count} {clusterName} ({formatCurrency(totalAmount)})
      </Btn>
    );
  }

  return (
    <Btn
      variant="secondary"
      size="md"
      onClick={onReview}
      disabled={isLoading}
      className={cn("w-full border-status-warning/50 text-status-warning hover:bg-status-warning/10", className)}
    >
      Review {count} {clusterName} items
    </Btn>
  );
}

export default ApprovalActions;

