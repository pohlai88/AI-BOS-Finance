// ============================================================================
// NAV MINI SIDEBAR
// Forensic left icon navigation (50px width)
// ============================================================================

import { Home, Database, Settings, BookOpen } from 'lucide-react'
import { useRouterAdapter } from '@/hooks/useRouterAdapter'
import { NexusIcon } from '@/components/nexus/NexusIcon'

export function NavMiniSidebar() {
  const { pathname, navigate } = useRouterAdapter()

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/meta-registry', icon: Database, label: 'Registry' },
    { path: '/meta-canon', icon: BookOpen, label: 'Canon' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="fixed bottom-0 left-0 top-0 z-40 flex w-16 flex-col items-center border-r border-[#1F1F1F] bg-black py-6">
      {/* Logo at top */}
      <button
        onClick={() => navigate('/')}
        className="mb-8 transition-opacity hover:opacity-70"
      >
        <NexusIcon size="sm" />
      </button>

      {/* Navigation icons */}
      <nav className="flex flex-1 flex-col gap-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.path ||
            (item.path === '/meta-registry' && pathname.startsWith('/meta'))
          const Icon = item.icon

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="group relative"
              aria-label={item.label}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all duration-200 ${
                  isActive
                    ? 'border-[#28E7A2] bg-[#0A0A0A] text-[#28E7A2]'
                    : 'border-[#222] text-[#666] hover:border-[#333] hover:text-[#888]'
                } `}
              >
                <Icon size={18} strokeWidth={1.5} />
              </div>

              {/* Tooltip on hover */}
              <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-4 -translate-y-1/2 whitespace-nowrap rounded border border-[#222] bg-[#0A0A0A] px-3 py-1.5 text-xs opacity-0 transition-opacity group-hover:opacity-100">
                {item.label}
              </div>
            </button>
          )
        })}
      </nav>

      {/* System status indicator at bottom */}
      <div className="mt-auto">
        <div
          className="h-2 w-2 animate-pulse rounded-full bg-[#28E7A2]"
          title="System Operational"
        />
      </div>
    </div>
  )
}
