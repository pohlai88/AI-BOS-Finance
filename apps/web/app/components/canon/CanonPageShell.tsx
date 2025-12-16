/**
 * CanonPageShell - Shared Shell Component for All Canon Pages
 * 
 * Purpose: Single shell component used by all Canon pages.
 * Maintenance: Update styling/layout here, affects all Canon pages.
 * Scalability: Registry-driven, no hardcoded values.
 * 
 * Location: app/components/canon/CanonPageShell.tsx
 * 
 * Design: Uses NexusCanon design tokens for consistency.
 */

import type { ReactNode } from 'react';
// Import from local canon-pages registry
import type { CanonPageMeta } from '@/canon-pages/registry';

interface CanonPageShellProps {
  /** Canon page information from registry */
  pageInfo: CanonPageMeta;
  /** Page content (MDX component) */
  children: ReactNode;
  /** Optional custom header content */
  headerContent?: ReactNode;
  /** Optional custom footer content */
  footerContent?: ReactNode;
}

/**
 * Shared shell component for all Canon pages.
 * 
 * Benefits:
 * - Single place to update styling/layout
 * - Consistent appearance across all Canon pages
 * - Type-safe via registry
 * - Easy to extend
 */
export function CanonPageShell({
  pageInfo,
  children,
  headerContent,
  footerContent,
}: CanonPageShellProps) {
  const { id, title, description, version, status } = pageInfo;
  
  // Extract domain from ID (e.g., META_01 -> META)
  const domain = id.split('_')[0] || 'CANON';

  return (
    <main className="flex min-h-screen flex-col bg-background text-text-primary antialiased">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-subtle/50 bg-surface-subtle/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          {/* Canon ID Badge Row */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {/* Domain */}
            <span className="text-xs font-mono uppercase tracking-wider text-text-primary/70">
              {domain}
            </span>
            <span className="text-xs text-text-primary/50">·</span>
            
            {/* Canon ID */}
            <span className="text-xs font-mono text-primary/80">
              {id}
            </span>
            
            {/* Version */}
            {version && (
              <>
                <span className="text-xs text-text-primary/50">·</span>
                <span className="text-xs text-text-primary/60">v{version}</span>
              </>
            )}
            
            {/* Status Badge */}
            {status && (
              <>
                <span className="text-xs text-text-primary/50">·</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    status === 'ACTIVE'
                      ? 'bg-primary/20 text-primary/80'
                      : status === 'DRAFT'
                      ? 'bg-yellow-400/20 text-yellow-400/80'
                      : status === 'DEPRECATED'
                      ? 'bg-orange-400/20 text-orange-400/80'
                      : 'bg-gray-400/20 text-gray-400/80'
                  }`}
                >
                  {status}
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-semibold text-text-primary mb-2">
            {title}
          </h1>

          {/* Description */}
          {description && (
            <p className="text-sm md:text-base text-text-primary/80 max-w-3xl">
              {description}
            </p>
          )}

          {/* Custom header content */}
          {headerContent && <div className="mt-4">{headerContent}</div>}
        </div>
      </header>

      {/* Content Area */}
      <section className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-8">
          {children}
        </div>
      </section>

      {/* Footer */}
      {footerContent && (
        <footer className="border-t border-subtle/50 bg-surface-subtle/50 mt-auto">
          <div className="mx-auto max-w-7xl px-6 py-4">
            {footerContent}
          </div>
        </footer>
      )}
    </main>
  );
}
