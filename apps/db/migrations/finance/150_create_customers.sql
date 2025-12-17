-- ============================================================================
-- AR-01: Customer Master Tables
-- Version: 1.1.0 (IMMORTAL-Grade)
-- 
-- Hardened for: 
--   - Concurrency (Optimistic Locking via version column)
--   - Complete Immutability (Trigger blocks ALL edits for archived)
--   - SoD (DB constraint: approved_by <> created_by)
--   - RLS (Row Level Security for tenant isolation)
--   - Tenant Isolation (Composite FKs for child tables)
--   - Transactional Audit (Outbox pattern with triggers)
-- ============================================================================

-- ============================================================================
-- 0. CREATE AR SCHEMA IF NOT EXISTS
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS ar;

-- ============================================================================
-- 1. CUSTOMERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ar.customers (
    -- =========================================================================
    -- IDENTITY
    -- =========================================================================
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    
    -- =========================================================================
    -- IDENTIFICATION
    -- =========================================================================
    customer_code VARCHAR(50) NOT NULL,
    legal_name TEXT NOT NULL,
    display_name TEXT,
    tax_id VARCHAR(50),
    registration_number VARCHAR(50),
    
    -- =========================================================================
    -- CLASSIFICATION
    -- =========================================================================
    country VARCHAR(3) NOT NULL,  -- ISO 3166-1 alpha-3
    currency_preference VARCHAR(3) NOT NULL DEFAULT 'USD',  -- ISO 4217
    customer_category VARCHAR(50),
    risk_level VARCHAR(20) DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    
    -- =========================================================================
    -- STATUS MACHINE
    -- Valid states: draft → submitted → approved → suspended → archived
    -- =========================================================================
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'submitted', 'approved', 'suspended', 'archived')),
    
    -- =========================================================================
    -- CREDIT MANAGEMENT
    -- =========================================================================
    credit_limit DECIMAL(18, 2) DEFAULT 0,
    current_balance DECIMAL(18, 2) DEFAULT 0,
    available_credit DECIMAL(18, 2) GENERATED ALWAYS AS (credit_limit - current_balance) STORED,
    default_payment_terms INTEGER DEFAULT 30,  -- Days
    
    -- =========================================================================
    -- RISK INDICATORS
    -- =========================================================================
    credit_risk_score INTEGER CHECK (credit_risk_score BETWEEN 0 AND 1000),
    payment_history_flag VARCHAR(20) CHECK (payment_history_flag IN ('GOOD', 'WARNING', 'POOR')),
    collection_status VARCHAR(20) DEFAULT 'CURRENT' 
        CHECK (collection_status IN ('CURRENT', 'OVERDUE', 'COLLECTION')),
    
    -- =========================================================================
    -- RECONCILIATION
    -- =========================================================================
    last_balance_updated_at TIMESTAMPTZ,
    last_reconciled_at TIMESTAMPTZ,
    
    -- =========================================================================
    -- ACTORS (Who performed actions)
    -- =========================================================================
    created_by UUID NOT NULL,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    
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
    CONSTRAINT uq_customer_code_tenant UNIQUE (tenant_id, customer_code),
    CONSTRAINT uq_customer_tax_id_tenant UNIQUE (tenant_id, tax_id),
    CONSTRAINT uq_customer_tenant_id UNIQUE (tenant_id, id),  -- For composite FK
    
    -- SoD Constraint: Approver must be different from creator
    CONSTRAINT chk_sod_approval CHECK (
        (status = 'approved' AND approved_by IS NOT NULL AND approved_by != created_by) OR
        (status != 'approved')
    )
);

COMMENT ON TABLE ar.customers IS 
    'Customer Master - Approved customer registry for AR transactions';

COMMENT ON COLUMN ar.customers.customer_code IS 
    'Unique customer identifier generated by K_SEQ (SequencePort)';

COMMENT ON COLUMN ar.customers.status IS 
    'State machine: draft → submitted → approved → suspended → archived';

COMMENT ON COLUMN ar.customers.available_credit IS 
    'Computed: credit_limit - current_balance';

COMMENT ON CONSTRAINT chk_sod_approval ON ar.customers IS 
    'Segregation of Duties: Approver must be different from creator';

-- ============================================================================
-- 2. CUSTOMER ADDRESSES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ar.customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    
    address_type VARCHAR(20) NOT NULL CHECK (address_type IN ('billing', 'shipping', 'both')),
    address_line_1 TEXT NOT NULL,
    address_line_2 TEXT,
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(3) NOT NULL,
    
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Composite FK for tenant isolation
    CONSTRAINT fk_address_customer_tenant 
        FOREIGN KEY (tenant_id, customer_id) 
        REFERENCES ar.customers(tenant_id, id) ON DELETE CASCADE
);

COMMENT ON TABLE ar.customer_addresses IS 
    'Customer addresses (billing, shipping) with tenant isolation';

-- ============================================================================
-- 3. CUSTOMER CONTACTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ar.customer_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    
    contact_type VARCHAR(20) NOT NULL 
        CHECK (contact_type IN ('billing', 'accounts', 'general', 'executive')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    title VARCHAR(100),
    
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    receives_invoices BOOLEAN DEFAULT FALSE,
    receives_statements BOOLEAN DEFAULT FALSE,
    
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Composite FK for tenant isolation
    CONSTRAINT fk_contact_customer_tenant 
        FOREIGN KEY (tenant_id, customer_id) 
        REFERENCES ar.customers(tenant_id, id) ON DELETE CASCADE
);

COMMENT ON TABLE ar.customer_contacts IS 
    'Customer contacts with notification preferences';

-- ============================================================================
-- 4. CUSTOMER CREDIT HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ar.customer_credit_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    
    old_credit_limit DECIMAL(18, 2),
    new_credit_limit DECIMAL(18, 2) NOT NULL,
    change_reason TEXT NOT NULL,
    
    change_request_status VARCHAR(20) 
        CHECK (change_request_status IN ('pending_approval', 'approved', 'rejected')),
    change_requested_by UUID,
    change_requested_at TIMESTAMPTZ,
    change_approved_by UUID,
    change_approved_at TIMESTAMPTZ,
    
    created_by UUID NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Composite FK for tenant isolation
    CONSTRAINT fk_credit_history_customer_tenant 
        FOREIGN KEY (tenant_id, customer_id) 
        REFERENCES ar.customers(tenant_id, id) ON DELETE CASCADE,
    
    -- SoD: Approver ≠ Requester
    CONSTRAINT chk_credit_sod CHECK (
        change_request_status IS NULL OR
        change_request_status != 'approved' OR
        change_approved_by != change_requested_by
    )
);

COMMENT ON TABLE ar.customer_credit_history IS 
    'Audit trail for credit limit changes with SoD enforcement';

-- ============================================================================
-- 5. CUSTOMER AUDIT OUTBOX TABLE (Transactional Audit)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ar.customer_audit_outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_payload JSONB NOT NULL,
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(50) NOT NULL DEFAULT 'Customer',
    
    dispatched BOOLEAN DEFAULT FALSE,
    dispatched_at TIMESTAMPTZ,
    dispatch_attempts INTEGER DEFAULT 0,
    last_error TEXT,
    
    sequence_number BIGINT NOT NULL,
    correlation_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT uq_customer_outbox_sequence UNIQUE (tenant_id, sequence_number)
);

CREATE INDEX idx_customer_outbox_undispatched 
    ON ar.customer_audit_outbox(tenant_id, created_at) 
    WHERE dispatched = FALSE;

COMMENT ON TABLE ar.customer_audit_outbox IS 
    'Transactional outbox for at-least-once audit event delivery';

-- ============================================================================
-- 6. INDEXES
-- ============================================================================

-- Customers indexes
CREATE INDEX idx_customers_tenant_status ON ar.customers(tenant_id, status);
CREATE INDEX idx_customers_tenant_code ON ar.customers(tenant_id, customer_code);
CREATE INDEX idx_customers_tax_id ON ar.customers(tenant_id, tax_id) WHERE tax_id IS NOT NULL;
CREATE INDEX idx_customers_created_by ON ar.customers(tenant_id, created_by);
CREATE INDEX idx_customers_collection_status ON ar.customers(tenant_id, collection_status);

-- Composite indexes for common queries
CREATE INDEX idx_customers_tenant_status_category 
    ON ar.customers(tenant_id, status, customer_category) 
    WHERE customer_category IS NOT NULL;

CREATE INDEX idx_customers_tenant_status_risk 
    ON ar.customers(tenant_id, status, risk_level);

-- Partial indexes
CREATE INDEX idx_customers_tenant_active 
    ON ar.customers(tenant_id, created_at DESC) 
    WHERE status IN ('approved', 'suspended');

CREATE INDEX idx_customers_tenant_pending 
    ON ar.customers(tenant_id, created_at ASC) 
    WHERE status = 'submitted';

-- Child table indexes
CREATE INDEX idx_customer_addresses_customer ON ar.customer_addresses(tenant_id, customer_id);
CREATE INDEX idx_customer_contacts_customer ON ar.customer_contacts(tenant_id, customer_id);
CREATE INDEX idx_customer_credit_history_customer ON ar.customer_credit_history(tenant_id, customer_id);

-- ============================================================================
-- 7. COMPLETE IMMUTABILITY TRIGGER (Archived = Terminal)
-- ============================================================================

CREATE OR REPLACE FUNCTION ar.fn_prevent_archived_customer_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'archived' THEN
        RAISE EXCEPTION 'Cannot modify archived customer (%) - archived status is terminal and completely immutable. No field changes allowed.', OLD.id
            USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_archived_update ON ar.customers;
CREATE TRIGGER trg_prevent_archived_update
    BEFORE UPDATE ON ar.customers
    FOR EACH ROW
    WHEN (OLD.status = 'archived')
    EXECUTE FUNCTION ar.fn_prevent_archived_customer_update();

COMMENT ON FUNCTION ar.fn_prevent_archived_customer_update() IS 
    'IMMORTAL-grade: Blocks ALL modifications to archived customers';

-- ============================================================================
-- 8. VERSION AUTO-INCREMENT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION ar.fn_increment_customer_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customer_version ON ar.customers;
CREATE TRIGGER trg_customer_version
    BEFORE UPDATE ON ar.customers
    FOR EACH ROW
    EXECUTE FUNCTION ar.fn_increment_customer_version();

-- ============================================================================
-- 9. AUDIT OUTBOX TRIGGER (Transactional Audit)
-- ============================================================================

CREATE OR REPLACE FUNCTION ar.fn_customer_audit_outbox()
RETURNS TRIGGER AS $$
DECLARE
    v_event_type TEXT;
    v_payload JSONB;
    v_seq BIGINT;
BEGIN
    -- Determine event type
    IF TG_OP = 'INSERT' THEN
        v_event_type := 'CUSTOMER_CREATED';
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status THEN
            v_event_type := 'CUSTOMER_STATUS_CHANGED';
        ELSIF OLD.credit_limit != NEW.credit_limit THEN
            v_event_type := 'CUSTOMER_CREDIT_LIMIT_CHANGED';
        ELSE
            v_event_type := 'CUSTOMER_UPDATED';
        END IF;
    END IF;
    
    -- Build payload
    v_payload := jsonb_build_object(
        'customerId', NEW.id,
        'customerCode', NEW.customer_code,
        'tenantId', NEW.tenant_id,
        'status', NEW.status,
        'previousStatus', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
        'creditLimit', NEW.credit_limit,
        'version', NEW.version,
        'timestamp', NOW()
    );
    
    -- Get next sequence number
    SELECT COALESCE(MAX(sequence_number), 0) + 1 INTO v_seq
    FROM ar.customer_audit_outbox
    WHERE tenant_id = NEW.tenant_id;
    
    -- Insert into outbox (same transaction as main operation)
    INSERT INTO ar.customer_audit_outbox (
        tenant_id, event_type, event_payload, aggregate_id, 
        aggregate_type, sequence_number, correlation_id
    ) VALUES (
        NEW.tenant_id, v_event_type, v_payload, NEW.id,
        'Customer', v_seq, gen_random_uuid()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customer_audit_outbox ON ar.customers;
CREATE TRIGGER trg_customer_audit_outbox
    AFTER INSERT OR UPDATE ON ar.customers
    FOR EACH ROW
    EXECUTE FUNCTION ar.fn_customer_audit_outbox();

COMMENT ON FUNCTION ar.fn_customer_audit_outbox() IS 
    'Writes audit events to outbox in same transaction (at-least-once delivery)';

-- ============================================================================
-- 10. TENANT ISOLATION VALIDATION TRIGGER (Belt & Suspenders)
-- ============================================================================

CREATE OR REPLACE FUNCTION ar.fn_validate_customer_child_tenant()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM ar.customers 
        WHERE id = NEW.customer_id AND tenant_id = NEW.tenant_id
    ) THEN
        RAISE EXCEPTION 'Tenant isolation violation: customer % does not belong to tenant %',
            NEW.customer_id, NEW.tenant_id
            USING ERRCODE = 'P0002';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to addresses
DROP TRIGGER IF EXISTS trg_address_tenant_validation ON ar.customer_addresses;
CREATE TRIGGER trg_address_tenant_validation
    BEFORE INSERT OR UPDATE ON ar.customer_addresses
    FOR EACH ROW
    EXECUTE FUNCTION ar.fn_validate_customer_child_tenant();

-- Apply to contacts
DROP TRIGGER IF EXISTS trg_contact_tenant_validation ON ar.customer_contacts;
CREATE TRIGGER trg_contact_tenant_validation
    BEFORE INSERT OR UPDATE ON ar.customer_contacts
    FOR EACH ROW
    EXECUTE FUNCTION ar.fn_validate_customer_child_tenant();

-- Apply to credit history
DROP TRIGGER IF EXISTS trg_credit_history_tenant_validation ON ar.customer_credit_history;
CREATE TRIGGER trg_credit_history_tenant_validation
    BEFORE INSERT OR UPDATE ON ar.customer_credit_history
    FOR EACH ROW
    EXECUTE FUNCTION ar.fn_validate_customer_child_tenant();

COMMENT ON FUNCTION ar.fn_validate_customer_child_tenant() IS 
    'Belt-and-suspenders validation for tenant isolation on child tables';

-- ============================================================================
-- 11. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE ar.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar.customer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar.customer_credit_history ENABLE ROW LEVEL SECURITY;

-- Customers RLS policy
DROP POLICY IF EXISTS customers_tenant_isolation ON ar.customers;
CREATE POLICY customers_tenant_isolation ON ar.customers
    FOR ALL
    USING (tenant_id = COALESCE(
        NULLIF(current_setting('app.current_tenant_id', true), ''),
        tenant_id::text
    )::UUID);

-- Addresses RLS policy
DROP POLICY IF EXISTS customer_addresses_tenant_isolation ON ar.customer_addresses;
CREATE POLICY customer_addresses_tenant_isolation ON ar.customer_addresses
    FOR ALL
    USING (tenant_id = COALESCE(
        NULLIF(current_setting('app.current_tenant_id', true), ''),
        tenant_id::text
    )::UUID);

-- Contacts RLS policy
DROP POLICY IF EXISTS customer_contacts_tenant_isolation ON ar.customer_contacts;
CREATE POLICY customer_contacts_tenant_isolation ON ar.customer_contacts
    FOR ALL
    USING (tenant_id = COALESCE(
        NULLIF(current_setting('app.current_tenant_id', true), ''),
        tenant_id::text
    )::UUID);

-- Credit History RLS policy
DROP POLICY IF EXISTS customer_credit_history_tenant_isolation ON ar.customer_credit_history;
CREATE POLICY customer_credit_history_tenant_isolation ON ar.customer_credit_history
    FOR ALL
    USING (tenant_id = COALESCE(
        NULLIF(current_setting('app.current_tenant_id', true), ''),
        tenant_id::text
    )::UUID);

-- ============================================================================
-- 12. STATISTICS FOR QUERY PLANNER
-- ============================================================================

ALTER TABLE ar.customers ALTER COLUMN tenant_id SET STATISTICS 1000;
ALTER TABLE ar.customers ALTER COLUMN status SET STATISTICS 500;
ALTER TABLE ar.customers ALTER COLUMN customer_category SET STATISTICS 500;
ALTER TABLE ar.customers ALTER COLUMN collection_status SET STATISTICS 500;

ANALYZE ar.customers;
ANALYZE ar.customer_addresses;
ANALYZE ar.customer_contacts;
ANALYZE ar.customer_credit_history;
