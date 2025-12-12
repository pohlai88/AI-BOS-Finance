/**
 * Metadata Routes - The Hippocampus (Memory & Truth)
 * 
 * Handles all metadata-related endpoints:
 * - Search metadata
 * - Get field definitions
 * - Get entity catalog
 * - Field/entity context (Silent Killer Frontend)
 */

import { Hono } from 'hono';
import type {
  MetadataSearchRequest,
  MetadataFieldResponse,
  FieldContextResponse,
  EntityContextResponse,
} from '@aibos/schemas/kernel';
import * as MetadataService from '../services/metadata.service.js';

export const metadataRoutes = new Hono();

/**
 * GET /metadata/fields/search
 * Constitution Service: metadata.fields.search(query, filters)
 */
metadataRoutes.get('/fields/search', async (c) => {
  const query = c.req.query('q');
  const domain = c.req.query('domain');
  const limit = Number(c.req.query('limit')) || 20;
  const offset = Number(c.req.query('offset')) || 0;

  // TODO: Implement actual database query via MetadataService
  // For now, return mock response
  return c.json({
    results: [],
    total: 0,
    limit,
    offset,
  });
});

/**
 * GET /metadata/fields/{dict_id}
 * Constitution Service: metadata.fields.describe(id)
 */
metadataRoutes.get('/fields/:dict_id', async (c) => {
  const dictId = c.req.param('dict_id');

  const field = await MetadataService.getFieldById(dictId);
  
  if (!field) {
    return c.json({ error: 'Field not found' }, 404);
  }

  return c.json(field);
});

/**
 * GET /metadata/context/field/{dict_id}
 * Silent Killer Frontend: Complete field context for sidebar
 */
metadataRoutes.get('/context/field/:dict_id', async (c) => {
  const dictId = c.req.param('dict_id');

  const context = await MetadataService.getFieldContext(dictId);
  
  if (!context.field) {
    return c.json({ error: 'Field not found' }, 404);
  }

  return c.json({
    field: context.field,
    lineage_summary: context.lineageSummary,
    ai_suggestions: [],
    quality_signals: {
      completeness_score: 0.8, // TODO: Calculate from field data
      anomalies: [],
    },
  } as FieldContextResponse);
});

/**
 * GET /metadata/context/entity/{entity_id}
 * Silent Killer Frontend: Entity-level context for screen rendering
 */
metadataRoutes.get('/context/entity/:entity_id', async (c) => {
  const entityId = c.req.param('entity_id');

  // TODO: Implement actual database query via MetadataService
  // For now, return mock response
  return c.json({
    entity: {
      entity_id: entityId,
      entity_name: 'Mock Entity',
      entity_type: 'table',
    },
    fields: [],
    mappings: [],
    quality_signals: {
      overall_score: 0.8,
      field_coverage: 0.9,
      mapping_coverage: 0.7,
    },
    compliance_status: {
      standards: [],
    },
  } as EntityContextResponse);
});

/**
 * GET /metadata/entities
 * List all entities in catalog
 */
metadataRoutes.get('/entities', async (c) => {
  const domain = c.req.query('domain');
  const entityType = c.req.query('type');

  const { entities, total } = await MetadataService.getEntities({
    domain: domain || undefined,
    entityType: entityType || undefined,
  });

  return c.json({
    entities,
    total,
  });
});

/**
 * GET /metadata/entities/{entity_id}/fields
 * Get all fields for an entity
 */
metadataRoutes.get('/entities/:entity_id/fields', async (c) => {
  const entityId = c.req.param('entity_id');

  // TODO: Implement actual database query
  return c.json({
    entity_id: entityId,
    fields: [],
  });
});

/**
 * GET /metadata/mappings/lookup
 * Constitution Service: metadata.mappings.lookup(local_field)
 */
metadataRoutes.get('/mappings/lookup', async (c) => {
  const field = c.req.query('field');
  const system = c.req.query('system');

  if (!field) {
    return c.json({ error: 'field parameter is required' }, 400);
  }

  const mapping = await MetadataService.lookupMapping(field, system || undefined);

  return c.json({
    mapping: mapping || null,
  });
});

/**
 * POST /metadata/mappings/suggest
 * Constitution Service: metadata.mappings.suggest(local_fields[])
 */
metadataRoutes.post('/mappings/suggest', async (c) => {
  const body = await c.req.json();

  // TODO: Implement AI-suggested mapping logic
  return c.json({
    suggestions: [],
  });
});
