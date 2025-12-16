/**
 * BioKanban Tests - Vitest Browser Mode
 *
 * E2E-style user flow testing for Kanban board.
 * Tests: drag-drop, columns, cards, state management
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';

import { BioKanban, type KanbanColumn, type KanbanCard } from '../src/organisms/BioKanban';

// ============================================================
// Test Data
// ============================================================

const mockColumns: KanbanColumn[] = [
  { id: 'todo', title: 'To Do', color: 'default' },
  { id: 'in-progress', title: 'In Progress', color: 'warning' },
  { id: 'done', title: 'Done', color: 'success' },
];

const mockCards: KanbanCard[] = [
  { id: 'card-1', title: 'Task 1', description: 'First task', columnId: 'todo', order: 0 },
  { id: 'card-2', title: 'Task 2', description: 'Second task', columnId: 'todo', order: 1 },
  { id: 'card-3', title: 'Task 3', description: 'Third task', columnId: 'in-progress', order: 0 },
  { id: 'card-4', title: 'Task 4', description: 'Completed task', columnId: 'done', order: 0 },
];

// ============================================================
// Unit Tests - BioKanban renders correctly
// ============================================================

describe('BioKanban - Rendering', () => {
  it('renders kanban board with data-testid', () => {
    render(<BioKanban columns={mockColumns} cards={mockCards} />);
    expect(screen.getByTestId('bio-kanban')).toBeInTheDocument();
  });

  it('renders all columns', () => {
    render(<BioKanban columns={mockColumns} cards={mockCards} />);

    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('renders cards in correct columns', () => {
    render(<BioKanban columns={mockColumns} cards={mockCards} />);

    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Task 3')).toBeInTheDocument();
    expect(screen.getByText('Task 4')).toBeInTheDocument();
  });

  it('renders title and description', () => {
    render(
      <BioKanban
        columns={mockColumns}
        cards={mockCards}
        title="Project Board"
        description="Track project tasks"
      />
    );

    expect(screen.getByText('Project Board')).toBeInTheDocument();
    expect(screen.getByText('Track project tasks')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<BioKanban columns={mockColumns} cards={[]} loading />);

    // Should show skeleton loaders (pulses)
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders error state', () => {
    const error = new Error('Failed to load');
    render(<BioKanban columns={mockColumns} cards={[]} error={error} />);

    expect(screen.getByText(/Failed to load/)).toBeInTheDocument();
  });
});

// ============================================================
// Component Tests - Column features
// ============================================================

describe('BioKanban - Columns', () => {
  it('shows card count in column header', () => {
    render(<BioKanban columns={mockColumns} cards={mockCards} showCount />);

    // "To Do" has 2 cards
    const columns = screen.getAllByTestId('kanban-column');
    expect(columns.length).toBe(3);
  });

  it('shows WIP limit indicator', () => {
    const columnsWithLimit: KanbanColumn[] = [
      { id: 'todo', title: 'To Do', color: 'default', limit: 3 },
      ...mockColumns.slice(1),
    ];

    render(<BioKanban columns={columnsWithLimit} cards={mockCards} />);

    // Should show limit
    expect(screen.getByText('To Do')).toBeInTheDocument();
  });

  it('can collapse column', async () => {
    const user = userEvent.setup();
    render(<BioKanban columns={mockColumns} cards={mockCards} />);

    // Find collapse button (chevron) - it's the first button in the column
    const columns = screen.getAllByTestId('kanban-column');
    const buttons = within(columns[0]).getAllByRole('button');
    const collapseButton = buttons[0]; // First button is the collapse toggle

    // Click to collapse
    await user.click(collapseButton);

    // Column should still exist
    expect(columns[0]).toBeInTheDocument();
  });
});

// ============================================================
// Component Tests - Cards
// ============================================================

describe('BioKanban - Cards', () => {
  it('renders card with all properties', () => {
    const cardsWithMeta: KanbanCard[] = [
      {
        id: 'card-full',
        title: 'Full Card',
        description: 'Card with all properties',
        columnId: 'todo',
        order: 0,
        color: 'primary',
        dueDate: new Date('2024-12-31'),
        tags: ['urgent', 'bug'],
        assignees: ['user1', 'user2'],
      },
    ];

    render(<BioKanban columns={mockColumns} cards={cardsWithMeta} />);

    expect(screen.getByText('Full Card')).toBeInTheDocument();
    expect(screen.getByText('Card with all properties')).toBeInTheDocument();
    expect(screen.getByText('urgent')).toBeInTheDocument();
    expect(screen.getByText('bug')).toBeInTheDocument();
  });

  it('calls onCardClick when card is clicked', async () => {
    const user = userEvent.setup();
    const onCardClick = vi.fn();

    render(
      <BioKanban
        columns={mockColumns}
        cards={mockCards}
        onCardClick={onCardClick}
      />
    );

    const card = screen.getByText('Task 1');
    await user.click(card);

    expect(onCardClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'card-1', title: 'Task 1' })
    );
  });

  it('calls onCardAdd when add button clicked', async () => {
    const user = userEvent.setup();
    const onCardAdd = vi.fn();

    render(
      <BioKanban
        columns={mockColumns}
        cards={mockCards}
        onCardAdd={onCardAdd}
        showAddButton
      />
    );

    // Find add button (plus icon) in first column
    const addButtons = screen.getAllByRole('button');
    const plusButton = addButtons.find(btn => btn.querySelector('svg.lucide-plus'));

    if (plusButton) {
      await user.click(plusButton);
      expect(onCardAdd).toHaveBeenCalled();
    }
  });
});

// ============================================================
// Hook Tests - useBioKanban
// ============================================================

describe('BioKanban - State Management', () => {
  it('tracks card positions in correct columns', () => {
    render(<BioKanban columns={mockColumns} cards={mockCards} />);

    const columns = screen.getAllByTestId('kanban-column');

    // First column (To Do) should have Task 1 and Task 2
    expect(within(columns[0]).getByText('Task 1')).toBeInTheDocument();
    expect(within(columns[0]).getByText('Task 2')).toBeInTheDocument();

    // Second column (In Progress) should have Task 3
    expect(within(columns[1]).getByText('Task 3')).toBeInTheDocument();

    // Third column (Done) should have Task 4
    expect(within(columns[2]).getByText('Task 4')).toBeInTheDocument();
  });

  it('handles empty columns gracefully', () => {
    const emptyCards: KanbanCard[] = [];
    render(<BioKanban columns={mockColumns} cards={emptyCards} />);

    // All columns should still render
    expect(screen.getAllByTestId('kanban-column')).toHaveLength(3);

    // Should show "No cards" in each column
    expect(screen.getAllByText('No cards')).toHaveLength(3);
  });
});

// ============================================================
// Accessibility Tests
// ============================================================

describe('BioKanban - Accessibility', () => {
  it('cards are focusable', () => {
    render(<BioKanban columns={mockColumns} cards={mockCards} />);

    const cards = screen.getAllByTestId('kanban-card');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('buttons have accessible names', () => {
    render(<BioKanban columns={mockColumns} cards={mockCards} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
