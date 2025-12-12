#!/usr/bin/env tsx
/**
 * ============================================================================
 * TOOL_04: Cursor Rules Validator & Optimizer
 * ============================================================================
 * Canon Code: TOOL_04
 * Version: 1.0.0
 * Plane: D — Operations (Tool)
 * 
 * Purpose: Validates and optimizes .cursorrules and .cursor/rules/*.mdc files
 * 
 * Checks:
 * 1. File size limits (warns if > 200 lines, errors if > 500)
 * 2. Required sections present
 * 3. Canon governance reference
 * 4. MDC frontmatter validity
 * 5. Generates combined summary for legacy .cursorrules
 * 
 * Usage:
 *   npx tsx scripts/TOOL_04_ValidateCursorRules.ts
 *   npm run cursor:validate
 * ============================================================================
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import path from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const TOOL_META = {
  code: 'TOOL_04',
  version: '1.0.0',
  name: 'Cursor Rules Validator',
  purpose: 'Validate and optimize Cursor IDE rule files',
} as const;

// File size thresholds
const WARN_LINE_LIMIT = 200;
const ERROR_LINE_LIMIT = 500;

// Paths
const RULES_DIR = '.cursor/rules';
const LEGACY_RULES = '.cursor/.cursorrules';
const ROOT_RULES = '.cursorrules';

// Required content checks
const REQUIRED_SECTIONS = {
  'canon-governance.mdc': ['CONT_01', 'PAGE_META', 'Forbidden Patterns'],
  'security-rules.mdc': ['Never trust', 'ADR_002', 'Authentication'],
};

// ============================================================================
// TYPES
// ============================================================================

interface RuleFile {
  path: string;
  name: string;
  lines: number;
  hasCanonRef: boolean;
  hasFrontmatter: boolean;
  globs: string[];
  alwaysApply: boolean;
  issues: string[];
  warnings: string[];
}

// ============================================================================
// FUNCTIONS
// ============================================================================

function parseMdcFrontmatter(content: string): {
  description?: string;
  globs?: string[];
  alwaysApply?: boolean;
} {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return {};

  const frontmatter = frontmatterMatch[1];
  const result: any = {};

  // Parse description
  const descMatch = frontmatter.match(/description:\s*(.+)/);
  if (descMatch) result.description = descMatch[1].trim();

  // Parse globs
  const globsMatch = frontmatter.match(/globs:\s*\[(.*?)\]/);
  if (globsMatch) {
    result.globs = globsMatch[1]
      .split(',')
      .map(g => g.trim().replace(/['"]/g, ''))
      .filter(Boolean);
  }

  // Parse alwaysApply
  const alwaysMatch = frontmatter.match(/alwaysApply:\s*(true|false)/);
  if (alwaysMatch) result.alwaysApply = alwaysMatch[1] === 'true';

  return result;
}

function validateRuleFile(filePath: string): RuleFile {
  const name = path.basename(filePath);
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').length;
  const issues: string[] = [];
  const warnings: string[] = [];

  // Parse frontmatter
  const frontmatter = parseMdcFrontmatter(content);
  const hasFrontmatter = !!frontmatter.description;

  // Check for Canon reference
  const hasCanonRef = content.includes('CONT_01') || content.includes('canon/contracts');

  // Check line limits
  if (lines > ERROR_LINE_LIMIT) {
    issues.push(`File exceeds ${ERROR_LINE_LIMIT} lines (${lines} lines). Split into smaller files.`);
  } else if (lines > WARN_LINE_LIMIT) {
    warnings.push(`File has ${lines} lines. Consider splitting if > ${ERROR_LINE_LIMIT}.`);
  }

  // Check required sections for specific files
  const requiredSections = REQUIRED_SECTIONS[name as keyof typeof REQUIRED_SECTIONS];
  if (requiredSections) {
    for (const section of requiredSections) {
      if (!content.includes(section)) {
        issues.push(`Missing required section: "${section}"`);
      }
    }
  }

  // Check MDC frontmatter for .mdc files
  if (name.endsWith('.mdc') && !hasFrontmatter) {
    issues.push('Missing MDC frontmatter (---description/globs/alwaysApply---)');
  }

  return {
    path: filePath,
    name,
    lines,
    hasCanonRef,
    hasFrontmatter,
    globs: frontmatter.globs || [],
    alwaysApply: frontmatter.alwaysApply || false,
    issues,
    warnings,
  };
}

function scanRuleFiles(): RuleFile[] {
  const files: RuleFile[] = [];

  // Scan .cursor/rules/*.mdc
  if (existsSync(RULES_DIR)) {
    const ruleFiles = readdirSync(RULES_DIR).filter(f => f.endsWith('.mdc'));
    for (const file of ruleFiles) {
      files.push(validateRuleFile(path.join(RULES_DIR, file)));
    }
  }

  // Check legacy .cursorrules
  if (existsSync(LEGACY_RULES)) {
    files.push(validateRuleFile(LEGACY_RULES));
  }

  // Check root .cursorrules
  if (existsSync(ROOT_RULES)) {
    files.push(validateRuleFile(ROOT_RULES));
  }

  return files;
}

function formatFileResult(file: RuleFile): string {
  const status = file.issues.length > 0 ? '❌' : file.warnings.length > 0 ? '⚠️' : '✅';
  const lineInfo = `(${file.lines} lines)`;
  
  let result = `  ${status} ${file.name.padEnd(30)} ${lineInfo.padStart(12)}`;
  
  if (file.alwaysApply) {
    result += ' [always]';
  }

  // Print issues and warnings
  for (const issue of file.issues) {
    result += `\n     └─ ❌ ${issue}`;
  }
  for (const warning of file.warnings) {
    result += `\n     └─ ⚠️ ${warning}`;
  }

  return result;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('');
  console.log('🎯 TOOL_04: Cursor Rules Validator');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`   Version: ${TOOL_META.version}`);
  console.log(`   Scanning: .cursor/rules/*.mdc, .cursorrules`);
  console.log('───────────────────────────────────────────────────────────────');
  console.log('');

  // Scan files
  const files = scanRuleFiles();

  if (files.length === 0) {
    console.log('📁 No rule files found.');
    console.log('   Create rules in .cursor/rules/*.mdc');
    console.log('');
    process.exit(0);
  }

  // Calculate totals
  const totalLines = files.reduce((sum, f) => sum + f.lines, 0);
  const totalErrors = files.reduce((sum, f) => sum + f.issues.length, 0);
  const totalWarnings = files.reduce((sum, f) => sum + f.warnings.length, 0);
  const mdcFiles = files.filter(f => f.name.endsWith('.mdc'));
  const canonRefs = files.filter(f => f.hasCanonRef);

  // Print results
  console.log('📋 Rule Files Status:');
  console.log('');

  for (const file of files) {
    console.log(formatFileResult(file));
  }

  console.log('');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`   Total Files:        ${files.length}`);
  console.log(`   MDC Rules:          ${mdcFiles.length}`);
  console.log(`   Total Lines:        ${totalLines}`);
  console.log(`   Canon References:   ${canonRefs.length}/${files.length}`);
  console.log(`   ❌ Errors:          ${totalErrors}`);
  console.log(`   ⚠️ Warnings:        ${totalWarnings}`);
  console.log('───────────────────────────────────────────────────────────────');

  // Note: README.md is manually maintained (not auto-generated)
  // The .cursor/README.md follows standard convention, not RULES_SUMMARY.md
  console.log('');
  console.log(`📄 Reference: .cursor/README.md (manually maintained)`);
  console.log(`📄 Template:  knowledge/REF_001_CursorRulesTemplate.md`);

  // Final verdict
  console.log('');
  if (totalErrors > 0) {
    console.log(`🚫 FAILED: Found ${totalErrors} error(s) in rule files.`);
    console.log('');
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log(`⚠️ PASSED with ${totalWarnings} warning(s).`);
    console.log('');
    process.exit(0);
  } else {
    console.log('✨ PASSED: All rule files are valid and optimized.');
    console.log('');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});

