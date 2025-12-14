/**
 * Happy Path Seed Script
 * 
 * Seeds a demo environment for development and testing.
 * Idempotent - safe to run multiple times.
 * 
 * Usage: pnpm seed:happy-path
 */

import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";
import * as bcrypt from "bcryptjs";
import { fileURLToPath } from "url";

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// Fixed UUIDs for demo (reproducible)
const DEMO_TENANT_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const DEMO_USER_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const DEMO_ROLE_ID = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const DEMO_CANON_ID = "dddddddd-dddd-dddd-dddd-dddddddddddd";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://kernel:kernelpassword@localhost:5433/kernel_local";

const DEMO_PASSWORD = "password123";

async function seed() {
  console.log("🌱 Seeding Happy Path Environment...\n");

  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Create Demo Tenant
    console.log("   📦 Creating tenant: Demo Corp");
    await client.query(
      `INSERT INTO tenants (id, name) 
       VALUES ($1, 'Demo Corp')
       ON CONFLICT (id) DO UPDATE SET name = 'Demo Corp'`,
      [DEMO_TENANT_ID]
    );

    // 2. Create Admin User with password hash
    console.log("   👤 Creating user: admin@demo.local");
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    await client.query(
      `INSERT INTO users (id, tenant_id, email, name, password_hash)
       VALUES ($1, $2, 'admin@demo.local', 'Demo Admin', $3)
       ON CONFLICT (tenant_id, email) DO UPDATE 
       SET name = 'Demo Admin', password_hash = $3`,
      [DEMO_USER_ID, DEMO_TENANT_ID, passwordHash]
    );

    // 3. Create Super Admin Role
    console.log("   🎭 Creating role: Super Admin");
    await client.query(
      `INSERT INTO roles (id, tenant_id, name)
       VALUES ($1, $2, 'Super Admin')
       ON CONFLICT (tenant_id, name) DO NOTHING`,
      [DEMO_ROLE_ID, DEMO_TENANT_ID]
    );

    // 4. Grant All Permissions
    console.log("   🔐 Granting permissions...");
    const PERMISSIONS = [
      // Kernel IAM
      "kernel.iam.user.create",
      "kernel.iam.user.list",
      "kernel.iam.role.create",
      "kernel.iam.role.list",
      "kernel.iam.role.assign",
      "kernel.iam.permission.grant",
      // Registry
      "kernel.registry.canon.register",
      "kernel.registry.canon.list",
      "kernel.registry.route.create",
      "kernel.registry.route.list",
      // Events & Audit
      "kernel.event.publish",
      "kernel.audit.read",
      // Gateway
      "kernel.gateway.proxy",
      // Finance Domain (Payment Hub Cell)
      "finance.payment.execute",
      "finance.payment.status",
    ];

    // Ensure permissions exist
    for (const perm of PERMISSIONS) {
      await client.query(
        `INSERT INTO permissions (permission_code, description)
         VALUES ($1, $2)
         ON CONFLICT (permission_code) DO NOTHING`,
        [perm, `Permission: ${perm}`]
      );
    }

    // Assign to role
    for (const perm of PERMISSIONS) {
      await client.query(
        `INSERT INTO role_permissions (tenant_id, role_id, permission_code)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [DEMO_TENANT_ID, DEMO_ROLE_ID, perm]
      );
    }
    console.log(`      ✅ ${PERMISSIONS.length} permissions granted`);

    // 5. Assign Role to User
    console.log("   🔗 Assigning role to user...");
    await client.query(
      `INSERT INTO user_roles (tenant_id, user_id, role_id)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [DEMO_TENANT_ID, DEMO_USER_ID, DEMO_ROLE_ID]
    );

    // 6. Register Payment Hub Cell
    console.log("   📡 Registering cell: cell-payment-hub");
    await client.query(
      `INSERT INTO canons (id, tenant_id, name, service_url, healthy)
       VALUES ($1, $2, 'cell-payment-hub', 'http://localhost:4000', true)
       ON CONFLICT (id) DO UPDATE SET 
         name = 'cell-payment-hub',
         service_url = 'http://localhost:4000',
         healthy = true`,
      [DEMO_CANON_ID, DEMO_TENANT_ID]
    );

    // 7. Create Payment Routes
    console.log("   🛣️  Creating route: POST /payments/process");
    await client.query(
      `INSERT INTO routes (tenant_id, canon_id, method, path, required_permissions, active)
       VALUES ($1, $2, 'POST', '/payments/process', ARRAY['finance.payment.execute'], true)
       ON CONFLICT (tenant_id, path, method) DO UPDATE SET active = true, required_permissions = ARRAY['finance.payment.execute']`,
      [DEMO_TENANT_ID, DEMO_CANON_ID]
    );

    console.log("   🛣️  Creating route: GET /payments/status/:id");
    await client.query(
      `INSERT INTO routes (tenant_id, canon_id, method, path, required_permissions, active)
       VALUES ($1, $2, 'GET', '/payments/status/:id', ARRAY['finance.payment.status'], true)
       ON CONFLICT (tenant_id, path, method) DO UPDATE SET active = true, required_permissions = ARRAY['finance.payment.status']`,
      [DEMO_TENANT_ID, DEMO_CANON_ID]
    );

    // 8. Create Health/Ping Routes (public)
    console.log("   🛣️  Creating route: GET /ping (public)");
    await client.query(
      `INSERT INTO routes (tenant_id, canon_id, method, path, required_permissions, active)
       VALUES ($1, $2, 'GET', '/ping', ARRAY[]::text[], true)
       ON CONFLICT (tenant_id, path, method) DO UPDATE SET active = true`,
      [DEMO_TENANT_ID, DEMO_CANON_ID]
    );

    console.log("   🛣️  Creating route: GET /health (public)");
    await client.query(
      `INSERT INTO routes (tenant_id, canon_id, method, path, required_permissions, active)
       VALUES ($1, $2, 'GET', '/health', ARRAY[]::text[], true)
       ON CONFLICT (tenant_id, path, method) DO UPDATE SET active = true`,
      [DEMO_TENANT_ID, DEMO_CANON_ID]
    );

    await client.query("COMMIT");

    console.log("\n✅ Seed Complete!\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 Demo Credentials:");
    console.log(`   Tenant ID:  ${DEMO_TENANT_ID}`);
    console.log(`   Email:      admin@demo.local`);
    console.log(`   Password:   ${DEMO_PASSWORD}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🚀 Payment Hub Cell Routes:");
    console.log("   GET  http://localhost:4000/ping");
    console.log("   GET  http://localhost:4000/health");
    console.log("   POST http://localhost:4000/payments/process");
    console.log("   GET  http://localhost:4000/payments/status/:id");
    console.log("\n🔥 Chaos Engineering:");
    console.log("   POST http://localhost:4000/chaos/fail/{gateway|processor|ledger}");
    console.log("   POST http://localhost:4000/chaos/recover/{gateway|processor|ledger}");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("❌ Seed Failed:", e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
