/**
 * BioTimeline Tests - Vitest Browser Mode
 *
 * E2E-style user flow testing for activity timeline.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';

import { BioTimeline, type TimelineItem } from '../src/organisms/BioTimeline';

// ============================================================
// Test Data
// ============================================================

const mockItems: TimelineItem[] = [
  {
    id: '1',
    title: 'Invoice Created',
    description: 'Invoice #INV-001 was created',
    timestamp: new Date(),
    type: 'create',
    user: { name: 'John Doe' },
  },
  {
    id: '2',
    title: 'Payment Received',
    description: 'Payment of $1,000 received',
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    type: 'success',
    user: { name: 'Jane Smith' },
  },
  {
    id: '3',
    title: 'Invoice Updated',
    description: 'Due date extended',
    timestamp: new Date(Date.now() - 86400000), // 1 day ago
    type: 'update',
  },
];

// ============================================================
// Unit Tests - BioTimeline renders correctly
// ============================================================

describe('BioTimeline - Rendering', () => {
  it('renders timeline with data-testid', () => {
    render(<BioTimeline items={mockItems} />);
    expect(screen.getByTestId('bio-timeline')).toBeInTheDocument();
  });

  it('renders all timeline items', () => {
    render(<BioTimeline items={mockItems} />);
    expect(screen.getByText('Invoice Created')).toBeInTheDocument();
    expect(screen.getByText('Payment Received')).toBeInTheDocument();
    expect(screen.getByText('Invoice Updated')).toBeInTheDocument();
  });

  it('renders item descriptions', () => {
    render(<BioTimeline items={mockItems} />);
    expect(screen.getByText('Invoice #INV-001 was created')).toBeInTheDocument();
    expect(screen.getByText('Payment of $1,000 received')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<BioTimeline items={mockItems} title="Activity Log" />);
    expect(screen.getByText('Activity Log')).toBeInTheDocument();
  });

  it('renders user information', () => {
    render(<BioTimeline items={mockItems} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<BioTimeline items={[]} loading />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state', () => {
    render(<BioTimeline items={[]} emptyMessage="No activities" />);
    expect(screen.getByText('No activities')).toBeInTheDocument();
  });
});

// ============================================================
// Feature Tests
// ============================================================

describe('BioTimeline - Features', () => {
  it('shows timestamps when enabled', () => {
    render(<BioTimeline items={mockItems} showTimestamps />);
    // Timestamp container should be visible (Clock icon + text)
    // Format depends on locale provider - could be "ago" or date format
    const timelineItems = screen.getAllByTestId('timeline-item');
    expect(timelineItems.length).toBeGreaterThan(0);
    // Each item should have a timestamp container (flex items with gap-1)
    const clockIcons = document.querySelectorAll('.lucide-clock');
    expect(clockIcons.length).toBe(mockItems.length);
  });

  it('hides timestamps when disabled', () => {
    render(<BioTimeline items={mockItems} showTimestamps={false} />);
    // Clock icons should not be present
    const clockIcons = document.querySelectorAll('.lucide-clock');
    expect(clockIcons.length).toBe(0);
  });

  it('groups items by date when enabled', () => {
    render(<BioTimeline items={mockItems} groupByDate />);
    // Should show "Today" for recent items
    expect(screen.getByText('Today')).toBeInTheDocument();
  });
});

// ============================================================
// Callback Tests
// ============================================================

describe('BioTimeline - Callbacks', () => {
  it('calls onItemClick when item is clicked', async () => {
    const user = userEvent.setup();
    const onItemClick = vi.fn();
    render(<BioTimeline items={mockItems} onItemClick={onItemClick} />);

    await user.click(screen.getByText('Invoice Created'));

    expect(onItemClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1', title: 'Invoice Created' })
    );
  });
});

// ============================================================
// Accessibility Tests
// ============================================================

describe('BioTimeline - Accessibility', () => {
  it('items are marked with data-testid', () => {
    render(<BioTimeline items={mockItems} />);
    const items = screen.getAllByTestId('timeline-item');
    expect(items.length).toBe(3);
  });
});
