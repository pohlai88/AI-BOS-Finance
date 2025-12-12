/**
 * Canon Health Dashboard
 * 
 * "Fantastic" Implementation - Tailwind v4 Native Approach
 * - Semantic Tailwind classes (bg-surface-card, border-default)
 * - NO JavaScript token imports (Tailwind as the API)
 * - shadcn/ui primitives (Card, Badge, Separator, Accordion)
 * - Semantic HTML + WCAG AA compliance
 * - Real data from CANON_REGISTRY
 * 
 * @page CANON_01
 * @version 2.3.0
 * @see REF_037 - Phase 3: Canon Page System
 */

'use client'

import React from 'react'
import { 
  BarChart, 
  Activity, 
  ShieldCheck,
  BookOpen,
  FileText,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

// SSOT imports from registry
import { 
  CANON_REGISTRY, 
  CANON_SECTIONS,
  STATUS_CONFIG,
  getCanonPagesBySection, 
  getStatusCounts,
  getHealthScore,
  type CanonStatus
} from '@/canon-pages/registry'

// shadcn/ui Primitives (NOT custom divs)
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { cn } from '@/lib/utils'

// =============================================================================
// PAGE METADATA (Canon Governance)
// =============================================================================

export const PAGE_META = {
  code: 'CANON_01',
  version: '2.3.0',
  name: 'Canon Health Dashboard',
  route: '/canon',
  domain: 'SYSTEM',
  status: 'active',
} as const

// =============================================================================
// HEALTH RING COMPONENT (Pure SVG/Tailwind)
// =============================================================================

const HealthRing = ({ percentage }: { percentage: number }) => {
  const radius = 35
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div 
      className="relative flex items-center justify-center w-32 h-32" 
      role="img" 
      aria-label={`System health: ${percentage} percent`}
    >
      <svg className="transform -rotate-90 w-full h-full" aria-hidden="true">
        {/* Background Circle */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-border-default"
        />
        {/* Progress Circle */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Text in Center */}
      <div className="absolute flex flex-col items-center">
        <span className="text-heading font-bold text-text-primary">{percentage}%</span>
      </div>
    </div>
  )
}

// =============================================================================
// STATUS CARD COMPONENT
// =============================================================================

function StatusCard({ 
  label, 
  count, 
  status 
}: { 
  label: string
  count: number
  status: CanonStatus
}) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <Card 
      className={cn(
        'border-l border-border-default',
        'bg-surface-card hover:bg-surface-hover transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      )}
      role="region"
      aria-label={`${label}: ${count} pages`}
      tabIndex={0}
    >
      <CardContent className="p-6 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-label text-text-secondary">{label}</p>
          <p className={cn('text-heading font-bold', config.color)}>{count}</p>
        </div>
        <div className="p-3 bg-surface-nested rounded-full border border-border-default">
          <Icon className={cn('w-5 h-5', config.color)} aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// STAT TILE COMPONENT
// =============================================================================

function StatTile({ 
  label, 
  value, 
  icon, 
  highlight 
}: { 
  label: string
  value: number | string
  icon: React.ReactNode
  highlight?: boolean
}) {
  return (
    <Card 
      className={cn(
        'border border-border-default',
        'bg-surface-card',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      )}
      role="region"
      aria-label={`${label}: ${value}`}
      tabIndex={0}
    >
      <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
        <div className={cn(
          'p-2 rounded-full',
          highlight ? 'bg-primary/10 text-primary' : 'bg-surface-nested text-text-secondary'
        )}>
          {icon}
        </div>
        <span className={cn('text-heading font-bold', highlight ? 'text-primary' : 'text-text-primary')}>
          {value}
        </span>
        <span className="text-label uppercase tracking-wider text-text-secondary">{label}</span>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function CanonHealthDashboard() {
  const totalPages = Object.keys(CANON_REGISTRY).length
  const statusCounts = getStatusCounts()
  const healthScore = getHealthScore()

  return (
    <>
      {/* Skip Navigation - WCAG 2.1 Requirement */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-fg focus:font-semibold"
      >
        Skip to main content
      </a>

      <main 
        id="main-content" 
        className="space-y-8 animate-in fade-in duration-500 pt-layout-2xl pb-layout-2xl" 
        role="main"
      >
        {/* --- HERO SECTION --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className={cn('md:col-span-3 bg-gradient-to-br from-surface-card to-surface-nested border-primary/20 border border-border-default')}>
            <CardContent className="flex flex-col md:flex-row items-center justify-between p-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BookOpen className="w-8 h-8 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h1 className={cn('text-display font-bold text-text-primary tracking-tight text-white')}>
                      {PAGE_META.name}
                    </h1>
                    <p className="text-body text-text-secondary">
                      Governance Status Overview
                    </p>
                  </div>
                </div>
                <p className="text-body text-text-secondary max-w-2xl leading-relaxed">
                  Real-time view of your governed documentation. Track coverage, identify gaps, 
                  and ensure your knowledge base stays current with the AI-BOS Constitution.
                </p>
              </div>
              
              <div className={cn('flex flex-col items-center mt-6 md:mt-0 p-4 bg-surface-nested rounded-2xl backdrop-blur-sm border border-border-default')}>
                <HealthRing percentage={healthScore} />
                <span className="text-label mt-2 font-medium text-text-secondary">
                  System Health
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- STATUS OVERVIEW --- */}
        <section aria-labelledby="status-overview-heading">
          <h2 
            id="status-overview-heading"
            className="text-heading font-bold tracking-tight mb-4 flex items-center gap-2 text-text-primary"
          >
            <Activity className="w-5 h-5 text-text-secondary" aria-hidden="true" /> 
            Status Overview
          </h2>
          <div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            role="list"
            aria-label="Documentation status counts"
          >
            <div role="listitem">
              <StatusCard 
                label="Active Pages" 
                count={statusCounts.ACTIVE} 
                status="ACTIVE"
              />
            </div>
            <div role="listitem">
              <StatusCard 
                label="Draft Pages" 
                count={statusCounts.DRAFT} 
                status="DRAFT"
              />
            </div>
            <div role="listitem">
              <StatusCard 
                label="Deprecated" 
                count={statusCounts.DEPRECATED} 
                status="DEPRECATED"
              />
            </div>
            <div role="listitem">
              <StatusCard 
                label="Archived" 
                count={statusCounts.ARCHIVED} 
                status="ARCHIVED"
              />
            </div>
          </div>
        </section>

        <Separator className="my-8" />

        {/* --- QUICK STATISTICS --- */}
        <section aria-labelledby="quick-stats-heading">
          <h2 
            id="quick-stats-heading"
            className="text-heading font-bold tracking-tight mb-4 flex items-center gap-2 text-text-primary"
          >
            <BarChart className="w-5 h-5 text-text-secondary" aria-hidden="true" /> 
            Quick Statistics
          </h2>
          <div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            role="list"
            aria-label="System statistics"
          >
            <div role="listitem">
              <StatTile 
                label="Total Pages" 
                value={totalPages} 
                icon={<BookOpen className="w-4 h-4" aria-hidden="true" />} 
              />
            </div>
            <div role="listitem">
              <StatTile 
                label="Domains" 
                value={CANON_SECTIONS.length} 
                icon={<Activity className="w-4 h-4" aria-hidden="true" />} 
              />
            </div>
            <div role="listitem">
              <StatTile 
                label="Production Ready" 
                value={statusCounts.ACTIVE} 
                icon={<ShieldCheck className="w-4 h-4 text-primary" aria-hidden="true" />} 
                highlight
              />
            </div>
          </div>
        </section>

        {/* --- DOMAIN REGISTRY --- */}
        <section aria-labelledby="domain-registry-heading">
          <h2 
            id="domain-registry-heading"
            className="text-heading font-bold tracking-tight mb-4 flex items-center gap-2 text-text-primary"
          >
            <FileText className="w-5 h-5 text-text-secondary" aria-hidden="true" /> 
            Domain Registry
          </h2>
          
          <Accordion type="multiple" className="space-y-4">
            {CANON_SECTIONS.map((section) => {
              const Icon = section.icon
              const pages = getCanonPagesBySection(section.id)

              return (
                <AccordionItem
                  key={section.id}
                  value={section.id}
                  className="border-border-default bg-surface-card px-6"
                >
                  <AccordionTrigger
                    className="hover:no-underline"
                    aria-label={`${section.label} domain, ${pages.length} pages`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Icon 
                        className={cn('w-5 h-5', section.color)} 
                        aria-hidden="true"
                      />
                      <div className="text-left">
                        <div className="text-subheading font-semibold text-text-primary">
                          {section.label}
                        </div>
                        <div className="text-label text-text-secondary mt-1">
                          {pages.length} {pages.length === 1 ? 'page' : 'pages'} • {section.description}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {pages.length > 0 ? (
                      <nav 
                        aria-label={`Pages in ${section.label} domain`}
                        className="pt-4"
                      >
                        <ul className="space-y-1" role="list">
                          {pages.map((page) => {
                            const pageHref = `/canon/${section.id}/${page.slug}`
                            const config = STATUS_CONFIG[page.meta.status]
                            
                            return (
                              <li key={page.slug} role="listitem">
                                <Link
                                  href={pageHref}
                                  className={cn(
                                    'flex items-center justify-between gap-4 p-3',
                                    'border border-border-default',
                                    'hover:bg-surface-hover',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                                    'transition-colors'
                                  )}
                                  aria-label={`View ${page.meta.title}, version ${page.meta.version}, status ${page.meta.status}`}
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <FileText 
                                      className="w-4 h-4 text-text-secondary flex-shrink-0" 
                                      aria-hidden="true"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-body font-medium text-text-primary truncate">
                                        {page.meta.title}
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-label text-text-secondary font-mono">
                                          v{page.meta.version}
                                        </span>
                                        <span className="text-label text-text-secondary font-mono">
                                          {page.meta.id}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 flex-shrink-0">
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        config.bg,
                                        config.color,
                                        config.border,
                                        'text-label uppercase tracking-wider'
                                      )}
                                      role="status"
                                      aria-label={`Status: ${config.label}`}
                                    >
                                      {config.label}
                                    </Badge>
                                    <ArrowRight 
                                      className="w-4 h-4 text-text-secondary" 
                                      aria-hidden="true"
                                    />
                                  </div>
                                </Link>
                              </li>
                            )
                          })}
                        </ul>
                      </nav>
                    ) : (
                      <div 
                        className="pt-4 text-center"
                        role="status"
                        aria-live="polite"
                      >
                        <p className="text-body text-text-secondary">
                          No pages documented yet in this domain
                        </p>
                        <p className="text-label text-text-tertiary mt-2 font-mono">
                          Add pages to <code>canon-pages/{section.id.toUpperCase()}/</code> and register in <code>registry.ts</code>
                        </p>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </section>

        {/* --- FOOTER --- */}
        <footer 
          className="border-t border-border-default flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-text-secondary"
          role="contentinfo"
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" 
              aria-hidden="true"
            />
            <span className="text-label font-mono">
              Canon v2.0 • Governance-First Architecture
            </span>
          </div>
          <Link 
            href="/dashboard" 
            className={cn(
              'text-primary hover:text-primary-hover',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              'underline-offset-4 hover:underline',
              'transition-colors',
              'text-label'
            )}
            aria-label="Return to main dashboard"
          >
            Return to Dashboard
          </Link>
        </footer>
      </main>
    </>
  )
}
