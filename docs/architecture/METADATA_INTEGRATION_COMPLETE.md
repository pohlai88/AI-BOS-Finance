# Metadata Studio - Full Integration Complete

> **Date:** 2025-12-16  
> **Status:** ✅ COMPLETE  
> **Version:** 1.0.0

---

## Executive Summary

The Metadata Studio system is now a **fully functional, integrated component** with:

- ✅ **Auth Integration** - Cookie-based JWT + dev fallbacks
- ✅ **GRCD Enforcement** - Lite/Governed mode toggle with violation recording
- ✅ **Standard Packs API** - Full CRUD for regulatory anchors
- ✅ **HITL Workflow** - Approval/rejection for remediations
- ✅ **React Hooks** - Type-safe SWR-based data fetching
- ✅ **BFF Layer** - Secure proxy between browser and backend

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  META Pages (React)                                                  │   │
│  │  └── useFields(), useGovernanceDashboard(), etc.                    │   │
│  │      └── bffClient.getFields()                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                           Same-origin (no CORS)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     NEXT.JS BFF (apps/web/app/api/meta/*)                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  backend.server.ts                                                   │   │
│  │  • Reads JWT from cookie (AUTH_COOKIE_NAME)                         │   │
│  │  • Decodes JWT to extract tenant_id, user_id                        │   │
│  │  • Injects auth headers to backend                                  │   │
│  │  • Supports dev overrides (DEV_TENANT_ID, DEV_USER_ID)              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                        X-Tenant-Id, X-User-Id, X-Role
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│               METADATA-STUDIO (apps/kernel/src/metadata-studio)             │
│                                                                             │
│  Routes:                                                                    │
│  ├── /api/meta/governance/* (dashboard, risks, health)                     │
│  ├── /api/meta/fields/*     (CRUD + mappings)                              │
│  ├── /api/meta/entities/*   (CRUD + tree)                                  │
│  ├── /api/meta/standard-packs/* (list + detail)                            │
│  └── /api/meta/violations/* (list + HITL approve/reject)                   │
│                                                                             │
│  GRCD Enforcement:                                                          │
│  ├── GRCD_MODE=lite     → Warn + record violation (default)                │
│  └── GRCD_MODE=governed → Block tier1/tier2 without standard_pack_id       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          POSTGRESQL                                         │
│  ├── mdm_global_metadata    (field definitions)                            │
│  ├── mdm_entity_catalog     (entity registry)                              │
│  ├── mdm_standard_pack      (regulatory anchors)                           │
│  ├── mdm_metadata_mapping   (system bindings)                              │
│  ├── mdm_violation_report   (GRCD violations)                              │
│  └── mdm_remediation_proposal (HITL approvals)                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Files Created/Modified

### Backend (apps/kernel/src/metadata-studio/)

| File | Purpose | Status |
|------|---------|--------|
| `api/meta-fields.routes.ts` | Field CRUD + GRCD enforcement | ✅ Updated |
| `api/meta-entities.routes.ts` | Entity CRUD + tree | ✅ Existing |
| `api/meta-governance.routes.ts` | Dashboard, risks, health | ✅ Existing |
| `api/meta-standard-packs.routes.ts` | Standard packs API | ✅ **NEW** |
| `api/meta-violations.routes.ts` | Violations + HITL workflow | ✅ **NEW** |
| `index.ts` | Route registration | ✅ Updated |

### BFF (apps/web/)

| File | Purpose | Status |
|------|---------|--------|
| `lib/backend.server.ts` | Server-only backend client | ✅ Updated |
| `lib/bff-client.ts` | Browser-safe client | ✅ Existing |
| `lib/hooks/use-metadata.ts` | React SWR hooks | ✅ **NEW** |
| `lib/hooks/index.ts` | Hook exports | ✅ **NEW** |
| `app/api/meta/standard-packs/route.ts` | BFF route | ✅ **NEW** |
| `app/api/meta/violations/route.ts` | BFF route | ✅ **NEW** |

---

## Environment Variables

### BFF (.env.local in apps/web)

```env
# Backend URLs (server-side only)
METADATA_STUDIO_URL=http://localhost:8787
KERNEL_URL=http://localhost:3001

# Auth Configuration
AUTH_COOKIE_NAME=kernel-jwt
DEFAULT_TENANT_ID=default

# Development Overrides (optional)
DEV_TENANT_ID=your-dev-tenant-id
DEV_USER_ID=your-dev-user-id
DEV_USER_ROLE=metadata_steward
```

### Backend (.env in apps/kernel)

```env
# GRCD Enforcement Mode
GRCD_MODE=lite   # or 'governed' for production

# Database
DATABASE_URL=postgresql://...
```

---

## Usage Examples

### 1. Using React Hooks (Recommended)

```tsx
'use client';

import { useFields, useCreateField } from '@/lib/hooks/use-metadata';

export function FieldsList() {
  // Fetch with SWR (caching, revalidation, etc.)
  const { data, error, isLoading } = useFields({
    domain: 'finance',
    tier: 'tier1',
  });

  // Mutation with optimistic updates
  const { trigger: createField, isMutating } = useCreateField();

  const handleCreate = async () => {
    await createField({
      entity_urn: 'finance.journal_entries',
      field_name: 'amount',
      label: 'Amount',
      tier: 'tier1',
      standard_pack_id: 'IFRS_15',
    });
  };

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      {data?.data.map(field => (
        <FieldCard key={field.id} field={field} />
      ))}
    </div>
  );
}
```

### 2. Using BFF Client Directly

```tsx
'use client';

import bffClient from '@/lib/bff-client';

// In an event handler or effect
const dashboard = await bffClient.getGovernanceDashboard();
const fields = await bffClient.getFields({ tier: 'tier2' });
```

### 3. GRCD Enforcement

```bash
# Development (default) - Allow with warning
GRCD_MODE=lite npm run dev

# Production - Block violations
GRCD_MODE=governed npm run start
```

When a tier1/tier2 field is created without `standard_pack_id`:

- **Lite Mode**: Creates field + logs warning + records violation in DB
- **Governed Mode**: Returns 400 error, field not created

---

## API Reference

### Governance

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/meta/governance/dashboard` | GET | Dashboard stats + systems |
| `/api/meta/governance/risks` | GET | Risk radar violations |
| `/api/meta/governance/health` | GET | Standard pack coverage |

### Fields

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/meta/fields` | GET | List fields (paginated) |
| `/api/meta/fields` | POST | Create field |
| `/api/meta/fields/:id` | GET | Get single field |
| `/api/meta/fields/:key/mappings` | GET | Field system mappings |

### Entities

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/meta/entities` | GET | List entities |
| `/api/meta/entities` | POST | Create entity |
| `/api/meta/entities/tree` | GET | Entity hierarchy |
| `/api/meta/entities/:urn` | GET | Get single entity |

### Standard Packs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/meta/standard-packs` | GET | List standard packs |
| `/api/meta/standard-packs/:packId` | GET | Get single pack |

### Violations & HITL

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/meta/violations` | GET | List violations |
| `/api/meta/violations/:id` | GET | Get violation + proposal |
| `/api/meta/violations/:id/ignore` | POST | Ignore violation |
| `/api/meta/violations/remediations/list` | GET | List pending proposals |
| `/api/meta/violations/remediations/:id/approve` | POST | Approve proposal |
| `/api/meta/violations/remediations/:id/reject` | POST | Reject proposal |
| `/api/meta/violations/remediations/:id/apply` | POST | Apply approved fix |

---

## Migration from kernel-client

Replace direct kernel-client calls:

```tsx
// ❌ Old approach (exposes backend URL)
import { kernelClient } from '@/src/lib/kernel-client';
const response = await kernelClient.searchMetadataFields({ q: '' });

// ✅ New approach (via BFF)
import { useFields } from '@/lib/hooks/use-metadata';
const { data } = useFields({ q: '' });

// Or without hooks:
import bffClient from '@/lib/bff-client';
const response = await bffClient.getFields({ q: '' });
```

---

## Testing

### Local Development

```bash
# 1. Start metadata-studio backend
cd apps/kernel
npm run dev:metadata-studio  # Port 8787

# 2. Start Next.js
cd apps/web
npm run dev  # Port 3000

# 3. Test BFF routes
curl http://localhost:3000/api/meta/governance/dashboard
curl http://localhost:3000/api/meta/fields
```

### GRCD Enforcement Test

```bash
# Create tier1 field without standard_pack_id
curl -X POST http://localhost:3000/api/meta/fields \
  -H "Content-Type: application/json" \
  -d '{"entity_urn":"test.table","field_name":"amount","label":"Amount","tier":"tier1"}'

# Lite Mode: Returns 201 + logs warning
# Governed Mode: Returns 400 + error message
```

---

## Success Criteria

| Criteria | Status |
|----------|--------|
| Auth via cookies (not exposed to browser) | ✅ |
| GRCD enforcement with mode toggle | ✅ |
| Violations recorded to database | ✅ |
| HITL approval workflow | ✅ |
| Standard packs API | ✅ |
| React hooks with SWR | ✅ |
| Type-safe BFF client | ✅ |
| Same-origin requests (no CORS) | ✅ |

---

## Next Steps (Optional Enhancements)

1. **NextAuth Integration** - Replace cookie-based JWT with NextAuth session
2. **Rate Limiting** - Add Upstash Redis rate limiting to BFF
3. **OpenAPI Spec** - Generate OpenAPI from routes
4. **E2E Tests** - Playwright tests for full flow
5. **Real-time Updates** - WebSocket/SSE for violation notifications

---

*This document is part of the Canon Governance System.*
