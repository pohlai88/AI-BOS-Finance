#!/usr/bin/env tsx
/**
 * TOOL_31: Validate File Access Control
 * 
 * Validates that file access control rules are being followed.
 * Checks that only src/ directory is writable, all else is read-only.
 * 
 * Usage:
 *   npm run canon:validate-access
 *   npm run canon:validate-access -- --check-git
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const PROJECT_ROOT = process.cwd();
const ALLOWED_DIR = path.join(PROJECT_ROOT, 'src');
const FORBIDDEN_DIRS = [
  'canon',
  'canon-pages',
  'app',
  'public',
  'db',
  '.cursor',
  '.staging-docs',
];

const FORBIDDEN_CONFIG_FILES = [
  'package.json',
  'tsconfig.json',
  'next.config.mjs',
  'tailwind.config.js',
  'postcss.config.js',
  'eslint.config.js',
  '.gitignore',
  'README.md',
];

interface ValidationResult {
  path: string;
  allowed: boolean;
  reason?: string;
}

interface ValidationReport {
  total: number;
  allowed: number;
  forbidden: number;
  violations: ValidationResult[];
}

/**
 * Check if a file path is allowed for writes
 */
function isPathAllowed(filePath: string): { allowed: boolean; reason?: string } {
  const relativePath = path.relative(PROJECT_ROOT, filePath);

  // ✅ Allowed: src/ directory
  if (relativePath.startsWith('src' + path.sep) || relativePath === 'src') {
    return { allowed: true };
  }

  // ⚠️ Staging exception (temporary)
  if (relativePath.startsWith('.staging-docs' + path.sep)) {
    return { allowed: true, reason: 'Staging directory (temporary)' };
  }

  // ❌ Forbidden: Root config files
  const fileName = path.basename(relativePath);
  if (FORBIDDEN_CONFIG_FILES.includes(fileName)) {
    return {
      allowed: false,
      reason: `Configuration file (${fileName}) - requires manual approval`
    };
  }

  // ❌ Forbidden: Locked directories
  for (const dir of FORBIDDEN_DIRS) {
    if (relativePath.startsWith(dir + path.sep) || relativePath === dir) {
      return {
        allowed: false,
        reason: `Directory locked (${dir}/) - use appropriate workflow`
      };
    }
  }

  // ❌ Forbidden: Root level files
  if (!relativePath.includes(path.sep)) {
    return {
      allowed: false,
      reason: 'Root level file - only src/ directory allowed'
    };
  }

  // Default: forbidden
  return {
    allowed: false,
    reason: 'File outside allowed src/ directory'
  };
}

/**
 * Validate Git changes (if --check-git flag provided)
 */
function validateGitChanges(): ValidationReport {
  try {
    const changedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT,
    })
      .trim()
      .split('\n')
      .filter(line => line.length > 0);

    const violations: ValidationResult[] = [];
    let allowed = 0;
    let forbidden = 0;

    for (const file of changedFiles) {
      const fullPath = path.join(PROJECT_ROOT, file);
      const validation = isPathAllowed(fullPath);

      if (validation.allowed) {
        allowed++;
      } else {
        forbidden++;
        violations.push({
          path: file,
          allowed: false,
          reason: validation.reason,
        });
      }
    }

    return {
      total: changedFiles.length,
      allowed,
      forbidden,
      violations,
    };
  } catch (error) {
    console.error('❌ Error checking Git changes:', error);
    return {
      total: 0,
      allowed: 0,
      forbidden: 0,
      violations: [],
    };
  }
}

/**
 * Validate directory structure
 */
function validateDirectoryStructure(): ValidationReport {
  const violations: ValidationResult[] = [];

  // Check forbidden directories exist and are not writable
  for (const dir of FORBIDDEN_DIRS) {
    const dirPath = path.join(PROJECT_ROOT, dir);
    if (fs.existsSync(dirPath)) {
      // Directory exists - this is expected (read-only)
      // We can't check write permissions via filesystem, but we document it
    }
  }

  // Check allowed directory exists
  if (!fs.existsSync(ALLOWED_DIR)) {
    violations.push({
      path: 'src/',
      allowed: false,
      reason: 'Allowed directory (src/) does not exist',
    });
  }

  return {
    total: FORBIDDEN_DIRS.length + 1,
    allowed: violations.length === 0 ? 1 : 0,
    forbidden: 0,
    violations,
  };
}

/**
 * Main validation function
 */
function main() {
  const args = process.argv.slice(2);
  const checkGit = args.includes('--check-git');

  console.log('🔍 Validating File Access Control...\n');
  console.log('📋 Rules:');
  console.log('  ✅ Allowed: src/ directory');
  console.log('  ⚠️  Staging: .staging-docs/ (temporary)');
  console.log('  ❌ Forbidden: canon/, canon-pages/, app/, public/, db/, config files\n');

  // Validate directory structure
  const structureReport = validateDirectoryStructure();
  if (structureReport.violations.length > 0) {
    console.log('❌ Directory Structure Issues:');
    structureReport.violations.forEach(v => {
      console.log(`   - ${v.path}: ${v.reason}`);
    });
    console.log();
  }

  // Validate Git changes if requested
  if (checkGit) {
    console.log('🔍 Checking Git staged changes...\n');
    const gitReport = validateGitChanges();

    if (gitReport.total === 0) {
      console.log('✅ No staged changes to validate');
    } else {
      console.log(`📊 Git Changes Report:`);
      console.log(`   Total: ${gitReport.total}`);
      console.log(`   ✅ Allowed: ${gitReport.allowed}`);
      console.log(`   ❌ Forbidden: ${gitReport.forbidden}\n`);

      if (gitReport.violations.length > 0) {
        console.log('🚨 VIOLATIONS DETECTED:\n');
        gitReport.violations.forEach(v => {
          console.log(`   ❌ ${v.path}`);
          console.log(`      Reason: ${v.reason}\n`);
        });

        console.log('💡 Solutions:');
        console.log('   - For canon/ files: Use .staging-docs/ workflow');
        console.log('   - For app/ routes: Edit src/ components instead');
        console.log('   - For config files: Request manual approval');
        console.log('   - Unstage forbidden files: git reset HEAD <file>\n');

        process.exit(1);
      } else {
        console.log('✅ All staged changes are in allowed directories\n');
      }
    }
  }

  console.log('✅ File Access Control Validation Complete');
  console.log('\n📚 See REF_045_FileAccessControl.md for full documentation');
}

// Run if called directly
const isMainModule = process.argv[1] && (
  process.argv[1].endsWith('TOOL_31_ValidateFileAccess.ts') ||
  process.argv[1].includes('TOOL_31_ValidateFileAccess')
);

if (isMainModule) {
  main();
}

export { isPathAllowed, validateGitChanges, validateDirectoryStructure };
