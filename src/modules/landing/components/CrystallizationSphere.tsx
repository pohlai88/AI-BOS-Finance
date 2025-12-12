import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Lock, Globe, Hexagon } from 'lucide-react'

export const CrystallizationSphere = () => {
  const [isFrozen, setIsFrozen] = useState(false)
  const [_hovered, setHovered] = useState(false)

  // Auto-reset for demo purposes (optional)
  useEffect(() => {
    if (isFrozen) {
      const timer = setTimeout(() => setIsFrozen(false), 6000)
      return () => clearTimeout(timer)
    }
  }, [isFrozen])

  return (
    <div className="relative mx-auto flex h-[600px] w-full max-w-4xl items-center justify-center overflow-visible">
      {/* 1. ATMOSPHERIC GLOW (Changes temp based on state) */}
      <motion.div
        className="bg-nexus-green/5 absolute inset-0 rounded-full blur-[100px]"
        animate={{
          opacity: isFrozen ? 0.6 : 0.2,
          scale: isFrozen ? 1.2 : 1,
        }}
        transition={{ duration: 1 }}
      />

      {/* 2. THE CORE SPHERE (Liquid Ledger) */}
      <div
        className="perspective-1000 group relative h-96 w-96 cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setIsFrozen(!isFrozen)}
      >
        {/* A. The Spinning Wireframe Earth */}
        <motion.div
          className="absolute inset-0 rounded-full border border-white/10"
          animate={{ rotate: isFrozen ? 0 : 360 }}
          transition={{
            duration: 20,
            ease: 'linear',
            repeat: isFrozen ? 0 : Infinity,
          }}
        >
          {/* Latitudes */}
          {[...Array(6)].map((_, i) => (
            <div
              key={`lat-${i}`}
              className="absolute inset-0 rounded-full border border-white/10"
              style={{ transform: `rotateX(${i * 30}deg)` }}
            />
          ))}
          {/* Longitudes */}
          {[...Array(6)].map((_, i) => (
            <div
              key={`long-${i}`}
              className="absolute inset-0 rounded-full border border-white/10"
              style={{ transform: `rotateY(${i * 30}deg)` }}
            />
          ))}
        </motion.div>

        {/* B. The Floating Data Particles (Chaos) */}
        {!isFrozen &&
          [...Array(20)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute h-1 w-1 rounded-full bg-white"
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{
                x: (Math.random() - 0.5) * 400,
                y: (Math.random() - 0.5) * 400,
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
              style={{ left: '50%', top: '50%' }}
            />
          ))}

        {/* C. THE CRYSTAL CAGE (The Freeze Overlay) */}
        <AnimatePresence>
          {isFrozen && (
            <motion.div
              className="absolute inset-[-20px] z-20"
              initial={{ scale: 1.5, opacity: 0, rotate: 45 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 1.5, opacity: 0, rotate: -45 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 20,
                mass: 1,
              }}
            >
              {/* The Hexagonal Lattice */}
              <svg
                viewBox="0 0 100 100"
                className="h-full w-full overflow-visible"
              >
                <defs>
                  <linearGradient
                    id="crystalGrad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="rgba(16, 185, 129, 0.1)" />
                    <stop offset="50%" stopColor="rgba(16, 185, 129, 0.4)" />
                    <stop offset="100%" stopColor="rgba(16, 185, 129, 0.1)" />
                  </linearGradient>
                </defs>

                {/* Geometric Cage */}
                <motion.path
                  d="M50 2 L93 25 L93 75 L50 98 L7 75 L7 25 Z"
                  fill="url(#crystalGrad)"
                  stroke="#10b981"
                  strokeWidth="0.5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8 }}
                />

                {/* Inner Connecting Beams */}
                <motion.path
                  d="M50 2 L50 50 M93 25 L50 50 M93 75 L50 50 M50 98 L50 50 M7 75 L50 50 M7 25 L50 50"
                  stroke="#10b981"
                  strokeWidth="0.2"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 0.2 }}
                />
              </svg>

              {/* Locked Icon Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="border-nexus-green rounded-full border bg-[#050a07] p-4 shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                >
                  <Lock className="text-nexus-green h-8 w-8" />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* D. Center Mass (The Hot Core) */}
        <div className="absolute inset-[30%] flex items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#000]">
          {/* Inner spinning core */}
          <motion.div
            className={`h-full w-full bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_70%)] ${isFrozen ? 'opacity-20' : 'opacity-100'}`}
            animate={{ rotate: isFrozen ? 0 : -360 }}
            transition={{
              duration: 10,
              repeat: isFrozen ? 0 : Infinity,
              ease: 'linear',
            }}
          >
            <div className="absolute left-1/2 top-2 h-1 w-1 rounded-full bg-white blur-[1px]" />
            <div className="absolute bottom-4 left-1/3 h-1.5 w-1.5 rounded-full bg-white blur-[1px]" />
          </motion.div>
        </div>
      </div>

      {/* 3. INTERACTION LABELS */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-12 font-mono text-xs tracking-widest">
        <div
          className={`flex items-center gap-2 transition-colors ${isFrozen ? 'text-white/20' : 'text-white'}`}
        >
          <Globe className="h-4 w-4" />
          <span>LIQUID LEDGER</span>
        </div>

        <div className="h-[1px] w-16 self-center bg-white/10" />

        <div
          className={`flex items-center gap-2 transition-colors ${isFrozen ? 'text-nexus-green' : 'text-white/20'}`}
        >
          <Hexagon className="h-4 w-4" />
          <span>CRYSTALLIZED STATE</span>
        </div>
      </div>

      {/* 4. CLICK TRIGGER OVERLAY (Instructions) */}
      {!isFrozen && (
        <motion.div
          className="pointer-events-none absolute top-[60%]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <div className="text-nexus-noise rounded-full border border-white/10 bg-black/50 px-4 py-2 font-mono text-xs backdrop-blur-md">
            CLICK CORE TO FREEZE
          </div>
        </motion.div>
      )}
    </div>
  )
}
