/**
 * AP-04: Invoice Approval Workflow — Database Migration
 * 
 * Migration: 130_create_invoice_approvals.sql
 * 
 * Creates approval tables with SoD enforcement.
 */

-- Ensure ap schema exists
CREATE SCHEMA IF NOT EXISTS ap;

-- ============================================================================
-- 1. APPROVAL ROUTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ap.approval_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES ap.invoices(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Route Configuration
  total_levels INTEGER NOT NULL CHECK (total_levels >= 1 AND total_levels <= 5),
  route_policy_source VARCHAR(50) CHECK (route_policy_source IN ('tenant', 'vendor', 'category', 'amount', 'default')),
  route_config JSONB NOT NULL,
  
  -- Status
  is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT uq_approval_route_invoice UNIQUE (invoice_id)
);

-- ============================================================================
-- 2. INVOICE APPROVALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ap.invoice_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES ap.invoices(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Approval Level
  approval_level INTEGER NOT NULL CHECK (approval_level >= 1 AND approval_level <= 5),
  total_levels INTEGER NOT NULL CHECK (total_levels >= 1 AND total_levels <= 5),
  
  -- Approver
  approver_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  approver_role VARCHAR(50),
  
  -- Decision
  decision VARCHAR(20) NOT NULL CHECK (decision IN ('pending', 'approved', 'rejected', 'request_changes')),
  comments TEXT,
  
  -- Delegation
  is_delegated BOOLEAN NOT NULL DEFAULT FALSE,
  delegated_from_user_id UUID,
  delegation_reason TEXT,
  
  -- Timing
  actioned_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT uq_invoice_approval_level_approver UNIQUE (invoice_id, approval_level, approver_id)
);

-- ============================================================================
-- 3. SOD ENFORCEMENT TRIGGER (AP04-C01)
-- ============================================================================

CREATE OR REPLACE FUNCTION ap.check_sod_approval()
RETURNS TRIGGER AS $$
DECLARE
  invoice_creator UUID;
BEGIN
  -- Only check on approval decision
  IF NEW.decision = 'approved' AND NEW.approver_id != '00000000-0000-0000-0000-000000000000' THEN
    -- Get invoice creator
    SELECT created_by INTO invoice_creator
    FROM ap.invoices
    WHERE id = NEW.invoice_id;
    
    -- SoD check: approver cannot be the invoice creator
    IF invoice_creator = NEW.approver_id THEN
      RAISE EXCEPTION 'SoD violation: User % cannot approve their own invoice', NEW.approver_id
        USING ERRCODE = 'P0002';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_sod_approval
  BEFORE INSERT OR UPDATE ON ap.invoice_approvals
  FOR EACH ROW
  EXECUTE FUNCTION ap.check_sod_approval();

-- ============================================================================
-- 4. IMMUTABILITY TRIGGER (AP04-C02)
-- ============================================================================

-- Prevent deletion of approval records
CREATE OR REPLACE FUNCTION ap.prevent_approval_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Approval records cannot be deleted (immutable audit chain)'
    USING ERRCODE = 'P0003';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_approval_delete
  BEFORE DELETE ON ap.invoice_approvals
  FOR EACH ROW
  EXECUTE FUNCTION ap.prevent_approval_delete();

-- Prevent modification of approved/rejected decisions
CREATE OR REPLACE FUNCTION ap.prevent_decision_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.decision IN ('approved', 'rejected') AND NEW.decision != OLD.decision THEN
    RAISE EXCEPTION 'Cannot change approval decision after it has been made'
      USING ERRCODE = 'P0004';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_decision_change
  BEFORE UPDATE ON ap.invoice_approvals
  FOR EACH ROW
  EXECUTE FUNCTION ap.prevent_decision_change();

-- ============================================================================
-- 5. INDEXES
-- ============================================================================

-- Route lookups
CREATE INDEX IF NOT EXISTS idx_approval_routes_invoice ON ap.approval_routes(invoice_id);
CREATE INDEX IF NOT EXISTS idx_approval_routes_tenant ON ap.approval_routes(tenant_id);

-- Approval lookups
CREATE INDEX IF NOT EXISTS idx_invoice_approvals_invoice ON ap.invoice_approvals(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_approvals_approver ON ap.invoice_approvals(tenant_id, approver_id);

-- Pending approvals queue
CREATE INDEX IF NOT EXISTS idx_invoice_approvals_pending ON ap.invoice_approvals(tenant_id, created_at ASC)
  WHERE decision = 'pending';

-- Approved invoices history
CREATE INDEX IF NOT EXISTS idx_invoice_approvals_approved ON ap.invoice_approvals(tenant_id, actioned_at DESC)
  WHERE decision = 'approved';

-- ============================================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE ap.approval_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ap.invoice_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_approval_routes ON ap.approval_routes
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_invoice_approvals ON ap.invoice_approvals
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- ============================================================================
-- 7. COMMENTS
-- ============================================================================

COMMENT ON TABLE ap.approval_routes IS 'AP-04: Approval routing configuration per invoice';
COMMENT ON TABLE ap.invoice_approvals IS 'AP-04: Individual approval decisions with SoD enforcement';
COMMENT ON TRIGGER trg_check_sod_approval ON ap.invoice_approvals IS 'AP04-C01: Maker ≠ Checker enforcement';
COMMENT ON TRIGGER trg_prevent_approval_delete ON ap.invoice_approvals IS 'AP04-C02: Immutable approval chain';
