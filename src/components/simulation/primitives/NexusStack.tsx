// ============================================================================
// NEXUS STACK - The Solid Shield Column
// Implements "Hexagonal String Protection" with interlocking blocks
// ============================================================================

import { motion, AnimatePresence } from 'motion/react';
import { NexusSolidBlock } from './BlockPrimitives';
import { HexGridBackground } from './HexGridBackground';
import type { NexusStackItem } from '../types';

interface NexusStackProps {
  data: NexusStackItem[];
  stage: number;
}

export const NexusStack = ({ data, stage }: NexusStackProps) => {
  const activeBlocks = data.slice(0, stage);
  const glowIntensity = stage * 4;
  const glowOpacity = stage * 0.1;

  return (
    <div className="relative flex flex-col justify-end items-center">
      {/* 1. Hexagonal Force Field Background */}
      <div 
        className="absolute inset-0 border border-nexus-structure/30 overflow-hidden transition-all duration-1000"
        style={{
          background: `radial-gradient(circle at bottom center, rgba(40, 231, 162, ${stage * 0.05}) 0%, transparent 70%)`
        }}
      >
        <HexGridBackground stage={stage} maxStages={data.length} />
      </div>

      {/* Ambient Top Glow */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        animate={{ 
          boxShadow: `inset 0 -100px 100px -100px rgba(40, 231, 162, ${stage * 0.08})`
        }}
      />

      {/* 2. The Solid Protection Stack */}
      <motion.div 
        className="relative w-72 pb-12 z-10 flex flex-col-reverse min-h-[350px]"
        animate={{
          filter: `drop-shadow(0 0 ${glowIntensity}px rgba(40, 231, 162, ${glowOpacity}))`
        }}
        transition={{ duration: 0.5 }}
      >
        {/* The Vertical Spine / String */}
        <motion.div 
          className="absolute left-1/2 bottom-12 w-[2px] bg-gradient-to-t from-nexus-green/50 to-transparent -translate-x-1/2 z-0"
          initial={{ height: 0 }}
          animate={{ height: `${Math.min(stage * 16.6, 100)}%` }}
          transition={{ duration: 0.5 }}
        />

        {/* The Interlocking Blocks */}
        <AnimatePresence mode="popLayout">
          {activeBlocks.map((block, index) => (
            <NexusSolidBlock 
              key={block.id} 
              data={block}
              index={index}
            />
          ))}
        </AnimatePresence>

        {/* The Base Foundation */}
        <motion.div 
          className="absolute bottom-10 left-0 right-0 h-1 bg-nexus-green/50 blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: stage > 0 ? 1 : 0 }}
        />

        {/* Shield Indicator at max capacity */}
        <AnimatePresence>
          {stage >= data.length && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-nexus-green/10 border border-nexus-green/50 text-nexus-green text-[9px] font-mono tracking-widest uppercase"
            >
              SHIELD ACTIVE
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Floor Label */}
      <div className="absolute bottom-0 w-full text-center border-t border-nexus-structure pt-3">
        <span className="text-[10px] font-mono tracking-[0.2em] text-nexus-green/70 uppercase">
          Hexagonal Shield (v2.0)
        </span>
      </div>
    </div>
  );
};
