/**
 * Database Adapter Loader
 * 
 * Purpose: Apply provider-specific migrations after core migrations
 * Usage: 
 *   pnpm db:apply-adapter              # Auto-detect provider
 *   pnpm db:apply-adapter --provider supabase
 *   pnpm db:apply-adapter --provider self-hosted
 * 
 * Canon Code: TOOL_04
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// ============================================================================
// PROVIDER DETECTION
// ============================================================================

type DatabaseProvider = 'supabase' | 'aws-rds' | 'azure' | 'neon' | 'self-hosted';

function detectProvider(connectionString: string): DatabaseProvider {
  const url = connectionString.toLowerCase();

  if (url.includes('supabase.co') || url.includes('supabase.in')) {
    return 'supabase';
  }
  if (url.includes('rds.amazonaws.com')) {
    return 'aws-rds';
  }
  if (url.includes('database.azure.com')) {
    return 'azure';
  }
  if (url.includes('neon.tech')) {
    return 'neon';
  }

  return 'self-hosted';
}

// ============================================================================
// MIGRATION DISCOVERY
// ============================================================================

interface AdapterMigration {
  provider: string;
  filename: string;
  filepath: string;
  order: number;
}

function parseMigrationOrder(filename: string): number {
  const match = filename.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 999;
}

function discoverAdapterMigrations(provider: DatabaseProvider): AdapterMigration[] {
  const adapterDir = path.resolve(__dirname, `../adapters/${provider}`);
  const migrations: AdapterMigration[] = [];

  if (!fs.existsSync(adapterDir)) {
    console.log(`⚠️  No adapter directory found for provider: ${provider}`);
    return migrations;
  }

  const files = fs.readdirSync(adapterDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    migrations.push({
      provider,
      filename: file,
      filepath: path.join(adapterDir, file),
      order: parseMigrationOrder(file),
    });
  }

  return migrations.sort((a, b) => a.order - b.order);
}

// ============================================================================
// MAIN
// ============================================================================

async function applyAdapter() {
  // Parse CLI args
  const args = process.argv.slice(2);
  const providerIndex = args.indexOf('--provider');
  let provider: DatabaseProvider;

  const connectionString = process.env.DATABASE_URL ||
    'postgres://aibos:aibos_password@localhost:5433/aibos_local';

  if (providerIndex !== -1 && args[providerIndex + 1]) {
    provider = args[providerIndex + 1] as DatabaseProvider;
    console.log(`🎯 Using specified provider: ${provider}`);
  } else {
    provider = detectProvider(connectionString);
    console.log(`🔍 Auto-detected provider: ${provider}`);
  }

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log(`║  APPLYING ${provider.toUpperCase()} ADAPTER MIGRATIONS                     ║`);
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('🔌 Connected to database\n');

    // Discover migrations
    const migrations = discoverAdapterMigrations(provider);

    if (migrations.length === 0) {
      console.log(`📭 No adapter migrations found for ${provider}`);
      console.log('   Create migrations in: apps/db/adapters/' + provider + '/');
      return;
    }

    console.log(`📂 Found ${migrations.length} adapter migration(s)\n`);

    // Apply each migration
    for (const migration of migrations) {
      console.log(`  ▶️  ${migration.filename}`);

      try {
        const sql = fs.readFileSync(migration.filepath, 'utf8');
        await client.query(sql);
        console.log(`     ✅ Applied`);
      } catch (err: any) {
        // Check for idempotent errors
        if (
          err.code === '42P07' || // duplicate table
          err.code === '42710' || // duplicate object
          err.code === '42P16' || // policy already exists
          err.code === '42883'    // function does not exist (for drops)
        ) {
          console.log(`     ⏭️  Skipped (already exists)`);
        } else if (err.message.includes('already exists')) {
          console.log(`     ⏭️  Skipped (already exists)`);
        } else {
          console.error(`     ❌ Failed: ${err.message}`);
          throw err;
        }
      }
    }

    console.log('\n✅ Adapter migrations applied successfully!');

    // Provider-specific post-apply advice
    if (provider === 'supabase') {
      console.log('\n📋 Supabase Next Steps:');
      console.log('   1. Verify RLS in Supabase Dashboard (Table Editor → Policies)');
      console.log('   2. Run: get_advisors(security) to check for issues');
      console.log('   3. Configure exposed schemas in API Settings (if using Data API)');
      console.log('   4. Set up Storage buckets in Storage tab');
    }

  } catch (err) {
    console.error('\n❌ Adapter application failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyAdapter();
