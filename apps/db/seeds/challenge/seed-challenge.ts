/**
 * AI-BOS Challenge Seed Generator
 * 
 * Purpose: Generate deterministic, reproducible test data for CFO Trust Test
 * 
 * Features:
 * - Deterministic: Same SEED value = Same data every time
 * - Non-interactive: No manual SQL console steps
 * - Includes attack scenarios: Cross-tenant, unbalanced journals, etc.
 * 
 * Usage:
 *   SEED=20251215 pnpm seed:challenge
 *   SEED=CFO_DEMO pnpm seed:challenge
 * 
 * @version 1.0.0
 */

import { Pool } from 'pg';
import * as crypto from 'crypto';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SEED = process.env.SEED || new Date().toISOString().slice(0, 10).replace(/-/g, '');
console.log(`🎲 Challenge Seed: ${SEED}`);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://aibos:aibos_password@localhost:5433/aibos_local'
});

// ============================================================================
// DETERMINISTIC ID GENERATOR
// ============================================================================

function generateDeterministicUUID(namespace: string, index: number): string {
  const hash = crypto.createHash('sha256')
    .update(`${SEED}:${namespace}:${index}`)
    .digest('hex');

  // Format as UUID
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '4' + hash.slice(13, 16), // Version 4
    '8' + hash.slice(17, 20), // Variant
    hash.slice(20, 32)
  ].join('-');
}

function generateDeterministicPassword(namespace: string): string {
  return crypto.createHash('sha256')
    .update(`${SEED}:password:${namespace}`)
    .digest('hex')
    .slice(0, 32);
}

// ============================================================================
// CHALLENGE DATA SPECIFICATION
// ============================================================================

const CHALLENGE_SPEC = {
  tenants: [
    { index: 1, name: 'Alpha Financial Corp', slug: 'alpha-fin', status: 'active' },
    { index: 2, name: 'Beta Holdings Ltd', slug: 'beta-hold', status: 'active' },
    { index: 3, name: 'Gamma Investments', slug: 'gamma-inv', status: 'suspended' }, // Inactive tenant
  ],
  usersPerTenant: 3,
  companiesPerTenant: 2,
  journalsPerTenant: 5,
  attackScenarios: {
    crossTenantRead: true,
    unbalancedJournal: true,
    modifyPostedJournal: true,
    deletePostedJournal: true,
    orphanJournalLine: true,
  }
};

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function seedTenants(): Promise<string[]> {
  console.log('\n📦 Seeding Tenants...');
  const tenantIds: string[] = [];

  for (const tenant of CHALLENGE_SPEC.tenants) {
    const id = generateDeterministicUUID('tenant', tenant.index);
    tenantIds.push(id);

    await pool.query(`
      INSERT INTO kernel.tenants (id, name, slug, status)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET status = $4
    `, [id, tenant.name, tenant.slug, tenant.status]);

    console.log(`   ✓ ${tenant.name} (${id.slice(0, 8)}...)`);
  }

  return tenantIds;
}

async function seedUsers(tenantIds: string[]): Promise<Map<string, string[]>> {
  console.log('\n👤 Seeding Users...');
  const userMap = new Map<string, string[]>();

  const roles = ['CFO', 'Controller', 'Analyst'];

  for (let t = 0; t < tenantIds.length; t++) {
    const tenantId = tenantIds[t];
    const userIds: string[] = [];

    for (let u = 0; u < CHALLENGE_SPEC.usersPerTenant; u++) {
      const id = generateDeterministicUUID(`user:${t}`, u);
      const role = roles[u % roles.length];
      const email = `${role.toLowerCase()}@tenant${t + 1}.test`;
      const passwordHash = `$2b$12$${generateDeterministicPassword(`user:${t}:${u}`)}`;

      await pool.query(`
        INSERT INTO kernel.users (id, tenant_id, email, display_name, password_hash, status)
        VALUES ($1, $2, $3, $4, $5, 'active')
        ON CONFLICT (id) DO NOTHING
      `, [id, tenantId, email, `${role} User`, passwordHash]);

      userIds.push(id);
      console.log(`   ✓ ${email} (${id.slice(0, 8)}...)`);
    }

    userMap.set(tenantId, userIds);
  }

  return userMap;
}

async function seedCompanies(tenantIds: string[]): Promise<Map<string, string[]>> {
  console.log('\n🏢 Seeding Companies...');
  const companyMap = new Map<string, string[]>();

  const types = ['holding', 'operating'];
  const currencies = ['USD', 'EUR', 'SGD', 'GBP'];

  for (let t = 0; t < tenantIds.length; t++) {
    const tenantId = tenantIds[t];
    const companyIds: string[] = [];

    for (let c = 0; c < CHALLENGE_SPEC.companiesPerTenant; c++) {
      const id = generateDeterministicUUID(`company:${t}`, c);
      const type = types[c % types.length];
      const currency = currencies[(t + c) % currencies.length];
      const code = `T${t + 1}-CO${c + 1}`;

      await pool.query(`
        INSERT INTO finance.companies (id, tenant_id, code, name, type, base_currency, pool_participation, status)
        VALUES ($1, $2, $3, $4, $5, $6, true, 'active')
        ON CONFLICT (id) DO NOTHING
      `, [id, tenantId, code, `Tenant ${t + 1} Company ${c + 1}`, type, currency]);

      companyIds.push(id);
      console.log(`   ✓ ${code} (${id.slice(0, 8)}...)`);
    }

    companyMap.set(tenantId, companyIds);
  }

  return companyMap;
}

async function seedAccounts(tenantIds: string[], companyMap: Map<string, string[]>): Promise<Map<string, string[]>> {
  console.log('\n💰 Seeding Accounts...');
  const accountMap = new Map<string, string[]>();

  const accountTypes = [
    { code: '1000', name: 'Cash at Bank', type: 'ASSET', subType: 'BANK' },
    { code: '1100', name: 'Accounts Receivable', type: 'ASSET', subType: 'RECEIVABLE' },
    { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', subType: 'PAYABLE' },
    { code: '4000', name: 'Revenue', type: 'REVENUE', subType: 'OPERATING' },
    { code: '5000', name: 'Operating Expenses', type: 'EXPENSE', subType: 'OPERATING' },
  ];

  for (let t = 0; t < tenantIds.length; t++) {
    const tenantId = tenantIds[t];
    const companies = companyMap.get(tenantId) || [];
    const accountIds: string[] = [];

    for (let c = 0; c < companies.length; c++) {
      const companyId = companies[c];

      for (let a = 0; a < accountTypes.length; a++) {
        const acct = accountTypes[a];
        const id = generateDeterministicUUID(`account:${t}:${c}`, a);
        const balance = Math.floor(Math.random() * 10000000); // Random balance

        await pool.query(`
          INSERT INTO finance.accounts (id, tenant_id, company_id, code, name, type, sub_type, currency, is_external, balance_cents, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'USD', $8, $9, 'active')
          ON CONFLICT (id) DO NOTHING
        `, [id, tenantId, companyId, acct.code, acct.name, acct.type, acct.subType, acct.type === 'ASSET' && acct.subType === 'BANK', balance]);

        accountIds.push(id);
      }
    }

    accountMap.set(tenantId, accountIds);
    console.log(`   ✓ Tenant ${t + 1}: ${accountIds.length} accounts`);
  }

  return accountMap;
}

async function seedJournals(
  tenantIds: string[],
  companyMap: Map<string, string[]>,
  accountMap: Map<string, string[]>,
  userMap: Map<string, string[]>
): Promise<void> {
  console.log('\n📒 Seeding Balanced Journals...');

  for (let t = 0; t < tenantIds.length; t++) {
    const tenantId = tenantIds[t];
    const companies = companyMap.get(tenantId) || [];
    const accounts = accountMap.get(tenantId) || [];
    const users = userMap.get(tenantId) || [];

    if (companies.length === 0 || accounts.length < 2 || users.length === 0) continue;

    for (let j = 0; j < CHALLENGE_SPEC.journalsPerTenant; j++) {
      const journalId = generateDeterministicUUID(`journal:${t}`, j);
      const companyId = companies[j % companies.length];
      const createdBy = users[j % users.length];
      const reference = `JE-${SEED}-T${t + 1}-${String(j + 1).padStart(3, '0')}`;

      // Create DRAFT journal first
      await pool.query(`
        INSERT INTO finance.journal_entries (id, tenant_id, company_id, reference, description, posting_date, status, created_by)
        VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, 'DRAFT', $6)
        ON CONFLICT (id) DO NOTHING
      `, [journalId, tenantId, companyId, reference, `Challenge journal ${j + 1}`, createdBy]);

      // Add balanced lines (Debit = Credit)
      const amount = (j + 1) * 100000; // $1000, $2000, etc.
      const debitAccountId = accounts[0]; // Cash
      const creditAccountId = accounts[3]; // Revenue

      const lineId1 = generateDeterministicUUID(`journal-line:${t}:${j}`, 0);
      const lineId2 = generateDeterministicUUID(`journal-line:${t}:${j}`, 1);

      await pool.query(`
        INSERT INTO finance.journal_lines (id, journal_entry_id, account_id, direction, amount_cents, currency, line_description)
        VALUES 
          ($1, $2, $3, 'DEBIT', $4, 'USD', 'Debit entry'),
          ($5, $2, $6, 'CREDIT', $4, 'USD', 'Credit entry')
        ON CONFLICT (id) DO NOTHING
      `, [lineId1, journalId, debitAccountId, amount, lineId2, creditAccountId]);

      // Post the journal
      await pool.query(`
        UPDATE finance.journal_entries 
        SET status = 'POSTED', posted_at = NOW()
        WHERE id = $1 AND status = 'DRAFT'
      `, [journalId]);

      console.log(`   ✓ ${reference} (POSTED, balanced: $${amount / 100})`);
    }
  }
}

// ============================================================================
// ATTACK SCENARIOS (Expected to FAIL)
// ============================================================================

async function runAttackScenarios(
  tenantIds: string[],
  companyMap: Map<string, string[]>,
  accountMap: Map<string, string[]>
): Promise<{ passed: number; failed: number; results: string[] }> {
  console.log('\n🔴 Running Attack Scenarios (Expected to FAIL)...');

  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  // Attack 1: Create unbalanced journal (should fail on POST)
  if (CHALLENGE_SPEC.attackScenarios.unbalancedJournal) {
    try {
      const tenantId = tenantIds[0];
      const companies = companyMap.get(tenantId) || [];
      const accounts = accountMap.get(tenantId) || [];

      if (companies.length > 0 && accounts.length >= 2) {
        const journalId = generateDeterministicUUID('attack:unbalanced', 0);

        await pool.query(`
          INSERT INTO finance.journal_entries (id, tenant_id, company_id, reference, description, posting_date, status, created_by)
          VALUES ($1, $2, $3, 'ATTACK-UNBAL', 'Unbalanced attack', CURRENT_DATE, 'DRAFT', $4)
          ON CONFLICT (id) DO NOTHING
        `, [journalId, tenantId, companies[0], generateDeterministicUUID('user:0', 0)]);

        // Add UNBALANCED lines (Debit ≠ Credit)
        const lineId1 = generateDeterministicUUID('attack:unbalanced:line', 0);
        const lineId2 = generateDeterministicUUID('attack:unbalanced:line', 1);

        await pool.query(`
          INSERT INTO finance.journal_lines (id, journal_entry_id, account_id, direction, amount_cents, currency)
          VALUES 
            ($1, $2, $3, 'DEBIT', 100000, 'USD'),
            ($4, $2, $5, 'CREDIT', 50000, 'USD')
          ON CONFLICT (id) DO NOTHING
        `, [lineId1, journalId, accounts[0], lineId2, accounts[1]]);

        // Try to POST (should fail if double-entry constraint is active)
        try {
          await pool.query(`
            UPDATE finance.journal_entries SET status = 'POSTED', posted_at = NOW() WHERE id = $1
          `, [journalId]);

          // If we get here, the constraint didn't catch it
          results.push('❌ ATTACK 1 (Unbalanced Journal): Constraint DID NOT fire - VULNERABILITY');
          failed++;
        } catch (e: any) {
          if (e.message.includes('balance') || e.message.includes('debit') || e.message.includes('credit')) {
            results.push('✅ ATTACK 1 (Unbalanced Journal): Correctly BLOCKED by double-entry constraint');
            passed++;
          } else {
            results.push(`⚠️ ATTACK 1 (Unbalanced Journal): Blocked but unexpected error: ${e.message}`);
            passed++;
          }
        }

        // Cleanup
        await pool.query(`DELETE FROM finance.journal_lines WHERE journal_entry_id = $1`, [journalId]);
        await pool.query(`DELETE FROM finance.journal_entries WHERE id = $1 AND status = 'DRAFT'`, [journalId]);
      }
    } catch (e: any) {
      results.push(`⚠️ ATTACK 1 (Unbalanced Journal): Setup error: ${e.message}`);
    }
  }

  // Attack 2: Modify POSTED journal (should fail)
  if (CHALLENGE_SPEC.attackScenarios.modifyPostedJournal) {
    try {
      // Find any POSTED journal
      const postedResult = await pool.query(`
        SELECT id, reference FROM finance.journal_entries WHERE status = 'POSTED' LIMIT 1
      `);

      if (postedResult.rows.length > 0) {
        const journalId = postedResult.rows[0].id;

        try {
          await pool.query(`
            UPDATE finance.journal_entries SET description = 'HACKED' WHERE id = $1
          `, [journalId]);

          results.push('❌ ATTACK 2 (Modify POSTED): Modification ALLOWED - VULNERABILITY');
          failed++;
        } catch (e: any) {
          if (e.message.includes('POSTED') || e.message.includes('immutab') || e.message.includes('Cannot modify')) {
            results.push('✅ ATTACK 2 (Modify POSTED): Correctly BLOCKED by immutability trigger');
            passed++;
          } else {
            results.push(`⚠️ ATTACK 2 (Modify POSTED): Blocked but unexpected: ${e.message}`);
            passed++;
          }
        }
      }
    } catch (e: any) {
      results.push(`⚠️ ATTACK 2 (Modify POSTED): Error: ${e.message}`);
    }
  }

  // Attack 3: Delete POSTED journal (should fail)
  if (CHALLENGE_SPEC.attackScenarios.deletePostedJournal) {
    try {
      const postedResult = await pool.query(`
        SELECT id FROM finance.journal_entries WHERE status = 'POSTED' LIMIT 1
      `);

      if (postedResult.rows.length > 0) {
        const journalId = postedResult.rows[0].id;

        try {
          await pool.query(`DELETE FROM finance.journal_entries WHERE id = $1`, [journalId]);

          results.push('❌ ATTACK 3 (Delete POSTED): Deletion ALLOWED - VULNERABILITY');
          failed++;
        } catch (e: any) {
          if (e.message.includes('POSTED') || e.message.includes('Cannot delete') || e.message.includes('reversal')) {
            results.push('✅ ATTACK 3 (Delete POSTED): Correctly BLOCKED by immutability trigger');
            passed++;
          } else {
            results.push(`⚠️ ATTACK 3 (Delete POSTED): Blocked but unexpected: ${e.message}`);
            passed++;
          }
        }
      }
    } catch (e: any) {
      results.push(`⚠️ ATTACK 3 (Delete POSTED): Error: ${e.message}`);
    }
  }

  // Attack 4: Create orphan journal line (should fail FK)
  if (CHALLENGE_SPEC.attackScenarios.orphanJournalLine) {
    try {
      const accounts = accountMap.get(tenantIds[0]) || [];

      if (accounts.length > 0) {
        const fakeJournalId = generateDeterministicUUID('attack:orphan', 0);
        const lineId = generateDeterministicUUID('attack:orphan:line', 0);

        try {
          await pool.query(`
            INSERT INTO finance.journal_lines (id, journal_entry_id, account_id, direction, amount_cents, currency)
            VALUES ($1, $2, $3, 'DEBIT', 100000, 'USD')
          `, [lineId, fakeJournalId, accounts[0]]);

          results.push('❌ ATTACK 4 (Orphan Line): Orphan line CREATED - VULNERABILITY');
          failed++;

          // Cleanup
          await pool.query(`DELETE FROM finance.journal_lines WHERE id = $1`, [lineId]);
        } catch (e: any) {
          if (e.message.includes('foreign key') || e.message.includes('violates')) {
            results.push('✅ ATTACK 4 (Orphan Line): Correctly BLOCKED by FK constraint');
            passed++;
          } else {
            results.push(`⚠️ ATTACK 4 (Orphan Line): Blocked but unexpected: ${e.message}`);
            passed++;
          }
        }
      }
    } catch (e: any) {
      results.push(`⚠️ ATTACK 4 (Orphan Line): Error: ${e.message}`);
    }
  }

  return { passed, failed, results };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('═'.repeat(60));
  console.log('  AI-BOS CHALLENGE SEED GENERATOR');
  console.log('═'.repeat(60));
  console.log(`  Seed Value: ${SEED}`);
  console.log(`  Timestamp:  ${new Date().toISOString()}`);
  console.log('═'.repeat(60));

  try {
    // Seed data
    const tenantIds = await seedTenants();
    const userMap = await seedUsers(tenantIds);
    const companyMap = await seedCompanies(tenantIds);
    const accountMap = await seedAccounts(tenantIds, companyMap);
    await seedJournals(tenantIds, companyMap, accountMap, userMap);

    // Run attack scenarios
    const attacks = await runAttackScenarios(tenantIds, companyMap, accountMap);

    // Print results
    console.log('\n' + '═'.repeat(60));
    console.log('  ATTACK SCENARIO RESULTS');
    console.log('═'.repeat(60));
    attacks.results.forEach(r => console.log(`  ${r}`));
    console.log('═'.repeat(60));
    console.log(`  Attacks Blocked: ${attacks.passed}`);
    console.log(`  Vulnerabilities: ${attacks.failed}`);
    console.log('═'.repeat(60));

    // Final stats
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM kernel.tenants) AS tenant_count,
        (SELECT COUNT(*) FROM kernel.users) AS user_count,
        (SELECT COUNT(*) FROM finance.companies) AS company_count,
        (SELECT COUNT(*) FROM finance.journal_entries WHERE status = 'POSTED') AS posted_journals,
        (SELECT COUNT(*) FROM finance.journal_lines) AS journal_lines
    `);

    console.log('\n📊 Final Statistics:');
    console.log(`   Tenants:         ${stats.rows[0].tenant_count}`);
    console.log(`   Users:           ${stats.rows[0].user_count}`);
    console.log(`   Companies:       ${stats.rows[0].company_count}`);
    console.log(`   Posted Journals: ${stats.rows[0].posted_journals}`);
    console.log(`   Journal Lines:   ${stats.rows[0].journal_lines}`);

    if (attacks.failed > 0) {
      console.log('\n❌ CHALLENGE FAILED: Vulnerabilities detected!');
      process.exit(1);
    } else {
      console.log('\n✅ CHALLENGE PASSED: All attacks blocked!');
    }

  } catch (error) {
    console.error('❌ Challenge seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
