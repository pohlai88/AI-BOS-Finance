#!/usr/bin/env tsx
/**
 * CONT_06 Schema Validator
 * 
 * Validates schema registration and compliance per CONT_06_SchemaAndTypeGovernance.md
 * 
 * Usage:
 *   pnpm validate:schemas
 *   pnpm validate:schemas --json
 */

import { readFile, readdir } from 'fs/promises';
import { join, relative } from 'path';
import { existsSync } from 'fs';
import yaml from 'js-yaml';

interface SchemaRegistryItem {
  code: string;
  version: string;
  name: string;
  kind: string;
  module: string;
  export: string;
  impl_file: string;
  status: string;
  owner?: string;
  description?: string;
}

interface Violation {
  code: string;
  rule: string;
  expected: string;
  actual: string;
  file?: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}

const violations: Violation[] = [];

// SCH code pattern
const SCH_CODE_PATTERN = /^SCH_\d{3}$/;

async function loadSchemasYaml(): Promise<SchemaRegistryItem[]> {
  const schemasYamlPath = 'canon/schemas.yaml';
  if (!existsSync(schemasYamlPath)) {
    violations.push({
      code: 'MISSING_REGISTRY',
      rule: 'Schema registry MUST exist',
      expected: 'canon/schemas.yaml',
      actual: 'MISSING',
      severity: 'error',
    });
    return [];
  }

  try {
    const content = await readFile(schemasYamlPath, 'utf-8');
    const doc = yaml.load(content) as { schemas?: SchemaRegistryItem[] };
    return doc.schemas || [];
  } catch (error) {
    violations.push({
      code: 'PARSE_ERROR',
      rule: 'Schema registry MUST be valid YAML',
      expected: 'Valid YAML',
      actual: String(error),
      file: schemasYamlPath,
      severity: 'error',
    });
    return [];
  }
}

async function validateSchemaFile(schema: SchemaRegistryItem): Promise<void> {
  const implFile = schema.impl_file;
  
  if (!existsSync(implFile)) {
    violations.push({
      code: schema.code,
      rule: 'Schema implementation file MUST exist',
      expected: implFile,
      actual: 'MISSING',
      file: implFile,
      severity: 'error',
      suggestion: `Create ${implFile} with export "${schema.export}"`,
    });
    return;
  }

  try {
    const content = await readFile(implFile, 'utf-8');
    
    // Check if export exists
    const exportPattern = new RegExp(`export\\s+(const|type|function)\\s+${schema.export}`);
    if (!exportPattern.test(content)) {
      violations.push({
        code: schema.code,
        rule: 'Schema MUST export registered export name',
        expected: `export const ${schema.export}`,
        actual: 'NOT FOUND',
        file: implFile,
        severity: 'error',
        suggestion: `Add: export const ${schema.export} = ...`,
      });
    }

    // Check SCH code pattern
    if (!SCH_CODE_PATTERN.test(schema.code)) {
      violations.push({
        code: schema.code,
        rule: 'SCH code MUST match pattern SCH_[0-9]{3}',
        expected: 'SCH_XXX (e.g., SCH_101)',
        actual: schema.code,
        severity: 'error',
      });
    }

    // Check kind is valid
    const validKinds = ['zod', 'json_schema', 'drizzle', 'prisma', 'typescript'];
    if (!validKinds.includes(schema.kind)) {
      violations.push({
        code: schema.code,
        rule: 'Schema kind MUST be valid',
        expected: validKinds.join(' | '),
        actual: schema.kind,
        severity: 'warning',
      });
    }

  } catch (error) {
    violations.push({
      code: schema.code,
      rule: 'Schema file MUST be readable',
      expected: 'Valid TypeScript file',
      actual: String(error),
      file: implFile,
      severity: 'error',
    });
  }
}

async function checkDuplicateCodes(schemas: SchemaRegistryItem[]): Promise<void> {
  const codeMap = new Map<string, SchemaRegistryItem[]>();
  
  for (const schema of schemas) {
    if (!codeMap.has(schema.code)) {
      codeMap.set(schema.code, []);
    }
    codeMap.get(schema.code)!.push(schema);
  }

  for (const [code, items] of codeMap.entries()) {
    if (items.length > 1) {
      violations.push({
        code,
        rule: 'SCH codes MUST be unique',
        expected: 'Single registration',
        actual: `${items.length} registrations`,
        severity: 'error',
        suggestion: `Remove duplicate registrations of ${code}`,
      });
    }
  }
}

async function scanSchemaFiles(): Promise<string[]> {
  const schemasPath = 'packages/schemas/src';
  if (!existsSync(schemasPath)) return [];

  const schemaFiles: string[] = [];
  
  async function scanDir(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        schemaFiles.push(fullPath);
      }
    }
  }

  await scanDir(schemasPath);
  return schemaFiles;
}

async function validateUnregisteredSchemas(
  registeredSchemas: SchemaRegistryItem[],
  schemaFiles: string[]
): Promise<void> {
  const registeredFiles = new Set(registeredSchemas.map(s => s.impl_file));
  
  for (const file of schemaFiles) {
    // Skip index files
    if (file.endsWith('index.ts')) continue;
    
    // Check if file exports a schema-like export
    try {
      const content = await readFile(file, 'utf-8');
      const hasZodExport = /export\s+const\s+\w+Schema\s*=/g.test(content);
      
      if (hasZodExport && !registeredFiles.has(file)) {
        violations.push({
          code: 'UNREGISTERED',
          rule: 'Schema files MUST be registered in canon/schemas.yaml',
          expected: 'Registered with SCH code',
          actual: 'Not registered',
          file,
          severity: 'warning',
          suggestion: `Add entry to canon/schemas.yaml with SCH_XXX code`,
        });
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');

  if (!jsonOutput) {
    console.log('🔍 Validating schemas per CONT_06...\n');
  }

  // Load registered schemas
  const registeredSchemas = await loadSchemasYaml();

  // Validate each registered schema
  for (const schema of registeredSchemas) {
    await validateSchemaFile(schema);
  }

  // Check for duplicate codes
  await checkDuplicateCodes(registeredSchemas);

  // Scan for unregistered schemas
  const schemaFiles = await scanSchemaFiles();
  await validateUnregisteredSchemas(registeredSchemas, schemaFiles);

  if (violations.length === 0) {
    if (jsonOutput) {
      console.log(JSON.stringify({ valid: true, violations: [] }, null, 2));
    } else {
      console.log('✅ All schema validations passed!\n');
      console.log(`   Registered schemas: ${registeredSchemas.length}`);
      console.log(`   Schema files: ${schemaFiles.length}`);
      console.log(`   All SCH codes valid\n`);
    }
    process.exit(0);
  }

  const errors = violations.filter(v => v.severity === 'error');
  const warnings = violations.filter(v => v.severity === 'warning');

  if (jsonOutput) {
    console.log(JSON.stringify({
      valid: errors.length === 0,
      violations: violations.map(v => ({
        code: v.code,
        rule: v.rule,
        expected: v.expected,
        actual: v.actual,
        file: v.file ? relative(process.cwd(), v.file) : undefined,
        severity: v.severity,
        suggestion: v.suggestion,
      })),
      summary: {
        total: violations.length,
        errors: errors.length,
        warnings: warnings.length,
        registered: registeredSchemas.length,
      },
    }, null, 2));
  } else {
    console.log(`❌ Found ${violations.length} violation(s):\n`);
    console.log(`   Errors: ${errors.length}`);
    console.log(`   Warnings: ${warnings.length}\n`);

    if (errors.length > 0) {
      console.log('🔴 ERRORS:\n');
      for (const violation of errors) {
        console.log(`  ${violation.code || 'UNKNOWN'}`);
        console.log(`    Rule: ${violation.rule}`);
        console.log(`    Expected: ${violation.expected}`);
        console.log(`    Actual: ${violation.actual}`);
        if (violation.file) {
          console.log(`    File: ${relative(process.cwd(), violation.file)}`);
        }
        if (violation.suggestion) {
          console.log(`    💡 Fix: ${violation.suggestion}`);
        }
        console.log('');
      }
    }

    if (warnings.length > 0) {
      console.log('🟡 WARNINGS:\n');
      for (const violation of warnings) {
        console.log(`  ${violation.code || 'UNKNOWN'}`);
        console.log(`    Rule: ${violation.rule}`);
        if (violation.suggestion) {
          console.log(`    💡 Fix: ${violation.suggestion}`);
        }
        console.log('');
      }
    }

    console.log('📚 See CONT_06_SchemaAndTypeGovernance.md for full specification.\n');
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch(console.error);
