'use client';

/**
 * BioStress - BIOSKIN Performance Testing Harness
 * 
 * Purpose: Stress test BioTable with large datasets to validate:
 * - Render performance (100 → 50,000 rows)
 * - Filter performance (rapid typing)
 * - Sort performance (rapid toggles)
 * - Memory leak detection
 * 
 * Budgets per TESTING_PRD:
 * - 100 rows: < 100ms
 * - 1,000 rows: < 300ms  
 * - 10,000 rows: < 500ms
 * - 50,000 rows: < 2s (graceful degradation)
 */

import * as React from 'react';
import { z } from 'zod';
import {
  BioTable,
  Surface,
  Txt,
  Btn,
  StatusBadge,
  Spinner,
} from '@aibos/bioskin';

// ============================================================
// Test Schema
// ============================================================

const StressTestSchema = z.object({
  id: z.string().describe('ID'),
  name: z.string().describe('Name'),
  email: z.string().email().describe('Email'),
  amount: z.number().describe('Amount'),
  status: z.enum(['pending', 'approved', 'rejected', 'processing']).describe('Status'),
  category: z.string().describe('Category'),
  date: z.string().describe('Date'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).describe('Priority'),
});

type StressTestData = z.infer<typeof StressTestSchema>;

// ============================================================
// Data Generator
// ============================================================

const CATEGORIES = ['Sales', 'Marketing', 'Engineering', 'Finance', 'HR', 'Operations'];
const STATUSES: StressTestData['status'][] = ['pending', 'approved', 'rejected', 'processing'];
const PRIORITIES: StressTestData['priority'][] = ['low', 'medium', 'high', 'critical'];

function generateData(count: number): StressTestData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `STR-${String(i + 1).padStart(6, '0')}`,
    name: `User ${i + 1}`,
    email: `user${i + 1}@test.com`,
    amount: Math.floor(Math.random() * 100000) / 100,
    status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
    category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
    date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)],
  }));
}

// ============================================================
// Performance Metrics
// ============================================================

interface PerfMetrics {
  rowCount: number;
  generateTime: number;
  renderTime: number;
  totalTime: number;
  memoryBefore?: number;
  memoryAfter?: number;
  memoryDelta?: number;
}

function getMemoryUsage(): number | undefined {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const perf = performance as Performance & {
      memory?: { usedJSHeapSize: number };
    };
    return perf.memory?.usedJSHeapSize;
  }
  return undefined;
}

// ============================================================
// Stress Test Page
// ============================================================

const ROW_COUNTS = [100, 500, 1000, 5000, 10000, 25000, 50000];

export default function BioStressPage() {
  const [rowCount, setRowCount] = React.useState(100);
  const [data, setData] = React.useState<StressTestData[]>([]);
  const [metrics, setMetrics] = React.useState<PerfMetrics | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [history, setHistory] = React.useState<PerfMetrics[]>([]);
  const renderStartRef = React.useRef<number>(0);

  // Generate data and measure performance
  const runStressTest = React.useCallback(() => {
    setIsGenerating(true);
    setMetrics(null);

    // Measure memory before
    const memoryBefore = getMemoryUsage();

    // Use requestAnimationFrame to ensure UI updates before measuring
    requestAnimationFrame(() => {
      const generateStart = performance.now();
      const newData = generateData(rowCount);
      const generateEnd = performance.now();
      const generateTime = generateEnd - generateStart;

      // Set render start time
      renderStartRef.current = performance.now();

      // Set data and wait for render
      setData(newData);

      // Measure render time in next frame
      requestAnimationFrame(() => {
        const renderEnd = performance.now();
        const renderTime = renderEnd - renderStartRef.current;
        const memoryAfter = getMemoryUsage();

        const newMetrics: PerfMetrics = {
          rowCount,
          generateTime,
          renderTime,
          totalTime: generateTime + renderTime,
          memoryBefore,
          memoryAfter,
          memoryDelta: memoryBefore && memoryAfter ? memoryAfter - memoryBefore : undefined,
        };

        setMetrics(newMetrics);
        setHistory(prev => [...prev, newMetrics]);
        setIsGenerating(false);
      });
    });
  }, [rowCount]);

  // Clear test
  const clearTest = React.useCallback(() => {
    setData([]);
    setMetrics(null);
  }, []);

  // Memory leak test - mount/unmount table multiple times
  const [leakTestRunning, setLeakTestRunning] = React.useState(false);
  const [leakTestResults, setLeakTestResults] = React.useState<{
    iterations: number;
    startMemory?: number;
    endMemory?: number;
    growth?: number;
  } | null>(null);

  const runLeakTest = React.useCallback(async () => {
    setLeakTestRunning(true);
    const startMemory = getMemoryUsage();
    const iterations = 50;

    for (let i = 0; i < iterations; i++) {
      setData(generateData(1000));
      await new Promise(r => setTimeout(r, 50));
      setData([]);
      await new Promise(r => setTimeout(r, 50));
    }

    // Force GC if available
    if ((window as { gc?: () => void }).gc) {
      (window as { gc?: () => void }).gc?.();
    }
    await new Promise(r => setTimeout(r, 500));

    const endMemory = getMemoryUsage();

    setLeakTestResults({
      iterations,
      startMemory,
      endMemory,
      growth: startMemory && endMemory ? endMemory - startMemory : undefined,
    });
    setLeakTestRunning(false);
  }, []);

  // Get status color based on performance
  const getPerformanceStatus = (time: number, rowCount: number): 'success' | 'warning' | 'danger' => {
    const budgets: Record<number, number> = {
      100: 100,
      500: 200,
      1000: 300,
      5000: 400,
      10000: 500,
      25000: 1000,
      50000: 2000,
    };
    const budget = budgets[rowCount] || 500;

    if (time < budget * 0.7) return 'success';
    if (time < budget) return 'warning';
    return 'danger';
  };

  return (
    <div className="min-h-screen bg-surface-base p-6 space-y-6">
      {/* Header */}
      <Surface padding="lg">
        <div className="flex items-center justify-between">
          <div>
            <Txt variant="h1">🔥 BIOSKIN Stress Test</Txt>
            <Txt variant="body" color="muted">
              Performance testing harness for BioTable
            </Txt>
          </div>
          <StatusBadge
            status={data.length > 0 ? 'active' : 'inactive'}
            showDot
            dotVariant="pulse"
          />
        </div>
      </Surface>

      {/* Controls */}
      <Surface padding="lg">
        <Txt variant="h3" className="mb-4">Test Configuration</Txt>
        <div className="flex flex-wrap gap-4 items-end">
          {/* Row Count Selector */}
          <div className="space-y-2">
            <Txt variant="label">Row Count</Txt>
            <select
              value={rowCount}
              onChange={(e) => setRowCount(Number(e.target.value))}
              className="px-4 py-2 border border-default rounded-md bg-surface-base text-text-primary"
              data-testid="row-count-select"
            >
              {ROW_COUNTS.map((count) => (
                <option key={count} value={count}>
                  {count.toLocaleString()} rows
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Btn
              intent="primary"
              onClick={runStressTest}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Spinner variant="default" size="sm" className="mr-2" />
                  Generating...
                </>
              ) : (
                '▶️ Run Stress Test'
              )}
            </Btn>
            <Btn intent="secondary" onClick={clearTest}>
              🗑️ Clear
            </Btn>
            <Btn
              intent="secondary"
              onClick={runLeakTest}
              disabled={leakTestRunning}
            >
              {leakTestRunning ? (
                <>
                  <Spinner variant="default" size="sm" className="mr-2" />
                  Testing...
                </>
              ) : (
                '🔍 Memory Leak Test'
              )}
            </Btn>
          </div>
        </div>
      </Surface>

      {/* Metrics Display */}
      {metrics && (
        <Surface padding="lg">
          <Txt variant="h3" className="mb-4">Performance Metrics</Txt>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Row Count */}
            <div className="p-4 bg-surface-subtle rounded-lg">
              <Txt variant="label" color="muted">Rows</Txt>
              <Txt variant="h2">{metrics.rowCount.toLocaleString()}</Txt>
            </div>

            {/* Generate Time */}
            <div className="p-4 bg-surface-subtle rounded-lg">
              <Txt variant="label" color="muted">Generate Time</Txt>
              <Txt variant="h2">{metrics.generateTime.toFixed(1)}ms</Txt>
            </div>

            {/* Render Time */}
            <div className="p-4 bg-surface-subtle rounded-lg">
              <Txt variant="label" color="muted">Render Time</Txt>
              <div className="flex items-center gap-2">
                <Txt variant="h2">{metrics.renderTime.toFixed(1)}ms</Txt>
                <StatusBadge
                  status={getPerformanceStatus(metrics.renderTime, metrics.rowCount)}
                  size="sm"
                />
              </div>
            </div>

            {/* Total Time */}
            <div className="p-4 bg-surface-subtle rounded-lg">
              <Txt variant="label" color="muted">Total Time</Txt>
              <div className="flex items-center gap-2">
                <Txt variant="h2">{metrics.totalTime.toFixed(1)}ms</Txt>
                <StatusBadge
                  status={getPerformanceStatus(metrics.totalTime, metrics.rowCount)}
                  size="sm"
                />
              </div>
            </div>

            {/* Memory Delta */}
            {metrics.memoryDelta !== undefined && (
              <div className="p-4 bg-surface-subtle rounded-lg col-span-2">
                <Txt variant="label" color="muted">Memory Delta</Txt>
                <Txt variant="h2">
                  {(metrics.memoryDelta / 1024 / 1024).toFixed(2)} MB
                </Txt>
              </div>
            )}
          </div>
        </Surface>
      )}

      {/* Leak Test Results */}
      {leakTestResults && (
        <Surface padding="lg">
          <Txt variant="h3" className="mb-4">Memory Leak Test Results</Txt>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-surface-subtle rounded-lg">
              <Txt variant="label" color="muted">Iterations</Txt>
              <Txt variant="h2">{leakTestResults.iterations}</Txt>
            </div>
            {leakTestResults.growth !== undefined && (
              <>
                <div className="p-4 bg-surface-subtle rounded-lg">
                  <Txt variant="label" color="muted">Memory Growth</Txt>
                  <div className="flex items-center gap-2">
                    <Txt variant="h2">
                      {(leakTestResults.growth / 1024 / 1024).toFixed(2)} MB
                    </Txt>
                    <StatusBadge
                      status={leakTestResults.growth < 10 * 1024 * 1024 ? 'success' : 'danger'}
                      size="sm"
                    />
                  </div>
                </div>
                <div className="p-4 bg-surface-subtle rounded-lg">
                  <Txt variant="label" color="muted">Pass Criteria</Txt>
                  <Txt variant="body" color="muted">
                    &lt; 10MB growth
                  </Txt>
                </div>
              </>
            )}
          </div>
        </Surface>
      )}

      {/* History */}
      {history.length > 0 && (
        <Surface padding="lg">
          <div className="flex justify-between items-center mb-4">
            <Txt variant="h3">Test History</Txt>
            <Btn intent="ghost" size="sm" onClick={() => setHistory([])}>
              Clear History
            </Btn>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-default">
                  <th className="text-left py-2 px-3">Rows</th>
                  <th className="text-left py-2 px-3">Generate</th>
                  <th className="text-left py-2 px-3">Render</th>
                  <th className="text-left py-2 px-3">Total</th>
                  <th className="text-left py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} className="border-b border-subtle">
                    <td className="py-2 px-3">{h.rowCount.toLocaleString()}</td>
                    <td className="py-2 px-3">{h.generateTime.toFixed(1)}ms</td>
                    <td className="py-2 px-3">{h.renderTime.toFixed(1)}ms</td>
                    <td className="py-2 px-3">{h.totalTime.toFixed(1)}ms</td>
                    <td className="py-2 px-3">
                      <StatusBadge
                        status={getPerformanceStatus(h.totalTime, h.rowCount)}
                        size="sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>
      )}

      {/* BioTable Under Test */}
      {data.length > 0 && (
        <Surface padding="lg">
          <Txt variant="h3" className="mb-4">
            BioTable ({data.length.toLocaleString()} rows)
          </Txt>
          <BioTable
            schema={StressTestSchema}
            data={data}
            enableSorting
            enableFiltering
            enablePagination
            enableSelection
            pageSize={25}
          />
        </Surface>
      )}

      {/* Budget Reference */}
      <Surface padding="lg">
        <Txt variant="h3" className="mb-4">Performance Budgets (TESTING_PRD)</Txt>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-default">
              <th className="text-left py-2 px-3">Rows</th>
              <th className="text-left py-2 px-3">Budget</th>
              <th className="text-left py-2 px-3">Target</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-subtle">
              <td className="py-2 px-3">100</td>
              <td className="py-2 px-3">&lt; 100ms</td>
              <td className="py-2 px-3">Instant</td>
            </tr>
            <tr className="border-b border-subtle">
              <td className="py-2 px-3">1,000</td>
              <td className="py-2 px-3">&lt; 300ms</td>
              <td className="py-2 px-3">Smooth</td>
            </tr>
            <tr className="border-b border-subtle">
              <td className="py-2 px-3">10,000</td>
              <td className="py-2 px-3">&lt; 500ms</td>
              <td className="py-2 px-3">Acceptable</td>
            </tr>
            <tr className="border-b border-subtle">
              <td className="py-2 px-3">50,000</td>
              <td className="py-2 px-3">&lt; 2s</td>
              <td className="py-2 px-3">Graceful degradation</td>
            </tr>
          </tbody>
        </table>
      </Surface>
    </div>
  );
}
