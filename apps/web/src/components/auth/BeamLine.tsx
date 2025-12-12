// ============================================================================
// BEAM LINE - "The Pulse"
// Horizontal laser beam that pulses rhythmically
// Behavior: Dim idle → Bright active when user interacts
// Colors: Steel Blue (idle) → Golden/Amber (active)
// ============================================================================

import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface BeamLineProps {
  isActive?: boolean; // User is typing or submitting
  className?: string;
}

export const BeamLine = ({ isActive = false, className = '' }: BeamLineProps) => {
  const [pulseKey, setPulseKey] = useState(0);

  // Reset animation when isActive changes
  useEffect(() => {
    setPulseKey((prev) => prev + 1);
  }, [isActive]);

  // Colors
  const idleColor = '#64748b'; // Steel Blue (slate-500)
  const activeColor = '#f59e0b'; // Golden/Amber (amber-500)

  return (
    <div className={`relative h-[2px] w-full overflow-hidden ${className}`}>
      {/* Base line (structure) */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'var(--prism-structure-primary)' }}
      />

      {/* Animated beam */}
      <motion.div
        key={pulseKey}
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${isActive ? activeColor : idleColor} 50%, transparent 100%)`,
          width: '40%',
        }}
        animate={{
          x: ['-100%', '250%'],
        }}
        transition={{
          duration: isActive ? 1.5 : 3, // Faster when active
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Glow effect when active */}
      {isActive && (
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, ${activeColor}40 0%, transparent 70%)`,
            filter: 'blur(4px)',
          }}
          animate={{
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </div>
  );
};
