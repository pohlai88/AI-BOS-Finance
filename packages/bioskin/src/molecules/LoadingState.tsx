/**
 * LoadingState - Loading skeleton placeholder
 *
 * Layer 2 (molecules) per CONT_10 BioSkin Architecture
 *
 * Enhanced with:
 * - Multiple skeleton variants (table, card, form, list)
 * - Progress indicator option
 * - Customizable skeleton shapes
 */

import * as React from 'react';
import { cn } from '../atoms/utils';
import { Surface } from '../atoms/Surface';
import { Txt } from '../atoms/Txt';

export type SkeletonVariant =
  | 'spinner'
  | 'skeleton'
  | 'pulse'
  | 'table'
  | 'card'
  | 'form'
  | 'list'
  | 'detail';

export interface LoadingStateProps {
  variant?: SkeletonVariant;
  text?: string;
  rows?: number;
  /** Number of columns for table variant */
  columns?: number;
  /** Show progress bar */
  progress?: number;
  /** Custom skeleton layout */
  layout?: 'horizontal' | 'vertical';
  className?: string;
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-surface-subtle',
        className
      )}
    />
  );
}

export function LoadingState({
  variant = 'skeleton',
  text,
  rows = 3,
  columns = 4,
  progress,
  layout = 'vertical',
  className,
}: LoadingStateProps) {
  // Progress bar component
  const ProgressBar = progress !== undefined && (
    <div className="w-full max-w-xs mx-auto mb-4">
      <div className="h-1.5 bg-surface-nested rounded-full overflow-hidden">
        <div
          className="h-full bg-accent-primary transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {text && (
        <Txt variant="caption" color="tertiary" className="mt-1 text-center">
          {text}
        </Txt>
      )}
    </div>
  );

  if (variant === 'spinner') {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-3 p-8', className)}>
        {ProgressBar || (
          <>
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            {text && (
              <Txt variant="small" color="secondary">
                {text}
              </Txt>
            )}
          </>
        )}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <Surface variant="subtle" padding="md" className={cn('animate-pulse', className)}>
        {ProgressBar}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-surface-nested" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-surface-nested rounded w-3/4" />
            <div className="h-3 bg-surface-nested rounded w-1/2" />
          </div>
        </div>
        {!progress && text && (
          <Txt variant="small" color="tertiary" className="mt-4 text-center">
            {text}
          </Txt>
        )}
      </Surface>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn('space-y-2', className)}>
        {ProgressBar}
        {/* Header */}
        <div className="flex gap-4 p-3 bg-surface-subtle rounded-t-lg">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 p-3 border-b border-default">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton
                key={j}
                className={cn('h-4 flex-1', j === 0 && 'max-w-[100px]')}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'grid gap-4',
          layout === 'horizontal' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : '',
          className
        )}
      >
        {ProgressBar && <div className="col-span-full">{ProgressBar}</div>}
        {Array.from({ length: rows }).map((_, i) => (
          <Surface key={i} variant="card" padding="md" className="animate-pulse">
            <Skeleton className="h-32 w-full rounded-lg mb-4" />
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-2/3" />
          </Surface>
        ))}
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <div className={cn('space-y-6', className)}>
        {ProgressBar}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-20 rounded-lg" />
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-2', className)}>
        {ProgressBar}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-surface-subtle rounded-lg">
            <Skeleton className="h-8 w-8 rounded" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-16 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div className={cn('space-y-6', className)}>
        {ProgressBar}
        {/* Header */}
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded" />
              <Skeleton className="h-6 w-20 rounded" />
            </div>
          </div>
        </div>
        {/* Content sections */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default: skeleton rows
  return (
    <div className={cn('space-y-3', className)}>
      {ProgressBar}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
      {!progress && text && (
        <Txt variant="small" color="tertiary" className="text-center">
          {text}
        </Txt>
      )}
    </div>
  );
}

LoadingState.displayName = 'LoadingState';

export const COMPONENT_META = {
  code: 'BIOSKIN_LoadingState',
  version: '1.0.0',
  layer: 'molecules',
  family: 'FEEDBACK',
  status: 'stable',
} as const;
