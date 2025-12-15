-- ============================================================================
-- KERNEL PERMISSIONS TABLE
-- Purpose: Global permission definitions (not tenant-scoped)
-- ============================================================================

CREATE TABLE IF NOT EXISTS kernel.permissions (
  permission_code VARCHAR(50) PRIMARY KEY,
  category VARCHAR(30),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed common permissions
INSERT INTO kernel.permissions (permission_code, category, description) VALUES
  ('ADMIN', 'SYSTEM', 'Full administrative access'),
  ('USER_READ', 'USER', 'View user details'),
  ('USER_WRITE', 'USER', 'Create and modify users'),
  ('ROLE_MANAGE', 'ROLE', 'Manage roles and permissions'),
  ('PAYMENT_CREATE', 'FINANCE', 'Create payment transactions'),
  ('PAYMENT_APPROVE', 'FINANCE', 'Approve payment transactions'),
  ('JOURNAL_VIEW', 'FINANCE', 'View journal entries'),
  ('JOURNAL_POST', 'FINANCE', 'Post journal entries'),
  ('REPORT_VIEW', 'REPORTING', 'View reports'),
  ('AUDIT_VIEW', 'AUDIT', 'View audit logs')
ON CONFLICT (permission_code) DO NOTHING;

COMMENT ON TABLE kernel.permissions IS 'Global permission definitions (not tenant-scoped)';
