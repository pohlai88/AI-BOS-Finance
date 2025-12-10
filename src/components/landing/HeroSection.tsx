import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { NexusButton } from '@/components/nexus/NexusButton';

export const HeroSection = ({ onGetStarted }: { onGetStarted: () => void }) => {
  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center px-6 md:px-12 border-b border-nexus-structure overflow-hidden">
      {/* SECTION II: Background Grid (The 1px Rule) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* SECTION II: Metadata Decoration (Forensic Look) */}
      <div className="absolute top-32 left-12 hidden md:block">
        <div className="w-[1px] h-24 bg-gradient-to-b from-nexus-green to-transparent" />
        <p className="mt-4 font-mono text-[10px] text-nexus-noise tracking-micro -rotate-90 origin-top-left translate-y-full">
          SYS_INIT // v2.4.1
        </p>
      </div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 pt-20">
        {/* Left Col: Asymmetric Layout (Col 1-7) */}
        <div className="lg:col-span-7 space-y-8 z-10">
          {/* Micro-Label */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="h-[1px] w-8 bg-nexus-green" />
            <span className="nexus-label text-nexus-green">Immutable Ledger Control</span>
          </motion.div>

          {/* SECTION IV: Typography - Negative Tracking */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-medium tracking-headline leading-[0.9] text-white"
          >
            Trust is <br />
            <span className="text-nexus-noise">Mathematical.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-nexus-noise max-w-2xl leading-relaxed border-l border-nexus-structure pl-6"
          >
            Eliminate retroactive data drift. NexusCanon cryptographically freezes your financial
            state, rendering audits instantaneous and irrefutable.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center gap-6 pt-4"
          >
            {/* Primary CTA: Uses NexusButton (Wireframe Protocol) */}
            <NexusButton variant="primary" onClick={onGetStarted}>
              INITIALIZE PROTOCOL
            </NexusButton>

            {/* Secondary CTA: Uses NexusButton */}
            <NexusButton variant="secondary" icon={<ArrowRight className="w-4 h-4" />}>
              VIEW DOCUMENTATION
            </NexusButton>
          </motion.div>
        </div>

        {/* Right Col: The "Bento" Visual (Col 8-12) */}
        <div className="lg:col-span-5 relative hidden lg:block">
          {/* Placeholder for high-fidelity visualization, NOT a blob */}
          <div className="nexus-card h-full w-full min-h-[400px] flex items-center justify-center">
            <p className="font-mono text-xs text-nexus-structure tracking-widest">
              [ RENDERING_SIMULATION_ENGINE ]
            </p>
            {/* This is where StabilitySimulation will live later */}
          </div>
        </div>
      </div>

      {/* Bottom Fade - imply content below the fold */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-nexus-void to-transparent" />
    </section>
  );
};
