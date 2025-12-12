// ============================================================================
// NEXUS STACK V7 - Inverted Physics Architecture
// Bottom = Fragile/Unstable, Top = Solid/Immovable
// ============================================================================

import { memo, forwardRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ShieldCheck, Hexagon, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NexusStackItem } from '../types'

// ============================================================================
// CONSTANTS
// ============================================================================
const WIDTH_CLASSES = ['w-48', 'w-56', 'w-64', 'w-72', 'w-80', 'w-96'] as const
const MAX_BLOCKS = 6

// ============================================================================
// PHYSICS CONFIGURATION
// Inverse relationship: Lower index = More wobble
// ============================================================================
function getBlockPhysics(index: number) {
  // Stability increases with index (0 = least stable, 5 = most stable)
  const stabilityFactor = index / (MAX_BLOCKS - 1) // 0 to 1

  return {
    // Entry animation: Bottom blocks bounce more, top blocks thud
    spring: {
      stiffness: 180 + stabilityFactor * 80, // 180 → 260 (stiffer = less bounce)
      damping: 15 + stabilityFactor * 25, // 15 → 40 (higher = less oscillation)
      mass: 1.2 - stabilityFactor * 0.4, // 1.2 → 0.8 (lighter = faster settle)
    },
    // Wobble intensity (CSS animation)
    wobbleClass:
      index < 2
        ? 'animate-wobble-strong'
        : index < 4
          ? 'animate-wobble-light'
          : '',
    // Visual stability indicator
    isStable: index >= 3, // Top 3 blocks are "locked"
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
interface NexusStackProps {
  data: NexusStackItem[]
  stage: number
}

export const NexusStack = memo(function NexusStack({
  data,
  stage,
}: NexusStackProps) {
  const clampedStage = Math.max(0, Math.min(stage, data.length))
  const activeBlocks = data.slice(0, clampedStage)
  const progress = data.length > 0 ? clampedStage / data.length : 0
  const isComplete = progress >= 1

  return (
    <div className="relative flex flex-col items-center justify-end">
      {/* CSS Keyframes for wobble - injected once */}
      <style>{`
        @keyframes wobble-strong {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(1.5px) rotate(0.3deg); }
          75% { transform: translateX(-1.5px) rotate(-0.3deg); }
        }
        @keyframes wobble-light {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(0.5px) rotate(0.1deg); }
          75% { transform: translateX(-0.5px) rotate(-0.1deg); }
        }
        .animate-wobble-strong { animation: wobble-strong 0.4s ease-in-out infinite; }
        .animate-wobble-light { animation: wobble-light 0.6s ease-in-out infinite; }
      `}</style>

      <div className="absolute inset-0 overflow-hidden border border-white/5 bg-[#020403]">
        <div className="from-nexus-green/5 absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t to-transparent" />
      </div>

      <VShapeExoskeleton progress={progress} />

      <div className="relative z-10 flex min-h-[350px] w-full flex-col-reverse items-center pb-12">
        <div className="border-nexus-green/20 absolute bottom-12 left-1/2 top-0 z-0 w-1.5 -translate-x-1/2 border-x bg-[#0f1f15]" />

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

        <SingularityPoint stage={clampedStage} />

        <AnimatePresence>{isComplete && <CompletionBadge />}</AnimatePresence>
      </div>

      <div className="border-nexus-green/20 absolute bottom-0 w-full border-t pt-3 text-center">
        <span className="text-nexus-green flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em]">
          <Hexagon className="h-3 w-3" />
          Inverted Lattice (v7.0)
        </span>
      </div>
    </div>
  )
})

// ============================================================================
// SINGULARITY POINT (The unstable foundation)
// ============================================================================
const SingularityPoint = memo(function SingularityPoint({
  stage,
}: {
  stage: number
}) {
  // The singularity wobbles when there are few blocks (system is fragile)
  const isUnstable = stage > 0 && stage < 4

  return (
    <div className="absolute bottom-10 left-1/2 z-20 -translate-x-1/2">
      <motion.div
        className={cn(
          'bg-nexus-green h-4 w-4 rotate-45 shadow-[0_0_30px_#28E7A2]',
          isUnstable && 'animate-wobble-strong'
        )}
      />
      <div className="absolute left-1.5 top-1.5 h-1 w-1 rounded-full bg-white" />
      <ShockwaveEffect trigger={stage} />
    </div>
  )
})

// ============================================================================
// COMPLETION BADGE
// ============================================================================
const CompletionBadge = memo(
  forwardRef<HTMLDivElement>(function CompletionBadge(_, ref) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ type: 'tween', duration: 0.3 }}
        className="absolute -top-16 left-1/2 -translate-x-1/2"
      >
        <div className="border-nexus-green flex items-center gap-2 rounded-sm border bg-[#050a07] px-4 py-1.5 shadow-[0_0_15px_rgba(40,231,162,0.3)]">
          <ShieldCheck className="text-nexus-green fill-nexus-green h-3 w-3" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-white">
            Architecture Stabilized
          </span>
        </div>
      </motion.div>
    )
  })
)

// ============================================================================
// NEXUS INVERTED BLOCK - Clean Physics
// ============================================================================
interface NexusInvertedBlockProps {
  data: NexusStackItem
  index: number
  isNew: boolean
}

const NexusInvertedBlock = memo(
  forwardRef<HTMLDivElement, NexusInvertedBlockProps>(
    function NexusInvertedBlock({ data, index, isNew }, ref) {
      const currentWidth =
        WIDTH_CLASSES[Math.min(index, WIDTH_CLASSES.length - 1)]

      // Memoize physics calculations
      const physics = useMemo(() => getBlockPhysics(index), [index])

      return (
        <motion.div
          ref={ref}
          // Entry animation with physics-based spring
          initial={{ opacity: 0, y: -200, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{
            type: 'spring',
            ...physics.spring,
          }}
          className={cn(
            'relative flex h-14 items-center justify-between overflow-hidden px-6',
            currentWidth,
            'bg-[#030805]',
            'border-b border-t border-b-black/80 border-t-white/10',
            'border-x-nexus-green/30 border-x',
            // CSS wobble animation (only for unstable blocks, not when new)
            !isNew && physics.wobbleClass,
            // Visual feedback: stable blocks have stronger border
            physics.isStable && 'border-x-nexus-green/50',
            isNew && 'shadow-[0_-5px_20px_rgba(40,231,162,0.15)]'
          )}
          style={{ zIndex: index }}
        >
          {/* CSS gradient texture */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4px_4px] opacity-10" />

          {/* STABILITY INDICATOR: Subtle glow for stable blocks */}
          {physics.isStable && (
            <div className="from-nexus-green/5 to-nexus-green/5 pointer-events-none absolute inset-0 bg-gradient-to-r via-transparent" />
          )}

          <div className="relative z-10 flex items-center gap-4">
            <div
              className={cn(
                'h-2 w-2 rotate-45 transition-colors duration-300',
                isNew ? 'bg-white shadow-[0_0_8px_white]' : 'bg-nexus-green',
                // Unstable blocks have pulsing indicator
                !physics.isStable && !isNew && 'animate-pulse'
              )}
            />
            <span
              className={cn(
                'truncate text-[10px] font-bold tracking-wider transition-colors duration-300',
                isNew ? 'text-white' : 'text-nexus-green/80'
              )}
            >
              {data.label}
            </span>
          </div>

          <div className="relative z-10 flex items-center gap-2">
            <span className="text-nexus-green/40 hidden font-mono text-[9px] sm:block">
              {data.status}
            </span>
            <Lock
              className={cn(
                'h-3 w-3 transition-colors duration-500',
                physics.isStable ? 'text-nexus-green' : 'text-nexus-green/40'
              )}
            />
          </div>

          <div className="bg-nexus-green/10 absolute right-0 top-0 h-full w-[1px] origin-top -skew-x-12" />
          <div className="bg-nexus-green/10 absolute left-0 top-0 h-full w-[1px] origin-top skew-x-12" />
        </motion.div>
      )
    }
  )
)

// ============================================================================
// V-SHAPE EXOSKELETON
// ============================================================================
interface VShapeExoskeletonProps {
  progress: number
}

const VShapeExoskeleton = memo(function VShapeExoskeleton({
  progress,
}: VShapeExoskeletonProps) {
  const clamped = Math.max(0, Math.min(progress, 1))
  const showCanopy = clamped > 0.8

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      <motion.div
        className="from-nexus-green/40 absolute bottom-12 left-1/2 w-0.5 origin-bottom bg-gradient-to-t to-transparent"
        style={{ height: 350 }}
        initial={{ scaleY: 0, rotate: -25, x: '-50%' }}
        animate={{ scaleY: clamped }}
        transition={{ type: 'tween', duration: 0.4 }}
      />
      <motion.div
        className="from-nexus-green/40 absolute bottom-12 left-1/2 w-0.5 origin-bottom bg-gradient-to-t to-transparent"
        style={{ height: 350 }}
        initial={{ scaleY: 0, rotate: 25, x: '-50%' }}
        animate={{ scaleY: clamped }}
        transition={{ type: 'tween', duration: 0.4 }}
      />

      {showCanopy && (
        <motion.div
          className="bg-nexus-green/10 absolute top-24 h-12 blur-xl"
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 0.5, width: 384 }}
          transition={{ duration: 0.6 }}
        />
      )}
    </div>
  )
})

// ============================================================================
// SHOCKWAVE EFFECT
// ============================================================================
const ShockwaveEffect = memo(function ShockwaveEffect({
  trigger,
}: {
  trigger: number
}) {
  if (trigger === 0) return null

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <motion.div
        key={trigger}
        className="border-nexus-green/50 h-16 w-16 rounded-full border"
        initial={{ scale: 0.2, opacity: 0.8 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  )
})
