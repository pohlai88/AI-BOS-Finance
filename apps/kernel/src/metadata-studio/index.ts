// metadata-studio/index.ts
import 'dotenv/config'; // Load .env file FIRST
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { authMiddleware } from './middleware/auth.middleware';
import { rulesRouter } from './api/rules.routes';
import { approvalsRouter } from './api/approvals.routes';
import { metadataRouter } from './api/metadata.routes';
import { lineageRouter } from './api/lineage.routes';
import { glossaryRouter } from './api/glossary.routes';
import { tagsRouter } from './api/tags.routes';
import { kpiRouter } from './api/kpi.routes';
import { impactRouter } from './api/impact.routes';
import { qualityRouter } from './api/quality.routes';
import { namingRouter } from './api/naming.routes';
import { mappingRouter } from './api/mapping.routes';
import { policyRouter } from './api/policy.routes';
import { namingPolicyRouter } from './api/naming-policy.routes';
import { agentProposalRouter } from './api/agent-proposal.routes';
import { autoApplyRouter } from './api/auto-apply.routes';
import { registerMetricsRoutes } from './api/metrics.routes';
import { initializeEventSystem } from './events';

export function createApp() {
  const app = new Hono();

  // Attach auth for all routes
  app.use('*', authMiddleware);

  // Health check
  app.get('/healthz', (c) =>
    c.json({ status: 'ok', service: 'metadata-studio' }),
  );

  // Prometheus metrics endpoint
  registerMetricsRoutes(app);

  // Business rules + approvals + metadata + lineage + glossary + tags + kpi + impact + quality + naming
  app.route('/rules', rulesRouter);
  app.route('/approvals', approvalsRouter);
  app.route('/metadata', metadataRouter);
  app.route('/lineage', lineageRouter);
  app.route('/glossary', glossaryRouter);
  app.route('/tags', tagsRouter);
  app.route('/kpi', kpiRouter);
  app.route('/impact', impactRouter);
  app.route('/quality', qualityRouter);
  app.route('/naming', namingRouter);
  app.route('/mapping', mappingRouter);
  app.route('/policy', policyRouter);
  app.route('/naming-policy', namingPolicyRouter);
  app.route('/agent-proposals', agentProposalRouter);
  app.route('/auto-apply', autoApplyRouter);

  return app;
}

// If run directly: start an HTTP server
if (import.meta.url === `file://${process.argv[1]}`) {
  // Bootstrap application
  async function bootstrap() {
    // Initialize event system (subscribers)
    await initializeEventSystem();

    const app = createApp();
    const port = Number(process.env.PORT ?? 8787);

    serve({ fetch: app.fetch, port });

    // eslint-disable-next-line no-console
    console.log(`metadata-studio listening on http://localhost:${port}`);
  }

  // Start application
  bootstrap().catch((error) => {
    console.error('Failed to start metadata-studio:', error);
    process.exit(1);
  });
}

