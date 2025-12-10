import { NexusIcon } from '../nexus/NexusIcon';

export const LandingFooter = () => {
  return (
    <footer className="py-6 px-8 border-t border-white/5 relative bg-black/40 backdrop-blur-sm">
      <div className="max-w-full mx-auto">
        {/* Coordinate Markers - purely decorative */}
        <div className="absolute top-0 left-8 text-[10px] font-mono text-zinc-600 tracking-widest translate-y-[-50%] bg-black px-2">
          00 // FOOTER
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-white/5">
          {/* BRAND COLUMN - Uses NexusIcon (Single Source of Truth) */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <NexusIcon size="lg" animated />
              <div>
                <h1 className="text-sm tracking-tight text-white font-medium">NexusCanon</h1>
                <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                  Forensic Architecture
                </p>
              </div>
            </div>
          </div>

          {/* LINKS COLUMNS (Simplified for brevity) */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              Resources
            </h4>
            <nav className="flex flex-col gap-2 text-[11px] text-zinc-400 font-mono">
              <a href="/privacy" className="hover:text-emerald-400 transition-colors">
                PRIVACY
              </a>
              <a href="/docs" className="hover:text-emerald-400 transition-colors">
                DOCUMENTATION
              </a>
            </nav>
          </div>

          {/* CONTACT COLUMN */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              Contact
            </h4>
            <a
              href="mailto:contact@nexuscanon.com"
              className="text-[11px] text-zinc-400 font-mono hover:text-emerald-400"
            >
              contact@nexuscanon.com
            </a>
          </div>
        </div>

        {/* SYSTEM STATUS ROW */}
        <div className="pt-4 flex items-center justify-between text-[9px] font-mono text-zinc-600">
          <span>v2.4.1 / BUILD_{Math.random().toString(16).slice(2, 8).toUpperCase()}</span>
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-widest">Status:</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-500">OPERATIONAL</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
