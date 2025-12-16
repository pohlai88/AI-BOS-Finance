import { Database, Settings, Home, FileText, Activity } from 'lucide-react';
import { useRouterAdapter } from '@/hooks/useRouterAdapter';

export function MiniSidebar() {
  const { navigate, pathname } = useRouterAdapter();

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
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    // Special handling for metadata routes (META_01, META_02, META_03)
    if (path === '/meta-architecture') {
      return pathname.startsWith('/meta');
    }
    return pathname.startsWith(path);
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-16 bg-black border-r border-[#1F1F1F] z-40 flex flex-col items-center py-6">
      {/* Top spacer for alignment with top nav */}
      <div className="h-12 mb-6" />

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col gap-2 w-full px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`
                group relative w-12 h-12 flex items-center justify-center rounded
                transition-all duration-200
                ${
                  active
                    ? 'bg-[#132F2B] text-[#28E7A2] border border-[#1D4436]'
                    : 'text-[#666] hover:text-[#888] hover:bg-[#0A0A0A]'
                }
              `}
              aria-label={item.label}
            >
              <Icon className="w-5 h-5" />

              {/* Tooltip on hover */}
              <div
                className={`
                  absolute left-full ml-3 px-3 py-1.5 bg-[#0A0A0A] border border-[#333] 
                  rounded font-mono text-[10px] uppercase tracking-wider whitespace-nowrap
                  opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity
                  ${active ? 'text-[#28E7A2]' : 'text-[#888]'}
                `}
              >
                {item.label}
              </div>

              {/* Active indicator line */}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#28E7A2] rounded-r" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom spacer */}
      <div className="h-6" />
    </aside>
  );
}
