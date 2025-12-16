-- ============================================================================
-- AP-05: Payment Exception Resolution Tracking
-- Phase 6a Enhancement: Exception Queue
-- ============================================================================
-- Description: Tracks resolution of payment exceptions (missing invoices,
--              stale approvals, duplicate risks, etc.)
-- Author: AI-BOS Finance Team
-- Date: 2025-12-16
-- ============================================================================

-- Create exception resolutions table
CREATE TABLE finance.payment_exception_resolutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES kernel.tenants(id),
    exception_id VARCHAR(100) NOT NULL,
    payment_id UUID REFERENCES finance.payments(id),
    exception_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    
    -- Resolution details
    resolution TEXT NOT NULL,
    resolved_by UUID NOT NULL,
    resolved_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Original exception context
    original_message TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT uq_exception_resolution UNIQUE (tenant_id, exception_id),
    CONSTRAINT chk_exception_type CHECK (exception_type IN (
        'MISSING_INVOICE',
        'STALE_APPROVAL',
        'DUPLICATE_RISK',
        'BANK_DETAIL_CHANGED',
        'OVER_LIMIT',
        'PERIOD_WARNING'
    )),
    CONSTRAINT chk_severity CHECK (severity IN ('info', 'warning', 'critical', 'block'))
);

-- Add comments
COMMENT ON TABLE finance.payment_exception_resolutions IS 
    'Tracks resolution of payment exceptions detected by ExceptionService';
COMMENT ON COLUMN finance.payment_exception_resolutions.exception_id IS 
    'Unique identifier for the exception (format: exc_{payment_id}_{type})';
COMMENT ON COLUMN finance.payment_exception_resolutions.exception_type IS 
    'Type of exception that was resolved';
COMMENT ON COLUMN finance.payment_exception_resolutions.resolution IS 
    'Human-readable explanation of how the exception was resolved';
COMMENT ON COLUMN finance.payment_exception_resolutions.metadata IS 
    'Additional context about the exception and resolution';

-- Create indexes for efficient querying
CREATE INDEX idx_exception_resolutions_tenant 
    ON finance.payment_exception_resolutions(tenant_id);

CREATE INDEX idx_exception_resolutions_payment 
    ON finance.payment_exception_resolutions(payment_id);

CREATE INDEX idx_exception_resolutions_type 
    ON finance.payment_exception_resolutions(tenant_id, exception_type);

CREATE INDEX idx_exception_resolutions_resolved_at 
    ON finance.payment_exception_resolutions(tenant_id, resolved_at DESC);

CREATE INDEX idx_exception_resolutions_resolver 
    ON finance.payment_exception_resolutions(resolved_by);

-- Enable Row Level Security
ALTER TABLE finance.payment_exception_resolutions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Tenant isolation
CREATE POLICY exception_resolutions_tenant_isolation 
    ON finance.payment_exception_resolutions
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create RLS policy: Users can only resolve if they have payment access
CREATE POLICY exception_resolutions_user_access
    ON finance.payment_exception_resolutions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM finance.payments p
            WHERE p.id = payment_exception_resolutions.payment_id
            AND p.tenant_id = current_setting('app.current_tenant_id')::UUID
        )
    );

-- Grant permissions
GRANT SELECT, INSERT ON finance.payment_exception_resolutions TO authenticated;
GRANT SELECT ON finance.payment_exception_resolutions TO service_role;

-- ============================================================================
-- Example Query: Get unresolved exceptions for a payment
-- ============================================================================
-- SELECT 
--     e.id, e.type, e.severity, e.message,
--     CASE 
--         WHEN r.id IS NOT NULL THEN 'resolved'
--         ELSE 'open'
--     END as status,
--     r.resolution, r.resolved_by, r.resolved_at
-- FROM (
--     -- This would come from ExceptionService.detectExceptions()
--     SELECT * FROM unnest(ARRAY[...]) AS exception
-- ) e
-- LEFT JOIN finance.payment_exception_resolutions r
--     ON r.exception_id = e.id AND r.tenant_id = e.tenant_id;

-- ============================================================================
-- Example Query: Exception resolution history for a tenant
-- ============================================================================
-- SELECT 
--     DATE_TRUNC('day', resolved_at) as date,
--     exception_type,
--     COUNT(*) as resolution_count,
--     AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))) as avg_resolution_time_seconds
-- FROM finance.payment_exception_resolutions
-- WHERE tenant_id = $1
--     AND resolved_at >= NOW() - INTERVAL '30 days'
-- GROUP BY DATE_TRUNC('day', resolved_at), exception_type
-- ORDER BY date DESC, exception_type;
