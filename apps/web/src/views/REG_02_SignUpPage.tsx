// ============================================================================
// REG_02 - SIGN-UP PAGE [FORTUNE 500 EDITION - REACTOR ASSEMBLY]
// Architecture: Reactor Core Fabrication
// Metaphor: "Building the Core" - Inputs stabilize the reactor
// Features: Dynamic stability visualization, atmospheric particles, cursor parallax
// ============================================================================
import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Shield, ArrowRight, Zap, Activity, Database, Cpu } from 'lucide-react';
import { motion, useMotionValue, useSpring, useMotionTemplate, useTransform } from 'motion/react';
import { NexusIcon } from '@/components/nexus/NexusIcon';
import {
  EngineProvider,
  ReactorCore,
  CoolantSystem,
  EnergyField,
} from '../components/auth/IntegratedEngine';

// ============================================================================
// PROFESSIONAL EASING CURVES
// ============================================================================
const EASING = {
  smooth: [0.25, 0.1, 0.25, 1],
  snap: [0.85, 0, 0.15, 1],
  natural: [0.45, 0, 0.55, 1],
};

// ============================================================================
// SUB-COMPONENT: ATMOSPHERIC PARTICLE SYSTEM
// ============================================================================
const ReactorParticles = ({ stability }: { stability: number }) => {
  const particles = Array.from({ length: 30 });
  const isStable = stability > 80;
  const particleColor = isStable ? '#00F0FF' : stability > 40 ? '#FFD700' : '#FF0055';

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((_, i) => {
        const randomX = Math.random() * 100;
        const randomY = Math.random() * 100;
        const randomDuration = 8 + Math.random() * 15;
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
              backgroundColor: particleColor,
              opacity: 0.2,
              filter: 'blur(1px)',
            }}
            animate={{
              y: isStable ? [0, -80, 0] : [0, -150, 0],
              x: [0, Math.sin(i) * 15, 0],
              opacity: isStable ? [0.1, 0.3, 0.1] : [0.2, 0.5, 0.2],
              scale: isStable ? [1, 1.2, 1] : [1, 1.8, 1],
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
// SUB-COMPONENT: STABILITY WAVEFORM GRAPH
// ============================================================================
const StabilityGraph = ({ strength }: { strength: number }) => {
  const color = strength > 2 ? '#00F0FF' : strength > 0 ? '#FFD700' : '#FF0055';

  return (
    <div className="h-8 w-full bg-black/40 border-t border-b border-white/5 relative overflow-hidden flex items-center mt-2">
      <div className="absolute left-2 text-[8px] font-mono text-slate-500 tracking-widest uppercase">
        Core Stability
      </div>
      <svg className="w-full h-full opacity-60" preserveAspectRatio="none" viewBox="0 0 320 32">
        <defs>
          <filter id="waveform-glow">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <motion.path
          d={`M 0 16 ${Array.from({ length: 20 })
            .map((_, i) => {
              const x = i * 16;
              const variance = (4 - strength) * 4;
              const y = 16 + Math.sin(i * 0.5) * variance;
              return `Q ${x + 8} ${y} ${x + 16} 16`;
            })
            .join(' ')}`}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          filter="url(#waveform-glow)"
          animate={{
            d: `M 0 16 ${Array.from({ length: 20 })
              .map((_, i) => {
                const x = i * 16;
                const variance = (4 - strength) * 4;
                const y = 16 - Math.sin(i * 0.5) * variance;
                return `Q ${x + 8} ${y} ${x + 16} 16`;
              })
              .join(' ')}`,
          }}
          transition={{
            duration: strength > 2 ? 3 : 0.4,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
          }}
        />
      </svg>

      {/* Stability percentage */}
      <div className="absolute right-2 text-[9px] font-mono tracking-widest" style={{ color }}>
        {strength * 25}%
      </div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENT: COORDINATE GRID
// ============================================================================
const CoordinateGrid = () => {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.1 }}>
      {[
        { pos: 'top-4 left-4', label: '00:00', sublabel: 'ORIGIN' },
        { pos: 'top-4 right-4', label: '100:00', sublabel: 'GRID-X' },
        { pos: 'bottom-4 left-4', label: '00:100', sublabel: 'GRID-Y' },
        { pos: 'bottom-4 right-4', label: '100:100', sublabel: 'TERMINUS' },
      ].map((coord, i) => (
        <div key={i} className={`absolute ${coord.pos} text-[8px] font-mono text-cyan-500/40`}>
          <div className="tracking-widest">{coord.label}</div>
          <div className="text-[6px] text-cyan-500/20 tracking-wider">{coord.sublabel}</div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// SUB-COMPONENT: STATUS BAR
// ============================================================================
const StatusBar = ({ stability }: { stability: number }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isStable = stability > 80;
  const metrics = [
    {
      icon: Activity,
      label: 'CORE',
      value: `${stability}%`,
      color: isStable ? '#00F0FF' : '#FFD700',
    },
    { icon: Database, label: 'MEM', value: '1.8GB', color: '#666' },
    {
      icon: Cpu,
      label: 'TEMP',
      value: isStable ? '42°C' : '68°C',
      color: isStable ? '#666' : '#FFD700',
    },
  ];

  return (
    <div
      className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-8 py-4 text-[9px] font-mono uppercase tracking-widest text-slate-600 border-b border-white/5 backdrop-blur-sm"
      style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }}
    >
      <div className="flex items-center gap-6">
        {metrics.map((metric, i) => (
          <div key={i} className="flex items-center gap-2">
            <metric.icon size={10} style={{ color: metric.color }} />
            <span style={{ color: metric.color }}>{metric.label}</span>
            <span className="text-white/40">{metric.value}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <motion.div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: isStable ? '#00F0FF' : '#FFD700' }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span style={{ color: isStable ? '#00F0FF' : '#FFD700' }}>
          {isStable ? 'STABLE' : 'CALIBRATING'}
        </span>
      </div>

      <div className="text-white/40">{time.toLocaleTimeString('en-US', { hour12: false })}</div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENT: CRT SCANLINE
// ============================================================================
const ScanlineOverlay = () => (
  <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden opacity-12 mix-blend-overlay">
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
export const SignUpPage = () => {
  const navigate = useNavigate();

  // FORM STATE
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [passwordStrength, setPasswordStrength] = useState(0); // 0-4 scale
  const [isSubmitting, setIsSubmitting] = useState(false);

  // INTERFACE STATE
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  // PHYSICS STATE
  const shakeX = useMotionValue(0);
  const shakeY = useMotionValue(0);
  const springX = useSpring(shakeX, { stiffness: 400, damping: 30 });
  const springY = useSpring(shakeY, { stiffness: 400, damping: 30 });

  // CURSOR PARALLAX
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({ clientX, clientY, currentTarget }: React.MouseEvent) => {
    const bounds = currentTarget.getBoundingClientRect();
    const centerX = bounds.width / 2;
    const centerY = bounds.height / 2;
    mouseX.set((clientX - bounds.left - centerX) / centerX);
    mouseY.set((clientY - bounds.top - centerY) / centerY);
  };

  const parallaxX = useTransform(mouseX, [-1, 1], [-30, 30]);
  const parallaxY = useTransform(mouseY, [-1, 1], [-30, 30]);

  const spotlight = useMotionTemplate`
    radial-gradient(
      600px circle at ${useTransform(mouseX, [-1, 1], [0, 100])}% ${useTransform(mouseY, [-1, 1], [0, 100])}%,
      rgba(0, 240, 255, 0.08),
      transparent 70%
    )
  `;

  // Password strength analysis
  const checkStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 6) score++;
    if (pass.length > 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9!@#$%^&*]/.test(pass)) score++;
    setPasswordStrength(score);
  };

  // Input recoil
  const triggerRecoil = () => {
    const intensity = 1;
    shakeX.set(Math.random() * intensity - intensity / 2);
    setTimeout(() => shakeX.set(0), 40);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Fusion sequence
    await new Promise((resolve) => setTimeout(resolve, 2500));

    navigate('/');
  };

  // Calculate reactor stability (0-100)
  const reactorStability = passwordStrength * 25;
  const isInteracting = focusedField !== null;

  return (
    <EngineProvider state={isSubmitting ? 'revving' : 'idle'} shakeX={shakeX} shakeY={shakeY}>
      <div
        onMouseMove={handleMouseMove}
        className="min-h-screen w-full bg-black relative overflow-hidden flex items-center justify-center"
      >
        <ScanlineOverlay />
        <StatusBar stability={reactorStability} />

        {/* SCREEN SHAKE WRAPPER */}
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
            className="absolute inset-0 opacity-12"
            style={{
              backgroundImage: `
                linear-gradient(#1a1a1a 0.5px, transparent 0.5px), 
                linear-gradient(90deg, #1a1a1a 0.5px, transparent 0.5px)
              `,
              backgroundSize: '50px 50px',
            }}
          />

          {/* Coordinate Grid */}
          <CoordinateGrid />

          {/* Reactor Particles */}
          <ReactorParticles stability={reactorStability} />

          {/* Mouse Spotlight */}
          <motion.div
            className="absolute inset-0 pointer-events-none opacity-25"
            style={{ background: spotlight }}
          />

          {/* Depth Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)',
            }}
          />

          {/* ========================================
              LAYER 2: THE REACTOR MACHINERY
              ======================================== */}

          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ x: parallaxX, y: parallaxY }}
          >
            <ReactorCore stability={reactorStability} />
          </motion.div>

          {/* Coolant System (Left) */}
          <CoolantSystem active={focusedField === 'name' || isSubmitting} />

          {/* Energy Field (Right) */}
          <EnergyField active={focusedField !== null || isSubmitting} />

          {/* ========================================
              LAYER 3: THE FORM CONSOLE
              ======================================== */}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASING.smooth }}
            className="relative z-20 w-full max-w-[500px] px-8"
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
                background:
                  isHovering || isInteracting
                    ? 'linear-gradient(145deg, rgba(8, 12, 16, 0.96) 0%, rgba(4, 6, 8, 0.98) 100%)'
                    : 'linear-gradient(145deg, rgba(8, 12, 16, 0.10) 0%, rgba(4, 6, 8, 0.12) 100%)',
                backdropFilter: isHovering || isInteracting ? 'blur(24px)' : 'blur(8px)',
                boxShadow:
                  isHovering || isInteracting
                    ? '0 0 2px rgba(0, 240, 255, 0.4), 0 0 120px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                    : '0 0 1px rgba(0, 240, 255, 0.2), 0 0 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
              }}
              transition={{ duration: 0.6, ease: EASING.smooth }}
            >
              {/* Holographic Edge Highlight */}
              <motion.div
                className="absolute inset-0 pointer-events-none opacity-15"
                style={{
                  background: useMotionTemplate`radial-gradient(400px circle at ${useTransform(mouseX, [-1, 1], [0, 100])}% ${useTransform(mouseY, [-1, 1], [0, 100])}%, rgba(0, 240, 255, 0.2), transparent 80%)`,
                }}
              />

              {/* Top Energy Beam */}
              <motion.div
                className="absolute top-0 left-0 right-0 h-[1px]"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.6), transparent)',
                }}
                animate={{
                  opacity: reactorStability > 80 ? [0.5, 1, 0.5] : [0.2, 0.4, 0.2],
                  scaleX: reactorStability > 80 ? [0.8, 1.2, 0.8] : 1,
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Corner Brackets */}
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
                      fill="#00F0FF"
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
                <div className="text-center mb-8">
                  <Link to="/" className="inline-block mb-6 hover:opacity-70 transition-opacity">
                    <NexusIcon size="md" />
                  </Link>
                  <div className="space-y-1">
                    <motion.div
                      className="text-[10px] font-mono uppercase tracking-[0.3em]"
                      style={{ color: '#00F0FF', opacity: 0.6 }}
                      animate={{ opacity: [0.4, 0.7, 0.4] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      Protocol: Fabrication
                    </motion.div>
                    <h1 className="text-white tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                      Initialize User Node
                    </h1>
                  </div>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* FIELD: FULL NAME */}
                  <div className="group relative">
                    <label
                      className="block text-[10px] font-mono uppercase tracking-widest mb-2 transition-colors"
                      style={{
                        color: focusedField === 'name' ? '#FFD700' : '#888888',
                        letterSpacing: '0.2em',
                      }}
                    >
                      Identity Calibration
                    </label>
                    <div className="relative">
                      <User
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none"
                        style={{ color: focusedField === 'name' ? '#FFD700' : '#555555' }}
                      />
                      <motion.input
                        type="text"
                        placeholder="FULL DESIGNATION"
                        className="w-full pl-10 pr-4 py-3 text-sm transition-all duration-300"
                        style={{
                          backgroundColor:
                            focusedField === 'name'
                              ? 'rgba(255, 215, 0, 0.05)'
                              : 'rgba(0, 0, 0, 0.4)',
                          border: `1px solid ${focusedField === 'name' ? 'rgba(255, 215, 0, 0.5)' : '#1F1F1F'}`,
                          color: '#FFFFFF',
                          borderRadius: '2px',
                          outline: 'none',
                          boxShadow:
                            focusedField === 'name' ? '0 0 20px rgba(255, 215, 0, 0.1)' : 'none',
                        }}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          triggerRecoil();
                        }}
                        whileFocus={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                      />
                      {focusedField === 'name' && (
                        <motion.div
                          className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          exit={{ scaleX: 0 }}
                        />
                      )}
                    </div>
                  </div>

                  {/* FIELD: EMAIL */}
                  <div className="group relative">
                    <label
                      className="block text-[10px] font-mono uppercase tracking-widest mb-2 transition-colors"
                      style={{
                        color: focusedField === 'email' ? '#00F0FF' : '#888888',
                        letterSpacing: '0.2em',
                      }}
                    >
                      Comm Link
                    </label>
                    <div className="relative">
                      <Mail
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none"
                        style={{ color: focusedField === 'email' ? '#00F0FF' : '#555555' }}
                      />
                      <motion.input
                        type="email"
                        placeholder="USER@NEXUS.COM"
                        className="w-full pl-10 pr-4 py-3 text-sm transition-all duration-300"
                        style={{
                          backgroundColor:
                            focusedField === 'email'
                              ? 'rgba(0, 240, 255, 0.05)'
                              : 'rgba(0, 0, 0, 0.4)',
                          border: `1px solid ${focusedField === 'email' ? 'rgba(0, 240, 255, 0.5)' : '#1F1F1F'}`,
                          color: '#FFFFFF',
                          borderRadius: '2px',
                          outline: 'none',
                          boxShadow:
                            focusedField === 'email' ? '0 0 20px rgba(0, 240, 255, 0.1)' : 'none',
                        }}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          triggerRecoil();
                        }}
                        whileFocus={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                      />
                      {focusedField === 'email' && (
                        <motion.div
                          className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          exit={{ scaleX: 0 }}
                        />
                      )}
                    </div>
                  </div>

                  {/* FIELD: PASSWORD */}
                  <div className="group relative">
                    <div className="flex justify-between items-baseline mb-2">
                      <label
                        className="text-[10px] font-mono uppercase tracking-widest transition-colors"
                        style={{
                          color:
                            focusedField === 'password'
                              ? passwordStrength > 2
                                ? '#00F0FF'
                                : '#FFD700'
                              : '#888888',
                          letterSpacing: '0.2em',
                        }}
                      >
                        Core Encryption
                      </label>
                      <span
                        className="text-[10px] font-mono uppercase tracking-widest"
                        style={{
                          color:
                            passwordStrength === 0
                              ? '#FF0055'
                              : passwordStrength < 3
                                ? '#FFD700'
                                : '#00F0FF',
                        }}
                      >
                        {passwordStrength === 0
                          ? 'CRITICAL'
                          : passwordStrength < 3
                            ? 'UNSTABLE'
                            : 'OPTIMAL'}
                      </span>
                    </div>

                    <div className="relative">
                      <Shield
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none"
                        style={{
                          color:
                            focusedField === 'password'
                              ? passwordStrength > 2
                                ? '#00F0FF'
                                : '#FFD700'
                              : '#555555',
                        }}
                      />
                      <motion.input
                        type="password"
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-4 py-3 text-sm transition-all duration-300"
                        style={{
                          backgroundColor:
                            focusedField === 'password'
                              ? passwordStrength > 2
                                ? 'rgba(0, 240, 255, 0.05)'
                                : 'rgba(255, 215, 0, 0.05)'
                              : 'rgba(0, 0, 0, 0.4)',
                          border: `1px solid ${
                            focusedField === 'password'
                              ? passwordStrength > 2
                                ? 'rgba(0, 240, 255, 0.5)'
                                : 'rgba(255, 215, 0, 0.5)'
                              : '#1F1F1F'
                          }`,
                          color: '#FFFFFF',
                          borderRadius: '2px',
                          outline: 'none',
                          boxShadow:
                            focusedField === 'password'
                              ? `0 0 20px ${passwordStrength > 2 ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 215, 0, 0.1)'}`
                              : 'none',
                        }}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        onChange={(e) => {
                          setFormData({ ...formData, password: e.target.value });
                          checkStrength(e.target.value);
                          triggerRecoil();
                        }}
                        whileFocus={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>

                    {/* Stability Waveform */}
                    {formData.password && <StabilityGraph strength={passwordStrength} />}
                  </div>

                  {/* SUBMIT (Fusion) */}
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full group relative overflow-hidden mt-8"
                    whileHover={!isSubmitting ? { scale: 1.01 } : {}}
                    whileTap={!isSubmitting ? { scale: 0.99 } : {}}
                    transition={{ duration: 0.2, ease: EASING.snap }}
                  >
                    <div
                      className="relative z-10 w-full py-4 flex items-center justify-center gap-3 text-xs font-mono uppercase tracking-[0.2em] border transition-all duration-300"
                      style={{
                        backgroundColor: isSubmitting
                          ? 'rgba(0, 240, 255, 0.15)'
                          : 'rgba(0, 240, 255, 0.08)',
                        borderColor: isSubmitting
                          ? 'rgba(0, 240, 255, 0.5)'
                          : 'rgba(0, 240, 255, 0.3)',
                        color: '#00F0FF',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        borderRadius: '2px',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSubmitting) {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.15)';
                          e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.6)';
                          e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 240, 255, 0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                          >
                            <Zap size={14} />
                          </motion.div>
                          <span>Initializing Core...</span>
                        </>
                      ) : (
                        <>
                          <span>Initiate Fusion</span>
                          <ArrowRight
                            size={14}
                            className="transition-transform duration-200 group-hover:translate-x-1"
                          />
                        </>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {isSubmitting && (
                      <motion.div
                        className="absolute inset-0 z-0"
                        style={{ backgroundColor: 'rgba(0, 240, 255, 0.1)' }}
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2.5, ease: 'linear' }}
                      />
                    )}
                  </motion.button>
                </form>

                {/* FOOTER */}
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-xs font-mono uppercase tracking-widest">
                  <div className="flex items-center gap-4">
                    <Link
                      to="/login"
                      className="transition-colors hover:text-cyan-400"
                      style={{ color: '#666666', letterSpacing: '0.2em' }}
                    >
                      Have Account?
                    </Link>
                    <span style={{ color: '#333333' }}>|</span>
                    <Link
                      to="/reset-password"
                      className="transition-colors hover:text-orange-400"
                      style={{ color: '#666666', letterSpacing: '0.2em' }}
                    >
                      Reset Access
                    </Link>
                  </div>
                  <div style={{ color: '#444444' }}>REG-02</div>
                </div>

                {/* TECHNICAL FOOTER */}
                <div
                  className="mt-4 text-center text-xs font-mono uppercase tracking-widest"
                  style={{ color: '#333333', letterSpacing: '0.2em' }}
                >
                  <div>Auth Protocol: Fabrication</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </EngineProvider>
  );
};
