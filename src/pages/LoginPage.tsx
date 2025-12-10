// ============================================================================
// REG_01 - LOGIN PAGE [FORTUNE 500 EDITION]
// Architecture: Integrated Engine Block with Enterprise-Grade Polish
// Features: Atmospheric particles, cursor parallax, data flow visualization,
//           technical callouts, status bar, professional easing, micro-interactions
// ============================================================================
import { useState, FormEvent, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Eye, EyeOff, Zap, Activity, Database, Cpu } from 'lucide-react';
import { motion, useMotionValue, useSpring, useMotionTemplate, useTransform } from 'motion/react';
import { NexusCanonLogo } from '@/components/NexusCanonLogo';
import {
  EngineProvider,
  AmberFlywheel,
  CyanPiston,
  TransmissionShaft,
  AmberPistonTop,
  NexusPistonBottom,
} from '../components/auth/IntegratedEngine';

// ============================================================================
// PROFESSIONAL EASING CURVES (Used by Top Animation Studios)
// ============================================================================
const EASING = {
  // Smooth deceleration (Apple-style)
  smooth: [0.25, 0.1, 0.25, 1],
  // Elastic bounce (Playful but controlled)
  elastic: [0.68, -0.55, 0.265, 1.55],
  // Sharp snap (Mechanical precision)
  snap: [0.85, 0, 0.15, 1],
  // Natural movement (Physics-based)
  natural: [0.45, 0, 0.55, 1],
};

// ============================================================================
// SUB-COMPONENT: ATMOSPHERIC PARTICLE SYSTEM
// ============================================================================
const ParticleField = ({ engineState }: { engineState: 'idle' | 'revving' }) => {
  const particles = Array.from({ length: 40 });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((_, i) => {
        const randomX = Math.random() * 100;
        const randomY = Math.random() * 100;
        const randomDuration = 10 + Math.random() * 20;
        const randomDelay = Math.random() * 5;
        const randomSize = 1 + Math.random() * 2;

        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${randomX}%`,
              top: `${randomY}%`,
              width: `${randomSize}px`,
              height: `${randomSize}px`,
              backgroundColor: i % 3 === 0 ? '#FFD700' : i % 3 === 1 ? '#00F0FF' : '#28E7A2',
              opacity: 0.15,
              filter: 'blur(1px)',
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.sin(i) * 20, 0],
              opacity: engineState === 'revving' ? [0.15, 0.4, 0.15] : [0.05, 0.2, 0.05],
              scale: engineState === 'revving' ? [1, 1.5, 1] : [1, 1.2, 1],
            }}
            transition={{
              duration: randomDuration,
              delay: randomDelay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
};

// ============================================================================
// SUB-COMPONENT: DATA FLOW LINES (Connection Visualization)
// ============================================================================
const DataFlowLines = ({
  activeConduit,
  engineState,
}: {
  activeConduit: 'none' | 'email' | 'password';
  engineState: 'idle' | 'revving';
}) => {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
      <defs>
        {/* Gradient for flowing energy */}
        <linearGradient id="amberFlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFD700" stopOpacity="0" />
          <stop offset="50%" stopColor="#FFD700" stopOpacity="1" />
          <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="cyanFlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00F0FF" stopOpacity="0" />
          <stop offset="50%" stopColor="#00F0FF" stopOpacity="1" />
          <stop offset="100%" stopColor="#00F0FF" stopOpacity="0" />
        </linearGradient>

        {/* Glow filter */}
        <filter id="dataGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Email Input → Amber Flywheel (Left) */}
      <motion.line
        x1="20%"
        y1="45%"
        x2="2%"
        y2="45%"
        stroke="#FFD700"
        strokeWidth="1"
        strokeDasharray="4 4"
        opacity={activeConduit === 'email' ? 0.7 : 0.15}
        filter="url(#dataGlow)"
        animate={{
          strokeDashoffset: activeConduit === 'email' ? [0, -8] : 0,
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Password Input → Cyan Piston (Right) */}
      <motion.line
        x1="80%"
        y1="55%"
        x2="98%"
        y2="55%"
        stroke="#00F0FF"
        strokeWidth="1"
        strokeDasharray="4 4"
        opacity={activeConduit === 'password' ? 0.7 : 0.15}
        filter="url(#dataGlow)"
        animate={{
          strokeDashoffset: activeConduit === 'password' ? [0, -8] : 0,
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Connection nodes */}
      {activeConduit === 'email' && (
        <motion.circle
          cx="20%"
          cy="45%"
          r="3"
          fill="#FFD700"
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
      {activeConduit === 'password' && (
        <motion.circle
          cx="80%"
          cy="55%"
          r="3"
          fill="#00F0FF"
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </svg>
  );
};

// ============================================================================
// SUB-COMPONENT: COORDINATE GRID OVERLAY
// ============================================================================
const CoordinateGrid = () => {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.12 }}>
      {/* Corner Coordinates */}
      {[
        { pos: 'top-4 left-4', label: '00:00', sublabel: 'ORIGIN' },
        { pos: 'top-4 right-4', label: '100:00', sublabel: 'GRID-X' },
        { pos: 'bottom-4 left-4', label: '00:100', sublabel: 'GRID-Y' },
        { pos: 'bottom-4 right-4', label: '100:100', sublabel: 'TERMINUS' },
      ].map((coord, i) => (
        <div key={i} className={`absolute ${coord.pos} text-[8px] font-mono text-emerald-500/40`}>
          <div className="tracking-widest">{coord.label}</div>
          <div className="text-[6px] text-emerald-500/20 tracking-wider">{coord.sublabel}</div>
        </div>
      ))}

      {/* Crosshair markers */}
      {[
        { top: '50%', left: '20%' },
        { top: '50%', left: '80%' },
        { top: '30%', left: '50%' },
        { top: '70%', left: '50%' },
      ].map((pos, i) => (
        <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={pos}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <line x1="6" y1="0" x2="6" y2="12" stroke="#28E7A2" strokeWidth="0.5" opacity="0.3" />
            <line x1="0" y1="6" x2="12" y2="6" stroke="#28E7A2" strokeWidth="0.5" opacity="0.3" />
            <circle cx="6" cy="6" r="1" fill="#28E7A2" opacity="0.5" />
          </svg>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// SUB-COMPONENT: STATUS BAR (Real-time System Metrics)
// ============================================================================
const StatusBar = ({ engineState }: { engineState: 'idle' | 'revving' }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const metrics = [
    {
      icon: Activity,
      label: 'SYS',
      value: engineState === 'idle' ? '24%' : '87%',
      color: engineState === 'idle' ? '#666' : '#28E7A2',
    },
    { icon: Database, label: 'MEM', value: '2.4GB', color: '#666' },
    {
      icon: Cpu,
      label: 'CPU',
      value: engineState === 'idle' ? '12%' : '64%',
      color: engineState === 'idle' ? '#666' : '#FFD700',
    },
  ];

  return (
    <div
      className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-8 py-4 text-[9px] font-mono uppercase tracking-widest text-slate-600 border-b border-white/5 backdrop-blur-sm"
      style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }}
    >
      {/* Left: Metrics */}
      <div className="flex items-center gap-6">
        {metrics.map((metric, i) => (
          <div key={i} className="flex items-center gap-2">
            <metric.icon size={10} style={{ color: metric.color }} />
            <span style={{ color: metric.color }}>{metric.label}</span>
            <span className="text-white/40">{metric.value}</span>
          </div>
        ))}
      </div>

      {/* Center: Status */}
      <div className="flex items-center gap-2">
        <motion.div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: engineState === 'idle' ? '#666' : '#28E7A2' }}
          animate={{ opacity: engineState === 'idle' ? 0.5 : [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <span style={{ color: engineState === 'idle' ? '#666' : '#28E7A2' }}>
          {engineState === 'idle' ? 'STANDBY' : 'ACTIVE'}
        </span>
      </div>

      {/* Right: Time */}
      <div className="text-white/40">{time.toLocaleTimeString('en-US', { hour12: false })}</div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENT: IMPACT RIPPLE EFFECT
// ============================================================================
const ImpactRipple = ({ engineState }: { engineState: 'idle' | 'revving' }) => {
  if (engineState !== 'revving') return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-500/20"
          initial={{ width: 0, height: 0, opacity: 0.8 }}
          animate={{
            width: ['0px', '800px'],
            height: ['0px', '800px'],
            opacity: [0.8, 0],
          }}
          transition={{
            duration: 2,
            delay: i * 0.4,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
};

// ============================================================================
// SUB-COMPONENT: CRT SCANLINE OVERLAY
// ============================================================================
const ScanlineOverlay = () => (
  <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden opacity-15 mix-blend-overlay">
    <div
      className="absolute inset-0"
      style={{
        backgroundImage:
          'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
        backgroundSize: '100% 2px, 3px 100%',
      }}
    />
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ENGINE STATE
  const [engineState, setEngineState] = useState<'idle' | 'revving'>('idle');
  const [activeConduit, setActiveConduit] = useState<'none' | 'email' | 'password'>('none');

  // INTERACTION STATE (for transparency control)
  const [isHovering, setIsHovering] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  // SCREEN SHAKE VALUES
  const shakeX = useMotionValue(0);
  const shakeY = useMotionValue(0);
  const springX = useSpring(shakeX, { stiffness: 400, damping: 30 });
  const springY = useSpring(shakeY, { stiffness: 400, damping: 30 });

  // CURSOR PARALLAX (Enhanced for dramatic movement)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({ clientX, clientY, currentTarget }: React.MouseEvent) => {
    const bounds = currentTarget.getBoundingClientRect();
    const centerX = bounds.width / 2;
    const centerY = bounds.height / 2;
    mouseX.set((clientX - bounds.left - centerX) / centerX);
    mouseY.set((clientY - bounds.top - centerY) / centerY);
  };

  // Transform mouse position to dramatic parallax offsets (ENHANCED)
  const parallaxX = useTransform(mouseX, [-1, 1], [-40, 40]);
  const parallaxY = useTransform(mouseY, [-1, 1], [-40, 40]);

  // Deeper parallax for background elements (slower, more depth)
  const parallaxXDeep = useTransform(mouseX, [-1, 1], [-20, 20]);
  const parallaxYDeep = useTransform(mouseY, [-1, 1], [-20, 20]);

  // Stronger parallax for foreground elements (faster, more dynamic)
  const parallaxXStrong = useTransform(mouseX, [-1, 1], [-60, 60]);
  const parallaxYStrong = useTransform(mouseY, [-1, 1], [-60, 60]);

  // Spotlight effect
  const spotlight = useMotionTemplate`
    radial-gradient(
      800px circle at ${useTransform(mouseX, [-1, 1], [0, 100])}% ${useTransform(mouseY, [-1, 1], [0, 100])}%,
      rgba(40, 231, 162, 0.08),
      transparent 70%
    )
  `;

  // INPUT RECOIL HANDLER
  const triggerRecoil = () => {
    const intensity = 1.5;
    shakeX.set(Math.random() * intensity - intensity / 2);
    setTimeout(() => shakeX.set(0), 40);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setEngineState('revving');
    setActiveConduit('none');

    // Simulate authentication sequence
    await new Promise((resolve) => setTimeout(resolve, 2000));

    navigate('/sys-bootloader');
    setIsSubmitting(false);
    setEngineState('idle');
  };

  return (
    <EngineProvider state={engineState} setState={setEngineState} shakeX={shakeX} shakeY={shakeY}>
      {/* GLOBAL CONTAINER WITH MOUSE TRACKING */}
      <div
        onMouseMove={handleMouseMove}
        className="w-full h-full min-h-screen bg-black relative overflow-hidden"
      >
        <ScanlineOverlay />
        <StatusBar engineState={engineState} />

        {/* EARTHQUAKE WRAPPER */}
        <motion.div
          style={{
            x: springX,
            y: springY,
            width: '100%',
            minHeight: '100vh',
          }}
          className="flex items-center justify-center relative"
        >
          {/* ========================================
              LAYER 1: BACKGROUND & ATMOSPHERE
              ======================================== */}

          {/* Base Grid */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: `
                linear-gradient(#1a1a1a 0.5px, transparent 0.5px), 
                linear-gradient(90deg, #1a1a1a 0.5px, transparent 0.5px)
              `,
              backgroundSize: '50px 50px',
            }}
          />

          {/* Coordinate Grid Overlay */}
          <CoordinateGrid />

          {/* Atmospheric Particles */}
          <ParticleField engineState={engineState} />

          {/* Mouse Spotlight (Volumetric Fog) */}
          <motion.div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{ background: spotlight }}
          />

          {/* Impact Ripples */}
          <ImpactRipple engineState={engineState} />

          {/* Depth Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)',
            }}
          />

          {/* ========================================
              LAYER 2: THE MECHANICS (with parallax)
              ======================================== */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ x: parallaxX, y: parallaxY }}
          >
            <div className="relative w-full max-w-6xl h-screen flex items-center justify-center">
              <TransmissionShaft />
              <AmberFlywheel />
              <CyanPiston />
              <AmberPistonTop />
              <NexusPistonBottom />
            </div>
          </motion.div>

          {/* Data Flow Lines */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-full max-w-md h-screen flex items-center justify-center">
              <DataFlowLines activeConduit={activeConduit} engineState={engineState} />
            </div>
          </div>

          {/* ========================================
              LAYER 3: THE ENGINE CASING (Login Box)
              ======================================== */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: EASING.smooth }}
            className="relative z-20 w-full max-w-md px-8"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <motion.div
              className="relative border overflow-hidden"
              style={{
                borderColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '4px',
              }}
              animate={{
                // CINEMATIC TRANSPARENCY: 90% transparent when idle, solid when hovering/interacting
                background:
                  isHovering || isInteracting
                    ? 'linear-gradient(145deg, rgba(8, 12, 16, 0.96) 0%, rgba(4, 6, 8, 0.98) 100%)'
                    : 'linear-gradient(145deg, rgba(8, 12, 16, 0.10) 0%, rgba(4, 6, 8, 0.12) 100%)',
                backdropFilter: isHovering || isInteracting ? 'blur(24px)' : 'blur(8px)',
                boxShadow:
                  isHovering || isInteracting
                    ? `
                    0 0 2px rgba(40, 231, 162, 0.4),
                    0 0 120px rgba(0,0,0,0.9), 
                    inset 0 1px 0 rgba(255, 255, 255, 0.08),
                    inset 0 0 80px rgba(0, 0, 0, 0.5)
                  `
                    : `
                    0 0 1px rgba(40, 231, 162, 0.2),
                    0 0 80px rgba(0,0,0,0.7), 
                    inset 0 1px 0 rgba(255, 255, 255, 0.03),
                    inset 0 0 60px rgba(0, 0, 0, 0.3)
                  `,
              }}
              transition={{ duration: 0.6, ease: EASING.smooth }}
            >
              {/* Top Energy Beam */}
              <motion.div
                className="absolute top-0 left-0 right-0 h-[1px]"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(40, 231, 162, 0.6), transparent)',
                }}
                animate={{
                  opacity: engineState === 'revving' ? [0.5, 1, 0.5] : [0.2, 0.4, 0.2],
                  scaleX: engineState === 'revving' ? [0.8, 1.2, 0.8] : 1,
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Corner Brackets (Structural Elements) */}
              {[
                { top: '0', left: '0', rotate: '0deg' },
                { top: '0', right: '0', rotate: '90deg' },
                { bottom: '0', left: '0', rotate: '-90deg' },
                { bottom: '0', right: '0', rotate: '180deg' },
              ].map((pos, i) => (
                <div key={i} className="absolute w-4 h-4 pointer-events-none" style={pos}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    style={{ transform: `rotate(${pos.rotate})` }}
                  >
                    <line
                      x1="0"
                      y1="0"
                      x2="16"
                      y2="0"
                      stroke="rgba(255, 255, 255, 0.15)"
                      strokeWidth="1"
                    />
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="16"
                      stroke="rgba(255, 255, 255, 0.15)"
                      strokeWidth="1"
                    />
                    <motion.circle
                      cx="2"
                      cy="2"
                      r="1.5"
                      fill="#28E7A2"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.5,
                        ease: 'easeInOut',
                      }}
                    />
                  </svg>
                </div>
              ))}

              <div className="p-10">
                {/* HEADER */}
                <div className="mb-8 text-center relative z-10">
                  <Link to="/" className="inline-block hover:opacity-70 transition-opacity mb-6">
                    <NexusCanonLogo variant="icon" size="md" />
                  </Link>
                  <div className="space-y-1">
                    <motion.div
                      className="text-[10px] font-mono uppercase tracking-[0.3em]"
                      style={{ color: '#28E7A2', opacity: 0.6 }}
                      animate={{ opacity: [0.4, 0.7, 0.4] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      System Access
                    </motion.div>
                    <h1 className="text-white tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                      Control Panel Authentication
                    </h1>
                  </div>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                  {/* OPERATOR ID (Connected to Amber Flywheel) */}
                  <div className="group">
                    <label
                      className="block text-[10px] font-mono uppercase tracking-widest mb-2 transition-colors"
                      style={{
                        color: activeConduit === 'email' ? '#FFD700' : '#888888',
                        letterSpacing: '0.2em',
                      }}
                    >
                      Operator ID
                    </label>
                    <div className="relative">
                      <Mail
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none"
                        style={{ color: activeConduit === 'email' ? '#FFD700' : '#555555' }}
                      />
                      <motion.input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          triggerRecoil();
                        }}
                        onFocus={() => {
                          setEngineState('revving');
                          setActiveConduit('email');
                          setIsInteracting(true);
                        }}
                        onBlur={() => {
                          setEngineState('idle');
                          setActiveConduit('none');
                          setIsInteracting(false);
                        }}
                        placeholder="user@nexus.com"
                        className="w-full pl-10 pr-4 py-3 text-sm transition-all duration-300"
                        style={{
                          backgroundColor:
                            activeConduit === 'email'
                              ? 'rgba(255, 215, 0, 0.05)'
                              : 'rgba(0, 0, 0, 0.4)',
                          border: `1px solid ${activeConduit === 'email' ? 'rgba(255, 215, 0, 0.5)' : '#1F1F1F'}`,
                          color: '#FFFFFF',
                          borderRadius: '2px',
                          outline: 'none',
                          boxShadow:
                            activeConduit === 'email'
                              ? '0 0 20px rgba(255, 215, 0, 0.1), inset 0 1px 0 rgba(255, 215, 0, 0.1)'
                              : 'none',
                        }}
                        whileFocus={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                      />
                      {/* Active Indicator */}
                      {activeConduit === 'email' && (
                        <motion.div
                          layoutId="active-indicator"
                          className="absolute right-0 top-0 bottom-0 w-[2px]"
                          style={{ backgroundColor: '#FFD700' }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        />
                      )}
                    </div>
                  </div>

                  {/* SECURITY KEY (Connected to Cyan Piston) */}
                  <div className="group">
                    <label
                      className="block text-[10px] font-mono uppercase tracking-widest mb-2 transition-colors"
                      style={{
                        color: activeConduit === 'password' ? '#00F0FF' : '#888888',
                        letterSpacing: '0.2em',
                      }}
                    >
                      Security Key
                    </label>
                    <div className="relative">
                      <Lock
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none"
                        style={{ color: activeConduit === 'password' ? '#00F0FF' : '#555555' }}
                      />
                      <motion.input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          triggerRecoil();
                        }}
                        onFocus={() => {
                          setEngineState('revving');
                          setActiveConduit('password');
                          setIsInteracting(true);
                        }}
                        onBlur={() => {
                          setEngineState('idle');
                          setActiveConduit('none');
                          setIsInteracting(false);
                        }}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-12 py-3 text-sm transition-all duration-300"
                        style={{
                          backgroundColor:
                            activeConduit === 'password'
                              ? 'rgba(0, 240, 255, 0.05)'
                              : 'rgba(0, 0, 0, 0.4)',
                          border: `1px solid ${activeConduit === 'password' ? 'rgba(0, 240, 255, 0.5)' : '#1F1F1F'}`,
                          color: '#FFFFFF',
                          borderRadius: '2px',
                          outline: 'none',
                          boxShadow:
                            activeConduit === 'password'
                              ? '0 0 20px rgba(0, 240, 255, 0.1), inset 0 1px 0 rgba(0, 240, 255, 0.1)'
                              : 'none',
                        }}
                        whileFocus={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: activeConduit === 'password' ? '#00F0FF' : '#555555' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color =
                            activeConduit === 'password' ? '#00F0FF' : '#555555')
                        }
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      {/* Active Indicator */}
                      {activeConduit === 'password' && (
                        <motion.div
                          layoutId="active-indicator"
                          className="absolute right-0 top-0 bottom-0 w-[2px]"
                          style={{ backgroundColor: '#00F0FF' }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        />
                      )}
                    </div>
                  </div>

                  {/* FORGOT LINK */}
                  <div className="flex justify-end">
                    <Link
                      to="/reset-password"
                      className="text-[10px] font-mono uppercase tracking-widest transition-colors"
                      style={{ color: '#666666', letterSpacing: '0.2em' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#28E7A2')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#666666')}
                    >
                      Reset Credentials
                    </Link>
                  </div>

                  {/* IGNITION BUTTON */}
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full group relative overflow-hidden"
                    whileHover={!isSubmitting ? { scale: 1.01 } : {}}
                    whileTap={!isSubmitting ? { scale: 0.99 } : {}}
                    transition={{ duration: 0.2, ease: EASING.snap }}
                  >
                    <div
                      className="relative z-10 w-full py-4 flex items-center justify-center gap-3 text-xs font-mono uppercase tracking-[0.2em] border transition-all duration-300"
                      style={{
                        backgroundColor: isSubmitting
                          ? 'rgba(40, 231, 162, 0.15)'
                          : 'rgba(40, 231, 162, 0.08)',
                        borderColor: isSubmitting
                          ? 'rgba(40, 231, 162, 0.5)'
                          : 'rgba(40, 231, 162, 0.3)',
                        color: isSubmitting ? '#28E7A2' : '#28E7A2',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        borderRadius: '2px',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSubmitting) {
                          e.currentTarget.style.backgroundColor = 'rgba(40, 231, 162, 0.15)';
                          e.currentTarget.style.borderColor = 'rgba(40, 231, 162, 0.6)';
                          e.currentTarget.style.boxShadow = '0 0 30px rgba(40, 231, 162, 0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(40, 231, 162, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(40, 231, 162, 0.3)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* Scanning line effect */}
                      {!isSubmitting && (
                        <motion.div
                          className="absolute left-0 top-0 bottom-0 w-[2px]"
                          style={{
                            background:
                              'linear-gradient(to bottom, transparent, #28E7A2, transparent)',
                            filter: 'blur(1px)',
                            boxShadow: '0 0 10px rgba(40, 231, 162, 0.8)',
                          }}
                          animate={{ left: ['-2px', '100%'] }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: 'linear',
                            repeatDelay: 0.5,
                          }}
                        />
                      )}

                      {isSubmitting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                          >
                            <Zap size={14} />
                          </motion.div>
                          <span>Sequence Initiated</span>
                        </>
                      ) : (
                        <>
                          <span>Ignite Engine</span>
                          <ArrowRight
                            size={14}
                            className="transition-transform duration-200 group-hover:translate-x-1"
                          />
                        </>
                      )}
                    </div>

                    {/* Progress Bar Background */}
                    {isSubmitting && (
                      <motion.div
                        className="absolute inset-0 z-0"
                        style={{ backgroundColor: 'rgba(40, 231, 162, 0.1)' }}
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2, ease: 'linear' }}
                      />
                    )}
                  </motion.button>
                </form>

                {/* DIVIDER */}
                <div className="flex items-center gap-4 my-8">
                  <div className="flex-1 h-[1px]" style={{ backgroundColor: '#1F1F1F' }} />
                  <span
                    className="text-xs font-mono uppercase tracking-widest"
                    style={{ color: '#444444' }}
                  >
                    Or
                  </span>
                  <div className="flex-1 h-[1px]" style={{ backgroundColor: '#1F1F1F' }} />
                </div>

                {/* SIGN UP LINK */}
                <div className="text-center">
                  <p className="text-sm mb-2" style={{ color: '#666666' }}>
                    New to the system?
                  </p>
                  <Link
                    to="/signup"
                    className="text-sm font-mono uppercase tracking-widest transition-colors inline-flex items-center gap-2"
                    style={{ color: '#888888', letterSpacing: '0.2em' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#28E7A2')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
                  >
                    <span>Request Access</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>

                {/* NAVIGATION FOOTER */}
                <div
                  className="mt-8 pt-6 border-t flex items-center justify-between text-xs font-mono uppercase tracking-widest"
                  style={{
                    borderColor: '#1F1F1F',
                    letterSpacing: '0.2em',
                  }}
                >
                  <div className="flex items-center gap-4">
                    <Link
                      to="/signup"
                      className="transition-colors hover:text-cyan-400"
                      style={{ color: '#666666' }}
                    >
                      Create Account
                    </Link>
                    <span style={{ color: '#333333' }}>|</span>
                    <Link
                      to="/reset-password"
                      className="transition-colors hover:text-orange-400"
                      style={{ color: '#666666' }}
                    >
                      Reset Access
                    </Link>
                  </div>
                  <div style={{ color: '#444444' }}>REG-01</div>
                </div>

                {/* TECHNICAL FOOTER */}
                <div
                  className="mt-4 text-center text-xs font-mono uppercase tracking-widest"
                  style={{
                    color: '#333333',
                    letterSpacing: '0.2em',
                  }}
                >
                  <div>System Version: 1.0.0</div>
                  <div className="mt-1">Auth Protocol: Ignition</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </EngineProvider>
  );
};
