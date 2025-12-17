/**
 * BioErrorBoundary - Error boundary wrapper for components
 *
 * Features:
 * - Catches JavaScript errors in child component tree
 * - Displays fallback UI
 * - Reports errors for logging
 * - Retry functionality
 */

'use client';

import * as React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { cn } from '../atoms/utils';
import { Txt } from '../atoms/Txt';
import { Btn } from '../atoms/Btn';
import { Surface } from '../atoms/Surface';

// ============================================================
// Types
// ============================================================

export interface BioErrorBoundaryProps {
  /** Child components to wrap */
  children: React.ReactNode;
  /** Custom fallback component */
  fallback?: React.ReactNode | ((props: ErrorFallbackProps) => React.ReactNode);
  /** Called when error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Called when reset is triggered */
  onReset?: () => void;
  /** Show home button */
  showHomeButton?: boolean;
  /** Home URL */
  homeUrl?: string;
  /** Additional className */
  className?: string;
}

export interface ErrorFallbackProps {
  /** The caught error */
  error: Error;
  /** Reset the error boundary */
  resetErrorBoundary: () => void;
  /** Error info */
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

// ============================================================
// Default Fallback Component
// ============================================================

function DefaultErrorFallback({
  error,
  resetErrorBoundary,
  showHomeButton = true,
  homeUrl = '/',
  className,
}: ErrorFallbackProps & { showHomeButton?: boolean; homeUrl?: string; className?: string }) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <Surface
      padding="lg"
      className={cn('flex flex-col items-center justify-center min-h-[200px] text-center', className)}
    >
      <div className="w-16 h-16 rounded-full bg-status-danger/10 flex items-center justify-center mb-4">
        <AlertTriangle className="h-8 w-8 text-status-danger" />
      </div>

      <Txt variant="heading" as="h2" className="mb-2">
        Something went wrong
      </Txt>

      <Txt variant="body" color="secondary" className="mb-6 max-w-md">
        An unexpected error occurred. Please try again or contact support if the problem persists.
      </Txt>

      <div className="flex items-center gap-3">
        <Btn variant="primary" onClick={resetErrorBoundary}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try Again
        </Btn>
        {showHomeButton && (
          <Btn variant="secondary" onClick={() => (window.location.href = homeUrl)}>
            <Home className="h-4 w-4" aria-hidden="true" />
            Go Home
          </Btn>
        )}
      </div>

      {/* Error details toggle */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="mt-6 text-small text-text-tertiary hover:text-text-secondary"
      >
        {showDetails ? 'Hide' : 'Show'} technical details
      </button>

      {showDetails && (
        <div className="mt-4 w-full max-w-lg p-4 bg-surface-subtle rounded-lg text-left">
          <Txt variant="small" weight="medium" color="danger" className="mb-2">
            {error.name}: {error.message}
          </Txt>
          <pre className="text-micro text-text-tertiary whitespace-pre-wrap overflow-auto max-h-40">
            {error.stack}
          </pre>
        </div>
      )}
    </Surface>
  );
}

// ============================================================
// Error Boundary Class Component
// ============================================================

export class BioErrorBoundary extends React.Component<BioErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: BioErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('BioErrorBoundary caught an error:', error, errorInfo);
    }
  }

  resetErrorBoundary = () => {
    this.props.onReset?.();
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showHomeButton, homeUrl, className } = this.props;

    if (hasError && error) {
      // Custom fallback as component
      if (typeof fallback === 'function') {
        return fallback({
          error,
          resetErrorBoundary: this.resetErrorBoundary,
          errorInfo: errorInfo || undefined,
        });
      }

      // Custom fallback as element
      if (fallback) {
        return fallback;
      }

      // Default fallback
      return (
        <DefaultErrorFallback
          error={error}
          resetErrorBoundary={this.resetErrorBoundary}
          errorInfo={errorInfo || undefined}
          showHomeButton={showHomeButton}
          homeUrl={homeUrl}
          className={className}
        />
      );
    }

    return children;
  }
}

// ============================================================
// Hook for throwing errors to boundary
// ============================================================

export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const showBoundary = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  const reset = React.useCallback(() => {
    setError(null);
  }, []);

  if (error) {
    throw error;
  }

  return { showBoundary, reset };
}

// ============================================================
// Wrapper HOC
// ============================================================

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<BioErrorBoundaryProps, 'children'>
) {
  const WithErrorBoundary = (props: P) => (
    <BioErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </BioErrorBoundary>
  );

  WithErrorBoundary.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithErrorBoundary;
}
