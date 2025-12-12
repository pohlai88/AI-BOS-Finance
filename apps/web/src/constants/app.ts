/**
 * Application Metadata
 * 
 * Single source of truth for app version and branding.
 * 
 * VERSION MANAGEMENT:
 * - Update `package.json` version when releasing
 * - This file imports from package.json via Vite's JSON import
 * - All components should reference APP_CONFIG, never hardcode versions
 * 
 * USAGE:
 * ```tsx
 * import { APP_CONFIG } from '@/constants/app';
 * <span>{APP_CONFIG.version}</span>
 * ```
 */

// Import version from package.json (Vite handles this)
import packageJson from '../../package.json';

export const APP_CONFIG = {
  /** Application name */
  name: 'NexusCanon',
  
  /** Application tagline */
  tagline: 'Forensic Architecture',
  
  /** 
   * Version from package.json
   * Format: MAJOR.MINOR.PATCH (SemVer)
   * - MAJOR: Breaking changes
   * - MINOR: New features, backward compatible
   * - PATCH: Bug fixes
   */
  version: packageJson.version,
  
  /** Full version string with prefix */
  versionDisplay: `v${packageJson.version}`,
  
  /** Copyright holder */
  copyright: 'NexusCanon',
  
  /** Support email */
  email: 'contact@nexuscanon.com',
  
  /** Social links */
  social: {
    twitter: 'https://twitter.com/nexuscanon',
    github: 'https://github.com/nexuscanon',
    linkedin: 'https://linkedin.com/company/nexuscanon',
  },
  
  /** External URLs */
  urls: {
    docs: '/docs',
    api: '/api',
    status: '/status',
    privacy: '/privacy',
    terms: '/terms',
  },
} as const;

/** Type for APP_CONFIG */
export type AppConfig = typeof APP_CONFIG;

