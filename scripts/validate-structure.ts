#!/usr/bin/env tsx
/**
 * CONT_05 Structure Validator
 * 
 * Validates directory structure and naming conventions per CONT_05_NamingAndStructure.md
 * 
 * Usage:
 *   pnpm validate:structure
 *   pnpm validate:structure --json    # JSON output for CI/CD
 *   pnpm validate:structure --fix     # (Future: auto-fix suggestions)
 */

import { readdir, readFile } from 'fs/promises';
import { join, relative } from 'path';
import { existsSync } from 'fs';

interface Violation {
  path: string;
  rule: string;
  expected: string;
  actual: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}

const violations: Violation[] = [];

// Naming patterns
const PATTERNS = {
  kebabCase: /^[a-z]+(-[a-z]+)*$/, // lowercase, hyphenated
  cellName: /^[a-z]+(-[a-z]+)*(-demo|-test|-stub)?$/, // cell with optional suffix
  migration: /^\d{3}_[a-z_]+\.sql$/, // 016_governance_views.sql
  packageName: {
    kernel: /^@aibos\/kernel$/,
    canon: /^@aibos\/canon-[a-z-]+$/,
    molecule: /^@aibos\/mol-[a-z-]+-[a-z-]+$/, // mol-<domain>-<molecule>
    cell: /^@aibos\/cell-[a-z-]+-[a-z-]+-[a-z-]+(-demo|-test|-stub)?$/, // cell-<domain>-<molecule>-<cell>(-suffix)?
  },
  dockerService: {
    kernel: /^(kernel|aibos-kernel)$/,
    canon: /^canon-[a-z-]+$/,
    molecule: /^[a-z-]+-[a-z-]+$/, // domain-molecule
    cell: /^cell-[a-z-]+-[a-z-]+-[a-z-]+(-demo|-test|-stub)?$/, // cell-<domain>-<molecule>-<cell>(-suffix)?
  },
};

async function validateDirectory(path: string, expectedPattern: RegExp, rule: string): Promise<void> {
  if (!existsSync(path)) return;

  const entries = await readdir(path, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const fullPath = join(path, entry.name);

    if (!expectedPattern.test(entry.name)) {
      // Generate suggestion
      const suggestion = generateSuggestion(entry.name, expectedPattern);

      violations.push({
        path: fullPath,
        rule,
        expected: expectedPattern.toString(),
        actual: entry.name,
        severity: 'error',
        suggestion,
      });
    }
  }
}

function generateSuggestion(actual: string, pattern: RegExp): string {
  // Convert to kebab-case
  const kebabCase = actual
    .replace(/([A-Z])/g, '-$1')
    .replace(/[_\s]+/g, '-')
    .toLowerCase()
    .replace(/^-+|-+$/g, '');

  if (pattern.test(kebabCase)) {
    return `Rename to: "${kebabCase}"`;
  }

  return `Must match pattern: ${pattern.toString()}`;
}

async function validateKernel(): Promise<void> {
  const kernelPath = 'apps/kernel';
  if (!existsSync(kernelPath)) {
    violations.push({
      path: kernelPath,
      rule: 'Kernel MUST exist',
      expected: 'apps/kernel/',
      actual: 'MISSING',
      severity: 'error',
    });
    return;
  }

  // Check package.json name
  const packageJsonPath = join(kernelPath, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const content = await readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);
      if (pkg.name && !PATTERNS.packageName.kernel.test(pkg.name)) {
        violations.push({
          path: packageJsonPath,
          rule: 'Kernel package name',
          expected: '@aibos/kernel',
          actual: pkg.name,
          severity: 'error',
          suggestion: `Change package.json "name" to "@aibos/kernel"`,
        });
      }
    } catch (error) {
      violations.push({
        path: packageJsonPath,
        rule: 'Kernel package.json parse error',
        expected: 'Valid JSON',
        actual: String(error),
        severity: 'error',
      });
    }
  }
}

async function validateCanon(): Promise<void> {
  const canonPath = 'apps/canon';
  if (!existsSync(canonPath)) return;

  // Validate domain names (e.g., finance, hr)
  await validateDirectory(canonPath, PATTERNS.kebabCase, 'Canon domain names MUST be kebab-case');

  const domains = await readdir(canonPath, { withFileTypes: true });

  for (const domain of domains) {
    if (!domain.isDirectory()) continue;
    if (!PATTERNS.kebabCase.test(domain.name)) continue;

    const domainPath = join(canonPath, domain.name);

    // Validate molecules
    await validateDirectory(domainPath, PATTERNS.kebabCase, `Molecule names under ${domain.name} MUST be kebab-case`);

    const molecules = await readdir(domainPath, { withFileTypes: true });

    for (const molecule of molecules) {
      if (!molecule.isDirectory()) continue;
      if (!PATTERNS.kebabCase.test(molecule.name)) continue;

      const moleculePath = join(domainPath, molecule.name);

      // Validate cells
      await validateDirectory(moleculePath, PATTERNS.cellName, `Cell names under ${molecule.name} MUST be kebab-case (with optional -demo/-test/-stub suffix)`);

      // Validate cell package.json names
      const cells = await readdir(moleculePath, { withFileTypes: true });
      for (const cell of cells) {
        if (!cell.isDirectory()) continue;

        const cellPath = join(moleculePath, cell.name);
        const cellPackageJson = join(cellPath, 'package.json');

        if (existsSync(cellPackageJson)) {
          try {
            const content = await readFile(cellPackageJson, 'utf-8');
            const pkg = JSON.parse(content);

            // Extract domain, molecule, and cell name from path
            const pathParts = cellPath.split(/[/\\]/);
            const domainIndex = pathParts.indexOf('canon') + 1;
            const moleculeIndex = domainIndex + 1;
            const domain = pathParts[domainIndex];
            const molecule = pathParts[moleculeIndex];
            const cellName = cell.name; // Keep suffix if present

            // Build full package name: cell-<domain>-<molecule>-<cell>(-suffix)?
            const expectedPackageName = `@aibos/cell-${domain}-${molecule}-${cellName}`;

            if (pkg.name && !PATTERNS.packageName.cell.test(pkg.name)) {
              violations.push({
                path: cellPackageJson,
                rule: 'Cell package name',
                expected: expectedPackageName,
                actual: pkg.name,
                severity: 'error',
                suggestion: `Change package.json "name" to "${expectedPackageName}"`,
              });
            }
          } catch (error) {
            // Skip parse errors (already handled elsewhere)
          }
        }
      }
    }
  }
}

async function validateDatabase(): Promise<void> {
  const dbPath = 'apps/db';
  if (!existsSync(dbPath)) return;

  const migrationsPath = join(dbPath, 'migrations');
  if (!existsSync(migrationsPath)) return;

  const schemas = await readdir(migrationsPath, { withFileTypes: true });

  for (const schema of schemas) {
    if (!schema.isDirectory()) continue;

    const schemaPath = join(migrationsPath, schema.name);
    const migrations = await readdir(schemaPath);

    for (const migration of migrations) {
      if (!PATTERNS.migration.test(migration)) {
        violations.push({
          path: join(schemaPath, migration),
          rule: 'Migration naming',
          expected: 'NNN_description.sql (e.g., 016_governance_views.sql)',
          actual: migration,
        });
      }
    }
  }
}

async function validateDockerServices(): Promise<void> {
  const dockerComposePath = 'apps/kernel/docker-compose.yml';
  if (!existsSync(dockerComposePath)) return;

  try {
    const content = await readFile(dockerComposePath, 'utf-8');
    const lines = content.split('\n');

    // Simple regex-based extraction (YAML parsing would be better)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Match service names (e.g., "cell-payment-hub:")
      if (line.match(/^[a-z-]+:$/) && !line.startsWith('#') && !line.includes('version') && !line.includes('services')) {
        const serviceName = line.replace(':', '');

        // Check if it's a cell service
        if (serviceName.startsWith('cell-')) {
          // Validate cell service name pattern
          if (!PATTERNS.dockerService.cell.test(serviceName)) {
            violations.push({
              path: dockerComposePath,
              rule: 'Docker service name (cell)',
              expected: 'cell-<name> (kebab-case)',
              actual: serviceName,
              severity: 'warning',
              suggestion: `Service name "${serviceName}" should follow cell-<name> pattern`,
            });
          }
        }
      }
    }
  } catch (error) {
    // Skip if file can't be read
  }
}

async function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const fix = args.includes('--fix');

  if (!jsonOutput) {
    console.log('🔍 Validating structure per CONT_05...\n');
  }

  await validateKernel();
  await validateCanon();
  await validateDatabase();
  await validateDockerServices();

  if (violations.length === 0) {
    if (jsonOutput) {
      console.log(JSON.stringify({ valid: true, violations: [] }, null, 2));
    } else {
      console.log('✅ All structure validations passed!\n');
      console.log('   Directory structure: ✅');
      console.log('   Package names: ✅');
      console.log('   Migration naming: ✅');
      console.log('   Docker services: ✅\n');
    }
    process.exit(0);
  }

  const errors = violations.filter(v => v.severity === 'error');
  const warnings = violations.filter(v => v.severity === 'warning');

  if (jsonOutput) {
    console.log(JSON.stringify({
      valid: errors.length === 0,
      violations: violations.map(v => ({
        path: relative(process.cwd(), v.path),
        rule: v.rule,
        expected: v.expected,
        actual: v.actual,
        severity: v.severity,
        suggestion: v.suggestion,
      })),
      summary: {
        total: violations.length,
        errors: errors.length,
        warnings: warnings.length,
      },
    }, null, 2));
  } else {
    console.log(`❌ Found ${violations.length} violation(s):\n`);
    console.log(`   Errors: ${errors.length}`);
    console.log(`   Warnings: ${warnings.length}\n`);

    if (errors.length > 0) {
      console.log('🔴 ERRORS:\n');
      for (const violation of errors) {
        console.log(`  ${relative(process.cwd(), violation.path)}`);
        console.log(`    Rule: ${violation.rule}`);
        console.log(`    Expected: ${violation.expected}`);
        console.log(`    Actual: ${violation.actual}`);
        if (violation.suggestion) {
          console.log(`    💡 Suggestion: ${violation.suggestion}`);
        }
        console.log('');
      }
    }

    if (warnings.length > 0) {
      console.log('🟡 WARNINGS:\n');
      for (const violation of warnings) {
        console.log(`  ${relative(process.cwd(), violation.path)}`);
        console.log(`    Rule: ${violation.rule}`);
        if (violation.suggestion) {
          console.log(`    💡 Suggestion: ${violation.suggestion}`);
        }
        console.log('');
      }
    }

    console.log('📚 See CONT_05_NamingAndStructure.md for full specification.\n');
  }

  if (fix) {
    console.log('⚠️  --fix flag not yet implemented. Use suggestions above to fix manually.\n');
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch(console.error);
