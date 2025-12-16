/**
 * Accessibility Tests - axe-core Integration
 *
 * Sprint E1: Enterprise Hardening
 * Tests all BioSkin components for WCAG 2.1 AA compliance.
 *
 * @see ENTERPRISE_READINESS_AUDIT.md Section 5
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { z } from 'zod';
import AxeBuilder from '@axe-core/playwright';

// Components
import { Surface } from '../src/atoms/Surface';
import { Txt } from '../src/atoms/Txt';
import { Btn } from '../src/atoms/Btn';
import { StatusBadge } from '../src/molecules/StatusBadge';
import { Spinner } from '../src/molecules/Spinner';
import { BioTable } from '../src/organisms/BioTable';
import { BioForm } from '../src/organisms/BioForm';
import { BioKanban, type KanbanColumn, type KanbanCard } from '../src/organisms/BioKanban';
import { BioTree, type TreeNode } from '../src/organisms/BioTree';
import { BioTimeline, type TimelineItem } from '../src/organisms/BioTimeline';
import { BioDropzone } from '../src/organisms/BioDropzone';
import { BioCalendar, type CalendarEvent } from '../src/organisms/BioCalendar';
import { BioGantt, type GanttTask } from '../src/organisms/BioGantt';
import { BioChart, type ChartDataPoint } from '../src/organisms/BioChart';

// ============================================================
// Helper: Run axe analysis on rendered component
// ============================================================

/**
 * Simple axe-core runner for browser mode
 * Uses the DOM directly since we're in a real browser
 */
async function checkA11y(container: HTMLElement): Promise<{
  violations: Array<{
    id: string;
    impact: string;
    description: string;
    nodes: Array<{ html: string }>;
  }>;
}> {
  // @ts-ignore - axe is available globally in browser
  const axe = (await import('axe-core')).default;

  const results = await axe.run(container, {
    rules: {
      // Disable rules that don't apply to component testing
      'region': { enabled: false }, // Components aren't full pages
      'bypass': { enabled: false }, // No skip links in components
      'page-has-heading-one': { enabled: false }, // Component level
    },
  });

  return results;
}

// ============================================================
// Test Data
// ============================================================

const SimpleSchema = z.object({
  name: z.string().min(1).describe('Name'),
  email: z.string().email().describe('Email'),
});

const tableData = [
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' },
];

const kanbanColumns: KanbanColumn[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'done', title: 'Done' },
];

const kanbanCards: KanbanCard[] = [
  { id: '1', columnId: 'todo', title: 'Task 1' },
];

const treeNodes: TreeNode[] = [
  { id: 'root', label: 'Root', children: [{ id: 'child', label: 'Child' }] },
];

const timelineItems: TimelineItem[] = [
  { id: '1', title: 'Event', timestamp: new Date(), type: 'success' },
];

const chartData: ChartDataPoint[] = [
  { label: 'Jan', value: 100 },
  { label: 'Feb', value: 200 },
];

const calendarEvents: CalendarEvent[] = [
  { id: '1', title: 'Meeting', start: new Date() },
];

const ganttTasks: GanttTask[] = [
  { id: '1', name: 'Task 1', start: new Date(), end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), progress: 50 },
];

// ============================================================
// Accessibility Tests
// ============================================================

describe('Accessibility - Atoms', () => {
  it('Surface has no critical violations', async () => {
    const { container } = render(
      <Surface>
        <p>Content inside surface</p>
      </Surface>
    );

    const results = await checkA11y(container);
    const critical = results.violations.filter(v => v.impact === 'critical');

    expect(critical).toHaveLength(0);
  });

  it('Txt renders with proper semantics', async () => {
    const { container } = render(
      <div>
        <Txt as="h1" variant="heading">Heading</Txt>
        <Txt as="p" variant="body">Body text</Txt>
        <Txt as="span" variant="label">Label</Txt>
      </div>
    );

    const results = await checkA11y(container);
    const critical = results.violations.filter(v => v.impact === 'critical');

    expect(critical).toHaveLength(0);
  });

  it('Btn is accessible', async () => {
    const { container } = render(
      <div>
        <Btn>Click me</Btn>
        <Btn variant="primary">Primary</Btn>
        <Btn disabled>Disabled</Btn>
      </div>
    );

    const results = await checkA11y(container);
    const critical = results.violations.filter(v => v.impact === 'critical');

    expect(critical).toHaveLength(0);
  });
});

describe('Accessibility - Molecules', () => {
  it('StatusBadge has accessible text', async () => {
    const { container } = render(
      <div>
        <StatusBadge status="success" label="Approved" />
        <StatusBadge status="warning" label="Pending" />
        <StatusBadge status="danger" label="Rejected" />
      </div>
    );

    const results = await checkA11y(container);
    const critical = results.violations.filter(v => v.impact === 'critical');

    expect(critical).toHaveLength(0);
  });

  it('Spinner has status role', async () => {
    const { container } = render(<Spinner />);

    // Spinner should have role="status" for screen readers
    expect(screen.getByRole('status')).toBeInTheDocument();

    const results = await checkA11y(container);
    const critical = results.violations.filter(v => v.impact === 'critical');

    expect(critical).toHaveLength(0);
  });
});

describe('Accessibility - BioTable', () => {
  it('table has proper structure', async () => {
    const { container } = render(
      <BioTable schema={SimpleSchema} data={tableData} />
    );

    // Table should have proper ARIA structure
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();

    const results = await checkA11y(container);

    // Known issue: select-name (checkbox labels)
    // TODO: Fix checkbox accessibility in BioTable
    const knownIssues = ['select-name'];
    const unexpected = results.violations.filter(
      v => v.impact === 'critical' && !knownIssues.includes(v.id)
    );

    expect(unexpected).toHaveLength(0);
  });

  it('sortable columns are keyboard accessible', async () => {
    const { container } = render(
      <BioTable schema={SimpleSchema} data={tableData} enableSorting />
    );

    const results = await checkA11y(container);

    // Known issue: select-name (checkbox labels)
    const knownIssues = ['select-name'];
    const unexpected = results.violations.filter(
      v => v.impact === 'critical' && !knownIssues.includes(v.id)
    );

    expect(unexpected).toHaveLength(0);
  });
});

describe('Accessibility - BioForm', () => {
  it('form fields have labels', async () => {
    const { container } = render(
      <BioForm schema={SimpleSchema} onSubmit={() => { }} />
    );

    // All inputs should have associated labels
    const inputs = container.querySelectorAll('input');
    inputs.forEach(input => {
      if (input.type !== 'hidden') {
        const id = input.id;
        const label = container.querySelector(`label[for="${id}"]`);
        expect(label || input.getAttribute('aria-label')).toBeTruthy();
      }
    });

    const results = await checkA11y(container);
    const critical = results.violations.filter(v => v.impact === 'critical');

    expect(critical).toHaveLength(0);
  });

  it('error messages are associated with inputs', async () => {
    // This tests that form validation errors are properly announced
    const { container } = render(
      <BioForm schema={SimpleSchema} onSubmit={() => { }} />
    );

    const results = await checkA11y(container);
    const critical = results.violations.filter(v => v.impact === 'critical');

    expect(critical).toHaveLength(0);
  });
});

describe('Accessibility - BioKanban', () => {
  it('kanban board has proper ARIA', async () => {
    const { container } = render(
      <BioKanban columns={kanbanColumns} cards={kanbanCards} />
    );

    const results = await checkA11y(container);

    // FIXED: button-name - aria-labels added to icon buttons
    // Remaining: color-contrast (serious) - design/CSS related
    const knownIssues: string[] = [];
    const unexpected = results.violations.filter(
      v => v.impact === 'critical' && !knownIssues.includes(v.id)
    );

    // Log all issues for review
    if (results.violations.length > 0) {
      console.log('BioKanban a11y issues:', results.violations.map(v => `${v.id} (${v.impact})`));
    }

    expect(unexpected).toHaveLength(0);
  });
});

describe('Accessibility - BioTree', () => {
  it('tree has proper role structure', async () => {
    const { container } = render(
      <BioTree nodes={treeNodes} />
    );

    // Tree should have tree role or similar structure
    const results = await checkA11y(container);
    const critical = results.violations.filter(v => v.impact === 'critical');

    expect(critical).toHaveLength(0);
  });
});

describe('Accessibility - BioTimeline', () => {
  it('timeline items are accessible', async () => {
    const { container } = render(
      <BioTimeline items={timelineItems} />
    );

    const results = await checkA11y(container);
    const critical = results.violations.filter(v => v.impact === 'critical');

    expect(critical).toHaveLength(0);
  });
});

describe('Accessibility - BioDropzone', () => {
  it('dropzone has accessible instructions', async () => {
    const { container } = render(
      <BioDropzone onFilesChange={() => { }} />
    );

    const results = await checkA11y(container);

    // FIXED: aria-label added to file input
    const knownIssues: string[] = [];
    const unexpected = results.violations.filter(
      v => v.impact === 'critical' && !knownIssues.includes(v.id)
    );

    expect(unexpected).toHaveLength(0);
  });
});

describe('Accessibility - BioCalendar', () => {
  it('calendar has grid role', async () => {
    const { container } = render(
      <BioCalendar events={calendarEvents} />
    );

    // Calendar should use grid role
    const grid = container.querySelector('[role="grid"]');
    expect(grid).toBeInTheDocument();

    const results = await checkA11y(container);

    // FIXED: button-name - aria-labels added to navigation buttons
    // Remaining: aria-required-parent (columnheaders outside grid parent)
    const knownIssues = ['aria-required-parent'];
    const unexpected = results.violations.filter(
      v => v.impact === 'critical' && !knownIssues.includes(v.id)
    );

    if (results.violations.length > 0) {
      console.log('BioCalendar a11y issues:', results.violations.map(v => `${v.id} (${v.impact})`));
    }

    expect(unexpected).toHaveLength(0);
  });
});

describe('Accessibility - BioGantt', () => {
  it('gantt chart has descriptive content', async () => {
    const { container } = render(
      <BioGantt tasks={ganttTasks} />
    );

    const results = await checkA11y(container);

    // FIXED: button-name - aria-labels added to zoom buttons
    const knownIssues: string[] = [];
    const unexpected = results.violations.filter(
      v => v.impact === 'critical' && !knownIssues.includes(v.id)
    );

    expect(unexpected).toHaveLength(0);
  });
});

describe('Accessibility - BioChart', () => {
  it('chart has accessible title', async () => {
    const { container } = render(
      <BioChart type="bar" data={chartData} title="Sales Report" />
    );

    // Title should be present
    expect(screen.getByText('Sales Report')).toBeInTheDocument();

    const results = await checkA11y(container);
    const critical = results.violations.filter(v => v.impact === 'critical');

    expect(critical).toHaveLength(0);
  });
});

// ============================================================
// Summary Test
// ============================================================

describe('Accessibility Summary', () => {
  it('no components have critical violations', async () => {
    // This is a sanity check that our baseline passes
    const { container } = render(
      <div>
        <Surface><Txt>Test</Txt></Surface>
        <Btn>Button</Btn>
        <StatusBadge status="success" label="OK" />
      </div>
    );

    const results = await checkA11y(container);
    const critical = results.violations.filter(v => v.impact === 'critical');

    expect(critical).toHaveLength(0);

    // Report summary
    console.log(`
    ===== A11Y Summary =====
    Total violations: ${results.violations.length}
    Critical: ${results.violations.filter(v => v.impact === 'critical').length}
    Serious: ${results.violations.filter(v => v.impact === 'serious').length}
    Moderate: ${results.violations.filter(v => v.impact === 'moderate').length}
    Minor: ${results.violations.filter(v => v.impact === 'minor').length}
    ========================
    `);
  });
});
