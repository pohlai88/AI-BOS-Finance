// ============================================================================
// REG_03 - RESET PASSWORD PAGE [EMERGENCY OVERRIDE]
// Architecture: High Voltage Circuit Breaker
// Metaphor: "Manual Override" - User is bypassing a locked system
// Visuals: Hazard stripes, electrical arcs, fuse box aesthetics
// ============================================================================

import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Zap, Power, ShieldAlert } from 'lucide-react'
import { motion, useMotionValue } from 'motion/react'
import { NexusIcon } from '@/components/nexus/NexusIcon'
import {
  EngineProvider,
  HighVoltageSystem,
} from '../components/auth/IntegratedEngine'

// --- SUB-COMPONENT: HAZARD STRIPE ---
const HazardStripe = () => (
  <div
    className="mb-6 h-2 w-full opacity-80"
    style={{
      backgroundImage:
        'repeating-linear-gradient(45deg, #000, #000 10px, #FFD700 10px, #FFD700 20px)',
    }}
  />
)

export const ResetPasswordPage = () => {
  const navigate = useNavigate()

  // SYSTEM STATE
  const [email, setEmail] = useState('')
  const [systemState, setSystemState] = useState<
    'idle' | 'charging' | 'discharging'
  >('idle')
  const [isSuccess, setIsSuccess] = useState(false)

  // MOUSE PARALLAX
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSystemState('discharging') // Trigger the arc blast

    // Simulate reset process
    await new Promise((resolve) => setTimeout(resolve, 3000))

    setIsSuccess(true)
    setSystemState('idle') // Calm down
  }

  return (
    <EngineProvider
      state={systemState === 'idle' ? 'idle' : 'revving'}
      shakeX={useMotionValue(0)}
      shakeY={useMotionValue(0)}
    >
      <div
        className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black"
        onMouseMove={handleMouseMove}
      >
        {/* --- LAYER 1: HIGH VOLTAGE BACKGROUND --- */}
        <HighVoltageSystem state={systemState} />

        {/* CRT Scanlines */}
        <div
          className="pointer-events-none absolute inset-0 z-50 opacity-10"
          style={{
            background:
              'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
            backgroundSize: '100% 2px, 3px 100%',
          }}
        />

        {/* Grid Background */}
        <div
          className="opacity-8 absolute inset-0"
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
            className="relative overflow-hidden border-2 bg-[#0a0a0a] p-8 shadow-2xl"
            style={{
              borderColor: isSuccess ? '#28E7A2' : '#333',
              boxShadow: isSuccess
                ? '0 0 50px rgba(40, 231, 162, 0.2)'
                : '0 0 50px rgba(255, 0, 85, 0.1)',
              transition: 'all 0.5s ease',
            }}
          >
            {/* Caution Stripes at Top */}
            <HazardStripe />

            {/* HEADER */}
            <div className="mb-8">
              <Link
                to="/login"
                className="mb-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-slate-500 transition-colors hover:text-white"
              >
                <ArrowLeft size={12} />
                <span>Abort Override</span>
              </Link>

              <div className="flex items-start justify-between">
                <div>
                  <h1
                    className="tracking-tight text-white"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    {isSuccess ? 'SYSTEM RESTORED' : 'EMERGENCY OVERRIDE'}
                  </h1>
                  <div
                    className={`mt-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] ${isSuccess ? 'text-emerald-500' : 'text-rose-500'}`}
                  >
                    {isSuccess ? (
                      <Zap size={10} />
                    ) : (
                      <AlertTriangle size={10} />
                    )}
                    <span>
                      {isSuccess
                        ? 'POWER FLUSH COMPLETE'
                        : 'LOCKOUT PROTOCOL ACTIVE'}
                    </span>
                  </div>
                </div>
                <NexusIcon size="sm" />
              </div>
            </div>

            {/* SUCCESS STATE */}
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-8 text-center"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
                  <Power size={32} className="text-emerald-500" />
                </div>
                <p className="mb-6 text-sm text-slate-400">
                  Reset frequency transmitted to: <br />
                  <span className="font-mono text-emerald-400">{email}</span>
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-emerald-500 py-4 font-mono text-xs uppercase tracking-widest text-black transition-colors hover:bg-emerald-400"
                  style={{ letterSpacing: '0.2em' }}
                >
                  Return to Console
                </button>
              </motion.div>
            ) : (
              /* FORM STATE */
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-start gap-3 border border-rose-500/20 bg-rose-500/5 p-4">
                  <ShieldAlert
                    className="mt-0.5 shrink-0 text-rose-500"
                    size={16}
                  />
                  <p className="text-[11px] leading-relaxed text-rose-200/80">
                    WARNING: Manual override will flush current credentials.
                    Authorization link will be transmitted via secure channel.
                  </p>
                </div>

                <div className="group relative">
                  <label
                    className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-slate-500"
                    style={{ letterSpacing: '0.2em' }}
                  >
                    Target Designation (Email)
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setSystemState(
                        e.target.value.length > 0 ? 'charging' : 'idle'
                      )
                    }}
                    placeholder="OPERATOR@NEXUS.COM"
                    className="w-full border border-white/10 bg-black p-4 font-mono text-sm text-white transition-all focus:border-rose-500/50 focus:bg-rose-500/5 focus:outline-none"
                  />
                  {/* Voltage Indicator Bar */}
                  <div className="relative mt-1 h-1 overflow-hidden bg-[#111]">
                    <motion.div
                      className="h-full bg-rose-500"
                      initial={{ width: '0%' }}
                      animate={{ width: email.length > 0 ? '100%' : '0%' }}
                      transition={{ duration: 0.5 }}
                    />
                    {/* Static interference */}
                    <div
                      className="absolute inset-0 opacity-50"
                      style={{
                        backgroundImage:
                          "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')",
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={systemState === 'discharging' || email.length === 0}
                  className="group relative w-full overflow-hidden"
                >
                  <div
                    className={`relative z-10 flex w-full items-center justify-center gap-3 border-2 py-5 font-mono text-xs uppercase tracking-[0.2em] transition-all duration-100 ${
                      systemState === 'discharging'
                        ? 'border-white bg-white text-black'
                        : 'border-rose-600 bg-transparent text-rose-500 hover:bg-rose-600 hover:text-black'
                    } `}
                    style={{ letterSpacing: '0.2em' }}
                  >
                    {systemState === 'discharging' ? (
                      <>
                        <Zap
                          className="animate-pulse"
                          size={14}
                          fill="currentColor"
                        />
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
            <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6 font-mono text-xs uppercase tracking-widest">
              <Link
                to="/login"
                className="flex items-center gap-2 transition-colors hover:text-orange-400"
                style={{ color: '#666666', letterSpacing: '0.2em' }}
              >
                <ArrowLeft size={12} />
                <span>Back to Login</span>
              </Link>
              <div style={{ color: '#444444' }}>REG-03</div>
            </div>

            {/* TECHNICAL FOOTER */}
            <div
              className="mt-4 text-center font-mono text-xs uppercase tracking-widest"
              style={{ color: '#333333', letterSpacing: '0.2em' }}
            >
              <div>Auth Protocol: Override</div>
            </div>

            {/* FUSE BOX LABELS */}
            <div
              className="absolute bottom-2 right-2 font-mono text-[8px] uppercase tracking-widest text-[#333]"
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
              }}
            >
              SERIES-9 BREAKER
            </div>

            {/* Screw Heads (Visual Detail) */}
            <div className="absolute left-2 top-2 flex h-2 w-2 items-center justify-center rounded-full bg-[#222]">
              <div className="h-[1px] w-full rotate-45 bg-[#111]" />
            </div>
            <div className="absolute right-2 top-2 flex h-2 w-2 items-center justify-center rounded-full bg-[#222]">
              <div className="h-[1px] w-full rotate-12 bg-[#111]" />
            </div>
            <div className="absolute bottom-2 left-2 flex h-2 w-2 items-center justify-center rounded-full bg-[#222]">
              <div className="h-[1px] w-full rotate-90 bg-[#111]" />
            </div>
            <div className="absolute bottom-2 right-2 flex h-2 w-2 items-center justify-center rounded-full bg-[#222]">
              <div className="h-[1px] w-full rotate-0 bg-[#111]" />
            </div>
          </div>
        </motion.div>
      </div>
    </EngineProvider>
  )
}
