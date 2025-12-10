// ============================================================================
// NEXUS STACK V3 - The Vertebrae Column
// Clean background, heavy physics, interlocking spine system
// ============================================================================

import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck } from 'lucide-react';
import { NexusVertebraBlock } from './BlockPrimitives';
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
      
      {/* Clean Background (No blurry noise) */}
      <div className="absolute inset-0 bg-[#050a07] border border-white/5 overflow-hidden">
        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:2rem_2rem]" />
      </div>

      {/* The Solid Vertebrae Stack */}
      <div className="relative w-72 pb-12 z-10 flex flex-col-reverse min-h-[350px]">
        
        {/* The Central Spine (Static reference line) */}
        <div className="absolute left-1/2 bottom-12 top-0 w-[1px] bg-nexus-green/10 -translate-x-1/2 z-0" />

        {/* The Interlocking Blocks */}
        <AnimatePresence mode="popLayout">
          {activeBlocks.map((block, index) => (
            <NexusVertebraBlock 
              key={block.id} 
              data={block}
              index={index}
              isNew={index === stage - 1}
            />
          ))}
        </AnimatePresence>

        {/* Baseplate */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-1 bg-nexus-green shadow-[0_0_20px_rgba(40,231,162,0.5)] rounded-full" />

        {/* Shield Active Badge */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-nexus-green/10 border border-nexus-green text-nexus-green text-[9px] font-mono tracking-widest uppercase flex items-center gap-2"
            >
              <ShieldCheck className="w-3 h-3" />
              SHIELD ACTIVE
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floor Label */}
      <div className="absolute bottom-0 w-full text-center border-t border-nexus-green/20 pt-3">
        <span className="text-[10px] font-mono tracking-[0.2em] text-nexus-green uppercase flex items-center justify-center gap-2">
          <ShieldCheck className="w-3 h-3" />
          Nexus Vertebrae (v2.0)
        </span>
      </div>
    </div>
  );
};
