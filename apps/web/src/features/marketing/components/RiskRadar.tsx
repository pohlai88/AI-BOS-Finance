/**
 * RiskRadar - Ultra High-Fidelity with Threat Logic
 * 
 * Combines ForensicRadarEnhanced premium visuals with reactive threat logic.
 * Target: 98%+ match to reference images + dynamic threat response.
 */

import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState, useMemo } from 'react';
import { AlertTriangle, Scan, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RiskRadarProps {
  activeRisks: number;
}

interface ParticleData {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  delay: number;
}

export const RiskRadar = ({ activeRisks }: RiskRadarProps) => {
  // LOGIC STATE
  const isWarning = activeRisks === 4;
  const isCritical = activeRisks >= 5;

  // THEME ENGINE
  const theme = isCritical
    ? { primary: '#EF4444', secondary: '#991B1B', name: 'critical' }
    : isWarning
      ? { primary: '#F97316', secondary: '#C2410C', name: 'warning' }
      : { primary: '#00D9FF', secondary: '#006699', name: 'normal' };

  // Generate stable particles
  const particles = useMemo<ParticleData[]>(() => {
    const result: ParticleData[] = [];
    for (let i = 0; i < 50; i++) {
      const angle = (Math.PI * 2 * i) / 50 + (i % 3) * 0.2;
      const distance = 70 + (i % 5) * 35;
      result.push({
        id: i,
        x: 270 + Math.cos(angle) * distance,
        y: 270 + Math.sin(angle) * distance,
        size: 1.5 + (i % 3),
        opacity: 0.3 + (i % 4) * 0.15,
        delay: (i % 8) * 0.3,
      });
    }
    return result;
  }, []);

  const [scanAngle, setScanAngle] = useState(0);

  useEffect(() => {
    const speed = isCritical ? 3 : 1;
    const interval = setInterval(() => {
      setScanAngle((prev) => (prev + speed) % 360);
    }, 14);
    return () => clearInterval(interval);
  }, [isCritical]);

  return (
    <div className={cn(
      "relative w-full aspect-square max-h-[420px] mx-auto rounded-xl border border-white/10 bg-background overflow-hidden transition-all duration-700",
      isCritical && "overflow-visible shadow-[0_0_60px_rgba(239,68,68,0.3)]"
    )}>

      {/* STATUS BADGE */}
      <div className="absolute top-4 left-4 z-20">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-black/60 backdrop-blur-md"
          style={{ borderColor: theme.primary }}
        >
          {isCritical ? (
            <AlertTriangle className="w-3.5 h-3.5 animate-pulse" style={{ color: theme.primary }} />
          ) : isWarning ? (
            <Shield className="w-3.5 h-3.5" style={{ color: theme.primary }} />
          ) : (
            <Scan className="w-3.5 h-3.5" style={{ color: theme.primary }} />
          )}
          <span
            className="text-[9px] font-mono uppercase tracking-widest font-bold"
            style={{ color: theme.primary }}
          >
            {isCritical ? 'BREACH DETECTED' : isWarning ? 'SHIELD ACTIVE' : 'LIVE SCAN'}
          </span>
        </div>
      </div>

      <svg viewBox="0 0 540 540" className="w-full h-full">
        <defs>
          {/* SOFT GLOW */}
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* INTENSE GLOW */}
          <filter id="intenseGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* BEAM GRADIENT */}
          <radialGradient id="beamGrad" cx="30%" cy="50%">
            <stop offset="0%" stopColor={theme.primary} stopOpacity="0.7" />
            <stop offset="40%" stopColor={theme.primary} stopOpacity="0.3" />
            <stop offset="100%" stopColor={theme.secondary} stopOpacity="0" />
          </radialGradient>

          {/* SWEEP LINE GRADIENT */}
          <linearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={theme.primary} stopOpacity="0" />
            <stop offset="70%" stopColor={theme.primary} stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.9" />
          </linearGradient>

          {/* ATMOSPHERIC HAZE */}
          <radialGradient id="haze" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#000814" stopOpacity="0" />
            <stop offset="60%" stopColor="#000C1A" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#001529" stopOpacity="0.9" />
          </radialGradient>
        </defs>

        {/* ATMOSPHERIC BACKGROUND */}
        <circle cx="270" cy="270" r="265" fill="url(#haze)" />

        {/* CRITICAL: EXPANDING RAGE WAVES */}
        <AnimatePresence>
          {isCritical && (
            <g>
              {[0, 1, 2, 3].map((i) => (
                <motion.circle
                  key={`wave-${i}`}
                  cx="270" cy="270"
                  fill="none"
                  stroke={theme.primary}
                  initial={{ r: 50, opacity: 0.7, strokeWidth: 3 }}
                  animate={{ r: 400, opacity: 0, strokeWidth: 1 }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
                />
              ))}
            </g>
          )}
        </AnimatePresence>

        {/* CONCENTRIC RINGS (5 layers) */}
        {[
          { r: 51, opacity: 0.15, width: 0.8 },
          { r: 102, opacity: 0.20, width: 1.0 },
          { r: 153, opacity: 0.25, width: 1.0 },
          { r: 204, opacity: 0.30, width: 1.2 },
          { r: 255, opacity: 0.40, width: 1.5 },
        ].map((ring, index) => (
          <circle
            key={`ring-${index}`}
            cx="270" cy="270" r={ring.r}
            fill="none"
            stroke={theme.primary}
            strokeWidth={ring.width}
            opacity={ring.opacity}
            filter="url(#softGlow)"
          />
        ))}

        {/* RADIAL TICK MARKS (72 ticks, every 5 degrees) */}
        {Array.from({ length: 72 }).map((_, i) => {
          const angle = (i * 5 * Math.PI) / 180 - Math.PI / 2;
          const isMajor = i % 6 === 0;
          const innerRadius = 248;
          const outerRadius = isMajor ? 262 : 255;
          const x1 = 270 + innerRadius * Math.cos(angle);
          const y1 = 270 + innerRadius * Math.sin(angle);
          const x2 = 270 + outerRadius * Math.cos(angle);
          const y2 = 270 + outerRadius * Math.sin(angle);

          return (
            <line
              key={`tick-${i}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={theme.primary}
              strokeWidth={isMajor ? 1.5 : 0.6}
              opacity={isMajor ? 0.7 : 0.3}
              filter={isMajor ? 'url(#softGlow)' : undefined}
            />
          );
        })}

        {/* CROSSHAIRS */}
        <line x1="270" y1="15" x2="270" y2="525" stroke={theme.primary} strokeWidth="0.5" opacity="0.15" />
        <line x1="15" y1="270" x2="525" y2="270" stroke={theme.primary} strokeWidth="0.5" opacity="0.15" />

        {/* SCATTERED PARTICLES */}
        {particles.map((p) => (
          <motion.circle
            key={p.id}
            cx={p.x} cy={p.y} r={p.size}
            fill={theme.primary}
            opacity={p.opacity}
            filter="url(#softGlow)"
            animate={{ opacity: [p.opacity, p.opacity * 0.3, p.opacity], r: [p.size, p.size * 1.3, p.size] }}
            transition={{ duration: 1.5 + (p.id % 3) * 0.5, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
          />
        ))}

        {/* ROTATING SWEEP SYSTEM */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: isCritical ? 2 : 5, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '270px', originY: '270px' }}
        >
          {/* PRIMARY SWEEP WEDGE */}
          <path
            d="M 270,270 L 525,270 A 255,255 0 0,1 435,465 Z"
            fill="url(#beamGrad)"
            opacity="0.35"
            filter="url(#intenseGlow)"
          />

          {/* SECONDARY SWEEP (brighter, narrower) */}
          <path
            d="M 270,270 L 525,270 A 255,255 0 0,1 485,380 Z"
            fill={theme.primary}
            opacity="0.12"
          />

          {/* RADIAL SCAN LINE */}
          <line
            x1="270" y1="270" x2="525" y2="270"
            stroke="url(#sweepGrad)"
            strokeWidth="2.5"
            filter="url(#intenseGlow)"
          />

          {/* END POINT GLOW */}
          <circle cx="525" cy="270" r="5" fill={theme.primary} opacity="0.8" filter="url(#intenseGlow)" />
          <circle cx="525" cy="270" r="2.5" fill="#FFFFFF" opacity="0.95" />
        </motion.g>

        {/* RING INTERSECTION GLOWS */}
        {[51, 102, 153, 204, 255].map((radius, index) => {
          const rad = (scanAngle * Math.PI) / 180;
          const x = 270 + radius * Math.cos(rad);
          const y = 270 + radius * Math.sin(rad);

          return (
            <motion.circle
              key={`intersect-${index}`}
              cx={x} cy={y} r={4}
              fill={theme.primary}
              opacity={0}
              animate={{ opacity: [0, 0.9, 0], r: [2, 5, 2] }}
              transition={{ duration: 0.25, repeat: Infinity, repeatDelay: isCritical ? 0.4 : 4.75, ease: 'easeOut' }}
              filter="url(#intenseGlow)"
            />
          );
        })}

        {/* WARNING/CRITICAL: SHIELD RING */}
        <AnimatePresence>
          {(isWarning || isCritical) && (
            <motion.circle
              cx="270" cy="270" r="75"
              fill="none"
              stroke={isWarning ? "#84CC16" : theme.primary}
              strokeWidth="2.5"
              strokeDasharray="12, 6"
              filter="url(#softGlow)"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, rotate: 360 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '270px 270px' }}
            />
          )}
        </AnimatePresence>

        {/* CENTER CORE */}
        <g>
          {/* Core Glow */}
          <motion.circle
            cx="270" cy="270" r="50"
            fill={theme.primary}
            opacity="0.15"
            filter="url(#intenseGlow)"
            animate={{ r: [48, 55, 48], opacity: [0.12, 0.2, 0.12] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Core Plate */}
          <circle cx="270" cy="270" r="48" fill="#000814" stroke={theme.primary} strokeWidth="2" />

          {/* Threat Count */}
          <motion.text
            x="270" y="280"
            textAnchor="middle"
            fill={theme.primary}
            fontSize="34"
            fontWeight="bold"
            fontFamily="monospace"
            filter="url(#softGlow)"
            animate={{ scale: isWarning ? 1.15 : isCritical ? 1.1 : 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            {activeRisks}
          </motion.text>

          {/* Label */}
          <text
            x="270" y="300"
            textAnchor="middle"
            fill={theme.primary}
            fontSize="8"
            letterSpacing="2"
            opacity="0.7"
            fontFamily="monospace"
          >
            THREATS
          </text>
        </g>

        {/* OUTER RING WITH PULSE */}
        <motion.circle
          cx="270" cy="270" r="262"
          fill="none"
          stroke={theme.primary}
          strokeWidth="2"
          opacity="0.5"
          filter="url(#softGlow)"
          animate={{ opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* SCANLINE ARTIFACTS */}
        <g opacity="0.04">
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={i} x1="15" y1={60 + i * 55} x2="525" y2={60 + i * 55} stroke={theme.primary} strokeWidth="1" />
          ))}
        </g>
      </svg>
    </div>
  );
};
