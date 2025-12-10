/**
 * ThreatRadar - Integrates RadarDisplay with threat detection logic
 * 
 * Features:
 * - Uses existing canvas-based RadarDisplay
 * - 3-stage threat system (Normal/Warning/Critical)
 * - Center HUD with threat count
 * - BREACH DETECTED / SHIELD ACTIVE / MONITORING badges
 * - Live system log panel
 * - Dynamic color theming based on threat level
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Shield, Activity } from 'lucide-react';
import RadarDisplay, { RadarConfig, RadarPoint } from './RadarDisplay';
import RadarDecorations from './RadarDecorations';
import { cn } from '@/lib/utils';

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

  const isCritical = activeRisks >= 5;
  const isWarning = activeRisks === 4;

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
      angle: Math.random() * 360,
      distance: 0.2 + Math.random() * 0.7,
      color: i < activeRisks ? theme.color : `${theme.color}60`,
      size: 4 + Math.random() * 4,
    }));
  }, [activeRisks, theme.color]);

  // Simulate log entries
  useEffect(() => {
    const messages = [
      { level: 'CRITICAL' as const, text: 'Circular revenue pattern detected' },
      { level: 'CRITICAL' as const, text: 'CRITICAL: Shadow Ledger anomaly' },
      { level: 'LOW' as const, text: 'Canon hash verified: Block #9921' },
      { level: 'HIGH' as const, text: 'Tax jurisdiction mismatch (EU/US)' },
      { level: 'INFO' as const, text: 'Reconciliation complete' },
      { level: 'CRITICAL' as const, text: 'Duplicate transaction detected' },
      { level: 'HIGH' as const, text: 'Unusual timing pattern flagged' },
    ];

    const initialLogs = messages.slice(0, 4).map((msg, i) => ({
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

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Radar Container */}
      <div 
        className="relative rounded-xl border overflow-hidden"
        style={{ 
          backgroundColor: theme.backgroundColor,
          borderColor: `${theme.color}20`,
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

        {/* Radar */}
        <div className="relative flex items-center justify-center p-8">
          {/* Atmospheric glow */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, ${theme.glowColor} 0%, transparent 60%)`
            }}
          />

          {/* Canvas Radar */}
          <div className="relative" style={{ width: size, height: size }}>
            <RadarDisplay 
              config={config} 
              points={points}
            />
            <RadarDecorations size={size} />

            {/* Center HUD Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div 
                className="flex flex-col items-center justify-center rounded-full border-2"
                style={{ 
                  width: 100,
                  height: 100,
                  backgroundColor: 'rgba(0, 0, 0, 0.85)',
                  borderColor: theme.color,
                  boxShadow: `0 0 30px ${theme.glowColor}, inset 0 0 20px ${theme.glowColor}`
                }}
                animate={{ 
                  scale: isCritical ? [1, 1.05, 1] : 1,
                }}
                transition={{ duration: 1, repeat: isCritical ? Infinity : 0 }}
              >
                <motion.span 
                  className="text-4xl font-mono font-bold"
                  style={{ color: theme.color }}
                  animate={{ scale: isCritical ? [1, 1.1, 1] : 1 }}
                  transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
                >
                  {activeRisks}
                </motion.span>
                <span 
                  className="text-[8px] font-mono uppercase tracking-[0.2em] mt-1"
                  style={{ color: `${theme.color}80` }}
                >
                  Threats
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

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

