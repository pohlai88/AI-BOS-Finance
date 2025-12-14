/**
 * Simple debug - check actual table data
 */

const { Client } = require("pg");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://kernel:kernelpassword@localhost:5433/kernel_local";

async function debug() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  console.log("=== Audit Events (latest 5) ===");
  const auditResult = await client.query(
    `SELECT action, resource, details, created_at 
     FROM audit_events 
     ORDER BY created_at DESC 
     LIMIT 5`
  );
  auditResult.rows.forEach((row, i) => {
    console.log(`[${i + 1}] ${row.action}`);
    console.log(`    Resource: ${row.resource}`);
    console.log(`    Details:`, row.details);
    console.log("");
  });

  console.log("=== Test User ===");
  const userResult = await client.query(
    `SELECT id, email, password_hash IS NOT NULL as has_pw FROM users WHERE email = 'day3-test@example.com'`
  );
  console.log("User:", userResult.rows[0]);

  await client.end();
}

debug().catch(console.error);
