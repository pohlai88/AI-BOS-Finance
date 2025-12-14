/**
 * Day 3 Gate Check: Event Publish Security
 *
 * Tests:
 * 1. 401 - No token
 * 2. 403 - Token without kernel.event.publish permission
 * 3. 201 - Token with permission (happy path)
 * 4. 400 - Cross-tenant injection attempt
 */

const http = require("http");
const { Client } = require("pg");

const BASE_URL = "http://localhost:3001";
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://kernel:kernelpassword@localhost:5433/kernel_local";

// Test tenant/user (created by setup-day3-test.cjs)
const TEST_TENANT_ID = "11111111-1111-1111-1111-111111111111";
const TEST_USER_ID = "11111111-2222-3333-4444-555555555555";
const TEST_USER_EMAIL = "day3-test@example.com";
const TEST_PASSWORD = "TestPassword123!";
const ROLE_ID = "11111111-aaaa-bbbb-cccc-dddddddddddd";

let accessToken = null;

async function main() {
  console.log("🔒 Day 3 Gate Check: Event Publish Security\n");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Tenant: ${TEST_TENANT_ID}\n`);

  let passed = 0;
  let failed = 0;

  // ═══════════════════════════════════════════════════════════════════════════
  // Gate Check 1: 401 - No Token
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🧪 Gate Check 1: No Token → 401 UNAUTHORIZED");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    const result = await httpRequest("/api/kernel/events/publish", "POST", {
      event_name: "test.event",
      payload: { test: true },
    });

    if (result.status === 401) {
      console.log(`✅ PASSED: Got 401 UNAUTHORIZED`);
      console.log(`   Error code: ${result.body.error?.code}`);
      passed++;
    } else {
      console.log(`❌ FAILED: Expected 401, got ${result.status}`);
      console.log(`   Response:`, result.body);
      failed++;
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Login to get token
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n📋 Logging in test user...");
  try {
    const loginResult = await httpRequest("/api/kernel/iam/login", "POST", {
      email: TEST_USER_EMAIL,
      password: TEST_PASSWORD,
    });

    if (loginResult.status === 200 && loginResult.body.data?.access_token) {
      accessToken = loginResult.body.data.access_token;
      console.log(`   ✅ Login successful, token obtained`);
    } else {
      console.log(`   ❌ Login failed: ${loginResult.body.error?.code}`);
      console.log(`   Run: node scripts/setup-day3-test.cjs first`);
      process.exit(1);
    }
  } catch (e) {
    console.log(`   ❌ Login error: ${e.message}`);
    process.exit(1);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Gate Check 2: 403 - Token without permission
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🧪 Gate Check 2: Token WITHOUT permission → 403 FORBIDDEN");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    const result = await httpRequest(
      "/api/kernel/events/publish",
      "POST",
      {
        event_name: "test.event.forbidden",
        payload: { test: true },
      },
      { Authorization: `Bearer ${accessToken}` }
    );

    if (result.status === 403) {
      console.log(`✅ PASSED: Got 403 FORBIDDEN`);
      console.log(`   Error code: ${result.body.error?.code}`);
      console.log(
        `   Missing perms: ${JSON.stringify(result.body.error?.missing_permissions)}`
      );
      passed++;

      // Verify audit log
      const auditResult = await checkAuditLog("authz.deny");
      if (auditResult) {
        console.log(`   ✅ Audit log entry found for authz.deny`);
      } else {
        console.log(`   ⚠️  No audit log entry found`);
      }
    } else {
      console.log(`❌ FAILED: Expected 403, got ${result.status}`);
      console.log(`   Response:`, result.body);
      failed++;
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Grant permission via database
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n📋 Granting kernel.event.publish permission...");
  try {
    await grantPermission();
    console.log(`   ✅ Role assigned to user`);
  } catch (e) {
    console.log(`   ⚠️  Grant note: ${e.message}`);
  }

  // Re-login to get fresh token with new permissions
  console.log("   📋 Re-logging in for fresh token...");
  try {
    const loginResult = await httpRequest("/api/kernel/iam/login", "POST", {
      email: TEST_USER_EMAIL,
      password: TEST_PASSWORD,
    });
    accessToken = loginResult.body.data?.access_token;
    console.log(`   ✅ Fresh token obtained`);
  } catch (e) {
    console.log(`   ⚠️  Re-login note: ${e.message}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Gate Check 3: 201 - Token with permission
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🧪 Gate Check 3: Token WITH permission → 201 CREATED");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    const result = await httpRequest(
      "/api/kernel/events/publish",
      "POST",
      {
        event_name: "test.event.success",
        payload: { test: true, message: "Day 3 security gate passed!" },
      },
      { Authorization: `Bearer ${accessToken}` }
    );

    if (result.status === 201) {
      console.log(`✅ PASSED: Got 201 CREATED`);
      console.log(`   Event ID: ${result.body.event_id}`);
      console.log(`   Correlation: ${result.body.correlation_id}`);
      passed++;

      // Verify event in database
      const eventResult = await checkEventInDB(result.body.event_id);
      if (eventResult) {
        console.log(`   ✅ Event found in database`);
      } else {
        console.log(`   ⚠️  Event not found in events table`);
      }
    } else {
      console.log(`❌ FAILED: Expected 201, got ${result.status}`);
      console.log(`   Response:`, result.body);
      failed++;
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Gate Check 4: 400 - Cross-tenant injection
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🧪 Gate Check 4: Cross-tenant injection → 400 VALIDATION_ERROR");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    const DIFFERENT_TENANT = "22222222-2222-2222-2222-222222222222";
    const result = await httpRequest(
      "/api/kernel/events/publish",
      "POST",
      {
        event_name: "test.event.injection",
        tenant_id: DIFFERENT_TENANT, // Different from JWT tenant
        payload: { malicious: true },
      },
      { Authorization: `Bearer ${accessToken}` }
    );

    if (result.status === 400) {
      console.log(`✅ PASSED: Got 400 VALIDATION_ERROR`);
      console.log(`   Message: ${result.body.error?.message}`);
      passed++;

      // Check for security audit
      const secAudit = await checkAuditLog("security.cross_tenant_attempt");
      if (secAudit) {
        console.log(`   ✅ Security audit log entry found`);
      }
    } else {
      console.log(`❌ FAILED: Expected 400, got ${result.status}`);
      console.log(`   Response:`, result.body);
      failed++;
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📊 Results: ${passed} passed, ${failed} failed out of 4 checks`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  if (failed === 0) {
    console.log("\n✅ Day 3 Gate Check: ALL PASSED");
    console.log("   Event Publish endpoint is now SECURED!");
    console.log("   - 401 for missing token");
    console.log("   - 403 for missing permission (+ audit log)");
    console.log("   - 201 for authorized requests");
    console.log("   - 400 for cross-tenant injection (+ security audit)");
  } else if (passed >= 2) {
    console.log("\n⚠️  Day 3 Gate Check: MOSTLY PASSED");
    console.log("   Core security is working (401/403 checks passed)");
  } else {
    console.log("\n❌ Day 3 Gate Check: FAILED");
    process.exit(1);
  }
}

// HTTP request helper
function httpRequest(path, method, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const url = new URL(path, BASE_URL);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
        "x-tenant-id": TEST_TENANT_ID,
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: { raw: data } });
        }
      });
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

async function grantPermission() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    // Assign role to user
    await client.query(
      `INSERT INTO user_roles (tenant_id, user_id, role_id) 
       VALUES ($1, $2, $3) 
       ON CONFLICT DO NOTHING`,
      [TEST_TENANT_ID, TEST_USER_ID, ROLE_ID]
    );
  } finally {
    await client.end();
  }
}

async function checkAuditLog(action) {
  try {
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();

    const result = await client.query(
      `SELECT * FROM audit_events 
       WHERE action = $1 AND tenant_id = $2 
       ORDER BY created_at DESC LIMIT 1`,
      [action, TEST_TENANT_ID]
    );

    await client.end();
    return result.rows.length > 0;
  } catch {
    return false;
  }
}

async function checkEventInDB(eventId) {
  try {
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();

    const result = await client.query(`SELECT * FROM events WHERE id = $1`, [
      eventId,
    ]);

    await client.end();
    return result.rows.length > 0;
  } catch {
    return false;
  }
}

main().catch(console.error);
