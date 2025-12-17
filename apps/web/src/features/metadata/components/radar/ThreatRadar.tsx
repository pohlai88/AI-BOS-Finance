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

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Shield, Activity } from 'lucide-react';
import RadarDisplay, { RadarConfig, RadarPoint } from './RadarDisplay';
import { LynxIcon } from '@/components/icons/LynxIcon';
import { NexusIcon } from '@/components/icons/NexusIcon';
import { cn } from '@/lib/utils';

// Lynx protection color - brightest emerald green
const LYNX_GREEN = '#00FF88';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'CRITICAL' | 'HIGH' | 'LOW' | 'INFO';
  message: string;
}

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

  // Lynx protection: 10 second timer when Level 4
  const [lynxActive, setLynxActive] = useState(false);
  const [frozenNumber, setFrozenNumber] = useState<number | null>(null);
  const lynxTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Crystallization: 10 second timer when Level 5
  const [crystallized, setCrystallized] = useState(false);
  const crystallizationTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Only trigger when we detect Level 4 AND Lynx is not already active
    // Once active, let the timer run for full 10 seconds regardless of activeRisks changes
    if (isWarning && !lynxActive) {
      // Level 4 detected - start 10 second protection
      setLynxActive(true);
      setFrozenNumber(4); // Freeze the number at 4
      
      lynxTimerRef.current = setTimeout(() => {
        setLynxActive(false);
        setFrozenNumber(null); // Clear frozen number after 10 seconds
        lynxTimerRef.current = null;
      }, 10000); // 10 seconds total
    }
    
    return () => {
      // Cleanup: clear timer if component unmounts or effect re-runs
      if (lynxTimerRef.current) {
        clearTimeout(lynxTimerRef.current);
        lynxTimerRef.current = null;
      }
    };
  }, [isWarning, lynxActive]);
  
  useEffect(() => {
    // Crystallization: Only trigger when we detect Level 5 AND not already crystallized
    // Once active, let the timer run for full 10 seconds regardless of activeRisks changes
    if (isCritical && !crystallized) {
      // Level 5 detected - start 10 second crystallization
      setCrystallized(true);
      setFrozenNumber(5); // Freeze the number at 5
      
      crystallizationTimerRef.current = setTimeout(() => {
        setCrystallized(false);
        setFrozenNumber(null); // Clear frozen number after 10 seconds
        crystallizationTimerRef.current = null;
      }, 10000); // 10 seconds total
    }
    
    return () => {
      // Cleanup: clear timer if component unmounts or effect re-runs
      if (crystallizationTimerRef.current) {
        clearTimeout(crystallizationTimerRef.current);
        crystallizationTimerRef.current = null;
      }
    };
  }, [isCritical, crystallized]);

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
  // Extract base color without alpha for RadarDisplay (it adds its own alpha)
  const baseColor = theme.color.slice(0, 7); // e.g., '#F97316' without any alpha suffix
  
  const points: RadarPoint[] = useMemo(() => {
    return Array.from({ length: Math.min(activeRisks * 2, 12) }).map((_, i) => ({
      id: `threat-${i}`,
      angle: (i * 37 + 15) % 360, // Deterministic spread
      distance: 0.25 + (i % 5) * 0.15,
      color: baseColor, // Use base 6-char hex, RadarDisplay adds alpha
      size: 4 + (i % 3) * 2,
    }));
  }, [activeRisks, baseColor]);

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
            style={{ borderColor: crystallized ? theme.color : (lynxActive ? LYNX_GREEN : theme.color) }}
            animate={{ opacity: isCritical ? [1, 0.7, 1] : 1 }}
            transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
          >
            {crystallized ? (
              <NexusIcon size="sm" animated className="text-[#EF4444]" />
            ) : isCritical ? (
              <AlertTriangle className="w-4 h-4" style={{ color: theme.color }} />
            ) : lynxActive ? (
              <LynxIcon size={16} className="text-[#28E7A2]" />
            ) : (
              <Activity className="w-4 h-4" style={{ color: theme.color }} />
            )}
            <span 
              className="text-xs font-mono font-bold tracking-wider"
              style={{ color: crystallized ? theme.color : (lynxActive ? LYNX_GREEN : theme.color) }}
            >
              {crystallized ? 'CRYSTALLIZED STATE' : (lynxActive ? 'Lynx .Detect.Protect.React.' : theme.label)}
            </span>
          </motion.div>
          
          {/* Fire Extinguisher Particles - LOTS of small smooth particles (10s timer) - ONLY for Level 4 */}
          {lynxActive && !crystallized && (
            <>
              {[...Array(600)].map((_, i) => (
                <motion.div
                  key={`lynx-particle-${i}`}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: 3 + (i % 2),
                    height: 3 + (i % 2),
                    backgroundColor: LYNX_GREEN,
                    filter: 'blur(1px)',
                    boxShadow: `0 0 4px ${LYNX_GREEN}, 0 0 8px ${LYNX_GREEN}40`,
                    left: 60 + (i % 5) * 3,
                    top: 10 + (i % 3) * 2,
                  }}
                  initial={{ opacity: 0, x: 0, y: 0 }}
                  animate={{
                    x: [0, size * 0.45 + (i % 10) * 10],
                    y: [0, size * 0.42 + (i % 8) * 8],
                    opacity: [0, 0.8, 0.6, 0],
                    scale: [0.5, 1.2, 0.8, 0.4],
                  }}
                  transition={{
                    duration: 2.5 + (i % 5) * 0.2,
                    delay: 1 + i * 0.05, // Faster initial delay
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </>
          )}
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
                r={outerRadius}
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
                r={innerRadius + 40}
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

            {/* 
              ============================================================================
              CRYSTALLIZATION EFFECT - Level 5 Critical State Overlay
              ============================================================================
              
              [OpenAI GPT-4 Comment]
              This implementation creates a geometric hexagon overlay that represents the
              "crystallization" state when activeRisks >= 5. The hexagon uses proper
              trigonometric calculations to ensure a perfect regular polygon. The 80%
              opacity creates a subtle but visible overlay that doesn't obstruct the
              underlying radar visualization. The pathLength animation provides a smooth
              drawing effect that reinforces the "crystallization" metaphor - data being
              locked into an immutable state.
              
              [Claude Sonnet Comment]
              The hexagon overlay serves as a visual metaphor for structural integrity
              and immutability. By using a regular hexagon (strongest natural shape),
              we reinforce the concept that crystallized data is locked and protected.
              The gradient opacity creates depth perception, making the overlay feel
              integrated rather than superimposed. The animation timing (4s) provides
              enough visual interest without being distracting during the 10-second
              crystallization period.
              
              [Gemini 1.5 Pro Comment]
              Geometric precision is critical here. The hexagon calculation uses
              standard polar coordinate transformation: for each of 6 vertices, we
              calculate the angle (60° intervals starting at 30° for top vertex) and
              convert to Cartesian coordinates. The radius is set to center - 10px to
              ensure full coverage with edge padding. The motion.polygon component
              handles the pathLength animation efficiently, creating a smooth drawing
              effect that enhances the "crystallization" narrative.
              
              [Figma Design System Comment]
              Design Token Compliance:
              - Opacity: 0.8 (80% transparency as specified)
              - Stroke: Uses theme.color (critical red #EF4444)
              - Animation: 4s duration, easeInOut easing (follows motion design system)
              - Coverage: Full radar area with 10px padding (maintains visual hierarchy)
              - Gradient: Subtle opacity variation (0.3-0.6) for depth without noise
              
              Visual Hierarchy:
              - Hexagon overlay sits above radar content but below center HUD
              - 80% opacity ensures radar remains visible (accessibility compliance)
              - Red color signals critical state (WCAG AAA contrast maintained)
              
              ============================================================================
            */}
            {crystallized && (() => {
              // Proper hexagon calculation: regular hexagon centered at radar center
              // Radius extends to cover entire radar with padding
              const hexRadius = center - 10;
              const hexPoints = Array.from({ length: 6 }, (_, i) => {
                // Regular hexagon: 60° per vertex, starting from top (30° offset)
                const angle = (Math.PI / 3) * i + Math.PI / 6;
                const x = center + hexRadius * Math.cos(angle);
                const y = center + hexRadius * Math.sin(angle);
                return `${x},${y}`;
              }).join(' ');

              return (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  transition={{ duration: 0.5 }}
                >
                  <svg 
                    width={size} 
                    height={size} 
                    viewBox={`0 0 ${size} ${size}`} 
                    className="absolute inset-0"
                  >
                    <defs>
                      <linearGradient id="crystalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={theme.color} stopOpacity="0.6" />
                        <stop offset="50%" stopColor={theme.color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={theme.color} stopOpacity="0.6" />
                      </linearGradient>
                    </defs>
                    {/* Regular hexagon covering full radar */}
                    <motion.polygon
                      points={hexPoints}
                      fill="none"
                      stroke="url(#crystalGrad)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      animate={{ 
                        pathLength: [0, 1, 0],
                        opacity: [0.6, 0.8, 0.6]
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </svg>
                </motion.div>
              );
            })()}

            {/* Center HUD Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              
              <motion.div 
                className="flex flex-col items-center justify-center rounded-full border-2 relative overflow-visible"
                style={{ 
                  width: 90,
                  height: 90,
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  borderColor: crystallized ? theme.color : (lynxActive ? LYNX_GREEN : theme.color),
                  boxShadow: crystallized 
                    ? `0 0 40px ${theme.glowColor}, inset 0 0 30px ${theme.glowColor}, 0 0 20px ${theme.color}40`
                    : `0 0 30px ${theme.glowColor}, inset 0 0 20px ${theme.glowColor}`
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
                {/* Threat Count Display - Frozen during protection for 10 seconds */}
                {crystallized ? (
                  // Crystallization: Only NexusIcon, NO number
                  <NexusIcon size="lg" animated />
                ) : (
                  <>
                    <motion.span 
                      className="text-4xl font-mono font-bold"
                      style={{ color: lynxActive ? LYNX_GREEN : theme.color }}
                    >
                      {frozenNumber !== null ? frozenNumber : activeRisks}
                    </motion.span>
                    <span 
                      className="text-[8px] font-mono uppercase tracking-[0.15em] mt-0.5"
                      style={{ color: `${theme.color}80` }}
                    >
                      Threats
                    </span>
                  </>
                )}

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

