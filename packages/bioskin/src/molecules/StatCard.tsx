/**
 * StatCard - Metrics display card
 * 
 * Layer 2 (molecules) per CONT_10 BioSkin Architecture
 * Displays statistics with icon, value, and label.
 */

import * as React from 'react';
import { cn } from '../atoms/utils';
import { Surface } from '../atoms/Surface';
import { Txt } from '../atoms/Txt';
import { Icon, type IconProps } from '../atoms/Icon';
import type { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  icon: LucideIcon;
  value: number | string;
  label: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  className?: string;
}

export function StatCard({
  icon,
  value,
  label,
  trend,
  className,
}: StatCardProps) {
  const cardId = `stat-card-${label.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <Surface
      variant="card"
      padding="md"
      className={cn(
        'text-center transition-all hover:bg-surface-hover',
        'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
        className
      )}
      role="region"
      aria-labelledby={`${cardId}-label`}
      tabIndex={0}
    >
      <Icon
        icon={icon}
        size="md"
        color="secondary"
        className="mx-auto mb-2"
      />
      
      <div className="flex items-center justify-center gap-2">
        <Txt variant="heading" weight="bold" className="tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Txt>
        
        {trend && (
          <span
            className={cn(
              'text-small font-medium',
              trend.direction === 'up' && 'text-status-success',
              trend.direction === 'down' && 'text-status-danger',
              trend.direction === 'neutral' && 'text-text-secondary'
            )}
          >
            {trend.direction === 'up' && '↑'}
            {trend.direction === 'down' && '↓'}
            {trend.value}%
          </span>
        )}
      </div>
      
      <Txt
        id={`${cardId}-label`}
        variant="caption"
        color="secondary"
        className="mt-1"
      >
        {label}
      </Txt>
    </Surface>
  );
}

StatCard.displayName = 'StatCard';

export const COMPONENT_META = {
  code: 'BIOSKIN_StatCard',
  version: '1.0.0',
  layer: 'molecules',
  family: 'CARD',
  status: 'stable',
} as const;
