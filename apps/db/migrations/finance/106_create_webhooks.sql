-- ============================================================================
-- AP-05: Webhook Management
-- Phase 6b Enhancement: Integration Kit
-- ============================================================================

-- Create webhook registrations table
CREATE TABLE finance.webhook_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES kernel.tenants(id),
    event_type VARCHAR(100) NOT NULL,
    target_url TEXT NOT NULL,
    secret_hash VARCHAR(64) NOT NULL,
    filters JSONB DEFAULT '[]',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_triggered_at TIMESTAMPTZ,
    failure_count INT DEFAULT 0,
    
    CONSTRAINT chk_webhook_status CHECK (status IN ('active', 'paused', 'disabled')),
    CONSTRAINT chk_event_type CHECK (event_type LIKE 'finance.ap.payment.%')
);

-- Add comments
COMMENT ON TABLE finance.webhook_registrations IS 'Webhook subscriptions for payment events (CONT_08 Integration)';
COMMENT ON COLUMN finance.webhook_registrations.event_type IS 'Event type pattern, e.g., finance.ap.payment.approved';
COMMENT ON COLUMN finance.webhook_registrations.secret_hash IS 'SHA-256 hash of the webhook secret for signing';
COMMENT ON COLUMN finance.webhook_registrations.filters IS 'JSON array of filter conditions for selective triggering';

-- Create indexes
CREATE INDEX idx_webhook_registrations_tenant 
    ON finance.webhook_registrations(tenant_id);
CREATE INDEX idx_webhook_registrations_event 
    ON finance.webhook_registrations(tenant_id, event_type) 
    WHERE status = 'active';
CREATE INDEX idx_webhook_registrations_status 
    ON finance.webhook_registrations(status);

-- Create webhook deliveries table (outbox pattern)
CREATE TABLE finance.webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID NOT NULL REFERENCES finance.webhook_registrations(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    signature VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    attempt_count INT DEFAULT 0,
    max_attempts INT DEFAULT 5,
    last_attempt_at TIMESTAMPTZ,
    next_attempt_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT chk_delivery_status CHECK (status IN ('pending', 'delivered', 'failed', 'abandoned'))
);

-- Add comments
COMMENT ON TABLE finance.webhook_deliveries IS 'Webhook delivery queue (outbox pattern)';
COMMENT ON COLUMN finance.webhook_deliveries.signature IS 'HMAC-SHA256 signature for payload verification';
COMMENT ON COLUMN finance.webhook_deliveries.next_attempt_at IS 'Scheduled time for next delivery attempt (exponential backoff)';

-- Create indexes for delivery processing
CREATE INDEX idx_webhook_deliveries_pending 
    ON finance.webhook_deliveries(next_attempt_at) 
    WHERE status = 'pending';
CREATE INDEX idx_webhook_deliveries_webhook 
    ON finance.webhook_deliveries(webhook_id);

-- Enable Row Level Security
ALTER TABLE finance.webhook_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY webhook_registrations_tenant_isolation 
ON finance.webhook_registrations
FOR ALL
USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

CREATE POLICY webhook_deliveries_tenant_isolation 
ON finance.webhook_deliveries
FOR ALL
USING (
    webhook_id IN (
        SELECT id FROM finance.webhook_registrations 
        WHERE tenant_id = current_setting('app.current_tenant_id', true)::UUID
    )
);

-- Function to update failure count on delivery failure
CREATE OR REPLACE FUNCTION finance.update_webhook_failure_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'failed' OR NEW.status = 'abandoned' THEN
        UPDATE finance.webhook_registrations
        SET failure_count = failure_count + 1,
            updated_at = NOW()
        WHERE id = NEW.webhook_id;
        
        -- Auto-disable after too many failures
        UPDATE finance.webhook_registrations
        SET status = 'disabled',
            updated_at = NOW()
        WHERE id = NEW.webhook_id
          AND failure_count >= 10;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_webhook_delivery_failure
    AFTER UPDATE OF status ON finance.webhook_deliveries
    FOR EACH ROW
    WHEN (NEW.status IN ('failed', 'abandoned'))
    EXECUTE FUNCTION finance.update_webhook_failure_count();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON finance.webhook_registrations TO finance_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON finance.webhook_deliveries TO finance_app;
GRANT SELECT ON finance.webhook_registrations TO finance_reader;
GRANT SELECT ON finance.webhook_deliveries TO finance_reader;
