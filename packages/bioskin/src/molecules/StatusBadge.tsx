/**
 * StatusBadge - Semantic status indicator with auto-color mapping
 * 
 * Layer 2 (molecules) per CONT_10 BioSkin Architecture v2.1
 * Automatically maps status values to semantic colors.
 * 
 * Now powered by `motion` for animated pulsing dot indicators.
 * Wrapped in React.memo for optimal performance in list renders.
 * 
 * @example
 * // Basic usage
 * <StatusBadge status="pending" />
 * 
 * @example
 * // With pulsing indicator
 * <StatusBadge status="processing" pulse />
 * 
 * @example
 * // With dot only (no text)
 * <StatusBadge status="active" variant="dot" />
 */

'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { cn } from '../atoms/utils';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  FileEdit,
  Pause,
  type LucideIcon,
} from 'lucide-react';

export interface StatusBadgeProps {
  /** The status value to display */
  status: string;
  /** Additional CSS classes */
  className?: string;
  /** Show icon before text (default: true) */
  showIcon?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Display variant: 'badge' shows full badge, 'dot' shows only animated dot */
  variant?: 'badge' | 'dot';
  /** Enable pulsing animation (great for active/processing states) */
  pulse?: boolean;
  /** Custom label override (default: auto-generated from status) */
  label?: string;
}

// Semantic color mapping - uses foundation classes directly
const STATUS_COLORS: Record<string, {
  bg: string;
  text: string;
  border: string;
  dot: string;
  icon: LucideIcon;
  label?: string;
  defaultPulse?: boolean;
}> = {
  // Success states (green)
  completed: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30', dot: 'bg-green-500', icon: CheckCircle, label: 'Completed' },
  approved: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30', dot: 'bg-green-500', icon: CheckCircle, label: 'Approved' },
  active: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30', dot: 'bg-green-500', icon: CheckCircle, label: 'Active', defaultPulse: true },
  executed: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30', dot: 'bg-green-500', icon: CheckCircle, label: 'Executed' },
  success: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30', dot: 'bg-green-500', icon: CheckCircle, label: 'Success' },

  // Warning states (yellow/amber)
  pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/30', dot: 'bg-yellow-500', icon: Clock, label: 'Pending' },
  pending_approval: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/30', dot: 'bg-yellow-500', icon: Clock, label: 'Pending Approval' },
  processing: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/30', dot: 'bg-yellow-500', icon: Clock, label: 'Processing', defaultPulse: true },
  in_progress: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/30', dot: 'bg-yellow-500', icon: Clock, label: 'In Progress', defaultPulse: true },
  warning: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/30', dot: 'bg-yellow-500', icon: AlertCircle, label: 'Warning' },

  // Danger states (red)
  failed: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30', dot: 'bg-red-500', icon: XCircle, label: 'Failed' },
  rejected: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30', dot: 'bg-red-500', icon: XCircle, label: 'Rejected' },
  error: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30', dot: 'bg-red-500', icon: XCircle, label: 'Error' },
  cancelled: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30', dot: 'bg-red-500', icon: XCircle, label: 'Cancelled' },

  // Neutral states (gray)
  draft: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border', dot: 'bg-muted-foreground', icon: FileEdit, label: 'Draft' },
  inactive: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border', dot: 'bg-muted-foreground', icon: Pause, label: 'Inactive' },
  unknown: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border', dot: 'bg-muted-foreground', icon: AlertCircle, label: 'Unknown' },
};

function getStatusConfig(status: string) {
  const normalizedStatus = status.toLowerCase().replace(/[\s-]/g, '_');
  return STATUS_COLORS[normalizedStatus] || STATUS_COLORS.unknown;
}

// ============================================================
// Animation Constants (extracted for performance)
// ============================================================

const BADGE_ANIMATION = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.2, ease: 'easeOut' },
} as const;

const PULSE_ANIMATION = {
  initial: { scale: 0.5, opacity: 0.75 },
  animate: { scale: 1.5, opacity: 0 },
  transition: { duration: 1.5, repeat: Infinity, ease: 'easeOut' },
} as const;

const DOT_SIZES = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
} as const;

const PULSE_SIZES = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
} as const;

/**
 * Pulsing Dot Component - Animated status indicator
 * Memoized for optimal performance in list renders
 */
const PulsingDot = React.memo(function PulsingDot({
  color,
  pulse,
  size
}: {
  color: string;
  pulse: boolean;
  size: 'sm' | 'md' | 'lg';
}) {
  return (
    <span className="relative inline-flex items-center justify-center">
      {/* Static dot */}
      <span
        className={cn(
          'rounded-full',
          color,
          DOT_SIZES[size]
        )}
      />

      {/* Pulsing ring */}
      {pulse && (
        <motion.span
          className={cn(
            'absolute rounded-full',
            color,
            PULSE_SIZES[size],
            'opacity-75'
          )}
          {...PULSE_ANIMATION}
        />
      )}
    </span>
  );
});

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-micro gap-1',
  md: 'px-2.5 py-1 text-small gap-1.5',
  lg: 'px-3 py-1.5 text-base gap-2',
} as const;

const ICON_SIZES = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
} as const;

/**
 * StatusBadge Component
 * Wrapped in React.memo for optimal performance when rendered in lists/tables
 */
export const StatusBadge = React.memo(function StatusBadge({
  status,
  className,
  showIcon = true,
  size = 'md',
  variant = 'badge',
  pulse,
  label,
}: StatusBadgeProps) {
  const config = getStatusConfig(status);
  const Icon = config.icon;
  const displayLabel = label || config.label || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');

  // Auto-enable pulse for active states if not explicitly set
  const shouldPulse = pulse ?? config.defaultPulse ?? false;

  // Dot-only variant
  if (variant === 'dot') {
    return (
      <span
        className={cn('inline-flex items-center', className)}
        role="status"
        aria-label={`Status: ${displayLabel}`}
        title={displayLabel}
      >
        <PulsingDot color={config.dot} pulse={shouldPulse} size={size} />
      </span>
    );
  }

  // Full badge variant
  return (
    <motion.span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        config.bg,
        config.text,
        config.border,
        SIZE_CLASSES[size],
        className
      )}
      role="status"
      aria-label={`Status: ${displayLabel}`}
      {...BADGE_ANIMATION}
    >
      {showIcon && (
        <>
          {shouldPulse ? (
            <PulsingDot color={config.dot} pulse={shouldPulse} size={size} />
          ) : (
            <Icon
              className={ICON_SIZES[size]}
              aria-hidden="true"
            />
          )}
        </>
      )}
      <span>{displayLabel}</span>
    </motion.span>
  );
});

StatusBadge.displayName = 'StatusBadge';

// Export the dot component for standalone use
export { PulsingDot };

export const COMPONENT_META = {
  code: 'BIOSKIN_StatusBadge',
  version: '2.0.0',
  layer: 'molecules',
  family: 'FEEDBACK',
  status: 'stable',
  poweredBy: 'motion',
} as const;
