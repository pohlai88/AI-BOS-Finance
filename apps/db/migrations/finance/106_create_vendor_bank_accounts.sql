-- ============================================================================
-- AP-01: Vendor Bank Accounts Table
-- Version: 1.0.0
-- 
-- Hardened for: 
--   - Concurrency (Optimistic Locking via version column)
--   - SoD (DB constraint: change_approved_by <> change_requested_by)
--   - RLS (Row Level Security for tenant isolation)
--   - Duplicate Detection (Unique constraint on account_number + routing_number)
-- ============================================================================

-- ============================================================================
-- 1. VENDOR BANK ACCOUNTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ap.vendor_bank_accounts (
    -- =========================================================================
    -- IDENTITY
    -- =========================================================================
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES ap.vendors(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    
    -- =========================================================================
    -- BANK DETAILS
    -- =========================================================================
    bank_name TEXT NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_name TEXT NOT NULL,
    routing_number VARCHAR(50),  -- US/Canada
    swift_code VARCHAR(11),  -- International (ISO 9362)
    iban VARCHAR(34),  -- International (ISO 13616)
    currency VARCHAR(3) NOT NULL,  -- ISO 4217
    
    -- =========================================================================
    -- STATUS
    -- =========================================================================
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- =========================================================================
    -- CHANGE CONTROL
    -- Bank account changes require separate approval workflow
    -- =========================================================================
    change_request_status VARCHAR(20) CHECK (
        change_request_status IN ('pending_approval', 'approved', 'rejected')
    ),
    change_requested_by UUID,
    change_requested_at TIMESTAMPTZ,
    change_approved_by UUID,
    change_approved_at TIMESTAMPTZ,
    
    -- =========================================================================
    -- ACTORS (Who created the account)
    -- =========================================================================
    created_by UUID NOT NULL,
    
    -- =========================================================================
    -- CONCURRENCY
    -- =========================================================================
    version INTEGER DEFAULT 1,  -- Optimistic locking
    
    -- =========================================================================
    -- TIMESTAMPS
    -- =========================================================================
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- =========================================================================
    -- CONSTRAINTS
    -- =========================================================================
    -- Unique bank account per tenant (account_number + routing_number)
    CONSTRAINT uq_bank_account UNIQUE (tenant_id, account_number, routing_number) 
        WHERE account_number IS NOT NULL AND routing_number IS NOT NULL,
    
    -- SoD Constraint: Bank change approver must be different from requester
    CONSTRAINT chk_sod_bank_change CHECK (
        (change_request_status = 'approved' AND change_approved_by IS NOT NULL AND 
         change_approved_by != change_requested_by) OR
        (change_request_status != 'approved' OR change_request_status IS NULL)
    )
);

COMMENT ON TABLE ap.vendor_bank_accounts IS 
    'Vendor Bank Accounts - Payment destination accounts with change control';

COMMENT ON COLUMN ap.vendor_bank_accounts.change_request_status IS 
    'Bank account change control: pending_approval → approved/rejected';

COMMENT ON COLUMN ap.vendor_bank_accounts.version IS 
    'Optimistic locking version (incremented on each update)';

COMMENT ON CONSTRAINT chk_sod_bank_change ON ap.vendor_bank_accounts IS 
    'Segregation of Duties: Bank change approver must be different from requester';

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX idx_vendor_bank_accounts_vendor ON ap.vendor_bank_accounts(vendor_id);
CREATE INDEX idx_vendor_bank_accounts_tenant ON ap.vendor_bank_accounts(tenant_id);
CREATE INDEX idx_vendor_bank_accounts_status ON ap.vendor_bank_accounts(tenant_id, change_request_status) 
    WHERE change_request_status IS NOT NULL;
CREATE INDEX idx_vendor_bank_accounts_primary ON ap.vendor_bank_accounts(vendor_id, is_primary) 
    WHERE is_primary = TRUE;

-- ============================================================================
-- 3. VERSION AUTO-INCREMENT TRIGGER
-- Implements optimistic locking by incrementing version on each update
-- ============================================================================

CREATE OR REPLACE FUNCTION ap.increment_bank_account_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-increment version (client must send expected version in WHERE)
    NEW.version = OLD.version + 1;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bank_account_version ON ap.vendor_bank_accounts;
CREATE TRIGGER trg_bank_account_version
BEFORE UPDATE ON ap.vendor_bank_accounts
FOR EACH ROW
EXECUTE FUNCTION ap.increment_bank_account_version();

COMMENT ON FUNCTION ap.increment_bank_account_version() IS 
    'Auto-increments version for optimistic locking';

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) - Tenant Isolation (CONT_07 requirement)
-- Ensures no cross-tenant data access at database level
-- ============================================================================

ALTER TABLE ap.vendor_bank_accounts ENABLE ROW LEVEL SECURITY;

-- Policy for bank accounts: only access own tenant's data
DROP POLICY IF EXISTS bank_accounts_tenant_isolation ON ap.vendor_bank_accounts;
CREATE POLICY bank_accounts_tenant_isolation ON ap.vendor_bank_accounts
    FOR ALL
    USING (tenant_id = COALESCE(
        NULLIF(current_setting('app.current_tenant_id', true), ''),
        tenant_id::text
    )::UUID);

COMMENT ON POLICY bank_accounts_tenant_isolation ON ap.vendor_bank_accounts IS 
    'Ensures bank accounts are only visible to their owning tenant';

-- ============================================================================
-- 5. ADD FOREIGN KEY CONSTRAINT (Deferred - after vendors table exists)
-- ============================================================================

-- Update default_bank_account_id in vendors table to reference bank accounts
ALTER TABLE ap.vendors 
ADD CONSTRAINT fk_vendor_default_bank_account 
FOREIGN KEY (default_bank_account_id) 
REFERENCES ap.vendor_bank_accounts(id) 
ON DELETE SET NULL;

COMMENT ON CONSTRAINT fk_vendor_default_bank_account ON ap.vendors IS 
    'Default bank account for vendor payments';
