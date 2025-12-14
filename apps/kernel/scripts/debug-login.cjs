/**
 * Debug login issues
 */

const { Client } = require("pg");
const bcrypt = require("bcryptjs");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://kernel:kernelpassword@localhost:5433/kernel_local";

async function debug() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  const tenantId = "11111111-1111-1111-1111-111111111111";
  const email = "day3-test@example.com";
  const password = "TestPassword123!";

  console.log("Looking up user:", { tenantId, email });

  const result = await client.query(
    `SELECT id, email, password_hash FROM users WHERE email = $1 AND tenant_id = $2`,
    [email, tenantId]
  );

  if (result.rows.length === 0) {
    console.log("❌ User not found");
    await client.end();
    return;
  }

  const user = result.rows[0];
  console.log("User found:", {
    id: user.id,
    email: user.email,
    hasPasswordHash: !!user.password_hash,
  });

  if (user.password_hash) {
    console.log("Password hash (first 30 chars):", user.password_hash.substring(0, 30));
    const match = await bcrypt.compare(password, user.password_hash);
    console.log("Password match:", match);
  } else {
    console.log("❌ No password hash set");
  }

  await client.end();
}

debug().catch(console.error);
