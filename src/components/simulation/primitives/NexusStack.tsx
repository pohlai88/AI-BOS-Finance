// ============================================================================
// NEXUS STACK V6 - Optimized for Performance
// ============================================================================

import { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Hexagon, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NexusStackItem } from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================
const WIDTH_CLASSES = ['w-48', 'w-56', 'w-64', 'w-72', 'w-80', 'w-96'] as const;

// ============================================================================
// MAIN COMPONENT
// ============================================================================
interface NexusStackProps {
  data: NexusStackItem[];
  stage: number;
}

export const NexusStack = memo(function NexusStack({ data, stage }: NexusStackProps) {
  const clampedStage = Math.max(0, Math.min(stage, data.length));
  const activeBlocks = data.slice(0, clampedStage);
  const progress = data.length > 0 ? clampedStage / data.length : 0;
  const isComplete = progress >= 1;

  return (
    <div className="relative flex flex-col justify-end items-center">
      <div className="absolute inset-0 bg-[#020403] border border-white/5 overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-nexus-green/5 to-transparent" />
      </div>

      <VShapeExoskeleton progress={progress} />

      <div className="relative w-full pb-12 z-10 flex flex-col-reverse items-center min-h-[350px]">
        <div className="absolute left-1/2 bottom-12 top-0 w-1.5 bg-[#0f1f15] border-x border-nexus-green/20 -translate-x-1/2 z-0" />

        <AnimatePresence mode="popLayout">
          {activeBlocks.map((block, index) => (
            <NexusInvertedBlock key={block.id} data={block} index={index} isNew={index === clampedStage - 1} />
          ))}
        </AnimatePresence>

        <SingularityPoint stage={clampedStage} />

        <AnimatePresence>{isComplete && <CompletionBadge />}</AnimatePresence>
      </div>

      <div className="absolute bottom-0 w-full text-center border-t border-nexus-green/20 pt-3">
        <span className="text-[10px] font-mono tracking-[0.2em] text-nexus-green uppercase flex items-center justify-center gap-2">
          <Hexagon className="w-3 h-3" />
          Inverted Lattice (v4.0)
        </span>
      </div>
    </div>
  );
});

// ============================================================================
// SINGULARITY POINT
// ============================================================================
const SingularityPoint = memo(function SingularityPoint({ stage }: { stage: number }) {
  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
      <div className="w-4 h-4 bg-nexus-green rotate-45 shadow-[0_0_30px_#28E7A2]" />
      <div className="w-1 h-1 bg-white absolute top-1.5 left-1.5 rounded-full" />
      <ShockwaveEffect trigger={stage} />
    </div>
  );
});

// ============================================================================
// COMPLETION BADGE
// ============================================================================
const CompletionBadge = memo(function CompletionBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'tween', duration: 0.3 }}
      className="absolute -top-16 left-1/2 -translate-x-1/2"
    >
      <div className="px-4 py-1.5 bg-[#050a07] border border-nexus-green shadow-[0_0_15px_rgba(40,231,162,0.3)] flex items-center gap-2 rounded-sm">
        <ShieldCheck className="w-3 h-3 text-nexus-green fill-nexus-green" />
        <span className="text-[10px] font-mono tracking-widest text-white uppercase">
          Architecture Stabilized
        </span>
      </div>
    </motion.div>
  );
});

// ============================================================================
// NEXUS INVERTED BLOCK (Optimized)
// ============================================================================
interface NexusInvertedBlockProps {
  data: NexusStackItem;
  index: number;
  isNew: boolean;
}

const NexusInvertedBlock = memo(function NexusInvertedBlock({ data, index, isNew }: NexusInvertedBlockProps) {
  const currentWidth = WIDTH_CLASSES[Math.min(index, WIDTH_CLASSES.length - 1)];

  return (
    <motion.div
      initial={{ opacity: 0, y: -200 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 25 + index * 3,
        mass: 0.8 + index * 0.1,
      }}
      className={cn(
        'relative flex items-center justify-between px-6 overflow-hidden h-14',
        currentWidth,
        'bg-[#030805]',
        'border-t border-t-white/10 border-b border-b-black/80',
        'border-x border-x-nexus-green/30',
        'will-change-transform',
        isNew && 'shadow-[0_-5px_20px_rgba(40,231,162,0.15)]',
      )}
      style={{ zIndex: index }}
    >
      {/* CSS gradient texture instead of SVG */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4px_4px]" />

      <div className="relative z-10 flex items-center gap-4">
        <div
          className={cn(
            'w-2 h-2 rotate-45 transition-colors duration-300',
            isNew ? 'bg-white shadow-[0_0_8px_white]' : 'bg-nexus-green',
          )}
        />
        <span
          className={cn(
            'text-[10px] font-bold tracking-wider transition-colors duration-300 truncate',
            isNew ? 'text-white' : 'text-nexus-green/80',
          )}
        >
          {data.label}
        </span>
      </div>

      <div className="relative z-10 flex items-center gap-2">
        <span className="text-[9px] font-mono text-nexus-green/40 hidden sm:block">{data.status}</span>
        <Lock className="w-3 h-3 text-nexus-green/60" />
      </div>

      <div className="absolute top-0 right-0 w-[1px] h-full bg-nexus-green/10 -skew-x-12 origin-top" />
      <div className="absolute top-0 left-0 w-[1px] h-full bg-nexus-green/10 skew-x-12 origin-top" />
    </motion.div>
  );
});

// ============================================================================
// V-SHAPE EXOSKELETON (Optimized)
// ============================================================================
interface VShapeExoskeletonProps {
  progress: number;
}

const VShapeExoskeleton = memo(function VShapeExoskeleton({ progress }: VShapeExoskeletonProps) {
  const clamped = Math.max(0, Math.min(progress, 1));
  const showCanopy = clamped > 0.8;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
      <motion.div
        className="absolute bottom-12 left-1/2 w-0.5 bg-gradient-to-t from-nexus-green/40 to-transparent origin-bottom will-change-transform"
        style={{ height: 350 }}
        initial={{ scaleY: 0, rotate: -25, x: '-50%' }}
        animate={{ scaleY: clamped }}
        transition={{ type: 'tween', duration: 0.4 }}
      />
      <motion.div
        className="absolute bottom-12 left-1/2 w-0.5 bg-gradient-to-t from-nexus-green/40 to-transparent origin-bottom will-change-transform"
        style={{ height: 350 }}
        initial={{ scaleY: 0, rotate: 25, x: '-50%' }}
        animate={{ scaleY: clamped }}
        transition={{ type: 'tween', duration: 0.4 }}
      />

      {showCanopy && (
        <motion.div
          className="absolute top-24 h-12 bg-nexus-green/10 blur-xl will-change-opacity"
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 0.5, width: 384 }}
          transition={{ duration: 0.6 }}
        />
      )}
    </div>
  );
});

// ============================================================================
// SHOCKWAVE EFFECT (Optimized)
// ============================================================================
const ShockwaveEffect = memo(function ShockwaveEffect({ trigger }: { trigger: number }) {
  if (trigger === 0) return null;

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      <motion.div
        key={trigger}
        className="w-16 h-16 border border-nexus-green/50 rounded-full will-change-transform"
        initial={{ scale: 0.2, opacity: 0.8 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  );
});
