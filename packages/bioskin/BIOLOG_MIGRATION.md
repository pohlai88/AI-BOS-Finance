# BioLogger Migration Guide

## Summary

BioLogger has been added as **Layer 6** of the IMMORTAL Strategy to replace `console.log` with production-ready logging.

---

## What Was Created

| File | Purpose |
|------|---------|
| `packages/bioskin/src/utils/BioLogger.ts` | Main logger implementation |
| `packages/bioskin/src/utils/index.ts` | Export utilities |
| `packages/canon/C-DataLogic/C-CONST/CONST_03_BioLogger.md` | Official contract (Canon) |
| `packages/canon/E-Knowledge/E-SPEC/IMMORTAL_STRATEGY.md` | Updated with Layer 6 |

---

## Quick Start

```typescript
import { bioLog } from '@aibos/bioskin';

// Replace console.log
bioLog.debug('Processing payment', { paymentId: '123' });

// Replace console.warn
bioLog.warn('Retrying request', { attempt: 2 });

// Replace console.error
bioLog.error('Payment failed', { error: err.message });
```

---

## Benefits

| Issue | Before (`console.log`) | After (`bioLog`) |
|-------|------------------------|------------------|
| **Production** | ❌ Always visible | ✅ Only warn/error visible |
| **Performance** | ❌ Always executes | ✅ Zero overhead for debug/info |
| **Structure** | ❌ Unstructured strings | ✅ Typed context objects |
| **Integrations** | ❌ None | ✅ Sentry, LogRocket ready |
| **Security** | ❌ Exposes internal data | ✅ Level-based filtering |

---

## Migration Cheatsheet

```typescript
// OLD: console.log
console.log('User logged in', user);
console.log('Processing order:', orderId);
console.warn('Deprecated API used');
console.error('Failed to save', error);

// NEW: bioLog
bioLog.debug('User logged in', { userId: user.id });
bioLog.info('Processing order', { orderId });
bioLog.warn('Deprecated API used', { api: '/old-endpoint' });
bioLog.error('Failed to save', { error: error.message });
```

---

## Component-Specific Logger

```typescript
// Create once per component
const log = bioLog.child({ component: 'BioTable' });

// All logs include { component: 'BioTable' } automatically
log.debug('Rendering rows', { count: 100 });
log.error('Sort failed', { column: 'name' });
```

---

## Production Integration (Sentry)

```typescript
// In your app startup (e.g., _app.tsx or layout.tsx)
import * as Sentry from '@sentry/nextjs';
import { bioLog, createSentryHandler } from '@aibos/bioskin';

bioLog.configure({
  handler: createSentryHandler(Sentry),
});

// Now all errors/warnings automatically go to Sentry
bioLog.error('Payment failed', { orderId: '123' }); // → Sentry
```

---

## Current Status

From the deep scan:
- **51 console.log** statements detected
- **Most are acceptable** (MCP tools, CLI scripts, export utilities)
- **~5-10 in UI components** should be migrated

---

## Next Steps

1. ✅ **BioLogger created** (CONST_03)
2. ✅ **Added to IMMORTAL Strategy** (Layer 6)
3. ⏳ **Optional: Auto-migration script** (replace console.log → bioLog)
4. ⏳ **Optional: Sentry integration** (configure handler)

---

## Documentation

- **Contract:** `packages/canon/C-DataLogic/C-CONST/CONST_03_BioLogger.md`
- **Implementation:** `packages/bioskin/src/utils/BioLogger.ts`
- **Strategy:** `packages/canon/E-Knowledge/E-SPEC/IMMORTAL_STRATEGY.md`

---

## IMMORTAL Strategy - Now 6 Layers

```
Layer 6: BioLogger         → Production-ready logging
Layer 5: Knowledge Contract → Defines NORMAL
Layer 4: BioSkin MCP        → AI-powered auditing
Layer 3: Build Validation   → Prevents bad deploys
Layer 2: Runtime Guard      → Catches issues at runtime
Layer 1: Theme Contract     → Single source of truth
```

**Your BioSkin system is now fully protected!** 🧬
