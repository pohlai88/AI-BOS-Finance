/**
 * StatusBadge - Semantic status indicator with auto-color mapping
 * 
 * Layer 2 (molecules) per CONT_10 BioSkin Architecture v2.1
 * Automatically maps status values to semantic colors.
 * 
 * Now powered by `motion` for animated pulsing dot indicators.
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

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

// Semantic color mapping - auto-detects status meaning
const STATUS_COLORS: Record<string, {
  bg: string;
  text: string;
  border: string;
  dot: string;
  icon: LucideIcon;
  label?: string;
  defaultPulse?: boolean;
}> = {
  // Success states
  completed: { bg: 'bg-status-success/10', text: 'text-status-success', border: 'border-status-success/30', dot: 'bg-status-success', icon: CheckCircle, label: 'Completed' },
  approved: { bg: 'bg-status-success/10', text: 'text-status-success', border: 'border-status-success/30', dot: 'bg-status-success', icon: CheckCircle, label: 'Approved' },
  active: { bg: 'bg-status-success/10', text: 'text-status-success', border: 'border-status-success/30', dot: 'bg-status-success', icon: CheckCircle, label: 'Active', defaultPulse: true },
  executed: { bg: 'bg-status-success/10', text: 'text-status-success', border: 'border-status-success/30', dot: 'bg-status-success', icon: CheckCircle, label: 'Executed' },
  success: { bg: 'bg-status-success/10', text: 'text-status-success', border: 'border-status-success/30', dot: 'bg-status-success', icon: CheckCircle, label: 'Success' },

  // Warning states
  pending: { bg: 'bg-status-warning/10', text: 'text-status-warning', border: 'border-status-warning/30', dot: 'bg-status-warning', icon: Clock, label: 'Pending' },
  pending_approval: { bg: 'bg-status-warning/10', text: 'text-status-warning', border: 'border-status-warning/30', dot: 'bg-status-warning', icon: Clock, label: 'Pending Approval' },
  processing: { bg: 'bg-status-warning/10', text: 'text-status-warning', border: 'border-status-warning/30', dot: 'bg-status-warning', icon: Clock, label: 'Processing', defaultPulse: true },
  in_progress: { bg: 'bg-status-warning/10', text: 'text-status-warning', border: 'border-status-warning/30', dot: 'bg-status-warning', icon: Clock, label: 'In Progress', defaultPulse: true },
  warning: { bg: 'bg-status-warning/10', text: 'text-status-warning', border: 'border-status-warning/30', dot: 'bg-status-warning', icon: AlertCircle, label: 'Warning' },

  // Danger states
  failed: { bg: 'bg-status-danger/10', text: 'text-status-danger', border: 'border-status-danger/30', dot: 'bg-status-danger', icon: XCircle, label: 'Failed' },
  rejected: { bg: 'bg-status-danger/10', text: 'text-status-danger', border: 'border-status-danger/30', dot: 'bg-status-danger', icon: XCircle, label: 'Rejected' },
  error: { bg: 'bg-status-danger/10', text: 'text-status-danger', border: 'border-status-danger/30', dot: 'bg-status-danger', icon: XCircle, label: 'Error' },
  cancelled: { bg: 'bg-status-danger/10', text: 'text-status-danger', border: 'border-status-danger/30', dot: 'bg-status-danger', icon: XCircle, label: 'Cancelled' },

  // Neutral states
  draft: { bg: 'bg-surface-subtle', text: 'text-text-secondary', border: 'border-default', dot: 'bg-text-muted', icon: FileEdit, label: 'Draft' },
  inactive: { bg: 'bg-surface-subtle', text: 'text-text-secondary', border: 'border-default', dot: 'bg-text-muted', icon: Pause, label: 'Inactive' },
  unknown: { bg: 'bg-surface-subtle', text: 'text-text-secondary', border: 'border-default', dot: 'bg-text-muted', icon: AlertCircle, label: 'Unknown' },
};

function getStatusConfig(status: string) {
  const normalizedStatus = status.toLowerCase().replace(/[\s-]/g, '_');
  return STATUS_COLORS[normalizedStatus] || STATUS_COLORS.unknown;
}

/**
 * Pulsing Dot Component - Animated status indicator
 */
function PulsingDot({
  color,
  pulse,
  size
}: {
  color: string;
  pulse: boolean;
  size: 'sm' | 'md' | 'lg';
}) {
  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  const pulseSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span className="relative inline-flex items-center justify-center">
      {/* Static dot */}
      <span
        className={cn(
          'rounded-full',
          color,
          dotSizes[size]
        )}
      />

      {/* Pulsing ring */}
      {pulse && (
        <motion.span
          className={cn(
            'absolute rounded-full',
            color,
            pulseSizes[size],
            'opacity-75'
          )}
          initial={{ scale: 0.5, opacity: 0.75 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}
    </span>
  );
}

export function StatusBadge({
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

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-micro gap-1',
    md: 'px-2.5 py-1 text-small gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
  };

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
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label={`Status: ${displayLabel}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {showIcon && (
        <>
          {shouldPulse ? (
            <PulsingDot color={config.dot} pulse={shouldPulse} size={size} />
          ) : (
            <Icon
              className={cn(
                size === 'sm' ? 'w-3 h-3' :
                  size === 'md' ? 'w-3.5 h-3.5' :
                    'w-4 h-4'
              )}
              aria-hidden="true"
            />
          )}
        </>
      )}
      <span>{displayLabel}</span>
    </motion.span>
  );
}

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
