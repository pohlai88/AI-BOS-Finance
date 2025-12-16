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
    <div className="flex min-h-screen bg-background">
      {/* Canon Sidebar */}
      <aside className="w-64 border-r border-subtle/30 hidden md:flex md:flex-col bg-surface-subtle/20">
        {/* Header */}
        <div className="p-4 border-b border-subtle/30">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-text-primary/60 hover:text-text-primary text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="mt-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="font-semibold text-text-primary">Nexus Canon</span>
          </div>
          <p className="text-xs text-text-primary/50 mt-1">
            Governed Documentation
          </p>
        </div>

        {/* Navigation - Using SSOT CANON_SECTIONS */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {CANON_SECTIONS.map((section) => {
            const Icon = section.icon
            // Get pages dynamically from registry (DRY!)
            const pages = getCanonPagesBySection(section.id)
            
            return (
              <div key={section.id}>
                <div className="flex items-center gap-2 text-xs font-semibold text-text-primary/50 uppercase tracking-wider mb-2">
                  <Icon className="w-3.5 h-3.5" />
                  {section.label}
                </div>
                <ul className="space-y-1">
                  {pages.map((page) => (
                    <li key={page.slug}>
                      <Link
                        href={`/canon/${section.id}/${page.slug}`}
                        className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-text-primary/70 hover:text-text-primary hover:bg-surface-subtle/50 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-text-primary/40" />
                        {page.meta.id}: {page.meta.title}
                      </Link>
                    </li>
                  ))}
                  {pages.length === 0 && (
                    <li className="text-xs text-text-primary/30 italic px-2 py-1">
                      No pages yet
                    </li>
                  )}
                </ul>
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-subtle/30 text-xs text-text-primary/40">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Canon v2.0
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-12">
          {children}
        </div>
      </main>
    </div>
  )
}
