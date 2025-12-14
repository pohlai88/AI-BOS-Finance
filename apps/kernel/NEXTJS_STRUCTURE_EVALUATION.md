# Next.js MCP Planning Scaffold - Structure Evaluation

**Date:** 2025-12-12  
**Status:** ✅ **Structure is CORRECT** | ⚠️ **Migration Required**

---

## 🎯 Executive Summary

**The folder structure in PRD-KERNEL.md is CORRECT for Next.js App Router.**

The `apps/kernel/app/` structure is **NOT redundant** - it's the **required Next.js convention**. The `app/` directory is a special folder that Next.js uses for file-system routing.

---

## ✅ Why `apps/kernel/app/` is CORRECT

### Next.js App Router Requirement

According to Next.js documentation:
- The `app/` directory **MUST** exist at the project root
- It's a **special folder** used by Next.js for routing
- It's **NOT** just a regular folder - it's a framework convention

**Example from your existing `apps/web` (which is correct):**
```
apps/web/
├─ app/              ← ✅ REQUIRED by Next.js
│  ├─ layout.tsx
│  ├─ page.tsx
│  ├─ dashboard/
│  └─ api/
```

**Proposed structure in PRD (also correct):**
```
apps/kernel/
├─ app/              ← ✅ REQUIRED by Next.js (same pattern)
│  ├─ layout.tsx
│  ├─ page.tsx
│  ├─ admin/
│  └─ api/
```

### Comparison: Current vs Proposed

| Aspect | Current (`apps/kernel`) | Proposed (PRD) | Status |
|--------|------------------------|-----------------|--------|
| Framework | Hono (Express-like) | Next.js App Router | ⚠️ Migration needed |
| Structure | `src/routes/` | `app/api/` | ✅ Correct for Next.js |
| Routing | Manual route definitions | File-system routing | ✅ Better DX |

---

## 📁 Detailed Structure Analysis

### ✅ CORRECT Elements in PRD Structure

1. **`apps/kernel/app/`** - ✅ REQUIRED
   - This is the App Router root
   - Next.js automatically recognizes this folder
   - **NOT redundant** - it's a framework requirement

2. **`apps/kernel/app/api/`** - ✅ CORRECT
   - Route handlers go here
   - Files like `route.ts` create API endpoints
   - Example: `app/api/kernel/tenants/route.ts` → `/api/kernel/tenants`

3. **`apps/kernel/app/(shell)/`** - ✅ CORRECT
   - Route groups (parentheses don't create URL segments)
   - Used for shared layouts without affecting routing
   - Good pattern for UI shell

4. **`apps/kernel/middleware.ts`** - ✅ CORRECT
   - Edge middleware at project root
   - Runs before requests reach `app/`
   - Perfect for correlation ID injection

5. **`apps/kernel/src/server/`** - ✅ CORRECT
   - Server-only code (DI container, utilities)
   - Separated from `app/` (which is routing)
   - Follows hexagonal architecture

### ⚠️ Potential Issues to Address

1. **Migration from Hono to Next.js**
   - Current: `src/routes/*.ts` (Hono routes)
   - Proposed: `app/api/*/route.ts` (Next.js Route Handlers)
   - **Action:** Need migration plan

2. **`src/` vs `app/` Separation**
   - ✅ GOOD: `app/` = routing (Next.js convention)
   - ✅ GOOD: `src/` = business logic (hexagonal architecture)
   - **This separation is CORRECT and follows best practices**

3. **Package Structure**
   - ✅ `packages/kernel-core/` - Pure domain (no Next.js)
   - ✅ `packages/kernel-adapters/` - DB/EventBus adapters
   - ✅ `packages/contracts/` - Schema-first SSOT
   - **All correct for hexagonal architecture**

---

## 🔍 Comparison with Existing `apps/web`

Your existing `apps/web` already follows this pattern correctly:

```
apps/web/
├─ app/                    ← ✅ Next.js App Router
│  ├─ layout.tsx
│  ├─ page.tsx
│  ├─ dashboard/
│  ├─ canon/
│  └─ ...
├─ src/                    ← ✅ Business logic
│  └─ components/
├─ middleware.ts           ← ✅ Edge middleware
└─ next.config.mjs
```

**The PRD structure matches this pattern exactly!** ✅

---

## 🚨 What the User Might Be Confused About

### Misconception: "Folder within folder is wrong"

**Reality:** In Next.js, `app/` is a **special framework folder**, not just a regular directory.

**Analogy:**
- `node_modules/` = special folder for npm
- `.next/` = special folder for Next.js build
- `app/` = special folder for Next.js routing

**It's not redundant - it's required!**

### Why It Looks "Nested"

```
apps/kernel/          ← Project root (monorepo app)
  └─ app/             ← Next.js App Router (framework requirement)
```

This is **standard Next.js structure** in a monorepo. Every Next.js app needs `app/` at its root.

---

## ✅ Recommended Structure (Final)

```
apps/kernel/
├─ app/                          # ✅ Next.js App Router (REQUIRED)
│  ├─ (shell)/                   # Route group (no URL segment)
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ admin/                     # Frontend pages
│  │  ├─ tenants/page.tsx
│  │  └─ users/page.tsx
│  ├─ api/                       # API Route Handlers
│  │  ├─ kernel/
│  │  │  ├─ tenants/route.ts
│  │  │  └─ users/invite/route.ts
│  │  └─ gateway/[...path]/route.ts
│  ├─ _components/              # Private folder (underscore = not a route)
│  ├─ _styles/
│  └─ _providers/
├─ src/                          # ✅ Business logic (separate from routing)
│  ├─ server/                    # Server-only utilities
│  │  ├─ container.ts
│  │  ├─ auth.ts
│  │  └─ policy.ts
│  └─ client/                    # Client helpers
├─ middleware.ts                 # ✅ Edge middleware
├─ next.config.ts
└─ package.json
```

**This structure is CORRECT and follows Next.js best practices!** ✅

---

## 🎯 Action Items

### 1. ✅ Structure is Correct - No Changes Needed
The PRD structure is **100% correct** for Next.js App Router.

### 2. ⚠️ Migration Required
- Current: Hono framework (`src/routes/`)
- Target: Next.js App Router (`app/api/`)
- **Action:** Create migration plan from Hono → Next.js

### 3. 📝 Clarification for Team
- Document that `app/` is a **Next.js framework requirement**
- It's not "folder within folder" - it's the **App Router convention**
- Reference `apps/web` as an example (already using this pattern)

---

## 📚 References

- [Next.js App Router Documentation](https://nextjs.org/docs/app/building-your-application/routing)
- Your existing `apps/web` structure (already correct)
- Next.js file conventions: `app/` is required for App Router

---

## ✅ Final Verdict

**The PRD structure is CORRECT. The `apps/kernel/app/` pattern is the standard Next.js App Router structure.**

**No structural changes needed.** The only work is migrating from Hono to Next.js Route Handlers.

---

**Report Generated:** 2025-12-12  
**Status:** ✅ **Structure Validated** | ⚠️ **Migration Planning Required**
