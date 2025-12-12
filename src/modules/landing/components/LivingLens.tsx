import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  FileText,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  GitBranch,
} from 'lucide-react'
// IMPORT THE BRAIN (v2.0 with Logic Trace)
import {
  runAudit,
  TRANSACTION_STREAM,
  type Transaction,
  type Verdict,
} from './GovernanceEngine'
import { cn } from '@/lib/utils'

export const LivingLens = () => {
  const [index, setIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showBeam, setShowBeam] = useState(false)

  const currentTx = TRANSACTION_STREAM[index]

  // 1. CALL THE BRAIN - This is where the magic happens
  const auditResult = runAudit(currentTx)

  // Trigger beam animation when transaction changes
  useEffect(() => {
    setShowBeam(true)
    const beamTimer = setTimeout(() => setShowBeam(false), 800)
    return () => clearTimeout(beamTimer)
  }, [index])

  // Auto-rotate logic (UI only)
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % TRANSACTION_STREAM.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [isPaused])

  return (
    <div className="mx-auto flex min-h-[550px] w-full max-w-6xl flex-col gap-6">
      {/* Control Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="rounded-lg border border-white/10 bg-zinc-900 p-2 transition-colors hover:border-emerald-500/30"
          >
            {isPaused ? (
              <Play className="h-4 w-4 text-emerald-500" />
            ) : (
              <Pause className="h-4 w-4 text-emerald-500" />
            )}
          </button>
          <span className="font-mono text-[12px] uppercase tracking-widest text-zinc-500">
            {isPaused ? 'STREAM PAUSED' : 'LIVE FEED ACTIVE'}
          </span>
        </div>

        <div className="font-mono text-[12px] text-zinc-600">
          TRANSACTION {index + 1} / {TRANSACTION_STREAM.length}
        </div>
      </div>

      {/* Main Lens Container */}
      <div className="relative flex w-full gap-8 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/50 p-8">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:50px_50px]" />

        {/* Scanning Effect Overlay */}
        <AnimatePresence>
          {showBeam && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="pointer-events-none absolute inset-0 z-30 w-32 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent"
            />
          )}
        </AnimatePresence>

        {/* --- LEFT PANEL: THE INBOUND STREAM --- */}
        <div className="relative z-10 flex w-1/3 flex-col">
          <div className="mb-4 flex items-center gap-2 font-mono text-[12px] uppercase tracking-widest text-zinc-500">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Inbound Stream
          </div>

          {/* Animated Transaction Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTx.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur-sm"
            >
              {/* Card Header */}
              <div className="mb-4 flex items-start justify-between">
                <FileText className="h-5 w-5 text-purple-400" />
                <div className="text-right">
                  <div className="font-mono text-xl text-white">
                    ${currentTx.amount.toLocaleString()}
                  </div>
                  <div className="mt-1 font-mono text-[12px] text-zinc-600">
                    {currentTx.id}
                  </div>
                </div>
              </div>

              {/* Vendor Name */}
              <div className="mb-3 text-white">{currentTx.vendor}</div>

              {/* Metadata Grid */}
              <div className="space-y-2 border-t border-white/5 pt-3">
                <div className="flex justify-between text-[12px]">
                  <span className="font-mono uppercase tracking-wider text-zinc-600">
                    Category
                  </span>
                  <span className="font-mono text-zinc-400">
                    {currentTx.category}
                  </span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="font-mono uppercase tracking-wider text-zinc-600">
                    Type
                  </span>
                  <span className="font-mono text-zinc-400">
                    {currentTx.counterparty_type}
                  </span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="font-mono uppercase tracking-wider text-zinc-600">
                    Customer?
                  </span>
                  <span
                    className={`font-mono ${currentTx.is_existing_customer ? 'text-yellow-400' : 'text-zinc-400'}`}
                  >
                    {currentTx.is_existing_customer ? 'YES' : 'NO'}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Queue Preview */}
          <div className="mt-6 space-y-2">
            <div className="font-mono text-[12px] uppercase tracking-wider text-zinc-600">
              Next in Queue
            </div>
            {TRANSACTION_STREAM.slice(index + 1, index + 3).map((tx, i) => (
              <div
                key={tx.id}
                className="flex items-center gap-2 rounded border border-white/5 bg-zinc-900/50 p-2"
              >
                <div className="h-1 w-1 rounded-full bg-zinc-700" />
                <span className="flex-1 font-mono text-[12px] text-zinc-600">
                  {tx.vendor}
                </span>
                <span className="font-mono text-[12px] text-zinc-700">
                  ${tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* --- CENTER: THE SCANNING BEAM --- */}
        <div className="relative z-10 flex w-px items-center justify-center bg-gradient-to-b from-transparent via-white/10 to-transparent">
          <motion.div
            animate={
              showBeam
                ? {
                    scale: [1, 1.5, 1],
                    boxShadow: [
                      '0 0 0px rgba(16,185,129,0)',
                      '0 0 30px rgba(16,185,129,0.8)',
                      '0 0 0px rgba(16,185,129,0)',
                    ],
                  }
                : {}
            }
            transition={{ duration: 0.8 }}
            className="absolute rounded-full border border-emerald-500/30 bg-zinc-950 p-2"
          >
            <ArrowRight className="h-4 w-4 text-emerald-500" />
          </motion.div>
        </div>

        {/* --- RIGHT PANEL: THE GOVERNANCE ENGINE (The Result) --- */}
        <div className="relative z-10 flex flex-1 flex-col">
          <div className="mb-4 flex items-center gap-2 font-mono text-[12px] uppercase tracking-widest text-zinc-500">
            <div
              className="h-2 w-2 rounded-full bg-emerald-500"
              style={{
                animation:
                  auditResult.riskLevel === 'CRITICAL'
                    ? 'pulse 1s ease-in-out infinite'
                    : 'none',
              }}
            />
            NexusCanon Engine
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentTx.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex-1 rounded-xl border border-zinc-800 bg-black/50 p-6 backdrop-blur-sm"
            >
              {/* 1. The Verdict Header */}
              <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                <span className="font-mono text-[14px] uppercase tracking-wider text-zinc-400">
                  Risk Assessment
                </span>
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`rounded px-3 py-1 font-mono text-[12px] font-bold uppercase tracking-widest ${
                    auditResult.riskLevel === 'CRITICAL'
                      ? 'border border-red-500/30 bg-red-500/20 text-red-400'
                      : auditResult.riskLevel === 'WARNING'
                        ? 'border border-yellow-500/30 bg-yellow-500/20 text-yellow-400'
                        : 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {auditResult.riskLevel}
                </motion.span>
              </div>

              {/* 2. The Logic Steps (Visualizing the Engine at Work) */}
              <div className="space-y-3">
                {auditResult.details.map((step, i) => (
                  <motion.div
                    key={step.ruleId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.15 }}
                    className={`flex items-start gap-3 rounded-lg border p-4 transition-all ${
                      step.result.status === 'fail'
                        ? 'border-red-500/20 bg-red-500/5'
                        : step.result.status === 'warning'
                          ? 'border-yellow-500/20 bg-yellow-500/5'
                          : 'border-emerald-500/20 bg-emerald-500/5'
                    }`}
                  >
                    {/* Status Icon */}
                    {step.result.status === 'fail' ? (
                      <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                    ) : step.result.status === 'warning' ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-500" />
                    ) : (
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                    )}

                    {/* Rule Details */}
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <div className="text-[12px] font-bold uppercase tracking-wide text-zinc-300">
                          {step.ruleName}
                        </div>
                        <div className="font-mono text-[12px] text-zinc-600">
                          {step.standard}
                        </div>
                      </div>
                      <div className="font-mono text-[12px] text-zinc-500">
                        {step.result.msg}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* 3. Logic Trace Preview (The Glass Box) */}
              <div className="mt-4 border-t border-white/5 pt-4">
                <div className="mb-2 flex items-center gap-2">
                  <GitBranch className="h-3 w-3 text-emerald-500" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                    Logic Trace ({auditResult.logicTrace.length} steps)
                  </span>
                </div>
                <div className="flex gap-1 overflow-hidden">
                  {auditResult.logicTrace.slice(0, 8).map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8 + i * 0.05 }}
                      className={cn(
                        'h-2 w-2 flex-shrink-0 rounded-full',
                        step.result === 'pass' && 'bg-emerald-500',
                        step.result === 'fail' && 'bg-red-500',
                        step.result === 'skip' && 'bg-zinc-600',
                        step.result === 'apply' && 'bg-yellow-500'
                      )}
                      title={step.description}
                    />
                  ))}
                  {auditResult.logicTrace.length > 8 && (
                    <span className="font-mono text-[10px] text-zinc-600">
                      +{auditResult.logicTrace.length - 8}
                    </span>
                  )}
                </div>
              </div>

              {/* 4. Timestamp Footer */}
              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                <span className="font-mono text-[12px] uppercase tracking-wider text-zinc-600">
                  {auditResult.processingTimeMs.toFixed(2)}ms
                </span>
                <span className="font-mono text-[12px] text-zinc-700">
                  {new Date(auditResult.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between rounded-lg border border-white/5 bg-zinc-900/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span className="font-mono text-[12px] uppercase tracking-wider text-zinc-500">
            Truth Engine v2.0: Deterministic
          </span>
        </div>
        <div className="font-mono text-[12px] text-zinc-600">
          Glass Box Logic • {auditResult.processingTimeMs.toFixed(2)}ms/scan
        </div>
      </div>
    </div>
  )
}
