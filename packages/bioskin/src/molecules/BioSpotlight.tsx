/**
 * BioSpotlight - Feature highlight/announcement component
 *
 * Features:
 * - Highlight new features
 * - One-time display with persistence
 * - Multiple variants (tooltip, modal, banner)
 * - Animation effects
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, ArrowRight, Check } from 'lucide-react';
import { cn } from '../atoms/utils';
import { Txt } from '../atoms/Txt';
import { Btn } from '../atoms/Btn';

// ============================================================
// Types
// ============================================================

export interface BioSpotlightProps {
  /** Unique spotlight ID for persistence */
  id: string;
  /** Spotlight title */
  title: string;
  /** Spotlight description */
  description: React.ReactNode;
  /** Display variant */
  variant?: 'tooltip' | 'modal' | 'banner' | 'badge';
  /** Target element selector (for tooltip) */
  target?: string;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Learn more link */
  learnMoreUrl?: string;
  /** Image/illustration */
  image?: string;
  /** Is spotlight visible */
  isOpen?: boolean;
  /** Called when spotlight is dismissed */
  onDismiss?: () => void;
  /** Don't show again option */
  showDontShowAgain?: boolean;
  /** Auto-dismiss after delay (ms) */
  autoDismiss?: number;
  /** Position for banner */
  position?: 'top' | 'bottom';
  /** Additional className */
  className?: string;
}

// ============================================================
// Component
// ============================================================

export function BioSpotlight({
  id,
  title,
  description,
  variant = 'tooltip',
  target,
  action,
  learnMoreUrl,
  image,
  isOpen: controlledOpen,
  onDismiss,
  showDontShowAgain = true,
  autoDismiss,
  position = 'bottom',
  className,
}: BioSpotlightProps) {
  // Stable IDs for accessibility
  const modalId = React.useId();
  const titleId = `${modalId}-title`;
  const descId = `${modalId}-desc`;

  const storageKey = `bioskin_spotlight_${id}`;
  const [isVisible, setIsVisible] = React.useState(false);
  const [targetRect, setTargetRect] = React.useState<DOMRect | null>(null);

  // Check if already dismissed
  React.useEffect(() => {
    const dismissed = localStorage.getItem(storageKey) === 'dismissed';
    if (!dismissed && controlledOpen !== false) {
      setIsVisible(true);
    }
  }, [storageKey, controlledOpen]);

  // Find target element
  React.useEffect(() => {
    if (variant === 'tooltip' && target && isVisible) {
      const el = document.querySelector(target);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      }
    }
  }, [variant, target, isVisible]);

  // Auto-dismiss
  React.useEffect(() => {
    if (autoDismiss && isVisible) {
      const timer = setTimeout(() => {
        handleDismiss(false);
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, isVisible]);

  const handleDismiss = (dontShowAgain: boolean = false) => {
    if (dontShowAgain) {
      localStorage.setItem(storageKey, 'dismissed');
    }
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  // Banner variant
  if (variant === 'banner') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: position === 'top' ? -50 : 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === 'top' ? -50 : 50 }}
          className={cn(
            'fixed left-0 right-0 z-50 px-4',
            position === 'top' ? 'top-0' : 'bottom-0',
            className
          )}
        >
          <div className="max-w-4xl mx-auto my-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-lg">
              <Sparkles className="h-6 w-6 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <Txt variant="label" weight="medium" className="text-white">
                  {title}
                </Txt>
                <Txt variant="small" className="text-white/80">
                  {description}
                </Txt>
              </div>
              {action && (
                <Btn
                  variant="secondary"
                  onClick={action.onClick}
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  {action.label}
                  <ArrowRight className="h-4 w-4" />
                </Btn>
              )}
              <button
                onClick={() => handleDismiss(true)}
                className="p-1 rounded hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Modal variant
  if (variant === 'modal') {
    return (
      <AnimatePresence>
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={() => handleDismiss(false)}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              'relative bg-surface-base rounded-xl shadow-2xl max-w-md w-full overflow-hidden',
              className
            )}
          >
            {/* Close button */}
            <button
              onClick={() => handleDismiss(false)}
              className="absolute top-3 right-3 p-1 rounded hover:bg-surface-hover transition-colors z-10"
              aria-label="Close spotlight"
            >
              <X className="h-5 w-5 text-text-muted" aria-hidden="true" />
            </button>

            {/* Image */}
            {image && (
              <div className="w-full h-40 bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 flex items-center justify-center">
                <img src={image} alt="" className="max-h-full max-w-full object-contain" aria-hidden="true" />
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-full bg-accent-primary/10">
                  <Sparkles className="h-5 w-5 text-accent-primary" aria-hidden="true" />
                </div>
                <Txt variant="micro" color="primary" weight="medium" className="uppercase tracking-wide">
                  New Feature
                </Txt>
              </div>

              <Txt id={titleId} variant="heading" as="h2" className="mb-2">
                {title}
              </Txt>

              <Txt id={descId} variant="body" color="secondary" className="mb-6">
                {description}
              </Txt>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {action && (
                  <Btn variant="primary" onClick={action.onClick} className="flex-1">
                    {action.label}
                  </Btn>
                )}
                {learnMoreUrl && (
                  <a href={learnMoreUrl} target="_blank" rel="noopener noreferrer">
                    <Btn variant="secondary">
                      Learn More
                    </Btn>
                  </a>
                )}
              </div>

              {/* Don't show again */}
              {showDontShowAgain && (
                <button
                  onClick={() => handleDismiss(true)}
                  className="w-full mt-4 text-center text-small text-text-tertiary hover:text-text-secondary"
                >
                  Don't show this again
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  // Badge variant
  if (variant === 'badge') {
    return (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
          'bg-accent-primary text-white',
          className
        )}
      >
        <Sparkles className="h-3 w-3" />
        New
      </motion.span>
    );
  }

  // Tooltip variant (default)
  if (!targetRect) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className={cn(
          'fixed z-50 w-72 bg-surface-base rounded-lg shadow-xl border border-default',
          className
        )}
        style={{
          top: targetRect.bottom + 8,
          left: targetRect.left + (targetRect.width - 288) / 2,
        }}
      >
        {/* Arrow */}
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-surface-base border-l border-t border-default"
        />

        {/* Content */}
        <div className="relative p-4">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-full bg-accent-primary/10 flex-shrink-0">
              <Sparkles className="h-4 w-4 text-accent-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <Txt variant="label" weight="medium" className="mb-1">
                {title}
              </Txt>
              <Txt variant="small" color="secondary">
                {description}
              </Txt>
            </div>
            <button
              onClick={() => handleDismiss(true)}
              className="p-0.5 rounded hover:bg-surface-hover transition-colors"
            >
              <X className="h-4 w-4 text-text-muted" />
            </button>
          </div>

          {action && (
            <Btn
              variant="primary"
              onClick={action.onClick}
              className="w-full mt-3"
            >
              {action.label}
            </Btn>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

BioSpotlight.displayName = 'BioSpotlight';
