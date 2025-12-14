# Bootstrap Gate Security Review

**Date:** 2025-12-14  
**File:** `apps/kernel/src/server/bootstrap.ts`

---

## Bootstrap Gate Block (for Review)

```typescript
export async function checkBootstrapGate(
  req: NextRequest,
  endpoint: "create_user" | "set_password" | "login"
): Promise<BootstrapCheckResult> {
  // Login is always public (no bootstrap check needed)
  if (endpoint === "login") {
    return { allowed: true };
  }

  // Get bootstrap key from environment
  const expectedBootstrapKey = process.env.KERNEL_BOOTSTRAP_KEY;
  if (!expectedBootstrapKey) {
    return { allowed: false, reason: "Bootstrap key not configured" };
  }

  // Check bootstrap key header
  const providedKey = req.headers.get("x-kernel-bootstrap-key");
  if (providedKey !== expectedBootstrapKey) {
    return { allowed: false, reason: "Invalid bootstrap key" };
  }

  // Check if tenant is already bootstrapped
  const tenantId = req.headers.get("x-tenant-id") || "system";
  const container = getKernelContainer();
  
  try {
    const existingUsers = await container.userRepo.list({
      tenant_id: tenantId,
      limit: 1,
      offset: 0,
    });

    if (existingUsers.total > 0) {
      return { allowed: false, reason: "Tenant already bootstrapped" };
    }

    return { allowed: true };
  } catch (err) {
    // If check fails, deny bootstrap (fail closed)
    return { allowed: false, reason: `Bootstrap check failed: ${err instanceof Error ? err.message : String(err)}` };
  }
}
```

---

## Security Review

### ✅ 1. Accidental Permanent Public Access

**Check:** Is there any path where bootstrap remains open after tenant is bootstrapped?

**Analysis:**
- ✅ Bootstrap check runs **before** every request (not cached)
- ✅ Tenant bootstrapped check: `existingUsers.total > 0` → deny
- ✅ Bootstrap key required: No key → deny
- ✅ Fail-closed: Exception in check → deny

**Verdict:** ✅ **No permanent public access** - Bootstrap gate closes after first user is created.

---

### ✅ 2. Tenant Cross-Bootstrapping

**Check:** Can Tenant A bootstrap Tenant B?

**Analysis:**
- ✅ Tenant ID comes from **header** (`x-tenant-id`)
- ✅ User list query scoped by `tenant_id: tenantId`
- ✅ Bootstrap check uses header tenant_id (not JWT)
- ⚠️ **Risk:** Header can be spoofed, but this is acceptable for bootstrap (admin operation)

**Mitigation:**
- Bootstrap key is required (acts as admin credential)
- Bootstrap only works when tenant has **zero users**
- After bootstrap, all operations require RBAC (JWT-based tenant_id)

**Verdict:** ✅ **Tenant isolation maintained** - Bootstrap uses header tenant_id, but:
- Requires bootstrap key (admin credential)
- Only works when tenant is empty
- Post-bootstrap uses JWT tenant_id (authoritative)

---

### ✅ 3. Bootstrap Key Security

**Check:** Is bootstrap key properly protected?

**Analysis:**
- ✅ Key stored in environment variable (`KERNEL_BOOTSTRAP_KEY`)
- ✅ Key comparison: `providedKey !== expectedBootstrapKey` (constant-time would be better, but acceptable for MVP)
- ✅ No key configured → deny (fail closed)

**Recommendation for Production:**
- Use constant-time comparison: `crypto.timingSafeEqual()` for key comparison
- Rotate bootstrap key after initial setup
- Log bootstrap attempts (for audit)

**Verdict:** ✅ **Acceptable for MVP** - Key-based protection is sufficient.

---

### ✅ 4. Race Condition Protection

**Check:** Can two simultaneous bootstrap requests both succeed?

**Analysis:**
- ⚠️ **Potential race:** Two requests check `existingUsers.total === 0` simultaneously
- Both could pass check, both create users
- **Impact:** Low - Both users would be created (acceptable for bootstrap)

**Mitigation:**
- Bootstrap is a one-time operation (admin setup)
- Race condition only affects first user creation
- Subsequent operations require RBAC

**Verdict:** ⚠️ **Acceptable for MVP** - Race condition exists but low impact. For production, consider:
- Database-level unique constraint on tenant_id
- Transaction-based bootstrap check

---

### ✅ 5. Error Handling

**Check:** Does bootstrap gate fail closed?

**Analysis:**
- ✅ Exception in user list query → deny
- ✅ No bootstrap key configured → deny
- ✅ Invalid bootstrap key → deny
- ✅ Tenant already bootstrapped → deny

**Verdict:** ✅ **Fail-closed** - All error paths deny bootstrap.

---

## Summary

**Security Status:** ✅ **Secure for MVP**

**Findings:**
1. ✅ No permanent public access
2. ✅ Tenant isolation maintained (with acceptable header-based bootstrap)
3. ✅ Bootstrap key protection adequate
4. ⚠️ Race condition exists but low impact
5. ✅ Fail-closed error handling

**Recommendations for Production:**
1. Use constant-time key comparison (`crypto.timingSafeEqual()`)
2. Add database-level unique constraint for tenant bootstrap
3. Log bootstrap attempts for audit
4. Rotate bootstrap key after initial setup

---

**Bootstrap Gate Status:** ✅ **Approved for Build 3.3**
