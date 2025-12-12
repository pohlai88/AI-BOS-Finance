/**
 * MagicUIRadar - Premium Radar with Magic UI Components
 * 
 * Combines:
 * - OrbitingCircles (scan sweep)
 * - Ripple (pulse waves)
 * - Custom threat logic (3-stage system)
 * 
 * Usage: <MagicUIRadar activeRisks={4} />
 */

import { motion, AnimatePresence } from 'motion/react';
import { Shield, AlertTriangle, Lock, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrbitingCircles } from '@/components/magicui/orbiting-circles';
import { Ripple } from '@/components/magicui/ripple';

interface MagicUIRadarProps {
  activeRisks: number;
  className?: string;
}

export const MagicUIRadar = ({ activeRisks, className }: MagicUIRadarProps) => {
  const isCritical = activeRisks >= 5;
  const isWarning = activeRisks === 4;
  const isNormal = activeRisks < 4;

  // Theme colors based on threat level
  const theme = isCritical
    ? { 
        color: '#EF4444', 
        label: 'CRITICAL', 
        glow: 'rgba(239, 68, 68, 0.5)',
        ringColor: 'rgba(239, 68, 68, 0.3)',
        scanSpeed: 2
      }
    : isWarning
    ? { 
        color: '#F97316', 
        label: 'WARNING', 
        glow: 'rgba(249, 115, 22, 0.5)',
        ringColor: 'rgba(249, 115, 22, 0.3)',
        scanSpeed: 4
      }
    : { 
        color: '#00D9FF', 
        label: 'SECURE', 
        glow: 'rgba(0, 217, 255, 0.4)',
        ringColor: 'rgba(0, 217, 255, 0.2)',
        scanSpeed: 6
      };

  return (
    <div 
      className={cn(
        'relative w-full aspect-square max-w-[420px] mx-auto',
        isCritical && 'overflow-visible',
        !isCritical && 'overflow-hidden',
        className
      )}
    >
      {/* Background container */}
      <div className="absolute inset-0 rounded-2xl bg-[#020617] border border-white/10">
        
        {/* Atmospheric haze */}
        <div 
          className="absolute inset-0 rounded-2xl opacity-30"
          style={{
            background: `radial-gradient(circle at center, ${theme.color}20 0%, transparent 70%)`
          }}
        />

        {/* Ripple waves (Magic UI) */}
        <Ripple 
          mainCircleSize={80} 
          numCircles={5} 
          mainCircleOpacity={0.15}
          color={theme.color}
          className="[mask-image:radial-gradient(circle,white_30%,transparent_70%)]"
        />

        {/* Concentric rings */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
          <defs>
            <radialGradient id="magicRadarGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={theme.color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={theme.color} stopOpacity="0" />
            </radialGradient>
          </defs>
          
          {/* Glow background */}
          <circle cx="200" cy="200" r="180" fill="url(#magicRadarGlow)" />
          
          {/* Rings */}
          {[60, 100, 140, 180].map((r, i) => (
            <circle
              key={r}
              cx="200"
              cy="200"
              r={r}
              fill="none"
              stroke={theme.color}
              strokeWidth="1"
              strokeOpacity={0.1 + i * 0.05}
              strokeDasharray={i === 3 ? 'none' : '4 4'}
            />
          ))}

          {/* Crosshairs */}
          <line x1="200" y1="20" x2="200" y2="380" stroke={theme.color} strokeWidth="0.5" strokeOpacity="0.15" />
          <line x1="20" y1="200" x2="380" y2="200" stroke={theme.color} strokeWidth="0.5" strokeOpacity="0.15" />
          
          {/* Tick marks */}
          {Array.from({ length: 36 }).map((_, i) => {
            const angle = (i * 10) * Math.PI / 180;
            const isMajor = i % 3 === 0;
            const innerR = isMajor ? 170 : 175;
            const outerR = 180;
            return (
              <line
                key={i}
                x1={200 + innerR * Math.sin(angle)}
                y1={200 - innerR * Math.cos(angle)}
                x2={200 + outerR * Math.sin(angle)}
                y2={200 - outerR * Math.cos(angle)}
                stroke={theme.color}
                strokeWidth={isMajor ? 2 : 1}
                strokeOpacity={isMajor ? 0.5 : 0.2}
              />
            );
          })}
        </svg>

        {/* Orbiting scan line (Magic UI) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <OrbitingCircles 
            radius={150} 
            duration={theme.scanSpeed} 
            path={false}
            iconSize={160}
          >
            {/* Scan wedge */}
            <div 
              className="w-full h-full"
              style={{
                background: `conic-gradient(from -30deg, transparent, ${theme.color}60, ${theme.color}, transparent 60deg)`,
                clipPath: 'polygon(50% 50%, 100% 0%, 100% 50%)',
                transform: 'rotate(-30deg)',
              }}
            />
          </OrbitingCircles>
        </div>

        {/* Warning state: Shield ring */}
        <AnimatePresence>
          {isWarning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div 
                className="w-48 h-48 rounded-full border-2 animate-pulse-glow"
                style={{ borderColor: '#84CC16' }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Critical state: Expanding waves */}
        <AnimatePresence>
          {isCritical && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border-2"
                  style={{ borderColor: theme.color }}
                  initial={{ width: 100, height: 100, opacity: 0.8 }}
                  animate={{ 
                    width: 600, 
                    height: 600, 
                    opacity: 0 
                  }}
                  transition={{ 
                    duration: 2.5, 
                    repeat: Infinity, 
                    delay: i * 0.6,
                    ease: 'easeOut'
                  }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Center HUD */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <motion.div 
            className="relative flex flex-col items-center justify-center rounded-full border-2 backdrop-blur-xl"
            style={{ 
              width: isWarning ? 130 : 120,
              height: isWarning ? 130 : 120,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              borderColor: theme.color,
              boxShadow: `0 0 40px ${theme.glow}, inset 0 0 30px ${theme.glow}`
            }}
            animate={{ 
              scale: isCritical ? [1, 1.05, 1] : isWarning ? 1.1 : 1,
            }}
            transition={{ duration: 1, repeat: isCritical ? Infinity : 0 }}
          >
            {/* Threat Count */}
            <motion.span 
              className="text-5xl font-mono font-bold tracking-tighter"
              style={{ color: theme.color }}
              animate={{ scale: isCritical ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
            >
              {activeRisks}
            </motion.span>
            
            {/* Label */}
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/60 mt-1">
              Threats
            </span>

            {/* Inner ring */}
            <div 
              className="absolute inset-2 rounded-full border border-dashed opacity-20"
              style={{ borderColor: theme.color }}
            />
          </motion.div>
        </div>

        {/* Status badge */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
          <motion.div 
            className="flex items-center gap-2 px-4 py-2 rounded-full border bg-black/80 backdrop-blur-md"
            style={{ borderColor: theme.color }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {isCritical ? (
              <AlertTriangle className="w-4 h-4" style={{ color: theme.color }} />
            ) : isWarning ? (
              <ShieldCheck className="w-4 h-4" style={{ color: '#84CC16' }} />
            ) : (
              <Lock className="w-4 h-4" style={{ color: theme.color }} />
            )}
            <span 
              className="text-xs font-mono font-bold uppercase tracking-widest"
              style={{ color: isCritical ? theme.color : isWarning ? '#84CC16' : theme.color }}
            >
              {theme.label}
            </span>
            
            {/* Pulse indicator */}
            <motion.div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: theme.color }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: isCritical ? 0.5 : 1.5, repeat: Infinity }}
            />
          </motion.div>
        </div>

        {/* Corner markers */}
        <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 opacity-30" style={{ borderColor: theme.color }} />
        <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 opacity-30" style={{ borderColor: theme.color }} />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 opacity-30" style={{ borderColor: theme.color }} />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 opacity-30" style={{ borderColor: theme.color }} />

        {/* Scanlines overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.02] rounded-2xl"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, ${theme.color} 0px, ${theme.color} 1px, transparent 1px, transparent 4px)`
          }}
        />
      </div>
    </div>
  );
};

