/**
 * ThreatRadar - Integrates RadarDisplay with threat detection logic
 * 
 * Features:
 * - Uses existing canvas-based RadarDisplay
 * - 3-stage threat system (Normal/Warning/Critical)
 * - SCANNING WEDGE overlay (cake slice animation)
 * - BREATHING animation (enlarge/minimize pulse)
 * - FRAME INTERCHANGE (internal/external rings swap)
 * - Center HUD with threat count
 * - BREACH DETECTED / SHIELD ACTIVE / MONITORING badges
 * - Live system log panel
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Shield, Activity } from 'lucide-react';
import RadarDisplay, { RadarConfig, RadarPoint } from './RadarDisplay';
import { cn } from '@/lib/utils';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'CRITICAL' | 'HIGH' | 'LOW' | 'INFO';
  message: string;
}

/**
 * Generate organic blob path using sine wave deformation
 * @param center - center point (x,y same)
 * @param radius - base radius
 * @param points - number of points on the blob
 * @param seed - seed for variation (0, 1, 2 for different shapes)
 */
const generateBlobPath = (center: number, radius: number, points: number, seed: number): string => {
  const deformations = [
    [0.15, 0.08, 0.12, 0.05, 0.1, 0.07, 0.11, 0.06],
    [0.08, 0.14, 0.06, 0.11, 0.09, 0.13, 0.07, 0.1],
    [0.12, 0.06, 0.1, 0.14, 0.07, 0.09, 0.13, 0.08],
  ];
  const deform = deformations[seed % 3];
  
  const pathPoints: string[] = [];
  
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2 - Math.PI / 2;
    const deformAmount = deform[i % deform.length];
    const r = radius * (1 + deformAmount * Math.sin(angle * 3 + seed));
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    
    if (i === 0) {
      pathPoints.push(`M ${x.toFixed(2)} ${y.toFixed(2)}`);
    } else {
      // Use quadratic curves for smooth organic feel
      const prevAngle = ((i - 1) / points) * Math.PI * 2 - Math.PI / 2;
      const midAngle = (angle + prevAngle) / 2;
      const midR = radius * (1 + deform[(i - 1) % deform.length] * 0.5);
      const cpX = center + midR * 1.1 * Math.cos(midAngle);
      const cpY = center + midR * 1.1 * Math.sin(midAngle);
      pathPoints.push(`Q ${cpX.toFixed(2)} ${cpY.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
  }
  
  pathPoints.push('Z');
  return pathPoints.join(' ');
};

interface ThreatRadarProps {
  activeRisks?: number;
  className?: string;
  size?: number;
  showLog?: boolean;
}

export const ThreatRadar = ({ 
  activeRisks = 3, 
  className,
  size = 400,
  showLog = true
}: ThreatRadarProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [frameSwapped, setFrameSwapped] = useState(false);

  const isCritical = activeRisks >= 5;
  const isWarning = activeRisks === 4;

  // Frame interchange animation - swap every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setFrameSwapped(prev => !prev);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Theme based on threat level
  const theme = useMemo(() => {
    if (isCritical) {
      return {
        color: '#EF4444',
        label: 'BREACH DETECTED',
        sweepColor: '#EF4444',
        ringColor: '#EF4444',
        backgroundColor: '#0A0A0F',
        gridColor: '#2A1515',
        glowColor: 'rgba(239, 68, 68, 0.3)',
      };
    } else if (isWarning) {
      return {
        color: '#F97316',
        label: 'SHIELD ACTIVE',
        sweepColor: '#F97316',
        ringColor: '#F97316',
        backgroundColor: '#0A0A0F',
        gridColor: '#2A2015',
        glowColor: 'rgba(249, 115, 22, 0.3)',
      };
    }
    return {
      color: '#00D9FF',
      label: 'MONITORING',
      sweepColor: '#00D9FF',
      ringColor: '#00D9FF',
      backgroundColor: '#0A0A0F',
      gridColor: '#152A2A',
      glowColor: 'rgba(0, 217, 255, 0.2)',
    };
  }, [isCritical, isWarning]);

  // Radar config adapted from theme
  const config: RadarConfig = useMemo(() => ({
    size,
    rings: 4,
    sweepSpeed: isCritical ? 2 : isWarning ? 4 : 6,
    sweepColor: theme.sweepColor,
    ringColor: theme.ringColor,
    backgroundColor: theme.backgroundColor,
    gridColor: theme.gridColor,
    angleMarkers: false,
    showLabels: false,
    fadeTrail: true,
  }), [size, theme, isCritical, isWarning]);

  // Generate random threat points based on activeRisks
  const points: RadarPoint[] = useMemo(() => {
    return Array.from({ length: Math.min(activeRisks * 2, 12) }).map((_, i) => ({
      id: `threat-${i}`,
      angle: (i * 37 + 15) % 360, // Deterministic spread
      distance: 0.25 + (i % 5) * 0.15,
      color: i < activeRisks ? theme.color : `${theme.color}60`,
      size: 4 + (i % 3) * 2,
    }));
  }, [activeRisks, theme.color]);

  // Simulate log entries
  useEffect(() => {
    const messages = [
      { level: 'CRITICAL' as const, text: 'Circular revenue pattern detected' },
      { level: 'CRITICAL' as const, text: 'CRITICAL: Shadow Ledger anomaly' },
      { level: 'LOW' as const, text: 'Canon hash verified: Block #9921' },
      { level: 'HIGH' as const, text: 'Tax jurisdiction mismatch (EU/US)' },
    ];

    const initialLogs = messages.map((msg, i) => ({
      id: `log-${i}`,
      timestamp: new Date(Date.now() - i * 60000).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }),
      level: msg.level,
      message: msg.text,
    }));

    setLogs(initialLogs);
  }, []);

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'CRITICAL': return '#EF4444';
      case 'HIGH': return '#F97316';
      case 'LOW': return '#22C55E';
      case 'INFO': return '#6B7280';
    }
  };

  const center = size / 2;
  const outerRadius = size / 2 - 20;
  const innerRadius = outerRadius * 0.3;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Radar Container with BREATHING animation */}
      <motion.div 
        className="relative rounded-xl border overflow-hidden"
        style={{ 
          backgroundColor: theme.backgroundColor,
          borderColor: `${theme.color}20`,
        }}
        animate={{ 
          scale: [1, 1.02, 1],
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: 'easeInOut' 
        }}
      >
        {/* Status Badge */}
        <div className="absolute top-4 left-4 z-20">
          <motion.div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-black/80 backdrop-blur-md"
            style={{ borderColor: theme.color }}
            animate={{ opacity: isCritical ? [1, 0.7, 1] : 1 }}
            transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
          >
            {isCritical ? (
              <AlertTriangle className="w-4 h-4" style={{ color: theme.color }} />
            ) : isWarning ? (
              <Shield className="w-4 h-4" style={{ color: '#84CC16' }} />
            ) : (
              <Activity className="w-4 h-4" style={{ color: theme.color }} />
            )}
            <span 
              className="text-xs font-mono font-bold uppercase tracking-widest"
              style={{ color: theme.color }}
            >
              {theme.label}
            </span>
          </motion.div>
        </div>

        {/* Radar Area - zero padding for maximum size */}
        <div className="relative flex items-center justify-center p-2">
          {/* Atmospheric glow */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, ${theme.glowColor} 0%, transparent 60%)`
            }}
          />

          {/* Canvas Radar (base layer) */}
          <div className="relative" style={{ width: size, height: size }}>
            <RadarDisplay 
              config={config} 
              points={points}
            />

            {/* SVG Overlay with SCANNING WEDGE and FRAME INTERCHANGE */}
            <svg 
              className="absolute inset-0 pointer-events-none"
              width={size} 
              height={size} 
              viewBox={`0 0 ${size} ${size}`}
            >
              <defs>
                {/* Scanning wedge gradient */}
                <linearGradient id="sweepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="60%" stopColor={theme.color} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={theme.color} stopOpacity="0.6" />
                </linearGradient>
                
                {/* Glow filter */}
                <filter id="radarGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* ROTATING RING 1: Outer dashed ring - SLOW clockwise */}
              <motion.g
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                style={{ transformOrigin: `${center}px ${center}px` }}
              >
                <circle
                  cx={center}
                  cy={center}
                  r={outerRadius - 5}
                  fill="none"
                  stroke={theme.color}
                  strokeWidth="1"
                  strokeOpacity="0.2"
                  strokeDasharray="12 6"
                />
              </motion.g>

              {/* ROTATING RING 2: Middle ring - MEDIUM clockwise */}
              <motion.g
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                style={{ transformOrigin: `${center}px ${center}px` }}
              >
                <circle
                  cx={center}
                  cy={center}
                  r={outerRadius * 0.7}
                  fill="none"
                  stroke={theme.color}
                  strokeWidth="1"
                  strokeOpacity="0.15"
                  strokeDasharray="8 4"
                />
              </motion.g>

              {/* ROTATING RING 3: Inner ring - FAST counter-clockwise (contrast) */}
              <motion.g
                animate={{ rotate: -360 }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                style={{ transformOrigin: `${center}px ${center}px` }}
              >
                <circle
                  cx={center}
                  cy={center}
                  r={outerRadius * 0.45}
                  fill="none"
                  stroke={theme.color}
                  strokeWidth="1"
                  strokeOpacity="0.12"
                  strokeDasharray="4 8"
                />
              </motion.g>

              {/* FRAME INTERCHANGE: External ring */}
              <motion.circle
                cx={center}
                cy={center}
                fill="none"
                stroke={theme.color}
                strokeWidth="2"
                strokeOpacity="0.4"
                animate={{ 
                  r: frameSwapped ? innerRadius + 20 : outerRadius,
                }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
              />

              {/* FRAME INTERCHANGE: Internal ring */}
              <motion.circle
                cx={center}
                cy={center}
                fill="none"
                stroke={theme.color}
                strokeWidth="1.5"
                strokeOpacity="0.3"
                strokeDasharray="8 4"
                animate={{ 
                  r: frameSwapped ? outerRadius - 20 : innerRadius + 40,
                }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
              />

              {/* Static reference ring */}
              <circle
                cx={center}
                cy={center}
                r={outerRadius * 0.6}
                fill="none"
                stroke={theme.color}
                strokeWidth="1"
                strokeOpacity="0.08"
              />

              {/* === MORPHOLOGY LAYER === */}
              
              {/* Organic blob ring - morphing shape */}
              <motion.path
                d={generateBlobPath(center, outerRadius * 0.85, 8, 0)}
                fill="none"
                stroke={theme.color}
                strokeWidth="1.5"
                strokeOpacity="0.25"
                animate={{
                  d: [
                    generateBlobPath(center, outerRadius * 0.85, 8, 0),
                    generateBlobPath(center, outerRadius * 0.85, 8, 1),
                    generateBlobPath(center, outerRadius * 0.85, 8, 2),
                    generateBlobPath(center, outerRadius * 0.85, 8, 0),
                  ],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Inner organic blob - faster morph */}
              <motion.path
                d={generateBlobPath(center, outerRadius * 0.5, 6, 0)}
                fill={`${theme.color}08`}
                stroke={theme.color}
                strokeWidth="1"
                strokeOpacity="0.15"
                animate={{
                  d: [
                    generateBlobPath(center, outerRadius * 0.5, 6, 0),
                    generateBlobPath(center, outerRadius * 0.5, 6, 2),
                    generateBlobPath(center, outerRadius * 0.5, 6, 1),
                    generateBlobPath(center, outerRadius * 0.5, 6, 0),
                  ],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Neural tendrils connecting center to edge */}
              {[0, 72, 144, 216, 288].map((baseAngle, i) => {
                const angle = (baseAngle - 90) * Math.PI / 180;
                const endX = center + outerRadius * 0.9 * Math.cos(angle);
                const endY = center + outerRadius * 0.9 * Math.sin(angle);
                const ctrlOffset = 30 + i * 10;
                
                return (
                  <motion.path
                    key={`tendril-${i}`}
                    d={`M ${center} ${center} 
                        Q ${center + ctrlOffset * Math.cos(angle + 0.3)} ${center + ctrlOffset * Math.sin(angle + 0.3)}
                        ${endX} ${endY}`}
                    fill="none"
                    stroke={theme.color}
                    strokeWidth="1"
                    strokeOpacity="0.1"
                    animate={{
                      strokeOpacity: [0.05, 0.2, 0.05],
                      strokeWidth: [0.5, 1.5, 0.5],
                    }}
                    transition={{
                      duration: 3,
                      delay: i * 0.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                );
              })}

              {/* Cellular pulse nodes on rings */}
              {[0.4, 0.6, 0.8].map((ringDist, ringIdx) =>
                [0, 60, 120, 180, 240, 300].map((angleDeg, nodeIdx) => {
                  const angle = (angleDeg - 90) * Math.PI / 180;
                  const x = center + outerRadius * ringDist * Math.cos(angle);
                  const y = center + outerRadius * ringDist * Math.sin(angle);
                  
                  return (
                    <motion.circle
                      key={`cell-${ringIdx}-${nodeIdx}`}
                      cx={x}
                      cy={y}
                      r="2"
                      fill={theme.color}
                      animate={{
                        r: [1.5, 3, 1.5],
                        opacity: [0.2, 0.5, 0.2],
                      }}
                      transition={{
                        duration: 2 + ringIdx * 0.5,
                        delay: nodeIdx * 0.2 + ringIdx * 0.3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  );
                })
              )}

              {/* SCANNING WEDGE (cake slice) */}
              <g style={{ transformOrigin: `${center}px ${center}px` }}>
                <motion.g
                  animate={{ rotate: 360 }}
                  transition={{ 
                    duration: isCritical ? 3 : isWarning ? 5 : 8, 
                    repeat: Infinity, 
                    ease: 'linear' 
                  }}
                  style={{ transformOrigin: `${center}px ${center}px` }}
                >
                  {/* Scan line (leading edge) */}
                  <line
                    x1={center}
                    y1={center}
                    x2={center}
                    y2={center - outerRadius + 5}
                    stroke={theme.color}
                    strokeWidth="2"
                    filter="url(#radarGlow)"
                  />
                  
                  {/* Scan wedge (45° trailing gradient) */}
                  <path
                    d={`M ${center} ${center} 
                        L ${center} ${center - outerRadius + 5} 
                        A ${outerRadius - 5} ${outerRadius - 5} 0 0 0 
                        ${center + (outerRadius - 5) * Math.sin(Math.PI / 4)} 
                        ${center - (outerRadius - 5) * Math.cos(Math.PI / 4)}
                        Z`}
                    fill="url(#sweepGradient)"
                    opacity="0.5"
                  />

                  {/* Scan endpoint glow */}
                  <circle
                    cx={center}
                    cy={center - outerRadius + 10}
                    r="4"
                    fill={theme.color}
                    filter="url(#radarGlow)"
                  />
                </motion.g>
              </g>

              {/* Corner brackets */}
              <g stroke={theme.color} strokeWidth="2" strokeOpacity="0.5">
                <path d={`M 15 35 L 15 15 L 35 15`} fill="none" />
                <path d={`M ${size - 15} 35 L ${size - 15} 15 L ${size - 35} 15`} fill="none" />
                <path d={`M 15 ${size - 35} L 15 ${size - 15} L 35 ${size - 15}`} fill="none" />
                <path d={`M ${size - 15} ${size - 35} L ${size - 15} ${size - 15} L ${size - 35} ${size - 15}`} fill="none" />
              </g>

              {/* ROTATING TICK MARKS - Slow clockwise */}
              <motion.g
                animate={{ rotate: 360 }}
                transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
                style={{ transformOrigin: `${center}px ${center}px` }}
              >
                {Array.from({ length: 36 }).map((_, i) => {
                  const angle = (i * 10 - 90) * Math.PI / 180;
                  const isMajor = i % 3 === 0;
                  const r1 = outerRadius - (isMajor ? 12 : 6);
                  const r2 = outerRadius;
                  return (
                    <line
                      key={i}
                      x1={center + r1 * Math.cos(angle)}
                      y1={center + r1 * Math.sin(angle)}
                      x2={center + r2 * Math.cos(angle)}
                      y2={center + r2 * Math.sin(angle)}
                      stroke={theme.color}
                      strokeWidth={isMajor ? 2 : 1}
                      strokeOpacity={isMajor ? 0.5 : 0.2}
                    />
                  );
                })}
              </motion.g>
            </svg>

            {/* Center HUD Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div 
                className="flex flex-col items-center justify-center rounded-full border-2"
                style={{ 
                  width: 90,
                  height: 90,
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  borderColor: theme.color,
                  boxShadow: `0 0 30px ${theme.glowColor}, inset 0 0 20px ${theme.glowColor}`
                }}
                animate={{ 
                  scale: isCritical ? [1, 1.08, 1] : [1, 1.03, 1],
                }}
                transition={{ 
                  duration: isCritical ? 0.8 : 3, 
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                <motion.span 
                  className="text-4xl font-mono font-bold"
                  style={{ color: theme.color }}
                >
                  {activeRisks}
                </motion.span>
                <span 
                  className="text-[8px] font-mono uppercase tracking-[0.15em] mt-0.5"
                  style={{ color: `${theme.color}80` }}
                >
                  Threats
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* System Log Panel */}
      {showLog && (
        <div 
          className="rounded-xl border p-4 font-mono text-sm"
          style={{ 
            backgroundColor: '#0A0A0F',
            borderColor: `${theme.color}20`,
          }}
        >
          {/* Log Header */}
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <div className="w-2 h-2 rounded-full bg-green-500" />
            </div>
            <span className="text-white/50 text-xs tracking-wider">&gt;_ SYSTEM.LOG</span>
          </div>

          {/* Log Entries */}
          <div className="space-y-1.5">
            <AnimatePresence>
              {logs.map((log) => (
                <motion.div 
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-3 text-xs"
                >
                  <span className="text-white/30 shrink-0">{log.timestamp}</span>
                  <span 
                    className="font-bold shrink-0"
                    style={{ color: getLevelColor(log.level) }}
                  >
                    [{log.level}]
                  </span>
                  <span className="text-white/70">{log.message}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10">
            <motion.div 
              className="w-2 h-2 rounded-full bg-green-500"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-[10px] text-white/40 uppercase tracking-wider">
              Live Monitoring Active
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreatRadar;
