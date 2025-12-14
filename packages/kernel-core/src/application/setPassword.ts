/**
 * Set Password Use-Case
 * 
 * Application logic for setting/updating user password.
 * Hashes password and stores credentials.
 * 
 * Anti-Gravity:
 * - No framework imports
 * - No adapter imports
 * - Dependencies injected via `deps` parameter
 */

import type { PasswordHasherPort } from "../ports/passwordHasherPort";
import type { CredentialRepoPort } from "../ports/credentialRepoPort";
import type { UserRepoPort } from "../ports/userRepoPort";
import type { AuditPort } from "../ports/auditPort";
import type { KernelCredential } from "../domain/auth";

export type SetPasswordDeps = {
  users: UserRepoPort;
  credentials: CredentialRepoPort;
  passwordHasher: PasswordHasherPort;
  audit: AuditPort;
  clock: { nowISO: () => string };
};

export type SetPasswordInput = {
  tenant_id: string;
  actor_id?: string;
  correlation_id?: string;
  user_id: string;
  password: string;
};

export async function setPassword(
  deps: SetPasswordDeps,
  input: SetPasswordInput
): Promise<{ ok: true }> {
  // 1. Validate user exists
  const user = await deps.users.findById({
    tenant_id: input.tenant_id,
    user_id: input.user_id,
  });

  if (!user) {
    await deps.audit.append({
      tenant_id: input.tenant_id,
      actor_id: input.actor_id,
      action: "kernel.auth.password.set",
      resource: `user:${input.user_id}`,
      result: "FAIL",
      correlation_id: input.correlation_id || "none",
      payload: { reason: "USER_NOT_FOUND" },
    });
    throw new Error("USER_NOT_FOUND");
  }

  // 2. Hash password
  const password_hash = await deps.passwordHasher.hash(input.password);

  // 3. Store credentials
  const now = deps.clock.nowISO();
  const credential: KernelCredential = {
    tenant_id: input.tenant_id,
    user_id: input.user_id,
    password_hash,
    created_at: now,
    updated_at: now,
  };

  await deps.credentials.set(credential);

  // 4. Append audit event
  await deps.audit.append({
    tenant_id: input.tenant_id,
    actor_id: input.actor_id,
    action: "kernel.auth.password.set",
    resource: `user:${input.user_id}`,
    result: "OK",
    correlation_id: input.correlation_id || "none",
    payload: {
      user_id: input.user_id,
    },
  });

  return { ok: true };
}
