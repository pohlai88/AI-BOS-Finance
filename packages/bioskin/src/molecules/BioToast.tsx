/**
 * BioToast - Unified Notification System
 *
 * Wrapper around Sonner with BioSkin styling and convenience methods.
 *
 * Features:
 * - Consistent styling with BioSkin theme
 * - Type-safe toast methods
 * - Promise toasts for async operations
 * - Positioned provider
 *
 * @example
 * // In layout:
 * <BioToastProvider />
 *
 * // In components:
 * import { bioToast } from '@aibos/bioskin';
 * bioToast.success('Payment approved!');
 * bioToast.error('Failed to save');
 * bioToast.promise(saveData(), { loading: 'Saving...', success: 'Saved!', error: 'Failed' });
 */

'use client';

import * as React from 'react';
import { Toaster, toast, type ExternalToast } from 'sonner';
import { CheckCircle, XCircle, AlertCircle, Info, Loader2 } from 'lucide-react';
import { cn } from '../atoms/utils';

// ============================================================
// Types
// ============================================================

export type BioToastPosition = 
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface BioToastProviderProps {
  /** Toast position */
  position?: BioToastPosition;
  /** Theme mode */
  theme?: 'light' | 'dark' | 'system';
  /** Close button on all toasts */
  closeButton?: boolean;
  /** Rich colors */
  richColors?: boolean;
  /** Max visible toasts */
  visibleToasts?: number;
  /** Gap between toasts */
  gap?: number;
  /** Expand by default */
  expand?: boolean;
  /** Additional className */
  className?: string;
}

export interface BioToastOptions extends ExternalToast {
  /** Toast type */
  type?: 'success' | 'error' | 'warning' | 'info' | 'loading';
}

export interface BioPromiseOptions<T> {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((error: unknown) => string);
}

// ============================================================
// Provider Component
// ============================================================

export function BioToastProvider({
  position = 'bottom-right',
  theme = 'dark',
  closeButton = true,
  richColors = true,
  visibleToasts = 4,
  gap = 8,
  expand = false,
  className,
}: BioToastProviderProps) {
  return (
    <Toaster
      position={position}
      theme={theme}
      closeButton={closeButton}
      richColors={richColors}
      visibleToasts={visibleToasts}
      gap={gap}
      expand={expand}
      className={className}
      toastOptions={{
        classNames: {
          toast: cn(
            'group toast bg-surface-card border-border-default',
            'shadow-lg rounded-lg'
          ),
          title: 'text-text-primary font-medium',
          description: 'text-text-secondary text-sm',
          actionButton: 'bg-accent-primary text-white',
          cancelButton: 'bg-surface-subtle text-text-secondary',
          closeButton: 'bg-surface-subtle border-border-default',
          success: 'border-status-success/30',
          error: 'border-status-error/30',
          warning: 'border-status-warning/30',
          info: 'border-status-info/30',
        },
      }}
    />
  );
}

// ============================================================
// Toast API
// ============================================================

const icons = {
  success: <CheckCircle className="w-5 h-5 text-status-success" />,
  error: <XCircle className="w-5 h-5 text-status-error" />,
  warning: <AlertCircle className="w-5 h-5 text-status-warning" />,
  info: <Info className="w-5 h-5 text-status-info" />,
  loading: <Loader2 className="w-5 h-5 text-accent-primary animate-spin" />,
};

export const bioToast = {
  /**
   * Show a basic toast
   */
  show: (message: string, options?: BioToastOptions) => {
    return toast(message, options);
  },

  /**
   * Show a success toast
   */
  success: (message: string, options?: Omit<BioToastOptions, 'type'>) => {
    return toast.success(message, {
      icon: icons.success,
      ...options,
    });
  },

  /**
   * Show an error toast
   */
  error: (message: string, options?: Omit<BioToastOptions, 'type'>) => {
    return toast.error(message, {
      icon: icons.error,
      ...options,
    });
  },

  /**
   * Show a warning toast
   */
  warning: (message: string, options?: Omit<BioToastOptions, 'type'>) => {
    return toast.warning(message, {
      icon: icons.warning,
      ...options,
    });
  },

  /**
   * Show an info toast
   */
  info: (message: string, options?: Omit<BioToastOptions, 'type'>) => {
    return toast.info(message, {
      icon: icons.info,
      ...options,
    });
  },

  /**
   * Show a loading toast
   */
  loading: (message: string, options?: Omit<BioToastOptions, 'type'>) => {
    return toast.loading(message, {
      icon: icons.loading,
      ...options,
    });
  },

  /**
   * Show a promise toast (loading → success/error)
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: BioPromiseOptions<T>,
    options?: Omit<BioToastOptions, 'type'>
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      ...options,
    });
  },

  /**
   * Show a custom toast with JSX
   */
  custom: (jsx: React.ReactNode, options?: BioToastOptions) => {
    return toast.custom(() => jsx, options);
  },

  /**
   * Dismiss a toast by ID
   */
  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },
};

// ============================================================
// Component Meta
// ============================================================

export const TOAST_META = {
  code: 'TOAST01',
  version: '1.0.0',
  family: 'FEEDBACK',
  purpose: 'NOTIFICATION',
  status: 'active',
} as const;
