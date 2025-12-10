'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, ShieldCheck, Activity, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils'; // Ensure you have a class merger

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
              <span className="text-xs font-mono text-red-400">LEGACY: DEGRADING</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-nexus-green" />
              <span className="text-xs font-mono text-nexus-green">NEXUS: OPTIMAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. THE SIMULATION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 w-full relative min-h-[500px]">
        {/* === LEFT: THE DECAY (Monolith) === */}
        <div className="relative flex flex-col justify-end items-center group">
          {/* Background Grid for "Blueprint" feel */}
          <div className="absolute inset-0 border border-nexus-structure/30 bg-[linear-gradient(45deg,transparent_25%,rgba(255,0,0,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:4px_4px]" />

          {/* Terminal Warning Overlay */}
          <AnimatePresence>
            {shakeLevel !== 'none' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-0 left-0 right-0 p-4 border-b border-red-500/20 bg-red-900/10 backdrop-blur-sm z-20 flex justify-between items-center"
              >
                <span className="text-[10px] font-mono text-red-500 animate-pulse">
                  ⚠ WARNING: STRUCTURAL FAILURE IMMINENT
                </span>
                <span className="text-[10px] font-mono text-red-500">ERR_CODE_0x{stage}F</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* The Stack */}
          <div className="relative w-64 flex flex-col-reverse gap-1 pb-12 z-10">
            {!isCollapsed ? (
              <AnimatePresence>
                {LEGACY_STACK.slice(0, stage).map((block, i) => (
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

        {/* === RIGHT: THE CRYSTAL (Nexus) === */}
        <div className="relative flex flex-col justify-end items-center">
          {/* Background Grid */}
          <div className="absolute inset-0 border border-nexus-structure/30 bg-[linear-gradient(45deg,transparent_25%,rgba(40,231,162,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:4px_4px]" />

          {/* The Stack */}
          <div className="relative w-64 flex flex-col-reverse gap-1 pb-12 z-10">
            <AnimatePresence>
              {NEXUS_STACK.slice(0, stage).map((block, i) => (
                <NexusBlock key={block.id} data={block} />
              ))}
            </AnimatePresence>

            {/* Scan Beam */}
            <motion.div
              className="absolute top-0 left-[-20%] right-[-20%] h-[1px] bg-gradient-to-r from-transparent via-nexus-green/50 to-transparent"
              animate={{ top: ['100%', '0%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          {/* Floor Label */}
          <div className="absolute bottom-0 w-full text-center border-t border-nexus-structure pt-3">
            <span className="text-[10px] font-mono tracking-[0.2em] text-nexus-green/70 uppercase">
              Hexagonal Architecture (v2.0)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// === SUB COMPONENTS ===

const LegacyBlock = ({ data, shakeLevel }: { data: any; shakeLevel: string }) => {
  // Brutal physics for the shake
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
      transition={{
        y: { type: 'spring', stiffness: 200 },
        x: { repeat: isShaking ? Infinity : 0, duration: 0.1 },
      }}
      className={cn(
        'w-full h-14 flex items-center justify-between px-4 border',
        // The "Rust" aesthetic
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

const NexusBlock = ({ data }: { data: any }) => {
  return (
    <motion.div
      initial={{ y: -50, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      className={cn(
        'w-full h-14 flex items-center justify-between px-4',
        // The "Glass/Crystal" aesthetic
        'bg-nexus-matter/50 border border-nexus-green/20 backdrop-blur-sm',
        'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]',
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 bg-nexus-green rounded-full shadow-[0_0_8px_rgba(40,231,162,0.8)]" />
        <span className="text-[10px] font-mono tracking-wider text-white">{data.label}</span>
      </div>
      <div className="text-[9px] font-mono text-nexus-green/60 uppercase border border-nexus-green/20 px-1.5 py-0.5 rounded-sm">
        {data.status}
      </div>
    </motion.div>
  );
};

const CollapsedRubble = () => {
  // "Digital Fragmentation" instead of cartoony blocks
  return (
    <div className="relative w-full h-32 flex items-center justify-center">
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
    </div>
  );
};
