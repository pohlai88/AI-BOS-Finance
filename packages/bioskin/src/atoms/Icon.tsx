/**
 * Icon - Icon wrapper component
 * 
 * Layer 1 (atoms) per CONT_10 BioSkin Architecture
 * Wraps lucide-react icons with consistent sizing and styling
 */

import * as React from 'react';
import { cn } from './utils';
import type { LucideIcon } from 'lucide-react';

export interface IconProps extends React.SVGAttributes<SVGElement> {
  icon: LucideIcon;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'tertiary' | 'brand' | 'success' | 'warning' | 'danger' | 'inherit';
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
} as const;

const colorClasses = {
  primary: 'text-text-primary',
  secondary: 'text-text-secondary',
  tertiary: 'text-text-tertiary',
  brand: 'text-primary',
  success: 'text-status-success',
  warning: 'text-status-warning',
  danger: 'text-status-danger',
  inherit: '',
} as const;

export function Icon({
  icon: IconComponent,
  size = 'md',
  color = 'inherit',
  className,
  ...props
}: IconProps) {
  return (
    <IconComponent
      className={cn(
        sizeClasses[size],
        colorClasses[color],
        'flex-shrink-0',
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

Icon.displayName = 'Icon';

export const COMPONENT_META = {
  code: 'BIOSKIN_Icon',
  version: '1.0.0',
  layer: 'atoms',
  family: 'ICON',
  status: 'stable',
} as const;
