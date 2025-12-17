// src/landing/FinalCTA.tsx
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

export const FinalCTA = ({ onTryIt }: { onTryIt: () => void }) => {
  const [riskCost, setRiskCost] = useState(14200);
  const [isHovered, setIsHovered] = useState(false);

  // The "Cost of Inaction" Ticker
  // It counts up endlessly until you hover the solution (The Button)
  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      setRiskCost((prev) => prev + Math.floor(Math.random() * 50) + 10);
    }, 100);

    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <section className="relative py-32 px-6 border-t border-white/5 overflow-hidden bg-surface-nested">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03),transparent_70%)] pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* 1. THE REINFORCEMENT (The Ticker) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
            <div
              className={`w-2 h-2 rounded-full ${isHovered ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}
            />
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
              Unmonitored Ledger Risk:{' '}
              <span className={isHovered ? 'text-emerald-400' : 'text-white'}>
                ${riskCost.toLocaleString()}
              </span>
            </span>
          </div>

          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white leading-tight">
            Chaos is a <span className="text-zinc-600">Choice</span>.
          </h2>

          <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            You have seen the cracks in your lineage. You have seen the phantoms in your invoices.
            Ignorance was an excuse yesterday. <br className="hidden md:block" />
            <span className="text-white font-medium">Today, you have the Lens.</span>
          </p>
        </motion.div>

        {/* 2. THE ACTION (The Magnetic Button) */}
        <motion.div
          className="mt-16 flex justify-center"
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={onTryIt}
            onMouseEnter={() => setIsHovered(true)} // STOPS THE TICKER
            onMouseLeave={() => setIsHovered(false)}
            className="group relative inline-flex items-center gap-6 px-8 py-4 bg-background border-2 border-emerald-500/30 hover:border-emerald-500 text-white rounded transition-all duration-300 hover:bg-surface-subtle overflow-hidden"
          >
            {/* Corner Technical Markers */}
            <div className="absolute top-1 left-1 w-3 h-3 border-l-2 border-t-2 border-emerald-500/20 pointer-events-none" />
            <div className="absolute top-1 right-1 w-3 h-3 border-r-2 border-t-2 border-emerald-500/20 pointer-events-none" />
            <div className="absolute bottom-1 left-1 w-3 h-3 border-l-2 border-b-2 border-emerald-500/20 pointer-events-none" />
            <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-emerald-500/20 pointer-events-none" />

            {/* Inner Border Glow (Top Edge Light) */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent group-hover:via-emerald-400/60 transition-all" />

            <div className="flex flex-col items-start text-left relative z-10">
              <span className="text-[10px] font-mono font-bold tracking-[0.3em] uppercase text-emerald-500/60 group-hover:text-emerald-400">
                Execute Protocol
              </span>
              <span className="text-base font-bold tracking-[-0.02em] text-white mt-0.5">
                Crystallize My Data
              </span>
            </div>

            <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:border-emerald-500/50 transition-all relative z-10">
              <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </motion.div>

        {/* 3. THE LOGIC ARGUMENT (The Footer) */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 border border-white/5 rounded-lg overflow-hidden max-w-3xl mx-auto">
          <Metric label="IMPLEMENTATION" value="48 Hours" sub="API-First Ingestion" />
          <Metric label="ROI HORIZON" value="< 3 Months" sub="Fraud Prevention" />
          <Metric label="COMPLIANCE" value="Guaranteed" sub="IFRS / GAAP / SOX" />
        </div>

        <p className="mt-8 text-xs text-zinc-600 font-mono uppercase tracking-widest">
          Secure Transmission // 256-Bit Encrypted
        </p>
      </div>
    </section>
  );
};

const Metric = ({ label, value, sub }: { label: string; value: string; sub: string }) => (
  <div className="bg-zinc-950 p-6 flex flex-col items-center justify-center group hover:bg-zinc-900 transition-colors">
    <span className="text-xs text-zinc-500 uppercase tracking-widest mb-2 font-bold">{label}</span>
    <span className="text-xl font-mono text-white font-bold group-hover:text-emerald-400 transition-colors">
      {value}
    </span>
    <span className="text-xs text-zinc-600 mt-1 font-mono">{sub}</span>
  </div>
);
