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

  // Calculate reactor progress
  const clampedStage = Math.max(0, Math.min(stage, NEXUS_STACK.length));
  const progress = NEXUS_STACK.length === 0 ? 0 : clampedStage / NEXUS_STACK.length;
  const isComplete = progress >= 1;

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

        {/* === RIGHT: THE CRYSTALLINE REACTOR === */}
        <div className="relative flex flex-col justify-end items-center">
          
          {/* Environment: Deep Void with floor reflection */}
          <div className="absolute inset-0 bg-[#020403] border border-white/5 overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-nexus-green/5 to-transparent" />
          </div>

          {/* The Exoskeleton (Hexagonal Shield Layer) */}
          <HexShield progress={progress} />

          {/* The Crystalline Stack */}
          <div className="relative w-72 pb-12 z-10 flex flex-col-reverse min-h-[400px]">
            
            {/* The Spine: Solid rod */}
            <div className="absolute left-1/2 bottom-12 top-0 w-1.5 bg-[#0f1f15] border-x border-nexus-green/20 -translate-x-1/2 z-0" />

            <AnimatePresence mode="popLayout">
              {NEXUS_STACK.slice(0, clampedStage).map((block, index) => (
                <NexusCrystalBlock 
                  key={block.id} 
                  data={block}
                  index={index}
                  isNew={index === clampedStage - 1}
                />
              ))}
            </AnimatePresence>

            {/* Impact Baseplate */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
              <div className="w-56 h-2 bg-nexus-green shadow-[0_0_30px_rgba(40,231,162,0.4)] rounded-full" />
              <ShockwaveTrigger trigger={clampedStage} />
            </div>

            {/* Shield Badge */}
            <AnimatePresence>
              {isComplete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute -top-12 left-1/2 -translate-x-1/2"
                >
                  <div className="px-4 py-1.5 bg-[#050a07] border border-nexus-green shadow-[0_0_15px_rgba(40,231,162,0.3)] flex items-center gap-2 rounded-sm">
                    <ShieldCheck className="w-3 h-3 text-nexus-green fill-nexus-green" />
                    <span className="text-[10px] font-mono tracking-widest text-white uppercase">Fortress Secured</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="absolute bottom-0 w-full text-center border-t border-nexus-green/20 pt-3">
            <span className="text-[10px] font-mono tracking-[0.2em] text-nexus-green uppercase flex items-center justify-center gap-2">
              <Hexagon className="w-3 h-3" />
              Crystalline Reactor (v4.0)
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

// --- THE CRYSTAL BLOCK (V4 - Physical Matter) ---
const NexusCrystalBlock = ({ data, index, isNew }: { 
  data: { id: string; label: string; status: string }; 
  index: number; 
  isNew: boolean 
}) => {
  return (
    <motion.div
      layout
      initial={{ y: -400, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 40,
        mass: 2
      }}
      className="relative z-10"
      style={{ zIndex: index }}
    >
      <div className={cn(
        "relative h-14 w-full flex items-center justify-between px-6 overflow-hidden transition-all duration-700",
        "bg-[#030805]",
        "border-t border-t-white/10 border-b border-b-black/80",
        "border-x border-x-nexus-green/20",
        isNew ? "shadow-[inset_0_0_30px_rgba(40,231,162,0.1)]" : "shadow-none"
      )}>
        
        {/* TEXTURE: Noise Overlay */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
          }} 
        />

        <div className="relative z-10 flex items-center gap-4">
          <div className={cn(
            "w-2 h-2 rotate-45 transition-colors duration-1000",
            isNew ? "bg-white shadow-[0_0_10px_white]" : "bg-nexus-green"
          )} />
          <span className={cn(
            "text-[10px] font-bold tracking-wider transition-colors duration-1000",
            isNew ? "text-white" : "text-nexus-green/80"
          )}>
            {data.label}
          </span>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <span className="text-[9px] font-mono text-nexus-green/40">{data.status}</span>
          <Lock className="w-3 h-3 text-nexus-green/60" />
        </div>
      </div>
      
      <div className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-32 h-[2px] bg-[#030805] z-20" />
    </motion.div>
  );
};

// --- SHOCKWAVE EFFECT ---
const ShockwaveTrigger = ({ trigger }: { trigger: number }) => {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none flex items-center justify-center">
      <motion.div
        key={trigger}
        className="w-40 h-2 rounded-full border border-nexus-green/50"
        initial={{ scale: 0.8, opacity: 1, borderWidth: 2 }}
        animate={{ scale: 2.5, opacity: 0, borderWidth: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <motion.div
        key={`glow-${trigger}`}
        className="absolute w-full h-4 bg-nexus-green/30 blur-xl"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
};

// --- THE HEXAGONAL SHIELD (Exoskeleton) ---
const HexShield = ({ progress }: { progress: number }) => {
  const clamped = Math.max(0, Math.min(progress, 1));

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-5">
      <motion.div 
        className="relative w-96 h-96"
        initial={false}
        animate={{ 
          scale: 0.9 + (clamped * 0.1),
          opacity: clamped > 0 ? 1 : 0 
        }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* 1. The Hexagon Frame */}
        <div 
          className="absolute inset-0 border border-nexus-green/20"
          style={{ 
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
          }} 
        />
        
        {/* 2. The Inner Pulse Field (Breathing) */}
        <motion.div 
          className="absolute inset-4 border border-nexus-green/30 bg-nexus-green/5"
          style={{ 
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
          }}
          animate={{
            opacity: clamped > 0 ? [0.1, 0.3, 0.1] : 0
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* 3. The Tension Cables */}
        <TensionLines progress={clamped} />

        {/* 4. Corner Nodes */}
        <HexNodes progress={clamped} />
      </motion.div>
    </div>
  );
};

// --- TENSION LINES ---
const TensionLines = ({ progress }: { progress: number }) => {
  const strength = progress === 0 ? 0 : 0.2 + (progress * 0.8);

  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 w-[1px] h-[50%] bg-gradient-to-b from-transparent via-nexus-green to-transparent origin-bottom"
          style={{
            transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-50%)`,
          }}
          initial={{ scaleY: 0.5, opacity: 0 }}
          animate={{ 
            scaleY: 0.8 + (progress * 0.2),
            opacity: strength 
          }}
          transition={{ duration: 0.6, delay: i * 0.05 }}
        />
      ))}
    </>
  );
};

// --- HEX NODES ---
const HexNodes = ({ progress }: { progress: number }) => {
  const nodeOpacity = progress === 0 ? 0 : 0.3 + (progress * 0.7);
  
  const nodePositions = [
    { x: '50%', y: '0%' },
    { x: '100%', y: '25%' },
    { x: '100%', y: '75%' },
    { x: '50%', y: '100%' },
    { x: '0%', y: '75%' },
    { x: '0%', y: '25%' },
  ];

  return (
    <>
      {nodePositions.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2"
          style={{ left: pos.x, top: pos.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: nodeOpacity,
            scale: 1 
          }}
          transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
        >
          <div className="w-full h-full rotate-45 bg-nexus-green shadow-[0_0_8px_rgba(40,231,162,0.6)]" />
        </motion.div>
      ))}
    </>
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
