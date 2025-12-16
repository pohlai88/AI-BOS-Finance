# BIOSKIN Testing PRD

> **Version:** 1.0.0  
> **Status:** DRAFT  
> **Created:** 2024-12-16  
> **Derives From:** CONT_10 BioSkin Architecture v2.1

---

## Executive Summary

BIOSKIN requires **three testing layers** to ensure production safety:

| Layer | Tool | Purpose | Status |
|-------|------|---------|--------|
| **L1: Unit/Component** | Vitest Browser Mode | Logic + rendering | ✅ 18 tests |
| **L2: E2E (User Flows)** | Playwright | Critical paths | 🔴 TODO |
| **L3: Performance/Stress** | Lighthouse CI + k6 + Harness | Perf budgets | 🔴 TODO |

---

## Layer 1: Unit/Component Testing ✅ COMPLETE

### Current Status
- **18 tests passing** in real Chromium browser
- Vitest Browser Mode + Playwright provider
- React Testing Library for queries

### Coverage Targets

| Metric | Minimum | Target | Current |
|--------|---------|--------|---------|
| Line Coverage | 70% | 85% | 🔄 TBD |
| Branch Coverage | 60% | 75% | 🔄 TBD |
| Function Coverage | 80% | 90% | 🔄 TBD |

### Test Categories

| Category | Tests | Status |
|----------|-------|--------|
| `cn()` utility | 3 | ✅ |
| `introspectZodSchema()` | 4 | ✅ |
| `Spinner` (8 variants) | 5 | ✅ |
| `StatusBadge` (states) | 4 | ✅ |
| Integration | 2 | ✅ |

### Commands
```bash
pnpm --filter @aibos/bioskin test           # Run all
pnpm --filter @aibos/bioskin test:coverage  # With coverage
pnpm --filter @aibos/bioskin test:headed    # See browser
```

---

## Layer 2: E2E Testing (User Flows) 🔴 TODO

### Critical User Flows to Test

| Flow | Description | Priority |
|------|-------------|----------|
| **BioTable Filter** | Search → results update → clear | P0 |
| **BioTable Sort** | Click header → sort asc/desc | P0 |
| **BioTable Pagination** | Navigate pages → state persists | P0 |
| **BioTable Selection** | Select rows → bulk action | P1 |
| **BioForm Submit** | Fill → validate → submit → success | P0 |
| **BioForm Validation** | Invalid input → error shown → fix → clear | P0 |
| **BioForm Cancel** | Fill → cancel → confirm reset | P1 |
| **MotionEffect** | Animations complete without jank | P2 |

### E2E Test Structure

```
packages/bioskin/
├── e2e/
│   ├── biotable.spec.ts      # Table user flows
│   ├── bioform.spec.ts       # Form user flows
│   └── accessibility.spec.ts # A11y audit
└── playwright.config.ts
```

### Acceptance Criteria

- [ ] All P0 flows pass
- [ ] No accessibility violations (axe-core)
- [ ] Tests run in CI on every PR
- [ ] Test duration < 60 seconds

---

## Layer 3: Performance/Stress Testing 🔴 TODO

### 3.1 UI Performance Stress (BioTable)

#### Test Scenarios

| Scenario | Rows | Expected | Budget |
|----------|------|----------|--------|
| **Normal Load** | 100 | Instant render | < 100ms |
| **Medium Load** | 1,000 | Smooth render | < 300ms |
| **Heavy Load** | 10,000 | With virtualization | < 500ms |
| **Extreme Load** | 50,000 | Graceful degradation | < 2s |

#### Stress Operations

| Operation | Test | Budget |
|-----------|------|--------|
| **Filter Typing** | Type 10 chars rapidly | No jank, < 50ms/keystroke |
| **Sort Toggle** | Click sort 20x rapidly | < 100ms per sort |
| **Pagination** | Navigate 50 pages | < 50ms per page |
| **Select All** | Select 10k rows | < 500ms |

### 3.2 Memory Leak Detection

| Component | Test | Pass Criteria |
|-----------|------|---------------|
| **BioTable** | Mount/unmount 100x | Heap growth < 10MB |
| **BioForm** | Mount/unmount 100x | Heap growth < 5MB |
| **DetailSheet** | Open/close 200x | Heap growth < 5MB |
| **MotionEffect** | Animate 1000x | No orphaned listeners |

### 3.3 Lighthouse CI Budgets

#### Performance Budgets (Desktop)

| Metric | Budget | Threshold |
|--------|--------|-----------|
| **LCP** | < 2.5s | Error if > 4s |
| **FID/INP** | < 100ms | Error if > 300ms |
| **CLS** | < 0.1 | Error if > 0.25 |
| **TTI** | < 3.5s | Error if > 7s |
| **Total Blocking Time** | < 300ms | Error if > 600ms |

#### Pages to Audit

| Page | Priority |
|------|----------|
| `/payments/bio-demo` | P0 |
| `/payments` (production) | P0 |
| `/meta-registry` | P1 |

### 3.4 API Load Testing (k6)

#### Endpoints to Test

| Endpoint | Method | Target RPS | P95 Latency |
|----------|--------|------------|-------------|
| `/api/payments` | GET | 100 | < 200ms |
| `/api/payments?filter=*` | GET | 50 | < 300ms |
| `/api/payments/[id]` | GET | 200 | < 100ms |

#### Load Profiles

```javascript
// k6 load profile
export const options = {
  scenarios: {
    // Ramp up: 0 → 100 users over 2 min
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 0 },
      ],
    },
    // Spike: 0 → 500 users instantly
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 500 },
        { duration: '1m', target: 500 },
        { duration: '10s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
  },
};
```

---

## Implementation Plan

### Sprint 5: E2E Tests (Days 16-18)

| Day | Task | Deliverable |
|-----|------|-------------|
| 16 | Setup Playwright for bioskin | `playwright.config.ts` |
| 17 | Write BioTable E2E flows | `biotable.spec.ts` |
| 18 | Write BioForm E2E + a11y | `bioform.spec.ts` |

**Exit Gate:**
- [ ] 8+ E2E tests passing
- [ ] Zero a11y violations
- [ ] CI integration working

### Sprint 6: Performance Testing (Days 19-22)

| Day | Task | Deliverable |
|-----|------|-------------|
| 19 | Create UI Stress Harness page | `/payments/bio-stress` |
| 20 | BioTable stress tests (10k rows) | Metrics captured |
| 21 | Memory leak tests | Heap snapshots |
| 22 | Lighthouse CI setup | Budget thresholds |

**Exit Gate:**
- [ ] BioTable handles 10k rows < 500ms
- [ ] No memory leaks detected
- [ ] Lighthouse scores > 90

### Sprint 7: Load Testing (Days 23-25)

| Day | Task | Deliverable |
|-----|------|-------------|
| 23 | Setup k6 scripts | `load-tests/` |
| 24 | Run load tests against staging | Results documented |
| 25 | Document baseline + thresholds | `PERFORMANCE.md` |

**Exit Gate:**
- [ ] API handles 100 RPS with P95 < 300ms
- [ ] Spike test passes (500 users)
- [ ] All thresholds documented

---

## Testing Infrastructure

### Required Tools

| Tool | Purpose | Install |
|------|---------|---------|
| Vitest | Unit/Component | ✅ Installed |
| Playwright | E2E | ✅ Installed |
| Lighthouse CI | Performance audit | `npm i -g @lhci/cli` |
| k6 | API load testing | `brew install k6` |

### CI Pipeline

```yaml
# .github/workflows/bioskin-test.yml
name: BIOSKIN Test Suite

on:
  pull_request:
    paths:
      - 'packages/bioskin/**'

jobs:
  # Layer 1: Unit/Component
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm --filter @aibos/bioskin test:coverage

  # Layer 2: E2E
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm --filter @aibos/bioskin e2e

  # Layer 3: Lighthouse
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install && pnpm build
      - run: lhci autorun
```

---

## Quality Gates Summary

### PR Merge Requirements

| Layer | Requirement |
|-------|-------------|
| **L1** | All unit tests pass, coverage > 70% |
| **L2** | All E2E flows pass, zero a11y violations |
| **L3** | Lighthouse score > 90, no perf regressions |

### Release Requirements

| Requirement | Threshold |
|-------------|-----------|
| Unit test coverage | > 80% |
| E2E flow coverage | 100% of P0 flows |
| Lighthouse Performance | > 90 |
| BioTable 10k rows | < 500ms render |
| Memory leak test | < 10MB growth |
| API P95 latency | < 300ms at 100 RPS |

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| BioTable slow with 10k+ rows | Implement virtualization (TanStack Virtual) |
| Memory leaks in animations | Proper cleanup in useEffect |
| E2E tests flaky | Use stable selectors, retry logic |
| Lighthouse variance | Run 3x, take median |

---

## Appendix: UI Stress Harness Page

```typescript
// /payments/bio-stress/page.tsx
// Dedicated page for performance testing

export default function BioStressPage() {
  const [rowCount, setRowCount] = useState(100);
  const [metrics, setMetrics] = useState<PerfMetrics | null>(null);

  const generateData = (count: number) => {
    const start = performance.now();
    const data = Array.from({ length: count }, (_, i) => ({
      id: `${i}`,
      name: `Item ${i}`,
      // ... more fields
    }));
    const duration = performance.now() - start;
    setMetrics({ generateTime: duration });
    return data;
  };

  return (
    <div>
      <h1>BIOSKIN Stress Test</h1>
      
      {/* Row count selector */}
      <select onChange={(e) => setRowCount(Number(e.target.value))}>
        <option value={100}>100 rows</option>
        <option value={1000}>1,000 rows</option>
        <option value={10000}>10,000 rows</option>
        <option value={50000}>50,000 rows</option>
      </select>

      {/* Metrics display */}
      {metrics && (
        <div>
          <p>Generate time: {metrics.generateTime}ms</p>
          <p>Render time: {metrics.renderTime}ms</p>
        </div>
      )}

      {/* Stressed BioTable */}
      <BioTable
        schema={StressSchema}
        data={generateData(rowCount)}
        enableSorting
        enableFiltering
        enablePagination
      />
    </div>
  );
}
```

---

**Status:** DRAFT — Awaiting approval before implementation

**Next Step:** Review and approve, then begin Sprint 5 (E2E Tests)
