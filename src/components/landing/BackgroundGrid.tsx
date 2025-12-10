import { motion } from 'motion/react';

export const BackgroundGrid = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* 1. The Base Grid (Static) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />

      {/* 2. The Scanning Laser (Moving) */}
      <motion.div
        className="absolute left-0 right-0 h-[2px] bg-nexus-green/30 shadow-[0_0_15px_rgba(40,231,162,0.5)] z-0"
        animate={{ top: ['0%', '100%'], opacity: [0, 1, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* 3. Ambient Particles (Floating Dust) */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-nexus-green/20 rounded-full"
            initial={{
              x: `${Math.random() * 100}%`,
              y: `${Math.random() * 100}%`,
              opacity: Math.random(),
            }}
            animate={{
              y: [`${Math.random() * 100}%`, `${Math.random() * -50}%`],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* 4. Vignette Effect (Depth) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#000_70%)] opacity-60" />
    </div>
  );
};

