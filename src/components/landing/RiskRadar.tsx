/**
 * RiskRadar - Premium Threat Detection Visualization
 * 
 * Inspired by cybersecurity radar aesthetics with glowing shield center.
 * Features smooth animations, particle effects, and professional glow.
 */

import { motion, AnimatePresence } from 'motion/react';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RiskRadarProps {
  activeRisks: number;
  systemStatus?: string;
}

// Color themes
const THEMES = {
  normal: { 
    primary: '#22D3EE', // Cyan
    secondary: '#0891B2',
    glow: 'rgba(34, 211, 238, 0.6)',
  },
  warning: { 
    primary: '#F97316', 
    secondary: '#EA580C',
    glow: 'rgba(249, 115, 22, 0.6)',
  },
  critical: { 
    primary: '#EF4444', 
    secondary: '#DC2626',
    glow: 'rgba(239, 68, 68, 0.6)',
  },
} as const;

export const RiskRadar = ({ activeRisks }: RiskRadarProps) => {
  const isWarning = activeRisks === 4;
  const isCritical = activeRisks >= 5;
  const theme = isCritical ? THEMES.critical : isWarning ? THEMES.warning : THEMES.normal;

  // Generate stable particle positions
  const particles = Array.from({ length: 12 }, (_, i) => ({
    angle: (i * 30) + (i % 2 === 0 ? 10 : -5),
    radius: 140 + (i % 3) * 25,
    size: 2 + (i % 2),
    delay: i * 0.3,
  }));

  return (
    <div className={cn(
      "relative w-full aspect-square max-h-[380px] mx-auto bg-[#0a1628] rounded-lg p-4 transition-all duration-1000",
      isCritical ? "overflow-visible" : "overflow-hidden"
    )}>
      
      {/* Ambient glow behind everything */}
      <div 
        className="absolute inset-0 rounded-lg opacity-30 blur-xl transition-colors duration-1000"
        style={{ backgroundColor: theme.primary }}
      />

      {/* Status Badge */}
      <div className="absolute top-3 left-3 z-20">
        <div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-black/40 backdrop-blur-sm"
          style={{ borderColor: theme.primary }}
        >
          <motion.div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: theme.primary }}
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span 
            className="text-[9px] font-mono uppercase tracking-widest font-semibold"
            style={{ color: theme.primary }}
          >
            {isCritical ? 'BREACH DETECTED' : isWarning ? 'SHIELD ACTIVE' : 'MONITORING'}
          </span>
        </div>
      </div>

      <svg 
        viewBox="0 0 400 400" 
        className="w-full h-full relative z-10"
        style={isCritical ? { overflow: 'visible' } : undefined}
      >
        <defs>
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Strong glow for shield */}
          <filter id="shieldGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Scan beam gradient */}
          <linearGradient id="scanGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={theme.primary} stopOpacity="0.8" />
            <stop offset="100%" stopColor={theme.primary} stopOpacity="0" />
          </linearGradient>
          
          {/* Radial fade for scan */}
          <radialGradient id="scanRadial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={theme.primary} stopOpacity="0.4" />
            <stop offset="100%" stopColor={theme.primary} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* === CRITICAL: EXPANDING WAVES === */}
        <AnimatePresence>
          {isCritical && (
            <g>
              {[0, 1, 2, 3].map((i) => (
                <motion.circle
                  key={`wave-${i}`}
                  cx="200" cy="200"
                  fill="none"
                  stroke={theme.primary}
                  strokeWidth="2"
                  initial={{ r: 60, opacity: 0.6 }}
                  animate={{ r: 500, opacity: 0 }}
                  transition={{ duration: 4, repeat: Infinity, delay: i * 1, ease: "easeOut" }}
                />
              ))}
            </g>
          )}
        </AnimatePresence>

        {/* === CONCENTRIC RINGS === */}
        {[60, 100, 140, 180].map((r, i) => (
          <circle
            key={`ring-${i}`}
            cx="200" cy="200" r={r}
            fill="none"
            stroke={theme.primary}
            strokeWidth="1"
            strokeOpacity={0.15 + i * 0.05}
            filter="url(#glow)"
          />
        ))}

        {/* === GRID LINES === */}
        <g opacity="0.1">
          <line x1="200" y1="10" x2="200" y2="390" stroke={theme.primary} strokeWidth="1" />
          <line x1="10" y1="200" x2="390" y2="200" stroke={theme.primary} strokeWidth="1" />
          <line x1="60" y1="60" x2="340" y2="340" stroke={theme.primary} strokeWidth="0.5" />
          <line x1="340" y1="60" x2="60" y2="340" stroke={theme.primary} strokeWidth="0.5" />
        </g>

        {/* === OUTER RING (Rotating) === */}
        <motion.circle
          cx="200" cy="200" r="185"
          fill="none"
          stroke={theme.primary}
          strokeWidth="2"
          strokeDasharray="8,4,2,4"
          strokeOpacity="0.5"
          filter="url(#glow)"
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: '200px 200px' }}
        />

        {/* === SCAN BEAM (Clock Pointer) === */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ 
            duration: isCritical ? 1.5 : isWarning ? 3 : 6, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          style={{ transformOrigin: '200px 200px' }}
        >
          {/* Scan line */}
          <line 
            x1="200" y1="200" x2="200" y2="20" 
            stroke={theme.primary} 
            strokeWidth="2"
            filter="url(#glow)"
          />
          
          {/* Scan sweep (pie slice) - 60 degree arc */}
          <path 
            d="M 200,200 L 200,20 A 180,180 0 0,1 355.88,110 Z" 
            fill={theme.primary}
            opacity="0.15"
          />
          
          {/* Brighter edge of sweep */}
          <path 
            d="M 200,200 L 200,20 A 180,180 0 0,1 290,45 Z" 
            fill={theme.primary}
            opacity="0.25"
          />
        </motion.g>

        {/* === FLOATING PARTICLES === */}
        {particles.map((p, i) => {
          const rad = (p.angle * Math.PI) / 180;
          const x = 200 + Math.cos(rad) * p.radius;
          const y = 200 + Math.sin(rad) * p.radius;
          return (
            <motion.circle
              key={`particle-${i}`}
              cx={x} cy={y} r={p.size}
              fill={theme.primary}
              filter="url(#glow)"
              animate={{ 
                opacity: [0.3, 0.8, 0.3],
                r: [p.size, p.size + 1, p.size]
              }}
              transition={{ 
                duration: 2 + (i % 3), 
                repeat: Infinity, 
                delay: p.delay 
              }}
            />
          );
        })}

        {/* === CENTER SHIELD === */}
        <g transform="translate(200, 200)">
          {/* Shield glow background */}
          <motion.circle
            r="55"
            fill={theme.primary}
            opacity="0.15"
            filter="url(#shieldGlow)"
            animate={{ r: [55, 60, 55], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Shield shape */}
          <motion.path
            d="M 0,-45 
               C 25,-45 40,-35 40,-15 
               C 40,10 25,35 0,50 
               C -25,35 -40,10 -40,-15 
               C -40,-35 -25,-45 0,-45 Z"
            fill="none"
            stroke={theme.primary}
            strokeWidth="2.5"
            filter="url(#shieldGlow)"
            animate={{ 
              scale: isWarning ? 1.15 : isCritical ? 1.1 : 1,
            }}
            transition={{ type: "spring", stiffness: 200 }}
          />
          
          {/* Shield inner glow */}
          <path
            d="M 0,-40 
               C 22,-40 35,-30 35,-12 
               C 35,10 22,32 0,45 
               C -22,32 -35,10 -35,-12 
               C -35,-30 -22,-40 0,-40 Z"
            fill={theme.primary}
            opacity="0.2"
          />
          
          {/* Keyhole / Lock icon in center */}
          <circle cx="0" cy="-8" r="8" fill={theme.primary} opacity="0.9" />
          <rect x="-4" y="-2" width="8" height="18" rx="2" fill={theme.primary} opacity="0.9" />
          
          {/* Threat count badge */}
          <g transform="translate(0, 60)">
            <rect x="-20" y="-10" width="40" height="20" rx="4" fill="#0a1628" stroke={theme.primary} strokeWidth="1" />
            <text 
              y="5" 
              textAnchor="middle" 
              fill={theme.primary}
              fontSize="14" 
              fontWeight="bold"
              fontFamily="monospace"
            >
              {activeRisks}
            </text>
          </g>
        </g>

        {/* === WARNING: LIME SHIELD RING === */}
        <AnimatePresence>
          {isWarning && (
            <motion.circle
              cx="200" cy="200" r="80"
              fill="none"
              stroke="#84CC16"
              strokeWidth="2"
              strokeDasharray="12, 6"
              filter="url(#glow)"
              initial={{ opacity: 0, rotate: 0 }}
              animate={{ opacity: 1, rotate: 360 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: '200px 200px' }}
            />
          )}
        </AnimatePresence>

        {/* === QUADRANT LABELS === */}
        {[
          { label: 'IFRS', x: 355, y: 200 },
          { label: 'SOX', x: 200, y: 375 },
          { label: 'COSO', x: 45, y: 200 },
          { label: 'TAX', x: 200, y: 30 },
        ].map((q, i) => (
          <text
            key={i}
            x={q.x}
            y={q.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={theme.primary}
            fontSize="10"
            fontWeight="600"
            letterSpacing="2"
            fontFamily="monospace"
            opacity="0.7"
          >
            {q.label}
          </text>
        ))}
      </svg>

      {/* === CRITICAL FLASH OVERLAY === */}
      <AnimatePresence>
        {isCritical && (
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{ backgroundColor: theme.primary }}
          />
        )}
      </AnimatePresence>

      {/* Bottom Label */}
      <div className="absolute bottom-2 left-0 right-0 text-center">
        <span 
          className="text-[8px] font-mono uppercase tracking-widest"
          style={{ color: theme.primary, opacity: 0.5 }}
        >
          NexusCanon Threat Grid
        </span>
      </div>
    </div>
  );
};
