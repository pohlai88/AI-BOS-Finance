// ============================================================================
// REG_03 - RESET PASSWORD PAGE [EMERGENCY OVERRIDE]
// Architecture: High Voltage Circuit Breaker
// Metaphor: "Manual Override" - User is bypassing a locked system
// Visuals: Hazard stripes, electrical arcs, fuse box aesthetics
// ============================================================================

import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Zap, Power, ShieldAlert } from 'lucide-react';
import { motion, useMotionValue } from 'motion/react';
import { NexusCanonLogo } from '@/components/NexusCanonLogo';
import {
  EngineProvider,
  HighVoltageSystem,
} from '../components/auth/IntegratedEngine';

// --- SUB-COMPONENT: HAZARD STRIPE ---
const HazardStripe = () => (
  <div 
    className="h-2 w-full mb-6 opacity-80"
    style={{
      backgroundImage: 'repeating-linear-gradient(45deg, #000, #000 10px, #FFD700 10px, #FFD700 20px)'
    }}
  />
);

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  
  // SYSTEM STATE
  const [email, setEmail] = useState('');
  const [systemState, setSystemState] = useState<'idle' | 'charging' | 'discharging'>('idle');
  const [isSuccess, setIsSuccess] = useState(false);

  // MOUSE PARALLAX
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSystemState('discharging'); // Trigger the arc blast

    // Simulate reset process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsSuccess(true);
    setSystemState('idle'); // Calm down
  };

  return (
    <EngineProvider state={systemState === 'idle' ? 'idle' : 'revving'} shakeX={useMotionValue(0)} shakeY={useMotionValue(0)}>
      <div 
        className="min-h-screen w-full bg-black relative overflow-hidden flex items-center justify-center"
        onMouseMove={handleMouseMove}
      >
        
        {/* --- LAYER 1: HIGH VOLTAGE BACKGROUND --- */}
        <HighVoltageSystem state={systemState} />
        
        {/* CRT Scanlines */}
        <div className="absolute inset-0 pointer-events-none z-50 opacity-10" style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%' }} />

        {/* Grid Background */}
        <div
          className="absolute inset-0 opacity-8"
          style={{
            backgroundImage: `
              linear-gradient(#1a1a1a 0.5px, transparent 0.5px), 
              linear-gradient(90deg, #1a1a1a 0.5px, transparent 0.5px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        {/* --- LAYER 2: THE FUSE BOX (Form) --- */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-20 w-full max-w-[480px] px-6"
        >
          <div 
            className="bg-[#0a0a0a] border-2 p-8 relative overflow-hidden shadow-2xl"
            style={{ 
              borderColor: isSuccess ? '#28E7A2' : '#333',
              boxShadow: isSuccess ? '0 0 50px rgba(40, 231, 162, 0.2)' : '0 0 50px rgba(255, 0, 85, 0.1)',
              transition: 'all 0.5s ease',
            }}
          >
            {/* Caution Stripes at Top */}
            <HazardStripe />

            {/* HEADER */}
            <div className="mb-8">
               <Link to="/login" className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest hover:text-white transition-colors mb-6">
                 <ArrowLeft size={12} />
                 <span>Abort Override</span>
               </Link>
               
               <div className="flex justify-between items-start">
                 <div>
                   <h1 className="text-white tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                     {isSuccess ? "SYSTEM RESTORED" : "EMERGENCY OVERRIDE"}
                   </h1>
                   <div className={`text-[10px] font-mono uppercase tracking-[0.2em] flex items-center gap-2 mt-2 ${isSuccess ? 'text-emerald-500' : 'text-rose-500'}`}>
                     {isSuccess ? <Zap size={10} /> : <AlertTriangle size={10} />}
                     <span>{isSuccess ? "POWER FLUSH COMPLETE" : "LOCKOUT PROTOCOL ACTIVE"}</span>
                   </div>
                 </div>
                 <NexusCanonLogo variant="icon" size="sm" />
               </div>
            </div>

            {/* SUCCESS STATE */}
            {isSuccess ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                  <Power size={32} className="text-emerald-500" />
                </div>
                <p className="text-slate-400 text-sm mb-6">
                  Reset frequency transmitted to: <br/>
                  <span className="text-emerald-400 font-mono">{email}</span>
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-4 bg-emerald-500 text-black uppercase tracking-widest text-xs hover:bg-emerald-400 transition-colors font-mono"
                  style={{ letterSpacing: '0.2em' }}
                >
                  Return to Console
                </button>
              </motion.div>
            ) : (
              /* FORM STATE */
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-rose-500/5 border border-rose-500/20 p-4 flex gap-3 items-start">
                  <ShieldAlert className="text-rose-500 shrink-0 mt-0.5" size={16} />
                  <p className="text-[11px] text-rose-200/80 leading-relaxed">
                    WARNING: Manual override will flush current credentials. Authorization link will be transmitted via secure channel.
                  </p>
                </div>

                <div className="group relative">
                   <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 block" style={{ letterSpacing: '0.2em' }}>
                     Target Designation (Email)
                   </label>
                   <input 
                     type="email" 
                     required
                     value={email}
                     onChange={(e) => {
                       setEmail(e.target.value);
                       setSystemState(e.target.value.length > 0 ? 'charging' : 'idle');
                     }}
                     placeholder="OPERATOR@NEXUS.COM"
                     className="w-full bg-black border border-white/10 text-white p-4 text-sm font-mono focus:outline-none focus:border-rose-500/50 transition-all focus:bg-rose-500/5"
                   />
                   {/* Voltage Indicator Bar */}
                   <div className="h-1 bg-[#111] mt-1 overflow-hidden relative">
                     <motion.div 
                       className="h-full bg-rose-500"
                       initial={{ width: '0%' }}
                       animate={{ width: email.length > 0 ? '100%' : '0%' }}
                       transition={{ duration: 0.5 }}
                     />
                     {/* Static interference */}
                     <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')" }} />
                   </div>
                </div>

                <button
                  type="submit"
                  disabled={systemState === 'discharging' || email.length === 0}
                  className="w-full group relative overflow-hidden"
                >
                   <div className={`
                     relative z-10 w-full py-5 flex items-center justify-center gap-3 
                     text-xs font-mono uppercase tracking-[0.2em] border-2 transition-all duration-100
                     ${systemState === 'discharging' 
                       ? 'bg-white text-black border-white' 
                       : 'bg-transparent border-rose-600 text-rose-500 hover:bg-rose-600 hover:text-black'}
                   `} style={{ letterSpacing: '0.2em' }}>
                     {systemState === 'discharging' ? (
                       <>
                         <Zap className="animate-pulse" size={14} fill="currentColor" />
                         <span>Discharging...</span>
                       </>
                     ) : (
                       <>
                         <span>Engage Override</span>
                       </>
                     )}
                   </div>
                </button>
              </form>
            )}

            {/* FOOTER NAVIGATION */}
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-xs font-mono uppercase tracking-widest">
              <Link 
                to="/login" 
                className="flex items-center gap-2 transition-colors hover:text-orange-400"
                style={{ color: '#666666', letterSpacing: '0.2em' }}
              >
                <ArrowLeft size={12} />
                <span>Back to Login</span>
              </Link>
              <div style={{ color: '#444444' }}>
                REG-03
              </div>
            </div>

            {/* TECHNICAL FOOTER */}
            <div className="mt-4 text-center text-xs font-mono uppercase tracking-widest" style={{ color: '#333333', letterSpacing: '0.2em' }}>
              <div>Auth Protocol: Override</div>
            </div>

            {/* FUSE BOX LABELS */}
            <div className="absolute bottom-2 right-2 text-[8px] font-mono text-[#333] uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              SERIES-9 BREAKER
            </div>
            
            {/* Screw Heads (Visual Detail) */}
            <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-[#222] flex items-center justify-center"><div className="w-full h-[1px] bg-[#111] rotate-45" /></div>
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#222] flex items-center justify-center"><div className="w-full h-[1px] bg-[#111] rotate-12" /></div>
            <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-[#222] flex items-center justify-center"><div className="w-full h-[1px] bg-[#111] rotate-90" /></div>
            <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-[#222] flex items-center justify-center"><div className="w-full h-[1px] bg-[#111] rotate-0" /></div>

          </div>
        </motion.div>

      </div>
    </EngineProvider>
  );
};
