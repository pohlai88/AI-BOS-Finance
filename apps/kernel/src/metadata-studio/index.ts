// metadata-studio/index.ts
// ============================================================================
// UI-Driven Development: Clean, minimal routes for META frontend pages
// ============================================================================
import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { authMiddleware } from './middleware/auth.middleware';

// META Page Routes (UI-Driven Development)
import { metaGovernanceRouter } from './api/meta-governance.routes';
import { metaEntitiesRouter } from './api/meta-entities.routes';
import { metaFieldsRouter } from './api/meta-fields.routes';
import { metaStandardPacksRouter } from './api/meta-standard-packs.routes';
import { metaViolationsRouter } from './api/meta-violations.routes';
import { metaLineageRouter } from './api/meta-lineage.routes';
import { registerMetricsRoutes } from './api/metrics.routes';

export function createApp() {
  const app = new Hono();

  // Global middleware
  app.use('*', cors());
  app.use('*', authMiddleware);

  // Health check
  app.get('/healthz', (c) =>
    c.json({ status: 'ok', service: 'metadata-studio' }),
  );

  // Prometheus metrics endpoint
  registerMetricsRoutes(app);

  // ==========================================================================
  // META PAGE ROUTES (UI-Driven Development)
  // These routes serve exactly what the META_01-08 frontend pages need
  // ==========================================================================

  // META_01: Schema Governance, META_04: Risk Radar, META_06: Health Scan
  app.route('/api/meta/governance', metaGovernanceRouter);

  // META_05: Canon Matrix (Entity Hierarchy)
  app.route('/api/meta/entities', metaEntitiesRouter);

  // META_02: God View, META_03: Prism Comparator
  app.route('/api/meta/fields', metaFieldsRouter);

  // META_06: Standard Packs Registry
  app.route('/api/meta/standard-packs', metaStandardPacksRouter);

  // META_04: Violations & HITL Remediation Workflow
  app.route('/api/meta/violations', metaViolationsRouter);

  // Lineage & Impact Analysis (Active Intelligence)
  app.route('/api/meta/lineage', metaLineageRouter);

  return app;
}

// If run directly: start an HTTP server
if (import.meta.url === `file://${process.argv[1]}`) {
  async function bootstrap() {
    const app = createApp();
    const port = Number(process.env.PORT ?? 8787);

    serve({ fetch: app.fetch, port });

    console.log(`metadata-studio listening on http://localhost:${port}`);
  }

  bootstrap().catch((error) => {
    console.error('Failed to start metadata-studio:', error);
    process.exit(1);
  });
}
