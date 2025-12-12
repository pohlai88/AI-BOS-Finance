/**
 * Drizzle Kit Configuration
 * 
 * Used for database migrations and schema introspection.
 * Run `npx drizzle-kit generate` to generate migrations.
 * Run `npx drizzle-kit migrate` to apply migrations.
 */

import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

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
