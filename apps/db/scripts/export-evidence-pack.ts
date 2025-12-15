/**
 * AI-BOS Auditor Evidence Pack Export
 * 
 * Purpose: Generate compliance evidence for SOC2/HIPAA auditors
 * Output: JSON and CSV files with pass/fail governance checks
 * 
 * Usage:
 *   pnpm evidence:export
 *   pnpm evidence:export --format json
 *   pnpm evidence:export --format csv
 *   pnpm evidence:export --output ./audit-evidence/
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface GovernanceSummary {
  check_type: string;
  pass_count: number;
  fail_count: number;
  total_count: number;
  overall_status: 'PASS' | 'FAIL' | 'WARN';
  checked_at: Date;
}

interface TenantHealth {
  tenant_id: string;
  tenant_name: string;
  tenant_status: string;
  user_count: number;
  company_count: number;
  journal_count: number;
  health_status: string;
  checked_at: Date;
}

interface SchemaCheck {
  role_name: string;
  schema_name: string;
  usage_privilege: string;
  expected_usage: string;
  boundary_status: string;
  checked_at: Date;
}

interface IsolationCheck {
  schemaname: string;
  tablename: string;
  tenant_column_status: string;
  expected_scope: string;
  isolation_status: string;
  checked_at: Date;
}

interface JournalIntegritySummary {
  tenant_id: string;
  total_journals: number;
  posted_count: number;
  balanced_count: number;
  imbalanced_count: number;
  critical_violations: number;
  overall_status: string;
  checked_at: Date;
}

interface EvidencePack {
  metadata: {
    generated_at: string;
    generator: string;
    version: string;
    database_url: string;
    environment: string;
  };
  summary: {
    overall_status: 'PASS' | 'FAIL' | 'WARN';
    checks_passed: number;
    checks_failed: number;
    checks_total: number;
  };
  governance_checks: GovernanceSummary[];
  tenant_health: TenantHealth[];
  schema_boundary: SchemaCheck[];
  tenant_isolation: IsolationCheck[];
  journal_integrity: JournalIntegritySummary[];
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

async function exportEvidencePack(options: {
  format: 'json' | 'csv' | 'both';
  outputDir: string;
}): Promise<void> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL ||
      'postgresql://aibos:aibos_password@localhost:5433/aibos_local'
  });

  try {
    console.log('🔍 Generating Auditor Evidence Pack...\n');

    // Ensure output directory exists
    if (!fs.existsSync(options.outputDir)) {
      fs.mkdirSync(options.outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    // ========================================================================
    // 1. GOVERNANCE SUMMARY
    // ========================================================================
    console.log('  📊 Fetching governance summary...');
    const summaryResult = await pool.query<GovernanceSummary>(`
      SELECT * FROM kernel.v_governance_summary
    `);
    const governanceChecks = summaryResult.rows;

    // ========================================================================
    // 2. TENANT HEALTH
    // ========================================================================
    console.log('  👥 Fetching tenant health...');
    const healthResult = await pool.query<TenantHealth>(`
      SELECT * FROM kernel.v_tenant_health
    `);
    const tenantHealth = healthResult.rows;

    // ========================================================================
    // 3. SCHEMA BOUNDARY CHECK
    // ========================================================================
    console.log('  🔒 Fetching schema boundary checks...');
    const boundaryResult = await pool.query<SchemaCheck>(`
      SELECT * FROM kernel.v_schema_boundary_check
    `);
    const schemaBoundary = boundaryResult.rows;

    // ========================================================================
    // 4. TENANT ISOLATION CHECK
    // ========================================================================
    console.log('  🛡️  Fetching tenant isolation checks...');
    const isolationResult = await pool.query<IsolationCheck>(`
      SELECT * FROM kernel.v_tenant_isolation_check
    `);
    const tenantIsolation = isolationResult.rows;

    // ========================================================================
    // 5. JOURNAL INTEGRITY SUMMARY
    // ========================================================================
    console.log('  📒 Fetching journal integrity...');
    const integrityResult = await pool.query<JournalIntegritySummary>(`
      SELECT * FROM finance.v_journal_integrity_summary
    `);
    const journalIntegrity = integrityResult.rows;

    // ========================================================================
    // 6. CALCULATE OVERALL STATUS
    // ========================================================================
    const checksPassed = governanceChecks.filter(c => c.overall_status === 'PASS').length;
    const checksFailed = governanceChecks.filter(c => c.overall_status === 'FAIL').length;
    const checksTotal = governanceChecks.length;
    const overallStatus: 'PASS' | 'FAIL' | 'WARN' =
      checksFailed > 0 ? 'FAIL' :
        governanceChecks.some(c => c.overall_status === 'WARN') ? 'WARN' : 'PASS';

    // ========================================================================
    // 7. BUILD EVIDENCE PACK
    // ========================================================================
    const evidencePack: EvidencePack = {
      metadata: {
        generated_at: new Date().toISOString(),
        generator: 'AI-BOS Evidence Pack Export v1.0.0',
        version: '1.0.0',
        database_url: maskConnectionString(process.env.DATABASE_URL || ''),
        environment: process.env.NODE_ENV || 'development',
      },
      summary: {
        overall_status: overallStatus,
        checks_passed: checksPassed,
        checks_failed: checksFailed,
        checks_total: checksTotal,
      },
      governance_checks: governanceChecks,
      tenant_health: tenantHealth,
      schema_boundary: schemaBoundary,
      tenant_isolation: tenantIsolation,
      journal_integrity: journalIntegrity,
    };

    // ========================================================================
    // 8. EXPORT FILES
    // ========================================================================

    if (options.format === 'json' || options.format === 'both') {
      const jsonPath = path.join(options.outputDir, `evidence-pack-${timestamp}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(evidencePack, null, 2));
      console.log(`\n  ✅ JSON exported: ${jsonPath}`);
    }

    if (options.format === 'csv' || options.format === 'both') {
      // Export each section as separate CSV
      await exportCSV(
        path.join(options.outputDir, `governance-summary-${timestamp}.csv`),
        governanceChecks
      );
      await exportCSV(
        path.join(options.outputDir, `tenant-health-${timestamp}.csv`),
        tenantHealth
      );
      await exportCSV(
        path.join(options.outputDir, `schema-boundary-${timestamp}.csv`),
        schemaBoundary
      );
      await exportCSV(
        path.join(options.outputDir, `tenant-isolation-${timestamp}.csv`),
        tenantIsolation
      );
      await exportCSV(
        path.join(options.outputDir, `journal-integrity-${timestamp}.csv`),
        journalIntegrity
      );
      console.log(`  ✅ CSV files exported to: ${options.outputDir}`);
    }

    // ========================================================================
    // 9. PRINT SUMMARY
    // ========================================================================
    console.log('\n' + '='.repeat(60));
    console.log('  AUDITOR EVIDENCE PACK SUMMARY');
    console.log('='.repeat(60));
    console.log(`  Overall Status: ${statusEmoji(overallStatus)} ${overallStatus}`);
    console.log(`  Checks Passed:  ${checksPassed}/${checksTotal}`);
    console.log(`  Checks Failed:  ${checksFailed}/${checksTotal}`);
    console.log('');

    governanceChecks.forEach(check => {
      console.log(`  ${statusEmoji(check.overall_status)} ${check.check_type}: ${check.overall_status}`);
      console.log(`     Pass: ${check.pass_count} | Fail: ${check.fail_count} | Total: ${check.total_count}`);
    });

    console.log('='.repeat(60));
    console.log(`  Generated: ${new Date().toISOString()}`);
    console.log('='.repeat(60) + '\n');

    if (overallStatus === 'FAIL') {
      console.log('⚠️  WARNING: Some governance checks FAILED. Review evidence pack for details.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error generating evidence pack:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function maskConnectionString(url: string): string {
  if (!url) return 'N/A';
  try {
    const parsed = new URL(url);
    parsed.password = '***';
    return parsed.toString();
  } catch {
    return url.replace(/:[^:@]+@/, ':***@');
  }
}

function statusEmoji(status: string): string {
  switch (status) {
    case 'PASS': return '✅';
    case 'FAIL': return '❌';
    case 'WARN': return '⚠️';
    default: return '❓';
  }
}

async function exportCSV<T extends Record<string, any>>(
  filePath: string,
  data: T[]
): Promise<void> {
  if (data.length === 0) {
    fs.writeFileSync(filePath, '');
    return;
  }

  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const value = row[h];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      const str = String(value);
      // Escape quotes and wrap in quotes if contains comma
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  );

  const csv = [headers.join(','), ...rows].join('\n');
  fs.writeFileSync(filePath, csv);
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

const args = process.argv.slice(2);
const formatArg = args.find(a => a.startsWith('--format='))?.split('=')[1] as 'json' | 'csv' | 'both' || 'both';
const outputArg = args.find(a => a.startsWith('--output='))?.split('=')[1] || './evidence-pack';

exportEvidencePack({
  format: formatArg,
  outputDir: outputArg,
});
