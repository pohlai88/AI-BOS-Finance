import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import StabilitySimulation from '../StabilitySimulation';

// Mock the framer-motion library to avoid animation complexity in tests
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('StabilitySimulation (Forensic Logic)', () => {
  beforeEach(() => {
    vi.useFakeTimers(); // Take control of Time
  });

  afterEach(() => {
    vi.useRealTimers(); // Reset Time after each test
  });

  it('renders the Forensic Header correctly', () => {
    render(<StabilitySimulation />);

    // Check for the "Palantir" style header
    expect(screen.getByText(/Structural/i)).toBeInTheDocument();
    expect(screen.getByText(/Divergence/i)).toBeInTheDocument();
    expect(screen.getByText(/LEGACY: DEGRADING/i)).toBeInTheDocument();
  });

  it('builds the Legacy Stack progressively over time', () => {
    render(<StabilitySimulation />);

    // Stage 0: No blocks visible yet (slice(0, 0) = empty)
    expect(screen.queryByText('LEGACY_ERP_CORE')).not.toBeInTheDocument();

    // Advance 2000ms to Stage 1: First block appears
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Now the first block should be visible
    expect(screen.getByText('LEGACY_ERP_CORE')).toBeInTheDocument();

    // Advance another 2000ms to Stage 2: Second block appears
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText('UNPATCHED_MIDDLEWARE')).toBeInTheDocument();
  });

  it('triggers the Collapse Event after critical instability', () => {
    render(<StabilitySimulation />);

    // Fast-forward through the "years" (Stages 0 to 6)
    // 2000ms * 6 stages = 12000ms
    act(() => {
      vi.advanceTimersByTime(12000);
    });

    // At Stage 6 (Critical), the system shakes.
    // The collapse happens 1500ms *after* stage 6 triggers.
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // Check for the "Blue Screen of Death" message (The Rubble Component)
    expect(screen.getByText(/SYSTEM FAILURE DETECTED/i)).toBeInTheDocument();
    expect(screen.getByText(/Rebooting legacy kernel/i)).toBeInTheDocument();
  });

  it('resets the simulation loop automatically', () => {
    render(<StabilitySimulation />);

    // Fast-forward past the collapse (Stage 7 reset)
    // 14000ms should trigger the reset
    act(() => {
      vi.advanceTimersByTime(16000);
    });

    // The collapse message should be gone
    expect(screen.queryByText(/SYSTEM FAILURE DETECTED/i)).not.toBeInTheDocument();
    // The cycle restarts
    expect(screen.getByText(/LEGACY: DEGRADING/i)).toBeInTheDocument();
  });
});

