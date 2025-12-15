// metadata-studio/db/client.ts
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL env var is required for metadata-studio');
}

// Create a pg connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create the Drizzle database client with schema typing
export const db = drizzle(pool, { schema });

// Optional: export type if you want strict typing in services
export type MetadataStudioDb = typeof db;

