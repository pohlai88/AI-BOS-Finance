'use client';

/**
 * ExceptionBadge - Compact exception indicator for payment rows
 * 
 * Phase 6a Enhancement: Risk-First Operations
 * 
 * Shows the most severe exception with count indicator for multiple issues.
 */

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertTriangle,
  AlertCircle,
  Ban,
  FileWarning,
  Clock,
  CreditCard,
  DollarSign,
  Calendar,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export type ExceptionType =
  | 'MISSING_INVOICE'
  | 'STALE_APPROVAL'
  | 'DUPLICATE_RISK'
  | 'BANK_DETAIL_CHANGED'
  | 'OVER_LIMIT'
  | 'PERIOD_WARNING';

export type ExceptionSeverity = 'info' | 'warning' | 'critical' | 'block';

export interface PaymentException {
  id: string;
  paymentId: string;
  paymentNumber?: string;
  type: ExceptionType;
  severity: ExceptionSeverity;
  message: string;
  detectedAt: Date | string;
  metadata?: Record<string, unknown>;
}

export interface ExceptionBadgeProps {
  exceptions: PaymentException[];
  showCount?: boolean;
  size?: 'sm' | 'default';
}

// ============================================================================
// CONFIG
// ============================================================================

interface ExceptionConfig {
  icon: LucideIcon;
  label: string;
  shortLabel: string;
  color: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
}

const EXCEPTION_CONFIG: Record<ExceptionType, ExceptionConfig> = {
  MISSING_INVOICE: {
    icon: FileWarning,
    label: 'Missing Invoice',
    shortLabel: 'No Invoice',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    badgeVariant: 'secondary',
  },
  STALE_APPROVAL: {
    icon: Clock,
    label: 'Stale Approval',
    shortLabel: 'Stale',
    color: 'text-red-600 bg-red-50 border-red-200',
    badgeVariant: 'destructive',
  },
  DUPLICATE_RISK: {
    icon: Ban,
    label: 'Potential Duplicate',
    shortLabel: 'Duplicate?',
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    badgeVariant: 'destructive',
  },
  BANK_DETAIL_CHANGED: {
    icon: CreditCard,
    label: 'Bank Details Changed',
    shortLabel: 'Bank Changed',
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    badgeVariant: 'secondary',
  },
  OVER_LIMIT: {
    icon: DollarSign,
    label: 'Over Approval Limit',
    shortLabel: 'Over Limit',
    color: 'text-red-600 bg-red-50 border-red-200',
    badgeVariant: 'destructive',
  },
  PERIOD_WARNING: {
    icon: Calendar,
    label: 'Period Warning',
    shortLabel: 'Period',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    badgeVariant: 'secondary',
  },
};

const SEVERITY_ORDER: ExceptionSeverity[] = ['block', 'critical', 'warning', 'info'];

// ============================================================================
// COMPONENT
// ============================================================================

export function ExceptionBadge({
  exceptions,
  showCount = true,
  size = 'default',
}: ExceptionBadgeProps) {
  if (!exceptions || exceptions.length === 0) return null;

  // Sort by severity to show most severe first
  const sorted = [...exceptions].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
  );

  const primary = sorted[0];
  const config = EXCEPTION_CONFIG[primary.type] || {
    icon: AlertTriangle,
    label: 'Unknown Exception',
    shortLabel: 'Issue',
    color: 'text-gray-600 bg-gray-50 border-gray-200',
    badgeVariant: 'outline' as const,
  };

  const Icon = config.icon;
  const hasMultiple = exceptions.length > 1;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <Badge
            variant={config.badgeVariant}
            className={cn(
              'gap-1 cursor-help font-normal',
              config.color,
              size === 'sm' && 'text-[10px] h-5 px-1.5',
            )}
          >
            <Icon className={cn(
              size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'
            )} />
            <span>{config.shortLabel}</span>
            {showCount && hasMultiple && (
              <span className="opacity-70">+{exceptions.length - 1}</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="max-w-xs"
        >
          <ExceptionTooltipContent exceptions={sorted} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// TOOLTIP CONTENT
// ============================================================================

interface ExceptionTooltipContentProps {
  exceptions: PaymentException[];
}

function ExceptionTooltipContent({ exceptions }: ExceptionTooltipContentProps) {
  return (
    <div className="space-y-2 py-1">
      <div className="text-xs font-semibold text-muted-foreground mb-2">
        {exceptions.length} Exception{exceptions.length !== 1 ? 's' : ''} Detected
      </div>
      {exceptions.map((exc) => {
        const config = EXCEPTION_CONFIG[exc.type];
        const Icon = config?.icon || AlertTriangle;

        return (
          <div
            key={exc.id}
            className="flex items-start gap-2 text-xs"
          >
            <Icon className={cn(
              'h-3.5 w-3.5 flex-shrink-0 mt-0.5',
              exc.severity === 'critical' || exc.severity === 'block'
                ? 'text-red-500'
                : 'text-yellow-500'
            )} />
            <div>
              <p className="font-medium">{config?.label || exc.type}</p>
              <p className="text-muted-foreground">{exc.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// MULTI-BADGE VARIANT
// ============================================================================

interface ExceptionBadgeListProps {
  exceptions: PaymentException[];
  max?: number;
}

export function ExceptionBadgeList({ exceptions, max = 3 }: ExceptionBadgeListProps) {
  if (!exceptions || exceptions.length === 0) return null;

  // Group by type
  const byType = exceptions.reduce((acc, exc) => {
    if (!acc[exc.type]) {
      acc[exc.type] = [];
    }
    acc[exc.type].push(exc);
    return acc;
  }, {} as Record<ExceptionType, PaymentException[]>);

  const types = Object.keys(byType) as ExceptionType[];
  const displayed = types.slice(0, max);
  const remaining = types.length - max;

  return (
    <div className="flex flex-wrap gap-1">
      {displayed.map((type) => {
        const typeExceptions = byType[type];
        const config = EXCEPTION_CONFIG[type];
        const Icon = config?.icon || AlertTriangle;

        return (
          <TooltipProvider key={type}>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <Badge
                  variant={config?.badgeVariant || 'outline'}
                  className={cn(
                    'gap-1 cursor-help font-normal text-[10px] h-5 px-1.5',
                    config?.color,
                  )}
                >
                  <Icon className="h-2.5 w-2.5" />
                  {typeExceptions.length > 1 && (
                    <span>{typeExceptions.length}</span>
                  )}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <ExceptionTooltipContent exceptions={typeExceptions} />
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
      {remaining > 0 && (
        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
          +{remaining}
        </Badge>
      )}
    </div>
  );
}

// ============================================================================
// SEVERITY INDICATOR
// ============================================================================

interface SeverityIndicatorProps {
  severity: ExceptionSeverity;
  size?: 'sm' | 'default';
}

export function SeverityIndicator({ severity, size = 'default' }: SeverityIndicatorProps) {
  const config: Record<ExceptionSeverity, { color: string; icon: LucideIcon }> = {
    block: { color: 'bg-red-500', icon: Ban },
    critical: { color: 'bg-red-500', icon: AlertCircle },
    warning: { color: 'bg-yellow-500', icon: AlertTriangle },
    info: { color: 'bg-blue-500', icon: AlertCircle },
  };

  const { color } = config[severity];

  return (
    <div
      className={cn(
        'rounded-full',
        color,
        size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5'
      )}
      title={`Severity: ${severity}`}
    />
  );
}
