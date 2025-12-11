import Link from 'next/link'
import { 
  BookOpen, 
  FileText, 
  Database, 
  Settings, 
  CreditCard, 
  ArrowRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  Archive,
  Activity,
  BarChart3,
  Shield
} from 'lucide-react'
import { CANON_REGISTRY, getCanonPagesBySection, type CanonPageMeta } from '@/canon-pages/registry'

/**
 * Canon Health Dashboard
 * 
 * Visual "God View" of the entire Canon documentation system.
 * Shows health metrics, status distribution, and quick access to all pages.
 * 
 * @see REF_037 - Phase 3: Canon Page System
 */

const SECTIONS = [
  { id: 'meta', label: 'Metadata', icon: Database, description: 'Data architecture and governance', color: 'text-blue-400' },
  { id: 'payment', label: 'Payment', icon: CreditCard, description: 'Payment processing', color: 'text-emerald-400' },
  { id: 'system', label: 'System', icon: Settings, description: 'Configuration', color: 'text-purple-400' },
]

const STATUS_CONFIG = {
  ACTIVE: { icon: CheckCircle, label: 'Active', color: 'text-nexus-green', bg: 'bg-nexus-green/10', border: 'border-nexus-green/30' },
  DRAFT: { icon: Clock, label: 'Draft', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30' },
  DEPRECATED: { icon: AlertTriangle, label: 'Deprecated', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30' },
  ARCHIVED: { icon: Archive, label: 'Archived', color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/30' },
}

function getStatusCounts(): Record<string, number> {
  const counts = { ACTIVE: 0, DRAFT: 0, DEPRECATED: 0, ARCHIVED: 0 }
  Object.values(CANON_REGISTRY).forEach((entry) => {
    counts[entry.meta.status]++
  })
  return counts
}

function StatusBadge({ status }: { status: CanonPageMeta['status'] }) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.color} ${config.border} border`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}

export default function CanonHealthDashboard() {
  const totalPages = Object.keys(CANON_REGISTRY).length
  const statusCounts = getStatusCounts()
  const healthScore = totalPages > 0 
    ? Math.round(((statusCounts.ACTIVE) / totalPages) * 100) 
    : 0

  return (
    <div className="space-y-10">
      {/* Header with Health Score */}
      <header className="relative overflow-hidden rounded-xl border border-nexus-border/30 bg-gradient-to-br from-nexus-surface/20 to-nexus-surface/5 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-nexus-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-nexus-green/20">
                <BookOpen className="w-6 h-6 text-nexus-green" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-nexus-signal">Canon Health Dashboard</h1>
                <p className="text-sm text-nexus-signal/50">Governance Status Overview</p>
              </div>
            </div>
            <p className="text-nexus-signal/60 max-w-xl mt-4">
              Real-time view of your governed documentation. Track coverage, identify gaps, 
              and ensure your knowledge base stays current.
            </p>
          </div>

          {/* Health Score Ring */}
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-nexus-surface/50"
                />
                <circle
                  cx="50" cy="50" r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${healthScore * 2.51} 251`}
                  strokeLinecap="round"
                  className="text-nexus-green transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-nexus-signal">{healthScore}%</span>
              </div>
            </div>
            <span className="text-xs text-nexus-signal/50 mt-2">Health Score</span>
          </div>
        </div>
      </header>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const Icon = config.icon
          const count = statusCounts[status as keyof typeof statusCounts]
          return (
            <div
              key={status}
              className={`rounded-lg border ${config.border} ${config.bg} p-4 transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${config.color}`} />
                <span className={`text-2xl font-bold ${config.color}`}>{count}</span>
              </div>
              <span className="text-xs text-nexus-signal/60">{config.label} Pages</span>
            </div>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-nexus-border/30 bg-nexus-surface/10 p-4 text-center">
          <BarChart3 className="w-5 h-5 text-nexus-signal/40 mx-auto mb-2" />
          <div className="text-xl font-bold text-nexus-signal">{totalPages}</div>
          <div className="text-xs text-nexus-signal/50">Total Pages</div>
        </div>
        <div className="rounded-lg border border-nexus-border/30 bg-nexus-surface/10 p-4 text-center">
          <Activity className="w-5 h-5 text-nexus-signal/40 mx-auto mb-2" />
          <div className="text-xl font-bold text-nexus-signal">{SECTIONS.length}</div>
          <div className="text-xs text-nexus-signal/50">Domains</div>
        </div>
        <div className="rounded-lg border border-nexus-border/30 bg-nexus-surface/10 p-4 text-center">
          <Shield className="w-5 h-5 text-nexus-signal/40 mx-auto mb-2" />
          <div className="text-xl font-bold text-nexus-green">{statusCounts.ACTIVE}</div>
          <div className="text-xs text-nexus-signal/50">Production Ready</div>
        </div>
      </div>

      {/* Domain Breakdown */}
      <section>
        <h2 className="text-lg font-semibold text-nexus-signal mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-nexus-signal/40" />
          Domain Registry
        </h2>
        
        <div className="space-y-4">
          {SECTIONS.map((section) => {
            const Icon = section.icon
            const pages = getCanonPagesBySection(section.id)

            return (
              <div
                key={section.id}
                className="border border-nexus-border/30 rounded-lg overflow-hidden bg-nexus-surface/5"
              >
                {/* Section Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-nexus-surface/10 border-b border-nexus-border/20">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${section.color}`} />
                    <div>
                      <span className="font-medium text-nexus-signal">{section.label}</span>
                      <span className="text-xs text-nexus-signal/40 ml-2">({pages.length} pages)</span>
                    </div>
                  </div>
                  <span className="text-xs text-nexus-signal/50">{section.description}</span>
                </div>

                {/* Pages List */}
                {pages.length > 0 ? (
                  <div className="divide-y divide-nexus-border/20">
                    {pages.map((page) => (
                      <Link
                        key={page.slug}
                        href={`/canon/${section.id}/${page.slug}`}
                        className="flex items-center justify-between px-4 py-3 hover:bg-nexus-surface/20 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-nexus-signal/30" />
                          <div>
                            <span className="text-sm font-medium text-nexus-signal group-hover:text-nexus-green transition-colors">
                              {page.meta.title}
                            </span>
                            <span className="text-xs text-nexus-signal/40 ml-2">
                              v{page.meta.version}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-nexus-signal/40 font-mono">{page.meta.id}</span>
                          <StatusBadge status={page.meta.status} />
                          <ArrowRight className="w-4 h-4 text-nexus-signal/30 group-hover:text-nexus-green transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm text-nexus-signal/40 italic">
                      No pages documented yet
                    </p>
                    <p className="text-xs text-nexus-signal/30 mt-1">
                      Add pages to canon-pages/{section.id.toUpperCase()}/ and register in registry.ts
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="flex items-center justify-between text-xs text-nexus-signal/40 border-t border-nexus-border/30 pt-6">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-nexus-green animate-pulse" />
          Canon v2.0 • Governance-First Architecture
        </div>
        <Link href="/dashboard" className="text-nexus-green hover:underline">
          Return to Dashboard
        </Link>
      </footer>
    </div>
  )
}
