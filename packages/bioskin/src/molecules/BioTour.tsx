/**
 * BioTour - Interactive tooltip tour/walkthrough
 *
 * Features:
 * - Step-by-step guided tours
 * - Spotlight on target elements
 * - Keyboard navigation
 * - Progress indicator
 * - Persistence of completion
 */

'use client';

import * as React from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '../atoms/utils';
import { Txt } from '../atoms/Txt';
import { Btn } from '../atoms/Btn';
import { Surface } from '../atoms/Surface';

// ============================================================
// Types
// ============================================================

export interface TourStep {
  /** Unique step ID */
  id: string;
  /** CSS selector for target element */
  target: string;
  /** Step title */
  title: string;
  /** Step content/description */
  content: React.ReactNode;
  /** Tooltip placement */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  /** Highlight target element */
  spotlight?: boolean;
  /** Action to perform on this step */
  action?: {
    label: string;
    onClick: () => void | Promise<void>;
  };
  /** Skip condition */
  skipIf?: () => boolean;
}

export interface BioTourProps {
  /** Tour steps */
  steps: TourStep[];
  /** Is tour active */
  isOpen: boolean;
  /** Called when tour is closed */
  onClose: () => void;
  /** Called when tour is completed */
  onComplete?: () => void;
  /** Called when step changes */
  onStepChange?: (stepIndex: number, step: TourStep) => void;
  /** Starting step index */
  startAt?: number;
  /** Show progress indicator */
  showProgress?: boolean;
  /** Show skip button */
  showSkip?: boolean;
  /** Persist completion to localStorage */
  persistKey?: string;
  /** Spotlight padding */
  spotlightPadding?: number;
  /** Additional className for tooltip */
  className?: string;
}

// ============================================================
// Component
// ============================================================

export function BioTour({
  steps,
  isOpen,
  onClose,
  onComplete,
  onStepChange,
  startAt = 0,
  showProgress = true,
  showSkip = true,
  persistKey,
  spotlightPadding = 8,
  className,
}: BioTourProps) {
  // Use stable ID for SVG mask
  const maskId = React.useId();
  const tooltipId = React.useId();

  const [currentStep, setCurrentStep] = React.useState(startAt);
  const [targetRect, setTargetRect] = React.useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  const step = steps[currentStep];

  // Find and measure target element
  React.useEffect(() => {
    if (!isOpen || !step) return;

    const findTarget = () => {
      const target = document.querySelector(step.target);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);

        // Scroll target into view if needed
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTargetRect(null);
      }
    };

    findTarget();
    window.addEventListener('resize', findTarget);
    window.addEventListener('scroll', findTarget);

    return () => {
      window.removeEventListener('resize', findTarget);
      window.removeEventListener('scroll', findTarget);
    };
  }, [isOpen, step, currentStep]);

  // Calculate tooltip position
  React.useEffect(() => {
    if (!targetRect || !tooltipRef.current || !step) return;

    const tooltip = tooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();
    const placement = step.placement || 'auto';
    const padding = 12;

    let top = 0;
    let left = 0;

    const calcPosition = (p: 'top' | 'bottom' | 'left' | 'right') => {
      switch (p) {
        case 'top':
          top = targetRect.top - tooltipRect.height - padding;
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = targetRect.bottom + padding;
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
          left = targetRect.left - tooltipRect.width - padding;
          break;
        case 'right':
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
          left = targetRect.right + padding;
          break;
      }
    };

    if (placement === 'auto') {
      // Auto placement: prefer bottom, then top, then right, then left
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      if (targetRect.bottom + tooltipRect.height + padding < viewportHeight) {
        calcPosition('bottom');
      } else if (targetRect.top - tooltipRect.height - padding > 0) {
        calcPosition('top');
      } else if (targetRect.right + tooltipRect.width + padding < viewportWidth) {
        calcPosition('right');
      } else {
        calcPosition('left');
      }
    } else {
      calcPosition(placement);
    }

    // Clamp to viewport
    left = Math.max(padding, Math.min(window.innerWidth - tooltipRect.width - padding, left));
    top = Math.max(padding, Math.min(window.innerHeight - tooltipRect.height - padding, top));

    setTooltipPosition({ top, left });
  }, [targetRect, step]);

  // Navigation
  const goNext = React.useCallback(() => {
    let nextStep = currentStep + 1;

    // Skip steps that should be skipped
    while (nextStep < steps.length && steps[nextStep].skipIf?.()) {
      nextStep++;
    }

    if (nextStep >= steps.length) {
      // Tour complete
      if (persistKey) {
        localStorage.setItem(`bioskin_tour_${persistKey}`, 'completed');
      }
      onComplete?.();
      onClose();
    } else {
      setCurrentStep(nextStep);
      onStepChange?.(nextStep, steps[nextStep]);
    }
  }, [currentStep, steps, persistKey, onComplete, onClose, onStepChange]);

  const goPrev = React.useCallback(() => {
    let prevStep = currentStep - 1;

    // Skip steps that should be skipped
    while (prevStep >= 0 && steps[prevStep].skipIf?.()) {
      prevStep--;
    }

    if (prevStep >= 0) {
      setCurrentStep(prevStep);
      onStepChange?.(prevStep, steps[prevStep]);
    }
  }, [currentStep, steps, onStepChange]);

  // Keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
        case 'Enter':
          goNext();
          break;
        case 'ArrowLeft':
          goPrev();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goNext, goPrev, onClose]);

  if (!isOpen || !step) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9998]">
        {/* Dark overlay with spotlight cutout */}
        {step.spotlight && targetRect && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
          >
            <defs>
              <mask id={`spotlight-mask-${maskId}`}>
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <rect
                  x={targetRect.left - spotlightPadding}
                  y={targetRect.top - spotlightPadding}
                  width={targetRect.width + spotlightPadding * 2}
                  height={targetRect.height + spotlightPadding * 2}
                  rx="8"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.5)"
              mask={`url(#spotlight-mask-${maskId})`}
            />
          </svg>
        )}

        {/* Click overlay (closes tour when clicking outside) */}
        <div
          className="absolute inset-0"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        />
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${tooltipId}-title`}
        aria-describedby={`${tooltipId}-content`}
        className={cn(
          'fixed z-[9999] w-80 bg-surface-base border border-default rounded-lg shadow-xl',
          className
        )}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-default">
          <Txt id={`${tooltipId}-title`} variant="label" weight="medium">
            {step.title}
          </Txt>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
            aria-label="Close tour"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div id={`${tooltipId}-content`} className="px-4 py-3">
          <Txt variant="body" color="secondary">
            {step.content}
          </Txt>

          {step.action && (
            <Btn
              variant="secondary"
              onClick={step.action.onClick}
              className="mt-3"
            >
              {step.action.label}
            </Btn>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-default bg-surface-subtle rounded-b-lg">
          {/* Progress */}
          {showProgress && (
            <div className="flex items-center gap-1">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    idx === currentStep
                      ? 'bg-accent-primary'
                      : idx < currentStep
                        ? 'bg-status-success'
                        : 'bg-surface-nested'
                  )}
                />
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-2">
            {showSkip && (
              <button
                onClick={onClose}
                className="text-small text-text-tertiary hover:text-text-secondary"
              >
                Skip tour
              </button>
            )}
            {currentStep > 0 && (
              <Btn variant="ghost" onClick={goPrev}>
                <ChevronLeft className="h-4 w-4" />
                Back
              </Btn>
            )}
            <Btn variant="primary" onClick={goNext}>
              {currentStep === steps.length - 1 ? (
                <>
                  Finish
                  <Check className="h-4 w-4" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Btn>
          </div>
        </div>
      </div>
    </>
  );
}

BioTour.displayName = 'BioTour';

// ============================================================
// Hook for managing tour state
// ============================================================

export interface UseTourOptions {
  /** Tour ID for persistence */
  tourId: string;
  /** Auto-start tour if not completed */
  autoStart?: boolean;
}

export interface UseTourReturn {
  /** Is tour open */
  isOpen: boolean;
  /** Start tour */
  startTour: () => void;
  /** Close tour */
  closeTour: () => void;
  /** Reset tour (clear completion) */
  resetTour: () => void;
  /** Is tour completed */
  isCompleted: boolean;
}

export function useTour({ tourId, autoStart = false }: UseTourOptions): UseTourReturn {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isCompleted, setIsCompleted] = React.useState(false);

  // Check completion on mount
  React.useEffect(() => {
    const completed = localStorage.getItem(`bioskin_tour_${tourId}`) === 'completed';
    setIsCompleted(completed);

    if (autoStart && !completed) {
      setIsOpen(true);
    }
  }, [tourId, autoStart]);

  const startTour = React.useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeTour = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  const resetTour = React.useCallback(() => {
    localStorage.removeItem(`bioskin_tour_${tourId}`);
    setIsCompleted(false);
  }, [tourId]);

  return {
    isOpen,
    startTour,
    closeTour,
    resetTour,
    isCompleted,
  };
}
