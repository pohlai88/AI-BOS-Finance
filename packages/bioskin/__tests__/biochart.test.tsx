/**
 * BioChart Tests - Vitest Browser Mode
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as React from 'react';

import { BioChart, type ChartDataPoint } from '../src/organisms/BioChart';

// ============================================================
// Test Data
// ============================================================

const mockData: ChartDataPoint[] = [
  { label: 'Jan', value: 100 },
  { label: 'Feb', value: 150 },
  { label: 'Mar', value: 120 },
  { label: 'Apr', value: 200 },
  { label: 'May', value: 180 },
];

// ============================================================
// Tests
// ============================================================

describe('BioChart - Rendering', () => {
  it('renders chart with data-testid', () => {
    render(<BioChart type="bar" data={mockData} />);
    expect(screen.getByTestId('bio-chart')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<BioChart type="bar" data={mockData} title="Sales Report" />);
    expect(screen.getByText('Sales Report')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<BioChart type="bar" data={[]} loading />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state', () => {
    render(<BioChart type="bar" data={[]} emptyMessage="No data available" />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });
});

describe('BioChart - Bar Chart', () => {
  it('renders bar chart', () => {
    render(<BioChart type="bar" data={mockData} />);
    const bars = screen.getAllByTestId('chart-bar');
    expect(bars.length).toBe(mockData.length);
  });

  it('shows values when enabled', () => {
    render(<BioChart type="bar" data={mockData} showValues />);
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('shows labels when enabled', () => {
    render(<BioChart type="bar" data={mockData} showLabels />);
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('May')).toBeInTheDocument();
  });
});

describe('BioChart - Line Chart', () => {
  it('renders line chart', () => {
    render(<BioChart type="line" data={mockData} />);
    expect(screen.getByTestId('bio-chart')).toBeInTheDocument();
  });

  it('renders area chart', () => {
    render(<BioChart type="area" data={mockData} />);
    expect(screen.getByTestId('bio-chart')).toBeInTheDocument();
  });
});

describe('BioChart - Pie/Donut Chart', () => {
  it('renders pie chart', () => {
    render(<BioChart type="pie" data={mockData} />);
    const slices = screen.getAllByTestId('chart-slice');
    expect(slices.length).toBe(mockData.length);
  });

  it('renders donut chart', () => {
    render(<BioChart type="donut" data={mockData} />);
    const slices = screen.getAllByTestId('chart-slice');
    expect(slices.length).toBe(mockData.length);
  });

  it('shows total in donut center when enabled', () => {
    const total = mockData.reduce((sum, d) => sum + d.value, 0);
    render(<BioChart type="donut" data={mockData} showValues />);
    expect(screen.getByText(total.toString())).toBeInTheDocument();
  });
});

describe('BioChart - Customization', () => {
  it('accepts custom height', () => {
    render(<BioChart type="bar" data={mockData} height={300} />);
    expect(screen.getByTestId('bio-chart')).toBeInTheDocument();
  });

  it('accepts custom colors', () => {
    const customColors = ['#FF0000', '#00FF00', '#0000FF'];
    render(<BioChart type="bar" data={mockData} colors={customColors} />);
    expect(screen.getByTestId('bio-chart')).toBeInTheDocument();
  });
});
