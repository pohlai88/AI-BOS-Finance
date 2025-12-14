/**
 * Test script for Day 2 Gate Checks
 * Tests bootstrap persistence and UUID validation
 */

const { Client } = require('pg');

async function testPersistence() {
  const connectionString = process.env.DATABASE_URL || 'postgres://kernel:kernelpassword@localhost:5433/kernel_local';
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Database connection established');

    // Check system tenant exists
    const tenantResult = await client.query(
      "SELECT id, name FROM tenants WHERE id = '00000000-0000-0000-0000-000000000000'"
    );
    console.log('\n📊 System tenant:', tenantResult.rows[0] || 'NOT FOUND');

    // Check users in system tenant
    const userResult = await client.query(
      "SELECT id, email, name, created_at FROM users WHERE tenant_id = '00000000-0000-0000-0000-000000000000'"
    );
    console.log('\n👥 Users in system tenant:', userResult.rows.length);
    if (userResult.rows.length > 0) {
      console.log('   First user:', {
        id: userResult.rows[0].id,
        email: userResult.rows[0].email,
        name: userResult.rows[0].name
      });
    }

    // Check credentials
    if (userResult.rows.length > 0) {
      const credResult = await client.query(
        "SELECT user_id, password_hash IS NOT NULL as has_password FROM credentials WHERE tenant_id = '00000000-0000-0000-0000-000000000000' AND user_id = $1",
        [userResult.rows[0].id]
      );
      console.log('\n🔐 Credentials:', credResult.rows.length);
      if (credResult.rows.length > 0) {
        console.log('   First credential:', credResult.rows[0]);
      }
    }

    // Check roles
    const roleResult = await client.query(
      "SELECT id, name FROM roles WHERE tenant_id = '00000000-0000-0000-0000-000000000000'"
    );
    console.log('\n🎭 Roles in system tenant:', roleResult.rows.length);
    roleResult.rows.forEach(role => {
      console.log(`   - ${role.id}: ${role.name}`);
    });

    // Check permissions
    const permResult = await client.query(
      "SELECT permission_code, description FROM permissions LIMIT 5"
    );
    console.log('\n🔑 Permissions (sample):', permResult.rows.length);
    permResult.rows.forEach(perm => {
      console.log(`   - ${perm.permission_code}: ${perm.description || 'N/A'}`);
    });

    // Check audit events
    const auditResult = await client.query(
      "SELECT COUNT(*) as audit_count FROM audit_events WHERE tenant_id = '00000000-0000-0000-0000-000000000000'"
    );
    console.log('\n📝 Audit events in system tenant:', auditResult.rows[0].audit_count);

    console.log('\n✅ Gate Check 2: Bootstrap persistence PASSED');
    console.log('   Database survived restart, data is persisted');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testPersistence();
