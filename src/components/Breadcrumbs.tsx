// ============================================================================
// BREADCRUMBS - Navigation Trail Component
// Figma Best Practice: Show current location like Linear/Notion
// ============================================================================

import { useRouterAdapter } from '@/hooks/useRouterAdapter'
import { ChevronRight, Home } from 'lucide-react'
import { motion } from 'motion/react'

interface BreadcrumbItem {
  label: string
  path: string
  code?: string
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  className?: string
}

/**
 * Generate breadcrumbs from pathname
 */
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', path: '/' }]

  // META pages
  if (pathname.startsWith('/meta-')) {
    breadcrumbs.push({ label: 'Meta', path: '/meta-architecture' })

    if (pathname === '/meta-architecture') {
      breadcrumbs.push({
        label: 'Forensic Architecture',
        path: '/meta-architecture',
        code: 'META_01',
      })
    } else if (pathname === '/meta-registry') {
      breadcrumbs.push({
        label: 'Registry // God View',
        path: '/meta-registry',
        code: 'META_02',
      })
    } else if (pathname.startsWith('/meta-registry/')) {
      breadcrumbs.push({
        label: 'Registry',
        path: '/meta-registry',
        code: 'META_02',
      })

      // Extract dataset ID
      const parts = pathname.split('/')
      const datasetId = parts[parts.length - 1]

      if (datasetId === 'PRISM') {
        breadcrumbs.push({
          label: 'The Prism',
          path: pathname,
          code: 'META_03',
        })
      } else {
        breadcrumbs.push({ label: datasetId, path: pathname, code: 'META_03' })
      }
    } else if (pathname === '/meta-risk') {
      breadcrumbs.push({
        label: 'Risk Radar',
        path: '/meta-risk',
        code: 'META_04',
      })
    } else if (pathname === '/meta-canon') {
      breadcrumbs.push({
        label: 'Canon Matrix',
        path: '/meta-canon',
        code: 'META_05',
      })
    } else if (pathname === '/meta-health') {
      breadcrumbs.push({
        label: 'Health Scan',
        path: '/meta-health',
        code: 'META_06',
      })
    } else if (pathname === '/meta-lynx') {
      breadcrumbs.push({
        label: 'Lynx Codex',
        path: '/meta-lynx',
        code: 'META_07',
      })
    } else if (pathname === '/implementation-playbook') {
      breadcrumbs.push({
        label: 'Implementation Playbook',
        path: '/implementation-playbook',
        code: 'META_08',
      })
    }
  }

  return breadcrumbs
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const { pathname, navigate } = useRouterAdapter()

  // Use provided items or generate from pathname
  const breadcrumbs = items || generateBreadcrumbs(pathname)

  // Don't show breadcrumbs on home page
  if (breadcrumbs.length <= 1) return null

  return (
    <nav
      className={`flex items-center gap-2 ${className}`}
      aria-label="Breadcrumbs"
    >
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1
        const isFirst = index === 0

        return (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="flex items-center gap-2"
          >
            {/* Separator */}
            {!isFirst && <ChevronRight className="h-3 w-3 text-[#333]" />}

            {/* Breadcrumb Item */}
            <button
              onClick={() => !isLast && navigate(item.path)}
              disabled={isLast}
              className={`flex items-center gap-2 font-mono text-xs tracking-wide transition-colors ${
                isLast
                  ? 'cursor-default text-[#28E7A2]'
                  : 'cursor-pointer text-[#666] hover:text-white'
              } `}
            >
              {/* Home Icon */}
              {isFirst && <Home className="h-3 w-3" />}

              {/* Code Label (e.g., META_03) */}
              {item.code && !isLast && (
                <span className="text-[#444]">{item.code}</span>
              )}

              {/* Label */}
              <span className={isLast ? 'uppercase' : ''}>{item.label}</span>

              {/* Active Indicator */}
              {isLast && (
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#28E7A2]" />
              )}
            </button>
          </motion.div>
        )
      })}
    </nav>
  )
}

// ============================================================================
// COMPACT BREADCRUMBS (for toolbar/header)
// ============================================================================

interface CompactBreadcrumbsProps {
  className?: string
}

export function CompactBreadcrumbs({
  className = '',
}: CompactBreadcrumbsProps) {
  const { pathname, navigate } = useRouterAdapter()
  const breadcrumbs = generateBreadcrumbs(pathname)

  if (breadcrumbs.length <= 1) return null

  // Only show last 2 items in compact mode
  const compactBreadcrumbs = breadcrumbs.slice(-2)
  const hasMore = breadcrumbs.length > 2

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {hasMore && (
        <>
          <button
            onClick={() => navigate('/')}
            className="text-[#444] transition-colors hover:text-[#666]"
          >
            <Home className="h-3 w-3" />
          </button>
          <span className="text-[#333]">...</span>
          <ChevronRight className="h-2.5 w-2.5 text-[#333]" />
        </>
      )}

      {compactBreadcrumbs.map((item, index) => {
        const isLast = index === compactBreadcrumbs.length - 1

        return (
          <div key={item.path} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="h-2.5 w-2.5 text-[#333]" />}

            <button
              onClick={() => !isLast && navigate(item.path)}
              disabled={isLast}
              className={`font-mono text-[10px] uppercase tracking-wider transition-colors ${isLast ? 'text-[#28E7A2]' : 'cursor-pointer text-[#666] hover:text-white'} `}
            >
              {item.code || item.label}
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// BREADCRUMB WRAPPER (with background)
// ============================================================================

interface BreadcrumbBarProps {
  children?: React.ReactNode
  className?: string
}

export function BreadcrumbBar({
  children,
  className = '',
}: BreadcrumbBarProps) {
  return (
    <div
      className={`flex h-10 items-center justify-between border-b border-[#1F1F1F] bg-[#0A0A0A] px-6 ${className}`}
    >
      <Breadcrumbs />
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  )
}
