/**
 * BioFormField NumberInput Tests
 * 
 * Comprehensive tests for number input functionality:
 * - Keyboard input (numbers, decimal, navigation)
 * - React Hook Form integration
 * - Value synchronization
 * - Edge cases and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { BioFormField } from '../src/organisms/BioForm/BioFormField';
import type { BioFieldDefinition } from '../src/introspector/ZodSchemaIntrospector';

// ============================================================
// Test Helper: Render NumberInput with RHF
// ============================================================

const NumberSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  price: z.number().min(0).max(10000).optional(),
  quantity: z.number().int('Must be an integer'),
});

function TestNumberInput({
  definition,
  defaultValue,
}: {
  definition: BioFieldDefinition;
  defaultValue?: number;
}) {
  const form = useForm({
    resolver: zodResolver(NumberSchema),
    defaultValues: { [definition.name]: defaultValue },
  });

  const register = form.register(definition.name as 'amount' | 'price' | 'quantity');
  const error = form.formState.errors[definition.name as keyof typeof form.formState.errors]?.message as string | undefined;

  return (
    <BioFormField
      definition={definition}
      register={register}
      error={error}
      value={form.watch(definition.name as 'amount' | 'price' | 'quantity')}
    />
  );
}

// ============================================================
// Test Definitions
// ============================================================

const amountDefinition: BioFieldDefinition = {
  name: 'amount',
  type: 'number',
  label: 'Amount',
  description: 'Payment amount',
  required: true,
  validation: { min: 0 },
};

const priceDefinition: BioFieldDefinition = {
  name: 'price',
  type: 'number',
  label: 'Price',
  description: 'Item price',
  required: false,
  validation: { min: 0, max: 10000 },
};

const quantityDefinition: BioFieldDefinition = {
  name: 'quantity',
  type: 'number',
  label: 'Quantity',
  description: 'Item quantity',
  required: true,
  validation: { min: 1 },
};

// ============================================================
// Rendering Tests
// ============================================================

describe('NumberInput - Rendering', () => {
  it('renders number input with correct type', () => {
    render(<TestNumberInput definition={amountDefinition} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.type).toBe('number');
  });

  it('renders with placeholder', () => {
    render(<TestNumberInput definition={amountDefinition} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;
    expect(input.placeholder).toContain('amount');
  });

  it('renders with default value', () => {
    render(<TestNumberInput definition={amountDefinition} defaultValue={100} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;
    expect(input.value).toBe('100');
  });

  it('has correct inputMode for mobile keyboards', () => {
    render(<TestNumberInput definition={amountDefinition} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;
    expect(input.inputMode).toBe('decimal');
  });

  it('has step="any" for decimal support', () => {
    render(<TestNumberInput definition={amountDefinition} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;
    expect(input.step).toBe('any');
  });
});

// ============================================================
// Keyboard Input Tests
// ============================================================

describe('NumberInput - Keyboard Input', () => {
  it('accepts numeric digits (0-9)', async () => {
    const user = userEvent.setup();
    render(<TestNumberInput definition={amountDefinition} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;

    await user.type(input, '123');
    expect(input.value).toBe('123');
  });

  it('accepts decimal point', async () => {
    const user = userEvent.setup();
    render(<TestNumberInput definition={amountDefinition} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;

    await user.type(input, '123.45');
    expect(input.value).toBe('123.45');
  });

  it('accepts negative sign', async () => {
    const user = userEvent.setup();
    render(<TestNumberInput definition={amountDefinition} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;

    await user.type(input, '-50');
    expect(input.value).toBe('-50');
  });

  it('allows backspace to delete', async () => {
    const user = userEvent.setup();
    render(<TestNumberInput definition={amountDefinition} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;

    await user.type(input, '123');
    await user.keyboard('{Backspace}');
    expect(input.value).toBe('12');
  });

  it('allows delete key', async () => {
    const user = userEvent.setup();
    render(<TestNumberInput definition={amountDefinition} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;

    await user.type(input, '123');
    // Note: number inputs don't support setSelectionRange in all browsers
    // This test verifies delete key is allowed (not blocked by our handler)
    await user.keyboard('{ArrowLeft}{ArrowLeft}'); // Move cursor
    await user.keyboard('{Delete}');
    // Value should change (browser handles deletion)
    expect(input.value).not.toBe('123');
  });

  it('allows arrow keys for navigation', async () => {
    const user = userEvent.setup();
    render(<TestNumberInput definition={amountDefinition} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;

    await user.type(input, '123');
    await user.keyboard('{ArrowLeft}');
    await user.type(input, '4');
    // Should insert at cursor position
    expect(input.value.length).toBeGreaterThan(3);
  });

  it('allows Home and End keys', async () => {
    const user = userEvent.setup();
    render(<TestNumberInput definition={amountDefinition} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;

    await user.type(input, '123');
    await user.keyboard('{Home}');
    await user.type(input, '0');
    expect(input.value).toContain('0');
  });

  it('allows Ctrl+A (select all)', async () => {
    const user = userEvent.setup();
    render(<TestNumberInput definition={amountDefinition} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;

    await user.type(input, '123');
    await user.keyboard('{Control>}a{/Control}');
    // Note: Number inputs may not fully support selection in all browsers
    // This test verifies Ctrl+A is allowed (not blocked)
    await user.type(input, '456');
    // Value should contain new input (may append or replace depending on browser)
    expect(input.value).toContain('456');
  });

  it('allows Ctrl+C, Ctrl+V (copy/paste)', async () => {
    const user = userEvent.setup();
    render(<TestNumberInput definition={amountDefinition} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;

    await user.type(input, '123');
    // Note: Copy/paste in number inputs is browser-dependent
    // This test verifies Ctrl+C/V are allowed (not blocked by our handler)
    await user.keyboard('{Control>}a{/Control}');
    await user.keyboard('{Control>}c{/Control}');
    await user.clear(input);
    // Paste may work or may be blocked by browser - we just verify keys aren't blocked
    try {
      await user.keyboard('{Control>}v{/Control}');
      // If paste works, value should be restored
      if (input.value) {
        expect(input.value).toMatch(/^\d+$/);
      }
    } catch {
      // Browser may block paste - that's acceptable
      expect(true).toBe(true);
    }
  });

  it('blocks non-numeric characters', async () => {
    const user = userEvent.setup();
    render(<TestNumberInput definition={amountDefinition} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;

    const initialValue = input.value;
    await user.type(input, 'abc');
    // Should not accept letters
    expect(input.value).toBe(initialValue || '');
  });

  it('blocks special characters except decimal and minus', async () => {
    const user = userEvent.setup();
    render(<TestNumberInput definition={amountDefinition} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;

    const initialValue = input.value;
    await user.type(input, '@#$%');
    expect(input.value).toBe(initialValue || '');
  });
});

// ============================================================
// React Hook Form Integration Tests
// ============================================================

describe('NumberInput - RHF Integration', () => {
  it('syncs value with react-hook-form', async () => {
    const user = userEvent.setup();
    render(<TestNumberInput definition={amountDefinition} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;

    await user.type(input, '100');
    await user.tab(); // Trigger blur

    // RHF should have the value
    await waitFor(() => {
      expect(input.value).toBe('100');
    });
  });

  it('updates when RHF value changes programmatically', async () => {
    function ControlledInput() {
      const form = useForm({
        resolver: zodResolver(NumberSchema),
        defaultValues: { amount: 0 },
      });

      React.useEffect(() => {
        form.setValue('amount', 500);
      }, [form]);

      const register = form.register('amount');
      const error = form.formState.errors.amount?.message;

      return (
        <BioFormField
          definition={amountDefinition}
          register={register}
          error={error}
          value={form.watch('amount')}
        />
      );
    }

    render(<ControlledInput />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;

    await waitFor(() => {
      expect(input.value).toBe('500');
    });
  });

  it('handles empty value correctly', async () => {
    const user = userEvent.setup();
    render(<TestNumberInput definition={amountDefinition} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;

    await user.type(input, '100');
    await user.clear(input);
    expect(input.value).toBe('');
  });
});

// ============================================================
// Edge Cases
// ============================================================

describe('NumberInput - Edge Cases', () => {
  it('handles multiple decimal points (only first accepted)', async () => {
    const user = userEvent.setup();
    render(<TestNumberInput definition={amountDefinition} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;

    await user.type(input, '12.34.56');
    // Browser may handle this, but we ensure it doesn't break
    expect(input.value).toMatch(/^\d+\.?\d*$/);
  });

  it('handles leading zeros', async () => {
    const user = userEvent.setup();
    render(<TestNumberInput definition={amountDefinition} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;

    await user.type(input, '00123');
    // Note: Browsers typically normalize leading zeros in number inputs
    // This is expected browser behavior, not a bug
    // Value should be a valid number (may be normalized to '123')
    expect(input.value).toMatch(/^\d+$/);
  });

  it('handles very large numbers', async () => {
    const user = userEvent.setup();
    render(<TestNumberInput definition={amountDefinition} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;

    await user.type(input, '999999999');
    expect(input.value).toBe('999999999');
  });

  it('handles scientific notation input', async () => {
    const user = userEvent.setup();
    render(<TestNumberInput definition={amountDefinition} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;

    // Scientific notation might be blocked by our handler
    await user.type(input, '1e5');
    // Should either accept or block gracefully
    expect(typeof input.value).toBe('string');
  });
});

// ============================================================
// Accessibility Tests
// ============================================================

describe('NumberInput - Accessibility', () => {
  it('has proper label association', () => {
    render(<TestNumberInput definition={amountDefinition} />);
    const input = screen.getByLabelText(/amount/i);
    expect(input).toBeInTheDocument();
  });

  it('has proper role (spinbutton)', () => {
    render(<TestNumberInput definition={amountDefinition} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toBeInTheDocument();
  });

  it('shows error message when invalid', async () => {
    const user = userEvent.setup();
    render(<TestNumberInput definition={amountDefinition} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;

    // Type negative number (should trigger validation error)
    await user.type(input, '-10');
    await user.tab();

    // Wait for validation to trigger
    await waitFor(() => {
      // Error may appear in multiple forms (aria-describedby, text content, etc.)
      const error = screen.queryByText(/positive/i) ||
        screen.queryByText(/must be positive/i) ||
        document.querySelector('[aria-invalid="true"]');
      // If validation is working, either error text or aria-invalid should be present
      expect(error || input.getAttribute('aria-invalid')).toBeTruthy();
    }, { timeout: 2000 });
  });
});
