-- ============================================================================
-- AR-03: Receipt Processing Tables
-- Version: 1.1.0 (IMMORTAL-Grade)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ar.receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    receipt_number VARCHAR(50) NOT NULL,
    customer_id UUID NOT NULL,
    customer_code VARCHAR(50) NOT NULL,
    customer_name TEXT NOT NULL,
    receipt_date DATE NOT NULL,
    receipt_method VARCHAR(20) NOT NULL CHECK (receipt_method IN ('WIRE', 'ACH', 'CHECK', 'CARD', 'CASH', 'OTHER')),
    bank_account_id UUID,
    reference_number VARCHAR(100),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    receipt_amount DECIMAL(18, 2) NOT NULL,
    allocated_amount DECIMAL(18, 2) DEFAULT 0,
    unallocated_amount DECIMAL(18, 2) GENERATED ALWAYS AS (receipt_amount - allocated_amount) STORED,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'posted', 'reversed', 'voided')),
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
    CONSTRAINT uq_receipt_number_tenant UNIQUE (tenant_id, receipt_number),
    CONSTRAINT uq_receipt_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT fk_receipt_customer FOREIGN KEY (tenant_id, customer_id) REFERENCES ar.customers(tenant_id, id),
    CONSTRAINT chk_receipt_sod CHECK ((status = 'approved' AND approved_by != created_by) OR (status != 'approved'))
);

CREATE TABLE IF NOT EXISTS ar.receipt_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_id UUID NOT NULL,
    invoice_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    allocated_amount DECIMAL(18, 2) NOT NULL,
    allocated_at TIMESTAMPTZ DEFAULT NOW(),
    allocated_by UUID NOT NULL,
    version INTEGER DEFAULT 1,
    CONSTRAINT fk_allocation_receipt_tenant FOREIGN KEY (tenant_id, receipt_id) REFERENCES ar.receipts(tenant_id, id),
    CONSTRAINT fk_allocation_invoice_tenant FOREIGN KEY (tenant_id, invoice_id) REFERENCES ar.invoices(tenant_id, id),
    CONSTRAINT uq_allocation_receipt_invoice UNIQUE (receipt_id, invoice_id)
);

CREATE TABLE IF NOT EXISTS ar.receipt_audit_outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_payload JSONB NOT NULL,
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(50) DEFAULT 'Receipt',
    dispatched BOOLEAN DEFAULT FALSE,
    sequence_number BIGINT NOT NULL,
    correlation_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_receipt_outbox_sequence UNIQUE (tenant_id, sequence_number)
);

CREATE INDEX idx_receipts_tenant_status ON ar.receipts(tenant_id, status);
CREATE INDEX idx_receipts_tenant_customer ON ar.receipts(tenant_id, customer_id);
CREATE INDEX idx_receipts_tenant_date ON ar.receipts(tenant_id, receipt_date);
CREATE INDEX idx_receipt_allocations_receipt ON ar.receipt_allocations(tenant_id, receipt_id);
CREATE INDEX idx_receipt_allocations_invoice ON ar.receipt_allocations(tenant_id, invoice_id);

-- Immutability trigger
CREATE OR REPLACE FUNCTION ar.fn_prevent_posted_receipt_update() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IN ('posted', 'reversed', 'voided') AND NEW.status = OLD.status THEN
        RAISE EXCEPTION 'Cannot modify % receipt', OLD.status;
    END IF;
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_posted_receipt ON ar.receipts;
CREATE TRIGGER trg_prevent_posted_receipt BEFORE UPDATE ON ar.receipts FOR EACH ROW WHEN (OLD.status IN ('posted', 'reversed', 'voided')) EXECUTE FUNCTION ar.fn_prevent_posted_receipt_update();

-- Version trigger
CREATE OR REPLACE FUNCTION ar.fn_increment_receipt_version() RETURNS TRIGGER AS $$
BEGIN NEW.version = OLD.version + 1; NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_receipt_version ON ar.receipts;
CREATE TRIGGER trg_receipt_version BEFORE UPDATE ON ar.receipts FOR EACH ROW EXECUTE FUNCTION ar.fn_increment_receipt_version();

-- Audit outbox trigger
CREATE OR REPLACE FUNCTION ar.fn_receipt_audit_outbox() RETURNS TRIGGER AS $$
DECLARE v_seq BIGINT;
BEGIN
    SELECT COALESCE(MAX(sequence_number), 0) + 1 INTO v_seq FROM ar.receipt_audit_outbox WHERE tenant_id = NEW.tenant_id;
    INSERT INTO ar.receipt_audit_outbox (tenant_id, event_type, event_payload, aggregate_id, sequence_number, correlation_id)
    VALUES (NEW.tenant_id, CASE WHEN TG_OP = 'INSERT' THEN 'RECEIPT_CREATED' ELSE 'RECEIPT_UPDATED' END, jsonb_build_object('receiptId', NEW.id, 'status', NEW.status, 'amount', NEW.receipt_amount), NEW.id, v_seq, gen_random_uuid());
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_receipt_audit_outbox ON ar.receipts;
CREATE TRIGGER trg_receipt_audit_outbox AFTER INSERT OR UPDATE ON ar.receipts FOR EACH ROW EXECUTE FUNCTION ar.fn_receipt_audit_outbox();

ALTER TABLE ar.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar.receipt_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY receipts_tenant_isolation ON ar.receipts FOR ALL USING (tenant_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), ''), tenant_id::text)::UUID);
CREATE POLICY receipt_allocations_tenant_isolation ON ar.receipt_allocations FOR ALL USING (tenant_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), ''), tenant_id::text)::UUID);

ANALYZE ar.receipts;
ANALYZE ar.receipt_allocations;
