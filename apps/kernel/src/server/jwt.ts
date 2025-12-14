/**
 * JWT Verification Helper
 * 
 * Extracts and verifies JWT from Authorization header.
 * Used by protected route handlers.
 * 
 * Build 3.2 (JWT Authentication)
 */

import { getKernelContainer } from "./container";

export type AuthenticatedUser = {
  user_id: string;
  tenant_id: string;
  session_id: string;
  email: string;
};

/**
 * Extract and verify JWT from request
 * 
 * Returns authenticated user context or throws error
 */
export async function verifyJWT(req: Request): Promise<AuthenticatedUser> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  const c = getKernelContainer();

  // Verify JWT
  let payload;
  try {
    payload = await c.tokenSigner.verify(token);
  } catch (e: any) {
    if (e?.message === "INVALID_TOKEN") {
      throw new Error("INVALID_TOKEN");
    }
    throw new Error("INVALID_TOKEN");
  }

  // Validate session is not revoked or expired
  const isValid = await c.sessionRepo.isValid({
    tenant_id: payload.tid,
    session_id: payload.sid,
    now: c.clock.nowISO(),
  });

  if (!isValid) {
    throw new Error("SESSION_INVALID");
  }

  return {
    user_id: payload.sub,
    tenant_id: payload.tid,
    session_id: payload.sid,
    email: payload.email,
  };
}
