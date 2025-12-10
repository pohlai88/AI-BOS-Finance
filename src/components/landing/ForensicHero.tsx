import { Lock, ArrowRight, Terminal } from 'lucide-react';
import { motion } from 'motion/react';

interface ForensicHeroProps {
  onGetStarted?: () => void;
}

export const ForensicHero = ({ onGetStarted }: ForensicHeroProps) => {
  return (
    <div className="relative min-h-screen w-full bg-[#000000] flex flex-col items-center justify-center overflow-hidden pt-20">
      {/* --- BACKGROUND GRID --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Vertical center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#1F1F1F]" />
        {/* Horizontal center line */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-[#1F1F1F]" />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(#1F1F1F 1px, transparent 1px), linear-gradient(90deg, #1F1F1F 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* --- METADATA DECORATIONS --- */}
      <div className="absolute top-24 left-6 z-10 font-mono text-[10px] text-[#888888] tracking-widest">
        // SYS.STATUS: CRYSTALLIZED
      </div>
      <div className="absolute top-24 right-6 z-10 font-mono text-[10px] text-[#888888] tracking-widest text-right">
        COORDS: 40.7128° N / 74.0060° W
      </div>
      <div className="absolute bottom-6 left-6 z-10 font-mono text-[10px] text-[#888888] tracking-widest">
        [SECURE_CONNECTION]
      </div>
      
      {/* Corner Crosshairs */}
      <div className="absolute top-24 left-4 w-4 h-4 border-t border-l border-[#333]" />
      <div className="absolute top-24 right-4 w-4 h-4 border-t border-r border-[#333]" />
      <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-[#333]" />
      <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-[#333]" />

      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        
        {/* Visual Icon - Locked Padlock */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex justify-center mb-12"
        >
          <div className="relative group">
            <div className="absolute -inset-4 bg-[#28E7A2]/5 rounded-full blur-xl opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
            <div className="relative w-16 h-16 flex items-center justify-center border border-[#1F1F1F] bg-[#0A0A0A] shadow-[0_0_0_1px_rgba(31,31,31,1)] backdrop-blur-sm">
               {/* Top Highlight */}
               <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#333] to-transparent" />
               
               <Lock className="w-6 h-6 text-[#28E7A2] drop-shadow-[0_0_8px_rgba(40,231,162,0.5)]" strokeWidth={1.5} />
               
               {/* Decor corners on the icon box */}
               <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-[#28E7A2]" />
               <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-[#28E7A2]" />
            </div>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-6xl md:text-8xl lg:text-9xl font-bold text-white tracking-tighter leading-[0.9] mb-8 font-sans"
        >
          WHERE CHAOS<br />
          <span className="text-[#888] mix-blend-difference">CRYSTALLIZES</span><br />
          INTO TRUTH
        </motion.h1>

        {/* Subheadline */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-[#888888] font-mono text-sm md:text-base max-w-xl mx-auto mb-16 tracking-tight leading-relaxed"
        >
          NexusCanon is the immutable graph of financial truth—a forensic OS.
        </motion.p>

        {/* Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col md:flex-row items-center justify-center gap-6"
        >
          {/* Primary Button: Access Terminal */}
          <button 
            onClick={onGetStarted}
            className="group relative px-8 py-4 bg-[#0A0A0A]/80 border border-[#1F1F1F] hover:border-[#28E7A2]/50 overflow-hidden transition-all duration-300"
          >
             {/* Scanline effect */}
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
             <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#28E7A2] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
             
             <div className="flex items-center gap-3 relative z-10">
                <Terminal className="w-4 h-4 text-[#28E7A2]" />
                <span className="font-mono text-sm text-[#28E7A2] tracking-wider uppercase">
                  Access Terminal
                </span>
             </div>
          </button>

          {/* Secondary Button: Read the Canon */}
          <button className="group px-8 py-4 border border-white/20 hover:border-white hover:bg-white/5 transition-all duration-300">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-white tracking-wider uppercase">
                Read the Canon
              </span>
              <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </motion.div>
      </div>
    </div>
  );
};
