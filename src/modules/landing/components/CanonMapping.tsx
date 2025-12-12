import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  FileSpreadsheet,
  PackageCheck,
  FileText,
  ArrowRight,
  ShieldCheck,
  Lock,
  Link2,
} from 'lucide-react'
import { NexusIcon } from '@/components/nexus/NexusIcon'

export const CanonMapping = () => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [countdown, setCountdown] = useState(3)

  // Auto-crystallization timer (counts down to lock)
  useEffect(() => {
    if (isLocked || countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsLocked(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isLocked, countdown])

  // Auto-reset timer (after crystallization, wait 5s then restart the cycle)
  useEffect(() => {
    if (!isLocked) return

    const resetTimer = setTimeout(() => {
      setIsLocked(false)
      setCountdown(3) // Reset countdown to 3 seconds
    }, 5000) // Wait 5 seconds in locked state before restarting

    return () => clearTimeout(resetTimer)
  }, [isLocked])

  const animationState = hoveredNode || isLocked ? 'paused' : 'running'

  return (
    // REMOVED: Border and solid background. ADDED: Mask-image for "Floating in Void" feel.
    <motion.div
      animate={isLocked ? { x: [0, -5, 5, -5, 5, 0], y: [0, 2, -2, 0] } : {}}
      transition={{ duration: 0.4, ease: 'easeInOut' }} // THE SHOCKWAVE
      className="font-inter perspective-1000 relative mx-auto flex h-[700px] w-full max-w-6xl items-center justify-center overflow-hidden"
      style={{
        maskImage:
          'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
      }}
    >
      {/* Infinite Grid fading into darkness */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* Crystallization Shockwave Ring */}
      <AnimatePresence>
        {isLocked && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, borderWidth: '0px' }}
            animate={{ scale: 1.5, opacity: [0, 0.5, 0], borderWidth: '20px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 z-0 rounded-full border-emerald-500/30"
          />
        )}
      </AnimatePresence>

      {/* --- CENTRAL SUN: THE NEXUS ENGINE --- */}
      <div
        className="group absolute z-20 flex cursor-pointer flex-col items-center justify-center"
        onClick={() => setIsLocked(!isLocked)}
      >
        {!isLocked && (
          <div className="absolute inset-0 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full bg-emerald-500/10" />
        )}

        <motion.div
          animate={
            isLocked
              ? {
                  borderColor: '#10b981',
                  boxShadow: '0 0 80px rgba(16,185,129,0.4)', // Stronger Glow
                  scale: 1,
                }
              : {
                  scale: [1, 1.02, 1],
                }
          }
          transition={
            !isLocked
              ? { duration: 4, repeat: Infinity, ease: 'easeInOut' }
              : {}
          }
          className="relative z-20 flex h-32 w-32 items-center justify-center rounded-full border-2 border-emerald-500/30 bg-[#050505] transition-all duration-300 group-hover:border-emerald-400 group-hover:shadow-[0_0_40px_rgba(16,185,129,0.2)] group-active:scale-95"
        >
          {/* The Spinners */}
          {!isLocked && (
            <>
              <div className="absolute inset-0 animate-[spin_10s_linear_infinite] rounded-full border border-emerald-500/30" />
              <div className="absolute inset-2 animate-[spin_15s_linear_infinite_reverse] rounded-full border border-dashed border-zinc-700" />
            </>
          )}

          {/* Locked State: Pulsing Rings */}
          {isLocked && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-emerald-500"
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-emerald-400"
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
            </>
          )}

          {/* The Icon */}
          <motion.div
            className="relative z-10"
            animate={
              isLocked
                ? {
                    scale: [1, 1.2, 1],
                  }
                : {}
            }
            transition={{ duration: 0.6 }}
          >
            {!isLocked ? (
              <div className="transition-transform duration-300 group-hover:scale-110">
                <NexusIcon size="lg" />
              </div>
            ) : (
              <Lock className="h-12 w-12 text-emerald-400" />
            )}
          </motion.div>
        </motion.div>

        {/* The Explicit Button Label */}
        <div
          className={`absolute -bottom-12 transition-all duration-300 ${isLocked ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'} `}
        >
          {/* Countdown Display */}
          {!isLocked && countdown > 0 && countdown < 3 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
            >
              <span className="animate-pulse font-mono text-[10px] uppercase tracking-widest text-emerald-400">
                Crystallizing in {countdown}s
              </span>
            </motion.div>
          )}

          <button
            className={`flex items-center gap-2 rounded-full border px-6 py-2 font-mono text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
              isLocked
                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                : 'border-emerald-500/50 bg-zinc-900 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:bg-emerald-500 hover:text-black'
            } `}
          >
            {isLocked ? (
              <>
                <Lock className="h-3 w-3" />
                LOCKED
              </>
            ) : (
              <>
                CRYSTALLIZE
                <ArrowRight className="h-3 w-3" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* --- ORBIT SYSTEM --- */}
      <motion.div
        className="absolute flex h-[500px] w-[500px] items-center justify-center"
        animate={isLocked ? { rotate: 0 } : { rotate: 360 }}
        transition={{
          duration: isLocked ? 0.8 : 40,
          ease: isLocked ? 'backOut' : 'linear',
          repeat: isLocked ? 0 : Infinity,
        }} // Faster snap
        style={{
          animationPlayState:
            !isLocked && animationState === 'paused' ? 'paused' : 'running',
        }}
      >
        {/* THE TETHERS (Laser Beams) */}
        <div className="pointer-events-none absolute inset-0">
          <Tether angle={0} color="emerald" active={isLocked} />
          <Tether angle={120} color="amber" active={isLocked} />
          <Tether angle={240} color="purple" active={isLocked} />
        </div>

        {/* NODE 1: PURCHASE ORDER (PO) */}
        <OrbitNode
          angle={0}
          id="PO"
          label="PURCHASE ORDER"
          sub="PO-8821"
          icon={<FileSpreadsheet className="h-5 w-5" />}
          color="emerald"
          setHovered={setHoveredNode}
          isHovered={hoveredNode === 'PO'}
          isLocked={isLocked}
          data={{
            past: { label: 'Purchase Req', val: 'Appr_#REQ-99' },
            current: { label: 'Status', val: 'OPEN - Awaiting Delivery' },
            future: { label: 'Next Step', val: 'GRN Creation (Pending)' },
            standard: 'IAS 2: Inventories',
          }}
        />

        {/* NODE 2: GOODS RECEIPT (GRN) */}
        <OrbitNode
          angle={120}
          id="GRN"
          label="GOODS RECEIPT"
          sub="GRN-PENDING"
          icon={<PackageCheck className="h-5 w-5" />}
          color="amber"
          setHovered={setHoveredNode}
          isHovered={hoveredNode === 'GRN'}
          isLocked={isLocked}
          data={{
            past: { label: 'Source PO', val: 'PO-8821' },
            current: { label: 'Status', val: 'NOT RECEIVED' },
            future: { label: 'Impact', val: 'Inventory Recognition' },
            standard: 'IFRS 15: Perf. Obligation',
          }}
        />

        {/* NODE 3: INVOICE */}
        <OrbitNode
          angle={240}
          id="INV"
          label="PURCHASE INVOICE"
          sub="INV-DRAFT"
          icon={<FileText className="h-5 w-5" />}
          color="purple"
          setHovered={setHoveredNode}
          isHovered={hoveredNode === 'INV'}
          isLocked={isLocked}
          data={{
            past: { label: 'Validation', val: 'Requires GRN Match' },
            current: { label: 'Status', val: 'BLOCKED (No GRN)' },
            future: { label: 'Payment', val: 'Hold - Net 30' },
            standard: 'IFRS 9: Fin. Liability',
          }}
        />
      </motion.div>
    </motion.div>
  )
}

// --- SUB-COMPONENTS ---

// 1. The Tether (Laser Beam)
const Tether = ({
  angle,
  color,
  active,
}: {
  angle: number
  color: string
  active: boolean
}) => {
  const colors: Record<string, string> = {
    emerald: '#10b981',
    amber: '#f59e0b',
    purple: '#a855f7',
  }
  const stroke = colors[color]

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 z-0 origin-left -translate-y-1/2"
      style={{
        transform: `rotate(${angle}deg)`,
        width: '250px', // Extended length for bigger orbit
        height: active ? '3px' : '1px',
      }}
    >
      {/* The Beam Base */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0.3 }}
        animate={
          active
            ? {
                opacity: 0.8,
                boxShadow: `0 0 20px ${stroke}, 0 0 40px ${stroke}`,
              }
            : {
                opacity: 0.3,
                boxShadow: 'none',
              }
        }
        transition={{ duration: 0.5 }}
        style={{
          backgroundColor: stroke,
          filter: 'blur(0.5px)',
        }}
      />

      {/* Moving Energy Particle */}
      {active && (
        <motion.div
          className="absolute top-0 h-full w-4 rounded-full"
          style={{
            backgroundColor: stroke,
            boxShadow: `0 0 10px ${stroke}, 0 0 20px ${stroke}`,
          }}
          animate={{
            left: ['0%', '100%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
    </div>
  )
}

// 2. The Orbit Node (Card)
const OrbitNode = ({
  angle,
  id,
  label,
  sub,
  icon,
  color,
  setHovered,
  isHovered,
  isLocked,
  data,
}: {
  angle: number
  id: string
  label: string
  sub: string
  icon: React.ReactNode
  color: string
  setHovered: (id: string | null) => void
  isHovered: boolean
  isLocked: boolean
  data: {
    past: { label: string; val: string }
    current: { label: string; val: string }
    future: { label: string; val: string }
    standard: string
  }
}) => {
  const colors: Record<string, string> = {
    emerald:
      'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-emerald-500/20',
    amber:
      'text-amber-400 border-amber-500/30 bg-amber-500/10 shadow-amber-500/20',
    purple:
      'text-purple-400 border-purple-500/30 bg-purple-500/10 shadow-purple-500/20',
  }
  const theme = colors[color]

  return (
    <div
      className="absolute left-1/2 top-1/2 flex h-0 w-0 items-center justify-center"
      style={{
        transform: `rotate(${angle}deg) translate(250px) rotate(-${angle}deg)`,
      }}
    >
      <motion.div
        className="relative"
        animate={isLocked ? { rotate: 0 } : { rotate: -360 }}
        transition={{
          duration: isLocked ? 0.8 : 40,
          ease: isLocked ? 'backOut' : 'linear',
          repeat: isLocked ? 0 : Infinity,
        }}
      >
        <motion.div
          onMouseEnter={() => setHovered(id)}
          onMouseLeave={() => setHovered(null)}
          animate={
            isLocked || isHovered
              ? { scale: 1.1, zIndex: 50 }
              : { scale: 1, zIndex: 1 }
          }
          className={`w-64 cursor-pointer overflow-hidden rounded-xl border backdrop-blur-md transition-all duration-300 ${isHovered || isLocked ? 'border-white/20 bg-zinc-950 shadow-2xl' : `bg-zinc-950/80 ${theme} border-dashed`} `}
        >
          {/* Header */}
          <div
            className={`flex items-center gap-3 border-b p-4 ${isHovered || isLocked ? 'border-white/10' : 'border-transparent'}`}
          >
            <div
              className={`rounded-lg p-2 ${isHovered || isLocked ? 'bg-white/5' : ''}`}
            >
              {icon}
            </div>
            <div>
              <div
                className={`text-xs font-bold uppercase tracking-widest ${isHovered || isLocked ? 'text-white' : ''}`}
              >
                {label}
              </div>
              <div className="mt-0.5 font-mono text-xs text-zinc-400">
                {sub}
              </div>
            </div>
            {isLocked && <Lock className="ml-auto h-4 w-4 text-emerald-500" />}
          </div>

          {/* Fact Sheet (Reveals on Hover OR Lock) */}
          <AnimatePresence>
            {(isHovered || isLocked) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-zinc-900/50"
              >
                <div className="space-y-4 p-4">
                  {/* Timeline Logic */}
                  <div className="mb-2 flex items-center justify-between font-mono text-xs tracking-wide text-zinc-500">
                    <span>ORIGIN</span>
                    <span>VALIDATION</span>
                  </div>
                  <div className="relative mb-4 h-1 overflow-hidden rounded-full bg-zinc-800">
                    <motion.div
                      className="absolute left-0 top-0 h-full bg-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1 }}
                    />
                  </div>

                  {/* Data Rows */}
                  <div className="space-y-3 text-xs">
                    <Row
                      label="ANCESTRY"
                      value={data.past.val}
                      icon={<Link2 className="h-3 w-3 text-zinc-500" />}
                    />
                    <Row
                      label="STATUS"
                      value={data.current.val}
                      highlight={
                        data.current.val.includes('OPEN') ||
                        data.current.val.includes('BLOCKED')
                      }
                      icon={<ArrowRight className="h-3 w-3 text-white" />}
                    />
                  </div>

                  {/* Footer */}
                  <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-3">
                    <div className="font-mono text-xs text-emerald-400">
                      {data.standard}
                    </div>
                    {isLocked && (
                      <div className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                        Verified
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  )
}

const Row = ({
  label,
  value,
  highlight,
  icon,
}: {
  label: string
  value: string
  highlight?: boolean
  icon: React.ReactNode
}) => (
  <div className="flex items-start gap-2">
    <div className="mt-0.5">{icon}</div>
    <div className="flex-1">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div
        className={`font-mono text-xs ${highlight ? 'font-bold text-white' : 'text-zinc-400'}`}
      >
        {value}
      </div>
    </div>
  </div>
)
