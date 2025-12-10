import { motion } from 'motion/react';
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
} from 'lucide-react';
import { LynxIcon, LivingLynx } from '../icons/LynxIcon';
import { CommandPalette } from './CommandPalette';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export const Header = ({
  onGetStarted,
  onCanonClick,
}: {
  onGetStarted: () => void;
  onCanonClick?: () => void;
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-8 py-3">
      <div className="max-w-full mx-auto bg-black/95 backdrop-blur-md border border-white/10 rounded-2xl">
        {/* 2-LAYER GRID STRUCTURE */}
        <div className="px-8 py-3">
          {/* TOP LAYER - Logo + CTA */}
          <div className="grid grid-cols-3 items-center pb-2 border-b border-white/5">
            {/* LEFT: LOGO */}
            <div className="flex items-center gap-2.5">
              {/* Original Animated Logo Icon */}
              <div className="relative w-7 h-7">
                <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                  {/* Outer Ring */}
                  <motion.circle
                    cx="20"
                    cy="20"
                    r="16"
                    stroke="rgba(40, 231, 162, 0.3)"
                    strokeWidth="1"
                    initial={{ pathLength: 0, rotate: 0 }}
                    animate={{ pathLength: 1, rotate: 360 }}
                    transition={{
                      pathLength: { duration: 2, ease: 'easeInOut' },
                      rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                    }}
                  />
                  {/* Inner Crystal */}
                  <motion.path
                    d="M20 8 L28 20 L20 32 L12 20 Z"
                    stroke="rgba(40, 231, 162, 0.6)"
                    strokeWidth="1.5"
                    fill="rgba(40, 231, 162, 0.05)"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                  />
                  {/* Center Line */}
                  <motion.line
                    x1="20"
                    y1="8"
                    x2="20"
                    y2="32"
                    stroke="rgba(40, 231, 162, 0.8)"
                    strokeWidth="1"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 1 }}
                  />
                  {/* Pulse */}
                  <motion.circle
                    cx="20"
                    cy="20"
                    r="3"
                    fill="rgba(40, 231, 162, 0.6)"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.6, 0.3, 0.6],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </svg>
              </div>

              <div className="flex items-center gap-2">
                <h1 className="text-base tracking-tight text-white">NexusCanon</h1>
                <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest px-1.5 py-0.5 border border-white/10 rounded">
                  Gov
                </span>
              </div>
            </div>

            {/* CENTER: COMMAND PALETTE */}
            <div className="flex items-center justify-center">
              <CommandPalette />
            </div>

            {/* RIGHT: TERMINAL ACCESS */}
            <div className="flex items-center justify-end">
              <Link
                to="/login"
                className="group flex items-center gap-2.5 px-4 py-2 bg-zinc-950/80 hover:bg-zinc-900/80 border border-white/10 hover:border-emerald-500/50 rounded-lg transition-all duration-300 shadow-lg hover:shadow-emerald-500/10"
              >
                <LogIn className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
                <span className="text-[10px] tracking-widest uppercase font-mono text-zinc-300 group-hover:text-emerald-400 transition-colors">
                  Terminal Access
                </span>
                {/* Status Dot */}
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </Link>
            </div>
          </div>

          {/* BOTTOM LAYER - Icon Navigation with Tooltips */}
          <TooltipProvider delayDuration={200}>
            {/* NAVIGATION TRAY - Forensic Left-Aligned Toolbar */}
            <nav className="flex items-center justify-start pt-2 w-full gap-8">
              {/* ZONE 1: REALITY (Observe) */}
              <NavItem
                label="Registry // God View"
                icon={<Database className="w-4 h-4" />}
                href="/meta-registry"
                isRouterLink
              />

              {/* ZONE 2: RULES (Orient) */}
              <NavItem
                label="Architecture // System Map"
                icon={<Hexagon className="w-4 h-4" />}
                href="/meta-architecture"
                isRouterLink
              />
              <NavItem
                label="Canon // Laws & Hierarchy"
                icon={<BookOpen className="w-4 h-4" />}
                href="/meta-canon"
                isRouterLink
              />

              {/* ZONE 3: DIAGNOSIS (Decide) */}
              <NavItem
                label="Radar // Risk Exposure"
                icon={<Crosshair className="w-4 h-4" />}
                href="/meta-risk"
                isRouterLink
              />
              <NavItem
                label="Health // Telemetry"
                icon={<Activity className="w-4 h-4" />}
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
  );
};

// --- SUB-COMPONENT ---
const NavItem = ({
  label,
  icon,
  href,
  onClick,
  isRouterLink,
}: {
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  isRouterLink?: boolean;
}) => {
  const content = (
    <span className="transition-transform duration-300 group-hover:scale-110">{icon}</span>
  );

  const linkClasses =
    'flex items-center justify-center p-2 text-zinc-500 hover:text-emerald-400 hover:bg-white/5 rounded-lg cursor-pointer transition-all duration-300 group border border-transparent hover:border-white/10';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {isRouterLink ? (
          <Link to={href || '#'} className={linkClasses}>
            {content}
          </Link>
        ) : (
          <a href={href} onClick={onClick} className={linkClasses}>
            {content}
          </a>
        )}
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="bg-zinc-900 border-white/20 text-white font-mono text-xs tracking-widest uppercase"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
};
