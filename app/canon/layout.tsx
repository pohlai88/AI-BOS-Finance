/**
 * Canon Layout
 *
 * Provides the governance shell for all Canon documentation pages.
 * Includes sidebar navigation and consistent styling.
 *
 * Uses SSOT from registry - no duplicate data!
 *
 * @see REF_037 - Phase 3: Canon Page System
 */

import { ReactNode } from 'react'
import Link from 'next/link'
import { BookOpen, FileText, ArrowLeft } from 'lucide-react'

// SSOT imports from registry (DRY!)
import { CANON_SECTIONS, getCanonPagesBySection } from '@/canon-pages/registry'

export default function CanonLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-nexus-void flex min-h-screen">
      {/* Canon Sidebar */}
      <aside className="border-nexus-border/30 bg-nexus-surface/20 hidden w-64 border-r md:flex md:flex-col">
        {/* Header */}
        <div className="border-nexus-border/30 border-b p-4">
          <Link
            href="/dashboard"
            className="text-nexus-signal/60 hover:text-nexus-signal flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="mt-4 flex items-center gap-2">
            <BookOpen className="text-nexus-green h-5 w-5" />
            <span className="text-nexus-signal font-semibold">Nexus Canon</span>
          </div>
          <p className="text-nexus-signal/50 mt-1 text-xs">
            Governed Documentation
          </p>
        </div>

        {/* Navigation - Using SSOT CANON_SECTIONS */}
        <nav className="flex-1 space-y-6 overflow-y-auto p-4">
          {CANON_SECTIONS.map((section) => {
            const Icon = section.icon
            // Get pages dynamically from registry (DRY!)
            const pages = getCanonPagesBySection(section.id)

            return (
              <div key={section.id}>
                <div className="text-nexus-signal/50 mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                  <Icon className="h-3.5 w-3.5" />
                  {section.label}
                </div>
                <ul className="space-y-1">
                  {pages.map((page) => (
                    <li key={page.slug}>
                      <Link
                        href={`/canon/${section.id}/${page.slug}`}
                        className="text-nexus-signal/70 hover:text-nexus-signal hover:bg-nexus-surface/50 flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors"
                      >
                        <FileText className="text-nexus-signal/40 h-3.5 w-3.5" />
                        {page.meta.id}: {page.meta.title}
                      </Link>
                    </li>
                  ))}
                  {pages.length === 0 && (
                    <li className="text-nexus-signal/30 px-2 py-1 text-xs italic">
                      No pages yet
                    </li>
                  )}
                </ul>
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-nexus-border/30 text-nexus-signal/40 border-t p-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="bg-nexus-green h-1.5 w-1.5 animate-pulse rounded-full" />
            Canon v2.0
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-8 py-12">{children}</div>
      </main>
    </div>
  )
}
