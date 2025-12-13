/**
 * Database Connection Client
 * 
 * Initializes Drizzle ORM connection to Postgres database.
 * Uses environment variables for connection string.
 * 
 * @see .env.example for required environment variables
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;

// Lazy initialization - only connect when DB is actually needed
let queryClient: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

function initializeDatabase() {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required. Please set it in .env.local');
  }

  if (!queryClient) {
    // Create Postgres connection
    // Connection pooling is handled by postgres-js
    queryClient = postgres(databaseUrl, {
      max: 10, // Maximum number of connections in the pool
      idle_timeout: 20, // Close idle connections after 20 seconds
      connect_timeout: 10, // Connection timeout in seconds
    });

    // Create Drizzle instance with schema
    dbInstance = drizzle(queryClient, { schema });
  }

  return { queryClient, db: dbInstance! };
}

// Export getter that initializes on first access (lazy loading)
// This allows the Kernel to start even without DATABASE_URL
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const { db } = initializeDatabase();
    return (db as any)[prop];
  },
});

// Export schema for use in queries
export * from './schema.js';

// Export query client getter for raw SQL if needed
export function getQueryClient() {
  const { queryClient } = initializeDatabase();
  return queryClient;
}

// Health check function
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> {
  if (!databaseUrl) {
    return {
      status: 'unhealthy',
      error: 'DATABASE_URL not configured',
    };
  }

  const startTime = Date.now();

  try {
    const { queryClient } = initializeDatabase();
    // Simple query to test connection
    await queryClient`SELECT NOW()`;
    const latency = Date.now() - startTime;

    return {
      status: 'healthy',
      latency,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
