/**
 * Surface - Card/panel wrapper with semantic variants
 * 
 * Layer 1 (atoms) per CONT_10 BioSkin Architecture
 * Uses design tokens from globals.css
 */

import * as React from 'react';
import { cn } from './utils';

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'card' | 'subtle' | 'nested' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
}

const variantClasses = {
  card: 'bg-surface-card border-default',
  subtle: 'bg-surface-subtle border-subtle',
  nested: 'bg-surface-nested border-subtle',
  glass: 'bg-surface-card/60 backdrop-blur-md border-default',
} as const;

const paddingClasses = {
  none: '',
  sm: 'p-layout-xs',
  md: 'p-layout-md',
  lg: 'p-layout-lg',
} as const;

const roundedClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
} as const;

export function Surface({
  children,
  variant = 'card',
  padding = 'md',
  rounded = 'lg',
  border = true,
  className,
  ...props
}: SurfaceProps) {
  return (
    <div
      className={cn(
        variantClasses[variant],
        paddingClasses[padding],
        roundedClasses[rounded],
        border && 'border',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

Surface.displayName = 'Surface';

export const COMPONENT_META = {
  code: 'BIOSKIN_Surface',
  version: '1.0.0',
  layer: 'atoms',
  family: 'LAYOUT',
  status: 'stable',
} as const;
