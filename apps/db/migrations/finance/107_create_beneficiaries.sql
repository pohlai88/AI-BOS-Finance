-- ============================================================================
-- AP-05: Beneficiary Management
-- Phase 6b Enhancement: Integration Kit
-- ============================================================================

-- Create beneficiaries table for external system integration
CREATE TABLE finance.beneficiaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES kernel.tenants(id),
    external_id VARCHAR(100) NOT NULL,
    vendor_id VARCHAR(100),
    vendor_name VARCHAR(255) NOT NULL,
    
    -- Bank details
    account_number VARCHAR(50) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    routing_number VARCHAR(20),
    bank_name VARCHAR(255) NOT NULL,
    bank_code VARCHAR(20),
    branch_code VARCHAR(20),
    swift_code VARCHAR(11),
    iban VARCHAR(34),
    country CHAR(2) NOT NULL,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    verified_at TIMESTAMPTZ,
    verified_by UUID,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    
    -- Constraints
    CONSTRAINT uq_beneficiary_external_id UNIQUE (tenant_id, external_id),
    CONSTRAINT chk_beneficiary_status CHECK (status IN ('active', 'inactive', 'pending', 'blocked')),
    CONSTRAINT chk_country_code CHECK (country ~ '^[A-Z]{2}$')
);

-- Add comments
COMMENT ON TABLE finance.beneficiaries IS 'Beneficiary bank details imported from external systems (CONT_08 Integration)';
COMMENT ON COLUMN finance.beneficiaries.external_id IS 'External system identifier for the beneficiary';
COMMENT ON COLUMN finance.beneficiaries.swift_code IS 'SWIFT/BIC code for international transfers';
COMMENT ON COLUMN finance.beneficiaries.iban IS 'International Bank Account Number';

-- Create indexes
CREATE INDEX idx_beneficiaries_tenant 
    ON finance.beneficiaries(tenant_id);
CREATE INDEX idx_beneficiaries_vendor 
    ON finance.beneficiaries(tenant_id, vendor_id);
CREATE INDEX idx_beneficiaries_external 
    ON finance.beneficiaries(tenant_id, external_id);
CREATE INDEX idx_beneficiaries_status 
    ON finance.beneficiaries(tenant_id, status);

-- Enable Row Level Security
ALTER TABLE finance.beneficiaries ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY beneficiaries_tenant_isolation 
ON finance.beneficiaries
FOR ALL
USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON finance.beneficiaries TO finance_app;
GRANT SELECT ON finance.beneficiaries TO finance_reader;

-- Create import log table
CREATE TABLE finance.beneficiary_import_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES kernel.tenants(id),
    imported_at TIMESTAMPTZ DEFAULT NOW(),
    imported_by UUID NOT NULL,
    source VARCHAR(100),
    total_count INT NOT NULL,
    success_count INT NOT NULL,
    skip_count INT NOT NULL,
    error_count INT NOT NULL,
    errors JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE finance.beneficiary_import_logs IS 'Audit log for beneficiary bulk imports';

CREATE INDEX idx_beneficiary_import_logs_tenant 
    ON finance.beneficiary_import_logs(tenant_id, imported_at DESC);

ALTER TABLE finance.beneficiary_import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY beneficiary_import_logs_tenant_isolation 
ON finance.beneficiary_import_logs
FOR ALL
USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

GRANT SELECT, INSERT ON finance.beneficiary_import_logs TO finance_app;
GRANT SELECT ON finance.beneficiary_import_logs TO finance_reader;
