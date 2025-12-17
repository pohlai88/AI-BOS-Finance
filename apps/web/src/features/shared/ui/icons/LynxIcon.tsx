import React from 'react';
import { motion } from 'motion/react';

/**
 * ============================================================================
 * LYNX ICONOGRAPHY // BRAND-LNX-001 (RESTORED)
 * ============================================================================
 *
 * IDENTITY PAPER:
 * The "Lynx Head" represents the predatory awareness of the system.
 * It is not a passive sensor; it is an active hunter of anomalies.
 *
 * VISUAL SEMANTICS:
 * 1. THE EARS (Signal Intake): High-frequency receivers for weak signals.
 * 2. THE EYES (Anomaly Detection): Binocular focus on divergence.
 * 3. THE JAW (Enforcement): The bite of the audit logic.
 *
 * GRID SPECIFICATION:
 * - Canvas: 24x24px
 * - Geometry: Low-Poly / Crystalline
 * - Alignment: Center-Axis Symmetrical
 *
 * @version 2.1.0 (Head Restoration)
 */

interface LynxIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

export function LynxIcon({ size = 24, className = '', ...props }: LynxIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      {/* The Lynx Mask */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7 2L8.5 7C10.5 8 13.5 8 15.5 7L17 2L18.5 7.5L22 12L16 20L12 22L8 20L2 12L5.5 7.5L7 2ZM9 12.5L11.5 13L10.5 14.5L8 14L9 12.5ZM15 12.5L12.5 13L13.5 14.5L16 14L15 12.5Z"
      />
    </svg>
  );
}

/**
 * LIVING LYNX GUARDIAN
 * The "Shining Creature" variant with particle emissions and emerald glow.
 * Represents the active, always-on nature of the forensic system.
 */
export function LivingLynx({ size = 24, className = '' }: { size?: number; className?: string }) {
  // Deterministic particle seeds for hydration stability
  const particles = [
    { id: 1, x: 0, y: 0, delay: 0 },
    { id: 2, x: 10, y: -5, delay: 1 },
    { id: 3, x: -10, y: -5, delay: 2 },
    { id: 4, x: 5, y: -10, delay: 1.5 },
    { id: 5, x: -5, y: -10, delay: 2.5 },
  ];

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Emission Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-1 h-1 bg-[#28E7A2] rounded-full"
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0, 1, 0],
            x: p.x * 2,
            y: p.y * 2 - 10, // Move upward
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeOut',
          }}
          style={{ top: '50%', left: '50%' }}
        />
      ))}

      {/* Core Guardian */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          filter: [
            'drop-shadow(0 0 4px rgba(40, 231, 162, 0.4))',
            'drop-shadow(0 0 12px rgba(40, 231, 162, 0.8))',
            'drop-shadow(0 0 4px rgba(40, 231, 162, 0.4))',
          ],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative z-10"
      >
        <LynxIcon size={size} className="text-[#28E7A2]" />

        {/* Inner Eye Glint (Overlay) */}
        <div className="absolute top-[13px] left-[9px] w-[2px] h-[2px] bg-white rounded-full opacity-70 animate-pulse" />
        <div className="absolute top-[13px] right-[9px] w-[2px] h-[2px] bg-white rounded-full opacity-70 animate-pulse delay-75" />
      </motion.div>
    </div>
  );
}
