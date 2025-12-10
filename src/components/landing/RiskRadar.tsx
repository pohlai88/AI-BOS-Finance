/**
 * RiskRadar - 3-Stage Threat Detection Visualization
 * 
 * STATE NORMAL (< 4): Standard Green Monitoring
 * STATE WARNING (= 4): Orange Core + Lime Shield + Clock Scanner
 * STATE CRITICAL (5+): Red Rage + Expanding Waves + Aggressive Scan
 */

import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, AlertTriangle, Scan } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RiskRadarProps {
  activeRisks: number;
  systemStatus?: string;
}

// Theme definitions for each threat level
const THEMES = {
  normal: { 
    primary: '#10B981', // Nexus Green
    glow: 'rgba(16, 185, 129, 0.4)', 
    bg: 'rgba(16, 185, 129, 0.05)' 
  },
  warning: { 
    primary: '#F97316', // Tangy Orange
    glow: 'rgba(249, 115, 22, 0.6)', 
    bg: 'rgba(249, 115, 22, 0.1)' 
  },
  critical: { 
    primary: '#EF4444', // Red Rage
    glow: 'rgba(239, 68, 68, 0.6)', 
    bg: 'rgba(239, 68, 68, 0.1)' 
  },
} as const;

export const RiskRadar = ({ activeRisks }: RiskRadarProps) => {
  // Determine system state
  const isWarning = activeRisks === 4;
  const isCritical = activeRisks >= 5;

  // Select theme based on state
  const theme = isCritical ? THEMES.critical : isWarning ? THEMES.warning : THEMES.normal;

  return (
    <div className="relative w-full aspect-square max-h-[380px] mx-auto border border-nexus-structure bg-nexus-void p-4 overflow-hidden transition-colors duration-1000">
      
      {/* --- UI HEADER: Live Status Badge --- */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-3">
        <div 
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border bg-black/60 backdrop-blur-md transition-all duration-500"
          )}
          style={{ borderColor: theme.primary }}
        >
          {isCritical ? (
            <AlertTriangle className="w-3.5 h-3.5 animate-pulse" style={{ color: theme.primary }} />
          ) : isWarning ? (
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: theme.primary }} />
          ) : (
            <Scan className="w-3.5 h-3.5 text-emerald-500" />
          )}
          <span 
            className="text-[9px] font-mono uppercase tracking-widest font-bold transition-colors duration-500"
            style={{ color: theme.primary }}
          >
            {isCritical ? 'BREACH DETECTED' : isWarning ? 'SHIELD ACTIVE' : 'LIVE SCAN'}
          </span>
        </div>
      </div>

      <svg viewBox="0 0 400 400" className="w-full h-full relative z-10">
        <defs>
          {/* Scan beam gradient - updates with theme */}
          <radialGradient id="radar-scan-gradient">
            <stop offset="0%" stopColor={theme.primary} stopOpacity="0.5" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* --- LAYER 1: EXPANDING RAGE WAVES (Critical Only) --- */}
        <AnimatePresence>
          {isCritical && (
            <g>
              {[0, 1, 2].map((i) => (
                <motion.circle
                  key={`rage-wave-${i}`}
                  cx="200" cy="200"
                  fill="none"
                  stroke={theme.primary}
                  strokeWidth="2"
                  initial={{ r: 50, opacity: 1, strokeWidth: 4 }}
                  animate={{ r: 350, opacity: 0, strokeWidth: 0 }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 1,
                    ease: "easeOut"
                  }}
                />
              ))}
            </g>
          )}
        </AnimatePresence>

        {/* --- LAYER 2: GRID STRUCTURE --- */}
        <g 
          className="transition-opacity duration-500" 
          style={{ opacity: isCritical ? 0.3 : 0.6 }}
        >
          {[60, 100, 140, 180].map((radius, i) => (
            <motion.circle
              key={`grid-${i}`}
              cx="200" cy="200" r={radius}
              fill="none"
              stroke={isCritical ? theme.primary : "rgba(255, 255, 255, 0.08)"}
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          ))}
          {/* Crosshairs */}
          <line x1="200" y1="20" x2="200" y2="380" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="20" y1="200" x2="380" y2="200" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          {/* Diagonal lines */}
          <line x1="60" y1="60" x2="340" y2="340" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          <line x1="340" y1="60" x2="60" y2="340" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        </g>

        {/* --- LAYER 3: OUTER DECODER RING --- */}
        <motion.circle
          cx="200" cy="200" r="190"
          fill="none"
          stroke={isCritical ? theme.primary : "rgba(40, 231, 162, 0.2)"}
          strokeWidth="2"
          strokeDasharray="2, 8, 15, 8"
          animate={{ rotate: -360 }}
          transition={{ duration: isCritical ? 15 : 30, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: '200px 200px' }}
        />

        {/* --- LAYER 4: CLOCK-POINTER SCANNER (Warning & Critical) --- */}
        <AnimatePresence>
          {(isWarning || isCritical) && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, rotate: 360 }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: isCritical ? 2 : 4, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              style={{ transformOrigin: '200px 200px' }}
            >
              {/* The "Clock Hand" */}
              <line 
                x1="200" y1="200" x2="200" y2="50" 
                stroke={theme.primary} 
                strokeWidth="2" 
              />
              
              {/* The "Wave" behind the hand */}
              <path 
                d="M200,200 L200,50 A150,150 0 0,1 350,200 Z" 
                fill="url(#radar-scan-gradient)" 
                opacity="0.3" 
              />
            </motion.g>
          )}
        </AnimatePresence>

        {/* --- LAYER 5: STANDARD SCANNING BEAM (Normal Only) --- */}
        {!isWarning && !isCritical && (
          <motion.path
            d="M200,200 L200,20 A180,180 0 0,1 327,73 Z"
            fill="url(#radar-scan-gradient)"
            opacity="0.6"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: '200px 200px' }}
          />
        )}

        {/* --- LAYER 6: QUADRANT LABELS --- */}
        {[
          { label: 'IFRS', x: 360, y: 200 },
          { label: 'SOX', x: 200, y: 380 },
          { label: 'COSO', x: 40, y: 200 },
          { label: 'TAX', x: 200, y: 30 },
        ].map((q, i) => (
          <text
            key={i}
            x={q.x}
            y={q.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={isCritical ? theme.primary : "rgba(40, 231, 162, 0.6)"}
            fontSize="11"
            fontWeight="600"
            letterSpacing="2"
            fontFamily="monospace"
            className="transition-colors duration-500"
          >
            {q.label}
          </text>
        ))}

        {/* --- LAYER 7: THE CORE --- */}
        <g transform="translate(200, 200)">
          {/* Core Background Plate */}
          <motion.circle
            r="45"
            fill="#050505"
            stroke={theme.primary}
            strokeWidth={isCritical ? 3 : 1.5}
            animate={{
              r: isWarning ? 55 : isCritical ? 50 : 45,
              strokeOpacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Inner dashed ring */}
          <circle 
            r="38" 
            fill="none" 
            stroke={`${theme.primary}40`}
            strokeWidth="1" 
            strokeDasharray="3,3" 
          />
          
          {/* Core Label */}
          <text 
            y="-8" 
            textAnchor="middle" 
            fill={`${theme.primary}B3`}
            fontSize="8" 
            letterSpacing="2" 
            fontFamily="monospace"
          >
            MCP CORE
          </text>
          
          {/* Core Number */}
          <motion.text
            y="12"
            textAnchor="middle"
            fontWeight="bold"
            fontFamily="monospace"
            fill={isCritical ? theme.primary : "white"}
            animate={{
              scale: isWarning ? 1.3 : isCritical ? 1.2 : 1,
            }}
            transition={{ type: "spring", bounce: 0.5 }}
            style={{ fontSize: "28px" }}
          >
            {activeRisks}
          </motion.text>
          
          {/* Threats Label */}
          <text 
            y="28" 
            textAnchor="middle" 
            fill={theme.primary}
            fontSize="8" 
            letterSpacing="1" 
            fontFamily="monospace"
            opacity="0.8"
          >
            THREATS
          </text>
        </g>

        {/* --- LAYER 8: LIME SHIELD RING (Warning Only) --- */}
        <AnimatePresence>
          {isWarning && (
            <motion.circle
              cx="200" cy="200"
              r="70"
              fill="none"
              stroke="#84CC16"
              strokeWidth="2"
              strokeDasharray="10, 5"
              initial={{ scale: 0.8, opacity: 0, rotate: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: 360 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: '200px 200px' }}
            />
          )}
        </AnimatePresence>
      </svg>

      {/* --- OVERLAY: CRITICAL FLASH --- */}
      <AnimatePresence>
        {isCritical && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.15, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{ backgroundColor: theme.primary }}
          />
        )}
      </AnimatePresence>

      {/* Bottom Label */}
      <div className="absolute bottom-2 left-0 right-0 text-center">
        <span 
          className="text-[8px] font-mono uppercase tracking-widest transition-colors duration-500"
          style={{ color: isCritical ? theme.primary : 'rgba(255,255,255,0.3)' }}
        >
          NexusCanon Risk Telemetry Grid
        </span>
      </div>
    </div>
  );
};

