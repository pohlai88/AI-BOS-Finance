// ============================================================================
// TRUTH BAR - The Forensic Query Interface
// "Ask the System. Get the Proof."
// Features: Thinking State, Logic Trace Visualization, Glass Box Output
// ============================================================================

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Zap,
  GitBranch,
} from 'lucide-react'
import { NexusIcon } from '@/components/nexus/NexusIcon'
import {
  runAudit,
  TRANSACTION_STREAM,
  type Transaction,
  type Verdict,
  type TraceStep,
} from './GovernanceEngine'
import { cn } from '@/lib/utils'

// --- THINKING MESSAGES (builds trust) ---
const THINKING_PHASES = [
  'Parsing input parameters...',
  'Loading regulatory framework...',
  'Traversing IRS Section 274...',
  'Checking IFRS 15 compliance...',
  'Evaluating materiality thresholds...',
  'Computing verdict...',
]

// --- THE LOGIC TRACE VISUALIZER ---
const LogicTraceViz = ({
  trace,
  isExpanded,
}: {
  trace: TraceStep[]
  isExpanded: boolean
}) => {
  if (!isExpanded || trace.length === 0) return null

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <div className="border-nexus-structure mt-4 border-t pt-4">
        <div className="mb-3 flex items-center gap-2">
          <GitBranch className="text-nexus-green h-3 w-3" />
          <span className="text-nexus-noise font-mono text-[10px] uppercase tracking-widest">
            Logic Traversal Path
          </span>
        </div>

        {/* THE PROOF PATH - Visual Flow */}
        <div className="relative space-y-1 pl-4">
          {/* Vertical Connection Line */}
          <div className="bg-nexus-structure absolute bottom-2 left-[7px] top-2 w-px" />

          {trace.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative flex items-start gap-3 py-1"
            >
              {/* Node Indicator */}
              <div
                className={cn(
                  'bg-nexus-void z-10 h-3 w-3 flex-shrink-0 rounded-full border-2',
                  step.result === 'pass' && 'border-nexus-green',
                  step.result === 'fail' && 'border-red-500',
                  step.result === 'skip' && 'border-nexus-noise',
                  step.result === 'apply' && 'border-yellow-500'
                )}
              />

              {/* Step Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-nexus-structure font-mono text-[9px] uppercase">
                    {step.node.split('::').pop()}
                  </span>
                  <span className="text-nexus-structure font-mono text-[9px]">
                    {step.timestamp.toFixed(2)}ms
                  </span>
                </div>
                <p className="text-nexus-signal truncate text-[11px]">
                  {step.description}
                </p>
              </div>

              {/* Result Badge */}
              <span
                className={cn(
                  'flex-shrink-0 rounded px-1.5 py-0.5 font-mono text-[8px] uppercase',
                  step.result === 'pass' &&
                    'bg-nexus-green/10 text-nexus-green',
                  step.result === 'fail' && 'bg-red-500/10 text-red-400',
                  step.result === 'skip' && 'bg-nexus-subtle text-nexus-noise',
                  step.result === 'apply' && 'bg-yellow-500/10 text-yellow-400'
                )}
              >
                {step.result}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// --- THE VERDICT CARD ---
const VerdictCard = ({ verdict }: { verdict: Verdict }) => {
  const [showTrace, setShowTrace] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-nexus-matter border-nexus-structure border p-6"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {verdict.riskLevel === 'APPROVED' && (
            <div className="bg-nexus-green/10 flex h-8 w-8 items-center justify-center rounded">
              <CheckCircle className="text-nexus-green h-4 w-4" />
            </div>
          )}
          {verdict.riskLevel === 'WARNING' && (
            <div className="flex h-8 w-8 items-center justify-center rounded bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
            </div>
          )}
          {verdict.riskLevel === 'CRITICAL' && (
            <div className="flex h-8 w-8 items-center justify-center rounded bg-red-500/10">
              <XCircle className="h-4 w-4 text-red-400" />
            </div>
          )}
          <div>
            <div className="font-medium text-white">
              Verdict: {verdict.riskLevel}
            </div>
            <div className="text-nexus-noise font-mono text-[10px]">
              Processed in {verdict.processingTimeMs.toFixed(2)}ms
            </div>
          </div>
        </div>

        {/* Toggle Trace Button */}
        <button
          onClick={() => setShowTrace(!showTrace)}
          className={cn(
            'flex items-center gap-1 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all',
            showTrace
              ? 'border-nexus-green text-nexus-green bg-nexus-green/5'
              : 'border-nexus-structure text-nexus-noise hover:border-nexus-green hover:text-nexus-green'
          )}
        >
          <GitBranch className="h-3 w-3" />
          {showTrace ? 'Hide Proof' : 'Show Proof'}
        </button>
      </div>

      {/* Rule Results */}
      <div className="mb-4 space-y-2">
        {verdict.details.map((rule) => (
          <div
            key={rule.ruleId}
            className={cn(
              'flex items-center gap-3 border p-3',
              rule.result.status === 'pass' &&
                'border-nexus-green/20 bg-nexus-green/5',
              rule.result.status === 'warning' &&
                'border-yellow-500/20 bg-yellow-500/5',
              rule.result.status === 'fail' && 'border-red-500/20 bg-red-500/5'
            )}
          >
            {rule.result.status === 'pass' && (
              <CheckCircle className="text-nexus-green h-4 w-4 flex-shrink-0" />
            )}
            {rule.result.status === 'warning' && (
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-yellow-400" />
            )}
            {rule.result.status === 'fail' && (
              <XCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-white">
                  {rule.ruleName}
                </span>
                <span className="text-nexus-structure font-mono text-[9px]">
                  {rule.standard}
                </span>
              </div>
              <p className="text-nexus-noise truncate text-[11px]">
                {rule.result.msg}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* THE GLASS BOX - Logic Trace */}
      <AnimatePresence>
        <LogicTraceViz trace={verdict.logicTrace} isExpanded={showTrace} />
      </AnimatePresence>
    </motion.div>
  )
}

// --- THE MAIN TRUTH BAR COMPONENT ---
export const TruthBar = () => {
  const [query, setQuery] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingPhase, setThinkingPhase] = useState(0)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

  // Simulate "thinking" animation
  useEffect(() => {
    if (!isThinking) return

    const interval = setInterval(() => {
      setThinkingPhase((p) => {
        if (p >= THINKING_PHASES.length - 1) {
          clearInterval(interval)
          return p
        }
        return p + 1
      })
    }, 200)

    return () => clearInterval(interval)
  }, [isThinking])

  const handleAnalyze = useCallback((tx: Transaction) => {
    setSelectedTx(tx)
    setVerdict(null)
    setIsThinking(true)
    setThinkingPhase(0)

    // Simulate processing delay for UX
    setTimeout(
      () => {
        const result = runAudit(tx)
        setVerdict(result)
        setIsThinking(false)
      },
      THINKING_PHASES.length * 200 + 100
    )
  }, [])

  // Quick-select a transaction by ID
  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const found = TRANSACTION_STREAM.find(
      (tx) =>
        tx.id.toLowerCase().includes(query.toLowerCase()) ||
        tx.vendor.toLowerCase().includes(query.toLowerCase())
    )
    if (found) {
      handleAnalyze(found)
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* THE SEARCH BAR */}
      <div className="relative">
        <form onSubmit={handleQuickSearch}>
          <div className="relative">
            <Search className="text-nexus-noise absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search transaction ID or vendor name..."
              className="bg-nexus-matter border-nexus-structure placeholder:text-nexus-structure focus:border-nexus-green h-14 w-full border pl-12 pr-32 font-mono text-white transition-colors focus:outline-none"
            />
            <button
              type="submit"
              disabled={isThinking}
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all',
                'border-nexus-green text-nexus-green hover:bg-nexus-green hover:text-nexus-void border',
                isThinking && 'cursor-not-allowed opacity-50'
              )}
            >
              {isThinking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="h-3 w-3" />
                  Analyze
                </span>
              )}
            </button>
          </div>
        </form>

        {/* Sample Transactions Quick Select */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-nexus-structure flex-shrink-0 font-mono text-[10px] uppercase tracking-wider">
            Sample Data:
          </span>
          {TRANSACTION_STREAM.slice(0, 4).map((tx) => (
            <button
              key={tx.id}
              onClick={() => handleAnalyze(tx)}
              disabled={isThinking}
              className={cn(
                'flex-shrink-0 border px-3 py-1.5 font-mono text-[10px] transition-all',
                selectedTx?.id === tx.id
                  ? 'border-nexus-green text-nexus-green bg-nexus-green/5'
                  : 'border-nexus-structure text-nexus-noise hover:border-nexus-subtle hover:text-nexus-signal'
              )}
            >
              {tx.id} • {tx.vendor.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* THINKING STATE */}
      <AnimatePresence>
        {isThinking && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-nexus-matter border-nexus-structure border p-6"
          >
            <div className="flex items-center gap-4">
              <Loader2 className="text-nexus-green h-5 w-5 animate-spin" />
              <div>
                <div className="text-sm font-medium text-white">
                  Processing Transaction
                </div>
                <motion.div
                  key={thinkingPhase}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-nexus-green font-mono text-[11px]"
                >
                  {THINKING_PHASES[thinkingPhase]}
                </motion.div>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="mt-4 flex gap-1">
              {THINKING_PHASES.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1 flex-1 transition-all duration-200',
                    i <= thinkingPhase ? 'bg-nexus-green' : 'bg-nexus-structure'
                  )}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* THE VERDICT */}
      <AnimatePresence>
        {verdict && !isThinking && <VerdictCard verdict={verdict} />}
      </AnimatePresence>

      {/* Initial State */}
      {!verdict && !isThinking && (
        <div className="bg-nexus-matter/50 border-nexus-structure border border-dashed p-8 text-center">
          <div className="mb-4 flex justify-center">
            <NexusIcon size="lg" animated />
          </div>
          <div className="text-nexus-signal mb-1">
            Select a Transaction to Analyze
          </div>
          <p className="text-nexus-noise mx-auto max-w-md text-[11px]">
            Click any sample transaction above or search by ID/vendor name. The
            Truth Engine will traverse all regulatory rules and show you the
            exact logic path.
          </p>
        </div>
      )}
    </div>
  )
}
