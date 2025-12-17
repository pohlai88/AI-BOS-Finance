import { useEffect, useRef } from 'react';
import { motion, useAnimation, useInView } from 'motion/react';

// --- THE PHILOSOPHY: "Light flowing through the machine" ---

export const LineageBeamCard = () => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-4xl h-64 bg-background border border-white/10 rounded-2xl overflow-hidden group hover:border-green-500/30 transition-colors duration-500"
    >
      {/* Background Grid - The "Void" Structure */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* THE LINEAGE NODES */}
      <div className="absolute inset-0 flex items-center justify-between px-16 z-20">
        {/* Node 1: Raw Data (Chaos) */}
        <Node label="Raw ERP Stream" icon="📦" delay={0} />

        {/* Node 2: The Nexus (Canon/AI) */}
        <div className="relative">
          <Node label="Nexus Canon" icon="🟢" delay={0.5} isCentral />
          {/* DeepSeek "Thinking" Halo */}
          <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-pulse z-0" />
        </div>

        {/* Node 3: The Truth (Report) */}
        <Node label="Audited Report" icon="📄" delay={1} />
      </div>

      {/* THE BEAM ANIMATION (SVG) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        {/* The Path Track (Dim) */}
        <path d="M 100 128 L 800 128" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />

        {/* The Beam (Glowing Light) */}
        <motion.path
          d="M 100 128 L 800 128"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
          transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.2 }}
        />

        {/* Gradient Definition for the Beam */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2D5A4A" stopOpacity="0" />
            <stop offset="50%" stopColor="#4ADE80" stopOpacity="1" /> {/* Neon Green */}
            <stop offset="100%" stopColor="#A855F7" stopOpacity="1" /> {/* Violet */}
          </linearGradient>
        </defs>
      </svg>

      {/* Title */}
      <div className="absolute bottom-4 left-6 text-xs font-mono text-gray-500 uppercase tracking-widest">
        Fig 1.1 — Immutable Lineage
      </div>
    </div>
  );
};

// Helper Component for Nodes
const Node = ({
  label,
  icon,
  delay,
  isCentral,
}: {
  label: string;
  icon: string;
  delay: number;
  isCentral?: boolean;
}) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay, type: 'spring', stiffness: 200 }}
    className={`relative z-10 flex flex-col items-center gap-3 ${isCentral ? 'scale-125' : ''}`}
  >
    <div className="w-12 h-12 rounded-xl bg-surface-subtle border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-md">
      <span className="text-xl">{icon}</span>
    </div>
    <span
      className={`text-xs font-medium tracking-wide ${isCentral ? 'text-green-400' : 'text-gray-400'}`}
    >
      {label}
    </span>
  </motion.div>
);
