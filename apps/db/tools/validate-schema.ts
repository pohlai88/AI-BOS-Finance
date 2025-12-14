/**
 * ============================================================================
 * SCHEMA GUARDIAN LINTER
 * ============================================================================
 * 
 * Canon Code: TOOL_01
 * Purpose: Validates SQL migration files against AI-BOS Data Fabric standards
 * 
 * Rules Enforced:
 * 1. All TENANT_SCOPED tables must have `tenant_id UUID NOT NULL`
 * 2. All tables must have `created_at TIMESTAMPTZ`
 * 3. Tables with mutable data should have `updated_at TIMESTAMPTZ`
 * 4. No cross-schema joins allowed (basic detection)
 * 5. Tables should have appropriate indexes on tenant_id
 * 
 * Usage:
 *   pnpm validate-schema                    # Validate all migrations
 *   pnpm validate-schema 100_finance.sql    # Validate specific file
 * 
 * Exit Codes:
 *   0 - All validations passed
 *   1 - Validation errors found
 * ============================================================================
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

// Tables that are GLOBAL (do not require tenant_id)
const GLOBAL_TABLES = [
  'config.provider_profiles',
  'config.provider_selection_rules',
  'kernel.permissions', // System-wide permission definitions
];

// Tables that are immutable (should NOT have updated_at)
const IMMUTABLE_TABLES = [
  'finance.journal_entries',
  'finance.journal_lines',
  'kernel.audit_events',
  'kernel.events',
];

// ============================================================================
// TYPES
// ============================================================================

interface ValidationResult {
  file: string;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  line?: number;
  message: string;
  rule: string;
}

interface ValidationWarning {
  line?: number;
  message: string;
  suggestion: string;
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

function extractTableDefinitions(sql: string): Array<{ name: string; definition: string; startLine: number }> {
  const tables: Array<{ name: string; definition: string; startLine: number }> = [];
  const lines = sql.split('\n');

  let inTable = false;
  let tableName = '';
  let tableStart = 0;
  let parenDepth = 0;
  let currentDef = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect CREATE TABLE
    const createMatch = line.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_]+\.?[a-z_]+)/i);
    if (createMatch) {
      inTable = true;
      tableName = createMatch[1].toLowerCase();
      tableStart = i + 1;
      parenDepth = 0;
      currentDef = '';
    }

    if (inTable) {
      currentDef += line + '\n';
      parenDepth += (line.match(/\(/g) || []).length;
      parenDepth -= (line.match(/\)/g) || []).length;

      // End of table definition
      if (parenDepth <= 0 && line.includes(');')) {
        tables.push({
          name: tableName,
          definition: currentDef,
          startLine: tableStart,
        });
        inTable = false;
        tableName = '';
        currentDef = '';
      }
    }
  }

  return tables;
}

function validateTenantId(table: { name: string; definition: string; startLine: number }): ValidationError | null {
  // Skip GLOBAL tables
  if (GLOBAL_TABLES.includes(table.name)) {
    return null;
  }

  // Check for tenant_id column
  const hasTenantId = /tenant_id\s+UUID\s+NOT\s+NULL/i.test(table.definition);

  if (!hasTenantId) {
    return {
      line: table.startLine,
      message: `Table "${table.name}" is missing required column: tenant_id UUID NOT NULL`,
      rule: 'TENANT_SCOPED',
    };
  }

  return null;
}

function validateCreatedAt(table: { name: string; definition: string; startLine: number }): ValidationError | null {
  const hasCreatedAt = /created_at\s+TIMESTAMPTZ/i.test(table.definition);

  if (!hasCreatedAt) {
    return {
      line: table.startLine,
      message: `Table "${table.name}" is missing required column: created_at TIMESTAMPTZ`,
      rule: 'AUDIT_TIMESTAMP',
    };
  }

  return null;
}

function validateUpdatedAt(table: { name: string; definition: string; startLine: number }): ValidationWarning | null {
  // Skip immutable tables
  if (IMMUTABLE_TABLES.includes(table.name)) {
    return null;
  }

  const hasUpdatedAt = /updated_at\s+TIMESTAMPTZ/i.test(table.definition);

  if (!hasUpdatedAt) {
    return {
      line: table.startLine,
      message: `Table "${table.name}" does not have updated_at column`,
      suggestion: 'Add "updated_at TIMESTAMPTZ DEFAULT NOW()" for mutable tables',
    };
  }

  return null;
}

function validateNoCrossSchemaJoins(sql: string, fileName: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = sql.split('\n');

  // Pattern to detect potential cross-schema joins
  // This is a basic heuristic - it looks for JOIN with different schema prefixes
  const joinPattern = /JOIN\s+([a-z_]+)\.([a-z_]+)/gi;
  const matches = sql.matchAll(joinPattern);

  const schemas = new Set<string>();
  for (const match of matches) {
    schemas.add(match[1].toLowerCase());
  }

  // If we find joins across different schemas, flag it
  if (schemas.size > 1) {
    errors.push({
      message: `Potential cross-schema join detected between: ${Array.from(schemas).join(', ')}. Cross-schema joins are forbidden.`,
      rule: 'NO_CROSS_SCHEMA_JOIN',
    });
  }

  return errors;
}

function validateTenantIndex(sql: string, tables: Array<{ name: string; definition: string; startLine: number }>): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  for (const table of tables) {
    if (GLOBAL_TABLES.includes(table.name)) continue;

    // Check if there's an index on tenant_id for this table
    const tableParts = table.name.split('.');
    const shortName = tableParts[tableParts.length - 1];
    const indexPattern = new RegExp(`CREATE\\s+INDEX.*${shortName}.*tenant`, 'i');

    if (!indexPattern.test(sql)) {
      warnings.push({
        message: `Table "${table.name}" may be missing an index on tenant_id`,
        suggestion: `Add: CREATE INDEX idx_${shortName}_tenant ON ${table.name}(tenant_id);`,
      });
    }
  }

  return warnings;
}

// ============================================================================
// MAIN VALIDATION
// ============================================================================

function validateMigrationFile(filePath: string): ValidationResult {
  const fileName = path.basename(filePath);
  const sql = fs.readFileSync(filePath, 'utf-8');

  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Extract table definitions
  const tables = extractTableDefinitions(sql);

  // Run validations on each table
  for (const table of tables) {
    const tenantIdError = validateTenantId(table);
    if (tenantIdError) errors.push(tenantIdError);

    const createdAtError = validateCreatedAt(table);
    if (createdAtError) errors.push(createdAtError);

    const updatedAtWarning = validateUpdatedAt(table);
    if (updatedAtWarning) warnings.push(updatedAtWarning);
  }

  // Run file-level validations
  const crossSchemaErrors = validateNoCrossSchemaJoins(sql, fileName);
  errors.push(...crossSchemaErrors);

  const indexWarnings = validateTenantIndex(sql, tables);
  warnings.push(...indexWarnings);

  return { file: fileName, errors, warnings };
}

function printResults(results: ValidationResult[]): boolean {
  let hasErrors = false;

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║           AI-BOS SCHEMA GUARDIAN - Validation Report            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  for (const result of results) {
    if (result.errors.length === 0 && result.warnings.length === 0) {
      console.log(`✅ ${result.file}`);
      continue;
    }

    console.log(`\n📄 ${result.file}`);
    console.log('─'.repeat(60));

    for (const error of result.errors) {
      hasErrors = true;
      const lineInfo = error.line ? ` (line ${error.line})` : '';
      console.log(`  ❌ ERROR [${error.rule}]${lineInfo}`);
      console.log(`     ${error.message}`);
    }

    for (const warning of result.warnings) {
      const lineInfo = warning.line ? ` (line ${warning.line})` : '';
      console.log(`  ⚠️  WARNING${lineInfo}`);
      console.log(`     ${warning.message}`);
      console.log(`     💡 ${warning.suggestion}`);
    }
  }

  console.log('\n' + '═'.repeat(60));

  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

  if (totalErrors > 0) {
    console.log(`\n🚫 VALIDATION FAILED: ${totalErrors} error(s), ${totalWarnings} warning(s)`);
  } else if (totalWarnings > 0) {
    console.log(`\n⚠️  VALIDATION PASSED with ${totalWarnings} warning(s)`);
  } else {
    console.log('\n✅ VALIDATION PASSED: All schemas comply with AI-BOS Data Fabric standards');
  }

  return hasErrors;
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

// Schema subdirectories to scan
const SCHEMA_DIRS = ['kernel', 'finance', 'config'];

function discoverMigrationFiles(): string[] {
  const files: string[] = [];
  
  for (const schema of SCHEMA_DIRS) {
    const schemaDir = path.join(MIGRATIONS_DIR, schema);
    
    if (!fs.existsSync(schemaDir)) {
      continue;
    }
    
    const schemaFiles = fs.readdirSync(schemaDir)
      .filter(f => f.endsWith('.sql'))
      .sort()
      .map(f => path.join(schemaDir, f));
    
    files.push(...schemaFiles);
  }
  
  return files;
}

async function main() {
  const args = process.argv.slice(2);

  let filesToValidate: string[] = [];

  if (args.length > 0) {
    // Validate specific file(s)
    filesToValidate = args.map(arg => {
      if (path.isAbsolute(arg)) return arg;
      if (arg.includes('/') || arg.includes('\\')) return path.resolve(arg);
      // Check in each schema directory
      for (const schema of SCHEMA_DIRS) {
        const fullPath = path.join(MIGRATIONS_DIR, schema, arg);
        if (fs.existsSync(fullPath)) return fullPath;
      }
      return path.join(MIGRATIONS_DIR, arg);
    });
  } else {
    // Validate all migration files across all schemas
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      console.error(`❌ Migrations directory not found: ${MIGRATIONS_DIR}`);
      process.exit(1);
    }

    filesToValidate = discoverMigrationFiles();
  }

  if (filesToValidate.length === 0) {
    console.log('No migration files to validate.');
    process.exit(0);
  }

  console.log(`\n🔍 Validating ${filesToValidate.length} migration file(s)...`);

  const results: ValidationResult[] = [];

  for (const file of filesToValidate) {
    if (!fs.existsSync(file)) {
      console.error(`❌ File not found: ${file}`);
      continue;
    }
    results.push(validateMigrationFile(file));
  }

  const hasErrors = printResults(results);
  process.exit(hasErrors ? 1 : 0);
}

main().catch(err => {
  console.error('❌ Schema Guardian failed:', err);
  process.exit(1);
});
