import Link from 'next/link'
import { BookOpen, FileText, Database, Settings, CreditCard, ArrowRight } from 'lucide-react'
import { CANON_REGISTRY, getCanonPagesBySection } from '@/canon-pages/registry'

/**
 * Canon Index Page
 * 
 * Landing page for the Canon documentation system.
 * Lists all available Canon pages organized by section.
 * 
 * @see REF_037 - Phase 3: Canon Page System
 */

const SECTIONS = [
  { id: 'meta', label: 'Metadata Series', icon: Database, description: 'Data architecture and governance' },
  { id: 'payment', label: 'Payment Series', icon: CreditCard, description: 'Payment processing and transactions' },
  { id: 'system', label: 'System Series', icon: Settings, description: 'System configuration and setup' },
]

export default function CanonIndexPage() {
  const totalPages = Object.keys(CANON_REGISTRY).length

  return (
    <div className="space-y-12">
      {/* Header */}
      <header className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <BookOpen className="w-10 h-10 text-nexus-green" />
        </div>
        <h1 className="text-4xl font-bold text-nexus-signal mb-4">
          Nexus Canon
        </h1>
        <p className="text-lg text-nexus-signal/60 max-w-2xl mx-auto">
          The governed knowledge base for NexusCanon. All documentation is versioned, 
          tracked, and subject to Canon governance rules.
        </p>
        <div className="mt-4 text-sm text-nexus-signal/40">
          {totalPages} documented page{totalPages !== 1 ? 's' : ''} in the Canon
        </div>
      </header>

      {/* Sections Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {SECTIONS.map((section) => {
          const Icon = section.icon
          const pages = getCanonPagesBySection(section.id)

          return (
            <div
              key={section.id}
              className="border border-nexus-border/30 rounded-lg p-6 bg-nexus-surface/10 hover:bg-nexus-surface/20 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-nexus-green/10">
                  <Icon className="w-5 h-5 text-nexus-green" />
                </div>
                <div>
                  <h2 className="font-semibold text-nexus-signal">{section.label}</h2>
                  <p className="text-xs text-nexus-signal/50">{section.description}</p>
                </div>
              </div>

              {pages.length > 0 ? (
                <ul className="space-y-2">
                  {pages.map((page) => (
                    <li key={page.slug}>
                      <Link
                        href={`/canon/${section.id}/${page.slug}`}
                        className="flex items-center justify-between group px-3 py-2 rounded bg-nexus-surface/20 hover:bg-nexus-surface/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-nexus-signal/40" />
                          <span className="text-sm text-nexus-signal/80 group-hover:text-nexus-signal">
                            {page.meta.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-nexus-signal/40">{page.meta.id}</span>
                          <ArrowRight className="w-3 h-3 text-nexus-signal/40 group-hover:text-nexus-green transition-colors" />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-nexus-signal/40 italic">
                  No pages yet. Coming soon.
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <footer className="text-center text-sm text-nexus-signal/40 border-t border-nexus-border/30 pt-8">
        <p>
          All Canon pages are governed by the NexusCanon framework.
        </p>
        <p className="mt-1">
          <Link href="/dashboard" className="text-nexus-green hover:underline">
            Return to Dashboard
          </Link>
        </p>
      </footer>
    </div>
  )
}
