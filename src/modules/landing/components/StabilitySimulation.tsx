'use client'

import { useState, useEffect, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  AlertTriangle,
  Terminal,
  Lock,
  Hexagon,
  ShieldCheck,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================
type ShakeLevel = 'none' | 'light' | 'moderate' | 'critical'

interface LegacyStackItem {
  id: string
  label: string
  risk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
}

interface NexusStackItem {
  id: string
  label: string
  status: string
}

// ============================================================================
// DATA (Static)
// ============================================================================
const LEGACY_STACK: LegacyStackItem[] = [
  { id: 'L01', label: 'LEGACY_ERP_CORE', risk: 'HIGH' },
  { id: 'L02', label: 'UNPATCHED_MIDDLEWARE', risk: 'CRITICAL' },
  { id: 'L03', label: 'V1_API_GATEWAY', risk: 'MODERATE' },
  { id: 'L04', label: 'ON_PREM_DATABASE', risk: 'LOW' },
  { id: 'L05', label: 'CUSTOM_GL_SCRIPTS', risk: 'CRITICAL' },
  { id: 'L06', label: 'BATCH_PROCESS_DAEMON', risk: 'HIGH' },
]

const NEXUS_STACK: NexusStackItem[] = [
  { id: 'N01', label: 'IMMUTABLE_LEDGER', status: 'LOCKED' },
  { id: 'N02', label: 'SMART_CONTRACT_V2', status: 'ACTIVE' },
  { id: 'N03', label: 'REAL_TIME_AUDIT', status: 'LIVE' },
  { id: 'N04', label: 'ZERO_TRUST_AUTH', status: 'SECURE' },
  { id: 'N05', label: 'AUTO_RECONCILIATION', status: 'OPTIMAL' },
  { id: 'N06', label: 'TAX_COMPLIANCE_BOT', status: 'SYNCED' },
]

// Width classes for inverted pyramid
const WIDTH_CLASSES = ['w-48', 'w-56', 'w-64', 'w-72', 'w-80', 'w-96'] as const

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function StabilitySimulation() {
  const [stage, setStage] = useState(0)
  const [shakeLevel, setShakeLevel] = useState<ShakeLevel>('none')
  const [isCollapsed, setIsCollapsed] = useState(false)

  const sessionId = useMemo(
    () => Math.random().toString(36).substring(7).toUpperCase(),
    []
  )

  const clampedStage = Math.min(stage, NEXUS_STACK.length)
  const progress =
    NEXUS_STACK.length > 0 ? clampedStage / NEXUS_STACK.length : 0
  const isComplete = clampedStage >= NEXUS_STACK.length

  useEffect(() => {
    const interval = setInterval(() => {
      setStage((prev) => {
        if (prev >= 7) {
          setShakeLevel('none')
          setIsCollapsed(false)
          return 0
        }

        const next = prev + 1

        if (next === 4) setShakeLevel('light')
        if (next === 5) setShakeLevel('moderate')
        if (next === 6) {
          setShakeLevel('critical')
          setTimeout(() => {
            setIsCollapsed(true)
            setShakeLevel('none')
          }, 1500)
        }

        return next
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center">
      <SimulationHeader
        sessionId={sessionId}
        shakeLevel={shakeLevel}
        isCollapsed={isCollapsed}
      />

      <div className="relative grid min-h-[600px] w-full grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24">
        <LegacyColumn
          stage={stage}
          shakeLevel={shakeLevel}
          isCollapsed={isCollapsed}
        />

        <NexusColumn
          stage={clampedStage}
          progress={progress}
          isComplete={isComplete}
        />
      </div>
    </div>
  )
}

// ============================================================================
// HEADER
// ============================================================================
interface SimulationHeaderProps {
  sessionId: string
  shakeLevel: ShakeLevel
  isCollapsed: boolean
}

const SimulationHeader = memo(function SimulationHeader({
  sessionId,
  shakeLevel,
  isCollapsed,
}: SimulationHeaderProps) {
  const legacyStatus = isCollapsed
    ? 'FAILED'
    : shakeLevel !== 'none'
      ? 'DEGRADING'
      : 'ACTIVE'

  return (
    <div className="border-nexus-structure mb-16 flex w-full items-end justify-between border-b pb-8">
      <div className="space-y-4">
        <div className="text-nexus-green/80 flex items-center gap-2">
          <Activity className="h-4 w-4 animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-widest">
            Live Simulation // SEQ_ID: {sessionId}
          </span>
        </div>
        <h2 className="text-4xl font-medium tracking-tighter text-white md:text-5xl">
          Structural <span className="text-nexus-noise">Divergence.</span>
        </h2>
      </div>

      <div className="hidden flex-col items-end gap-2 text-right md:flex">
        <div className="text-nexus-noise font-mono text-[10px] uppercase tracking-widest">
          System Integrity Monitor
        </div>
        <div className="flex gap-4">
          <StatusIndicator color="red" label="LEGACY" status={legacyStatus} />
          <StatusIndicator color="green" label="NEXUS" status="OPTIMAL" />
        </div>
      </div>
    </div>
  )
})

// ============================================================================
// STATUS INDICATOR
// ============================================================================
interface StatusIndicatorProps {
  color: 'red' | 'green'
  label: string
  status: string
}

const StatusIndicator = memo(function StatusIndicator({
  color,
  label,
  status,
}: StatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          color === 'red' ? 'animate-pulse bg-red-500' : 'bg-nexus-green'
        )}
      />
      <span
        className={cn(
          'font-mono text-xs',
          color === 'red' ? 'text-red-400' : 'text-nexus-green'
        )}
      >
        {label}: {status}
      </span>
    </div>
  )
})

// ============================================================================
// LEGACY COLUMN
// ============================================================================
interface LegacyColumnProps {
  stage: number
  shakeLevel: ShakeLevel
  isCollapsed: boolean
}

const LegacyColumn = memo(function LegacyColumn({
  stage,
  shakeLevel,
  isCollapsed,
}: LegacyColumnProps) {
  return (
    <div className="group relative flex flex-col items-center justify-end">
      <div className="border-nexus-structure/30 absolute inset-0 border bg-[linear-gradient(45deg,transparent_25%,rgba(255,0,0,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:4px_4px]" />

      <AnimatePresence>
        {shakeLevel !== 'none' && <WarningOverlay stage={stage} />}
      </AnimatePresence>

      <div className="relative z-10 flex min-h-[400px] w-64 flex-col-reverse gap-1 pb-12">
        {!isCollapsed ? (
          <AnimatePresence mode="popLayout">
            {LEGACY_STACK.slice(0, stage).map((block) => (
              <LegacyBlock
                key={block.id}
                data={block}
                shakeLevel={shakeLevel}
              />
            ))}
          </AnimatePresence>
        ) : (
          <CollapsedRubble />
        )}
      </div>

      <div className="border-nexus-structure absolute bottom-0 w-full border-t pt-3 text-center">
        <span className="text-nexus-noise font-mono text-[10px] uppercase tracking-[0.2em]">
          Monolithic Architecture (v1.0)
        </span>
      </div>
    </div>
  )
})

// ============================================================================
// WARNING OVERLAY
// ============================================================================
const WarningOverlay = memo(function WarningOverlay({
  stage,
}: {
  stage: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between border-b border-red-500/20 bg-red-900/10 p-4 backdrop-blur-sm"
    >
      <span className="animate-pulse font-mono text-[10px] text-red-500">
        ⚠ WARNING: STRUCTURAL FAILURE IMMINENT
      </span>
      <span className="font-mono text-[10px] text-red-500">
        ERR_CODE_0x{stage.toString(16).toUpperCase()}F
      </span>
    </motion.div>
  )
})

// ============================================================================
// NEXUS COLUMN
// ============================================================================
interface NexusColumnProps {
  stage: number
  progress: number
  isComplete: boolean
}

const NexusColumn = memo(function NexusColumn({
  stage,
  progress,
  isComplete,
}: NexusColumnProps) {
  return (
    <div className="relative flex flex-col items-center justify-end">
      <div className="absolute inset-0 overflow-hidden border border-white/5 bg-[#020403]">
        <div className="from-nexus-green/5 absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t to-transparent" />
      </div>

      <VShapeExoskeleton progress={progress} />

      <div className="relative z-10 flex min-h-[400px] w-full flex-col-reverse items-center pb-12">
        <div className="border-nexus-green/20 absolute bottom-12 left-1/2 top-0 z-0 w-1.5 -translate-x-1/2 border-x bg-[#0f1f15]" />

        <AnimatePresence mode="popLayout">
          {NEXUS_STACK.slice(0, stage).map((block, index) => (
            <NexusInvertedBlock
              key={block.id}
              data={block}
              index={index}
              isNew={index === stage - 1}
            />
          ))}
        </AnimatePresence>

        <SingularityPoint stage={stage} />

        <AnimatePresence>{isComplete && <CompletionBadge />}</AnimatePresence>
      </div>

      <div className="border-nexus-green/20 absolute bottom-0 w-full border-t pt-3 text-center">
        <span className="text-nexus-green flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em]">
          <Hexagon className="h-3 w-3" />
          Inverted Lattice (v4.0)
        </span>
      </div>
    </div>
  )
})

// ============================================================================
// SINGULARITY POINT
// ============================================================================
const SingularityPoint = memo(function SingularityPoint({
  stage,
}: {
  stage: number
}) {
  return (
    <div className="absolute bottom-10 left-1/2 z-20 -translate-x-1/2">
      <div className="bg-nexus-green h-4 w-4 rotate-45 shadow-[0_0_30px_#28E7A2]" />
      <div className="absolute left-1.5 top-1.5 h-1 w-1 rounded-full bg-white" />
      <ShockwaveEffect trigger={stage} />
    </div>
  )
})

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
      <div className="border-nexus-green flex items-center gap-2 rounded-sm border bg-[#050a07] px-4 py-1.5 shadow-[0_0_15px_rgba(40,231,162,0.3)]">
        <ShieldCheck className="text-nexus-green fill-nexus-green h-3 w-3" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-white">
          Architecture Stabilized
        </span>
      </div>
    </motion.div>
  )
})

// ============================================================================
// LEGACY BLOCK (Optimized - removed layout prop)
// ============================================================================
interface LegacyBlockProps {
  data: LegacyStackItem
  shakeLevel: ShakeLevel
}

const LegacyBlock = memo(function LegacyBlock({
  data,
  shakeLevel,
}: LegacyBlockProps) {
  const isShaking = shakeLevel !== 'none'
  const shakeIntensity =
    shakeLevel === 'critical' ? 12 : shakeLevel === 'moderate' ? 4 : 1

  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{
        opacity: 1,
        y: 0,
        x: isShaking ? shakeIntensity : 0,
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{
        opacity: { duration: 0.2 },
        y: { type: 'spring', stiffness: 300, damping: 25 },
        x: isShaking
          ? { repeat: Infinity, repeatType: 'mirror', duration: 0.05 }
          : { duration: 0.1 },
      }}
      className={cn(
        'mb-1 flex h-14 w-64 items-center justify-between border px-4',
        'text-nexus-noise border-[#333] bg-[#111]',
        'will-change-transform',
        isShaking && 'border-red-500/50 bg-red-950/10 text-red-400'
      )}
    >
      <div className="flex items-center gap-3">
        <Terminal className="h-3 w-3 opacity-50" />
        <span className="font-mono text-[10px] tracking-wider">
          {data.label}
        </span>
      </div>
      {isShaking && (
        <AlertTriangle className="h-3 w-3 animate-pulse text-red-500" />
      )}
    </motion.div>
  )
})

// ============================================================================
// NEXUS INVERTED BLOCK (Optimized)
// ============================================================================
interface NexusInvertedBlockProps {
  data: NexusStackItem
  index: number
  isNew: boolean
}

const NexusInvertedBlock = memo(function NexusInvertedBlock({
  data,
  index,
  isNew,
}: NexusInvertedBlockProps) {
  const currentWidth = WIDTH_CLASSES[Math.min(index, WIDTH_CLASSES.length - 1)]

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
        'relative flex h-14 items-center justify-between overflow-hidden px-6',
        currentWidth,
        'bg-[#030805]',
        'border-b border-t border-b-black/80 border-t-white/10',
        'border-x-nexus-green/30 border-x',
        'will-change-transform',
        isNew && 'shadow-[0_-5px_20px_rgba(40,231,162,0.15)]'
      )}
      style={{ zIndex: index }}
    >
      {/* Simplified texture - CSS gradient instead of SVG */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4px_4px] opacity-10" />

      <div className="relative z-10 flex items-center gap-4">
        <div
          className={cn(
            'h-2 w-2 rotate-45 transition-colors duration-300',
            isNew ? 'bg-white shadow-[0_0_8px_white]' : 'bg-nexus-green'
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
        <Lock className="text-nexus-green/60 h-3 w-3" />
      </div>

      <div className="bg-nexus-green/10 absolute right-0 top-0 h-full w-[1px] origin-top -skew-x-12" />
      <div className="bg-nexus-green/10 absolute left-0 top-0 h-full w-[1px] origin-top skew-x-12" />
    </motion.div>
  )
})

// ============================================================================
// V-SHAPE EXOSKELETON (Optimized - reduced complexity)
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
      {/* V-Shape Struts - GPU accelerated */}
      <motion.div
        className="from-nexus-green/40 absolute bottom-12 left-1/2 w-0.5 origin-bottom bg-gradient-to-t to-transparent will-change-transform"
        style={{ height: 350 }}
        initial={{ scaleY: 0, rotate: -25, x: '-50%' }}
        animate={{ scaleY: clamped }}
        transition={{ type: 'tween', duration: 0.4 }}
      />
      <motion.div
        className="from-nexus-green/40 absolute bottom-12 left-1/2 w-0.5 origin-bottom bg-gradient-to-t to-transparent will-change-transform"
        style={{ height: 350 }}
        initial={{ scaleY: 0, rotate: 25, x: '-50%' }}
        animate={{ scaleY: clamped }}
        transition={{ type: 'tween', duration: 0.4 }}
      />

      {/* Canopy Field */}
      {showCanopy && (
        <motion.div
          className="bg-nexus-green/10 will-change-opacity absolute top-24 h-12 blur-xl"
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 0.5, width: 384 }}
          transition={{ duration: 0.6 }}
        />
      )}
    </div>
  )
})

// ============================================================================
// SHOCKWAVE EFFECT (Optimized)
// ============================================================================
interface ShockwaveEffectProps {
  trigger: number
}

const ShockwaveEffect = memo(function ShockwaveEffect({
  trigger,
}: ShockwaveEffectProps) {
  if (trigger === 0) return null

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <motion.div
        key={trigger}
        className="border-nexus-green/50 h-16 w-16 rounded-full border will-change-transform"
        initial={{ scale: 0.2, opacity: 0.8 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  )
})

// ============================================================================
// COLLAPSED RUBBLE
// ============================================================================
const CollapsedRubble = memo(function CollapsedRubble() {
  return (
    <motion.div
      className="relative flex h-32 w-full items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-2 text-center">
        <div className="inline-block border border-red-500/50 bg-red-950/30 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-red-500">
          SYSTEM FAILURE DETECTED
        </div>
        <p className="text-nexus-noise font-mono text-[10px]">
          Rebooting legacy kernel...
        </p>
      </div>
    </motion.div>
  )
})
