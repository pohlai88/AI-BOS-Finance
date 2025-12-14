/**
 * Login Use-Case
 * 
 * Application logic for user authentication.
 * Verifies credentials, creates session, and issues JWT.
 * 
 * Anti-Gravity:
 * - No framework imports
 * - No adapter imports
 * - Dependencies injected via `deps` parameter
 */

import type { UserRepoPort } from "../ports/userRepoPort";
import type { CredentialRepoPort } from "../ports/credentialRepoPort";
import type { PasswordHasherPort } from "../ports/passwordHasherPort";
import type { TokenSignerPort } from "../ports/tokenSignerPort";
import type { SessionRepoPort } from "../ports/sessionRepoPort";
import type { AuditPort } from "../ports/auditPort";
import type { KernelSession } from "../domain/auth";

export type LoginDeps = {
  users: UserRepoPort;
  credentials: CredentialRepoPort;
  passwordHasher: PasswordHasherPort;
  tokenSigner: TokenSignerPort;
  sessions: SessionRepoPort;
  audit: AuditPort;
  id: { uuid: () => string };
  clock: { nowISO: () => string };
};

export type LoginInput = {
  tenant_id: string;
  correlation_id?: string;
  email: string;
  password: string;
};

export type LoginOutput = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  session_id: string;
};

export async function login(
  deps: LoginDeps,
  input: LoginInput,
  ttlSeconds: number = 3600 // Default: 1 hour
): Promise<LoginOutput> {
  // 1. Find user by email
  const user = await deps.users.findByEmail({
    tenant_id: input.tenant_id,
    email: input.email.toLowerCase().trim(),
  });

  if (!user) {
    await deps.audit.append({
      tenant_id: input.tenant_id,
      action: "kernel.auth.login",
      resource: `user:${input.email}`,
      result: "FAIL",
      correlation_id: input.correlation_id || "none",
      payload: { reason: "INVALID_CREDENTIALS" },
    });
    throw new Error("INVALID_CREDENTIALS");
  }

  // 2. Get credentials
  const credential = await deps.credentials.getByUserId({
    tenant_id: input.tenant_id,
    user_id: user.user_id,
  });

  if (!credential) {
    await deps.audit.append({
      tenant_id: input.tenant_id,
      action: "kernel.auth.login",
      resource: `user:${user.user_id}`,
      result: "FAIL",
      correlation_id: input.correlation_id || "none",
      payload: { reason: "NO_CREDENTIALS" },
    });
    throw new Error("INVALID_CREDENTIALS");
  }

  // 3. Verify password
  const isValid = await deps.passwordHasher.verify(
    input.password,
    credential.password_hash
  );

  if (!isValid) {
    await deps.audit.append({
      tenant_id: input.tenant_id,
      actor_id: user.user_id,
      action: "kernel.auth.login",
      resource: `user:${user.user_id}`,
      result: "FAIL",
      correlation_id: input.correlation_id || "none",
      payload: { reason: "INVALID_PASSWORD" },
    });
    throw new Error("INVALID_CREDENTIALS");
  }

  // 4. Create session
  const now = deps.clock.nowISO();
  const sessionId = deps.id.uuid();
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  const session: KernelSession = {
    session_id: sessionId,
    tenant_id: input.tenant_id,
    user_id: user.user_id,
    expires_at: expiresAt,
    created_at: now,
  };

  await deps.sessions.create(session);

  // 5. Sign JWT
  const accessToken = await deps.tokenSigner.sign(
    {
      sub: user.user_id,
      tid: input.tenant_id,
      sid: sessionId,
      email: user.email,
    },
    ttlSeconds
  );

  // 6. Append audit event
  await deps.audit.append({
    tenant_id: input.tenant_id,
    actor_id: user.user_id,
    action: "kernel.auth.login",
    resource: `user:${user.user_id}`,
    result: "OK",
    correlation_id: input.correlation_id || "none",
    payload: {
      user_id: user.user_id,
      session_id: sessionId,
    },
  });

  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: ttlSeconds,
    session_id: sessionId,
  };
}
