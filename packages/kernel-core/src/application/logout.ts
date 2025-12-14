/**
 * Logout Use-Case
 * 
 * Application logic for user logout.
 * Revokes session to invalidate JWT.
 * 
 * Anti-Gravity:
 * - No framework imports
 * - No adapter imports
 * - Dependencies injected via `deps` parameter
 */

import type { TokenSignerPort } from "../ports/tokenSignerPort";
import type { SessionRepoPort } from "../ports/sessionRepoPort";
import type { AuditPort } from "../ports/auditPort";

export type LogoutDeps = {
  tokenSigner: TokenSignerPort;
  sessions: SessionRepoPort;
  audit: AuditPort;
  clock: { nowISO: () => string };
};

export type LogoutInput = {
  token: string;
  correlation_id?: string;
};

export async function logout(
  deps: LogoutDeps,
  input: LogoutInput
): Promise<{ ok: true }> {
  // 1. Verify JWT
  const payload = await deps.tokenSigner.verify(input.token);

  // 2. Revoke session
  const now = deps.clock.nowISO();
  await deps.sessions.revoke({
    tenant_id: payload.tid,
    session_id: payload.sid,
    revoked_at: now,
  });

  // 3. Append audit event
  await deps.audit.append({
    tenant_id: payload.tid,
    actor_id: payload.sub,
    action: "kernel.auth.logout",
    resource: `session:${payload.sid}`,
    result: "OK",
    correlation_id: input.correlation_id || "none",
    payload: {
      session_id: payload.sid,
    },
  });

  return { ok: true };
}
