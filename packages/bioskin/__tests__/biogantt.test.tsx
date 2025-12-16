/**
 * BioGantt Tests - Vitest Browser Mode
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';

import { BioGantt, type GanttTask } from '../src/organisms/BioGantt';

// ============================================================
// Test Data
// ============================================================

const today = new Date();
const mockTasks: GanttTask[] = [
  {
    id: '1',
    name: 'Design Phase',
    start: today,
    end: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
    progress: 75,
    status: 'in_progress',
  },
  {
    id: '2',
    name: 'Development',
    start: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), // +5 days
    end: new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000), // +20 days
    progress: 30,
    status: 'in_progress',
  },
  {
    id: '3',
    name: 'Testing',
    start: new Date(today.getTime() + 18 * 24 * 60 * 60 * 1000), // +18 days
    end: new Date(today.getTime() + 25 * 24 * 60 * 60 * 1000), // +25 days
    progress: 0,
    status: 'pending',
  },
];

// ============================================================
// Tests
// ============================================================

describe('BioGantt - Rendering', () => {
  it('renders gantt with data-testid', () => {
    render(<BioGantt tasks={mockTasks} />);
    expect(screen.getByTestId('bio-gantt')).toBeInTheDocument();
  });

  it('renders all tasks', () => {
    render(<BioGantt tasks={mockTasks} />);
    // Tasks appear in both list and bars, so use getAllByText
    expect(screen.getAllByText('Design Phase').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Development').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Testing').length).toBeGreaterThan(0);
  });

  it('renders task bars', () => {
    render(<BioGantt tasks={mockTasks} />);
    const taskBars = screen.getAllByTestId('gantt-task');
    expect(taskBars.length).toBe(3);
  });

  it('renders task list when enabled', () => {
    render(<BioGantt tasks={mockTasks} showTaskList />);
    // Task header should be visible
    expect(screen.getByText('Task')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<BioGantt tasks={[]} loading />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state', () => {
    render(<BioGantt tasks={[]} />);
    expect(screen.getByText('No tasks to display')).toBeInTheDocument();
  });
});

describe('BioGantt - Interactions', () => {
  it('calls onTaskClick when task is clicked', async () => {
    const user = userEvent.setup();
    const onTaskClick = vi.fn();
    render(<BioGantt tasks={mockTasks} onTaskClick={onTaskClick} showTaskList />);

    // Click on first occurrence (task list)
    const elements = screen.getAllByText('Design Phase');
    await user.click(elements[0]);
    expect(onTaskClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1', name: 'Design Phase' })
    );
  });
});

describe('BioGantt - Controls', () => {
  it('renders zoom controls', () => {
    render(<BioGantt tasks={mockTasks} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
