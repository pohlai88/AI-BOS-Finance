// ============================================================================
// BLOCK PRIMITIVES V4 - Crystalline Fortress
// Physical matter with texture, bevels, and heavy physics
// ============================================================================

import { forwardRef, memo } from 'react'
import { motion } from 'motion/react'
import { Terminal, AlertTriangle, Lock, Hexagon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LegacyStackItem, NexusStackItem, ShakeLevel } from '../types'

// ============================================================================
// LEGACY BLOCK (The Rust) - with forwardRef for AnimatePresence
// ============================================================================
interface LegacyBlockProps {
  data: LegacyStackItem
  shakeLevel: ShakeLevel
}

export const LegacyBlock = memo(
  forwardRef<HTMLDivElement, LegacyBlockProps>(function LegacyBlock(
    { data, shakeLevel },
    ref
  ) {
    const isShaking = shakeLevel !== 'none'
    const shakeIntensity =
      shakeLevel === 'critical'
        ? 12
        : shakeLevel === 'moderate'
          ? 4
          : shakeLevel === 'light'
            ? 1
            : 0

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
            ? {
                repeat: Infinity,
                repeatType: 'mirror',
                duration: 0.05,
                ease: 'linear',
              }
            : { duration: 0.1 },
        }}
        className={cn(
          'mb-1 flex h-14 w-full items-center justify-between border px-4',
          'border-border-surface-base bg-surface-flat text-text-tertiary',
          'will-change-transform',
          // 🛡️ GOVERNANCE: Uses status-error tokens instead of hardcoded red colors
          isShaking &&
            'border-status-error/50 bg-status-error/10 text-status-error'
        )}
      >
        <div className="flex items-center gap-3">
          <Terminal className="h-3 w-3 opacity-50" />
          <span className="font-mono text-[10px] tracking-wider">
            {data.label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 🛡️ GOVERNANCE: Risk badges use status tokens instead of hardcoded colors */}
          <span
            className={cn(
              'border px-1.5 py-0.5 font-mono text-[8px] uppercase',
              data.risk === 'CRITICAL' &&
                'border-status-error/50 text-status-error',
              data.risk === 'HIGH' &&
                'border-status-warning/50 text-status-warning',
              data.risk === 'MODERATE' &&
                'border-status-warning/50 text-status-warning',
              data.risk === 'LOW' &&
                'border-border-surface-base text-text-tertiary'
            )}
          >
            {data.risk}
          </span>
          {/* 🛡️ GOVERNANCE: Alert icon uses status-error token */}
          {isShaking && (
            <AlertTriangle className="h-3 w-3 animate-pulse text-status-error" />
          )}
        </div>
      </motion.div>
    )
  })
)

// ============================================================================
// NEXUS CRYSTAL BLOCK (V4 - Physical Matter)
// ============================================================================
interface NexusCrystalBlockProps {
  data: NexusStackItem
  index: number
  isNew: boolean
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
            'relative flex h-14 w-full items-center justify-between overflow-hidden px-6 transition-all duration-500',
            'bg-[#030805]',
            'border-b border-t border-b-black/80 border-t-white/10',
            'border-x-nexus-green/20 border-x',
            isNew
              ? 'shadow-[inset_0_0_30px_rgba(40,231,162,0.1)]'
              : 'shadow-none'
          )}
        >
          {/* CSS Gradient Texture (GPU-friendly) */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4px_4px] opacity-10" />

          <div className="relative z-10 flex items-center gap-4">
            <div
              className={cn(
                'h-2 w-2 rotate-45 transition-colors duration-500',
                isNew ? 'bg-white shadow-[0_0_10px_white]' : 'bg-nexus-green'
              )}
            />
            <span
              className={cn(
                'text-[10px] font-bold tracking-wider transition-colors duration-500',
                isNew ? 'text-white' : 'text-nexus-green/80'
              )}
            >
              {data.label}
            </span>
          </div>

          <div className="relative z-10 flex items-center gap-2">
            <span className="text-nexus-green/40 font-mono text-[9px]">
              {data.status}
            </span>
            <Lock className="text-nexus-green/60 h-3 w-3" />
          </div>
        </div>

        <div className="absolute -bottom-[1px] left-1/2 z-20 h-[2px] w-32 -translate-x-1/2 bg-[#030805]" />
      </motion.div>
    )
  })
)

// ============================================================================
// NEXUS VERTEBRA BLOCK (V3 - kept for compatibility)
// ============================================================================
interface NexusVertebraBlockProps {
  data: NexusStackItem
  index: number
  isNew: boolean
}

export const NexusVertebraBlock = memo(
  forwardRef<HTMLDivElement, NexusVertebraBlockProps>(
    function NexusVertebraBlock({ data, index, isNew }, ref) {
      const isBottomBlock = index === 0

      return (
        <motion.div
          ref={ref}
          initial={{ y: -200, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 25,
            mass: 1.2,
          }}
          className="relative z-10 will-change-transform"
          style={{ zIndex: index }}
        >
          <div
            className={cn(
              'relative flex h-14 w-full items-center justify-between px-6 transition-colors duration-500',
              isNew
                ? 'border-nexus-green bg-[#0f1f15]'
                : 'border-nexus-green/30 bg-[#050a07]',
              'border-x border-t',
              isBottomBlock && 'border-b'
            )}
          >
            <div className="flex items-center gap-4">
              <Hexagon
                className={cn(
                  'h-3 w-3 transition-colors duration-500',
                  isNew
                    ? 'text-nexus-green fill-nexus-green'
                    : 'text-nexus-green/40 fill-transparent'
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-bold tracking-wider transition-colors duration-500',
                  isNew ? 'text-white' : 'text-white/60'
                )}
              >
                {data.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-nexus-green/60 font-mono text-[9px]">
                {data.status}
              </span>
              <Lock
                className={cn(
                  'h-3 w-3 transition-colors duration-500',
                  isNew
                    ? 'text-nexus-green animate-pulse'
                    : 'text-nexus-green/40'
                )}
              />
            </div>
            <div className="bg-nexus-green/10 absolute bottom-0 left-1/2 top-0 w-[2px] -translate-x-1/2">
              {isNew && (
                <motion.div
                  className="bg-nexus-green w-full"
                  initial={{ height: 0 }}
                  animate={{ height: '100%' }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
              )}
            </div>
            <div className="border-nexus-green absolute left-1/2 top-0 z-20 flex h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 items-center justify-center border bg-[#050a07]">
              <div
                className={cn(
                  'bg-nexus-green h-1 w-1 rounded-full transition-all duration-500',
                  isNew ? 'opacity-100 shadow-[0_0_5px_#28E7A2]' : 'opacity-40'
                )}
              />
            </div>
          </div>
          <div className="from-nexus-green/20 absolute inset-y-0 left-0 w-1 bg-gradient-to-r to-transparent" />
          <div className="from-nexus-green/20 absolute inset-y-0 right-0 w-1 bg-gradient-to-l to-transparent" />
        </motion.div>
      )
    }
  )
)

// ============================================================================
// NEXUS BLOCK (Glass style)
// ============================================================================
interface NexusBlockProps {
  data: NexusStackItem
  index?: number
}

export const NexusBlock = memo(
  forwardRef<HTMLDivElement, NexusBlockProps>(function NexusBlock(
    { data, index = 0 },
    ref
  ) {
    return (
      <motion.div
        ref={ref}
        initial={{ y: -50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 25,
          delay: index * 0.05,
        }}
        className={cn(
          'flex h-14 w-full items-center justify-between px-4',
          'bg-nexus-matter/50 border-nexus-green/20 border backdrop-blur-sm',
          'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]',
          'will-change-transform'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="bg-nexus-green h-1.5 w-1.5 animate-pulse rounded-full shadow-[0_0_8px_rgba(40,231,162,0.8)]" />
          <span className="font-mono text-[10px] tracking-wider text-white">
            {data.label}
          </span>
        </div>
        <div className="text-nexus-green/60 border-nexus-green/20 border px-1.5 py-0.5 font-mono text-[9px] uppercase">
          {data.status}
        </div>
      </motion.div>
    )
  })
)

// ============================================================================
// NEXUS SOLID BLOCK
// ============================================================================
interface NexusSolidBlockProps {
  data: NexusStackItem
  index: number
}

export const NexusSolidBlock = memo(
  forwardRef<HTMLDivElement, NexusSolidBlockProps>(function NexusSolidBlock(
    { data, index },
    ref
  ) {
    const isBottomBlock = index === 0

    return (
      <motion.div
        ref={ref}
        initial={{ y: -50, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 25,
          delay: index * 0.05,
        }}
        className={cn(
          'relative flex h-14 w-full items-center justify-between px-6',
          'border-nexus-green/40 border-x-2 border-t-2 bg-[#0a0f0d]',
          isBottomBlock && 'border-b-2',
          'shadow-[inset_0_0_20px_rgba(40,231,162,0.05)]',
          'will-change-transform'
        )}
        style={{ zIndex: 10 - index }}
      >
        <div className="border-nexus-green absolute left-1/2 top-0 z-20 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 items-center justify-center border bg-[#0a0f0d]">
          <div className="bg-nexus-green h-1.5 w-1.5" />
        </div>
        <div className="flex items-center gap-4">
          <Hexagon className="text-nexus-green fill-nexus-green/20 h-4 w-4" />
          <span className="text-[10px] font-bold tracking-wider text-white">
            {data.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-nexus-green/10 h-1 w-12 overflow-hidden rounded-full">
            <motion.div
              className="bg-nexus-green h-full"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
            />
          </div>
          <Lock className="text-nexus-green h-3 w-3" />
        </div>
        <div className="bg-nexus-green/50 absolute inset-y-0 left-0 w-[2px] shadow-[0_0_10px_rgba(40,231,162,0.5)]" />
        <div className="bg-nexus-green/50 absolute inset-y-0 right-0 w-[2px] shadow-[0_0_10px_rgba(40,231,162,0.5)]" />
      </motion.div>
    )
  })
)

// ============================================================================
// COLLAPSED RUBBLE
// ============================================================================
export const CollapsedRubble = memo(function CollapsedRubble() {
  return (
    <motion.div
      className="relative flex h-32 w-full items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 1.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'tween', duration: 0.3 }}
        className="space-y-3 text-center"
      >
        {/* Glitch lines - simplified */}
        {/* 🛡️ GOVERNANCE: Uses status-error tokens instead of hardcoded red colors */}
        <div className="absolute inset-0 flex flex-col justify-center gap-1 opacity-30">
          <div className="ml-[10%] h-[2px] w-[70%] bg-status-error/50" />
          <div className="ml-[5%] h-[2px] w-[80%] bg-status-error/50" />
          <div className="ml-[15%] h-[2px] w-[60%] bg-status-error/50" />
          <div className="ml-[8%] h-[2px] w-[75%] bg-status-error/50" />
          <div className="ml-[12%] h-[2px] w-[65%] bg-status-error/50" />
        </div>

        <div className="inline-block border border-status-error/50 bg-status-error/30 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-status-error">
          SYSTEM FAILURE DETECTED
        </div>
        <p className="font-mono text-[10px] text-text-tertiary">
          Rebooting legacy kernel...
        </p>

        {/* 🛡️ GOVERNANCE: Status dots use status-error token */}
        <div className="flex justify-center gap-1">
          <div className="h-1 w-1 animate-pulse rounded-full bg-status-error" />
          <div
            className="h-1 w-1 animate-pulse rounded-full bg-status-error"
            style={{ animationDelay: '0.2s' }}
          />
          <div
            className="h-1 w-1 animate-pulse rounded-full bg-status-error"
            style={{ animationDelay: '0.4s' }}
          />
        </div>
      </motion.div>
    </motion.div>
  )
})
