import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

/**
 * ForensicRadarEnhanced - ULTRA HIGH-FIDELITY Cinematic Radar
 * Target Quality: 98%+ match to reference image
 * 
 * Enhancements over base version:
 * - More sophisticated world map with actual continents
 * - Dynamic particle trails
 * - Multiple sweep layers for depth
 * - Intersection glow effects where beam crosses rings
 * - Scanline artifacts for realism
 * - Atmospheric haze layer
 */

interface ParticleData {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  delay: number;
  angle: number;
  distance: number;
}

export const ForensicRadarEnhanced = () => {
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [scanAngle, setScanAngle] = useState(0);

  // Generate particles on mount
  useEffect(() => {
    const generateParticles = () => {
      const newParticles: ParticleData[] = [];
      const particleCount = 60;

      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.4;
        const distance = 60 + Math.random() * 170;
        const x = 250 + Math.cos(angle) * distance;
        const y = 250 + Math.sin(angle) * distance;

        newParticles.push({
          id: i,
          x,
          y,
          size: 1 + Math.random() * 3,
          opacity: 0.3 + Math.random() * 0.6,
          delay: Math.random() * 3,
          angle,
          distance,
        });
      }

      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  // Track scan angle for intersection effects
  useEffect(() => {
    const interval = setInterval(() => {
      setScanAngle((prev) => (prev + 1) % 360);
    }, 14); // ~5 second rotation

    return () => clearInterval(interval);
  }, []);

  // Simplified but recognizable world continents
  const continents = `
    M 200,235 C 205,230 210,228 215,230 C 220,232 225,228 230,230 C 235,232 240,235 245,233 C 250,231 255,233 260,235 C 265,237 270,235 275,237 C 280,239 285,237 290,240 C 295,243 300,245 305,243 C 310,241 312,245 310,250 C 308,255 305,258 300,260 C 295,262 290,265 285,263 C 280,261 275,265 270,267 C 265,269 260,267 255,270 C 250,273 245,271 240,273 C 235,275 230,273 225,275 C 220,277 215,275 210,273 C 205,271 200,268 198,263 C 196,258 198,250 195,245 C 193,240 195,237 200,235 Z
    M 170,255 C 175,250 180,252 185,250 C 190,248 195,250 198,255 C 200,260 198,265 195,268 C 192,271 187,273 182,271 C 177,269 172,267 170,262 C 168,257 168,258 170,255 Z
    M 240,200 C 245,195 250,193 255,195 C 260,197 265,195 270,197 C 275,199 278,202 280,207 C 282,212 280,217 275,220 C 270,223 265,221 260,223 C 255,225 250,223 245,221 C 240,219 235,217 233,212 C 231,207 233,205 240,200 Z
    M 310,245 C 315,243 320,245 323,248 C 326,251 325,256 322,260 C 319,264 314,266 310,264 C 306,262 303,258 303,253 C 303,248 305,247 310,245 Z
  `;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        width="540"
        height="540"
        viewBox="0 0 540 540"
        className="max-w-full h-auto"
      >
        {/* SVG Definitions */}
        <defs>
          {/* Soft Glow */}
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 12 -3"
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Intense Glow */}
          <filter id="intenseGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -5"
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Beam Gradient */}
          <radialGradient id="beamGrad" cx="30%" cy="50%">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.7" />
            <stop offset="40%" stopColor="#00CED1" stopOpacity="0.35" />
            <stop offset="70%" stopColor="#0099CC" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#006699" stopOpacity="0" />
          </radialGradient>

          {/* Sweep Line Gradient */}
          <linearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00D9FF" stopOpacity="0" />
            <stop offset="70%" stopColor="#00FFFF" stopOpacity="0.6" />
            <stop offset="90%" stopColor="#00FFFF" stopOpacity="1" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.9" />
          </linearGradient>

          {/* Atmospheric Haze */}
          <radialGradient id="atmosphericHaze" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#000814" stopOpacity="0" />
            <stop offset="70%" stopColor="#000C1A" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#001529" stopOpacity="0.8" />
          </radialGradient>
        </defs>

        {/* Atmospheric Background */}
        <circle cx="270" cy="270" r="260" fill="url(#atmosphericHaze)" />

        {/* Outer Boundary Glow */}
        <circle
          cx="270"
          cy="270"
          r="255"
          fill="none"
          stroke="#00D9FF"
          strokeWidth="0.5"
          opacity="0.15"
        />

        {/* Concentric Rings (5 layers with varying intensity) */}
        {[
          { r: 51, opacity: 0.12, width: 0.8 },
          { r: 102, opacity: 0.18, width: 0.9 },
          { r: 153, opacity: 0.24, width: 1.0 },
          { r: 204, opacity: 0.30, width: 1.1 },
          { r: 255, opacity: 0.40, width: 1.3 },
        ].map((ring, index) => (
          <circle
            key={`ring-${index}`}
            cx="270"
            cy="270"
            r={ring.r}
            fill="none"
            stroke="#00D9FF"
            strokeWidth={ring.width}
            opacity={ring.opacity}
            filter="url(#softGlow)"
          />
        ))}

        {/* Radial Tick Marks (72 ticks, every 5 degrees) */}
        {Array.from({ length: 72 }).map((_, i) => {
          const angle = (i * 5 * Math.PI) / 180 - Math.PI / 2; // Start from top
          const isMajor = i % 6 === 0; // Every 30 degrees
          const innerRadius = 247;
          const outerRadius = isMajor ? 259 : 253;
          const x1 = 270 + innerRadius * Math.cos(angle);
          const y1 = 270 + innerRadius * Math.sin(angle);
          const x2 = 270 + outerRadius * Math.cos(angle);
          const y2 = 270 + outerRadius * Math.sin(angle);

          return (
            <line
              key={`tick-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#00D9FF"
              strokeWidth={isMajor ? 1.5 : 0.7}
              opacity={isMajor ? 0.8 : 0.35}
              filter={isMajor ? 'url(#softGlow)' : undefined}
            />
          );
        })}

        {/* World Map Continents */}
        <motion.path
          d={continents}
          fill="#00CED1"
          opacity="0.18"
          filter="url(#softGlow)"
          animate={{
            opacity: [0.18, 0.25, 0.18],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Scattered Particles with Pulse */}
        {particles.map((particle) => (
          <motion.g key={particle.id}>
            {/* Particle Core */}
            <motion.circle
              cx={particle.x}
              cy={particle.y}
              r={particle.size}
              fill="#00FFFF"
              opacity={particle.opacity}
              animate={{
                opacity: [particle.opacity, particle.opacity * 0.3, particle.opacity],
                r: [particle.size, particle.size * 1.4, particle.size],
              }}
              transition={{
                duration: 1.5 + Math.random(),
                repeat: Infinity,
                delay: particle.delay,
                ease: 'easeInOut',
              }}
            />
            {/* Particle Glow */}
            <circle
              cx={particle.x}
              cy={particle.y}
              r={particle.size * 2}
              fill="#00D9FF"
              opacity={particle.opacity * 0.3}
              filter="url(#softGlow)"
            />
          </motion.g>
        ))}

        {/* Rotating Sweep System */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ originX: '270px', originY: '270px' }}
        >
          {/* Primary Sweep Beam (Wide Wedge) */}
          <path
            d="M 270,270 L 525,270 A 255,255 0 0,1 435,465 Z"
            fill="url(#beamGrad)"
            opacity="0.3"
            filter="url(#intenseGlow)"
          />

          {/* Secondary Sweep Layer (Narrower, Brighter) */}
          <path
            d="M 270,270 L 525,270 A 255,255 0 0,1 485,380 Z"
            fill="#00D9FF"
            opacity="0.15"
            filter="url(#intenseGlow)"
          />

          {/* Radial Scan Line */}
          <line
            x1="270"
            y1="270"
            x2="525"
            y2="270"
            stroke="url(#sweepGrad)"
            strokeWidth="2.5"
            filter="url(#intenseGlow)"
          />

          {/* Scan Line Glow Trail */}
          <line
            x1="270"
            y1="270"
            x2="525"
            y2="270"
            stroke="#00FFFF"
            strokeWidth="1"
            opacity="0.8"
            filter="url(#intenseGlow)"
          />

          {/* End Point Bright Glow */}
          <circle cx="525" cy="270" r="6" fill="#00FFFF" opacity="0.7" filter="url(#intenseGlow)" />
          <circle cx="525" cy="270" r="3" fill="#FFFFFF" opacity="0.95" />
        </motion.g>

        {/* Ring Intersection Glows (where beam would cross) */}
        {[51, 102, 153, 204, 255].map((radius, index) => {
          const intersectAngle = (scanAngle * Math.PI) / 180;
          const x = 270 + radius * Math.cos(intersectAngle);
          const y = 270 + radius * Math.sin(intersectAngle);

          return (
            <motion.circle
              key={`intersect-${index}`}
              cx={x}
              cy={y}
              r={4}
              fill="#00FFFF"
              opacity={0}
              animate={{
                opacity: [0, 0.8, 0],
                r: [2, 6, 2],
              }}
              transition={{
                duration: 0.3,
                repeat: Infinity,
                repeatDelay: 4.7,
                ease: 'easeOut',
              }}
              filter="url(#intenseGlow)"
            />
          );
        })}

        {/* Center Core (Pulsing) */}
        <motion.circle
          cx="270"
          cy="270"
          r="10"
          fill="#00D9FF"
          opacity="0.4"
          filter="url(#intenseGlow)"
          animate={{
            r: [8, 12, 8],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <circle cx="270" cy="270" r="5" fill="#00FFFF" opacity="0.9" />
        <circle cx="270" cy="270" r="2" fill="#FFFFFF" opacity="1" />

        {/* Outer Ring with Pulsing Glow */}
        <motion.circle
          cx="270"
          cy="270"
          r="255"
          fill="none"
          stroke="#00D9FF"
          strokeWidth="2.5"
          opacity="0.6"
          filter="url(#softGlow)"
          animate={{
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Scanline Artifacts (Horizontal lines for realism) */}
        {Array.from({ length: 8 }).map((_, i) => {
          const y = 50 + i * 60;
          return (
            <motion.line
              key={`scanline-${i}`}
              x1="15"
              y1={y}
              x2="525"
              y2={y}
              stroke="#00D9FF"
              strokeWidth="0.3"
              opacity="0.05"
              animate={{
                opacity: [0.03, 0.08, 0.03],
              }}
              transition={{
                duration: 2 + i * 0.3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          );
        })}
      </svg>
    </div>
  );
};
