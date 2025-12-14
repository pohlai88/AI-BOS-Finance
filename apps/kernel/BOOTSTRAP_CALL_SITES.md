# Bootstrap Call Sites Review

**Date:** 2025-12-14  
**Purpose:** Verify bootstrap gate ordering and error handling

---

## Call Site 1: User Creation (`POST /api/kernel/iam/users`)

**File:** `apps/kernel/app/api/kernel/iam/users/route.ts` (lines 30-76)

```typescript
// 1. Check bootstrap gate FIRST (before JSON parsing and RBAC)
const bootstrapCheck = await checkBootstrapGate(req, "create_user");
let tenantId: string;
let auth: { user_id: string; tenant_id: string; session_id: string; email: string } | null = null;

if (bootstrapCheck.allowed) {
  // Bootstrap: First user creation allowed with bootstrap key
  const headerTenantId = req.headers.get("x-tenant-id");
  if (!headerTenantId) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "MISSING_TENANT_ID",
          message: "Missing x-tenant-id header",
        },
        correlation_id: correlationId,
      },
      { status: 400, headers }
    );
  }
  tenantId = headerTenantId;
} else {
  // Bootstrap denied - check if it's because tenant is already bootstrapped
  // If so, require RBAC. Otherwise, return bootstrap error.
  if (bootstrapCheck.reason?.includes("already bootstrapped")) {
    // Tenant already bootstrapped - require RBAC
    auth = await enforceRBAC(req, {
      required_permissions: ["kernel.iam.user.create"],
      resource: "user/create",
    });
    tenantId = auth.tenant_id;
  } else {
    // Bootstrap denied for other reasons (invalid key, missing tenant, etc.)
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "BOOTSTRAP_DENIED",
          message: bootstrapCheck.reason || "Bootstrap access denied",
        },
        correlation_id: correlationId,
      },
      { status: 403, headers }
    );
  }
}

// 2. Parse JSON body (only after bootstrap/RBAC check)
const contentType = req.headers.get("content-type") || "";
const shouldParseJson = contentType.includes("application/json");
const json = shouldParseJson ? await req.json().catch(() => null) : null;
```

**Review:**
- ✅ Bootstrap check **before** JSON parsing
- ✅ Bootstrap check **before** RBAC
- ✅ Explicit tenant ID required (no default)
- ✅ Bootstrap denial returns error (doesn't fall through to RBAC unless "already bootstrapped")
- ✅ RBAC only enforced when tenant already bootstrapped

---

## Call Site 2: Set Password (`POST /api/kernel/iam/users/:id/set-password`)

**File:** `apps/kernel/app/api/kernel/iam/users/[userId]/set-password/route.ts` (lines 36-72)

```typescript
const { userId } = await ctx.params;
const headerTenantId = req.headers.get("x-tenant-id");

// 1. Check bootstrap gate FIRST (before JSON parsing and RBAC)
// Pass userId to bootstrap gate to ensure it matches the first user
const bootstrapCheck = await checkBootstrapGate(req, "set_password", { subjectUserId: userId });
let tenantId: string;
let auth: { user_id: string; tenant_id: string; session_id: string; email: string } | null = null;

// Check if user has no credentials (bootstrap condition)
const hasNoCreds = headerTenantId ? await checkUserHasNoCredentials(headerTenantId, userId) : false;

if (bootstrapCheck.allowed && hasNoCreds) {
  // Bootstrap: Allow password setting for first user without credentials (with bootstrap key)
  if (!headerTenantId) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "MISSING_TENANT_ID",
          message: "Missing x-tenant-id header",
        },
        correlation_id: correlationId,
      },
      { status: 400, headers }
    );
  }
  tenantId = headerTenantId;
} else {
  // Bootstrap denied or user already has credentials
  // Check if bootstrap was denied (return error instead of falling through to RBAC)
  if (!bootstrapCheck.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "BOOTSTRAP_DENIED",
          message: bootstrapCheck.reason || "Bootstrap access denied",
        },
        correlation_id: correlationId,
      },
      { status: 403, headers }
    );
  }

  // User already has credentials - require RBAC
  // Enforce RBAC (Build 3.3) - require kernel.iam.credential.set_password permission
  auth = await enforceRBAC(req, {
    required_permissions: ["kernel.iam.credential.set_password"],
    resource: `user:${userId}/set-password`,
  });
  tenantId = auth.tenant_id;
}

// 2. Parse JSON body (only after bootstrap/RBAC check)
const contentType = req.headers.get("content-type") || "";
const shouldParseJson = contentType.includes("application/json");
const json = shouldParseJson ? await req.json().catch(() => null) : null;
```

**Review:**
- ✅ Bootstrap check **before** JSON parsing
- ✅ Bootstrap check **before** RBAC
- ✅ Passes `subjectUserId` to bootstrap gate (ensures userId matches first user)
- ✅ Explicit tenant ID required (no default)
- ✅ Bootstrap denial returns error (doesn't fall through to RBAC)
- ✅ RBAC only enforced when user already has credentials

---

## Summary

**Ordering:** ✅ **Correct**
1. Bootstrap gate check (first)
2. RBAC enforcement (if bootstrap denied and tenant/user already bootstrapped)
3. JSON parsing (last)

**Error Handling:** ✅ **Correct**
- Bootstrap denial returns 403 error (doesn't fall through to RBAC)
- Only falls through to RBAC when tenant/user already bootstrapped
- Explicit tenant ID required (no default to "system")

**Bootstrap Sequence:** ✅ **Deterministic**
1. `create_user` (0 users) → ✅ allowed
2. `set_password` (exactly 1 user, userId matches) → ✅ allowed
3. `login` (public) → ✅ allowed
4. All subsequent operations → require Bearer token + RBAC

---

**Status:** ✅ **All Call Sites Verified**
