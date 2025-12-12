// ============================================================================
// META NAV TRIGGER - Floating Access Button
// Forensic-style trigger button for META side navigation
// ============================================================================

import { Menu } from 'lucide-react'

interface MetaNavTriggerProps {
  onClick: () => void
  className?: string
}

export function MetaNavTrigger({
  onClick,
  className = '',
}: MetaNavTriggerProps) {
  return (
    <button
      onClick={onClick}
      // Default: Top Right (Tools/Utility Zone) - Locked to grid coordinates
      // top-[72px] clears the AppShell header (approx 64px) + 8px gap
      // right-6 aligns with standard page padding
      className={`group fixed right-6 top-[72px] z-[100] border border-[#333] bg-[#000000] transition-all hover:border-[#28E7A2] ${className}`}
    >
      {/* Pulsing Red Alarm Effect - Radar Style */}
      <div
        className="relative z-50 flex items-center gap-3 overflow-hidden bg-[#0A0A0A] px-4 py-3"
        style={{
          animation: 'radarPulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }}
      >
        {/* Red Sweep Overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at center, rgba(255, 50, 50, 0.3) 0%, rgba(255, 50, 50, 0) 70%)',
            animation: 'radarPulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />

        <Menu className="relative z-10 h-4 w-4 text-[#666] transition-colors group-hover:text-[#28E7A2]" />
        <div className="relative z-10 flex flex-col gap-0.5">
          <span className="font-mono text-[12px] tracking-wide text-white">
            META
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
            Nav
          </span>
        </div>
      </div>

      {/* Corner Crosshairs */}
      <div className="pointer-events-none absolute left-0 top-0 h-2 w-2 border-l border-t border-[#28E7A2]/30" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-2 w-2 border-b border-r border-[#28E7A2]/30" />

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
  )
}
