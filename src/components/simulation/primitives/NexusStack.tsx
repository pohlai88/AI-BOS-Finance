// ============================================================================
// NEXUS STACK - The stable right column
// ============================================================================

import { motion, AnimatePresence } from 'motion/react';
import { NexusBlock } from './BlockPrimitives';
import type { NexusStackItem } from '../types';

interface NexusStackProps {
  data: NexusStackItem[];
  stage: number;
}

export const NexusStack = ({ data, stage }: NexusStackProps) => {
  return (
    <div className="relative flex flex-col justify-end items-center">
      {/* Background Grid - Crystal feel */}
      <div className="absolute inset-0 border border-nexus-structure/30 bg-[linear-gradient(45deg,transparent_25%,rgba(40,231,162,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:4px_4px]" />

      {/* Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-nexus-green/5 to-transparent opacity-50" />

      {/* The Stack Container */}
      <div className="relative w-64 flex flex-col-reverse gap-1 pb-12 z-10 min-h-[350px]">
        <AnimatePresence mode="popLayout">
          {data.slice(0, stage).map((block, i) => (
            <NexusBlock 
              key={block.id} 
              data={block}
              index={i}
            />
          ))}
        </AnimatePresence>

        {/* Scan Beam */}
        <motion.div
          className="absolute top-0 left-[-20%] right-[-20%] h-[1px] bg-gradient-to-r from-transparent via-nexus-green/50 to-transparent pointer-events-none"
          animate={{ top: ['100%', '0%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />

        {/* Vertical connection line */}
        <div className="absolute left-1/2 top-0 bottom-12 w-px bg-gradient-to-b from-nexus-green/20 via-nexus-green/10 to-transparent -translate-x-1/2 z-0" />
      </div>

      {/* Floor Label */}
      <div className="absolute bottom-0 w-full text-center border-t border-nexus-structure pt-3">
        <span className="text-[10px] font-mono tracking-[0.2em] text-nexus-green/70 uppercase">
          Hexagonal Architecture (v2.0)
        </span>
      </div>
    </div>
  );
};

