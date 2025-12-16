'use client';

/**
 * ApprovalChainTimeline - Visual timeline of payment workflow
 * 
 * Phase 6c Enhancement: Evidence UX
 * 
 * Shows the complete approval chain with actors and timestamps.
 * Can be used standalone or embedded in ExpandablePaymentRow.
 */

import {
  Check,
  X,
  Clock,
  Send,
  Play,
  AlertCircle,
  RefreshCw,
  Ban,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface AuditEvent {
  id: string;
  action: string;
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  timestamp: string;
  payload?: Record<string, unknown>;
}

export interface PaymentBase {
  id: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ApprovalChainTimelineProps {
  payment: PaymentBase;
  auditEvents: AuditEvent[];
  variant?: 'default' | 'compact';
  showPending?: boolean;
}

// ============================================================================
// ACTION CONFIG
// ============================================================================

interface ActionConfig {
  icon: LucideIcon;
  label: string;
  color: string;
  bgColor: string;
}

const ACTION_CONFIG: Record<string, ActionConfig> = {
  created: {
    icon: Send,
    label: 'Created',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  submitted: {
    icon: Clock,
    label: 'Submitted',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  approved: {
    icon: Check,
    label: 'Approved',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  rejected: {
    icon: X,
    label: 'Rejected',
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  },
  executed: {
    icon: Play,
    label: 'Executed',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  completed: {
    icon: Check,
    label: 'Completed',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  failed: {
    icon: AlertCircle,
    label: 'Failed',
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  },
  retried: {
    icon: RefreshCw,
    label: 'Retried',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  cancelled: {
    icon: Ban,
    label: 'Cancelled',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  },
  awaiting: {
    icon: Clock,
    label: 'Awaiting',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ApprovalChainTimeline({
  payment,
  auditEvents,
  variant = 'default',
  showPending = true,
}: ApprovalChainTimelineProps) {
  // Build timeline from audit events
  const timeline = auditEvents
    .filter(e => e.action.startsWith('finance.ap.payment.'))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(event => ({
      id: event.id,
      action: event.action.split('.').pop() || 'unknown',
      actor: event.actorName || event.actorEmail || event.actorId?.slice(0, 8) || 'System',
      timestamp: event.timestamp,
      payload: event.payload,
    }));

  // Add pending state indicator if needed
  const isPending = payment.status === 'pending_approval' && showPending;

  if (timeline.length === 0 && !isPending) {
    return (
      <div className="text-xs text-muted-foreground py-2">
        No workflow history available
      </div>
    );
  }

  const isCompact = variant === 'compact';

  return (
    <div className="relative">
      {/* Vertical connector line */}
      {timeline.length > 0 && (
        <div
          className={cn(
            'absolute w-px bg-border',
            isCompact ? 'left-2 top-2 bottom-2' : 'left-3 top-3 bottom-3'
          )}
        />
      )}

      <div className={cn('space-y-3', isCompact && 'space-y-2')}>
        {timeline.map((step, index) => {
          const config = ACTION_CONFIG[step.action] || ACTION_CONFIG.created;
          const Icon = config.icon;
          const isLast = index === timeline.length - 1 && !isPending;

          return (
            <TimelineStep
              key={step.id}
              icon={Icon}
              iconColor={config.color}
              iconBgColor={config.bgColor}
              label={config.label}
              actor={step.actor}
              timestamp={step.timestamp}
              isLast={isLast}
              compact={isCompact}
              payload={step.payload}
            />
          );
        })}

        {/* Pending state indicator */}
        {isPending && (
          <TimelineStep
            icon={Clock}
            iconColor="text-yellow-600"
            iconBgColor="bg-yellow-100"
            label="Awaiting Approval"
            timestamp={payment.updatedAt || payment.createdAt}
            isPending
            isLast
            compact={isCompact}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TIMELINE STEP
// ============================================================================

interface TimelineStepProps {
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  label: string;
  actor?: string;
  timestamp: string;
  isPending?: boolean;
  isLast?: boolean;
  compact?: boolean;
  payload?: Record<string, unknown>;
}

function TimelineStep({
  icon: Icon,
  iconColor,
  iconBgColor,
  label,
  actor,
  timestamp,
  isPending = false,
  isLast = false,
  compact = false,
  payload,
}: TimelineStepProps) {
  const iconSize = compact ? 'h-4 w-4' : 'h-6 w-6';
  const innerIconSize = compact ? 'h-2.5 w-2.5' : 'h-3 w-3';

  return (
    <div className="flex items-start gap-3 relative">
      {/* Icon */}
      <div
        className={cn(
          'relative z-10 flex-shrink-0 rounded-full flex items-center justify-center',
          iconBgColor,
          iconSize,
          isPending && 'animate-pulse'
        )}
      >
        <Icon className={cn(innerIconSize, iconColor)} />
      </div>

      {/* Content */}
      <div className={cn('flex-1 min-w-0', compact && 'pb-0')}>
        <p className={cn(
          'font-medium',
          compact ? 'text-xs' : 'text-sm',
          isPending && 'text-yellow-600'
        )}>
          {label}
        </p>
        <p className={cn(
          'text-muted-foreground',
          compact ? 'text-[10px]' : 'text-xs'
        )}>
          {isPending ? (
            <span className="text-yellow-600">
              Waiting {formatWaitTime(timestamp)}
            </span>
          ) : (
            <>
              {actor && <span>by {actor} • </span>}
              {formatRelativeTime(timestamp)}
            </>
          )}
        </p>

        {/* Show rejection reason if present */}
        {payload?.reason && (
          <p className={cn(
            'mt-1 text-muted-foreground italic',
            compact ? 'text-[10px]' : 'text-xs'
          )}>
            "{payload.reason}"
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

function formatWaitTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const hours = Math.floor(diff / 3600000);

  if (hours < 1) return 'less than 1 hour';
  if (hours < 24) return `${hours} hours`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''}`;
}

// ============================================================================
// COMPACT VARIANT
// ============================================================================

export function CompactApprovalChain({
  payment,
  auditEvents
}: {
  payment: PaymentBase;
  auditEvents: AuditEvent[];
}) {
  return (
    <ApprovalChainTimeline
      payment={payment}
      auditEvents={auditEvents}
      variant="compact"
    />
  );
}
