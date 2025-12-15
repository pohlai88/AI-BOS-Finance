// metadata-studio/services/impact.service.ts
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../db/client';
import {
  mdmGlobalMetadata,
} from '../db/schema/metadata.tables';
import {
  mdmKpiDefinition,
  mdmKpiComponent,
} from '../db/schema/kpi.tables';
import { mdmLineageField } from '../db/schema/lineage.tables';

/**
 * Which KPIs are directly using this metadata field?
 */
export async function getDirectKpiImpactForMetadata(
  tenantId: string,
  canonicalKey: string,
) {
  // 1) Resolve metadata id
  const [meta] = await db
    .select()
    .from(mdmGlobalMetadata)
    .where(
      and(
        eq(mdmGlobalMetadata.tenantId, tenantId),
        eq(mdmGlobalMetadata.canonicalKey, canonicalKey),
      ),
    );

  if (!meta) {
    return {
      metadata: null,
      kpis: [] as any[],
    };
  }

  // 2) Find KPI components referencing this metadata
  const components = await db
    .select()
    .from(mdmKpiComponent)
    .where(
      and(
        eq(mdmKpiComponent.tenantId, tenantId),
        eq(mdmKpiComponent.metadataId, meta.id),
      ),
    );

  if (!components.length) {
    return {
      metadata: meta,
      kpis: [] as any[],
    };
  }

  const kpiIds = components.map((c) => c.kpiId);

  const kpis = await db
    .select()
    .from(mdmKpiDefinition)
    .where(
      and(
        eq(mdmKpiDefinition.tenantId, tenantId),
        inArray(mdmKpiDefinition.id, kpiIds),
      ),
    );

  return {
    metadata: meta,
    kpis,
  };
}

/**
 * Which KPIs are indirectly impacted because they depend on
 * fields that depend on this metadata via lineage?
 */
export async function getIndirectKpiImpactViaLineage(
  tenantId: string,
  canonicalKey: string,
) {
  // 1) Resolve starting metadata
  const [meta] = await db
    .select()
    .from(mdmGlobalMetadata)
    .where(
      and(
        eq(mdmGlobalMetadata.tenantId, tenantId),
        eq(mdmGlobalMetadata.canonicalKey, canonicalKey),
      ),
    );

  if (!meta) {
    return {
      metadata: null,
      impactedFields: [] as any[],
      kpis: [] as any[],
    };
  }

  // 2) Find downstream fields that have this as source
  const downstreamEdges = await db
    .select()
    .from(mdmLineageField)
    .where(
      and(
        eq(mdmLineageField.tenantId, tenantId),
        eq(mdmLineageField.sourceMetadataId, meta.id),
      ),
    );

  if (!downstreamEdges.length) {
    return {
      metadata: meta,
      impactedFields: [],
      kpis: [],
    };
  }

  const downstreamIds = downstreamEdges.map((e) => e.targetMetadataId);

  const downstreamMetas = await db
    .select()
    .from(mdmGlobalMetadata)
    .where(
      and(
        eq(mdmGlobalMetadata.tenantId, tenantId),
        inArray(mdmGlobalMetadata.id, downstreamIds),
      ),
    );

  // 3) KPIs using these downstream fields
  const kpiComponents = await db
    .select()
    .from(mdmKpiComponent)
    .where(
      and(
        eq(mdmKpiComponent.tenantId, tenantId),
        inArray(mdmKpiComponent.metadataId, downstreamIds),
      ),
    );

  const kpiIds = Array.from(new Set(kpiComponents.map((c) => c.kpiId)));

  let kpis: any[] = [];
  if (kpiIds.length > 0) {
    kpis = await db
      .select()
      .from(mdmKpiDefinition)
      .where(
        and(
          eq(mdmKpiDefinition.tenantId, tenantId),
          inArray(mdmKpiDefinition.id, kpiIds),
        ),
      );
  }

  return {
    metadata: meta,
    impactedFields: downstreamMetas,
    kpis,
  };
}

/**
 * Combined view: direct + indirect KPI impact for a field.
 */
export async function getFullKpiImpactForMetadata(
  tenantId: string,
  canonicalKey: string,
) {
  const direct = await getDirectKpiImpactForMetadata(
    tenantId,
    canonicalKey,
  );
  const indirect = await getIndirectKpiImpactViaLineage(
    tenantId,
    canonicalKey,
  );

  return {
    metadata: direct.metadata ?? indirect.metadata ?? null,
    directKpis: direct.kpis,
    indirectKpis: indirect.kpis,
    indirectImpactedFields: indirect.impactedFields,
  };
}

