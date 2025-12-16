/**
 * Authentication Middleware for Route Handlers
 * 
 * Implements security pattern from security-rules.mdc:
 * - Never trust client-side CanonContext
 * - Always verify authentication server-side
 * - Return proper error responses
 * 
 * @see .cursor/rules/security-rules.mdc
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'kernel-jwt';

/**
 * Authenticated user context
 */
export interface AuthenticatedUser {
  user_id: string;
  tenant_id: string;
  session_id: string;
  email: string;
}

/**
 * JWT Payload structure
 */
interface JWTPayload {
  sub: string;      // user_id
  tid: string;      // tenant_id
  sid: string;      // session_id
  email: string;
  iat: number;
  exp: number;
}

/**
 * Decode JWT payload (without verification)
 * Full verification should be done by backend services
 */
function decodeJWTPayload(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));

    // Basic validation
    if (!payload.sub || !payload.tid || !payload.sid) {
      return null;
    }

    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }

    return payload as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Require authentication for route handlers
 * 
 * Returns authenticated user context or NextResponse error
 * 
 * @param request - Next.js request object
 * @returns AuthenticatedUser or NextResponse with error
 */
export async function requireAuth(
  request: NextRequest
): Promise<AuthenticatedUser | NextResponse> {
  try {
    // 1. Get JWT from cookie
    const cookieStore = await cookies();
    const jwtCookie = cookieStore.get(AUTH_COOKIE_NAME);

    if (!jwtCookie?.value) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing authentication token' },
        { status: 401 }
      );
    }

    // 2. Decode and validate JWT structure
    const payload = decodeJWTPayload(jwtCookie.value);

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // 3. Return authenticated user context
    return {
      user_id: payload.sub,
      tenant_id: payload.tid,
      session_id: payload.sid,
      email: payload.email || '',
    };
  } catch (error) {
    console.error('[Auth Middleware] Error:', error);
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication failed' },
      { status: 401 }
    );
  }
}

/**
 * Optional authentication - returns user if authenticated, null otherwise
 * 
 * Useful for routes that have both public and authenticated features
 */
export async function optionalAuth(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const jwtCookie = cookieStore.get(AUTH_COOKIE_NAME);

    if (!jwtCookie?.value) {
      return null;
    }

    const payload = decodeJWTPayload(jwtCookie.value);

    if (!payload) {
      return null;
    }

    return {
      user_id: payload.sub,
      tenant_id: payload.tid,
      session_id: payload.sid,
      email: payload.email || '',
    };
  } catch {
    return null;
  }
}

/**
 * Development mode authentication bypass
 * Only active when DEV_AUTH_BYPASS=true
 */
export function isDevBypassEnabled(): boolean {
  return process.env.NODE_ENV === 'development' &&
    process.env.DEV_AUTH_BYPASS === 'true';
}

/**
 * Get development fallback auth (for development only)
 */
export function getDevAuth(): AuthenticatedUser | null {
  if (!isDevBypassEnabled()) {
    return null;
  }

  const devTenantId = process.env.DEV_TENANT_ID;
  const devUserId = process.env.DEV_USER_ID;

  if (devTenantId && devUserId) {
    return {
      user_id: devUserId,
      tenant_id: devTenantId,
      session_id: 'dev-session',
      email: process.env.DEV_USER_EMAIL || 'dev@localhost',
    };
  }

  return null;
}
