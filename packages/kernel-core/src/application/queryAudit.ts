/**
 * Query Audit Use-Case
 * 
 * Application logic for querying audit events.
 * Supports filtering by multiple criteria and pagination.
 * 
 * Anti-Gravity:
 * - No framework imports
 * - No adapter imports
 * - Dependencies injected via `deps` parameter
 */

import type { AuditPort, AuditQueryInput, AuditQueryOutput } from "../ports/auditPort.ts";

export interface QueryAuditDeps {
  audit: AuditPort;
}

/**
 * Query audit events
 * 
 * Flow:
 * 1. Validate input (limit bounds, required fields)
 * 2. Query audit store with filters
 * 3. Return paginated results
 * 
 * @param deps - Dependencies (audit)
 * @param input - Query filters
 * @returns AuditQueryOutput
 */
export async function queryAudit(
  deps: QueryAuditDeps,
  input: AuditQueryInput
): Promise<AuditQueryOutput> {
  // Validate limit bounds
  const limit = Math.min(Math.max(1, input.limit || 50), 200);

  // Validate offset
  const offset = Math.max(0, input.offset || 0);

  // Query with validated input
  return deps.audit.query({
    ...input,
    limit,
    offset,
  });
}
