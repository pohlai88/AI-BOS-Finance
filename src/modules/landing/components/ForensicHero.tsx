import { Lock, ArrowRight, Terminal } from 'lucide-react'
import { motion } from 'motion/react'

interface ForensicHeroProps {
  onGetStarted?: () => void
}

export const ForensicHero = ({ onGetStarted }: ForensicHeroProps) => {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#000000] pt-20">
      {/* --- BACKGROUND GRID --- */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* Vertical center line */}
        <div className="absolute bottom-0 left-1/2 top-0 w-px bg-[#1F1F1F]" />
        {/* Horizontal center line */}
        <div className="absolute left-0 right-0 top-1/2 h-px bg-[#1F1F1F]" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(#1F1F1F 1px, transparent 1px), linear-gradient(90deg, #1F1F1F 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* --- METADATA DECORATIONS --- */}
      <div className="absolute left-6 top-24 z-10 font-mono text-[10px] tracking-widest text-[#888888]">
        // SYS.STATUS: CRYSTALLIZED
      </div>
      <div className="absolute right-6 top-24 z-10 text-right font-mono text-[10px] tracking-widest text-[#888888]">
        COORDS: 40.7128° N / 74.0060° W
      </div>
      <div className="absolute bottom-6 left-6 z-10 font-mono text-[10px] tracking-widest text-[#888888]">
        [SECURE_CONNECTION]
      </div>

      {/* Corner Crosshairs */}
      <div className="absolute left-4 top-24 h-4 w-4 border-l border-t border-[#333]" />
      <div className="absolute right-4 top-24 h-4 w-4 border-r border-t border-[#333]" />
      <div className="absolute bottom-4 left-4 h-4 w-4 border-b border-l border-[#333]" />
      <div className="absolute bottom-4 right-4 h-4 w-4 border-b border-r border-[#333]" />

      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
        {/* Visual Icon - Locked Padlock */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-12 flex justify-center"
        >
          <div className="group relative">
            <div className="absolute -inset-4 rounded-full bg-[#28E7A2]/5 opacity-50 blur-xl transition-opacity duration-500 group-hover:opacity-80" />
            <div className="relative flex h-16 w-16 items-center justify-center border border-[#1F1F1F] bg-[#0A0A0A] shadow-[0_0_0_1px_rgba(31,31,31,1)] backdrop-blur-sm">
              {/* Top Highlight */}
              <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[#333] to-transparent" />

              <Lock
                className="h-6 w-6 text-[#28E7A2] drop-shadow-[0_0_8px_rgba(40,231,162,0.5)]"
                strokeWidth={1.5}
              />

              {/* Decor corners on the icon box */}
              <div className="absolute left-0 top-0 h-1.5 w-1.5 border-l border-t border-[#28E7A2]" />
              <div className="absolute bottom-0 right-0 h-1.5 w-1.5 border-b border-r border-[#28E7A2]" />
            </div>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className="mb-8 font-sans text-6xl font-bold leading-[0.9] tracking-tighter text-white md:text-8xl lg:text-9xl"
        >
          WHERE CHAOS
          <br />
          <span className="text-[#888] mix-blend-difference">CRYSTALLIZES</span>
          <br />
          INTO TRUTH
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mx-auto mb-16 max-w-xl font-mono text-sm leading-relaxed tracking-tight text-[#888888] md:text-base"
        >
          NexusCanon is the immutable graph of financial truth—a forensic OS.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col items-center justify-center gap-6 md:flex-row"
        >
          {/* Primary Button: Access Terminal */}
          <button
            onClick={onGetStarted}
            className="group relative overflow-hidden border border-[#1F1F1F] bg-[#0A0A0A]/80 px-8 py-4 transition-all duration-300 hover:border-[#28E7A2]/50"
          >
            {/* Scanline effect */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
            <div className="absolute left-0 top-0 h-[1px] w-full bg-gradient-to-r from-transparent via-[#28E7A2] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative z-10 flex items-center gap-3">
              <Terminal className="h-4 w-4 text-[#28E7A2]" />
              <span className="font-mono text-sm uppercase tracking-wider text-[#28E7A2]">
                Access Terminal
              </span>
            </div>
          </button>

          {/* Secondary Button: Read the Canon */}
          <button className="group border border-white/20 px-8 py-4 transition-all duration-300 hover:border-white hover:bg-white/5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm uppercase tracking-wider text-white">
                Read the Canon
              </span>
              <ArrowRight className="h-4 w-4 text-white transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        </motion.div>
      </div>
    </div>
  )
}
