/**
 * TacticalRadar - Military-Style Radar System
 * 
 * Based on reference design with:
 * - Full 360° degree markings
 * - Labeled targets (Alpha, Beta, etc.)
 * - Gradient scan sweep
 * - Corner HUD brackets
 * - "SCANNING" status indicator
 */

import { motion } from 'motion/react';
import { Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Target {
  id: string;
  label: string;
  angle: number; // 0-360 degrees
  distance: number; // 0-1 (center to edge)
  color: string;
  size?: number;
}

interface TacticalRadarProps {
  targets?: Target[];
  scanSpeed?: number;
  className?: string;
  showHeader?: boolean;
}

const defaultTargets: Target[] = [
  { id: 'alpha', label: 'Alpha', angle: 60, distance: 0.7, color: '#00D9FF', size: 12 },
  { id: 'threat', label: '', angle: 340, distance: 0.35, color: '#EF4444', size: 8 },
  { id: 'beta', label: 'Beta', angle: 130, distance: 0.6, color: '#10B981', size: 12 },
  { id: 'gamma', label: '', angle: 235, distance: 0.55, color: '#F59E0B', size: 14 },
];

export const TacticalRadar = ({ 
  targets = defaultTargets, 
  scanSpeed = 6,
  className,
  showHeader = true
}: TacticalRadarProps) => {
  const size = 400;
  const center = size / 2;
  const outerRadius = 175;
  const innerRadii = [45, 85, 125, 165];

  // Convert polar to cartesian
  const polarToCartesian = (angleDeg: number, distance: number) => {
    const angleRad = (angleDeg - 90) * Math.PI / 180;
    const r = outerRadius * distance;
    return {
      x: center + r * Math.cos(angleRad),
      y: center + r * Math.sin(angleRad)
    };
  };

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Header */}
      {showHeader && (
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Wifi className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-mono tracking-[0.3em] text-cyan-400 uppercase">
              Radar System
            </span>
          </div>
          <p className="text-xs font-mono text-cyan-400/60 tracking-wider">
            Real-Time Tracking & Analysis Platform
          </p>
        </div>
      )}

      {/* Radar Container */}
      <div className="relative p-4 bg-[#0a1628] border border-cyan-900/30 rounded-lg">
        {/* Corner brackets */}
        <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-cyan-500/40" />
        <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-cyan-500/40" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-cyan-500/40" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-cyan-500/40" />

        {/* Main SVG */}
        <svg 
          width={size} 
          height={size} 
          viewBox={`0 0 ${size} ${size}`}
          className="block"
        >
          <defs>
            {/* Scan gradient */}
            <linearGradient id="scanGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#00D9FF" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#00D9FF" stopOpacity="0.6" />
            </linearGradient>

            {/* Glow filter */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Target glow */}
            <filter id="targetGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background gradient */}
          <circle 
            cx={center} 
            cy={center} 
            r={outerRadius + 10} 
            fill="url(#radarBg)" 
          />
          <radialGradient id="radarBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0d1f35" />
            <stop offset="100%" stopColor="#0a1628" />
          </radialGradient>

          {/* Outer decorative ring with ticks */}
          <circle 
            cx={center} 
            cy={center} 
            r={outerRadius + 8} 
            fill="none" 
            stroke="#1e3a5f" 
            strokeWidth="12"
          />

          {/* Degree markings (every 10 degrees, major every 30) */}
          {Array.from({ length: 36 }).map((_, i) => {
            const angle = i * 10;
            const isMajor = angle % 30 === 0;
            const rad = (angle - 90) * Math.PI / 180;
            const innerR = isMajor ? outerRadius - 5 : outerRadius;
            const outerR = outerRadius + 14;
            
            return (
              <g key={angle}>
                {/* Tick mark */}
                <line
                  x1={center + innerR * Math.cos(rad)}
                  y1={center + innerR * Math.sin(rad)}
                  x2={center + outerR * Math.cos(rad)}
                  y2={center + outerR * Math.sin(rad)}
                  stroke={isMajor ? '#4a90a4' : '#2a5060'}
                  strokeWidth={isMajor ? 2 : 1}
                />
                {/* Degree label for major ticks */}
                {isMajor && (
                  <text
                    x={center + (outerRadius + 28) * Math.cos(rad)}
                    y={center + (outerRadius + 28) * Math.sin(rad)}
                    fill="#4a90a4"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {angle}°
                  </text>
                )}
              </g>
            );
          })}

          {/* Minor tick marks (every degree between major) */}
          {Array.from({ length: 360 }).map((_, i) => {
            if (i % 10 === 0) return null; // Skip major ticks
            const angle = i;
            const rad = (angle - 90) * Math.PI / 180;
            const innerR = outerRadius + 2;
            const outerR = outerRadius + 6;
            
            return (
              <line
                key={`minor-${angle}`}
                x1={center + innerR * Math.cos(rad)}
                y1={center + innerR * Math.sin(rad)}
                x2={center + outerR * Math.cos(rad)}
                y2={center + outerR * Math.sin(rad)}
                stroke="#1a3040"
                strokeWidth="0.5"
              />
            );
          })}

          {/* Concentric rings */}
          {innerRadii.map((r, i) => (
            <circle
              key={r}
              cx={center}
              cy={center}
              r={r}
              fill="none"
              stroke="#1a3a50"
              strokeWidth="1"
              strokeOpacity={0.5 + i * 0.1}
            />
          ))}

          {/* Outer main ring */}
          <circle
            cx={center}
            cy={center}
            r={outerRadius}
            fill="none"
            stroke="#2a5a70"
            strokeWidth="2"
          />

          {/* Crosshairs */}
          <line 
            x1={center} y1={center - outerRadius} 
            x2={center} y2={center + outerRadius} 
            stroke="#1a3a50" 
            strokeWidth="1" 
          />
          <line 
            x1={center - outerRadius} y1={center} 
            x2={center + outerRadius} y2={center} 
            stroke="#1a3a50" 
            strokeWidth="1" 
          />

          {/* LAT labels */}
          <text x={center - outerRadius - 25} y={center - 40} fill="#3a6a80" fontSize="8" fontFamily="monospace">LAT</text>
          <text x={center - outerRadius - 25} y={center + 50} fill="#3a6a80" fontSize="8" fontFamily="monospace">LAT</text>

          {/* Animated scan sweep */}
          <g style={{ transformOrigin: `${center}px ${center}px` }}>
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ duration: scanSpeed, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: `${center}px ${center}px` }}
            >
              {/* Scan line */}
              <line
                x1={center}
                y1={center}
                x2={center}
                y2={center - outerRadius}
                stroke="#00D9FF"
                strokeWidth="2"
                filter="url(#glow)"
              />
              
              {/* Scan wedge (gradient trail) */}
              <path
                d={`M ${center} ${center} 
                    L ${center} ${center - outerRadius} 
                    A ${outerRadius} ${outerRadius} 0 0 0 ${center + outerRadius * Math.sin(Math.PI / 6)} ${center - outerRadius * Math.cos(Math.PI / 6)}
                    Z`}
                fill="url(#scanGradient)"
                opacity="0.4"
              />
            </motion.g>
          </g>

          {/* "SCANNING" label */}
          <rect x={center - 40} y={28} width="80" height="18" rx="2" fill="#0a1628" stroke="#2a5a70" strokeWidth="1" />
          <text x={center} y={40} fill="#00D9FF" fontSize="9" fontFamily="monospace" textAnchor="middle">SCANNING</text>

          {/* Targets */}
          {targets.map((target) => {
            const pos = polarToCartesian(target.angle, target.distance);
            const targetSize = target.size || 10;
            
            return (
              <g key={target.id}>
                {/* Target glow */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={targetSize + 4}
                  fill={target.color}
                  opacity="0.3"
                  filter="url(#targetGlow)"
                />
                {/* Target dot */}
                <motion.circle
                  cx={pos.x}
                  cy={pos.y}
                  r={targetSize / 2}
                  fill={target.color}
                  animate={{ opacity: [1, 0.6, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                {/* Target label */}
                {target.label && (
                  <text
                    x={pos.x + targetSize}
                    y={pos.y - targetSize / 2}
                    fill={target.color}
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {target.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Center dot */}
          <circle cx={center} cy={center} r="3" fill="#00D9FF" />
        </svg>
      </div>
    </div>
  );
};

