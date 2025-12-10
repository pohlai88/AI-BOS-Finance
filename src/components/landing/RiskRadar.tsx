/**
 * RiskRadar - 3-Stage Threat Detection Visualization
 * 
 * STATE NORMAL (< 4): Silent, standard green monitoring
 * STATE WARNING (= 4): Tangy Orange + Clock-Hand scanner + Lime Shield ring
 * STATE CRITICAL (5+): Red Rage + Speed scanner + Expanding protection waves
 */

import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, AlertTriangle, Scan, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RiskRadarProps {
  activeRisks: number;
}

export const RiskRadar = ({ activeRisks }: RiskRadarProps) => {
  // 1. DETERMINE SYSTEM STATE
  const isWarning = activeRisks === 4;
  const isCritical = activeRisks >= 5;

  // 2. DYNAMIC THEME COLORS
  const theme = isCritical
    ? { primary: '#EF4444', glow: 'rgba(239, 68, 68, 0.6)', bg: 'rgba(239, 68, 68, 0.1)' } // Red Rage
    : isWarning
    ? { primary: '#F97316', glow: 'rgba(249, 115, 22, 0.6)', bg: 'rgba(249, 115, 22, 0.1)' } // Tangy Orange
    : { primary: '#10B981', glow: 'rgba(16, 185, 129, 0.4)', bg: 'rgba(16, 185, 129, 0.05)' }; // Nexus Green

  return (
    <div className={cn(
      "relative w-full aspect-square max-h-[400px] mx-auto rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 transition-colors duration-1000",
      // Allow overflow in critical state so waves can go "bigger bigger"
      isCritical ? "overflow-visible" : "overflow-hidden"
    )}>
      
      {/* --- UI HEADER: Live Status --- */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border bg-black/50 backdrop-blur-md transition-colors duration-500"
             style={{ borderColor: theme.primary }}>
          {isCritical ? (
            <AlertTriangle className="w-4 h-4 animate-pulse" style={{ color: theme.primary }} />
          ) : isWarning ? (
            <Shield className="w-4 h-4" style={{ color: theme.primary }} />
          ) : (
            <Scan className="w-4 h-4 text-emerald-500" />
          )}
          <span className="text-[10px] font-mono uppercase tracking-widest font-bold transition-colors duration-500"
                style={{ color: theme.primary }}>
            {isCritical ? 'BREACH DETECTED' : isWarning ? 'SHIELD ACTIVE' : 'LIVE SCAN'}
          </span>
        </div>
      </div>

      <svg viewBox="0 0 400 400" className="w-full h-full relative z-10" style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="radar-gradient">
            <stop offset="0%" stopColor={theme.primary} stopOpacity="0.5" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* --- LAYER 1: THE EXPANDING WAVES (Threat Level 5+) --- */}
        {/* "Bigger bigger bigger" effect - continuous expanding protection layer */}
        <AnimatePresence>
          {isCritical && (
            <g>
              {[0, 1, 2].map((i) => (
                <motion.circle
                  key={`rage-wave-${i}`}
                  cx="200" cy="200" r="50"
                  fill="none"
                  stroke={theme.primary}
                  strokeWidth="2"
                  initial={{ r: 50, opacity: 1, strokeWidth: 4 }}
                  animate={{ r: 400, opacity: 0, strokeWidth: 0 }} // Expands way outside
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: i * 0.8,
                    ease: "easeOut"
                  }}
                />
              ))}
            </g>
          )}
        </AnimatePresence>

        {/* --- LAYER 2: THE GRID STRUCTURE --- */}
        <g className="transition-opacity duration-500" style={{ opacity: isCritical ? 0.4 : 0.6 }}>
          {[80, 120, 160, 200].map((radius, i) => (
            <motion.circle
              key={`grid-${i}`}
              cx="200" cy="200" r={radius}
              fill="none"
              stroke={isCritical ? theme.primary : "rgba(255, 255, 255, 0.1)"}
              strokeWidth="1"
              strokeDasharray="4,4"
              animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
              transition={{ duration: 60 + i * 10, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: '200px 200px' }}
            />
          ))}
          <line x1="200" y1="0" x2="200" y2="400" stroke="rgba(255,255,255,0.05)" />
          <line x1="0" y1="200" x2="400" y2="200" stroke="rgba(255,255,255,0.05)" />
        </g>

        {/* --- LAYER 3: THE CLOCK-POINTER SCANNER (Threat Level 4 & 5) --- */}
        <AnimatePresence>
          {(isWarning || isCritical) && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, rotate: 360 }}
              exit={{ opacity: 0 }}
              transition={{ duration: isCritical ? 2 : 4, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: '200px 200px' }}
            >
              {/* The "Clock Hand" */}
              <line x1="200" y1="200" x2="200" y2="20" stroke={theme.primary} strokeWidth="2" />
              
              {/* The "Wave" behind the hand */}
              <path d="M200,200 L200,20 A180,180 0 0,1 350,150 Z" fill="url(#radar-gradient)" opacity="0.3" />
            </motion.g>
          )}
        </AnimatePresence>

        {/* --- LAYER 4: THE CORE (Reacts to Count) --- */}
        <g transform="translate(200, 200)">
          {/* Core Background Plate */}
          <motion.circle
            r="45"
            fill="#050505"
            stroke={theme.primary}
            strokeWidth={isCritical ? 3 : 1}
            animate={{
              r: isWarning ? 55 : isCritical ? 50 : 45,
              strokeOpacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Core Number */}
          <motion.text
            y="12"
            textAnchor="middle"
            fontWeight="bold"
            fontFamily="monospace"
            animate={{
              fill: theme.primary,
              scale: isWarning ? 1.4 : isCritical ? 1.2 : 1,
            }}
            transition={{ type: "spring", bounce: 0.5 }}
            style={{ fontSize: "32px" }}
          >
            {activeRisks}
          </motion.text>

          {/* Core Label */}
          <motion.text
            y="28"
            textAnchor="middle"
            fontSize="8"
            letterSpacing="2"
            fill="rgba(255,255,255,0.5)"
          >
            THREATS
          </motion.text>
        </g>

        {/* --- LAYER 5: THE LIME SHIELD (Threat Level 4 ONLY) --- */}
        <AnimatePresence>
          {isWarning && (
            <>
              {/* The Shield Ring */}
              <motion.circle
                cx="200" cy="200"
                r="75"
                fill="none"
                stroke="#84CC16"
                strokeWidth="2"
                strokeDasharray="20, 10"
                initial={{ scale: 0.8, opacity: 0, rotate: 0 }}
                animate={{ scale: 1, opacity: 1, rotate: 180 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: '200px 200px' }}
              />
              {/* Shield Icon indicator */}
              <motion.g
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transform="translate(192, 135)"
              >
                <ShieldCheck className="w-4 h-4 text-lime-500 fill-lime-500/20" />
              </motion.g>
            </>
          )}
        </AnimatePresence>

      </svg>

      {/* --- OVERLAY: CRITICAL FLASH (Threat Level 5+) --- */}
      <AnimatePresence>
        {isCritical && (
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.15, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{ backgroundColor: theme.primary }}
          />
        )}
      </AnimatePresence>

    </div>
  );
};
