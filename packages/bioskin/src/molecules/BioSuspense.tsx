/**
 * BioSuspense - Enhanced Suspense wrapper with loading states
 *
 * Features:
 * - Custom loading fallbacks
 * - Minimum loading time (prevent flash)
 * - Loading state variants
 * - Error integration
 */

'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../atoms/utils';
import { Txt } from '../atoms/Txt';
import { LoadingState } from './LoadingState';

// ============================================================
// Types
// ============================================================

export interface BioSuspenseProps {
  /** Child components (can include lazy-loaded components) */
  children: React.ReactNode;
  /** Fallback to show while loading */
  fallback?: React.ReactNode;
  /** Loading variant */
  variant?: 'spinner' | 'skeleton' | 'inline' | 'fullscreen';
  /** Skeleton variant for skeleton type */
  skeletonVariant?: 'table' | 'card' | 'form' | 'list' | 'detail';
  /** Loading message */
  message?: string;
  /** Minimum loading time in ms (prevent flash) */
  minLoadTime?: number;
  /** Additional className */
  className?: string;
}

// ============================================================
// Loading Fallbacks
// ============================================================

function SpinnerFallback({ message, className }: { message?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <Loader2 className="h-8 w-8 animate-spin text-accent-primary mb-3" />
      {message && (
        <Txt variant="body" color="secondary">
          {message}
        </Txt>
      )}
    </div>
  );
}

function InlineFallback({ message, className }: { message?: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-text-secondary', className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      {message || 'Loading...'}
    </span>
  );
}

function FullscreenFallback({ message, className }: { message?: string; className?: string }) {
  return (
    <div className={cn('fixed inset-0 z-50 flex items-center justify-center bg-surface-base/80 backdrop-blur-sm', className)}>
      <div className="flex flex-col items-center">
        <Loader2 className="h-12 w-12 animate-spin text-accent-primary mb-4" />
        <Txt variant="body" color="secondary">
          {message || 'Loading...'}
        </Txt>
      </div>
    </div>
  );
}

// ============================================================
// Component
// ============================================================

export function BioSuspense({
  children,
  fallback,
  variant = 'spinner',
  skeletonVariant = 'card',
  message,
  minLoadTime,
  className,
}: BioSuspenseProps) {
  // Determine fallback based on variant
  const getFallback = () => {
    if (fallback) return fallback;

    switch (variant) {
      case 'skeleton':
        return <LoadingState variant={skeletonVariant} className={className} />;
      case 'inline':
        return <InlineFallback message={message} className={className} />;
      case 'fullscreen':
        return <FullscreenFallback message={message} className={className} />;
      default:
        return <SpinnerFallback message={message} className={className} />;
    }
  };

  // If minLoadTime is specified, we need a wrapper that delays resolution
  if (minLoadTime && minLoadTime > 0) {
    return (
      <MinLoadTimeSuspense minLoadTime={minLoadTime} fallback={getFallback()}>
        {children}
      </MinLoadTimeSuspense>
    );
  }

  return <React.Suspense fallback={getFallback()}>{children}</React.Suspense>;
}

BioSuspense.displayName = 'BioSuspense';

// ============================================================
// Min Load Time Wrapper
// ============================================================

function MinLoadTimeSuspense({
  children,
  fallback,
  minLoadTime,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
  minLoadTime: number;
}) {
  const [isMinTimeElapsed, setIsMinTimeElapsed] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsMinTimeElapsed(true);
    }, minLoadTime);

    return () => clearTimeout(timer);
  }, [minLoadTime]);

  // We show fallback until both conditions are met
  if (!isMinTimeElapsed || !isLoaded) {
    return (
      <>
        <div style={{ display: 'none' }}>
          <React.Suspense fallback={null}>
            <LoadNotifier onLoad={() => setIsLoaded(true)}>
              {children}
            </LoadNotifier>
          </React.Suspense>
        </div>
        {fallback}
      </>
    );
  }

  return <>{children}</>;
}

// Helper to notify when children are loaded
function LoadNotifier({
  children,
  onLoad,
}: {
  children: React.ReactNode;
  onLoad: () => void;
}) {
  React.useEffect(() => {
    onLoad();
  }, [onLoad]);

  return <>{children}</>;
}

// ============================================================
// Lazy with Preload
// ============================================================

export interface LazyWithPreloadResult<T extends React.ComponentType<unknown>> {
  Component: React.LazyExoticComponent<T>;
  preload: () => Promise<{ default: T }>;
}

/**
 * Creates a lazy component with preload capability
 *
 * @example
 * const { Component: BioTableImport, preload } = lazyWithPreload(
 *   () => import('./BioTableImport')
 * );
 *
 * // Preload on hover
 * <button onMouseEnter={preload}>Import</button>
 *
 * // Use with Suspense
 * <Suspense fallback={<Loading />}>
 *   <BioTableImport />
 * </Suspense>
 */
export function lazyWithPreload<T extends React.ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
): LazyWithPreloadResult<T> {
  let factoryPromise: Promise<{ default: T }> | null = null;

  const preload = () => {
    if (!factoryPromise) {
      factoryPromise = factory();
    }
    return factoryPromise;
  };

  const Component = React.lazy(() => preload());

  return { Component, preload };
}
