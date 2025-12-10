/**
 * RiskRadar - Ultimate Merged Component
 * 
 * Combines:
 * - Cinema-quality visuals from ForensicRadarEnhanced
 * - Reactive threat logic (Green → Orange → Red)
 * 
 * STATE NORMAL (< 4): Nexus Cyan, standard scan
 * STATE WARNING (= 4): Tangy Orange, lime shield ring
 * STATE CRITICAL (5+): Red Rage, expanding waves, fast scan
 */

import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { AlertTriangle, Scan, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RiskRadarProps {
  activeRisks: number;
}

export const RiskRadar = ({ activeRisks }: RiskRadarProps) => {
  // 1. LOGIC STATE
  const isWarning = activeRisks === 4;
  const isCritical = activeRisks >= 5;

  // 2. THEME ENGINE
  const theme = isCritical
    ? { primary: '#EF4444', secondary: '#991B1B', glow: '18 -5' } // Red Rage
    : isWarning
    ? { primary: '#F97316', secondary: '#C2410C', glow: '12 -3' } // Tangy Orange
    : { primary: '#00D9FF', secondary: '#006699', glow: '8 -2' }; // Nexus Cyan

  const [scanAngle, setScanAngle] = useState(0);

  // Track scan angle for intersection effects
  useEffect(() => {
    const interval = setInterval(() => {
      setScanAngle((prev) => (prev + (isCritical ? 4 : 1)) % 360); // Spin faster on critical
    }, 14);
    return () => clearInterval(interval);
  }, [isCritical]);

  return (
    <div className={cn(
      "relative w-full aspect-square max-h-[400px] mx-auto rounded-2xl border border-white/10 bg-[#000814] p-6 overflow-hidden transition-colors duration-1000",
      isCritical && "overflow-visible shadow-[0_0_50px_rgba(239,68,68,0.2)]"
    )}>
      
      {/* UI HEADER */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border bg-black/50 backdrop-blur-md transition-colors duration-500"
             style={{ borderColor: theme.primary }}>
          {isCritical ? (
            <AlertTriangle className="w-4 h-4 animate-pulse" style={{ color: theme.primary }} />
          ) : isWarning ? (
            <Shield className="w-4 h-4" style={{ color: theme.primary }} />
          ) : (
            <Scan className="w-4 h-4" style={{ color: theme.primary }} />
          )}
          <span className="text-[10px] font-mono uppercase tracking-widest font-bold transition-colors duration-500"
                style={{ color: theme.primary }}>
            {isCritical ? 'BREACH DETECTED' : isWarning ? 'SHIELD ACTIVE' : 'LIVE SCAN'}
          </span>
        </div>
      </div>

      <svg viewBox="0 0 540 540" className="w-full h-full relative z-10" style={{ overflow: 'visible' }}>
        <defs>
          {/* DYNAMIC GLOW FILTER */}
          <filter id="radarGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${theme.glow}`}
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* DYNAMIC BEAM GRADIENT */}
          <radialGradient id="beamGrad" cx="30%" cy="50%">
            <stop offset="0%" stopColor={theme.primary} stopOpacity="0.7" />
            <stop offset="100%" stopColor={theme.secondary} stopOpacity="0" />
          </radialGradient>

          {/* ATMOSPHERIC HAZE */}
          <radialGradient id="haze" cx="50%" cy="50%">
            <stop offset="0%" stopColor={theme.primary} stopOpacity="0.05" />
            <stop offset="100%" stopColor="#000814" stopOpacity="0.8" />
          </radialGradient>
        </defs>

        {/* BACKGROUND HAZE */}
        <circle cx="270" cy="270" r="260" fill="url(#haze)" />

        {/* --- CRITICAL LAYER: EXPANDING WAVES (The "Bigger" Effect) --- */}
        <AnimatePresence>
          {isCritical && (
            <g>
              {[0, 1, 2].map((i) => (
                <motion.circle
                  key={`rage-wave-${i}`}
                  cx="270" cy="270" r="50"
                  fill="none"
                  stroke={theme.primary}
                  strokeWidth="2"
                  initial={{ r: 50, opacity: 1, strokeWidth: 4 }}
                  animate={{ r: 450, opacity: 0, strokeWidth: 0 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.6,
                    ease: "easeOut"
                  }}
                />
              ))}
            </g>
          )}
        </AnimatePresence>

        {/* --- GRID RINGS --- */}
        {[51, 102, 153, 204, 255].map((r, index) => (
          <motion.circle
            key={`ring-${index}`}
            cx="270" cy="270" r={r}
            fill="none"
            stroke={theme.primary}
            strokeWidth={1}
            initial={false}
            animate={{ stroke: theme.primary, opacity: 0.15 + index * 0.05 }}
            transition={{ duration: 0.5 }}
            filter="url(#radarGlow)"
          />
        ))}

        {/* --- ROTATING SWEEP BEAM --- */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ 
            duration: isCritical ? 2 : 5, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          style={{ originX: '270px', originY: '270px' }}
        >
          {/* The Wedge */}
          <path
            d="M 270,270 L 525,270 A 255,255 0 0,1 435,465 Z"
            fill="url(#beamGrad)"
            opacity="0.3"
            filter="url(#radarGlow)"
          />
          {/* The Leading Edge Line */}
          <line
            x1="270" y1="270" x2="525" y2="270"
            stroke={theme.primary}
            strokeWidth="2"
            filter="url(#radarGlow)"
          />
        </motion.g>

        {/* --- INTERSECTION GLOWS (The High Fidelity Touch) --- */}
        {/* These dots appear where the scan line crosses a grid ring */}
        {[51, 102, 153, 204, 255].map((radius, index) => {
          const intersectAngle = (scanAngle * Math.PI) / 180;
          const x = 270 + radius * Math.cos(intersectAngle);
          const y = 270 + radius * Math.sin(intersectAngle);

          return (
            <motion.circle
              key={`intersect-${index}`}
              cx={x} cy={y} r={isCritical ? 5 : 3}
              fill={theme.primary}
              opacity={0}
              animate={{ opacity: [0, 1, 0] }}
              transition={{
                duration: 0.3,
                repeat: Infinity,
                repeatDelay: isCritical ? 0.5 : 4.7,
              }}
              filter="url(#radarGlow)"
            />
          );
        })}

        {/* --- THE CORE --- */}
        <g transform="translate(270, 270)">
          {/* Core Shield Logic */}
          <AnimatePresence>
            {(isWarning || isCritical) && (
              <motion.circle
                initial={{ r: 0, opacity: 0 }}
                animate={{ r: 70, opacity: 1 }}
                exit={{ r: 0, opacity: 0 }}
                fill="none"
                stroke={isWarning ? "#84CC16" : theme.primary}
                strokeWidth="3"
                strokeDasharray="4, 4"
                filter="url(#radarGlow)"
              />
            )}
          </AnimatePresence>

          <circle r="45" fill="#000814" stroke={theme.primary} strokeWidth="2" />
          
          <text
            y="10"
            textAnchor="middle"
            fill={theme.primary}
            fontSize="32"
            fontWeight="bold"
            fontFamily="monospace"
            style={{ filter: 'url(#radarGlow)' }}
          >
            {activeRisks}
          </text>
        </g>

        {/* --- SCANLINE OVERLAY --- */}
        <g opacity="0.1">
          {Array.from({ length: 10 }).map((_, i) => (
            <line 
              key={i} 
              x1="0" y1={i * 54} x2="540" y2={i * 54} 
              stroke={theme.primary} 
              strokeWidth="1" 
            />
          ))}
        </g>

      </svg>
    </div>
  );
};
