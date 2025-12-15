/**
 * Finance Seed Script
 * 
 * Seeds demo finance data for the Payment Hub MVP.
 * Creates companies, accounts, FX rates, and sample transactions.
 * 
 * Prerequisites: Run seed-happy-path.ts first (creates tenant and users)
 * 
 * Usage: pnpm seed:finance
 * 
 * Canon Code: TOOL_02
 */

import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

// Fixed UUIDs (must match seed-happy-path.ts)
const DEMO_TENANT_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const DEMO_USER_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

// Finance UUIDs
const COMPANY_HOLDING_ID = "f0000001-0000-0000-0000-000000000001";
const COMPANY_SG_ID = "f0000001-0000-0000-0000-000000000002";
const COMPANY_MY_ID = "f0000001-0000-0000-0000-000000000003";
const COMPANY_TREASURY_ID = "f0000001-0000-0000-0000-000000000004";

// Account UUIDs
const ACCOUNT_TREASURY_SGD_ID = "a0000001-0000-0000-0000-000000000001";
const ACCOUNT_TREASURY_USD_ID = "a0000001-0000-0000-0000-000000000002";
const ACCOUNT_SG_BANK_SGD_ID = "a0000001-0000-0000-0000-000000000003";
const ACCOUNT_MY_BANK_MYR_ID = "a0000001-0000-0000-0000-000000000004";
const ACCOUNT_AP_SGD_ID = "a0000001-0000-0000-0000-000000000005";
const ACCOUNT_AP_MYR_ID = "a0000001-0000-0000-0000-000000000006";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://aibos:aibos_password@localhost:5433/aibos_local";

async function seedFinance() {
  console.log("🏦 Seeding Finance Schema...\n");

  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ========================================================================
    // 1. CREATE COMPANIES (Multi-Company Structure)
    // ========================================================================
    console.log("   🏢 Creating companies...");

    // Treasury Center (the brain of cash pooling)
    await client.query(`
      INSERT INTO finance.companies (id, tenant_id, code, name, type, base_currency, pool_participation, status)
      VALUES ($1, $2, 'DEMO-TREASURY', 'Demo Corp Treasury Center', 'treasury', 'USD', true, 'active')
      ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
    `, [COMPANY_TREASURY_ID, DEMO_TENANT_ID]);

    // Holding Company
    await client.query(`
      INSERT INTO finance.companies (id, tenant_id, code, name, type, base_currency, treasury_center_id, pool_participation, status)
      VALUES ($1, $2, 'DEMO-HOLDING', 'Demo Corp Holdings Pte Ltd', 'holding', 'USD', $3, true, 'active')
      ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
    `, [COMPANY_HOLDING_ID, DEMO_TENANT_ID, COMPANY_TREASURY_ID]);

    // Operating Company - Singapore
    await client.query(`
      INSERT INTO finance.companies (id, tenant_id, code, name, type, base_currency, treasury_center_id, pool_participation, status)
      VALUES ($1, $2, 'DEMO-SG', 'Demo Corp Singapore Pte Ltd', 'operating', 'SGD', $3, true, 'active')
      ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
    `, [COMPANY_SG_ID, DEMO_TENANT_ID, COMPANY_TREASURY_ID]);

    // Operating Company - Malaysia
    await client.query(`
      INSERT INTO finance.companies (id, tenant_id, code, name, type, base_currency, treasury_center_id, pool_participation, status)
      VALUES ($1, $2, 'DEMO-MY', 'Demo Corp Malaysia Sdn Bhd', 'operating', 'MYR', $3, true, 'active')
      ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
    `, [COMPANY_MY_ID, DEMO_TENANT_ID, COMPANY_TREASURY_ID]);

    console.log("      ✓ Demo Corp Treasury Center");
    console.log("      ✓ Demo Corp Holdings Pte Ltd");
    console.log("      ✓ Demo Corp Singapore Pte Ltd");
    console.log("      ✓ Demo Corp Malaysia Sdn Bhd");

    // ========================================================================
    // 2. CREATE ACCOUNTS (Chart of Accounts + Bank Accounts)
    // ========================================================================
    console.log("\n   💳 Creating accounts...");

    // Treasury Pool Accounts
    await client.query(`
      INSERT INTO finance.accounts (id, tenant_id, company_id, code, name, type, sub_type, currency, is_external, bank_code, bank_account_number, bank_swift_code, balance_cents, status)
      VALUES ($1, $2, $3, 'BANK-TREASURY-SGD', 'Treasury Pool SGD', 'ASSET', 'BANK', 'SGD', true, 'DBS', '001-234567-8', 'DBSSSGSG', 50000000, 'active')
      ON CONFLICT (tenant_id, company_id, code) DO UPDATE SET balance_cents = EXCLUDED.balance_cents
    `, [ACCOUNT_TREASURY_SGD_ID, DEMO_TENANT_ID, COMPANY_TREASURY_ID]);

    await client.query(`
      INSERT INTO finance.accounts (id, tenant_id, company_id, code, name, type, sub_type, currency, is_external, bank_code, bank_account_number, bank_swift_code, balance_cents, status)
      VALUES ($1, $2, $3, 'BANK-TREASURY-USD', 'Treasury Pool USD', 'ASSET', 'BANK', 'USD', true, 'CITI', '123-456789-0', 'CITISGSG', 30000000, 'active')
      ON CONFLICT (tenant_id, company_id, code) DO UPDATE SET balance_cents = EXCLUDED.balance_cents
    `, [ACCOUNT_TREASURY_USD_ID, DEMO_TENANT_ID, COMPANY_TREASURY_ID]);

    // Singapore OpCo Bank Account
    await client.query(`
      INSERT INTO finance.accounts (id, tenant_id, company_id, code, name, type, sub_type, currency, is_external, bank_code, bank_account_number, bank_swift_code, balance_cents, status)
      VALUES ($1, $2, $3, 'BANK-DBS-SGD', 'DBS Operating Account', 'ASSET', 'BANK', 'SGD', true, 'DBS', '001-987654-3', 'DBSSSGSG', 10000000, 'active')
      ON CONFLICT (tenant_id, company_id, code) DO UPDATE SET balance_cents = EXCLUDED.balance_cents
    `, [ACCOUNT_SG_BANK_SGD_ID, DEMO_TENANT_ID, COMPANY_SG_ID]);

    // Malaysia OpCo Bank Account
    await client.query(`
      INSERT INTO finance.accounts (id, tenant_id, company_id, code, name, type, sub_type, currency, is_external, bank_code, bank_account_number, bank_swift_code, balance_cents, status)
      VALUES ($1, $2, $3, 'BANK-CIMB-MYR', 'CIMB Operating Account', 'ASSET', 'BANK', 'MYR', true, 'CIMB', '800-123456-7', 'CIBBMYKL', 5000000, 'active')
      ON CONFLICT (tenant_id, company_id, code) DO UPDATE SET balance_cents = EXCLUDED.balance_cents
    `, [ACCOUNT_MY_BANK_MYR_ID, DEMO_TENANT_ID, COMPANY_MY_ID]);

    // Accounts Payable (GL Accounts)
    await client.query(`
      INSERT INTO finance.accounts (id, tenant_id, company_id, code, name, type, sub_type, currency, is_external, balance_cents, status)
      VALUES ($1, $2, $3, '2100', 'Accounts Payable - Trade', 'LIABILITY', 'PAYABLE', 'SGD', false, -2500000, 'active')
      ON CONFLICT (tenant_id, company_id, code) DO UPDATE SET balance_cents = EXCLUDED.balance_cents
    `, [ACCOUNT_AP_SGD_ID, DEMO_TENANT_ID, COMPANY_SG_ID]);

    await client.query(`
      INSERT INTO finance.accounts (id, tenant_id, company_id, code, name, type, sub_type, currency, is_external, balance_cents, status)
      VALUES ($1, $2, $3, '2100', 'Accounts Payable - Trade', 'LIABILITY', 'PAYABLE', 'MYR', false, -1500000, 'active')
      ON CONFLICT (tenant_id, company_id, code) DO UPDATE SET balance_cents = EXCLUDED.balance_cents
    `, [ACCOUNT_AP_MYR_ID, DEMO_TENANT_ID, COMPANY_MY_ID]);

    console.log("      ✓ Treasury Pool Accounts (SGD, USD)");
    console.log("      ✓ Singapore Operating Account (DBS SGD)");
    console.log("      ✓ Malaysia Operating Account (CIMB MYR)");
    console.log("      ✓ GL Accounts (Accounts Payable)");

    // ========================================================================
    // 3. CREATE FX RATES
    // ========================================================================
    console.log("\n   💱 Creating FX rates...");

    const today = new Date().toISOString();

    // USD/SGD
    await client.query(`
      INSERT INTO finance.fx_rates (tenant_id, from_currency, to_currency, rate, valid_from, source)
      VALUES ($1, 'USD', 'SGD', 1.3450, $2, 'TREASURY')
      ON CONFLICT DO NOTHING
    `, [DEMO_TENANT_ID, today]);

    // SGD/USD
    await client.query(`
      INSERT INTO finance.fx_rates (tenant_id, from_currency, to_currency, rate, valid_from, source)
      VALUES ($1, 'SGD', 'USD', 0.7435, $2, 'TREASURY')
      ON CONFLICT DO NOTHING
    `, [DEMO_TENANT_ID, today]);

    // USD/MYR
    await client.query(`
      INSERT INTO finance.fx_rates (tenant_id, from_currency, to_currency, rate, valid_from, source)
      VALUES ($1, 'USD', 'MYR', 4.4700, $2, 'TREASURY')
      ON CONFLICT DO NOTHING
    `, [DEMO_TENANT_ID, today]);

    // SGD/MYR
    await client.query(`
      INSERT INTO finance.fx_rates (tenant_id, from_currency, to_currency, rate, valid_from, source)
      VALUES ($1, 'SGD', 'MYR', 3.3230, $2, 'TREASURY')
      ON CONFLICT DO NOTHING
    `, [DEMO_TENANT_ID, today]);

    console.log("      ✓ USD/SGD: 1.3450");
    console.log("      ✓ USD/MYR: 4.4700");
    console.log("      ✓ SGD/MYR: 3.3230");

    // ========================================================================
    // 4. CREATE APPROVAL MATRICES
    // ========================================================================
    console.log("\n   ✅ Creating approval matrices...");

    // Singapore: < $10,000 = 1 approval, >= $10,000 = 2 approvals
    await client.query(`
      INSERT INTO finance.approval_matrices (tenant_id, company_id, payment_type, min_amount_cents, max_amount_cents, currency, required_approvals, approval_levels, requires_cfo)
      VALUES ($1, $2, 'VENDOR', 0, 999999, 'SGD', 1, '[{"level": 1, "roles": ["finance.approver"], "sla_hours": 24}]'::jsonb, false)
      ON CONFLICT DO NOTHING
    `, [DEMO_TENANT_ID, COMPANY_SG_ID]);

    await client.query(`
      INSERT INTO finance.approval_matrices (tenant_id, company_id, payment_type, min_amount_cents, max_amount_cents, currency, required_approvals, approval_levels, requires_cfo)
      VALUES ($1, $2, 'VENDOR', 1000000, NULL, 'SGD', 2, '[{"level": 1, "roles": ["finance.approver"], "sla_hours": 24}, {"level": 2, "roles": ["finance.cfo"], "sla_hours": 48}]'::jsonb, true)
      ON CONFLICT DO NOTHING
    `, [DEMO_TENANT_ID, COMPANY_SG_ID]);

    // Treasury: All intercompany >= 2 approvals
    await client.query(`
      INSERT INTO finance.approval_matrices (tenant_id, company_id, payment_type, min_amount_cents, max_amount_cents, currency, required_approvals, approval_levels, requires_cfo, requires_dual_signature)
      VALUES ($1, $2, 'INTERCOMPANY', 0, NULL, '*', 2, '[{"level": 1, "roles": ["treasury.analyst"], "sla_hours": 12}, {"level": 2, "roles": ["treasury.manager"], "sla_hours": 24}]'::jsonb, false, true)
      ON CONFLICT DO NOTHING
    `, [DEMO_TENANT_ID, COMPANY_TREASURY_ID]);

    console.log("      ✓ Singapore: <$10k = 1 approval, >=$10k = CFO required");
    console.log("      ✓ Treasury: Intercompany = Dual signature");

    // ========================================================================
    // 5. CREATE SAMPLE TRANSACTION (For Demo)
    // ========================================================================
    console.log("\n   📋 Creating sample transaction...");

    const txnId = "eeee0001-0000-0000-0000-000000000001";
    const correlationId = "cccc0001-0000-0000-0000-000000000001";
    const valueDate = new Date();
    valueDate.setDate(valueDate.getDate() + 3); // T+3

    await client.query(`
      INSERT INTO finance.transactions (
        id, tenant_id, company_id, correlation_id, reference, type, status,
        amount_cents, currency, beneficiary_type, beneficiary_name,
        beneficiary_bank_account, beneficiary_swift_code, value_date,
        payment_method, current_approval_level, required_approval_levels,
        description, created_by
      ) VALUES (
        $1, $2, $3, $4, 'PAY-2024-0001', 'VENDOR', 'PENDING_APPROVAL',
        2500000, 'SGD', 'VENDOR', 'Acme Supplies Pte Ltd',
        '123-456789-0', 'DBSSSGSG', $5,
        'WIRE', 0, 2,
        'Payment for office supplies - Invoice INV-2024-1234', $6
      )
      ON CONFLICT DO NOTHING
    `, [txnId, DEMO_TENANT_ID, COMPANY_SG_ID, correlationId, valueDate.toISOString().split('T')[0], DEMO_USER_ID]);

    console.log("      ✓ PAY-2024-0001: SGD 25,000 to Acme Supplies (Pending Approval)");

    await client.query("COMMIT");

    console.log("\n✅ Finance Schema Seeded Successfully!");
    console.log("\n📊 Summary:");
    console.log("   • 4 Companies (1 Treasury, 1 Holding, 2 OpCos)");
    console.log("   • 6 Accounts (2 Treasury, 2 Operating, 2 GL)");
    console.log("   • 4 FX Rates (USD, SGD, MYR crosses)");
    console.log("   • 3 Approval Matrices");
    console.log("   • 1 Sample Transaction");
    console.log("\n🚀 Ready for Payment Hub MVP demo!");

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("\n❌ Seed failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedFinance().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
