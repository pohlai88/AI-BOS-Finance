// metadata-studio/middleware/auth.middleware.ts
import type { MiddlewareHandler, Context } from 'hono';

export type Role =
  | 'kernel_architect'
  | 'metadata_steward'
  | 'business_admin'
  | 'user';

export interface AuthContext {
  userId: string;
  role: Role;
  tenantId: string;
}

// Hono Variables type for typed context.get()
export type AppVariables = {
  auth: AuthContext;
};

// Helper type for route handlers
export type AppContext = Context<{ Variables: AppVariables }>;

/**
 * Get auth from context with proper typing
 */
export function getAuth(c: Context): AuthContext {
  return c.get('auth' as any) as AuthContext;
}

/**
 * Temporary/simple auth middleware.
 * In production you'll replace this with real JWT / SSO integration.
 *
 * For now:
 * - x-tenant-id: tenant UUID (required)
 * - x-user-id: user identifier (default: 'system')
 * - x-role: kernel_architect | metadata_steward | business_admin | user
 */
export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const tenantId = c.req.header('x-tenant-id');
  const userId = c.req.header('x-user-id') ?? 'system';
  const roleHeader = c.req.header('x-role') as Role | undefined;

  if (!tenantId) {
    return c.json({ error: 'Missing x-tenant-id header' }, 400);
  }

  const role: Role = roleHeader ?? 'business_admin';

  const auth: AuthContext = {
    tenantId,
    userId,
    role,
  };

  (c as any).set('auth', auth);

  await next();
};

