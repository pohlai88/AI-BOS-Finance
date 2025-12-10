// ============================================================================
// NEO-MECHANICAL ORCHESTRA v2.0
// "The Harmonic Engine" - Procedurally Generated SVG HUD
// Philosophy: Creative Perfectionism via Mathematical Precision
// No external assets. Pure computational artistry.
// ============================================================================

import { motion } from 'motion/react';
import { useMemo } from 'react';

// --- UTILITY: POLAR TO CARTESIAN CONVERSION ---
// Aerospace-grade coordinate mathematics
const polarToCartesian = (
  centerX: number, 
  centerY: number, 
  radius: number, 
  angleInDegrees: number
) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

// --- UTILITY: GENERATE ARC PATH ---
// Creates smooth circular arcs for gauge backgrounds
const describeArc = (
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
  ].join(' ');
};

export const MechanicalOrchestra = () => {
  // --- COLOR PALETTE ---
  // Lynx Codex canonical colors
  const COLORS = {
    amber: '#FFBF00',    // Construction/Manufacturing
    cyan: '#00D9FF',     // Operations/Logistics
    magenta: '#FF00AA',  // Innovation/R&D
    nexus: '#28E7A2',    // Central Convergence
    void: '#000000',     // The Void
    structure: '#1F1F1F', // Dark Matter
    grid: '#0F0F0F',     // Sub-grid
  };

  // --- HARMONIC RATIOS ---
  // Mathematical relationships for synchronized motion
  // All speeds are related by perfect ratios (Golden Ratio, Fibonacci)
  const MOTION = {
    masterClock: 60,      // Base rotation (seconds)
    amber: 60,            // 1:1 ratio
    amberInner: 40,       // 1.5:1 ratio
    cyan: 4,              // Piston cycle
    magenta: 50,          // Orbital outer
    magentaInner: 35,     // Orbital inner  
    nexus: 30,            // Central core
    conductor: 12,        // Scanning beam
  };

  // --- MEMOIZED GEOMETRY ---
  // Pre-calculate all tick marks, scales, and coordinate systems
  
  // AMBER ENGINE: 60 precision tick marks (like a watch bezel)
  const amberTicks = useMemo(() => 
    Array.from({ length: 60 }).map((_, i) => {
      const angle = (i / 60) * 360;
      const isMajor = i % 5 === 0;
      const r1 = 120;
      const r2 = isMajor ? 108 : 113;
      const start = polarToCartesian(140, 140, r1, angle);
      const end = polarToCartesian(140, 140, r2, angle);
      return { 
        x1: start.x, y1: start.y, 
        x2: end.x, y2: end.y, 
        isMajor,
        label: isMajor ? (i * 6).toString() : null, // 0, 30, 60...330
      };
    }), []
  );

  // AMBER ENGINE: 8 radial spokes (inner mechanism)
  const amberSpokes = useMemo(() =>
    Array.from({ length: 8 }).map((_, i) => {
      const angle = (i / 8) * 360;
      const inner = polarToCartesian(140, 140, 45, angle);
      const outer = polarToCartesian(140, 140, 90, angle);
      return { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y };
    }), []
  );

  // CYAN PISTON: Measurement scale markings (0-300mm)
  const pistonScale = useMemo(() =>
    Array.from({ length: 16 }).map((_, i) => ({
      y: i * 20,
      isMajor: i % 5 === 0,
      label: i % 5 === 0 ? `${i * 20}` : null,
    })), []
  );

  // MAGENTA ORBITAL: Node positions on outer ring
  const orbitalNodes = useMemo(() =>
    Array.from({ length: 12 }).map((_, i) => {
      const angle = (i / 12) * 360;
      const pos = polarToCartesian(120, 120, 100, angle);
      return { cx: pos.x, cy: pos.y };
    }), []
  );

  // MAGENTA ORBITAL: Inner connecting spokes
  const orbitalSpokes = useMemo(() =>
    Array.from({ length: 6 }).map((_, i) => {
      const angle = (i / 6) * 360;
      const outer = polarToCartesian(120, 120, 70, angle);
      return { x2: outer.x, y2: outer.y };
    }), []
  );

  return (
    <div 
      className="absolute inset-0 overflow-hidden select-none pointer-events-none"
      style={{ backgroundColor: COLORS.void }}
    >
      
      {/* ========================================
          LAYER 1: ATMOSPHERIC BASE
          Technical grid with depth fog
          ======================================== */}
      <div 
        className="absolute inset-0 opacity-15"
        style={{ 
          backgroundImage: `
            linear-gradient(${COLORS.grid} 0.5px, transparent 0.5px),
            linear-gradient(90deg, ${COLORS.grid} 0.5px, transparent 0.5px)
          `,
          backgroundSize: '50px 50px',
        }} 
      />
      
      {/* Depth vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.8) 100%)',
        }}
      />

      {/* ========================================
          LAYER 2: SVG ENGINE ROOM
          All machinery rendered here
          ======================================== */}
      <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
        
        {/* --- GLOBAL FILTER DEFINITIONS --- */}
        {/* The "Neo-Glow" Engine: Multi-stage blur for photorealistic bloom */}
        <defs>
          {/* Amber Bloom: Hot core + soft atmospheric haze */}
          <filter id="bloom-amber" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur-sharp" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur-medium" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur-soft" />
            <feMerge>
              <feMergeNode in="blur-soft" />
              <feMergeNode in="blur-medium" />
              <feMergeNode in="blur-sharp" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Cyan Bloom: Sharp electric discharge look */}
          <filter id="bloom-cyan" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur-tight" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur-medium" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur-wide" />
            <feMerge>
              <feMergeNode in="blur-wide" />
              <feMergeNode in="blur-medium" />
              <feMergeNode in="blur-tight" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Magenta Bloom: Ethereal orbital glow */}
          <filter id="bloom-magenta" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur-core" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur-halo" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="25" result="blur-aura" />
            <feMerge>
              <feMergeNode in="blur-aura" />
              <feMergeNode in="blur-halo" />
              <feMergeNode in="blur-core" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Nexus Bloom: Convergence point brilliance */}
          <filter id="bloom-nexus" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur-inner" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur-outer" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur-far" />
            <feMerge>
              <feMergeNode in="blur-far" />
              <feMergeNode in="blur-outer" />
              <feMergeNode in="blur-inner" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Conductor Beam Gradient */}
          <linearGradient id="beam-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="transparent" stopOpacity="0" />
            <stop offset="20%" stopColor="#FFFFFF" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="80%" stopColor="#FFFFFF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>

          {/* Radial gradient for volumetric effects */}
          <radialGradient id="amber-radial">
            <stop offset="0%" stopColor={COLORS.amber} stopOpacity="0.3" />
            <stop offset="50%" stopColor={COLORS.amber} stopOpacity="0.1" />
            <stop offset="100%" stopColor={COLORS.amber} stopOpacity="0" />
          </radialGradient>

          <radialGradient id="cyan-radial">
            <stop offset="0%" stopColor={COLORS.cyan} stopOpacity="0.4" />
            <stop offset="50%" stopColor={COLORS.cyan} stopOpacity="0.15" />
            <stop offset="100%" stopColor={COLORS.cyan} stopOpacity="0" />
          </radialGradient>

          <radialGradient id="magenta-radial">
            <stop offset="0%" stopColor={COLORS.magenta} stopOpacity="0.3" />
            <stop offset="50%" stopColor={COLORS.magenta} stopOpacity="0.12" />
            <stop offset="100%" stopColor={COLORS.magenta} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* =========================================================
            ENGINE 1: AMBER CONSTRUCTION (Top-Left Quadrant)
            Concept: Precision bezel gauge with rotating bezels
            Type: Circular HUD with radial tick marks
           ========================================================= */}
        <g transform="translate(120, 140)">
          {/* Volumetric light wash (background) */}
          <circle cx="140" cy="140" r="160" fill="url(#amber-radial)" opacity="0.4" />

          {/* Outer rotating bezel (slow clockwise) */}
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ 
              duration: MOTION.amber, 
              repeat: Infinity, 
              ease: 'linear' 
            }}
            style={{ transformOrigin: '140px 140px' }}
          >
            {/* Main bezel ring */}
            <circle 
              cx="140" cy="140" r="120" 
              stroke={COLORS.amber} 
              strokeWidth="0.5" 
              fill="none" 
              opacity="0.6" 
            />
            
            {/* Precision tick marks (generated via trigonometry) */}
            {amberTicks.map((tick, i) => (
              <line 
                key={`tick-${i}`}
                x1={tick.x1} y1={tick.y1} 
                x2={tick.x2} y2={tick.y2} 
                stroke={COLORS.amber} 
                strokeWidth={tick.isMajor ? '1.2' : '0.5'} 
                opacity={tick.isMajor ? '0.8' : '0.4'} 
              />
            ))}

            {/* Degree labels on major ticks */}
            {amberTicks.filter(t => t.label).map((tick, i) => {
              const labelPos = polarToCartesian(140, 140, 95, parseInt(tick.label || '0'));
              return (
                <text
                  key={`label-${i}`}
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={COLORS.amber}
                  opacity="0.6"
                  style={{
                    fontSize: '7px',
                    fontFamily: 'monospace',
                    fontWeight: '500',
                  }}
                >
                  {tick.label}
                </text>
              );
            })}
          </motion.g>

          {/* Inner counter-rotating mechanism (fast CCW) */}
          <motion.g
            animate={{ rotate: -360 }}
            transition={{ 
              duration: MOTION.amberInner, 
              repeat: Infinity, 
              ease: 'linear' 
            }}
            style={{ transformOrigin: '140px 140px' }}
          >
            <circle 
              cx="140" cy="140" r="90" 
              stroke={COLORS.amber} 
              strokeWidth="0.5" 
              strokeDasharray="3 2"
              fill="none" 
              opacity="0.5" 
            />
            
            {/* Radial spokes */}
            {amberSpokes.map((spoke, i) => (
              <line
                key={`spoke-${i}`}
                x1="140" y1="140"
                x2={spoke.x2} y2={spoke.y2}
                stroke={COLORS.amber}
                strokeWidth="0.5"
                opacity="0.3"
              />
            ))}
          </motion.g>

          {/* Central hub assembly */}
          <circle 
            cx="140" cy="140" r="35" 
            stroke={COLORS.amber} 
            strokeWidth="1" 
            fill="none" 
            opacity="0.7" 
          />
          <circle 
            cx="140" cy="140" r="28" 
            stroke={COLORS.amber} 
            strokeWidth="0.5" 
            fill={`${COLORS.amber}08`}
            opacity="0.6" 
          />
          
          {/* Cross reticle */}
          <line x1="140" y1="112" x2="140" y2="168" stroke={COLORS.amber} strokeWidth="0.5" opacity="0.5" />
          <line x1="112" y1="140" x2="168" y2="140" stroke={COLORS.amber} strokeWidth="0.5" opacity="0.5" />
          
          {/* Pulsing center core */}
          <motion.circle
            cx="140" cy="140" r="4"
            fill={COLORS.amber}
            animate={{
              r: [4, 6, 4],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Apply bloom filter to entire assembly */}
          <g filter="url(#bloom-amber)" opacity="0.7">
            <circle cx="140" cy="140" r="120" stroke={COLORS.amber} strokeWidth="0.5" fill="none" />
          </g>
        </g>

        {/* =========================================================
            ENGINE 2: CYAN OPERATIONS (Right Side)
            Concept: Vertical hydraulic piston with measurement scale
            Type: Linear actuator with real metrics
           ========================================================= */}
        <g transform="translate(1050, 180)">
          {/* Volumetric light column */}
          <ellipse cx="30" cy="150" rx="80" ry="200" fill="url(#cyan-radial)" opacity="0.5" />

          {/* Cylinder housing (static frame) */}
          <line x1="0" y1="0" x2="0" y2="300" stroke={COLORS.cyan} strokeWidth="0.5" opacity="0.5" />
          <line x1="60" y1="0" x2="60" y2="300" stroke={COLORS.cyan} strokeWidth="0.5" opacity="0.5" />
          
          {/* Measurement scale (0-300mm in 20mm increments) */}
          {pistonScale.map((mark, i) => (
            <g key={`scale-${i}`}>
              <line 
                x1="-8" y1={mark.y} 
                x2="0" y2={mark.y} 
                stroke={COLORS.cyan} 
                strokeWidth={mark.isMajor ? '1' : '0.5'} 
                opacity={mark.isMajor ? '0.7' : '0.4'} 
              />
              <line 
                x1="60" y1={mark.y} 
                x2="68" y2={mark.y} 
                stroke={COLORS.cyan} 
                strokeWidth={mark.isMajor ? '1' : '0.5'} 
                opacity={mark.isMajor ? '0.7' : '0.4'} 
              />
              {mark.label && (
                <text
                  x="-15"
                  y={mark.y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill={COLORS.cyan}
                  opacity="0.6"
                  style={{
                    fontSize: '7px',
                    fontFamily: 'monospace',
                  }}
                >
                  {mark.label}
                </text>
              )}
            </g>
          ))}

          {/* Top mounting bracket */}
          <rect x="10" y="-10" width="40" height="8" stroke={COLORS.cyan} strokeWidth="0.5" fill="none" opacity="0.5" />
          
          {/* Bottom mounting bracket */}
          <rect x="10" y="302" width="40" height="8" stroke={COLORS.cyan} strokeWidth="0.5" fill="none" opacity="0.5" />

          {/* Animated piston assembly */}
          <motion.g
            animate={{
              y: [0, 180, 0],
            }}
            transition={{
              duration: MOTION.cyan,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {/* Piston head */}
            <rect 
              x="4" y="20" width="52" height="50" 
              stroke={COLORS.cyan} 
              strokeWidth="1.5" 
              fill={`${COLORS.cyan}15`}
              opacity="0.9"
            />
            
            {/* Piston rings (seal grooves) */}
            <line x1="8" y1="32" x2="52" y2="32" stroke={COLORS.cyan} strokeWidth="0.5" opacity="0.8" />
            <line x1="8" y1="45" x2="52" y2="45" stroke={COLORS.cyan} strokeWidth="0.5" opacity="0.8" />
            <line x1="8" y1="58" x2="52" y2="58" stroke={COLORS.cyan} strokeWidth="0.5" opacity="0.8" />
            
            {/* Central mounting point */}
            <circle cx="30" cy="45" r="6" stroke={COLORS.cyan} strokeWidth="1" fill="none" opacity="0.9" />
            <circle cx="30" cy="45" r="2" fill={COLORS.cyan} opacity="0.8" />

            {/* Motion trail (afterimage effect) */}
            <rect 
              x="4" y="75" width="52" height="8" 
              fill={`${COLORS.cyan}08`}
              opacity="0.3"
            />
          </motion.g>

          {/* Apply bloom to entire piston system */}
          <g filter="url(#bloom-cyan)" opacity="0.6">
            <line x1="0" y1="0" x2="0" y2="300" stroke={COLORS.cyan} strokeWidth="0.5" />
            <line x1="60" y1="0" x2="60" y2="300" stroke={COLORS.cyan} strokeWidth="0.5" />
          </g>
        </g>

        {/* =========================================================
            ENGINE 3: MAGENTA INNOVATION (Bottom Center)
            Concept: Concentric orbital system (planetary gears)
            Type: Multi-ring synchronized rotation
           ========================================================= */}
        <g transform="translate(580, 600)">
          {/* Volumetric aura */}
          <circle cx="120" cy="120" r="140" fill="url(#magenta-radial)" opacity="0.5" />

          {/* Outer orbital ring (slow CCW) */}
          <motion.g
            animate={{ rotate: -360 }}
            transition={{
              duration: MOTION.magenta,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ transformOrigin: '120px 120px' }}
          >
            <circle 
              cx="120" cy="120" r="100" 
              stroke={COLORS.magenta} 
              strokeWidth="0.5" 
              strokeDasharray="8 4"
              fill="none" 
              opacity="0.6" 
            />
            
            {/* Orbital nodes (satellites) */}
            {orbitalNodes.map((node, i) => (
              <circle
                key={`node-${i}`}
                cx={node.cx}
                cy={node.cy}
                r="2.5"
                fill={COLORS.magenta}
                opacity="0.8"
              />
            ))}
          </motion.g>

          {/* Middle orbital ring (fast CW) */}
          <motion.g
            animate={{ rotate: 360 }}
            transition={{
              duration: MOTION.magentaInner,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ transformOrigin: '120px 120px' }}
          >
            <circle 
              cx="120" cy="120" r="70" 
              stroke={COLORS.magenta} 
              strokeWidth="0.5" 
              fill="none" 
              opacity="0.7" 
            />
            
            {/* Connecting spokes to center */}
            {orbitalSpokes.map((spoke, i) => (
              <line
                key={`orbital-spoke-${i}`}
                x1="120"
                y1="120"
                x2={spoke.x2}
                y2={spoke.y2}
                stroke={COLORS.magenta}
                strokeWidth="0.5"
                opacity="0.4"
              />
            ))}
          </motion.g>

          {/* Inner core ring (static) */}
          <circle 
            cx="120" cy="120" r="40" 
            stroke={COLORS.magenta} 
            strokeWidth="1" 
            fill="none" 
            opacity="0.8" 
          />
          <circle 
            cx="120" cy="120" r="34" 
            stroke={COLORS.magenta} 
            strokeWidth="0.5" 
            fill={`${COLORS.magenta}10`}
            opacity="0.7" 
          />

          {/* Central diamond (rotating) */}
          <motion.path
            d="M 120 100 L 140 120 L 120 140 L 100 120 Z"
            stroke={COLORS.magenta}
            strokeWidth="0.5"
            fill="none"
            opacity="0.8"
            animate={{ rotate: 360 }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ transformOrigin: '120px 120px' }}
          />

          {/* Pulsing center core */}
          <motion.circle
            cx="120"
            cy="120"
            r="5"
            fill={COLORS.magenta}
            animate={{
              r: [5, 7, 5],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Apply bloom */}
          <g filter="url(#bloom-magenta)" opacity="0.7">
            <circle cx="120" cy="120" r="100" stroke={COLORS.magenta} strokeWidth="0.5" fill="none" />
          </g>
        </g>

        {/* =========================================================
            CENTRAL NEXUS - Convergence Point
            The heart where all systems synchronize
           ========================================================= */}
        <g transform="translate(590, 410)">
          {/* Outer rotating frame */}
          <motion.g
            animate={{ rotate: 360 }}
            transition={{
              duration: MOTION.nexus,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ transformOrigin: '70px 70px' }}
          >
            <rect 
              x="20" y="20" width="100" height="100" 
              stroke={COLORS.nexus} 
              strokeWidth="0.5" 
              fill="none" 
              opacity="0.7" 
            />
            <rect 
              x="26" y="26" width="88" height="88" 
              stroke={COLORS.nexus} 
              strokeWidth="0.5" 
              fill={`${COLORS.nexus}05`}
              opacity="0.6" 
            />
          </motion.g>

          {/* Inner diamond (counter-rotating) */}
          <motion.path
            d="M 70 30 L 110 70 L 70 110 L 30 70 Z"
            stroke={COLORS.nexus}
            strokeWidth="1"
            fill="none"
            opacity="0.8"
            animate={{ rotate: -360 }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ transformOrigin: '70px 70px' }}
          />

          {/* Cross reticle */}
          <line x1="70" y1="0" x2="70" y2="140" stroke={COLORS.nexus} strokeWidth="0.5" opacity="0.3" />
          <line x1="0" y1="70" x2="140" y2="70" stroke={COLORS.nexus} strokeWidth="0.5" opacity="0.3" />

          {/* Pulsing center */}
          <motion.circle
            cx="70"
            cy="70"
            r="4"
            fill={COLORS.nexus}
            animate={{
              r: [4, 6, 4],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Apply bloom */}
          <g filter="url(#bloom-nexus)" opacity="0.8">
            <rect x="20" y="20" width="100" height="100" stroke={COLORS.nexus} strokeWidth="0.5" fill="none" />
          </g>
        </g>

        {/* =========================================================
            THE CONDUCTOR BEAM
            Vertical scanning line that synchronizes all systems
           ========================================================= */}
        <motion.line
          x1="0" y1="0"
          x2="100%" y2="0"
          stroke="url(#beam-gradient)"
          strokeWidth="2"
          opacity="0.6"
          style={{
            filter: 'blur(1px)',
          }}
          animate={{
            y1: ['0%', '100%'],
            y2: ['0%', '100%'],
          }}
          transition={{
            duration: MOTION.conductor,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Beam particle trails */}
        {[0, 1, 2].map((i) => (
          <motion.line
            key={`trail-${i}`}
            x1="0" y1="0"
            x2="100%" y2="0"
            stroke="url(#beam-gradient)"
            strokeWidth="1"
            opacity="0.2"
            style={{
              filter: 'blur(2px)',
            }}
            animate={{
              y1: ['0%', '100%'],
              y2: ['0%', '100%'],
            }}
            transition={{
              duration: MOTION.conductor,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.3,
            }}
          />
        ))}
      </svg>

      {/* ========================================
          LAYER 3: TECHNICAL ANNOTATIONS
          HUD overlays and readouts
          ======================================== */}
      
      {/* Status Panel - Top Right */}
      <div 
        className="absolute top-8 right-8 font-mono uppercase tracking-widest"
        style={{ 
          fontSize: '8px',
          color: '#555555',
          letterSpacing: '0.2em',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <motion.div
            style={{
              width: '6px',
              height: '6px',
              backgroundColor: COLORS.nexus,
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <span style={{ color: COLORS.nexus }}>ENGINES SYNCHRONIZED</span>
        </div>
        <div>HARMONIC RATIO: 1.618</div>
        <div>TEMP: 293.15 K</div>
        <div>POWER: 99.97%</div>
      </div>

      {/* Coordinate System - Bottom Left */}
      <div 
        className="absolute bottom-8 left-8 font-mono uppercase tracking-widest"
        style={{ 
          fontSize: '7px',
          color: '#444444',
          letterSpacing: '0.2em',
        }}
      >
        <div>COORD: [0.0000, 0.0000]</div>
        <div style={{ marginTop: '4px' }}>NEXUSCANON REG-AUTH v1.0</div>
        <div style={{ marginTop: '2px', color: '#333333' }}>PROCEDURAL RENDER ENGINE</div>
      </div>

      {/* Corner Crosshairs (Aerospace HUD style) */}
      {[
        { top: '20px', left: '20px' },
        { top: '20px', right: '20px' },
        { bottom: '20px', left: '20px' },
        { bottom: '20px', right: '20px' },
      ].map((pos, i) => (
        <div
          key={`crosshair-${i}`}
          className="absolute"
          style={{
            ...pos,
            width: '20px',
            height: '20px',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20">
            <line x1="10" y1="0" x2="10" y2="20" stroke="#333333" strokeWidth="0.5" opacity="0.6" />
            <line x1="0" y1="10" x2="20" y2="10" stroke="#333333" strokeWidth="0.5" opacity="0.6" />
            <circle cx="10" cy="10" r="1.5" fill="#333333" opacity="0.8" />
          </svg>
        </div>
      ))}
    </div>
  );
};
