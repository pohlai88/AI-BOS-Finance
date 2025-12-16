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
    <div className="w-full max-w-6xl mx-auto min-h-[550px] flex flex-col gap-6">
      {/* Control Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 rounded-lg bg-zinc-900 border border-white/10 hover:border-emerald-500/30 transition-colors"
          >
            {isPaused ? (
              <Play className="w-4 h-4 text-emerald-500" />
            ) : (
              <Pause className="w-4 h-4 text-emerald-500" />
            )}
          </button>
          <span className="text-[12px] font-mono text-zinc-500 uppercase tracking-widest">
            {isPaused ? 'STREAM PAUSED' : 'LIVE FEED ACTIVE'}
          </span>
        </div>

        <div className="text-[12px] font-mono text-zinc-600">
          TRANSACTION {index + 1} / {TRANSACTION_STREAM.length}
        </div>
      </div>

      {/* Main Lens Container */}
      <div className="w-full flex gap-8 bg-zinc-950/50 border border-white/10 rounded-2xl p-8 relative overflow-hidden">
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
          <div className="text-[12px] font-mono text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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
              className="p-6 rounded-xl border border-white/10 bg-zinc-900/80 backdrop-blur-sm shadow-2xl"
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <FileText className="text-purple-400 w-5 h-5" />
                <div className="text-right">
                  <div className="text-white font-mono text-xl">
                    ${currentTx.amount.toLocaleString()}
                  </div>
                  <div className="text-[12px] text-zinc-600 font-mono mt-1">{currentTx.id}</div>
                </div>
              </div>

              {/* Vendor Name */}
              <div className="text-white mb-3">{currentTx.vendor}</div>

              {/* Metadata Grid */}
              <div className="space-y-2 pt-3 border-t border-white/5">
                <div className="flex justify-between text-[12px]">
                  <span className="text-zinc-600 font-mono uppercase tracking-wider">Category</span>
                  <span className="text-zinc-400 font-mono">{currentTx.category}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-zinc-600 font-mono uppercase tracking-wider">Type</span>
                  <span className="text-zinc-400 font-mono">{currentTx.counterparty_type}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-zinc-600 font-mono uppercase tracking-wider">
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
            <div className="text-[12px] font-mono text-zinc-600 uppercase tracking-wider">
              Next in Queue
            </div>
            {TRANSACTION_STREAM.slice(index + 1, index + 3).map((tx, i) => (
              <div
                key={tx.id}
                className="p-2 rounded bg-zinc-900/50 border border-white/5 flex items-center gap-2"
              >
                <div className="w-1 h-1 rounded-full bg-zinc-700" />
                <span className="text-[12px] text-zinc-600 font-mono flex-1">{tx.vendor}</span>
                <span className="text-[12px] text-zinc-700 font-mono">${tx.amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* --- CENTER: THE SCANNING BEAM --- */}
        <div className="w-px bg-gradient-to-b from-transparent via-white/10 to-transparent relative z-10 flex items-center justify-center">
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
            className="absolute bg-zinc-950 p-2 rounded-full border border-emerald-500/30"
          >
            <ArrowRight className="w-4 h-4 text-emerald-500" />
          </motion.div>
        </div>

        {/* --- RIGHT PANEL: THE GOVERNANCE ENGINE (The Result) --- */}
        <div className="flex-1 relative z-10 flex flex-col">
          <div className="text-[12px] font-mono text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full bg-emerald-500"
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
              className="flex-1 bg-black/50 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm"
            >
              {/* 1. The Verdict Header */}
              <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
                <span className="text-zinc-400 text-[14px] font-mono uppercase tracking-wider">
                  Risk Assessment
                </span>
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`px-3 py-1 rounded text-[12px] font-bold font-mono uppercase tracking-widest ${
                    auditResult.riskLevel === 'CRITICAL'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : auditResult.riskLevel === 'WARNING'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
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
                    className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${
                      step.result.status === 'fail'
                        ? 'bg-red-500/5 border-red-500/20'
                        : step.result.status === 'warning'
                          ? 'bg-yellow-500/5 border-yellow-500/20'
                          : 'bg-emerald-500/5 border-emerald-500/20'
                    }`}
                  >
                    {/* Status Icon */}
                    {step.result.status === 'fail' ? (
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    ) : step.result.status === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    )}

                    {/* Rule Details */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-[12px] font-bold text-zinc-300 uppercase tracking-wide">
                          {step.ruleName}
                        </div>
                        <div className="text-[12px] text-zinc-600 font-mono">{step.standard}</div>
                      </div>
                      <div className="text-[12px] text-zinc-500 font-mono">{step.result.msg}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* 3. Logic Trace Preview (The Glass Box) */}
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <GitBranch className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
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
                        step.result === 'pass' && "bg-emerald-500",
                        step.result === 'fail' && "bg-red-500",
                        step.result === 'skip' && "bg-zinc-600",
                        step.result === 'apply' && "bg-yellow-500"
                      )}
                      title={step.description}
                    />
                  ))}
                  {auditResult.logicTrace.length > 8 && (
                    <span className="text-[10px] text-zinc-600 font-mono">
                      +{auditResult.logicTrace.length - 8}
                    </span>
                  )}
                </div>
              </div>

              {/* 4. Timestamp Footer */}
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[12px] text-zinc-600 font-mono uppercase tracking-wider">
                  {auditResult.processingTimeMs.toFixed(2)}ms
                </span>
                <span className="text-[12px] text-zinc-700 font-mono">
                  {new Date(auditResult.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/50 border border-white/5 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[12px] font-mono text-zinc-500 uppercase tracking-wider">
            Truth Engine v2.0: Deterministic
          </span>
        </div>
        <div className="text-[12px] font-mono text-zinc-600">
          Glass Box Logic • {auditResult.processingTimeMs.toFixed(2)}ms/scan
        </div>
      </div>
    </div>
  );
};
