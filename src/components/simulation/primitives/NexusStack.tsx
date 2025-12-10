// ============================================================================
// NEXUS STACK V5 - The Crystalline Reactor
// Features: Obsidian matter + Hexagonal Exoskeleton + Variable Tension Lines
// ============================================================================

import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Hexagon } from 'lucide-react';
import { NexusCrystalBlock } from './BlockPrimitives';
import type { NexusStackItem } from '../types';

interface NexusStackProps {
  data: NexusStackItem[];
  stage: number;
}

export const NexusStack = ({ data, stage }: NexusStackProps) => {
  // 1. Calculate Reactor State
  const clampedStage = Math.max(0, Math.min(stage, data.length));
  const activeBlocks = data.slice(0, clampedStage);
  const progress = data.length === 0 ? 0 : clampedStage / data.length;
  
  // 2. Shield State
  const isComplete = progress >= 1;

  return (
    <div className="relative flex flex-col justify-end items-center">
      
      {/* A. Environment: Deep Void with floor reflection */}
      <div className="absolute inset-0 bg-[#020403] border border-white/5 overflow-hidden">
        {/* Floor Reflection Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-nexus-green/5 to-transparent" />
      </div>

      {/* B. The Exoskeleton (Hexagonal Shield Layer) */}
      <HexShield progress={progress} />

      {/* C. The Crystalline Stack */}
      <div className="relative w-72 pb-12 z-10 flex flex-col-reverse min-h-[350px]">
        
        {/* The Spine: Solid rod */}
        <div className="absolute left-1/2 bottom-12 top-0 w-1.5 bg-[#0f1f15] border-x border-nexus-green/20 -translate-x-1/2 z-0" />

        <AnimatePresence mode="popLayout">
          {activeBlocks.map((block, index) => (
            <NexusCrystalBlock 
              key={block.id} 
              data={block}
              index={index}
              isNew={index === clampedStage - 1}
            />
          ))}
        </AnimatePresence>

        {/* Impact Baseplate */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          {/* The physical base */}
          <div className="w-56 h-2 bg-nexus-green shadow-[0_0_30px_rgba(40,231,162,0.4)] rounded-full" />
          {/* Shockwave Emitter */}
          <ShockwaveTrigger trigger={clampedStage} />
        </div>

        {/* Shield Badge */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2"
            >
              <div className="px-4 py-1.5 bg-[#050a07] border border-nexus-green shadow-[0_0_15px_rgba(40,231,162,0.3)] flex items-center gap-2 rounded-sm">
                <ShieldCheck className="w-3 h-3 text-nexus-green fill-nexus-green" />
                <span className="text-[10px] font-mono tracking-widest text-white uppercase">Fortress Secured</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floor Label */}
      <div className="absolute bottom-0 w-full text-center border-t border-nexus-green/20 pt-3">
        <span className="text-[10px] font-mono tracking-[0.2em] text-nexus-green uppercase flex items-center justify-center gap-2">
          <Hexagon className="w-3 h-3" />
          Crystalline Reactor (v4.0)
        </span>
      </div>
    </div>
  );
};

// --- SHOCKWAVE EFFECT ---
const ShockwaveTrigger = ({ trigger }: { trigger: number }) => {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none flex items-center justify-center">
      {/* Ripple ring */}
      <motion.div
        key={trigger}
        className="w-40 h-2 rounded-full border border-nexus-green/50"
        initial={{ scale: 0.8, opacity: 1, borderWidth: 2 }}
        animate={{ scale: 2.5, opacity: 0, borderWidth: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      {/* Ground glow flash */}
      <motion.div
        key={`glow-${trigger}`}
        className="absolute w-full h-4 bg-nexus-green/30 blur-xl"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
};

// --- THE HEXAGONAL SHIELD (Exoskeleton) ---
const HexShield = ({ progress }: { progress: number }) => {
  const clamped = Math.max(0, Math.min(progress, 1));

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-5">
      <motion.div 
        className="relative w-96 h-96"
        initial={false}
        animate={{ 
          scale: 0.9 + (clamped * 0.1),
          opacity: clamped > 0 ? 1 : 0 
        }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* 1. The Hexagon Frame */}
        <div 
          className="absolute inset-0 border border-nexus-green/20"
          style={{ 
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
          }} 
        />
        
        {/* 2. The Inner Pulse Field (Breathing) */}
        <motion.div 
          className="absolute inset-4 border border-nexus-green/30 bg-nexus-green/5"
          style={{ 
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
          }}
          animate={{
            opacity: clamped > 0 ? [0.1, 0.3, 0.1] : 0
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* 3. The Tension Cables */}
        <TensionLines progress={clamped} />

        {/* 4. Corner Nodes (Hexagon vertices) */}
        <HexNodes progress={clamped} />
      </motion.div>
    </div>
  );
};

// --- TENSION LINES (Variable Strength) ---
const TensionLines = ({ progress }: { progress: number }) => {
  const strength = progress === 0 ? 0 : 0.2 + (progress * 0.8);

  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 w-[1px] h-[50%] bg-gradient-to-b from-transparent via-nexus-green to-transparent origin-bottom"
          style={{
            transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-50%)`,
          }}
          initial={{ scaleY: 0.5, opacity: 0 }}
          animate={{ 
            scaleY: 0.8 + (progress * 0.2),
            opacity: strength 
          }}
          transition={{ duration: 0.6, delay: i * 0.05 }}
        />
      ))}
    </>
  );
};

// --- HEX NODES (Corner indicators) ---
const HexNodes = ({ progress }: { progress: number }) => {
  const nodeOpacity = progress === 0 ? 0 : 0.3 + (progress * 0.7);
  
  // Positions for hexagon corners (approximate for 384x384 canvas)
  const nodePositions = [
    { x: '50%', y: '0%' },      // Top
    { x: '100%', y: '25%' },    // Top-right
    { x: '100%', y: '75%' },    // Bottom-right
    { x: '50%', y: '100%' },    // Bottom
    { x: '0%', y: '75%' },      // Bottom-left
    { x: '0%', y: '25%' },      // Top-left
  ];

  return (
    <>
      {nodePositions.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2"
          style={{ left: pos.x, top: pos.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: nodeOpacity,
            scale: 1 
          }}
          transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
        >
          {/* Diamond shape */}
          <div className="w-full h-full rotate-45 bg-nexus-green shadow-[0_0_8px_rgba(40,231,162,0.6)]" />
        </motion.div>
      ))}
    </>
  );
};
