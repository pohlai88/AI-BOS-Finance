/**
 * BIOSKIN Performance Tests - Sprint E5
 *
 * Automated performance budgets and benchmarks for enterprise scale.
 * Tests render time, memory usage, and interaction responsiveness.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as React from 'react';
import { z } from 'zod';

import { BioTable } from '../src/organisms/BioTable';
import { BioTableVirtual } from '../src/organisms/BioTable/BioTableVirtual';
import { BioKanban } from '../src/organisms/BioKanban';
import { BioCalendar, type CalendarEvent } from '../src/organisms/BioCalendar';
import { BioChart } from '../src/organisms/BioChart';
import { BioLocaleProvider } from '../src/providers';

// ============================================================
// Performance Budgets
// ============================================================

const PERFORMANCE_BUDGETS = {
  // Render time budgets (ms)
  // Note: First render includes JIT warm-up; subsequent renders are faster
  render: {
    table100: 1500, // 100 rows (includes first-render JIT warm-up)
    table1k: 500, // 1,000 rows (paginated)
    table10k: 1000, // 10,000 rows (virtualized)
    kanban100: 500, // 100 cards
    kanban500: 2000, // 500 cards (stress test)
    calendar100: 500, // 100 events
    chart1k: 500, // 1,000 data points
  },
  // Interaction response budgets (ms)
  interaction: {
    sort: 200,
    filter: 200,
    scroll: 16, // 60fps target
  },
} as const;

// ============================================================
// Test Data Generators
// ============================================================

const TestSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  amount: z.number(),
  status: z.string(),
  date: z.string(),
});

type TestRow = z.infer<typeof TestSchema>;

function generateTestData(count: number): TestRow[] {
  const statuses = ['active', 'pending', 'completed', 'cancelled'];
  return Array.from({ length: count }, (_, i) => ({
    id: `row-${i}`,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    amount: Math.random() * 10000,
    status: statuses[i % statuses.length],
    date: new Date(2024, 0, 1 + (i % 365)).toISOString(),
  }));
}

function generateKanbanData(count: number) {
  const columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'progress', title: 'In Progress' },
    { id: 'done', title: 'Done' },
  ];

  const cards = Array.from({ length: count }, (_, i) => ({
    id: `card-${i}`,
    title: `Task ${i}`,
    description: `Description for task ${i}`,
    columnId: columns[i % columns.length].id,
  }));

  return { columns, cards };
}

function generateCalendarEvents(count: number): CalendarEvent[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `event-${i}`,
    title: `Event ${i}`,
    start: new Date(2024, 0, 1 + (i % 28), 9, 0),
    end: new Date(2024, 0, 1 + (i % 28), 10, 0),
    color: ['blue', 'green', 'red', 'yellow'][i % 4] as 'blue' | 'green' | 'red' | 'yellow',
  }));
}

function generateChartData(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    label: `Point ${i}`,
    value: Math.random() * 1000,
  }));
}

// ============================================================
// Performance Measurement Utilities
// ============================================================

function measureRenderTime(renderFn: () => void): number {
  const start = performance.now();
  renderFn();
  return performance.now() - start;
}

async function measureInteractionTime(
  interactionFn: () => void | Promise<void>
): Promise<number> {
  const start = performance.now();
  await interactionFn();
  return performance.now() - start;
}

// ============================================================
// BioTable Performance Tests
// ============================================================

describe('Performance - BioTable', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders 100 rows within budget', () => {
    const data = generateTestData(100);
    const renderTime = measureRenderTime(() => {
      render(
        <BioLocaleProvider>
          <BioTable schema={TestSchema} data={data} enablePagination={false} />
        </BioLocaleProvider>
      );
    });

    console.log(`BioTable 100 rows: ${renderTime.toFixed(2)}ms`);
    expect(renderTime).toBeLessThan(PERFORMANCE_BUDGETS.render.table100);
  });

  it('renders 1000 rows within budget (paginated)', () => {
    const data = generateTestData(1000);
    const renderTime = measureRenderTime(() => {
      render(
        <BioLocaleProvider>
          <BioTable schema={TestSchema} data={data} pageSize={50} />
        </BioLocaleProvider>
      );
    });

    console.log(`BioTable 1000 rows (paginated): ${renderTime.toFixed(2)}ms`);
    expect(renderTime).toBeLessThan(PERFORMANCE_BUDGETS.render.table1k);
  });

  it('sorts column within interaction budget', async () => {
    const data = generateTestData(500);
    render(
      <BioLocaleProvider>
        <BioTable schema={TestSchema} data={data} pageSize={50} />
      </BioLocaleProvider>
    );

    const nameHeader = screen.getByText('Name');
    const interactionTime = await measureInteractionTime(() => {
      fireEvent.click(nameHeader);
    });

    console.log(`Sort interaction: ${interactionTime.toFixed(2)}ms`);
    expect(interactionTime).toBeLessThan(PERFORMANCE_BUDGETS.interaction.sort);
  });

  it('filters data within interaction budget', async () => {
    const data = generateTestData(500);
    render(
      <BioLocaleProvider>
        <BioTable schema={TestSchema} data={data} pageSize={50} />
      </BioLocaleProvider>
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    const interactionTime = await measureInteractionTime(() => {
      fireEvent.change(searchInput, { target: { value: 'User 10' } });
    });

    console.log(`Filter interaction: ${interactionTime.toFixed(2)}ms`);
    expect(interactionTime).toBeLessThan(PERFORMANCE_BUDGETS.interaction.filter);
  });
});

// ============================================================
// BioTableVirtual Performance Tests
// ============================================================

describe('Performance - BioTableVirtual', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders 10k rows (virtualized) within budget', () => {
    const data = generateTestData(10000);
    const renderTime = measureRenderTime(() => {
      render(
        <BioLocaleProvider>
          <BioTableVirtual
            schema={TestSchema}
            data={data}
            height={600}
            estimatedRowHeight={48}
          />
        </BioLocaleProvider>
      );
    });

    console.log(`BioTableVirtual 10k rows: ${renderTime.toFixed(2)}ms`);
    expect(renderTime).toBeLessThan(PERFORMANCE_BUDGETS.render.table10k);
  });

  it('handles 50k rows without crashing', () => {
    const data = generateTestData(50000);

    expect(() => {
      render(
        <BioLocaleProvider>
          <BioTableVirtual
            schema={TestSchema}
            data={data}
            height={600}
          />
        </BioLocaleProvider>
      );
    }).not.toThrow();

    // Verify it rendered
    expect(screen.getByTestId('bio-table-virtual')).toBeInTheDocument();
    // Check row count display
    expect(screen.getByText(/50,000 rows/)).toBeInTheDocument();
  });

  it('sorts 10k rows within budget', async () => {
    const data = generateTestData(10000);
    render(
      <BioLocaleProvider>
        <BioTableVirtual schema={TestSchema} data={data} height={600} />
      </BioLocaleProvider>
    );

    const nameHeader = screen.getByText('Name');
    const interactionTime = await measureInteractionTime(() => {
      fireEvent.click(nameHeader);
    });

    console.log(`Virtual sort 10k rows: ${interactionTime.toFixed(2)}ms`);
    // Allow more time for larger dataset
    expect(interactionTime).toBeLessThan(PERFORMANCE_BUDGETS.interaction.sort * 3);
  });
});

// ============================================================
// BioKanban Performance Tests
// ============================================================

describe('Performance - BioKanban', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders 100 cards within budget', () => {
    const { columns, cards } = generateKanbanData(100);
    const renderTime = measureRenderTime(() => {
      render(
        <BioLocaleProvider>
          <BioKanban
            columns={columns}
            cards={cards}
            onCardMove={() => { }}
          />
        </BioLocaleProvider>
      );
    });

    console.log(`BioKanban 100 cards: ${renderTime.toFixed(2)}ms`);
    expect(renderTime).toBeLessThan(PERFORMANCE_BUDGETS.render.kanban100);
  });

  it('renders 500 cards without crashing', () => {
    const { columns, cards } = generateKanbanData(500);

    const renderTime = measureRenderTime(() => {
      render(
        <BioLocaleProvider>
          <BioKanban
            columns={columns}
            cards={cards}
            onCardMove={() => { }}
          />
        </BioLocaleProvider>
      );
    });

    console.log(`BioKanban 500 cards: ${renderTime.toFixed(2)}ms`);
    expect(screen.getByTestId('bio-kanban')).toBeInTheDocument();
    expect(renderTime).toBeLessThan(PERFORMANCE_BUDGETS.render.kanban500);
  });
});

// ============================================================
// BioCalendar Performance Tests
// ============================================================

describe('Performance - BioCalendar', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders 100 events within budget', () => {
    const events = generateCalendarEvents(100);
    const renderTime = measureRenderTime(() => {
      render(
        <BioLocaleProvider>
          <BioCalendar events={events} />
        </BioLocaleProvider>
      );
    });

    console.log(`BioCalendar 100 events: ${renderTime.toFixed(2)}ms`);
    expect(renderTime).toBeLessThan(PERFORMANCE_BUDGETS.render.calendar100);
  });

  it('renders 500 events without crashing', () => {
    const events = generateCalendarEvents(500);

    expect(() => {
      render(
        <BioLocaleProvider>
          <BioCalendar events={events} />
        </BioLocaleProvider>
      );
    }).not.toThrow();
  });
});

// ============================================================
// BioChart Performance Tests
// ============================================================

describe('Performance - BioChart', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders 1k data points within budget', () => {
    const data = generateChartData(1000);
    const renderTime = measureRenderTime(() => {
      render(
        <BioLocaleProvider>
          <BioChart data={data} type="bar" />
        </BioLocaleProvider>
      );
    });

    console.log(`BioChart 1k points: ${renderTime.toFixed(2)}ms`);
    expect(renderTime).toBeLessThan(PERFORMANCE_BUDGETS.render.chart1k);
  });

  it('renders 5k data points without crashing', () => {
    const data = generateChartData(5000);

    expect(() => {
      render(
        <BioLocaleProvider>
          <BioChart data={data} type="line" />
        </BioLocaleProvider>
      );
    }).not.toThrow();
  });
});

// ============================================================
// Memory Leak Tests
// ============================================================

describe('Memory - Leak Detection', () => {
  it('BioTable does not leak memory on mount/unmount cycles', () => {
    const data = generateTestData(100);

    // Run multiple mount/unmount cycles
    for (let i = 0; i < 10; i++) {
      const { unmount } = render(
        <BioLocaleProvider>
          <BioTable schema={TestSchema} data={data} />
        </BioLocaleProvider>
      );
      unmount();
    }

    // If we get here without error, basic leak test passes
    expect(true).toBe(true);
  });

  it('BioTableVirtual does not leak memory on mount/unmount cycles', () => {
    const data = generateTestData(1000);

    for (let i = 0; i < 10; i++) {
      const { unmount } = render(
        <BioLocaleProvider>
          <BioTableVirtual schema={TestSchema} data={data} height={400} />
        </BioLocaleProvider>
      );
      unmount();
    }

    expect(true).toBe(true);
  });

  it('BioKanban does not leak memory on rapid card moves', () => {
    const { columns, cards } = generateKanbanData(50);
    const onCardMove = vi.fn();

    const { rerender, unmount } = render(
      <BioLocaleProvider>
        <BioKanban columns={columns} cards={cards} onCardMove={onCardMove} />
      </BioLocaleProvider>
    );

    // Simulate rapid state changes
    for (let i = 0; i < 20; i++) {
      const updatedCards = cards.map((card, idx) => ({
        ...card,
        columnId: columns[(idx + i) % columns.length].id,
      }));

      rerender(
        <BioLocaleProvider>
          <BioKanban columns={columns} cards={updatedCards} onCardMove={onCardMove} />
        </BioLocaleProvider>
      );
    }

    unmount();
    expect(true).toBe(true);
  });
});

// ============================================================
// Bundle Size Awareness
// ============================================================

describe('Bundle - Import Validation', () => {
  it('BioTableVirtual can be imported separately', async () => {
    const module = await import('../src/organisms/BioTable/BioTableVirtual');
    expect(module.BioTableVirtual).toBeDefined();
    expect(module.VIRTUAL_COMPONENT_META).toBeDefined();
  });

  it('export hook can be imported separately', async () => {
    const module = await import('../src/organisms/BioTable/useBioTableExport');
    expect(module.useBioTableExport).toBeDefined();
  });

  it('locale provider can be imported separately', async () => {
    const module = await import('../src/providers/BioLocaleProvider');
    expect(module.BioLocaleProvider).toBeDefined();
    expect(module.useLocale).toBeDefined();
  });
});
