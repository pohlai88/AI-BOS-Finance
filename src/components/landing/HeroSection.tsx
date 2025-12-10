// ============================================================================
// HERO SECTION - "The Command Center"
// Left: The Pitch | Right: The Brain Visualization (Radar + Terminal Stack)
// Wired to Truth Engine via useRiskTelemetry hook
// ============================================================================

import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Shield, Lock, Database, Terminal, Activity } from 'lucide-react';
import { NexusButton } from '@/components/nexus/NexusButton';
import { useRiskTelemetry, type TelemetryEvent, type Severity } from '@/hooks/useRiskTelemetry';

// --- SEVERITY COLOR MAP ---
const severityColors: Record<Severity, { text: string; bg: string; border: string }> = {
  low: { text: 'text-nexus-green', bg: 'bg-nexus-green', border: 'border-nexus-green' },
  medium: { text: 'text-yellow-400', bg: 'bg-yellow-400', border: 'border-yellow-400' },
  high: { text: 'text-orange-400', bg: 'bg-orange-400', border: 'border-orange-400' },
  critical: { text: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500' },
};

// --- SUB-COMPONENT: THE RADAR ---
const RiskRadar = ({ activeRisks, systemStatus }: { activeRisks: number; systemStatus: string }) => (
  <div className="relative w-full aspect-square max-h-[380px] mx-auto border border-nexus-structure bg-nexus-void p-4 overflow-hidden">
    {/* Header */}
    <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
      <motion.div
        className="w-2 h-2 rounded-full bg-nexus-green"
        animate={{ opacity: systemStatus === 'ALERT' ? [1, 0.3, 1] : [1, 0.5, 1] }}
        transition={{ duration: systemStatus === 'ALERT' ? 0.3 : 2, repeat: Infinity }}
      />
      <span className="text-[9px] font-mono text-nexus-green uppercase tracking-widest">
        {systemStatus === 'ALERT' ? 'THREAT DETECTED' : 'SCANNING'}
      </span>
    </div>

    <svg viewBox="0 0 400 400" className="w-full h-full relative z-10">
      {/* GRID RINGS */}
      <g>
        {[60, 100, 140, 180].map((radius, i) => (
          <motion.circle
            key={`ring-${i}`}
            cx="200" cy="200" r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        ))}
        {/* Crosshairs */}
        <line x1="200" y1="20" x2="200" y2="380" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <line x1="20" y1="200" x2="380" y2="200" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        {/* Diagonal lines */}
        <line x1="60" y1="60" x2="340" y2="340" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="340" y1="60" x2="60" y2="340" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      </g>

      {/* OUTER DECODER RING */}
      <motion.circle
        cx="200" cy="200" r="190"
        fill="none"
        stroke="rgba(40, 231, 162, 0.2)"
        strokeWidth="2"
        strokeDasharray="2, 8, 15, 8"
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: '200px 200px' }}
      />

      {/* SCANNING BEAM */}
      <motion.path
        d="M200,200 L200,20 A180,180 0 0,1 327,73 Z"
        fill="url(#scanBeamGradient)"
        opacity="0.6"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: '200px 200px' }}
      />
      
      <defs>
        <radialGradient id="scanBeamGradient">
          <stop offset="0%" stopColor="rgba(40, 231, 162, 0.4)" />
          <stop offset="100%" stopColor="rgba(40, 231, 162, 0)" />
        </radialGradient>
      </defs>

      {/* QUADRANT LABELS */}
      {[
        { angle: 0, label: 'IFRS', x: 360, y: 200 },
        { angle: 90, label: 'SOX', x: 200, y: 380 },
        { angle: 180, label: 'COSO', x: 40, y: 200 },
        { angle: 270, label: 'TAX', x: 200, y: 30 },
      ].map((q, i) => (
        <text
          key={i}
          x={q.x}
          y={q.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(40, 231, 162, 0.6)"
          fontSize="11"
          fontWeight="600"
          letterSpacing="2"
          fontFamily="monospace"
        >
          {q.label}
        </text>
      ))}

      {/* STATIC RISK BLIPS */}
      {[
        { angle: 35, radius: 120, sev: 'medium' as Severity },
        { angle: 110, radius: 90, sev: 'high' as Severity },
        { angle: 200, radius: 150, sev: 'low' as Severity },
        { angle: 290, radius: 100, sev: 'critical' as Severity },
      ].map((blip, i) => {
        const rad = (blip.angle * Math.PI) / 180;
        const x = 200 + Math.cos(rad) * blip.radius;
        const y = 200 + Math.sin(rad) * blip.radius;
        const color = severityColors[blip.sev];
        
        return (
          <g key={i}>
            <motion.circle
              cx={x} cy={y} r="6"
              className={color.bg}
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            />
            {blip.sev === 'critical' && (
              <motion.circle
                cx={x} cy={y} r="6"
                fill="none"
                stroke="rgba(239, 68, 68, 0.8)"
                strokeWidth="2"
                animate={{ r: [6, 18], opacity: [1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </g>
        );
      })}

      {/* CENTER CORE */}
      <g transform="translate(200, 200)">
        <circle r="45" fill="#0a0a0a" stroke="rgba(40, 231, 162, 0.4)" strokeWidth="1.5" />
        <circle r="38" fill="none" stroke="rgba(40, 231, 162, 0.15)" strokeWidth="1" strokeDasharray="3,3" />
        
        <text y="-8" textAnchor="middle" fill="rgba(40, 231, 162, 0.7)" fontSize="8" letterSpacing="2" fontFamily="monospace">
          MCP CORE
        </text>
        <text y="10" textAnchor="middle" fill="white" fontSize="28" fontWeight="700" fontFamily="monospace">
          {activeRisks}
        </text>
        <text y="26" textAnchor="middle" fill="rgba(40, 231, 162, 0.8)" fontSize="8" letterSpacing="1" fontFamily="monospace">
          THREATS
        </text>
      </g>
    </svg>

    {/* Bottom Label */}
    <div className="absolute bottom-2 left-0 right-0 text-center">
      <span className="text-[8px] font-mono text-nexus-noise uppercase tracking-widest">
        NexusCanon Risk Telemetry Grid
      </span>
    </div>
  </div>
);

// --- SUB-COMPONENT: THE TERMINAL ---
const RiskTerminal = ({ events }: { events: TelemetryEvent[] }) => (
  <div className="border-x border-b border-nexus-structure bg-[#050505] p-4 h-[180px] overflow-hidden flex flex-col font-mono text-[11px]">
    {/* Header */}
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-nexus-structure">
      <div className="flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-red-500/80" />
        <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
        <div className="w-2 h-2 rounded-full bg-green-500/80" />
      </div>
      <Terminal className="w-3 h-3 text-nexus-noise ml-2" />
      <span className="text-nexus-noise uppercase tracking-widest text-[9px]">system.log</span>
    </div>
    
    {/* Event Feed */}
    <div className="flex-1 overflow-hidden relative">
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
            <span className="text-nexus-structure min-w-[60px]">{event.time}</span>
            <span className={`font-bold min-w-[70px] ${severityColors[event.severity].text}`}>
              [{event.severity.toUpperCase()}]
            </span>
            <span className="text-nexus-signal truncate flex-1">{event.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Scanline overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[size:100%_4px] pointer-events-none opacity-30" />
    </div>
    
    {/* Footer */}
    <div className="flex items-center gap-2 pt-2 border-t border-nexus-structure mt-auto">
      <motion.div
        className="w-1.5 h-1.5 rounded-full bg-nexus-green"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <span className="text-[9px] text-nexus-noise uppercase tracking-widest">Live monitoring active</span>
    </div>
  </div>
);

// --- MAIN HERO SECTION ---
export const HeroSection = ({ onGetStarted }: { onGetStarted: () => void }) => {
  const { events, activeRisks, systemStatus } = useRiskTelemetry();

  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center px-6 md:px-12 border-b border-nexus-structure overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
      
      {/* Metadata Decoration */}
      <div className="absolute top-32 left-8 hidden lg:block">
        <motion.div 
          className="w-[1px] h-20 bg-gradient-to-b from-nexus-green to-transparent"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ transformOrigin: 'top' }}
        />
        <motion.p 
          className="mt-3 font-mono text-[9px] text-nexus-noise tracking-widest -rotate-90 origin-top-left translate-y-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          SYS_INIT // v2.4.1
        </motion.p>
      </div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 py-12 lg:py-0">
        
        {/* LEFT COLUMN: THE PITCH */}
        <motion.div 
          className="lg:col-span-7 space-y-6 z-10 flex flex-col justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Micro-Label */}
          <div className="flex items-center gap-3">
            <div className="h-[1px] w-8 bg-nexus-green" />
            <span className="text-nexus-green font-mono text-[11px] tracking-widest uppercase">
              Immutable Ledger Control
            </span>
          </div>

          {/* Headline */}
          <motion.h1 
            className="text-6xl md:text-8xl lg:text-9xl font-medium tracking-tighter leading-[0.9] text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Trust is <br />
            <span className="text-zinc-400">Mathematical.</span>
          </motion.h1>

          {/* Subhead */}
          <motion.p 
            className="text-lg md:text-xl text-nexus-noise max-w-xl leading-relaxed border-l border-nexus-structure pl-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Eliminate retroactive data drift. NexusCanon cryptographically freezes your financial
            state, rendering audits instantaneous and irrefutable.
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
            <NexusButton variant="secondary" size="lg" icon={<ArrowRight className="w-4 h-4" />}>
              Enter the Canon
            </NexusButton>
          </motion.div>
          
          {/* Metrics */}
          <motion.div 
            className="flex gap-6 lg:gap-8 pt-6 border-t border-nexus-structure"
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
                <m.icon className="w-4 h-4 text-nexus-green/50" />
                <div>
                  <div className="text-[9px] font-mono text-nexus-structure uppercase tracking-widest">{m.label}</div>
                  <div className="text-sm text-nexus-signal font-mono">{m.value}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* RIGHT COLUMN: THE BRAIN VISUALIZATION */}
        <motion.div 
          className="lg:col-span-5 relative"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* THE STACK: Radar + Terminal */}
          <div className="flex flex-col shadow-2xl shadow-nexus-green/5">
            <RiskRadar activeRisks={activeRisks} systemStatus={systemStatus} />
            <RiskTerminal events={events} />
          </div>
          
          {/* Decorative Glow */}
          <div className="absolute -inset-8 bg-nexus-green/5 blur-3xl -z-10 rounded-full opacity-50" />
        </motion.div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-nexus-void to-transparent" />
    </section>
  );
};
