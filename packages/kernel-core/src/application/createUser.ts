/**
 * Create User Use-Case
 * 
 * Application logic for user creation.
 * Validates email uniqueness and writes audit events.
 * 
 * Anti-Gravity:
 * - No framework imports
 * - No adapter imports
 * - Dependencies injected via `deps` parameter
 */

import type { UserRepoPort } from "../ports/userRepoPort";
import type { AuditPort } from "../ports/auditPort";
import type { KernelUser } from "../domain/iam";

export type CreateUserDeps = {
  users: UserRepoPort;
  audit: AuditPort;
  id: { uuid: () => string };
  clock: { nowISO: () => string };
};

export type CreateUserInput = {
  tenant_id: string;
  actor_id?: string;
  correlation_id?: string;
  email: string;
  name: string;
};

export async function createUser(
  deps: CreateUserDeps,
  input: CreateUserInput
): Promise<KernelUser> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();

  // 1. Validate email uniqueness
  const existing = await deps.users.findByEmail({
    tenant_id: input.tenant_id,
    email
  });

  if (existing) {
    await deps.audit.append({
      tenant_id: input.tenant_id,
      actor_id: input.actor_id,
      action: "kernel.iam.user.create",
      resource: `user:${email}`,
      result: "FAIL",
      correlation_id: input.correlation_id || "none",
      payload: { reason: "EMAIL_EXISTS" },
    });
    throw new Error("EMAIL_EXISTS");
  }

  // 2. Create user
  const now = deps.clock.nowISO();
  const user: KernelUser = {
    user_id: deps.id.uuid(),
    tenant_id: input.tenant_id,
    email,
    name,
    status: "ACTIVE",
    created_at: now,
    updated_at: now,
  };

  await deps.users.create(user);

  // 3. Append audit event
  await deps.audit.append({
    tenant_id: input.tenant_id,
    actor_id: input.actor_id,
    action: "kernel.iam.user.create",
    resource: `user:${user.user_id}`,
    result: "OK",
    correlation_id: input.correlation_id || "none",
    payload: {
      user_id: user.user_id,
      email: user.email
    },
  });

  return user;
}
