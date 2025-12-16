/**
 * @aibos/bioskin - Unified Test Demo
 * 
 * Demonstrates Unit + Component testing in ONE file using
 * Vitest Browser Mode + Playwright.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { z } from 'zod';
import * as React from 'react';

// Import bioskin components
import { Spinner } from '../src/molecules/Spinner';
import { StatusBadge } from '../src/molecules/StatusBadge';
import { cn } from '../src/atoms/utils';
import { introspectZodSchema } from '../src/introspector/ZodSchemaIntrospector';

// ============================================================
// UNIT TESTS - Pure logic, no DOM
// ============================================================

describe('Unit Tests', () => {
  describe('cn() utility', () => {
    it('merges class names correctly', () => {
      const result = cn('px-4', 'py-2', 'bg-blue-500');
      expect(result).toBe('px-4 py-2 bg-blue-500');
    });

    it('handles conditional classes', () => {
      const isActive = true;
      const result = cn('base', isActive && 'active');
      expect(result).toContain('active');
    });

    it('deduplicates tailwind classes', () => {
      const result = cn('px-4', 'px-8');
      expect(result).toBe('px-8'); // tailwind-merge keeps last
    });
  });

  describe('introspectZodSchema()', () => {
    const TestSchema = z.object({
      name: z.string(),
      email: z.string().email(),
      age: z.number().optional(),
      status: z.enum(['active', 'inactive']),
    });

    it('extracts correct number of fields', () => {
      const definition = introspectZodSchema(TestSchema);
      expect(definition.fields).toHaveLength(4);
    });

    it('identifies required fields', () => {
      const definition = introspectZodSchema(TestSchema);
      const nameField = definition.fields.find(f => f.name === 'name');
      const ageField = definition.fields.find(f => f.name === 'age');

      expect(nameField?.required).toBe(true);
      expect(ageField?.required).toBe(false);
    });

    it('identifies enum type', () => {
      const definition = introspectZodSchema(TestSchema);
      const statusField = definition.fields.find(f => f.name === 'status');

      expect(statusField?.type).toBe('enum');
    });

    it('generates labels from field names', () => {
      const definition = introspectZodSchema(TestSchema);
      const emailField = definition.fields.find(f => f.name === 'email');

      expect(emailField?.label).toBe('Email');
    });
  });
});

// ============================================================
// COMPONENT TESTS - Real browser rendering with RTL
// ============================================================

describe('Component Tests', () => {
  describe('Spinner', () => {
    it('renders default spinner with status role', () => {
      render(<Spinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('renders with different variants', () => {
      const { rerender } = render(<Spinner variant="dots" />);
      expect(screen.getByRole('status')).toBeInTheDocument();

      rerender(<Spinner variant="pulse" />);
      expect(screen.getByRole('status')).toBeInTheDocument();

      rerender(<Spinner variant="bars" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders all 8 variants', () => {
      const variants = ['default', 'dots', 'pulse', 'bars', 'ring', 'dual-ring', 'bounce', 'wave'] as const;

      variants.forEach(variant => {
        const { unmount } = render(<Spinner variant={variant} />);
        expect(screen.getByRole('status')).toBeInTheDocument();
        unmount();
      });
    });

    it('has accessible label', () => {
      render(<Spinner label="Loading data" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Loading data');
    });

    it('renders with different sizes', () => {
      const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

      sizes.forEach(size => {
        const { unmount } = render(<Spinner size={size} />);
        expect(screen.getByRole('status')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('StatusBadge', () => {
    it('renders with status text', () => {
      render(<StatusBadge status="active" />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('renders different statuses', () => {
      const { rerender } = render(<StatusBadge status="pending" />);
      expect(screen.getByText('Pending')).toBeInTheDocument();

      rerender(<StatusBadge status="approved" />);
      expect(screen.getByText('Approved')).toBeInTheDocument();

      rerender(<StatusBadge status="rejected" />);
      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });

    it('renders dot variant', () => {
      const { container } = render(<StatusBadge status="active" variant="dot" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with custom label', () => {
      render(<StatusBadge status="active" label="Custom Label" />);
      expect(screen.getByText('Custom Label')).toBeInTheDocument();
    });
  });
});

// ============================================================
// INTEGRATION TESTS - Multiple components together
// ============================================================

describe('Integration Tests', () => {
  it('Spinner + StatusBadge render together', () => {
    render(
      <div data-testid="container">
        <Spinner variant="dots" size="sm" />
        <StatusBadge status="pending" />
      </div>
    );

    // Both have role="status", so use getAllByRole
    const statusElements = screen.getAllByRole('status');
    expect(statusElements).toHaveLength(2);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('Multiple spinners with different variants', () => {
    render(
      <div>
        <Spinner variant="default" label="Loading 1" />
        <Spinner variant="dots" label="Loading 2" />
        <Spinner variant="pulse" label="Loading 3" />
      </div>
    );

    const spinners = screen.getAllByRole('status');
    expect(spinners).toHaveLength(3);
  });
});
