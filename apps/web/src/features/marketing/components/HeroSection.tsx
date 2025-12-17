/**
 * HERO SECTION — "Technical Elegance" Edition
 *
 * DESIGN PRINCIPLES:
 * - Massive typography with tight tracking
 * - HUD-style product preview
 * - Mono labels for technical feel
 * - Single ambient glow, not decorations
 */

'use client';

import { motion } from 'motion/react';
import { ArrowRight, Activity } from 'lucide-react';

export const HeroSection = ({ onGetStarted }: { onGetStarted: () => void }) => {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-20">
      {/* ═══════════════════════════════════════════════════════════════════
          AMBIENT GLOW — Single, dramatic, not decorative
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-primary/15 rounded-full blur-[150px]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 py-20">
        <div className="max-w-[1200px] mx-auto px-6">
          {/* Status Badge — HUD style */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-3 mb-12"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.02]">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-mono text-white/50 uppercase tracking-widest">
                System Online
              </span>
            </div>
          </motion.div>

          {/* THE HEADLINE — Massive, confident */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center text-[56px] md:text-[80px] lg:text-[100px] xl:text-[120px] font-semibold tracking-[-0.04em] leading-[0.9] mb-8"
          >
            <span className="text-white">Compliance.</span>
            <br />
            <span className="text-white/30">Crystallized.</span>
          </motion.h1>

          {/* Subhead — short, punchy */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="text-center text-lg md:text-xl text-white/40 max-w-[550px] mx-auto mb-14 leading-relaxed"
          >
            Real-time audit intelligence. Every transaction traced.
            Every gap found. Before anyone else.
          </motion.p>

          {/* CTAs — clean, restrained */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center gap-4 mb-24"
          >
            <button
              onClick={onGetStarted}
              className="group relative h-12 px-8 rounded-full bg-white text-black font-medium text-sm hover:bg-white/90 transition-all flex items-center gap-2 overflow-hidden"
            >
              <span className="relative z-10">Request Demo</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
            <button className="group flex items-center gap-2 px-6 h-12 text-sm text-white/60 hover:text-white transition-colors">
              Watch Video
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            PRODUCT PREVIEW — HUD Dashboard Style
        ═══════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-[1300px] mx-auto px-6"
        >
          <div className="relative">
            {/* Glow behind product */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent blur-3xl scale-90" />

            {/* Product frame */}
            <div className="relative rounded-xl border border-white/10 bg-[#0a0a0a] overflow-hidden">
              {/* Terminal-style header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-white/10" />
                    <div className="w-3 h-3 rounded-full bg-white/10" />
                    <div className="w-3 h-3 rounded-full bg-white/10" />
                  </div>
                  <span className="text-[11px] font-mono text-white/30">
                    nexuscanon://audit-engine
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                    Live
                  </span>
                </div>
              </div>

              {/* Dashboard content */}
              <div className="p-6 min-h-[380px]">
                {/* Header row */}
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <div className="font-mono text-[10px] text-white/30 uppercase tracking-widest mb-2">
                      Compliance Dashboard
                    </div>
                    <div className="text-2xl font-medium text-white tracking-tight">
                      Q4 2024 Audit Status
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-mono text-primary">MONITORING</span>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'TRANSACTIONS_SCANNED', value: '847,293', delta: '+12.4%' },
                    { label: 'STANDARDS_ACTIVE', value: '24', delta: 'ALL_PASS' },
                    { label: 'GAPS_DETECTED', value: '3', delta: 'CRITICAL', isAlert: true },
                    { label: 'AUDIT_READINESS', value: '94%', delta: '↑ 8.2%' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className={`p-4 rounded-lg border ${stat.isAlert
                          ? 'bg-rose-500/5 border-rose-500/20'
                          : 'bg-white/[0.02] border-white/5'
                        }`}
                    >
                      <div className="font-mono text-[9px] text-white/30 uppercase tracking-widest mb-2">
                        {stat.label}
                      </div>
                      <div className="text-2xl font-semibold text-white tracking-tight mb-1">
                        {stat.value}
                      </div>
                      <div
                        className={`font-mono text-[10px] ${stat.isAlert ? 'text-rose-400' : 'text-primary'
                          }`}
                      >
                        {stat.delta}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live feed */}
                <div className="rounded-lg bg-white/[0.01] border border-white/5 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest">
                      Validation Stream
                    </span>
                    <span className="font-mono text-[10px] text-white/20">REAL_TIME</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {[
                      { txn: 'TXN-847293', standard: 'IFRS_15', status: 'PASS', time: '0.3s' },
                      { txn: 'TXN-847292', standard: 'SOX_404', status: 'PASS', time: '0.2s' },
                      { txn: 'TXN-847291', standard: 'IAS_16', status: 'WARN', time: '0.4s' },
                    ].map((item) => (
                      <div key={item.txn} className="px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-xs text-white/50">{item.txn}</span>
                          <span className="font-mono text-[10px] text-white/30 px-2 py-0.5 rounded bg-white/5">
                            {item.standard}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-[10px] text-white/20">{item.time}</span>
                          <div
                            className={`w-2 h-2 rounded-full ${item.status === 'PASS' ? 'bg-emerald-400' : 'bg-amber-400'
                              }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
