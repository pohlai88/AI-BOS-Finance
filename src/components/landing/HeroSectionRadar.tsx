import { motion } from "motion/react";

export const BlackboxRadar = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 max-w-7xl mx-auto">
      {/* LEFT: THE PANOPTICON WEB - Blackbox Cryptographic Radar */}
      <div className="w-full">
        <div className="relative w-full aspect-square mx-auto rounded-2xl border border-white/10 bg-[#0A0A0A] p-8 lg:p-12 overflow-hidden">
          {/* Radar SVG - CRYPTOGRAPHIC CLARITY */}
          <svg
            viewBox="0 0 400 400"
            className="w-full h-full relative z-10"
          >
            {/* SHARP GRID LAYER - No blur, 1px crisp vectors */}
            <g>
              {/* Concentric Circles - The Web Structure (SHARP) */}
              {[80, 120, 160, 200].map((radius, i) => (
                <motion.circle
                  key={`web-${i}`}
                  cx="200"
                  cy="200"
                  r={radius}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="1"
                  strokeDasharray="8,4"
                  animate={{
                    r: [
                      radius,
                      radius,
                      radius,
                      radius + 4,
                      radius - 3,
                      radius,
                    ],
                    strokeWidth: [1, 1, 1, 2, 1, 1],
                  }}
                  transition={{
                    duration: 4,
                    times: [0, 0.49, 0.5, 0.505, 0.515, 0.53],
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              ))}
            </g>

            {/* Radial Lines - Web Threads (Canon Pillars) - BOLD LABELS */}
            {[
              {
                angle: 0,
                label: "IFRS",
                color: "rgba(74, 222, 128, 0.5)",
              },
              {
                angle: 90,
                label: "SOX",
                color: "rgba(74, 222, 128, 0.5)",
              },
              {
                angle: 180,
                label: "COSO",
                color: "rgba(74, 222, 128, 0.5)",
              },
              {
                angle: 270,
                label: "TAX",
                color: "rgba(74, 222, 128, 0.5)",
              },
            ].map((pillar, i) => {
              const rad = (pillar.angle * Math.PI) / 180;
              const x = 200 + Math.cos(rad) * 200;
              const y = 200 + Math.sin(rad) * 200;
              const labelX = 200 + Math.cos(rad) * 230;
              const labelY = 200 + Math.sin(rad) * 230;
              return (
                <g key={`pillar-${i}`}>
                  <line
                    x1="200"
                    y1="200"
                    x2={x}
                    y2={y}
                    stroke={pillar.color}
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                  >
                    {/* REFINEMENT 2: ACTIVE DATA VEINS - Data flowing outward */}
                    <animate
                      attributeName="stroke-dashoffset"
                      from="0"
                      to="-8"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </line>
                  {/* TYPOGRAPHY OVERHAUL: 16px minimum */}
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    fill="rgba(255, 255, 255, 0.95)"
                    fontSize="16"
                    fontWeight="700"
                    letterSpacing="2"
                    fontFamily="system-ui, -apple-system, sans-serif"
                  >
                    {pillar.label}
                  </text>
                </g>
              );
            })}

            {/* Coverage Polygon - The Web Shape (SHARP EDGES) */}
            <motion.polygon
              points="200,80 320,200 200,320 80,200"
              fill="rgba(74, 222, 128, 0.05)"
              stroke="rgba(74, 222, 128, 0.4)"
              strokeWidth="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            />

            {/* THE SHIELD BREAK - Critical Risk Breaking the Diamond */}
            <motion.path
              d="M200,320 L140,274"
              stroke="rgba(239, 68, 68, 0.9)"
              strokeWidth="3"
              strokeDasharray="6,3"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1, 1, 0],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 4,
                times: [0, 0.51, 0.7, 1],
                repeat: Infinity,
                ease: "easeOut",
              }}
            />

            {/* Crack warning indicator (SHARP) */}
            <motion.circle
              cx="140"
              cy="274"
              r="5"
              fill="rgba(239, 68, 68, 1)"
              stroke="rgba(239, 68, 68, 1)"
              strokeWidth="2"
              animate={{
                opacity: [0, 0, 0, 1, 1, 0],
                scale: [0, 0, 0, 1.8, 1, 0],
              }}
              transition={{
                duration: 4,
                times: [0, 0.49, 0.5, 0.52, 0.7, 1],
                repeat: Infinity,
              }}
            />

            {/* THE REACTOR CORE - Center Hub */}
            <g transform="translate(200, 200)">
              
              {/* 1. THE BLACKOUT PLATE (The Fix) */}
              {/* This solid circle hides the grid lines behind the number, preventing the "messy" look */}
              <circle
                cx="0"
                cy="0"
                r="50" 
                fill="#0A0A0A" 
                stroke="rgba(74, 222, 128, 0.3)" 
                strokeWidth="1.5"
              />

              {/* 2. The Inner Glow Ring */}
              <circle
                cx="0"
                cy="0"
                r="45"
                fill="none"
                stroke="rgba(74, 222, 128, 0.1)"
                strokeWidth="1.5"
                strokeDasharray="3, 3" 
              />

              {/* 3. THE NUMBER (Balanced proportions) */}
              <text
                x="0"
                y="8" 
                textAnchor="middle"
                fill="white"
                fontSize="42"
                fontWeight="700"
                letterSpacing="-1"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                4
              </text>

              {/* 4. The Label (Integrated into the plate) */}
              <text
                x="0"
                y="26"
                textAnchor="middle"
                fill="rgba(74, 222, 128, 0.9)"
                fontSize="10"
                fontWeight="600"
                letterSpacing="2"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                ACTIVE RISKS
              </text>

              {/* 5. The "MCP" Identity (Pushed to top edge of plate) */}
              <text
                x="0"
                y="-28"
                textAnchor="middle"
                fill="rgba(74, 222, 128, 0.7)"
                fontSize="10"
                fontWeight="600"
                letterSpacing="2.5"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                MCP CORE
              </text>
            </g>

            {/* DUAL-SCAN MECHANICS: Gradients */}
            <defs>
              <radialGradient id="scanBeamInner">
                <stop
                  offset="0%"
                  stopColor="rgba(74, 222, 128, 0.5)"
                />
                <stop
                  offset="100%"
                  stopColor="rgba(74, 222, 128, 0)"
                />
              </radialGradient>
              
              {/* REFINEMENT 3: OPTICAL LENS ARTIFACTS */}
              <filter id="noiseFilter">
                <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
              </filter>
              <radialGradient id="vignette">
                <stop offset="70%" stopColor="transparent" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
              </radialGradient>
            </defs>

            {/* REFINEMENT 1: THE CRYPTOGRAPHIC VAULT RING */}
            <g>
              {/* Outer Tick Ring */}
              <motion.circle
                cx="200"
                cy="200"
                r="190"
                fill="none"
                stroke="rgba(59, 130, 246, 0.3)"
                strokeWidth="2"
                strokeDasharray="2, 8, 15, 8, 2, 30"
                style={{ transformOrigin: "200px 200px" }}
                animate={{ rotate: -360 }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              
              {/* Inner Decoder Ring */}
              <motion.circle
                cx="200"
                cy="200"
                r="180"
                fill="none"
                stroke="rgba(59, 130, 246, 0.15)"
                strokeWidth="4"
                strokeDasharray="40, 40"
                style={{ transformOrigin: "200px 200px" }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </g>

            {/* INNER SCAN - Original direction */}
            <motion.path
              d="M200,200 L200,0 A200,200 0 0,1 341.4,58.6 Z"
              fill="url(#scanBeamInner)"
              opacity="0.7"
              style={{ transformOrigin: "200px 200px" }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear",
              }}
            />

            {/* RISK BLIPS - Detected Threats (SHARP CIRCLES) */}
            {[
              {
                angle: 45,
                radius: 140,
                severity: "low",
                label: "Rev Timing",
                delay: 0,
              },
              {
                angle: 120,
                radius: 100,
                severity: "medium",
                label: "COGS Drift",
                delay: 0.5,
              },
              {
                angle: 200,
                radius: 170,
                severity: "critical",
                label: "SOX Gap",
                delay: 1,
              },
              {
                angle: 310,
                radius: 130,
                severity: "high",
                label: "Tax Mismatch",
                delay: 1.5,
              },
            ].map((blip, i) => {
              const rad = (blip.angle * Math.PI) / 180;
              const x = 200 + Math.cos(rad) * blip.radius;
              const y = 200 + Math.sin(rad) * blip.radius;

              const severityColors = {
                low: {
                  fill: "rgba(74, 222, 128, 1)",
                  stroke: "rgba(74, 222, 128, 1)",
                },
                medium: {
                  fill: "rgba(251, 191, 36, 1)",
                  stroke: "rgba(251, 191, 36, 1)",
                },
                high: {
                  fill: "rgba(249, 115, 22, 1)",
                  stroke: "rgba(249, 115, 22, 1)",
                },
                critical: {
                  fill: "rgba(239, 68, 68, 1)",
                  stroke: "rgba(239, 68, 68, 1)",
                },
              };

              const color =
                severityColors[
                  blip.severity as keyof typeof severityColors
                ];

              return (
                <g key={`blip-${i}`}>
                  {/* Main blip - SHARP, NO GLOW */}
                  <motion.circle
                    cx={x}
                    cy={y}
                    r="7"
                    fill={color.fill}
                    stroke="rgba(255, 255, 255, 0.5)"
                    strokeWidth="2"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: [0, 1.3, 1],
                      opacity: [0, 1, 1],
                    }}
                    transition={{
                      duration: 0.4,
                      delay: 1.5 + blip.delay,
                      repeat: Infinity,
                      repeatDelay: 2.6,
                    }}
                  />

                  {/* Pulse ring - SHARP */}
                  <motion.circle
                    cx={x}
                    cy={y}
                    r="7"
                    stroke={color.stroke}
                    strokeWidth="3"
                    fill="none"
                    animate={{
                      r: [7, 16],
                      opacity: [1, 0],
                      strokeWidth: [3, 1],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: 1.5 + blip.delay,
                    }}
                  />

                  {/* GLITCH EFFECT - SHARP DISTORTION for Critical */}
                  {blip.severity === "critical" && (
                    <>
                      {/* Glitch Line 1 */}
                      <motion.rect
                        x={x - 35}
                        y={y - 4}
                        width="70"
                        height="3"
                        fill="rgba(239, 68, 68, 1)"
                        animate={{
                          x: [x - 35, x - 40, x - 32, x - 35],
                          opacity: [0, 0, 0, 1, 0.5, 0, 0, 0],
                        }}
                        transition={{
                          duration: 4,
                          times: [
                            0, 0.48, 0.49, 0.5, 0.51, 0.52,
                            0.53, 1,
                          ],
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      {/* Glitch Line 2 */}
                      <motion.rect
                        x={x - 30}
                        y={y + 3}
                        width="60"
                        height="3"
                        fill="rgba(239, 68, 68, 0.8)"
                        animate={{
                          x: [x - 30, x - 25, x - 32, x - 30],
                          opacity: [0, 0, 0, 0.9, 0.4, 0, 0, 0],
                        }}
                        transition={{
                          duration: 4,
                          times: [
                            0, 0.49, 0.5, 0.505, 0.515, 0.525,
                            0.53, 1,
                          ],
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />

                      {/* Screen distortion flash - SHARP */}
                      <motion.circle
                        cx={x}
                        cy={y}
                        r="28"
                        fill="none"
                        stroke="rgba(239, 68, 68, 1)"
                        strokeWidth="4"
                        animate={{
                          r: [7, 28],
                          opacity: [0, 0, 0, 1, 0],
                          strokeWidth: [6, 2],
                        }}
                        transition={{
                          duration: 4,
                          times: [0, 0.49, 0.5, 0.51, 0.53],
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                      />
                    </>
                  )}

                  {/* Label - BOLD, SHARP */}
                  <text
                    x={x}
                    y={y - 16}
                    textAnchor="middle"
                    fill="rgba(255, 255, 255, 1)"
                    fontSize="12"
                    fontWeight="700"
                    fontFamily="system-ui, -apple-system, sans-serif"
                  >
                    {blip.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Radar Label - REBRANDED */}
          <div className="absolute bottom-4 left-4 right-4 text-center">
            <p className="text-xs font-mono text-white/80 uppercase tracking-widest font-bold">
              NexusCanon Risk Telemetry Grid
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT: TERMINAL EVENT FEED - System Log */}
      <div className="w-full">
        <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-8 h-full flex flex-col min-h-[500px]">
          {/* Terminal Header */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-sm font-mono text-white/80 uppercase tracking-widest font-bold">
              system.log
            </span>
          </div>

          {/* Event Feed - Rolling Log */}
          <div className="space-y-4 font-mono flex-1">{[
              {
                time: "14:32:01",
                severity: "INFO",
                msg: "Scan initiated on IFRS quadrant",
                delay: 0,
              },
              {
                time: "14:32:03",
                severity: "WARN",
                msg: "Revenue timing variance detected",
                delay: 0.5,
              },
              {
                time: "14:32:05",
                severity: "WARN",
                msg: "COGS metadata drift +2.3%",
                delay: 1,
              },
              {
                time: "14:32:08",
                severity: "CRITICAL",
                msg: "SOX 404 control gap identified",
                delay: 1.5,
              },
              {
                time: "14:32:11",
                severity: "ERROR",
                msg: "Tax jurisdiction mismatch",
                delay: 2,
              },
              {
                time: "14:32:14",
                severity: "RESOLVING",
                msg: "MCP Agent analyzing SOX gap...",
                delay: 2.5,
              },
              {
                time: "14:32:16",
                severity: "SUCCESS",
                msg: "Canon lock applied to revenue stream",
                delay: 3,
              },
              {
                time: "14:32:19",
                severity: "INFO",
                msg: "Cross-reference check complete",
                delay: 3.5,
              },
            ].map((event, i) => {
              const severityColors = {
                INFO: "text-gray-400",
                WARN: "text-yellow-400",
                ERROR: "text-orange-400",
                CRITICAL: "text-red-400",
                RESOLVING: "text-blue-400",
                SUCCESS: "text-green-400",
              };

              const severityBorders = {
                INFO: "border-gray-400",
                WARN: "border-yellow-400",
                ERROR: "border-orange-400",
                CRITICAL: "border-red-400",
                RESOLVING: "border-blue-400",
                SUCCESS: "border-green-400",
              };

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: event.severity === "CRITICAL" ? [1, 0.7, 1] : 1, x: 0 }}
                  transition={{ 
                    delay: i * 0.1,
                    opacity: { duration: event.severity === "CRITICAL" ? 0.6 : 0, repeat: event.severity === "CRITICAL" ? Infinity : 0 }
                  }}
                  className={`
                    p-3 border-l-2 ${severityBorders[event.severity as keyof typeof severityBorders]}
                    backdrop-blur-sm bg-black/20 rounded-r
                  `}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-white/60 min-w-[72px] font-semibold">
                      {event.time}
                    </span>
                    <span
                      className={`${severityColors[event.severity as keyof typeof severityColors]} font-bold min-w-[90px]`}
                    >
                      [{event.severity}]
                    </span>
                    <span className="text-white/90 flex-1 leading-relaxed">{event.msg}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Live Indicator */}
          <div className="flex items-center gap-3 mt-6 pt-5 border-t border-white/10">
            <motion.div
              className="w-2.5 h-2.5 rounded-full bg-green-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm font-mono text-white/80 uppercase tracking-widest font-bold">
              Live monitoring active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};