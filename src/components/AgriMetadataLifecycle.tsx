import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  ShieldCheck,
  Flower2,
  Scan,
  Zap,
  Database,
  Pause,
  Play,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ---------------------------------------------------------------------
// LIFECYCLE STAGES
// ---------------------------------------------------------------------
const STAGES = [
  {
    id: "genesis",
    label: "GENESIS BLOCK",
    sub: "Genetic Initialization",
    rootDepth: 0.15,
    plantHeight: 0.15,
    color: "#6366f1",
    scanData: "HASH: 0x9F...A2",
    message: "Injecting immutable DNA...",
    rootNodes: [],
  },
  {
    id: "sprout",
    label: "GERMINATION",
    sub: "Root Structure Established",
    rootDepth: 0.3,
    plantHeight: 0.35,
    color: "#22c55e",
    scanData: "STATUS: VIABLE",
    message: "Surface break detected.",
    rootNodes: ["ORIGIN_HASH"],
  },
  {
    id: "growth",
    label: "VEGETATION",
    sub: "Leaf Development",
    rootDepth: 0.55,
    plantHeight: 0.55,
    color: "#34d399",
    scanData: "INPUT: PHOTOSYNTHESIS",
    message: "Absorbing environmental metadata.",
    rootNodes: ["ORIGIN_HASH", "SUPPLY_CHAIN"],
  },
  {
    id: "bloom",
    label: "POLLINATION",
    sub: "Flowering Phase",
    rootDepth: 0.8,
    plantHeight: 0.7,
    color: "#ff6ec7",
    scanData: "STATE: BLOOM",
    message: "Structural integrity peak.",
    rootNodes: ["ORIGIN_HASH", "SUPPLY_CHAIN", "SENSOR_IOT"],
  },
  {
    id: "fruit",
    label: "IMMUTABLE TRUTH",
    sub: "The Golden Canon",
    rootDepth: 1,
    plantHeight: 0.8,
    color: "#ffd700",
    scanData: "VERIFIED: TRUE",
    message: "Form is variable. Truth is constant.",
    rootNodes: [
      "ORIGIN_HASH",
      "SUPPLY_CHAIN",
      "SENSOR_IOT",
      "BLOCKCHAIN_LOG",
      "AUDIT_TRAIL",
      "COMPLIANCE",
    ],
  },
];

// Palette for root / beam colours
const MINERAL_COLORS = [
  "#ef4444",
  "#f97316",
  "#fbbf24",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
];

// ---------------------------------------------------------------------
// ROOT GEOMETRY (soft umbrella shapes)
// ---------------------------------------------------------------------
const useRootPaths = () =>
  useMemo(
    () => [
      {
        // left-upper
        tipX: 70,
        tipY: 130,
        label: "ORIGIN_HASH",
        color: MINERAL_COLORS[0],
      },
      {
        tipX: 320,
        tipY: 150,
        label: "SUPPLY_CHAIN",
        color: MINERAL_COLORS[2],
      },
      {
        tipX: 50,
        tipY: 210,
        label: "SENSOR_IOT",
        color: MINERAL_COLORS[3],
      },
      {
        tipX: 340,
        tipY: 230,
        label: "BLOCKCHAIN_LOG",
        color: MINERAL_COLORS[4],
      },
      {
        tipX: 40,
        tipY: 290,
        label: "AUDIT_TRAIL",
        color: MINERAL_COLORS[1],
      },
      {
        tipX: 360,
        tipY: 305,
        label: "COMPLIANCE",
        color: MINERAL_COLORS[5],
      },
    ],
    []
  );

// ---------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------
export const AgriMetadataLifecycle = () => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showProvenance, setShowProvenance] = useState(false);
  const [hoveredRoot, setHoveredRoot] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionLabel, setTransitionLabel] = useState("");

  const current = STAGES[index];
  const isBlooming = index === 3;
  const isFruiting = index === 4;

  const rootPaths = useRootPaths();

  // Transition effect trigger
  const triggerTransition = (nextIndex: number) => {
    setIsTransitioning(true);
    setTransitionLabel(STAGES[nextIndex].label);
    setTimeout(() => {
      setIndex(nextIndex);
      setTimeout(() => setIsTransitioning(false), 800);
    }, 400);
  };

  // Auto-advance heartbeat with transitions
  useEffect(() => {
    if (paused || isTransitioning) return;
    const timer = setInterval(
      () => {
        const nextIndex = (index + 1) % STAGES.length;
        triggerTransition(nextIndex);
      },
      5000
    );
    return () => clearInterval(timer);
  }, [paused, isTransitioning, index]);

  // Keyboard navigation with transitions
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isTransitioning) return;
      if (e.key === "ArrowLeft") {
        const nextIndex = (index - 1 + STAGES.length) % STAGES.length;
        triggerTransition(nextIndex);
      }
      if (e.key === "ArrowRight") {
        const nextIndex = (index + 1) % STAGES.length;
        triggerTransition(nextIndex);
      }
      if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, isTransitioning]);

  // How many roots are "active" at this stage
  const activeRootCount = Math.min(
    current.rootNodes.length,
    rootPaths.length
  );

  // Special bloom→fruit transformation detection
  const isBloomToFruitTransition = isTransitioning && transitionLabel === STAGES[4].label;

  return (
    <div className="relative w-full max-w-6xl mx-auto h-[720px] bg-[#030305] rounded-xl overflow-hidden border border-white/5 shadow-2xl select-none">
      {/* Atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(3,3,5,0.65)_52%,#030305_100%)]" />
      </div>

      {/* ✨ CRYSTALLIZATION FLASH - Special effect for bloom→fruit */}
      <AnimatePresence>
        {isBloomToFruitTransition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, times: [0, 0.5, 1] }}
            className="absolute inset-0 bg-gradient-radial from-amber-400/30 via-yellow-500/10 to-transparent z-[90] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle at center, rgba(251, 191, 36, 0.3) 0%, rgba(234, 179, 8, 0.1) 40%, transparent 70%)",
            }}
          />
        )}
      </AnimatePresence>

      <div className="relative w-full h-full flex flex-col">
        {/* SKY – PLANT / FRUIT */}
        <div className="flex-1 relative border-b border-white/10 bg-gradient-to-b from-[#020617] via-transparent to-transparent overflow-hidden">
          {/* Tag - MOVED TO TOP-LEFT to avoid HUD overlap */}
          <div className="absolute top-6 left-6 flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-[0.2em]">
                Live Morphology
              </span>
            </div>
          </div>

          {/* Plant SVG */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[320px] h-[330px] flex items-end justify-center z-[100]">
            <svg
              width="320"
              height="330"
              viewBox="0 0 320 330"
              className="overflow-visible"
            >
              {/* Taller, strong stem - connects to flower AND extends to soil line */}
              <motion.path
                d="M160,330 C160,280 160,180 160,120"
                fill="none"
                stroke={current.color}
                strokeWidth={isFruiting ? 7 : 5}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: current.plantHeight }}
                transition={{ duration: 1.8, ease: "easeInOut" }}
                style={{
                  filter: `drop-shadow(0 0 10px ${current.color})`,
                }}
              />

              {/* 🌱 STEM GROWTH NODES - Show segmentation (4 nodes) */}
              {[
                { y: 310, delay: 0.3 },
                { y: 270, delay: 0.6 },
                { y: 230, delay: 0.9 },
                { y: 190, delay: 1.2 },
              ].map((node, i) => (
                <motion.g key={`stem-node-${i}`}>
                  {/* Node ring */}
                  <motion.circle
                    cx="160"
                    cy={node.y}
                    r="3"
                    fill="none"
                    stroke={current.color}
                    strokeWidth="1"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: current.plantHeight > 0.2 + i * 0.15 ? 1 : 0,
                      opacity: current.plantHeight > 0.2 + i * 0.15 ? 0.6 : 0,
                    }}
                    transition={{ duration: 0.4, delay: node.delay }}
                    style={{ filter: `drop-shadow(0 0 4px ${current.color})` }}
                  />
                  {/* Inner node core */}
                  <motion.circle
                    cx="160"
                    cy={node.y}
                    r="1.5"
                    fill={current.color}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: current.plantHeight > 0.2 + i * 0.15 ? 1 : 0,
                      opacity: current.plantHeight > 0.2 + i * 0.15 ? 0.8 : 0,
                    }}
                    transition={{ duration: 0.3, delay: node.delay + 0.1 }}
                  />
                </motion.g>
              ))}

              {/* 📊 DATA PACKETS FLOWING UP STEM (4 packets) */}
              {current.plantHeight > 0.3 &&
                [
                  { delay: 0, duration: 3.5, color: current.color },
                  { delay: 0.8, duration: 3.8, color: current.color },
                  { delay: 1.6, duration: 3.6, color: current.color },
                  { delay: 2.4, duration: 3.7, color: current.color },
                ].map((packet, i) => (
                  <motion.circle
                    key={`data-packet-${i}`}
                    r="2.5"
                    fill={packet.color}
                    initial={{ cy: 330, opacity: 0 }}
                    animate={{
                      cy: [330, 310, 270, 230, 190, 150, 120],
                      opacity: [0, 0.7, 0.9, 0.9, 0.9, 0.7, 0],
                      scale: [0.8, 1, 1, 1, 1, 1, 1.2],
                    }}
                    transition={{
                      duration: packet.duration,
                      delay: packet.delay,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{
                      cx: 160,
                      filter: `drop-shadow(0 0 6px ${packet.color})`,
                    }}
                  />
                ))}

              {/* LEFT BRANCH with joint node */}
              <motion.path
                d="M160,250 C140,245 125,242 110,246 Q100,250 96,260"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: current.plantHeight > 0.35 ? 1 : 0 }}
                transition={{ duration: 1.4, ease: "easeOut", delay: 0.4 }}
              />
              {/* Branch junction node */}
              <motion.circle
                cx="160"
                cy="250"
                r="3"
                fill="#22c55e"
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: current.plantHeight > 0.35 ? 1 : 0,
                  opacity: current.plantHeight > 0.35 ? 0.6 : 0,
                }}
                transition={{ duration: 0.4, delay: 0.8 }}
                style={{ filter: "drop-shadow(0 0 6px #22c55e)" }}
              />
              {/* SUBTLE glowing sensor node at branch tip - LEFT */}
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: current.plantHeight > 0.35 ? 1 : 0,
                  opacity: current.plantHeight > 0.35 ? 1 : 0,
                }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                {/* Outer glow ring - MUCH THINNER */}
                <motion.circle
                  cx="96"
                  cy="260"
                  r="6"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="0.5"
                  strokeOpacity="0.08"
                  animate={{
                    r: [5, 7, 5],
                    strokeOpacity: [0.08, 0.04, 0.08],
                  }}
                  transition={{
                    duration: 4.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                {/* Core sensor node - REDUCED PULSE */}
                <motion.circle
                  cx="96"
                  cy="260"
                  r="2.2"
                  fill="#22c55e"
                  opacity="0.6"
                  animate={{
                    r: [2, 2.4, 2],
                  }}
                  transition={{
                    duration: 4.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ filter: "drop-shadow(0 0 4px #22c55e)" }}
                />
                {/* Inner highlight - SMALLER */}
                <circle
                  cx="95"
                  cy="259"
                  r="1"
                  fill="#86efac"
                  opacity="0.5"
                />
              </motion.g>

              {/* EXPANDED PARTICLE EMISSION FROM LEFT NODE - 12 PARTICLES */}
              {current.plantHeight > 0.35 && [
                { angle: -30, delay: 0, duration: 5.5, distance: 90 },
                { angle: -50, delay: 0.4, duration: 6, distance: 85 },
                { angle: -70, delay: 0.8, duration: 5.8, distance: 95 },
                { angle: -15, delay: 1.2, duration: 6.2, distance: 80 },
                { angle: -45, delay: 1.6, duration: 5.6, distance: 100 },
                { angle: -60, delay: 2.0, duration: 6.4, distance: 88 },
                { angle: -35, delay: 2.4, duration: 5.9, distance: 92 },
                { angle: -55, delay: 2.8, duration: 6.1, distance: 86 },
                { angle: -25, delay: 3.2, duration: 5.7, distance: 94 },
                { angle: -65, delay: 3.6, duration: 6.3, distance: 82 },
                { angle: -40, delay: 4.0, duration: 6.0, distance: 98 },
                { angle: -50, delay: 4.4, duration: 5.8, distance: 84 },
              ].map((p, i) => {
                const radians = (p.angle * Math.PI) / 180;
                const dx = Math.cos(radians) * p.distance;
                const dy = Math.sin(radians) * p.distance;
                return (
                  <motion.circle
                    key={`left-emit-${i}`}
                    r="1"
                    fill="#22c55e"
                    initial={{ cx: 96, cy: 260, opacity: 0 }}
                    animate={{
                      cx: [96, 96 + dx],
                      cy: [260, 260 + dy],
                      opacity: [0, 0.7, 0.5, 0],
                    }}
                    transition={{
                      duration: p.duration,
                      delay: p.delay,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                    style={{ filter: "blur(0.4px)" }}
                  />
                );
              })}

              {/* RIGHT BRANCH with joint node */}
              <motion.path
                d="M160,230 C180,225 195,222 210,226 Q220,230 224,240"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: current.plantHeight > 0.35 ? 1 : 0 }}
                transition={{ duration: 1.4, ease: "easeOut", delay: 0.5 }}
              />
              {/* Branch junction node */}
              <motion.circle
                cx="160"
                cy="230"
                r="3"
                fill="#22c55e"
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: current.plantHeight > 0.35 ? 1 : 0,
                  opacity: current.plantHeight > 0.35 ? 0.6 : 0,
                }}
                transition={{ duration: 0.4, delay: 0.9 }}
                style={{ filter: "drop-shadow(0 0 6px #22c55e)" }}
              />
              {/* SUBTLE glowing sensor node at branch tip - RIGHT */}
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: current.plantHeight > 0.35 ? 1 : 0,
                  opacity: current.plantHeight > 0.35 ? 1 : 0,
                }}
                transition={{ duration: 0.4, delay: 0.7 }}
              >
                {/* Outer glow ring - MUCH THINNER */}
                <motion.circle
                  cx="224"
                  cy="240"
                  r="6"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="0.5"
                  strokeOpacity="0.15"
                  animate={{
                    r: [5, 8, 5],
                    strokeOpacity: [0.15, 0.08, 0.15],
                  }}
                  transition={{
                    duration: 3.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.4,
                  }}
                />
                {/* Core sensor node - 50% SMALLER */}
                <motion.circle
                  cx="224"
                  cy="240"
                  r="2.2"
                  fill="#22c55e"
                  opacity="0.7"
                  animate={{
                    r: [2, 2.8, 2],
                  }}
                  transition={{
                    duration: 3.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.4,
                  }}
                  style={{ filter: "drop-shadow(0 0 4px #22c55e)" }}
                />
                {/* Inner highlight - SMALLER */}
                <circle
                  cx="222.5"
                  cy="238.5"
                  r="1"
                  fill="#86efac"
                  opacity="0.5"
                />
              </motion.g>

              {/* 🎻 GOLDEN ORCHESTRA - 2 NEW UPPER BRANCHES (ONLY DURING FRUITING) */}
              {isFruiting && (
                <>
                  {/* UPPER LEFT BRANCH - Gold accent */}
                  <motion.path
                    d="M160,200 C135,195 120,190 105,195 Q95,200 90,210"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    style={{ filter: "drop-shadow(0 0 10px #fbbf24)" }}
                  />
                  {/* Upper branch junction node */}
                  <motion.circle
                    cx="160"
                    cy="200"
                    r="4"
                    fill="#fbbf24"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.8 }}
                    transition={{ duration: 0.5 }}
                    style={{ filter: "drop-shadow(0 0 12px #fbbf24)" }}
                  />
                  {/* GOLDEN glowing sensor node - UPPER LEFT */}
                  <motion.g
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    {/* Outer glow ring - GOLDEN */}
                    <motion.circle
                      cx="90"
                      cy="210"
                      r="8"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="1"
                      strokeOpacity="0.4"
                      animate={{
                        r: [6, 12, 6],
                        strokeOpacity: [0.4, 0.2, 0.4],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    {/* Core sensor node - GOLDEN */}
                    <motion.circle
                      cx="90"
                      cy="210"
                      r="3.5"
                      fill="#fbbf24"
                      opacity="0.9"
                      animate={{
                        r: [3, 4.5, 3],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{ filter: "drop-shadow(0 0 14px #fbbf24)" }}
                    />
                    {/* Inner highlight - GOLDEN */}
                    <circle
                      cx="88.5"
                      cy="208.5"
                      r="1.5"
                      fill="#fef3c7"
                      opacity="0.8"
                    />
                  </motion.g>

                  {/* UPPER RIGHT BRANCH - Gold accent */}
                  <motion.path
                    d="M160,185 C185,180 200,175 215,180 Q225,185 230,195"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
                    style={{ filter: "drop-shadow(0 0 10px #fbbf24)" }}
                  />
                  {/* Upper branch junction node */}
                  <motion.circle
                    cx="160"
                    cy="185"
                    r="4"
                    fill="#fbbf24"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.8 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    style={{ filter: "drop-shadow(0 0 12px #fbbf24)" }}
                  />
                  {/* GOLDEN glowing sensor node - UPPER RIGHT */}
                  <motion.g
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    {/* Outer glow ring - GOLDEN */}
                    <motion.circle
                      cx="230"
                      cy="195"
                      r="8"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="1"
                      strokeOpacity="0.4"
                      animate={{
                        r: [6, 12, 6],
                        strokeOpacity: [0.4, 0.2, 0.4],
                      }}
                      transition={{
                        duration: 2.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.3,
                      }}
                    />
                    {/* Core sensor node - GOLDEN */}
                    <motion.circle
                      cx="230"
                      cy="195"
                      r="3.5"
                      fill="#fbbf24"
                      opacity="0.9"
                      animate={{
                        r: [3, 4.5, 3],
                      }}
                      transition={{
                        duration: 2.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.3,
                      }}
                      style={{ filter: "drop-shadow(0 0 14px #fbbf24)" }}
                    />
                    {/* Inner highlight - GOLDEN */}
                    <circle
                      cx="228.5"
                      cy="193.5"
                      r="1.5"
                      fill="#fef3c7"
                      opacity="0.8"
                    />
                  </motion.g>

                  {/* 🎻 WAVE-BASED GOLDEN PARTICLE EMISSION - UPPER LEFT (8 PARTICLES, 3 WAVES) */}
                  {/* WAVE 1: CRESCENDO (Particles 0-2) */}
                  {[0, 1, 2].map((i) => {
                    const baseAngle = -40;
                    const angleVariance = (i - 1) * 20 + (Math.random() * 6 - 3);
                    const angle = baseAngle + angleVariance;
                    const distance = 75 + (Math.random() * 15);
                    const radians = (angle * Math.PI) / 180;
                    const dx = Math.cos(radians) * distance;
                    const dy = Math.sin(radians) * distance;
                    return (
                      <motion.circle
                        key={`upper-left-wave1-${i}`}
                        r="1"
                        fill="#fbbf24"
                        initial={{ cx: 90, cy: 210, opacity: 0 }}
                        animate={{
                          cx: [90, 90 + dx],
                          cy: [210, 210 + dy],
                          opacity: [0, 0.5, 0.7, 0],
                        }}
                        transition={{
                          duration: 5 + i * 0.3,
                          delay: i * 0.3,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                        style={{ filter: "blur(0.3px) drop-shadow(0 0 2px #fbbf24)" }}
                      />
                    );
                  })}

                  {/* WAVE 2: FORTISSIMO (Particles 3-5) */}
                  {[3, 4, 5].map((i) => {
                    const baseAngle = -50;
                    const angleVariance = ((i - 4) * 18) + (Math.random() * 8 - 4);
                    const angle = baseAngle + angleVariance;
                    const distance = 85 + (Math.random() * 20);
                    const radians = (angle * Math.PI) / 180;
                    const dx = Math.cos(radians) * distance;
                    const dy = Math.sin(radians) * distance;
                    return (
                      <motion.circle
                        key={`upper-left-wave2-${i}`}
                        r="1.2"
                        fill="#fbbf24"
                        initial={{ cx: 90, cy: 210, opacity: 0 }}
                        animate={{
                          cx: [90, 90 + dx],
                          cy: [210, 210 + dy],
                          opacity: [0, 0.7, 0.9, 0],
                        }}
                        transition={{
                          duration: 5.5 + (i % 2) * 0.4,
                          delay: 1.2 + (i - 3) * 0.25,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                        style={{ filter: "blur(0.4px) drop-shadow(0 0 3px #fbbf24)" }}
                      />
                    );
                  })}

                  {/* WAVE 3: DECRESCENDO (Particles 6-7) */}
                  {[6, 7].map((i) => {
                    const baseAngle = -30;
                    const angleVariance = ((i - 6.5) * 15) + (Math.random() * 5 - 2.5);
                    const angle = baseAngle + angleVariance;
                    const distance = 70 + (Math.random() * 12);
                    const radians = (angle * Math.PI) / 180;
                    const dx = Math.cos(radians) * distance;
                    const dy = Math.sin(radians) * distance;
                    return (
                      <motion.circle
                        key={`upper-left-wave3-${i}`}
                        r="0.9"
                        fill="#fbbf24"
                        initial={{ cx: 90, cy: 210, opacity: 0 }}
                        animate={{
                          cx: [90, 90 + dx],
                          cy: [210, 210 + dy],
                          opacity: [0, 0.4, 0.5, 0],
                        }}
                        transition={{
                          duration: 4.8 + (i % 2) * 0.3,
                          delay: 2.5 + (i - 6) * 0.4,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                        style={{ filter: "blur(0.3px) drop-shadow(0 0 2px #fbbf24)" }}
                      />
                    );
                  })}

                  {/* 🎻 WAVE-BASED GOLDEN PARTICLE EMISSION - UPPER RIGHT (8 PARTICLES, 3 WAVES) */}
                  {/* WAVE 1: CRESCENDO (Particles 0-2) */}
                  {[0, 1, 2].map((i) => {
                    const baseAngle = -140;
                    const angleVariance = (i - 1) * 20 + (Math.random() * 6 - 3);
                    const angle = baseAngle + angleVariance;
                    const distance = 75 + (Math.random() * 15);
                    const radians = (angle * Math.PI) / 180;
                    const dx = Math.cos(radians) * distance;
                    const dy = Math.sin(radians) * distance;
                    return (
                      <motion.circle
                        key={`upper-right-wave1-${i}`}
                        r="1"
                        fill="#fbbf24"
                        initial={{ cx: 230, cy: 195, opacity: 0 }}
                        animate={{
                          cx: [230, 230 + dx],
                          cy: [195, 195 + dy],
                          opacity: [0, 0.5, 0.7, 0],
                        }}
                        transition={{
                          duration: 5 + i * 0.3,
                          delay: 0.2 + i * 0.3,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                        style={{ filter: "blur(0.3px) drop-shadow(0 0 2px #fbbf24)" }}
                      />
                    );
                  })}

                  {/* WAVE 2: FORTISSIMO (Particles 3-5) */}
                  {[3, 4, 5].map((i) => {
                    const baseAngle = -150;
                    const angleVariance = ((i - 4) * 18) + (Math.random() * 8 - 4);
                    const angle = baseAngle + angleVariance;
                    const distance = 85 + (Math.random() * 20);
                    const radians = (angle * Math.PI) / 180;
                    const dx = Math.cos(radians) * distance;
                    const dy = Math.sin(radians) * distance;
                    return (
                      <motion.circle
                        key={`upper-right-wave2-${i}`}
                        r="1.2"
                        fill="#fbbf24"
                        initial={{ cx: 230, cy: 195, opacity: 0 }}
                        animate={{
                          cx: [230, 230 + dx],
                          cy: [195, 195 + dy],
                          opacity: [0, 0.7, 0.9, 0],
                        }}
                        transition={{
                          duration: 5.5 + (i % 2) * 0.4,
                          delay: 1.4 + (i - 3) * 0.25,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                        style={{ filter: "blur(0.4px) drop-shadow(0 0 3px #fbbf24)" }}
                      />
                    );
                  })}

                  {/* WAVE 3: DECRESCENDO (Particles 6-7) */}
                  {[6, 7].map((i) => {
                    const baseAngle = -130;
                    const angleVariance = ((i - 6.5) * 15) + (Math.random() * 5 - 2.5);
                    const angle = baseAngle + angleVariance;
                    const distance = 70 + (Math.random() * 12);
                    const radians = (angle * Math.PI) / 180;
                    const dx = Math.cos(radians) * distance;
                    const dy = Math.sin(radians) * distance;
                    return (
                      <motion.circle
                        key={`upper-right-wave3-${i}`}
                        r="0.9"
                        fill="#fbbf24"
                        initial={{ cx: 230, cy: 195, opacity: 0 }}
                        animate={{
                          cx: [230, 230 + dx],
                          cy: [195, 195 + dy],
                          opacity: [0, 0.4, 0.5, 0],
                        }}
                        transition={{
                          duration: 4.8 + (i % 2) * 0.3,
                          delay: 2.7 + (i - 6) * 0.4,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                        style={{ filter: "blur(0.3px) drop-shadow(0 0 2px #fbbf24)" }}
                      />
                    );
                  })}
                </>
              )}

              {/* ATMOSPHERIC FLOATING PARTICLES */}
              {[
                { x: 80, delay: 0, duration: 9 },
                { x: 140, delay: 2, duration: 11 },
                { x: 200, delay: 4, duration: 10 },
                { x: 240, delay: 1.5, duration: 9.5 },
              ].map((particle, i) => (
                <motion.circle
                  key={i}
                  r="1.5"
                  fill="#22c55e"
                  opacity="0.35"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: current.plantHeight > 0.35 ? [0, 0.35, 0.4, 0.35, 0] : 0,
                    y: current.plantHeight > 0.35 ? [280, 260, 220, 180, 140] : 280,
                    x: [
                      particle.x,
                      particle.x + (i % 2 === 0 ? -8 : 8),
                      particle.x - (i % 2 === 0 ? -5 : 5),
                      particle.x + (i % 2 === 0 ? -3 : 3),
                      particle.x,
                    ],
                  }}
                  transition={{
                    duration: particle.duration,
                    delay: particle.delay,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ filter: "blur(0.5px)" }}
                />
              ))}

              {/* CLEAN, ELEGANT FLOWER - LESS IS MORE */}
              <motion.g
                key="flower"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{
                  scale: current.plantHeight > 0.5
                    ? (isFruiting ? [1.6, 1.7, 1.6] : [1, 1.05, 1])
                    : 0.8,
                  opacity: current.plantHeight > 0.5 ? 1 : 0,
                  y: 310 - (247 * current.plantHeight),
                }}
                transition={{
                  scale: {
                    duration: isFruiting ? 1.5 : 2.4,
                    repeat: Infinity,
                    repeatType: "mirror",
                  },
                  opacity: { duration: 0.8, delay: 2.5 },
                  y: { duration: 1.8, ease: "easeOut" },
                }}
                style={{ 
                  transformOrigin: "160px 0px",
                  filter: isFruiting 
                    ? `drop-shadow(0 0 30px #fbbf24)` 
                    : `drop-shadow(0 0 15px #f472b6)`,
                }}
              >
                {/* Enhanced petals with subtle veins */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                  <g key={angle} transform={`rotate(${angle} 160 0) translate(0 -20)`}>
                    <ellipse
                      cx="160"
                      cy="0"
                      rx="10"
                      ry="24"
                      fill={isFruiting ? "url(#petalGold)" : "#f472b6"}
                      opacity="0.95"
                    />
                    {/* Subtle center vein */}
                    <line
                      x1="160"
                      y1="-4"
                      x2="160"
                      y2="-18"
                      stroke={isFruiting ? "#f59e0b" : "#ec4899"}
                      strokeWidth="0.5"
                      opacity="0.4"
                    />
                  </g>
                ))}
                
                {/* 🌸 ENHANCED CENTER - Concentric data rings + pistils */}
                <circle
                  cx="160"
                  cy="0"
                  r="14"
                  fill={isFruiting ? "url(#centerGold)" : "#fda4af"}
                />
                
                {/* Concentric data layer rings */}
                {[10, 7, 4].map((r, i) => (
                  <motion.circle
                    key={`ring-${i}`}
                    cx="160"
                    cy="0"
                    r={r}
                    fill="none"
                    stroke={isFruiting ? "#fef3c7" : "#fecdd3"}
                    strokeWidth="0.5"
                    opacity="0.4"
                    animate={{
                      opacity: [0.3, 0.5, 0.3],
                      r: [r - 0.5, r + 0.5, r - 0.5],
                    }}
                    transition={{
                      duration: 3 + i * 0.5,
                      delay: i * 0.3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                ))}
                
                {/* Micro-pistils (8 tiny circles arranged in ring) */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                  const radians = (angle * Math.PI) / 180;
                  const cx = 160 + Math.cos(radians) * 5;
                  const cy = Math.sin(radians) * 5;
                  return (
                    <motion.circle
                      key={`pistil-${i}`}
                      cx={cx}
                      cy={cy}
                      r="1.2"
                      fill={isFruiting ? "#fde047" : "#fda4af"}
                      animate={{
                        r: [1, 1.5, 1],
                      }}
                      transition={{
                        duration: 2,
                        delay: i * 0.15,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{
                        filter: `drop-shadow(0 0 2px ${isFruiting ? "#fbbf24" : "#f472b6"})`,
                      }}
                    />
                  );
                })}
              </motion.g>

              <defs>
                {/* Simple gold petal - FANTASTIC! */}
                <radialGradient id="petalGold">
                  <stop offset="0%" stopColor="#fde047" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </radialGradient>
                
                {/* Simple gold center - FANTASTIC! */}
                <radialGradient id="centerGold">
                  <stop offset="0%" stopColor="#fef3c7" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </radialGradient>

                <radialGradient id="goldAura" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="ballGradient" cx="0.3" cy="0.25" r="0.9">
                  <stop offset="0%" stopColor="#fef3c7" />
                  <stop offset="35%" stopColor="#fde047" />
                  <stop offset="70%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#b45309" />
                </radialGradient>

                {/* Leaf gradient */}
                <linearGradient id="leafGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#15803d" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* HUD narrative card - MOVED TO TOP-RIGHT */}
          <motion.div
            className="absolute right-6 top-6 w-[240px] bg-black/40 backdrop-blur-xl border border-white/10 rounded-lg p-3 shadow-2xl z-50"
          >
            <div className="flex justify-between items-start mb-1.5">
              <div>
                <motion.div
                  key={current.label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-mono font-bold text-white tracking-wide"
                >
                  {current.label}
                </motion.div>
                <div className="text-[9px] font-mono font-semibold text-gray-300 uppercase tracking-[0.22em] mt-0.5">
                  {current.sub}
                </div>
              </div>
              <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                {isFruiting ? (
                  <ShieldCheck className="w-3 h-3 text-yellow-500" />
                ) : isBlooming ? (
                  <Flower2 className="w-3 h-3 text-pink-400" />
                ) : (
                  <Scan className="w-3 h-3 text-gray-400" />
                )}
              </div>
            </div>

            {/* progress bar */}
            <div className="w-full h-0.5 bg-white/10 rounded-full mb-1.5 overflow-hidden">
              <motion.div
                className="h-full"
                style={{ backgroundColor: current.color }}
                animate={{ width: `${((index + 1) / STAGES.length) * 100}%` }}
                transition={{ duration: 0.9 }}
              />
            </div>

            {/* system log */}
            <div className="font-mono text-[9px] font-semibold text-gray-300 leading-relaxed border-l-2 border-white/10 pl-2 mb-1.5">
              <span className="text-gray-500">{">"}</span> {current.message}
            </div>

            {/* controls */}
            <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    if (!isTransitioning) {
                      const nextIndex = (index - 1 + STAGES.length) % STAGES.length;
                      triggerTransition(nextIndex);
                    }
                  }}
                  disabled={isTransitioning}
                  className="p-1 rounded bg-white/5 hover:bg-emerald-500/10 border border-emerald-500/50 transition-colors disabled:opacity-30"
                >
                  <ChevronLeft className="w-2.5 h-2.5 text-emerald-400" />
                </button>
                <button
                  onClick={() => setPaused((p) => !p)}
                  className="p-1 rounded bg-white/5 hover:bg-emerald-500/10 border border-emerald-500/50 transition-colors"
                >
                  {paused ? (
                    <Play className="w-2.5 h-2.5 text-emerald-400" />
                  ) : (
                    <Pause className="w-2.5 h-2.5 text-emerald-400" />
                  )}
                </button>
                <button
                  onClick={() => {
                    if (!isTransitioning) {
                      const nextIndex = (index + 1) % STAGES.length;
                      triggerTransition(nextIndex);
                    }
                  }}
                  disabled={isTransitioning}
                  className="p-1 rounded bg-white/5 hover:bg-emerald-500/10 border border-emerald-500/50 transition-colors disabled:opacity-30"
                >
                  <ChevronRight className="w-2.5 h-2.5 text-emerald-400" />
                </button>
              </div>
              <span className="text-[7px] font-mono text-gray-600">
                SPACE / ← →
              </span>
            </div>
          </motion.div>
        </div>

        {/* SOIL LINE */}
        <motion.div className="h-11 bg-[#050505] border-y border-white/5 flex items-center justify-between px-8 relative z-20">
          <div className="flex items-center gap-4">
            <div className="h-[1px] w-12 bg-white/20" />
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.3em]">
              The Soil Line (Physical / Digital)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-yellow-500" />
            <span className="text-[9px] font-mono text-yellow-500">
              {current.scanData}
            </span>
          </div>
        </motion.div>

        {/* ROOTS – SOFT UMBRELLA LINES & BEAMS */}
        <div className="flex-1 relative bg-[#020203] overflow-hidden">
          {/* subtle noise */}
          <div
            className="absolute inset-0 opacity-5 mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' /%3E%3C/svg%3E\")",
            }}
          />

          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-full flex justify-center">
            <svg width="400" height="340" viewBox="0 0 400 340">
              {/* central vertical root (matches stem but below soil) */}
              <motion.path
                d="M200,0 C200,60 200,120 200,190"
                fill="none"
                stroke={current.color}
                strokeWidth={4}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: current.rootDepth }}
                transition={{ duration: 1.8, ease: "easeOut" }}
                style={{
                  filter: `drop-shadow(0 0 10px ${current.color})`,
                }}
              />

              {/* lateral roots + umbrella beams */}
              {rootPaths.slice(0, activeRootCount).map((root, i) => {
                const active = i < activeRootCount;
                const labelLeft = root.tipX < 200;

                return (
                  <g key={root.label}>
                    {/* soft curved root */}
                    <motion.path
                      d={`M200,190 Q ${(200 + root.tipX) / 2} ${
                        (190 + root.tipY) / 2 + 20
                      } ${root.tipX} ${root.tipY}`}
                      fill="none"
                      stroke={root.color}
                      strokeWidth={0.75}
                      strokeLinecap="round"
                      strokeOpacity={0.8}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: active ? 1 : 0 }}
                      transition={{
                        duration: 1.8,
                        delay: 0.2 + i * 0.25,
                        ease: "easeOut",
                      }}
                      style={{
                        filter: `drop-shadow(0 0 8px ${root.color})`,
                      }}
                    />

                    {/* glow layer */}
                    <motion.path
                      d={`M200,190 Q ${(200 + root.tipX) / 2} ${
                        (190 + root.tipY) / 2 + 20
                      } ${root.tipX} ${root.tipY}`}
                      fill="none"
                      stroke={root.color}
                      strokeWidth={2.25}
                      strokeLinecap="round"
                      strokeOpacity={0.25}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: active ? 1 : 0 }}
                      transition={{
                        duration: 1.8,
                        delay: 0.2 + i * 0.25,
                        ease: "easeOut",
                      }}
                      style={{ filter: "blur(6px)" }}
                    />

                    {/* upward beam (umbrella handle) */}
                    <motion.path
                      d={`M${root.tipX},${root.tipY} Q ${root.tipX} ${
                        root.tipY - 70
                      } 200,0`}
                      fill="none"
                      stroke={root.color}
                      strokeWidth={1.6}
                      strokeLinecap="round"
                      strokeOpacity={0.8}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: current.rootDepth }}
                      transition={{
                        duration: 2.2,
                        delay: 0.6 + i * 0.2,
                        ease: "easeOut",
                      }}
                      strokeDasharray="3 5"
                    />

                    {/* travelling particle up the beam */}
                    {active && (
                      <motion.circle
                        r="4"
                        fill={root.color}
                        style={{
                          filter: `drop-shadow(0 0 10px ${root.color})`,
                        }}
                      >
                        <animateMotion
                          dur={`${3 + i * 0.4}s`}
                          repeatCount="indefinite"
                          path={`M${root.tipX},${root.tipY} Q ${root.tipX} ${
                            root.tipY - 70
                          } 200,0`}
                        />
                      </motion.circle>
                    )}

                    {/* 💫 ROOT ABSORPTION RINGS - Show data intake */}
                    {active && (
                      <>
                        <motion.circle
                          cx={root.tipX}
                          cy={root.tipY}
                          r={8}
                          fill="none"
                          stroke={root.color}
                          strokeWidth={1}
                          strokeOpacity={0.3}
                          animate={{
                            r: [6, 16, 6],
                            strokeOpacity: [0.4, 0.1, 0.4],
                          }}
                          transition={{
                            duration: 3.5,
                            delay: i * 0.6,
                            repeat: Infinity,
                            ease: "easeOut",
                          }}
                        />
                        <motion.circle
                          cx={root.tipX}
                          cy={root.tipY}
                          r={8}
                          fill="none"
                          stroke={root.color}
                          strokeWidth={0.8}
                          strokeOpacity={0.25}
                          animate={{
                            r: [5, 14, 5],
                            strokeOpacity: [0.35, 0.08, 0.35],
                          }}
                          transition={{
                            duration: 3.5,
                            delay: i * 0.6 + 0.5,
                            repeat: Infinity,
                            ease: "easeOut",
                          }}
                        />
                      </>
                    )}

                    {/* root node */}
                    <motion.circle
                      cx={root.tipX}
                      cy={root.tipY}
                      r={hoveredRoot === i ? 6.5 : 5.5}
                      initial={{ scale: 0 }}
                      animate={{
                        scale: active ? (hoveredRoot === i ? 1.15 : 1) : 0.6,
                      }}
                      transition={{
                        duration: 0.4,
                        delay: 0.4 + i * 0.25,
                      }}
                      onMouseEnter={() => setHoveredRoot(i)}
                      onMouseLeave={() => setHoveredRoot(null)}
                      style={{
                        cursor: "pointer",
                        filter: `drop-shadow(0 0 14px ${root.color})`,
                      }}
                      fill={root.color}
                      fillOpacity={0.6}
                    />

                    {/* label */}
                    <motion.text
                      x={
                        labelLeft ? root.tipX - 78 : root.tipX + 14
                      }
                      y={root.tipY + 3}
                      fontSize="9"
                      fill={hoveredRoot === i ? root.color : "#888"}
                      fontFamily="monospace"
                      fontWeight={hoveredRoot === i ? "700" : "600"}
                      letterSpacing="0.4"
                      initial={{ opacity: 0, x: labelLeft ? -4 : 4 }}
                      animate={{
                        opacity: active ? 0.78 : 0.25,
                        x: 0,
                      }}
                      transition={{
                        duration: 0.4,
                        delay: 0.6 + i * 0.25,
                      }}
                    >
                      {root.label}
                    </motion.text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* root HUD – depth + legend */}
          <div className="absolute bottom-6 left-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-gray-600">
                <Database className="w-3 h-3" />
                <span className="text-[10px] font-mono uppercase tracking-[0.2em]">
                  Metadata Infrastructure
                </span>
              </div>
              <span className="text-[12px] font-mono text-gray-400">
                Depth: {Math.round(current.rootDepth * 100)}% · Nodes:{" "}
                {activeRootCount}/{rootPaths.length}
              </span>
            </div>
          </div>

          <div className="absolute top-6 right-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-[8px] font-mono text-gray-600 uppercase tracking-[0.2em] mb-1">
                Mineral Orchestra
              </span>
              {rootPaths.slice(0, activeRootCount).map((root, i) => (
                <div
                  key={root.label}
                  className="flex items-center gap-2 text-[8px] font-mono"
                >
                  <motion.div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: root.color,
                      boxShadow: `0 0 10px ${root.color}`,
                    }}
                    animate={{
                      boxShadow: [
                        `0 0 6px ${root.color}`,
                        `0 0 12px ${root.color}`,
                        `0 0 6px ${root.color}`,
                      ],
                    }}
                    transition={{ duration: 2.3, repeat: Infinity }}
                  />
                  <span
                    style={{
                      color: "#9ca3af",
                    }}
                  >
                    {root.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scanner beam */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] pointer-events-none z-20">
          <motion.div
            className="w-full h-[1px] bg-white/18"
            style={{ boxShadow: "0 0 14px rgba(255,255,255,0.5)" }}
            animate={paused ? {} : { y: [-150, 150, -150] }}
            transition={{ duration: 9, ease: "linear", repeat: Infinity }}
          />
        </div>

        {/* 🎬 STAGE TRANSITION NOTIFICATION */}
        <AnimatePresence>
          {isTransitioning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none"
            >
              <div className="bg-black/80 backdrop-blur-xl border border-white/20 rounded-lg px-6 py-3 shadow-2xl">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-emerald-400"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{ filter: "drop-shadow(0 0 8px #22c55e)" }}
                  />
                  <div>
                    <div className="text-[8px] font-mono text-gray-500 uppercase tracking-[0.2em]">
                      Transitioning to
                    </div>
                    <div className="text-xs font-mono font-bold text-white tracking-wide mt-0.5">
                      {transitionLabel}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Provenance overlay */}
      <AnimatePresence>
        {showProvenance && isFruiting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-xl z-40 flex items-center justify-center"
            onClick={() => setShowProvenance(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 18 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 18 }}
              className="bg-[#050505] border border-white/10 rounded-xl p-8 max-w-2xl w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-mono text-white tracking-wide">
                    GOLDEN FRUIT #A47F
                  </h3>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] mt-1">
                    Chain of Custody
                  </p>
                </div>
                <ShieldCheck className="w-6 h-6 text-yellow-500" />
              </div>

              <div className="space-y-3">
                {[
                  {
                    label: "Genesis Hash",
                    value: "0x9F2A...4E7C",
                    block: 0,
                    mineral: MINERAL_COLORS[0],
                  },
                  {
                    label: "Origin Hash Node",
                    value: "Sensor data verified",
                    block: 1,
                    mineral: MINERAL_COLORS[0],
                  },
                  {
                    label: "Supply Chain Node",
                    value: "Logistics confirmed",
                    block: 2,
                    mineral: MINERAL_COLORS[2],
                  },
                  {
                    label: "IoT Sensor Node",
                    value: "Quality threshold met",
                    block: 3,
                    mineral: MINERAL_COLORS[3],
                  },
                  {
                    label: "Blockchain Log Node",
                    value: "On-chain audit recorded",
                    block: 4,
                    mineral: MINERAL_COLORS[4],
                  },
                  {
                    label: "Audit Trail Node",
                    value: "Compliance verified",
                    block: 5,
                    mineral: MINERAL_COLORS[1],
                  },
                  {
                    label: "Flower State",
                    value: "Structural integrity peak",
                    block: 6,
                    mineral: "#f472b6",
                  },
                  {
                    label: "Fruit State",
                    value: "Immutable truth sealed",
                    block: 7,
                    mineral: "#fbbf24",
                  },
                ].map((row, i) => (
                  <motion.div
                    key={row.label}
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div
                      className="w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 flex-shrink-0"
                      style={{
                        backgroundColor: `${row.mineral}20`,
                        borderColor: `${row.mineral}80`,
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: row.mineral }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.14em]">
                        {row.label}
                      </div>
                      <div className="text-xs font-mono text-white mt-1">
                        {row.value}
                      </div>
                    </div>
                    <div className="text-[9px] font-mono text-gray-600">
                      Block {row.block}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 text-center">
                <p className="text-[10px] font-mono text-gray-500 italic">
                  Click outside to close · rainbow colors = mineral orchestra
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ---------------------------------------------------------------------
// CONCEPT BRIEFING: Botanical Morphology → Metadata Lifecycle Mapping
// ---------------------------------------------------------------------
export const MetadataLifecycleConcept = () => {
  return (
    <div className="relative max-w-6xl mx-auto px-6 mt-16 mb-20">
      {/* Forensic Analysis Terminal */}
      <div className="relative bg-black/60 backdrop-blur-sm border border-white/[0.08]">
        
        {/* Terminal Header Bar */}
        <div className="h-11 border-b border-white/[0.08] flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/40 border border-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40 border border-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40 border border-emerald-500/60" />
            </div>
            <span className="text-[12px] font-mono text-gray-500 uppercase tracking-[0.2em]">
              Morphological Analysis // Live Feed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-500/60" />
            <span className="text-[12px] font-mono text-emerald-500/60">ACTIVE</span>
          </div>
        </div>

        {/* Analysis Grid */}
        <div className="grid grid-cols-12 gap-px bg-white/[0.03]">
          
          {/* Left: Botanical Decode */}
          <div className="col-span-5 bg-black/80 p-8">
            <div className="flex items-baseline gap-3 mb-6">
              <div className="w-0.5 h-4 bg-pink-400/60" />
              <span className="text-[12px] font-mono text-gray-500 uppercase tracking-[0.25em]">
                Botanical Sequence
              </span>
            </div>

            <div className="space-y-5">
              {[
                { id: '01', label: 'SEED', color: 'emerald', desc: 'Dormant genetic code. Blueprint encoded. Activation pending.' },
                { id: '02', label: 'SPROUT', color: 'emerald', desc: 'Root establishment. Foundation network. Structural integrity check.' },
                { id: '03', label: 'BLOOM', color: 'pink', desc: 'Signal broadcast. Cross-pollination enabled. Discovery active.' },
                { id: '04', label: 'FRUIT', color: 'amber', desc: 'Mature carrier. Provenance locked. Propagation ready.' }
              ].map((phase) => (
                <div key={phase.id} className="group">
                  <div className="flex items-baseline gap-3 mb-1.5">
                    <span className="text-xs font-mono text-gray-600">{phase.id}</span>
                    <div className="h-px flex-1 bg-white/5" />
                    <span className={`text-xs font-mono ${
                      phase.color === 'emerald' ? 'text-emerald-400' :
                      phase.color === 'pink' ? 'text-pink-400' : 'text-amber-400'
                    }`}>
                      {phase.label}
                    </span>
                  </div>
                  <p className="text-[12px] font-mono text-gray-500 leading-relaxed pl-7">
                    {phase.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Center: Homology Mapping */}
          <div className="col-span-2 bg-black/60 flex items-center justify-center relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="100%" height="100%" className="absolute inset-0">
                <defs>
                  <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.1" />
                    <stop offset="50%" stopColor="#22c55e" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
                {/* Horizontal flow lines */}
                {[25, 40, 60, 75].map((y, i) => (
                  <motion.line
                    key={i}
                    x1="0%"
                    y1={`${y}%`}
                    x2="100%"
                    y2={`${y}%`}
                    stroke="url(#flowGrad)"
                    strokeWidth="1"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: [0, 1, 0] }}
                    transition={{
                      duration: 3,
                      delay: i * 0.4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </svg>
              <div className="relative z-10 text-center px-3">
                <div className="text-[10px] font-mono text-emerald-400/60 uppercase tracking-[0.25em] mb-2">
                  Structural
                </div>
                <div className="text-sm font-mono text-white">
                  ≈
                </div>
                <div className="text-[10px] font-mono text-emerald-400/60 uppercase tracking-[0.25em] mt-2">
                  Homology
                </div>
              </div>
            </div>
          </div>

          {/* Right: Metadata Decode */}
          <div className="col-span-5 bg-black/80 p-8">
            <div className="flex items-baseline gap-3 mb-6">
              <div className="w-0.5 h-4 bg-emerald-400/60" />
              <span className="text-[12px] font-mono text-gray-500 uppercase tracking-[0.25em]">
                Metadata Sequence
              </span>
            </div>

            <div className="space-y-5">
              {[
                { id: '01', label: 'INGESTION', color: 'emerald', desc: 'Schema load. Cataloging begins. Fingerprint generated.' },
                { id: '02', label: 'ENRICHMENT', color: 'emerald', desc: 'Lineage mapped. Context assigned. Ownership tagged.' },
                { id: '03', label: 'ACTIVATION', color: 'pink', desc: 'Catalog published. Discovery enabled. Quality broadcasting.' },
                { id: '04', label: 'GOVERNANCE', color: 'amber', desc: 'Audit trail sealed. Derivation tracked. Trust verified.' }
              ].map((phase) => (
                <div key={phase.id} className="group">
                  <div className="flex items-baseline gap-3 mb-1.5">
                    <span className={`text-xs font-mono ${
                      phase.color === 'emerald' ? 'text-emerald-400' :
                      phase.color === 'pink' ? 'text-pink-400' : 'text-amber-400'
                    }`}>
                      {phase.label}
                    </span>
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-xs font-mono text-gray-600">{phase.id}</span>
                  </div>
                  <p className="text-[12px] font-mono text-gray-500 leading-relaxed pr-7 text-right">
                    {phase.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: Core Research Note */}
        <div className="border-t border-white/[0.08] bg-black/90 p-8">
          <div className="flex gap-5">
            <div className="shrink-0 mt-1">
              <ShieldCheck className="w-5 h-5 text-emerald-400/40" />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-4 mb-3">
                <span className="text-[11px] font-mono text-emerald-400/70 uppercase tracking-[0.2em]">
                  Research Note
                </span>
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[10px] font-mono text-gray-700">
                  NX-META-01-VIZ
                </span>
              </div>
              <p className="text-[13px] font-mono text-gray-400 leading-relaxed mb-3">
                Plant morphology is not metaphor—it&apos;s <span className="text-gray-300">structural homology</span>. Both systems operate through emergent complexity from simple rules: genetic code (schema) → environmental adaptation (business context) → reproductive success (data reuse).
              </p>
              <p className="text-xs font-mono text-gray-500 leading-relaxed">
                In nature, you cannot skip from seed to fruit. You cannot have flowers without roots. The same physics governs metadata: <span className="text-emerald-400/80">skip enrichment → lose trust</span>. Attempt activation without lineage? <span className="text-emerald-400/80">System rejects</span>. This visualization encodes the non-negotiable sequencing of data maturity.
              </p>
            </div>
          </div>
        </div>

        {/* Terminal Footer */}
        <div className="h-9 border-t border-white/[0.08] bg-black/95 flex items-center justify-between px-6">
          <span className="text-[11px] font-mono text-gray-700 tracking-[0.15em]">
            © NEXUSCANON // LIFECYCLE MORPHOLOGY ANALYSIS
          </span>
          <span className="text-[12px] font-mono text-gray-700">
            2025-12-07 // 14:22:03 UTC
          </span>
        </div>
      </div>
    </div>
  );
};