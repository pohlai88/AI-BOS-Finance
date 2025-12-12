// src/landing/FinalCTA.tsx
import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'

export const FinalCTA = ({ onTryIt }: { onTryIt: () => void }) => {
  const [riskCost, setRiskCost] = useState(14200)
  const [isHovered, setIsHovered] = useState(false)

  // The "Cost of Inaction" Ticker
  // It counts up endlessly until you hover the solution (The Button)
  useEffect(() => {
    if (isHovered) return

    const interval = setInterval(() => {
      setRiskCost((prev) => prev + Math.floor(Math.random() * 50) + 10)
    }, 100)

    return () => clearInterval(interval)
  }, [isHovered])

  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-[#050505] px-6 py-32">
      {/* Background Ambience */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03),transparent_70%)]" />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* 1. THE REINFORCEMENT (The Ticker) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-3 rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-2 backdrop-blur-sm">
            <div
              className={`h-2 w-2 rounded-full ${isHovered ? 'bg-emerald-500' : 'animate-pulse bg-red-500'}`}
            />
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">
              Unmonitored Ledger Risk:{' '}
              <span className={isHovered ? 'text-emerald-400' : 'text-white'}>
                ${riskCost.toLocaleString()}
              </span>
            </span>
          </div>

          <h2 className="text-5xl font-bold leading-tight tracking-tighter text-white md:text-7xl">
            Chaos is a <span className="text-zinc-600">Choice</span>.
          </h2>

          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-zinc-400">
            You have seen the cracks in your lineage. You have seen the phantoms
            in your invoices. Ignorance was an excuse yesterday.{' '}
            <br className="hidden md:block" />
            <span className="font-medium text-white">
              Today, you have the Lens.
            </span>
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
            className="group relative inline-flex items-center gap-6 overflow-hidden rounded border-2 border-emerald-500/30 bg-[#0A0A0A] px-8 py-4 text-white transition-all duration-300 hover:border-emerald-500 hover:bg-[#0F0F0F]"
          >
            {/* Corner Technical Markers */}
            <div className="pointer-events-none absolute left-1 top-1 h-3 w-3 border-l-2 border-t-2 border-emerald-500/20" />
            <div className="pointer-events-none absolute right-1 top-1 h-3 w-3 border-r-2 border-t-2 border-emerald-500/20" />
            <div className="pointer-events-none absolute bottom-1 left-1 h-3 w-3 border-b-2 border-l-2 border-emerald-500/20" />
            <div className="pointer-events-none absolute bottom-1 right-1 h-3 w-3 border-b-2 border-r-2 border-emerald-500/20" />

            {/* Inner Border Glow (Top Edge Light) */}
            <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent transition-all group-hover:via-emerald-400/60" />

            <div className="relative z-10 flex flex-col items-start text-left">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-500/60 group-hover:text-emerald-400">
                Execute Protocol
              </span>
              <span className="mt-0.5 text-base font-bold tracking-[-0.02em] text-white">
                Crystallize My Data
              </span>
            </div>

            <div className="relative z-10 flex h-8 w-8 items-center justify-center border border-emerald-500/30 bg-emerald-500/10 transition-all group-hover:border-emerald-500/50 group-hover:bg-emerald-500/20">
              <ArrowRight className="h-4 w-4 text-emerald-400 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>
        </motion.div>

        {/* 3. THE LOGIC ARGUMENT (The Footer) */}
        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-px overflow-hidden rounded-lg border border-white/5 bg-white/5 md:grid-cols-3">
          <Metric
            label="IMPLEMENTATION"
            value="48 Hours"
            sub="API-First Ingestion"
          />
          <Metric
            label="ROI HORIZON"
            value="< 3 Months"
            sub="Fraud Prevention"
          />
          <Metric
            label="COMPLIANCE"
            value="Guaranteed"
            sub="IFRS / GAAP / SOX"
          />
        </div>

        <p className="mt-8 font-mono text-xs uppercase tracking-widest text-zinc-600">
          Secure Transmission // 256-Bit Encrypted
        </p>
      </div>
    </section>
  )
}

const Metric = ({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub: string
}) => (
  <div className="group flex flex-col items-center justify-center bg-zinc-950 p-6 transition-colors hover:bg-zinc-900">
    <span className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
      {label}
    </span>
    <span className="font-mono text-xl font-bold text-white transition-colors group-hover:text-emerald-400">
      {value}
    </span>
    <span className="mt-1 font-mono text-xs text-zinc-600">{sub}</span>
  </div>
)
