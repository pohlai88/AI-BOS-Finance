#!/usr/bin/env tsx
/**
 * TOOL_23: Rename Canon Files to Follow Canon Identity Patterns
 * 
 * Automates renaming of files to follow Canon Identity guidelines:
 * - Tool files: Add TOOL_XX_ prefix
 * - Reference documents: Add REF_XXX_ prefix
 * 
 * Uses git mv to preserve history and ensure renames are tracked.
 * 
 * Usage:
 *   npm run canon:rename-files
 *   npx tsx canon/D-Operations/D-TOOL/TOOL_23_RenameCanonFiles.ts
 * 
 * Safety:
 * - Dry-run mode by default (use --execute to actually rename)
 * - Creates backup mapping file
 * - Uses git mv to preserve history
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname, basename } from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();
const DRY_RUN = !process.argv.includes('--execute');

// Mapping: Old filename → New filename
const TOOL_RENAMES: Array<{ old: string; new: string; path: string }> = [
  {
    old: 'figma-push.ts',
    new: 'TOOL_19_FigmaPush.ts',
    path: 'canon/D-Operations/D-TOOL/'
  },
  {
    old: 'figma-sync.ts',
    new: 'TOOL_20_FigmaSync.ts',
    path: 'canon/D-Operations/D-TOOL/'
  },
  {
    old: 'sync-canon.ts',
    new: 'TOOL_21_SyncCanon.ts',
    path: 'canon/D-Operations/D-TOOL/'
  },
  {
    old: 'sync-readme.ts',
    new: 'TOOL_22_SyncReadme.ts',
    path: 'canon/D-Operations/D-TOOL/'
  },
];

const REF_RENAMES: Array<{ old: string; new: string; path: string }> = [
  {
    old: 'AUDIT_PAYMENT_HUB.md',
    new: 'REF_015_AUDIT_PAYMENT_HUB.md',
    path: 'canon/E-Knowledge/E-REF/'
  },
  {
    old: 'CANON_SELF_TEACHING_STRUCTURE.md',
    new: 'REF_016_CANON_SELF_TEACHING_STRUCTURE.md',
    path: 'canon/E-Knowledge/E-REF/'
  },
  {
    old: 'CONTEXT_OPTIMIZATION_STRATEGY.md',
    new: 'REF_017_CONTEXT_OPTIMIZATION_STRATEGY.md',
    path: 'canon/E-Knowledge/E-REF/'
  },
  {
    old: 'CONTEXT_REDUCTION_QUICK_GUIDE.md',
    new: 'REF_018_CONTEXT_REDUCTION_QUICK_GUIDE.md',
    path: 'canon/E-Knowledge/E-REF/'
  },
  {
    old: 'DEVELOPER_NOTE.md',
    new: 'REF_019_DEVELOPER_NOTE.md',
    path: 'canon/E-Knowledge/E-REF/'
  },
  {
    old: 'FIGMA_PUSH_SETUP.md',
    new: 'REF_020_FIGMA_PUSH_SETUP.md',
    path: 'canon/E-Knowledge/E-REF/'
  },
  {
    old: 'FIGMA_SYNC_QUICKSTART.md',
    new: 'REF_021_FIGMA_SYNC_QUICKSTART.md',
    path: 'canon/E-Knowledge/E-REF/'
  },
  {
    old: 'FIGMA_SYNC_SETUP.md',
    new: 'REF_022_FIGMA_SYNC_SETUP.md',
    path: 'canon/E-Knowledge/E-REF/'
  },
  {
    old: 'HONEST_AUDIT_VALIDATION.md',
    new: 'REF_023_HONEST_AUDIT_VALIDATION.md',
    path: 'canon/E-Knowledge/E-REF/'
  },
  {
    old: 'README_CANON_IMPLEMENTATION.md',
    new: 'REF_024_README_CANON_IMPLEMENTATION.md',
    path: 'canon/E-Knowledge/E-REF/'
  },
  {
    old: 'REPO_STRUCTURE_TREE.md',
    new: 'REF_025_REPO_STRUCTURE_TREE.md',
    path: 'canon/E-Knowledge/E-REF/'
  },
];

interface RenameOperation {
  oldPath: string;
  newPath: string;
  exists: boolean;
  newExists: boolean;
  error?: string;
}

function checkFile(filepath: string): boolean {
  return existsSync(join(ROOT, filepath));
}

function performRename(oldPath: string, newPath: string): RenameOperation {
  const fullOldPath = join(ROOT, oldPath);
  const fullNewPath = join(ROOT, newPath);
  
  const exists = existsSync(fullOldPath);
  const newExists = existsSync(fullNewPath);
  
  if (!exists) {
    return {
      oldPath,
      newPath,
      exists: false,
      newExists,
      error: 'Source file does not exist'
    };
  }
  
  if (newExists) {
    return {
      oldPath,
      newPath,
      exists: true,
      newExists: true,
      error: 'Target file already exists'
    };
  }
  
  if (!DRY_RUN) {
    try {
      // Ensure directory exists
      const newDir = dirname(fullNewPath);
      execSync(`mkdir -p "${newDir}"`, { cwd: ROOT });
      
      // Use git mv to preserve history
      execSync(`git mv "${fullOldPath}" "${fullNewPath}"`, { cwd: ROOT });
      
      return {
        oldPath,
        newPath,
        exists: true,
        newExists: false
      };
    } catch (error: any) {
      return {
        oldPath,
        newPath,
        exists: true,
        newExists: false,
        error: error.message || 'Unknown error'
      };
    }
  }
  
  return {
    oldPath,
    newPath,
    exists: true,
    newExists: false
  };
}

function findReferences(oldName: string): string[] {
  const results: string[] = [];
  
  // Simple grep for old filename (without path)
  try {
    const output = execSync(
      `grep -r "${oldName}" --include="*.ts" --include="*.tsx" --include="*.md" --include="*.json" . 2>/dev/null || true`,
      { cwd: ROOT, encoding: 'utf-8' }
    );
    
    const lines = output.split('\n').filter(line => line.trim());
    for (const line of lines) {
      const match = line.match(/^([^:]+):/);
      if (match) {
        results.push(match[1]);
      }
    }
  } catch (error) {
    // Ignore grep errors
  }
  
  return results;
}

async function main() {
  console.log('🚀 TOOL_23: Rename Canon Files to Follow Canon Identity Patterns\n');
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No files will be renamed');
    console.log('   Use --execute flag to perform actual renames\n');
  } else {
    console.log('✅ EXECUTE MODE - Files will be renamed using git mv\n');
  }
  
  const allRenames: RenameOperation[] = [];
  const mapping: Array<{ old: string; new: string; references?: string[] }> = [];
  
  // Process Tool renames
  console.log('📦 Processing Tool Files (4 files)...\n');
  for (const rename of TOOL_RENAMES) {
    const oldPath = join(rename.path, rename.old);
    const newPath = join(rename.path, rename.new);
    
    console.log(`  ${rename.old} → ${rename.new}`);
    const result = performRename(oldPath, newPath);
    allRenames.push(result);
    
    if (result.error) {
      console.log(`    ❌ Error: ${result.error}`);
    } else if (result.exists) {
      console.log(`    ✅ ${DRY_RUN ? 'Would rename' : 'Renamed'}`);
      
      // Find references
      const references = findReferences(rename.old);
      if (references.length > 0) {
        console.log(`    ⚠️  Found ${references.length} potential reference(s):`);
        references.slice(0, 5).forEach(ref => {
          console.log(`       - ${ref}`);
        });
        if (references.length > 5) {
          console.log(`       ... and ${references.length - 5} more`);
        }
      }
      
      mapping.push({
        old: oldPath,
        new: newPath,
        references: references.length > 0 ? references : undefined
      });
    } else {
      console.log(`    ⚠️  File not found, skipping`);
    }
    console.log('');
  }
  
  // Process Reference renames
  console.log('📚 Processing Reference Documents (12 files)...\n');
  for (const rename of REF_RENAMES) {
    const oldPath = join(rename.path, rename.old);
    const newPath = join(rename.path, rename.new);
    
    console.log(`  ${rename.old} → ${rename.new}`);
    const result = performRename(oldPath, newPath);
    allRenames.push(result);
    
    if (result.error) {
      console.log(`    ❌ Error: ${result.error}`);
    } else if (result.exists) {
      console.log(`    ✅ ${DRY_RUN ? 'Would rename' : 'Renamed'}`);
      
      // Find references (for markdown, check without extension)
      const baseName = rename.old.replace(/\.md$/, '');
      const references = findReferences(baseName);
      if (references.length > 0) {
        console.log(`    ⚠️  Found ${references.length} potential reference(s):`);
        references.slice(0, 5).forEach(ref => {
          console.log(`       - ${ref}`);
        });
        if (references.length > 5) {
          console.log(`       ... and ${references.length - 5} more`);
        }
      }
      
      mapping.push({
        old: oldPath,
        new: newPath,
        references: references.length > 0 ? references : undefined
      });
    } else {
      console.log(`    ⚠️  File not found, skipping`);
    }
    console.log('');
  }
  
  // Save mapping file
  const mappingPath = join(ROOT, 'canon/D-Operations/D-TOOL/TOOL_23_RENAME_MAPPING.json');
  writeFileSync(
    mappingPath,
    JSON.stringify(mapping, null, 2),
    'utf-8'
  );
  console.log(`📝 Rename mapping saved to: ${mappingPath}\n`);
  
  // Summary
  const successful = allRenames.filter(r => r.exists && !r.error && !r.newExists).length;
  const errors = allRenames.filter(r => r.error).length;
  const notFound = allRenames.filter(r => !r.exists).length;
  
  console.log('='.repeat(60));
  console.log('📊 Summary:');
  console.log(`   ✅ ${DRY_RUN ? 'Would rename' : 'Renamed'}: ${successful} files`);
  if (errors > 0) {
    console.log(`   ❌ Errors: ${errors} files`);
  }
  if (notFound > 0) {
    console.log(`   ⚠️  Not found: ${notFound} files`);
  }
  console.log(`   📝 Total operations: ${allRenames.length}`);
  
  if (DRY_RUN) {
    console.log('\n💡 To execute renames, run with --execute flag:');
    console.log('   npx tsx canon/D-Operations/D-TOOL/TOOL_23_RenameCanonFiles.ts --execute');
  } else {
    console.log('\n✅ Rename operations completed!');
    console.log('💡 Next steps:');
    console.log('   1. Review the rename mapping file');
    console.log('   2. Update any cross-references found');
    console.log('   3. Run TOOL_18 to verify compliance');
  }
}

main().catch(console.error);
