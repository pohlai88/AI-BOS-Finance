/**
 * AI-BOS Data Fabric Migration Runner
 * 
 * Runs migrations in order across all schemas (kernel, finance, config)
 * or for a specific schema when --schema flag is provided.
 * 
 * Usage:
 *   pnpm migrate                  # Run all migrations
 *   pnpm migrate --schema kernel  # Run only kernel migrations
 *   pnpm migrate --schema finance # Run only finance migrations
 * 
 * Canon Code: TOOL_03
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Schema execution order (kernel must run first for foreign keys)
const SCHEMA_ORDER = ['kernel', 'finance', 'config'];

interface MigrationFile {
  schema: string;
  filename: string;
  filepath: string;
  order: number;
}

function parseMigrationOrder(filename: string): number {
  const match = filename.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 999;
}

function discoverMigrations(schemaFilter?: string): MigrationFile[] {
  const migrationsRoot = path.resolve(__dirname, '../migrations');
  const migrations: MigrationFile[] = [];

  const schemasToProcess = schemaFilter 
    ? [schemaFilter] 
    : SCHEMA_ORDER;

  for (const schema of schemasToProcess) {
    const schemaDir = path.join(migrationsRoot, schema);
    
    if (!fs.existsSync(schemaDir)) {
      console.log(`⚠️  Schema directory not found: ${schema}`);
      continue;
    }

    const files = fs.readdirSync(schemaDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      migrations.push({
        schema,
        filename: file,
        filepath: path.join(schemaDir, file),
        order: parseMigrationOrder(file),
      });
    }
  }

  // Sort: first by schema order, then by file number
  migrations.sort((a, b) => {
    const schemaOrderA = SCHEMA_ORDER.indexOf(a.schema);
    const schemaOrderB = SCHEMA_ORDER.indexOf(b.schema);
    if (schemaOrderA !== schemaOrderB) return schemaOrderA - schemaOrderB;
    return a.order - b.order;
  });

  return migrations;
}

async function migrate() {
  // Parse CLI args
  const args = process.argv.slice(2);
  const schemaIndex = args.indexOf('--schema');
  const schemaFilter = schemaIndex !== -1 ? args[schemaIndex + 1] : undefined;

  const connectionString = process.env.DATABASE_URL || 
    'postgres://aibos:aibos_password@localhost:5433/aibos_local';

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('🔌 Connected to AI-BOS Data Fabric\n');

    // Enable UUID extension
    console.log('📦 Enabling UUID extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Discover migrations
    const migrations = discoverMigrations(schemaFilter);
    
    if (migrations.length === 0) {
      console.log('No migrations found.');
      return;
    }

    console.log(`📂 Found ${migrations.length} migration(s)\n`);

    // Group by schema for display
    let currentSchema = '';
    
    for (const migration of migrations) {
      if (migration.schema !== currentSchema) {
        currentSchema = migration.schema;
        console.log(`\n╔═══════════════════════════════════════════════════════════╗`);
        console.log(`║  Schema: ${currentSchema.toUpperCase().padEnd(49)}║`);
        console.log(`╚═══════════════════════════════════════════════════════════╝`);
      }

      console.log(`  ▶️  ${migration.filename}`);
      
      try {
        const sql = fs.readFileSync(migration.filepath, 'utf8');
        await client.query(sql);
        console.log(`     ✅ Applied`);
      } catch (err: any) {
        // Check if it's a "already exists" error (idempotent migrations)
        if (err.code === '42P07' || err.code === '42710') {
          console.log(`     ⏭️  Skipped (already exists)`);
        } else {
          console.error(`     ❌ Failed: ${err.message}`);
          throw err;
        }
      }
    }

    console.log('\n✅ All migrations applied successfully!');
    console.log('\n📊 Next Steps:');
    console.log('   • Seed kernel:  pnpm seed:kernel');
    console.log('   • Seed finance: pnpm seed:finance');

  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
