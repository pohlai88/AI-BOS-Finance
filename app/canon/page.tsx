/**
 * Canon Health Dashboard
 * 
 * Visual "God View" of the entire Canon documentation system.
 * Shows health metrics, status distribution, and quick access to all pages.
 * 
 * @page CANON_01
 * @version 1.0.0
 * @see REF_037 - Phase 3: Canon Page System
 */

import Link from 'next/link'
import { BookOpen, FileText, ArrowRight, BarChart3, Activity, Shield } from 'lucide-react'

// SSOT imports from registry
import { 
  CANON_REGISTRY, 
  CANON_SECTIONS,
  getCanonPagesBySection, 
  getStatusCounts,
  getHealthScore,
  type CanonStatus
} from '@/canon-pages/registry'

// Canon Components (DRY!)
import { StatusBadge, StatusCard, StatCard, HealthScoreRing } from '@/components/canon'

// =============================================================================
// PAGE METADATA (Canon Governance)
// =============================================================================

export const PAGE_META = {
  code: 'CANON_01',
  version: '1.0.0',
  name: 'Canon Health Dashboard',
  route: '/canon',
  domain: 'SYSTEM',
  status: 'active',
} as const

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function CanonHealthDashboard() {
  const totalPages = Object.keys(CANON_REGISTRY).length
  const statusCounts = getStatusCounts()
  const healthScore = getHealthScore()

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
                <h1 className="text-2xl font-bold text-nexus-signal">{PAGE_META.name}</h1>
                <p className="text-sm text-nexus-signal/50">Governance Status Overview</p>
              </div>
            </div>
            <p className="text-nexus-signal/60 max-w-xl mt-4">
              Real-time view of your governed documentation. Track coverage, identify gaps, 
              and ensure your knowledge base stays current.
            </p>
          </div>

          {/* Health Score Ring - Now a Canon Component! */}
          <HealthScoreRing score={healthScore} />
        </div>
      </header>

      {/* Status Cards - Using Canon StatusCard Component */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(Object.keys(statusCounts) as CanonStatus[]).map((status) => (
          <StatusCard 
            key={status} 
            status={status} 
            count={statusCounts[status]} 
          />
        ))}
      </div>

      {/* Quick Stats - Using Canon StatCard Component */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard 
          icon={BarChart3} 
          value={totalPages} 
          label="Total Pages" 
        />
        <StatCard 
          icon={Activity} 
          value={CANON_SECTIONS.length} 
          label="Domains" 
        />
        <StatCard 
          icon={Shield} 
          value={statusCounts.ACTIVE} 
          label="Production Ready"
          valueClassName="text-nexus-green" 
        />
      </div>

      {/* Domain Breakdown - Using SSOT CANON_SECTIONS */}
      <section>
        <h2 className="text-lg font-semibold text-nexus-signal mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-nexus-signal/40" />
          Domain Registry
        </h2>
        
        <div className="space-y-4">
          {CANON_SECTIONS.map((section) => {
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
                          {/* StatusBadge - Now a Canon Component! */}
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
