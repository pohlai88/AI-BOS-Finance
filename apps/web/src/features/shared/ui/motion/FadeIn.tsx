// ============================================================================
// FADEIN - Simple Opacity Animation Wrapper
// Lightweight motion component for component-level fade-in effects
// Usage: <FadeIn><YourComponent /></FadeIn>
// ============================================================================

import { motion, MotionProps } from 'motion/react';
import { ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
}

export const FadeIn = ({ children, duration = 0.3, delay = 0, className }: FadeInProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1], // Ease-out curve
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
