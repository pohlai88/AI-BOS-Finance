import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getCanonPage, CANON_REGISTRY } from '@/canon-pages/registry'
import { CanonPageShell } from './CanonPageShell'

/**
 * Canon Dynamic Page Loader
 * 
 * Catches all `/canon/*` routes and renders the appropriate MDX content.
 * Uses the Canon Registry to map slugs to MDX components.
 * 
 * @see REF_037 - Phase 3: Canon Page System
 */

interface PageProps {
  params: Promise<{
    slug: string[]
  }>
}

/**
 * Generate static params for all registered Canon pages
 * This enables static generation at build time
 */
export async function generateStaticParams() {
  return Object.keys(CANON_REGISTRY).map((key) => ({
    slug: key.split('/'),
  }))
}

/**
 * Generate metadata for each Canon page
 */
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const path = slug.join('/')
  const entry = getCanonPage(path)

  if (!entry) {
    return {
      title: 'Page Not Found | Nexus Canon',
    }
  }

  return {
    title: `${entry.meta.id}: ${entry.meta.title} | Nexus Canon`,
    description: entry.meta.description,
  }
}

export default async function CanonPage({ params }: PageProps) {
  const { slug } = await params
  const path = slug.join('/')

  // Look up in registry
  const entry = getCanonPage(path)

  if (!entry) {
    console.error(`Canon page not found: ${path}`)
    return notFound()
  }

  // Load the MDX component
  const Content = (await entry.component()).default

  return (
    <CanonPageShell meta={entry.meta}>
      <Suspense fallback={<CanonPageLoading />}>
        <article className="prose prose-invert max-w-none">
          <Content />
        </article>
      </Suspense>
    </CanonPageShell>
  )
}

function CanonPageLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-surface-subtle/50 rounded w-3/4" />
      <div className="h-4 bg-surface-subtle/30 rounded w-1/2" />
      <div className="h-32 bg-surface-subtle/20 rounded" />
    </div>
  )
}
