-- ============================================================================
-- AR-05: AR Aging & Collection Tables
-- Version: 1.1.0 (IMMORTAL-Grade)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ar.aging_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    snapshot_date DATE NOT NULL,
    generated_by UUID NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    total_outstanding DECIMAL(18, 2) DEFAULT 0,
    current_amount DECIMAL(18, 2) DEFAULT 0,
    days_1_to_30 DECIMAL(18, 2) DEFAULT 0,
    days_31_to_60 DECIMAL(18, 2) DEFAULT 0,
    days_61_to_90 DECIMAL(18, 2) DEFAULT 0,
    days_91_to_120 DECIMAL(18, 2) DEFAULT 0,
    over_120_days DECIMAL(18, 2) DEFAULT 0,
    CONSTRAINT uq_aging_snapshot_tenant_date UNIQUE (tenant_id, snapshot_date)
);

CREATE TABLE IF NOT EXISTS ar.customer_aging (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    customer_code VARCHAR(50) NOT NULL,
    customer_name TEXT NOT NULL,
    total_outstanding DECIMAL(18, 2) DEFAULT 0,
    current_amount DECIMAL(18, 2) DEFAULT 0,
    days_1_to_30 DECIMAL(18, 2) DEFAULT 0,
    days_31_to_60 DECIMAL(18, 2) DEFAULT 0,
    days_61_to_90 DECIMAL(18, 2) DEFAULT 0,
    days_91_to_120 DECIMAL(18, 2) DEFAULT 0,
    over_120_days DECIMAL(18, 2) DEFAULT 0,
    oldest_invoice_date DATE,
    average_days_overdue INTEGER DEFAULT 0,
    collection_status VARCHAR(20) DEFAULT 'CURRENT' CHECK (collection_status IN ('CURRENT', 'OVERDUE', 'COLLECTION', 'WRITE_OFF')),
    CONSTRAINT fk_customer_aging_snapshot FOREIGN KEY (snapshot_id) REFERENCES ar.aging_snapshots(id) ON DELETE CASCADE,
    CONSTRAINT uq_customer_aging_snapshot_customer UNIQUE (snapshot_id, customer_id)
);

CREATE TABLE IF NOT EXISTS ar.invoice_aging (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    invoice_id UUID NOT NULL,
    invoice_number VARCHAR(50) NOT NULL,
    customer_id UUID NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    outstanding_amount DECIMAL(18, 2) NOT NULL,
    days_overdue INTEGER DEFAULT 0,
    aging_bucket VARCHAR(20) NOT NULL CHECK (aging_bucket IN ('CURRENT', '1_30', '31_60', '61_90', '91_120', 'OVER_120')),
    CONSTRAINT fk_invoice_aging_snapshot FOREIGN KEY (snapshot_id) REFERENCES ar.aging_snapshots(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ar.collection_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    invoice_id UUID,
    action_type VARCHAR(30) NOT NULL CHECK (action_type IN ('REMINDER', 'PHONE_CALL', 'LETTER', 'ESCALATION', 'PAYMENT_PLAN', 'LEGAL', 'WRITE_OFF', 'NOTE')),
    action_date DATE NOT NULL,
    description TEXT NOT NULL,
    outcome TEXT,
    follow_up_date DATE,
    assigned_to UUID,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_collection_action_customer FOREIGN KEY (tenant_id, customer_id) REFERENCES ar.customers(tenant_id, id)
);

CREATE TABLE IF NOT EXISTS ar.aging_audit_outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_payload JSONB NOT NULL,
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(50) DEFAULT 'AgingSnapshot',
    dispatched BOOLEAN DEFAULT FALSE,
    sequence_number BIGINT NOT NULL,
    correlation_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_aging_outbox_sequence UNIQUE (tenant_id, sequence_number)
);

-- Indexes
CREATE INDEX idx_aging_snapshots_tenant ON ar.aging_snapshots(tenant_id, snapshot_date DESC);
CREATE INDEX idx_customer_aging_snapshot ON ar.customer_aging(snapshot_id);
CREATE INDEX idx_customer_aging_tenant_customer ON ar.customer_aging(tenant_id, customer_id);
CREATE INDEX idx_customer_aging_collection_status ON ar.customer_aging(tenant_id, collection_status);
CREATE INDEX idx_invoice_aging_snapshot ON ar.invoice_aging(snapshot_id);
CREATE INDEX idx_invoice_aging_customer ON ar.invoice_aging(tenant_id, customer_id);
CREATE INDEX idx_invoice_aging_bucket ON ar.invoice_aging(tenant_id, aging_bucket);
CREATE INDEX idx_collection_actions_customer ON ar.collection_actions(tenant_id, customer_id);
CREATE INDEX idx_collection_actions_follow_up ON ar.collection_actions(tenant_id, follow_up_date) WHERE follow_up_date IS NOT NULL;

-- Version trigger for collection actions
CREATE OR REPLACE FUNCTION ar.fn_increment_collection_action_version() RETURNS TRIGGER AS $$
BEGIN NEW.version = OLD.version + 1; NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_collection_action_version ON ar.collection_actions;
CREATE TRIGGER trg_collection_action_version BEFORE UPDATE ON ar.collection_actions FOR EACH ROW EXECUTE FUNCTION ar.fn_increment_collection_action_version();

-- RLS
ALTER TABLE ar.aging_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar.customer_aging ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar.invoice_aging ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar.collection_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY aging_snapshots_tenant_isolation ON ar.aging_snapshots FOR ALL USING (tenant_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), ''), tenant_id::text)::UUID);
CREATE POLICY customer_aging_tenant_isolation ON ar.customer_aging FOR ALL USING (tenant_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), ''), tenant_id::text)::UUID);
CREATE POLICY invoice_aging_tenant_isolation ON ar.invoice_aging FOR ALL USING (tenant_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), ''), tenant_id::text)::UUID);
CREATE POLICY collection_actions_tenant_isolation ON ar.collection_actions FOR ALL USING (tenant_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), ''), tenant_id::text)::UUID);

ANALYZE ar.aging_snapshots;
ANALYZE ar.customer_aging;
ANALYZE ar.invoice_aging;
ANALYZE ar.collection_actions;
