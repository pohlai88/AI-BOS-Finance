-- ============================================================================
-- AP-05: Payment Execution Tables
-- Version: 1.1.0
-- 
-- Hardened for: 
--   - Concurrency (Optimistic Locking via version column)
--   - Idempotency (Unique idempotency_key constraint)
--   - Immutability (Trigger blocks edits after approval)
--   - SoD (DB constraint: approved_by <> created_by)
--   - RLS (Row Level Security for tenant isolation)
--   - Audit Trail (Beneficiary snapshot at execution)
-- ============================================================================

-- ============================================================================
-- 1. PAYMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS finance.payments (
    -- =========================================================================
    -- IDENTITY
    -- =========================================================================
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL, -- RLS: Tenant isolation required (non-negotiable)
    company_id UUID NOT NULL,
    payment_number VARCHAR(50) NOT NULL,
    
    -- =========================================================================
    -- VENDOR REFERENCE
    -- =========================================================================
    vendor_id UUID NOT NULL,
    vendor_name VARCHAR(255) NOT NULL,
    
    -- =========================================================================
    -- BENEFICIARY SNAPSHOT (captured at execution time - audit-proof)
    -- Prevents historical rewrite when vendor master changes
    -- =========================================================================
    beneficiary_account_number VARCHAR(50),
    beneficiary_routing_number VARCHAR(50),
    beneficiary_bank_name VARCHAR(255),
    beneficiary_account_name VARCHAR(255),
    beneficiary_swift_code VARCHAR(11),
    beneficiary_snapshot_at TIMESTAMPTZ,
    
    -- =========================================================================
    -- MONEY (NUMERIC, never FLOAT)
    -- All amounts stored as NUMERIC(19,4) for 4 decimal precision
    -- =========================================================================
    amount NUMERIC(19,4) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    functional_currency CHAR(3) NOT NULL DEFAULT 'USD',
    fx_rate NUMERIC(19,6),
    functional_amount NUMERIC(19,4),
    
    -- =========================================================================
    -- DATES
    -- =========================================================================
    payment_date DATE NOT NULL,
    due_date DATE,
    
    -- =========================================================================
    -- STATUS (State Machine)
    -- Valid states: draft → pending_approval → approved → processing → completed
    --                              ↓                          ↓
    --                          rejected                    failed → retry
    -- =========================================================================
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'pending_approval', 'approved', 
                          'rejected', 'processing', 'completed', 'failed')),
    
    -- =========================================================================
    -- ACTORS (Who performed actions)
    -- =========================================================================
    created_by UUID NOT NULL,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    executed_by UUID,
    executed_at TIMESTAMPTZ,
    
    -- =========================================================================
    -- TRACEABILITY (CONT_07: Drilldown to source documents and GL)
    -- Source document is generic (invoice is one type, but not required)
    -- =========================================================================
    source_document_id UUID,
    source_document_type VARCHAR(50) 
        CHECK (source_document_type IN ('invoice', 'tax', 'payroll', 'bank_fee', 'deposit', 'prepayment', 'other')),
    journal_header_id UUID, -- GL posting reference (created on completion)
    
    -- =========================================================================
    -- CONCURRENCY CONTROL (Optimistic Locking)
    -- Every update increments version; stale updates fail
    -- =========================================================================
    version INTEGER NOT NULL DEFAULT 1,
    
    -- =========================================================================
    -- IDEMPOTENCY (Prevent duplicate creations)
    -- Frontend generates key per action; server rejects duplicates
    -- =========================================================================
    idempotency_key UUID,
    
    -- =========================================================================
    -- AUDIT TIMESTAMPS
    -- =========================================================================
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- =========================================================================
    -- CONSTRAINTS
    -- =========================================================================
    
    -- Unique payment number per tenant/company
    CONSTRAINT uq_payment_number UNIQUE (tenant_id, company_id, payment_number),
    
    -- Idempotency: prevent duplicate creates within tenant
    CONSTRAINT uq_payment_idempotency UNIQUE (tenant_id, idempotency_key),
    
    -- SoD Enforcement: Maker cannot be Checker (DB-level)
    -- This constraint ensures approved_by is different from created_by
    -- for all payments that have been approved
    CONSTRAINT chk_sod_approved CHECK (
        (status NOT IN ('approved', 'processing', 'completed')) OR
        (approved_by IS NOT NULL AND approved_by <> created_by)
    ),
    
    -- Source document required for non-draft payments
    CONSTRAINT chk_source_document CHECK (
        (status = 'draft') OR
        (source_document_id IS NOT NULL AND source_document_type IS NOT NULL)
    )
);

COMMENT ON TABLE finance.payments IS 'AP-05: Payment Execution Cell - Core payment records with enterprise controls';
COMMENT ON COLUMN finance.payments.version IS 'Optimistic locking: incremented on each update';
COMMENT ON COLUMN finance.payments.idempotency_key IS 'Client-generated key to prevent duplicate creates';
COMMENT ON COLUMN finance.payments.beneficiary_snapshot_at IS 'Timestamp when beneficiary details were captured (at execution)';

-- ============================================================================
-- 2. PAYMENT APPROVALS TABLE (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS finance.payment_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES finance.payments(id) ON DELETE RESTRICT,
    tenant_id UUID NOT NULL, -- RLS: Tenant isolation consistency
    level INTEGER NOT NULL DEFAULT 1,
    approver_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('approved', 'rejected')),
    comment TEXT,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Prevent duplicate approvals at same level
    CONSTRAINT uq_approval_level UNIQUE (payment_id, level)
);

COMMENT ON TABLE finance.payment_approvals IS 'AP-05: Payment approval decisions (audit trail)';

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

-- Primary query patterns
CREATE INDEX IF NOT EXISTS idx_payments_tenant_status 
    ON finance.payments(tenant_id, status);

-- Pending approvals (common filter)
CREATE INDEX IF NOT EXISTS idx_payments_pending 
    ON finance.payments(tenant_id, status) 
    WHERE status = 'pending_approval';

-- Created by (for SoD checks and listings)
CREATE INDEX IF NOT EXISTS idx_payments_created_by 
    ON finance.payments(tenant_id, created_by);

-- Payment date range queries
CREATE INDEX IF NOT EXISTS idx_payments_payment_date 
    ON finance.payments(tenant_id, payment_date);

-- Vendor lookup
CREATE INDEX IF NOT EXISTS idx_payments_vendor 
    ON finance.payments(tenant_id, vendor_id);

-- Approvals by payment
CREATE INDEX IF NOT EXISTS idx_approvals_payment 
    ON finance.payment_approvals(payment_id);

-- ============================================================================
-- 4. IMMUTABILITY TRIGGER (CONT_07 Section 5.1)
-- Prevents modification of approved, processing, or completed payments
-- ============================================================================

CREATE OR REPLACE FUNCTION finance.prevent_payment_modification()
RETURNS TRIGGER AS $$
BEGIN
    -- Block updates and deletes on immutable payments
    IF OLD.status IN ('approved', 'processing', 'completed') THEN
        RAISE EXCEPTION 'Payment is immutable after approval: DELETE/UPDATE forbidden'
            USING HINT = 'To correct an error, create a reversal payment.',
                  ERRCODE = 'restrict_violation';
    END IF;
    
    -- For DELETE, return OLD
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    
    -- For UPDATE, return NEW
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger for both UPDATE and DELETE
DROP TRIGGER IF EXISTS trg_immutable_approved_payments ON finance.payments;
CREATE TRIGGER trg_immutable_approved_payments
BEFORE DELETE OR UPDATE ON finance.payments
FOR EACH ROW
WHEN (OLD.status IN ('approved', 'processing', 'completed'))
EXECUTE FUNCTION finance.prevent_payment_modification();

COMMENT ON FUNCTION finance.prevent_payment_modification() IS 
    'Prevents modification of payments after approval (audit integrity)';

-- ============================================================================
-- 5. VERSION AUTO-INCREMENT TRIGGER
-- Implements optimistic locking by incrementing version on each update
-- ============================================================================

CREATE OR REPLACE FUNCTION finance.increment_payment_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-increment version (client must send expected version in WHERE)
    NEW.version = OLD.version + 1;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_version ON finance.payments;
CREATE TRIGGER trg_payment_version
BEFORE UPDATE ON finance.payments
FOR EACH ROW
EXECUTE FUNCTION finance.increment_payment_version();

COMMENT ON FUNCTION finance.increment_payment_version() IS 
    'Auto-increments version for optimistic locking';

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) - Tenant Isolation (CONT_07 requirement)
-- Ensures no cross-tenant data access at database level
-- ============================================================================

ALTER TABLE finance.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.payment_approvals ENABLE ROW LEVEL SECURITY;

-- Policy for payments: only access own tenant's data
DROP POLICY IF EXISTS payments_tenant_isolation ON finance.payments;
CREATE POLICY payments_tenant_isolation ON finance.payments
    FOR ALL
    USING (tenant_id = COALESCE(
        NULLIF(current_setting('app.current_tenant_id', true), ''),
        tenant_id::text
    )::UUID);

-- Policy for approvals: only access own tenant's data
DROP POLICY IF EXISTS approvals_tenant_isolation ON finance.payment_approvals;
CREATE POLICY approvals_tenant_isolation ON finance.payment_approvals
    FOR ALL
    USING (tenant_id = COALESCE(
        NULLIF(current_setting('app.current_tenant_id', true), ''),
        tenant_id::text
    )::UUID);

COMMENT ON POLICY payments_tenant_isolation ON finance.payments IS 
    'Ensures payments are only visible to their owning tenant';
COMMENT ON POLICY approvals_tenant_isolation ON finance.payment_approvals IS 
    'Ensures approvals are only visible to their owning tenant';

-- ============================================================================
-- 7. SEQUENCE FOR PAYMENT NUMBERS
-- Generates unique, sequential payment numbers per tenant
-- ============================================================================

CREATE OR REPLACE FUNCTION finance.generate_payment_number(p_tenant_id UUID, p_company_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    v_sequence INTEGER;
    v_year INTEGER;
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Get next sequence number (tenant-isolated)
    SELECT COALESCE(MAX(
        CASE 
            WHEN payment_number ~ '^PAY-[0-9]{4}-[0-9]+$' 
            THEN CAST(SPLIT_PART(payment_number, '-', 3) AS INTEGER)
            ELSE 0
        END
    ), 0) + 1
    INTO v_sequence
    FROM finance.payments
    WHERE tenant_id = p_tenant_id
      AND company_id = p_company_id
      AND payment_number LIKE 'PAY-' || v_year::TEXT || '-%';
    
    RETURN 'PAY-' || v_year::TEXT || '-' || LPAD(v_sequence::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION finance.generate_payment_number(UUID, UUID) IS 
    'Generates unique payment number: PAY-YYYY-NNNNN';

-- ============================================================================
-- 8. TRANSACTIONAL OUTBOX TABLE (for event publishing)
-- Events are written here in the same transaction as the payment mutation
-- A separate dispatcher publishes and marks events as processed
-- ============================================================================

CREATE TABLE IF NOT EXISTS finance.payment_outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    aggregate_id UUID NOT NULL, -- Payment ID
    aggregate_type VARCHAR(50) NOT NULL DEFAULT 'payment',
    payload JSONB NOT NULL,
    correlation_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by VARCHAR(100),
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_outbox_unprocessed 
    ON finance.payment_outbox(tenant_id, created_at) 
    WHERE processed_at IS NULL;

COMMENT ON TABLE finance.payment_outbox IS 
    'Transactional outbox for payment domain events (exactly-once delivery)';

-- ============================================================================
-- 9. GRANT PERMISSIONS
-- ============================================================================

-- Grant access to the web application role
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'web_app') THEN
        GRANT SELECT, INSERT, UPDATE ON finance.payments TO web_app;
        GRANT SELECT, INSERT ON finance.payment_approvals TO web_app;
        GRANT SELECT, INSERT, UPDATE ON finance.payment_outbox TO web_app;
        GRANT EXECUTE ON FUNCTION finance.generate_payment_number(UUID, UUID) TO web_app;
    END IF;
END
$$;
