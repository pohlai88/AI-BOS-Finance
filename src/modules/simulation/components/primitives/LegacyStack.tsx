// ============================================================================
// LEGACY STACK - The decaying left column
// ============================================================================

import { motion, AnimatePresence } from 'motion/react'
import { LegacyBlock, CollapsedRubble } from './BlockPrimitives'
import type { LegacyStackItem, ShakeLevel } from '../types'

interface LegacyStackProps {
  data: LegacyStackItem[]
  stage: number
  shakeLevel: ShakeLevel
  isCollapsed: boolean
}

export const LegacyStack = ({
  data,
  stage,
  shakeLevel,
  isCollapsed,
}: LegacyStackProps) => {
  return (
    <div className="group relative flex flex-col items-center justify-end">
      {/* Background Grid - Blueprint feel */}
      <div className="border-nexus-structure/30 absolute inset-0 border bg-[linear-gradient(45deg,transparent_25%,rgba(255,0,0,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:4px_4px]" />

      {/* Terminal Warning Overlay */}
      {/* 🛡️ GOVERNANCE: Uses status-error tokens instead of hardcoded red colors */}
      <AnimatePresence>
        {shakeLevel !== 'none' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between border-b border-status-error/20 bg-status-error/10 p-4 backdrop-blur-sm"
          >
            <span className="animate-pulse font-mono text-[10px] text-status-error">
              ⚠ WARNING: STRUCTURAL FAILURE IMMINENT
            </span>
            <span className="font-mono text-[10px] text-status-error">
              ERR_CODE_0x{stage.toString(16).toUpperCase()}F
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Stack Container */}
      <div className="relative z-10 flex min-h-[350px] w-64 flex-col-reverse gap-1 pb-12">
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
      <div className="border-nexus-structure absolute bottom-0 w-full border-t pt-3 text-center">
        <span className="text-nexus-noise font-mono text-[10px] uppercase tracking-[0.2em]">
          Monolithic Architecture (v1.0)
        </span>
      </div>
    </div>
  )
}
