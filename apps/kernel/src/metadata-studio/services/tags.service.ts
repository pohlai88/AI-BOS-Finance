// metadata-studio/services/tags.service.ts
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../db/client';
import {
  mdmTag,
  mdmTagAssignment,
} from '../db/schema/tags.tables';
import {
  MdmTagSchema,
  MdmTagAssignmentSchema,
  TagAssignmentTargetTypeEnum,
  type MdmTag,
} from '../schemas/tags.schema';
import type { Role } from '../middleware/auth.middleware';

export interface TagChangeRequest {
  actorRole: Role;
  actorId: string;
  body: unknown;
}

export interface TagAssignmentRequest {
  actorRole: Role;
  actorId: string;
  tenantId: string;
  body: unknown;
}

function canManageTags(role: Role): boolean {
  return (
    role === 'kernel_architect' ||
    role === 'metadata_steward' ||
    role === 'business_admin'
  );
}

export async function upsertTag(req: TagChangeRequest) {
  if (!canManageTags(req.actorRole)) {
    throw new Error('Role not allowed to manage tags');
  }

  const tag = MdmTagSchema.parse(req.body);
  const tenantId = tag.tenantId;
  const actorId = req.actorId;

  const [existing] = await db
    .select()
    .from(mdmTag)
    .where(
      and(
        eq(mdmTag.tenantId, tenantId),
        eq(mdmTag.key, tag.key),
      ),
    );

  if (existing) {
    const [updated] = await db
      .update(mdmTag)
      .set({
        label: tag.label,
        description: tag.description,
        category: tag.category,
        standardPackId: tag.standardPackId ?? null,
        status: tag.status,
        isSystem: tag.isSystem,
        updatedBy: actorId,
        updatedAt: new Date(),
      })
      .where(eq(mdmTag.id, existing.id))
      .returning();

    return updated;
  }

  const [inserted] = await db
    .insert(mdmTag)
    .values({
      tenantId,
      key: tag.key,
      label: tag.label,
      description: tag.description,
      category: tag.category,
      standardPackId: tag.standardPackId ?? null,
      status: tag.status,
      isSystem: tag.isSystem,
      createdBy: actorId,
      updatedBy: actorId,
    })
    .returning();

  return inserted;
}

export async function assignTagToTarget(req: TagAssignmentRequest) {
  if (!canManageTags(req.actorRole)) {
    throw new Error('Role not allowed to assign tags');
  }

  const raw = req.body as {
    tenantId?: string;
    tagKey: string;
    targetType: string;
    targetCanonicalKey: string;
  };

  const tenantId = raw.tenantId ?? req.tenantId;
  const actorId = req.actorId;

  const targetType = TagAssignmentTargetTypeEnum.parse(raw.targetType);

  // 1) resolve tagKey → tagId
  const [tag] = await db
    .select()
    .from(mdmTag)
    .where(
      and(
        eq(mdmTag.tenantId, tenantId),
        eq(mdmTag.key, raw.tagKey),
      ),
    );

  if (!tag) {
    throw new Error(
      `Tag not found for key=${raw.tagKey} (tenant=${tenantId})`,
    );
  }

  // 2) upsert assignment (unique on tenant + tagId + targetType + canonicalKey)
  const [existing] = await db
    .select()
    .from(mdmTagAssignment)
    .where(
      and(
        eq(mdmTagAssignment.tenantId, tenantId),
        eq(mdmTagAssignment.tagId, tag.id),
        eq(mdmTagAssignment.targetType, targetType),
        eq(
          mdmTagAssignment.targetCanonicalKey,
          raw.targetCanonicalKey,
        ),
      ),
    );

  if (existing) {
    // nothing to update except who touched it, but keep simple
    return MdmTagAssignmentSchema.parse({
      ...existing,
      createdAt: existing.createdAt?.toISOString(),
    });
  }

  const [inserted] = await db
    .insert(mdmTagAssignment)
    .values({
      tenantId,
      tagId: tag.id,
      targetType,
      targetCanonicalKey: raw.targetCanonicalKey,
      createdBy: actorId,
    })
    .returning();

  return MdmTagAssignmentSchema.parse({
    ...inserted,
    createdAt: inserted.createdAt?.toISOString(),
  });
}

export async function listTagsForTarget(
  tenantId: string,
  targetType: string,
  canonicalKey: string,
) {
  const tt = TagAssignmentTargetTypeEnum.parse(targetType);

  const assignments = await db
    .select()
    .from(mdmTagAssignment)
    .where(
      and(
        eq(mdmTagAssignment.tenantId, tenantId),
        eq(mdmTagAssignment.targetType, tt),
        eq(
          mdmTagAssignment.targetCanonicalKey,
          canonicalKey,
        ),
      ),
    );

  if (!assignments.length) {
    return [];
  }

  const tagIds = assignments.map((a) => a.tagId);

  const tags = await db
    .select()
    .from(mdmTag)
    .where(
      and(
        eq(mdmTag.tenantId, tenantId),
        inArray(mdmTag.id, tagIds),
      ),
    );

  return tags;
}

