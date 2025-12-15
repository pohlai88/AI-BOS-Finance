# Supabase Adapter

> **Purpose:** Supabase-specific database & storage optimizations  
> **Status:** ✅ **DEPLOYED** (Applied to Supabase project)  
> **Provider:** [Supabase](https://supabase.com)  
> **Project:** `https://cnlutbuzjqtuicngldak.supabase.co`

---

## 📋 Overview

This adapter contains Supabase-specific migrations and configurations that enable:

1. **Row Level Security (RLS)** - Required for Supabase Data API
2. **RLS Policies** - Tenant isolation using `auth.uid()` and `service_role`
3. **Performance Indexes** - Optimized for RLS policy evaluation
4. **Storage Buckets** - Configured with tenant-aware RLS policies
5. **Supabase Auth Integration** - Permission-based access control

---

## 🚀 Quick Start

### Prerequisites

1. ✅ Core migrations applied (`pnpm migrate`)
2. ✅ Supabase project created
3. ✅ Environment variables configured

### Apply Adapter

```bash
# Option 1: Auto-detect provider from DATABASE_URL
pnpm db:apply-adapter

# Option 2: Explicitly specify Supabase
pnpm db:apply-adapter --provider supabase

# Option 3: Via Supabase MCP (recommended)
# Use apply_migration tool for each file
```

---

## 📁 Files

| File | Purpose | Status |
|------|---------|--------|
| `001_enable_rls.sql` | Enable RLS on all tables | ✅ Applied |
| `002_rls_policies.sql` | Create tenant isolation policies | ✅ Applied |
| `003_performance.sql` | Indexes for RLS performance | ✅ Applied |
| `004_storage_buckets.sql` | Storage bucket configuration | ✅ Applied |
| `config.ts` | TypeScript configuration utilities | ✅ Ready |
| `types.generated.ts` | Auto-generated TypeScript types | ✅ Generated |
| `STORAGE-SETUP-GUIDE.md` | Storage bucket setup instructions | ✅ Ready |

---

## 🔐 Security Model

### Authentication Flow

```
User Login (Supabase Auth)
    ↓
auth.uid() → kernel.users.id
    ↓
kernel.users.tenant_id
    ↓
RLS Policy: WHERE tenant_id = get_current_tenant_id()
```

### Role Mapping

| Supabase Role | AI-BOS Usage | Access Level |
|---------------|--------------|--------------|
| `anon` | Unauthenticated | No data access |
| `authenticated` | Logged-in users | Tenant-scoped via RLS |
| `service_role` | Backend services | Full bypass (use carefully!) |

### Permission System

RLS policies check user permissions for sensitive operations:

```sql
-- Example: Creating transactions requires PAYMENT_CREATE permission
public.user_has_permission('PAYMENT_CREATE')
```

| Permission | Required For |
|------------|--------------|
| `PAYMENT_CREATE` | Creating transactions |
| `PAYMENT_APPROVE` | Approving transactions |
| `JOURNAL_VIEW` | Viewing journal entries |
| `JOURNAL_POST` | Posting journal entries |
| `REPORT_VIEW` | Viewing/downloading reports |

---

## 📦 Storage Configuration

### Buckets

| Bucket | Public | Max Size | Use Case |
|--------|--------|----------|----------|
| `tenant-documents` | ❌ Private | 50MB | Invoices, receipts, contracts |
| `payment-files` | ❌ Private | 100MB | Bank statements, batch files |
| `journal-attachments` | ❌ Private | 25MB | Journal supporting docs |
| `reports` | ❌ Private | 100MB | Generated reports |
| `public-assets` | ✅ Public | 5MB | Logos, public images |

### Path Convention

Storage paths follow tenant isolation pattern:

```
{tenant_id}/{document_type}/{filename}
{tenant_id}/{company_id}/{document_type}/{filename}
```

Example:
```
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/invoices/INV-2024-001.pdf
```

### Upload Example (TypeScript)

```typescript
import { createClient } from '@supabase/supabase-js';
import { buildStoragePath } from './adapters/supabase/config';

const supabase = createClient(url, anonKey);

// Build tenant-aware path
const path = buildStoragePath(
  tenantId,
  'invoices',
  'INV-2024-001.pdf'
);

// Upload with RLS enforcement
const { data, error } = await supabase.storage
  .from('tenant-documents')
  .upload(path, file);
```

---

## ⚡ Performance Optimizations

### RLS-Optimized Indexes

These indexes accelerate RLS policy evaluation:

```sql
-- Fast user→tenant lookup (critical for get_current_tenant_id())
idx_kernel_users_id_tenant ON kernel.users(id, tenant_id)

-- Fast permission checks
idx_kernel_role_permissions_lookup ON kernel.role_permissions(role_id, permission_code)
```

### Query Statistics

Extended statistics are set on `tenant_id` columns:

```sql
ALTER TABLE finance.transactions ALTER COLUMN tenant_id SET STATISTICS 1000;
```

### Partial Indexes

Common query patterns use partial indexes:

```sql
-- Only active companies
idx_finance_companies_active WHERE status = 'active'

-- Only pending transactions
idx_finance_transactions_pending WHERE status = 'PENDING_APPROVAL'
```

---

## 🔧 Environment Variables

Required for Supabase deployment:

```env
# Public (safe for client-side)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...

# Private (server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres

# Optional: Connection pooler (recommended for serverless)
DATABASE_POOLER_URL=postgresql://postgres:xxx@xxx-pooler.supabase.co:6543/postgres
```

---

## ✅ Verification

After applying the adapter, verify:

### 1. Check RLS Status

```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname IN ('kernel', 'finance', 'config');
-- All should show rowsecurity = true
```

### 2. Run Security Advisors

```
get_advisors({ type: "security" })
```

Expected: No RLS-related warnings

### 3. Test Tenant Isolation

```sql
-- As authenticated user, should only see own tenant data
SELECT * FROM finance.companies;
```

### 4. Create Storage Buckets (Manual Step)

Storage buckets must be created via **Supabase Dashboard → Storage**:

| Bucket | Public | Max Size | MIME Types |
|--------|--------|----------|------------|
| `tenant-documents` | ❌ | 50 MB | PDF, images, Excel, CSV |
| `payment-files` | ❌ | 100 MB | PDF, CSV, XML, Excel |
| `journal-attachments` | ❌ | 25 MB | PDF, images |
| `reports` | ❌ | 100 MB | PDF, CSV, Excel, JSON |
| `public-assets` | ✅ | 5 MB | Images only |

**RLS policies for storage are already applied!**

See: [STORAGE-SETUP-GUIDE.md](./STORAGE-SETUP-GUIDE.md) for detailed instructions

---

## ⚠️ Supabase-Specific Features

These features are **NOT portable** to other PostgreSQL providers:

| Feature | PostgreSQL Standard | Notes |
|---------|---------------------|-------|
| `auth.uid()` | ❌ No | Supabase Auth function |
| `auth.jwt()` | ❌ No | Supabase Auth function |
| `service_role` | ❌ No | Supabase built-in role |
| `authenticated` | ❌ No | Supabase built-in role |
| `anon` | ❌ No | Supabase built-in role |
| Storage RLS | ❌ No | Supabase Storage schema |

---

## 📚 References

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [RLS Performance Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security#rls-performance-recommendations)
- [ADR-003: Database Provider Portability](../ADR_003_DatabaseProviderPortability.md)

---

## 🔄 Migration Order

Apply in this order:

1. **Core Migrations** (`pnpm migrate`) - PostgreSQL-standard
2. **Adapter Migrations** (`pnpm db:apply-adapter`) - Supabase-specific

Never apply adapter migrations before core migrations!

---

**Last Updated:** 2025-01-27  
**Maintainer:** AI-BOS Data Fabric Team
