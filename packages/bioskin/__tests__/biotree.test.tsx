/**
 * BioTree Tests - Vitest Browser Mode
 *
 * E2E-style user flow testing for hierarchical tree.
 * Tests: expand/collapse, selection, search, keyboard navigation
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';

import { BioTree, type TreeNode } from '../src/organisms/BioTree';

// ============================================================
// Test Data
// ============================================================

const mockNodes: TreeNode[] = [
  {
    id: 'root',
    label: 'Root',
    children: [
      {
        id: 'assets',
        label: 'Assets',
        children: [
          { id: 'cash', label: 'Cash' },
          { id: 'bank', label: 'Bank Accounts' },
          { id: 'inventory', label: 'Inventory' },
        ],
      },
      {
        id: 'liabilities',
        label: 'Liabilities',
        children: [
          { id: 'ap', label: 'Accounts Payable' },
          { id: 'loans', label: 'Loans' },
        ],
      },
      {
        id: 'equity',
        label: 'Equity',
        children: [
          { id: 'capital', label: 'Capital' },
          { id: 'retained', label: 'Retained Earnings' },
        ],
      },
    ],
  },
];

const flatMockNodes: TreeNode[] = [
  { id: 'item-1', label: 'Item 1' },
  { id: 'item-2', label: 'Item 2' },
  { id: 'item-3', label: 'Item 3' },
];

// ============================================================
// Unit Tests - BioTree renders correctly
// ============================================================

describe('BioTree - Rendering', () => {
  it('renders tree with data-testid', () => {
    render(<BioTree nodes={mockNodes} />);
    expect(screen.getByTestId('bio-tree')).toBeInTheDocument();
  });

  it('renders root level nodes', () => {
    render(<BioTree nodes={mockNodes} />);
    expect(screen.getByText('Root')).toBeInTheDocument();
  });

  it('renders flat nodes', () => {
    render(<BioTree nodes={flatMockNodes} />);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<BioTree nodes={mockNodes} title="Chart of Accounts" />);
    expect(screen.getByText('Chart of Accounts')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<BioTree nodes={[]} loading />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders error state', () => {
    const error = new Error('Failed to load tree');
    render(<BioTree nodes={[]} error={error} />);
    expect(screen.getByText(/Failed to load tree/)).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<BioTree nodes={[]} />);
    expect(screen.getByText('No items')).toBeInTheDocument();
  });
});

// ============================================================
// Expand/Collapse Tests
// ============================================================

describe('BioTree - Expand/Collapse', () => {
  it('expands node when clicking toggle', async () => {
    const user = userEvent.setup();
    render(<BioTree nodes={mockNodes} />);

    // Initially children should not be visible
    expect(screen.queryByText('Assets')).not.toBeInTheDocument();

    // Click to expand root
    const rootNode = screen.getByText('Root').closest('[data-testid="tree-node"]');
    const toggleButton = within(rootNode!).getAllByRole('button')[0];
    await user.click(toggleButton);

    // Children should now be visible
    expect(screen.getByText('Assets')).toBeInTheDocument();
    expect(screen.getByText('Liabilities')).toBeInTheDocument();
    expect(screen.getByText('Equity')).toBeInTheDocument();
  });

  it('collapses expanded node', async () => {
    const user = userEvent.setup();
    render(<BioTree nodes={mockNodes} defaultExpanded={['root']} />);

    // Children should be visible initially
    expect(screen.getByText('Assets')).toBeInTheDocument();

    // Click to collapse
    const rootNode = screen.getByText('Root').closest('[data-testid="tree-node"]');
    const toggleButton = within(rootNode!).getAllByRole('button')[0];
    await user.click(toggleButton);

    // Children should be hidden (wait for animation)
    await waitFor(() => {
      expect(screen.queryByText('Assets')).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('supports defaultExpanded prop', () => {
    render(<BioTree nodes={mockNodes} defaultExpanded={['root', 'assets']} />);

    // Root children should be visible
    expect(screen.getByText('Assets')).toBeInTheDocument();
    // Assets children should be visible
    expect(screen.getByText('Cash')).toBeInTheDocument();
    expect(screen.getByText('Bank Accounts')).toBeInTheDocument();
  });

  it('expand all button works', async () => {
    const user = userEvent.setup();
    render(<BioTree nodes={mockNodes} showControls />);

    // Click Expand All
    await user.click(screen.getByText('Expand All'));

    // All nodes should be visible
    expect(screen.getByText('Assets')).toBeInTheDocument();
    expect(screen.getByText('Cash')).toBeInTheDocument();
    expect(screen.getByText('Liabilities')).toBeInTheDocument();
    expect(screen.getByText('Accounts Payable')).toBeInTheDocument();
  });

  it('collapse all button works', async () => {
    const user = userEvent.setup();
    render(<BioTree nodes={mockNodes} defaultExpanded={['root', 'assets']} showControls />);

    // Children should be visible
    expect(screen.getByText('Cash')).toBeInTheDocument();

    // Click Collapse
    await user.click(screen.getByText('Collapse'));

    // Only root should be visible (wait for animation)
    await waitFor(() => {
      expect(screen.getByText('Root')).toBeInTheDocument();
      expect(screen.queryByText('Assets')).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });
});

// ============================================================
// Selection Tests
// ============================================================

describe('BioTree - Selection', () => {
  it('selects node on click', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<BioTree nodes={flatMockNodes} onSelect={onSelect} />);

    await user.click(screen.getByText('Item 1'));

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'item-1', label: 'Item 1' })
    );
  });

  it('supports defaultSelected prop', () => {
    render(<BioTree nodes={flatMockNodes} defaultSelected={['item-2']} />);

    // Item 2 should have selected styling (checking via aria-selected)
    const item2 = screen.getByText('Item 2').closest('[data-testid="tree-node"]');
    expect(item2).toHaveAttribute('aria-selected', 'true');
  });

  it('supports multi-select', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<BioTree nodes={flatMockNodes} onSelect={onSelect} multiSelect />);

    await user.click(screen.getByText('Item 1'));
    await user.click(screen.getByText('Item 2'));

    // Both items should be selected
    expect(onSelect).toHaveBeenCalledTimes(2);
  });
});

// ============================================================
// Search Tests
// ============================================================

describe('BioTree - Search', () => {
  it('filters nodes by search query', async () => {
    const user = userEvent.setup();
    render(<BioTree nodes={flatMockNodes} showSearch />);

    const searchInput = screen.getByPlaceholderText('Search...');
    await user.type(searchInput, 'Item 1');

    // Only Item 1 should be visible (wait for filter)
    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.queryByText('Item 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Item 3')).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('shows no matching items message', async () => {
    const user = userEvent.setup();
    render(<BioTree nodes={flatMockNodes} showSearch />);

    const searchInput = screen.getByPlaceholderText('Search...');
    await user.type(searchInput, 'nonexistent');

    expect(screen.getByText('No matching items')).toBeInTheDocument();
  });

  it('clears filter when search is cleared', async () => {
    const user = userEvent.setup();
    render(<BioTree nodes={flatMockNodes} showSearch />);

    const searchInput = screen.getByPlaceholderText('Search...');
    await user.type(searchInput, 'Item 1');
    await user.clear(searchInput);

    // All items should be visible
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });
});

// ============================================================
// Callback Tests
// ============================================================

describe('BioTree - Callbacks', () => {
  it('calls onToggle when node is expanded/collapsed', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<BioTree nodes={mockNodes} onToggle={onToggle} />);

    const rootNode = screen.getByText('Root').closest('[data-testid="tree-node"]');
    const toggleButton = within(rootNode!).getAllByRole('button')[0];

    // Expand
    await user.click(toggleButton);
    expect(onToggle).toHaveBeenCalledWith('root', true);

    // Collapse
    await user.click(toggleButton);
    expect(onToggle).toHaveBeenCalledWith('root', false);
  });

  it('calls onDoubleClick when node is double-clicked', async () => {
    const user = userEvent.setup();
    const onDoubleClick = vi.fn();
    render(<BioTree nodes={flatMockNodes} onDoubleClick={onDoubleClick} />);

    await user.dblClick(screen.getByText('Item 1'));

    expect(onDoubleClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'item-1' })
    );
  });
});

// ============================================================
// Accessibility Tests
// ============================================================

describe('BioTree - Accessibility', () => {
  it('has tree role', () => {
    render(<BioTree nodes={flatMockNodes} />);
    expect(screen.getByRole('tree')).toBeInTheDocument();
  });

  it('nodes have treeitem role', () => {
    render(<BioTree nodes={flatMockNodes} />);
    const items = screen.getAllByRole('treeitem');
    expect(items.length).toBe(3);
  });

  it('has aria-expanded on expandable nodes', () => {
    render(<BioTree nodes={mockNodes} />);
    const rootNode = screen.getByText('Root').closest('[data-testid="tree-node"]');
    expect(rootNode).toHaveAttribute('aria-expanded', 'false');
  });
});
