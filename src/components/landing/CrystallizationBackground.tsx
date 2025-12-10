// ============================================================================
// CRYSTALLIZATION BACKGROUND
// "The moment you initialize, your data crystallizes into immutable truth"
// ============================================================================

import { motion } from 'motion/react';
import { memo } from 'react';

/**
 * CrystallizationBackground - Visual metaphor for data freezing
 * 
 * Features:
 * - Growing crystal formations from edges
 * - Subtle frost/ice texture
 * - Pulsing nexus-green glow at center
 */
export const CrystallizationBackground = memo(function CrystallizationBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 1. FROST TEXTURE OVERLAY */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 100%, rgba(40, 231, 162, 0.15) 0%, transparent 50%)`,
        }}
      />

      {/* 2. CRYSTAL FORMATIONS - Growing from corners */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        {/* Bottom Left Crystal Cluster */}
        <motion.g
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
          style={{ transformOrigin: '0% 100%' }}
        >
          <path
            d="M0 100% L50 85% L30 70% L80 50% L40 40% L0 60% Z"
            fill="none"
            stroke="rgba(40, 231, 162, 0.15)"
            strokeWidth="1"
          />
          <path
            d="M0 90% L40 75% L20 60% L60 40% L0 50% Z"
            fill="rgba(40, 231, 162, 0.03)"
            stroke="rgba(40, 231, 162, 0.1)"
            strokeWidth="0.5"
          />
        </motion.g>

        {/* Bottom Right Crystal Cluster */}
        <motion.g
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, delay: 0.8 }}
          style={{ transformOrigin: '100% 100%' }}
        >
          <path
            d="M100% 100% L95% 80% L100% 65% L90% 50% L100% 40% Z"
            fill="none"
            stroke="rgba(40, 231, 162, 0.15)"
            strokeWidth="1"
          />
          <path
            d="M100% 95% L92% 75% L100% 55% L88% 45% Z"
            fill="rgba(40, 231, 162, 0.03)"
            stroke="rgba(40, 231, 162, 0.1)"
            strokeWidth="0.5"
          />
        </motion.g>
      </svg>

      {/* 3. CRYSTALLIZING PARTICLES - Floating up and freezing */}
      <div className="absolute inset-0">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-nexus-green/40"
            style={{
              left: `${10 + (i * 7)}%`,
              bottom: '10%',
              rotate: 45,
            }}
            animate={{
              y: [0, -100 - (i * 20), -100 - (i * 20)],
              opacity: [0, 0.8, 0.3],
              scale: [0.5, 1, 1.2],
            }}
            transition={{
              duration: 4,
              delay: i * 0.3,
              repeat: Infinity,
              repeatDelay: 2,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      {/* 4. CENTER CRYSTALLIZATION PULSE */}
      <motion.div
        className="absolute left-1/2 bottom-0 -translate-x-1/2 w-96 h-96"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Outer Ring */}
        <motion.div
          className="absolute inset-0 border border-nexus-green/20 rounded-full"
          animate={{ 
            scale: [0.8, 1.2, 0.8],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Inner Glow */}
        <motion.div
          className="absolute inset-12 bg-nexus-green/5 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* 5. FROST LINES - Spreading from center */}
      <svg className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px]" viewBox="0 0 600 300">
        {/* Central crystal spike */}
        <motion.path
          d="M300 300 L300 200 L310 150 L300 100 L290 150 L300 200 Z"
          fill="rgba(40, 231, 162, 0.05)"
          stroke="rgba(40, 231, 162, 0.2)"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
        />
        {/* Left branch */}
        <motion.path
          d="M300 250 L250 220 L200 230 L180 200"
          fill="none"
          stroke="rgba(40, 231, 162, 0.15)"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 1 }}
        />
        {/* Right branch */}
        <motion.path
          d="M300 250 L350 220 L400 230 L420 200"
          fill="none"
          stroke="rgba(40, 231, 162, 0.15)"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 1.2 }}
        />
        {/* Sub-branches */}
        <motion.path
          d="M250 220 L240 180 M350 220 L360 180"
          fill="none"
          stroke="rgba(40, 231, 162, 0.1)"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 1.8 }}
        />
      </svg>
    </div>
  );
});

