-- ============================================================================
-- KERNEL UPDATED_AT TRIGGER FUNCTION
-- Purpose: Automatically update updated_at timestamp on row updates
-- ============================================================================

-- Create the trigger function in kernel schema
CREATE OR REPLACE FUNCTION kernel.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to kernel tables with updated_at column

-- Tenants
DROP TRIGGER IF EXISTS update_tenants_updated_at ON kernel.tenants;
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON kernel.tenants
    FOR EACH ROW
    EXECUTE FUNCTION kernel.update_updated_at_column();

-- Users
DROP TRIGGER IF EXISTS update_users_updated_at ON kernel.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON kernel.users
    FOR EACH ROW
    EXECUTE FUNCTION kernel.update_updated_at_column();

-- Roles
DROP TRIGGER IF EXISTS update_roles_updated_at ON kernel.roles;
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON kernel.roles
    FOR EACH ROW
    EXECUTE FUNCTION kernel.update_updated_at_column();

-- Canons
DROP TRIGGER IF EXISTS update_canons_updated_at ON kernel.canons;
CREATE TRIGGER update_canons_updated_at
    BEFORE UPDATE ON kernel.canons
    FOR EACH ROW
    EXECUTE FUNCTION kernel.update_updated_at_column();

COMMENT ON FUNCTION kernel.update_updated_at_column() IS 'Trigger function to auto-update updated_at timestamp';
