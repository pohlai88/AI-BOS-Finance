'use client';

/**
 * RiskQueueDashboard - Exception Overview Cards
 * 
 * Phase 6a Enhancement: Risk-First Operations
 * 
 * Displays exception counts by severity with clickable filters.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  AlertCircle,
  Ban,
  Info,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ============================================================================
// TYPES
// ============================================================================

export interface ExceptionCounts {
  critical: number;
  warning: number;
  block: number;
  info: number;
  total: number;
}

export interface RiskQueueDashboardProps {
  counts: ExceptionCounts;
  selectedSeverity?: string | null;
  onFilterClick: (severity: string | null) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

// ============================================================================
// CARD CONFIG
// ============================================================================

const SEVERITY_CARDS = [
  {
    key: 'critical',
    label: 'Critical',
    icon: AlertCircle,
    activeColor: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100',
    inactiveColor: 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-500',
    badgeVariant: 'destructive' as const,
    description: 'Requires immediate attention',
  },
  {
    key: 'block',
    label: 'Blocked',
    icon: Ban,
    activeColor: 'text-status-warning/90 bg-status-warning/10 border-status-warning/20 hover:bg-status-warning/15',
    inactiveColor: 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-500',
    badgeVariant: 'destructive' as const,
    description: 'Cannot proceed without action',
  },
  {
    key: 'warning',
    label: 'Warnings',
    icon: AlertTriangle,
    activeColor: 'text-yellow-600 bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    inactiveColor: 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-500',
    badgeVariant: 'secondary' as const,
    description: 'Review recommended',
  },
  {
    key: 'info',
    label: 'Info',
    icon: Info,
    activeColor: 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100',
    inactiveColor: 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-500',
    badgeVariant: 'outline' as const,
    description: 'For your information',
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function RiskQueueDashboard({
  counts,
  selectedSeverity,
  onFilterClick,
  onRefresh,
  isLoading = false,
}: RiskQueueDashboardProps) {
  const hasExceptions = counts.total > 0;

  if (isLoading) {
    return <RiskQueueSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Risk Queue</h3>
          {hasExceptions ? (
            <Badge variant="destructive" className="text-xs">
              {counts.total} issue{counts.total !== 1 ? 's' : ''}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-green-600 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              All clear
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedSeverity && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onFilterClick(null)}
            >
              Clear filter
            </Button>
          )}
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={onRefresh}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SEVERITY_CARDS.map((card) => {
          const count = counts[card.key as keyof ExceptionCounts] as number;
          const isActive = count > 0;
          const isSelected = selectedSeverity === card.key;
          const Icon = card.icon;

          return (
            <Card
              key={card.key}
              className={cn(
                'cursor-pointer transition-all duration-200 border-2',
                isActive ? card.activeColor : card.inactiveColor,
                isSelected && 'ring-2 ring-primary ring-offset-2',
              )}
              onClick={() => onFilterClick(isSelected ? null : card.key)}
            >
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="flex items-center justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5">
                    <Icon className={cn('h-3.5 w-3.5', isActive ? '' : 'opacity-50')} />
                    {card.label}
                  </span>
                  <Badge
                    variant={isActive ? card.badgeVariant : 'outline'}
                    className={cn(
                      'text-xs min-w-[24px] justify-center',
                      !isActive && 'text-gray-400'
                    )}
                  >
                    {count}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-3">
                <p className={cn(
                  'text-[10px] leading-tight',
                  isActive ? '' : 'text-gray-400'
                )}>
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function RiskQueueSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-7 w-7" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-2 border-gray-200">
            <CardHeader className="pb-1 pt-3 px-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-6 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

interface UseExceptionCountsReturn {
  counts: ExceptionCounts;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useExceptionCounts(): UseExceptionCountsReturn {
  const [counts, setCounts] = useState<ExceptionCounts>({
    critical: 0,
    warning: 0,
    block: 0,
    info: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/exceptions');
      if (!response.ok) {
        throw new Error('Failed to fetch exception counts');
      }
      const data = await response.json();
      if (data.success) {
        setCounts(data.data.counts);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  return { counts, isLoading, error, refresh: fetchCounts };
}
