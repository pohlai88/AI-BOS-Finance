#!/usr/bin/env tsx
/**
 * Relocate Scripts to Canon Directory
 * 
 * Moves TOOL_ prefixed scripts from scripts/ to canon/D-Operations/D-TOOL/
 * 
 * Only relocates, does not rename files.
 * 
 * Usage:
 *   npm run canon:relocate-scripts
 */

import { existsSync, readdirSync, statSync, renameSync, mkdirSync } from 'fs';
import { join, relative, basename, extname } from 'path';

const ROOT = process.cwd();
const SCRIPTS_DIR = join(ROOT, 'scripts');
const DEST_DIR = join(ROOT, 'canon/D-Operations/D-TOOL');

interface RelocationItem {
  file: string;
  filename: string;
  status: 'pending' | 'moved' | 'skipped' | 'error';
  reason: string;
}

function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

function getScriptsToRelocate(): RelocationItem[] {
  const items: RelocationItem[] = [];
  
  if (!existsSync(SCRIPTS_DIR)) {
    console.log('⚠️  scripts/ directory not found');
    return items;
  }
  
  const entries = readdirSync(SCRIPTS_DIR);
  
  for (const entry of entries) {
    const fullPath = join(SCRIPTS_DIR, entry);
    const stat = statSync(fullPath);
    
    // Only process TypeScript files with TOOL_ prefix
    if (stat.isFile() && 
        extname(entry).toLowerCase() === '.ts' && 
        basename(entry, '.ts').startsWith('TOOL_')) {
      
      items.push({
        file: fullPath,
        filename: entry,
        status: 'pending',
        reason: 'TOOL_ prefixed script'
      });
    }
  }
  
  return items;
}

function executeRelocation(items: RelocationItem[]): void {
  if (items.length === 0) {
    console.log('✅ No TOOL_ scripts found to relocate.');
    return;
  }
  
  console.log('📋 Scripts to relocate:\n');
  items.forEach(item => {
    console.log(`  • ${item.filename}`);
    console.log(`    → canon/D-Operations/D-TOOL/${item.filename}\n`);
  });
  
  console.log('🚀 Executing relocation...\n');
  
  // Ensure destination directory exists
  ensureDir(DEST_DIR);
  
  let movedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (const item of items) {
    const destFile = join(DEST_DIR, item.filename);
    
    try {
      // Check if destination already exists
      if (existsSync(destFile)) {
        console.log(`  ⚠️  Skipped: ${item.filename} (already exists in destination)`);
        item.status = 'skipped';
        skippedCount++;
        continue;
      }
      
      // Check if source still exists (might have been moved already)
      if (!existsSync(item.file)) {
        console.log(`  ⏭️  Skipped: ${item.filename} (source not found)`);
        item.status = 'skipped';
        skippedCount++;
        continue;
      }
      
      // Move file
      renameSync(item.file, destFile);
      console.log(`  ✓ Moved: ${relative(ROOT, item.file)} → ${relative(ROOT, destFile)}`);
      item.status = 'moved';
      movedCount++;
    } catch (error) {
      console.log(`  ❌ Error: ${item.filename} - ${error}`);
      item.status = 'error';
      errorCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Relocation complete!`);
  console.log(`   Moved: ${movedCount} file(s)`);
  console.log(`   Skipped: ${skippedCount} file(s)`);
  if (errorCount > 0) {
    console.log(`   Errors: ${errorCount} file(s)`);
  }
  
  // Update package.json references if needed
  if (movedCount > 0) {
    console.log('\n💡 Note: You may need to update package.json script paths');
    console.log('   from "scripts/TOOL_XX.ts" to "canon/D-Operations/D-TOOL/TOOL_XX.ts"');
  }
}

async function main() {
  console.log('🔧 Relocating TOOL Scripts to Canon Directory\n');
  console.log('Moving TOOL_ prefixed scripts from scripts/ to canon/D-Operations/D-TOOL/\n');
  
  const items = getScriptsToRelocate();
  executeRelocation(items);
}

main().catch(console.error);
