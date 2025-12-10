import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { cn } from '@/lib/utils';

// Utility function test
describe('cn utility', () => {
  it('merges class names correctly', () => {
    const result = cn('text-white', 'bg-black', 'text-red-500');
    expect(result).toBe('bg-black text-red-500');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const result = cn('base', isActive && 'active');
    expect(result).toBe('base active');
  });
});

// Smoke test - React renders
describe('React rendering', () => {
  it('renders a simple component', () => {
    const TestComponent = () => <div data-testid="test">NexusCanon</div>;
    render(<TestComponent />);
    expect(screen.getByTestId('test')).toHaveTextContent('NexusCanon');
  });
});
