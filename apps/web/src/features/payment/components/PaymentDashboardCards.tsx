'use client';

/**
 * PaymentDashboardCards - Payment Hub Summary Metrics
 * 
 * Displays key payment metrics at a glance:
 * - Cash position (today, week, month)
 * - Pending approvals count
 * - Payment status breakdown
 * 
 * Uses the design system per CONT_10 BioSkin Architecture.
 */

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Wallet,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboard, type DashboardMetrics } from '../hooks/useDashboard';
import { Button } from '@/components/ui/button';

// ============================================================================
// TYPES
// ============================================================================

interface PaymentDashboardCardsProps {
  className?: string;
}

// ============================================================================
// FORMATTERS
// ============================================================================

function formatCurrency(amount: string, compact = false): string {
  const value = parseFloat(amount);
  if (isNaN(value)) return '$0';
  
  if (compact) {
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (absValue >= 1_000_000) {
      return `${sign}$${(absValue / 1_000_000).toFixed(1)}M`;
    } else if (absValue >= 1_000) {
      return `${sign}$${(absValue / 1_000).toFixed(0)}K`;
    }
    return `${sign}$${absValue.toFixed(0)}`;
  }
  
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

// ============================================================================
// METRIC CARD
// ============================================================================

interface MetricCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  subtitle?: string;
  status?: 'success' | 'warning' | 'danger' | 'neutral';
  trend?: { value: number; direction: 'up' | 'down' };
  onClick?: () => void;
}

function MetricCard({
  icon: Icon,
  title,
  value,
  subtitle,
  status = 'neutral',
  trend,
  onClick,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        'transition-all duration-200 cursor-default',
        onClick && 'cursor-pointer hover:shadow-md hover:border-primary/50',
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn(
          'p-2 rounded-lg',
          status === 'success' && 'bg-emerald-500/10 text-emerald-600',
          status === 'warning' && 'bg-amber-500/10 text-amber-600',
          status === 'danger' && 'bg-red-500/10 text-red-600',
          status === 'neutral' && 'bg-muted text-muted-foreground',
        )}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold tabular-nums">{value}</div>
          {trend && (
            <span className={cn(
              'text-xs font-medium flex items-center gap-0.5',
              trend.direction === 'up' && 'text-emerald-600',
              trend.direction === 'down' && 'text-red-600',
            )}>
              {trend.direction === 'up' ? '↑' : '↓'}
              {trend.value}%
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// STATUS BREAKDOWN
// ============================================================================

interface StatusBreakdownProps {
  byStatus: DashboardMetrics['byStatus'];
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-slate-500' },
  pending_approval: { label: 'Pending', color: 'bg-amber-500' },
  approved: { label: 'Approved', color: 'bg-blue-500' },
  rejected: { label: 'Rejected', color: 'bg-red-500' },
  processing: { label: 'Processing', color: 'bg-purple-500' },
  completed: { label: 'Completed', color: 'bg-emerald-500' },
  failed: { label: 'Failed', color: 'bg-red-600' },
};

function StatusBreakdown({ byStatus }: StatusBreakdownProps) {
  const total = byStatus.reduce((sum, s) => sum + s.count, 0);
  
  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Payment Status
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">No payments yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Payment Status Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress bar */}
        <div className="h-2 rounded-full bg-muted overflow-hidden flex">
          {byStatus.map((status) => {
            const config = STATUS_CONFIG[status.status] || { label: status.status, color: 'bg-gray-500' };
            const width = (status.count / total) * 100;
            return (
              <div
                key={status.status}
                className={cn(config.color, 'h-full')}
                style={{ width: `${width}%` }}
                title={`${config.label}: ${status.count}`}
              />
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {byStatus.map((status) => {
            const config = STATUS_CONFIG[status.status] || { label: status.status, color: 'bg-gray-500' };
            return (
              <div key={status.status} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className={cn('w-2 h-2 rounded-full', config.color)} />
                  <span className="text-muted-foreground">{config.label}</span>
                </div>
                <span className="font-medium tabular-nums">{status.count}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PaymentDashboardCards({ className }: PaymentDashboardCardsProps) {
  const { data, isLoading, error, refresh, lastUpdated } = useDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <Card className={cn('border-destructive', className)}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-sm text-destructive font-medium">Failed to load dashboard</p>
          <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
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

  // Calculate pending approval status
  const pendingStatus = data.controlHealth.pendingApprovals > 10 ? 'warning' 
    : data.controlHealth.pendingApprovals > 0 ? 'neutral' 
    : 'success';

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Dashboard</h2>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={refresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Outflow */}
        <MetricCard
          icon={Wallet}
          title="Today's Outflow"
          value={formatCurrency(data.cashPosition.today.amount, true)}
          subtitle={`${data.cashPosition.today.paymentCount} payments`}
          status="neutral"
        />

        {/* This Week */}
        <MetricCard
          icon={TrendingUp}
          title="This Week"
          value={formatCurrency(data.cashPosition.thisWeek.amount, true)}
          subtitle={`${data.cashPosition.thisWeek.paymentCount} scheduled`}
          status="neutral"
        />

        {/* Pending Approvals */}
        <MetricCard
          icon={Clock}
          title="Pending Approvals"
          value={data.controlHealth.pendingApprovals}
          subtitle={formatCurrency(data.controlHealth.pendingApprovalAmount, true)}
          status={pendingStatus}
        />

        {/* Control Health */}
        <MetricCard
          icon={CheckCircle2}
          title="Control Health"
          value={`${data.controlHealth.sodComplianceRate}%`}
          subtitle="SoD Compliance"
          status={data.controlHealth.sodComplianceRate === 100 ? 'success' : 'warning'}
        />
      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Breakdown */}
        <StatusBreakdown byStatus={data.byStatus} />

        {/* Multi-Company Summary */}
        {data.byCompany.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Companies ({data.byCompany.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.byCompany.slice(0, 5).map((company) => (
                <div key={company.companyId} className="flex items-center justify-between text-sm">
                  <span className="truncate max-w-[180px]">
                    {company.companyName || company.companyId.slice(0, 8)}
                  </span>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {company.pendingCount} pending
                    </Badge>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(company.totalAmount, true)}
                    </span>
                  </div>
                </div>
              ))}
              {data.byCompany.length > 5 && (
                <p className="text-xs text-muted-foreground pt-2">
                  +{data.byCompany.length - 5} more companies
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default PaymentDashboardCards;
