// metadata-studio/agents/data-quality-sentinel.ts

/**
 * DataQualitySentinel Agent
 * 
 * GRCD Phase 2: Autonomous Data Quality Agent (Tier 1/2)
 * 
 * This agent monitors metadata quality and proposes improvements:
 * - Missing required fields (descriptions, domains, tiers)
 * - Orphaned metadata (no lineage connections)
 * - Naming convention violations
 * - Stale metadata (not updated in X days)
 * - Inconsistent tier assignments
 * 
 * Autonomy Level:
 * - Tier 1/2: Proposes changes requiring human approval
 * - Never auto-applies changes without human review
 */

import { db } from '../db/client';
import { mdmGlobalMetadata } from '../db/schema/metadata.tables';
import { mdmLineageField } from '../db/schema/lineage.tables';
import { eq, and, isNull, lt, sql, notInArray } from 'drizzle-orm';
import { validateName } from '../services/naming-policy.service';
import { createAgentProposal, type AgentEvidence } from '../services/agent-proposal.service';

// ============================================================================
// Constants
// ============================================================================

const AGENT_TYPE = 'data_quality_sentinel' as const;
const AGENT_VERSION = '1.0.0';

// Thresholds
const STALE_DAYS_WARNING = 90;
const STALE_DAYS_CRITICAL = 180;

// ============================================================================
// Types
// ============================================================================

export interface QualityIssue {
  entityId: string;
  canonicalKey: string;
  issueType: 
    | 'missing_description'
    | 'missing_domain'
    | 'missing_tier'
    | 'orphaned_metadata'
    | 'naming_violation'
    | 'stale_metadata'
    | 'inconsistent_tier';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  suggestion: string;
  evidence: AgentEvidence;
}

export interface QualityScanResult {
  tenantId: string;
  scanTimestamp: string;
  totalEntities: number;
  issuesFound: number;
  issues: QualityIssue[];
  proposalsCreated: number;
}

// ============================================================================
// Core Scanning Functions
// ============================================================================

/**
 * Run a full quality scan for a tenant
 */
export async function runQualityScan(tenantId: string): Promise<QualityScanResult> {
  const scanTimestamp = new Date().toISOString();
  const issues: QualityIssue[] = [];

  // Get all metadata for tenant
  const allMetadata = await db
    .select()
    .from(mdmGlobalMetadata)
    .where(
      and(
        eq(mdmGlobalMetadata.tenantId, tenantId),
        eq(mdmGlobalMetadata.status, 'active'),
      ),
    );

  // Run all checks
  const [
    missingDescriptions,
    orphanedMetadata,
    namingViolations,
    staleMetadata,
  ] = await Promise.all([
    checkMissingDescriptions(allMetadata, tenantId),
    checkOrphanedMetadata(allMetadata, tenantId),
    checkNamingViolations(allMetadata, tenantId),
    checkStaleMetadata(allMetadata, tenantId),
  ]);

  issues.push(
    ...missingDescriptions,
    ...orphanedMetadata,
    ...namingViolations,
    ...staleMetadata,
  );

  return {
    tenantId,
    scanTimestamp,
    totalEntities: allMetadata.length,
    issuesFound: issues.length,
    issues,
    proposalsCreated: 0, // Will be updated if proposals are created
  };
}

/**
 * Run scan and create proposals for critical/high issues
 */
export async function runQualityScanWithProposals(tenantId: string): Promise<QualityScanResult> {
  const result = await runQualityScan(tenantId);
  let proposalsCreated = 0;

  // Create proposals for critical and high severity issues
  const criticalAndHigh = result.issues.filter(
    i => i.severity === 'critical' || i.severity === 'high',
  );

  for (const issue of criticalAndHigh) {
    try {
      await createProposalForIssue(issue, tenantId);
      proposalsCreated++;
    } catch (error) {
      console.error(`Failed to create proposal for ${issue.canonicalKey}:`, error);
    }
  }

  return {
    ...result,
    proposalsCreated,
  };
}

// ============================================================================
// Individual Check Functions
// ============================================================================

/**
 * Check for missing descriptions
 */
async function checkMissingDescriptions(
  metadata: typeof mdmGlobalMetadata.$inferSelect[],
  tenantId: string,
): Promise<QualityIssue[]> {
  const issues: QualityIssue[] = [];

  for (const m of metadata) {
    if (!m.description || m.description.trim().length < 10) {
      // Tier 1 missing description is critical
      const severity = m.tier === 'tier1' ? 'critical' : 
                       m.tier === 'tier2' ? 'high' : 'medium';

      issues.push({
        entityId: m.id,
        canonicalKey: m.canonicalKey,
        issueType: 'missing_description',
        severity,
        description: `Metadata "${m.canonicalKey}" has ${m.description ? 'insufficient' : 'no'} description`,
        suggestion: `Add a detailed description explaining the business meaning of ${m.label}`,
        evidence: {
          trigger: 'missing_description_check',
          dataPoints: [
            { source: 'mdm_global_metadata.description', value: m.description ?? 'null', timestamp: m.updatedAt.toISOString() },
            { source: 'mdm_global_metadata.tier', value: m.tier },
          ],
        },
      });
    }
  }

  return issues;
}

/**
 * Check for orphaned metadata (no lineage connections)
 */
async function checkOrphanedMetadata(
  metadata: typeof mdmGlobalMetadata.$inferSelect[],
  tenantId: string,
): Promise<QualityIssue[]> {
  const issues: QualityIssue[] = [];

  // Get all metadata IDs that have lineage connections
  const lineageEdges = await db
    .select({
      sourceId: mdmLineageField.sourceMetadataId,
      targetId: mdmLineageField.targetMetadataId,
    })
    .from(mdmLineageField)
    .where(eq(mdmLineageField.tenantId, tenantId));

  const connectedIds = new Set([
    ...lineageEdges.map(e => e.sourceId),
    ...lineageEdges.map(e => e.targetId),
  ]);

  // Find metadata with no lineage (Tier 1 should always have lineage)
  for (const m of metadata) {
    if (!connectedIds.has(m.id) && (m.tier === 'tier1' || m.tier === 'tier2')) {
      issues.push({
        entityId: m.id,
        canonicalKey: m.canonicalKey,
        issueType: 'orphaned_metadata',
        severity: m.tier === 'tier1' ? 'high' : 'medium',
        description: `${m.tier} metadata "${m.canonicalKey}" has no lineage connections`,
        suggestion: `Add lineage to show data flow for ${m.label}`,
        evidence: {
          trigger: 'orphaned_metadata_check',
          dataPoints: [
            { source: 'lineage_count', value: 0 },
            { source: 'mdm_global_metadata.tier', value: m.tier },
          ],
        },
      });
    }
  }

  return issues;
}

/**
 * Check for naming convention violations
 */
async function checkNamingViolations(
  metadata: typeof mdmGlobalMetadata.$inferSelect[],
  tenantId: string,
): Promise<QualityIssue[]> {
  const issues: QualityIssue[] = [];

  for (const m of metadata) {
    const validation = await validateName(
      m.canonicalKey,
      'canonical_key',
      m.domain,
      tenantId,
    );

    if (!validation.isValid && validation.errors.length > 0) {
      issues.push({
        entityId: m.id,
        canonicalKey: m.canonicalKey,
        issueType: 'naming_violation',
        severity: m.tier === 'tier1' ? 'high' : 'medium',
        description: `Canonical key "${m.canonicalKey}" violates naming policy: ${validation.errors[0].message}`,
        suggestion: validation.errors[0].suggestion ?? 'Update the canonical key to follow naming conventions',
        evidence: {
          trigger: 'naming_policy_check',
          dataPoints: [
            { source: 'canonical_key', value: m.canonicalKey },
            { source: 'policy_key', value: validation.errors[0].policyKey },
            { source: 'violation', value: validation.errors[0].message },
          ],
        },
      });
    }
  }

  return issues;
}

/**
 * Check for stale metadata (not updated recently)
 */
async function checkStaleMetadata(
  metadata: typeof mdmGlobalMetadata.$inferSelect[],
  tenantId: string,
): Promise<QualityIssue[]> {
  const issues: QualityIssue[] = [];
  const now = new Date();

  for (const m of metadata) {
    const daysSinceUpdate = Math.floor(
      (now.getTime() - m.updatedAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceUpdate >= STALE_DAYS_CRITICAL) {
      issues.push({
        entityId: m.id,
        canonicalKey: m.canonicalKey,
        issueType: 'stale_metadata',
        severity: m.tier === 'tier1' ? 'high' : 'medium',
        description: `Metadata "${m.canonicalKey}" has not been updated in ${daysSinceUpdate} days`,
        suggestion: 'Review and update the metadata to ensure it reflects current business requirements',
        evidence: {
          trigger: 'stale_metadata_check',
          dataPoints: [
            { source: 'days_since_update', value: daysSinceUpdate },
            { source: 'last_updated', value: m.updatedAt.toISOString() },
            { source: 'threshold_critical', value: STALE_DAYS_CRITICAL },
          ],
        },
      });
    } else if (daysSinceUpdate >= STALE_DAYS_WARNING && m.tier === 'tier1') {
      issues.push({
        entityId: m.id,
        canonicalKey: m.canonicalKey,
        issueType: 'stale_metadata',
        severity: 'low',
        description: `Tier 1 metadata "${m.canonicalKey}" approaching staleness (${daysSinceUpdate} days since update)`,
        suggestion: 'Consider reviewing this metadata soon',
        evidence: {
          trigger: 'stale_metadata_warning_check',
          dataPoints: [
            { source: 'days_since_update', value: daysSinceUpdate },
            { source: 'last_updated', value: m.updatedAt.toISOString() },
            { source: 'threshold_warning', value: STALE_DAYS_WARNING },
          ],
        },
      });
    }
  }

  return issues;
}

// ============================================================================
// Proposal Creation
// ============================================================================

/**
 * Create an agent proposal for a quality issue
 */
async function createProposalForIssue(
  issue: QualityIssue,
  tenantId: string,
): Promise<void> {
  // Get current metadata state
  const [currentState] = await db
    .select()
    .from(mdmGlobalMetadata)
    .where(eq(mdmGlobalMetadata.id, issue.entityId))
    .limit(1);

  if (!currentState) {
    return;
  }

  const confidenceMap: Record<string, 'high' | 'medium' | 'low'> = {
    missing_description: 'high',
    orphaned_metadata: 'medium',
    naming_violation: 'high',
    stale_metadata: 'medium',
  };

  const riskMap: Record<string, 'critical' | 'high' | 'medium' | 'low' | 'minimal'> = {
    critical: 'high',
    high: 'medium',
    medium: 'low',
    low: 'minimal',
  };

  await createAgentProposal({
    tenantId,
    entityType: 'GLOBAL_METADATA',
    entityId: issue.entityId,
    entityKey: issue.canonicalKey,
    agentType: AGENT_TYPE,
    agentVersion: AGENT_VERSION,
    confidence: confidenceMap[issue.issueType] ?? 'medium',
    reasoning: issue.description,
    evidence: issue.evidence,
    riskLevel: riskMap[issue.severity],
    potentialImpact: `Quality improvement for ${currentState.tier} metadata`,
    suggestedAction: 'flag',
    alternativeActions: ['update', 'investigate'],
    payload: {
      issueType: issue.issueType,
      suggestion: issue.suggestion,
      currentState: {
        canonicalKey: currentState.canonicalKey,
        description: currentState.description,
        tier: currentState.tier,
        domain: currentState.domain,
      },
    },
    currentState,
    tier: currentState.tier as 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'tier5',
  });
}

/**
 * Export for use in scheduled jobs
 */
export const DataQualitySentinel = {
  AGENT_TYPE,
  AGENT_VERSION,
  runQualityScan,
  runQualityScanWithProposals,
};

