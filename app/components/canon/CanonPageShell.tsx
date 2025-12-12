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
// Note: Path will be @/canon/registry/canon-pages in Next.js with proper tsconfig
// Using relative path for now, will be updated during Next.js migration
import type { CanonPageInfo } from '../../../canon/registry/canon-pages';

interface CanonPageShellProps {
  /** Canon page information from registry */
  pageInfo: CanonPageInfo;
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
  const { canonId, domain, title, description, version, classification } =
    pageInfo;

  return (
    <main className="flex min-h-screen flex-col bg-nexus-void text-nexus-signal antialiased">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-nexus-border/50 bg-nexus-surface/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          {/* Canon ID Badge Row */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {/* Domain */}
            <span className="text-xs font-mono uppercase tracking-wider text-nexus-signal/70">
              {domain}
            </span>
            <span className="text-xs text-nexus-signal/50">·</span>
            
            {/* Canon ID */}
            <span className="text-xs font-mono text-nexus-green/80">
              {canonId}
            </span>
            
            {/* Version */}
            {version && (
              <>
                <span className="text-xs text-nexus-signal/50">·</span>
                <span className="text-xs text-nexus-signal/60">v{version}</span>
              </>
            )}
            
            {/* Classification Badge */}
            {classification && (
              <>
                <span className="text-xs text-nexus-signal/50">·</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    classification === 'PUBLIC'
                      ? 'bg-nexus-green/20 text-nexus-green/80'
                      : classification === 'INTERNAL'
                      ? 'bg-nexus-signal/20 text-nexus-signal/80'
                      : 'bg-red-500/20 text-red-400/80'
                  }`}
                >
                  {classification}
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-semibold text-nexus-signal mb-2">
            {title}
          </h1>

          {/* Description */}
          {description && (
            <p className="text-sm md:text-base text-nexus-signal/80 max-w-3xl">
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
        <footer className="border-t border-nexus-border/50 bg-nexus-surface/50 mt-auto">
          <div className="mx-auto max-w-7xl px-6 py-4">
            {footerContent}
          </div>
        </footer>
      )}
    </main>
  );
}
