/**
 * LandingPage — "Technical Elegance" Edition
 *
 * DESIGN SYSTEM UPGRADES:
 * 1. Background: Technical Grid (Palantir precision)
 * 2. Cards: Spotlight hover effects (Linear "magic")
 * 3. Typography: Mixed Sans (Headings) + Mono (Labels)
 * 4. Micro-UI: Corner brackets and raw data aesthetics
 */

import React from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'motion/react';
import { Header } from '../components/Header';
import { HeroSection } from '../components/HeroSection';
import { LandingFooter } from '../components/LandingFooter';
import { Shield, Zap, Eye, Lock, ChevronRight } from 'lucide-react';

// --- UTILITY COMPONENTS -----------------------------------------------------

/**
 * Palantir-style background grid.
 * Creates a sense of infinite, measured space.
 */
const GridBackground = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
    <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
  </div>
);

/**
 * Linear-style Spotlight Card.
 * The border glows based on mouse position.
 */
const SpotlightCard = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={`group relative border border-white/10 bg-white/[0.02] overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
    >
      {/* Spotlight Effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(74,144,226,0.15),
              transparent 80%
            )
          `,
        }}
      />
      {/* Content */}
      <div className="relative h-full">{children}</div>

      {/* Palantir-style decorative corners */}
      <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

// --- MAIN PAGE --------------------------------------------------------------

export const LandingPage = ({
  onTryIt,
  onCanonClick,
}: {
  onTryIt: () => void;
  onCanonClick: () => void;
}) => {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 font-sans">
      <GridBackground />

      {/* Z-Index wrapper to sit above grid */}
      <div className="relative z-10">
        <Header onGetStarted={onTryIt} onCanonClick={onCanonClick} />

        <main>
          {/* HERO */}
          <HeroSection onGetStarted={onTryIt} />

          {/* ═══════════════════════════════════════════════════════════════════
              CAPABILITIES — "Bento" Grid Style
          ═══════════════════════════════════════════════════════════════════ */}
          <section className="py-32 relative">
            <div className="max-w-[1200px] mx-auto px-6">
              {/* Section Header with "Mono" accent */}
              <div className="mb-20">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-3 mb-6"
                >
                  <div className="h-px w-8 bg-primary" />
                  <span className="text-xs font-mono text-primary tracking-widest uppercase">
                    System Capabilities
                  </span>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-4xl md:text-6xl font-medium tracking-tight text-white max-w-2xl"
                >
                  Precision engineered for <br />
                  <span className="text-white/40">absolute audit confidence.</span>
                </motion.h2>
              </div>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    id: '01',
                    icon: Eye,
                    title: 'Real-Time Visibility',
                    desc: 'Trace every transaction to its governing standard instantly.',
                  },
                  {
                    id: '02',
                    icon: Shield,
                    title: 'Continuous Validation',
                    desc: 'IFRS, GAAP, and SOX validated continuously, not annually.',
                  },
                  {
                    id: '03',
                    icon: Zap,
                    title: 'Instant Detection',
                    desc: 'Compliance gaps surface in seconds. Fix before auditors find.',
                  },
                  {
                    id: '04',
                    icon: Lock,
                    title: 'Immutable Evidence',
                    desc: 'Cryptographic proof of every validation. Audit-ready.',
                  },
                ].map((cap) => (
                  <SpotlightCard key={cap.title} className="rounded-xl p-8 md:p-10 min-h-[280px]">
                    <div className="flex flex-col h-full justify-between">
                      <div className="flex justify-between items-start">
                        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                          <cap.icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                        </div>
                        <span className="font-mono text-xs text-white/20 tracking-widest">
                          {cap.id}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-xl font-medium text-white mb-2">{cap.title}</h3>
                        <p className="text-base text-white/50 leading-relaxed max-w-[90%]">
                          {cap.desc}
                        </p>
                      </div>
                    </div>
                  </SpotlightCard>
                ))}
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════════
              METRICS — Dashboard / HUD Style
          ═══════════════════════════════════════════════════════════════════ */}
          <section className="py-32 border-y border-white/5 bg-white/[0.01]">
            <div className="max-w-[1200px] mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8">
                {[
                  { value: '94%', label: 'Reduction in findings' },
                  { value: '3×', label: 'Faster close speed' },
                  { value: '<48h', label: 'Audit prep time' },
                  { value: '100%', label: 'Traceability coverage' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="relative group"
                  >
                    {/* Decorative left border that lights up */}
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-white/10 group-hover:bg-primary/50 transition-colors" />

                    <div className="pl-6">
                      <div className="text-5xl md:text-7xl font-semibold tracking-tighter text-white mb-2">
                        {stat.value}
                      </div>
                      <div className="font-mono text-xs text-white/40 uppercase tracking-widest">
                        {stat.label}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════════
              CTA — The "Singularity"
          ═══════════════════════════════════════════════════════════════════ */}
          <section className="py-40 relative overflow-hidden">
            {/* Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50" />

            <div className="max-w-[800px] mx-auto px-6 text-center relative z-10">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-5xl md:text-7xl font-semibold tracking-tighter mb-10"
              >
                Close the gap.
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <button
                  onClick={onTryIt}
                  className="group relative h-12 px-8 rounded-full bg-white text-black font-medium text-sm hover:bg-white/90 transition-all flex items-center gap-2 overflow-hidden"
                >
                  <span className="relative z-10">Request Demo</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </button>

                <button
                  onClick={onCanonClick}
                  className="px-8 h-12 rounded-full border border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-medium text-sm transition-all flex items-center gap-2"
                >
                  Contact Sales
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>
              </motion.div>
            </div>
          </section>

          <LandingFooter />
        </main>
      </div>
    </div>
  );
};
