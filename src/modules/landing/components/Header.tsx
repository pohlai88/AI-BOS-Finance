import {
  Search,
  Database,
  FileText,
  BarChart3,
  LogIn,
  Hexagon,
  Layers,
  Shield,
  Users,
  Lock,
  BookOpen,
  Crosshair,
  Activity,
  Bot,
} from 'lucide-react'
import { LynxIcon, LivingLynx } from '../icons/LynxIcon'
import { CommandPalette } from './CommandPalette'
import { RouterLink } from '@/hooks/useRouterAdapter'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip'
import { NexusIcon } from '@/components/nexus/NexusIcon'

export const Header = ({
  onGetStarted,
  onCanonClick,
}: {
  onGetStarted: () => void
  onCanonClick?: () => void
}) => {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-8 py-3">
      <div className="mx-auto max-w-full rounded-2xl border border-white/10 bg-black/95 backdrop-blur-md">
        {/* 2-LAYER GRID STRUCTURE */}
        <div className="px-8 py-3">
          {/* TOP LAYER - Logo + CTA */}
          <div className="grid grid-cols-3 items-center border-b border-white/5 pb-2">
            {/* LEFT: LOGO - Uses NexusIcon (Single Source of Truth) */}
            <div className="flex items-center gap-2.5">
              <NexusIcon size="md" animated />
              <h1 className="text-base tracking-tight text-white">
                NexusCanon
              </h1>
            </div>

            {/* CENTER: COMMAND PALETTE */}
            <div className="flex items-center justify-center">
              <CommandPalette />
            </div>

            {/* RIGHT: TERMINAL ACCESS */}
            <div className="flex items-center justify-end">
              <RouterLink
                to="/login"
                className="group flex items-center gap-2.5 rounded-lg border border-white/10 bg-zinc-950/80 px-4 py-2 shadow-lg transition-all duration-300 hover:border-emerald-500/50 hover:bg-zinc-900/80 hover:shadow-emerald-500/10"
              >
                <LogIn className="h-3.5 w-3.5 flex-shrink-0 text-zinc-500 transition-colors group-hover:text-emerald-400" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-300 transition-colors group-hover:text-emerald-400">
                  Terminal Access
                </span>
                {/* Status Dot */}
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              </RouterLink>
            </div>
          </div>

          {/* BOTTOM LAYER - Icon Navigation with Tooltips */}
          <TooltipProvider delayDuration={200}>
            {/* NAVIGATION TRAY - Forensic Left-Aligned Toolbar */}
            <nav className="flex w-full items-center justify-start gap-8 pt-2">
              {/* ZONE 1: REALITY (Observe) */}
              {/* META_02 - Meta Registry (God View) */}
              <NavItem
                label="Registry // God View"
                icon={<Database className="h-4 w-4" />}
                href="/meta-registry"
                isRouterLink
              />

              {/* ZONE 2: RULES (Orient) */}
              <NavItem
                label="Architecture // System Map"
                icon={<Hexagon className="h-4 w-4" />}
                href="/meta-architecture"
                isRouterLink
              />
              <NavItem
                label="Canon // Laws & Hierarchy"
                icon={<BookOpen className="h-4 w-4" />}
                href="/meta-canon"
                isRouterLink
              />

              {/* ZONE 3: DIAGNOSIS (Decide) */}
              <NavItem
                label="Radar // Risk Exposure"
                icon={<Crosshair className="h-4 w-4" />}
                href="/meta-risk"
                isRouterLink
              />
              <NavItem
                label="Health // Telemetry"
                icon={<Activity className="h-4 w-4" />}
                href="/meta-health"
                isRouterLink
              />

              {/* ZONE 4: REMEDY (Act) */}
              <NavItem
                label="Lynx Codex // Forensic Intelligence"
                icon={<LivingLynx size={16} />}
                href="/meta-lynx"
                isRouterLink
              />
            </nav>
          </TooltipProvider>
        </div>
      </div>
    </header>
  )
}

// --- SUB-COMPONENT ---
const NavItem = ({
  label,
  icon,
  href,
  onClick,
  isRouterLink,
}: {
  label: string
  icon: React.ReactNode
  href?: string
  onClick?: (e: React.MouseEvent) => void
  isRouterLink?: boolean
}) => {
  const content = (
    <span className="transition-transform duration-300 group-hover:scale-110">
      {icon}
    </span>
  )

  const linkClasses =
    'flex items-center justify-center p-2 text-zinc-500 hover:text-emerald-400 hover:bg-white/5 rounded-lg cursor-pointer transition-all duration-300 group border border-transparent hover:border-white/10'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {isRouterLink ? (
          <RouterLink to={href || '#'} className={linkClasses}>
            {content}
          </RouterLink>
        ) : (
          <a href={href} onClick={onClick} className={linkClasses}>
            {content}
          </a>
        )}
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="border-white/20 bg-zinc-900 font-mono text-xs uppercase tracking-widest text-white"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
