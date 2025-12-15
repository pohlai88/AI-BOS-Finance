// metadata-studio/services/business-rule.service.ts
import { db } from '../db/client';
import { mdmBusinessRule } from '../db/schema/business-rule.tables';
import { eq, and } from 'drizzle-orm';
import {
  MdmBusinessRuleBaseSchema,
  type MdmBusinessRuleBase,
} from '../schemas/business-rule.schema';
import { validateRuleConfiguration } from '../schemas/business-rule-config-dispatcher';
import { approvalService } from './approval.service';

import type { Role } from '../middleware/auth.middleware';

interface RuleChangeRequest {
  actorRole: Role;
  actorId: string;
  body: unknown; // raw request body from API
}

function canApplyImmediately(
  base: MdmBusinessRuleBase,
  role: Role,
): boolean {
  // Simple example rule:
  // - Lane 'governed' + tier3+ + business_admin → immediate
  // - Everything else → needs approval
  if (
    base.lane === 'governed' &&
    (base.tier === 'tier3' || base.tier === 'tier4' || base.tier === 'tier5') &&
    role === 'business_admin'
  ) {
    return true;
  }

  return false;
}

function requiredApprovalRole(base: MdmBusinessRuleBase): Role {
  // Example mapping:
  // - tier1 → 'kernel_architect' or 'metadata_steward' (your choice)
  // - tier2 → 'metadata_steward'
  // - tier3+ → 'metadata_steward' (or business_admin, if you want)
  if (base.tier === 'tier1') return 'kernel_architect';
  if (base.tier === 'tier2') return 'metadata_steward';
  return 'metadata_steward';
}

export async function applyBusinessRuleChange(req: RuleChangeRequest) {
  // 1) envelope validation
  const base = MdmBusinessRuleBaseSchema.parse(req.body);

  // 2) config validation for this ruleType
  const config = validateRuleConfiguration(base.ruleType, base.configuration);

  // 3) check immediate vs approval path
  if (canApplyImmediately(base, req.actorRole)) {
    // Immediate apply: upsert into mdm_business_rule
    return await upsertBusinessRule(base, config, req.actorId);
  }

  // 4) Find current state (if exists) for diff
  const [current] = await db
    .select()
    .from(mdmBusinessRule)
    .where(
      and(
        eq(mdmBusinessRule.tenantId, base.tenantId),
        eq(mdmBusinessRule.ruleType, base.ruleType),
        eq(mdmBusinessRule.key, base.key),
        eq(mdmBusinessRule.environment, base.environment),
      ),
    );

  // 5) Create approval request instead of applying
  const approvalPayload = {
    tenantId: base.tenantId,
    entityType: 'BUSINESS_RULE' as const,
    entityId: current?.id ?? null,
    entityKey: base.key,
    tier: base.tier,
    lane: base.lane,
    payload: {
      ...base,
      configuration: config,
    },
    currentState: current ?? null,
    status: 'pending' as const,
    requestedBy: req.actorId,
    requiredRole: requiredApprovalRole(base),
  };

  await approvalService.createRequest(approvalPayload);

  return {
    status: 'pending_approval' as const,
  };
}

/**
 * Shared helper used by:
 * - immediate business rule updates
 * - approval processing for BUSINESS_RULE
 */
export async function upsertBusinessRule(
  base: MdmBusinessRuleBase,
  config: unknown,
  actorId: string,
) {
  const [existing] = await db
    .select()
    .from(mdmBusinessRule)
    .where(
      and(
        eq(mdmBusinessRule.tenantId, base.tenantId),
        eq(mdmBusinessRule.ruleType, base.ruleType),
        eq(mdmBusinessRule.key, base.key),
        eq(mdmBusinessRule.environment, base.environment),
        eq(mdmBusinessRule.version, base.version),
      ),
    );

  if (existing) {
    const [updated] = await db
      .update(mdmBusinessRule)
      .set({
        configuration: config,
        tier: base.tier,
        lane: base.lane,
        isActive: base.isActive,
        isDraft: base.isDraft,
        updatedBy: actorId,
        updatedAt: new Date(),
      })
      .where(eq(mdmBusinessRule.id, existing.id))
      .returning();

    return updated;
  }

  const [inserted] = await db
    .insert(mdmBusinessRule)
    .values({
      tenantId: base.tenantId,
      ruleType: base.ruleType,
      key: base.key,
      name: base.name,
      description: base.description,
      tier: base.tier,
      lane: base.lane,
      environment: base.environment,
      configuration: config,
      version: base.version,
      isActive: base.isActive,
      isDraft: base.isDraft,
      createdBy: actorId,
      updatedBy: actorId,
    })
    .returning();

  return inserted;
}

