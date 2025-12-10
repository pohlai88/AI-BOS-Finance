// ============================================================================
// NEXUS STACK V6 - Inverted Pyramid (V-Shape)
// From Vulnerable Origin → To Unshakable Canopy
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
      {/* Environment */}
      <div className="absolute inset-0 bg-[#020403] border border-white/5 overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-nexus-green/5 to-transparent" />
      </div>

      {/* Exoskeleton */}
      <VShapeExoskeleton progress={progress} />

      {/* Stack Container */}
      <div className="relative w-full pb-12 z-10 flex flex-col-reverse items-center min-h-[350px]">
        {/* Central Spine */}
        <div className="absolute left-1/2 bottom-12 top-0 w-1.5 bg-[#0f1f15] border-x border-nexus-green/20 -translate-x-1/2 z-0" />

        {/* Blocks */}
        <AnimatePresence mode="popLayout">
          {activeBlocks.map((block, index) => (
            <NexusInvertedBlock
              key={block.id}
              data={block}
              index={index}
              isNew={index === clampedStage - 1}
            />
          ))}
        </AnimatePresence>

        {/* Singularity Point */}
        <SingularityPoint stage={clampedStage} />

        {/* Completion Badge */}
        <AnimatePresence>
          {isComplete && <CompletionBadge />}
        </AnimatePresence>
      </div>

      {/* Footer */}
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
interface SingularityPointProps {
  stage: number;
}

const SingularityPoint = memo(function SingularityPoint({ stage }: SingularityPointProps) {
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
// NEXUS INVERTED BLOCK
// ============================================================================
interface NexusInvertedBlockProps {
  data: NexusStackItem;
  index: number;
  isNew: boolean;
}

const NexusInvertedBlock = memo(function NexusInvertedBlock({
  data,
  index,
  isNew,
}: NexusInvertedBlockProps) {
  const currentWidth = WIDTH_CLASSES[Math.min(index, WIDTH_CLASSES.length - 1)];
  const wobbleAmount = Math.max(0, 3 - index);

  return (
    <motion.div
      layout
      initial={{ y: -400, opacity: 0, scale: 0.5 }}
      animate={{
        y: 0,
        opacity: 1,
        scale: 1,
        x: isNew && wobbleAmount > 0 ? [-wobbleAmount * 2, wobbleAmount * 2, 0] : 0,
      }}
      exit={{ opacity: 0, y: -50 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30 + index * 5,
        mass: 1 + index * 0.2,
      }}
      className={cn(
        'relative z-10 flex items-center justify-between px-6 overflow-hidden h-14',
        currentWidth,
        'bg-[#030805]',
        'border-t border-t-white/10 border-b border-b-black/80',
        'border-x border-x-nexus-green/30',
        isNew && 'shadow-[0_-5px_20px_rgba(40,231,162,0.15)]',
      )}
      style={{ zIndex: index }}
    >
      {/* Texture */}
      <NoiseTexture />

      {/* Content */}
      <div className="relative z-10 flex items-center gap-4">
        <div
          className={cn(
            'w-2 h-2 rotate-45 transition-colors duration-500',
            isNew ? 'bg-white shadow-[0_0_10px_white]' : 'bg-nexus-green',
          )}
        />
        <span
          className={cn(
            'text-[10px] font-bold tracking-wider transition-colors duration-500 truncate',
            isNew ? 'text-white' : 'text-nexus-green/80',
          )}
        >
          {data.label}
        </span>
      </div>

      <div className="relative z-10 flex items-center gap-2">
        <span className="text-[9px] font-mono text-nexus-green/40 hidden sm:block">
          {data.status}
        </span>
        <Lock className="w-3 h-3 text-nexus-green/60" />
      </div>

      {/* Struts */}
      <div className="absolute top-0 right-0 w-[1px] h-full bg-nexus-green/10 -skew-x-12 origin-top" />
      <div className="absolute top-0 left-0 w-[1px] h-full bg-nexus-green/10 skew-x-12 origin-top" />
    </motion.div>
  );
});

// ============================================================================
// NOISE TEXTURE
// ============================================================================
const NoiseTexture = memo(function NoiseTexture() {
  return (
    <div
      className="absolute inset-0 opacity-20 pointer-events-none"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }}
    />
  );
});

// ============================================================================
// V-SHAPE EXOSKELETON
// ============================================================================
interface VShapeExoskeletonProps {
  progress: number;
}

const VShapeExoskeleton = memo(function VShapeExoskeleton({ progress }: VShapeExoskeletonProps) {
  const clamped = Math.max(0, Math.min(progress, 1));
  const showCanopy = clamped > 0.8;
  const showNodes = clamped > 0.5;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
      {/* V-Shape Struts */}
      <motion.div
        className="absolute bottom-12 left-1/2 w-0.5 bg-gradient-to-t from-nexus-green/40 to-transparent origin-bottom"
        style={{ height: 350, transform: 'translateX(-50%) rotate(-25deg)' }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: clamped }}
        transition={{ duration: 0.5 }}
      />
      <motion.div
        className="absolute bottom-12 left-1/2 w-0.5 bg-gradient-to-t from-nexus-green/40 to-transparent origin-bottom"
        style={{ height: 350, transform: 'translateX(-50%) rotate(25deg)' }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: clamped }}
        transition={{ duration: 0.5 }}
      />

      {/* Canopy Field */}
      <motion.div
        className="absolute top-24 h-12 border-t border-nexus-green/40 bg-nexus-green/5 blur-xl"
        initial={{ opacity: 0, width: 0 }}
        animate={{
          opacity: showCanopy ? 0.5 : 0,
          width: showCanopy ? 384 : 0,
        }}
        transition={{ duration: 1 }}
      />

      {/* Corner Nodes */}
      <AnimatePresence>
        {showNodes && (
          <>
            <motion.div
              className="absolute bottom-12 left-[15%] w-2 h-2 rotate-45 bg-nexus-green/60"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ delay: 0.3 }}
            />
            <motion.div
              className="absolute bottom-12 right-[15%] w-2 h-2 rotate-45 bg-nexus-green/60"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ delay: 0.3 }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// SHOCKWAVE EFFECT
// ============================================================================
interface ShockwaveEffectProps {
  trigger: number;
}

const ShockwaveEffect = memo(function ShockwaveEffect({ trigger }: ShockwaveEffectProps) {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none flex items-center justify-center">
      <motion.div
        key={trigger}
        className="w-20 h-20 border border-nexus-green/50 rounded-full"
        initial={{ scale: 0.1, opacity: 1 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
});
