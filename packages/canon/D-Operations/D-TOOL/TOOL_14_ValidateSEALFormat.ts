#!/usr/bin/env tsx
/**
 * Validate SEAL Format
 * 
 * Validates that all README files and governed documents
 * follow the standardized SEAL format.
 * 
 * Usage:
 *   npm run canon:validate-seal
 */

import { existsSync, readdirSync, readFileSync } from 'fs';
import { join, relative, basename, extname } from 'path';

const ROOT = process.cwd();
const CANON_DIR = join(ROOT, 'canon');

interface ValidationResult {
  file: string;
  type: 'README' | 'CONT' | 'ADR' | 'REF' | 'SPEC' | 'OTHER';
  hasSEAL: boolean;
  isValid: boolean;
  issues: string[];
  warnings: string[];
}

const SEAL_PATTERNS = {
  status: /🟢|🟡|🔴/,
  active: /\[ACTIVE\]/,
  draft: /\[DRAFT\]/,
  deprecated: /\[DEPRECATED\]/,
  canonCode: /\*\*Canon Code:\*\*\s*([A-Z]+_\d+)/,
  plane: /\*\*Plane:\*\*\s*([A-E])\s*—\s*([A-Za-z]+)/,
  version: /\*\*Version:\*\*\s*([\d.]+)/
};

const REQUIRED_FIELDS = {
  README: ['Canon Plane', 'Prefixes', 'Location'],
  CONT: ['Canon Code', 'Version', 'Plane'],
  ADR: ['Canon Code', 'Date', 'Context'],
  REF: ['Canon Code', 'Purpose', 'Plane'],
  SPEC: ['Canon Code', 'Purpose', 'Plane']
};

function detectDocumentType(filePath: string, content: string): ValidationResult['type'] {
  const fileName = basename(filePath);
  
  if (fileName === 'README.md') return 'README';
  if (fileName.startsWith('CONT_')) return 'CONT';
  if (fileName.startsWith('ADR_')) return 'ADR';
  if (fileName.startsWith('REF_')) return 'REF';
  if (fileName.startsWith('SPEC_')) return 'SPEC';
  
  return 'OTHER';
}

function validateSEAL(content: string, type: ValidationResult['type']): { isValid: boolean; issues: string[]; warnings: string[] } {
  const issues: string[] = [];
  const warnings: string[] = [];
  
  // Check for SEAL header (starts with >)
  const hasSEALHeader = content.trim().startsWith('>');
  if (!hasSEALHeader) {
    issues.push('Missing SEAL header (should start with `>`)');
    return { isValid: false, issues, warnings };
  }
  
  // Extract SEAL block (first blockquote)
  const sealMatch = content.match(/^>.*?(?=\n\n|---)/s);
  if (!sealMatch) {
    issues.push('SEAL header block not found');
    return { isValid: false, issues, warnings };
  }
  
  const sealContent = sealMatch[0];
  
  // Check status (required for all documents)
  const hasStatusEmoji = SEAL_PATTERNS.status.test(sealContent);
  const hasStatusLabel = SEAL_PATTERNS.active.test(sealContent) || 
                        SEAL_PATTERNS.draft.test(sealContent) || 
                        SEAL_PATTERNS.deprecated.test(sealContent);
  
  if (!hasStatusEmoji) {
    issues.push('Missing status emoji (🟢, 🟡, or 🔴)');
  }
  
  if (!hasStatusLabel) {
    issues.push('Missing status label ([ACTIVE], [DRAFT], or [DEPRECATED])');
  }
  
  // Check Canon Code (required for all except README)
  if (type !== 'README' && !SEAL_PATTERNS.canonCode.test(sealContent)) {
    issues.push('Missing Canon Code field');
  }
  
  // Check required fields by type
  const required = REQUIRED_FIELDS[type] || [];
  for (const field of required) {
    // Accept both singular and plural for Prefix/Prefixes
    const fieldVariants = field === 'Prefixes' ? ['Prefixes', 'Prefix'] : [field];
    const hasField = fieldVariants.some(variant => {
      const fieldPattern = new RegExp(`\\*\\*${variant}:\\*\\*`, 'i');
      return fieldPattern.test(sealContent);
    });
    
    if (!hasField) {
      issues.push(`Missing required field: ${field}`);
    }
  }
  
  // Check Plane (required for governed documents)
  if (['CONT', 'REF', 'SPEC'].includes(type) && !SEAL_PATTERNS.plane.test(sealContent)) {
    issues.push('Missing Plane designation');
  }
  
  // Check Version (required for CONT, REF, SPEC)
  if (['CONT', 'REF', 'SPEC'].includes(type) && !SEAL_PATTERNS.version.test(sealContent)) {
    warnings.push('Version field recommended for this document type');
  }
  
  // Validate format consistency
  const lines = sealContent.split('\n').filter(l => l.trim().startsWith('>'));
  if (lines.length < 2) {
    issues.push('SEAL header should have at least 2 lines');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings
  };
}

function validateFile(filePath: string): ValidationResult {
  const content = readFileSync(filePath, 'utf-8');
  const type = detectDocumentType(filePath, content);
  const { isValid, issues, warnings } = validateSEAL(content, type);
  
  return {
    file: relative(ROOT, filePath),
    type,
    hasSEAL: content.trim().startsWith('>'),
    isValid,
    issues,
    warnings
  };
}

function scanDirectory(dirPath: string, results: ValidationResult[]): void {
  if (!existsSync(dirPath)) return;
  
  const entries = readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    
    if (entry.isDirectory() && !entry.name.startsWith('z-')) {
      scanDirectory(fullPath, results);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      // Skip archive directories
      if (fullPath.includes('z-archive')) continue;
      
      results.push(validateFile(fullPath));
    }
  }
}

async function main() {
  console.log('🔍 TOOL_14: Validate SEAL Format\n');
  console.log('Validating SEAL format compliance across all Canon documents...\n');
  
  const results: ValidationResult[] = [];
  scanDirectory(CANON_DIR, results);
  
  // Filter to only README and governed documents
  const relevantResults = results.filter(r => 
    r.type !== 'OTHER' || r.file.includes('README')
  );
  
  console.log('📋 Validation Results:\n');
  
  let validCount = 0;
  let invalidCount = 0;
  let warningCount = 0;
  
  for (const result of relevantResults) {
    const status = result.isValid ? '✅' : '❌';
    const typeLabel = result.type.padEnd(8);
    
    console.log(`  ${status} ${typeLabel} ${result.file}`);
    
    if (result.issues.length > 0) {
      for (const issue of result.issues) {
        console.log(`     └─ ❌ ${issue}`);
      }
      invalidCount++;
    }
    
    if (result.warnings.length > 0) {
      for (const warning of result.warnings) {
        console.log(`     └─ ⚠️  ${warning}`);
      }
      warningCount++;
    }
    
    if (result.isValid && result.issues.length === 0) {
      validCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Valid:        ${validCount}`);
  console.log(`❌ Invalid:      ${invalidCount}`);
  console.log(`⚠️  Warnings:     ${warningCount}`);
  console.log(`📄 Total:        ${relevantResults.length}`);
  console.log('='.repeat(60));
  
  if (invalidCount > 0) {
    console.log('\n🚫 FAILED: Some documents do not comply with SEAL format.');
    console.log('   Run `npm run canon:generate-readme-headers` to auto-fix README files.');
    process.exit(1);
  } else if (warningCount > 0) {
    console.log('\n⚠️  PASSED with warnings. Consider addressing recommendations.');
    process.exit(0);
  } else {
    console.log('\n✨ PASSED: All documents comply with SEAL format standard.');
    process.exit(0);
  }
}

main().catch(console.error);
