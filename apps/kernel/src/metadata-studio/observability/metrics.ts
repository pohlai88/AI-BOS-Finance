// metadata-studio/observability/metrics.ts
// =============================================================================
// METRICS COLLECTION MODULE
// Provides basic metrics collection for metadata operations
// =============================================================================

export interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
}

class MetricsCollector {
  private metrics: MetricData[] = [];

  /**
   * Record a metric
   */
  record(name: string, value: number, labels?: Record<string, string>) {
    this.metrics.push({
      name,
      value,
      timestamp: new Date(),
      labels,
    });

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): MetricData[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): MetricData[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }

  /**
   * Get summary statistics for a metric
   */
  getSummary(name: string) {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) {
      return null;
    }

    const values = metrics.map((m) => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      count: metrics.length,
      sum,
      avg,
      min,
      max,
    };
  }
}

// Singleton instance
export const metrics = new MetricsCollector();

// Registry for Prometheus-style metrics endpoint
export const registry = {
  metrics: () => metrics.getMetrics(),
  contentType: 'text/plain',
  getMetricsAsPrometheus: () => {
    const allMetrics = metrics.getMetrics();
    const lines: string[] = [];

    // Group by metric name
    const grouped = new Map<string, MetricData[]>();
    for (const m of allMetrics) {
      const existing = grouped.get(m.name) || [];
      existing.push(m);
      grouped.set(m.name, existing);
    }

    // Format as Prometheus exposition format
    for (const [name, data] of grouped) {
      lines.push(`# TYPE ${name} gauge`);
      const latest = data[data.length - 1];
      const labels = latest.labels
        ? Object.entries(latest.labels).map(([k, v]) => `${k}="${v}"`).join(',')
        : '';
      lines.push(`${name}${labels ? `{${labels}}` : ''} ${latest.value}`);
    }

    return lines.join('\n');
  },
};

// Helper functions
export function recordMetric(
  name: string,
  value: number,
  labels?: Record<string, string>
) {
  metrics.record(name, value, labels);
}

export function getMetrics() {
  return metrics.getMetrics();
}

export function getMetricsSummary(name: string) {
  return metrics.getSummary(name);
}
