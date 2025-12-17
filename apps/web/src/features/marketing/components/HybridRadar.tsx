/**
 * HybridRadar - Industry-Grade Radar with Image Base
 * 
 * Uses the "Pro Move" strategy:
 * - High-quality IMAGE handles the "pretty" (glows, maps, grids)
 * - REACT handles the "smart" (data numbers, colors, state changes)
 * 
 * Usage:
 * <HybridRadar backgroundImage="/images/radar-bg.jpg" activeRisks={4} />
 * 
 * To use: Save a high-quality radar image to public/images/radar-bg.jpg
 */

import { motion, AnimatePresence } from 'motion/react';
import { Shield, AlertTriangle, Scan, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HybridRadarProps {
  backgroundImage?: string;
  activeRisks: number;
}

export const HybridRadar = ({
  backgroundImage = '/images/radar-bg.jpg',
  activeRisks
}: HybridRadarProps) => {
  const isCritical = activeRisks >= 5;
  const isWarning = activeRisks === 4;

  const theme = isCritical
    ? { color: '#EF4444', label: 'CRITICAL', glow: 'rgba(239, 68, 68, 0.5)' }
    : isWarning
      ? { color: '#F97316', label: 'WARNING', glow: 'rgba(249, 115, 22, 0.5)' }
      : { color: '#10B981', label: 'SECURE', glow: 'rgba(16, 185, 129, 0.4)' };

  return (
    <div className={cn(
      "relative w-full aspect-square max-h-[420px] mx-auto rounded-2xl border overflow-hidden group",
      "bg-surface-nested border-white/10",
      isCritical && "shadow-[0_0_60px_rgba(239,68,68,0.2)]"
    )}>

      {/* 1. THE BASE PLATE (High Quality Image) */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-70 transition-opacity duration-700 group-hover:opacity-85"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          filter: isCritical ? 'hue-rotate(-40deg) saturate(1.5)' : isWarning ? 'hue-rotate(-20deg) saturate(1.2)' : 'none'
        }}
      />

      {/* Fallback gradient if no image */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/80" />

      {/* 2. CONIC SCAN ANIMATION (Code Layer) */}
      <motion.div
        className="absolute inset-[10%] rounded-full pointer-events-none"
        style={{
          background: `conic-gradient(from 0deg, transparent 50%, ${theme.color}40 85%, ${theme.color} 100%)`,
          maskImage: 'radial-gradient(circle, transparent 55%, black 65%, black 85%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 55%, black 65%, black 85%, transparent 100%)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: isCritical ? 2 : 5, repeat: Infinity, ease: "linear" }}
      />

      {/* 3. PULSE RINGS (Warning/Critical) */}
      <AnimatePresence>
        {(isWarning || isCritical) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border-2"
                style={{ borderColor: theme.color }}
                initial={{ width: 100, height: 100, opacity: 0.8 }}
                animate={{
                  width: isCritical ? 500 : 350,
                  height: isCritical ? 500 : 350,
                  opacity: 0
                }}
                transition={{
                  duration: isCritical ? 2 : 3,
                  repeat: Infinity,
                  delay: i * (isCritical ? 0.6 : 1),
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* 4. CENTER HUD (Live Data Display) */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <motion.div
          className="relative flex flex-col items-center justify-center rounded-full border backdrop-blur-xl"
          style={{
            width: 140,
            height: 140,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            borderColor: theme.color,
            boxShadow: `0 0 30px ${theme.glow}, inset 0 0 20px ${theme.glow}`
          }}
          animate={{
            scale: isCritical ? [1, 1.02, 1] : 1,
            boxShadow: isCritical
              ? [`0 0 30px ${theme.glow}`, `0 0 50px ${theme.glow}`, `0 0 30px ${theme.glow}`]
              : `0 0 30px ${theme.glow}`
          }}
          transition={{ duration: 1, repeat: isCritical ? Infinity : 0 }}
        >
          {/* Threat Count */}
          <motion.div
            className="text-5xl font-mono font-bold tracking-tighter"
            style={{ color: theme.color }}
            animate={{ scale: isWarning ? 1.1 : isCritical ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
          >
            {activeRisks}
          </motion.div>

          {/* Label */}
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/60 mt-1">
            Threats
          </div>

          {/* Shield Icon Ring */}
          <div
            className="absolute -bottom-4 px-3 py-1 rounded-full flex items-center gap-1.5"
            style={{
              backgroundColor: '#0a0a0a',
              border: `1px solid ${theme.color}`,
              boxShadow: `0 0 15px ${theme.glow}`
            }}
          >
            {isCritical ? (
              <AlertTriangle className="w-3 h-3" style={{ color: theme.color }} />
            ) : isWarning ? (
              <Shield className="w-3 h-3" style={{ color: theme.color }} />
            ) : (
              <Lock className="w-3 h-3" style={{ color: theme.color }} />
            )}
            <span
              className="text-[8px] font-mono font-bold uppercase tracking-widest"
              style={{ color: theme.color }}
            >
              {theme.label}
            </span>
          </div>

          {/* Inner Decorative Ring */}
          <div
            className="absolute inset-3 rounded-full border border-dashed opacity-30"
            style={{ borderColor: theme.color }}
          />
        </motion.div>
      </div>

      {/* 5. STATUS BADGE */}
      <div className="absolute top-4 left-4 z-20">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-black/70 backdrop-blur-md"
          style={{ borderColor: theme.color }}
        >
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: theme.color }}
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: isCritical ? 0.5 : 1.5, repeat: Infinity }}
          />
          <span
            className="text-[9px] font-mono uppercase tracking-widest font-bold"
            style={{ color: theme.color }}
          >
            {isCritical ? 'BREACH DETECTED' : isWarning ? 'SHIELD ACTIVE' : 'MONITORING'}
          </span>
        </div>
      </div>

      {/* 6. CORNER MARKERS */}
      {['top-4 right-4', 'bottom-4 right-4', 'bottom-4 left-4'].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-6 h-6 border-t border-l opacity-20`} style={{ borderColor: theme.color }} />
      ))}

      {/* 7. SCANLINES OVERLAY */}
      <div
        className="absolute inset-0 z-30 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, ${theme.color} 0px, ${theme.color} 1px, transparent 1px, transparent 3px)`
        }}
      />

      {/* 8. VIGNETTE */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)] pointer-events-none" />
    </div>
  );
};


