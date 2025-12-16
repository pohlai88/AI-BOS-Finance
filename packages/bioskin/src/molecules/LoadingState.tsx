/**
 * LoadingState - Loading skeleton placeholder
 * 
 * Layer 2 (molecules) per CONT_10 BioSkin Architecture
 */

import * as React from 'react';
import { cn } from '../atoms/utils';
import { Surface } from '../atoms/Surface';
import { Txt } from '../atoms/Txt';

export interface LoadingStateProps {
  variant?: 'spinner' | 'skeleton' | 'pulse';
  text?: string;
  rows?: number;
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
  className,
}: LoadingStateProps) {
  if (variant === 'spinner') {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-3 p-8', className)}>
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        {text && (
          <Txt variant="small" color="secondary">
            {text}
          </Txt>
        )}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <Surface variant="subtle" padding="md" className={cn('animate-pulse', className)}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-surface-nested" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-surface-nested rounded w-3/4" />
            <div className="h-3 bg-surface-nested rounded w-1/2" />
          </div>
        </div>
        {text && (
          <Txt variant="small" color="tertiary" className="mt-4 text-center">
            {text}
          </Txt>
        )}
      </Surface>
    );
  }

  // Default: skeleton rows
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
      {text && (
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
