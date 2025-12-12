import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Database, ShieldCheck, Lock, Search } from 'lucide-react'
import { NexusIcon } from '@/components/nexus/NexusIcon'

const DATA_ASSETS = [
  {
    id: 'src_1',
    label: 'SALES PIPELINE',
    source: 'SALESFORCE',
    connectsTo: 'std_1',
  },
  {
    id: 'src_2',
    label: 'BILLING DATA',
    source: 'NETSUITE',
    connectsTo: 'std_1',
  },
  {
    id: 'src_3',
    label: 'INVENTORY FEED',
    source: 'SAP S/4',
    connectsTo: 'std_2',
  },
  {
    id: 'src_4',
    label: 'GENERAL LEDGER',
    source: 'ORACLE',
    connectsTo: 'std_4',
  },
]

const STANDARDS = [
  {
    id: 'std_1',
    label: 'IFRS 15',
    sub: 'REV. RECOGNITION',
    risk: 'Prevent Early Recognition',
  },
  {
    id: 'std_2',
    label: 'IAS 2',
    sub: 'INVENTORY VAL.',
    risk: 'Stop Write-offs',
  },
  {
    id: 'std_3',
    label: 'COSO',
    sub: 'INTERNAL CONTROLS',
    risk: 'Fraud Prevention',
  },
  {
    id: 'std_4',
    label: 'SOX 404',
    sub: 'COMPLIANCE TEST',
    risk: 'Audit Failure',
  },
]

export const CanonConnection = ({
  isCrystallized,
}: {
  isCrystallized: boolean
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 300)
  }, [])

  const isPathActive = (type: 'left' | 'right', id: string) => {
    if (!hoveredId) return false
    if (hoveredId === id) return true
    if (type === 'left')
      return DATA_ASSETS.find((a) => a.id === id)?.connectsTo === hoveredId
    if (type === 'right')
      return DATA_ASSETS.find((a) => a.id === hoveredId)?.connectsTo === id
    return false
  }

  return (
    <div className="relative w-full py-16">
      {/* Stage Labels */}
      <div className="mx-auto mb-12 grid max-w-6xl grid-cols-3 gap-8 px-8">
        <div className="text-center">
          <p className="mb-2 text-3xl font-light text-white">Reveal</p>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-500">
            Ingestion
          </p>
        </div>
        <div className="text-center">
          <p className="mb-2 text-3xl font-light text-white">Lock</p>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-500">
            Logic Core
          </p>
        </div>
        <div className="text-center">
          <p className="mb-2 text-3xl font-light text-white">Trace</p>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-500">
            Governance
          </p>
        </div>
      </div>

      {/* BENTO BOX GRID - Everything scales together */}
      <div className="mx-auto max-w-6xl px-8">
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-4">
          {/* === COLUMN 1: SOURCE CARDS === */}
          <div className="flex flex-col gap-4">
            {DATA_ASSETS.map((asset, i) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, x: -20 }}
                animate={isLoaded ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.1 }}
                onMouseEnter={() => setHoveredId(asset.id)}
                onMouseLeave={() => setHoveredId(null)}
                whileHover={{ x: 5 }}
                className={`cursor-pointer rounded-r-xl border-l-2 p-4 transition-all duration-300 ${
                  hoveredId === asset.id || isPathActive('left', asset.id)
                    ? 'border-l-red-500 bg-zinc-900/80 shadow-[20px_0_40px_rgba(239,68,68,0.1)]'
                    : 'border-l-zinc-700 bg-zinc-950/30 hover:border-l-red-500/50 hover:bg-zinc-900/50'
                } `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <motion.div
                      className={`text-sm font-bold tracking-wide ${hoveredId === asset.id ? 'text-white' : 'text-zinc-400'}`}
                      animate={
                        hoveredId === asset.id
                          ? {
                              x: [0, 2, -2, 0],
                            }
                          : {}
                      }
                      transition={{
                        duration: 0.3,
                        repeat: hoveredId === asset.id ? Infinity : 0,
                        repeatDelay: 0.5,
                      }}
                    >
                      {asset.label}
                    </motion.div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                      {asset.source}
                    </div>
                  </div>
                  <div
                    className={`shrink-0 rounded-lg p-1.5 ${hoveredId === asset.id ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-zinc-600'}`}
                  >
                    {hoveredId === asset.id ? (
                      <Search className="h-3 w-3" />
                    ) : (
                      <Database className="h-3 w-3" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* === COLUMN 2: LEFT CONNECTORS === */}
          <div className="-mx-2 flex h-full flex-col items-center justify-center gap-4">
            {DATA_ASSETS.map((asset, i) => (
              <div key={i} className="flex h-[76px] items-center">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={isLoaded ? { scaleX: 1 } : {}}
                  transition={{ delay: i * 0.1, duration: 0.8 }}
                  className={`h-[2px] w-12 origin-left transition-all duration-300 ${
                    isPathActive('left', asset.id)
                      ? 'bg-gradient-to-r from-red-500 to-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                      : 'bg-gradient-to-r from-zinc-700 to-zinc-800'
                  }`}
                  style={{
                    boxShadow: isPathActive('left', asset.id)
                      ? '0 0 8px rgba(239,68,68,0.6)'
                      : 'none',
                  }}
                />
              </div>
            ))}
          </div>

          {/* === COLUMN 3: REACTOR CORE === */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={isLoaded ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 1, type: 'spring' }}
            className="relative flex items-center justify-center"
            style={{ height: '400px' }}
          >
            <div className="relative flex h-64 w-64 items-center justify-center">
              {/* Gravity Well */}
              <div className="absolute inset-0 rounded-full bg-black/80 blur-3xl" />

              {/* Outer Ring */}
              <div className="absolute inset-0 rounded-full border border-zinc-800/50" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border border-b-emerald-500/10 border-l-transparent border-r-transparent border-t-emerald-500/30"
              />

              {/* Inner Ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-12 rounded-full border border-dashed border-zinc-700/50"
              />

              {/* Logo Core */}
              <div className="group relative z-20 scale-125 cursor-pointer">
                <div className="absolute inset-0 rounded-full bg-emerald-500/5 blur-xl transition-all duration-500 group-hover:bg-emerald-500/10" />

                <motion.div
                  animate={
                    hoveredId
                      ? {
                          scale: [1, 1.05, 1],
                          filter: [
                            'brightness(1)',
                            'brightness(1.3)',
                            'brightness(1)',
                          ],
                        }
                      : {}
                  }
                  transition={{
                    duration: 0.5,
                    repeat: hoveredId ? Infinity : 0,
                  }}
                >
                  <NexusIcon size="lg" />
                </motion.div>
              </div>

              {/* LOCK Gate (Left) */}
              <div className="absolute left-0 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border bg-black transition-all duration-300 ${
                    hoveredId &&
                    DATA_ASSETS.some(
                      (a) => a.id === hoveredId || isPathActive('left', a.id)
                    )
                      ? 'scale-110 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                      : 'border-zinc-800'
                  }`}
                >
                  <Lock
                    className={`h-4 w-4 ${hoveredId ? 'text-red-500' : 'text-zinc-600'}`}
                  />
                </div>
              </div>

              {/* VALIDATE Gate (Right) */}
              <div className="absolute right-0 top-1/2 z-30 -translate-y-1/2 translate-x-1/2">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border bg-black transition-all duration-300 ${
                    hoveredId &&
                    STANDARDS.some(
                      (s) => s.id === hoveredId || isPathActive('right', s.id)
                    )
                      ? 'scale-110 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                      : 'border-zinc-800'
                  }`}
                >
                  <ShieldCheck
                    className={`h-4 w-4 ${hoveredId ? 'text-emerald-500' : 'text-zinc-600'}`}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* === COLUMN 4: RIGHT CONNECTORS === */}
          <div className="-mx-2 flex h-full flex-col items-center justify-center gap-4">
            {STANDARDS.map((std, i) => (
              <div key={i} className="flex h-[76px] items-center">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={isLoaded ? { scaleX: 1 } : {}}
                  transition={{ delay: i * 0.1 + 0.4, duration: 0.8 }}
                  className={`h-[2px] w-12 origin-right transition-all duration-300 ${
                    isPathActive('right', std.id)
                      ? 'bg-gradient-to-l from-emerald-500 to-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                      : 'bg-gradient-to-l from-zinc-700 to-zinc-800'
                  }`}
                  style={{
                    boxShadow: isPathActive('right', std.id)
                      ? '0 0 8px rgba(16,185,129,0.6)'
                      : 'none',
                  }}
                />
              </div>
            ))}
          </div>

          {/* === COLUMN 5: STANDARD CARDS === */}
          <div className="flex flex-col gap-4">
            {STANDARDS.map((std, i) => (
              <motion.div
                key={std.id}
                initial={{ opacity: 0, x: 20 }}
                animate={isLoaded ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.1 + 0.4 }}
                onMouseEnter={() => setHoveredId(std.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`relative cursor-pointer rounded-l-xl border-r-2 p-4 text-right transition-all duration-300 ${
                  hoveredId === std.id || isPathActive('right', std.id)
                    ? 'border-r-emerald-500 bg-zinc-900/80 shadow-[-20px_0_40px_rgba(16,185,129,0.1)]'
                    : 'border-r-zinc-700 bg-zinc-950/30 hover:border-r-emerald-500/50 hover:bg-zinc-900/50'
                } `}
              >
                <div className="flex flex-row-reverse items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-sm font-bold tracking-wide ${hoveredId === std.id ? 'text-white' : 'text-zinc-400'}`}
                    >
                      {std.label}
                    </div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                      {std.sub}
                    </div>
                  </div>
                  <div
                    className={`shrink-0 rounded-lg p-1.5 ${hoveredId === std.id ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-zinc-600'}`}
                  >
                    <ShieldCheck className="h-3 w-3" />
                  </div>
                </div>

                {/* Risk Indicator (Inline, no tooltip overflow) */}
                {hoveredId === std.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 border-t border-emerald-500/20 pt-3"
                  >
                    <div className="mb-1 font-mono text-[9px] uppercase tracking-widest text-emerald-500">
                      Risk Prevention
                    </div>
                    <div className="text-xs text-zinc-400">{std.risk}</div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
