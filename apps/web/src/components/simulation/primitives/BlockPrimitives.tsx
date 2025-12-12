// ============================================================================
// BLOCK PRIMITIVES V4 - Crystalline Fortress
// Physical matter with texture, bevels, and heavy physics
// ============================================================================

import { forwardRef, memo } from 'react';
import { motion } from 'motion/react';
import { Terminal, AlertTriangle, Lock, Hexagon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LegacyStackItem, NexusStackItem, ShakeLevel } from '../types';

// ============================================================================
// LEGACY BLOCK (The Rust) - with forwardRef for AnimatePresence
// ============================================================================
interface LegacyBlockProps {
  data: LegacyStackItem;
  shakeLevel: ShakeLevel;
}

export const LegacyBlock = memo(
  forwardRef<HTMLDivElement, LegacyBlockProps>(function LegacyBlock(
    { data, shakeLevel },
    ref
  ) {
    const isShaking = shakeLevel !== 'none';
    const shakeIntensity =
      shakeLevel === 'critical' ? 12 : shakeLevel === 'moderate' ? 4 : shakeLevel === 'light' ? 1 : 0;

    return (
      <motion.div
        ref={ref}
        initial={{ y: -50, opacity: 0 }}
        animate={{
          y: 0,
          opacity: 1,
          x: isShaking ? shakeIntensity : 0,
        }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{
          y: { type: 'spring', stiffness: 200, damping: 25 },
          x: isShaking
            ? { repeat: Infinity, repeatType: 'mirror', duration: 0.05, ease: 'linear' }
            : { duration: 0.1 },
        }}
        className={cn(
          'w-full h-14 flex items-center justify-between px-4 border mb-1',
          'bg-[#111] border-[#333] text-nexus-noise',
          'will-change-transform',
          isShaking && 'border-red-500/50 text-red-400 bg-red-950/10',
        )}
      >
        <div className="flex items-center gap-3">
          <Terminal className="w-3 h-3 opacity-50" />
          <span className="text-[10px] font-mono tracking-wider">{data.label}</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-[8px] font-mono uppercase px-1.5 py-0.5 border',
              data.risk === 'CRITICAL' && 'border-red-500/50 text-red-400',
              data.risk === 'HIGH' && 'border-orange-500/50 text-orange-400',
              data.risk === 'MODERATE' && 'border-yellow-500/50 text-yellow-400',
              data.risk === 'LOW' && 'border-nexus-structure text-nexus-noise',
            )}
          >
            {data.risk}
          </span>
          {isShaking && <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse" />}
        </div>
      </motion.div>
    );
  })
);

// ============================================================================
// NEXUS CRYSTAL BLOCK (V4 - Physical Matter)
// ============================================================================
interface NexusCrystalBlockProps {
  data: NexusStackItem;
  index: number;
  isNew: boolean;
}

export const NexusCrystalBlock = memo(
  forwardRef<HTMLDivElement, NexusCrystalBlockProps>(function NexusCrystalBlock(
    { data, index, isNew },
    ref
  ) {
    return (
      <motion.div
        ref={ref}
        initial={{ y: -200, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 30,
          mass: 1.5,
        }}
        className="relative z-10 will-change-transform"
        style={{ zIndex: index }}
      >
        <div
          className={cn(
            'relative h-14 w-full flex items-center justify-between px-6 overflow-hidden transition-all duration-500',
            'bg-[#030805]',
            'border-t border-t-white/10 border-b border-b-black/80',
            'border-x border-x-nexus-green/20',
            isNew ? 'shadow-[inset_0_0_30px_rgba(40,231,162,0.1)]' : 'shadow-none',
          )}
        >
          {/* CSS Gradient Texture (GPU-friendly) */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4px_4px]" />

          <div className="relative z-10 flex items-center gap-4">
            <div
              className={cn(
                'w-2 h-2 rotate-45 transition-colors duration-500',
                isNew ? 'bg-white shadow-[0_0_10px_white]' : 'bg-nexus-green',
              )}
            />
            <span
              className={cn(
                'text-[10px] font-bold tracking-wider transition-colors duration-500',
                isNew ? 'text-white' : 'text-nexus-green/80',
              )}
            >
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
  })
);

// ============================================================================
// NEXUS VERTEBRA BLOCK (V3 - kept for compatibility)
// ============================================================================
interface NexusVertebraBlockProps {
  data: NexusStackItem;
  index: number;
  isNew: boolean;
}

export const NexusVertebraBlock = memo(
  forwardRef<HTMLDivElement, NexusVertebraBlockProps>(function NexusVertebraBlock(
    { data, index, isNew },
    ref
  ) {
    const isBottomBlock = index === 0;

    return (
      <motion.div
        ref={ref}
        initial={{ y: -200, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25, mass: 1.2 }}
        className="relative z-10 will-change-transform"
        style={{ zIndex: index }}
      >
        <div
          className={cn(
            'relative h-14 w-full flex items-center justify-between px-6 transition-colors duration-500',
            isNew ? 'bg-[#0f1f15] border-nexus-green' : 'bg-[#050a07] border-nexus-green/30',
            'border-x border-t',
            isBottomBlock && 'border-b',
          )}
        >
          <div className="flex items-center gap-4">
            <Hexagon
              className={cn(
                'w-3 h-3 transition-colors duration-500',
                isNew ? 'text-nexus-green fill-nexus-green' : 'text-nexus-green/40 fill-transparent',
              )}
            />
            <span
              className={cn(
                'text-[10px] font-bold tracking-wider transition-colors duration-500',
                isNew ? 'text-white' : 'text-white/60',
              )}
            >
              {data.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-nexus-green/60">{data.status}</span>
            <Lock
              className={cn(
                'w-3 h-3 transition-colors duration-500',
                isNew ? 'text-nexus-green animate-pulse' : 'text-nexus-green/40',
              )}
            />
          </div>
          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-nexus-green/10 -translate-x-1/2">
            {isNew && (
              <motion.div
                className="w-full bg-nexus-green"
                initial={{ height: 0 }}
                animate={{ height: '100%' }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            )}
          </div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-[#050a07] border border-nexus-green rotate-45 z-20 flex items-center justify-center">
            <div
              className={cn(
                'w-1 h-1 bg-nexus-green rounded-full transition-all duration-500',
                isNew ? 'opacity-100 shadow-[0_0_5px_#28E7A2]' : 'opacity-40',
              )}
            />
          </div>
        </div>
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-r from-nexus-green/20 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-l from-nexus-green/20 to-transparent" />
      </motion.div>
    );
  })
);

// ============================================================================
// NEXUS BLOCK (Glass style)
// ============================================================================
interface NexusBlockProps {
  data: NexusStackItem;
  index?: number;
}

export const NexusBlock = memo(
  forwardRef<HTMLDivElement, NexusBlockProps>(function NexusBlock({ data, index = 0 }, ref) {
    return (
      <motion.div
        ref={ref}
        initial={{ y: -50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25, delay: index * 0.05 }}
        className={cn(
          'w-full h-14 flex items-center justify-between px-4',
          'bg-nexus-matter/50 border border-nexus-green/20 backdrop-blur-sm',
          'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]',
          'will-change-transform',
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-nexus-green rounded-full shadow-[0_0_8px_rgba(40,231,162,0.8)] animate-pulse" />
          <span className="text-[10px] font-mono tracking-wider text-white">{data.label}</span>
        </div>
        <div className="text-[9px] font-mono text-nexus-green/60 uppercase border border-nexus-green/20 px-1.5 py-0.5">
          {data.status}
        </div>
      </motion.div>
    );
  })
);

// ============================================================================
// NEXUS SOLID BLOCK
// ============================================================================
interface NexusSolidBlockProps {
  data: NexusStackItem;
  index: number;
}

export const NexusSolidBlock = memo(
  forwardRef<HTMLDivElement, NexusSolidBlockProps>(function NexusSolidBlock({ data, index }, ref) {
    const isBottomBlock = index === 0;

    return (
      <motion.div
        ref={ref}
        initial={{ y: -50, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25, delay: index * 0.05 }}
        className={cn(
          'relative w-full h-14 flex items-center justify-between px-6',
          'bg-[#0a0f0d] border-x-2 border-t-2 border-nexus-green/40',
          isBottomBlock && 'border-b-2',
          'shadow-[inset_0_0_20px_rgba(40,231,162,0.05)]',
          'will-change-transform',
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
  })
);

// ============================================================================
// COLLAPSED RUBBLE
// ============================================================================
export const CollapsedRubble = memo(function CollapsedRubble() {
  return (
    <motion.div
      className="relative w-full h-32 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 1.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'tween', duration: 0.3 }}
        className="text-center space-y-3"
      >
        {/* Glitch lines - simplified */}
        <div className="absolute inset-0 flex flex-col justify-center gap-1 opacity-30">
          <div className="h-[2px] bg-red-500/50 w-[70%] ml-[10%]" />
          <div className="h-[2px] bg-red-500/50 w-[80%] ml-[5%]" />
          <div className="h-[2px] bg-red-500/50 w-[60%] ml-[15%]" />
          <div className="h-[2px] bg-red-500/50 w-[75%] ml-[8%]" />
          <div className="h-[2px] bg-red-500/50 w-[65%] ml-[12%]" />
        </div>

        <div className="inline-block px-3 py-1 border border-red-500/50 bg-red-950/30 text-red-500 text-[10px] font-mono tracking-widest uppercase">
          SYSTEM FAILURE DETECTED
        </div>
        <p className="text-[10px] text-nexus-noise font-mono">Rebooting legacy kernel...</p>

        <div className="flex justify-center gap-1">
          <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
          <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      </motion.div>
    </motion.div>
  );
});
