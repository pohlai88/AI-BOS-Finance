/**
 * EmptyState - Placeholder for empty content areas
 * 
 * Layer 2 (molecules) per CONT_10 BioSkin Architecture
 */

import * as React from 'react';
import { cn } from '../atoms/utils';
import { Surface } from '../atoms/Surface';
import { Txt } from '../atoms/Txt';
import { Btn, type BtnProps } from '../atoms/Btn';
import { Inbox, type LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: BtnProps['variant'];
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Surface
      variant="subtle"
      padding="lg"
      className={cn(
        'flex flex-col items-center justify-center text-center min-h-[200px]',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-surface-nested flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-text-tertiary" aria-hidden="true" />
      </div>
      
      <Txt variant="subheading" color="primary" weight="medium">
        {title}
      </Txt>
      
      {description && (
        <Txt variant="body" color="secondary" className="mt-2 max-w-sm">
          {description}
        </Txt>
      )}
      
      {action && (
        <Btn
          variant={action.variant || 'primary'}
          onClick={action.onClick}
          className="mt-4"
        >
          {action.label}
        </Btn>
      )}
    </Surface>
  );
}

EmptyState.displayName = 'EmptyState';

export const COMPONENT_META = {
  code: 'BIOSKIN_EmptyState',
  version: '1.0.0',
  layer: 'molecules',
  family: 'FEEDBACK',
  status: 'stable',
} as const;
