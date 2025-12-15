// metadata-studio/services/compliance.service.ts

/**
 * Compliance Service
 * 
 * GRCD Phase 3: Compliance Orchestra
 * 
 * Continuous compliance monitoring against regulatory standards.
 */

import { db } from '../db/client';
import { mdmComplianceCheck, type ComplianceFinding } from '../db/schema/auto-apply.tables';
import { mdmGlobalMetadata } from '../db/schema/metadata.tables';
import { mdmBusinessRule } from '../db/schema/business-rule.tables';
import { mdmLineageField } from '../db/schema/lineage.tables';
import { eq, and, sql, isNull } from 'drizzle-orm';

// ============================================================================
// Types
// ============================================================================

export type Standard = 'MFRS' | 'IFRS' | 'GDPR' | 'PDPA' | 'SOC2' | 'ISO27001';

export interface ComplianceCheckResult {
  standard: Standard;
  scope: string;
  status: 'compliant' | 'non_compliant' | 'partially_compliant' | 'not_applicable';
  coveragePercent: number;
  findings: ComplianceFinding[];
  checkedAt: string;
}

// ============================================================================
// Standard-Specific Rules
// ============================================================================

const COMPLIANCE_RULES: Record<Standard, {
  code: string;
  description: string;
  check: (tenantId: string, scope: string) => Promise<ComplianceFinding | null>;
}[]> = {
  MFRS: [
    {
      code: 'MFRS-001',
      description: 'All Tier 1 financial metadata must have lineage',
      check: async (tenantId, scope) => {
        const tier1NoLineage = await checkTier1Lineage(tenantId, scope);
        if (tier1NoLineage.length > 0) {
          return {
            code: 'MFRS-001',
            severity: 'critical',
            description: 'Tier 1 financial metadata missing lineage documentation',
            affectedEntities: tier1NoLineage,
            recommendation: 'Add lineage for all Tier 1 metadata to ensure MFRS audit trail',
          };
        }
        return null;
      },
    },
    {
      code: 'MFRS-002',
      description: 'All financial calculations must have business rule definitions',
      check: async (tenantId, scope) => {
        const missingRules = await checkBusinessRuleCoverage(tenantId, scope);
        if (missingRules.length > 0) {
          return {
            code: 'MFRS-002',
            severity: 'high',
            description: 'Financial metadata without business rule definitions',
            affectedEntities: missingRules,
            recommendation: 'Define business rules for all financial calculations',
          };
        }
        return null;
      },
    },
    {
      code: 'MFRS-003',
      description: 'All Tier 1 metadata must have descriptions',
      check: async (tenantId, scope) => {
        const missingDesc = await checkMissingDescriptions(tenantId, 'tier1', scope);
        if (missingDesc.length > 0) {
          return {
            code: 'MFRS-003',
            severity: 'high',
            description: 'Tier 1 metadata missing descriptions',
            affectedEntities: missingDesc,
            recommendation: 'Add detailed descriptions for all Tier 1 metadata',
          };
        }
        return null;
      },
    },
  ],
  IFRS: [
    {
      code: 'IFRS-001',
      description: 'Revenue recognition metadata must be properly classified',
      check: async (tenantId, scope) => {
        // Check for revenue-related metadata with proper domain classification
        const results = await db
          .select({ canonicalKey: mdmGlobalMetadata.canonicalKey })
          .from(mdmGlobalMetadata)
          .where(
            and(
              eq(mdmGlobalMetadata.tenantId, tenantId),
              sql`${mdmGlobalMetadata.canonicalKey} LIKE '%revenue%'`,
              isNull(mdmGlobalMetadata.domain),
            ),
          );
        
        if (results.length > 0) {
          return {
            code: 'IFRS-001',
            severity: 'high',
            description: 'Revenue metadata missing domain classification',
            affectedEntities: results.map(r => r.canonicalKey),
            recommendation: 'Classify all revenue metadata with appropriate domain',
          };
        }
        return null;
      },
    },
  ],
  GDPR: [
    {
      code: 'GDPR-001',
      description: 'Personal data fields must be tagged',
      check: async (tenantId, scope) => {
        // Check for fields that might contain personal data but aren't tagged
        const potentialPII = await db
          .select({ canonicalKey: mdmGlobalMetadata.canonicalKey })
          .from(mdmGlobalMetadata)
          .where(
            and(
              eq(mdmGlobalMetadata.tenantId, tenantId),
              sql`(
                ${mdmGlobalMetadata.canonicalKey} LIKE '%name%' OR
                ${mdmGlobalMetadata.canonicalKey} LIKE '%email%' OR
                ${mdmGlobalMetadata.canonicalKey} LIKE '%phone%' OR
                ${mdmGlobalMetadata.canonicalKey} LIKE '%address%'
              )`,
              eq(mdmGlobalMetadata.tier, 'tier3'), // Should be higher tier for PII
            ),
          );
        
        if (potentialPII.length > 0) {
          return {
            code: 'GDPR-001',
            severity: 'critical',
            description: 'Potential PII fields not properly classified',
            affectedEntities: potentialPII.map(r => r.canonicalKey),
            recommendation: 'Review and classify as Tier 1/2 with appropriate data handling rules',
          };
        }
        return null;
      },
    },
  ],
  PDPA: [
    {
      code: 'PDPA-001',
      description: 'Personal data must have retention policies',
      check: async (tenantId, scope) => {
        // Similar to GDPR but for Malaysia PDPA
        return null; // Simplified for now
      },
    },
  ],
  SOC2: [
    {
      code: 'SOC2-001',
      description: 'All data changes must be auditable',
      check: async (tenantId, scope) => {
        // Check if change history is being captured
        return null; // Simplified - Phase 3 adds change history
      },
    },
  ],
  ISO27001: [
    {
      code: 'ISO27001-001',
      description: 'Data classification scheme must be complete',
      check: async (tenantId, scope) => {
        const unclassified = await db
          .select({ count: sql<number>`count(*)` })
          .from(mdmGlobalMetadata)
          .where(
            and(
              eq(mdmGlobalMetadata.tenantId, tenantId),
              isNull(mdmGlobalMetadata.tier),
            ),
          );
        
        if ((unclassified[0]?.count ?? 0) > 0) {
          return {
            code: 'ISO27001-001',
            severity: 'high',
            description: 'Metadata without tier classification',
            affectedEntities: [`${unclassified[0]?.count} unclassified entities`],
            recommendation: 'Assign governance tiers to all metadata',
          };
        }
        return null;
      },
    },
  ],
};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Run compliance check for a standard
 */
export async function runComplianceCheck(
  tenantId: string,
  standard: Standard,
  scope: string,
  checkedBy: string,
): Promise<ComplianceCheckResult> {
  const rules = COMPLIANCE_RULES[standard] || [];
  const findings: ComplianceFinding[] = [];

  // Run all checks for the standard
  for (const rule of rules) {
    const finding = await rule.check(tenantId, scope);
    if (finding) {
      findings.push(finding);
    }
  }

  // Calculate coverage
  const passedChecks = rules.length - findings.length;
  const coveragePercent = rules.length > 0 
    ? Math.round((passedChecks / rules.length) * 100)
    : 100;

  // Determine status
  let status: ComplianceCheckResult['status'];
  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const highCount = findings.filter(f => f.severity === 'high').length;

  if (findings.length === 0) {
    status = 'compliant';
  } else if (criticalCount > 0) {
    status = 'non_compliant';
  } else if (highCount > 0) {
    status = 'partially_compliant';
  } else {
    status = 'partially_compliant';
  }

  const checkedAt = new Date();

  // Store the check result
  await db.insert(mdmComplianceCheck).values({
    tenantId,
    standard,
    scope,
    status,
    coveragePercent,
    findings,
    remediationRequired: findings.length > 0,
    checkedAt,
    checkedBy,
    nextCheckAt: new Date(checkedAt.getTime() + 7 * 24 * 60 * 60 * 1000), // Weekly
  });

  return {
    standard,
    scope,
    status,
    coveragePercent,
    findings,
    checkedAt: checkedAt.toISOString(),
  };
}

/**
 * Get latest compliance status for all standards
 */
export async function getComplianceDashboard(
  tenantId: string,
): Promise<Record<Standard, ComplianceCheckResult | null>> {
  const standards: Standard[] = ['MFRS', 'IFRS', 'GDPR', 'PDPA', 'SOC2', 'ISO27001'];
  const dashboard: Record<string, ComplianceCheckResult | null> = {};

  for (const standard of standards) {
    const [latest] = await db
      .select()
      .from(mdmComplianceCheck)
      .where(
        and(
          eq(mdmComplianceCheck.tenantId, tenantId),
          eq(mdmComplianceCheck.standard, standard),
        ),
      )
      .orderBy(sql`${mdmComplianceCheck.checkedAt} DESC`)
      .limit(1);

    dashboard[standard] = latest ? {
      standard,
      scope: latest.scope,
      status: latest.status,
      coveragePercent: latest.coveragePercent,
      findings: latest.findings as ComplianceFinding[],
      checkedAt: latest.checkedAt.toISOString(),
    } : null;
  }

  return dashboard as Record<Standard, ComplianceCheckResult | null>;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function checkTier1Lineage(tenantId: string, scope: string): Promise<string[]> {
  const tier1 = await db
    .select({ id: mdmGlobalMetadata.id, canonicalKey: mdmGlobalMetadata.canonicalKey })
    .from(mdmGlobalMetadata)
    .where(
      and(
        eq(mdmGlobalMetadata.tenantId, tenantId),
        eq(mdmGlobalMetadata.tier, 'tier1'),
        scope !== 'ALL' ? eq(mdmGlobalMetadata.domain, scope) : sql`1=1`,
      ),
    );

  const lineageTargets = await db
    .select({ targetId: mdmLineageField.targetMetadataId })
    .from(mdmLineageField)
    .where(eq(mdmLineageField.tenantId, tenantId));

  const coveredIds = new Set(lineageTargets.map(l => l.targetId));
  
  return tier1
    .filter(t => !coveredIds.has(t.id))
    .map(t => t.canonicalKey);
}

async function checkBusinessRuleCoverage(tenantId: string, scope: string): Promise<string[]> {
  // Get all calculation-type metadata
  const calculations = await db
    .select({ canonicalKey: mdmGlobalMetadata.canonicalKey })
    .from(mdmGlobalMetadata)
    .where(
      and(
        eq(mdmGlobalMetadata.tenantId, tenantId),
        sql`(
          ${mdmGlobalMetadata.canonicalKey} LIKE '%total%' OR
          ${mdmGlobalMetadata.canonicalKey} LIKE '%sum%' OR
          ${mdmGlobalMetadata.canonicalKey} LIKE '%calculated%' OR
          ${mdmGlobalMetadata.canonicalKey} LIKE '%derived%'
        )`,
        scope !== 'ALL' ? eq(mdmGlobalMetadata.domain, scope) : sql`1=1`,
      ),
    );

  // Get all business rules
  const rules = await db
    .select({ key: mdmBusinessRule.key })
    .from(mdmBusinessRule)
    .where(eq(mdmBusinessRule.tenantId, tenantId));

  const ruleKeys = new Set(rules.map(r => r.key));
  
  return calculations
    .filter(c => !ruleKeys.has(c.canonicalKey))
    .map(c => c.canonicalKey)
    .slice(0, 10); // Limit to first 10
}

async function checkMissingDescriptions(
  tenantId: string,
  tier: string,
  scope: string,
): Promise<string[]> {
  const results = await db
    .select({ canonicalKey: mdmGlobalMetadata.canonicalKey })
    .from(mdmGlobalMetadata)
    .where(
      and(
        eq(mdmGlobalMetadata.tenantId, tenantId),
        eq(mdmGlobalMetadata.tier, tier),
        sql`(${mdmGlobalMetadata.description} IS NULL OR ${mdmGlobalMetadata.description} = '')`,
        scope !== 'ALL' ? eq(mdmGlobalMetadata.domain, scope) : sql`1=1`,
      ),
    );

  return results.map(r => r.canonicalKey);
}

