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

  // ============================================================================
  // PAYMENT SERIES - Payment Processing
  // ============================================================================
  // 'payment/pay-01-payment-hub': {
  //   component: () => import('./PAYMENT/pay-01-payment-hub.mdx'),
  //   meta: {
  //     id: 'PAY_01',
  //     title: 'Payment Hub',
  //     status: 'ACTIVE',
  //     version: '1.0.0',
  //     lastUpdated: '2025-12-12',
  //     description: 'Central payment processing and gateway management',
  //   },
  // },

  // ============================================================================
  // SYSTEM SERIES - System Configuration
  // ============================================================================
  // 'system/sys-01-bootloader': {
  //   component: () => import('./SYSTEM/sys-01-bootloader.mdx'),
  //   meta: {
  //     id: 'SYS_01',
  //     title: 'System Bootloader',
  //     status: 'ACTIVE',
  //     version: '1.0.0',
  //     lastUpdated: '2025-12-12',
  //     description: 'Initial system setup and configuration wizard',
  //   },
  // },
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
