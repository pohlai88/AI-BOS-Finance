// ============================================================================
// META VIOLATIONS & REMEDIATION ROUTES - HITL Workflow
// ============================================================================
// Serves: META_04 (Risk Radar), Approval Workflows
// ============================================================================

import { Hono } from 'hono';
import { eq, and, desc, count } from 'drizzle-orm';
import { db } from '../db/client';
import { mdmViolationReport, mdmRemediationProposal } from '../db/schema/remediation.tables';
import { getAuth, type AppVariables, type Role } from '../middleware/auth.middleware';
import type { ViolationDto } from '@ai-bos/shared';

export const metaViolationsRouter = new Hono<{ Variables: AppVariables }>();

// Role permissions for HITL
const APPROVER_ROLES: Role[] = ['kernel_architect', 'metadata_steward'];

// -----------------------------------------------------------------------------
// GET /api/meta/violations
// List violations for current tenant
// -----------------------------------------------------------------------------
metaViolationsRouter.get('/', async (c) => {
  const auth = getAuth(c);
  const tenantId = auth?.tenantId ?? 'default';
  const query = c.req.query();

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
  const offset = (page - 1) * limit;

  try {
    const conditions = [eq(mdmViolationReport.tenantId, tenantId)];

    if (query.status) {
      conditions.push(eq(mdmViolationReport.status, query.status));
    }
    if (query.severity) {
      conditions.push(eq(mdmViolationReport.severity, query.severity));
    }
    if (query.code) {
      conditions.push(eq(mdmViolationReport.violationCode, query.code));
    }

    const whereClause = and(...conditions);

    const [violations, totalResult] = await Promise.all([
      db
        .select()
        .from(mdmViolationReport)
        .where(whereClause)
        .orderBy(desc(mdmViolationReport.detectedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(mdmViolationReport)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count) || 0;

    const data: ViolationDto[] = violations.map((v) => ({
      id: v.id,
      violation_code: v.violationCode,
      target_key: v.targetKey,
      severity: v.severity as ViolationDto['severity'],
      message: v.description,
      detected_at: v.detectedAt?.toISOString?.() || String(v.detectedAt),
      status: v.status as 'open' | 'resolved' | 'ignored',
    }));

    return c.json({
      data,
      meta: { total, page, limit, has_more: offset + violations.length < total },
    });
  } catch (error) {
    console.error('Error listing violations:', error);
    return c.json({ data: [], meta: { total: 0, page: 1, limit: 50, has_more: false } }, 200);
  }
});

// -----------------------------------------------------------------------------
// GET /api/meta/violations/:id
// Get single violation with remediation proposal
// -----------------------------------------------------------------------------
metaViolationsRouter.get('/:id', async (c) => {
  const auth = getAuth(c);
  const tenantId = auth?.tenantId ?? 'default';
  const id = c.req.param('id');

  try {
    const violation = await db
      .select()
      .from(mdmViolationReport)
      .where(
        and(
          eq(mdmViolationReport.tenantId, tenantId),
          eq(mdmViolationReport.id, id),
        ),
      )
      .limit(1);

    if (!violation.length) {
      return c.json({ error: 'Violation not found' }, 404);
    }

    // Check for associated remediation proposal
    const proposal = await db
      .select()
      .from(mdmRemediationProposal)
      .where(eq(mdmRemediationProposal.violationId, id))
      .limit(1);

    return c.json({
      violation: violation[0],
      proposal: proposal[0] || null,
    });
  } catch (error) {
    console.error('Error fetching violation:', error);
    return c.json({ error: 'Failed to fetch violation' }, 500);
  }
});

// -----------------------------------------------------------------------------
// POST /api/meta/violations/:id/ignore
// Mark a violation as ignored (won't fix)
// -----------------------------------------------------------------------------
metaViolationsRouter.post('/:id/ignore', async (c) => {
  const auth = getAuth(c);
  const tenantId = auth?.tenantId ?? 'default';
  const userId = auth?.userId ?? 'system';
  const id = c.req.param('id');
  const body = await c.req.json<{ reason?: string }>();

  try {
    const result = await db
      .update(mdmViolationReport)
      .set({
        status: 'ignored',
        resolvedBy: userId,
        resolvedAt: new Date(),
        context: { ignore_reason: body.reason || 'No reason provided' },
      })
      .where(
        and(
          eq(mdmViolationReport.tenantId, tenantId),
          eq(mdmViolationReport.id, id),
        ),
      )
      .returning();

    if (!result.length) {
      return c.json({ error: 'Violation not found' }, 404);
    }

    return c.json({ success: true, violation: result[0] });
  } catch (error) {
    console.error('Error ignoring violation:', error);
    return c.json({ error: 'Failed to ignore violation' }, 500);
  }
});

// =============================================================================
// REMEDIATION PROPOSALS (HITL Workflow)
// =============================================================================

// -----------------------------------------------------------------------------
// GET /api/meta/remediations
// List pending remediation proposals
// -----------------------------------------------------------------------------
metaViolationsRouter.get('/remediations/list', async (c) => {
  const auth = getAuth(c);
  const tenantId = auth?.tenantId ?? 'default';
  const query = c.req.query();

  const status = query.status || 'pending';

  try {
    const proposals = await db
      .select()
      .from(mdmRemediationProposal)
      .where(
        and(
          eq(mdmRemediationProposal.tenantId, tenantId),
          eq(mdmRemediationProposal.status, status),
        ),
      )
      .orderBy(desc(mdmRemediationProposal.proposedAt))
      .limit(50);

    return c.json({ data: proposals, total: proposals.length });
  } catch (error) {
    console.error('Error listing remediations:', error);
    return c.json({ data: [], total: 0 }, 200);
  }
});

// -----------------------------------------------------------------------------
// POST /api/meta/remediations/:id/approve
// Approve a remediation proposal (HITL approval)
// -----------------------------------------------------------------------------
metaViolationsRouter.post('/remediations/:id/approve', async (c) => {
  const auth = getAuth(c);
  const tenantId = auth?.tenantId ?? 'default';
  const userId = auth?.userId ?? 'system';
  const role = auth?.role ?? 'user';
  const id = c.req.param('id');
  const body = await c.req.json<{ comment?: string }>();

  // RBAC: Only approver roles can approve
  if (!APPROVER_ROLES.includes(role)) {
    return c.json(
      { error: 'Forbidden', message: 'Only metadata stewards or architects can approve proposals' },
      403,
    );
  }

  try {
    // Get the proposal
    const proposal = await db
      .select()
      .from(mdmRemediationProposal)
      .where(
        and(
          eq(mdmRemediationProposal.tenantId, tenantId),
          eq(mdmRemediationProposal.id, id),
        ),
      )
      .limit(1);

    if (!proposal.length) {
      return c.json({ error: 'Proposal not found' }, 404);
    }

    if (proposal[0].status !== 'pending') {
      return c.json({ error: 'Proposal is not pending', current_status: proposal[0].status }, 400);
    }

    // Update proposal status
    const updated = await db
      .update(mdmRemediationProposal)
      .set({
        status: 'approved',
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewComment: body.comment || null,
      })
      .where(eq(mdmRemediationProposal.id, id))
      .returning();

    // Mark the violation as remediated
    if (updated[0]?.violationId) {
      await db
        .update(mdmViolationReport)
        .set({
          status: 'remediated',
          resolvedBy: userId,
          resolvedAt: new Date(),
        })
        .where(eq(mdmViolationReport.id, updated[0].violationId));
    }

    console.log(`[HITL] Proposal ${id} approved by ${userId}`);

    return c.json({ success: true, proposal: updated[0] });
  } catch (error) {
    console.error('Error approving remediation:', error);
    return c.json({ error: 'Failed to approve proposal' }, 500);
  }
});

// -----------------------------------------------------------------------------
// POST /api/meta/remediations/:id/reject
// Reject a remediation proposal
// -----------------------------------------------------------------------------
metaViolationsRouter.post('/remediations/:id/reject', async (c) => {
  const auth = getAuth(c);
  const tenantId = auth?.tenantId ?? 'default';
  const userId = auth?.userId ?? 'system';
  const role = auth?.role ?? 'user';
  const id = c.req.param('id');
  const body = await c.req.json<{ comment: string }>();

  // RBAC: Only approver roles can reject
  if (!APPROVER_ROLES.includes(role)) {
    return c.json(
      { error: 'Forbidden', message: 'Only metadata stewards or architects can reject proposals' },
      403,
    );
  }

  if (!body.comment) {
    return c.json({ error: 'Comment is required for rejection' }, 400);
  }

  try {
    const updated = await db
      .update(mdmRemediationProposal)
      .set({
        status: 'rejected',
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewComment: body.comment,
      })
      .where(
        and(
          eq(mdmRemediationProposal.tenantId, tenantId),
          eq(mdmRemediationProposal.id, id),
        ),
      )
      .returning();

    if (!updated.length) {
      return c.json({ error: 'Proposal not found' }, 404);
    }

    console.log(`[HITL] Proposal ${id} rejected by ${userId}: ${body.comment}`);

    return c.json({ success: true, proposal: updated[0] });
  } catch (error) {
    console.error('Error rejecting remediation:', error);
    return c.json({ error: 'Failed to reject proposal' }, 500);
  }
});

// -----------------------------------------------------------------------------
// POST /api/meta/remediations/:id/apply
// Apply an approved remediation proposal
// -----------------------------------------------------------------------------
metaViolationsRouter.post('/remediations/:id/apply', async (c) => {
  const auth = getAuth(c);
  const tenantId = auth?.tenantId ?? 'default';
  const userId = auth?.userId ?? 'system';
  const role = auth?.role ?? 'user';
  const id = c.req.param('id');

  // RBAC: Only approver roles can apply
  if (!APPROVER_ROLES.includes(role)) {
    return c.json(
      { error: 'Forbidden', message: 'Only metadata stewards or architects can apply proposals' },
      403,
    );
  }

  try {
    const proposal = await db
      .select()
      .from(mdmRemediationProposal)
      .where(
        and(
          eq(mdmRemediationProposal.tenantId, tenantId),
          eq(mdmRemediationProposal.id, id),
        ),
      )
      .limit(1);

    if (!proposal.length) {
      return c.json({ error: 'Proposal not found' }, 404);
    }

    if (proposal[0].status !== 'approved') {
      return c.json(
        { error: 'Proposal must be approved before applying', current_status: proposal[0].status },
        400,
      );
    }

    // TODO: Apply the proposed change to the target table
    // This would involve parsing proposedChange and updating the target record
    // For now, we just mark it as applied

    const updated = await db
      .update(mdmRemediationProposal)
      .set({
        status: 'applied',
        appliedBy: userId,
        appliedAt: new Date(),
      })
      .where(eq(mdmRemediationProposal.id, id))
      .returning();

    console.log(`[HITL] Proposal ${id} applied by ${userId}`);

    return c.json({ success: true, proposal: updated[0] });
  } catch (error) {
    console.error('Error applying remediation:', error);
    return c.json({ error: 'Failed to apply proposal' }, 500);
  }
});
