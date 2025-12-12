import {
  Home,
  Settings,
  Shield,
  Database,
  Activity,
  Menu,
  Wrench, // Added for Setup Companion
} from 'lucide-react'
import { useState } from 'react'
import { useRouterAdapter } from '@/hooks/useRouterAdapter'
import { MetaSideNav } from '../MetaSideNav'
import { NexusIcon } from '@/components/nexus/NexusIcon'
import { SetupCompanion } from '../sys/SetupCompanion'

interface MetaAppShellProps {
  children: React.ReactNode
}

export function MetaAppShell({ children }: MetaAppShellProps) {
  const [isNavOpen, setIsNavOpen] = useState(false)
  const { pathname, navigate, isActive } = useRouterAdapter()

  return (
    <div className="min-h-screen bg-black font-sans text-white selection:bg-emerald-500/30">
      {/* Top Navigation Bar */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-[#1F1F1F] bg-black/80 px-6 backdrop-blur-md">
        {/* Left: Brand */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsNavOpen(true)}
            className="-ml-2 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-[#111] hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="h-6 w-[1px] bg-[#1F1F1F]" />

          <div
            className="flex cursor-pointer items-center gap-3"
            onClick={() => navigate('/dashboard')}
          >
            <NexusIcon size="sm" />
            <span className="hidden font-mono text-sm uppercase tracking-widest text-zinc-300 md:block">
              Nexus<span className="text-zinc-600">Canon</span>
            </span>
          </div>
        </div>

        {/* Center: Quick Nav (Desktop) */}
        <nav className="hidden items-center gap-1 md:flex">
          <NavButton
            icon={<Home className="h-4 w-4" />}
            label="DASHBOARD"
            active={isActive('/dashboard')}
            onClick={() => navigate('/dashboard')}
          />
          <NavButton
            icon={<Wrench className="h-4 w-4" />}
            label="SETUP"
            active={isActive('/sys-bootloader')}
            onClick={() => navigate('/sys-bootloader')}
          />
          <NavButton
            icon={<Database className="h-4 w-4" />}
            label="DATA"
            active={pathname.startsWith('/meta-registry')}
            onClick={() => navigate('/meta-registry')}
          />
        </nav>

        {/* Right: User / System Status */}
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 rounded-full border border-[#1F1F1F] bg-[#0A0A0A] px-3 py-1.5 md:flex">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              Online
            </span>
          </div>

          <div
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#333] bg-gradient-to-tr from-zinc-800 to-zinc-700 transition-colors hover:border-emerald-500/50"
            onClick={() => navigate('/sys-profile')}
          >
            <span className="font-mono text-xs text-white">SC</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="min-h-screen pt-16">{children}</main>

      {/* Setup Companion Widget (Bottom Right) */}
      <SetupCompanion />

      {/* Slide-out Navigation */}
      <MetaSideNav isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
    </div>
  )
}

// Helper Component for Top Nav Buttons
function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-md px-4 py-2 font-mono text-xs tracking-wider transition-all ${
        active
          ? 'border border-[#1F1F1F] bg-[#111] text-emerald-500'
          : 'border border-transparent text-zinc-500 hover:bg-[#0A0A0A] hover:text-white'
      } `}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
