-- ============================================================================
-- AR-04: Credit Note Tables
-- Version: 1.1.0 (IMMORTAL-Grade)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ar.credit_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    credit_note_number VARCHAR(50) NOT NULL,
    customer_id UUID NOT NULL,
    customer_code VARCHAR(50) NOT NULL,
    customer_name TEXT NOT NULL,
    original_invoice_id UUID,
    original_invoice_number VARCHAR(50),
    credit_note_date DATE NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    subtotal DECIMAL(18, 2) DEFAULT 0,
    tax_amount DECIMAL(18, 2) DEFAULT 0,
    total_amount DECIMAL(18, 2) DEFAULT 0,
    applied_amount DECIMAL(18, 2) DEFAULT 0,
    unapplied_amount DECIMAL(18, 2) GENERATED ALWAYS AS (total_amount - applied_amount) STORED,
    reason VARCHAR(30) NOT NULL CHECK (reason IN ('RETURN', 'PRICING_ERROR', 'DAMAGED_GOODS', 'SERVICE_ISSUE', 'GOODWILL', 'OTHER')),
    reason_description TEXT,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'posted', 'applied', 'voided')),
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
    CONSTRAINT uq_credit_note_number_tenant UNIQUE (tenant_id, credit_note_number),
    CONSTRAINT uq_credit_note_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT fk_credit_note_customer FOREIGN KEY (tenant_id, customer_id) REFERENCES ar.customers(tenant_id, id),
    CONSTRAINT chk_credit_note_sod CHECK ((status = 'approved' AND approved_by != created_by) OR (status != 'approved'))
);

CREATE TABLE IF NOT EXISTS ar.credit_note_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credit_note_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    line_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(18, 4) NOT NULL,
    unit_price DECIMAL(18, 4) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(18, 2) DEFAULT 0,
    line_total DECIMAL(18, 2) DEFAULT 0,
    revenue_account_id UUID NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_credit_note_line_tenant FOREIGN KEY (tenant_id, credit_note_id) REFERENCES ar.credit_notes(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT uq_credit_note_line_number UNIQUE (credit_note_id, line_number)
);

CREATE TABLE IF NOT EXISTS ar.credit_note_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credit_note_id UUID NOT NULL,
    invoice_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    applied_amount DECIMAL(18, 2) NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    applied_by UUID NOT NULL,
    version INTEGER DEFAULT 1,
    CONSTRAINT fk_application_credit_note_tenant FOREIGN KEY (tenant_id, credit_note_id) REFERENCES ar.credit_notes(tenant_id, id),
    CONSTRAINT fk_application_invoice_tenant FOREIGN KEY (tenant_id, invoice_id) REFERENCES ar.invoices(tenant_id, id)
);

CREATE TABLE IF NOT EXISTS ar.credit_note_audit_outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_payload JSONB NOT NULL,
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(50) DEFAULT 'CreditNote',
    dispatched BOOLEAN DEFAULT FALSE,
    sequence_number BIGINT NOT NULL,
    correlation_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_credit_note_outbox_sequence UNIQUE (tenant_id, sequence_number)
);

CREATE INDEX idx_credit_notes_tenant_status ON ar.credit_notes(tenant_id, status);
CREATE INDEX idx_credit_notes_tenant_customer ON ar.credit_notes(tenant_id, customer_id);
CREATE INDEX idx_credit_note_lines_credit_note ON ar.credit_note_lines(tenant_id, credit_note_id);
CREATE INDEX idx_credit_note_applications_credit_note ON ar.credit_note_applications(tenant_id, credit_note_id);

-- Immutability trigger
CREATE OR REPLACE FUNCTION ar.fn_prevent_posted_credit_note_update() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IN ('posted', 'applied', 'voided') AND NEW.status = OLD.status THEN
        RAISE EXCEPTION 'Cannot modify % credit note', OLD.status;
    END IF;
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_posted_credit_note ON ar.credit_notes;
CREATE TRIGGER trg_prevent_posted_credit_note BEFORE UPDATE ON ar.credit_notes FOR EACH ROW WHEN (OLD.status IN ('posted', 'applied', 'voided')) EXECUTE FUNCTION ar.fn_prevent_posted_credit_note_update();

-- Version trigger
CREATE OR REPLACE FUNCTION ar.fn_increment_credit_note_version() RETURNS TRIGGER AS $$
BEGIN NEW.version = OLD.version + 1; NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_credit_note_version ON ar.credit_notes;
CREATE TRIGGER trg_credit_note_version BEFORE UPDATE ON ar.credit_notes FOR EACH ROW EXECUTE FUNCTION ar.fn_increment_credit_note_version();

-- Audit outbox trigger
CREATE OR REPLACE FUNCTION ar.fn_credit_note_audit_outbox() RETURNS TRIGGER AS $$
DECLARE v_seq BIGINT;
BEGIN
    SELECT COALESCE(MAX(sequence_number), 0) + 1 INTO v_seq FROM ar.credit_note_audit_outbox WHERE tenant_id = NEW.tenant_id;
    INSERT INTO ar.credit_note_audit_outbox (tenant_id, event_type, event_payload, aggregate_id, sequence_number, correlation_id)
    VALUES (NEW.tenant_id, CASE WHEN TG_OP = 'INSERT' THEN 'CREDIT_NOTE_CREATED' ELSE 'CREDIT_NOTE_UPDATED' END, jsonb_build_object('creditNoteId', NEW.id, 'status', NEW.status, 'amount', NEW.total_amount), NEW.id, v_seq, gen_random_uuid());
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_credit_note_audit_outbox ON ar.credit_notes;
CREATE TRIGGER trg_credit_note_audit_outbox AFTER INSERT OR UPDATE ON ar.credit_notes FOR EACH ROW EXECUTE FUNCTION ar.fn_credit_note_audit_outbox();

ALTER TABLE ar.credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar.credit_note_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar.credit_note_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY credit_notes_tenant_isolation ON ar.credit_notes FOR ALL USING (tenant_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), ''), tenant_id::text)::UUID);
CREATE POLICY credit_note_lines_tenant_isolation ON ar.credit_note_lines FOR ALL USING (tenant_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), ''), tenant_id::text)::UUID);
CREATE POLICY credit_note_applications_tenant_isolation ON ar.credit_note_applications FOR ALL USING (tenant_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), ''), tenant_id::text)::UUID);

ANALYZE ar.credit_notes;
ANALYZE ar.credit_note_lines;
