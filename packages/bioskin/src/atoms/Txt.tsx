/**
 * Txt - Typography component with semantic variants
 * 
 * Layer 1 (atoms) per CONT_10 BioSkin Architecture
 * Uses design tokens from globals.css
 */

import * as React from 'react';
import { cn } from './utils';

export interface TxtProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  variant?: 'display' | 'heading' | 'subheading' | 'body' | 'small' | 'caption' | 'label' | 'micro';
  color?: 'primary' | 'secondary' | 'tertiary' | 'disabled' | 'brand' | 'success' | 'warning' | 'danger';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'label';
  mono?: boolean;
}

const variantClasses = {
  display: 'text-display',
  heading: 'text-heading',
  subheading: 'text-subheading',
  body: 'text-body',
  small: 'text-small',
  caption: 'text-caption',
  label: 'text-label uppercase tracking-wide',
  micro: 'text-micro',
} as const;

const colorClasses = {
  primary: 'text-text-primary',
  secondary: 'text-text-secondary',
  tertiary: 'text-text-tertiary',
  disabled: 'text-text-disabled',
  brand: 'text-primary',
  success: 'text-status-success',
  warning: 'text-status-warning',
  danger: 'text-status-danger',
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
