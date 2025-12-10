import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

// 🎬 CINEMATIC 8-ACT SEQUENCE
// Professional animation principles: Anticipation, Ease curves, Depth layers, Color grading, Motion design
type Stage = 'DISCORD_YELLOW' | 'DISCORD_ORANGE' | 'DISCORD_RED' | 'DRIFT' | 'SYNC' | 'CHARGING' | 'ANTICIPATION' | 'LAUNCH' | 'REENTRY' | 'SUNRISE' | 'REVEAL';

export function SchematicBoat() {
  const [stage, setStage] = useState<Stage>('DISCORD_YELLOW');
  const [chargeLevel, setChargeLevel] = useState(0);

  // Get current discord state with escalating intensity
  const getDiscordState = () => {
    if (stage === 'DISCORD_YELLOW') return { color: '#EAB308', label: 'BLAME', shake: 3, drift: 15, vignette: 0.1 };
    if (stage === 'DISCORD_ORANGE') return { color: '#F97316', label: 'ARGUE', shake: 8, drift: 40, vignette: 0.2 };
    if (stage === 'DISCORD_RED') return { color: '#EF4444', label: 'SABOTAGE', shake: 15, drift: 80, vignette: 0.3 };
    return { color: '#EF4444', label: 'SABOTAGE', shake: 0, drift: 0, vignette: 0 };
  };

  const isDiscord = stage.startsWith('DISCORD');
  const discordState = getDiscordState();

  // --- THE DIRECTOR (Cinematic Timing) ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let t1: NodeJS.Timeout;
    let t2: NodeJS.Timeout;
    let t3: NodeJS.Timeout;
    let t4: NodeJS.Timeout;
    let t5: NodeJS.Timeout;
    let t6: NodeJS.Timeout;
    let t7: NodeJS.Timeout;
    let t8: NodeJS.Timeout;
    let t9: NodeJS.Timeout;
    let t10: NodeJS.Timeout;

    const runSequence = () => {
      setStage('DISCORD_YELLOW');
      setChargeLevel(0);

      // ACT 1a: DISCORD YELLOW (1s)
      t1 = setTimeout(() => setStage('DISCORD_ORANGE'), 1000);

      // ACT 1b: DISCORD ORANGE (1s)
      t2 = setTimeout(() => setStage('DISCORD_RED'), 2000);

      // ACT 1c: DISCORD RED (1s)
      t3 = setTimeout(() => setStage('DRIFT'), 3000);

      // ACT 2: DRIFT (2s - circular recalibration)
      t4 = setTimeout(() => setStage('SYNC'), 5000);

      // ACT 3: SYNC (2s - lock confirmation)
      t5 = setTimeout(() => {
        setStage('CHARGING');
        
        // ACT 4: CHARGING (smooth charge)
        let p = 0;
        interval = setInterval(() => {
          p += 2;
          setChargeLevel(p);
          if (p >= 100) {
            clearInterval(interval);
            // ANTICIPATION before launch
            setStage('ANTICIPATION');
          }
        }, 30);
      }, 7000);

      // ACT 4.5: ANTICIPATION (0.3s - boat leans back)
      t6 = setTimeout(() => setStage('LAUNCH'), 8800);

      // ACT 5: LAUNCH (0.6s - explosive exit)
      t7 = setTimeout(() => setStage('REENTRY'), 9400);

      // ACT 6: REENTRY (0.5s - fast return)
      t8 = setTimeout(() => setStage('SUNRISE'), 9900);

      // ACT 7: SUNRISE (3.5s - triumphant arrival)
      t9 = setTimeout(() => setStage('REVEAL'), 13400);

      // ACT 8: REVEAL (5s) then RESTART
      t10 = setTimeout(() => runSequence(), 18400);
    };

    runSequence();

    return () => {
      [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10].forEach(t => clearTimeout(t));
      if (interval) clearInterval(interval);
    };
  }, []);

  const shakeIntensity = stage === 'CHARGING' ? chargeLevel / 5 : (isDiscord ? discordState.shake : 0);

  return (
    <motion.div 
      className="w-full bg-[#050505] border border-[#222] relative overflow-hidden h-[500px] group"
      animate={stage === 'CHARGING' || isDiscord ? { 
        x: [0, -shakeIntensity, shakeIntensity, -shakeIntensity, shakeIntensity, 0],
        y: [0, -shakeIntensity/2, shakeIntensity/2, -shakeIntensity/2, shakeIntensity/2, 0]
      } : {}}
      transition={{ duration: 0.1, repeat: Infinity }}
    >
       
       {/* COORDINATE GRID OVERLAY */}
       <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-2 left-2 text-[8px] font-mono text-[#333]">00.00</div>
          <div className="absolute top-2 right-2 text-[8px] font-mono text-[#333]">100.00</div>
          <div className="absolute bottom-2 left-2 text-[8px] font-mono text-[#333] flex items-center gap-1">
            <div className="w-2 h-2 border-l border-b border-[#333]" />
            ORIGIN
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-4 h-px bg-[#333]" />
            <div className="w-px h-4 bg-[#333] absolute top-0 left-1/2 -translate-x-1/2" />
          </div>
       </div>

       {/* HUD METRICS */}
       <AnimatePresence>
         {!['SUNRISE', 'REVEAL'].includes(stage) && (
           <motion.div 
             className="absolute top-4 right-4 z-20 font-mono text-[10px] space-y-1 text-right"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
           >
              <div className="flex items-center justify-end gap-2">
                <span className="text-[#666]">SYNC_STATUS:</span>
                <motion.span
                  className={
                    isDiscord ? 'text-red-500' : 
                    stage === 'DRIFT' ? 'text-[#F97316]' :
                    stage === 'SYNC' ? 'text-[#28E7A2]' :
                    stage === 'CHARGING' ? 'text-white' : 'text-[#28E7A2]'
                  }
                  animate={{ opacity: isDiscord ? [0.5, 1, 0.5] : 1 }}
                  transition={{ duration: 0.5, repeat: isDiscord ? Infinity : 0 }}
                >
                  {isDiscord ? 'ASYNC' : stage === 'DRIFT' ? 'RECALIBRATING' : stage === 'SYNC' ? 'LOCKED' : stage === 'CHARGING' ? 'CHARGING' : 'LAUNCH'}
                </motion.span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-[#666]">POWER_OUTPUT:</span>
                <span className={isDiscord ? 'text-red-500' : 'text-[#28E7A2]'}>
                  {isDiscord ? '120W' : stage === 'DRIFT' ? '200W' : stage === 'SYNC' ? '450W' : stage === 'CHARGING' ? `${Math.floor(450 + chargeLevel * 5)}W` : '1000W'}
                </span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-[#666]">CREW_ALIGNMENT:</span>
                <span className={isDiscord ? 'text-red-500' : 'text-[#28E7A2]'}>
                  {isDiscord ? '20%' : stage === 'DRIFT' ? '60%' : '100%'}
                </span>
              </div>
           </motion.div>
         )}
       </AnimatePresence>

       {/* ENVIRONMENT GRID */}
       <div className="absolute inset-0 perspective-grid opacity-20" style={{ perspective: '500px' }}>
          <motion.div 
             className="absolute bottom-0 left-[-50%] w-[200%] h-[200px] bg-[linear-gradient(0deg,transparent_24%,rgba(40,231,162,.3)_25%,rgba(40,231,162,.3)_26%,transparent_27%,transparent_74%,rgba(40,231,162,.3)_75%,rgba(40,231,162,.3)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(40,231,162,.3)_25%,rgba(40,231,162,.3)_26%,transparent_27%,transparent_74%,rgba(40,231,162,.3)_75%,rgba(40,231,162,.3)_76%,transparent_77%,transparent)] bg-[length:50px_50px]"
             style={{ transform: 'rotateX(60deg)' }}
             animate={{ translateY: [0, 50] }}
             transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
       </div>

       {/* DISCORD ESCALATION WARNING */}
       <AnimatePresence>
         {isDiscord && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 border z-30"
              style={{ 
                color: discordState.color,
                backgroundColor: `${discordState.color}15`,
                borderColor: discordState.color
              }}
            >
              <AlertTriangle size={16} />
              <span className="text-xs tracking-widest font-mono">
                WARNING: {discordState.label}
              </span>
              <div className="ml-2 w-20 h-1 bg-black/50 relative overflow-hidden">
                <motion.div 
                  className="h-full"
                  style={{ backgroundColor: discordState.color }}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1, ease: 'linear' }}
                />
              </div>
            </motion.div>
         )}
       </AnimatePresence>

       {/* DRIFT RECALIBRATION */}
       <AnimatePresence>
         {stage === 'DRIFT' && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[#F97316] bg-[#F97316]/10 px-4 py-2 border border-[#F97316] z-30"
            >
              <motion.div 
                className="w-2 h-2 bg-[#F97316] rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <span className="text-xs tracking-widest font-mono">RECALIBRATING_ALIGNMENT...</span>
            </motion.div>
         )}
       </AnimatePresence>

       {/* SYNC CONFIRMATION */}
       <AnimatePresence>
         {stage === 'SYNC' && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[#28E7A2] bg-[#28E7A2]/10 px-4 py-2 border border-[#28E7A2] z-30"
            >
              <div className="w-2 h-2 bg-[#28E7A2] rounded-full animate-pulse" />
              <span className="text-xs tracking-widest font-mono">LOCK_CONFIRMED // SYNCHRONIZED</span>
            </motion.div>
         )}
       </AnimatePresence>

       {/* ULTI CHARGE BAR */}
       <AnimatePresence>
         {stage === 'CHARGING' && (
           <motion.div 
             className="absolute bottom-12 left-1/2 -translate-x-1/2 w-96 z-40"
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             exit={{ y: 20, opacity: 0 }}
           >
              <div className="w-full">
                 <div className="flex justify-between items-end mb-2 font-mono">
                    <motion.span 
                      className="text-[#28E7A2] text-xs tracking-widest"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      SYNCHRONIZING...
                    </motion.span>
                    <span className="text-white text-4xl italic">{chargeLevel}%</span>
                 </div>
                 
                 <div className="w-full h-4 bg-[#111] border border-[#333] relative overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[#28E7A2] via-white to-[#28E7A2]"
                      style={{ width: `${chargeLevel}%` }}
                    />
                    <motion.div 
                      className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                 </div>
              </div>
           </motion.div>
         )}
       </AnimatePresence>

       {/* THE BOAT */}
       <AnimatePresence>
         {!['SUNRISE', 'REVEAL'].includes(stage) && (
           <motion.div 
             className="absolute inset-0 flex items-center justify-center"
             animate={stage === 'DRIFT' ? {
               x: [0, 100, 0, -100, 0],
               y: [0, -60, 0, 60, 0]
             } : {}}
             transition={stage === 'DRIFT' ? {
               duration: 2,
               ease: "easeInOut"
             } : {}}
             exit={stage === 'LAUNCH' ? { 
               x: 2000, 
               opacity: 0, 
               scale: 1.2,
               transition: { duration: 0.4, ease: 'easeIn' }
             } : stage === 'REENTRY' ? {
               opacity: 0
             } : {}}
           >
              <motion.div
                animate={isDiscord ? {
                  x: [-discordState.drift, discordState.drift, -discordState.drift, discordState.drift, 0]
                } : {}}
                transition={isDiscord ? {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                } : {}}
              >
                <svg width="900" height="400" viewBox="0 0 900 400" className="overflow-visible">
                   <defs>
                      <linearGradient id="fadeTrail" x1="0" y1="0" x2="1" y2="0">
                         <stop offset="0%" stopColor="#28E7A2" stopOpacity="0" />
                         <stop offset="100%" stopColor="#28E7A2" stopOpacity="0.5" />
                      </linearGradient>
                   </defs>

                   {/* ENERGY AURA during CHARGING */}
                   {stage === 'CHARGING' && (
                      <>
                        <motion.circle 
                          cx="450" cy="250" 
                          r={100 + (chargeLevel * 2)} 
                          fill="none" 
                          stroke="#28E7A2" 
                          strokeWidth="1" 
                          strokeOpacity={0.5 - (chargeLevel/200)} 
                        />
                        <motion.circle 
                          cx="450" cy="250" 
                          r={80 + (chargeLevel * 1.5)} 
                          fill="none" 
                          stroke="#FFF" 
                          strokeWidth="0.5" 
                          strokeOpacity={0.3 - (chargeLevel/300)} 
                        />
                      </>
                   )}

                   {/* WAKE */}
                   <g transform="translate(0, 20)">
                      {!isDiscord && [1,2,3].map(i => (
                         <motion.path 
                            key={i}
                            d="M 100 250 Q 400 250 700 250"
                            fill="none" 
                            stroke={stage === 'CHARGING' ? '#FFF' : '#28E7A2'}
                            strokeWidth={stage === 'CHARGING' ? "1.5" : "0.5"} 
                            strokeOpacity="0.3"
                            animate={{ 
                              d: ["M 100 250 Q 400 260 700 250", "M 100 250 Q 400 240 700 250"]
                            }}
                            transition={{ 
                              duration: stage === 'SYNC' ? 1 : 0.5, 
                              repeat: Infinity, 
                              delay: i * 0.2 
                            }}
                         />
                      ))}
                   </g>

                   {/* HULL */}
                   <g>
                      <path 
                        d="M 150 230 L 650 230 L 620 270 L 180 270 Z" 
                        fill="#050505" 
                        stroke={isDiscord ? discordState.color : stage === 'CHARGING' ? '#FFF' : stage === 'DRIFT' ? '#F97316' : '#28E7A2'}
                        strokeWidth="1" 
                      />
                      <line x1="280" y1="230" x2="290" y2="270" stroke="#28E7A2" strokeWidth="0.5" opacity="0.3" />
                      <line x1="380" y1="230" x2="390" y2="270" stroke="#28E7A2" strokeWidth="0.5" opacity="0.3" />
                      <line x1="480" y1="230" x2="490" y2="270" stroke="#28E7A2" strokeWidth="0.5" opacity="0.3" />
                      
                      <motion.path 
                        d="M 650 230 L 700 210 L 710 220 L 680 240 Z" 
                        fill={isDiscord ? discordState.color : stage === 'CHARGING' ? '#FFF' : stage === 'DRIFT' ? '#F97316' : '#28E7A2'}
                        fillOpacity="0.2"
                        stroke={isDiscord ? discordState.color : stage === 'CHARGING' ? '#FFF' : stage === 'DRIFT' ? '#F97316' : '#28E7A2'}
                        animate={{
                          y: stage === 'CHARGING' ? [0, -3, 0] : [0, -2, 0]
                        }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      <motion.circle 
                        cx="690" cy="220" r="2" 
                        fill={isDiscord ? discordState.color : stage === 'CHARGING' ? '#FFF' : stage === 'DRIFT' ? '#F97316' : '#28E7A2'}
                        filter="url(#neon-glow)"
                        animate={{
                          opacity: [1, 0.3, 1]
                        }}
                        transition={{
                          duration: stage === 'CHARGING' ? 0.2 : 1,
                          repeat: Infinity
                        }}
                      />

                      {/* CREW */}
                      {[
                        { x: 580, role: 'CEO', desire: 'Wants to' },
                        { x: 480, role: 'CFO', desire: 'Encourages' },
                        { x: 380, role: 'CTO', desire: 'Determined' },
                        { x: 280, role: 'Manager', desire: 'Calls to' },
                        { x: 200, role: 'Staff', desire: 'Urges to' }
                      ].map((rower, i) => (
                         <g key={i}>
                           <AnimeRower x={rower.x} index={i} stage={stage} discordColor={discordState.color} />
                           
                           <text 
                             x={rower.x} y="180" 
                             textAnchor="middle" 
                             fontSize="9" 
                             fill={isDiscord ? discordState.color : stage === 'CHARGING' ? '#FFF' : stage === 'DRIFT' ? '#F97316' : '#28E7A2'}
                             fontFamily="monospace"
                           >
                             {rower.role}
                           </text>
                           <text 
                             x={rower.x} y="190" 
                             textAnchor="middle" 
                             fontSize="7" 
                             fill={isDiscord ? '#666' : '#28E7A2'}
                             fontFamily="monospace"
                             fontStyle="italic"
                           >
                             {rower.desire}
                           </text>
                         </g>
                      ))}
                   </g>

                   {/* VELOCITY PARTICLES */}
                   {(stage === 'SYNC' || stage === 'CHARGING') && Array.from({ length: 10 }).map((_, i) => (
                      <motion.rect 
                         key={i}
                         x="800" y={180 + Math.random() * 120} 
                         width={stage === 'CHARGING' ? "80" : "40"} 
                         height="1" 
                         fill="url(#fadeTrail)"
                         animate={{ x: [-100, 900], opacity: [0, 1, 0] }}
                         transition={{ 
                           duration: stage === 'CHARGING' ? 0.5 : 1, 
                           repeat: Infinity, 
                           ease: "linear", 
                           delay: Math.random() 
                         }}
                      />
                   ))}

                </svg>
              </motion.div>
           </motion.div>
         )}
       </AnimatePresence>

       {/* BOAT REENTRY from LEFT */}
       <AnimatePresence>
         {stage === 'REENTRY' && (
           <motion.div
             className="absolute inset-0 flex items-center justify-center"
             initial={{ x: -2000, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             transition={{ duration: 0.5, ease: "easeOut" }}
           >
              <svg width="900" height="400" viewBox="0 0 900 400" className="overflow-visible">
                 <g>
                    <path 
                      d="M 150 230 L 650 230 L 620 270 L 180 270 Z" 
                      fill="#050505" 
                      stroke="#28E7A2"
                      strokeWidth="1" 
                    />
                    <motion.path 
                      d="M 650 230 L 700 210 L 710 220 L 680 240 Z" 
                      fill="#28E7A2"
                      fillOpacity="0.3"
                      stroke="#28E7A2"
                    />
                 </g>
              </svg>
           </motion.div>
         )}
       </AnimatePresence>

       {/* SUNRISE - Boat returns from RIGHT with sun rising from TOP */}
       <AnimatePresence>
         {stage === 'SUNRISE' && (
           <motion.div
             className="absolute inset-0 z-50 bg-[#000]"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ duration: 0.5, ease: 'easeOut' }}
           >
             {/* THE SUN - Smaller, more refined, rising from TOP */}
             <motion.div
               className="absolute left-1/2 -translate-x-1/2"
               initial={{ top: '-200px', opacity: 0, scale: 0.5 }}
               animate={{ top: '80px', opacity: 1, scale: 1 }}
               transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }} // Smooth ease-out curve
             >
               {/* Outer atmospheric glow */}
               <motion.div
                 className="absolute w-[300px] h-[300px] rounded-full left-1/2 -translate-x-1/2"
                 style={{
                   background: 'radial-gradient(circle, rgba(252,211,77,0.3) 0%, rgba(251,191,36,0.15) 40%, transparent 70%)',
                   filter: 'blur(20px)'
                 }}
                 animate={{ 
                   scale: [1, 1.08, 1],
                   opacity: [0.6, 0.8, 0.6]
                 }}
                 transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
               />
               
               {/* Core sun - reduced size */}
               <motion.div
                 className="absolute w-[120px] h-[120px] rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                 style={{
                   background: 'radial-gradient(circle, #FCD34D 0%, #F59E0B 60%, #D97706 100%)',
                   boxShadow: '0 0 40px rgba(252,211,77,0.6), 0 0 80px rgba(245,158,11,0.3), 0 0 120px rgba(217,119,6,0.1)'
                 }}
                 animate={{ scale: [1, 1.03, 1] }}
                 transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
               />

               {/* God rays - only upper hemisphere (no downward rays) */}
               {[100, 120, 140, 160, 200, 220, 240, 260, 280].map(angle => (
                 <motion.div
                   key={angle}
                   className="absolute w-2 h-[350px] left-1/2 top-1/2"
                   style={{
                     background: 'linear-gradient(to bottom, rgba(252,211,77,0.4), rgba(252,211,77,0.1) 50%, transparent)',
                     transform: `translateX(-50%) translateY(-50%) rotate(${angle}deg)`,
                     transformOrigin: 'top center',
                     filter: 'blur(2px)'
                   }}
                   initial={{ scaleY: 0, opacity: 0 }}
                   animate={{ 
                     scaleY: [0, 1, 0.9],
                     opacity: [0, 0.7, 0.5]
                   }}
                   transition={{ 
                     duration: 1.8, 
                     delay: angle / 1200,
                     ease: [0.16, 1, 0.3, 1]
                   }}
                 />
               ))}

               {/* Lens flare particles */}
               {[...Array(8)].map((_, i) => (
                 <motion.div
                   key={`flare-${i}`}
                   className="absolute rounded-full"
                   style={{
                     width: `${20 + i * 5}px`,
                     height: `${20 + i * 5}px`,
                     left: `calc(50% + ${i * 30 - 105}px)`,
                     top: `calc(50% + ${i * 15 - 52}px)`,
                     background: `radial-gradient(circle, rgba(252,211,77,${0.3 - i * 0.03}), transparent)`,
                     transform: 'translate(-50%, -50%)'
                   }}
                   initial={{ opacity: 0, scale: 0 }}
                   animate={{ opacity: [0, 1, 0.6], scale: 1 }}
                   transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                 />
               ))}
             </motion.div>

             {/* DEPTH LAYER: Atmospheric haze particles */}
             {[...Array(20)].map((_, i) => (
               <motion.div
                 key={`haze-${i}`}
                 className="absolute rounded-full"
                 style={{
                   width: `${Math.random() * 60 + 20}px`,
                   height: `${Math.random() * 60 + 20}px`,
                   left: `${Math.random() * 100}%`,
                   top: `${Math.random() * 60 + 10}%`,
                   background: 'radial-gradient(circle, rgba(252,211,77,0.1), transparent)',
                   filter: 'blur(15px)'
                 }}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ 
                   opacity: [0, 0.5, 0.3],
                   y: [20, 0, -10],
                   x: [0, Math.random() * 20 - 10]
                 }}
                 transition={{ 
                   duration: 3, 
                   delay: Math.random() * 1,
                   ease: 'easeOut'
                 }}
               />
             ))}

             {/* THE BOAT - Triumphant return with motion blur */}
             <motion.div
               className="absolute inset-0 flex items-center justify-center"
               initial={{ x: 2000, filter: 'blur(8px)' }}
               animate={{ x: 0, filter: 'blur(0px)' }}
               transition={{ 
                 duration: 1.8, 
                 ease: [0.16, 1, 0.3, 1], // Professional ease-out
                 delay: 0.4 
               }}
             >
                {/* Speed trail effect during entry */}
                <motion.div
                  className="absolute inset-0"
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 1, delay: 0.4 }}
                >
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={`trail-${i}`}
                      className="absolute top-1/2 left-1/2 -translate-y-1/2"
                      initial={{ x: 400 - i * 80, opacity: 0.4 - i * 0.08 }}
                      animate={{ x: -200, opacity: 0 }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                    >
                      <svg width="900" height="400" viewBox="0 0 900 400">
                        <path 
                          d="M 650 230 L 150 230 L 180 270 L 620 270 Z" 
                          fill="none"
                          stroke="#FCD34D"
                          strokeWidth="1" 
                          strokeOpacity={0.3 - i * 0.06}
                        />
                      </svg>
                    </motion.div>
                  ))}
                </motion.div>

                <svg width="900" height="400" viewBox="0 0 900 400" className="overflow-visible">
                   {/* Water reflection - golden shimmer */}
                   <motion.g transform="translate(0, 310)" opacity="0.3">
                      <ellipse 
                        cx="400" cy="0" rx="250" ry="20" 
                        fill="url(#waterReflection)" 
                      />
                      <defs>
                        <linearGradient id="waterReflection" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="transparent" />
                          <stop offset="30%" stopColor="#FCD34D" stopOpacity="0.3" />
                          <stop offset="70%" stopColor="#FCD34D" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                      </defs>
                   </motion.g>

                   {/* Golden Wake - with depth */}
                   <g transform="translate(0, 20)">
                      {[1,2,3].map(i => (
                         <motion.path 
                            key={i}
                            d="M 700 250 Q 400 250 100 250"
                            fill="none" 
                            stroke="#D97706"
                            strokeWidth={2 - i * 0.4}
                            strokeOpacity={0.5 - i * 0.1}
                            animate={{ 
                              d: ["M 700 250 Q 400 258 100 250", "M 700 250 Q 400 242 100 250"],
                              strokeOpacity: [0.5 - i * 0.1, 0.3 - i * 0.1, 0.5 - i * 0.1]
                            }}
                            transition={{ 
                              duration: 1.2, 
                              repeat: Infinity, 
                              delay: i * 0.15,
                              ease: 'easeInOut'
                            }}
                         />
                      ))}
                   </g>

                   {/* HULL - REVERSED with shadow */}
                   <g filter="drop-shadow(0 8px 12px rgba(0,0,0,0.3))">
                      {/* Shadow underneath */}
                      <ellipse 
                        cx="400" cy="285" rx="200" ry="8" 
                        fill="rgba(0,0,0,0.2)" 
                        opacity="0.5"
                      />

                      <path 
                        d="M 650 230 L 150 230 L 180 270 L 620 270 Z" 
                        fill="#0A0A0A" 
                        stroke="#FBBF24"
                        strokeWidth="2" 
                      />
                      
                      {/* Interior highlights - depth */}
                      <line x1="520" y1="230" x2="510" y2="270" stroke="#F59E0B" strokeWidth="0.5" opacity="0.6" />
                      <line x1="420" y1="230" x2="410" y2="270" stroke="#F59E0B" strokeWidth="0.5" opacity="0.6" />
                      <line x1="320" y1="230" x2="310" y2="270" stroke="#F59E0B" strokeWidth="0.5" opacity="0.6" />
                      
                      {/* Dragon head - glowing with emanating light */}
                      <g filter="drop-shadow(0 0 12px #FCD34D)">
                        <motion.path 
                          d="M 150 230 L 100 210 L 90 220 L 120 240 Z" 
                          fill="#FCD34D"
                          fillOpacity="0.7"
                          stroke="#FBBF24"
                          strokeWidth="2"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      </g>
                      
                      {/* Dragon eye - bright beacon */}
                      <motion.circle 
                        cx="110" cy="220" r="3" 
                        fill="#FFF"
                        style={{ filter: 'drop-shadow(0 0 8px #FCD34D) drop-shadow(0 0 4px #FFF)' }}
                        animate={{ 
                          opacity: [1, 0.7, 1],
                          scale: [1, 1.3, 1]
                        }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                      />

                      {/* CREW - Celebrating with cascading wave animation */}
                      {[
                        { x: 220, role: 'CEO' },
                        { x: 320, role: 'CFO' },
                        { x: 420, role: 'CTO' },
                        { x: 520, role: 'Manager' },
                        { x: 600, role: 'Staff' }
                      ].map((rower, i) => (
                         <g key={i}>
                           {/* Body with bounce */}
                           <motion.line 
                              x1={rower.x} y1="200" x2={rower.x} y2="170" 
                              stroke="#F59E0B" 
                              strokeWidth="2.5"
                              animate={{ y: [0, -2, 0] }}
                              transition={{ 
                                duration: 0.8, 
                                repeat: Infinity, 
                                delay: i * 0.12,
                                ease: 'easeInOut'
                              }}
                           />
                           
                           {/* Head with secondary motion */}
                           <motion.circle 
                              cx={rower.x} cy="170" r="8" 
                              fill="#0A0A0A" 
                              stroke="#FBBF24" 
                              strokeWidth="2.5"
                              animate={{ 
                                y: [0, -2, 0],
                                scale: [1, 1.05, 1]
                              }}
                              transition={{ 
                                duration: 0.8, 
                                repeat: Infinity, 
                                delay: i * 0.12,
                                ease: 'easeInOut'
                              }}
                           />
                           
                           {/* Oar - Victory wave with overshoot */}
                           <motion.line 
                              x1={rower.x} y1="180" x2={rower.x} y2="140"
                              stroke="#F59E0B" 
                              strokeWidth="4"
                              animate={{ 
                                rotate: [-25, -15, -28, -25]
                              }}
                              transition={{ 
                                duration: 1.2,
                                repeat: Infinity,
                                ease: [0.45, 0, 0.55, 1], // Smooth in-out
                                delay: i * 0.12
                              }}
                              style={{ 
                                transformOrigin: `${rower.x}px 180px`,
                                filter: 'drop-shadow(0 0 4px #F59E0B)'
                              }}
                           />
                           
                           {/* Label with fade-in */}
                           <motion.text 
                             x={rower.x} y="155" 
                             textAnchor="middle" 
                             fontSize="11" 
                             fill="#FBBF24"
                             fontFamily="monospace"
                             fontWeight="bold"
                             initial={{ opacity: 0, y: 10 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ delay: 1 + i * 0.1, duration: 0.4 }}
                           >
                             {rower.role}
                           </motion.text>
                         </g>
                      ))}
                   </g>

                   {/* Celebration sparkles - timed bursts */}
                   {[...Array(25)].map((_, i) => (
                      <motion.circle
                         key={`sparkle-${i}`}
                         cx={150 + Math.random() * 500}
                         cy={180 + Math.random() * 100}
                         r={Math.random() * 2 + 1}
                         fill="#FCD34D"
                         initial={{ opacity: 0, scale: 0 }}
                         animate={{ 
                           opacity: [0, 1, 0.8, 0],
                           scale: [0, 1.5, 1, 0],
                           y: [0, -20 - Math.random() * 20]
                         }}
                         transition={{
                           duration: 1.5 + Math.random(),
                           repeat: Infinity,
                           delay: Math.random() * 2,
                           ease: 'easeOut'
                         }}
                      />
                   ))}
                </svg>
             </motion.div>

             {/* Ambient golden color grading - cinematic warmth */}
             <motion.div
               className="absolute inset-0 pointer-events-none mix-blend-screen"
               style={{
                 background: 'radial-gradient(ellipse 60% 50% at 50% 25%, rgba(252,211,77,0.15) 0%, transparent 70%)'
               }}
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ duration: 1.5, ease: 'easeOut' }}
             />

             {/* Vignette for depth */}
             <motion.div
               className="absolute inset-0 pointer-events-none"
               style={{
                 background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)'
               }}
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ duration: 1 }}
             />
           </motion.div>
         )}
       </AnimatePresence>

       {/* FINAL REVEAL - Back to Black */}
       <AnimatePresence>
         {stage === 'REVEAL' && (
           <motion.div
             className="absolute inset-0 flex items-center justify-center bg-[#050505]/95 z-50"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             transition={{ duration: 1 }}
           >
             <div className="text-center space-y-6 px-8">
               <motion.div
                 initial={{ y: 20 }}
                 animate={{ y: 0 }}
                 transition={{ delay: 0.3 }}
               >
                 <h3 className="text-5xl md:text-7xl text-white leading-tight mb-4">
                   Stop the shouting.<br/>
                   Start the thriving.
                 </h3>
                 <div className="flex items-center justify-center gap-4 text-3xl md:text-4xl text-[#28E7A2]">
                   <span>ONE direction.</span>
                   <div className="w-1 h-10 bg-[#28E7A2]" />
                   <span>ONE destiny.</span>
                 </div>
               </motion.div>

               <motion.div
                 className="flex items-center justify-center gap-3 pt-4"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: 0.8 }}
               >
                 <div className="w-3 h-3 bg-[#28E7A2] rounded-full animate-pulse" />
                 <span className="text-sm font-mono text-[#666] uppercase tracking-widest">
                   Synchronized Commitment
                 </span>
                 <div className="w-3 h-3 bg-[#28E7A2] rounded-full animate-pulse" />
               </motion.div>

               <motion.div
                 className="flex items-center justify-center gap-2 pt-8"
                 initial={{ scaleX: 0 }}
                 animate={{ scaleX: 1 }}
                 transition={{ delay: 1.2, duration: 0.8 }}
               >
                 <div className="h-px w-32 bg-gradient-to-r from-transparent to-[#28E7A2]" />
                 <div className="w-2 h-2 border border-[#28E7A2] rotate-45" />
                 <div className="h-px w-32 bg-gradient-to-l from-transparent to-[#28E7A2]" />
               </motion.div>

               <motion.div
                 className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-mono text-[#444]"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: 2 }}
               >
                 RESTARTING_SEQUENCE...
               </motion.div>
             </div>
           </motion.div>
         )}
       </AnimatePresence>

    </motion.div>
  );
}

// Anime Rower Component
function AnimeRower({ x, index, stage, discordColor }: { x: number, index: number, stage: Stage, discordColor: string }) {
   const chaosRotation = [
      [20, -10, 30],
      [-20, 10, -30],
      [10, 40, 0],
      [-40, -10, -20],
      [30, 0, -10]
   ][index % 5];

   const syncRotation = [30, -30, 30];
   const chargeRotation = [45, 45, 45];

   const getRotation = () => {
     if (stage.startsWith('DISCORD')) return chaosRotation;
     if (stage === 'CHARGING') return chargeRotation;
     if (stage === 'LAUNCH' || stage === 'REENTRY') return [60];
     return syncRotation;
   };

   const getColor = () => {
     if (stage.startsWith('DISCORD')) return discordColor;
     if (stage === 'SYNC') return '#28E7A2';
     if (stage === 'CHARGING') return '#FFF';
     if (stage === 'DRIFT') return '#F97316';
     return '#28E7A2';
   };

   const getDuration = () => {
     if (stage.startsWith('DISCORD')) return 0.5 + Math.random();
     if (stage === 'CHARGING') return 0.1;
     return 1;
   };

   return (
      <g>
         <line 
            x1={x} y1="200" x2={x} y2="170" 
            stroke={getColor()} 
            strokeWidth="2" 
         />
         <circle 
            cx={x} cy="170" r="8" 
            fill="#000" 
            stroke={getColor()} 
            strokeWidth="2" 
         />
         <motion.line 
            x1={x} y1="180" x2={x} y2="250"
            stroke={getColor()} 
            strokeWidth="3"
            initial={{ rotate: 0 }}
            animate={{ rotate: getRotation() }}
            transition={{ 
              duration: getDuration(),
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut"
            }}
            style={{ transformOrigin: `${x}px 180px` }}
         />
      </g>
   );
}