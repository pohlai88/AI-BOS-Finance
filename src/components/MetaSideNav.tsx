// ============================================================================
// PRIMARY NAVIGATION - Main App Navigation
// Clean sidebar navigation following Figma/Linear design patterns
// ============================================================================

import { useRouterAdapter } from '@/hooks/useRouterAdapter'
import {
  X,
  LayoutDashboard,
  Database,
  User,
  Settings,
  Shield,
  Activity,
  Wrench,
  FileText,
  Search,
  Layers,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NexusIcon } from '@/components/nexus/NexusIcon'

interface MetaSideNavProps {
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  id: string
  code: string
  label: string
  route: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavGroup {
  id: string
  title: string
  code: string
  items: NavItem[]
}

const NAVIGATION_GROUPS: NavGroup[] = [
  {
    id: 'meta',
    title: 'META',
    code: 'META Series',
    items: [
      {
        id: 'architecture',
        code: 'META_01',
        label: 'Forensic Architecture',
        route: '/meta-architecture',
        icon: LayoutDashboard,
      },
      {
        id: 'registry',
        code: 'META_02',
        label: 'Registry // God View',
        route: '/meta-registry',
        icon: Database,
      },
      {
        id: 'prism',
        code: 'META_03',
        label: 'The Prism',
        route: '/meta-registry/PRISM',
        icon: Layers,
      },
      {
        id: 'risk',
        code: 'META_04',
        label: 'Risk Radar',
        route: '/meta-risk',
        icon: Shield,
      },
      {
        id: 'canon',
        code: 'META_05',
        label: 'Canon Matrix',
        route: '/meta-canon',
        icon: FileText,
      },
      {
        id: 'health',
        code: 'META_06',
        label: 'Health Scan',
        route: '/meta-health',
        icon: Activity,
      },
      {
        id: 'lynx',
        code: 'META_07',
        label: 'Lynx Codex',
        route: '/meta-lynx',
        icon: Search,
      },
      {
        id: 'implementation',
        code: 'META_08',
        label: 'Implementation',
        route: '/implementation-playbook',
        icon: FileText,
      },
    ],
  },
  {
    id: 'sys',
    title: 'SYS',
    code: 'System Configuration',
    items: [
      {
        id: 'setup',
        code: 'SYS_01',
        label: 'Setup Companion',
        route: '/sys-bootloader',
        icon: Wrench,
      },
      {
        id: 'organization',
        code: 'SYS_02',
        label: 'Organization Matrix',
        route: '/sys-organization',
        icon: Settings,
      },
      {
        id: 'access',
        code: 'SYS_03',
        label: 'Access Control',
        route: '/sys-access',
        icon: Shield,
      },
      {
        id: 'profile',
        code: 'SYS_04',
        label: 'Profile',
        route: '/sys-profile',
        icon: User,
      },
    ],
  },
]

export function MetaSideNav({ isOpen, onClose }: MetaSideNavProps) {
  const { navigate, pathname } = useRouterAdapter()
  const [expandedGroups, setExpandedGroups] = useState<string[]>([
    'meta',
    'sys',
  ])

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    )
  }

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleNavigate = (route: string) => {
    navigate(route)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop - NO overlay effect on content */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Side Panel - Standard Figma width */}
      <div className="fixed bottom-0 left-0 top-0 z-50 flex w-[280px] flex-col border-r border-[#1F1F1F] bg-[#0A0A0A]">
        {/* Custom Linear-style scrollbar */}
        <style>
          {`
            .nexus-nav-scroll::-webkit-scrollbar {
              width: 6px;
            }
            .nexus-nav-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
            .nexus-nav-scroll::-webkit-scrollbar-thumb {
              background: #333;
              border-radius: 3px;
            }
            .nexus-nav-scroll::-webkit-scrollbar-thumb:hover {
              background: #444;
            }
          `}
        </style>

        {/* Header with Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#1F1F1F] px-4">
          <NexusIcon size="sm" />
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-[#1F1F1F]"
          >
            <X className="h-5 w-5 text-[#666] hover:text-white" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="nexus-nav-scroll flex-1 overflow-y-auto px-3 py-4">
          {NAVIGATION_GROUPS.map((group, groupIndex) => {
            const isExpanded = expandedGroups.includes(group.id)

            return (
              <div key={group.id} className={groupIndex > 0 ? 'mt-4' : ''}>
                {/* Group Header - Collapsible */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="group flex w-full items-center justify-between rounded-md px-3 py-2 transition-all hover:bg-[#151515]"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white">
                      {group.title}
                    </span>
                    <span className="font-mono text-[9px] tracking-wider text-[#555]">
                      {group.code}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-[#666] group-hover:text-[#999]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[#666] group-hover:text-[#999]" />
                  )}
                </button>

                {/* Group Items - Collapsible */}
                {isExpanded && (
                  <div className="mt-1 space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = pathname === item.route
                      const Icon = item.icon

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavigate(item.route)}
                          className={`group ml-2 flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-all ${
                            isActive
                              ? 'bg-[#1F1F1F] text-white'
                              : 'text-[#999] hover:bg-[#151515] hover:text-white'
                          } `}
                        >
                          <Icon
                            className={`h-[16px] w-[16px] shrink-0 ${
                              isActive
                                ? 'text-[#28E7A2]'
                                : 'text-[#666] group-hover:text-[#999]'
                            }`}
                          />
                          <div className="flex flex-1 items-center gap-2">
                            <span className="font-mono text-[12px] tracking-[-0.01em]">
                              {item.label}
                            </span>
                            <span className="font-mono text-[9px] tracking-wider text-[#555]">
                              {item.code}
                            </span>
                          </div>
                          {/* Active indicator */}
                          {isActive && (
                            <div className="h-1 w-1 rounded-full bg-[#28E7A2]" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-[#1F1F1F] px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
              Press ESC to close
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
