// ============================================================================
// META NAV TRIGGER - Floating Access Button
// Forensic-style trigger button for META side navigation
// ============================================================================

import { Menu } from 'lucide-react';

interface MetaNavTriggerProps {
  onClick: () => void;
  className?: string;
}

export function MetaNavTrigger({ onClick, className = '' }: MetaNavTriggerProps) {
  return (
    <button
      onClick={onClick}
      // Default: Top Right (Tools/Utility Zone) - Locked to grid coordinates
      // top-[72px] clears the AppShell header (approx 64px) + 8px gap
      // right-6 aligns with standard page padding
      className={`group fixed right-6 top-[72px] z-[100] border border-[#333] hover:border-[#28E7A2] transition-all bg-[#000000] ${className}`}
    >
      {/* Pulsing Red Alarm Effect - Radar Style */}
      <div
        className="px-4 py-3 flex items-center gap-3 bg-[#0A0A0A] relative overflow-hidden z-50"
        style={{
          animation: 'radarPulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }}
      >
        {/* Red Sweep Overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at center, rgba(255, 50, 50, 0.3) 0%, rgba(255, 50, 50, 0) 70%)',
            animation: 'radarPulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />

        <Menu className="w-4 h-4 text-[#666] group-hover:text-[#28E7A2] transition-colors relative z-10" />
        <div className="flex flex-col gap-0.5 relative z-10">
          <span className="font-mono text-[12px] text-white tracking-wide">META</span>
          <span className="font-mono text-[10px] text-[#666] uppercase tracking-wider">Nav</span>
        </div>
      </div>

      {/* Corner Crosshairs */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#28E7A2]/30 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#28E7A2]/30 pointer-events-none" />

      {/* CSS Keyframes */}
      <style>{`
        @keyframes radarPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(255, 50, 50, 0);
          }
          50% {
            box-shadow: 
              0 0 20px 2px rgba(255, 50, 50, 0.6),
              0 0 40px 4px rgba(255, 50, 50, 0.3),
              inset 0 0 20px 2px rgba(255, 50, 50, 0.2);
          }
        }
      `}</style>
    </button>
  );
}
