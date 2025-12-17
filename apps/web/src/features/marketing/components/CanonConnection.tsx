import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Database, ShieldCheck, Lock, Search } from 'lucide-react';
import { NexusIcon } from '@/components/icons/NexusIcon';

const DATA_ASSETS = [
  { id: 'src_1', label: 'SALES PIPELINE', source: 'SALESFORCE', connectsTo: 'std_1' },
  { id: 'src_2', label: 'BILLING DATA', source: 'NETSUITE', connectsTo: 'std_1' },
  { id: 'src_3', label: 'INVENTORY FEED', source: 'SAP S/4', connectsTo: 'std_2' },
  { id: 'src_4', label: 'GENERAL LEDGER', source: 'ORACLE', connectsTo: 'std_4' },
];

const STANDARDS = [
  { id: 'std_1', label: 'IFRS 15', sub: 'REV. RECOGNITION', risk: 'Prevent Early Recognition' },
  { id: 'std_2', label: 'IAS 2', sub: 'INVENTORY VAL.', risk: 'Stop Write-offs' },
  { id: 'std_3', label: 'COSO', sub: 'INTERNAL CONTROLS', risk: 'Fraud Prevention' },
  { id: 'std_4', label: 'SOX 404', sub: 'COMPLIANCE TEST', risk: 'Audit Failure' },
];

export const CanonConnection = ({ isCrystallized }: { isCrystallized: boolean }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 300);
  }, []);

  const isPathActive = (type: 'left' | 'right', id: string) => {
    if (!hoveredId) return false;
    if (hoveredId === id) return true;
    if (type === 'left') return DATA_ASSETS.find((a) => a.id === id)?.connectsTo === hoveredId;
    if (type === 'right') return DATA_ASSETS.find((a) => a.id === hoveredId)?.connectsTo === id;
    return false;
  };

  return (
    <div className="relative w-full py-layout-xl">
      {/* Stage Labels */}
      <div className="grid grid-cols-3 gap-layout-lg mb-layout-2xl max-w-6xl mx-auto px-layout-lg">
        <div className="text-center">
          <p className="text-subheading text-white font-light mb-2">Reveal</p>
          <p className="text-micro text-primary font-mono uppercase tracking-widest">Ingestion</p>
        </div>
        <div className="text-center">
          <p className="text-subheading text-white font-light mb-2">Lock</p>
          <p className="text-micro text-primary font-mono uppercase tracking-widest">
            Logic Core
          </p>
        </div>
        <div className="text-center">
          <p className="text-subheading text-white font-light mb-2">Trace</p>
          <p className="text-micro text-primary font-mono uppercase tracking-widest">
            Governance
          </p>
        </div>
      </div>

      {/* BENTO BOX GRID - Everything scales together */}
      <div className="max-w-6xl mx-auto px-layout-lg">
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-layout-sm items-center">
          {/* === COLUMN 1: SOURCE CARDS === */}
          <div className="flex flex-col gap-layout-sm">
            {DATA_ASSETS.map((asset, i) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, x: -20 }}
                animate={isLoaded ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.1 }}
                onMouseEnter={() => setHoveredId(asset.id)}
                onMouseLeave={() => setHoveredId(null)}
                whileHover={{ x: 5 }}
                className={`
                  p-layout-md rounded-r-xl border-l-2 cursor-pointer transition-all duration-300
                  ${hoveredId === asset.id || isPathActive('left', asset.id)
                    ? 'bg-surface-hover border-l-status-warning shadow-[20px_0_40px_rgba(245,158,11,0.1)]'
                    : 'bg-surface-subtle border-l-border-subtle hover:border-l-status-warning/50 hover:bg-surface-hover'
                  }
                `}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <motion.div
                      className={`text-sm font-bold tracking-wide ${hoveredId === asset.id ? 'text-white' : 'text-text-secondary'}`}
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
                    <div className="text-micro text-text-tertiary font-mono mt-1 tracking-widest uppercase">
                      {asset.source}
                    </div>
                  </div>
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${hoveredId === asset.id ? 'bg-status-warning/10 text-status-warning' : 'bg-white/5 text-text-tertiary'}`}
                  >
                    {hoveredId === asset.id ? (
                      <Search className="w-3 h-3" />
                    ) : (
                      <Database className="w-3 h-3" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* === COLUMN 2: LEFT CONNECTORS === */}
          <div className="flex flex-col items-center justify-center h-full gap-layout-sm -mx-2">
            {DATA_ASSETS.map((asset, i) => (
              <div key={i} className="h-[76px] flex items-center">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={isLoaded ? { scaleX: 1 } : {}}
                  transition={{ delay: i * 0.1, duration: 0.8 }}
                  className={`h-[2px] w-12 origin-left transition-all duration-300 ${isPathActive('left', asset.id)
                    ? 'bg-gradient-to-r from-status-warning to-status-warning/50 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                    : 'bg-gradient-to-r from-zinc-700 to-zinc-800'
                    }`}
                  style={{
                    boxShadow: isPathActive('left', asset.id)
                      ? '0 0 8px rgba(245,158,11,0.6)'
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
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Gravity Well */}
              <div className="absolute inset-0 bg-black/80 blur-3xl rounded-full" />

              {/* Outer Ring */}
              <div className="absolute inset-0 border border-zinc-800/50 rounded-full" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 border border-t-primary/30 border-r-transparent border-b-primary/10 border-l-transparent rounded-full"
              />

              {/* Inner Ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-12 border border-dashed border-zinc-700/50 rounded-full"
              />

              {/* Logo Core */}
              <div className="relative z-20 scale-125 cursor-pointer group">
                <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full group-hover:bg-primary/10 transition-all duration-500" />

                <motion.div
                  animate={
                    hoveredId
                      ? {
                        scale: [1, 1.05, 1],
                        filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'],
                      }
                      : {}
                  }
                  transition={{ duration: 0.5, repeat: hoveredId ? Infinity : 0 }}
                >
                  <NexusIcon size="lg" />
                </motion.div>
              </div>

              {/* LOCK Gate (Left) */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-30">
                <div
                  className={`w-10 h-10 bg-black border rounded-full flex items-center justify-center transition-all duration-300 ${hoveredId &&
                    DATA_ASSETS.some((a) => a.id === hoveredId || isPathActive('left', a.id))
                    ? 'border-status-warning shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-110'
                    : 'border-border-subtle'
                    }`}
                >
                  <Lock className={`w-4 h-4 ${hoveredId ? 'text-status-warning' : 'text-text-tertiary'}`} />
                </div>
              </div>

              {/* VALIDATE Gate (Right) */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-30">
                <div
                  className={`w-10 h-10 bg-black border rounded-full flex items-center justify-center transition-all duration-300 ${hoveredId &&
                    STANDARDS.some((s) => s.id === hoveredId || isPathActive('right', s.id))
                    ? 'border-primary shadow-[0_0_20px_rgba(74,144,226,0.4)] scale-110'
                    : 'border-border-subtle'
                    }`}
                >
                  <ShieldCheck
                    className={`w-4 h-4 ${hoveredId ? 'text-primary' : 'text-text-tertiary'}`}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* === COLUMN 4: RIGHT CONNECTORS === */}
          <div className="flex flex-col items-center justify-center h-full gap-4 -mx-2">
            {STANDARDS.map((std, i) => (
              <div key={i} className="h-[76px] flex items-center">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={isLoaded ? { scaleX: 1 } : {}}
                  transition={{ delay: i * 0.1 + 0.4, duration: 0.8 }}
                  className={`h-[2px] w-12 origin-right transition-all duration-300 ${isPathActive('right', std.id)
                    ? 'bg-gradient-to-l from-primary to-primary/50 shadow-[0_0_8px_rgba(74,144,226,0.6)]'
                    : 'bg-gradient-to-l from-zinc-700 to-zinc-800'
                    }`}
                  style={{
                    boxShadow: isPathActive('right', std.id)
                      ? '0 0 8px rgba(74,144,226,0.6)'
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
                className={`
                  p-4 rounded-l-xl border-r-2 cursor-pointer transition-all duration-300 text-right relative
                  ${hoveredId === std.id || isPathActive('right', std.id)
                    ? 'bg-surface-hover border-r-primary shadow-[-20px_0_40px_rgba(74,144,226,0.1)]'
                    : 'bg-surface-subtle border-r-border-subtle hover:border-r-primary/50 hover:bg-surface-hover'
                  }
                `}
              >
                <div className="flex justify-between items-start flex-row-reverse gap-3">
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-bold tracking-wide ${hoveredId === std.id ? 'text-white' : 'text-text-secondary'}`}
                    >
                      {std.label}
                    </div>
                    <div className="text-micro text-text-tertiary font-mono mt-1 tracking-widest uppercase">
                      {std.sub}
                    </div>
                  </div>
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${hoveredId === std.id ? 'bg-primary/10 text-primary' : 'bg-white/5 text-text-tertiary'}`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                  </div>
                </div>

                {/* Risk Indicator (Inline, no tooltip overflow) */}
                {hoveredId === std.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 pt-3 border-t border-primary/20"
                  >
                    <div className="text-micro font-mono text-primary uppercase tracking-widest mb-1">
                      Risk Prevention
                    </div>
                    <div className="text-small text-text-secondary">{std.risk}</div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
