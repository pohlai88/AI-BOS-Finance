// ============================================================================
// NEXUS STACK V4 - Crystalline Fortress
// Physical matter with texture, bevels, shockwave impact
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
  const activeBlocks = data.slice(0, stage);
  const isComplete = stage >= data.length;

  return (
    <div className="relative flex flex-col justify-end items-center">
      
      {/* Environment: Deep Void with floor reflection */}
      <div className="absolute inset-0 bg-[#020403] border border-white/5 overflow-hidden">
        {/* Floor Reflection Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-nexus-green/5 to-transparent" />
      </div>

      {/* The Crystalline Stack */}
      <div className="relative w-72 pb-12 z-10 flex flex-col-reverse min-h-[350px]">
        
        {/* The Spine: Solid rod */}
        <div className="absolute left-1/2 bottom-12 top-0 w-1.5 bg-[#0f1f15] border-x border-nexus-green/20 -translate-x-1/2 z-0" />

        {/* The Crystal Blocks */}
        <AnimatePresence mode="popLayout">
          {activeBlocks.map((block, index) => (
            <NexusCrystalBlock 
              key={block.id} 
              data={block}
              index={index}
              isNew={index === stage - 1}
            />
          ))}
        </AnimatePresence>

        {/* Impact Baseplate */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          {/* The physical base */}
          <div className="w-56 h-2 bg-nexus-green shadow-[0_0_30px_rgba(40,231,162,0.4)] rounded-full" />
          {/* Shockwave Emitter */}
          <ShockwaveTrigger trigger={stage} />
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
          Crystalline Lattice (v3.0)
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
