/**
 * Txt - Typography component with semantic variants
 * 
 * Layer 1 (atoms) per CONT_10 BioSkin Architecture
 * Uses foundation classes directly from globals-foundation.css
 */

import * as React from 'react';
import { cn } from './utils';

export interface TxtProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  variant?: 'display' | 'heading' | 'subheading' | 'body' | 'small' | 'caption' | 'label' | 'micro';
  color?: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'disabled' | 'brand' | 'success' | 'warning' | 'danger';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'label';
  mono?: boolean;
}

// Foundation typography scale (from tailwind.config.js)
const variantClasses = {
  display: 'text-display',      // 36px
  heading: 'text-heading',      // 24px
  subheading: 'text-subheading', // 20px
  body: 'text-body',            // 16px
  small: 'text-small',          // 14px
  caption: 'text-caption',      // 12px
  label: 'text-label uppercase tracking-wide', // 11px
  micro: 'text-micro',          // 10px
} as const;

// Foundation color hierarchy (from globals-foundation.css)
const colorClasses = {
  primary: 'text-foreground',           // 93% - main content
  secondary: 'text-muted-foreground',   // 60% - supporting
  tertiary: 'text-muted-foreground',    // 60% - alias for backwards compat
  muted: 'text-muted-foreground',       // 60% - alias
  disabled: 'text-muted-foreground opacity-50',
  brand: 'text-primary',                // Electric Blue
  success: 'text-green-500',
  warning: 'text-yellow-500',
  danger: 'text-red-500',
} as const;

const weightClasses = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
} as const;

const defaultElements: Record<TxtProps['variant'] & string, TxtProps['as']> = {
  display: 'h1',
  heading: 'h2',
  subheading: 'h3',
  body: 'p',
  small: 'p',
  caption: 'span',
  label: 'span',
  micro: 'span',
};

export function Txt({
  children,
  variant = 'body',
  color = 'primary',
  weight,
  as,
  mono = false,
  className,
  ...props
}: TxtProps) {
  const Component = as || defaultElements[variant] || 'span';

  return (
    <Component
      className={cn(
        variantClasses[variant],
        colorClasses[color],
        weight && weightClasses[weight],
        mono && 'font-mono',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

Txt.displayName = 'Txt';

export const COMPONENT_META = {
  code: 'BIOSKIN_Txt',
  version: '1.0.0',
  layer: 'atoms',
  family: 'TYPOGRAPHY',
  status: 'stable',
} as const;
