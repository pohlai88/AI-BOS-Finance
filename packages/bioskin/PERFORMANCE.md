# BioSkin Performance Optimization Guide

> **For Consumer Applications** — Best practices for using BioSkin in production Next.js apps.

---

## Quick Reference

| Technique | Impact | Effort | When to Use |
|-----------|--------|--------|-------------|
| Dynamic imports | 🔥 High | Low | Heavy components (Chart, Gantt, Kanban) |
| Suspense boundaries | 🔥 High | Low | Data-dependent components |
| Virtualization | 🔥 High | Medium | Large lists (1000+ items) |
| next/image | Medium | Low | User avatars, thumbnails |
| Memoization | Medium | Low | Custom wrappers around BioSkin |

---

## 1. Dynamic Imports (Code Splitting)

Heavy BioSkin components should be dynamically imported to reduce initial bundle size.

### Recommended: Create Lazy Wrappers

```typescript
// components/lazy/index.ts
import dynamic from 'next/dynamic';
import { LoadingState } from '@aibos/bioskin';

// 🎯 Charts - ~15KB, rarely needed on initial load
export const LazyBioChart = dynamic(
  () => import('@aibos/bioskin').then(m => m.BioChart),
  { loading: () => <LoadingState message="Loading chart..." />, ssr: false }
);

// 🎯 Gantt - ~12KB, project management only
export const LazyBioGantt = dynamic(
  () => import('@aibos/bioskin').then(m => m.BioGantt),
  { loading: () => <LoadingState message="Loading timeline..." />, ssr: false }
);

// 🎯 Kanban - ~20KB (@dnd-kit), task boards only
export const LazyBioKanban = dynamic(
  () => import('@aibos/bioskin').then(m => m.BioKanban),
  { loading: () => <LoadingState message="Loading board..." /> }
);

// 🎯 Calendar - ~10KB, scheduling pages only
export const LazyBioCalendar = dynamic(
  () => import('@aibos/bioskin').then(m => m.BioCalendar),
  { loading: () => <LoadingState message="Loading calendar..." /> }
);

// 🎯 Table - ~25KB (@tanstack/react-table), most common
// Consider NOT lazy-loading if tables are on most pages
export const LazyBioTable = dynamic(
  () => import('@aibos/bioskin').then(m => m.BioTable),
  { loading: () => <LoadingState message="Loading data..." /> }
);

// 🎯 Command Palette - ~8KB (cmdk), load on demand
export const LazyBioCommandPalette = dynamic(
  () => import('@aibos/bioskin').then(m => m.BioCommandPalette),
  { ssr: false }
);
```

### Usage in Pages

```tsx
// app/analytics/page.tsx
import { LazyBioChart } from '@/components/lazy';

export default function AnalyticsPage() {
  return (
    <div>
      <h1>Analytics Dashboard</h1>
      <LazyBioChart type="bar" data={chartData} />
    </div>
  );
}
```

---

## 2. Suspense Boundaries

Wrap data-dependent sections in Suspense for streaming SSR.

### Pattern: Data + UI Separation

```tsx
// app/payments/page.tsx
import { Suspense } from 'react';
import { LoadingState } from '@aibos/bioskin';

// Server Component - fetches data
async function PaymentsTable() {
  const payments = await fetchPayments(); // Server-side fetch
  return <BioTable schema={PaymentSchema} data={payments} />;
}

// Page with Suspense boundary
export default function PaymentsPage() {
  return (
    <div>
      <h1>Payments</h1>
      <Suspense fallback={<LoadingState message="Loading payments..." />}>
        <PaymentsTable />
      </Suspense>
    </div>
  );
}
```

### Multiple Suspense Zones

```tsx
export default function DashboardPage() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Suspense fallback={<LoadingState />}>
        <RevenueChart />
      </Suspense>
      
      <Suspense fallback={<LoadingState />}>
        <RecentTransactions />
      </Suspense>
      
      <Suspense fallback={<LoadingState />}>
        <TasksKanban />
      </Suspense>
      
      <Suspense fallback={<LoadingState />}>
        <UpcomingEvents />
      </Suspense>
    </div>
  );
}
```

---

## 3. Virtualization for Large Data

BioSkin provides `BioTableVirtual` for tables with 1000+ rows.

### When to Use Virtual Table

```tsx
// ❌ Regular table - renders all rows (slow for 1000+)
<BioTable schema={schema} data={largeDataset} />

// ✅ Virtual table - only renders visible rows
import { BioTableVirtual } from '@aibos/bioskin';

<BioTableVirtual
  schema={schema}
  data={largeDataset}  // 10k+ rows OK
  height={600}         // Container height in px
  rowHeight={48}       // Row height for calculations
/>
```

### Decision Matrix

| Row Count | Component | Notes |
|-----------|-----------|-------|
| < 100 | `BioTable` | No optimization needed |
| 100-500 | `BioTable` with pagination | Set `pageSize={50}` |
| 500-1000 | `BioTable` with pagination | Set `pageSize={25}` |
| 1000+ | `BioTableVirtual` | Virtual scrolling |

---

## 4. Image Optimization

For user avatars and thumbnails in BioSkin components.

### BioNavbar with Optimized Avatar

```tsx
import Image from 'next/image';
import { BioNavbar } from '@aibos/bioskin';

// Custom avatar component using next/image
function OptimizedAvatar({ user }) {
  return (
    <Image
      src={user.avatar}
      alt={user.name}
      width={32}
      height={32}
      className="rounded-full"
      placeholder="blur"
      blurDataURL={user.avatarBlur} // Optional: base64 blur
    />
  );
}

// Usage in BioNavbar
<BioNavbar
  user={{
    name: "John Doe",
    avatar: <OptimizedAvatar user={user} />, // Pass as ReactNode
    role: "Admin"
  }}
/>
```

---

## 5. Memoization for Custom Wrappers

If you create wrapper components around BioSkin, use memoization.

### ❌ Bad: Wrapper Without Memo

```tsx
// Re-renders on every parent render
function PaymentTable({ payments }) {
  return (
    <BioTable
      schema={PaymentSchema}
      data={payments}
      onRowClick={handleClick}
    />
  );
}
```

### ✅ Good: Memoized Wrapper

```tsx
import { memo, useCallback, useMemo } from 'react';

const PaymentTable = memo(function PaymentTable({ payments, onSelect }) {
  // Memoize callbacks
  const handleRowClick = useCallback((row) => {
    onSelect(row.id);
  }, [onSelect]);

  // Memoize expensive transformations
  const sortedPayments = useMemo(
    () => payments.sort((a, b) => b.amount - a.amount),
    [payments]
  );

  return (
    <BioTable
      schema={PaymentSchema}
      data={sortedPayments}
      onRowClick={handleRowClick}
    />
  );
});
```

---

## 6. Bundle Analysis

Analyze your bundle to identify optimization opportunities.

### Setup

```bash
# Install analyzer
pnpm add -D @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // your config
});

# Run analysis
ANALYZE=true pnpm build
```

### What to Look For

| Bundle Section | Target Size | Action if Exceeded |
|---------------|-------------|-------------------|
| First Load JS | < 100KB | Dynamic imports |
| Shared chunks | < 50KB | Check for duplicates |
| Individual pages | < 50KB | Code split components |

---

## 7. Performance Checklist

Before deploying to production:

### ✅ Critical Path

- [ ] Heavy components (Chart, Gantt, Kanban) are dynamically imported
- [ ] Data-fetching sections wrapped in Suspense
- [ ] Tables with 1000+ rows use BioTableVirtual
- [ ] Images use next/image

### ✅ Optimization

- [ ] Custom wrappers are memoized
- [ ] Callbacks passed to BioSkin use useCallback
- [ ] Data transformations use useMemo
- [ ] Bundle analyzed for bloat

### ✅ Monitoring

- [ ] Core Web Vitals tracked (LCP, FID, CLS)
- [ ] React DevTools Profiler used in development
- [ ] Lighthouse scores > 90

---

## 8. Component-Specific Tips

### BioTable

```tsx
// ✅ Good: Stable schema reference
const schema = useMemo(() => PaymentSchema, []);

// ✅ Good: Memoize row click handler
const handleRowClick = useCallback((row) => {
  router.push(`/payments/${row.id}`);
}, [router]);

<BioTable
  schema={schema}
  data={payments}
  onRowClick={handleRowClick}
  pageSize={25}  // Limit visible rows
/>
```

### BioKanban

```tsx
// ✅ Good: Memoize card move handler
const handleCardMove = useCallback((cardId, fromColumn, toColumn) => {
  // Optimistic update
  updateCardColumn(cardId, toColumn);
}, []);

<BioKanban
  columns={columns}
  cards={cards}
  onCardMove={handleCardMove}
/>
```

### BioChart

```tsx
// ✅ Good: Memoize chart data transformation
const chartData = useMemo(() => 
  rawData.map(d => ({ label: d.month, value: d.revenue })),
  [rawData]
);

// ✅ Good: Lazy load charts
const LazyChart = dynamic(() => import('@aibos/bioskin').then(m => m.BioChart), {
  ssr: false,
  loading: () => <Skeleton className="h-64" />
});

<LazyChart type="bar" data={chartData} />
```

---

## Need Help?

- **Component JSDoc**: Hover over any BioSkin component in your IDE for optimization hints
- **Audit Document**: See `packages/bioskin/__tests__/REACT_OPTIMIZATION_AUDIT.md`
- **Tests**: Run `npm test` in bioskin package to verify everything works

