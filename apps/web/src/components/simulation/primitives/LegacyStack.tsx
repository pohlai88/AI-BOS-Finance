// ============================================================================
// LEGACY STACK - The decaying left column
// ============================================================================

import { motion, AnimatePresence } from 'motion/react';
import { LegacyBlock, CollapsedRubble } from './BlockPrimitives';
import type { LegacyStackItem, ShakeLevel } from '../types';

interface LegacyStackProps {
  data: LegacyStackItem[];
  stage: number;
  shakeLevel: ShakeLevel;
  isCollapsed: boolean;
}

export const LegacyStack = ({ data, stage, shakeLevel, isCollapsed }: LegacyStackProps) => {
  return (
    <div className="relative flex flex-col justify-end items-center group">
      {/* Background Grid - Blueprint feel */}
      <div className="absolute inset-0 border border-nexus-structure/30 bg-[linear-gradient(45deg,transparent_25%,rgba(255,0,0,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:4px_4px]" />

      {/* Terminal Warning Overlay */}
      <AnimatePresence>
        {shakeLevel !== 'none' && (
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
        )}
      </AnimatePresence>

      {/* The Stack Container */}
      <div className="relative w-64 flex flex-col-reverse gap-1 pb-12 z-10 min-h-[350px]">
        {!isCollapsed ? (
          <AnimatePresence mode="popLayout">
            {data.slice(0, stage).map((block) => (
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

      {/* Floor Label */}
      <div className="absolute bottom-0 w-full text-center border-t border-nexus-structure pt-3">
        <span className="text-[10px] font-mono tracking-[0.2em] text-nexus-noise uppercase">
          Monolithic Architecture (v1.0)
        </span>
      </div>
    </div>
  );
};

