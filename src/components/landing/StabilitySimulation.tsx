'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Terminal, Lock, Hexagon, ShieldCheck, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- DATA ---
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

  useEffect(() => {
    const interval = setInterval(() => {
      setStage((prev) => {
        if (prev >= 7) {
          setShakeLevel('none');
          setIsCollapsed(false);
          return 0;
        }
        const next = prev + 1;
        if (next === 4) setShakeLevel('light');
        if (next === 5) setShakeLevel('moderate');
        if (next === 6) {
          setShakeLevel('critical');
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
      {/* HEADER */}
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
              <span className="text-xs font-mono text-red-400">
                LEGACY: {isCollapsed ? 'FAILED' : shakeLevel !== 'none' ? 'DEGRADING' : 'ACTIVE'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-nexus-green" />
              <span className="text-xs font-mono text-nexus-green">NEXUS: OPTIMAL</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 w-full relative min-h-[600px]">
        
        {/* === LEFT: THE DECAY === */}
        <div className="relative flex flex-col justify-end items-center group">
          <div className="absolute inset-0 border border-nexus-structure/30 bg-[linear-gradient(45deg,transparent_25%,rgba(255,0,0,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:4px_4px]" />
          
          {/* Warning Overlay */}
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
                <span className="text-[10px] font-mono text-red-500">
                  ERR_CODE_0x{stage.toString(16).toUpperCase()}F
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="relative w-64 flex flex-col-reverse gap-1 pb-12 z-10 min-h-[400px]">
            {!isCollapsed ? (
              <AnimatePresence mode='popLayout'>
                {LEGACY_STACK.slice(0, stage).map((block) => (
                  <LegacyBlock key={block.id} data={block} shakeLevel={shakeLevel} />
                ))}
              </AnimatePresence>
            ) : (
              <CollapsedRubble />
            )}
          </div>
          
          <div className="absolute bottom-0 w-full text-center border-t border-nexus-structure pt-3">
            <span className="text-[10px] font-mono tracking-[0.2em] text-nexus-noise uppercase">
              Monolithic Architecture (v1.0)
            </span>
          </div>
        </div>

        {/* === RIGHT: THE NEXUS SPINE === */}
        <div className="relative flex flex-col justify-end items-center">
          
          {/* Clean Background (No blurry noise) */}
          <div className="absolute inset-0 bg-[#050a07] border border-white/5 overflow-hidden">
            {/* Subtle Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:2rem_2rem]" />
          </div>

          {/* The Solid Vertebrae Stack */}
          <div className="relative w-72 pb-12 z-10 flex flex-col-reverse min-h-[400px]">
            
            {/* The Central Spine */}
            <div className="absolute left-1/2 bottom-12 top-0 w-[1px] bg-nexus-green/10 -translate-x-1/2 z-0" />

            <AnimatePresence mode='popLayout'>
              {NEXUS_STACK.slice(0, stage).map((block, index) => (
                <NexusVertebraBlock 
                  key={block.id} 
                  data={block} 
                  index={index}
                  isNew={index === stage - 1}
                />
              ))}
            </AnimatePresence>

            {/* Baseplate */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-1 bg-nexus-green shadow-[0_0_20px_rgba(40,231,162,0.5)] rounded-full" />

            {/* Shield Active Badge */}
            <AnimatePresence>
              {stage >= NEXUS_STACK.length && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-nexus-green/10 border border-nexus-green text-nexus-green text-[9px] font-mono tracking-widest uppercase flex items-center gap-2"
                >
                  <ShieldCheck className="w-3 h-3" />
                  SHIELD ACTIVE
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="absolute bottom-0 w-full text-center border-t border-nexus-green/20 pt-3">
            <span className="text-[10px] font-mono tracking-[0.2em] text-nexus-green uppercase flex items-center justify-center gap-2">
              <ShieldCheck className="w-3 h-3" />
              Nexus Vertebrae (v2.0)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// === COMPONENT PRIMITIVES ===

const LegacyBlock = ({ data, shakeLevel }: { data: { id: string; label: string; risk: string }; shakeLevel: string }) => {
  const isShaking = shakeLevel !== 'none';
  const shakeIntensity = shakeLevel === 'critical' ? 15 : shakeLevel === 'moderate' ? 5 : 2;

  return (
    <motion.div
      layout
      initial={{ y: -50, opacity: 0 }}
      animate={{
        y: 0, opacity: 1,
        x: isShaking ? [-shakeIntensity, shakeIntensity, -shakeIntensity] : 0,
        rotate: isShaking ? [-1, 1, -1] : 0,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ 
        y: { type: 'spring', stiffness: 200 },
        x: { repeat: isShaking ? Infinity : 0, duration: 0.1 }
      }}
      className={cn(
        'w-full h-14 flex items-center justify-between px-4 border mb-1 bg-[#111] border-[#333] text-nexus-noise',
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

// --- THE NEXUS VERTEBRA BLOCK (V3 - Heavy Physics) ---
const NexusVertebraBlock = ({ data, index, isNew }: { 
  data: { id: string; label: string; status: string }; 
  index: number; 
  isNew: boolean 
}) => {
  return (
    <motion.div
      layout
      // PHYSICS: Drop from sky (-400px) with heavy damping for "Thud" feel
      initial={{ y: -400, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ 
        type: "spring", 
        stiffness: 200, 
        damping: 20, 
        mass: 1.5 
      }}
      className="relative z-10"
      style={{ zIndex: index }}
    >
      {/* The Block Itself (Armor Plate) */}
      <div className={cn(
        "relative h-14 w-full flex items-center justify-between px-6 transition-colors duration-500",
        // Visual Logic: New blocks are bright, older blocks harden into dark armor
        isNew ? "bg-[#0f1f15] border-nexus-green" : "bg-[#050a07] border-nexus-green/30",
        "border-x border-t",
        index === 0 && "border-b" // Only bottom block has bottom border
      )}>
        
        {/* Left Indicator */}
        <div className="flex items-center gap-4">
          <Hexagon className={cn(
            "w-3 h-3 transition-colors duration-500",
            isNew ? "text-nexus-green fill-nexus-green" : "text-nexus-green/40 fill-transparent"
          )} />
          <span className={cn(
            "text-[10px] font-bold tracking-wider transition-colors duration-500",
            isNew ? "text-white" : "text-white/60"
          )}>
            {data.label}
          </span>
        </div>

        {/* Right Status */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-nexus-green/60">{data.status}</span>
          <Lock className={cn(
            "w-3 h-3 transition-colors duration-500",
            isNew ? "text-nexus-green animate-pulse" : "text-nexus-green/40"
          )} />
        </div>

        {/* The Spine Connector (Through the block) */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-nexus-green/10 -translate-x-1/2">
          {/* Active Energy Pulse */}
          {isNew && (
            <motion.div 
              className="w-full bg-nexus-green"
              initial={{ height: 0 }}
              animate={{ height: '100%' }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          )}
        </div>

        {/* The Interlock Node (Diamond connector) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-[#050a07] border border-nexus-green rotate-45 z-20 flex items-center justify-center">
          <div className={cn(
            "w-1 h-1 bg-nexus-green rounded-full transition-all duration-500",
            isNew ? "opacity-100 shadow-[0_0_5px_#28E7A2]" : "opacity-40"
          )} />
        </div>
      </div>
      
      {/* Side Shielding */}
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-r from-nexus-green/20 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-l from-nexus-green/20 to-transparent" />
    </motion.div>
  );
};

const CollapsedRubble = () => (
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
