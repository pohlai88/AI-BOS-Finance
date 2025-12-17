'use client';

/**
 * CashPositionWidget - Cash Outflow Projection
 * 
 * Displays cash position projection with:
 * - Summary cards (today, week, month, 90 days)
 * - Visual timeline of scheduled payments
 * 
 * Answers the CFO question: "Where's my money going?"
 */

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  TrendingDown,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCashPosition, type CashPositionResponse } from '../hooks/useDashboard';

// ============================================================================
// TYPES
// ============================================================================

interface CashPositionWidgetProps {
  days?: number;
  className?: string;
}

// ============================================================================
// FORMATTERS
// ============================================================================

function formatCurrency(amount: string, compact = true): string {
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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================================================
// SUMMARY CARD
// ============================================================================

interface SummaryCardProps {
  title: string;
  amount: string;
  count: number;
  isHighlighted?: boolean;
}

function SummaryCard({ title, amount, count, isHighlighted }: SummaryCardProps) {
  const value = parseFloat(amount);
  const hasValue = !isNaN(value) && value > 0;

  return (
    <div className={cn(
      'rounded-lg border p-3 transition-all',
      isHighlighted && 'border-primary bg-primary/5',
      !isHighlighted && 'border-muted bg-muted/30',
    )}>
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
        {title}
      </p>
      <p className={cn(
        'text-xl font-bold tabular-nums mt-1',
        hasValue && 'text-foreground',
        !hasValue && 'text-muted-foreground',
      )}>
        {formatCurrency(amount)}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {count} payment{count !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

// ============================================================================
// TIMELINE BAR
// ============================================================================

interface TimelineBarProps {
  daily: CashPositionResponse['daily'];
  maxDays?: number;
}

function TimelineBar({ daily, maxDays = 14 }: TimelineBarProps) {
  if (daily.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
        No scheduled payments in this period
      </div>
    );
  }

  // Get max amount for scaling
  const maxAmount = Math.max(...daily.map(d => parseFloat(d.scheduledAmount)));
  const displayDays = daily.slice(0, maxDays);

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1 h-24">
        {displayDays.map((day, i) => {
          const amount = parseFloat(day.scheduledAmount);
          const height = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
          const isToday = new Date(day.date).toDateString() === new Date().toDateString();

          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1"
              title={`${formatDate(day.date)}: ${formatCurrency(day.scheduledAmount)} (${day.paymentCount} payments)`}
            >
              <div
                className={cn(
                  'w-full rounded-t transition-all',
                  isToday && 'bg-primary',
                  !isToday && 'bg-primary/40 hover:bg-primary/60',
                )}
                style={{ height: `${Math.max(height, 4)}%` }}
              />
            </div>
          );
        })}
      </div>
      
      {/* Date labels */}
      <div className="flex gap-1 text-[10px] text-muted-foreground">
        {displayDays.map((day, i) => {
          const isToday = new Date(day.date).toDateString() === new Date().toDateString();
          // Only show every 3rd label to avoid crowding
          if (i % 3 !== 0 && i !== displayDays.length - 1) return <div key={i} className="flex-1" />;
          
          return (
            <div key={i} className={cn('flex-1 text-center', isToday && 'font-bold text-primary')}>
              {isToday ? 'Today' : formatDate(day.date)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function CashPositionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-8" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2 p-3 border rounded-lg">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
        <Skeleton className="h-24 w-full" />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CashPositionWidget({ days = 90, className }: CashPositionWidgetProps) {
  const { data, isLoading, error, refresh } = useCashPosition(days);

  if (isLoading) {
    return <CashPositionSkeleton />;
  }

  if (error) {
    return (
      <Card className={cn('border-destructive', className)}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-sm text-destructive font-medium">Failed to load cash position</p>
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

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-muted-foreground" />
            Cash Outflow Projection
          </CardTitle>
          <CardDescription>
            Scheduled payment obligations
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {data.currency}
          </Badge>
          <Button variant="ghost" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard
            title="Today"
            amount={data.summary.today.amount}
            count={data.summary.today.paymentCount}
            isHighlighted
          />
          <SummaryCard
            title="This Week"
            amount={data.summary.thisWeek.amount}
            count={data.summary.thisWeek.paymentCount}
          />
          <SummaryCard
            title="This Month"
            amount={data.summary.thisMonth.amount}
            count={data.summary.thisMonth.paymentCount}
          />
          <SummaryCard
            title="Next 90 Days"
            amount={data.summary.next90Days.amount}
            count={data.summary.next90Days.paymentCount}
          />
        </div>

        {/* Timeline */}
        <div>
          <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Daily breakdown (next 14 days)
          </p>
          <TimelineBar daily={data.daily} maxDays={14} />
        </div>
      </CardContent>
    </Card>
  );
}

export default CashPositionWidget;
