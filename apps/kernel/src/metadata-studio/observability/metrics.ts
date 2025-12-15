// metadata-studio/observability/metrics.ts
import {
  Counter,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from 'prom-client';

/**
 * Prometheus Metrics Registry
 *
 * Exposes runtime metrics for:
 * - Metadata search operations
 * - Lineage queries
 * - Data profiling runs
 * - Usage event tracking
 * - Node.js runtime (GC, event loop, memory, CPU)
 *
 * Prometheus scrapes GET /metrics to collect these.
 * Grafana dashboards visualize them.
 *
 * Closes audit gap: "zero instrumentation" → "metrics present"
 */
export const registry = new Registry();

// Default Node.js metrics (GC, event loop, memory, CPU)
collectDefaultMetrics({ register: registry });

// ═══════════════════════════════════════════════════════════════════
// METADATA SEARCH METRICS
// ═══════════════════════════════════════════════════════════════════

export const metadataSearchRequestsTotal = new Counter({
  name: 'metadata_search_requests_total',
  help: 'Total number of metadata search requests',
  labelNames: ['tenant_id', 'status'],
  registers: [registry],
});

export const metadataSearchDurationSeconds = new Histogram({
  name: 'metadata_search_duration_seconds',
  help: 'Metadata search duration in seconds',
  buckets: [0.01, 0.05, 0.1, 0.15, 0.3, 0.5, 1],
  labelNames: ['tenant_id'],
  registers: [registry],
});

// ═══════════════════════════════════════════════════════════════════
// LINEAGE METRICS
// ═══════════════════════════════════════════════════════════════════

export const metadataLineageRequestsTotal = new Counter({
  name: 'metadata_lineage_requests_total',
  help: 'Total number of lineage requests',
  labelNames: ['tenant_id', 'direction'],
  registers: [registry],
});

export const metadataLineageDurationSeconds = new Histogram({
  name: 'metadata_lineage_duration_seconds',
  help: 'Lineage query duration in seconds',
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2],
  labelNames: ['tenant_id', 'direction'],
  registers: [registry],
});

// ═══════════════════════════════════════════════════════════════════
// DATA PROFILER METRICS
// ═══════════════════════════════════════════════════════════════════

export const metadataProfilerRunsTotal = new Counter({
  name: 'metadata_profiler_runs_total',
  help: 'Total number of profiler runs',
  labelNames: ['tenant_id', 'entity_type'],
  registers: [registry],
});

export const metadataProfilerFailuresTotal = new Counter({
  name: 'metadata_profiler_failures_total',
  help: 'Total number of profiler failures',
  labelNames: ['tenant_id', 'error_type'],
  registers: [registry],
});

export const metadataProfilerDurationSeconds = new Histogram({
  name: 'metadata_profiler_duration_seconds',
  help: 'Profiler run duration in seconds',
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  labelNames: ['tenant_id', 'entity_type'],
  registers: [registry],
});

// ═══════════════════════════════════════════════════════════════════
// USAGE TRACKING METRICS
// ═══════════════════════════════════════════════════════════════════

export const metadataUsageEventsTotal = new Counter({
  name: 'metadata_usage_events_total',
  help: 'Total number of metadata usage events',
  labelNames: ['tenant_id', 'event_type', 'actor_type', 'governance_tier'],
  registers: [registry],
});

// ═══════════════════════════════════════════════════════════════════
// APPROVAL WORKFLOW METRICS
// ═══════════════════════════════════════════════════════════════════

export const metadataApprovalRequestsTotal = new Counter({
  name: 'metadata_approval_requests_total',
  help: 'Total number of approval requests',
  labelNames: ['tenant_id', 'entity_type', 'tier'],
  registers: [registry],
});

export const metadataApprovalDecisionsTotal = new Counter({
  name: 'metadata_approval_decisions_total',
  help: 'Total number of approval decisions',
  labelNames: ['tenant_id', 'entity_type', 'decision'],
  registers: [registry],
});

export const metadataApprovalDurationSeconds = new Histogram({
  name: 'metadata_approval_duration_seconds',
  help: 'Time from request to approval/rejection in seconds',
  buckets: [60, 300, 900, 3600, 7200, 14400, 86400], // 1m, 5m, 15m, 1h, 2h, 4h, 1d
  labelNames: ['tenant_id', 'entity_type'],
  registers: [registry],
});

// ═══════════════════════════════════════════════════════════════════
// KPI & IMPACT ANALYSIS METRICS
// ═══════════════════════════════════════════════════════════════════

export const metadataKpiRequestsTotal = new Counter({
  name: 'metadata_kpi_requests_total',
  help: 'Total number of KPI definition requests',
  labelNames: ['tenant_id', 'tier', 'status'],
  registers: [registry],
});

export const metadataImpactAnalysisRequestsTotal = new Counter({
  name: 'metadata_impact_analysis_requests_total',
  help: 'Total number of impact analysis requests',
  labelNames: ['tenant_id'],
  registers: [registry],
});

export const metadataImpactAnalysisDurationSeconds = new Histogram({
  name: 'metadata_impact_analysis_duration_seconds',
  help: 'Impact analysis duration in seconds',
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2],
  labelNames: ['tenant_id'],
  registers: [registry],
});

// ═══════════════════════════════════════════════════════════════════
// HTTP API METRICS
// ═══════════════════════════════════════════════════════════════════

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [registry],
});

export const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  labelNames: ['method', 'route'],
  registers: [registry],
});

// ═══════════════════════════════════════════════════════════════════
// DATABASE METRICS
// ═══════════════════════════════════════════════════════════════════

export const dbQueriesTotal = new Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['table', 'operation'],
  registers: [registry],
});

export const dbQueryDurationSeconds = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration in seconds',
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  labelNames: ['table', 'operation'],
  registers: [registry],
});

// ═══════════════════════════════════════════════════════════════════
// MAPPING SERVICE METRICS (GRCD Phase 1)
// ═══════════════════════════════════════════════════════════════════

export const mappingLookupRequestsTotal = new Counter({
  name: 'metadata_mapping_lookup_requests_total',
  help: 'Total number of mapping lookup requests',
  labelNames: ['tenant_id', 'context_domain', 'match_type'],
  registers: [registry],
});

export const mappingLookupDurationSeconds = new Histogram({
  name: 'metadata_mapping_lookup_duration_seconds',
  help: 'Mapping lookup duration in seconds',
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25],
  labelNames: ['tenant_id', 'context_domain'],
  registers: [registry],
});

export const mappingSuggestRequestsTotal = new Counter({
  name: 'metadata_mapping_suggest_requests_total',
  help: 'Total number of mapping suggest requests',
  labelNames: ['tenant_id', 'context_domain'],
  registers: [registry],
});

// ═══════════════════════════════════════════════════════════════════
// POLICY SERVICE METRICS (GRCD Phase 1)
// ═══════════════════════════════════════════════════════════════════

export const policyAccessCheckRequestsTotal = new Counter({
  name: 'metadata_policy_access_check_requests_total',
  help: 'Total number of policy access check requests',
  labelNames: ['tenant_id', 'resource_type', 'intent', 'allowed'],
  registers: [registry],
});

export const policyAccessCheckDurationSeconds = new Histogram({
  name: 'metadata_policy_access_check_duration_seconds',
  help: 'Policy access check duration in seconds',
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05],
  labelNames: ['tenant_id', 'resource_type'],
  registers: [registry],
});

export const policyApprovalRequiredTotal = new Counter({
  name: 'metadata_policy_approval_required_total',
  help: 'Total number of operations requiring approval',
  labelNames: ['tenant_id', 'tier', 'intent', 'required_role'],
  registers: [registry],
});

// ═══════════════════════════════════════════════════════════════════
// SCHEMA DRIFT KPI METRICS (GRCD Section 5)
// ═══════════════════════════════════════════════════════════════════

export const schemaDriftIncidentsTotal = new Counter({
  name: 'metadata_schema_drift_incidents_total',
  help: 'Total number of schema drift incidents detected',
  labelNames: ['tenant_id', 'domain', 'severity'],
  registers: [registry],
});

export const schemaDriftResolutionDurationSeconds = new Histogram({
  name: 'metadata_schema_drift_resolution_duration_seconds',
  help: 'Time to resolve schema drift incidents in seconds',
  buckets: [60, 300, 900, 3600, 7200, 14400, 86400, 172800], // 1m to 2d
  labelNames: ['tenant_id', 'domain'],
  registers: [registry],
});

export const tier1LineageCoverageGauge = new Counter({
  name: 'metadata_tier1_lineage_coverage_total',
  help: 'Number of Tier1 fields with lineage coverage',
  labelNames: ['tenant_id', 'status'], // covered | uncovered
  registers: [registry],
});

export const metadataChangesWithAiReviewTotal = new Counter({
  name: 'metadata_changes_with_ai_review_total',
  help: 'Total number of metadata changes with AI review',
  labelNames: ['tenant_id', 'tier', 'ai_reviewed'],
  registers: [registry],
});

