import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ShieldCheck } from 'lucide-react';

// --- Types ---
interface MorphologyNodeProps {
  angle: number;
  emoji: string;
  label: string;
  sublabel: string;
  examples: string[];
  color: string;
  tier: 'child' | 'cell' | 'trace';
  isMerged: boolean;
}

// --- Components ---

const MorphologyNode = ({
  angle,
  emoji,
  label,
  sublabel,
  examples,
  color,
  tier,
  isMerged,
}: MorphologyNodeProps) => {
  const radius = 220; // Slightly wider for better separation
  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const y = Math.sin((angle * Math.PI) / 180) * radius;

  const colorMap = {
    child: { border: '#FFD600', bg: '#1F1F1F', text: '#FFD600', glow: 'rgba(255, 214, 0, 0.2)' },
    cell: { border: '#28E7A2', bg: '#0D2420', text: '#28E7A2', glow: 'rgba(40, 231, 162, 0.2)' },
    trace: { border: '#FFFFFF', bg: '#1F1F1F', text: '#FFFFFF', glow: 'rgba(255, 255, 255, 0.2)' },
  };

  const colors = colorMap[tier];

  return (
    <motion.div
      className="absolute z-30"
      initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
      animate={{
        // If merged, go to center (0,0), scale down, and fade
        x: isMerged ? 0 : x,
        y: isMerged ? 0 : y,
        scale: isMerged ? 0 : 1,
        opacity: isMerged ? 0 : 1,
      }}
      transition={{
        duration: 1.2,
        type: 'spring',
        bounce: 0.2,
        delay: isMerged ? 0 : (angle / 360) * 0.3, // Stagger out, rush in
      }}
      style={{
        left: '50%',
        top: '50%',
        marginLeft: '-60px',
        marginTop: '-60px',
      }}
    >
      {/* Node Content */}
      <motion.div
        className="relative w-[120px] h-[120px] rounded-full flex flex-col items-center justify-center cursor-pointer bg-[#1F1F1F]"
        style={{
          backgroundColor: colors.bg,
          border: `2px solid ${colors.border}`,
          boxShadow: `0 0 20px ${colors.glow}`,
        }}
      >
        <div className="text-3xl mb-1 select-none">{emoji}</div>
        <div
          className="font-mono text-[8px] tracking-wider uppercase font-semibold"
          style={{ color: colors.text }}
        >
          {label}
        </div>
      </motion.div>
    </motion.div>
  );
};

const Tether = ({
  angle,
  color,
  isMerged,
}: {
  angle: number;
  color: string;
  isMerged: boolean;
}) => {
  const colorMap: Record<string, string> = {
    yellow: '#FFD600',
    green: '#28E7A2',
    white: '#FFFFFF',
  };
  const hexColor = colorMap[color];

  return (
    <motion.div
      className="absolute w-full h-full pointer-events-none z-0"
      style={{ transform: `rotate(${angle}deg)` }}
      animate={{ opacity: isMerged ? 0 : 1 }}
      transition={{ duration: 0.5 }}
    >
      <div
        className="absolute left-1/2 top-1/2 h-[220px] w-[1px] origin-top"
        style={{
          background: `linear-gradient(to bottom, ${hexColor}80, transparent)`,
          transform: 'translateX(-50%) translateY(-50px)',
        }}
      >
        {/* Only pulse data when NOT merged */}
        {!isMerged && (
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-4 rounded-full blur-[1px]"
            style={{ backgroundColor: hexColor }}
            animate={{ top: ['10%', '100%'], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'circOut' }}
          />
        )}
      </div>
    </motion.div>
  );
};

// --- Main Scene ---

export const LemonLifecycle = () => {
  // State to control the heartbeat of the animation
  const [isMerged, setIsMerged] = useState(false);

  // Cycle every 6 seconds (3s expanded, 3s merged)
  useEffect(() => {
    const interval = setInterval(() => {
      setIsMerged((prev) => !prev);
    }, 6000); // 6 seconds per phase
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-6xl mx-auto h-[700px] flex items-center justify-center overflow-hidden bg-[#050505] text-white">
      {/* Background Grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#999 1px, transparent 1px), linear-gradient(90deg, #999 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Orbit Rings (Fade out when merged to focus on center) */}
      <motion.div
        className="absolute w-[440px] h-[440px] rounded-full border border-[#333]"
        animate={{ scale: isMerged ? 0.5 : 1, opacity: isMerged ? 0 : 0.3 }}
        transition={{ duration: 1 }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full border border-dashed border-[#333]"
        animate={{ scale: isMerged ? 0.5 : 1, opacity: isMerged ? 0 : 0.15, rotate: 180 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      />

      {/* --- THE SCENE WRAPPER --- */}
      <div className="relative w-[600px] h-[600px] flex items-center justify-center">
        {/* CENTER LEMON (The Mother Canon) */}
        <motion.div
          className="absolute z-40 flex flex-col items-center justify-center"
          animate={{
            scale: isMerged ? 1.8 : 1, // Becomes BIG when merged
          }}
          transition={{ duration: 1.2, type: 'spring', bounce: 0.3 }}
        >
          {/* Golden Aura (Only visible when merged) */}
          <motion.div
            className="absolute w-full h-full rounded-full bg-[#FFD600] blur-2xl -z-10"
            animate={{
              opacity: isMerged ? 0.3 : 0,
              scale: isMerged ? 1.5 : 0.8,
            }}
          />

          {/* Main Core UI */}
          <motion.div
            className="relative w-32 h-32 bg-[#0A0A0A] rounded-full flex flex-col items-center justify-center z-20 overflow-hidden"
            style={{
              border: isMerged ? '4px solid #FFD600' : '3px solid #444',
              boxShadow: isMerged ? '0 0 50px rgba(255, 214, 0, 0.4)' : 'none',
            }}
            transition={{ duration: 0.5 }}
          >
            {/* Background Scanline effect inside the lemon */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20" />

            {/* SCANNING BEAM (Active Verification) */}
            <AnimatePresence>
              {isMerged && (
                <motion.div
                  className="absolute w-full h-1 bg-[#FFD600] blur-sm z-30 opacity-70"
                  initial={{ top: '-10%' }}
                  animate={{ top: '110%' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                />
              )}
            </AnimatePresence>

            {/* Overlay Grid (Forensic Verification Pattern) */}
            <AnimatePresence>
              {isMerged && (
                <motion.div
                  className="absolute inset-0 bg-[linear-gradient(rgba(255,214,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,214,0,0.1)_1px,transparent_1px)] bg-[size:8px_8px] z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </AnimatePresence>

            {/* Icon Transformation */}
            <motion.span
              className="filter drop-shadow-lg relative z-10"
              animate={{ fontSize: isMerged ? '60px' : '48px' }}
            >
              🍋
            </motion.span>

            {/* Label Transformation */}
            <AnimatePresence mode="wait">
              {isMerged ? (
                <motion.div
                  key="merged-label"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute bottom-4 flex flex-col items-center"
                >
                  <span className="font-mono text-[6px] text-[#FFD600] uppercase font-bold tracking-widest bg-black/50 px-1">
                    Immutable
                  </span>
                  <span className="font-mono text-[5px] text-white uppercase tracking-widest">
                    Metadata
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="base-label"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute bottom-4 flex flex-col items-center"
                >
                  <span className="font-mono text-[7px] text-[#888] uppercase tracking-widest">
                    Base Canon
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* THE LAW OF TRUTH - Side Panels (Comparative Message) */}
          <AnimatePresence>
            {isMerged && (
              <>
                {/* Left Panel: VARIABLE */}
                <motion.div
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-[#0A0A0A] border-l-2 border-[#888] p-3 text-right pointer-events-none"
                  initial={{ x: 60, opacity: 0 }}
                  animate={{ x: -140, opacity: 1 }}
                  exit={{ x: 60, opacity: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <div className="text-[9px] text-[#666] uppercase tracking-[0.15em] mb-1">
                    Morphology
                  </div>
                  <div className="text-sm text-white font-light tracking-tight">VARIABLE</div>
                  <div className="mt-1 text-[7px] text-[#444] font-mono">💧 📦 🧬</div>
                </motion.div>

                {/* Right Panel: CONSTANT */}
                <motion.div
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#0A0A0A] border-r-2 border-[#FFD600] p-3 text-left pointer-events-none"
                  initial={{ x: -60, opacity: 0 }}
                  animate={{ x: 140, opacity: 1 }}
                  exit={{ x: -60, opacity: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <div className="text-[9px] text-[#666] uppercase tracking-[0.15em] mb-1">
                    Metadata
                  </div>
                  <div className="text-sm text-[#FFD600] font-bold tracking-tight">CONSTANT</div>
                  <div className="mt-1 text-[7px] text-[#FFD600]/60 font-mono">🍋 TRUTH</div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* VERIFICATION BADGE (Truth Preserved Message) */}
          <AnimatePresence>
            {isMerged && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                transition={{ delay: 0.6 }}
                className="absolute -bottom-20 flex flex-col items-center pointer-events-none"
              >
                <div className="flex items-center gap-2 bg-[#FFD600]/10 border border-[#FFD600] px-3 py-1 rounded-full">
                  <ShieldCheck className="w-3 h-3 text-[#FFD600]" />
                  <span className="font-mono text-[8px] text-[#FFD600] tracking-[0.15em] uppercase">
                    Verified
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* State Badge (Hide completely during merged state) */}
          <AnimatePresence>
            {!isMerged && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute -bottom-16 px-4 py-1.5 bg-[#111] border border-[#333] rounded-full whitespace-nowrap"
              >
                <span className="font-mono text-[8px] tracking-[0.2em] text-[#888] uppercase">
                  STATE: MORPHOLOGICAL FLOW
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Tethers */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <Tether angle={0} color="yellow" isMerged={isMerged} />
          <Tether angle={120} color="green" isMerged={isMerged} />
          <Tether angle={240} color="white" isMerged={isMerged} />
        </div>

        {/* Morphology Nodes (They will implode inwards) */}
        <motion.div
          className="absolute inset-0 z-30"
          animate={{
            rotate: isMerged ? 0 : 360,
          }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <MorphologyNode
            angle={0}
            emoji="💧"
            label="Dimensionality"
            sublabel="Child Canon"
            examples={['Juice', 'Powder']}
            color="#FFD600"
            tier="child"
            isMerged={isMerged}
          />
          <MorphologyNode
            angle={120}
            emoji="📦"
            label="Granularity"
            sublabel="Cell Canon"
            examples={['KGM', 'PCS']}
            color="#28E7A2"
            tier="cell"
            isMerged={isMerged}
          />
          <MorphologyNode
            angle={240}
            emoji="🧬"
            label="Forensic Trace"
            sublabel="Golden Thread"
            examples={['DNA', 'Origin']}
            color="#FFFFFF"
            tier="trace"
            isMerged={isMerged}
          />
        </motion.div>
      </div>

      {/* Storytelling Legend at Bottom */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <div className="flex items-center gap-4 px-6 py-3 bg-[#0A0A0A]/90 backdrop-blur border border-[#333] rounded-full shadow-2xl">
          {/* Animated Icons based on state */}
          <div className="flex items-center gap-3">
            <motion.span animate={{ opacity: isMerged ? 0.3 : 1 }}>💧</motion.span>
            <motion.span animate={{ opacity: isMerged ? 0.3 : 1 }}>📦</motion.span>
            <motion.span animate={{ opacity: isMerged ? 0.3 : 1 }}>🧬</motion.span>
          </div>

          <ArrowRight className="w-4 h-4 text-[#444]" />

          {/* The Result */}
          <motion.div className="flex items-center gap-2" animate={{ scale: isMerged ? 1.1 : 1 }}>
            <span className="text-xl">🍋</span>
            <span
              className={`font-mono text-[10px] tracking-wider transition-colors duration-500 ${isMerged ? 'text-[#FFD600]' : 'text-white'}`}
            >
              {isMerged ? 'ALWAYS LEMON' : 'STILL LEMON'}
            </span>
          </motion.div>
        </div>

        {/* Progress Bar for the cycle */}
        <div className="w-32 h-1 bg-[#222] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#FFD600]"
            animate={{ width: isMerged ? ['0%', '100%'] : ['0%', '100%'] }}
            transition={{ duration: 6, ease: 'linear', repeat: Infinity }}
          />
        </div>
      </div>
    </div>
  );
};
