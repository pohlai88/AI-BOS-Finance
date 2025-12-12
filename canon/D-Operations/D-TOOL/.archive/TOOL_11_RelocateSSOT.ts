#!/usr/bin/env tsx
/**
 * Relocate SSOT to Canon Structure
 * 
 * Moves CANON_IDENTITY_CONTRACT_v2.2.0.md (the origin SSOT) to
 * canon/A-Governance/A-CONT/ where it belongs as the foundational contract.
 * 
 * This is the origin document for the entire repo, canon, and naming system.
 * CONT_01 is derived from this document.
 * 
 * Usage:
 *   npm run canon:relocate-ssot
 */

import { existsSync, renameSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const SSOT_SOURCE = join(ROOT, '.identity_contract', 'CANON_IDENTITY_CONTRACT_v2.2.0.md');
const SSOT_DEST = join(ROOT, 'canon', 'A-Governance', 'A-CONT', 'CANON_IDENTITY_CONTRACT_v2.2.0.md');
const README_SOURCE = join(ROOT, '.identity_contract', 'README.md');
const README_DEST = join(ROOT, 'canon', 'A-Governance', 'A-CONT', 'README_IDENTITY_CONTRACT.md');

// Files that reference the SSOT path
const FILES_TO_UPDATE = [
  {
    path: 'canon/A-Governance/A-CONT/CONT_01_CanonIdentity.md',
    patterns: [
      { old: '.identity_contract/CANON_IDENTITY_CONTRACT_v2.2.0.md', new: 'CANON_IDENTITY_CONTRACT_v2.2.0.md' },
      { old: '.identity_contract/', new: 'canon/A-Governance/A-CONT/' }
    ]
  },
  {
    path: 'canon/D-Operations/D-TOOL/sync-readme.ts',
    patterns: [
      { old: '.identity_contract', new: 'canon/A-Governance/A-CONT' }
    ]
  }
];

function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

function updateFileReferences(): void {
  console.log('\n📝 Updating file references...\n');
  
  let updatedCount = 0;
  
  for (const fileInfo of FILES_TO_UPDATE) {
    const filePath = join(ROOT, fileInfo.path);
    
    if (!existsSync(filePath)) {
      console.log(`  ⏭️  Skipped: ${fileInfo.path} (not found)`);
      continue;
    }
    
    try {
      let content = readFileSync(filePath, 'utf-8');
      const originalContent = content;
      
      for (const pattern of fileInfo.patterns) {
        content = content.replace(new RegExp(pattern.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), pattern.new);
      }
      
      if (content !== originalContent) {
        writeFileSync(filePath, content, 'utf-8');
        console.log(`  ✓ Updated: ${fileInfo.path}`);
        updatedCount++;
      } else {
        console.log(`  ⏭️  No changes: ${fileInfo.path}`);
      }
    } catch (error) {
      console.log(`  ❌ Error updating ${fileInfo.path}: ${error}`);
    }
  }
  
  if (updatedCount > 0) {
    console.log(`\n✅ Updated ${updatedCount} file(s)`);
  }
}

async function main() {
  console.log('📜 Relocating SSOT to Canon Structure\n');
  console.log('Moving CANON_IDENTITY_CONTRACT_v2.2.0.md (origin SSOT) to canon/A-Governance/A-CONT/\n');
  
  // Check if SSOT exists
  if (!existsSync(SSOT_SOURCE)) {
    console.log('⚠️  SSOT file not found at:', relative(ROOT, SSOT_SOURCE));
    console.log('   Nothing to relocate.');
    return;
  }
  
  // Check if destination already exists
  if (existsSync(SSOT_DEST)) {
    console.log('⚠️  SSOT already exists at destination:', relative(ROOT, SSOT_DEST));
    console.log('   Skipping relocation.');
    return;
  }
  
  console.log('📋 Relocation Plan:\n');
  console.log(`  • ${relative(ROOT, SSOT_SOURCE)}`);
  console.log(`    → ${relative(ROOT, SSOT_DEST)}\n`);
  
  if (existsSync(README_SOURCE)) {
    console.log(`  • ${relative(ROOT, README_SOURCE)}`);
    console.log(`    → ${relative(ROOT, README_DEST)}\n`);
  }
  
  console.log('🚀 Executing relocation...\n');
  
  try {
    // Ensure destination directory exists
    ensureDir(join(ROOT, 'canon', 'A-Governance', 'A-CONT'));
    
    // Move SSOT
    renameSync(SSOT_SOURCE, SSOT_DEST);
    console.log(`  ✓ Moved: ${relative(ROOT, SSOT_SOURCE)} → ${relative(ROOT, SSOT_DEST)}`);
    
    // Move README if it exists
    if (existsSync(README_SOURCE)) {
      renameSync(README_SOURCE, README_DEST);
      console.log(`  ✓ Moved: ${relative(ROOT, README_SOURCE)} → ${relative(ROOT, README_DEST)}`);
    }
    
    // Update file references
    updateFileReferences();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ SSOT relocation complete!');
    console.log('\n📊 Result:');
    console.log('   - SSOT now in canon/A-Governance/A-CONT/ (Plane A)');
    console.log('   - SSOT is alongside CONT_01 (which is derived from it)');
    console.log('   - All references updated');
    console.log('\n💡 The SSOT is now in its proper Canon location as the foundational contract.');
    
  } catch (error) {
    console.error('❌ Relocation failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
