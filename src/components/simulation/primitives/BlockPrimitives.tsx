// ============================================================================
// BLOCK PRIMITIVES - Individual block designs for stacks
// LegacyBlock: The "Rust" aesthetic (decaying, shaking)
// NexusBlock: The "Crystal" aesthetic (stable, glowing)
// CollapsedRubble: Digital fragmentation display
// ============================================================================

import { motion } from 'motion/react';
import { Terminal, AlertTriangle } from 'lucide-react';
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
        'w-full h-14 flex items-center justify-between px-4 border',
        'bg-[#111] border-[#333] text-nexus-noise',
        isShaking && 'border-red-500/50 text-red-400 bg-red-950/10',
      )}
    >
      <div className="flex items-center gap-3">
        <Terminal className="w-3 h-3 opacity-50" />
        <span className="text-[10px] font-mono tracking-wider">{data.label}</span>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Risk indicator */}
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

// --- NEXUS BLOCK (The Crystal) ---
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

