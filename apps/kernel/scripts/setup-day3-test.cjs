/**
 * Setup script for Day 3 Gate Checks
 * Creates test tenant and user in database
 */

const { Client } = require("pg");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://kernel:kernelpassword@localhost:5433/kernel_local";

const TEST_TENANT_ID = "11111111-1111-1111-1111-111111111111";
const TEST_USER_ID = "11111111-2222-3333-4444-555555555555";
const TEST_USER_EMAIL = "day3-test@example.com";
const ROLE_ID = "11111111-aaaa-bbbb-cccc-dddddddddddd";

async function setup() {
  console.log("🔧 Setting up Day 3 test data...\n");

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    // 1. Create test tenant
    await client.query(
      `INSERT INTO tenants (id, name) 
       VALUES ($1, 'Day3 Test Tenant') 
       ON CONFLICT (id) DO NOTHING`,
      [TEST_TENANT_ID]
    );
    console.log("✅ Test tenant created");

    // 2. Create test user
    await client.query(
      `INSERT INTO users (id, tenant_id, email, name) 
       VALUES ($1, $2, $3, 'Day3 Test User') 
       ON CONFLICT (tenant_id, email) DO NOTHING`,
      [TEST_USER_ID, TEST_TENANT_ID, TEST_USER_EMAIL]
    );
    console.log("✅ Test user created");

    // 3. Set password (bcrypt hash of "TestPassword123!")
    const passwordHash = await bcrypt.hash("TestPassword123!", 10);
    await client.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [passwordHash, TEST_USER_ID]
    );
    console.log("✅ User password set (in users table)");

    // 4. Ensure permission exists
    await client.query(
      `INSERT INTO permissions (permission_code, description) 
       VALUES ('kernel.event.publish', 'Publish events') 
       ON CONFLICT (permission_code) DO NOTHING`
    );
    console.log("✅ Permission exists");

    // 5. Create role with permission (for later grant)
    await client.query(
      `INSERT INTO roles (id, tenant_id, name) 
       VALUES ($1, $2, 'Event Publisher') 
       ON CONFLICT (tenant_id, name) DO NOTHING`,
      [ROLE_ID, TEST_TENANT_ID]
    );
    console.log("✅ Role created");

    // 6. Assign permission to role
    await client.query(
      `INSERT INTO role_permissions (tenant_id, role_id, permission_code) 
       VALUES ($1, $2, 'kernel.event.publish') 
       ON CONFLICT DO NOTHING`,
      [TEST_TENANT_ID, ROLE_ID]
    );
    console.log("✅ Permission assigned to role");

    // Note: We don't assign role to user yet - that happens after 403 test

    console.log("\n📋 Test credentials:");
    console.log(`   Tenant ID: ${TEST_TENANT_ID}`);
    console.log(`   User ID: ${TEST_USER_ID}`);
    console.log(`   Email: ${TEST_USER_EMAIL}`);
    console.log(`   Password: TestPassword123!`);
    console.log(`   Role ID: ${ROLE_ID} (NOT assigned yet)`);
  } finally {
    await client.end();
  }
}

setup().catch(console.error);
