/**
 * StatusBadge - Semantic status indicator with auto-color mapping
 * 
 * Layer 2 (molecules) per CONT_10 BioSkin Architecture
 * Automatically maps status values to semantic colors.
 */

import * as React from 'react';
import { cn } from '../atoms/utils';
import { Txt } from '../atoms/Txt';
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
  status: string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

// Semantic color mapping - auto-detects status meaning
const STATUS_COLORS: Record<string, {
  bg: string;
  text: string;
  border: string;
  icon: LucideIcon;
  label?: string;
}> = {
  // Success states
  completed: { bg: 'bg-status-success/10', text: 'text-status-success', border: 'border-status-success/30', icon: CheckCircle, label: 'Completed' },
  approved: { bg: 'bg-status-success/10', text: 'text-status-success', border: 'border-status-success/30', icon: CheckCircle, label: 'Approved' },
  active: { bg: 'bg-status-success/10', text: 'text-status-success', border: 'border-status-success/30', icon: CheckCircle, label: 'Active' },
  executed: { bg: 'bg-status-success/10', text: 'text-status-success', border: 'border-status-success/30', icon: CheckCircle, label: 'Executed' },
  success: { bg: 'bg-status-success/10', text: 'text-status-success', border: 'border-status-success/30', icon: CheckCircle, label: 'Success' },
  
  // Warning states
  pending: { bg: 'bg-status-warning/10', text: 'text-status-warning', border: 'border-status-warning/30', icon: Clock, label: 'Pending' },
  pending_approval: { bg: 'bg-status-warning/10', text: 'text-status-warning', border: 'border-status-warning/30', icon: Clock, label: 'Pending Approval' },
  processing: { bg: 'bg-status-warning/10', text: 'text-status-warning', border: 'border-status-warning/30', icon: Clock, label: 'Processing' },
  in_progress: { bg: 'bg-status-warning/10', text: 'text-status-warning', border: 'border-status-warning/30', icon: Clock, label: 'In Progress' },
  warning: { bg: 'bg-status-warning/10', text: 'text-status-warning', border: 'border-status-warning/30', icon: AlertCircle, label: 'Warning' },
  
  // Danger states
  failed: { bg: 'bg-status-danger/10', text: 'text-status-danger', border: 'border-status-danger/30', icon: XCircle, label: 'Failed' },
  rejected: { bg: 'bg-status-danger/10', text: 'text-status-danger', border: 'border-status-danger/30', icon: XCircle, label: 'Rejected' },
  error: { bg: 'bg-status-danger/10', text: 'text-status-danger', border: 'border-status-danger/30', icon: XCircle, label: 'Error' },
  cancelled: { bg: 'bg-status-danger/10', text: 'text-status-danger', border: 'border-status-danger/30', icon: XCircle, label: 'Cancelled' },
  
  // Neutral states
  draft: { bg: 'bg-surface-subtle', text: 'text-text-secondary', border: 'border-default', icon: FileEdit, label: 'Draft' },
  inactive: { bg: 'bg-surface-subtle', text: 'text-text-secondary', border: 'border-default', icon: Pause, label: 'Inactive' },
  unknown: { bg: 'bg-surface-subtle', text: 'text-text-secondary', border: 'border-default', icon: AlertCircle, label: 'Unknown' },
};

function getStatusConfig(status: string) {
  const normalizedStatus = status.toLowerCase().replace(/[\s-]/g, '_');
  return STATUS_COLORS[normalizedStatus] || STATUS_COLORS.unknown;
}

export function StatusBadge({
  status,
  className,
  showIcon = true,
  size = 'md',
}: StatusBadgeProps) {
  const config = getStatusConfig(status);
  const Icon = config.icon;
  const displayLabel = config.label || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-micro gap-1',
    md: 'px-2.5 py-1 text-small gap-1.5',
  };

  return (
    <span
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
    >
      {showIcon && (
        <Icon
          className={cn(size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')}
          aria-hidden="true"
        />
      )}
      <span>{displayLabel}</span>
    </span>
  );
}

StatusBadge.displayName = 'StatusBadge';

export const COMPONENT_META = {
  code: 'BIOSKIN_StatusBadge',
  version: '1.0.0',
  layer: 'molecules',
  family: 'FEEDBACK',
  status: 'stable',
} as const;
