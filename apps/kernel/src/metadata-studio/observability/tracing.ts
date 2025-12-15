// metadata-studio/observability/tracing.ts
import { SpanStatusCode, trace } from '@opentelemetry/api';

/**
 * OpenTelemetry Tracer
 *
 * Emits distributed tracing spans for:
 * - metadata.search
 * - metadata.lineage
 * - metadata.profile
 * - metadata.impact
 *
 * Spans are exported to your OTEL collector (Jaeger, Zipkin, etc.)
 * configured at platform bootstrap level.
 *
 * Closes audit gap: "no tracing" → "OTEL spans present"
 */
const tracer = trace.getTracer('metadata-studio');

/**
 * Wrap async operations with an OTEL span.
 *
 * Usage:
 * ```ts
 * const result = await withSpan('metadata.search', async () => {
 *   return metadataRepo.search(tenantId, input);
 * });
 * ```
 *
 * Benefits:
 * - Automatic span creation/completion
 * - Exception recording
 * - Status code setting (OK/ERROR)
 * - Integration with platform-wide tracing
 */
export async function withSpan<T>(
  name: 'metadata.search' | 'metadata.lineage' | 'metadata.profile' | 'metadata.impact',
  fn: () => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.recordException(err as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw err;
    } finally {
      span.end();
    }
  });
}

/**
 * Add custom attributes to the current active span.
 *
 * Usage:
 * ```ts
 * await withSpan('metadata.search', async () => {
 *   addSpanAttributes({
 *     'tenant.id': tenantId,
 *     'metadata.domain': 'finance',
 *     'metadata.tier': 'tier1',
 *   });
 *   return metadataRepo.search(...);
 * });
 * ```
 */
export function addSpanAttributes(attributes: Record<string, string | number | boolean>) {
  const span = trace.getActiveSpan();
  if (span) {
    Object.entries(attributes).forEach(([key, value]) => {
      span.setAttribute(key, value);
    });
  }
}

/**
 * Add an event to the current active span.
 *
 * Usage:
 * ```ts
 * addSpanEvent('cache_hit', { key: 'revenue_gross', ttl: 300 });
 * ```
 */
export function addSpanEvent(name: string, attributes?: Record<string, string | number | boolean>) {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

