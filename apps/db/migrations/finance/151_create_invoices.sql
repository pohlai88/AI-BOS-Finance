-- ============================================================================
-- AR-02: Sales Invoice Tables
-- Version: 1.1.0 (IMMORTAL-Grade)
-- ============================================================================

-- ============================================================================
-- 1. INVOICES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ar.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    invoice_number VARCHAR(50) NOT NULL,
    customer_id UUID NOT NULL,
    customer_code VARCHAR(50) NOT NULL,
    customer_name TEXT NOT NULL,
    
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    subtotal DECIMAL(18, 2) DEFAULT 0,
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(18, 4) DEFAULT 0,
    discount_amount DECIMAL(18, 2) DEFAULT 0,
    tax_amount DECIMAL(18, 2) DEFAULT 0,
    total_amount DECIMAL(18, 2) DEFAULT 0,
    paid_amount DECIMAL(18, 2) DEFAULT 0,
    outstanding_amount DECIMAL(18, 2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    
    payment_terms VARCHAR(20) DEFAULT 'NET_30' CHECK (payment_terms IN ('NET_30', 'NET_60', 'NET_90', '2_10_NET_30', 'DUE_ON_RECEIPT', 'CUSTOM')),
    notes TEXT,
    internal_notes TEXT,
    
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'posted', 'paid', 'closed', 'voided')),
    
    -- Posting (IMMORTAL-grade)
    posting_idempotency_key UUID UNIQUE,
    journal_header_id UUID,
    posted_at TIMESTAMPTZ,
    posted_by UUID,
    
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    version INTEGER DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT uq_invoice_number_tenant UNIQUE (tenant_id, invoice_number),
    CONSTRAINT uq_invoice_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT fk_invoice_customer FOREIGN KEY (tenant_id, customer_id) REFERENCES ar.customers(tenant_id, id),
    CONSTRAINT chk_sod_approval CHECK ((status = 'approved' AND approved_by IS NOT NULL AND approved_by != created_by) OR (status != 'approved'))
);

-- ============================================================================
-- 2. INVOICE LINES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ar.invoice_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    line_number INTEGER NOT NULL,
    
    description TEXT NOT NULL,
    product_code VARCHAR(50),
    quantity DECIMAL(18, 4) NOT NULL,
    unit_price DECIMAL(18, 4) NOT NULL,
    
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(18, 4) DEFAULT 0,
    discount_amount DECIMAL(18, 2) DEFAULT 0,
    
    tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(18, 2) DEFAULT 0,
    line_total DECIMAL(18, 2) DEFAULT 0,
    
    revenue_account_id UUID NOT NULL,
    tax_account_id UUID,
    
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_invoice_line_invoice_tenant FOREIGN KEY (tenant_id, invoice_id) REFERENCES ar.invoices(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT uq_invoice_line_number UNIQUE (invoice_id, line_number)
);

-- ============================================================================
-- 3. INVOICE SETTLEMENTS TABLE (Payment Allocations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ar.invoice_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL,
    receipt_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    allocated_amount DECIMAL(18, 2) NOT NULL,
    allocated_at TIMESTAMPTZ DEFAULT NOW(),
    allocated_by UUID NOT NULL,
    version INTEGER DEFAULT 1,
    
    CONSTRAINT fk_settlement_invoice_tenant FOREIGN KEY (tenant_id, invoice_id) REFERENCES ar.invoices(tenant_id, id)
);

-- ============================================================================
-- 4. INVOICE AUDIT OUTBOX
-- ============================================================================

CREATE TABLE IF NOT EXISTS ar.invoice_audit_outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_payload JSONB NOT NULL,
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(50) NOT NULL DEFAULT 'Invoice',
    dispatched BOOLEAN DEFAULT FALSE,
    dispatched_at TIMESTAMPTZ,
    dispatch_attempts INTEGER DEFAULT 0,
    last_error TEXT,
    sequence_number BIGINT NOT NULL,
    correlation_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_invoice_outbox_sequence UNIQUE (tenant_id, sequence_number)
);

-- ============================================================================
-- 5. INDEXES
-- ============================================================================

CREATE INDEX idx_invoices_tenant_status ON ar.invoices(tenant_id, status);
CREATE INDEX idx_invoices_tenant_customer ON ar.invoices(tenant_id, customer_id);
CREATE INDEX idx_invoices_tenant_date ON ar.invoices(tenant_id, invoice_date);
CREATE INDEX idx_invoices_tenant_number ON ar.invoices(tenant_id, invoice_number);
CREATE INDEX idx_invoice_lines_invoice ON ar.invoice_lines(tenant_id, invoice_id);
CREATE INDEX idx_invoice_settlements_invoice ON ar.invoice_settlements(tenant_id, invoice_id);
CREATE INDEX idx_invoice_outbox_undispatched ON ar.invoice_audit_outbox(tenant_id, created_at) WHERE dispatched = FALSE;

-- ============================================================================
-- 6. COMPLETE IMMUTABILITY TRIGGER (Posted/Voided)
-- ============================================================================

CREATE OR REPLACE FUNCTION ar.fn_prevent_posted_invoice_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'voided' THEN
        RAISE EXCEPTION 'Cannot modify voided invoice (%) - voided status is terminal', OLD.id;
    END IF;
    IF OLD.status IN ('posted', 'paid', 'closed') THEN
        -- Only allow status transitions and paid_amount updates
        IF NEW.status = OLD.status AND NEW.paid_amount = OLD.paid_amount THEN
            RAISE EXCEPTION 'Cannot modify posted invoice (%) - only status transitions allowed', OLD.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_posted_invoice_update ON ar.invoices;
CREATE TRIGGER trg_prevent_posted_invoice_update
    BEFORE UPDATE ON ar.invoices
    FOR EACH ROW
    WHEN (OLD.status IN ('posted', 'paid', 'closed', 'voided'))
    EXECUTE FUNCTION ar.fn_prevent_posted_invoice_update();

-- ============================================================================
-- 7. LINE IMMUTABILITY TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION ar.fn_prevent_posted_invoice_line_update()
RETURNS TRIGGER AS $$
DECLARE
    v_invoice_status VARCHAR(20);
BEGIN
    SELECT status INTO v_invoice_status FROM ar.invoices WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id) AND tenant_id = COALESCE(NEW.tenant_id, OLD.tenant_id);
    IF v_invoice_status IN ('posted', 'paid', 'closed', 'voided') THEN
        RAISE EXCEPTION 'Cannot modify lines of % invoice', v_invoice_status;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_posted_line_update ON ar.invoice_lines;
CREATE TRIGGER trg_prevent_posted_line_update
    BEFORE INSERT OR UPDATE OR DELETE ON ar.invoice_lines
    FOR EACH ROW
    EXECUTE FUNCTION ar.fn_prevent_posted_invoice_line_update();

-- ============================================================================
-- 8. AUDIT OUTBOX TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION ar.fn_invoice_audit_outbox()
RETURNS TRIGGER AS $$
DECLARE
    v_event_type TEXT;
    v_payload JSONB;
    v_seq BIGINT;
BEGIN
    IF TG_OP = 'INSERT' THEN v_event_type := 'INVOICE_CREATED';
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status THEN v_event_type := 'INVOICE_STATUS_CHANGED';
        ELSE v_event_type := 'INVOICE_UPDATED'; END IF;
    END IF;
    
    v_payload := jsonb_build_object('invoiceId', NEW.id, 'invoiceNumber', NEW.invoice_number, 'status', NEW.status, 'totalAmount', NEW.total_amount, 'version', NEW.version, 'timestamp', NOW());
    SELECT COALESCE(MAX(sequence_number), 0) + 1 INTO v_seq FROM ar.invoice_audit_outbox WHERE tenant_id = NEW.tenant_id;
    
    INSERT INTO ar.invoice_audit_outbox (tenant_id, event_type, event_payload, aggregate_id, aggregate_type, sequence_number, correlation_id)
    VALUES (NEW.tenant_id, v_event_type, v_payload, NEW.id, 'Invoice', v_seq, gen_random_uuid());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invoice_audit_outbox ON ar.invoices;
CREATE TRIGGER trg_invoice_audit_outbox AFTER INSERT OR UPDATE ON ar.invoices FOR EACH ROW EXECUTE FUNCTION ar.fn_invoice_audit_outbox();

-- ============================================================================
-- 9. VERSION AUTO-INCREMENT
-- ============================================================================

CREATE OR REPLACE FUNCTION ar.fn_increment_invoice_version() RETURNS TRIGGER AS $$
BEGIN NEW.version = OLD.version + 1; NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invoice_version ON ar.invoices;
CREATE TRIGGER trg_invoice_version BEFORE UPDATE ON ar.invoices FOR EACH ROW EXECUTE FUNCTION ar.fn_increment_invoice_version();

-- ============================================================================
-- 10. RLS
-- ============================================================================

ALTER TABLE ar.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar.invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar.invoice_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY invoices_tenant_isolation ON ar.invoices FOR ALL USING (tenant_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), ''), tenant_id::text)::UUID);
CREATE POLICY invoice_lines_tenant_isolation ON ar.invoice_lines FOR ALL USING (tenant_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), ''), tenant_id::text)::UUID);
CREATE POLICY invoice_settlements_tenant_isolation ON ar.invoice_settlements FOR ALL USING (tenant_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), ''), tenant_id::text)::UUID);

ANALYZE ar.invoices;
ANALYZE ar.invoice_lines;
