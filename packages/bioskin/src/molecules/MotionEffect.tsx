/**
 * MotionEffect - Reusable animation wrapper
 * 
 * Sprint 3 Day 14 per BIOSKIN 2.1 PRD
 * Provides consistent entry/exit animations across components.
 * 
 * @example
 * <MotionEffect preset="fadeIn">
 *   <Card>...</Card>
 * </MotionEffect>
 * 
 * @example
 * <MotionEffect preset="slideUp" delay={0.2}>
 *   <div>Animated content</div>
 * </MotionEffect>
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence, type Variants, type Transition } from 'motion/react';
import { cn } from '../atoms/utils';

// ============================================================
// Types
// ============================================================

export type MotionPreset =
  | 'fadeIn'
  | 'fadeOut'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'scaleIn'
  | 'scaleOut'
  | 'blur'
  | 'bounce'
  | 'flip'
  | 'none';

export interface MotionEffectProps {
  /** Animation preset */
  preset?: MotionPreset;
  /** Custom variants (overrides preset) */
  variants?: Variants;
  /** Animation delay in seconds */
  delay?: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Trigger animation on mount */
  animate?: boolean;
  /** Enable exit animation */
  exitAnimation?: boolean;
  /** Use AnimatePresence for exit */
  usePresence?: boolean;
  /** Unique key for AnimatePresence */
  presenceKey?: string | number;
  /** Children to animate */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

// ============================================================
// Animation Presets
// ============================================================

const presets: Record<MotionPreset, Variants> = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  fadeOut: {
    initial: { opacity: 1 },
    animate: { opacity: 0 },
    exit: { opacity: 1 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
  scaleOut: {
    initial: { opacity: 1, scale: 1 },
    animate: { opacity: 0, scale: 0.9 },
    exit: { opacity: 1, scale: 1 },
  },
  blur: {
    initial: { opacity: 0, filter: 'blur(10px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(10px)' },
  },
  bounce: {
    initial: { opacity: 0, y: 30 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 20,
      },
    },
    exit: { opacity: 0, y: 30 },
  },
  flip: {
    initial: { opacity: 0, rotateX: 90 },
    animate: { opacity: 1, rotateX: 0 },
    exit: { opacity: 0, rotateX: -90 },
  },
  none: {
    initial: {},
    animate: {},
    exit: {},
  },
};

// ============================================================
// Main Component
// ============================================================

export function MotionEffect({
  preset = 'fadeIn',
  variants,
  delay = 0,
  duration = 0.3,
  animate = true,
  exitAnimation = true,
  usePresence = false,
  presenceKey,
  children,
  className,
}: MotionEffectProps) {
  const selectedVariants = variants || presets[preset];

  const transition: Transition = {
    duration,
    delay,
    ease: 'easeOut',
  };

  const content = (
    <motion.div
      className={className}
      initial="initial"
      animate={animate ? 'animate' : 'initial'}
      exit={exitAnimation ? 'exit' : undefined}
      variants={selectedVariants}
      transition={transition}
    >
      {children}
    </motion.div>
  );

  if (usePresence) {
    return (
      <AnimatePresence mode="wait">
        {animate && (
          <React.Fragment key={presenceKey}>
            {content}
          </React.Fragment>
        )}
      </AnimatePresence>
    );
  }

  return content;
}

MotionEffect.displayName = 'MotionEffect';

// ============================================================
// Stagger Container
// ============================================================

export interface StaggerContainerProps {
  /** Stagger delay between children */
  staggerDelay?: number;
  /** Children to stagger */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

export function StaggerContainer({
  staggerDelay = 0.1,
  children,
  className,
}: StaggerContainerProps) {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      variants={{
        animate: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

StaggerContainer.displayName = 'StaggerContainer';

// ============================================================
// Stagger Item
// ============================================================

export interface StaggerItemProps {
  /** Animation preset */
  preset?: MotionPreset;
  /** Children */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

export function StaggerItem({
  preset = 'slideUp',
  children,
  className,
}: StaggerItemProps) {
  return (
    <motion.div
      className={className}
      variants={presets[preset]}
    >
      {children}
    </motion.div>
  );
}

StaggerItem.displayName = 'StaggerItem';

export const COMPONENT_META = {
  code: 'BIOSKIN_MotionEffect',
  version: '1.0.0',
  layer: 'molecules',
  family: 'ANIMATION',
  status: 'stable',
  poweredBy: 'motion',
} as const;
