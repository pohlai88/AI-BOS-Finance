#!/usr/bin/env tsx
/**
 * Cleanup Analysis Files Script
 * 
 * Removes temporary analysis files created during migration/planning.
 * These files are one-time analysis documents and can be safely deleted
 * to reduce context usage.
 * 
 * Usage:
 *   npm run canon:cleanup-analysis
 */

import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

const FILES_TO_DELETE = [
  // Analysis files (one-time use)
  'CANON_PLANES_DIRECTORY_ANALYSIS.md',
  'CANON_PLANES_NAMING_STRATEGY.md',
  'CANON_PLANES_QUICK_REFERENCE.md',
  'MIGRATION_VERIFICATION.md',
  'MIGRATION_COMPLETE.md',
  'ARCHIVE_NAMING_STRATEGY.md',
  
  // Keep these (active references):
  // - CANON_SELF_TEACHING_STRUCTURE.md (active reference)
  // - CONTEXT_OPTIMIZATION_STRATEGY.md (this strategy doc)
  // - REPO_STRUCTURE_TREE.md (can be regenerated, but useful)
];

async function main() {
  console.log('🧹 Cleaning up temporary analysis files...\n');
  
  let deletedCount = 0;
  let skippedCount = 0;
  
  FILES_TO_DELETE.forEach(file => {
    const filePath = join(ROOT, file);
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
        console.log(`  ✓ Deleted: ${file}`);
        deletedCount++;
      } catch (error) {
        console.log(`  ⚠️  Failed to delete: ${file} - ${error}`);
        skippedCount++;
      }
    } else {
      console.log(`  ⏭️  Skipped (not found): ${file}`);
      skippedCount++;
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Cleanup complete!`);
  console.log(`   Deleted: ${deletedCount} file(s)`);
  console.log(`   Skipped: ${skippedCount} file(s)`);
  console.log(`\n💡 Context usage reduced by ~${deletedCount * 200} lines`);
  console.log('\n📋 Files kept (active references):');
  console.log('   - CANON_SELF_TEACHING_STRUCTURE.md');
  console.log('   - CONTEXT_OPTIMIZATION_STRATEGY.md');
  console.log('   - REPO_STRUCTURE_TREE.md (can regenerate)');
}

main().catch(console.error);
