/**
 * Verification Script: DB Roles
 * 
 * Purpose: Verify that Task 1 (DB Role Separation) completed successfully
 * Usage: tsx scripts/verify-roles.ts
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://aibos:aibos_password@localhost:5433/aibos_local'
});

async function verifyRoles() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║           DB ROLE VERIFICATION (Task 1)                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // Test 1: Verify roles exist
    console.log('📋 Test 1: Verifying roles exist...');
    const rolesResult = await pool.query(`
      SELECT rolname, rolcomment 
      FROM pg_roles 
      WHERE rolname IN ('aibos_kernel_role', 'aibos_finance_role', 'aibos_config_role')
      ORDER BY rolname
    `);

    if (rolesResult.rows.length !== 3) {
      console.error(`❌ FAILED: Expected 3 roles, found ${rolesResult.rows.length}`);
      process.exit(1);
    }

    console.log('✅ PASSED: All 3 roles exist\n');
    console.log('Roles:');
    rolesResult.rows.forEach(row => {
      console.log(`  • ${row.rolname}`);
      if (row.rolcomment) {
        console.log(`    ${row.rolcomment}`);
      }
    });

    // Test 2: Verify role attributes
    console.log('\n📋 Test 2: Verifying role attributes...');
    const attrsResult = await pool.query(`
      SELECT 
        rolname,
        rolsuper,
        rolinherit,
        rolcreaterole,
        rolcreatedb,
        rolcanlogin
      FROM pg_roles 
      WHERE rolname LIKE 'aibos_%'
      ORDER BY rolname
    `);

    let allValid = true;
    for (const row of attrsResult.rows) {
      if (row.rolsuper || row.rolcanlogin) {
        console.error(`❌ FAILED: ${row.rolname} has invalid attributes (superuser or login enabled)`);
        allValid = false;
      }
    }

    if (!allValid) {
      process.exit(1);
    }

    console.log('✅ PASSED: All roles have correct attributes (NOLOGIN, non-superuser)');

    // Test 3: Verify schema permissions (Task 2)
    console.log('\n📋 Test 3: Verifying schema permissions...');

    const kernelFinanceAccess = await pool.query(`
      SELECT has_schema_privilege('aibos_kernel_role', 'finance', 'USAGE') as has_access
    `);

    const financeKernelAccess = await pool.query(`
      SELECT has_schema_privilege('aibos_finance_role', 'kernel', 'USAGE') as has_access
    `);

    if (kernelFinanceAccess.rows[0]?.has_access) {
      console.error('❌ FAILED: aibos_kernel_role can access finance schema (should be blocked)');
      process.exit(1);
    }

    if (financeKernelAccess.rows[0]?.has_access) {
      console.error('❌ FAILED: aibos_finance_role can access kernel schema (should be blocked)');
      process.exit(1);
    }

    console.log('✅ PASSED: Cross-schema access is blocked');

    // Test 4: Verify config read access
    const kernelConfigAccess = await pool.query(`
      SELECT has_schema_privilege('aibos_kernel_role', 'config', 'USAGE') as has_access
    `);

    const financeConfigAccess = await pool.query(`
      SELECT has_schema_privilege('aibos_finance_role', 'config', 'USAGE') as has_access
    `);

    if (!kernelConfigAccess.rows[0]?.has_access) {
      console.error('❌ FAILED: aibos_kernel_role cannot access config schema (should have read access)');
      process.exit(1);
    }

    if (!financeConfigAccess.rows[0]?.has_access) {
      console.error('❌ FAILED: aibos_finance_role cannot access config schema (should have read access)');
      process.exit(1);
    }

    console.log('✅ PASSED: Both kernel and finance roles can read config schema');

    console.log('\n' + '═'.repeat(60));
    console.log('\n✅ ALL TESTS PASSED: DB Role Separation (Tasks 1 & 2) complete!\n');

  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyRoles();
