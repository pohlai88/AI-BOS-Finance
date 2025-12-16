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
// DATA (Static)
// ============================================================================
const LEGACY_STACK: LegacyStackItem[] = [
  { id: 'L01', label: 'LEGACY_ERP_CORE', risk: 'HIGH' },
  { id: 'L02', label: 'UNPATCHED_MIDDLEWARE', risk: 'CRITICAL' },
  { id: 'L03', label: 'V1_API_GATEWAY', risk: 'MODERATE' },
  { id: 'L04', label: 'ON_PREM_DATABASE', risk: 'LOW' },
  { id: 'L05', label: 'CUSTOM_GL_SCRIPTS', risk: 'CRITICAL' },
  { id: 'L06', label: 'BATCH_PROCESS_DAEMON', risk: 'HIGH' },
];

const NEXUS_STACK: NexusStackItem[] = [
  { id: 'N01', label: 'IMMUTABLE_LEDGER', status: 'LOCKED' },
  { id: 'N02', label: 'SMART_CONTRACT_V2', status: 'ACTIVE' },
  { id: 'N03', label: 'REAL_TIME_AUDIT', status: 'LIVE' },
  { id: 'N04', label: 'ZERO_TRUST_AUTH', status: 'SECURE' },
  { id: 'N05', label: 'AUTO_RECONCILIATION', status: 'OPTIMAL' },
  { id: 'N06', label: 'TAX_COMPLIANCE_BOT', status: 'SYNCED' },
];

// Width classes for inverted pyramid
const WIDTH_CLASSES = ['w-48', 'w-56', 'w-64', 'w-72', 'w-80', 'w-96'] as const;

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function StabilitySimulation() {
  const [stage, setStage] = useState(0);
  const [shakeLevel, setShakeLevel] = useState<ShakeLevel>('none');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sessionId = useMemo(() => Math.random().toString(36).substring(7).toUpperCase(), []);

  const clampedStage = Math.min(stage, NEXUS_STACK.length);
  const progress = NEXUS_STACK.length > 0 ? clampedStage / NEXUS_STACK.length : 0;
  const isComplete = clampedStage >= NEXUS_STACK.length;

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
      <SimulationHeader
        sessionId={sessionId}
        shakeLevel={shakeLevel}
        isCollapsed={isCollapsed}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 w-full relative min-h-[600px]">
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
  );
}

// ============================================================================
// HEADER
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
  const legacyStatus = isCollapsed ? 'FAILED' : shakeLevel !== 'none' ? 'DEGRADING' : 'ACTIVE';

  return (
    <div className="w-full border-b border-default pb-8 mb-16 flex justify-between items-end">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary/80">
          <Activity className="w-4 h-4 animate-pulse" />
          <span className="text-[10px] font-mono tracking-widest uppercase">
            Live Simulation // SEQ_ID: {sessionId}
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl font-medium tracking-tighter text-white">
          Structural <span className="text-text-secondary">Divergence.</span>
        </h2>
      </div>

      <div className="hidden md:flex flex-col items-end gap-2 text-right">
        <div className="text-[10px] font-mono text-text-secondary tracking-widest uppercase">
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

const StatusIndicator = memo(function StatusIndicator({ color, label, status }: StatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          color === 'red' ? 'bg-red-500 animate-pulse' : 'bg-primary',
        )}
      />
      <span className={cn('text-xs font-mono', color === 'red' ? 'text-red-400' : 'text-primary')}>
        {label}: {status}
      </span>
    </div>
  );
});

// ============================================================================
// LEGACY COLUMN
// ============================================================================
interface LegacyColumnProps {
  stage: number;
  shakeLevel: ShakeLevel;
  isCollapsed: boolean;
}

const LegacyColumn = memo(function LegacyColumn({ stage, shakeLevel, isCollapsed }: LegacyColumnProps) {
  return (
    <div className="relative flex flex-col justify-end items-center group">
      <div className="absolute inset-0 border border-default/30 bg-[linear-gradient(45deg,transparent_25%,rgba(255,0,0,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:4px_4px]" />

      <AnimatePresence>
        {shakeLevel !== 'none' && <WarningOverlay stage={stage} />}
      </AnimatePresence>

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

      <div className="absolute bottom-0 w-full text-center border-t border-default pt-3">
        <span className="text-[10px] font-mono tracking-[0.2em] text-text-secondary uppercase">
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
      transition={{ duration: 0.2 }}
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
// NEXUS COLUMN
// ============================================================================
interface NexusColumnProps {
  stage: number;
  progress: number;
  isComplete: boolean;
}

const NexusColumn = memo(function NexusColumn({ stage, progress, isComplete }: NexusColumnProps) {
  return (
    <div className="relative flex flex-col justify-end items-center">
      <div className="absolute inset-0 bg-[#020403] border border-white/5 overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-nexus-green/5 to-transparent" />
      </div>

      <VShapeExoskeleton progress={progress} />

      <div className="relative w-full pb-12 z-10 flex flex-col-reverse items-center min-h-[400px]">
        <div className="absolute left-1/2 bottom-12 top-0 w-1.5 bg-[#0f1f15] border-x border-primary/20 -translate-x-1/2 z-0" />

        <AnimatePresence mode="popLayout">
          {NEXUS_STACK.slice(0, stage).map((block, index) => (
            <NexusInvertedBlock key={block.id} data={block} index={index} isNew={index === stage - 1} />
          ))}
        </AnimatePresence>

        <SingularityPoint stage={stage} />

        <AnimatePresence>{isComplete && <CompletionBadge />}</AnimatePresence>
      </div>

      <div className="absolute bottom-0 w-full text-center border-t border-primary/20 pt-3">
        <span className="text-[10px] font-mono tracking-[0.2em] text-primary uppercase flex items-center justify-center gap-2">
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
      <div className="w-4 h-4 bg-primary rotate-45 shadow-[0_0_30px_#28E7A2]" />
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
      <div className="px-4 py-1.5 bg-[#050a07] border border-primary shadow-[0_0_15px_rgba(40,231,162,0.3)] flex items-center gap-2 rounded-sm">
        <ShieldCheck className="w-3 h-3 text-primary fill-nexus-green" />
        <span className="text-[10px] font-mono tracking-widest text-white uppercase">
          Architecture Stabilized
        </span>
      </div>
    </motion.div>
  );
});

// ============================================================================
// LEGACY BLOCK (Optimized - removed layout prop)
// ============================================================================
interface LegacyBlockProps {
  data: LegacyStackItem;
  shakeLevel: ShakeLevel;
}

const LegacyBlock = memo(function LegacyBlock({ data, shakeLevel }: LegacyBlockProps) {
  const isShaking = shakeLevel !== 'none';
  const shakeIntensity = shakeLevel === 'critical' ? 12 : shakeLevel === 'moderate' ? 4 : 1;

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
        'w-64 h-14 flex items-center justify-between px-4 border mb-1',
        'bg-[#111] border-[#333] text-text-secondary',
        'will-change-transform',
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
      {/* Simplified texture - CSS gradient instead of SVG */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4px_4px]" />

      <div className="relative z-10 flex items-center gap-4">
        <div
          className={cn(
            'w-2 h-2 rotate-45 transition-colors duration-300',
            isNew ? 'bg-white shadow-[0_0_8px_white]' : 'bg-primary',
          )}
        />
        <span
          className={cn(
            'text-[10px] font-bold tracking-wider transition-colors duration-300 truncate',
            isNew ? 'text-white' : 'text-primary/80',
          )}
        >
          {data.label}
        </span>
      </div>

      <div className="relative z-10 flex items-center gap-2">
        <span className="text-[9px] font-mono text-primary/40 hidden sm:block">{data.status}</span>
        <Lock className="w-3 h-3 text-primary/60" />
      </div>

      <div className="absolute top-0 right-0 w-[1px] h-full bg-primary/10 -skew-x-12 origin-top" />
      <div className="absolute top-0 left-0 w-[1px] h-full bg-primary/10 skew-x-12 origin-top" />
    </motion.div>
  );
});

// ============================================================================
// V-SHAPE EXOSKELETON (Optimized - reduced complexity)
// ============================================================================
interface VShapeExoskeletonProps {
  progress: number;
}

const VShapeExoskeleton = memo(function VShapeExoskeleton({ progress }: VShapeExoskeletonProps) {
  const clamped = Math.max(0, Math.min(progress, 1));
  const showCanopy = clamped > 0.8;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
      {/* V-Shape Struts - GPU accelerated */}
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

      {/* Canopy Field */}
      {showCanopy && (
        <motion.div
          className="absolute top-24 h-12 bg-primary/10 blur-xl will-change-opacity"
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
interface ShockwaveEffectProps {
  trigger: number;
}

const ShockwaveEffect = memo(function ShockwaveEffect({ trigger }: ShockwaveEffectProps) {
  if (trigger === 0) return null;

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      <motion.div
        key={trigger}
        className="w-16 h-16 border border-primary/50 rounded-full will-change-transform"
        initial={{ scale: 0.2, opacity: 0.8 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
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
      transition={{ duration: 0.3 }}
    >
      <div className="text-center space-y-2">
        <div className="inline-block px-3 py-1 border border-red-500/50 bg-red-950/30 text-red-500 text-[10px] font-mono tracking-widest uppercase">
          SYSTEM FAILURE DETECTED
        </div>
        <p className="text-[10px] text-text-secondary font-mono">Rebooting legacy kernel...</p>
      </div>
    </motion.div>
  );
});
