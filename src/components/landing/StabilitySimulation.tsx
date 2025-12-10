'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Terminal, Lock, Hexagon, ShieldCheck, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================
type ShakeLevel = 'none' | 'light' | 'moderate' | 'critical';

interface LegacyStackItem {
  id: string;
  label: string;
  risk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

interface NexusStackItem {
  id: string;
  label: string;
  status: string;
}

// ============================================================================
// DATA (Static - no re-renders)
// ============================================================================
const LEGACY_STACK: LegacyStackItem[] = [
  { id: 'L01', label: 'LEGACY_ERP_CORE', risk: 'HIGH' },
  { id: 'L02', label: 'UNPATCHED_MIDDLEWARE', risk: 'CRITICAL' },
  { id: 'L03', label: 'V1_API_GATEWAY', risk: 'MODERATE' },
  { id: 'L04', label: 'ON_PREM_DATABASE', risk: 'LOW' },
  { id: 'L05', label: 'CUSTOM_GL_SCRIPTS', risk: 'CRITICAL' },
  { id: 'L06', label: 'BATCH_PROCESS_DAEMON', risk: 'HIGH' },
] as const;

const NEXUS_STACK: NexusStackItem[] = [
  { id: 'N01', label: 'IMMUTABLE_LEDGER', status: 'LOCKED' },
  { id: 'N02', label: 'SMART_CONTRACT_V2', status: 'ACTIVE' },
  { id: 'N03', label: 'REAL_TIME_AUDIT', status: 'LIVE' },
  { id: 'N04', label: 'ZERO_TRUST_AUTH', status: 'SECURE' },
  { id: 'N05', label: 'AUTO_RECONCILIATION', status: 'OPTIMAL' },
  { id: 'N06', label: 'TAX_COMPLIANCE_BOT', status: 'SYNCED' },
] as const;

// Width classes for inverted pyramid (index 0 = narrow, index 5 = wide)
const WIDTH_CLASSES = ['w-48', 'w-56', 'w-64', 'w-72', 'w-80', 'w-96'] as const;

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function StabilitySimulation() {
  const [stage, setStage] = useState(0);
  const [shakeLevel, setShakeLevel] = useState<ShakeLevel>('none');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Stable session ID (doesn't change on re-render)
  const sessionId = useMemo(() => Math.random().toString(36).substring(7).toUpperCase(), []);

  // Derived state
  const clampedStage = Math.min(stage, NEXUS_STACK.length);
  const progress = NEXUS_STACK.length > 0 ? clampedStage / NEXUS_STACK.length : 0;
  const isComplete = clampedStage >= NEXUS_STACK.length;

  // Simulation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setStage((prev) => {
        // Reset cycle
        if (prev >= 7) {
          setShakeLevel('none');
          setIsCollapsed(false);
          return 0;
        }

        const next = prev + 1;

        // Progressive degradation for legacy stack
        if (next === 4) setShakeLevel('light');
        if (next === 5) setShakeLevel('moderate');
        if (next === 6) {
          setShakeLevel('critical');
          // Delayed collapse
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
      {/* Header */}
      <SimulationHeader
        sessionId={sessionId}
        shakeLevel={shakeLevel}
        isCollapsed={isCollapsed}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 w-full relative min-h-[600px]">
        {/* Left: Legacy Decay */}
        <LegacyColumn
          stage={stage}
          shakeLevel={shakeLevel}
          isCollapsed={isCollapsed}
        />

        {/* Right: Nexus Inverted Pyramid */}
        <NexusColumn
          stage={clampedStage}
          progress={progress}
          isComplete={isComplete}
        />
      </div>
    </div>
  );
}

// ============================================================================
// HEADER COMPONENT
// ============================================================================
interface SimulationHeaderProps {
  sessionId: string;
  shakeLevel: ShakeLevel;
  isCollapsed: boolean;
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
      : 'ACTIVE';

  return (
    <div className="w-full border-b border-nexus-structure pb-8 mb-16 flex justify-between items-end">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-nexus-green/80">
          <Activity className="w-4 h-4 animate-pulse" />
          <span className="text-[10px] font-mono tracking-widest uppercase">
            Live Simulation // SEQ_ID: {sessionId}
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
          <StatusIndicator color="red" label="LEGACY" status={legacyStatus} />
          <StatusIndicator color="green" label="NEXUS" status="OPTIMAL" />
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// STATUS INDICATOR
// ============================================================================
interface StatusIndicatorProps {
  color: 'red' | 'green';
  label: string;
  status: string;
}

const StatusIndicator = memo(function StatusIndicator({
  color,
  label,
  status,
}: StatusIndicatorProps) {
  const colorClasses = {
    red: 'bg-red-500 text-red-400',
    green: 'bg-nexus-green text-nexus-green',
  };
  const [bgClass, textClass] = colorClasses[color].split(' ');

  return (
    <div className="flex items-center gap-2">
      <span className={cn('w-1.5 h-1.5 rounded-full', bgClass, color === 'red' && 'animate-pulse')} />
      <span className={cn('text-xs font-mono', textClass)}>
        {label}: {status}
      </span>
    </div>
  );
});

// ============================================================================
// LEGACY COLUMN (Decay)
// ============================================================================
interface LegacyColumnProps {
  stage: number;
  shakeLevel: ShakeLevel;
  isCollapsed: boolean;
}

const LegacyColumn = memo(function LegacyColumn({
  stage,
  shakeLevel,
  isCollapsed,
}: LegacyColumnProps) {
  return (
    <div className="relative flex flex-col justify-end items-center group">
      {/* Background pattern */}
      <div className="absolute inset-0 border border-nexus-structure/30 bg-[linear-gradient(45deg,transparent_25%,rgba(255,0,0,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:4px_4px]" />

      {/* Warning overlay */}
      <AnimatePresence>
        {shakeLevel !== 'none' && (
          <WarningOverlay stage={stage} />
        )}
      </AnimatePresence>

      {/* Stack */}
      <div className="relative w-64 flex flex-col-reverse gap-1 pb-12 z-10 min-h-[400px]">
        {!isCollapsed ? (
          <AnimatePresence mode="popLayout">
            {LEGACY_STACK.slice(0, stage).map((block) => (
              <LegacyBlock key={block.id} data={block} shakeLevel={shakeLevel} />
            ))}
          </AnimatePresence>
        ) : (
          <CollapsedRubble />
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 w-full text-center border-t border-nexus-structure pt-3">
        <span className="text-[10px] font-mono tracking-[0.2em] text-nexus-noise uppercase">
          Monolithic Architecture (v1.0)
        </span>
      </div>
    </div>
  );
});

// ============================================================================
// WARNING OVERLAY
// ============================================================================
const WarningOverlay = memo(function WarningOverlay({ stage }: { stage: number }) {
  return (
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
  );
});

// ============================================================================
// NEXUS COLUMN (Inverted Pyramid)
// ============================================================================
interface NexusColumnProps {
  stage: number;
  progress: number;
  isComplete: boolean;
}

const NexusColumn = memo(function NexusColumn({
  stage,
  progress,
  isComplete,
}: NexusColumnProps) {
  return (
    <div className="relative flex flex-col justify-end items-center">
      {/* Environment */}
      <div className="absolute inset-0 bg-[#020403] border border-white/5 overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-nexus-green/5 to-transparent" />
      </div>

      {/* Exoskeleton */}
      <VShapeExoskeleton progress={progress} />

      {/* Stack Container */}
      <div className="relative w-full pb-12 z-10 flex flex-col-reverse items-center min-h-[400px]">
        {/* Central Spine */}
        <div className="absolute left-1/2 bottom-12 top-0 w-1.5 bg-[#0f1f15] border-x border-nexus-green/20 -translate-x-1/2 z-0" />

        {/* Blocks */}
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

        {/* Singularity Point */}
        <SingularityPoint stage={stage} />

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
// LEGACY BLOCK
// ============================================================================
interface LegacyBlockProps {
  data: LegacyStackItem;
  shakeLevel: ShakeLevel;
}

const LegacyBlock = memo(function LegacyBlock({ data, shakeLevel }: LegacyBlockProps) {
  const isShaking = shakeLevel !== 'none';
  const shakeIntensity = 
    shakeLevel === 'critical' ? 15 : 
    shakeLevel === 'moderate' ? 5 : 2;

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
      }}
      className={cn(
        'w-64 h-14 flex items-center justify-between px-4 border mb-1',
        'bg-[#111] border-[#333] text-nexus-noise',
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
// NOISE TEXTURE (Memoized for performance)
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

// ============================================================================
// COLLAPSED RUBBLE
// ============================================================================
const CollapsedRubble = memo(function CollapsedRubble() {
  return (
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
});
