/**
 * Keyboard Navigation Tests - Sprint E8
 *
 * Full keyboard accessibility for Calendar, Gantt, Chart, and other components.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import * as React from 'react';

import {
  useKeyboardNavigation,
  useRovingTabIndex,
} from '../src/hooks/useKeyboardNavigation';
import { BioLocaleProvider } from '../src/providers/BioLocaleProvider';
import { BioCalendar, type CalendarEvent } from '../src/organisms/BioCalendar';
import { BioGantt, type GanttTask } from '../src/organisms/BioGantt';
import { BioTree, type TreeNode } from '../src/organisms/BioTree';
import { BioKanban, type KanbanCard, type KanbanColumn } from '../src/organisms/BioKanban';

// ============================================================
// Test Data
// ============================================================

const testEvents: CalendarEvent[] = [
  { id: '1', title: 'Event 1', start: new Date('2024-01-15T10:00'), end: new Date('2024-01-15T11:00') },
  { id: '2', title: 'Event 2', start: new Date('2024-01-16T14:00'), end: new Date('2024-01-16T15:00') },
];

const testTasks: GanttTask[] = [
  { id: '1', name: 'Task 1', start: new Date('2024-01-01'), end: new Date('2024-01-15'), progress: 50 },
  { id: '2', name: 'Task 2', start: new Date('2024-01-16'), end: new Date('2024-01-31'), progress: 25 },
];

const testTreeNodes: TreeNode[] = [
  { id: '1', label: 'Node 1', children: [
    { id: '1.1', label: 'Node 1.1' },
    { id: '1.2', label: 'Node 1.2' },
  ]},
  { id: '2', label: 'Node 2' },
];

// ============================================================
// useKeyboardNavigation Tests
// ============================================================

describe('useKeyboardNavigation Hook', () => {
  it('initializes with default focus index', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({ itemCount: 10 })
    );

    expect(result.current.focusedIndex).toBe(0);
  });

  it('initializes with custom initial index', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({ itemCount: 10, initialIndex: 5 })
    );

    expect(result.current.focusedIndex).toBe(5);
  });

  it('moves focus with arrow keys (vertical)', () => {
    const onNavigate = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        itemCount: 10,
        orientation: 'vertical',
        onNavigate,
      })
    );

    // Simulate ArrowDown
    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowDown',
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.focusedIndex).toBe(1);
    expect(onNavigate).toHaveBeenCalledWith(1);
  });

  it('moves focus with arrow keys (horizontal)', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        itemCount: 10,
        orientation: 'horizontal',
      })
    );

    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowRight',
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.focusedIndex).toBe(1);
  });

  it('moves focus in grid layout', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        itemCount: 35, // 5 weeks of days
        columns: 7, // 7 days per week
      })
    );

    // Move right
    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowRight',
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });
    expect(result.current.focusedIndex).toBe(1);

    // Move down (next row)
    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowDown',
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });
    expect(result.current.focusedIndex).toBe(8); // 1 + 7
  });

  it('wraps around when wrap is enabled', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        itemCount: 5,
        wrap: true,
      })
    );

    // Go past the end
    act(() => {
      result.current.setFocusedIndex(4);
    });

    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowDown',
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.focusedIndex).toBe(0);
  });

  it('does not wrap when wrap is disabled', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        itemCount: 5,
        wrap: false,
      })
    );

    act(() => {
      result.current.setFocusedIndex(4);
    });

    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowDown',
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.focusedIndex).toBe(4); // Stays at end
  });

  it('calls onSelect on Enter key', () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        itemCount: 10,
        onSelect,
      })
    );

    act(() => {
      result.current.handleKeyDown({
        key: 'Enter',
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(onSelect).toHaveBeenCalledWith(0);
  });

  it('calls onSelect on Space key', () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        itemCount: 10,
        onSelect,
      })
    );

    act(() => {
      result.current.handleKeyDown({
        key: ' ',
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(onSelect).toHaveBeenCalledWith(0);
  });

  it('calls onEscape on Escape key', () => {
    const onEscape = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        itemCount: 10,
        onEscape,
      })
    );

    act(() => {
      result.current.handleKeyDown({
        key: 'Escape',
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(onEscape).toHaveBeenCalled();
  });

  it('Home key moves to first item', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({ itemCount: 10 })
    );

    act(() => {
      result.current.setFocusedIndex(5);
    });

    act(() => {
      result.current.handleKeyDown({
        key: 'Home',
        ctrlKey: false,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.focusedIndex).toBe(0);
  });

  it('End key moves to last item', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({ itemCount: 10 })
    );

    act(() => {
      result.current.handleKeyDown({
        key: 'End',
        ctrlKey: false,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.focusedIndex).toBe(9);
  });

  it('provides correct container props', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({ itemCount: 10, columns: 7 })
    );

    expect(result.current.containerProps.role).toBe('grid');
    expect(result.current.containerProps.tabIndex).toBe(0);
    expect(result.current.containerProps['aria-activedescendant']).toBe('item-0');
  });

  it('provides correct item props', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({ itemCount: 10 })
    );

    const itemProps = result.current.getItemProps(0);

    expect(itemProps.id).toBe('item-0');
    expect(itemProps.role).toBe('option'); // 1 column = listbox
    expect(itemProps.tabIndex).toBe(0); // Focused item
    expect(itemProps['aria-selected']).toBe(true);
  });

  it('disabled hook ignores key events', () => {
    const onNavigate = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        itemCount: 10,
        enabled: false,
        onNavigate,
      })
    );

    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowDown',
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(onNavigate).not.toHaveBeenCalled();
  });
});

// ============================================================
// useRovingTabIndex Tests
// ============================================================

describe('useRovingTabIndex Hook', () => {
  it('returns correct tabIndex for active item', () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 5, initialIndex: 2 })
    );

    expect(result.current.getTabIndex(2)).toBe(0);
    expect(result.current.getTabIndex(0)).toBe(-1);
    expect(result.current.getTabIndex(4)).toBe(-1);
  });

  it('focusItem updates active index', () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 5 })
    );

    act(() => {
      result.current.focusItem(3);
    });

    expect(result.current.activeIndex).toBe(3);
    expect(result.current.getTabIndex(3)).toBe(0);
  });

  it('focusItem ignores out-of-bounds indices', () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 5 })
    );

    act(() => {
      result.current.focusItem(10);
    });

    expect(result.current.activeIndex).toBe(0); // Unchanged
  });
});

// ============================================================
// Component Integration Tests
// ============================================================

describe('Keyboard Navigation - BioTree', () => {
  it('BioTree receives keyboard events', () => {
    render(
      <BioLocaleProvider>
        <BioTree nodes={testTreeNodes} />
      </BioLocaleProvider>
    );

    const tree = screen.getByRole('tree');
    expect(tree).toBeInTheDocument();

    // Tree should be focusable
    expect(tree.getAttribute('tabindex')).not.toBeNull();
  });

  it('BioTree items are navigable', () => {
    render(
      <BioLocaleProvider>
        <BioTree nodes={testTreeNodes} />
      </BioLocaleProvider>
    );

    const firstItem = screen.getByText('Node 1');
    expect(firstItem).toBeInTheDocument();

    // Items should have tree item role
    const treeItems = screen.getAllByRole('treeitem');
    expect(treeItems.length).toBeGreaterThan(0);
  });
});

describe('Keyboard Navigation - BioCalendar', () => {
  it('BioCalendar renders with proper roles', () => {
    render(
      <BioLocaleProvider>
        <BioCalendar events={testEvents} />
      </BioLocaleProvider>
    );

    // Calendar should have grid role
    const grid = screen.getByRole('grid');
    expect(grid).toBeInTheDocument();
  });

  it('BioCalendar navigation buttons are keyboard accessible', () => {
    render(
      <BioLocaleProvider>
        <BioCalendar events={testEvents} />
      </BioLocaleProvider>
    );

    const prevButton = screen.getByLabelText(/previous/i);
    const nextButton = screen.getByLabelText(/next/i);

    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();

    // Buttons should be focusable
    expect(prevButton.getAttribute('tabindex')).not.toBe('-1');
    expect(nextButton.getAttribute('tabindex')).not.toBe('-1');
  });
});

describe('Keyboard Navigation - BioGantt', () => {
  it('BioGantt renders with zoom controls accessible', () => {
    render(
      <BioLocaleProvider>
        <BioGantt tasks={testTasks} />
      </BioLocaleProvider>
    );

    const zoomIn = screen.getByLabelText('Zoom in');
    const zoomOut = screen.getByLabelText('Zoom out');

    expect(zoomIn).toBeInTheDocument();
    expect(zoomOut).toBeInTheDocument();
  });

  it('BioGantt renders without crashing', () => {
    render(
      <BioLocaleProvider>
        <BioGantt tasks={testTasks} />
      </BioLocaleProvider>
    );

    expect(screen.getByTestId('bio-gantt')).toBeInTheDocument();
  });
});

// ============================================================
// ARIA Label Tests
// ============================================================

describe('ARIA Labels - Screen Reader Support', () => {
  it('BioCalendar has accessible navigation', () => {
    render(
      <BioLocaleProvider>
        <BioCalendar events={testEvents} />
      </BioLocaleProvider>
    );

    // Navigation buttons should have aria-labels
    const prevButton = screen.getByLabelText(/previous/i);
    const nextButton = screen.getByLabelText(/next/i);

    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
  });

  it('BioGantt zoom buttons have aria-labels', () => {
    render(
      <BioLocaleProvider>
        <BioGantt tasks={testTasks} />
      </BioLocaleProvider>
    );

    expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
  });

  it('BioTree has proper tree semantics', () => {
    render(
      <BioLocaleProvider>
        <BioTree nodes={testTreeNodes} />
      </BioLocaleProvider>
    );

    const tree = screen.getByRole('tree');
    expect(tree).toHaveAttribute('aria-label');
  });
});

// ============================================================
// Focus Management Tests
// ============================================================

describe('Focus Management', () => {
  it('useKeyboardNavigation helper functions work', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({ itemCount: 10 })
    );

    act(() => {
      result.current.focusNext();
    });
    expect(result.current.focusedIndex).toBe(1);

    act(() => {
      result.current.focusPrevious();
    });
    expect(result.current.focusedIndex).toBe(0);

    act(() => {
      result.current.focusLast();
    });
    expect(result.current.focusedIndex).toBe(9);

    act(() => {
      result.current.focusFirst();
    });
    expect(result.current.focusedIndex).toBe(0);
  });
});
