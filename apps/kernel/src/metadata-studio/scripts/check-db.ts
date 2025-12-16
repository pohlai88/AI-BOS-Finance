import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkDatabase() {
  const client = await pool.connect();

  try {
    // Check for mdm tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE 'mdm%' 
      ORDER BY table_name
    `);

    console.log('📊 Existing MDM Tables:');
    if (res.rows.length === 0) {
      console.log('   ❌ No MDM tables found!');
    } else {
      res.rows.forEach(r => console.log(`   ✅ ${r.table_name}`));
    }

    // Check migrations table
    const migrations = await client.query(`
      SELECT version FROM __drizzle_migrations ORDER BY version
    `).catch(() => ({ rows: [] }));

    if (migrations.rows.length > 0) {
      console.log('\n📋 Applied Migrations:');
      migrations.rows.forEach(m => console.log(`   - ${m.version}`));
    }

  } finally {
    client.release();
    await pool.end();
  }
}

checkDatabase().catch(console.error);
