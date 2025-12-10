// ============================================================================
// INTEGRATED ENGINE v3.1 - "The Impact System" (FIXED)
// Fixed: SVG radius errors, enhanced earthquake physics
// Features: Interval-based screen shake, simplified stable SVG, heavy physics
// ============================================================================

import { createContext, useContext, useEffect } from 'react';
import { motion } from 'motion/react';

// --- TYPES & CONTEXT ---
interface EngineContextType {
  state: 'idle' | 'revving';
}

const EngineContext = createContext<EngineContextType>({ state: 'idle' });

// --- THEME CONSTANTS ---
const THEME = {
  amber: '#FFD700', // Flywheel
  cyan: '#00F0FF',  // Piston
  nexus: '#28E7A2',
  grid: '#1a1a1a',
};

// --- PROVIDER COMPONENT ---
// This handles the "Earthquake" logic when the engine revs
export const EngineProvider = ({ 
  children, 
  state, 
  setState, 
  shakeX, 
  shakeY 
}: any) => {

  // The Physics Loop: Triggers screen shake on piston slams
  useEffect(() => {
    let interval: any;
    if (state === 'revving') {
      // Violent shake every 400ms (synced with piston)
      interval = setInterval(() => {
        const intensity = 5; 
        shakeX.set(Math.random() * intensity - intensity/2);
        shakeY.set(Math.random() * intensity - intensity/2);
        
        // Reset quickly (damping)
        setTimeout(() => {
          shakeX.set(0);
          shakeY.set(0);
        }, 50);
      }, 400); 
    } else {
      // Gentle idle vibration
      interval = setInterval(() => {
        const intensity = 0.5;
        shakeX.set(Math.random() * intensity - intensity/2);
        shakeY.set(Math.random() * intensity - intensity/2);
        
        setTimeout(() => {
          shakeX.set(0);
          shakeY.set(0);
        }, 100);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [state, shakeX, shakeY]);

  return (
    <EngineContext.Provider value={{ state }}>
      {children}
    </EngineContext.Provider>
  );
};

// --- UTILITY: POLAR MATH ---
const polarToCartesian = (cx: number, cy: number, r: number, degrees: number) => {
  const radians = (degrees - 90) * Math.PI / 180;
  return {
    x: cx + r * Math.cos(radians),
    y: cy + r * Math.sin(radians),
  };
};

// --- COMPONENT 1: AMBER FLYWHEEL (Left) ---
export const AmberFlywheel = () => {
  const { state } = useContext(EngineContext);

  // Generate precision tick marks
  const ticks = Array.from({ length: 60 }).map((_, i) => {
    const angle = (i / 60) * 360;
    const isMajor = i % 5 === 0;
    const r1 = 130;
    const r2 = isMajor ? 115 : 122;
    const start = polarToCartesian(150, 150, r1, angle);
    const end = polarToCartesian(150, 150, r2, angle);
    return { x1: start.x, y1: start.y, x2: end.x, y2: end.y, isMajor, angle };
  });

  return (
    <div className="absolute left-[8vw] top-1/2 -translate-y-1/2 w-[300px] h-[300px] pointer-events-none">
      <svg width="300" height="300" viewBox="0 0 300 300" className="overflow-visible">
        <defs>
          <filter id="amber-glow">
            <feGaussianBlur stdDeviation="2" result="blur1"/>
            <feGaussianBlur stdDeviation="8" result="blur2"/>
            <feMerge>
              <feMergeNode in="blur2"/>
              <feMergeNode in="blur1"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <radialGradient id="amber-radial">
            <stop offset="0%" stopColor={THEME.amber} stopOpacity="0.2" />
            <stop offset="70%" stopColor={THEME.amber} stopOpacity="0.05" />
            <stop offset="100%" stopColor={THEME.amber} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Volumetric glow */}
        <circle cx="150" cy="150" r="180" fill="url(#amber-radial)" />
        
        {/* Main Spinning Gear */}
        <motion.g 
          style={{ originX: "150px", originY: "150px" }}
          animate={{ rotate: 360 }}
          transition={{ 
            // IDLE: 20s rotation (Heavy/Slow)
            // REVVING: 2s rotation (High Torque)
            duration: state === 'idle' ? 20 : 2, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        >
          {/* Outer Ring with teeth */}
          <circle cx="150" cy="150" r="130" stroke={THEME.amber} strokeWidth="1" strokeDasharray="4 4" fill="none" opacity="0.3" />
          
          {/* Main Flywheel Mass */}
          <circle cx="150" cy="150" r="120" stroke={THEME.amber} strokeWidth="2" fill="none" opacity="0.8" />
          
          {/* Precision tick marks */}
          {ticks.map((tick, i) => (
            <line 
              key={i}
              x1={tick.x1} y1={tick.y1}
              x2={tick.x2} y2={tick.y2}
              stroke={THEME.amber}
              strokeWidth={tick.isMajor ? 1.5 : 0.5}
              opacity={tick.isMajor ? 0.9 : 0.5}
            />
          ))}

          {/* Degree labels */}
          {ticks.filter(t => t.isMajor).map((tick, i) => {
            const label = (i * 30).toString();
            const pos = polarToCartesian(150, 150, 100, tick.angle);
            return (
              <text
                key={i}
                x={pos.x} y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={THEME.amber}
                opacity="0.7"
                style={{ fontSize: '8px', fontFamily: 'monospace', fontWeight: '600' }}
              >
                {label}
              </text>
            );
          })}
          
          {/* Inner Spokes */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * 360;
            const inner = polarToCartesian(150, 150, 40, angle);
            const outer = polarToCartesian(150, 150, 100, angle);
            return (
              <line 
                key={i}
                x1={inner.x} y1={inner.y}
                x2={outer.x} y2={outer.y}
                stroke={THEME.amber}
                strokeWidth="1"
                opacity="0.4"
              />
            );
          })}
        </motion.g>

        {/* Center hub */}
        <circle cx="150" cy="150" r="38" stroke={THEME.amber} strokeWidth="1" fill="none" opacity="0.7" />
        <circle cx="150" cy="150" r="15" fill={THEME.amber} opacity="0.9" />
        <circle cx="150" cy="150" r="8" fill="#000" opacity="0.8" />

        {/* Apply glow */}
        <g filter="url(#amber-glow)" opacity="0.6">
          <circle cx="150" cy="150" r="120" stroke={THEME.amber} strokeWidth="0.5" fill="none" />
        </g>

        {/* Static Mounting Arm (Connects to center screen) */}
        <motion.g
          animate={{ opacity: state === 'idle' ? 0.3 : 0.7 }}
          transition={{ duration: 0.3 }}
        >
          <path d="M 150 150 L 300 150" stroke={THEME.amber} strokeWidth="6" opacity="0.4" />
          <path d="M 150 150 L 300 150" stroke={THEME.amber} strokeWidth="2" opacity="0.8" />
          {/* Bolt points */}
          <circle cx="190" cy="150" r="4" fill={THEME.amber} opacity="0.7" />
          <circle cx="230" cy="150" r="4" fill={THEME.amber} opacity="0.7" />
          <circle cx="270" cy="150" r="4" fill={THEME.amber} opacity="0.7" />
        </motion.g>
      </svg>

      {/* RPM Readout */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 font-mono uppercase tracking-widest"
        style={{ fontSize: '9px', color: THEME.amber }}
      >
        RPM: {state === 'idle' ? '800' : '7500'}
      </div>
    </div>
  );
};

// --- COMPONENT 2: TRANSMISSION SHAFT (Center) ---
export const TransmissionShaft = () => {
  const { state } = useContext(EngineContext);

  return (
    <div 
      className="absolute top-1/2 -translate-y-1/2 h-[3px] bg-[#0a0a0a] overflow-hidden opacity-60 z-0 hidden lg:block"
      style={{
        left: 'calc(8vw + 150px)',
        right: 'calc(8vw + 100px)',
      }}
    >
      {/* Mechanical Ribs Pattern */}
      <div 
        className="absolute inset-0 opacity-40" 
        style={{ 
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.5) 8px, rgba(0,0,0,0.5) 10px)',
        }} 
      />
      
      {/* Energy Pulse - The Visual Connection */}
      <motion.div 
        className="absolute top-0 bottom-0 w-40 bg-gradient-to-r from-transparent via-white to-transparent"
        style={{ filter: 'blur(4px)' }}
        animate={{ left: ['-100%', '500%'] }}
        transition={{ 
          // IDLE: Slow pulsing flow (3s)
          // REVVING: Rapid fire injection (0.4s)
          duration: state === 'idle' ? 3 : 0.4, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      />

      {/* Secondary particles */}
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          className="absolute top-0 bottom-0 w-20"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.3), transparent)',
            filter: 'blur(2px)',
          }}
          animate={{ left: ['-10%', '110%'] }}
          transition={{
            duration: state === 'idle' ? 3 : 0.4,
            repeat: Infinity,
            ease: 'linear',
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
};

// --- COMPONENT 3: CYAN PISTON (Right) ---
export const CyanPiston = () => {
  const { state } = useContext(EngineContext);

  return (
    <div className="absolute right-[8vw] top-1/2 -translate-y-1/2 w-[200px] h-[420px] pointer-events-none">
      <svg width="200" height="420" viewBox="0 0 200 420" className="overflow-visible">
        <defs>
          <filter id="cyan-glow">
            <feGaussianBlur stdDeviation="2" result="blur1"/>
            <feGaussianBlur stdDeviation="8" result="blur2"/>
            <feMerge>
              <feMergeNode in="blur2"/>
              <feMergeNode in="blur1"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <radialGradient id="cyan-radial">
            <stop offset="0%" stopColor={THEME.cyan} stopOpacity="0.25" />
            <stop offset="70%" stopColor={THEME.cyan} stopOpacity="0.08" />
            <stop offset="100%" stopColor={THEME.cyan} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Volumetric glow */}
        <ellipse cx="100" cy="210" rx="120" ry="240" fill="url(#cyan-radial)" />

        {/* Cylinder Housing (Static) */}
        <rect x="60" y="50" width="80" height="320" stroke={THEME.cyan} strokeWidth="1" fill="rgba(0, 240, 255, 0.02)" opacity="0.6" />
        
        {/* Measurement Ticks */}
        {Array.from({ length: 17 }).map((_, i) => {
          const y = 50 + i * 20;
          const isMajor = i % 5 === 0;
          return (
            <g key={i}>
              <line x1="50" y1={y} x2="60" y2={y} stroke={THEME.cyan} strokeWidth={isMajor ? 1 : 0.5} opacity={isMajor ? 0.7 : 0.4} />
              <line x1="140" y1={y} x2="150" y2={y} stroke={THEME.cyan} strokeWidth={isMajor ? 1 : 0.5} opacity={isMajor ? 0.7 : 0.4} />
              {isMajor && (
                <text x="45" y={y} textAnchor="end" dominantBaseline="middle" fill={THEME.cyan} opacity="0.6" style={{ fontSize: '7px', fontFamily: 'monospace' }}>
                  {i * 20}
                </text>
              )}
            </g>
          );
        })}

        {/* Top/Bottom brackets */}
        <rect x="70" y="40" width="60" height="8" stroke={THEME.cyan} strokeWidth="0.5" fill="none" opacity="0.5" />
        <rect x="70" y="372" width="60" height="8" stroke={THEME.cyan} strokeWidth="0.5" fill="none" opacity="0.5" />

        {/* The Moving Piston Head */}
        <motion.g
          animate={{ y: [0, 220, 0] }}
          transition={{ 
            // IDLE: Smooth Sine Wave (Breathing)
            // REVVING: Sharp "Slam" (Heavy Physics)
            duration: state === 'idle' ? 5 : 0.4, 
            repeat: Infinity, 
            ease: state === 'idle' ? "easeInOut" : [0.1, 1, 0.57, 1] // Custom Bezier for Impact
          }}
        >
          {/* Piston Head Body */}
          <rect x="64" y="70" width="72" height="60" fill={`${THEME.cyan}20`} opacity="0.9" />
          <rect x="64" y="70" width="72" height="60" stroke={THEME.cyan} strokeWidth="2" fill="none" />
          
          {/* Compression Rings */}
          <line x1="68" y1="85" x2="132" y2="85" stroke={THEME.cyan} strokeWidth="0.5" opacity="0.8" />
          <line x1="68" y1="100" x2="132" y2="100" stroke={THEME.cyan} strokeWidth="0.5" opacity="0.8" />
          <line x1="68" y1="115" x2="132" y2="115" stroke={THEME.cyan} strokeWidth="0.5" opacity="0.8" />
          
          {/* Center connection point */}
          <circle cx="100" cy="100" r="7" stroke={THEME.cyan} strokeWidth="1" fill="none" opacity="0.9" />
          <circle cx="100" cy="100" r="3" fill={THEME.cyan} opacity="0.8" />
        </motion.g>

        {/* Impact flash at bottom (appears when piston hits) */}
        {state === 'revving' && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 0.15,
              repeat: Infinity,
              repeatDelay: 0.25,
              times: [0, 0.3, 1],
            }}
          >
            <line x1="60" y1="370" x2="140" y2="370" stroke={THEME.cyan} strokeWidth="3" opacity="0.8" filter="url(#cyan-glow)" />
            
            {/* Impact particles/sparks */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i / 8) * 360;
              const x = 100 + 30 * Math.cos(angle * Math.PI / 180);
              const y = 370 + 20 * Math.sin(angle * Math.PI / 180);
              return (
                <motion.circle
                  key={i}
                  r="1.5"
                  fill={THEME.cyan}
                  animate={{
                    cx: [100, x],
                    cy: [370, y],
                    opacity: [1, 0],
                  }}
                  transition={{
                    duration: 0.3,
                    repeat: Infinity,
                    repeatDelay: 0.1,
                    ease: 'easeOut',
                  }}
                />
              );
            })}
          </motion.g>
        )}

        {/* Apply glow to housing */}
        <g filter="url(#cyan-glow)" opacity="0.5">
          <rect x="60" y="50" width="80" height="320" stroke={THEME.cyan} strokeWidth="0.5" fill="none" />
        </g>

        {/* Connecting rod to center */}
        <motion.g
          animate={{ opacity: state === 'idle' ? 0.3 : 0.7 }}
          transition={{ duration: 0.3 }}
        >
          <line x1="0" y1="210" x2="60" y2="210" stroke={THEME.cyan} strokeWidth="4" strokeDasharray="6 3" opacity="0.6" />
          <circle cx="20" cy="210" r="3" fill={THEME.cyan} opacity="0.7" />
        </motion.g>
      </svg>

      {/* Pressure Readout (Dynamic) */}
      <div 
        className="absolute top-4 right-4 font-mono uppercase tracking-widest text-right"
        style={{ fontSize: '9px', color: THEME.cyan }}
      >
        <div>PRESSURE</div>
        <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
          {state === 'idle' ? '2.4 BAR' : '8.9 BAR'}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT 4: AMBER PISTON (Top Right) ---
export const AmberPistonTop = () => {
  const { state } = useContext(EngineContext);

  return (
    <div className="absolute right-[14vw] top-[15vh] w-[120px] h-[280px] pointer-events-none">
      <svg width="120" height="280" viewBox="0 0 120 280" className="overflow-visible">
        <defs>
          <filter id="amber-piston-glow">
            <feGaussianBlur stdDeviation="2" result="blur1"/>
            <feGaussianBlur stdDeviation="6" result="blur2"/>
            <feMerge>
              <feMergeNode in="blur2"/>
              <feMergeNode in="blur1"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="amber-piston-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={THEME.amber} stopOpacity="0.15" />
            <stop offset="100%" stopColor={THEME.amber} stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* Volumetric glow */}
        <ellipse cx="60" cy="140" rx="80" ry="160" fill={`${THEME.amber}15`} opacity="0.4" />

        {/* Hydraulic Cylinder Housing (Hexagonal design) */}
        <path 
          d="M 40 40 L 50 30 L 70 30 L 80 40 L 80 240 L 70 250 L 50 250 L 40 240 Z"
          stroke={THEME.amber} 
          strokeWidth="1" 
          fill="url(#amber-piston-gradient)" 
          opacity="0.7" 
        />

        {/* Hydraulic fluid level indicators */}
        {Array.from({ length: 11 }).map((_, i) => {
          const y = 40 + i * 20;
          const isMajor = i % 3 === 0;
          return (
            <g key={i}>
              <line x1="35" y1={y} x2="40" y2={y} stroke={THEME.amber} strokeWidth={isMajor ? 1 : 0.5} opacity={isMajor ? 0.8 : 0.4} />
              <line x1="80" y1={y} x2="85" y2={y} stroke={THEME.amber} strokeWidth={isMajor ? 1 : 0.5} opacity={isMajor ? 0.8 : 0.4} />
            </g>
          );
        })}

        {/* Hexagonal mounting brackets */}
        <path d="M 45 25 L 50 20 L 70 20 L 75 25" stroke={THEME.amber} strokeWidth="0.5" fill="none" opacity="0.6" />
        <path d="M 45 255 L 50 260 L 70 260 L 75 255" stroke={THEME.amber} strokeWidth="0.5" fill="none" opacity="0.6" />

        {/* The Moving Hydraulic Piston */}
        <motion.g
          animate={{ y: [0, 140, 0] }}
          transition={{ 
            duration: state === 'idle' ? 4 : 0.6, 
            repeat: Infinity, 
            ease: state === 'idle' ? "easeInOut" : [0.2, 0.9, 0.4, 1]
          }}
        >
          {/* Hexagonal piston head */}
          <path 
            d="M 42 50 L 52 40 L 68 40 L 78 50 L 78 80 L 68 90 L 52 90 L 42 80 Z"
            fill={`${THEME.amber}25`} 
            opacity="0.9" 
          />
          <path 
            d="M 42 50 L 52 40 L 68 40 L 78 50 L 78 80 L 68 90 L 52 90 L 42 80 Z"
            stroke={THEME.amber} 
            strokeWidth="1.5" 
            fill="none" 
          />
          
          {/* Hydraulic seals */}
          <line x1="46" y1="58" x2="74" y2="58" stroke={THEME.amber} strokeWidth="0.5" opacity="0.7" />
          <line x1="46" y1="72" x2="74" y2="72" stroke={THEME.amber} strokeWidth="0.5" opacity="0.7" />
          
          {/* Center shaft */}
          <rect x="56" y="65" width="8" height="10" stroke={THEME.amber} strokeWidth="0.5" fill="none" opacity="0.8" />
          <circle cx="60" cy="70" r="2" fill={THEME.amber} opacity="0.9" />
        </motion.g>

        {/* Hydraulic compression effect */}
        {state === 'revving' && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 0.2,
              repeat: Infinity,
              repeatDelay: 0.4,
              times: [0, 0.4, 1],
            }}
          >
            <line x1="40" y1="240" x2="80" y2="240" stroke={THEME.amber} strokeWidth="2" opacity="0.9" filter="url(#amber-piston-glow)" />
            
            {/* Pressure waves */}
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.ellipse
                key={i}
                cx="60"
                cy="240"
                rx="0"
                ry="0"
                stroke={THEME.amber}
                strokeWidth="0.5"
                fill="none"
                animate={{
                  rx: [0, 30],
                  ry: [0, 15],
                  opacity: [0.8, 0],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 0.1,
                  ease: 'easeOut',
                  delay: i * 0.15,
                }}
              />
            ))}
          </motion.g>
        )}

        {/* Apply glow to housing */}
        <g filter="url(#amber-piston-glow)" opacity="0.4">
          <path 
            d="M 40 40 L 50 30 L 70 30 L 80 40 L 80 240 L 70 250 L 50 250 L 40 240 Z"
            stroke={THEME.amber} 
            strokeWidth="0.5" 
            fill="none" 
          />
        </g>
      </svg>

      {/* Hydraulic Pressure Readout */}
      <div 
        className="absolute top-2 left-2 font-mono uppercase tracking-widest"
        style={{ fontSize: '7px', color: THEME.amber }}
      >
        <div>HYDRAULIC</div>
        <div style={{ fontSize: '9px', fontWeight: 'bold' }}>
          {state === 'idle' ? '1.8 BAR' : '6.2 BAR'}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT 5: NEXUS PISTON (Bottom Left) ---
export const NexusPistonBottom = () => {
  const { state } = useContext(EngineContext);

  return (
    <div className="absolute left-[12vw] bottom-[12vh] w-[160px] h-[360px] pointer-events-none">
      <svg width="160" height="360" viewBox="0 0 160 360" className="overflow-visible">
        <defs>
          <filter id="nexus-piston-glow">
            <feGaussianBlur stdDeviation="2" result="blur1"/>
            <feGaussianBlur stdDeviation="10" result="blur2"/>
            <feMerge>
              <feMergeNode in="blur2"/>
              <feMergeNode in="blur1"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <radialGradient id="nexus-piston-radial">
            <stop offset="0%" stopColor={THEME.nexus} stopOpacity="0.2" />
            <stop offset="70%" stopColor={THEME.nexus} stopOpacity="0.06" />
            <stop offset="100%" stopColor={THEME.nexus} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Volumetric glow */}
        <ellipse cx="80" cy="180" rx="100" ry="200" fill="url(#nexus-piston-radial)" />

        {/* Dual Chamber Cylinder (Vertical split design) */}
        <rect x="45" y="40" width="30" height="280" stroke={THEME.nexus} strokeWidth="1" fill={`${THEME.nexus}05`} opacity="0.6" />
        <rect x="85" y="40" width="30" height="280" stroke={THEME.nexus} strokeWidth="1" fill={`${THEME.nexus}05`} opacity="0.6" />
        
        {/* Center divider */}
        <line x1="80" y1="40" x2="80" y2="320" stroke={THEME.nexus} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" />

        {/* Digital scale markers */}
        {Array.from({ length: 15 }).map((_, i) => {
          const y = 40 + i * 20;
          const isMajor = i % 4 === 0;
          return (
            <g key={i}>
              <line x1="40" y1={y} x2="45" y2={y} stroke={THEME.nexus} strokeWidth={isMajor ? 1 : 0.5} opacity={isMajor ? 0.8 : 0.5} />
              <line x1="115" y1={y} x2="120" y2={y} stroke={THEME.nexus} strokeWidth={isMajor ? 1 : 0.5} opacity={isMajor ? 0.8 : 0.5} />
              {isMajor && (
                <text x="35" y={y} textAnchor="end" dominantBaseline="middle" fill={THEME.nexus} opacity="0.6" style={{ fontSize: '6px', fontFamily: 'monospace' }}>
                  {(14 - i) * 25}
                </text>
              )}
            </g>
          );
        })}

        {/* Top/Bottom mounting plates */}
        <rect x="40" y="30" width="80" height="8" stroke={THEME.nexus} strokeWidth="0.5" fill="none" opacity="0.5" />
        <rect x="40" y="322" width="80" height="8" stroke={THEME.nexus} strokeWidth="0.5" fill="none" opacity="0.5" />

        {/* Dual Moving Pistons (synchronized) */}
        <motion.g
          animate={{ y: [0, 200, 0] }}
          transition={{ 
            duration: state === 'idle' ? 6 : 0.5, 
            repeat: Infinity, 
            ease: state === 'idle' ? "easeInOut" : [0.15, 0.85, 0.3, 1]
          }}
        >
          {/* Left piston */}
          <rect x="48" y="60" width="24" height="50" fill={`${THEME.nexus}20`} opacity="0.9" />
          <rect x="48" y="60" width="24" height="50" stroke={THEME.nexus} strokeWidth="1.5" fill="none" />
          <line x1="52" y1="72" x2="68" y2="72" stroke={THEME.nexus} strokeWidth="0.5" opacity="0.7" />
          <line x1="52" y1="85" x2="68" y2="85" stroke={THEME.nexus} strokeWidth="0.5" opacity="0.7" />
          <line x1="52" y1="98" x2="68" y2="98" stroke={THEME.nexus} strokeWidth="0.5" opacity="0.7" />
          
          {/* Right piston */}
          <rect x="88" y="60" width="24" height="50" fill={`${THEME.nexus}20`} opacity="0.9" />
          <rect x="88" y="60" width="24" height="50" stroke={THEME.nexus} strokeWidth="1.5" fill="none" />
          <line x1="92" y1="72" x2="108" y2="72" stroke={THEME.nexus} strokeWidth="0.5" opacity="0.7" />
          <line x1="92" y1="85" x2="108" y2="85" stroke={THEME.nexus} strokeWidth="0.5" opacity="0.7" />
          <line x1="92" y1="98" x2="108" y2="98" stroke={THEME.nexus} strokeWidth="0.5" opacity="0.7" />
          
          {/* Center synchronization shaft */}
          <rect x="70" y="82" width="20" height="6" stroke={THEME.nexus} strokeWidth="0.5" fill={`${THEME.nexus}15`} opacity="0.8" />
          <circle cx="80" cy="85" r="2.5" fill={THEME.nexus} opacity="0.9" />
        </motion.g>

        {/* Impact flash at bottom (dual impact) */}
        {state === 'revving' && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 0.15,
              repeat: Infinity,
              repeatDelay: 0.35,
              times: [0, 0.35, 1],
            }}
          >
            <line x1="45" y1="318" x2="75" y2="318" stroke={THEME.nexus} strokeWidth="2.5" opacity="0.9" filter="url(#nexus-piston-glow)" />
            <line x1="85" y1="318" x2="115" y2="318" stroke={THEME.nexus} strokeWidth="2.5" opacity="0.9" filter="url(#nexus-piston-glow)" />
            
            {/* Dual spark particles */}
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i / 6) * 180 - 90;
              const xBase = i < 3 ? 60 : 100;
              const x = xBase + 25 * Math.cos(angle * Math.PI / 180);
              const y = 318 + 18 * Math.sin(angle * Math.PI / 180);
              return (
                <motion.circle
                  key={i}
                  r="1"
                  fill={THEME.nexus}
                  animate={{
                    cx: [xBase, x],
                    cy: [318, y],
                    opacity: [1, 0],
                  }}
                  transition={{
                    duration: 0.25,
                    repeat: Infinity,
                    repeatDelay: 0.25,
                    ease: 'easeOut',
                  }}
                />
              );
            })}
          </motion.g>
        )}

        {/* Apply glow to housing */}
        <g filter="url(#nexus-piston-glow)" opacity="0.5">
          <rect x="45" y="40" width="30" height="280" stroke={THEME.nexus} strokeWidth="0.5" fill="none" />
          <rect x="85" y="40" width="30" height="280" stroke={THEME.nexus} strokeWidth="0.5" fill="none" />
        </g>

        {/* Connection arms to center */}
        <motion.g
          animate={{ opacity: state === 'idle' ? 0.3 : 0.7 }}
          transition={{ duration: 0.3 }}
        >
          <line x1="120" y1="180" x2="160" y2="180" stroke={THEME.nexus} strokeWidth="3" strokeDasharray="4 2" opacity="0.5" />
          <circle cx="135" cy="180" r="2.5" fill={THEME.nexus} opacity="0.7" />
        </motion.g>
      </svg>

      {/* Flow Rate Readout */}
      <div 
        className="absolute bottom-4 left-4 font-mono uppercase tracking-widest"
        style={{ fontSize: '7px', color: THEME.nexus }}
      >
        <div>FLOW RATE</div>
        <div style={{ fontSize: '9px', fontWeight: 'bold' }}>
          {state === 'idle' ? '3.2 L/M' : '9.8 L/M'}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// REACTOR ASSEMBLY COMPONENTS (For Sign-Up Page)
// ============================================================================

// --- COMPONENT 6: REACTOR CORE (Center Background) ---
export const ReactorCore = ({ stability }: { stability: number }) => {
  // stability: 0 (volatile) -> 100 (stable)
  const isStable = stability > 80;
  const isModerate = stability > 40 && stability <= 80;
  
  // Color based on stability
  const coreColor = isStable ? THEME.cyan : isModerate ? '#FFD700' : '#FF0055';
  
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none opacity-30 z-0">
      <svg width="600" height="600" viewBox="0 0 600 600" className="overflow-visible">
        <defs>
          <filter id="core-glow">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="core-radial">
            <stop offset="0%" stopColor={coreColor} stopOpacity="0.4" />
            <stop offset="50%" stopColor={coreColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={coreColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Volumetric glow */}
        <circle cx="300" cy="300" r="280" fill="url(#core-radial)" />

        {/* Outer Containment Rings */}
        <motion.g 
          animate={{ rotate: 360 }} 
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          style={{ originX: '300px', originY: '300px' }}
        >
          <circle cx="300" cy="300" r="280" stroke="#1a1a1a" strokeWidth="1" strokeDasharray="20 10" fill="none" />
          <circle cx="300" cy="300" r="260" stroke="#222" strokeWidth="20" fill="none" opacity="0.5" />
        </motion.g>

        {/* Magnetic Stabilizer Rings (React to stability) */}
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.g
            key={i}
            style={{ originX: '300px', originY: '300px' }}
            animate={{ rotate: 360 }}
            transition={{ 
              duration: isStable ? 20 + i * 5 : 2 + i * 0.5, 
              repeat: Infinity, 
              ease: "linear"
            }}
          >
            <ellipse
              cx="300" cy="300"
              rx={100 + i * 40} 
              ry={250 - i * 20}
              stroke={coreColor}
              strokeWidth="1"
              fill="none"
              opacity={0.3}
            />
          </motion.g>
        ))}

        {/* Energy Arcs (Unstable cores have more arcs) */}
        {!isStable && Array.from({ length: 6 }).map((_, i) => {
          const angle = (i / 6) * 360;
          const x1 = 300 + 80 * Math.cos(angle * Math.PI / 180);
          const y1 = 300 + 80 * Math.sin(angle * Math.PI / 180);
          const x2 = 300 + 200 * Math.cos(angle * Math.PI / 180);
          const y2 = 300 + 200 * Math.sin(angle * Math.PI / 180);
          
          return (
            <motion.line
              key={i}
              x1={x1} y1={y1}
              x2={x2} y2={y2}
              stroke={coreColor}
              strokeWidth="0.5"
              opacity={0}
              animate={{
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: 0.3,
                delay: i * 0.1,
                repeat: Infinity,
                repeatDelay: 0.5,
              }}
            />
          );
        })}

        {/* The Core Itself */}
        <motion.circle 
          cx="300" cy="300" r="50" 
          fill={coreColor}
          filter="url(#core-glow)"
          animate={{ 
            scale: isStable ? [1, 1.08, 1] : [0.85, 1.3, 0.85],
            opacity: [0.5, 1, 0.5] 
          }}
          transition={{ 
            duration: isStable ? 4 : 0.6, 
            repeat: Infinity,
            ease: isStable ? 'easeInOut' : 'easeInOut',
          }}
        />
        
        {/* Inner core detail */}
        <motion.circle 
          cx="300" cy="300" r="25" 
          fill="none"
          stroke={coreColor}
          strokeWidth="1"
          opacity="0.8"
          animate={{ 
            scale: isStable ? [1, 1.2, 1] : [0.8, 1.5, 0.8],
          }}
          transition={{ 
            duration: isStable ? 3 : 0.4, 
            repeat: Infinity 
          }}
        />
      </svg>
    </div>
  );
};

// --- COMPONENT 7: COOLANT CIRCULATION SYSTEM (Left) ---
export const CoolantSystem = ({ active }: { active: boolean }) => {
  return (
    <div className="absolute left-[8vw] top-1/2 -translate-y-1/2 w-[180px] h-[400px] pointer-events-none">
      <svg width="180" height="400" viewBox="0 0 180 400" className="overflow-visible">
        <defs>
          <linearGradient id="coolant-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFD700" stopOpacity="0.2" />
          </linearGradient>
          <filter id="coolant-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Vertical coolant pipes */}
        {[40, 80, 120].map((x, i) => (
          <g key={i}>
            {/* Pipe structure */}
            <rect 
              x={x} y="60" width="20" height="280" 
              stroke="#FFD700" 
              strokeWidth="1" 
              fill="rgba(255, 215, 0, 0.05)" 
              opacity="0.6"
            />
            
            {/* Coolant flow */}
            <motion.rect
              x={x + 2} y="60" width="16" height="60"
              fill="url(#coolant-gradient)"
              filter="url(#coolant-glow)"
              animate={{
                y: active ? [60, 280, 60] : 60,
              }}
              transition={{
                duration: active ? 3 + i * 0.5 : 0,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            
            {/* Measurement markers */}
            {Array.from({ length: 8 }).map((_, j) => {
              const y = 80 + j * 35;
              return (
                <line 
                  key={j}
                  x1={x} y1={y} 
                  x2={x - 8} y2={y}
                  stroke="#FFD700"
                  strokeWidth="0.5"
                  opacity="0.5"
                />
              );
            })}
          </g>
        ))}

        {/* Connecting manifold (top) */}
        <rect x="35" y="50" width="110" height="8" stroke="#FFD700" strokeWidth="1" fill="none" opacity="0.5" />
        
        {/* Connecting manifold (bottom) */}
        <rect x="35" y="342" width="110" height="8" stroke="#FFD700" strokeWidth="1" fill="none" opacity="0.5" />

        {/* Status indicator */}
        <motion.circle
          cx="90" cy="30"
          r="4"
          fill="#FFD700"
          animate={{
            opacity: active ? [0.5, 1, 0.5] : 0.3,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      </svg>

      {/* Coolant Label */}
      <div 
        className="absolute top-2 left-2 font-mono uppercase tracking-widest"
        style={{ fontSize: '7px', color: '#FFD700', opacity: 0.6 }}
      >
        <div>COOLANT</div>
        <div style={{ fontSize: '9px', fontWeight: 'bold' }}>
          {active ? 'ACTIVE' : 'STANDBY'}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT 8: ENERGY CONTAINMENT FIELD (Right) ---
export const EnergyField = ({ active }: { active: boolean }) => {
  return (
    <div className="absolute right-[8vw] top-1/2 -translate-y-1/2 w-[180px] h-[400px] pointer-events-none">
      <svg width="180" height="400" viewBox="0 0 180 400" className="overflow-visible">
        <defs>
          <linearGradient id="field-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00F0FF" stopOpacity="0" />
            <stop offset="50%" stopColor="#00F0FF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#00F0FF" stopOpacity="0" />
          </linearGradient>
          <filter id="field-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Field emitter array */}
        {Array.from({ length: 5 }).map((_, i) => {
          const y = 80 + i * 60;
          return (
            <g key={i}>
              {/* Emitter node */}
              <circle
                cx="140" cy={y}
                r="6"
                stroke="#00F0FF"
                strokeWidth="1"
                fill="rgba(0, 240, 255, 0.1)"
                opacity="0.7"
              />
              
              {/* Energy beam */}
              <motion.line
                x1="140" y1={y}
                x2="20" y2={y}
                stroke="url(#field-gradient)"
                strokeWidth="2"
                filter="url(#field-glow)"
                opacity={active ? 0.6 : 0.2}
                animate={{
                  strokeWidth: active ? [1, 3, 1] : 2,
                }}
                transition={{
                  duration: 2 + i * 0.3,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
              
              {/* Shimmer effect */}
              {active && (
                <motion.circle
                  cy={y}
                  r="2"
                  fill="#00F0FF"
                  animate={{
                    cx: [140, 20],
                    opacity: [1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: 'easeOut',
                  }}
                />
              )}
            </g>
          );
        })}

        {/* Field containment frame */}
        <rect 
          x="10" y="60" width="10" height="280"
          stroke="#00F0FF"
          strokeWidth="1"
          fill="none"
          opacity="0.4"
        />

        {/* Status indicator */}
        <motion.circle
          cx="140" cy="30"
          r="4"
          fill="#00F0FF"
          animate={{
            opacity: active ? [0.5, 1, 0.5] : 0.3,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      </svg>

      {/* Field Label */}
      <div 
        className="absolute top-2 right-2 font-mono uppercase tracking-widest text-right"
        style={{ fontSize: '7px', color: '#00F0FF', opacity: 0.6 }}
      >
        <div>CONTAINMENT</div>
        <div style={{ fontSize: '9px', fontWeight: 'bold' }}>
          {active ? 'ACTIVE' : 'STANDBY'}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// CIRCUIT BREAKER COMPONENTS (For Reset Password Page)
// ============================================================================

// --- COMPONENT 9: HIGH VOLTAGE PANEL (Center Background) ---
export const HighVoltagePanel = ({ voltage }: { voltage: number }) => {
  // voltage: 0 (dark) -> 100 (full power)
  const isActive = voltage > 50;
  const color = isActive ? '#FF6B35' : '#8B0000'; // Orange when active, dark red when dormant
  
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] pointer-events-none opacity-25 z-0">
      <svg width="700" height="500" viewBox="0 0 700 500" className="overflow-visible">
        <defs>
          <filter id="voltage-glow">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="spark-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0" />
            <stop offset="50%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Main Panel Frame */}
        <rect 
          x="50" y="50" width="600" height="400" 
          stroke="#333" 
          strokeWidth="2" 
          fill="rgba(0, 0, 0, 0.5)" 
          rx="4"
        />
        
        {/* Panel Divisions */}
        <line x1="50" y1="150" x2="650" y2="150" stroke="#333" strokeWidth="1" />
        <line x1="50" y1="350" x2="650" y2="350" stroke="#333" strokeWidth="1" />
        <line x1="350" y1="50" x2="350" y2="450" stroke="#333" strokeWidth="1" />

        {/* Breaker Switches (8 total) */}
        {Array.from({ length: 8 }).map((_, i) => {
          const row = Math.floor(i / 4);
          const col = i % 4;
          const x = 120 + col * 140;
          const y = 100 + row * 150;
          const isOn = voltage > (i * 12.5);
          
          return (
            <g key={i}>
              {/* Breaker housing */}
              <rect
                x={x - 20} y={y - 30}
                width="40" height="60"
                stroke={isOn ? color : '#444'}
                strokeWidth="1"
                fill={isOn ? `rgba(255, 107, 53, 0.1)` : 'rgba(0, 0, 0, 0.3)'}
              />
              
              {/* Switch lever */}
              <motion.line
                x1={x} y1={y}
                x2={x} y2={y - 20}
                stroke={isOn ? color : '#666'}
                strokeWidth="3"
                strokeLinecap="round"
                animate={{
                  y2: isOn ? y - 20 : y + 20,
                }}
                transition={{ duration: 0.3 }}
              />
              
              {/* Status LED */}
              <motion.circle
                cx={x} cy={y + 35}
                r="3"
                fill={isOn ? color : '#222'}
                animate={{
                  opacity: isOn ? [0.5, 1, 0.5] : 0.3,
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                }}
              />
              
              {/* Breaker label */}
              <text
                x={x} y={y + 50}
                textAnchor="middle"
                fill="#666"
                fontSize="8"
                fontFamily="monospace"
              >
                {String(i + 1).padStart(2, '0')}
              </text>
            </g>
          );
        })}

        {/* Warning Labels */}
        <text x="350" y="30" textAnchor="middle" fill="#FF6B35" fontSize="12" fontFamily="monospace" fontWeight="bold">
          ⚠ HIGH VOLTAGE ⚠
        </text>
        <text x="350" y="480" textAnchor="middle" fill="#666" fontSize="8" fontFamily="monospace">
          AUTHORIZED PERSONNEL ONLY
        </text>

        {/* Voltage meter arcs (bottom panel) */}
        {isActive && (
          <g>
            {Array.from({ length: 3 }).map((_, i) => {
              const cx = 180 + i * 170;
              return (
                <g key={i}>
                  {/* Meter background */}
                  <circle cx={cx} cy="400" r="35" stroke="#333" strokeWidth="1" fill="rgba(0, 0, 0, 0.5)" />
                  
                  {/* Meter arc */}
                  <motion.circle
                    cx={cx} cy="400" r="30"
                    stroke={color}
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="94 94"
                    strokeDashoffset="47"
                    animate={{
                      strokeDashoffset: [47, 47 - (voltage / 100) * 94],
                    }}
                    transition={{ duration: 0.5 }}
                  />
                  
                  {/* Needle */}
                  <motion.line
                    x1={cx} y1="400"
                    x2={cx} y2="370"
                    stroke={color}
                    strokeWidth="1.5"
                    style={{ transformOrigin: `${cx}px 400px` }}
                    animate={{
                      rotate: -90 + (voltage / 100) * 180,
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </g>
              );
            })}
          </g>
        )}

        {/* Electric arcs when voltage is high */}
        {voltage > 70 && Array.from({ length: 5 }).map((_, i) => {
          const x1 = 100 + Math.random() * 500;
          const y1 = 60 + Math.random() * 300;
          const x2 = x1 + (Math.random() - 0.5) * 100;
          const y2 = y1 + (Math.random() - 0.5) * 100;
          
          return (
            <motion.path
              key={i}
              d={`M ${x1} ${y1} Q ${(x1 + x2) / 2 + Math.random() * 30} ${(y1 + y2) / 2} ${x2} ${y2}`}
              stroke={color}
              strokeWidth="1"
              fill="none"
              filter="url(#voltage-glow)"
              opacity={0}
              animate={{
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: 0.2,
                delay: i * 0.15,
                repeat: Infinity,
                repeatDelay: 1,
              }}
            />
          );
        })}
      </svg>
    </div>
  );
};

// --- COMPONENT 10: TESLA COIL (Left Side) ---
export const TeslaCoil = ({ active }: { active: boolean }) => {
  return (
    <div className="absolute left-[10vw] top-1/2 -translate-y-1/2 w-[120px] h-[350px] pointer-events-none">
      <svg width="120" height="350" viewBox="0 0 120 350" className="overflow-visible">
        <defs>
          <radialGradient id="coil-glow">
            <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FF6B35" stopOpacity="0" />
          </radialGradient>
          <filter id="electric-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Coil base */}
        <rect x="35" y="280" width="50" height="60" stroke="#666" strokeWidth="1" fill="rgba(50, 50, 50, 0.5)" />
        
        {/* Coil windings */}
        {Array.from({ length: 15 }).map((_, i) => {
          const y = 270 - i * 12;
          return (
            <ellipse
              key={i}
              cx="60" cy={y}
              rx="30" ry="6"
              stroke={active ? '#FF6B35' : '#444'}
              strokeWidth="1"
              fill="none"
              opacity={active ? 0.6 : 0.3}
            />
          );
        })}

        {/* Top electrode */}
        <circle cx="60" cy="80" r="25" stroke="#666" strokeWidth="1" fill="rgba(80, 80, 80, 0.5)" />
        <motion.circle
          cx="60" cy="80" r="20"
          fill="url(#coil-glow)"
          animate={{
            scale: active ? [1, 1.3, 1] : 1,
            opacity: active ? [0.5, 0.8, 0.5] : 0.2,
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        />

        {/* Lightning bolts */}
        {active && Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const x1 = 60 + Math.cos(angle) * 25;
          const y1 = 80 + Math.sin(angle) * 25;
          const length = 40 + Math.random() * 30;
          const x2 = 60 + Math.cos(angle) * (25 + length);
          const y2 = 80 + Math.sin(angle) * (25 + length);
          
          return (
            <motion.line
              key={i}
              x1={x1} y1={y1}
              x2={x2} y2={y2}
              stroke="#FF6B35"
              strokeWidth="1.5"
              filter="url(#electric-glow)"
              opacity={0}
              animate={{
                opacity: [0, 1, 0],
                x2: [x1, x2],
                y2: [y1, y2],
              }}
              transition={{
                duration: 0.3,
                delay: i * 0.1,
                repeat: Infinity,
                repeatDelay: 0.8,
              }}
            />
          );
        })}

        {/* Label */}
        <text x="60" y="360" textAnchor="middle" fill="#666" fontSize="8" fontFamily="monospace">
          TESLA-01
        </text>
      </svg>
    </div>
  );
};

// --- COMPONENT 11: CAPACITOR BANK (Right Side) ---
export const CapacitorBank = ({ charge }: { charge: number }) => {
  // charge: 0-100
  return (
    <div className="absolute right-[10vw] top-1/2 -translate-y-1/2 w-[140px] h-[320px] pointer-events-none">
      <svg width="140" height="320" viewBox="0 0 140 320" className="overflow-visible">
        <defs>
          <linearGradient id="charge-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFD700" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Capacitor units (4 vertical cylinders) */}
        {Array.from({ length: 4 }).map((_, i) => {
          const x = 15 + i * 32;
          const fillHeight = (charge / 100) * 220;
          
          return (
            <g key={i}>
              {/* Cylinder outline */}
              <rect
                x={x} y="50" width="25" height="220"
                stroke="#666"
                strokeWidth="1"
                fill="rgba(0, 0, 0, 0.5)"
                rx="3"
              />
              
              {/* Charge level */}
              <rect
                x={x + 2} y={270 - fillHeight} width="21" height={fillHeight}
                fill="url(#charge-gradient)"
                opacity="0.7"
              />
              
              {/* Charge indicator marks */}
              {Array.from({ length: 10 }).map((_, j) => {
                const markY = 70 + j * 20;
                return (
                  <line
                    key={j}
                    x1={x} y1={markY}
                    x2={x - 5} y2={markY}
                    stroke="#444"
                    strokeWidth="0.5"
                  />
                );
              })}
              
              {/* Terminals */}
              <circle cx={x + 12.5} cy="40" r="4" stroke="#666" strokeWidth="1" fill="#888" />
              <circle cx={x + 12.5} cy="280" r="4" stroke="#666" strokeWidth="1" fill="#444" />
              
              {/* Spark effect when charged */}
              {charge > 80 && (
                <motion.circle
                  cx={x + 12.5} cy="40"
                  r="8"
                  fill="none"
                  stroke="#FF6B35"
                  strokeWidth="1"
                  animate={{
                    r: [6, 12, 6],
                    opacity: [0.8, 0.2, 0.8],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.25,
                  }}
                />
              )}
            </g>
          );
        })}

        {/* Bank label */}
        <text x="70" y="310" textAnchor="middle" fill="#666" fontSize="8" fontFamily="monospace">
          CAP BANK
        </text>
        
        {/* Charge readout */}
        <text x="70" y="25" textAnchor="middle" fill="#FF6B35" fontSize="10" fontFamily="monospace" fontWeight="bold">
          {Math.round(charge)}%
        </text>
      </svg>
    </div>
  );
};

// --- COMPONENT 12: HIGH VOLTAGE SYSTEM (Full Background for Reset Page) ---
export const HighVoltageSystem = ({ state }: { state: 'idle' | 'charging' | 'discharging' }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
      <svg width="800" height="600" viewBox="0 0 800 600" className="overflow-visible opacity-30">
        <defs>
          <filter id="arc-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="coil-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#222" />
            <stop offset="50%" stopColor="#444" />
            <stop offset="100%" stopColor="#222" />
          </linearGradient>
        </defs>

        {/* Left Transformer Coil */}
        <g transform="translate(100, 100)">
          <rect x="0" y="0" width="60" height="400" fill="url(#coil-gradient)" stroke="#333" />
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={`left-${i}`} x1="0" y1={i * 20} x2="60" y2={i * 20} stroke="#000" strokeWidth="2" opacity="0.5" />
          ))}
          {/* Status Light */}
          <motion.circle 
            cx="30" cy="-20" r="5" 
            fill={state === 'idle' ? '#FF0055' : '#28E7A2'}
            animate={{
              opacity: state === 'idle' ? [0.5, 1, 0.5] : 1,
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </g>

        {/* Right Transformer Coil */}
        <g transform="translate(640, 100)">
          <rect x="0" y="0" width="60" height="400" fill="url(#coil-gradient)" stroke="#333" />
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={`right-${i}`} x1="0" y1={i * 20} x2="60" y2={i * 20} stroke="#000" strokeWidth="2" opacity="0.5" />
          ))}
          {/* Status Light */}
          <motion.circle 
            cx="30" cy="-20" r="5" 
            fill={state === 'idle' ? '#FF0055' : '#28E7A2'}
            animate={{
              opacity: state === 'idle' ? [0.5, 1, 0.5] : 1,
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </g>

        {/* THE ELECTRIC ARC (Visible only when Charging/Discharging) */}
        {(state === 'charging' || state === 'discharging') && (
          <motion.path
            d="M 160 300 Q 400 100 640 300"
            fill="none"
            stroke={state === 'discharging' ? '#28E7A2' : '#00F0FF'}
            strokeWidth={state === 'discharging' ? 4 : 2}
            filter="url(#arc-glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: [0.5, 1, 0.5],
              d: [
                "M 160 300 Q 400 250 640 300",
                "M 160 300 Q 400 350 640 300",
                "M 160 300 Q 400 200 640 300"
              ]
            }}
            transition={{ 
              duration: 0.1, 
              repeat: Infinity,
              repeatType: "mirror" 
            }}
          />
        )}
      </svg>
    </div>
  );
};