// metadata-studio/api/mapping.routes.ts

/**
 * Mapping Resolution API
 * 
 * Implements GRCD Section 2.3 Mandatory Services:
 * - metadata.mappings.lookup(local_field) → canonical mapping
 * - metadata.mappings.suggest(local_fields[]) → suggested mappings
 * 
 * These endpoints enable other services (BI, ETL, dashboards) to resolve
 * local field names to canonical metadata concepts.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { AuthContext } from '../middleware/auth.middleware';
import { lookupMapping, suggestMappings } from '../services/mapping.service';
import { CONTEXT_DOMAINS } from '../db/schema/alias.tables';

export const mappingRouter = new Hono();

/**
 * POST /mapping/lookup
 * 
 * GRCD Service: metadata.mappings.lookup(local_field)
 * 
 * Look up a single local field name and find its canonical mapping.
 * 
 * Request Body:
 * {
 *   "localFieldName": "customerName",
 *   "contextDomain": "FINANCIAL_REPORTING"
 * }
 * 
 * Response:
 * {
 *   "localFieldName": "customerName",
 *   "canonicalKey": "customer_name",
 *   "confidence": 95,
 *   "matchType": "case_variant",
 *   "metadata": {
 *     "id": "...",
 *     "label": "Customer Name",
 *     "domain": "FINANCE",
 *     "module": "AR",
 *     "tier": "tier2"
 *   }
 * }
 */
mappingRouter.post(
  '/lookup',
  zValidator(
    'json',
    z.object({
      localFieldName: z.string().min(1).max(255),
      contextDomain: z.enum(CONTEXT_DOMAINS as unknown as [string, ...string[]]),
    }),
  ),
  async (c) => {
    const auth = c.get('auth') as AuthContext;
    const { localFieldName, contextDomain } = c.req.valid('json');

    const result = await lookupMapping(
      localFieldName,
      contextDomain as any,
      auth.tenantId,
    );

    return c.json(result);
  },
);

/**
 * POST /mapping/lookup/batch
 * 
 * Look up multiple local field names at once (more efficient).
 * 
 * Request Body:
 * {
 *   "localFieldNames": ["customerName", "invoiceTotal", "Sales"],
 *   "contextDomain": "FINANCIAL_REPORTING"
 * }
 * 
 * Response:
 * {
 *   "results": [
 *     { "localFieldName": "customerName", "canonicalKey": "customer_name", ... },
 *     { "localFieldName": "invoiceTotal", "canonicalKey": "invoice_total", ... },
 *     { "localFieldName": "Sales", "canonicalKey": "revenue_ifrs_core", ... }
 *   ]
 * }
 */
mappingRouter.post(
  '/lookup/batch',
  zValidator(
    'json',
    z.object({
      localFieldNames: z.array(z.string().min(1).max(255)).min(1).max(100),
      contextDomain: z.enum(CONTEXT_DOMAINS as unknown as [string, ...string[]]),
    }),
  ),
  async (c) => {
    const auth = c.get('auth') as AuthContext;
    const { localFieldNames, contextDomain } = c.req.valid('json');

    const results = await Promise.all(
      localFieldNames.map((name) =>
        lookupMapping(name, contextDomain as any, auth.tenantId),
      ),
    );

    return c.json({
      contextDomain,
      count: localFieldNames.length,
      resolved: results.filter((r) => r.canonicalKey !== null).length,
      results,
    });
  },
);

/**
 * POST /mapping/suggest
 * 
 * GRCD Service: metadata.mappings.suggest(local_fields[])
 * 
 * Get suggested canonical mappings for local field names.
 * Returns up to 3 suggestions per field, ranked by confidence.
 * 
 * Request Body:
 * {
 *   "localFieldNames": ["custNm", "inv_amt", "sales_figure"],
 *   "contextDomain": "FINANCIAL_REPORTING"
 * }
 * 
 * Response:
 * {
 *   "suggestions": [
 *     {
 *       "localFieldName": "custNm",
 *       "suggestions": [
 *         { "canonicalKey": "customer_name", "confidence": 80, "matchReason": "..." },
 *         { "canonicalKey": "customer_number", "confidence": 60, "matchReason": "..." }
 *       ]
 *     },
 *     ...
 *   ]
 * }
 */
mappingRouter.post(
  '/suggest',
  zValidator(
    'json',
    z.object({
      localFieldNames: z.array(z.string().min(1).max(255)).min(1).max(50),
      contextDomain: z.enum(CONTEXT_DOMAINS as unknown as [string, ...string[]]),
    }),
  ),
  async (c) => {
    const auth = c.get('auth') as AuthContext;
    const { localFieldNames, contextDomain } = c.req.valid('json');

    const suggestions = await suggestMappings(
      localFieldNames,
      contextDomain as any,
      auth.tenantId,
    );

    return c.json({
      contextDomain,
      count: localFieldNames.length,
      suggestions,
    });
  },
);

/**
 * GET /mapping/contexts
 * 
 * List all available context domains for mapping lookups.
 */
mappingRouter.get('/contexts', (c) => {
  return c.json({
    contexts: CONTEXT_DOMAINS,
    description: {
      FINANCIAL_REPORTING: 'External financial reports (IFRS/MFRS compliant)',
      MANAGEMENT_REPORTING: 'Internal management reports and dashboards',
      OPERATIONS: 'Operational data and processes',
      STATUTORY_DISCLOSURE: 'Regulatory filings and statutory reports',
      GENERIC_SPEECH: 'General business terminology',
    },
  });
});

