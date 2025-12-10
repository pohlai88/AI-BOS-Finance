import { HeroSection } from './landing/HeroSection';
import { Header } from './landing/Header';
import { LineageBeamCard } from './landing/LineageBeamCard';
import { ReasoningDemo } from './landing/ReasoningDemo';
import { CanonMapping } from './landing/CanonMapping';
import { LivingLens } from './landing/LivingLens';
import { FinalCTA } from './landing/FinalCTA';
import StabilitySimulation from './landing/StabilitySimulation';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { NexusCanonLogo } from '@/components/NexusCanonLogo';

export const LandingPage = ({
  onTryIt,
  onCanonClick,
}: {
  onTryIt: () => void;
  onCanonClick: () => void;
}) => {
  return (
    <div className="relative">
      {/* App Shell Header - Fixed on top, floats above everything */}
      <Header onGetStarted={onTryIt} onCanonClick={onCanonClick} />

      {/* Page Content - Padding to account for fixed header */}
      <div className="pt-20">
        {/* Hero Section */}
        <HeroSection onGetStarted={onTryIt} />

        {/* Main Content - Demo Sections */}
        <main className="relative z-10">
          {/* Lineage Section - Extra top padding to avoid Hero overlap */}
          <section id="lineage" className="pt-48 pb-16 px-6">
            <div className="max-w-7xl mx-auto">
              <StabilitySimulation />
            </div>
          </section>

          {/* Logic Kernel Section */}
          <section id="logic" className="py-16 px-6 border-t border-white/5">
            <div className="max-w-7xl mx-auto">
              <ReasoningDemo />
            </div>
          </section>

          {/* Canon Mapping Section */}
          <section id="canon" className="py-32 px-6 border-t border-white/5">
            <div className="max-w-7xl mx-auto">
              <div className="mb-16 text-center">
                <h2 className="text-5xl font-medium tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-4">
                  The Crystallization Lock
                </h2>
                {/* UPDATED: Hard-hitting Finance Subtitle */}
                <p className="text-emerald-500/80 font-mono tracking-wide mb-2 uppercase text-xs">
                  // IMMUTABLE PERIOD CONTROL
                </p>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-6">
                  Eliminate retroactive data drift.
                </p>
                {/* UPDATED: Description focused on Trust/Audit */}
                <p className="text-sm text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
                  Standard ledgers are fluid; numbers change silently. NexusCanon{' '}
                  <span className="text-gray-400">cryptographically freezes</span> your data state.
                  Once a period is crystallized, the numbers never move again without a trace.
                </p>
              </div>
              <div className="flex justify-center">
                <CanonMapping />
              </div>
            </div>
          </section>

          {/* Registry Grid Section */}
          <section id="registry" className="py-32 px-6 border-t border-white/5">
            <div className="max-w-7xl mx-auto">
              <div className="mb-16 text-center">
                <h2 className="text-5xl font-medium tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-4">
                  The Living Lens
                </h2>

                {/* The 12px Tech Subtitle */}
                <p className="text-emerald-500/80 font-mono tracking-widest mb-4 uppercase text-xs font-bold">
                  // Active Interrogation Protocol
                </p>

                <p className="text-sm text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed">
                  Standard audits are passive; NexusCanon is active. We dismantle every transaction
                  against <span className="text-zinc-200">IFRS</span>,{' '}
                  <span className="text-zinc-200">Tax Pillars</span>, and{' '}
                  <span className="text-zinc-200">Vendor Contracts</span>.
                  <br className="hidden md:block" />
                  Don&apos;t just see the expense.{' '}
                  <span className="text-emerald-400 font-medium">See the reality behind it.</span>
                </p>
              </div>
              <LivingLens />
            </div>
          </section>

          {/* Final CTA Section */}
          <FinalCTA onTryIt={onTryIt} />

          {/* Footer */}
          <footer className="py-6 px-8 border-t border-white/5 relative">
            <div className="max-w-full mx-auto">
              {/* Coordinate Markers */}
              <div className="absolute top-0 left-8 text-[10px] font-mono text-[rgb(82,82,92)] tracking-widest">
                00 // FOOTER
              </div>
              <div className="absolute top-0 right-8 text-[8px] font-mono text-zinc-800 tracking-widest">
                +
              </div>

              {/* Main Grid - 3 Columns */}
              <div className="grid grid-cols-3 gap-8 pb-4 border-b border-white/5">
                {/* LEFT: Brand */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    {/* Circle + Diamond Logo (matching header) */}
                    <div className="relative w-7 h-7">
                      <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                        {/* Outer Ring */}
                        <motion.circle
                          cx="20"
                          cy="20"
                          r="16"
                          stroke="rgba(40, 231, 162, 0.3)"
                          strokeWidth="1"
                          initial={{ pathLength: 0, rotate: 0 }}
                          animate={{ pathLength: 1, rotate: 360 }}
                          transition={{
                            pathLength: { duration: 2, ease: 'easeInOut' },
                            rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                          }}
                        />
                        {/* Inner Crystal */}
                        <motion.path
                          d="M20 8 L28 20 L20 32 L12 20 Z"
                          stroke="rgba(40, 231, 162, 0.6)"
                          strokeWidth="1.5"
                          fill="rgba(40, 231, 162, 0.05)"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1.5, delay: 0.5 }}
                        />
                        {/* Center Line */}
                        <motion.line
                          x1="20"
                          y1="8"
                          x2="20"
                          y2="32"
                          stroke="rgba(40, 231, 162, 0.8)"
                          strokeWidth="1"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1, delay: 1 }}
                        />
                        {/* Pulse */}
                        <motion.circle
                          cx="20"
                          cy="20"
                          r="3"
                          fill="rgba(40, 231, 162, 0.6)"
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.6, 0.3, 0.6],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </svg>
                    </div>

                    <h1 className="text-sm tracking-tight text-white">NexusCanon</h1>
                  </div>
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                    Forensic Architecture
                  </p>
                </div>

                {/* CENTER: Navigation */}
                <div className="space-y-2">
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-3">
                    Resources
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <a
                      href="/privacy"
                      className="text-zinc-500 hover:text-emerald-400 transition-colors font-mono uppercase tracking-wider"
                    >
                      Privacy
                    </a>
                    <a
                      href="/terms"
                      className="text-zinc-500 hover:text-emerald-400 transition-colors font-mono uppercase tracking-wider"
                    >
                      Terms
                    </a>
                    <a
                      href="/security"
                      className="text-zinc-500 hover:text-emerald-400 transition-colors font-mono uppercase tracking-wider"
                    >
                      Security
                    </a>
                    <a
                      href="/docs"
                      className="text-zinc-500 hover:text-emerald-400 transition-colors font-mono uppercase tracking-wider"
                    >
                      Docs
                    </a>
                  </div>
                </div>

                {/* RIGHT: Contact Us */}
                <div className="space-y-2">
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-3">
                    Contact Us
                  </p>
                  <div className="space-y-2 text-[10px]">
                    <a
                      href="mailto:contact@nexuscanon.com"
                      className="text-zinc-500 hover:text-emerald-400 transition-colors font-mono flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 bg-zinc-700 rounded-full group-hover:bg-emerald-400 transition-colors" />
                      contact@nexuscanon.com
                    </a>
                    <a
                      href="https://github.com/nexuscanon"
                      className="text-zinc-500 hover:text-emerald-400 transition-colors font-mono flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 bg-zinc-700 rounded-full group-hover:bg-emerald-400 transition-colors" />
                      GitHub
                    </a>
                    <a
                      href="https://discord.gg/nexuscanon"
                      className="text-zinc-500 hover:text-emerald-400 transition-colors font-mono flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 bg-zinc-700 rounded-full group-hover:bg-emerald-400 transition-colors" />
                      Discord
                    </a>
                  </div>
                </div>
              </div>

              {/* Technical Metadata Row */}
              <div className="pt-3 flex items-center justify-between text-[9px] font-mono text-zinc-700">
                <div className="flex items-center gap-4">
                  <span className="text-zinc-600">v2.4.1</span>
                  <span className="text-zinc-800">/</span>
                  <span className="text-zinc-600">BUILD_f8a9c2e</span>
                  <span className="text-zinc-800">/</span>
                  <span className="text-zinc-600">2024-12-07T14:22:03Z</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-600 uppercase tracking-widest">Status:</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-500">Online</span>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
