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
  ArrowRight,
  Search,
  Filter,
  SlidersHorizontal,
  ExternalLink
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
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
          className="text-[#262626]"
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
          className="text-[#F5A524] transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Text in Center */}
      <div className="absolute flex flex-col items-center">
        <span className="text-heading font-semibold tabular-nums text-[#EDEDED] tracking-[-0.02em]">{percentage}%</span>
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
  const nano =
    status === 'ACTIVE'
      ? { color: 'text-[#3B82F6]', bg: 'bg-[#3B82F6]/10', border: 'border-[#3B82F6]/30' }
      : status === 'DRAFT'
        ? { color: 'text-[#F5A524]', bg: 'bg-[#F5A524]/10', border: 'border-[#F5A524]/30' }
        : status === 'DEPRECATED'
          ? { color: 'text-[#F5A524]', bg: 'bg-[#F5A524]/10', border: 'border-[#F5A524]/30' }
          : { color: 'text-[#A1A1AA]', bg: 'bg-[#A1A1AA]/10', border: 'border-[#A1A1AA]/30' }

  return (
    <Card 
      className={cn(
        'rounded-xl bg-[#171717] border border-[#262626] ring-1 ring-white/10',
        'hover:bg-[#171717]/80 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-0'
      )}
      role="region"
      aria-label={`${label}: ${count} pages`}
      tabIndex={0}
    >
      <CardContent className="p-6 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-label text-[#A1A1AA]">{label}</p>
          <p className={cn('text-heading font-semibold tabular-nums font-mono tracking-[-0.02em]', nano.color)}>{count}</p>
        </div>
        <div className="p-3 bg-black/40 rounded-md border border-[#262626] ring-1 ring-white/10">
          <Icon className={cn('w-5 h-5', nano.color)} aria-hidden="true" />
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
        'rounded-xl bg-[#171717] border border-[#262626] ring-1 ring-white/10',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-0'
      )}
      role="region"
      aria-label={`${label}: ${value}`}
      tabIndex={0}
    >
      <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
        <div className={cn(
          'p-2 rounded-md border border-[#262626] ring-1 ring-white/10',
          highlight ? 'bg-[#F5A524]/10 text-[#F5A524]' : 'bg-black/40 text-[#A1A1AA]'
        )}>
          {icon}
        </div>
        <span className={cn('text-heading font-semibold tabular-nums font-mono tracking-[-0.02em]', highlight ? 'text-[#F5A524]' : 'text-[#EDEDED]')}>
          {value}
        </span>
        <span className="text-label uppercase tracking-wider text-[#A1A1AA]">{label}</span>
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

  const [query, setQuery] = React.useState('')
  const [activeView, setActiveView] = React.useState<'overview' | 'registry'>('overview')
  const [statusFilter, setStatusFilter] = React.useState<CanonStatus | 'ALL'>('ALL')

  const filteredSections = React.useMemo(() => {
    const normalized = query.trim().toLowerCase()

    return CANON_SECTIONS.map((section) => {
      const pages = getCanonPagesBySection(section.id)
      const filteredPages = pages.filter((page) => {
        const matchesQuery =
          normalized.length === 0 ||
          page.meta.title.toLowerCase().includes(normalized) ||
          page.meta.id.toLowerCase().includes(normalized) ||
          page.slug.toLowerCase().includes(normalized)

        const matchesStatus = statusFilter === 'ALL' || page.meta.status === statusFilter

        return matchesQuery && matchesStatus
      })

      return {
        section,
        pages: filteredPages,
        total: pages.length,
      }
    })
  }, [query, statusFilter])

  const filteredPageCount = React.useMemo(() => {
    return filteredSections.reduce((acc, item) => acc + item.pages.length, 0)
  }, [filteredSections])

  return (
    <>
      {/* Skip Navigation - WCAG 2.1 Requirement */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#F5A524] focus:text-black focus:font-semibold"
      >
        Skip to main content
      </a>

      <main 
        id="main-content" 
        className="animate-in fade-in duration-500 pt-layout-2xl pb-layout-2xl bg-[#0A0A0A] text-[#EDEDED]" 
        role="main"
      >
        <div className="mx-auto w-full max-w-7xl px-layout-md space-y-8">
          <div className="sticky top-0 z-40 -mx-layout-md px-layout-md pt-4 pb-4 backdrop-blur-md bg-black/50 border-b border-white/10">
            <header aria-labelledby="page-title" className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#3B82F6]/10 rounded-md border border-[#262626] ring-1 ring-white/10">
                      <BookOpen className="w-6 h-6 text-[#3B82F6]" aria-hidden="true" />
                    </div>
                    <div>
                      <h1
                        id="page-title"
                        className="text-display font-semibold text-[#EDEDED] tracking-[-0.02em]"
                      >
                        {PAGE_META.name}
                      </h1>
                      <p className="text-body font-normal text-[#A1A1AA]">
                        Governance-first overview with tokenized UI and real registry data
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        asChild
                        variant="outline"
                        className="rounded-md border-[#262626] bg-black/40 text-[#EDEDED] ring-1 ring-white/10 hover:bg-black/60"
                      >
                        <Link href="/dashboard" aria-label="Open main dashboard">
                          <ExternalLink className="w-4 h-4" aria-hidden="true" />
                          Open Dashboard
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={8}>Return to the main dashboard</TooltipContent>
                  </Tooltip>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="rounded-md border-[#262626] bg-black/40 text-[#EDEDED] ring-1 ring-white/10 hover:bg-black/60"
                        aria-label="Open dashboard filters"
                      >
                        <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
                        Filters
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Status Filter</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setStatusFilter('ALL')}>
                        All
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('ACTIVE')}>
                        Active
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('DRAFT')}>
                        Draft
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('DEPRECATED')}>
                        Deprecated
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('ARCHIVED')}>
                        Archived
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <Card className="rounded-xl bg-[#171717]/70 border border-[#262626] ring-1 ring-white/10">
                <CardContent className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 text-label uppercase tracking-wider text-[#A1A1AA]">
                      <Search className="w-4 h-4" aria-hidden="true" />
                      Command Bar
                    </div>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                      <div className="flex-1">
                        <Input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search by title, id, or slug"
                          aria-label="Search canon pages"
                          className="rounded-md bg-[#0A0A0A] border-[#262626] text-[#EDEDED] placeholder:text-[#A1A1AA]/60 ring-1 ring-white/10 focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-0"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="rounded-md border-[#262626] text-[#A1A1AA] ring-1 ring-white/10 tabular-nums font-mono"
                          aria-label={`Filtered pages: ${filteredPageCount}`}
                        >
                          {filteredPageCount} / {totalPages}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="rounded-md border-[#262626] text-[#A1A1AA] ring-1 ring-white/10"
                          aria-label={`Status filter: ${statusFilter}`}
                        >
                          <Filter className="w-3 h-3" aria-hidden="true" />
                          {statusFilter}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-72 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-label uppercase tracking-wider text-[#A1A1AA]">System Health</span>
                      <span className="text-body font-semibold text-[#EDEDED] tabular-nums font-mono">{healthScore}%</span>
                    </div>
                    <Progress
                      value={healthScore}
                      className="bg-[#262626] ring-1 ring-white/10"
                      indicatorClassName="bg-[#F5A524]"
                      aria-label={`System health ${healthScore} percent`}
                    />
                  </div>
                </CardContent>
              </Card>
            </header>
          </div>

          <Tabs
            value={activeView}
            onValueChange={(v) => setActiveView(v as 'overview' | 'registry')}
            className="space-y-6"
          >
            <TabsList
              aria-label="Dashboard sections"
              className="bg-[#171717] border border-[#262626] ring-1 ring-white/10 rounded-xl p-1"
            >
              <TabsTrigger
                value="overview"
                aria-label="Overview section"
                className="rounded-md data-[state=active]:bg-[#0A0A0A] data-[state=active]:text-[#EDEDED] text-[#A1A1AA]"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="registry"
                aria-label="Registry section"
                className="rounded-md data-[state=active]:bg-[#0A0A0A] data-[state=active]:text-[#EDEDED] text-[#A1A1AA]"
              >
                Registry
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              {/* --- HERO SECTION --- */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className={cn('md:col-span-3 rounded-xl bg-gradient-to-br from-[#171717] to-[#0A0A0A] border border-[#262626] ring-1 ring-white/10')}>
                  <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between p-8 gap-6">
                    <div className="space-y-4 max-w-3xl">
                      <h2 className="text-heading font-semibold tracking-[-0.02em] text-[#EDEDED]">
                        Operational Snapshot
                      </h2>
                      <p className="text-body font-normal text-[#A1A1AA] leading-relaxed">
                        The overview focuses on the highest-signal metrics first to reduce cognitive load while keeping the full registry one click away.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatTile
                          label="Total Pages"
                          value={totalPages}
                          icon={<BookOpen className="w-4 h-4" aria-hidden="true" />}
                        />
                        <StatTile
                          label="Domains"
                          value={CANON_SECTIONS.length}
                          icon={<Activity className="w-4 h-4" aria-hidden="true" />}
                        />
                        <StatTile
                          label="Production Ready"
                          value={statusCounts.ACTIVE}
                          icon={<ShieldCheck className="w-4 h-4 text-[#F5A524]" aria-hidden="true" />}
                          highlight
                        />
                      </div>
                    </div>

                    <div className={cn('flex flex-col items-center p-4 bg-black/40 rounded-xl backdrop-blur-sm border border-[#262626] ring-1 ring-white/10 w-full md:w-auto')}>
                      <HealthRing percentage={healthScore} />
                      <span className="text-label mt-2 font-medium text-[#A1A1AA]">
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
                  className="text-heading font-semibold tracking-[-0.02em] mb-4 flex items-center gap-2 text-[#EDEDED]"
                >
                  <Activity className="w-5 h-5 text-[#A1A1AA]" aria-hidden="true" /> 
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

              <section aria-labelledby="quick-links-heading">
                <h2
                  id="quick-links-heading"
                  className="text-heading font-semibold tracking-[-0.02em] mb-4 flex items-center gap-2 text-[#EDEDED]"
                >
                  <BarChart className="w-5 h-5 text-[#A1A1AA]" aria-hidden="true" />
                  Registry Highlights
                </h2>
                <Card className="rounded-xl bg-[#171717] border border-[#262626] ring-1 ring-white/10">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-body font-normal text-[#A1A1AA]">
                        Use the Registry tab to browse domains. Search and filters stay active between views.
                      </p>
                      <Button
                        variant="default"
                        onClick={() => setActiveView('registry')}
                        aria-label="Open registry view"
                        className="rounded-md bg-[#F5A524] text-black hover:bg-[#F5A524]/90"
                      >
                        Open Registry
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {filteredSections.slice(0, 3).map(({ section, pages, total }) => {
                        const Icon = section.icon
                        return (
                          <div key={section.id} className="rounded-xl border border-[#262626] bg-black/40 ring-1 ring-white/10 p-4">
                            <div className="flex items-center gap-2">
                              <Icon className={cn('w-4 h-4', section.color)} aria-hidden="true" />
                              <span className="text-body font-semibold tracking-[-0.02em] text-[#EDEDED]">{section.label}</span>
                            </div>
                            <div className="mt-2 text-small text-[#A1A1AA] tabular-nums font-mono">
                              Showing {pages.length} / {total} pages
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </section>
            </TabsContent>

            <TabsContent value="registry" className="space-y-8">
              {/* --- DOMAIN REGISTRY --- */}
              <section aria-labelledby="domain-registry-heading">
                <h2 
                  id="domain-registry-heading"
                  className="text-heading font-semibold tracking-[-0.02em] mb-4 flex items-center gap-2 text-[#EDEDED]"
                >
                  <FileText className="w-5 h-5 text-[#A1A1AA]" aria-hidden="true" /> 
                  Domain Registry
                </h2>

                <Accordion type="multiple" className="space-y-4">
                  {filteredSections.map(({ section, pages, total }) => {
                    const Icon = section.icon

                    return (
                      <AccordionItem
                        key={section.id}
                        value={section.id}
                        className="rounded-xl border border-[#262626] bg-[#171717] ring-1 ring-white/10 px-6"
                      >
                        <AccordionTrigger
                          className="hover:no-underline"
                          aria-label={`${section.label} domain, ${pages.length} pages shown`}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <Icon 
                              className={cn('w-5 h-5', section.color)} 
                              aria-hidden="true"
                            />
                            <div className="text-left">
                              <div className="text-subheading font-semibold tracking-[-0.02em] text-[#EDEDED]">
                                {section.label}
                              </div>
                              <div className="text-label text-[#A1A1AA] mt-1">
                                Showing {pages.length} / {total} pages • {section.description}
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
                                          'rounded-md border border-[#262626] bg-black/30 ring-1 ring-white/10',
                                          'hover:bg-black/50',
                                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-0',
                                          'transition-colors'
                                        )}
                                        aria-label={`View ${page.meta.title}, version ${page.meta.version}, status ${page.meta.status}`}
                                      >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                          <FileText 
                                            className="w-4 h-4 text-[#A1A1AA] flex-shrink-0" 
                                            aria-hidden="true"
                                          />
                                          <div className="flex-1 min-w-0">
                                            <div className="text-body font-medium text-[#EDEDED] truncate">
                                              {page.meta.title}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                              <span className="text-label text-[#A1A1AA] font-mono tabular-nums">
                                                v{page.meta.version}
                                              </span>
                                              <span className="text-label text-[#A1A1AA] font-mono tabular-nums">
                                                {page.meta.id}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                          <Badge
                                            variant="outline"
                                            className={cn(
                                              page.meta.status === 'ACTIVE'
                                                ? 'text-[#3B82F6] bg-[#3B82F6]/10 border-[#3B82F6]/30'
                                                : page.meta.status === 'DRAFT'
                                                  ? 'text-[#F5A524] bg-[#F5A524]/10 border-[#F5A524]/30'
                                                  : page.meta.status === 'DEPRECATED'
                                                    ? 'text-[#F5A524] bg-[#F5A524]/10 border-[#F5A524]/30'
                                                    : 'text-[#A1A1AA] bg-[#A1A1AA]/10 border-[#A1A1AA]/30',
                                              'rounded-md ring-1 ring-white/10',
                                              'text-label uppercase tracking-wider'
                                            )}
                                            role="status"
                                            aria-label={`Status: ${config.label}`}
                                          >
                                            {config.label}
                                          </Badge>
                                          <ArrowRight 
                                            className="w-4 h-4 text-[#A1A1AA]" 
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
                              <p className="text-body text-[#A1A1AA]">
                                No pages match the current search/filter
                              </p>
                              <p className="text-label text-[#A1A1AA]/70 mt-2 font-mono">
                                Clear filters or adjust query in the command bar above
                              </p>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              </section>
            </TabsContent>
          </Tabs>

          {/* --- FOOTER --- */}
          <footer 
            className="border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-[#A1A1AA]"
            role="contentinfo"
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-1.5 h-1.5 rounded-full bg-[#F5A524] animate-pulse" 
                aria-hidden="true"
              />
              <span className="text-label font-mono">
                Canon v2.0 • Governance-First Architecture
              </span>
            </div>
            <Link 
              href="/dashboard" 
              className={cn(
                'text-[#F5A524] hover:text-[#F5A524]/90',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-0',
                'underline-offset-4 hover:underline',
                'transition-colors',
                'text-label'
              )}
              aria-label="Return to main dashboard"
            >
              Return to Dashboard
            </Link>
          </footer>
        </div>
      </main>
    </>
  )
}
