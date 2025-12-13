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
  'E-Knowledge/E-REF/REF_042_CanonDashboardAccessibility.md': {
    path: 'E-Knowledge/E-REF/REF_042_CanonDashboardAccessibility.md',
    type: 'REF',
    id: 'REF_042',
    title: 'Canon Dashboard Accessibility',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_043_TailwindV4FixComplete.md': {
    path: 'E-Knowledge/E-REF/REF_043_TailwindV4FixComplete.md',
    type: 'REF',
    id: 'REF_043',
    title: 'Tailwind v4 Fix Complete',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_044_TailwindV4MigrationDiff.md': {
    path: 'E-Knowledge/E-REF/REF_044_TailwindV4MigrationDiff.md',
    type: 'REF',
    id: 'REF_044',
    title: 'Tailwind v4 Migration Diff',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_045_FileAccessControl.md': {
    path: 'E-Knowledge/E-REF/REF_045_FileAccessControl.md',
    type: 'REF',
    id: 'REF_045',
    title: 'File Access Control Strategy',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_046_NextJsRefactoringStrategy.md': {
    path: 'E-Knowledge/E-REF/REF_046_NextJsRefactoringStrategy.md',
    type: 'REF',
    id: 'REF_046',
    title: 'Next.js UI/UX Refactoring Strategy',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_047_AtomicNormalizationSystem.md': {
    path: 'E-Knowledge/E-REF/REF_047_AtomicNormalizationSystem.md',
    type: 'REF',
    id: 'REF_047',
    title: 'Atomic Normalization System',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_048_RefactoringAuditEvaluation.md': {
    path: 'E-Knowledge/E-REF/REF_048_RefactoringAuditEvaluation.md',
    type: 'REF',
    id: 'REF_048',
    title: 'Refactoring Audit & Evaluation',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_049_NextJsBestPractices.md': {
    path: 'E-Knowledge/E-REF/REF_049_NextJsBestPractices.md',
    type: 'REF',
    id: 'REF_049',
    title: 'Next.js Best Practices',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_074_DocsValidationReport.md': {
    path: 'E-Knowledge/E-REF/REF_074_DocsValidationReport.md',
    type: 'REF',
    id: 'REF_074',
    title: 'Documentation Repository Validation & Standardization Report',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_075_DesignSystem.md': {
    path: 'E-Knowledge/E-REF/REF_075_DesignSystem.md',
    type: 'REF',
    id: 'REF_075',
    title: 'NexusCanon Design System',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_076_BrandIdentity.md': {
    path: 'E-Knowledge/E-REF/REF_076_BrandIdentity.md',
    type: 'REF',
    id: 'REF_076',
    title: 'NexusCanon Brand Identity Guide',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_077_UXGuidelines.md': {
    path: 'E-Knowledge/E-REF/REF_077_UXGuidelines.md',
    type: 'REF',
    id: 'REF_077',
    title: 'NexusCanon UX & Behavior Guidelines',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_080_TechnicalRegister.md': {
    path: 'E-Knowledge/E-REF/REF_080_TechnicalRegister.md',
    type: 'REF',
    id: 'REF_080',
    title: 'Frontend Technical Documentation Register',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_081_SchemaFirstArchitecture.md': {
    path: 'E-Knowledge/E-REF/REF_081_SchemaFirstArchitecture.md',
    type: 'REF',
    id: 'REF_081',
    title: 'Schema-First Architecture Guide',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_082_PageCodingStandards.md': {
    path: 'E-Knowledge/E-REF/REF_082_PageCodingStandards.md',
    type: 'REF',
    id: 'REF_082',
    title: 'NexusCanon Page Coding Standards',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_085_MetaNavigationDesign.md': {
    path: 'E-Knowledge/E-REF/REF_085_MetaNavigationDesign.md',
    type: 'REF',
    id: 'REF_085',
    title: 'META Side Navigation Design Specification',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_086_MetaNavigationAudit.md': {
    path: 'E-Knowledge/E-REF/REF_086_MetaNavigationAudit.md',
    type: 'REF',
    id: 'REF_086',
    title: 'META Navigation & Audit Trail System',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_087_BuildReadyChecklist.md': {
    path: 'E-Knowledge/E-REF/REF_087_BuildReadyChecklist.md',
    type: 'REF',
    id: 'REF_087',
    title: 'Build Ready Checklist',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_088_QuickStartGuide.md': {
    path: 'E-Knowledge/E-REF/REF_088_QuickStartGuide.md',
    type: 'REF',
    id: 'REF_088',
    title: 'NexusCanon META-Series Quick Start Guide',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_089_KeyboardShortcuts.md': {
    path: 'E-Knowledge/E-REF/REF_089_KeyboardShortcuts.md',
    type: 'REF',
    id: 'REF_089',
    title: 'NexusCanon META-Series Keyboard Shortcuts',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_092_DeveloperHandoff.md': {
    path: 'E-Knowledge/E-REF/REF_092_DeveloperHandoff.md',
    type: 'REF',
    id: 'REF_092',
    title: 'Developer Handoff Document',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_093_RegSeriesCompletion.md': {
    path: 'E-Knowledge/E-REF/REF_093_RegSeriesCompletion.md',
    type: 'REF',
    id: 'REF_093',
    title: 'Frontend Completion Pack – REG Series (Authentication Engine)',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_094_MetaSeriesCompletion.md': {
    path: 'E-Knowledge/E-REF/REF_094_MetaSeriesCompletion.md',
    type: 'REF',
    id: 'REF_094',
    title: 'Frontend Completion Pack – META Series (Control Room)',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_095_SysSeriesCompletion.md': {
    path: 'E-Knowledge/E-REF/REF_095_SysSeriesCompletion.md',
    type: 'REF',
    id: 'REF_095',
    title: 'Frontend Completion Pack – SYS Series (System Configuration)',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_096_CompletionPackTemplate.md': {
    path: 'E-Knowledge/E-REF/REF_096_CompletionPackTemplate.md',
    type: 'REF',
    id: 'REF_096',
    title: 'Frontend Completion Pack Template',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_097_DocumentationIndex.md': {
    path: 'E-Knowledge/E-REF/REF_097_DocumentationIndex.md',
    type: 'REF',
    id: 'REF_097',
    title: 'NexusCanon Documentation Index',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_098_AuditTrailExample.md': {
    path: 'E-Knowledge/E-REF/REF_098_AuditTrailExample.md',
    type: 'REF',
    id: 'REF_098',
    title: 'Audit Trail Implementation Example',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_099_DocsStandardizationSummary.md': {
    path: 'E-Knowledge/E-REF/REF_099_DocsStandardizationSummary.md',
    type: 'REF',
    id: 'REF_099',
    title: 'Documentation Standardization Summary',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_100_RootDirectoryCleanupPlan.md': {
    path: 'E-Knowledge/E-REF/REF_100_RootDirectoryCleanupPlan.md',
    type: 'REF',
    id: 'REF_100',
    title: 'Root Directory Cleanup Plan',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_101_CleanupExecutionPlan.md': {
    path: 'E-Knowledge/E-REF/REF_101_CleanupExecutionPlan.md',
    type: 'REF',
    id: 'REF_101',
    title: 'Root Directory Cleanup Execution Plan',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_102_CleanupSummary.md': {
    path: 'E-Knowledge/E-REF/REF_102_CleanupSummary.md',
    type: 'REF',
    id: 'REF_102',
    title: 'Root Directory Cleanup Summary',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_103_CSSOrganizationGuide.md': {
    path: 'E-Knowledge/E-REF/REF_103_CSSOrganizationGuide.md',
    type: 'REF',
    id: 'REF_103',
    title: 'CSS Organization Guide',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-REF/REF_104_PrettierConfigurationValidation.md': {
    path: 'E-Knowledge/E-REF/REF_104_PrettierConfigurationValidation.md',
    type: 'REF',
    id: 'REF_104',
    title: 'Prettier Configuration Validation',
    status: 'ACTIVE',
  },
  'E-Knowledge/E-SPEC/PRD_002_UISystemGovernance.md': {
    path: 'E-Knowledge/E-SPEC/PRD_002_UISystemGovernance.md',
    type: 'SPEC',
    id: 'PRD_002',
    title: 'The AIBOS UI Constitution',
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
