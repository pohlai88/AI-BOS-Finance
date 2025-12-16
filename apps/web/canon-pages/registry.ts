/**
 * Canon Page Registry
 * 
 * Maps URL slugs to MDX page imports.
 * This registry is the SSOT for all Canon documentation pages.
 * 
 * Generated/maintained by TOOL_24_GenerateCanonRegistry.ts
 * or manually updated as pages are added.
 * 
 * @see REF_037 - Phase 3: Canon Page System
 */

import { ComponentType } from 'react'
import { 
  Database, 
  CreditCard, 
  Settings, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Archive,
  type LucideIcon 
} from 'lucide-react'

// =============================================================================
// SSOT: SECTION CONFIGURATION
// =============================================================================

export interface CanonSection {
  id: string
  label: string
  icon: LucideIcon
  description: string
  color: string
}

/**
 * SSOT for all Canon sections/domains
 * Used by both page.tsx and layout.tsx
 */
export const CANON_SECTIONS: CanonSection[] = [
  { 
    id: 'meta', 
    label: 'Metadata', 
    icon: Database, 
    description: 'Data architecture and governance', 
    color: 'text-blue-400' 
  },
  { 
    id: 'payment', 
    label: 'Payment', 
    icon: CreditCard, 
    description: 'Payment processing', 
    color: 'text-emerald-400' 
  },
  { 
    id: 'system', 
    label: 'System', 
    icon: Settings, 
    description: 'Configuration', 
    color: 'text-purple-400' 
  },
]

// =============================================================================
// SSOT: STATUS CONFIGURATION
// =============================================================================

export type CanonStatus = 'ACTIVE' | 'DRAFT' | 'DEPRECATED' | 'ARCHIVED'

export interface StatusConfig {
  icon: LucideIcon
  label: string
  color: string
  bg: string
  border: string
}

/**
 * SSOT for status styling and icons
 * Used by StatusBadge and dashboard cards
 */
export const STATUS_CONFIG: Record<CanonStatus, StatusConfig> = {
  ACTIVE: { 
    icon: CheckCircle, 
    label: 'Active', 
    color: 'text-primary', 
    bg: 'bg-primary/10', 
    border: 'border-primary/30' 
  },
  DRAFT: { 
    icon: Clock, 
    label: 'Draft', 
    color: 'text-yellow-400', 
    bg: 'bg-yellow-400/10', 
    border: 'border-yellow-400/30' 
  },
  DEPRECATED: { 
    icon: AlertTriangle, 
    label: 'Deprecated', 
    color: 'text-orange-400', 
    bg: 'bg-orange-400/10', 
    border: 'border-orange-400/30' 
  },
  ARCHIVED: { 
    icon: Archive, 
    label: 'Archived', 
    color: 'text-gray-400', 
    bg: 'bg-gray-400/10', 
    border: 'border-gray-400/30' 
  },
}

// =============================================================================
// SSOT: HELPER FUNCTIONS
// =============================================================================

/**
 * Get status counts from registry
 */
export function getStatusCounts(): Record<CanonStatus, number> {
  const counts: Record<CanonStatus, number> = { ACTIVE: 0, DRAFT: 0, DEPRECATED: 0, ARCHIVED: 0 }
  Object.values(CANON_REGISTRY).forEach((entry) => {
    counts[entry.meta.status]++
  })
  return counts
}

/**
 * Calculate health score (percentage of ACTIVE pages)
 */
export function getHealthScore(): number {
  const totalPages = Object.keys(CANON_REGISTRY).length
  if (totalPages === 0) return 0
  const statusCounts = getStatusCounts()
  return Math.round((statusCounts.ACTIVE / totalPages) * 100)
}

// =============================================================================
// PAGE METADATA TYPES
// =============================================================================

export interface CanonPageMeta {
  /** Canon ID (e.g., META_01, PAY_01) */
  id: string
  /** Page title */
  title: string
  /** Page status */
  status: 'ACTIVE' | 'DRAFT' | 'DEPRECATED' | 'ARCHIVED'
  /** Version string */
  version: string
  /** Last updated date */
  lastUpdated: string
  /** Description for SEO and previews */
  description?: string
}

export interface CanonPageEntry {
  /** The MDX component (lazy loaded) */
  component: () => Promise<{ default: ComponentType }>
  /** Page metadata */
  meta: CanonPageMeta
}

/**
 * Canon Page Registry
 * 
 * Key format: `{section}/{slug}`
 * Example: `meta/meta-01-architecture`
 */
export const CANON_REGISTRY: Record<string, CanonPageEntry> = {
  // ============================================================================
  // META SERIES - Metadata & Architecture
  // ============================================================================
  'meta/meta-01-architecture': {
    component: () => import('./META/meta-01-architecture.mdx'),
    meta: {
      id: 'META_01',
      title: 'Metadata Architecture',
      status: 'ACTIVE',
      version: '1.0.0',
      lastUpdated: '2025-12-12',
      description: 'Core metadata architecture and data dictionary design',
    },
  },
  'meta/meta-02-god-view': {
    component: () => import('./META/meta-02-god-view.mdx'),
    meta: {
      id: 'META_02',
      title: 'God View',
      status: 'DRAFT',
      version: '0.1.0',
      lastUpdated: '2025-12-12',
      description: 'Comprehensive visualization and monitoring system',
    },
  },
  'meta/meta-03-the-prism': {
    component: () => import('./META/meta-03-the-prism.mdx'),
    meta: {
      id: 'META_03',
      title: 'The Prism',
      status: 'DRAFT',
      version: '0.1.0',
      lastUpdated: '2025-12-12',
      description: 'Data lineage tracking and visualization',
    },
  },

  // ============================================================================
  // PAYMENT SERIES - Payment Processing
  // ============================================================================
  'payment/pay-01-payment-hub': {
    component: () => import('./PAYMENT/pay-01-payment-hub.mdx'),
    meta: {
      id: 'PAY_01',
      title: 'Payment Hub',
      status: 'DRAFT',
      version: '0.1.0',
      lastUpdated: '2025-12-12',
      description: 'Central payment processing and gateway management',
    },
  },

  // ============================================================================
  // SYSTEM SERIES - System Configuration
  // ============================================================================
  'system/sys-01-bootloader': {
    component: () => import('./SYSTEM/sys-01-bootloader.mdx'),
    meta: {
      id: 'SYS_01',
      title: 'System Bootloader',
      status: 'DRAFT',
      version: '0.1.0',
      lastUpdated: '2025-12-12',
      description: 'Initial system setup and configuration wizard',
    },
  },
  'system/sys-02-organization': {
    component: () => import('./SYSTEM/sys-02-organization.mdx'),
    meta: {
      id: 'SYS_02',
      title: 'Organization Management',
      status: 'DRAFT',
      version: '0.1.0',
      lastUpdated: '2025-12-12',
      description: 'Organization entity management and configuration',
    },
  },
}

/**
 * Get all Canon pages for a section
 */
export function getCanonPagesBySection(section: string): Array<{ slug: string; meta: CanonPageMeta }> {
  return Object.entries(CANON_REGISTRY)
    .filter(([key]) => key.startsWith(`${section}/`))
    .map(([key, entry]) => ({
      slug: key.replace(`${section}/`, ''),
      meta: entry.meta,
    }))
}

/**
 * Get all sections
 */
export function getCanonSections(): string[] {
  const sections = new Set<string>()
  Object.keys(CANON_REGISTRY).forEach((key) => {
    const section = key.split('/')[0]
    sections.add(section)
  })
  return Array.from(sections)
}

/**
 * Get a Canon page entry by full path
 */
export function getCanonPage(path: string): CanonPageEntry | undefined {
  return CANON_REGISTRY[path]
}

/**
 * Get all pages by status
 */
export function getCanonPagesByStatus(status: CanonStatus): Array<{ path: string; meta: CanonPageMeta }> {
  return Object.entries(CANON_REGISTRY)
    .filter(([_, entry]) => entry.meta.status === status)
    .map(([key, entry]) => ({
      path: key,
      meta: entry.meta,
    }))
}
