/**
 * Canon Page Registry
 * 
 * Single source of truth for all Canon pages.
 * 
 * Used for:
 * - Type generation
 * - Route validation
 * - Navigation/indexing
 * - Thin wrapper generation (TOOL_24)
 * 
 * Maintenance: Add new pages here, then run TOOL_24 to generate wrappers.
 */

export interface CanonPageInfo {
  /** Canon ID (e.g., "META_01") */
  canonId: string;
  /** Domain (e.g., "META") */
  domain: string;
  /** Human-readable title */
  title: string;
  /** Short description for metadata and SEO */
  description: string;
  /** Version (optional) */
  version?: string;
  /** Route slug (kebab-case, URL-friendly) */
  slug: string;
  /** Full route path */
  route: string;
  /** MDX file path (relative to canon-pages/) */
  mdxPath: string;
  /** Classification (PUBLIC, INTERNAL, etc.) */
  classification?: 'PUBLIC' | 'INTERNAL' | 'RESTRICTED';
}

/**
 * Registry of all Canon pages.
 * 
 * To add a new page:
 * 1. Create MDX file in canon-pages/{DOMAIN}/
 * 2. Add entry here
 * 3. Run TOOL_24 to generate wrapper
 */
export const CANON_PAGES: Record<string, CanonPageInfo> = {
  // META Domain
  META_01: {
    canonId: 'META_01',
    domain: 'META',
    title: 'The Forensic Metadata Architecture',
    description:
      'Defines the group-level metadata OS, depth limits, and governance model across all domains.',
    version: '1.0.0',
    slug: 'meta-01-metadata-architecture',
    route: '/canon/meta/meta-01-metadata-architecture',
    mdxPath: 'META/META_01_MetadataArchitecture.mdx',
    classification: 'PUBLIC',
  },
  META_02: {
    canonId: 'META_02',
    domain: 'META',
    title: 'Metadata God View',
    description: 'Central registry and navigation hub for all Canon pages.',
    version: '1.0.0',
    slug: 'meta-02-metadata-god-view',
    route: '/canon/meta/meta-02-metadata-god-view',
    mdxPath: 'META/META_02_MetadataGodView.mdx',
    classification: 'PUBLIC',
  },
  META_03: {
    canonId: 'META_03',
    domain: 'META',
    title: 'The Prism',
    description: 'Multi-dimensional view of Canon relationships and dependencies.',
    version: '1.0.0',
    slug: 'meta-03-the-prism',
    route: '/canon/meta/meta-03-the-prism',
    mdxPath: 'META/META_03_ThePrism.mdx',
    classification: 'PUBLIC',
  },
  META_04: {
    canonId: 'META_04',
    domain: 'META',
    title: 'Meta Risk Radar',
    description: 'Risk assessment and compliance monitoring dashboard.',
    version: '1.0.0',
    slug: 'meta-04-meta-risk-radar',
    route: '/canon/meta/meta-04-meta-risk-radar',
    mdxPath: 'META/META_04_MetaRiskRadar.mdx',
    classification: 'PUBLIC',
  },
  META_05: {
    canonId: 'META_05',
    domain: 'META',
    title: 'Meta Canon Matrix',
    description: 'Cross-domain Canon relationship matrix.',
    version: '1.0.0',
    slug: 'meta-05-meta-canon-matrix',
    route: '/canon/meta/meta-05-meta-canon-matrix',
    mdxPath: 'META/META_05_MetaCanonMatrix.mdx',
    classification: 'PUBLIC',
  },
  META_06: {
    canonId: 'META_06',
    domain: 'META',
    title: 'Meta Health Scan',
    description: 'System health and compliance scanning dashboard.',
    version: '1.0.0',
    slug: 'meta-06-meta-health-scan',
    route: '/canon/meta/meta-06-meta-health-scan',
    mdxPath: 'META/META_06_MetaHealthScan.mdx',
    classification: 'PUBLIC',
  },
  META_07: {
    canonId: 'META_07',
    domain: 'META',
    title: 'Meta Lynx Codex',
    description: 'AI assistant for Canon governance and navigation.',
    version: '1.0.0',
    slug: 'meta-07-meta-lynx-codex',
    route: '/canon/meta/meta-07-meta-lynx-codex',
    mdxPath: 'META/META_07_MetaLynxCodex.mdx',
    classification: 'PUBLIC',
  },
  META_08: {
    canonId: 'META_08',
    domain: 'META',
    title: 'Implementation Playbook',
    description: 'Step-by-step guide for implementing Canon patterns.',
    version: '1.0.0',
    slug: 'meta-08-implementation-playbook',
    route: '/canon/meta/meta-08-implementation-playbook',
    mdxPath: 'META/META_08_ImplementationPlaybook.mdx',
    classification: 'PUBLIC',
  },

  // PAY Domain
  PAY_01: {
    canonId: 'PAY_01',
    domain: 'PAY',
    title: 'Payment Hub Canon',
    description:
      'Defines the compliant, cell-based payment flow canon including invoice, tax, approval, and treasury cells.',
    version: '1.0.0',
    slug: 'pay-01-payment-hub',
    route: '/canon/pay/pay-01-payment-hub',
    mdxPath: 'PAY/PAY_01_PaymentHub.mdx',
    classification: 'INTERNAL',
  },

  // REG Domain
  REG_01: {
    canonId: 'REG_01',
    domain: 'REG',
    title: 'Login Page',
    description: 'User authentication and login flow.',
    version: '1.0.0',
    slug: 'reg-01-login',
    route: '/canon/reg/reg-01-login',
    mdxPath: 'REG/REG_01_Login.mdx',
    classification: 'PUBLIC',
  },
  REG_02: {
    canonId: 'REG_02',
    domain: 'REG',
    title: 'Sign Up Page',
    description: 'User registration and account creation flow.',
    version: '1.0.0',
    slug: 'reg-02-sign-up',
    route: '/canon/reg/reg-02-sign-up',
    mdxPath: 'REG/REG_02_SignUp.mdx',
    classification: 'PUBLIC',
  },
  REG_03: {
    canonId: 'REG_03',
    domain: 'REG',
    title: 'Reset Password Page',
    description: 'Password reset and recovery flow.',
    version: '1.0.0',
    slug: 'reg-03-reset-password',
    route: '/canon/reg/reg-03-reset-password',
    mdxPath: 'REG/REG_03_ResetPassword.mdx',
    classification: 'PUBLIC',
  },

  // SYS Domain
  SYS_01: {
    canonId: 'SYS_01',
    domain: 'SYS',
    title: 'System Bootloader',
    description: 'System initialization and configuration management.',
    version: '1.0.0',
    slug: 'sys-01-bootloader',
    route: '/canon/sys/sys-01-bootloader',
    mdxPath: 'SYS/SYS_01_Bootloader.mdx',
    classification: 'INTERNAL',
  },
  SYS_02: {
    canonId: 'SYS_02',
    domain: 'SYS',
    title: 'System Organization',
    description: 'Organization structure and hierarchy management.',
    version: '1.0.0',
    slug: 'sys-02-organization',
    route: '/canon/sys/sys-02-organization',
    mdxPath: 'SYS/SYS_02_Organization.mdx',
    classification: 'INTERNAL',
  },
  SYS_03: {
    canonId: 'SYS_03',
    domain: 'SYS',
    title: 'System Access Control',
    description: 'Access control and permission management.',
    version: '1.0.0',
    slug: 'sys-03-access',
    route: '/canon/sys/sys-03-access',
    mdxPath: 'SYS/SYS_03_Access.mdx',
    classification: 'INTERNAL',
  },
  SYS_04: {
    canonId: 'SYS_04',
    domain: 'SYS',
    title: 'System Profile',
    description: 'User profile and settings management.',
    version: '1.0.0',
    slug: 'sys-04-profile',
    route: '/canon/sys/sys-04-profile',
    mdxPath: 'SYS/SYS_04_Profile.mdx',
    classification: 'INTERNAL',
  },

  // INV Domain
  INV_01: {
    canonId: 'INV_01',
    domain: 'INV',
    title: 'Inventory Dashboard',
    description: 'Inventory management and tracking dashboard.',
    version: '1.0.0',
    slug: 'inv-01-dashboard',
    route: '/canon/inv/inv-01-dashboard',
    mdxPath: 'INV/INV_01_Dashboard.mdx',
    classification: 'INTERNAL',
  },
} as const;

/**
 * Get page info by Canon ID
 */
export function getCanonPageInfo(canonId: string): CanonPageInfo | undefined {
  return CANON_PAGES[canonId];
}

/**
 * Get all pages for a domain
 */
export function getPagesByDomain(domain: string): CanonPageInfo[] {
  return Object.values(CANON_PAGES).filter((page) => page.domain === domain);
}

/**
 * Get all pages (for indexing/navigation)
 */
export function getAllCanonPages(): CanonPageInfo[] {
  return Object.values(CANON_PAGES);
}

/**
 * Get pages by classification
 */
export function getPagesByClassification(
  classification: CanonPageInfo['classification']
): CanonPageInfo[] {
  return Object.values(CANON_PAGES).filter(
    (page) => page.classification === classification
  );
}

/**
 * Type helpers for TypeScript
 */
export type CanonPageId = keyof typeof CANON_PAGES;
export type CanonDomain = CanonPageInfo['domain'];
