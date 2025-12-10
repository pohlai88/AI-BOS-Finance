import { motion } from 'motion/react';
import { ArrowRight, Shield, Lock, Database } from 'lucide-react';
import { NexusButton } from '@/components/nexus/NexusButton';
import { BlackboxRadar } from './HeroSectionRadar';

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
    <section className="relative flex flex-col justify-center px-6 md:px-12 border-b border-nexus-structure overflow-hidden">
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

      {/* HERO CONTENT */}
      <div className="max-w-7xl mx-auto w-full pt-20 pb-12 z-10">
        {/* Headline Section */}
        <motion.div 
          className="space-y-8 mb-12"
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
            className="text-xl text-nexus-noise max-w-3xl leading-relaxed border-l border-nexus-structure pl-6"
          >
            Eliminate retroactive data drift. NexusCanon cryptographically freezes your financial
            state, rendering audits instantaneous and irrefutable.
          </motion.p>

          {/* CTAs + Metrics Row */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-6 pt-4">
            <NexusButton variant="primary" onClick={onGetStarted}>
              INITIALIZE PROTOCOL
            </NexusButton>
            <NexusButton variant="secondary" icon={<ArrowRight className="w-4 h-4" />}>
              VIEW DOCUMENTATION
            </NexusButton>
            <div className="hidden md:block ml-auto">
              <MetricsTicker />
            </div>
          </motion.div>
        </motion.div>

        {/* THE BLACKBOX RADAR - The Designer's Vision */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <BlackboxRadar />
        </motion.div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-nexus-void to-transparent" />
    </section>
  );
};
