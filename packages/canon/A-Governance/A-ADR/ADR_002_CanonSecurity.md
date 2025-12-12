> **🟢 [ACTIVE]** — Architectural Decision  
> **Canon Code:** ADR_002  
> **Status:** Accepted  
> **Date:** 2025-12-11  
> **Context:** Security & Validation  
> **Supersedes:** N/A  
> **Related:** CONT_01 (Canon Identity Contract), ADR_001 (Next.js App Router)

---

# ADR_002: Server-Side Canon Context Verification

## Status

**Accepted** — 2025-12-11

---

## Context

Client-side `CanonContext` payloads are **untrusted input**. A malicious user could:

1. Intercept API requests
2. Change `schemaCode` (e.g., `SCH_101` → `SCH_000`) to bypass validation
3. Swap `policyCode` to use a less restrictive policy
4. Manipulate `cellId` to access unauthorized cells

This poses a **critical security risk** in enterprise environments.

---

## Decision

We will derive Schema and Policy codes from the **Server Registry** using `PageCode` + `TabCode`, rather than trusting client-provided values.

### Security Pattern

1. **Authenticate** the user
2. **Derive** cell config from `pageCode` + `tabCode` (server-side lookup from registry)
3. **Verify** client's `schemaCode` matches server's expected schema
4. **Check** user permissions for the policy
5. **Use** server-derived config, not client-provided values

### Implementation

```typescript
// lib/canon/verifyCanonContext.ts

export async function verifyCanonContext(
  clientCanon: CanonContext,
  session: Session
): Promise<{ valid: boolean; serverConfig?: CellConfig; error?: string }> {
  // 1. Derive from server registry (don't trust client)
  const serverConfig = await getCellConfig(
    clientCanon.pageCode,
    clientCanon.tabCode
  );
  
  if (!serverConfig) {
    return { valid: false, error: 'Invalid cell configuration' };
  }
  
  // 2. Verify schema matches
  if (clientCanon.schemaCode && clientCanon.schemaCode !== serverConfig.schemaCode) {
    logSecurityWarning('Schema mismatch', {
      client: clientCanon.schemaCode,
      expected: serverConfig.schemaCode,
      userId: session.user.id,
    });
    return { valid: false, error: 'Schema mismatch' };
  }
  
  // 3. Check permissions
  const hasPermission = await checkPolicyPermission(
    session.user,
    serverConfig.policyCodes[0]
  );
  
  if (!hasPermission) {
    return { valid: false, error: 'Insufficient permissions' };
  }
  
  return { valid: true, serverConfig };
}
```

---

## Consequences

### Positive

- ✅ **Security:** Prevents schema swapping attacks
- ✅ **Audit Trail:** Security warnings logged for mismatch attempts
- ✅ **Permission Enforcement:** User permissions checked against policy
- ✅ **Tamper-Proof:** Server derives config, not client

### Negative

- ⚠️ **Performance:** Requires server-side registry lookup on every request
- ⚠️ **Complexity:** Additional verification layer

### Mitigations

- Cache registry in memory (reload on `canon:sync`)
- Use Redis for distributed caching in multi-instance deployments

---

## Applies To

1. **Route Handlers:** `app/api/**/route.ts`
2. **Server Actions:** `*.actions.ts` files
3. **Any backend endpoint** receiving `CanonContext`

---

## Security Principle

> **🔴 Never trust CanonContext from the client.**  
> **Always derive & verify from server-side registry.**

---

## References

- **CONT_01:** Section 8.1 (Security: CanonContext Validation)
- **OWASP:** Input Validation Cheat Sheet
- **ADR_001:** Next.js App Router adoption (Route Handlers)

---

**End of ADR**

