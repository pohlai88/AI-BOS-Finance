// metadata-studio/scripts/migrate.ts
import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from '../db/client';

async function main() {
  console.log('Running metadata-studio migrations...');
  await migrate(db, { migrationsFolder: './db/migrations' });
  console.log('Metadata-studio migrations completed.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

