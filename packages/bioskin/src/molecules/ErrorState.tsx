/**
 * ErrorState - Error display component
 * 
 * Layer 2 (molecules) per CONT_10 BioSkin Architecture
 */

import * as React from 'react';
import { cn } from '../atoms/utils';
import { Surface } from '../atoms/Surface';
import { Txt } from '../atoms/Txt';
import { Btn } from '../atoms/Btn';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
  className,
}: ErrorStateProps) {
  return (
    <Surface
      variant="card"
      padding="lg"
      className={cn(
        'flex flex-col items-center justify-center text-center min-h-[200px]',
        'border-status-danger/30',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-status-danger/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-status-danger" aria-hidden="true" />
      </div>
      
      <Txt variant="subheading" color="primary" weight="medium">
        {title}
      </Txt>
      
      <Txt variant="body" color="secondary" className="mt-2 max-w-sm">
        {message}
      </Txt>
      
      {onRetry && (
        <Btn
          variant="outline"
          onClick={onRetry}
          className="mt-4 gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {retryLabel}
        </Btn>
      )}
    </Surface>
  );
}

ErrorState.displayName = 'ErrorState';

export const COMPONENT_META = {
  code: 'BIOSKIN_ErrorState',
  version: '1.0.0',
  layer: 'molecules',
  family: 'FEEDBACK',
  status: 'stable',
} as const;
