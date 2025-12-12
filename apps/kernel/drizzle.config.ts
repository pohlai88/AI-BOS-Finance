/**
 * Drizzle Kit Configuration
 * 
 * Used for database migrations and schema introspection.
 * Run `npx drizzle-kit generate` to generate migrations.
 * Run `npx drizzle-kit migrate` to apply migrations.
 */

import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load root .env.local first (shared secrets), then app-level .env.local if exists
dotenv.config({ path: resolve(__dirname, '../../.env.local') });
dotenv.config({ path: resolve(__dirname, '../.env.local') }); // App-level override (optional)

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
} satisfies Config;
