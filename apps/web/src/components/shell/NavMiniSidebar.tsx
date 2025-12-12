// ============================================================================
// NAV MINI SIDEBAR
// Forensic left icon navigation (50px width)
// ============================================================================

import { Home, Database, Settings, BookOpen } from 'lucide-react';
import { useRouterAdapter } from '@/hooks/useRouterAdapter';
import { NexusIcon } from '@/components/nexus/NexusIcon';

export function NavMiniSidebar() {
  const { pathname, navigate } = useRouterAdapter();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/meta-registry', icon: Database, label: 'Registry' },
    { path: '/meta-canon', icon: BookOpen, label: 'Canon' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed left-0 top-0 bottom-0 w-16 bg-black border-r border-[#1F1F1F] flex flex-col items-center py-6 z-40">
      {/* Logo at top */}
      <button onClick={() => navigate('/')} className="mb-8 hover:opacity-70 transition-opacity">
        <NexusIcon size="sm" />
      </button>

      {/* Navigation icons */}
      <nav className="flex-1 flex flex-col gap-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.path ||
            (item.path === '/meta-registry' && pathname.startsWith('/meta'));
          const Icon = item.icon;

          return (
            <button key={item.path} onClick={() => navigate(item.path)} className="group relative" aria-label={item.label}>
              <div
                className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  border transition-all duration-200
                  ${
                    isActive
                      ? 'bg-[#0A0A0A] border-[#28E7A2] text-[#28E7A2]'
                      : 'border-[#222] text-[#666] hover:border-[#333] hover:text-[#888]'
                  }
                `}
              >
                <Icon size={18} strokeWidth={1.5} />
              </div>

              {/* Tooltip on hover */}
              <div
                className="
                  absolute left-full ml-4 top-1/2 -translate-y-1/2
                  px-3 py-1.5 bg-[#0A0A0A] border border-[#222]
                  rounded text-xs whitespace-nowrap
                  opacity-0 group-hover:opacity-100
                  pointer-events-none transition-opacity
                  z-50
                "
              >
                {item.label}
              </div>
            </button>
          );
        })}
      </nav>

      {/* System status indicator at bottom */}
      <div className="mt-auto">
        <div
          className="w-2 h-2 rounded-full bg-[#28E7A2] animate-pulse"
          title="System Operational"
        />
      </div>
    </div>
  );
}
