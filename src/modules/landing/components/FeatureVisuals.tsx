import { motion } from 'motion/react'

/**
 * CRYSTALLIZATION VISUAL
 * Represents immutable blockchain-style data locking
 */
export const CrystallizationVisual = () => (
  <div className="relative flex h-full w-full items-center justify-center">
    {/* Abstract Blockchain */}
    <div className="flex gap-4">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.15, duration: 0.5 }}
          className="relative flex h-20 w-16 flex-col items-center justify-center gap-2 rounded border border-white/10 bg-white/5"
        >
          <div className="h-1 w-8 rounded-full bg-white/10" />
          <div className="h-1 w-6 rounded-full bg-white/10" />
          <div className="h-1 w-4 rounded-full bg-white/10" />
          {i === 3 && (
            <motion.div
              className="bg-nexus-green/20 border-nexus-green absolute inset-0 rounded border"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.div>
      ))}
    </div>

    {/* Connector Lines */}
    <div className="absolute left-8 right-8 top-1/2 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

    {/* Lock Icon at the end */}
    <motion.div
      className="bg-nexus-green/10 border-nexus-green/30 absolute right-6 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <div className="border-nexus-green h-3 w-3 rounded-sm border-2" />
    </motion.div>
  </div>
)

/**
 * INTERROGATION VISUAL
 * Represents active scanning and real-time audit
 */
export const InterrogationVisual = () => (
  <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
    {/* Radar Rings */}
    <div className="absolute h-48 w-48 rounded-full border border-white/5" />
    <div className="absolute h-32 w-32 rounded-full border border-white/10" />
    <div className="border-nexus-green/30 bg-nexus-green/5 absolute h-16 w-16 rounded-full border" />

    {/* Center Pulse */}
    <motion.div
      className="bg-nexus-green absolute h-4 w-4 rounded-full"
      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    />

    {/* Scanning Line */}
    <motion.div
      className="via-nexus-green/50 absolute h-[1px] w-full bg-gradient-to-r from-transparent to-transparent"
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
        className="absolute h-2 w-2 rounded-full bg-white/20"
        style={{ left: point.x, top: point.y }}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, delay: point.delay }}
      />
    ))}
  </div>
)

/**
 * GOVERNANCE VISUAL
 * Represents schema validation and data enforcement
 */
export const GovernanceVisual = () => (
  <div className="relative flex h-full w-full flex-col gap-3 p-6">
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
        className="relative z-10 flex items-center gap-3 border-l border-white/10 pl-4"
      >
        <motion.div
          className={`h-3 w-3 rounded-full ${line.status === 'fail' ? 'bg-red-500/50' : 'bg-nexus-green/50'}`}
          animate={line.status === 'fail' ? { opacity: [0.5, 1, 0.5] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <div className={`h-2 ${line.width} rounded-full bg-white/10`} />
        <div className="h-2 w-12 rounded-full bg-white/5" />
      </motion.div>
    ))}

    {/* "Rejected" Badge overlay for the last item */}
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.5, duration: 0.3 }}
      className="absolute bottom-6 right-6 z-10 rounded border border-red-500/50 bg-red-500/10 px-2 py-1 font-mono text-[10px] text-red-400"
    >
      SCHEMA_INVALID
    </motion.div>
  </div>
)
