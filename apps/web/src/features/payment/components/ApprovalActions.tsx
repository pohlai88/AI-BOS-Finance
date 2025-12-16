// ============================================================================
// COM_PAY_05: APPROVAL ACTIONS - Approve/Reject Button Group
// ============================================================================
// Reusable approval action buttons with SoD and IC validation
// ============================================================================

import { 
  CheckCircle2, 
  XCircle, 
  Ban,
  ArrowRightLeft,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
        <div className="flex items-center justify-center gap-2 py-2 text-red-400 text-[11px]">
          <Ban className="w-4 h-4" />
          <span>{blockReason || 'Cannot approve - settlement required'}</span>
        </div>
        {onSettleIC && (
          <button 
            onClick={() => onSettleIC(paymentId)}
            disabled={isLoading}
            className={cn(
              'w-full flex items-center justify-center rounded border border-purple-900/50 text-purple-400 hover:bg-purple-900/10 font-medium transition-all',
              config.button,
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <Loader2 className={cn(config.icon, 'animate-spin')} />
            ) : (
              <ArrowRightLeft className={config.icon} />
            )}
            Initiate IC Settlement
          </button>
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
        {/* Reject Button */}
        <button 
          onClick={() => onReject(paymentId)}
          disabled={isLoading || !canReject}
          className={cn(
            'flex items-center justify-center rounded border border-red-900/30 text-red-500 hover:bg-red-900/10 font-medium transition-all',
            config.button,
            (isLoading || !canReject) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <Loader2 className={cn(config.icon, 'animate-spin')} />
          ) : (
            <XCircle className={config.icon} />
          )}
          Reject
        </button>

        {/* Approve Button */}
        <button 
          onClick={() => canApprove && onApprove(paymentId)}
          disabled={!canApprove || isLoading}
          className={cn(
            'flex items-center justify-center rounded font-bold transition-all',
            config.button,
            canApprove 
              ? 'bg-[#28E7A2] text-black hover:bg-[#20b881] shadow-[0_0_15px_rgba(40,231,162,0.3)]'
              : 'bg-[#1F1F1F] text-[#555] cursor-not-allowed'
          )}
          title={!canApprove ? blockReason : undefined}
        >
          {isLoading ? (
            <Loader2 className={cn(config.icon, 'animate-spin')} />
          ) : !canApprove ? (
            <Ban className={config.icon} />
          ) : (
            <CheckCircle2 className={config.icon} />
          )}
          {canApprove ? 'Approve' : 'Blocked'}
        </button>
      </div>

      {/* Footer - Who is approving */}
      {canApprove && approverName && (
        <p className={cn(
          'text-[#555] text-center mt-2 font-mono',
          config.footer
        )}>
          Approving as: <span className="text-[#888]">{approverName}</span>
        </p>
      )}

      {/* Block reason message */}
      {!canApprove && blockReason && (
        <p className={cn(
          'text-red-400/70 text-center mt-2',
          config.footer
        )}>
          {blockReason}
        </p>
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

  if (canApprove) {
    return (
      <button
        onClick={onApprove}
        disabled={isLoading}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3 rounded bg-[#28E7A2] text-black font-bold text-sm hover:bg-[#20b881] shadow-[0_0_15px_rgba(40,231,162,0.2)] transition-all',
          isLoading && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CheckCircle2 className="w-4 h-4" />
        )}
        Approve {count} {clusterName} ({formatCurrency(totalAmount)})
      </button>
    );
  }

  return (
    <button
      onClick={onReview}
      disabled={isLoading}
      className={cn(
        'w-full flex items-center justify-center gap-2 py-3 rounded border border-amber-900/50 text-amber-400 hover:bg-amber-900/10 font-medium text-sm transition-all',
        isLoading && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      Review {count} {clusterName} items
    </button>
  );
}

export default ApprovalActions;

