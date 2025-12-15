-- ============================================================================
-- SUPABASE ADAPTER: STORAGE BUCKET CONFIGURATION
-- Migration: 004_storage_buckets.sql
-- Purpose: Create and configure Supabase Storage buckets with RLS policies
-- 
-- IMPORTANT: Storage configuration in Supabase uses the storage schema
-- Buckets and policies must be created via SQL or Dashboard
-- ============================================================================

-- ============================================================================
-- BUCKET DEFINITIONS
-- ============================================================================
-- AI-BOS Finance uses the following storage buckets:
--
-- 1. tenant-documents   - Invoices, receipts, contracts (private per tenant)
-- 2. payment-files      - Payment batch files, bank statements (private)
-- 3. journal-attachments - Journal entry supporting documents (private)
-- 4. reports            - Generated reports, exports (private per tenant)
-- 5. public-assets      - Logos, public documents (public read)
-- ============================================================================

-- Create buckets (if not exists pattern)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('tenant-documents', 'tenant-documents', false, 52428800, -- 50MB
   ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 
         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
         'application/vnd.ms-excel', 'text/csv']),
  
  ('payment-files', 'payment-files', false, 104857600, -- 100MB
   ARRAY['application/pdf', 'text/csv', 'text/plain',
         'application/xml', 'text/xml',
         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  
  ('journal-attachments', 'journal-attachments', false, 26214400, -- 25MB
   ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp']),
  
  ('reports', 'reports', false, 104857600, -- 100MB
   ARRAY['application/pdf', 'text/csv',
         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
         'application/json']),
  
  ('public-assets', 'public-assets', true, 5242880, -- 5MB
   ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- STORAGE RLS POLICIES
-- ============================================================================
-- Path convention: {tenant_id}/{company_id?}/{document_type}/{filename}
-- Example: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/invoices/INV-2024-001.pdf
-- ============================================================================

-- HELPER: Extract tenant_id from storage path (first segment)
-- NOTE: This is in PUBLIC schema because storage schema has restricted permissions
CREATE OR REPLACE FUNCTION public.get_path_tenant_id(storage_path TEXT)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Path format: tenant_id/rest/of/path
  RETURN (string_to_array(storage_path, '/'))[1]::UUID;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.get_path_tenant_id(TEXT) IS 
  'Extract tenant_id from storage path for RLS policy evaluation';

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
-- PAYMENT-FILES Bucket Policies
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

-- SELECT: Anyone can view public assets
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

-- ============================================================================
-- METADATA TABLE FOR DOCUMENT TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS finance.document_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID REFERENCES finance.companies(id),
  
  -- Storage reference
  bucket_id TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  
  -- Document info
  document_type VARCHAR(50) NOT NULL, -- 'INVOICE', 'RECEIPT', 'CONTRACT', 'STATEMENT'
  reference_type VARCHAR(50),         -- 'TRANSACTION', 'JOURNAL_ENTRY', etc.
  reference_id UUID,                  -- ID of related entity
  
  -- File metadata
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  checksum TEXT,                      -- SHA-256 for integrity verification
  
  -- Classification
  classification VARCHAR(20) DEFAULT 'INTERNAL',
  retention_period_months INTEGER DEFAULT 84, -- 7 years for financial docs
  
  -- Audit
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT uq_document_path UNIQUE (tenant_id, storage_path)
);

-- Enable RLS
ALTER TABLE finance.document_metadata ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "document_metadata_tenant" ON finance.document_metadata
  FOR ALL TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "document_metadata_service" ON finance.document_metadata
  FOR ALL TO service_role
  USING (true);

-- Indexes
CREATE INDEX idx_finance_documents_tenant ON finance.document_metadata(tenant_id);
CREATE INDEX idx_finance_documents_reference ON finance.document_metadata(reference_type, reference_id);
CREATE INDEX idx_finance_documents_type ON finance.document_metadata(tenant_id, document_type);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE finance.document_metadata IS 
  'Metadata tracking for Supabase Storage documents with tenant isolation';

COMMENT ON POLICY "tenant_documents_select" ON storage.objects IS 
  'Supabase Storage RLS: Tenant isolation using path-based tenant_id';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
