/**
 * BioChart - Lightweight chart component for dashboards
 *
 * Sprint 5 per BIOSKIN 2.1 PRD - ERPNext Expansion
 * Simple SVG-based charts for reports and dashboards.
 *
 * @example
 * // Bar chart
 * <BioChart type="bar" data={salesData} />
 *
 * @example
 * // Line chart
 * <BioChart type="line" data={trendData} />
 *
 * ---
 * ## ⚡ Performance Tips
 *
 * **Bundle Size:** ~15KB - Consider dynamic import:
 * ```tsx
 * const LazyChart = dynamic(() => import('@aibos/bioskin').then(m => m.BioChart), {
 *   ssr: false,
 *   loading: () => <LoadingState />
 * });
 * ```
 *
 * **Memoize data transformations:**
 * ```tsx
 * const chartData = useMemo(() => rawData.map(d => ({
 *   label: d.month,
 *   value: d.revenue
 * })), [rawData]);
 * ```
 *
 * @see PERFORMANCE.md for full optimization guide
 */

'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../atoms/utils';
import { Surface } from '../../atoms/Surface';
import { Txt } from '../../atoms/Txt';

// ============================================================
// Types
// ============================================================

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'donut';

export interface ChartDataPoint {
  /** Label (x-axis) */
  label: string;
  /** Value (y-axis) */
  value: number;
  /** Color override */
  color?: string;
}

export interface BioChartProps {
  /** Chart type */
  type: ChartType;
  /** Chart data */
  data: ChartDataPoint[];
  /** Chart title */
  title?: string;
  /** Chart height */
  height?: number;
  /** Show labels */
  showLabels?: boolean;
  /** Show values */
  showValues?: boolean;
  /** Show grid */
  showGrid?: boolean;
  /** Color scheme */
  colors?: string[];
  /** Additional className */
  className?: string;
  /** Loading state */
  loading?: boolean;
  /** Empty message */
  emptyMessage?: string;
}

// ============================================================
// Component Meta
// ============================================================

export const COMPONENT_META = {
  code: 'CHRT01',
  version: '1.0.0',
  name: 'BioChart',
  family: 'CHART',
  purpose: 'VISUALIZE',
  poweredBy: 'svg',
  status: 'active',
} as const;

// ============================================================
// Default Colors
// ============================================================

const DEFAULT_COLORS = [
  'hsl(var(--accent-primary))',
  'hsl(var(--status-success))',
  'hsl(var(--status-warning))',
  'hsl(var(--status-danger))',
  'hsl(var(--status-info))',
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
];

// ============================================================
// Bar Chart
// ============================================================

interface BarChartProps {
  data: ChartDataPoint[];
  height: number;
  colors: string[];
  showLabels: boolean;
  showValues: boolean;
  showGrid: boolean;
}

function BarChart({ data, height, colors, showLabels, showValues, showGrid }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const barWidth = 100 / data.length;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartHeight = height - padding.top - padding.bottom;
  const chartWidth = 100; // percentage

  return (
    <svg width="100%" height={height} className="overflow-visible">
      {/* Grid lines */}
      {showGrid && (
        <g>
          {[0, 25, 50, 75, 100].map(pct => (
            <line
              key={pct}
              x1={`${padding.left}%`}
              y1={padding.top + chartHeight * (1 - pct / 100)}
              x2="95%"
              y2={padding.top + chartHeight * (1 - pct / 100)}
              stroke="currentColor"
              strokeOpacity={0.1}
            />
          ))}
        </g>
      )}

      {/* Bars */}
      {data.map((point, idx) => {
        const barHeight = (point.value / maxValue) * chartHeight;
        const x = padding.left + (idx / data.length) * (100 - padding.left - padding.right);
        const barWidthPct = (1 / data.length) * (100 - padding.left - padding.right) * 0.6;
        const barX = x + (barWidthPct * 0.3);

        return (
          <g key={point.label} data-testid="chart-bar">
            {/* Bar */}
            <motion.rect
              initial={{ height: 0, y: padding.top + chartHeight }}
              animate={{ height: barHeight, y: padding.top + chartHeight - barHeight }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              x={`${barX}%`}
              width={`${barWidthPct}%`}
              fill={point.color || colors[idx % colors.length]}
              rx={4}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            />

            {/* Value label */}
            {showValues && (
              <text
                x={`${barX + barWidthPct / 2}%`}
                y={padding.top + chartHeight - barHeight - 5}
                textAnchor="middle"
                className="text-micro fill-current text-text-secondary"
              >
                {point.value}
              </text>
            )}

            {/* X-axis label */}
            {showLabels && (
              <text
                x={`${barX + barWidthPct / 2}%`}
                y={height - 10}
                textAnchor="middle"
                className="text-micro fill-current text-text-muted"
              >
                {point.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// Line Chart
// ============================================================

interface LineChartProps {
  data: ChartDataPoint[];
  height: number;
  colors: string[];
  showLabels: boolean;
  showValues: boolean;
  showGrid: boolean;
  filled?: boolean;
}

function LineChart({ data, height, colors, showLabels, showValues, showGrid, filled = false }: LineChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartHeight = height - padding.top - padding.bottom;

  // Build path
  const points = data.map((point, idx) => {
    const x = padding.left + (idx / (data.length - 1 || 1)) * (100 - padding.left - padding.right);
    const y = padding.top + chartHeight * (1 - point.value / maxValue);
    return { x, y, point };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x}% ${p.y}`).join(' ');
  const areaPath = filled
    ? `${linePath} L ${points[points.length - 1]?.x || 0}% ${padding.top + chartHeight} L ${padding.left}% ${padding.top + chartHeight} Z`
    : '';

  return (
    <svg width="100%" height={height} className="overflow-visible">
      {/* Grid lines */}
      {showGrid && (
        <g>
          {[0, 25, 50, 75, 100].map(pct => (
            <line
              key={pct}
              x1={`${padding.left}%`}
              y1={padding.top + chartHeight * (1 - pct / 100)}
              x2="95%"
              y2={padding.top + chartHeight * (1 - pct / 100)}
              stroke="currentColor"
              strokeOpacity={0.1}
            />
          ))}
        </g>
      )}

      {/* Area fill */}
      {filled && (
        <motion.path
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          d={areaPath}
          fill={colors[0]}
        />
      )}

      {/* Line */}
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1 }}
        d={linePath}
        fill="none"
        stroke={colors[0]}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Points and labels */}
      {points.map(({ x, y, point }, idx) => (
        <g key={point.label}>
          {/* Point */}
          <motion.circle
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + idx * 0.1 }}
            cx={`${x}%`}
            cy={y}
            r={4}
            fill={colors[0]}
            className="cursor-pointer"
          />

          {/* Value */}
          {showValues && (
            <text
              x={`${x}%`}
              y={y - 10}
              textAnchor="middle"
              className="text-micro fill-current text-text-secondary"
            >
              {point.value}
            </text>
          )}

          {/* X-axis label */}
          {showLabels && (
            <text
              x={`${x}%`}
              y={height - 10}
              textAnchor="middle"
              className="text-micro fill-current text-text-muted"
            >
              {point.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ============================================================
// Pie/Donut Chart
// ============================================================

interface PieChartProps {
  data: ChartDataPoint[];
  height: number;
  colors: string[];
  showLabels: boolean;
  showValues: boolean;
  donut?: boolean;
}

function PieChart({ data, height, colors, showLabels, showValues, donut = false }: PieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = height / 2 - 20;
  const innerRadius = donut ? radius * 0.6 : 0;
  const cx = 50; // center x (percentage)
  const cy = height / 2; // center y (pixels)

  let currentAngle = -90; // Start from top

  const slices = data.map((point, idx) => {
    const angle = (point.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // Calculate path
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    let path = '';
    if (donut) {
      const ix1 = cx + innerRadius * Math.cos(startRad);
      const iy1 = cy + innerRadius * Math.sin(startRad);
      const ix2 = cx + innerRadius * Math.cos(endRad);
      const iy2 = cy + innerRadius * Math.sin(endRad);

      path = `
        M ${x1}% ${y1}
        A ${radius} ${radius} 0 ${largeArc} 1 ${x2}% ${y2}
        L ${ix2}% ${iy2}
        A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1}% ${iy1}
        Z
      `;
    } else {
      path = `
        M ${cx}% ${cy}
        L ${x1}% ${y1}
        A ${radius} ${radius} 0 ${largeArc} 1 ${x2}% ${y2}
        Z
      `;
    }

    // Label position
    const midAngle = ((startAngle + endAngle) / 2 * Math.PI) / 180;
    const labelRadius = radius * 0.7;
    const labelX = cx + labelRadius * Math.cos(midAngle);
    const labelY = cy + labelRadius * Math.sin(midAngle);

    return { path, point, color: point.color || colors[idx % colors.length], labelX, labelY };
  });

  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`}>
      {slices.map(({ path, point, color, labelX, labelY }, idx) => (
        <g key={point.label} data-testid="chart-slice">
          <motion.path
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            d={path}
            fill={color}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            style={{ transformOrigin: `${cx}% ${cy}px` }}
          />
          {showLabels && (
            <text
              x={`${labelX}%`}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-micro fill-white font-medium"
            >
              {point.label}
            </text>
          )}
        </g>
      ))}

      {/* Center label for donut */}
      {donut && showValues && (
        <text
          x="50%"
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-body font-semibold fill-current"
        >
          {total}
        </text>
      )}
    </svg>
  );
}

// ============================================================
// Main Component
// ============================================================

export function BioChart({
  type,
  data,
  title,
  height = 200,
  showLabels = true,
  showValues = true,
  showGrid = true,
  colors = DEFAULT_COLORS,
  className,
  loading = false,
  emptyMessage = 'No data to display',
}: BioChartProps) {
  // Loading state
  if (loading) {
    return (
      <Surface padding="lg" className={cn('overflow-hidden', className)}>
        <div className="h-48 bg-surface-subtle rounded animate-pulse" />
      </Surface>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <Surface padding="lg" className={cn('overflow-hidden', className)}>
        <div className="flex items-center justify-center" style={{ height }}>
          <Txt variant="body" color="tertiary">
            {emptyMessage}
          </Txt>
        </div>
      </Surface>
    );
  }

  // Render appropriate chart
  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart
            data={data}
            height={height}
            colors={colors}
            showLabels={showLabels}
            showValues={showValues}
            showGrid={showGrid}
          />
        );
      case 'line':
        return (
          <LineChart
            data={data}
            height={height}
            colors={colors}
            showLabels={showLabels}
            showValues={showValues}
            showGrid={showGrid}
          />
        );
      case 'area':
        return (
          <LineChart
            data={data}
            height={height}
            colors={colors}
            showLabels={showLabels}
            showValues={showValues}
            showGrid={showGrid}
            filled
          />
        );
      case 'pie':
        return (
          <PieChart
            data={data}
            height={height}
            colors={colors}
            showLabels={showLabels}
            showValues={showValues}
          />
        );
      case 'donut':
        return (
          <PieChart
            data={data}
            height={height}
            colors={colors}
            showLabels={showLabels}
            showValues={showValues}
            donut
          />
        );
      default:
        return null;
    }
  };

  return (
    <Surface padding="md" className={cn('overflow-hidden', className)} data-testid="bio-chart">
      {title && (
        <Txt variant="label" weight="medium" className="mb-3">
          {title}
        </Txt>
      )}
      {renderChart()}
    </Surface>
  );
}

BioChart.displayName = 'BioChart';
