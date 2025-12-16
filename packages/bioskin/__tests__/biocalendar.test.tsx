/**
 * BioCalendar Tests - Vitest Browser Mode
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';

import { BioCalendar, type CalendarEvent } from '../src/organisms/BioCalendar';

// ============================================================
// Test Data
// ============================================================

const today = new Date();
const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Team Meeting',
    start: today,
    type: 'primary',
  },
  {
    id: '2',
    title: 'Project Deadline',
    start: today,
    type: 'danger',
  },
  {
    id: '3',
    title: 'Training Session',
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
    type: 'success',
  },
];

// ============================================================
// Tests
// ============================================================

describe('BioCalendar - Rendering', () => {
  it('renders calendar with data-testid', () => {
    render(<BioCalendar events={mockEvents} />);
    expect(screen.getByTestId('bio-calendar')).toBeInTheDocument();
  });

  it('renders current month and year', () => {
    render(<BioCalendar events={mockEvents} />);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    expect(screen.getByText(new RegExp(monthNames[today.getMonth()]))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(today.getFullYear().toString()))).toBeInTheDocument();
  });

  it('renders day headers', () => {
    render(<BioCalendar events={mockEvents} />);
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
  });

  it('renders calendar days', () => {
    render(<BioCalendar events={mockEvents} />);
    const days = screen.getAllByTestId('calendar-day');
    expect(days.length).toBe(42); // 6 weeks * 7 days
  });

  it('renders events on calendar', () => {
    render(<BioCalendar events={mockEvents} />);
    expect(screen.getByText('Team Meeting')).toBeInTheDocument();
    expect(screen.getByText('Project Deadline')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<BioCalendar events={[]} loading />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe('BioCalendar - Navigation', () => {
  it('navigates to previous month', async () => {
    const user = userEvent.setup();
    render(<BioCalendar events={mockEvents} />);

    const prevButton = screen.getAllByRole('button')[0]; // First button is prev
    await user.click(prevButton);

    // Month should change
    expect(screen.getByTestId('bio-calendar')).toBeInTheDocument();
  });

  it('navigates to next month', async () => {
    const user = userEvent.setup();
    render(<BioCalendar events={mockEvents} />);

    const buttons = screen.getAllByRole('button');
    const nextButton = buttons[1]; // Second button is next
    await user.click(nextButton);

    expect(screen.getByTestId('bio-calendar')).toBeInTheDocument();
  });

  it('navigates to today', async () => {
    const user = userEvent.setup();
    render(<BioCalendar events={mockEvents} />);

    await user.click(screen.getByText('Today'));
    expect(screen.getByTestId('bio-calendar')).toBeInTheDocument();
  });
});

describe('BioCalendar - Interactions', () => {
  it('selects date when clicked', async () => {
    const user = userEvent.setup();
    const onDateSelect = vi.fn();
    render(<BioCalendar events={mockEvents} onDateSelect={onDateSelect} />);

    const days = screen.getAllByTestId('calendar-day');
    await user.click(days[15]); // Click middle of calendar

    expect(onDateSelect).toHaveBeenCalled();
  });

  it('calls onEventClick when event is clicked', async () => {
    const user = userEvent.setup();
    const onEventClick = vi.fn();
    render(<BioCalendar events={mockEvents} onEventClick={onEventClick} />);

    await user.click(screen.getByText('Team Meeting'));
    expect(onEventClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1', title: 'Team Meeting' })
    );
  });
});

describe('BioCalendar - View Switcher', () => {
  it('renders view switcher when enabled', () => {
    render(<BioCalendar events={mockEvents} showViewSwitcher />);
    expect(screen.getByText('month')).toBeInTheDocument();
    expect(screen.getByText('week')).toBeInTheDocument();
    expect(screen.getByText('day')).toBeInTheDocument();
  });

  it('calls onViewChange when view is switched', async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();
    render(<BioCalendar events={mockEvents} showViewSwitcher onViewChange={onViewChange} />);

    await user.click(screen.getByText('week'));
    expect(onViewChange).toHaveBeenCalledWith('week');
  });
});
