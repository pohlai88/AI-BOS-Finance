import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrainCircuit, CheckCircle, ShieldCheck, Zap, XCircle, AlertTriangle, Database, FileText, ArrowRight, X, BarChart3, ScanLine } from 'lucide-react';

// FORENSIC LOG SEQUENCE - Each log tied to specific financial statement modules
const THOUGHT_SEQUENCE = [
  { id: 1, text: "Connecting to ERP Gateway...", highlights: ["ERP Gateway"], type: 'info', moduleUpdate: 'AST' },
  { id: 2, text: "Ingesting 12,847 G/L entries from SAP/Oracle...", highlights: ["12,847", "SAP/Oracle"], type: 'info', moduleUpdate: 'LIA' },
  { id: 3, text: "Normalizing currency: USD/EUR/JPY across entities...", highlights: ["USD", "EUR", "JPY"], type: 'info', moduleUpdate: 'EQU' },
  { id: 4, text: "Scanning RevRec patterns (Q4-2024)...", highlights: ["RevRec", "Q4-2024"], type: 'processing' },
  { id: 5, text: "⚠ DETECTED ANOMALY: Pattern Mismatch in Revenue Recognition", highlights: ["DETECTED ANOMALY"], type: 'warning', moduleUpdate: 'INC_WARN' },
  { id: 6, text: "Hypothesis 1: Intercompany transfer pricing error...", highlights: ["Hypothesis 1"], type: 'processing' },
  { id: 7, text: "Hypothesis 1 REJECTED: Eliminations match (Confidence 99.9%)", highlights: ["REJECTED", "99.9%"], type: 'rejected' },
  { id: 8, text: "Hypothesis 2: Missing ASC 606 contract metadata...", highlights: ["ASC 606"], type: 'processing' },
  { id: 9, text: "Hypothesis 2 CONFIRMED: Contract boundary undefined", highlights: ["CONFIRMED"], type: 'success', moduleUpdate: 'EXP' },
  { id: 10, text: "Tracing $2.4M discrepancy to Ledger #47...", highlights: ["$2.4M", "Ledger #47"], type: 'critical' },
  { id: 11, text: "Root cause identified. Evidence dossier ready.", highlights: ["Evidence dossier"], type: 'success' }
];

export const ReasoningDemo = () => {
  const [phase, setPhase] = useState<'idle' | 'thinking' | 'review_ready'>('idle');
  const [stepIndex, setStepIndex] = useState(0);
  const [view, setView] = useState<'logs' | 'dossier'>('logs');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoTriggerCountdown, setAutoTriggerCountdown] = useState(8);
  const [pauseCountdown, setPauseCountdown] = useState(false);

  // HUD State - Tracks each Financial Statement module
  const [moduleState, setModuleState] = useState({
    AST: 'waiting', 
    LIA: 'waiting', 
    EQU: 'waiting', 
    INC: 'waiting', 
    EXP: 'waiting'
  });

  const handleThink = () => {
    setPhase('thinking');
    setView('logs');
    setStepIndex(0);
    setModuleState({ 
      AST: 'scanning', 
      LIA: 'waiting', 
      EQU: 'waiting', 
      INC: 'waiting', 
      EXP: 'waiting' 
    });
  };

  useEffect(() => {
    if (phase === 'thinking') {
      const interval = setInterval(() => {
        setStepIndex(prev => {
          if (prev >= THOUGHT_SEQUENCE.length - 1) {
            clearInterval(interval);
            setPhase('review_ready');
            return prev;
          }

          const nextStep = prev + 1;
          const currentLog = THOUGHT_SEQUENCE[nextStep];

          // Update HUD modules based on log progression
          if (currentLog.moduleUpdate) {
            updateHud(currentLog.moduleUpdate);
          }

          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }

          return nextStep;
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [phase]);

  const updateHud = (code: string) => {
    setModuleState(prev => {
      const next = { ...prev };
      if (code === 'AST') { next.AST = 'secure'; next.LIA = 'scanning'; }
      if (code === 'LIA') { next.LIA = 'secure'; next.EQU = 'scanning'; }
      if (code === 'EQU') { next.EQU = 'secure'; next.INC = 'scanning'; }
      if (code === 'INC_WARN') { next.INC = 'warning'; }
      if (code === 'EXP') { next.EXP = 'secure'; }
      return next;
    });
  };

  useEffect(() => {
    if (phase === 'idle' && !pauseCountdown) {
      const countdownInterval = setInterval(() => {
        setAutoTriggerCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            handleThink();
            return prev;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [phase, pauseCountdown]);

  return (
    <div className="w-full max-w-5xl mx-auto p-8 font-inter">
      
      {/* HEADER SECTION */}
      <div className="text-center mb-12">
         <h2 className="text-5xl md:text-6xl font-medium tracking-tighter text-white mb-4">
            The <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">Logic Kernel</span>.
         </h2>
         <p className="text-emerald-500/80 font-mono tracking-widest mb-4 uppercase text-xs font-bold">
            // AUTOMATED REASONING ENGINE
         </p>
         <p className="text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            NexusCanon decodes data complexity into audit-ready structure. The law of truth <span className="text-zinc-200 font-bold">dismantles</span> ambiguity and enforces compliance, line by line.
         </p>
      </div>

      {/* TERMINAL CONTAINER */}
      <div className="relative min-h-[600px] flex flex-col font-mono border border-white/10 rounded-xl bg-black overflow-hidden shadow-2xl">
        
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05),transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_4px,3px_100%] pointer-events-none opacity-20" />

        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 relative z-10">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${phase === 'thinking' ? 'bg-emerald-400 animate-ping' : 'bg-zinc-600'}`} />
            <span className="text-xs text-zinc-400 tracking-[0.2em] uppercase font-bold">NexusCanon Audit Core</span>
          </div>
          
          {/* RIGHT SIDE - Icon Button Group + Metadata */}
          <div className="flex items-center gap-6">
            {/* Icon Button Group - DB + Scan */}
            <div className="flex items-center gap-2">
              {/* DB Status Icon */}
              <div className="p-2 border border-zinc-700 rounded bg-zinc-900/50 hover:border-zinc-600 transition-colors">
                <Database className="w-3.5 h-3.5 text-zinc-500" />
              </div>
              
              {/* Scan Trigger Icon Button */}
              <button
                onClick={handleThink}
                disabled={phase === 'thinking'}
                className={`
                  p-2 border rounded transition-all duration-300
                  ${phase === 'thinking' 
                    ? 'bg-zinc-900 border-zinc-800 cursor-not-allowed' 
                    : 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50'
                  }
                `}
                title={phase === 'thinking' ? 'Scanning...' : 'Initiate Scan'}
              >
                {phase === 'thinking' ? (
                  <BrainCircuit className="w-3.5 h-3.5 text-zinc-600 animate-pulse" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </button>
            </div>
            
            {/* Metadata */}
            <div className="flex gap-3 text-xs text-zinc-600 font-mono">
               <span>SEC: COMPLIANT</span>
               <span>v2.4.0</span>
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="p-8 flex-1 flex flex-col relative z-10">
          
          {/* FINANCIAL STATEMENT MODULE HUD - Always Visible */}
          <div className="grid grid-cols-5 gap-2 mb-8 border-b border-white/10 pb-8">
            <ModuleStatus label="ASSETS" state={moduleState.AST} dimmed={view === 'dossier'} />
            <ModuleStatus label="LIABILITIES" state={moduleState.LIA} dimmed={view === 'dossier'} />
            <ModuleStatus label="EQUITY" state={moduleState.EQU} dimmed={view === 'dossier'} />
            
            {/* INCOME Module - Interactive when warning */}
            <div onClick={() => moduleState.INC === 'warning' && setView('dossier')} className={moduleState.INC === 'warning' ? 'cursor-pointer' : ''}>
               <ModuleStatus 
                 label="INCOME" 
                 state={moduleState.INC} 
                 dimmed={false}
                 interactive={moduleState.INC === 'warning'}
               />
            </div>

            <ModuleStatus label="EXPENSES" state={moduleState.EXP} dimmed={view === 'dossier'} />
          </div>

          <AnimatePresence mode="wait">
            
            {/* IDLE STATE */}
            {phase === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center flex-1 text-zinc-600 space-y-6"
              >
                {/* Hexagon + Diamond Logo - Animated */}
                <div className="relative">
                  <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                    {/* Outer Hexagon - Rotating (Properly Centered) */}
                    <motion.path
                      d="M75,34 L90,60 L75,86 L45,86 L30,60 L45,34 Z"
                      stroke="rgba(40, 231, 162, 0.4)"
                      strokeWidth="1.5"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      animate={{ 
                        pathLength: 1
                      }}
                      transition={{
                        pathLength: { duration: 2, ease: "easeInOut" }
                      }}
                    />
                    
                    {/* Rotating Hexagon Animation (separate rotating element) */}
                    <motion.path
                      d="M75,34 L90,60 L75,86 L45,86 L30,60 L45,34 Z"
                      stroke="rgba(40, 231, 162, 0.2)"
                      strokeWidth="1"
                      fill="none"
                      animate={{ 
                        rotate: 360
                      }}
                      transition={{
                        rotate: { duration: 20, repeat: Infinity, ease: "linear" }
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
                        opacity: [0.8, 0.3, 0.8]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </svg>
                  
                  {/* Background Glow */}
                  <div className="absolute inset-0 bg-emerald-500/5 rounded-full blur-2xl -z-10" />
                </div>
                
                {/* DB Icon - Supporting Element */}
                <div className="flex items-center gap-3 opacity-60">
                  <div className="w-px h-8 bg-gradient-to-b from-transparent via-emerald-500/30 to-transparent" />
                  <Database className="w-8 h-8 text-emerald-500/50" />
                  <div className="w-px h-8 bg-gradient-to-b from-transparent via-emerald-500/30 to-transparent" />
                </div>
                
                <p className="tracking-widest text-xs uppercase mb-6">System Ready // Waiting for Ledger Data</p>
                
                {/* Auto-trigger countdown indicator - PROMINENT */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mb-6 px-6 py-3 border border-emerald-500/30 bg-emerald-500/5 rounded text-center"
                >
                  <div className="flex items-center justify-center gap-3 text-emerald-400 font-mono text-xs">
                    <motion.div 
                      className="w-2 h-2 rounded-full bg-emerald-400"
                      animate={{ 
                        scale: [1, 1.3, 1],
                        opacity: [1, 0.5, 1]
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="tracking-widest uppercase">CRYSTALLIZING LEDGER IN</span>
                    <span className="text-base font-bold tabular-nums">{autoTriggerCountdown}s</span>
                  </div>
                </motion.div>
                
                {/* PRIMARY CTA BUTTON - Terminal Style */}
                <motion.button
                  onClick={() => {
                    setAutoTriggerCountdown(8); // Reset countdown when manually triggered
                    handleThink();
                  }}
                  className="group relative px-8 py-3 border border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/60 text-emerald-400 transition-all duration-200 font-mono"
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Top-left corner marker */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-emerald-500/60" />
                  
                  {/* Bottom-right corner marker */}
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-emerald-500/60" />
                  
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-500/60">&gt;</span>
                    <span className="text-xs font-bold tracking-[0.15em] uppercase">
                      Execute Forensic Scan
                    </span>
                    <span className="text-emerald-500/60 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                  
                  {/* Subtle top edge highlight */}
                  <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
                </motion.button>
                
                {/* Manual trigger hint - visible */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-4 text-xs text-zinc-400 font-mono flex items-center gap-2"
                >
                  <div className="h-px w-8 bg-gradient-to-r from-transparent to-zinc-700" />
                  <span>or click above to start immediately</span>
                  <div className="h-px w-8 bg-gradient-to-l from-transparent to-zinc-700" />
                </motion.div>
              </motion.div>
            )}

            {/* THINKING STATE - Log Stream */}
            {(phase === 'thinking' || (phase === 'review_ready' && view === 'logs')) && (
              <motion.div
                key="logs"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                 <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide mask-gradient max-h-[300px]">
                    {THOUGHT_SEQUENCE.slice(0, stepIndex + 1).map((log, i) => (
                      <LogLine key={i} log={log} />
                    ))}
                    {phase === 'thinking' && (
                       <motion.div 
                         animate={{ opacity: [0, 1, 0] }} 
                         transition={{ duration: 0.8, repeat: Infinity }}
                         className="h-4 w-2 bg-emerald-500 mt-2"
                       />
                    )}
                 </div>
                 
                 {/* Progress Indicator */}
                 {phase === 'thinking' && (
                   <div className="mt-4 border-t border-white/10 pt-4">
                      <div className="flex justify-between text-xs text-emerald-500 font-mono mb-1">
                         <span>PROCESSING...</span>
                         <span>{Math.min((stepIndex / THOUGHT_SEQUENCE.length) * 100, 99).toFixed(0)}%</span>
                      </div>
                      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                         <motion.div 
                            className="h-full bg-emerald-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${(stepIndex / THOUGHT_SEQUENCE.length) * 100}%` }}
                         />
                      </div>
                   </div>
                 )}
                 
                 {/* Call to Action - Inspect Evidence Dossier */}
                 {phase === 'review_ready' && view === 'logs' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 border border-amber-500/30 bg-amber-500/10 rounded flex items-center justify-between"
                    >
                       <div className="flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-500" />
                          <div className="text-sm text-amber-500 font-bold">CRITICAL ANOMALY DETECTED IN INCOME LEDGER</div>
                       </div>
                       <button 
                         onClick={() => setView('dossier')}
                         className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded flex items-center gap-2 transition-colors"
                       >
                          INSPECT EVIDENCE DOSSIER <ArrowRight className="w-3 h-3" />
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
                className="flex-1 bg-zinc-900/50 border border-white/10 rounded-lg p-6 relative overflow-hidden"
              >
                 {/* Forensic Grid Background */}
                 <div className="absolute inset-0 bg-[size:20px_20px] bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] pointer-events-none" />

                 {/* Dossier Header */}
                 <div className="flex justify-between items-start mb-8 relative z-10">
                    <div>
                       <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2">EVIDENCE DOSSIER #882-AZ</div>
                       <h2 className="text-2xl text-white font-light leading-relaxed">Root Cause: <span className="text-amber-500 font-mono">ASC 606 Metadata Gap</span></h2>
                    </div>
                    <button onClick={() => setView('logs')} className="text-zinc-500 hover:text-white transition-colors">
                       <X className="w-5 h-5" />
                    </button>
                 </div>

                 {/* Evidence Cards */}
                 <div className="grid grid-cols-3 gap-6 mb-8 relative z-10">
                    <DossierCard 
                      label="SOURCE CONTRACT" 
                      value="AR_2024_Q4" 
                      icon={<FileText className="w-4 h-4 text-emerald-400" />} 
                    />
                    <DossierCard 
                      label="FINANCIAL IMPACT" 
                      value="$2,400,000" 
                      icon={<BarChart3 className="w-4 h-4 text-red-400" />} 
                      highlight 
                    />
                    <DossierCard 
                      label="AFFECTED LEDGERS" 
                      value="47 ENTITIES" 
                      icon={<Database className="w-4 h-4 text-blue-400" />} 
                    />
                 </div>

                 {/* Forensic Code Evidence */}
                 <div className="bg-black/50 border border-white/10 rounded p-4 font-mono text-xs relative z-10 mb-8">
                    <div className="text-zinc-500 mb-2 flex items-center gap-2">
                      <ScanLine className="w-3 h-3" /> METADATA EXTRACTION
                    </div>
                    <div className="space-y-1">
                       <div className="text-zinc-400">01  <span className="text-purple-400">contract_id</span>: &quot;AR_2024_Q4&quot;</div>
                       <div className="text-zinc-400">02  <span className="text-purple-400">revenue_model</span>: &quot;SaaS_Subscription&quot;</div>
                       <div className="bg-red-500/20 text-red-300 px-1 -mx-1">03  <span className="text-red-400">performance_obligation</span>: NULL  {'<--'} ERROR DETECTED</div>
                       <div className="text-zinc-400">04  <span className="text-purple-400">billing_term</span>: &quot;Annual_Upfront&quot;</div>
                    </div>
                 </div>

                 {/* Remediation Footer */}
                 <div className="pt-4 border-t border-white/5 flex justify-between items-center relative z-10">
                    <div className="text-xs text-zinc-500">
                       RECOMMENDATION: <span className="text-emerald-400 font-bold">AUTO-GENERATE SOX CONTROL 44.2</span>
                    </div>
                    <button 
                      onClick={() => {
                        // Phase 1: Return to idle state immediately
                        setView('logs');
                        setPhase('idle');
                        setModuleState({
                          AST: 'waiting',
                          LIA: 'waiting',
                          EQU: 'waiting',
                          INC: 'waiting',
                          EXP: 'waiting'
                        });
                        
                        // Phase 2: Pause countdown to let user see idle state
                        setPauseCountdown(true);
                        setAutoTriggerCountdown(8);
                        
                        // Phase 3: After 3 seconds, resume countdown
                        setTimeout(() => {
                          setPauseCountdown(false);
                        }, 3000);
                      }}
                      className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/50 rounded text-xs tracking-wider transition-all font-bold"
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
  );
};

// --- SUB-COMPONENTS ---

const ModuleStatus = ({ label, state, dimmed, interactive }: { 
  label: string; 
  state: string; 
  dimmed?: boolean; 
  interactive?: boolean; 
}) => {
  let styles = "border-zinc-800 text-zinc-600 bg-zinc-900/30";
  let icon = <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />;

  const opacity = dimmed ? 'opacity-30 blur-[1px]' : 'opacity-100';
  const hover = interactive ? 'hover:scale-105 hover:border-amber-500 cursor-pointer' : '';

  if (state === 'scanning') {
    styles = "border-emerald-500/30 text-emerald-400 bg-emerald-500/10";
    icon = <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />;
  } else if (state === 'secure') {
    styles = "border-emerald-500/50 text-emerald-500 bg-emerald-500/5";
    icon = <CheckCircle className="w-3 h-3" />;
  } else if (state === 'warning') {
    styles = "border-amber-500 text-amber-500 bg-amber-500/10 animate-pulse";
    icon = <AlertTriangle className="w-3 h-3 animate-bounce" />;
  }

  return (
    <div className={`flex flex-col items-center justify-center py-4 rounded border transition-all duration-300 ${styles} ${opacity} ${hover}`}>
      <div className="mb-2">{icon}</div>
      <span className="text-xs tracking-widest">{label}</span>
      {interactive && <span className="mt-1 text-[10px] bg-amber-500 text-black px-1 rounded">INSPECT</span>}
    </div>
  );
};

const DossierCard = ({ label, value, icon, highlight }: { 
  label: string; 
  value: string; 
  icon: React.ReactNode; 
  highlight?: boolean; 
}) => (
   <div className={`p-4 rounded border ${highlight ? 'bg-red-500/5 border-red-500/30' : 'bg-zinc-900 border-zinc-800'}`}>
      <div className="flex items-center gap-2 mb-2 opacity-70">
         {icon}
         <span className="text-xs uppercase tracking-widest text-zinc-400">{label}</span>
      </div>
      <div className={`font-mono ${highlight ? 'text-red-400' : 'text-white'}`}>{value}</div>
   </div>
);

const LogLine = ({ log }: { log: { text: string; type: string; highlights?: string[] } }) => {
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'warning': return "text-amber-400 border-amber-500 bg-amber-500/5";
      case 'critical': return "text-red-400";
      case 'rejected': return "text-zinc-600 line-through opacity-50";
      case 'success': return "text-emerald-400";
      default: return "text-zinc-400";
    }
  };

  const renderText = () => {
    if (!log.highlights) return log.text;
    let parts: (string | JSX.Element)[] = [log.text];
    
    log.highlights.forEach((term, termIndex) => {
      const newParts: (string | JSX.Element)[] = [];
      parts.forEach((part, partIndex) => {
        if (typeof part === 'string' && part.includes(term)) {
          const split = part.split(term);
          for (let i = 0; i < split.length; i++) {
            newParts.push(split[i]);
            if (i < split.length - 1) {
              newParts.push(
                <span 
                  key={`${termIndex}-${partIndex}-${i}`} 
                  className="text-white font-bold bg-white/10 px-1 rounded"
                >
                  {term}
                </span>
              );
            }
          }
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    });
    
    return parts;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      className={`font-mono text-xs py-1 border-l-2 border-transparent pl-3 ${getTypeStyles(log.type)}`}
    >
      <span className="opacity-40 mr-2">&gt;</span>
      {renderText()}
    </motion.div>
  );
};