import { Pool } from 'pg';

const isProduction = process.env.NODE_ENV === 'production';

// Single pool instance for the application
export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: isProduction ? 20 : 10, // Max clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Helper to verify connection on startup
export async function checkDbConnection(): Promise<boolean> {
  try {
    const client = await db.connect();
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
