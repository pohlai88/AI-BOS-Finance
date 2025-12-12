// ============================================================================
// HERO SECTION - "The Command Center"
// Left: The Pitch | Right: The Brain Visualization (Radar + Terminal Stack)
// Wired to Truth Engine via useRiskTelemetry hook
// ============================================================================

import { motion, AnimatePresence } from 'motion/react'
import { ArrowRight, Shield, Lock, Database, Terminal } from 'lucide-react'
import { NexusButton } from '@/components/nexus/NexusButton'
import {
  useRiskTelemetry,
  type TelemetryEvent,
  type Severity,
} from '@/hooks/useRiskTelemetry'
import { APP_CONFIG } from '@/constants/app'
import { ThreatRadar } from '@/components/radar'

// --- SEVERITY COLOR MAP ---
const severityColors: Record<
  Severity,
  { text: string; bg: string; border: string }
> = {
  low: {
    text: 'text-nexus-green',
    bg: 'bg-nexus-green',
    border: 'border-nexus-green',
  },
  medium: {
    text: 'text-yellow-400',
    bg: 'bg-yellow-400',
    border: 'border-yellow-400',
  },
  high: {
    text: 'text-orange-400',
    bg: 'bg-orange-400',
    border: 'border-orange-400',
  },
  critical: {
    text: 'text-red-500',
    bg: 'bg-red-500',
    border: 'border-red-500',
  },
}

// ThreatRadar uses canvas-based RadarDisplay with threat logic

// --- SUB-COMPONENT: THE TERMINAL ---
const RiskTerminal = ({ events }: { events: TelemetryEvent[] }) => (
  <div className="border-nexus-structure flex h-[180px] flex-col overflow-hidden border-x border-b bg-[#050505] p-4 font-mono text-[11px]">
    {/* Header */}
    <div className="border-nexus-structure mb-3 flex items-center gap-2 border-b pb-2">
      <div className="flex gap-1.5">
        <div className="h-2 w-2 rounded-full bg-red-500/80" />
        <div className="h-2 w-2 rounded-full bg-yellow-500/80" />
        <div className="h-2 w-2 rounded-full bg-green-500/80" />
      </div>
      <Terminal className="text-nexus-noise ml-2 h-3 w-3" />
      <span className="text-nexus-noise text-[9px] uppercase tracking-widest">
        system.log
      </span>
    </div>

    {/* Event Feed */}
    <div className="relative flex-1 overflow-hidden">
      <AnimatePresence initial={false}>
        {events.slice(0, 5).map((event) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20, height: 0 }}
            animate={{ opacity: 1, x: 0, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="flex gap-2 py-1"
          >
            <span className="text-nexus-structure min-w-[60px]">
              {event.time}
            </span>
            <span
              className={`min-w-[70px] font-bold ${severityColors[event.severity].text}`}
            >
              [{event.severity.toUpperCase()}]
            </span>
            <span className="text-nexus-signal flex-1 truncate">
              {event.message}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Scanline overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[size:100%_4px] opacity-30" />
    </div>

    {/* Footer */}
    <div className="border-nexus-structure mt-auto flex items-center gap-2 border-t pt-2">
      <motion.div
        className="bg-nexus-green h-1.5 w-1.5 rounded-full"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <span className="text-nexus-noise text-[9px] uppercase tracking-widest">
        Live monitoring active
      </span>
    </div>
  </div>
)

// --- MAIN HERO SECTION ---
export const HeroSection = ({ onGetStarted }: { onGetStarted: () => void }) => {
  const { events, activeRisks, systemStatus } = useRiskTelemetry()

  return (
    <section className="border-nexus-structure relative flex min-h-[90vh] flex-col justify-center overflow-hidden border-b px-6 md:px-12">
      {/* Background Grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Metadata Decoration */}
      <div className="absolute left-8 top-32 hidden lg:block">
        <motion.div
          className="from-nexus-green h-20 w-[1px] bg-gradient-to-b to-transparent"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ transformOrigin: 'top' }}
        />
        <motion.p
          className="text-nexus-noise mt-3 origin-top-left translate-y-full -rotate-90 font-mono text-[9px] tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          SYS_INIT // {APP_CONFIG.versionDisplay}
        </motion.p>
      </div>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 py-12 lg:grid-cols-12 lg:gap-12 lg:py-0">
        {/* LEFT COLUMN: THE PITCH */}
        <motion.div
          className="z-10 flex flex-col justify-center space-y-6 lg:col-span-7"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Micro-Label */}
          <div className="flex items-center gap-3">
            <div className="bg-nexus-green h-[1px] w-8" />
            <span className="text-nexus-green font-mono text-[11px] uppercase tracking-widest">
              Immutable Ledger Control
            </span>
          </div>

          {/* Headline */}
          <motion.h1
            className="text-5xl font-medium leading-[0.9] tracking-tighter text-white md:text-7xl lg:text-8xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Trust is <br />
            <span className="text-zinc-400">Mathematical.</span>
          </motion.h1>

          {/* Subhead */}
          <motion.p
            className="text-nexus-noise border-nexus-structure max-w-xl border-l pl-6 text-lg leading-relaxed md:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Eliminate retroactive data drift. NexusCanon cryptographically
            freezes your financial state, rendering audits instantaneous and
            irrefutable.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-wrap items-center gap-4 pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <NexusButton variant="primary" size="lg" onClick={onGetStarted}>
              Initialize Protocol
            </NexusButton>
            <NexusButton
              variant="secondary"
              size="lg"
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Enter the Canon
            </NexusButton>
          </motion.div>

          {/* Metrics */}
          <motion.div
            className="border-nexus-structure flex gap-6 border-t pt-6 lg:gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[
              { icon: Shield, label: 'INTEGRITY', value: '100%' },
              { icon: Lock, label: 'LOCKED', value: '2,847' },
              { icon: Database, label: 'RECORDS', value: '1.2M' },
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <m.icon className="text-nexus-green/50 h-4 w-4" />
                <div>
                  <div className="text-nexus-structure font-mono text-[9px] uppercase tracking-widest">
                    {m.label}
                  </div>
                  <div className="text-nexus-signal font-mono text-sm">
                    {m.value}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* RIGHT COLUMN: THE BRAIN VISUALIZATION - MAXIMUM SIZE */}
        <motion.div
          className="relative flex items-center justify-end lg:col-span-5"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* THE STACK: Radar + Terminal - Full width, no constraints */}
          <div className="shadow-nexus-green/5 flex w-full flex-col shadow-2xl">
            <ThreatRadar
              activeRisks={activeRisks}
              showLog={false}
              size={560}
              className="w-full"
            />
            <RiskTerminal events={events} />
          </div>

          {/* Decorative Glow */}
          <div className="bg-nexus-green/5 absolute -inset-8 -z-10 rounded-full opacity-50 blur-3xl" />
        </motion.div>
      </div>

      {/* Bottom Fade */}
      <div className="from-nexus-void absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t to-transparent" />
    </section>
  )
}
