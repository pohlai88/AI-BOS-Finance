// metadata-studio/api/naming.routes.ts

/**
 * Naming Resolution API
 * 
 * Provides HTTP endpoints for resolving naming variants.
 * Other services (BI, dashboards, ETL) can use this to get consistent names.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { AuthContext } from '../middleware/auth.middleware';
import {
  resolveNameForConcept,
  batchResolveNames,
  preGenerateStandardVariants,
} from '../naming';
import { NAMING_CONTEXTS, NAMING_STYLES } from '../naming';

export const namingRouter = new Hono();

/**
 * GET /naming/resolve/:canonicalKey
 * 
 * Resolve a single naming variant
 * 
 * Query params:
 * - context: db | typescript | graphql | api_path | const | bi | tax
 * - style (optional): override default style for context
 * - persist (optional): whether to save generated variant (default: false)
 * 
 * Example:
 * GET /naming/resolve/receipt_outstanding_amount?context=typescript
 * Response: { "value": "receiptOutstandingAmount" }
 */
namingRouter.get(
  '/resolve/:canonicalKey',
  zValidator(
    'query',
    z.object({
      context: z.enum(NAMING_CONTEXTS as unknown as [string, ...string[]]),
      style: z.enum(NAMING_STYLES as unknown as [string, ...string[]]).optional(),
      persist: z
        .string()
        .transform((v) => v === 'true')
        .optional(),
    }),
  ),
  async (c) => {
    const auth = c.get('auth') as AuthContext;
    const { canonicalKey } = c.req.param();
    const { context, style, persist } = c.req.valid('query');

    try {
      const value = await resolveNameForConcept({
        canonicalKey,
        context: context as any,
        styleOverride: style as any,
        persistIfMissing: persist,
        tenantId: auth.tenantId,
      });

      return c.json({
        canonicalKey,
        context,
        style: style ?? 'default',
        value,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return c.json({ error: error.message }, 404);
      }
      if (error instanceof Error && error.message.includes('not valid snake_case')) {
        return c.json({ error: error.message }, 400);
      }
      throw error;
    }
  },
);

/**
 * POST /naming/resolve/batch
 * 
 * Resolve multiple naming variants at once
 * 
 * Body:
 * {
 *   "canonicalKeys": ["receipt_outstanding_amount", "invoice_total"],
 *   "context": "typescript",
 *   "persist": false
 * }
 * 
 * Response:
 * {
 *   "results": {
 *     "receipt_outstanding_amount": "receiptOutstandingAmount",
 *     "invoice_total": "invoiceTotal"
 *   }
 * }
 */
namingRouter.post(
  '/resolve/batch',
  zValidator(
    'json',
    z.object({
      canonicalKeys: z.array(z.string()).min(1).max(100),
      context: z.enum(NAMING_CONTEXTS as unknown as [string, ...string[]]),
      persist: z.boolean().optional().default(false),
    }),
  ),
  async (c) => {
    const auth = c.get('auth') as AuthContext;
    const { canonicalKeys, context, persist } = c.req.valid('json');

    const results = await batchResolveNames({
      canonicalKeys,
      context: context as any,
      tenantId: auth.tenantId,
      persistIfMissing: persist,
    });

    // Convert Map to object for JSON response
    const resultsObject = Object.fromEntries(results);

    return c.json({
      context,
      count: canonicalKeys.length,
      results: resultsObject,
    });
  },
);

/**
 * POST /naming/generate/:conceptId
 * 
 * Pre-generate all standard variants for a concept
 * Useful when creating new metadata
 * 
 * Body:
 * {
 *   "canonicalKey": "receipt_outstanding_amount"
 * }
 * 
 * Response:
 * {
 *   "conceptId": "...",
 *   "canonicalKey": "receipt_outstanding_amount",
 *   "generated": 5
 * }
 */
namingRouter.post(
  '/generate/:conceptId',
  zValidator(
    'json',
    z.object({
      canonicalKey: z.string().regex(/^[a-z][a-z0-9]*(_[a-z0-9]+)*$/),
    }),
  ),
  async (c) => {
    const { conceptId } = c.req.param();
    const { canonicalKey } = c.req.valid('json');

    const generated = await preGenerateStandardVariants(canonicalKey, conceptId);

    return c.json({
      conceptId,
      canonicalKey,
      generated,
    });
  },
);

/**
 * GET /naming/contexts
 * 
 * List all available naming contexts
 */
namingRouter.get('/contexts', (c) => {
  return c.json({
    contexts: NAMING_CONTEXTS,
  });
});

/**
 * GET /naming/styles
 * 
 * List all available naming styles
 */
namingRouter.get('/styles', (c) => {
  return c.json({
    styles: NAMING_STYLES,
  });
});

