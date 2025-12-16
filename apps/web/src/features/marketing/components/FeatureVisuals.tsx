import { motion } from 'motion/react';

/**
 * CRYSTALLIZATION VISUAL
 * Represents immutable blockchain-style data locking
 */
export const CrystallizationVisual = () => (
  <div className="w-full h-full flex items-center justify-center relative">
    {/* Abstract Blockchain */}
    <div className="flex gap-4">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.15, duration: 0.5 }}
          className="relative w-16 h-20 rounded border border-white/10 bg-white/5 flex flex-col items-center justify-center gap-2"
        >
          <div className="w-8 h-1 bg-white/10 rounded-full" />
          <div className="w-6 h-1 bg-white/10 rounded-full" />
          <div className="w-4 h-1 bg-white/10 rounded-full" />
          {i === 3 && (
            <motion.div
              className="absolute inset-0 bg-primary/20 border border-primary rounded"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.div>
      ))}
    </div>
    
    {/* Connector Lines */}
    <div className="absolute top-1/2 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    
    {/* Lock Icon at the end */}
    <motion.div
      className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <div className="w-3 h-3 border-2 border-primary rounded-sm" />
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
    <div className="absolute w-48 h-48 border border-white/5 rounded-full" />
    <div className="absolute w-32 h-32 border border-white/10 rounded-full" />
    <div className="absolute w-16 h-16 border border-primary/30 rounded-full bg-primary/5" />
    
    {/* Center Pulse */}
    <motion.div
      className="absolute w-4 h-4 bg-primary rounded-full"
      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    
    {/* Scanning Line */}
    <motion.div
      className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-nexus-green/50 to-transparent"
      animate={{ top: ['20%', '80%', '20%'] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
    />
    
    {/* Data Points */}
    {[
      { x: '25%', y: '30%', delay: 0 },
      { x: '70%', y: '45%', delay: 0.5 },
      { x: '40%', y: '70%', delay: 1 },
    ].map((point, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 bg-white/20 rounded-full"
        style={{ left: point.x, top: point.y }}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, delay: point.delay }}
      />
    ))}
  </div>
);

/**
 * GOVERNANCE VISUAL
 * Represents schema validation and data enforcement
 */
export const GovernanceVisual = () => (
  <div className="w-full h-full p-6 flex flex-col gap-3 relative">
    {/* Background Grid */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:16px_16px]" />

    {/* Mock Schema Validation Lines */}
    {[
      { status: 'pass', width: 'w-28' },
      { status: 'pass', width: 'w-20' },
      { status: 'pass', width: 'w-32' },
      { status: 'fail', width: 'w-24' },
    ].map((line, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.1, duration: 0.4 }}
        className="flex items-center gap-3 pl-4 border-l border-white/10 relative z-10"
      >
        <motion.div
          className={`w-3 h-3 rounded-full ${line.status === 'fail' ? 'bg-red-500/50' : 'bg-primary/50'}`}
          animate={line.status === 'fail' ? { opacity: [0.5, 1, 0.5] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <div className={`h-2 ${line.width} bg-white/10 rounded-full`} />
        <div className="h-2 w-12 bg-white/5 rounded-full" />
      </motion.div>
    ))}

    {/* "Rejected" Badge overlay for the last item */}
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.5, duration: 0.3 }}
      className="absolute bottom-6 right-6 px-2 py-1 bg-red-500/10 border border-red-500/50 text-[10px] text-red-400 font-mono rounded z-10"
    >
      SCHEMA_INVALID
    </motion.div>
  </div>
);

