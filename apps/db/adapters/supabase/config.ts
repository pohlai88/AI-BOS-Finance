/**
 * Supabase Adapter Configuration
 * 
 * Purpose: Provider-specific configuration for Supabase deployments
 * Canon Code: ADAPTER_SUPABASE
 */

export interface SupabaseConfig {
  /** Project URL (from Supabase Dashboard) */
  projectUrl: string;

  /** Anonymous (public) key - safe to expose client-side */
  anonKey: string;

  /** Service role key - NEVER expose client-side */
  serviceRoleKey: string;

  /** Database connection string (for direct connections) */
  databaseUrl: string;

  /** Connection pool URL (via Supavisor) */
  poolerUrl?: string;
}

export interface StorageBucketConfig {
  id: string;
  name: string;
  public: boolean;
  fileSizeLimit: number;
  allowedMimeTypes: string[];
}

/**
 * Storage bucket definitions for AI-BOS Finance
 */
export const STORAGE_BUCKETS: StorageBucketConfig[] = [
  {
    id: 'tenant-documents',
    name: 'tenant-documents',
    public: false,
    fileSizeLimit: 52428800, // 50MB
    allowedMimeTypes: [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ],
  },
  {
    id: 'payment-files',
    name: 'payment-files',
    public: false,
    fileSizeLimit: 104857600, // 100MB
    allowedMimeTypes: [
      'application/pdf',
      'text/csv',
      'text/plain',
      'application/xml',
      'text/xml',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  },
  {
    id: 'journal-attachments',
    name: 'journal-attachments',
    public: false,
    fileSizeLimit: 26214400, // 25MB
    allowedMimeTypes: [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
    ],
  },
  {
    id: 'reports',
    name: 'reports',
    public: false,
    fileSizeLimit: 104857600, // 100MB
    allowedMimeTypes: [
      'application/pdf',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json',
    ],
  },
  {
    id: 'public-assets',
    name: 'public-assets',
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: [
      'image/png',
      'image/jpeg',
      'image/svg+xml',
      'image/webp',
      'image/gif',
    ],
  },
];

/**
 * Storage path convention for tenant isolation
 * Format: {tenant_id}/{document_type}/{filename}
 */
export function buildStoragePath(
  tenantId: string,
  documentType: string,
  filename: string,
  companyId?: string
): string {
  if (companyId) {
    return `${tenantId}/${companyId}/${documentType}/${filename}`;
  }
  return `${tenantId}/${documentType}/${filename}`;
}

/**
 * Parse storage path to extract tenant_id
 */
export function extractTenantFromPath(storagePath: string): string | null {
  const parts = storagePath.split('/');
  if (parts.length < 1) return null;

  // Validate UUID format
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const tenantId = parts[0];

  return UUID_REGEX.test(tenantId) ? tenantId : null;
}

/**
 * Supabase-specific connection options
 */
export interface SupabaseConnectionOptions {
  /** Use connection pooler (Supavisor) - recommended for serverless */
  usePooler: boolean;

  /** Pool mode */
  poolMode: 'transaction' | 'session';

  /** Maximum connections (for direct connection) */
  maxConnections: number;

  /** Statement timeout in milliseconds */
  statementTimeout: number;
}

export const DEFAULT_CONNECTION_OPTIONS: SupabaseConnectionOptions = {
  usePooler: true,
  poolMode: 'transaction',
  maxConnections: 10,
  statementTimeout: 30000, // 30 seconds
};

/**
 * Detect if running in Supabase environment
 */
export function isSupabaseEnvironment(): boolean {
  const dbUrl = process.env.DATABASE_URL || '';
  return dbUrl.includes('supabase.co') || dbUrl.includes('supabase.in');
}

/**
 * Get Supabase configuration from environment
 */
export function getSupabaseConfig(): SupabaseConfig | null {
  if (!isSupabaseEnvironment()) {
    return null;
  }

  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl = process.env.DATABASE_URL;
  const poolerUrl = process.env.DATABASE_POOLER_URL;

  if (!projectUrl || !anonKey || !serviceRoleKey || !databaseUrl) {
    console.warn('[SupabaseAdapter] Missing required environment variables');
    return null;
  }

  return {
    projectUrl,
    anonKey,
    serviceRoleKey,
    databaseUrl,
    poolerUrl,
  };
}

export default {
  STORAGE_BUCKETS,
  DEFAULT_CONNECTION_OPTIONS,
  buildStoragePath,
  extractTenantFromPath,
  isSupabaseEnvironment,
  getSupabaseConfig,
};
