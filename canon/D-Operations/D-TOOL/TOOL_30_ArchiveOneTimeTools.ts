#!/usr/bin/env tsx
/**
 * TOOL_30: Archive One-Time Use Tools
 * 
 * Moves one-time use tools (migrations, cleanups) to archive directory.
 * Keeps only active/reusable tools in D-TOOL directory.
 * 
 * Usage:
 *   npm run canon:archive-tools
 *   npm run canon:archive-tools -- --dry-run
 *   npm run canon:archive-tools -- --tool TOOL_05
 */

import * as fs from 'fs';
import * as path from 'path';

const D_TOOL_DIR = path.join(process.cwd(), 'canon', 'D-Operations', 'D-TOOL');
const ARCHIVE_DIR = path.join(process.cwd(), 'canon', 'D-Operations', 'D-TOOL', '.archive');
const TOOL_METADATA_FILE = path.join(D_TOOL_DIR, 'tool-metadata.json');

interface ToolMetadata {
  id: string;
  name: string;
  category: 'migration' | 'cleanup' | 'validation' | 'sync' | 'utility' | 'active';
  oneTimeUse: boolean;
  status: 'active' | 'archived' | 'deprecated';
  lastUsed?: string;
  description?: string;
}

/**
 * Default tool classification
 * One-time use: migrations, one-off cleanups
 * Active: validation, sync, utilities that run regularly
 */
const TOOL_CLASSIFICATION: Record<string, Omit<ToolMetadata, 'id'>> = {
  // One-time migrations (should be archived)
  'TOOL_05_MigrateCanonPlanes.ts': {
    name: 'Migrate Canon Planes',
    category: 'migration',
    oneTimeUse: true,
    status: 'archived',
    description: 'One-time migration to new plane structure'
  },
  'TOOL_06_RenameArchive.ts': {
    name: 'Rename Archive',
    category: 'migration',
    oneTimeUse: true,
    status: 'archived',
    description: 'One-time archive renaming'
  },
  'TOOL_07_CleanupAnalysisFiles.ts': {
    name: 'Cleanup Analysis Files',
    category: 'cleanup',
    oneTimeUse: true,
    status: 'archived',
    description: 'One-time cleanup of analysis files'
  },
  'TOOL_08_RelocateDocumentation.ts': {
    name: 'Relocate Documentation',
    category: 'migration',
    oneTimeUse: true,
    status: 'archived',
    description: 'One-time documentation relocation'
  },
  'TOOL_09_RelocateScripts.ts': {
    name: 'Relocate Scripts',
    category: 'migration',
    oneTimeUse: true,
    status: 'archived',
    description: 'One-time script relocation'
  },
  'TOOL_10_OptimizeIdentityContract.ts': {
    name: 'Optimize Identity Contract',
    category: 'migration',
    oneTimeUse: true,
    status: 'archived',
    description: 'One-time contract optimization'
  },
  'TOOL_11_RelocateSSOT.ts': {
    name: 'Relocate SSOT',
    category: 'migration',
    oneTimeUse: true,
    status: 'archived',
    description: 'One-time SSOT relocation'
  },
  'TOOL_12_ConsolidateSSOT.ts': {
    name: 'Consolidate SSOT',
    category: 'migration',
    oneTimeUse: true,
    status: 'archived',
    description: 'One-time SSOT consolidation'
  },
  'TOOL_13_GenerateReadmeHeaders.ts': {
    name: 'Generate Readme Headers',
    category: 'utility',
    oneTimeUse: true,
    status: 'archived',
    description: 'One-time readme header generation'
  },
  'TOOL_15_GenerateSubdirectoryReadmes.ts': {
    name: 'Generate Subdirectory Readmes',
    category: 'utility',
    oneTimeUse: true,
    status: 'archived',
    description: 'One-time subdirectory readme generation'
  },
  'TOOL_16_ComprehensiveCanonCleanup.ts': {
    name: 'Comprehensive Canon Cleanup',
    category: 'cleanup',
    oneTimeUse: true,
    status: 'archived',
    description: 'One-time comprehensive cleanup'
  },
  'TOOL_23_RenameCanonFiles.ts': {
    name: 'Rename Canon Files',
    category: 'migration',
    oneTimeUse: true,
    status: 'archived',
    description: 'One-time file renaming'
  },
  'TOOL_25_MigrateViteEnvVars.ts': {
    name: 'Migrate Vite Env Vars',
    category: 'migration',
    oneTimeUse: true,
    status: 'archived',
    description: 'One-time Vite migration'
  },
  'TOOL_28_CanonRefactorAutomation.ts': {
    name: 'Canon Refactor Automation',
    category: 'migration',
    oneTimeUse: true,
    status: 'archived',
    description: 'One-time refactoring automation'
  },

  // Active tools (keep in D-TOOL)
  'TOOL_03_CheckGovernanceStamps.ts': {
    name: 'Check Governance Stamps',
    category: 'validation',
    oneTimeUse: false,
    status: 'active',
    description: 'Validates governance stamps in files'
  },
  'TOOL_04_ValidateCursorRules.ts': {
    name: 'Validate Cursor Rules',
    category: 'validation',
    oneTimeUse: false,
    status: 'active',
    description: 'Validates Cursor IDE rules'
  },
  'TOOL_14_ValidateSEALFormat.ts': {
    name: 'Validate SEAL Format',
    category: 'validation',
    oneTimeUse: false,
    status: 'active',
    description: 'Validates SEAL format compliance'
  },
  'TOOL_17_ValidateDTOOLFiles.ts': {
    name: 'Validate D-TOOL Files',
    category: 'validation',
    oneTimeUse: false,
    status: 'active',
    description: 'Validates D-TOOL directory structure'
  },
  'TOOL_18_ValidateCanonCompliance.ts': {
    name: 'Validate Canon Compliance',
    category: 'validation',
    oneTimeUse: false,
    status: 'active',
    description: 'Validates overall Canon compliance'
  },
  'TOOL_24_GenerateCanonPageWrapper.ts': {
    name: 'Generate Canon Page Wrapper',
    category: 'utility',
    oneTimeUse: false,
    status: 'active',
    description: 'Generates page wrappers for canon-pages'
  },
  'TOOL_26_SyncFigmaTokens.ts': {
    name: 'Sync Figma Tokens',
    category: 'sync',
    oneTimeUse: false,
    status: 'active',
    description: 'Syncs design tokens from Figma'
  },
  'TOOL_27_SyncCanonPages.ts': {
    name: 'Sync Canon Pages',
    category: 'sync',
    oneTimeUse: false,
    status: 'active',
    description: 'Syncs canon files to canon-pages'
  },
  'TOOL_29_PromoteUnauditedToCanon.ts': {
    name: 'Promote Unaudited to Canon',
    category: 'utility',
    oneTimeUse: false,
    status: 'active',
    description: 'Promotes files from unaudited to canon'
  },

  // Regular utilities (keep)
  'figma-sync.ts': {
    name: 'Figma Sync',
    category: 'sync',
    oneTimeUse: false,
    status: 'active',
    description: 'Syncs Figma design data'
  },
  'figma-push.ts': {
    name: 'Figma Push',
    category: 'sync',
    oneTimeUse: false,
    status: 'active',
    description: 'Pushes data to Figma'
  },
  'sync-canon.ts': {
    name: 'Sync Canon',
    category: 'sync',
    oneTimeUse: false,
    status: 'active',
    description: 'Syncs canon registry'
  },
  'sync-readme.ts': {
    name: 'Sync Readme',
    category: 'sync',
    oneTimeUse: false,
    status: 'active',
    description: 'Syncs README files'
  },
};

/**
 * Get all tool files in D-TOOL directory
 */
function getToolFiles(): string[] {
  if (!fs.existsSync(D_TOOL_DIR)) return [];

  return fs.readdirSync(D_TOOL_DIR)
    .filter(file =>
      file.endsWith('.ts') &&
      !file.startsWith('.') &&
      file !== 'tool-metadata.json'
    )
    .map(file => path.join(D_TOOL_DIR, file));
}

/**
 * Archive a tool file
 */
function archiveTool(filePath: string, dryRun: boolean = false): { success: boolean; message: string } {
  const fileName = path.basename(filePath);
  const archivePath = path.join(ARCHIVE_DIR, fileName);

  if (dryRun) {
    return {
      success: true,
      message: `[DRY RUN] Would archive: ${fileName} → .archive/${fileName}`
    };
  }

  try {
    // Ensure archive directory exists
    if (!fs.existsSync(ARCHIVE_DIR)) {
      fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
    }

    // Move file to archive
    fs.copyFileSync(filePath, archivePath);
    fs.unlinkSync(filePath);

    return {
      success: true,
      message: `✅ Archived: ${fileName} → .archive/${fileName}`
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Error archiving ${fileName}: ${error}`
    };
  }
}

/**
 * Generate tool metadata file
 */
function generateMetadata(): void {
  const tools: ToolMetadata[] = [];

  const toolFiles = getToolFiles();
  const archivedFiles = fs.existsSync(ARCHIVE_DIR)
    ? fs.readdirSync(ARCHIVE_DIR).filter(f => f.endsWith('.ts'))
    : [];

  // Active tools
  for (const filePath of toolFiles) {
    const fileName = path.basename(filePath);
    const classification = TOOL_CLASSIFICATION[fileName] || {
      name: fileName.replace('.ts', ''),
      category: 'utility' as const,
      oneTimeUse: false,
      status: 'active' as const,
      description: 'Tool file'
    };

    tools.push({
      id: fileName.replace('.ts', ''),
      ...classification
    });
  }

  // Archived tools
  for (const fileName of archivedFiles) {
    const classification = TOOL_CLASSIFICATION[fileName] || {
      name: fileName.replace('.ts', ''),
      category: 'utility' as const,
      oneTimeUse: true,
      status: 'archived' as const,
      description: 'Archived tool'
    };

    tools.push({
      id: fileName.replace('.ts', ''),
      ...classification,
      status: 'archived'
    });
  }

  // Write metadata
  fs.writeFileSync(
    TOOL_METADATA_FILE,
    JSON.stringify(tools, null, 2),
    'utf-8'
  );
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const toolArg = args.find(arg => arg.startsWith('--tool='));
  const specificTool = toolArg ? toolArg.split('=')[1] : null;

  console.log('🔧 Canon Tool Archive Utility\n');

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No files will be moved\n');
  }

  const toolFiles = getToolFiles();
  const toArchive: string[] = [];

  // Determine which tools to archive
  for (const filePath of toolFiles) {
    const fileName = path.basename(filePath);

    if (specificTool && !fileName.includes(specificTool)) {
      continue;
    }

    const classification = TOOL_CLASSIFICATION[fileName];
    if (classification && classification.oneTimeUse && classification.status === 'archived') {
      toArchive.push(filePath);
    }
  }

  if (toArchive.length === 0) {
    console.log('✅ No tools to archive');
    return;
  }

  console.log(`📦 Found ${toArchive.length} tool(s) to archive:\n`);

  for (const filePath of toArchive) {
    const fileName = path.basename(filePath);
    const classification = TOOL_CLASSIFICATION[fileName];
    console.log(`  - ${fileName} (${classification?.category || 'unknown'})`);
  }

  console.log('\n');

  // Archive tools
  let archived = 0;
  for (const filePath of toArchive) {
    const result = archiveTool(filePath, dryRun);
    console.log(result.message);
    if (result.success) archived++;
  }

  // Generate metadata
  if (!dryRun) {
    generateMetadata();
    console.log('\n📝 Tool metadata updated');
  }

  console.log(`\n✅ ${archived} tool(s) ${dryRun ? 'would be ' : ''}archived`);
}

// ES module: Run main if executed directly (not imported)
// Check if this file is the entry point
const isMainModule = process.argv[1] && (
  process.argv[1].endsWith('TOOL_30_ArchiveOneTimeTools.ts') ||
  process.argv[1].includes('TOOL_30_ArchiveOneTimeTools')
);

if (isMainModule) {
  main();
}

export { archiveTool, getToolFiles, generateMetadata, TOOL_CLASSIFICATION };
