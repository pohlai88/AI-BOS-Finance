#!/usr/bin/env tsx
/**
 * ============================================================================
 * TOOL_03: Governance Stamp Enforcer
 * ============================================================================
 * Canon Code: TOOL_03
 * Version: 1.0.0
 * Plane: D — Operations (Tool)
 * 
 * Purpose: Checks that all Markdown files in canon/ have a valid Governance Stamp.
 * 
 * Usage:
 *   npx tsx scripts/TOOL_03_CheckGovernanceStamps.ts
 *   npm run canon:check-stamps
 * 
 * Exit Codes:
 *   0 - All governance artifacts are stamped and valid
 *   1 - One or more files violate CONT_01 governance
 * ============================================================================
 */

import { readFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import path from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const TOOL_META = {
  code: 'TOOL_03',
  version: '1.0.0',
  name: 'Governance Stamp Enforcer',
  purpose: 'Verify all canon documents have valid governance stamps',
} as const;

// Regex to match governance stamp header
// Matches: > **🟢 [ACTIVE]** or > **🔴 [DEPRECATED]** or > **🟡 [DRAFT]**
// Using Unicode-safe matching
const STAMP_REGEX = />\s*\*\*(.{1,4})\s*\[(ACTIVE|DEPRECATED|DRAFT)\]\*\*/;

// Canon code regex: CONT_XX, ADR_XXX, TOOL_XX, SPEC_XXX, REF_XXX
const CANON_CODE_REGEX = />\s*\*\*Canon Code:\*\*\s*(CONT_\d{2,3}|ADR_\d{3}|TOOL_\d{2,3}|SPEC_\d{3}|REF_\d{3}|N\/A)/;

// Directories to scan
const SCAN_DIRS = [
  'canon/**/*.md',
];

// Files to exclude from validation (READMEs are navigational, not governed)
const EXCLUDE_PATTERNS = [
  '**/README.md',
  '**/readme.md',
];

// ============================================================================
// TYPES
// ============================================================================

interface StampResult {
  file: string;
  status: 'ACTIVE' | 'DEPRECATED' | 'DRAFT' | 'MISSING';
  canonCode: string | null;
  emoji: string;
  valid: boolean;
  error?: string;
}

// ============================================================================
// FUNCTIONS
// ============================================================================

function checkStamp(filePath: string): StampResult {
  const content = readFileSync(filePath, 'utf-8');
  
  // Check for stamp
  const stampMatch = content.match(STAMP_REGEX);
  if (!stampMatch) {
    return {
      file: filePath,
      status: 'MISSING',
      canonCode: null,
      emoji: '❌',
      valid: false,
      error: 'Missing governance stamp header',
    };
  }
  
  const [, emoji, status] = stampMatch;
  
  // Check for canon code
  const codeMatch = content.match(CANON_CODE_REGEX);
  const canonCode = codeMatch ? codeMatch[1] : null;
  
  return {
    file: filePath,
    status: status as 'ACTIVE' | 'DEPRECATED' | 'DRAFT',
    canonCode,
    emoji: emoji,
    valid: true,
  };
}

async function scanFiles(): Promise<string[]> {
  const allFiles: string[] = [];
  
  for (const pattern of SCAN_DIRS) {
    const files = await glob(pattern, {
      ignore: EXCLUDE_PATTERNS,
      nodir: true,
    });
    allFiles.push(...files);
  }
  
  return allFiles;
}

function formatResult(result: StampResult): string {
  const statusPadded = result.status.padEnd(10);
  const codePadded = (result.canonCode ?? 'N/A').padEnd(10);
  const relativePath = result.file.replace(/\\/g, '/');
  
  if (result.valid) {
    return `  ${result.emoji} ${statusPadded} ${codePadded} ${relativePath}`;
  } else {
    return `  ❌ ${statusPadded} ${codePadded} ${relativePath}\n     └─ ${result.error}`;
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('');
  console.log('🛡️  TOOL_03: Governance Stamp Enforcer');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`   Version: ${TOOL_META.version}`);
  console.log(`   Scanning: ${SCAN_DIRS.join(', ')}`);
  console.log('───────────────────────────────────────────────────────────────');
  console.log('');
  
  // Check if canon directory exists
  if (!existsSync('canon')) {
    console.log('⚠️  No canon/ directory found. Creating structure...');
    console.log('   Run governance setup first.');
    console.log('');
    process.exit(0);
  }
  
  // Scan files
  const files = await scanFiles();
  
  if (files.length === 0) {
    console.log('📁 No governance documents found in canon/**/*.md');
    console.log('   (README.md files are excluded from validation)');
    console.log('');
    process.exit(0);
  }
  
  // Check each file
  const results: StampResult[] = [];
  let errors = 0;
  let active = 0;
  let deprecated = 0;
  let draft = 0;
  
  for (const file of files) {
    const result = checkStamp(file);
    results.push(result);
    
    if (!result.valid) {
      errors++;
    } else {
      switch (result.status) {
        case 'ACTIVE': active++; break;
        case 'DEPRECATED': deprecated++; break;
        case 'DRAFT': draft++; break;
      }
    }
  }
  
  // Print results
  console.log('📋 Governance Stamp Status:');
  console.log('');
  
  for (const result of results) {
    console.log(formatResult(result));
  }
  
  console.log('');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`   Total Files:   ${files.length}`);
  console.log(`   🟢 Active:     ${active}`);
  console.log(`   🔴 Deprecated: ${deprecated}`);
  console.log(`   🟡 Draft:      ${draft}`);
  console.log(`   ❌ Invalid:    ${errors}`);
  console.log('───────────────────────────────────────────────────────────────');
  
  if (errors > 0) {
    console.log('');
    console.log(`🚫 FAILED: Found ${errors} file(s) violating CONT_01 governance.`);
    console.log('');
    console.log('   Required stamp format:');
    console.log('   > **🟢 [ACTIVE]** — Certified for Production');
    console.log('   > **Canon Code:** CONT_XX');
    console.log('');
    process.exit(1);
  } else {
    console.log('');
    console.log('✨ PASSED: All governance artifacts are stamped and valid.');
    console.log('');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});

