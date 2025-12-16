/**
 * Spinner - Loading indicator with multiple variants
 * 
 * Sprint 3 Day 14 per BIOSKIN 2.1 PRD
 * 8 animated spinner variants powered by motion.
 * 
 * @example
 * <Spinner />
 * <Spinner variant="dots" size="lg" />
 * <Spinner variant="pulse" color="success" />
 */

'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { cn } from '../atoms/utils';

// ============================================================
// Types
// ============================================================

export type SpinnerVariant =
  | 'default'    // Classic spinning circle
  | 'dots'       // Three bouncing dots
  | 'pulse'      // Pulsing circle
  | 'bars'       // Three animated bars
  | 'ring'       // Rotating ring
  | 'dual-ring'  // Two rotating rings
  | 'bounce'     // Bouncing dot
  | 'wave';      // Wave animation

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerColor = 'default' | 'primary' | 'success' | 'warning' | 'danger';

export interface SpinnerProps {
  /** Spinner variant */
  variant?: SpinnerVariant;
  /** Size */
  size?: SpinnerSize;
  /** Color */
  color?: SpinnerColor;
  /** Loading text (screen reader) */
  label?: string;
  /** Additional className */
  className?: string;
}

// ============================================================
// Size & Color Mappings
// ============================================================

const sizeMap: Record<SpinnerSize, { container: string; stroke: number }> = {
  xs: { container: 'w-4 h-4', stroke: 2 },
  sm: { container: 'w-5 h-5', stroke: 2 },
  md: { container: 'w-6 h-6', stroke: 2.5 },
  lg: { container: 'w-8 h-8', stroke: 3 },
  xl: { container: 'w-12 h-12', stroke: 3 },
};

const colorMap: Record<SpinnerColor, string> = {
  default: 'text-text-muted',
  primary: 'text-accent-primary',
  success: 'text-status-success',
  warning: 'text-status-warning',
  danger: 'text-status-danger',
};

// ============================================================
// Spinner Variants
// ============================================================

function DefaultSpinner({ size, color }: { size: SpinnerSize; color: SpinnerColor }) {
  const { container, stroke } = sizeMap[size];

  return (
    <svg className={cn(container, colorMap[color], 'animate-spin')} viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth={stroke}
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function DotsSpinner({ size, color }: { size: SpinnerSize; color: SpinnerColor }) {
  const dotSize = size === 'xs' ? 'w-1 h-1' : size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : size === 'lg' ? 'w-2.5 h-2.5' : 'w-3 h-3';

  return (
    <div className={cn('flex items-center gap-1', sizeMap[size].container)}>
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className={cn(dotSize, 'rounded-full bg-current', colorMap[color])}
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

function PulseSpinner({ size, color }: { size: SpinnerSize; color: SpinnerColor }) {
  return (
    <motion.div
      className={cn(sizeMap[size].container, 'rounded-full bg-current', colorMap[color])}
      animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function BarsSpinner({ size, color }: { size: SpinnerSize; color: SpinnerColor }) {
  const barHeight = size === 'xs' ? 'h-3' : size === 'sm' ? 'h-4' : size === 'md' ? 'h-5' : size === 'lg' ? 'h-6' : 'h-8';
  const barWidth = size === 'xs' || size === 'sm' ? 'w-0.5' : 'w-1';

  return (
    <div className={cn('flex items-end gap-0.5', sizeMap[size].container)}>
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className={cn(barWidth, barHeight, 'rounded-full bg-current', colorMap[color])}
          animate={{ scaleY: [0.4, 1, 0.4] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
          style={{ transformOrigin: 'bottom' }}
        />
      ))}
    </div>
  );
}

function RingSpinner({ size, color }: { size: SpinnerSize; color: SpinnerColor }) {
  const { container, stroke } = sizeMap[size];

  return (
    <motion.svg
      className={cn(container, colorMap[color])}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray="40 60"
      />
    </motion.svg>
  );
}

function DualRingSpinner({ size, color }: { size: SpinnerSize; color: SpinnerColor }) {
  const { container, stroke } = sizeMap[size];

  return (
    <div className={cn(container, 'relative')}>
      <motion.svg
        className={cn('absolute inset-0', colorMap[color])}
        viewBox="0 0 24 24"
        fill="none"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeDasharray="30 70" />
      </motion.svg>
      <motion.svg
        className={cn('absolute inset-0 opacity-50', colorMap[color])}
        viewBox="0 0 24 24"
        fill="none"
        animate={{ rotate: -360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      >
        <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeDasharray="20 40" />
      </motion.svg>
    </div>
  );
}

function BounceSpinner({ size, color }: { size: SpinnerSize; color: SpinnerColor }) {
  return (
    <motion.div
      className={cn(sizeMap[size].container, 'rounded-full bg-current', colorMap[color])}
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function WaveSpinner({ size, color }: { size: SpinnerSize; color: SpinnerColor }) {
  const dotSize = size === 'xs' ? 'w-1 h-1' : size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : size === 'lg' ? 'w-2.5 h-2.5' : 'w-3 h-3';

  return (
    <div className={cn('flex items-center gap-0.5', sizeMap[size].container)}>
      {[0, 1, 2, 3, 4].map(i => (
        <motion.span
          key={i}
          className={cn(dotSize, 'rounded-full bg-current', colorMap[color])}
          animate={{ scale: [0.5, 1, 0.5], opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

const variantMap: Record<SpinnerVariant, React.FC<{ size: SpinnerSize; color: SpinnerColor }>> = {
  default: DefaultSpinner,
  dots: DotsSpinner,
  pulse: PulseSpinner,
  bars: BarsSpinner,
  ring: RingSpinner,
  'dual-ring': DualRingSpinner,
  bounce: BounceSpinner,
  wave: WaveSpinner,
};

export function Spinner({
  variant = 'default',
  size = 'md',
  color = 'default',
  label = 'Loading',
  className,
}: SpinnerProps) {
  const SpinnerComponent = variantMap[variant];

  return (
    <div
      role="status"
      aria-label={label}
      className={cn('inline-flex items-center justify-center', className)}
    >
      <SpinnerComponent size={size} color={color} />
      <span className="sr-only">{label}</span>
    </div>
  );
}

Spinner.displayName = 'Spinner';

export const COMPONENT_META = {
  code: 'BIOSKIN_Spinner',
  version: '2.0.0',
  layer: 'molecules',
  family: 'FEEDBACK',
  status: 'stable',
  poweredBy: 'motion',
} as const;
