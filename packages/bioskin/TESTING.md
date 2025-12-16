# @aibos/bioskin — Testing Standard

> **Version:** 1.0.0
> **Status:** ACTIVE
> **Last Updated:** 2024-12-16
> **Derives From:** CONT_10 BioSkin Architecture v2.1

---

## Executive Summary

BIOSKIN uses **Vitest Browser Mode + Playwright** for unified testing. All tests run in a **real Chromium browser**, eliminating jsdom quirks and providing production-accurate results.

---

## Testing Philosophy

```
┌─────────────────────────────────────────────────────────────┐
│                    ONE TEST RUNNER                          │
│                                                             │
│   Unit Tests ───┐                                           │
│                 │                                           │
│   Component ────┼──► Vitest + Playwright ──► Real Browser   │
│                 │                                           │
│   Integration ──┘                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**No separate E2E runner.** Unit, Component, and Integration tests coexist in the same test files, executed in a real browser.

---

## Testing KPIs

### Coverage Requirements

| Metric | Minimum | Target | Status |
|--------|---------|--------|--------|
| **Line Coverage** | 70% | 85% | 🔄 |
| **Branch Coverage** | 60% | 75% | 🔄 |
| **Function Coverage** | 80% | 90% | 🔄 |
| **Statement Coverage** | 70% | 85% | 🔄 |

### Component Test Requirements

| Component Layer | Test Requirement | Priority |
|-----------------|------------------|----------|
| **Atoms** | Props render correctly | P1 |
| **Molecules** | All variants + states | P0 |
| **Organisms** | Schema-driven behavior | P0 |
| **Hooks** | State management + edge cases | P0 |
| **Utils** | Pure function coverage | P1 |
| **Introspector** | Schema extraction accuracy | P0 |

### Test Categories

| Category | Description | KPI |
|----------|-------------|-----|
| **Unit** | Pure logic, no DOM | 100% utils covered |
| **Component** | Single component render | All props tested |
| **Integration** | Multiple components | Key flows covered |
| **Accessibility** | a11y compliance | Zero violations |

---

## Test File Structure

```
packages/bioskin/
├── __tests__/
│   ├── setup.ts                    # Test environment setup
│   ├── bioskin.test.tsx            # Main test suite
│   ├── hooks/
│   │   ├── useBioForm.test.ts      # Form hook tests
│   │   └── useBioTable.test.ts     # Table hook tests
│   ├── molecules/
│   │   ├── Spinner.test.tsx        # Spinner variants
│   │   └── StatusBadge.test.tsx    # Badge states
│   ├── organisms/
│   │   ├── BioForm.test.tsx        # Form rendering + validation
│   │   └── BioTable.test.tsx       # Table features
│   └── utils/
│       ├── cn.test.ts              # Class merging
│       └── introspector.test.ts    # Schema introspection
├── vitest.config.ts                # Vitest Browser Mode config
└── package.json                    # Test scripts
```

---

## Test Commands

```bash
# Run all tests (headless)
pnpm test

# Watch mode (re-run on file change)
pnpm test:watch

# Visual UI (browser-based test viewer)
pnpm test:ui

# See browser during tests (headed mode)
pnpm test:headed

# Generate coverage report
pnpm test:coverage
```

---

## Writing Tests

### Unit Test Pattern

```typescript
describe('cn() utility', () => {
  it('merges class names correctly', () => {
    const result = cn('px-4', 'py-2');
    expect(result).toBe('px-4 py-2');
  });

  it('deduplicates tailwind classes', () => {
    const result = cn('px-4', 'px-8');
    expect(result).toBe('px-8'); // tailwind-merge keeps last
  });
});
```

### Component Test Pattern

```typescript
describe('Spinner', () => {
  it('renders with status role', () => {
    render(<Spinner />);
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
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading data');
  });
});
```

### Hook Test Pattern

```typescript
import { renderHook, act } from '@testing-library/react';

describe('useBioForm', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => 
      useBioForm({ schema: TestSchema, onSubmit: vi.fn() })
    );
    
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isDirty).toBe(false);
  });

  it('validates on submit', async () => {
    const mockSubmit = vi.fn();
    const { result } = renderHook(() => 
      useBioForm({ schema: TestSchema, onSubmit: mockSubmit })
    );
    
    await act(async () => {
      await result.current.handleSubmit();
    });
    
    expect(result.current.errors).toBeDefined();
  });
});
```

### Integration Test Pattern

```typescript
describe('BioForm + BioTable Integration', () => {
  it('form submission updates table data', async () => {
    const onSubmit = vi.fn();
    
    render(
      <div>
        <BioForm schema={TestSchema} onSubmit={onSubmit} />
        <BioTable schema={TestSchema} data={[]} />
      </div>
    );

    // Fill form
    await userEvent.type(screen.getByLabelText('Name'), 'Test');
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    
    expect(onSubmit).toHaveBeenCalled();
  });
});
```

---

## CI/CD Integration

### Pre-commit Hook

```bash
# .husky/pre-commit
pnpm --filter @aibos/bioskin test
```

### GitHub Actions

```yaml
# .github/workflows/bioskin-test.yml
name: BIOSKIN Tests

on:
  pull_request:
    paths:
      - 'packages/bioskin/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm --filter @aibos/bioskin test:coverage
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: packages/bioskin/coverage/lcov.info
```

---

## Quality Gates

### PR Merge Requirements

- [ ] All tests pass (`pnpm test`)
- [ ] Coverage meets minimum thresholds
- [ ] No accessibility violations
- [ ] Type check passes (`pnpm type-check`)
- [ ] New components have corresponding tests

### Component Release Checklist

| Requirement | Description |
|-------------|-------------|
| ✅ Unit Tests | All utils/logic tested |
| ✅ Component Tests | All variants rendered |
| ✅ Props Tests | All props have test coverage |
| ✅ A11y Tests | Role, label, aria attributes |
| ✅ Integration | Works with other components |

---

## Technology Stack

| Tool | Purpose | Version |
|------|---------|---------|
| **Vitest** | Test runner | ^4.0.15 |
| **@vitest/browser-playwright** | Browser provider | ^4.0.15 |
| **@testing-library/react** | Component queries | ^16.3.0 |
| **@testing-library/jest-dom** | Custom matchers | ^6.9.1 |
| **Playwright** | Browser automation | ^1.57.0 |

---

## Appendix: Current Test Status

```
 ✓ |bioskin (chromium)| __tests__/bioskin.test.tsx (18 tests) 123ms

 Test Files  1 passed (1)
      Tests  18 passed (18)
   Duration  2.07s
```

**Last Run:** 2024-12-16

---

## References

- [Vitest Browser Mode](https://vitest.dev/guide/browser/)
- [Playwright Integration](https://vitest.dev/guide/browser/playwright)
- [Testing Library React](https://testing-library.com/docs/react-testing-library/intro/)
- CONT_10 BioSkin Architecture v2.1
