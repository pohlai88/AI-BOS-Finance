// ============================================================================
// META STANDARD PACKS ROUTES
// ============================================================================
// Serves: META_06 (Health Scan), Field Creation (Standard Pack Selection)
// ============================================================================

import { Hono } from 'hono';
import { eq, ilike, count, and } from 'drizzle-orm';
import { db } from '../db/client';
import { mdmStandardPack } from '../db/schema/standard-pack.tables';
import { mdmGlobalMetadata } from '../db/schema/metadata.tables';
import type { AuthContext } from '../middleware/auth.middleware';
import type { StandardPackDto } from '@ai-bos/shared';

export const metaStandardPacksRouter = new Hono();

// -----------------------------------------------------------------------------
// GET /api/meta/standard-packs
// List all standard packs
// -----------------------------------------------------------------------------
metaStandardPacksRouter.get('/', async (c) => {
  const query = c.req.query();

  try {
    // Build WHERE clause for filters
    const conditions = [];

    if (query.category) {
      conditions.push(eq(mdmStandardPack.category, query.category));
    }
    if (query.tier) {
      conditions.push(eq(mdmStandardPack.tier, query.tier));
    }
    if (query.q) {
      conditions.push(ilike(mdmStandardPack.packName, `%${query.q}%`));
    }
    if (query.status) {
      conditions.push(eq(mdmStandardPack.status, query.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const packs = await db
      .select()
      .from(mdmStandardPack)
      .where(whereClause)
      .orderBy(mdmStandardPack.category, mdmStandardPack.packId);

    // Get field counts for each pack
    const packIds = packs.map((p) => p.packId);
    const fieldCounts = packIds.length > 0
      ? await db
        .select({
          packId: mdmGlobalMetadata.standardPackId,
          count: count(),
        })
        .from(mdmGlobalMetadata)
        .groupBy(mdmGlobalMetadata.standardPackId)
      : [];

    const countMap = new Map(
      fieldCounts.map((fc) => [fc.packId, Number(fc.count)]),
    );

    const response: StandardPackDto[] = packs.map((pack) => ({
      id: pack.id,
      pack_id: pack.packId,
      pack_name: pack.packName,
      description: pack.description || undefined,
      category: pack.category,
      standard_body: pack.standardBody,
      tier: pack.tier as StandardPackDto['tier'],
      field_count: countMap.get(pack.packId) || 0,
    }));

    return c.json({ data: response, total: response.length });
  } catch (error) {
    console.error('Error listing standard packs:', error);
    return c.json({ data: [], total: 0 }, 200);
  }
});

// -----------------------------------------------------------------------------
// GET /api/meta/standard-packs/:packId
// Get single standard pack
// -----------------------------------------------------------------------------
metaStandardPacksRouter.get('/:packId', async (c) => {
  const packId = c.req.param('packId');

  try {
    const result = await db
      .select()
      .from(mdmStandardPack)
      .where(eq(mdmStandardPack.packId, packId))
      .limit(1);

    if (!result.length) {
      return c.json({ error: 'Standard pack not found' }, 404);
    }

    const pack = result[0];

    // Get field count
    const fieldCount = await db
      .select({ count: count() })
      .from(mdmGlobalMetadata)
      .where(eq(mdmGlobalMetadata.standardPackId, packId));

    const response: StandardPackDto = {
      id: pack.id,
      pack_id: pack.packId,
      pack_name: pack.packName,
      description: pack.description || undefined,
      category: pack.category,
      standard_body: pack.standardBody,
      tier: pack.tier as StandardPackDto['tier'],
      field_count: Number(fieldCount[0]?.count) || 0,
    };

    return c.json(response);
  } catch (error) {
    console.error('Error fetching standard pack:', error);
    return c.json({ error: 'Failed to fetch standard pack' }, 500);
  }
});
