'use client';

/**
 * ErrorState - Error display component
 *
 * Layer 2 (molecules) per CONT_10 BioSkin Architecture
 *
 * Enhanced with:
 * - Human-readable explanations
 * - Recovery suggestions
 * - Partial success handling
 */

import * as React from 'react';
import { cn } from '../atoms/utils';
import { Surface } from '../atoms/Surface';
import { Txt } from '../atoms/Txt';
import { Btn } from '../atoms/Btn';
import { AlertTriangle, RefreshCw, HelpCircle, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

export interface PartialSuccessInfo {
  /** Message explaining partial success */
  message: string;
  /** Items that were saved successfully */
  saved?: Array<{ id: string; label: string }>;
  /** Items that failed */
  failed?: Array<{ id: string; label: string; reason?: string }>;
}

export interface ErrorStateProps {
  title?: string;
  message: string;
  /** Human-readable explanation of what happened */
  explanation?: string;
  /** Recovery suggestions */
  suggestions?: string[];
  /** Partial success info (when some items succeeded) */
  partialSuccess?: PartialSuccessInfo;
  /** Error code (for support reference) */
  errorCode?: string;
  /** Show technical details toggle */
  showTechnicalDetails?: boolean;
  /** Technical error details */
  technicalDetails?: string;
  onRetry?: () => void;
  retryLabel?: string;
  /** Secondary action (e.g., contact support) */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  explanation,
  suggestions,
  partialSuccess,
  errorCode,
  showTechnicalDetails = false,
  technicalDetails,
  onRetry,
  retryLabel = 'Try again',
  secondaryAction,
  className,
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <Surface
      variant="card"
      padding="lg"
      className={cn(
        'flex flex-col items-center justify-center text-center min-h-[200px]',
        'border-status-danger/30',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-status-danger/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-status-danger" aria-hidden="true" />
      </div>

      <Txt variant="subheading" color="primary" weight="medium">
        {title}
      </Txt>

      <Txt variant="body" color="secondary" className="mt-2 max-w-sm">
        {message}
      </Txt>

      {/* Explanation */}
      {explanation && (
        <div className="mt-4 flex items-start gap-2 text-left max-w-md p-3 rounded-lg bg-surface-subtle">
          <HelpCircle className="w-4 h-4 text-text-tertiary flex-shrink-0 mt-0.5" />
          <Txt variant="small" color="tertiary">
            {explanation}
          </Txt>
        </div>
      )}

      {/* Recovery Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="mt-4 text-left max-w-md w-full">
          <Txt variant="label" color="secondary" className="mb-2">
            What you can try:
          </Txt>
          <ul className="space-y-1.5">
            {suggestions.map((suggestion, idx) => (
              <li key={idx} className="flex items-start gap-2 text-small text-text-secondary">
                <span className="text-accent-primary">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Partial Success */}
      {partialSuccess && (
        <div className="mt-4 text-left max-w-md w-full p-3 rounded-lg bg-status-warning/10 border border-status-warning/30">
          <Txt variant="label" color="primary" className="mb-2">
            {partialSuccess.message}
          </Txt>

          {partialSuccess.saved && partialSuccess.saved.length > 0 && (
            <div className="mb-2">
              <Txt variant="caption" color="success" className="flex items-center gap-1 mb-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Saved ({partialSuccess.saved.length}):
              </Txt>
              <div className="flex flex-wrap gap-1">
                {partialSuccess.saved.slice(0, 5).map((item) => (
                  <span
                    key={item.id}
                    className="px-2 py-0.5 rounded bg-status-success/10 text-small text-status-success"
                  >
                    {item.label}
                  </span>
                ))}
                {partialSuccess.saved.length > 5 && (
                  <span className="text-small text-text-tertiary">
                    +{partialSuccess.saved.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          {partialSuccess.failed && partialSuccess.failed.length > 0 && (
            <div>
              <Txt variant="caption" color="danger" className="flex items-center gap-1 mb-1">
                <XCircle className="w-3.5 h-3.5" />
                Failed ({partialSuccess.failed.length}):
              </Txt>
              <div className="space-y-1">
                {partialSuccess.failed.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-status-danger/10 text-small text-status-danger">
                      {item.label}
                    </span>
                    {item.reason && (
                      <span className="text-small text-text-tertiary">
                        - {item.reason}
                      </span>
                    )}
                  </div>
                ))}
                {partialSuccess.failed.length > 5 && (
                  <span className="text-small text-text-tertiary">
                    +{partialSuccess.failed.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Code */}
      {errorCode && (
        <Txt variant="caption" color="tertiary" className="mt-3">
          Error code: {errorCode}
        </Txt>
      )}

      {/* Technical Details */}
      {showTechnicalDetails && technicalDetails && (
        <div className="mt-3 w-full max-w-md">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-small text-text-tertiary hover:text-text-secondary transition-colors"
          >
            {showDetails ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            Technical details
          </button>
          {showDetails && (
            <pre className="mt-2 p-3 rounded bg-surface-nested text-left text-xs text-text-tertiary overflow-auto max-h-32">
              {technicalDetails}
            </pre>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-3">
        {onRetry && (
          <Btn variant="outline" onClick={onRetry} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {retryLabel}
          </Btn>
        )}
        {secondaryAction && (
          <Btn variant="ghost" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Btn>
        )}
      </div>
    </Surface>
  );
}

ErrorState.displayName = 'ErrorState';

export const COMPONENT_META = {
  code: 'BIOSKIN_ErrorState',
  version: '1.0.0',
  layer: 'molecules',
  family: 'FEEDBACK',
  status: 'stable',
} as const;
