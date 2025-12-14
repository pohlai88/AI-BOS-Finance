/**
 * Debug audit log to see why login failed
 */

const { Client } = require("pg");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://kernel:kernelpassword@localhost:5433/kernel_local";

async function debug() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  const tenantId = "11111111-1111-1111-1111-111111111111";

  console.log("Checking audit logs for login attempts...\n");

  const result = await client.query(
    `SELECT action, result, resource, payload, created_at 
     FROM audit_events 
     WHERE tenant_id = $1 AND action LIKE '%login%'
     ORDER BY created_at DESC 
     LIMIT 5`,
    [tenantId]
  );

  if (result.rows.length === 0) {
    console.log("No login audit events found");
  } else {
    result.rows.forEach((row, i) => {
      console.log(`[${i + 1}] ${row.action} - ${row.result}`);
      console.log(`    Resource: ${row.resource}`);
      console.log(`    Payload:`, row.payload);
      console.log(`    Time: ${row.created_at}`);
      console.log("");
    });
  }

  await client.end();
}

debug().catch(console.error);
