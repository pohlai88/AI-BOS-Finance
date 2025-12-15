#!/usr/bin/env tsx
/**
 * CONT_05 Boundary Checker
 * 
 * Validates dependency boundaries per CONT_05_NamingAndStructure.md
 * Prevents architectural violations (Cell → Cell, Canon → Canon, etc.)
 * 
 * Usage:
 *   pnpm check:boundaries
 *   pnpm check:boundaries --json
 */

import { readFile, readdir } from 'fs/promises';
import { join, relative } from 'path';
import { existsSync } from 'fs';

interface BoundaryViolation {
  file: string;
  line: number;
  violation: string;
  forbidden: string;
  suggestion: string;
  severity: 'error' | 'warning';
}

const violations: BoundaryViolation[] = [];

// Forbidden import patterns
const FORBIDDEN_PATTERNS = [
  {
    from: 'cell',
    pattern: /from ['"]\.\.\/.*['"]/,
    test: (importPath: string, filePath: string) => {
      // Check if importing from another cell
      const cellMatch = filePath.match(/apps\/canon\/[^/]+\/[^/]+\/([^/]+)\//);
      if (!cellMatch) return false;
      const currentCell = cellMatch[1];
      return importPath.includes('../') && !importPath.includes('@aibos/');
    },
    reason: 'Cells are atomic. Use Kernel Gateway or Event Bus.',
    suggestion: 'Use Kernel Gateway API or emit events via Event Bus',
  },
  {
    from: 'canon',
    pattern: /from ['"]@aibos\/canon-(?!finance)/,
    test: (importPath: string) => {
      // Check if importing from different canon
      return /@aibos\/canon-(?!finance)/.test(importPath);
    },
    reason: 'Canons are independent. Use Kernel Gateway.',
    suggestion: 'Use Kernel Gateway for cross-domain communication',
  },
  {
    from: 'web',
    pattern: /from ['"]@aibos\/db['"]/,
    test: (importPath: string) => {
      return importPath.includes('@aibos/db');
    },
    reason: 'Frontend cannot access DB directly. Use Server Actions.',
    suggestion: 'Create Server Action in app/ directory instead',
  },
];

async function checkFile(filePath: string): Promise<void> {
  if (!existsSync(filePath)) return;

  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Check for import statements
      if (!line.match(/import|from|require/)) continue;

      // Determine file type
      const isCell = filePath.includes('/canon/') && filePath.match(/\/[^/]+\/[^/]+\/[^/]+\//);
      const isCanon = filePath.includes('/canon/') && !isCell;
      const isWeb = filePath.includes('/web/');

      for (const rule of FORBIDDEN_PATTERNS) {
        if (rule.pattern.test(line)) {
          const importMatch = line.match(/from ['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\)/);
          if (!importMatch) continue;

          const importPath = importMatch[1] || importMatch[2];

          // Apply context-specific checks
          if (isCell && rule.from === 'cell' && rule.test(importPath, filePath)) {
            violations.push({
              file: relative(process.cwd(), filePath),
              line: lineNum,
              violation: 'Cell → Cell import',
              forbidden: importPath,
              suggestion: rule.suggestion,
              severity: 'error',
            });
          } else if (isCanon && rule.from === 'canon' && rule.test(importPath)) {
            violations.push({
              file: relative(process.cwd(), filePath),
              line: lineNum,
              violation: 'Canon → Canon import',
              forbidden: importPath,
              suggestion: rule.suggestion,
              severity: 'error',
            });
          } else if (isWeb && rule.from === 'web' && rule.test(importPath)) {
            violations.push({
              file: relative(process.cwd(), filePath),
              line: lineNum,
              violation: 'Frontend → DB direct access',
              forbidden: importPath,
              suggestion: rule.suggestion,
              severity: 'error',
            });
          }
        }
      }
    }
  } catch (error) {
    // Skip files that can't be read
  }
}

async function scanDirectory(dir: string): Promise<void> {
  if (!existsSync(dir)) return;

  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and other build artifacts
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.next') {
        continue;
      }
      await scanDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js'))) {
      await checkFile(fullPath);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');

  if (!jsonOutput) {
    console.log('🛡️  Checking architectural boundaries per CONT_05...\n');
  }

  // Scan relevant directories
  await scanDirectory('apps/canon');
  await scanDirectory('apps/web');

  if (violations.length === 0) {
    if (jsonOutput) {
      console.log(JSON.stringify({ valid: true, violations: [] }, null, 2));
    } else {
      console.log('✅ All boundary checks passed!\n');
      console.log('   No Cell → Cell imports');
      console.log('   No Canon → Canon imports');
      console.log('   No Frontend → DB direct access\n');
    }
    process.exit(0);
  }

  if (jsonOutput) {
    console.log(JSON.stringify({
      valid: false,
      violations: violations.map(v => ({
        file: v.file,
        line: v.line,
        violation: v.violation,
        forbidden: v.forbidden,
        suggestion: v.suggestion,
        severity: v.severity,
      })),
      summary: {
        total: violations.length,
        errors: violations.filter(v => v.severity === 'error').length,
        warnings: violations.filter(v => v.severity === 'warning').length,
      },
    }, null, 2));
  } else {
    console.log(`❌ Found ${violations.length} boundary violation(s):\n`);

    for (const violation of violations) {
      console.log(`  ${violation.file}:${violation.line}`);
      console.log(`    Violation: ${violation.violation}`);
      console.log(`    Forbidden: ${violation.forbidden}`);
      console.log(`    💡 Fix: ${violation.suggestion}\n`);
    }

    console.log('📚 See CONT_05_NamingAndStructure.md for architectural rules.\n');
  }

  process.exit(1);
}

main().catch(console.error);
