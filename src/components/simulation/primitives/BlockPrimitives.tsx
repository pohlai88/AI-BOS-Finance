// ============================================================================
// BLOCK PRIMITIVES V3 - Heavy Physics & Vertebrae System
// LegacyBlock: The "Rust" aesthetic (decaying, shaking)
// NexusVertebraBlock: The "Spine" aesthetic (interlocking, solidifying)
// CollapsedRubble: Digital fragmentation display
// ============================================================================

import { motion } from 'motion/react';
import { Terminal, AlertTriangle, Hexagon, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LegacyStackItem, NexusStackItem, ShakeLevel } from '../types';

// --- LEGACY BLOCK (The Rust) ---
interface LegacyBlockProps {
  data: LegacyStackItem;
  shakeLevel: ShakeLevel;
}

export const LegacyBlock = ({ data, shakeLevel }: LegacyBlockProps) => {
  const isShaking = shakeLevel !== 'none';
  const shakeIntensity = 
    shakeLevel === 'critical' ? 15 : 
    shakeLevel === 'moderate' ? 5 : 
    shakeLevel === 'light' ? 2 : 0;

  return (
    <motion.div
      layout
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
        rotate: { repeat: isShaking ? Infinity : 0, duration: 0.15 },
      }}
      className={cn(
        'w-full h-14 flex items-center justify-between px-4 border mb-1',
        'bg-[#111] border-[#333] text-nexus-noise',
        isShaking && 'border-red-500/50 text-red-400 bg-red-950/10',
      )}
    >
      <div className="flex items-center gap-3">
        <Terminal className="w-3 h-3 opacity-50" />
        <span className="text-[10px] font-mono tracking-wider">{data.label}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className={cn(
          'text-[8px] font-mono uppercase px-1.5 py-0.5 border',
          data.risk === 'CRITICAL' && 'border-red-500/50 text-red-400',
          data.risk === 'HIGH' && 'border-orange-500/50 text-orange-400',
          data.risk === 'MODERATE' && 'border-yellow-500/50 text-yellow-400',
          data.risk === 'LOW' && 'border-nexus-structure text-nexus-noise',
        )}>
          {data.risk}
        </span>
        {isShaking && <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse" />}
      </div>
    </motion.div>
  );
};

// --- NEXUS VERTEBRA BLOCK (V3 - Heavy Physics) ---
interface NexusVertebraBlockProps {
  data: NexusStackItem;
  index: number;
  isNew: boolean;
}

export const NexusVertebraBlock = ({ data, index, isNew }: NexusVertebraBlockProps) => {
  const isBottomBlock = index === 0;
  
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
        isBottomBlock && "border-b" // Only bottom block has bottom border
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

// --- LEGACY NEXUS BLOCK (Glass style - kept for compatibility) ---
interface NexusBlockProps {
  data: NexusStackItem;
  index?: number;
}

export const NexusBlock = ({ data, index = 0 }: NexusBlockProps) => {
  return (
    <motion.div
      initial={{ y: -50, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ 
        type: 'spring', 
        stiffness: 200,
        delay: index * 0.05 
      }}
      className={cn(
        'w-full h-14 flex items-center justify-between px-4',
        'bg-nexus-matter/50 border border-nexus-green/20 backdrop-blur-sm',
        'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]',
      )}
    >
      <div className="flex items-center gap-3">
        <motion.div 
          className="w-1.5 h-1.5 bg-nexus-green rounded-full shadow-[0_0_8px_rgba(40,231,162,0.8)]"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="text-[10px] font-mono tracking-wider text-white">{data.label}</span>
      </div>
      
      <div className="text-[9px] font-mono text-nexus-green/60 uppercase border border-nexus-green/20 px-1.5 py-0.5">
        {data.status}
      </div>
    </motion.div>
  );
};

// --- LEGACY SOLID BLOCK (kept for compatibility) ---
interface NexusSolidBlockProps {
  data: NexusStackItem;
  index: number;
}

export const NexusSolidBlock = ({ data, index }: NexusSolidBlockProps) => {
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
      
      <div className="absolute inset-y-0 left-0 w-[2px] bg-nexus-green/50 shadow-[0_0_10px_rgba(40,231,162,0.5)]" />
      <div className="absolute inset-y-0 right-0 w-[2px] bg-nexus-green/50 shadow-[0_0_10px_rgba(40,231,162,0.5)]" />
    </motion.div>
  );
};

// --- COLLAPSED RUBBLE (Digital Fragmentation) ---
export const CollapsedRubble = () => {
  return (
    <motion.div 
      className="relative w-full h-32 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 1.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="text-center space-y-3"
      >
        {/* Glitch lines */}
        <motion.div
          className="absolute inset-0 flex flex-col justify-center gap-1 opacity-30"
          animate={{ x: [-2, 2, -2] }}
          transition={{ duration: 0.1, repeat: Infinity }}
        >
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className="h-[2px] bg-red-500/50" 
              style={{ width: `${60 + Math.random() * 40}%`, marginLeft: `${Math.random() * 20}%` }}
            />
          ))}
        </motion.div>

        <div className="inline-block px-3 py-1 border border-red-500/50 bg-red-950/30 text-red-500 text-[10px] font-mono tracking-widest uppercase">
          SYSTEM FAILURE DETECTED
        </div>
        <p className="text-[10px] text-nexus-noise font-mono">Rebooting legacy kernel...</p>
        
        <motion.div
          className="flex justify-center gap-1"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-1 h-1 bg-red-500 rounded-full" />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
