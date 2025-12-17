/**
 * Feature Visuals - Abstract Illustrations
 * 
 * Design Philosophy:
 * - Subtle, non-distracting animations
 * - Consistent primary color usage
 * - Clean, minimal aesthetic
 */

import { motion } from 'motion/react';

/**
 * CRYSTALLIZATION VISUAL
 * Represents immutable blockchain-style data locking
 */
export const CrystallizationVisual = () => (
  <div className="w-full h-full flex items-center justify-center relative px-6">
    {/* Abstract Blockchain */}
    <div className="flex gap-3">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
          className="relative w-14 h-16 rounded-lg border border-border-subtle bg-surface-subtle flex flex-col items-center justify-center gap-1.5"
        >
          <div className="w-7 h-1 bg-border-subtle rounded-full" />
          <div className="w-5 h-1 bg-border-subtle rounded-full" />
          <div className="w-3 h-1 bg-border-subtle rounded-full" />
          {i === 3 && (
            <motion.div
              className="absolute inset-0 bg-primary/10 border border-primary/40 rounded-lg"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </motion.div>
      ))}
    </div>

    {/* Connector Line */}
    <div className="absolute top-1/2 left-10 right-10 h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent" />

    {/* Lock Indicator */}
    <motion.div
      className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="w-2.5 h-2.5 border-2 border-primary rounded-sm" />
    </motion.div>
  </div>
);

/**
 * INTERROGATION VISUAL
 * Represents active scanning and real-time audit
 */
export const InterrogationVisual = () => (
  <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
    {/* Radar Rings */}
    <div className="absolute w-36 h-36 border border-border-subtle rounded-full opacity-50" />
    <div className="absolute w-24 h-24 border border-border-subtle rounded-full opacity-70" />
    <div className="absolute w-12 h-12 border border-primary/30 rounded-full bg-primary/5" />

    {/* Center Pulse */}
    <motion.div
      className="absolute w-3 h-3 bg-primary rounded-full"
      animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0.4, 0.8] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    />

    {/* Data Points */}
    {[
      { x: '30%', y: '35%', delay: 0 },
      { x: '65%', y: '45%', delay: 0.6 },
      { x: '45%', y: '65%', delay: 1.2 },
    ].map((point, i) => (
      <motion.div
        key={i}
        className="absolute w-1.5 h-1.5 bg-primary/40 rounded-full"
        style={{ left: point.x, top: point.y }}
        animate={{ opacity: [0.2, 0.8, 0.2] }}
        transition={{ duration: 2, repeat: Infinity, delay: point.delay, ease: 'easeInOut' }}
      />
    ))}
  </div>
);

/**
 * GOVERNANCE VISUAL
 * Represents schema validation and data enforcement
 */
export const GovernanceVisual = () => (
  <div className="w-full h-full p-5 flex flex-col gap-2.5 relative">
    {/* Mock Schema Validation Lines */}
    {[
      { status: 'pass', width: 'w-24' },
      { status: 'pass', width: 'w-16' },
      { status: 'pass', width: 'w-28' },
      { status: 'fail', width: 'w-20' },
    ].map((line, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, x: -8 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.08, duration: 0.3 }}
        className="flex items-center gap-2.5 pl-3 border-l border-border-subtle relative z-10"
      >
        <div
          className={`w-2 h-2 rounded-full ${line.status === 'fail' ? 'bg-red-500/50' : 'bg-primary/50'}`}
        />
        <div className={`h-1.5 ${line.width} bg-border-subtle rounded-full`} />
        <div className="h-1.5 w-10 bg-surface-subtle rounded-full" />
      </motion.div>
    ))}

    {/* Rejected Badge */}
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.4, duration: 0.25 }}
      className="absolute bottom-4 right-4 px-2 py-1 bg-red-500/10 border border-red-500/30 text-[9px] text-red-400 font-mono rounded z-10"
    >
      INVALID
    </motion.div>
  </div>
);

