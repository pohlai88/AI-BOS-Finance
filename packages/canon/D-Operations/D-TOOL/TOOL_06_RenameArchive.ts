#!/usr/bin/env tsx
/**
 * Rename Archive Directory Script
 * 
 * Renames canon/archive/ to canon/z-archive/ to ensure it always sorts at the bottom.
 * 
 * Usage:
 *   npm run canon:rename-archive
 */

import { existsSync, renameSync, readFileSync, writeFileSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const OLD_PATH = join(ROOT, 'canon', 'archive');
const NEW_PATH = join(ROOT, 'canon', 'z-archive');

async function main() {
  console.log('🔄 Renaming archive directory to z-archive...\n');
  
  if (!existsSync(OLD_PATH)) {
    console.log('⚠️  canon/archive/ not found. Nothing to rename.');
    return;
  }
  
  if (existsSync(NEW_PATH)) {
    console.log('⚠️  canon/z-archive/ already exists. Skipping rename.');
    return;
  }
  
  try {
    // Rename directory
    renameSync(OLD_PATH, NEW_PATH);
    console.log(`✅ Renamed: ${relative(ROOT, OLD_PATH)} → ${relative(ROOT, NEW_PATH)}`);
    
    // Update references in documentation files
    const docsToUpdate = [
      'CANON_SELF_TEACHING_STRUCTURE.md',
      'MIGRATION_COMPLETE.md',
      'CANON_PLANES_DIRECTORY_ANALYSIS.md',
      'CANON_PLANES_QUICK_REFERENCE.md',
    ];
    
    let updatedCount = 0;
    docsToUpdate.forEach(doc => {
      const docPath = join(ROOT, doc);
      if (existsSync(docPath)) {
        let content = readFileSync(docPath, 'utf-8');
        const originalContent = content;
        
        // Replace references to canon/archive/ with canon/z-archive/
        content = content.replace(/canon\/archive\//g, 'canon/z-archive/');
        content = content.replace(/`archive\//g, '`z-archive/');
        content = content.replace(/archive\/`/g, 'z-archive/`');
        
        if (content !== originalContent) {
          writeFileSync(docPath, content, 'utf-8');
          console.log(`  ✓ Updated: ${doc}`);
          updatedCount++;
        }
      }
    });
    
    if (updatedCount > 0) {
      console.log(`\n✅ Updated ${updatedCount} documentation file(s)`);
    }
    
    console.log('\n✅ Archive directory renamed successfully!');
    console.log('\n📋 Directory will now sort at the bottom:');
    console.log('   A-Governance/');
    console.log('   B-Functional/');
    console.log('   C-DataLogic/');
    console.log('   D-Operations/');
    console.log('   E-Knowledge/');
    console.log('   z-archive/  ← Always at bottom');
    
  } catch (error) {
    console.error('❌ Rename failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
