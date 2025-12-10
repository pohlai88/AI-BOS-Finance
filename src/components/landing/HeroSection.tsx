import { motion } from 'motion/react';
import { ArrowRight, Shield, Lock, Database } from 'lucide-react';
import { NexusButton } from '@/components/nexus/NexusButton';

// Stagger container for smooth orchestrated animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }
  },
};

// The Holographic Data Cube - animated visualization
const HolographicCube = () => (
  <div className="relative w-full h-full min-h-[400px] flex items-center justify-center">
    {/* Outer rotating ring */}
    <motion.div
      className="absolute w-64 h-64 border border-nexus-green/20 rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
    />
    
    {/* Middle pulsing ring */}
    <motion.div
      className="absolute w-48 h-48 border border-nexus-green/30"
      style={{ borderRadius: '30%' }}
      animate={{ 
        rotate: -360,
        scale: [1, 1.05, 1],
      }}
      transition={{ 
        rotate: { duration: 20, repeat: Infinity, ease: "linear" },
        scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
      }}
    />

    {/* Inner crystal diamond */}
    <motion.svg 
      width="160" 
      height="160" 
      viewBox="0 0 40 40" 
      className="relative z-10"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.8 }}
    >
      {/* Outer diamond */}
      <motion.path 
        d="M20 2 L38 20 L20 38 L2 20 Z" 
        stroke="rgba(40, 231, 162, 0.4)" 
        strokeWidth="0.5" 
        fill="rgba(40, 231, 162, 0.03)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, delay: 0.3 }}
      />
      {/* Inner diamond */}
      <motion.path 
        d="M20 8 L32 20 L20 32 L8 20 Z" 
        stroke="rgba(40, 231, 162, 0.6)" 
        strokeWidth="1" 
        fill="rgba(40, 231, 162, 0.05)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, delay: 0.8 }}
      />
      {/* Core */}
      <motion.circle
        cx="20"
        cy="20"
        r="4"
        fill="rgba(40, 231, 162, 0.8)"
        initial={{ scale: 0 }}
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.8, 1, 0.8]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          delay: 1.5
        }}
      />
      {/* Cross lines */}
      <motion.line 
        x1="20" y1="2" x2="20" y2="38" 
        stroke="rgba(40, 231, 162, 0.3)" 
        strokeWidth="0.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
      />
      <motion.line 
        x1="2" y1="20" x2="38" y2="20" 
        stroke="rgba(40, 231, 162, 0.3)" 
        strokeWidth="0.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 1.4 }}
      />
    </motion.svg>

    {/* Floating data points */}
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 bg-nexus-green/40 rounded-full"
        style={{
          left: `${30 + Math.cos(i * 60 * Math.PI / 180) * 40}%`,
          top: `${30 + Math.sin(i * 60 * Math.PI / 180) * 40}%`,
        }}
        animate={{
          y: [0, -10, 0],
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{
          duration: 2 + i * 0.3,
          repeat: Infinity,
          delay: i * 0.2,
        }}
      />
    ))}

    {/* Status indicators */}
    <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[9px] font-mono text-nexus-green/60">
      <motion.span
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        ● SYNC_ACTIVE
      </motion.span>
      <span>HASH_OK</span>
    </div>
  </div>
);

// Live metrics ticker
const MetricsTicker = () => {
  const metrics = [
    { icon: Shield, label: 'INTEGRITY', value: '100%' },
    { icon: Lock, label: 'LOCKED', value: '2,847' },
    { icon: Database, label: 'RECORDS', value: '1.2M' },
  ];

  return (
    <motion.div 
      className="flex gap-6 pt-8"
      variants={itemVariants}
    >
      {metrics.map((m, i) => (
        <motion.div 
          key={m.label}
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 + i * 0.1 }}
        >
          <m.icon className="w-4 h-4 text-nexus-green/60" />
          <div>
            <div className="text-[9px] font-mono text-nexus-structure uppercase tracking-widest">
              {m.label}
            </div>
            <div className="text-sm font-mono text-nexus-signal">{m.value}</div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export const HeroSection = ({ onGetStarted }: { onGetStarted: () => void }) => {
  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center px-6 md:px-12 border-b border-nexus-structure overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* Metadata Decoration */}
      <div className="absolute top-32 left-12 hidden md:block">
        <motion.div 
          className="w-[1px] h-24 bg-gradient-to-b from-nexus-green to-transparent"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ transformOrigin: 'top' }}
        />
        <motion.p 
          className="mt-4 font-mono text-[10px] text-nexus-noise tracking-widest -rotate-90 origin-top-left translate-y-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          SYS_INIT // v2.4.1
        </motion.p>
      </div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 pt-20">
        {/* Left Col: Content */}
        <motion.div 
          className="lg:col-span-7 space-y-8 z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Micro-Label */}
          <motion.div variants={itemVariants} className="flex items-center gap-3">
            <div className="h-[1px] w-8 bg-nexus-green" />
            <span className="nexus-label text-nexus-green">Immutable Ledger Control</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-6xl md:text-8xl font-medium tracking-tighter leading-[0.9] text-white"
          >
            Trust is <br />
            <span className="text-nexus-noise">Mathematical.</span>
          </motion.h1>

          {/* Subhead */}
          <motion.p
            variants={itemVariants}
            className="text-xl text-nexus-noise max-w-2xl leading-relaxed border-l border-nexus-structure pl-6"
          >
            Eliminate retroactive data drift. NexusCanon cryptographically freezes your financial
            state, rendering audits instantaneous and irrefutable.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-6 pt-4">
            <NexusButton variant="primary" onClick={onGetStarted}>
              INITIALIZE PROTOCOL
            </NexusButton>
            <NexusButton variant="secondary" icon={<ArrowRight className="w-4 h-4" />}>
              VIEW DOCUMENTATION
            </NexusButton>
          </motion.div>

          {/* Live Metrics */}
          <MetricsTicker />
        </motion.div>

        {/* Right Col: Holographic Visualization */}
        <motion.div 
          className="lg:col-span-5 relative hidden lg:block"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="nexus-card h-full w-full overflow-hidden bg-nexus-void/50 backdrop-blur-sm">
            <HolographicCube />
          </div>
        </motion.div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-nexus-void to-transparent" />
    </section>
  );
};
