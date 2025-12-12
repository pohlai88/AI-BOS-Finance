/**
 * Canon Registry System
 * 
 * This registry serves as the source of truth for all canon files and their relationships
 * to the presentation layer in canon-pages.
 * 
 * @see CONT_01_CanonIdentity for governance rules
 */

// Import types from canon-pages registry when needed
// import { CANON_REGISTRY } from '../canon-pages/registry';

/**
 * Canon file types based on directory structure
 */
export type CanonFileType = 
  | 'ADR'   // Architectural Decision Records
  | 'CONT'  // Contracts
  | 'COMP'  // Components
  | 'CELL'  // Cells
  | 'PAGE'  // Pages
  | 'CONST' // Constants
  | 'ENT'   // Entities
  | 'POLY'  // Policies
  | 'SCH'   // Schemas
  | 'TOOL'  // Tools
  | 'REF'   // References
  | 'SPEC'; // Specifications

/**
 * Status of canon files
 */
export type CanonStatus = 'ACTIVE' | 'DRAFT' | 'DEPRECATED' | 'ARCHIVED';

/**
 * Canon file interface
 */
export interface CanonFile {
  /** Relative path within canon directory */
  path: string;
  /** Type of canon file */
  type: CanonFileType;
  /** Unique identifier (e.g., ADR_001) */
  id: string;
  /** Human-readable title */
  title: string;
  /** Current status */
  status: CanonStatus;
  /** Path to corresponding MDX file in canon-pages if available */
  mdxPath?: string;
}

/**
 * Registry of all canon files
 * Key: Relative path within canon directory
 * Value: CanonFile metadata
 */
export const CANON_FILES: Record<string, CanonFile> = {
  // A-Governance/A-ADR
  'A-Governance/A-ADR/ADR_001_NextJsAppRouter.md': {
    path: 'A-Governance/A-ADR/ADR_001_NextJsAppRouter.md',
    type: 'ADR',
    id: 'ADR_001',
    title: 'Next.js App Router',
    status: 'ACTIVE',
  },
  'A-Governance/A-ADR/ADR_002_CanonSecurity.md': {
    path: 'A-Governance/A-ADR/ADR_002_CanonSecurity.md',
    type: 'ADR',
    id: 'ADR_002',
    title: 'Canon Security',
    status: 'ACTIVE',
  },
  'A-Governance/A-ADR/CANON_BUILD_COMPLETE.md': {
    path: 'A-Governance/A-ADR/CANON_BUILD_COMPLETE.md',
    type: 'ADR',
    id: 'CANON_BUILD',
    title: 'Canon Dashboard Build Complete',
    status: 'ACTIVE',
  },

  // A-Governance/A-CONT
  'A-Governance/A-CONT/CONT_01_CanonIdentity.md': {
    path: 'A-Governance/A-CONT/CONT_01_CanonIdentity.md',
    type: 'CONT',
    id: 'CONT_01',
    title: 'Canon Identity',
    status: 'ACTIVE',
  },
  'A-Governance/A-CONT/MCP_IMPLEMENTATION_STATUS.md': {
    path: 'A-Governance/A-CONT/MCP_IMPLEMENTATION_STATUS.md',
    type: 'CONT',
    id: 'MCP_STATUS',
    title: 'MCP Implementation Status',
    status: 'ACTIVE',
  },

  // B-Functional/B-COMP
  'B-Functional/B-COMP/CANON_DASHBOARD_ACCESSIBILITY.md': {
    path: 'B-Functional/B-COMP/CANON_DASHBOARD_ACCESSIBILITY.md',
    type: 'COMP',
    id: 'COMP_ACCESSIBILITY',
    title: 'Canon Dashboard Accessibility',
    status: 'ACTIVE',
  },
  'B-Functional/B-COMP/TAILWIND_V4_FIX_COMPLETE.md': {
    path: 'B-Functional/B-COMP/TAILWIND_V4_FIX_COMPLETE.md',
    type: 'COMP',
    id: 'COMP_TAILWIND_FIX',
    title: 'Tailwind v4 Fix Complete',
    status: 'ACTIVE',
  },
  'B-Functional/B-COMP/TAILWIND_V4_MIGRATION_DIFF.md': {
    path: 'B-Functional/B-COMP/TAILWIND_V4_MIGRATION_DIFF.md',
    type: 'COMP',
    id: 'COMP_TAILWIND_MIGRATION',
    title: 'Tailwind v4 Migration Diff',
    status: 'ACTIVE',
  },

  // C-DataLogic/C-POLY
  'C-DataLogic/C-POLY/MCP_ORCHESTRATION_METHOD.md': {
    path: 'C-DataLogic/C-POLY/MCP_ORCHESTRATION_METHOD.md',
    type: 'POLY',
    id: 'POLY_MCP_ORCHESTRATION',
    title: 'MCP Orchestration Method',
    status: 'ACTIVE',
    mdxPath: 'meta/meta-03-the-prism',
  },

  // D-Operations/D-TOOL
  'D-Operations/D-TOOL/SECURITY_FIX_COMPLETE.md': {
    path: 'D-Operations/D-TOOL/SECURITY_FIX_COMPLETE.md',
    type: 'TOOL',
    id: 'TOOL_SECURITY_FIX',
    title: 'Security Fix Complete',
    status: 'ACTIVE',
  },
  'D-Operations/D-TOOL/MCP_VSCODE_VALIDATION.md': {
    path: 'D-Operations/D-TOOL/MCP_VSCODE_VALIDATION.md',
    type: 'TOOL',
    id: 'TOOL_MCP_VALIDATION',
    title: 'MCP VS Code Validation',
    status: 'ACTIVE',
  },

  // E-Knowledge/E-REF
  'E-Knowledge/E-REF/IMPLEMENTATION_REPORT.md': {
    path: 'E-Knowledge/E-REF/IMPLEMENTATION_REPORT.md',
    type: 'REF',
    id: 'REF_IMPLEMENTATION',
    title: 'Implementation Report',
    status: 'ACTIVE',
    mdxPath: 'meta/meta-01-architecture',
  },
  'E-Knowledge/E-REF/BUILD_SUMMARY.md': {
    path: 'E-Knowledge/E-REF/BUILD_SUMMARY.md',
    type: 'REF',
    id: 'REF_BUILD_SUMMARY',
    title: 'Build Summary',
    status: 'ACTIVE',
    mdxPath: 'meta/meta-02-god-view',
  },

  // E-Knowledge/E-SPEC
  'E-Knowledge/E-SPEC/PRD_KERNEL_01_AIBOS_KERNEL.md': {
    path: 'E-Knowledge/E-SPEC/PRD_KERNEL_01_AIBOS_KERNEL.md',
    type: 'SPEC',
    id: 'SPEC_KERNEL_01',
    title: 'AIBOS Kernel (The Brain)',
    status: 'ACTIVE',
  },
};

/**
 * Get MDX page for a canon file
 */
export function getMdxForCanonFile(canonPath: string): string | undefined {
  const file = CANON_FILES[canonPath];
  if (!file?.mdxPath) return undefined;
  return file.mdxPath;
}

/**
 * Get canon file for an MDX page
 */
export function getCanonForMdxPage(mdxPath: string): CanonFile | undefined {
  return Object.values(CANON_FILES).find(file => file.mdxPath === mdxPath);
}

/**
 * Get all canon files of a specific type
 */
export function getCanonFilesByType(type: CanonFileType): CanonFile[] {
  return Object.values(CANON_FILES).filter(file => file.type === type);
}

/**
 * Get all canon files with a specific status
 */
export function getCanonFilesByStatus(status: CanonStatus): CanonFile[] {
  return Object.values(CANON_FILES).filter(file => file.status === status);
}

/**
 * Get related canon files based on type and ID pattern
 */
export function getRelatedCanonFiles(file: CanonFile, limit = 5): CanonFile[] {
  const related = Object.values(CANON_FILES).filter(f => 
    f.path !== file.path && (
      f.type === file.type || 
      f.id.startsWith(file.id.split('_')[0])
    )
  );
  
  return related.slice(0, limit);
}
