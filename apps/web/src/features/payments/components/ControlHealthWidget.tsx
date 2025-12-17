'use client';

/**
 * ControlHealthWidget - Control Health Status Panel
 * 
 * Displays control health metrics:
 * - SoD compliance rate
 * - Pending approvals
 * - Exception counts
 * - Audit coverage
 * 
 * Gives auditors and CFOs confidence in control posture.
 */

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useControlHealth, type ControlHealthResponse } from '../hooks/useDashboard';

// ============================================================================
// TYPES
// ============================================================================

interface ControlHealthWidgetProps {
  className?: string;
  compact?: boolean;
}

// ============================================================================
// STATUS INDICATOR
// ============================================================================

interface StatusIndicatorProps {
  status: 'healthy' | 'warning' | 'critical';
  label: string;
}

function StatusIndicator({ status, label }: StatusIndicatorProps) {
  const config = {
    healthy: {
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      text: 'Healthy',
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      text: 'Warning',
    },
    critical: {
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      text: 'Critical',
    },
  };

  const { icon: Icon, color, bg, borderColor, text } = config[status];

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-lg border',
      bg,
      borderColor,
    )}>
      <Icon className={cn('h-4 w-4', color)} />
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn('text-sm font-medium', color)}>{text}</p>
      </div>
    </div>
  );
}

// ============================================================================
// METRIC ROW
// ============================================================================

interface MetricRowProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  status?: 'success' | 'warning' | 'danger' | 'neutral';
}

function MetricRow({ icon: Icon, label, value, subValue, status = 'neutral' }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-2">
        <Icon className={cn(
          'h-4 w-4',
          status === 'success' && 'text-emerald-600',
          status === 'warning' && 'text-amber-600',
          status === 'danger' && 'text-red-600',
          status === 'neutral' && 'text-muted-foreground',
        )} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="text-right">
        <span className="text-sm font-medium tabular-nums">{value}</span>
        {subValue && (
          <span className="text-xs text-muted-foreground ml-1">({subValue})</span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function ControlHealthSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-8" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between py-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ControlHealthWidget({ className, compact = false }: ControlHealthWidgetProps) {
  const { data, isLoading, error, refresh } = useControlHealth();

  if (isLoading) {
    return <ControlHealthSkeleton />;
  }

  if (error) {
    return (
      <Card className={cn('border-destructive', className)}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-sm text-destructive font-medium">Failed to load control health</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={refresh}>
            <RefreshCw className="h-3 w-3 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { metrics, status } = data;

  // Format pending amount
  const pendingAmount = parseFloat(metrics.pendingApprovalAmount);
  const formattedPending = isNaN(pendingAmount) ? '$0'
    : pendingAmount >= 1000000 ? `$${(pendingAmount / 1000000).toFixed(1)}M`
    : pendingAmount >= 1000 ? `$${(pendingAmount / 1000).toFixed(0)}K`
    : `$${pendingAmount.toFixed(0)}`;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            Control Health
          </CardTitle>
          {!compact && (
            <CardDescription>
              Compliance and audit status
            </CardDescription>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={status.overall === 'healthy' ? 'outline' : 'destructive'}
            className={cn(
              status.overall === 'healthy' && 'text-emerald-600 border-emerald-600/30',
            )}
          >
            {status.overall === 'healthy' ? 'All Clear' : status.overall.toUpperCase()}
          </Badge>
          <Button variant="ghost" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Indicators */}
        <div className="grid grid-cols-3 gap-2">
          <StatusIndicator status={status.sod} label="SoD" />
          <StatusIndicator status={status.approvals} label="Approvals" />
          <StatusIndicator status={status.exceptions} label="Exceptions" />
        </div>

        {/* SoD Compliance Progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">SoD Compliance</span>
            <span className="text-xs font-medium">{metrics.sodComplianceRate}%</span>
          </div>
          <Progress 
            value={metrics.sodComplianceRate} 
            className={cn(
              'h-2',
              metrics.sodComplianceRate === 100 && '[&>div]:bg-emerald-500',
              metrics.sodComplianceRate < 100 && metrics.sodComplianceRate >= 90 && '[&>div]:bg-amber-500',
              metrics.sodComplianceRate < 90 && '[&>div]:bg-red-500',
            )}
          />
        </div>

        {/* Detailed Metrics */}
        {!compact && (
          <div className="pt-2">
            <MetricRow
              icon={Clock}
              label="Pending Approvals"
              value={metrics.pendingApprovals}
              subValue={formattedPending}
              status={metrics.pendingApprovals > 20 ? 'warning' : 'neutral'}
            />
            <MetricRow
              icon={FileCheck}
              label="Audit Coverage"
              value={`${metrics.auditCoverage}%`}
              status={metrics.auditCoverage === 100 ? 'success' : 'warning'}
            />
            <MetricRow
              icon={AlertTriangle}
              label="Exceptions"
              value={metrics.exceptions.total}
              subValue={metrics.exceptions.high > 0 ? `${metrics.exceptions.high} high` : undefined}
              status={metrics.exceptions.high > 0 ? 'danger' : metrics.exceptions.total > 0 ? 'warning' : 'success'}
            />
            <MetricRow
              icon={metrics.hasViolations ? AlertCircle : CheckCircle2}
              label="Control Violations"
              value={metrics.hasViolations ? 'Yes' : 'None'}
              status={metrics.hasViolations ? 'danger' : 'success'}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ControlHealthWidget;
