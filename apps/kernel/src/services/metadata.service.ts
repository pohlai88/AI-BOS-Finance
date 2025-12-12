/**
 * Metadata Service - The Hippocampus (Memory & Truth)
 * 
 * Service layer for querying the Global Metadata Registry.
 * Provides type-safe database access using Drizzle ORM.
 * 
 * @see PRD_KERNEL_01_AIBOS_KERNEL.md Section 2.1 (Hippocampus)
 */

import { db } from '../db/index.js';
import { 
  mdmGlobalMetadata, 
  mdmEntityCatalog,
  mdmMetadataMapping,
  type MdmGlobalMetadataTable,
  type MdmEntityCatalogTable,
  type MdmMetadataMappingTable,
} from '../db/schema.js';
import { eq, ilike, and, or, desc } from 'drizzle-orm';
import type { MetadataSearchRequest } from '@aibos/schemas/kernel';

/**
 * Convert Drizzle camelCase to API snake_case
 */
function toApiFormat<T extends Record<string, any>>(obj: T): any {
  if (!obj) return null;
  
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Convert camelCase to snake_case
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    result[snakeKey] = value;
  }
  return result;
}

/**
 * Get metadata field by dict_id
 */
export async function getFieldById(dictId: string): Promise<any | null> {
  const result = await db
    .select()
    .from(mdmGlobalMetadata)
    .where(eq(mdmGlobalMetadata.dictId, dictId))
    .limit(1);
  
  return result[0] ? toApiFormat(result[0]) : null;
}

/**
 * Search metadata fields with filters
 */
export async function searchFields(params: MetadataSearchRequest): Promise<{
  results: any[];
  total: number;
}> {
  const { q, domain, entity_group, canon_status, classification, criticality, limit, offset } = params;
  
  // Build where conditions
  const conditions = [];
  
  if (q) {
    conditions.push(
      or(
        ilike(mdmGlobalMetadata.businessTerm, `%${q}%`),
        ilike(mdmGlobalMetadata.technicalName, `%${q}%`),
        ilike(mdmGlobalMetadata.definitionFull, `%${q}%`)
      )!
    );
  }
  
  if (domain) {
    conditions.push(eq(mdmGlobalMetadata.domain, domain));
  }
  
  if (entity_group) {
    conditions.push(eq(mdmGlobalMetadata.entityGroup, entity_group));
  }
  
  if (canon_status) {
    conditions.push(eq(mdmGlobalMetadata.canonStatus, canon_status as any));
  }
  
  if (classification) {
    conditions.push(eq(mdmGlobalMetadata.classification, classification as any));
  }
  
  if (criticality) {
    conditions.push(eq(mdmGlobalMetadata.criticality, criticality as any));
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  // Get total count
  const totalResult = await db
    .select({ count: mdmGlobalMetadata.dictId })
    .from(mdmGlobalMetadata)
    .where(whereClause);
  
  const total = totalResult.length;
  
  // Get paginated results
  const results = await db
    .select()
    .from(mdmGlobalMetadata)
    .where(whereClause)
    .orderBy(desc(mdmGlobalMetadata.updatedAt))
    .limit(limit)
    .offset(offset);
  
  return { 
    results: results.map(toApiFormat), 
    total 
  };
}

/**
 * Get all entities in catalog
 */
export async function getEntities(params?: {
  domain?: string;
  entityType?: string;
}): Promise<{
  entities: any[];
  total: number;
}> {
  const conditions = [];
  
  if (params?.domain) {
    conditions.push(eq(mdmEntityCatalog.domain, params.domain));
  }
  
  if (params?.entityType) {
    conditions.push(eq(mdmEntityCatalog.entityType, params.entityType as any));
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const entities = await db
    .select()
    .from(mdmEntityCatalog)
    .where(whereClause)
    .orderBy(desc(mdmEntityCatalog.updatedAt));
  
  return {
    entities: entities.map(toApiFormat),
    total: entities.length,
  };
}

/**
 * Get entity by ID
 */
export async function getEntityById(entityId: string): Promise<any | null> {
  const result = await db
    .select()
    .from(mdmEntityCatalog)
    .where(eq(mdmEntityCatalog.entityId, entityId))
    .limit(1);
  
  return result[0] ? toApiFormat(result[0]) : null;
}

/**
 * Get all fields for an entity
 */
export async function getFieldsByEntity(entityId: string): Promise<any[]> {
  // Note: This assumes there's a relationship between entities and fields
  // For now, we'll search by entity_group or domain matching
  const entity = await getEntityById(entityId);
  
  if (!entity) {
    return [];
  }
  
  const conditions = [];
  
  if (entity.domain) {
    conditions.push(eq(mdmGlobalMetadata.domain, entity.domain));
  }
  
  // You might want to add a direct foreign key relationship in the future
  // For now, we'll use domain matching as a proxy
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const fields = await db
    .select()
    .from(mdmGlobalMetadata)
    .where(whereClause)
    .orderBy(mdmGlobalMetadata.businessTerm);
  
  return fields.map(toApiFormat);
}

/**
 * Lookup metadata mapping
 */
export async function lookupMapping(localField: string, system?: string): Promise<any | null> {
  const conditions = [eq(mdmMetadataMapping.localField, localField)];
  
  if (system) {
    conditions.push(eq(mdmMetadataMapping.localSystem, system));
  }
  
  const result = await db
    .select()
    .from(mdmMetadataMapping)
    .where(and(...conditions))
    .limit(1);
  
  return result[0] ? toApiFormat(result[0]) : null;
}

/**
 * Get field context (for Silent Killer Frontend)
 * Includes field, owner info, lineage summary, quality signals
 */
export async function getFieldContext(dictId: string): Promise<{
  field: any | null;
  lineageSummary?: {
    upstream_count: number;
    downstream_count: number;
    critical_paths: string[];
  };
}> {
  const field = await getFieldById(dictId);
  
  if (!field) {
    return { field: null };
  }
  
  // TODO: Implement lineage queries when lineage service is ready
  // For now, return empty lineage summary
  return {
    field,
    lineageSummary: {
      upstream_count: 0,
      downstream_count: 0,
      critical_paths: [],
    },
  };
}

/**
 * Get entity context (for Silent Killer Frontend)
 * Includes entity, fields, mappings, quality signals, compliance status
 */
export async function getEntityContext(entityId: string): Promise<{
  entity: any | null;
  fields: any[];
  mappings: any[];
}> {
  const entity = await getEntityById(entityId);
  
  if (!entity) {
    return {
      entity: null,
      fields: [],
      mappings: [],
    };
  }
  
  const fields = await getFieldsByEntity(entityId);
  
  // Get mappings for this entity
  const mappingsResult = await db
    .select()
    .from(mdmMetadataMapping)
    .where(eq(mdmMetadataMapping.localEntity, entity.entity_name))
    .limit(100); // Reasonable limit
  
  return {
    entity,
    fields,
    mappings: mappingsResult.map(toApiFormat),
  };
}
