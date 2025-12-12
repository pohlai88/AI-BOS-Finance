#!/usr/bin/env tsx
/**
 * Relocate Documentation Files Script
 * 
 * Moves root-level documentation files to their appropriate Canon directories
 * based on naming patterns and content type.
 * 
 * Only relocates, does not rename files.
 * 
 * Usage:
 *   npm run canon:relocate-docs
 */

import { existsSync, readdirSync, statSync, renameSync, mkdirSync } from 'fs';
import { join, relative, basename, extname } from 'path';

const ROOT = process.cwd();

// Files to keep in root (don't relocate)
const KEEP_IN_ROOT = [
  'README.md',
  'package.json',
  'package-lock.json',
];

// Mapping rules: pattern → destination directory
const RELOCATION_RULES: Array<{
  pattern: RegExp;
  destination: string;
  description: string;
}> = [
  // Plane E - Specifications (SPEC_ prefix)
  {
    pattern: /^SPEC_/i,
    destination: 'canon/E-Knowledge/E-SPEC',
    description: 'Specification files (SPEC_ prefix)'
  },
  // Plane E - References (REF_ prefix)
  {
    pattern: /^REF_/i,
    destination: 'canon/E-Knowledge/E-REF',
    description: 'Reference files (REF_ prefix)'
  },
  // Product Requirements Documents
  {
    pattern: /^PRD_/i,
    destination: 'canon/E-Knowledge/E-SPEC',
    description: 'Product Requirements Documents (PRD_ prefix)'
  },
  // Audit documents
  {
    pattern: /^AUDIT_/i,
    destination: 'canon/E-Knowledge/E-REF',
    description: 'Audit documents (AUDIT_ prefix)'
  },
  // Context/Strategy documentation
  {
    pattern: /^CONTEXT_/i,
    destination: 'canon/E-Knowledge/E-REF',
    description: 'Context/Strategy documentation'
  },
  // Canon structure/implementation guides
  {
    pattern: /^(CANON_|README_CANON)/i,
    destination: 'canon/E-Knowledge/E-REF',
    description: 'Canon structure and implementation guides'
  },
  // Repository structure
  {
    pattern: /^REPO_/i,
    destination: 'canon/E-Knowledge/E-REF',
    description: 'Repository structure documentation'
  },
  // Figma documentation
  {
    pattern: /^FIGMA_/i,
    destination: 'canon/E-Knowledge/E-REF',
    description: 'Figma integration documentation'
  },
  // Developer notes
  {
    pattern: /^DEVELOPER_/i,
    destination: 'canon/E-Knowledge/E-REF',
    description: 'Developer notes and guides'
  },
  // Honest audit/validation
  {
    pattern: /^HONEST_/i,
    destination: 'canon/E-Knowledge/E-REF',
    description: 'Audit and validation documents'
  },
];

interface RelocationPlan {
  file: string;
  destination: string;
  reason: string;
  status: 'pending' | 'moved' | 'skipped' | 'error';
}

function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

function shouldKeepInRoot(filename: string): boolean {
  return KEEP_IN_ROOT.includes(filename);
}

function findDestination(filename: string): { destination: string; reason: string } | null {
  for (const rule of RELOCATION_RULES) {
    if (rule.pattern.test(filename)) {
      return {
        destination: join(ROOT, rule.destination),
        reason: rule.description
      };
    }
  }
  return null;
}

function getRootMarkdownFiles(): string[] {
  const files: string[] = [];
  const entries = readdirSync(ROOT);
  
  for (const entry of entries) {
    const fullPath = join(ROOT, entry);
    const stat = statSync(fullPath);
    
    if (stat.isFile() && extname(entry).toLowerCase() === '.md') {
      files.push(fullPath);
    }
  }
  
  return files;
}

function createRelocationPlan(): RelocationPlan[] {
  const plan: RelocationPlan[] = [];
  const rootFiles = getRootMarkdownFiles();
  
  for (const file of rootFiles) {
    const filename = basename(file);
    
    // Skip files that should stay in root
    if (shouldKeepInRoot(filename)) {
      plan.push({
        file,
        destination: '',
        reason: 'Keep in root (standard file)',
        status: 'skipped'
      });
      continue;
    }
    
    // Find destination based on rules
    const dest = findDestination(filename);
    
    if (dest) {
      plan.push({
        file,
        destination: dest.destination,
        reason: dest.reason,
        status: 'pending'
      });
    } else {
      // No rule matched - could be manually categorized later
      plan.push({
        file,
        destination: '',
        reason: 'No matching rule - manual review needed',
        status: 'skipped'
      });
    }
  }
  
  return plan;
}

function executeRelocation(plan: RelocationPlan[]): void {
  console.log('📋 Relocation Plan:\n');
  
  // Show plan first
  const pending = plan.filter(p => p.status === 'pending');
  const skipped = plan.filter(p => p.status === 'skipped');
  
  if (pending.length > 0) {
    console.log('📦 Files to relocate:');
    pending.forEach(p => {
      const filename = basename(p.file);
      const dest = relative(ROOT, p.destination);
      console.log(`  • ${filename}`);
      console.log(`    → ${dest}/`);
      console.log(`    Reason: ${p.reason}\n`);
    });
  }
  
  if (skipped.length > 0) {
    console.log('⏭️  Files skipped:');
    skipped.forEach(p => {
      const filename = basename(p.file);
      console.log(`  • ${filename} - ${p.reason}`);
    });
    console.log('');
  }
  
  // Execute relocation
  if (pending.length === 0) {
    console.log('✅ No files to relocate.');
    return;
  }
  
  console.log('🚀 Executing relocation...\n');
  
  let movedCount = 0;
  let errorCount = 0;
  
  for (const item of pending) {
    const filename = basename(item.file);
    const destFile = join(item.destination, filename);
    
    try {
      // Check if destination already exists
      if (existsSync(destFile)) {
        console.log(`  ⚠️  Skipped: ${filename} (destination already exists)`);
        item.status = 'skipped';
        continue;
      }
      
      // Ensure destination directory exists
      ensureDir(item.destination);
      
      // Move file
      renameSync(item.file, destFile);
      console.log(`  ✓ Moved: ${relative(ROOT, item.file)} → ${relative(ROOT, destFile)}`);
      item.status = 'moved';
      movedCount++;
    } catch (error) {
      console.log(`  ❌ Error: ${filename} - ${error}`);
      item.status = 'error';
      errorCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Relocation complete!`);
  console.log(`   Moved: ${movedCount} file(s)`);
  console.log(`   Skipped: ${skipped.length} file(s)`);
  if (errorCount > 0) {
    console.log(`   Errors: ${errorCount} file(s)`);
  }
  console.log('\n💡 Review the changes and validate manually (HITL).');
}

async function main() {
  console.log('📚 Relocating Documentation Files to Canon Directories\n');
  console.log('This script will move root-level .md files to appropriate Canon planes.\n');
  
  const plan = createRelocationPlan();
  executeRelocation(plan);
  
  // Show summary
  const needsReview = plan.filter(p => p.status === 'skipped' && !shouldKeepInRoot(basename(p.file)));
  
  if (needsReview.length > 0) {
    console.log('\n📋 Files needing manual review:');
    needsReview.forEach(p => {
      console.log(`  • ${basename(p.file)} - ${p.reason}`);
    });
  }
}

main().catch(console.error);
