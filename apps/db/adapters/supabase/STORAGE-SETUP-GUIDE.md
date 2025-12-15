# Supabase Storage Setup Guide

> **Purpose:** Step-by-step guide to configure Supabase Storage with RLS  
> **Reference:** [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)

---

## 📋 Overview

Supabase Storage offers three bucket types:

| Type | Use Case |
|------|----------|
| **Files Buckets** | Traditional files (images, PDFs, documents) |
| **Analytics Buckets** | Apache Iceberg for data lakes |
| **Vector Buckets** | AI embeddings for similarity search |

For AI-BOS Finance, we use **Files Buckets** with tenant isolation via RLS.

---

## 🪣 Bucket Configuration

Create these buckets via **Supabase Dashboard → Storage**:

### 1. tenant-documents (Private)

| Setting | Value |
|---------|-------|
| **Name** | `tenant-documents` |
| **Public** | ❌ No (Private) |
| **File Size Limit** | 50 MB |
| **Allowed MIME Types** | `application/pdf`, `image/png`, `image/jpeg`, `image/webp`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/vnd.ms-excel`, `text/csv` |

**Use Case:** Invoices, receipts, contracts, financial documents

---

### 2. payment-files (Private)

| Setting | Value |
|---------|-------|
| **Name** | `payment-files` |
| **Public** | ❌ No (Private) |
| **File Size Limit** | 100 MB |
| **Allowed MIME Types** | `application/pdf`, `text/csv`, `text/plain`, `application/xml`, `text/xml`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |

**Use Case:** Bank statements, payment batch files, SWIFT files

---

### 3. journal-attachments (Private)

| Setting | Value |
|---------|-------|
| **Name** | `journal-attachments` |
| **Public** | ❌ No (Private) |
| **File Size Limit** | 25 MB |
| **Allowed MIME Types** | `application/pdf`, `image/png`, `image/jpeg`, `image/webp` |

**Use Case:** Journal entry supporting documentation

---

### 4. reports (Private)

| Setting | Value |
|---------|-------|
| **Name** | `reports` |
| **Public** | ❌ No (Private) |
| **File Size Limit** | 100 MB |
| **Allowed MIME Types** | `application/pdf`, `text/csv`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/json` |

**Use Case:** Generated financial reports, exports, statements

---

### 5. public-assets (Public)

| Setting | Value |
|---------|-------|
| **Name** | `public-assets` |
| **Public** | ✅ Yes (Public) |
| **File Size Limit** | 5 MB |
| **Allowed MIME Types** | `image/png`, `image/jpeg`, `image/svg+xml`, `image/webp`, `image/gif` |

**Use Case:** Company logos, public images, branding assets

---

## 🔐 RLS Policies

After creating buckets, apply these RLS policies via **SQL Editor** or **Policies tab**:

### Helper Function (Already Applied)

```sql
-- Extract tenant_id from storage path
CREATE OR REPLACE FUNCTION public.get_path_tenant_id(storage_path TEXT)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN (string_to_array(storage_path, '/'))[1]::UUID;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;
```

### Path Convention

All files follow this tenant-aware path structure:

```
{tenant_id}/{document_type}/{filename}
{tenant_id}/{company_id}/{document_type}/{filename}
```

**Examples:**
- `aaaaaaaa-1111-2222-3333-444444444444/invoices/INV-2024-001.pdf`
- `aaaaaaaa-1111-2222-3333-444444444444/bbbbbbbb-5555-6666-7777-888888888888/statements/2024-Q1.pdf`

---

### Storage RLS Policies (Apply via SQL Editor)

```sql
-- ============================================================================
-- TENANT-DOCUMENTS Bucket Policies
-- ============================================================================

-- SELECT: Users can only view documents from their tenant
CREATE POLICY "tenant_documents_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'tenant-documents'
    AND public.get_path_tenant_id(name) = public.get_current_tenant_id()
  );

-- INSERT: Users can upload documents to their tenant folder
CREATE POLICY "tenant_documents_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'tenant-documents'
    AND public.get_path_tenant_id(name) = public.get_current_tenant_id()
  );

-- UPDATE: Users can update their tenant's documents
CREATE POLICY "tenant_documents_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'tenant-documents'
    AND public.get_path_tenant_id(name) = public.get_current_tenant_id()
  );

-- DELETE: Users can delete their tenant's documents  
CREATE POLICY "tenant_documents_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'tenant-documents'
    AND public.get_path_tenant_id(name) = public.get_current_tenant_id()
  );

-- ============================================================================
-- PAYMENT-FILES Bucket Policies (Permission-based)
-- ============================================================================

-- SELECT: Users with PAYMENT_CREATE permission can view
CREATE POLICY "payment_files_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-files'
    AND public.get_path_tenant_id(name) = public.get_current_tenant_id()
    AND public.user_has_permission('PAYMENT_CREATE')
  );

-- INSERT: Users with PAYMENT_CREATE permission can upload
CREATE POLICY "payment_files_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'payment-files'
    AND public.get_path_tenant_id(name) = public.get_current_tenant_id()
    AND public.user_has_permission('PAYMENT_CREATE')
  );

-- ============================================================================
-- JOURNAL-ATTACHMENTS Bucket Policies
-- ============================================================================

-- SELECT: Users with JOURNAL_VIEW permission can view
CREATE POLICY "journal_attachments_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'journal-attachments'
    AND public.get_path_tenant_id(name) = public.get_current_tenant_id()
    AND public.user_has_permission('JOURNAL_VIEW')
  );

-- INSERT: Users with JOURNAL_POST permission can upload
CREATE POLICY "journal_attachments_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'journal-attachments'
    AND public.get_path_tenant_id(name) = public.get_current_tenant_id()
    AND public.user_has_permission('JOURNAL_POST')
  );

-- ============================================================================
-- REPORTS Bucket Policies
-- ============================================================================

-- SELECT: Users with REPORT_VIEW permission can view
CREATE POLICY "reports_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'reports'
    AND public.get_path_tenant_id(name) = public.get_current_tenant_id()
    AND public.user_has_permission('REPORT_VIEW')
  );

-- INSERT: Service role only (reports are generated by system)
CREATE POLICY "reports_insert_service" ON storage.objects
  FOR INSERT TO service_role
  WITH CHECK (bucket_id = 'reports');

-- ============================================================================
-- PUBLIC-ASSETS Bucket Policies
-- ============================================================================

-- SELECT: Anyone can view public assets (bucket is public)
CREATE POLICY "public_assets_select" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'public-assets');

-- INSERT: Service role only for public assets
CREATE POLICY "public_assets_insert_service" ON storage.objects
  FOR INSERT TO service_role
  WITH CHECK (bucket_id = 'public-assets');

-- ============================================================================
-- SERVICE ROLE BYPASS (for all buckets)
-- ============================================================================

CREATE POLICY "storage_service_role_all" ON storage.objects
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
```

---

## 📤 Upload Example (TypeScript)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Build tenant-aware path
function buildStoragePath(
  tenantId: string,
  documentType: string,
  filename: string
): string {
  return `${tenantId}/${documentType}/${filename}`;
}

// Upload a document
async function uploadDocument(
  tenantId: string,
  file: File,
  documentType: string
) {
  const path = buildStoragePath(tenantId, documentType, file.name);

  const { data, error } = await supabase.storage
    .from('tenant-documents')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;
  return data;
}

// Get signed URL for private download
async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

// List tenant documents
async function listDocuments(tenantId: string, documentType: string) {
  const { data, error } = await supabase.storage
    .from('tenant-documents')
    .list(`${tenantId}/${documentType}`);

  if (error) throw error;
  return data;
}
```

---

## 🎯 Best Practices

### Performance

1. **Resize images on upload** - Use [Image Transformations](https://supabase.com/docs/guides/storage/serving/image-transformations) to optimize images
2. **Set cache-control headers** - Use `cacheControl: '31536000'` for static assets (1 year)
3. **Limit file sizes** - Prevents large uploads that impact egress costs

### Security

1. **Always use private buckets** for sensitive financial documents
2. **Path-based tenant isolation** - Tenant ID as first path segment
3. **Permission-based access** - Use `user_has_permission()` for sensitive operations
4. **Signed URLs** - For temporary access to private files

### Cost Optimization

1. **Enable Smart CDN** - Higher cache hit rate = lower egress costs
2. **Image optimization** - Transform images on-the-fly instead of storing multiple sizes
3. **Retention policies** - Delete old documents after retention period

---

## 📊 Monitoring

Check storage usage in **Supabase Dashboard → Storage**:

- Total storage used per bucket
- Egress bandwidth
- Request counts

For detailed analytics, use:

```sql
-- Count objects per bucket
SELECT bucket_id, COUNT(*) as object_count
FROM storage.objects
GROUP BY bucket_id;

-- Storage size per bucket
SELECT bucket_id, 
       pg_size_pretty(SUM((metadata->>'size')::bigint)) as total_size
FROM storage.objects
WHERE metadata->>'size' IS NOT NULL
GROUP BY bucket_id;
```

---

## 📚 References

- [Storage Buckets Fundamentals](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control)
- [Storage Schema Design](https://supabase.com/docs/guides/storage/schema/design)
- [Storage Optimizations](https://supabase.com/docs/guides/storage/production/scaling)
- [Image Transformations](https://supabase.com/docs/guides/storage/serving/image-transformations)

---

**Last Updated:** 2025-01-27  
**Maintainer:** AI-BOS Data Fabric Team
