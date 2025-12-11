#!/usr/bin/env tsx
/**
 * Validate D-TOOL Directory Files
 * 
 * Validates that all files in D-TOOL directory follow Canon Identity guidelines:
 * - Files must follow TOOL_XX pattern (TOOL_[0-9]{2,3}_*.ts or .js)
 * - Only executable scripts allowed (no markdown, no documentation)
 * - Files must be in correct location
 * 
 * Usage:
 *   npm run canon:validate-dtool
 */

import { existsSync, readdirSync, statSync } from 'fs';
import { join, relative, basename, extname } from 'path';

const ROOT = process.cwd();
const DTOOL_DIR = join(ROOT, 'canon', 'D-Operations', 'D-TOOL');

interface FileValidation {
  filename: string;
  isValid: boolean;
  issues: string[];
  type: 'TOOL' | 'UTILITY' | 'INVALID';
}

// Canon Identity Pattern: TOOL_[0-9]{2,3}_*.ts or .js
const TOOL_PATTERN = /^TOOL_\d{2,3}_[A-Za-z0-9_]+\.(ts|js)$/;

// Utility scripts that don't need TOOL_ prefix (legacy or special cases)
const ALLOWED_UTILITIES = [
  'figma-sync.ts',
  'figma-push.ts',
  'sync-canon.ts',
  'sync-readme.ts'
];

function validateFileName(filename: string): FileValidation {
  const issues: string[] = [];
  let type: 'TOOL' | 'UTILITY' | 'INVALID' = 'INVALID';
  
  // Check if it's a markdown file (forbidden in D-TOOL)
  if (filename.endsWith('.md')) {
    issues.push('Markdown files are forbidden in D-TOOL (should be in E-REF)');
    return { filename, isValid: false, issues, type: 'INVALID' };
  }
  
  // Check if it's an executable script
  const ext = extname(filename);
  if (ext !== '.ts' && ext !== '.js') {
    issues.push(`Invalid file extension: ${ext} (only .ts or .js allowed)`);
    return { filename, isValid: false, issues, type: 'INVALID' };
  }
  
  // Check if it matches TOOL pattern
  if (TOOL_PATTERN.test(filename)) {
    type = 'TOOL';
    return { filename, isValid: true, issues, type };
  }
  
  // Check if it's an allowed utility
  if (ALLOWED_UTILITIES.includes(filename)) {
    type = 'UTILITY';
    issues.push('Utility script (consider renaming to TOOL_XX format for consistency)');
    return { filename, isValid: true, issues, type };
  }
  
  // Invalid file
  issues.push(`Does not match TOOL pattern: TOOL_XX_*.ts (e.g., TOOL_17_ValidateDTOOLFiles.ts)`);
  return { filename, isValid: false, issues, type: 'INVALID' };
}

function scanDTOOLDirectory(): FileValidation[] {
  if (!existsSync(DTOOL_DIR)) {
    console.log('❌ D-TOOL directory not found:', DTOOL_DIR);
    return [];
  }
  
  const files = readdirSync(DTOOL_DIR)
    .filter(f => {
      const fullPath = join(DTOOL_DIR, f);
      const stat = statSync(fullPath);
      return stat.isFile();
    });
  
  return files.map(validateFileName);
}

async function main() {
  console.log('🔍 TOOL_17: Validate D-TOOL Directory Files\n');
  console.log('Validating files against Canon Identity guidelines (CONT_01 Section 3.5)...\n');
  console.log('Canon Pattern: TOOL_[0-9]{2,3}_*.ts or .js\n');
  
  const validations = scanDTOOLDirectory();
  
  if (validations.length === 0) {
    console.log('⚠️  No files found in D-TOOL directory.');
    return;
  }
  
  console.log('📋 Validation Results:\n');
  
  const valid: FileValidation[] = [];
  const invalid: FileValidation[] = [];
  const utilities: FileValidation[] = [];
  
  for (const validation of validations) {
    if (validation.type === 'UTILITY') {
      utilities.push(validation);
      console.log(`  ⚠️  UTILITY  ${validation.filename}`);
      if (validation.issues.length > 0) {
        console.log(`     └─ ${validation.issues[0]}`);
      }
    } else if (validation.isValid) {
      valid.push(validation);
      console.log(`  ✅ TOOL     ${validation.filename}`);
    } else {
      invalid.push(validation);
      console.log(`  ❌ INVALID  ${validation.filename}`);
      validation.issues.forEach(issue => {
        console.log(`     └─ ${issue}`);
      });
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log(`   ✅ Valid TOOL files: ${valid.length}`);
  console.log(`   ⚠️  Utility files: ${utilities.length}`);
  console.log(`   ❌ Invalid files: ${invalid.length}`);
  console.log(`   📄 Total files: ${validations.length}`);
  
  if (invalid.length > 0) {
    console.log('\n🚫 FAILED: Some files do not comply with Canon Identity guidelines.');
    console.log('\n📝 Canon Identity Rules (CONT_01 Section 3.5):');
    console.log('   - Pattern: TOOL_[0-9]{2,3}_*.ts or .js');
    console.log('   - Only executable scripts allowed');
    console.log('   - No markdown files (move to E-REF)');
    console.log('   - No documentation files');
    console.log('\n💡 Recommendations:');
    invalid.forEach(v => {
      if (v.filename.endsWith('.md')) {
        console.log(`   - Move ${v.filename} to canon/E-Knowledge/E-REF/`);
      } else {
        console.log(`   - Rename ${v.filename} to follow TOOL_XX_*.ts pattern`);
      }
    });
    process.exit(1);
  } else {
    console.log('\n✨ PASSED: All files comply with Canon Identity guidelines.');
    
    if (utilities.length > 0) {
      console.log('\n💡 Note: Consider renaming utility scripts to TOOL_XX format for consistency:');
      utilities.forEach(v => {
        console.log(`   - ${v.filename} → TOOL_XX_${v.filename.replace('.ts', '')}.ts`);
      });
    }
  }
}

main().catch(console.error);
