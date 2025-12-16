// ============================================================================
// COM_PAY_07: PAYMENT STATUS BADGE
// Enterprise-grade status badge for AP-05 Payment Execution Cell
// ============================================================================
// PHILOSOPHY: "State machines make status visible."
// - Colors match state machine semantics
// - Terminal states are visually distinct
// - Processing states show animation
// ============================================================================

'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  FileEdit,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  CheckCheck,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

// ============================================================================
// 1. TYPES
// ============================================================================

export type PaymentStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'processing'
  | 'completed'
  | 'failed';

interface PaymentStatusBadgeProps {
  /** Current payment status */
  status: PaymentStatus;
  /** Show icon alongside text? */
  showIcon?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// 2. STATUS CONFIGURATION
// ============================================================================

interface StatusConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
  isAnimated?: boolean;
  isTerminal?: boolean;
}

const STATUS_CONFIG: Record<PaymentStatus, StatusConfig> = {
  draft: {
    label: 'Draft',
    icon: FileEdit,
    variant: 'secondary',
    className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    isTerminal: false,
  },
  pending_approval: {
    label: 'Pending Approval',
    icon: Clock,
    variant: 'outline',
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
    isTerminal: false,
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    variant: 'default',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
    isTerminal: false,
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    variant: 'destructive',
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    isTerminal: true,
  },
  processing: {
    label: 'Processing',
    icon: Loader2,
    variant: 'outline',
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    isAnimated: true,
    isTerminal: false,
  },
  completed: {
    label: 'Completed',
    icon: CheckCheck,
    variant: 'default',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
    isTerminal: true,
  },
  failed: {
    label: 'Failed',
    icon: AlertTriangle,
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
    isTerminal: false, // Can retry
  },
};

// ============================================================================
// 3. SIZE CONFIGURATION
// ============================================================================

const SIZE_CONFIG = {
  sm: {
    badge: 'text-xs px-2 py-0.5',
    icon: 'h-3 w-3',
    gap: 'gap-1',
  },
  md: {
    badge: 'text-sm px-2.5 py-0.5',
    icon: 'h-3.5 w-3.5',
    gap: 'gap-1.5',
  },
  lg: {
    badge: 'text-base px-3 py-1',
    icon: 'h-4 w-4',
    gap: 'gap-2',
  },
};

// ============================================================================
// 4. COMPONENT
// ============================================================================

/**
 * PaymentStatusBadge - Enterprise status badge component
 * 
 * Key Features:
 * - Consistent styling across all payment states
 * - Animated icon for processing state
 * - Visual distinction for terminal states
 * - Dark mode support
 * 
 * @example
 * ```tsx
 * <PaymentStatusBadge status="pending_approval" showIcon />
 * <PaymentStatusBadge status="completed" size="lg" />
 * <PaymentStatusBadge status="processing" showIcon />
 * ```
 */
export function PaymentStatusBadge({
  status,
  showIcon = true,
  size = 'md',
  className,
}: PaymentStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];

  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        // Reset default badge styles
        'font-medium border inline-flex items-center whitespace-nowrap',
        // Size
        sizeConfig.badge,
        sizeConfig.gap,
        // Status-specific styles
        config.className,
        // Terminal state styling (optional visual distinction)
        config.isTerminal && 'font-semibold',
        // Custom classes
        className
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            sizeConfig.icon,
            // Animate spinning for processing state
            config.isAnimated && 'animate-spin'
          )}
        />
      )}
      {config.label}
    </Badge>
  );
}

// ============================================================================
// 5. UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the human-readable label for a status
 */
export function getStatusLabel(status: PaymentStatus): string {
  return STATUS_CONFIG[status]?.label ?? status;
}

/**
 * Check if a status is a terminal state
 */
export function isTerminalStatus(status: PaymentStatus): boolean {
  return STATUS_CONFIG[status]?.isTerminal ?? false;
}

/**
 * Check if a status can transition to another status
 * Based on AP-05 state machine
 */
export function canTransition(
  current: PaymentStatus,
  action: 'submit' | 'approve' | 'reject' | 'execute' | 'complete' | 'fail' | 'retry'
): boolean {
  const TRANSITIONS: Record<PaymentStatus, string[]> = {
    draft: ['submit'],
    pending_approval: ['approve', 'reject'],
    approved: ['execute'],
    rejected: [], // Terminal
    processing: ['complete', 'fail'],
    completed: [], // Terminal
    failed: ['retry'],
  };

  return TRANSITIONS[current]?.includes(action) ?? false;
}

/**
 * Get the next status after an action
 * Based on AP-05 state machine
 */
export function getNextStatus(
  current: PaymentStatus,
  action: 'submit' | 'approve' | 'reject' | 'execute' | 'complete' | 'fail' | 'retry'
): PaymentStatus | null {
  const NEXT_STATUS: Record<string, PaymentStatus> = {
    'draft:submit': 'pending_approval',
    'pending_approval:approve': 'approved',
    'pending_approval:reject': 'rejected',
    'approved:execute': 'processing',
    'processing:complete': 'completed',
    'processing:fail': 'failed',
    'failed:retry': 'pending_approval',
  };

  return NEXT_STATUS[`${current}:${action}`] ?? null;
}

// ============================================================================
// 6. RETRY BADGE VARIANT
// ============================================================================

interface RetryBadgeProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * RetryBadge - Clickable badge for failed payments
 */
export function RetryBadge({ onClick, disabled, className }: RetryBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors',
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
        'inline-flex items-center gap-1.5',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={disabled ? undefined : onClick}
    >
      <RefreshCw className="h-3.5 w-3.5" />
      Retry
    </Badge>
  );
}

// ============================================================================
// 7. EXPORTS
// ============================================================================

export { STATUS_CONFIG };
