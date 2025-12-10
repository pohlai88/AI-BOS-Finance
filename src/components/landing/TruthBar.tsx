// ============================================================================
// TRUTH BAR - The Forensic Query Interface
// "Ask the System. Get the Proof."
// Features: Thinking State, Logic Trace Visualization, Glass Box Output
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search,
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ChevronRight,
  Zap,
  GitBranch
} from 'lucide-react';
import { NexusIcon } from '@/components/nexus/NexusIcon';
import { 
  runAudit, 
  TRANSACTION_STREAM, 
  type Transaction, 
  type Verdict,
  type TraceStep 
} from './GovernanceEngine';
import { cn } from '@/lib/utils';

// --- THINKING MESSAGES (builds trust) ---
const THINKING_PHASES = [
  'Parsing input parameters...',
  'Loading regulatory framework...',
  'Traversing IRS Section 274...',
  'Checking IFRS 15 compliance...',
  'Evaluating materiality thresholds...',
  'Computing verdict...',
];

// --- THE LOGIC TRACE VISUALIZER ---
const LogicTraceViz = ({ trace, isExpanded }: { trace: TraceStep[]; isExpanded: boolean }) => {
  if (!isExpanded || trace.length === 0) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <div className="pt-4 border-t border-nexus-structure mt-4">
        <div className="flex items-center gap-2 mb-3">
          <GitBranch className="w-3 h-3 text-nexus-green" />
          <span className="text-[10px] font-mono text-nexus-noise uppercase tracking-widest">
            Logic Traversal Path
          </span>
        </div>
        
        {/* THE PROOF PATH - Visual Flow */}
        <div className="relative pl-4 space-y-1">
          {/* Vertical Connection Line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-nexus-structure" />
          
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
                  "w-3 h-3 rounded-full border-2 flex-shrink-0 z-10 bg-nexus-void",
                  step.result === 'pass' && "border-nexus-green",
                  step.result === 'fail' && "border-red-500",
                  step.result === 'skip' && "border-nexus-noise",
                  step.result === 'apply' && "border-yellow-500"
                )}
              />
              
              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-nexus-structure uppercase">
                    {step.node.split('::').pop()}
                  </span>
                  <span className="text-[9px] font-mono text-nexus-structure">
                    {step.timestamp.toFixed(2)}ms
                  </span>
                </div>
                <p className="text-[11px] text-nexus-signal truncate">
                  {step.description}
                </p>
              </div>
              
              {/* Result Badge */}
              <span className={cn(
                "text-[8px] font-mono uppercase px-1.5 py-0.5 rounded flex-shrink-0",
                step.result === 'pass' && "bg-nexus-green/10 text-nexus-green",
                step.result === 'fail' && "bg-red-500/10 text-red-400",
                step.result === 'skip' && "bg-nexus-subtle text-nexus-noise",
                step.result === 'apply' && "bg-yellow-500/10 text-yellow-400"
              )}>
                {step.result}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// --- THE VERDICT CARD ---
const VerdictCard = ({ verdict }: { verdict: Verdict }) => {
  const [showTrace, setShowTrace] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-nexus-matter border border-nexus-structure p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {verdict.riskLevel === 'APPROVED' && (
            <div className="w-8 h-8 rounded bg-nexus-green/10 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-nexus-green" />
            </div>
          )}
          {verdict.riskLevel === 'WARNING' && (
            <div className="w-8 h-8 rounded bg-yellow-500/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
            </div>
          )}
          {verdict.riskLevel === 'CRITICAL' && (
            <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-400" />
            </div>
          )}
          <div>
            <div className="text-white font-medium">Verdict: {verdict.riskLevel}</div>
            <div className="text-[10px] font-mono text-nexus-noise">
              Processed in {verdict.processingTimeMs.toFixed(2)}ms
            </div>
          </div>
        </div>
        
        {/* Toggle Trace Button */}
        <button
          onClick={() => setShowTrace(!showTrace)}
          className={cn(
            "flex items-center gap-1 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border transition-all",
            showTrace 
              ? "border-nexus-green text-nexus-green bg-nexus-green/5" 
              : "border-nexus-structure text-nexus-noise hover:border-nexus-green hover:text-nexus-green"
          )}
        >
          <GitBranch className="w-3 h-3" />
          {showTrace ? 'Hide Proof' : 'Show Proof'}
        </button>
      </div>
      
      {/* Rule Results */}
      <div className="space-y-2 mb-4">
        {verdict.details.map((rule) => (
          <div 
            key={rule.ruleId}
            className={cn(
              "flex items-center gap-3 p-3 border",
              rule.result.status === 'pass' && "border-nexus-green/20 bg-nexus-green/5",
              rule.result.status === 'warning' && "border-yellow-500/20 bg-yellow-500/5",
              rule.result.status === 'fail' && "border-red-500/20 bg-red-500/5"
            )}
          >
            {rule.result.status === 'pass' && <CheckCircle className="w-4 h-4 text-nexus-green flex-shrink-0" />}
            {rule.result.status === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />}
            {rule.result.status === 'fail' && <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white font-medium">{rule.ruleName}</span>
                <span className="text-[9px] font-mono text-nexus-structure">{rule.standard}</span>
              </div>
              <p className="text-[11px] text-nexus-noise truncate">{rule.result.msg}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* THE GLASS BOX - Logic Trace */}
      <AnimatePresence>
        <LogicTraceViz trace={verdict.logicTrace} isExpanded={showTrace} />
      </AnimatePresence>
    </motion.div>
  );
};

// --- THE MAIN TRUTH BAR COMPONENT ---
export const TruthBar = () => {
  const [query, setQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingPhase, setThinkingPhase] = useState(0);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Simulate "thinking" animation
  useEffect(() => {
    if (!isThinking) return;
    
    const interval = setInterval(() => {
      setThinkingPhase((p) => {
        if (p >= THINKING_PHASES.length - 1) {
          clearInterval(interval);
          return p;
        }
        return p + 1;
      });
    }, 200);
    
    return () => clearInterval(interval);
  }, [isThinking]);

  const handleAnalyze = useCallback((tx: Transaction) => {
    setSelectedTx(tx);
    setVerdict(null);
    setIsThinking(true);
    setThinkingPhase(0);
    
    // Simulate processing delay for UX
    setTimeout(() => {
      const result = runAudit(tx);
      setVerdict(result);
      setIsThinking(false);
    }, THINKING_PHASES.length * 200 + 100);
  }, []);

  // Quick-select a transaction by ID
  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = TRANSACTION_STREAM.find(
      tx => tx.id.toLowerCase().includes(query.toLowerCase()) ||
            tx.vendor.toLowerCase().includes(query.toLowerCase())
    );
    if (found) {
      handleAnalyze(found);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* THE SEARCH BAR */}
      <div className="relative">
        <form onSubmit={handleQuickSearch}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-nexus-noise" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search transaction ID or vendor name..."
              className="w-full h-14 bg-nexus-matter border border-nexus-structure pl-12 pr-32 text-white font-mono placeholder:text-nexus-structure focus:border-nexus-green focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={isThinking}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all",
                "border border-nexus-green text-nexus-green hover:bg-nexus-green hover:text-nexus-void",
                isThinking && "opacity-50 cursor-not-allowed"
              )}
            >
              {isThinking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="w-3 h-3" />
                  Analyze
                </span>
              )}
            </button>
          </div>
        </form>
        
        {/* Sample Transactions Quick Select */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-[10px] font-mono text-nexus-structure uppercase tracking-wider flex-shrink-0">
            Sample Data:
          </span>
          {TRANSACTION_STREAM.slice(0, 4).map((tx) => (
            <button
              key={tx.id}
              onClick={() => handleAnalyze(tx)}
              disabled={isThinking}
              className={cn(
                "px-3 py-1.5 text-[10px] font-mono border transition-all flex-shrink-0",
                selectedTx?.id === tx.id
                  ? "border-nexus-green text-nexus-green bg-nexus-green/5"
                  : "border-nexus-structure text-nexus-noise hover:border-nexus-subtle hover:text-nexus-signal"
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
            className="bg-nexus-matter border border-nexus-structure p-6"
          >
            <div className="flex items-center gap-4">
              <Loader2 className="w-5 h-5 text-nexus-green animate-spin" />
              <div>
                <div className="text-white text-sm font-medium">Processing Transaction</div>
                <motion.div 
                  key={thinkingPhase}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] font-mono text-nexus-green"
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
                    "h-1 flex-1 transition-all duration-200",
                    i <= thinkingPhase ? "bg-nexus-green" : "bg-nexus-structure"
                  )}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* THE VERDICT */}
      <AnimatePresence>
        {verdict && !isThinking && (
          <VerdictCard verdict={verdict} />
        )}
      </AnimatePresence>
      
      {/* Initial State */}
      {!verdict && !isThinking && (
        <div className="bg-nexus-matter/50 border border-dashed border-nexus-structure p-8 text-center">
          <div className="mx-auto mb-4">
            <NexusIcon size="lg" animated />
          </div>
          <div className="text-nexus-signal mb-1">Select a Transaction to Analyze</div>
          <p className="text-[11px] text-nexus-noise max-w-md mx-auto">
            Click any sample transaction above or search by ID/vendor name. 
            The Truth Engine will traverse all regulatory rules and show you the exact logic path.
          </p>
        </div>
      )}
    </div>
  );
};

