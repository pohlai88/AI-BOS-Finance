'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Activity, Terminal, Hexagon, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- SCHEMA-DRIVEN DATA (Narrative, not random) ---
const LEGACY_STACK = [
  { id: 'L01', label: 'LEGACY_ERP_CORE', risk: 'HIGH' },
  { id: 'L02', label: 'UNPATCHED_MIDDLEWARE', risk: 'CRITICAL' },
  { id: 'L03', label: 'V1_API_GATEWAY', risk: 'MODERATE' },
  { id: 'L04', label: 'ON_PREM_DATABASE', risk: 'LOW' },
  { id: 'L05', label: 'CUSTOM_GL_SCRIPTS', risk: 'CRITICAL' },
  { id: 'L06', label: 'BATCH_PROCESS_DAEMON', risk: 'HIGH' },
];

const NEXUS_STACK = [
  { id: 'N01', label: 'IMMUTABLE_LEDGER', status: 'LOCKED' },
  { id: 'N02', label: 'SMART_CONTRACT_V2', status: 'ACTIVE' },
  { id: 'N03', label: 'REAL_TIME_AUDIT', status: 'LIVE' },
  { id: 'N04', label: 'ZERO_TRUST_AUTH', status: 'SECURE' },
  { id: 'N05', label: 'AUTO_RECONCILIATION', status: 'OPTIMAL' },
  { id: 'N06', label: 'TAX_COMPLIANCE_BOT', status: 'SYNCED' },
];

export default function StabilitySimulation() {
  const [stage, setStage] = useState(0);
  const [shakeLevel, setShakeLevel] = useState<'none' | 'light' | 'moderate' | 'critical'>('none');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // --- SIMULATION LOOP ---
  useEffect(() => {
    const interval = setInterval(() => {
      setStage((prev) => {
        if (prev >= 7) {
          // Reset Cycle
          setShakeLevel('none');
          setIsCollapsed(false);
          return 0;
        }

        const next = prev + 1;
        // Progressive Decay Logic
        if (next === 4) setShakeLevel('light');
        if (next === 5) setShakeLevel('moderate');
        if (next === 6) {
          setShakeLevel('critical');
          // Trigger Collapse Event
          setTimeout(() => {
            setIsCollapsed(true);
            setShakeLevel('none');
          }, 1500);
        }
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
      {/* 1. FORENSIC HEADER (Terminal Style) */}
      <div className="w-full border-b border-nexus-structure pb-8 mb-16 flex justify-between items-end">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-nexus-green/80">
            <Activity className="w-4 h-4 animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest uppercase">
              Live Simulation // SEQ_ID: {Math.random().toString(36).substring(7).toUpperCase()}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-medium tracking-tighter text-white">
            Structural <span className="text-nexus-noise">Divergence.</span>
          </h2>
        </div>

        <div className="hidden md:flex flex-col items-end gap-2 text-right">
          <div className="text-[10px] font-mono text-nexus-noise tracking-widest uppercase">
            System Integrity Monitor
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-mono text-red-400">LEGACY: {isCollapsed ? 'FAILED' : shakeLevel !== 'none' ? 'DEGRADING' : 'ACTIVE'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-nexus-green" />
              <span className="text-xs font-mono text-nexus-green">NEXUS: OPTIMAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. THE SIMULATION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 w-full relative min-h-[500px]">
        {/* === LEFT: THE DECAY (Monolith) === */}
        <div className="relative flex flex-col justify-end items-center group">
          {/* Background Grid for "Blueprint" feel */}
          <div className="absolute inset-0 border border-nexus-structure/30 bg-[linear-gradient(45deg,transparent_25%,rgba(255,0,0,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:4px_4px]" />

          {/* Terminal Warning Overlay */}
          <AnimatePresence>
            {shakeLevel !== 'none' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-0 left-0 right-0 p-4 border-b border-red-500/20 bg-red-900/10 backdrop-blur-sm z-20 flex justify-between items-center"
              >
                <span className="text-[10px] font-mono text-red-500 animate-pulse">
                  ⚠ WARNING: STRUCTURAL FAILURE IMMINENT
                </span>
                <span className="text-[10px] font-mono text-red-500">ERR_CODE_0x{stage.toString(16).toUpperCase()}F</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* The Stack */}
          <div className="relative w-64 flex flex-col-reverse gap-1 pb-12 z-10 min-h-[350px]">
            {!isCollapsed ? (
              <AnimatePresence mode="popLayout">
                {LEGACY_STACK.slice(0, stage).map((block) => (
                  <LegacyBlock key={block.id} data={block} shakeLevel={shakeLevel} />
                ))}
              </AnimatePresence>
            ) : (
              <CollapsedRubble />
            )}
          </div>

          {/* Floor Label */}
          <div className="absolute bottom-0 w-full text-center border-t border-nexus-structure pt-3">
            <span className="text-[10px] font-mono tracking-[0.2em] text-nexus-noise uppercase">
              Monolithic Architecture (v1.0)
            </span>
          </div>
        </div>

        {/* === RIGHT: THE SOLID SHIELD (Nexus) === */}
        <div className="relative flex flex-col justify-end items-center">
          {/* 1. Hexagonal Force Field Background */}
          <div 
            className="absolute inset-0 border border-nexus-structure/30 overflow-hidden transition-all duration-1000"
            style={{
              background: `radial-gradient(circle at bottom center, rgba(40, 231, 162, ${stage * 0.05}) 0%, transparent 70%)`
            }}
          >
            <HexGridBackground stage={stage} />
          </div>

          {/* 2. The Solid Protection Stack */}
          <motion.div 
            className="relative w-72 pb-12 z-10 flex flex-col-reverse min-h-[350px]"
            animate={{
              filter: `drop-shadow(0 0 ${stage * 4}px rgba(40, 231, 162, ${stage * 0.1}))`
            }}
          >
            {/* The Vertical Spine */}
            <motion.div 
              className="absolute left-1/2 bottom-12 w-[2px] bg-gradient-to-t from-nexus-green/50 to-transparent -translate-x-1/2 z-0"
              initial={{ height: 0 }}
              animate={{ height: `${Math.min(stage * 16.6, 100)}%` }} 
            />

            <AnimatePresence mode="popLayout">
              {NEXUS_STACK.slice(0, stage).map((block, index) => (
                <NexusSolidBlock 
                  key={block.id} 
                  data={block} 
                  index={index}
                />
              ))}
            </AnimatePresence>

            {/* The Base Foundation */}
            <motion.div 
              className="absolute bottom-10 left-0 right-0 h-1 bg-nexus-green/50 blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: stage > 0 ? 1 : 0 }}
            />

            {/* Shield Active Indicator */}
            <AnimatePresence>
              {stage >= NEXUS_STACK.length && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-nexus-green/10 border border-nexus-green/50 text-nexus-green text-[9px] font-mono tracking-widest uppercase"
                >
                  SHIELD ACTIVE
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Floor Label */}
          <div className="absolute bottom-0 w-full text-center border-t border-nexus-structure pt-3">
            <span className="text-[10px] font-mono tracking-[0.2em] text-nexus-green/70 uppercase">
              Hexagonal Shield (v2.0)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// === SUB COMPONENTS ===

const LegacyBlock = ({ data, shakeLevel }: { data: { id: string; label: string; risk: string }; shakeLevel: string }) => {
  const isShaking = shakeLevel !== 'none';
  const shakeIntensity = shakeLevel === 'critical' ? 15 : shakeLevel === 'moderate' ? 5 : 2;

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{
        y: 0,
        opacity: 1,
        x: isShaking ? [-shakeIntensity, shakeIntensity, -shakeIntensity] : 0,
        rotate: isShaking ? [-1, 1, -1] : 0,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        y: { type: 'spring', stiffness: 200 },
        x: { repeat: isShaking ? Infinity : 0, duration: 0.1 },
      }}
      className={cn(
        'w-full h-14 flex items-center justify-between px-4 border',
        'bg-[#111] border-[#333] text-nexus-noise',
        isShaking && 'border-red-500/50 text-red-400 bg-red-950/10',
      )}
    >
      <div className="flex items-center gap-3">
        <Terminal className="w-3 h-3 opacity-50" />
        <span className="text-[10px] font-mono tracking-wider">{data.label}</span>
      </div>
      {isShaking && <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse" />}
    </motion.div>
  );
};

const NexusSolidBlock = ({ data, index }: { data: { id: string; label: string; status: string }; index: number }) => {
  const isBottomBlock = index === 0;
  
  return (
    <motion.div
      layout
      initial={{ y: -50, opacity: 0, scale: 0.8 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 200, delay: index * 0.05 }}
      className={cn(
        'relative w-full h-14 flex items-center justify-between px-6',
        'bg-[#0a0f0d]',
        'border-x-2 border-t-2 border-nexus-green/40',
        isBottomBlock && 'border-b-2',
        'shadow-[inset_0_0_20px_rgba(40,231,162,0.05)]'
      )}
      style={{ zIndex: 10 - index }}
    >
      {/* Hex Connection Node */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#0a0f0d] border border-nexus-green flex items-center justify-center rotate-45 z-20">
        <div className="w-1.5 h-1.5 bg-nexus-green" />
      </div>

      <div className="flex items-center gap-4">
        <Hexagon className="w-4 h-4 text-nexus-green fill-nexus-green/20" />
        <span className="text-[10px] font-bold tracking-wider text-white">{data.label}</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-1 w-12 bg-nexus-green/10 overflow-hidden rounded-full">
          <motion.div 
            className="h-full bg-nexus-green"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
          />
        </div>
        <Lock className="w-3 h-3 text-nexus-green" />
      </div>
      
      {/* Side Glow Bars */}
      <div className="absolute inset-y-0 left-0 w-[2px] bg-nexus-green/50 shadow-[0_0_10px_rgba(40,231,162,0.5)]" />
      <div className="absolute inset-y-0 right-0 w-[2px] bg-nexus-green/50 shadow-[0_0_10px_rgba(40,231,162,0.5)]" />
    </motion.div>
  );
};

const HexGridBackground = ({ stage }: { stage: number }) => {
  return (
    <div 
      className="w-full h-full opacity-30 pointer-events-none" 
      style={{ 
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='40' viewBox='0 0 24 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40c5.523 0 10-4.477 10-10V10c0-5.523-4.477-10-10-10s-10 4.477-10 10v20c0 5.523 4.477 10 10 10z' fill='none' stroke='%2328E7A2' stroke-width='1' opacity='0.3'/%3E%3C/svg%3E")`,
        maskImage: `linear-gradient(to top, rgba(0,0,0,1) ${stage * 15}%, transparent 100%)`,
        WebkitMaskImage: `linear-gradient(to top, rgba(0,0,0,1) ${stage * 15}%, transparent 100%)`,
      }} 
    />
  );
};

const CollapsedRubble = () => {
  return (
    <motion.div 
      className="relative w-full h-32 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 1.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-2"
      >
        <div className="inline-block px-3 py-1 border border-red-500/50 bg-red-950/30 text-red-500 text-[10px] font-mono tracking-widest uppercase">
          SYSTEM FAILURE DETECTED
        </div>
        <p className="text-[10px] text-nexus-noise font-mono">Rebooting legacy kernel...</p>
      </motion.div>
    </motion.div>
  );
};
