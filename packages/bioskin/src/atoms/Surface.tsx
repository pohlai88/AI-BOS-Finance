/**
 * Surface - Card/panel wrapper with semantic variants
 * 
 * Layer 1 (atoms) per CONT_10 BioSkin Architecture
 * Uses foundation classes directly from globals-foundation.css
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

// Foundation surface hierarchy (from globals-foundation.css)
const variantClasses = {
  card: 'bg-card',                              // Surface level
  subtle: 'bg-background',                      // Base level
  nested: 'bg-elevated',                        // Elevated level
  glass: 'bg-card/60 backdrop-blur-md',         // Glass effect
} as const;

// Standard Tailwind padding
const paddingClasses = {
  none: '',
  sm: 'p-3',    // 12px
  md: 'p-4',    // 16px
  lg: 'p-6',    // 24px
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
