import {
  Home,
  Settings,
  Shield,
  Database,
  Activity,
  Menu,
  Wrench, // Added for Setup Companion
} from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MetaSideNav } from '../MetaSideNav';
import { NexusCanonLogo } from '@/components/NexusCanonLogo';
import { SetupCompanion } from '../sys/SetupCompanion';

interface MetaAppShellProps {
  children: React.ReactNode;
}

export function MetaAppShell({ children }: MetaAppShellProps) {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-[#1F1F1F] bg-black/80 backdrop-blur-md z-40 flex items-center justify-between px-6">
        {/* Left: Brand */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsNavOpen(true)}
            className="p-2 -ml-2 hover:bg-[#111] rounded-lg transition-colors text-zinc-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="h-6 w-[1px] bg-[#1F1F1F]" />

          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <NexusCanonLogo variant="icon" size="sm" />
            <span className="font-mono text-sm tracking-widest text-zinc-300 uppercase hidden md:block">
              Nexus<span className="text-zinc-600">Canon</span>
            </span>
          </div>
        </div>

        {/* Center: Quick Nav (Desktop) */}
        <nav className="hidden md:flex items-center gap-1">
          <NavButton
            icon={<Home className="w-4 h-4" />}
            label="DASHBOARD"
            active={isActive('/dashboard')}
            onClick={() => navigate('/dashboard')}
          />
          <NavButton
            icon={<Wrench className="w-4 h-4" />}
            label="SETUP"
            active={isActive('/sys-bootloader')}
            onClick={() => navigate('/sys-bootloader')}
          />
          <NavButton
            icon={<Database className="w-4 h-4" />}
            label="DATA"
            active={location.pathname.startsWith('/meta-registry')}
            onClick={() => navigate('/meta-registry')}
          />
        </nav>

        {/* Right: User / System Status */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0A0A0A] border border-[#1F1F1F]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              Online
            </span>
          </div>

          <div
            className="h-8 w-8 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-[#333] flex items-center justify-center cursor-pointer hover:border-emerald-500/50 transition-colors"
            onClick={() => navigate('/sys-profile')}
          >
            <span className="font-mono text-xs text-white">SC</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-16 min-h-screen">{children}</main>

      {/* Setup Companion Widget (Bottom Right) */}
      <SetupCompanion />

      {/* Slide-out Navigation */}
      <MetaSideNav isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
    </div>
  );
}

// Helper Component for Top Nav Buttons
function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-md text-xs font-mono tracking-wider transition-all
        ${
          active
            ? 'bg-[#111] text-emerald-500 border border-[#1F1F1F]'
            : 'text-zinc-500 hover:text-white hover:bg-[#0A0A0A] border border-transparent'
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
