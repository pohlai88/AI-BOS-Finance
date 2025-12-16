/**
 * Btn - Button primitive with semantic variants
 * 
 * Layer 1 (atoms) per CONT_10 BioSkin Architecture
 * Uses design tokens from globals.css
 */

import * as React from 'react';
import { cn } from './utils';

export interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
  secondary: 'bg-surface-subtle text-text-primary hover:bg-surface-hover border border-default',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
  outline: 'border border-default text-text-primary hover:bg-surface-hover',
  danger: 'bg-status-danger text-white hover:bg-status-danger/90',
} as const;

const sizeClasses = {
  sm: 'h-8 px-3 text-small',
  md: 'h-10 px-4 text-body',
  lg: 'h-12 px-6 text-body',
} as const;

export function Btn({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  ...props
}: BtnProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        'transition-colors duration-fast',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

Btn.displayName = 'Btn';

export const COMPONENT_META = {
  code: 'BIOSKIN_Btn',
  version: '1.0.0',
  layer: 'atoms',
  family: 'BUTTON',
  status: 'stable',
} as const;
