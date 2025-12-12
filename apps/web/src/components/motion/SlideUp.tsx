// ============================================================================
// SLIDEUP - Y-Axis Translation + Fade Animation Wrapper
// Lightweight motion component for upward sliding entrance effects
// Usage: <SlideUp><YourComponent /></SlideUp>
// ============================================================================

import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface SlideUpProps {
  children: ReactNode;
  duration?: number;
  delay?: number;
  distance?: number; // Distance in pixels to slide from
  className?: string;
}

export const SlideUp = ({
  children,
  duration = 0.4,
  delay = 0,
  distance = 20, // Default: slide from 20px below
  className,
}: SlideUpProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: distance }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: distance }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1], // Ease-out curve (matches FadeIn)
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
