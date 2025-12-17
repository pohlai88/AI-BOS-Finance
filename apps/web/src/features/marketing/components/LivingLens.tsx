import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  GitBranch,
} from 'lucide-react';
// IMPORT THE BRAIN (v2.0 with Logic Trace)
import { runAudit, TRANSACTION_STREAM, type Transaction, type Verdict } from './GovernanceEngine';
import { cn } from '@/lib/utils';

export const LivingLens = () => {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showBeam, setShowBeam] = useState(false);

  const currentTx = TRANSACTION_STREAM[index];

  // 1. CALL THE BRAIN - This is where the magic happens
  const auditResult = runAudit(currentTx);

  // Trigger beam animation when transaction changes
  useEffect(() => {
    setShowBeam(true);
    const beamTimer = setTimeout(() => setShowBeam(false), 800);
    return () => clearTimeout(beamTimer);
  }, [index]);

  // Auto-rotate logic (UI only)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % TRANSACTION_STREAM.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <div className="w-full max-w-6xl mx-auto min-h-[550px] flex flex-col gap-layout-md">
      {/* Control Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 rounded-lg bg-surface-card border border-border-subtle hover:border-primary/30 transition-colors"
          >
            {isPaused ? (
              <Play className="w-4 h-4 text-primary" />
            ) : (
              <Pause className="w-4 h-4 text-primary" />
            )}
          </button>
          <span className="text-micro font-mono text-text-tertiary uppercase tracking-widest">
            {isPaused ? 'STREAM PAUSED' : 'LIVE FEED ACTIVE'}
          </span>
        </div>

        <div className="text-micro font-mono text-text-tertiary">
          TRANSACTION {index + 1} / {TRANSACTION_STREAM.length}
        </div>
      </div>

      {/* Main Lens Container */}
      <div className="w-full flex gap-layout-lg bg-surface-card/50 border border-border-subtle rounded-2xl p-layout-lg relative overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[size:50px_50px] bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)]" />

        {/* Scanning Effect Overlay */}
        <AnimatePresence>
          {showBeam && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="absolute inset-0 w-32 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent pointer-events-none z-30"
            />
          )}
        </AnimatePresence>

        {/* --- LEFT PANEL: THE INBOUND STREAM --- */}
        <div className="w-1/3 relative z-10 flex flex-col">
          <div className="text-micro font-mono text-text-tertiary uppercase tracking-widest mb-layout-sm flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
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
              className="p-layout-md rounded-xl border border-border-subtle bg-surface-card/80 backdrop-blur-sm shadow-card"
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-layout-sm">
                <FileText className="text-primary w-5 h-5" />
                <div className="text-right">
                  <div className="text-white font-mono text-xl">
                    ${currentTx.amount.toLocaleString()}
                  </div>
                  <div className="text-micro text-text-tertiary font-mono mt-1">{currentTx.id}</div>
                </div>
              </div>

              {/* Vendor Name */}
              <div className="text-white mb-layout-xs">{currentTx.vendor}</div>

              {/* Metadata Grid */}
              <div className="space-y-2 pt-layout-xs border-t border-border-subtle">
                <div className="flex justify-between text-micro">
                  <span className="text-text-tertiary font-mono uppercase tracking-wider">Category</span>
                  <span className="text-text-secondary font-mono">{currentTx.category}</span>
                </div>
                <div className="flex justify-between text-micro">
                  <span className="text-text-tertiary font-mono uppercase tracking-wider">Type</span>
                  <span className="text-text-secondary font-mono">{currentTx.counterparty_type}</span>
                </div>
                <div className="flex justify-between text-micro">
                  <span className="text-text-tertiary font-mono uppercase tracking-wider">
                    Customer?
                  </span>
                  <span
                    className={`font-mono ${currentTx.is_existing_customer ? 'text-status-warning' : 'text-text-secondary'}`}
                  >
                    {currentTx.is_existing_customer ? 'YES' : 'NO'}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Queue Preview */}
          <div className="mt-layout-md space-y-2">
            <div className="text-micro font-mono text-text-tertiary uppercase tracking-wider">
              Next in Queue
            </div>
            {TRANSACTION_STREAM.slice(index + 1, index + 3).map((tx, i) => (
              <div
                key={tx.id}
                className="p-2 rounded bg-surface-subtle border border-border-subtle flex items-center gap-2"
              >
                <div className="w-1 h-1 rounded-full bg-text-tertiary" />
                <span className="text-micro text-text-tertiary font-mono flex-1">{tx.vendor}</span>
                <span className="text-micro text-text-tertiary font-mono">${tx.amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* --- CENTER: THE SCANNING BEAM --- */}
        <div className="w-px bg-gradient-to-b from-transparent via-border-subtle to-transparent relative z-10 flex items-center justify-center">
          <motion.div
            animate={
              showBeam
                ? {
                  scale: [1, 1.5, 1],
                  boxShadow: [
                    '0 0 0px rgba(74,144,226,0)',
                    '0 0 30px rgba(74,144,226,0.8)',
                    '0 0 0px rgba(74,144,226,0)',
                  ],
                }
                : {}
            }
            transition={{ duration: 0.8 }}
            className="absolute bg-background p-2 rounded-full border border-primary/30"
          >
            <ArrowRight className="w-4 h-4 text-primary" />
          </motion.div>
        </div>

        {/* --- RIGHT PANEL: THE GOVERNANCE ENGINE (The Result) --- */}
        <div className="flex-1 relative z-10 flex flex-col">
          <div className="text-micro font-mono text-text-tertiary uppercase tracking-widest mb-layout-sm flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full bg-primary"
              style={{
                animation:
                  auditResult.riskLevel === 'CRITICAL' ? 'pulse 1s ease-in-out infinite' : 'none',
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
              className="flex-1 bg-surface-nested/50 border border-border-subtle rounded-xl p-layout-md backdrop-blur-sm"
            >
              {/* 1. The Verdict Header */}
              <div className="flex justify-between items-center border-b border-border-subtle pb-layout-sm mb-layout-md">
                <span className="text-text-secondary text-small font-mono uppercase tracking-wider">
                  Risk Assessment
                </span>
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`px-3 py-1 rounded text-micro font-bold font-mono uppercase tracking-widest ${auditResult.riskLevel === 'CRITICAL'
                      ? 'bg-status-error/20 text-status-error border border-status-error/30'
                      : auditResult.riskLevel === 'WARNING'
                        ? 'bg-status-warning/20 text-status-warning border border-status-warning/30'
                        : 'bg-primary/20 text-primary border border-primary/30'
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
                    className={`flex items-start gap-3 p-layout-sm rounded-lg border transition-all ${step.result.status === 'fail'
                        ? 'bg-status-error/5 border-status-error/20'
                        : step.result.status === 'warning'
                          ? 'bg-status-warning/5 border-status-warning/20'
                          : 'bg-primary/5 border-primary/20'
                      }`}
                  >
                    {/* Status Icon */}
                    {step.result.status === 'fail' ? (
                      <XCircle className="w-4 h-4 text-status-error mt-0.5 flex-shrink-0" />
                    ) : step.result.status === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-status-warning mt-0.5 flex-shrink-0" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    )}

                    {/* Rule Details */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-micro font-bold text-text-secondary uppercase tracking-wide">
                          {step.ruleName}
                        </div>
                        <div className="text-micro text-text-tertiary font-mono">{step.standard}</div>
                      </div>
                      <div className="text-micro text-text-tertiary font-mono">{step.result.msg}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* 3. Logic Trace Preview (The Glass Box) */}
              <div className="mt-layout-sm pt-layout-sm border-t border-border-subtle">
                <div className="flex items-center gap-2 mb-2">
                  <GitBranch className="w-3 h-3 text-primary" />
                  <span className="text-micro font-mono text-text-tertiary uppercase tracking-widest">
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
                        "w-2 h-2 rounded-full flex-shrink-0",
                        step.result === 'pass' && "bg-primary",
                        step.result === 'fail' && "bg-status-error",
                        step.result === 'skip' && "bg-text-tertiary",
                        step.result === 'apply' && "bg-status-warning"
                      )}
                      title={step.description}
                    />
                  ))}
                  {auditResult.logicTrace.length > 8 && (
                    <span className="text-micro text-text-tertiary font-mono">
                      +{auditResult.logicTrace.length - 8}
                    </span>
                  )}
                </div>
              </div>

              {/* 4. Timestamp Footer */}
              <div className="mt-layout-sm pt-layout-sm border-t border-border-subtle flex items-center justify-between">
                <span className="text-micro text-text-tertiary font-mono uppercase tracking-wider">
                  {auditResult.processingTimeMs.toFixed(2)}ms
                </span>
                <span className="text-micro text-text-tertiary font-mono">
                  {new Date(auditResult.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between px-layout-md py-layout-xs bg-surface-card/50 border border-border-subtle rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-micro font-mono text-text-tertiary uppercase tracking-wider">
            Truth Engine v2.0: Deterministic
          </span>
        </div>
        <div className="text-micro font-mono text-text-tertiary">
          Glass Box Logic • {auditResult.processingTimeMs.toFixed(2)}ms/scan
        </div>
      </div>
    </div>
  );
};
