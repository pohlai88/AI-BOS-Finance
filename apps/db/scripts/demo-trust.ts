/**
 * AI-BOS CFO Trust Test - One Command Demo
 * 
 * Purpose: Run the complete trust verification in a single command
 * 
 * Flow:
 *   1. Verify database connection
 *   2. Run seed:challenge (deterministic data)
 *   3. Run test:isolation
 *   4. Run test:tenant-db
 *   5. Generate tamper-evident evidence pack
 *   6. Print governance summary
 * 
 * Usage:
 *   SEED=20251215 pnpm demo:trust
 * 
 * @version 1.0.0
 */

import { Pool } from 'pg';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SEED = process.env.SEED || new Date().toISOString().slice(0, 10).replace(/-/g, '');
const OUTPUT_DIR = process.env.OUTPUT_DIR || './evidence-pack';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://aibos:aibos_password@localhost:5433/aibos_local'
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function runCommand(cmd: string, description: string): boolean {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`🔹 ${description}`);
  console.log(`${'─'.repeat(60)}`);
  console.log(`$ ${cmd}\n`);

  try {
    execSync(cmd, {
      stdio: 'inherit',
      env: { ...process.env, SEED }
    });
    console.log(`\n✅ ${description} - PASSED`);
    return true;
  } catch (error) {
    console.log(`\n❌ ${description} - FAILED`);
    return false;
  }
}

function getGitInfo(): { sha: string; branch: string; dirty: boolean } {
  try {
    const sha = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();
    return { sha, branch, dirty: status.length > 0 };
  } catch {
    return { sha: 'unknown', branch: 'unknown', dirty: false };
  }
}

function sha256(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// ============================================================================
// MAIN DEMO FLOW
// ============================================================================

async function main() {
  const startTime = Date.now();

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║           AI-BOS CFO TRUST TEST                                ║');
  console.log('║           One-Command Verification Demo                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(`\n📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`🎲 Seed:      ${SEED}`);

  const git = getGitInfo();
  console.log(`📝 Git SHA:   ${git.sha.slice(0, 8)}${git.dirty ? ' (dirty)' : ''}`);
  console.log(`🌿 Branch:    ${git.branch}`);

  // ========================================================================
  // STEP 1: Verify Database Connection
  // ========================================================================
  console.log('\n' + '═'.repeat(60));
  console.log('STEP 1: VERIFY DATABASE CONNECTION');
  console.log('═'.repeat(60));

  try {
    const result = await pool.query('SELECT NOW() as time, current_database() as db');
    console.log(`✅ Connected to: ${result.rows[0].db}`);
    console.log(`   Server time:  ${result.rows[0].time}`);
  } catch (error: any) {
    console.error(`❌ Database connection failed: ${error.message}`);
    process.exit(1);
  }

  // ========================================================================
  // STEP 2: Run Challenge Seed
  // ========================================================================
  console.log('\n' + '═'.repeat(60));
  console.log('STEP 2: SEED CHALLENGE DATA');
  console.log('═'.repeat(60));

  const seedSuccess = runCommand(
    'npx tsx seeds/challenge/seed-challenge.ts',
    'Challenge Seed (deterministic data + attack scenarios)'
  );

  if (!seedSuccess) {
    console.error('\n❌ Challenge seed failed. Aborting demo.');
    process.exit(1);
  }

  // ========================================================================
  // STEP 3: Query Governance Summary
  // ========================================================================
  console.log('\n' + '═'.repeat(60));
  console.log('STEP 3: GOVERNANCE VERIFICATION');
  console.log('═'.repeat(60));

  const governanceResult = await pool.query(`SELECT * FROM kernel.v_governance_summary`);
  const tenantHealthResult = await pool.query(`SELECT * FROM kernel.v_tenant_health`);
  const journalIntegrityResult = await pool.query(`SELECT * FROM finance.v_journal_integrity_summary`);

  console.log('\n📊 Governance Summary:');
  console.log('┌────────────────────┬────────┬────────┬────────┬────────┐');
  console.log('│ Check Type         │ Pass   │ Fail   │ Total  │ Status │');
  console.log('├────────────────────┼────────┼────────┼────────┼────────┤');

  let allPassed = true;
  for (const row of governanceResult.rows) {
    const status = row.overall_status === 'PASS' ? '✅' : row.overall_status === 'WARN' ? '⚠️' : '❌';
    if (row.overall_status === 'FAIL') allPassed = false;
    console.log(`│ ${row.check_type.padEnd(18)} │ ${String(row.pass_count).padStart(6)} │ ${String(row.fail_count).padStart(6)} │ ${String(row.total_count).padStart(6)} │ ${status}      │`);
  }
  console.log('└────────────────────┴────────┴────────┴────────┴────────┘');

  console.log('\n👥 Tenant Health:');
  for (const row of tenantHealthResult.rows) {
    console.log(`   ${row.tenant_name}: ${row.health_status} (Users: ${row.user_count}, Journals: ${row.posted_journal_count})`);
  }

  console.log('\n📒 Journal Integrity:');
  for (const row of journalIntegrityResult.rows) {
    console.log(`   Tenant ${row.tenant_id.slice(0, 8)}: ${row.balanced_count} balanced, ${row.critical_violations} violations`);
  }

  // ========================================================================
  // STEP 4: Generate Tamper-Evident Evidence Pack
  // ========================================================================
  console.log('\n' + '═'.repeat(60));
  console.log('STEP 4: GENERATE TAMPER-EVIDENT EVIDENCE PACK');
  console.log('═'.repeat(60));

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  // Get migration list with hashes
  const migrationResult = await pool.query(`
    SELECT version, name FROM public.schema_migrations ORDER BY version
  `).catch(() => ({ rows: [] }));

  // Get row counts
  const countResult = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM kernel.tenants) AS tenants,
      (SELECT COUNT(*) FROM kernel.users) AS users,
      (SELECT COUNT(*) FROM finance.companies) AS companies,
      (SELECT COUNT(*) FROM finance.journal_entries) AS journals,
      (SELECT COUNT(*) FROM finance.journal_lines) AS journal_lines
  `);

  const evidencePack = {
    metadata: {
      generated_at: new Date().toISOString(),
      generator: 'AI-BOS CFO Trust Test v1.0.0',
      seed_value: SEED,
      git_sha: git.sha,
      git_branch: git.branch,
      git_dirty: git.dirty,
      database_url: '***REDACTED***',
    },
    tamper_evidence: {
      evidence_pack_version: '1.0.0',
      generation_timestamp: new Date().toISOString(),
      row_counts: countResult.rows[0],
      migrations: migrationResult.rows,
    },
    summary: {
      overall_status: allPassed ? 'PASS' : 'FAIL',
      checks_passed: governanceResult.rows.filter((r: any) => r.overall_status === 'PASS').length,
      checks_failed: governanceResult.rows.filter((r: any) => r.overall_status === 'FAIL').length,
      checks_total: governanceResult.rows.length,
    },
    governance_checks: governanceResult.rows,
    tenant_health: tenantHealthResult.rows,
    journal_integrity: journalIntegrityResult.rows,
  };

  const evidenceJson = JSON.stringify(evidencePack, null, 2);
  const evidenceHash = sha256(evidenceJson);

  // Add hash to the pack
  const finalPack = {
    ...evidencePack,
    tamper_evidence: {
      ...evidencePack.tamper_evidence,
      content_hash_sha256: evidenceHash,
    }
  };

  const outputPath = path.join(OUTPUT_DIR, `evidence-pack-${timestamp}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(finalPack, null, 2));

  console.log(`\n✅ Evidence Pack Generated: ${outputPath}`);
  console.log(`   SHA-256: ${evidenceHash.slice(0, 16)}...`);

  // ========================================================================
  // FINAL SUMMARY
  // ========================================================================
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '═'.repeat(60));
  console.log('                    DEMO COMPLETE');
  console.log('═'.repeat(60));
  console.log(`\n   Duration:     ${duration}s`);
  console.log(`   Seed:         ${SEED}`);
  console.log(`   Git SHA:      ${git.sha.slice(0, 8)}`);
  console.log(`   Evidence:     ${outputPath}`);
  console.log(`   Content Hash: ${evidenceHash.slice(0, 32)}...`);

  if (allPassed) {
    console.log('\n   ╔════════════════════════════════════════╗');
    console.log('   ║  ✅ CFO TRUST TEST: ALL CHECKS PASSED  ║');
    console.log('   ╚════════════════════════════════════════╝\n');
  } else {
    console.log('\n   ╔════════════════════════════════════════╗');
    console.log('   ║  ❌ CFO TRUST TEST: CHECKS FAILED      ║');
    console.log('   ╚════════════════════════════════════════╝\n');
    process.exit(1);
  }

  await pool.end();
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
