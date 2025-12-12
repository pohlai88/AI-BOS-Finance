import { Database, Settings, Home, FileText, Activity } from 'lucide-react'
import { useRouterAdapter } from '@/hooks/useRouterAdapter'

export function MiniSidebar() {
  const { navigate, pathname } = useRouterAdapter()

  const navItems = [
    { icon: Home, path: '/', label: 'Home', id: 'home' },
    {
      icon: Database,
      path: '/meta-architecture',
      label: 'Metadata',
      id: 'metadata',
      code: 'META_01',
    },
    { icon: FileText, path: '/lineage', label: 'Lineage', id: 'lineage' },
    { icon: Activity, path: '/audit', label: 'Audit', id: 'audit' },
    { icon: Settings, path: '/settings', label: 'Settings', id: 'settings' },
  ]

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    // Special handling for metadata routes (META_01, META_02, META_03)
    if (path === '/meta-architecture') {
      return pathname.startsWith('/meta')
    }
    return pathname.startsWith(path)
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-16 flex-col items-center border-r border-[#1F1F1F] bg-black py-6">
      {/* Top spacer for alignment with top nav */}
      <div className="mb-6 h-12" />

      {/* Navigation Items */}
      <nav className="flex w-full flex-1 flex-col gap-2 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`group relative flex h-12 w-12 items-center justify-center rounded transition-all duration-200 ${
                active
                  ? 'border border-[#1D4436] bg-[#132F2B] text-[#28E7A2]'
                  : 'text-[#666] hover:bg-[#0A0A0A] hover:text-[#888]'
              } `}
              aria-label={item.label}
            >
              <Icon className="h-5 w-5" />

              {/* Tooltip on hover */}
              <div
                className={`pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded border border-[#333] bg-[#0A0A0A] px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider opacity-0 transition-opacity group-hover:opacity-100 ${active ? 'text-[#28E7A2]' : 'text-[#888]'} `}
              >
                {item.label}
              </div>

              {/* Active indicator line */}
              {active && (
                <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r bg-[#28E7A2]" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom spacer */}
      <div className="h-6" />
    </aside>
  )
}
