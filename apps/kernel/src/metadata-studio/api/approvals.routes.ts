// metadata-studio/api/approvals.routes.ts
import { Hono } from 'hono';
import type { AuthContext, Role } from '../middleware/auth.middleware';

// Database & Services
import { approvalService } from '../services/approval.service';
import { upsertBusinessRule } from '../services/business-rule.service';
import { upsertGlobalMetadata } from '../services/metadata.service';
import { upsertGlossaryTerm } from '../services/glossary.service';
import { upsertKpiDefinitionWithComponents } from '../services/kpi.service';

// Schemas
import {
  ApprovalEntityTypeEnum,
  ApprovalRequestSchema,
} from '../schemas/approval.schema';
import {
  MdmBusinessRuleBaseSchema,
  type MdmBusinessRuleBase,
} from '../schemas/business-rule.schema';
import { validateRuleConfiguration } from '../schemas/business-rule-config-dispatcher';
import { MdmGlobalMetadataSchema } from '../schemas/mdm-global-metadata.schema';
import { MdmGlossaryTermSchema } from '../schemas/glossary.schema';
import { MdmKpiDefinitionWithComponentsSchema } from '../schemas/kpi.schema';

// Event System
import { eventBus } from '../events';

// Define Hono context with auth
type AppContext = {
  Variables: {
    auth: AuthContext;
  };
};

export const approvalsRouter = new Hono<AppContext>();

/**
 * GET /approvals/pending
 *
 * List pending approvals for the current tenant + actor role.
 * Perfect for "Approval Inbox" UI.
 */
approvalsRouter.get('/pending', async (c) => {
  const auth = c.get('auth') as AuthContext;

  const approvals = await approvalService.listPendingForRole(
    auth.tenantId,
    auth.role as Role,
  );

  return c.json(approvals);
});

/**
 * POST /approvals/:id/approve
 *
 * Approve a pending request AND emit events for:
 * - approval.approved (generic)
 * - metadata.changed / kpi.changed (entity-specific)
 * - metadata.profile.due (if Tier1/Tier2 structural change)
 */
approvalsRouter.post('/:id/approve', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const approvalId = c.req.param('id');

  // 1) Mark as approved in mdm_approval + get updated row
  const approval = await approvalService.approveRequest(approvalId, auth.userId);

  // 2) Parse + validate via Zod
  const parsedApproval = ApprovalRequestSchema.parse(approval);

  // 3) Optional role check (if your auth middleware doesn't handle this)
  if (parsedApproval.requiredRole && auth.role !== parsedApproval.requiredRole) {
    return c.json(
      { error: `Approval requires role ${parsedApproval.requiredRole}` },
      403,
    );
  }

  // 4) Apply the change based on entity type + emit events
  let appliedEntityId: string | null = parsedApproval.entityId;
  let appliedCanonicalKey = parsedApproval.entityKey;
  let appliedTier: 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'tier5' = parsedApproval.tier;

  switch (parsedApproval.entityType) {
    case ApprovalEntityTypeEnum.Enum.GLOBAL_METADATA: {
      const metaPayload = MdmGlobalMetadataSchema.parse(
        parsedApproval.payload,
      );

      const meta = await upsertGlobalMetadata(metaPayload, auth.userId);
      appliedEntityId = meta.id!;
      appliedCanonicalKey = meta.canonicalKey;
      appliedTier = meta.tier as typeof appliedTier;

      // Emit metadata.approved event
      await eventBus.publish({
        type: 'metadata.approved',
        version: '1.0.0',
        tenantId: parsedApproval.tenantId,
        source: 'metadata-studio.approval',
        correlationId: parsedApproval.id,
        payload: {
          approvalId: parsedApproval.id,
          entityId: meta.id,
          canonicalKey: meta.canonicalKey,
          tier: meta.tier,
          approvedBy: {
            actorId: auth.userId,
            actorType: 'HUMAN',
          },
          approvedAt: new Date().toISOString(),
        },
      });

      // Emit metadata.changed event
      await eventBus.publish({
        type: 'metadata.changed',
        version: '1.0.0',
        tenantId: parsedApproval.tenantId,
        source: 'metadata-studio.approval',
        correlationId: parsedApproval.id,
        payload: {
          entityId: meta.id!,
          canonicalKey: meta.canonicalKey,
          changeType: 'APPROVAL',
          tier: meta.tier,
          standardPackId: meta.standardPackId,
          changedBy: {
            actorId: auth.userId,
            actorType: 'HUMAN',
          },
        },
      });

      // Tier1/Tier2 → force re-profile (structural change)
      if (meta.tier === 'tier1' || meta.tier === 'tier2') {
        await eventBus.publish({
          type: 'metadata.profile.due',
          version: '1.0.0',
          tenantId: parsedApproval.tenantId,
          source: 'metadata-studio.approval',
          correlationId: parsedApproval.id,
          payload: {
            entityType: 'METADATA',
            entityId: meta.id!,
            canonicalKey: meta.canonicalKey,
            tier: meta.tier,
            priority: 'high',
            reason: 'STRUCTURAL_CHANGE',
            standardPackId: meta.standardPackId,
          },
        });
      }

      break;
    }

    case ApprovalEntityTypeEnum.Enum.BUSINESS_RULE: {
      const base = MdmBusinessRuleBaseSchema.parse(parsedApproval.payload);
      const config = validateRuleConfiguration(
        (base as MdmBusinessRuleBase).ruleType,
        (base as MdmBusinessRuleBase).configuration,
      );

      const rule = await upsertBusinessRule(base as MdmBusinessRuleBase, config, auth.userId);
      appliedEntityId = rule.id!;

      // Business rule changes MAY affect quality; for now just track approval
      // Later: emit metadata.profile.due for impacted fields when lineage is ready

      break;
    }

    case ApprovalEntityTypeEnum.Enum.KPI: {
      const kpiPayload = MdmKpiDefinitionWithComponentsSchema.parse(
        parsedApproval.payload,
      );

      const result = await upsertKpiDefinitionWithComponents(
        kpiPayload,
        auth.userId,
      );

      appliedEntityId = result.kpiId;
      appliedCanonicalKey = kpiPayload.definition.canonicalKey;
      appliedTier = kpiPayload.definition.tier;

      // Emit kpi.approved event
      await eventBus.publish({
        type: 'kpi.approved',
        version: '1.0.0',
        tenantId: parsedApproval.tenantId,
        source: 'metadata-studio.approval',
        correlationId: parsedApproval.id,
        payload: {
          approvalId: parsedApproval.id,
          entityId: result.kpiId,
          canonicalKey: appliedCanonicalKey,
          tier: appliedTier,
          approvedBy: {
            actorId: auth.userId,
            actorType: 'HUMAN',
          },
          approvedAt: new Date().toISOString(),
        },
      });

      // Emit kpi.changed event
      await eventBus.publish({
        type: 'kpi.changed',
        version: '1.0.0',
        tenantId: parsedApproval.tenantId,
        source: 'metadata-studio.approval',
        correlationId: parsedApproval.id,
        payload: {
          entityId: result.kpiId,
          canonicalKey: appliedCanonicalKey,
          changeType: 'APPROVAL',
          tier: appliedTier,
          standardPackId: kpiPayload.definition.standardPackId,
          changedBy: {
            actorId: auth.userId,
            actorType: 'HUMAN',
          },
        },
      });

      // (Optional, later) trigger metadata.profile.due for impacted fields
      // once we finish lineage / KPI impact event catalog.

      break;
    }

    case ApprovalEntityTypeEnum.Enum.GLOSSARY: {
      const term = MdmGlossaryTermSchema.parse(parsedApproval.payload);
      const glossaryTerm = await upsertGlossaryTerm(term, auth.userId);
      appliedEntityId = glossaryTerm.id!;

      // Glossary terms don't trigger profiling, but you could emit glossary.term.updated here

      break;
    }

    default:
      // Unknown entity type — fail safe
      return c.json({ error: 'Unsupported approval entityType' }, 400);
  }

  // 5) Emit approval.approved (generic event for audit trail)
  await eventBus.publish({
    type: 'approval.approved',
    version: '1.0.0',
    tenantId: parsedApproval.tenantId,
    source: 'metadata-studio.approval',
    correlationId: parsedApproval.id,
    payload: {
      approvalId: parsedApproval.id,
      entityType:
        parsedApproval.entityType === ApprovalEntityTypeEnum.Enum.GLOBAL_METADATA
          ? 'METADATA'
          : parsedApproval.entityType === ApprovalEntityTypeEnum.Enum.KPI
            ? 'KPI'
            : parsedApproval.entityType === ApprovalEntityTypeEnum.Enum.GLOSSARY
              ? 'GLOSSARY'
              : 'BUSINESS_RULE',
      entityId: appliedEntityId ?? undefined,
      entityKey: appliedCanonicalKey,
      approvedBy: {
        actorId: auth.userId,
        actorType: 'HUMAN',
      },
      approvedAt: new Date().toISOString(),
    },
  });

  return c.json({
    status: 'approved',
    approvalId: parsedApproval.id,
    entityType: parsedApproval.entityType,
    entityId: appliedEntityId,
    entityKey: appliedCanonicalKey,
    tier: appliedTier,
  });
});

/**
 * POST /approvals/:id/reject
 *
 * Reject a pending request with an optional reason.
 */
approvalsRouter.post('/:id/reject', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const id = c.req.param('id');
  const body = (await c.req.json().catch(() => ({}))) as { reason?: string };
  const reason = body.reason ?? 'Rejected';

  const updated = await approvalService.rejectRequest(id, auth.userId, reason);

  return c.json(updated);
});

