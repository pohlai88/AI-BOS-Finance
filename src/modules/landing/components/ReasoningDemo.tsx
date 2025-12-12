import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  BrainCircuit,
  CheckCircle,
  ShieldCheck,
  Zap,
  XCircle,
  AlertTriangle,
  Database,
  FileText,
  ArrowRight,
  X,
  BarChart3,
  ScanLine,
} from 'lucide-react'

// FORENSIC LOG SEQUENCE - Each log tied to specific financial statement modules
const THOUGHT_SEQUENCE = [
  {
    id: 1,
    text: 'Connecting to ERP Gateway...',
    highlights: ['ERP Gateway'],
    type: 'info',
    moduleUpdate: 'AST',
  },
  {
    id: 2,
    text: 'Ingesting 12,847 G/L entries from SAP/Oracle...',
    highlights: ['12,847', 'SAP/Oracle'],
    type: 'info',
    moduleUpdate: 'LIA',
  },
  {
    id: 3,
    text: 'Normalizing currency: USD/EUR/JPY across entities...',
    highlights: ['USD', 'EUR', 'JPY'],
    type: 'info',
    moduleUpdate: 'EQU',
  },
  {
    id: 4,
    text: 'Scanning RevRec patterns (Q4-2024)...',
    highlights: ['RevRec', 'Q4-2024'],
    type: 'processing',
  },
  {
    id: 5,
    text: '⚠ DETECTED ANOMALY: Pattern Mismatch in Revenue Recognition',
    highlights: ['DETECTED ANOMALY'],
    type: 'warning',
    moduleUpdate: 'INC_WARN',
  },
  {
    id: 6,
    text: 'Hypothesis 1: Intercompany transfer pricing error...',
    highlights: ['Hypothesis 1'],
    type: 'processing',
  },
  {
    id: 7,
    text: 'Hypothesis 1 REJECTED: Eliminations match (Confidence 99.9%)',
    highlights: ['REJECTED', '99.9%'],
    type: 'rejected',
  },
  {
    id: 8,
    text: 'Hypothesis 2: Missing ASC 606 contract metadata...',
    highlights: ['ASC 606'],
    type: 'processing',
  },
  {
    id: 9,
    text: 'Hypothesis 2 CONFIRMED: Contract boundary undefined',
    highlights: ['CONFIRMED'],
    type: 'success',
    moduleUpdate: 'EXP',
  },
  {
    id: 10,
    text: 'Tracing $2.4M discrepancy to Ledger #47...',
    highlights: ['$2.4M', 'Ledger #47'],
    type: 'critical',
  },
  {
    id: 11,
    text: 'Root cause identified. Evidence dossier ready.',
    highlights: ['Evidence dossier'],
    type: 'success',
  },
]

export const ReasoningDemo = () => {
  const [phase, setPhase] = useState<'idle' | 'thinking' | 'review_ready'>(
    'idle'
  )
  const [stepIndex, setStepIndex] = useState(0)
  const [view, setView] = useState<'logs' | 'dossier'>('logs')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [autoTriggerCountdown, setAutoTriggerCountdown] = useState(8)
  const [pauseCountdown, setPauseCountdown] = useState(false)

  // HUD State - Tracks each Financial Statement module
  const [moduleState, setModuleState] = useState({
    AST: 'waiting',
    LIA: 'waiting',
    EQU: 'waiting',
    INC: 'waiting',
    EXP: 'waiting',
  })

  const handleThink = () => {
    setPhase('thinking')
    setView('logs')
    setStepIndex(0)
    setModuleState({
      AST: 'scanning',
      LIA: 'waiting',
      EQU: 'waiting',
      INC: 'waiting',
      EXP: 'waiting',
    })
  }

  useEffect(() => {
    if (phase === 'thinking') {
      const interval = setInterval(() => {
        setStepIndex((prev) => {
          if (prev >= THOUGHT_SEQUENCE.length - 1) {
            clearInterval(interval)
            setPhase('review_ready')
            return prev
          }

          const nextStep = prev + 1
          const currentLog = THOUGHT_SEQUENCE[nextStep]

          // Update HUD modules based on log progression
          if (currentLog.moduleUpdate) {
            updateHud(currentLog.moduleUpdate)
          }

          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
          }

          return nextStep
        })
      }, 500)

      return () => clearInterval(interval)
    }
  }, [phase])

  const updateHud = (code: string) => {
    setModuleState((prev) => {
      const next = { ...prev }
      if (code === 'AST') {
        next.AST = 'secure'
        next.LIA = 'scanning'
      }
      if (code === 'LIA') {
        next.LIA = 'secure'
        next.EQU = 'scanning'
      }
      if (code === 'EQU') {
        next.EQU = 'secure'
        next.INC = 'scanning'
      }
      if (code === 'INC_WARN') {
        next.INC = 'warning'
      }
      if (code === 'EXP') {
        next.EXP = 'secure'
      }
      return next
    })
  }

  useEffect(() => {
    if (phase === 'idle' && !pauseCountdown) {
      const countdownInterval = setInterval(() => {
        setAutoTriggerCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval)
            handleThink()
            return prev
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(countdownInterval)
    }
  }, [phase, pauseCountdown])

  return (
    <div className="font-inter mx-auto w-full max-w-5xl p-8">
      {/* HEADER SECTION */}
      <div className="mb-12 text-center">
        <h2 className="mb-4 text-5xl font-medium tracking-tighter text-white md:text-6xl">
          The{' '}
          <span className="bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
            Logic Kernel
          </span>
          .
        </h2>
        <p className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-emerald-500/80">
          // AUTOMATED REASONING ENGINE
        </p>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-zinc-400">
          NexusCanon decodes data complexity into audit-ready structure. The law
          of truth <span className="font-bold text-zinc-200">dismantles</span>{' '}
          ambiguity and enforces compliance, line by line.
        </p>
      </div>

      {/* TERMINAL CONTAINER */}
      <div className="relative flex min-h-[600px] flex-col overflow-hidden rounded-xl border border-white/10 bg-black font-mono shadow-2xl">
        {/* Background Effects */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20" />

        {/* HEADER */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div
              className={`h-2 w-2 rounded-full ${phase === 'thinking' ? 'animate-ping bg-emerald-400' : 'bg-zinc-600'}`}
            />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
              NexusCanon Audit Core
            </span>
          </div>

          {/* RIGHT SIDE - Icon Button Group + Metadata */}
          <div className="flex items-center gap-6">
            {/* Icon Button Group - DB + Scan */}
            <div className="flex items-center gap-2">
              {/* DB Status Icon */}
              <div className="rounded border border-zinc-700 bg-zinc-900/50 p-2 transition-colors hover:border-zinc-600">
                <Database className="h-3.5 w-3.5 text-zinc-500" />
              </div>

              {/* Scan Trigger Icon Button */}
              <button
                onClick={handleThink}
                disabled={phase === 'thinking'}
                className={`rounded border p-2 transition-all duration-300 ${
                  phase === 'thinking'
                    ? 'cursor-not-allowed border-zinc-800 bg-zinc-900'
                    : 'border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-500/50 hover:bg-emerald-500/20'
                } `}
                title={phase === 'thinking' ? 'Scanning...' : 'Initiate Scan'}
              >
                {phase === 'thinking' ? (
                  <BrainCircuit className="h-3.5 w-3.5 animate-pulse text-zinc-600" />
                ) : (
                  <Zap className="h-3.5 w-3.5 text-emerald-400" />
                )}
              </button>
            </div>

            {/* Metadata */}
            <div className="flex gap-3 font-mono text-xs text-zinc-600">
              <span>SEC: COMPLIANT</span>
              <span>v2.4.0</span>
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="relative z-10 flex flex-1 flex-col p-8">
          {/* FINANCIAL STATEMENT MODULE HUD - Always Visible */}
          <div className="mb-8 grid grid-cols-5 gap-2 border-b border-white/10 pb-8">
            <ModuleStatus
              label="ASSETS"
              state={moduleState.AST}
              dimmed={view === 'dossier'}
            />
            <ModuleStatus
              label="LIABILITIES"
              state={moduleState.LIA}
              dimmed={view === 'dossier'}
            />
            <ModuleStatus
              label="EQUITY"
              state={moduleState.EQU}
              dimmed={view === 'dossier'}
            />

            {/* INCOME Module - Interactive when warning */}
            <div
              onClick={() =>
                moduleState.INC === 'warning' && setView('dossier')
              }
              className={moduleState.INC === 'warning' ? 'cursor-pointer' : ''}
            >
              <ModuleStatus
                label="INCOME"
                state={moduleState.INC}
                dimmed={false}
                interactive={moduleState.INC === 'warning'}
              />
            </div>

            <ModuleStatus
              label="EXPENSES"
              state={moduleState.EXP}
              dimmed={view === 'dossier'}
            />
          </div>

          <AnimatePresence mode="wait">
            {/* IDLE STATE */}
            {phase === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-1 flex-col items-center justify-center space-y-6 text-zinc-600"
              >
                {/* Hexagon + Diamond Logo - Animated */}
                <div className="relative">
                  <svg
                    width="120"
                    height="120"
                    viewBox="0 0 120 120"
                    fill="none"
                  >
                    {/* Outer Hexagon - Rotating (Properly Centered) */}
                    <motion.path
                      d="M75,34 L90,60 L75,86 L45,86 L30,60 L45,34 Z"
                      stroke="rgba(40, 231, 162, 0.4)"
                      strokeWidth="1.5"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      animate={{
                        pathLength: 1,
                      }}
                      transition={{
                        pathLength: { duration: 2, ease: 'easeInOut' },
                      }}
                    />

                    {/* Rotating Hexagon Animation (separate rotating element) */}
                    <motion.path
                      d="M75,34 L90,60 L75,86 L45,86 L30,60 L45,34 Z"
                      stroke="rgba(40, 231, 162, 0.2)"
                      strokeWidth="1"
                      fill="none"
                      animate={{
                        rotate: 360,
                      }}
                      transition={{
                        rotate: {
                          duration: 20,
                          repeat: Infinity,
                          ease: 'linear',
                        },
                      }}
                      style={{ transformOrigin: '60px 60px' }}
                    />

                    {/* Inner Diamond Crystal */}
                    <motion.path
                      d="M60,35 L75,60 L60,85 L45,60 Z"
                      stroke="rgba(40, 231, 162, 0.7)"
                      strokeWidth="2"
                      fill="rgba(40, 231, 162, 0.05)"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                    />

                    {/* Center Canonical Line */}
                    <motion.line
                      x1="60"
                      y1="35"
                      x2="60"
                      y2="85"
                      stroke="rgba(40, 231, 162, 0.9)"
                      strokeWidth="1.5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1, delay: 1 }}
                    />

                    {/* Pulsing Core */}
                    <motion.circle
                      cx="60"
                      cy="60"
                      r="4"
                      fill="rgba(40, 231, 162, 0.8)"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.8, 0.3, 0.8],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </svg>

                  {/* Background Glow */}
                  <div className="absolute inset-0 -z-10 rounded-full bg-emerald-500/5 blur-2xl" />
                </div>

                {/* DB Icon - Supporting Element */}
                <div className="flex items-center gap-3 opacity-60">
                  <div className="h-8 w-px bg-gradient-to-b from-transparent via-emerald-500/30 to-transparent" />
                  <Database className="h-8 w-8 text-emerald-500/50" />
                  <div className="h-8 w-px bg-gradient-to-b from-transparent via-emerald-500/30 to-transparent" />
                </div>

                <p className="mb-6 text-xs uppercase tracking-widest">
                  System Ready // Waiting for Ledger Data
                </p>

                {/* Auto-trigger countdown indicator - PROMINENT */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mb-6 rounded border border-emerald-500/30 bg-emerald-500/5 px-6 py-3 text-center"
                >
                  <div className="flex items-center justify-center gap-3 font-mono text-xs text-emerald-400">
                    <motion.div
                      className="h-2 w-2 rounded-full bg-emerald-400"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [1, 0.5, 1],
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="uppercase tracking-widest">
                      CRYSTALLIZING LEDGER IN
                    </span>
                    <span className="text-base font-bold tabular-nums">
                      {autoTriggerCountdown}s
                    </span>
                  </div>
                </motion.div>

                {/* PRIMARY CTA BUTTON - Terminal Style */}
                <motion.button
                  onClick={() => {
                    setAutoTriggerCountdown(8) // Reset countdown when manually triggered
                    handleThink()
                  }}
                  className="group relative border border-emerald-500/40 bg-emerald-500/5 px-8 py-3 font-mono text-emerald-400 transition-all duration-200 hover:border-emerald-500/60 hover:bg-emerald-500/10"
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Top-left corner marker */}
                  <div className="absolute left-0 top-0 h-2 w-2 border-l-2 border-t-2 border-emerald-500/60" />

                  {/* Bottom-right corner marker */}
                  <div className="absolute bottom-0 right-0 h-2 w-2 border-b-2 border-r-2 border-emerald-500/60" />

                  <div className="flex items-center gap-3">
                    <span className="text-emerald-500/60">&gt;</span>
                    <span className="text-xs font-bold uppercase tracking-[0.15em]">
                      Execute Forensic Scan
                    </span>
                    <span className="text-emerald-500/60 transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </div>

                  {/* Subtle top edge highlight */}
                  <div className="absolute left-4 right-4 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
                </motion.button>

                {/* Manual trigger hint - visible */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-4 flex items-center gap-2 font-mono text-xs text-zinc-400"
                >
                  <div className="h-px w-8 bg-gradient-to-r from-transparent to-zinc-700" />
                  <span>or click above to start immediately</span>
                  <div className="h-px w-8 bg-gradient-to-l from-transparent to-zinc-700" />
                </motion.div>
              </motion.div>
            )}

            {/* THINKING STATE - Log Stream */}
            {(phase === 'thinking' ||
              (phase === 'review_ready' && view === 'logs')) && (
              <motion.div
                key="logs"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-1 flex-col"
              >
                <div
                  ref={scrollRef}
                  className="scrollbar-hide mask-gradient max-h-[300px] flex-1 space-y-2 overflow-y-auto pr-2"
                >
                  {THOUGHT_SEQUENCE.slice(0, stepIndex + 1).map((log, i) => (
                    <LogLine key={i} log={log} />
                  ))}
                  {phase === 'thinking' && (
                    <motion.div
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="mt-2 h-4 w-2 bg-emerald-500"
                    />
                  )}
                </div>

                {/* Progress Indicator */}
                {phase === 'thinking' && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <div className="mb-1 flex justify-between font-mono text-xs text-emerald-500">
                      <span>PROCESSING...</span>
                      <span>
                        {Math.min(
                          (stepIndex / THOUGHT_SEQUENCE.length) * 100,
                          99
                        ).toFixed(0)}
                        %
                      </span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
                      <motion.div
                        className="h-full bg-emerald-500"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(stepIndex / THOUGHT_SEQUENCE.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Call to Action - Inspect Evidence Dossier */}
                {phase === 'review_ready' && view === 'logs' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 flex items-center justify-between rounded border border-amber-500/30 bg-amber-500/10 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      <div className="text-sm font-bold text-amber-500">
                        CRITICAL ANOMALY DETECTED IN INCOME LEDGER
                      </div>
                    </div>
                    <button
                      onClick={() => setView('dossier')}
                      className="flex items-center gap-2 rounded bg-amber-500 px-4 py-2 text-xs font-bold text-black transition-colors hover:bg-amber-400"
                    >
                      INSPECT EVIDENCE DOSSIER{' '}
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* EVIDENCE DOSSIER VIEW */}
            {view === 'dossier' && phase === 'review_ready' && (
              <motion.div
                key="dossier"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="relative flex-1 overflow-hidden rounded-lg border border-white/10 bg-zinc-900/50 p-6"
              >
                {/* Forensic Grid Background */}
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:20px_20px]" />

                {/* Dossier Header */}
                <div className="relative z-10 mb-8 flex items-start justify-between">
                  <div>
                    <div className="mb-2 text-xs uppercase tracking-widest text-zinc-500">
                      EVIDENCE DOSSIER #882-AZ
                    </div>
                    <h2 className="text-2xl font-light leading-relaxed text-white">
                      Root Cause:{' '}
                      <span className="font-mono text-amber-500">
                        ASC 606 Metadata Gap
                      </span>
                    </h2>
                  </div>
                  <button
                    onClick={() => setView('logs')}
                    className="text-zinc-500 transition-colors hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Evidence Cards */}
                <div className="relative z-10 mb-8 grid grid-cols-3 gap-6">
                  <DossierCard
                    label="SOURCE CONTRACT"
                    value="AR_2024_Q4"
                    icon={<FileText className="h-4 w-4 text-emerald-400" />}
                  />
                  <DossierCard
                    label="FINANCIAL IMPACT"
                    value="$2,400,000"
                    icon={<BarChart3 className="h-4 w-4 text-red-400" />}
                    highlight
                  />
                  <DossierCard
                    label="AFFECTED LEDGERS"
                    value="47 ENTITIES"
                    icon={<Database className="h-4 w-4 text-blue-400" />}
                  />
                </div>

                {/* Forensic Code Evidence */}
                <div className="relative z-10 mb-8 rounded border border-white/10 bg-black/50 p-4 font-mono text-xs">
                  <div className="mb-2 flex items-center gap-2 text-zinc-500">
                    <ScanLine className="h-3 w-3" /> METADATA EXTRACTION
                  </div>
                  <div className="space-y-1">
                    <div className="text-zinc-400">
                      01 <span className="text-purple-400">contract_id</span>:
                      &quot;AR_2024_Q4&quot;
                    </div>
                    <div className="text-zinc-400">
                      02 <span className="text-purple-400">revenue_model</span>:
                      &quot;SaaS_Subscription&quot;
                    </div>
                    <div className="-mx-1 bg-red-500/20 px-1 text-red-300">
                      03{' '}
                      <span className="text-red-400">
                        performance_obligation
                      </span>
                      : NULL {'<--'} ERROR DETECTED
                    </div>
                    <div className="text-zinc-400">
                      04 <span className="text-purple-400">billing_term</span>:
                      &quot;Annual_Upfront&quot;
                    </div>
                  </div>
                </div>

                {/* Remediation Footer */}
                <div className="relative z-10 flex items-center justify-between border-t border-white/5 pt-4">
                  <div className="text-xs text-zinc-500">
                    RECOMMENDATION:{' '}
                    <span className="font-bold text-emerald-400">
                      AUTO-GENERATE SOX CONTROL 44.2
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      // Phase 1: Return to idle state immediately
                      setView('logs')
                      setPhase('idle')
                      setModuleState({
                        AST: 'waiting',
                        LIA: 'waiting',
                        EQU: 'waiting',
                        INC: 'waiting',
                        EXP: 'waiting',
                      })

                      // Phase 2: Pause countdown to let user see idle state
                      setPauseCountdown(true)
                      setAutoTriggerCountdown(8)

                      // Phase 3: After 3 seconds, resume countdown
                      setTimeout(() => {
                        setPauseCountdown(false)
                      }, 3000)
                    }}
                    className="rounded border border-emerald-500/50 bg-emerald-500/20 px-3 py-1.5 text-xs font-bold tracking-wider text-emerald-400 transition-all hover:bg-emerald-500/30"
                  >
                    RESET SIMULATION
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// --- SUB-COMPONENTS ---

const ModuleStatus = ({
  label,
  state,
  dimmed,
  interactive,
}: {
  label: string
  state: string
  dimmed?: boolean
  interactive?: boolean
}) => {
  let styles = 'border-zinc-800 text-zinc-600 bg-zinc-900/30'
  let icon = <div className="h-1.5 w-1.5 rounded-full bg-zinc-700" />

  const opacity = dimmed ? 'opacity-30 blur-[1px]' : 'opacity-100'
  const hover = interactive
    ? 'hover:scale-105 hover:border-amber-500 cursor-pointer'
    : ''

  if (state === 'scanning') {
    styles = 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
    icon = (
      <div className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400" />
    )
  } else if (state === 'secure') {
    styles = 'border-emerald-500/50 text-emerald-500 bg-emerald-500/5'
    icon = <CheckCircle className="h-3 w-3" />
  } else if (state === 'warning') {
    styles = 'border-amber-500 text-amber-500 bg-amber-500/10 animate-pulse'
    icon = <AlertTriangle className="h-3 w-3 animate-bounce" />
  }

  return (
    <div
      className={`flex flex-col items-center justify-center rounded border py-4 transition-all duration-300 ${styles} ${opacity} ${hover}`}
    >
      <div className="mb-2">{icon}</div>
      <span className="text-xs tracking-widest">{label}</span>
      {interactive && (
        <span className="mt-1 rounded bg-amber-500 px-1 text-[10px] text-black">
          INSPECT
        </span>
      )}
    </div>
  )
}

const DossierCard = ({
  label,
  value,
  icon,
  highlight,
}: {
  label: string
  value: string
  icon: React.ReactNode
  highlight?: boolean
}) => (
  <div
    className={`rounded border p-4 ${highlight ? 'border-red-500/30 bg-red-500/5' : 'border-zinc-800 bg-zinc-900'}`}
  >
    <div className="mb-2 flex items-center gap-2 opacity-70">
      {icon}
      <span className="text-xs uppercase tracking-widest text-zinc-400">
        {label}
      </span>
    </div>
    <div className={`font-mono ${highlight ? 'text-red-400' : 'text-white'}`}>
      {value}
    </div>
  </div>
)

const LogLine = ({
  log,
}: {
  log: { text: string; type: string; highlights?: string[] }
}) => {
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'warning':
        return 'text-amber-400 border-amber-500 bg-amber-500/5'
      case 'critical':
        return 'text-red-400'
      case 'rejected':
        return 'text-zinc-600 line-through opacity-50'
      case 'success':
        return 'text-emerald-400'
      default:
        return 'text-zinc-400'
    }
  }

  const renderText = () => {
    if (!log.highlights) return log.text
    let parts: (string | JSX.Element)[] = [log.text]

    log.highlights.forEach((term, termIndex) => {
      const newParts: (string | JSX.Element)[] = []
      parts.forEach((part, partIndex) => {
        if (typeof part === 'string' && part.includes(term)) {
          const split = part.split(term)
          for (let i = 0; i < split.length; i++) {
            newParts.push(split[i])
            if (i < split.length - 1) {
              newParts.push(
                <span
                  key={`${termIndex}-${partIndex}-${i}`}
                  className="rounded bg-white/10 px-1 font-bold text-white"
                >
                  {term}
                </span>
              )
            }
          }
        } else {
          newParts.push(part)
        }
      })
      parts = newParts
    })

    return parts
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      className={`border-l-2 border-transparent py-1 pl-3 font-mono text-xs ${getTypeStyles(log.type)}`}
    >
      <span className="mr-2 opacity-40">&gt;</span>
      {renderText()}
    </motion.div>
  )
}
