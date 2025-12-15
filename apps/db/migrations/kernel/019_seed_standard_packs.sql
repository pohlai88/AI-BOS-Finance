-- Migration: 019_seed_standard_packs.sql
-- Purpose: Seed Standard Packs and update Tier1/Tier2 fields for GRCD compliance
-- CONT_06: Schema and Type Governance - Legitimize the governance foundation
--
-- This migration ensures:
-- 1. All Tier1 (Constitutional) fields are anchored to SYS-CORE-01 (AI-BOS Constitution)
-- 2. All Tier2 (Governed) fields are anchored to appropriate standards (MFRS, SOC2)
-- 3. GRCD rules pass with zero violations
--
-- Applied: 2025-12-15
-- Author: system

-- ============================================================================
-- STEP 1: Seed Standard Packs
-- These define "who says so" for governance requirements
-- ============================================================================

INSERT INTO mdm_standard_pack (
  pack_id, pack_name, version, description, 
  category, tier, status, is_primary, 
  standard_body, standard_reference, created_by
) VALUES
-- Tier 1: Constitutional (AI-BOS Core)
(
  'SYS-CORE-01',
  'AI-BOS System Constitution',
  '1.0.0',
  'Core identity and tenancy fields mandated by AI-BOS Constitution (CONT_00)',
  'security',
  'tier1',
  'active',
  true,
  'AI-BOS',
  'packages/canon/A-Governance/A-CONT/CONT_00_Constitution.md',
  'system'
),

-- Tier 2: Malaysian Financial Reporting Standards
(
  'MFRS-101',
  'MFRS 101 - Presentation of Financial Statements',
  '2024.1',
  'Requirements for the general presentation of financial statements, guidelines for their structure and minimum requirements for their content',
  'accounting',
  'tier2',
  'active',
  true,
  'MASB',
  'https://www.masb.org.my/pages.php?id=88',
  'system'
),
(
  'MFRS-15',
  'MFRS 15 - Revenue from Contracts with Customers',
  '2024.1',
  'Revenue recognition standard for contracts with customers',
  'accounting',
  'tier2',
  'active',
  false,
  'MASB',
  'https://www.masb.org.my/pages.php?id=88',
  'system'
),

-- Tier 2: SOC2 Compliance
(
  'SOC2-IAM',
  'SOC2 Identity & Access Management',
  '2024.1',
  'Trust Services Criteria for Security - Identity and Access Management controls',
  'compliance',
  'tier2',
  'active',
  true,
  'AICPA',
  'https://www.aicpa.org/soc',
  'system'
),
(
  'SOC2-AUDIT',
  'SOC2 Audit & Logging',
  '2024.1',
  'Trust Services Criteria for Security - Audit trail and logging requirements',
  'compliance',
  'tier2',
  'active',
  false,
  'AICPA',
  'https://www.aicpa.org/soc',
  'system'
)
ON CONFLICT (pack_id) DO UPDATE SET
  pack_name = EXCLUDED.pack_name,
  version = EXCLUDED.version,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ============================================================================
-- STEP 2: Update Tier1 fields with SYS-CORE-01 (Constitutional)
-- These are the foundational identity and tenancy fields
-- ============================================================================

UPDATE mdm_global_metadata
SET 
  tier = 'tier1',
  standard_pack_id = 'SYS-CORE-01',
  updated_at = NOW(),
  updated_by = 'system'
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
  AND canonical_key IN (
    'kernel.tenants.id',
    'kernel.tenants.created_at',
    'kernel.tenants.updated_at',
    'kernel.users.id',
    'kernel.users.tenant_id',
    'kernel.users.created_at',
    'kernel.users.updated_at'
  );

-- ============================================================================
-- STEP 3: Update Tier2 fields with MFRS-101 (Financial Governance)
-- These are the governed financial fields per MASB standards
-- ============================================================================

UPDATE mdm_global_metadata
SET 
  tier = 'tier2',
  standard_pack_id = 'MFRS-101',
  updated_at = NOW(),
  updated_by = 'system'
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
  AND canonical_key IN (
    'finance.journal_entries.journal_date',
    'finance.journal_entries.posted_at',
    'finance.journal_lines.debit_amount',
    'finance.journal_lines.credit_amount',
    'finance.accounts.account_code',
    'finance.accounts.account_type'
  );

-- ============================================================================
-- VERIFICATION: GRCD Rule Check
-- This query should return ZERO rows if all rules are satisfied
-- ============================================================================

-- Rule: Tier1/Tier2 MUST have standard_pack_id
DO $$
DECLARE
  violation_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO violation_count
  FROM mdm_global_metadata
  WHERE tier IN ('tier1', 'tier2')
    AND (standard_pack_id IS NULL OR standard_pack_id = '');
  
  IF violation_count > 0 THEN
    RAISE EXCEPTION 'GRCD VIOLATION: % tier1/tier2 fields are missing standard_pack_id', violation_count;
  END IF;
  
  RAISE NOTICE 'GRCD VALIDATION PASSED: All tier1/tier2 fields have standard_pack_id';
END $$;
