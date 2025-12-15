// metadata-studio/api/metrics.routes.ts
import type { Hono } from 'hono';
import { registry } from '../observability/metrics';

/**
 * Metrics endpoint for Prometheus scraping.
 *
 * GET /metrics returns Prometheus-formatted metrics including:
 * - Node.js runtime (GC, event loop, memory, CPU)
 * - Metadata search operations
 * - Lineage queries
 * - Data profiling runs
 * - Usage events
 * - Approval workflows
 * - KPI operations
 * - Impact analysis
 * - HTTP API requests
 * - Database queries
 *
 * Prometheus configuration:
 * ```yaml
 * scrape_configs:
 *   - job_name: 'metadata-studio'
 *     static_configs:
 *       - targets: ['localhost:8787']
 *     metrics_path: '/metrics'
 *     scrape_interval: 15s
 * ```
 */
export function registerMetricsRoutes(app: Hono) {
  app.get('/metrics', async (c) => {
    const body = await registry.metrics();
    c.header('Content-Type', registry.contentType);
    return c.body(body);
  });
}

