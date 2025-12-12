// ============================================================================
// FORENSIC HEADER - Terminal-style simulation header
// ============================================================================

import { Activity } from 'lucide-react';

interface ForensicHeaderProps {
  title?: string;
  subtitle?: string;
  legacyStatus?: string;
  nexusStatus?: string;
}

export const ForensicHeader = ({
  title = 'Structural',
  subtitle = 'Divergence.',
  legacyStatus = 'DEGRADING',
  nexusStatus = 'OPTIMAL',
}: ForensicHeaderProps) => {
  return (
    <div className="w-full border-b border-nexus-structure pb-8 mb-16 flex justify-between items-end">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-nexus-green/80">
          <Activity className="w-4 h-4 animate-pulse" />
          <span className="text-[10px] font-mono tracking-widest uppercase">
            Live Simulation // SEQ_ID: {Math.random().toString(36).substring(7).toUpperCase()}
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl font-medium tracking-tighter text-white">
          {title} <span className="text-nexus-noise">{subtitle}</span>
        </h2>
      </div>

      <div className="hidden md:flex flex-col items-end gap-2 text-right">
        <div className="text-[10px] font-mono text-nexus-noise tracking-widest uppercase">
          System Integrity Monitor
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-mono text-red-400">LEGACY: {legacyStatus}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-nexus-green" />
            <span className="text-xs font-mono text-nexus-green">NEXUS: {nexusStatus}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

