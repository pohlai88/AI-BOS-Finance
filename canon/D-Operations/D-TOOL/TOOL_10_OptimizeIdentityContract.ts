#!/usr/bin/env tsx
/**
 * Optimize .identity_contract Directory
 * 
 * Moves archive to canon/z-archive/ to reduce context usage.
 * Optionally relocates SSOT to Canon structure.
 * 
 * Usage:
 *   npm run canon:optimize-identity-contract
 */

import { existsSync, renameSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, relative, basename } from 'path';

const ROOT = process.cwd();
const IDENTITY_CONTRACT_DIR = join(ROOT, '.identity_contract');
const ARCHIVE_DIR = join(IDENTITY_CONTRACT_DIR, 'archive');
const Z_ARCHIVE_DIR = join(ROOT, 'canon', 'z-archive');
const IDENTITY_ARCHIVE_DEST = join(Z_ARCHIVE_DIR, '.identity_contract-archive');

interface OptimizationPlan {
  action: string;
  source: string;
  destination: string;
  status: 'pending' | 'completed' | 'skipped' | 'error';
  reason?: string;
}

function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

function createOptimizationPlan(): OptimizationPlan[] {
  const plan: OptimizationPlan[] = [];
  
  // Check if archive exists
  if (existsSync(ARCHIVE_DIR)) {
    plan.push({
      action: 'Move archive',
      source: ARCHIVE_DIR,
      destination: IDENTITY_ARCHIVE_DEST,
      status: 'pending',
      reason: 'Reduce context by moving historical files to z-archive'
    });
  } else {
    plan.push({
      action: 'Move archive',
      source: ARCHIVE_DIR,
      destination: IDENTITY_ARCHIVE_DEST,
      status: 'skipped',
      reason: 'Archive directory not found'
    });
  }
  
  return plan;
}

function executeOptimization(plan: OptimizationPlan[]): void {
  console.log('🔧 Optimizing .identity_contract Directory\n');
  console.log('📋 Optimization Plan:\n');
  
  plan.forEach(item => {
    const sourceRel = relative(ROOT, item.source);
    const destRel = relative(ROOT, item.destination);
    console.log(`  • ${item.action}`);
    console.log(`    ${sourceRel} → ${destRel}`);
    console.log(`    Reason: ${item.reason}\n`);
  });
  
  const pending = plan.filter(p => p.status === 'pending');
  
  if (pending.length === 0) {
    console.log('✅ No optimization needed.');
    return;
  }
  
  console.log('🚀 Executing optimization...\n');
  
  let completedCount = 0;
  let errorCount = 0;
  
  for (const item of pending) {
    try {
      // Check if source exists
      if (!existsSync(item.source)) {
        console.log(`  ⏭️  Skipped: ${relative(ROOT, item.source)} (not found)`);
        item.status = 'skipped';
        continue;
      }
      
      // Check if destination already exists
      if (existsSync(item.destination)) {
        console.log(`  ⚠️  Skipped: ${relative(ROOT, item.destination)} (already exists)`);
        item.status = 'skipped';
        continue;
      }
      
      // Ensure destination parent exists
      ensureDir(Z_ARCHIVE_DIR);
      
      // Move directory
      renameSync(item.source, item.destination);
      console.log(`  ✓ Moved: ${relative(ROOT, item.source)} → ${relative(ROOT, item.destination)}`);
      item.status = 'completed';
      completedCount++;
    } catch (error) {
      console.log(`  ❌ Error: ${relative(ROOT, item.source)} - ${error}`);
      item.status = 'error';
      errorCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Optimization complete!`);
  console.log(`   Completed: ${completedCount} operation(s)`);
  console.log(`   Skipped: ${plan.filter(p => p.status === 'skipped').length} operation(s)`);
  if (errorCount > 0) {
    console.log(`   Errors: ${errorCount} operation(s)`);
  }
  
  // Check if .identity_contract is now empty (except SSOT and README)
  if (existsSync(IDENTITY_CONTRACT_DIR)) {
    const remaining = readdirSync(IDENTITY_CONTRACT_DIR).filter(f => {
      const fullPath = join(IDENTITY_CONTRACT_DIR, f);
      const stat = statSync(fullPath);
      return stat.isFile() && f !== 'CANON_IDENTITY_CONTRACT_v2.2.0.md' && f !== 'README.md';
    });
    
    if (remaining.length === 0) {
      console.log('\n💡 .identity_contract/ now contains only SSOT and README');
      console.log('   Archive moved to canon/z-archive/.identity_contract-archive/');
    }
  }
  
  console.log('\n📊 Context Optimization:');
  console.log('   - Archive files moved to z-archive (reduces context)');
  console.log('   - SSOT remains in .identity_contract/ (actively used)');
  console.log('   - Estimated context saved: ~1000+ lines (archive files)');
}

async function main() {
  console.log('📚 Optimizing .identity_contract Directory\n');
  console.log('This will move archive to canon/z-archive/ to reduce context usage.\n');
  
  const plan = createOptimizationPlan();
  executeOptimization(plan);
  
  console.log('\n💡 Next Steps (Optional):');
  console.log('   - Consider moving SSOT to canon/A-Governance/A-CONT/ if desired');
  console.log('   - Update sync-readme.ts path if SSOT is moved');
}

main().catch(console.error);
