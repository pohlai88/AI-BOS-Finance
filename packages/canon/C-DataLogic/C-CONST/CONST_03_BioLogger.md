# CONST_03: BioLogger Contract

> **Canon ID:** CONST_03
> **Version:** 1.0.0
> **Status:** Active
> **Layer:** C-DataLogic (Constants)

---

## Purpose

BioLogger replaces `console.log` with a production-ready, environment-aware logging system.

## Location

```
packages/bioskin/src/utils/BioLogger.ts
```

## Core Principles

### 1. Environment-Aware Logging

| Environment | Default Level | Visible Logs |
|-------------|---------------|--------------|
| `development` | `debug` | debug, info, warn, error |
| `production` | `warn` | warn, error only |
| `test` | `warn` | warn, error only |

### 2. Zero Production Overhead

```typescript
// In production, this is a no-op (zero overhead)
bioLog.debug('Processing item', { itemId: 123 });

// These still work in production
bioLog.warn('Retrying request', { attempt: 2 });
bioLog.error('Payment failed', { orderId: '456' });
```

### 3. Structured Context

```typescript
// ❌ Bad: Unstructured string concatenation
console.log('User ' + userId + ' created order ' + orderId);

// ✅ Good: Structured context object
bioLog.info('Order created', { userId, orderId, amount });
```

---

## Log Levels

| Level | Priority | Use Case | Production |
|-------|----------|----------|------------|
| `debug` | 0 | Detailed debugging, variable inspection | ❌ Hidden |
| `info` | 1 | Important events, state changes | ❌ Hidden |
| `warn` | 2 | Recoverable issues, deprecations | ✅ Visible |
| `error` | 3 | Failures, exceptions, critical issues | ✅ Visible |
| `silent` | 999 | Disable all logging | - |

---

## API Reference

### Basic Logging

```typescript
import { bioLog } from '@aibos/bioskin';

bioLog.debug('Debug message', { data });
bioLog.info('Info message', { data });
bioLog.warn('Warning message', { data });
bioLog.error('Error message', { error: err.message });
```

### Component Logger (Child)

```typescript
// Create a logger with preset context
const log = bioLog.child({ component: 'BioTable' });

log.debug('Rendering');     // Includes { component: 'BioTable' }
log.error('Sort failed');   // Includes { component: 'BioTable' }
```

### Performance Timing

```typescript
// Sync timing (dev only)
const result = bioLog.time('Heavy calculation', () => {
  return expensiveOperation();
});

// Async timing (dev only)
const data = await bioLog.timeAsync('API call', () => fetch('/api'));
```

### Grouping

```typescript
bioLog.group('Payment Flow', () => {
  bioLog.debug('Step 1: Validate');
  bioLog.debug('Step 2: Process');
  bioLog.debug('Step 3: Confirm');
});
```

### Assertions

```typescript
bioLog.assert(user !== null, 'User must exist', { userId });
```

---

## Configuration

```typescript
import { bioLog } from '@aibos/bioskin';

// Configure at app startup
bioLog.configure({
  level: 'debug',           // Minimum level
  console: true,            // Enable console output
  prefix: '🧬 BioSkin',     // Log prefix
  handler: customHandler,   // External integration
});
```

---

## Integrations

### Sentry

```typescript
import * as Sentry from '@sentry/nextjs';
import { bioLog, createSentryHandler } from '@aibos/bioskin';

bioLog.configure({
  handler: createSentryHandler(Sentry),
});

// Errors and warnings now go to Sentry
bioLog.error('Payment failed', { orderId }); // → Sentry
```

### Remote Logging

```typescript
import { bioLog, createRemoteHandler } from '@aibos/bioskin';

bioLog.configure({
  handler: createRemoteHandler('/api/logs'),
});
```

---

## Migration from console.log

| Old Pattern | New Pattern |
|-------------|-------------|
| `console.log('msg')` | `bioLog.debug('msg')` |
| `console.log('msg', data)` | `bioLog.debug('msg', { data })` |
| `console.warn('msg')` | `bioLog.warn('msg')` |
| `console.error('msg', err)` | `bioLog.error('msg', { error: err.message })` |
| `console.log('TODO:...')` | Remove or `bioLog.debug('TODO:...')` |

---

## Exceptions (Where console IS allowed)

| Context | Allowed? | Reason |
|---------|----------|--------|
| CLI Tools (MCP, Scripts) | ✅ | Output is intentional, runs in Node |
| Error Boundaries | ✅ | Must log for debugging |
| Build Scripts | ✅ | Not bundled to client |
| UI Components | ❌ | Use bioLog instead |

---

## Output Format

```
🧬 BioSkin 🔍 [DEBUG] Processing item { itemId: 123 }
🧬 BioSkin ℹ️ [INFO] Order created { userId: 'u1', amount: 100 }
🧬 BioSkin ⚠️ [WARN] Retrying request { attempt: 2 }
🧬 BioSkin ❌ [ERROR] Payment failed { error: 'Insufficient funds' }
```

---

## Benefits

| Issue | `console.log` | `bioLog` |
|-------|---------------|----------|
| Production visibility | ❌ Always visible | ✅ Filtered by level |
| Performance | ❌ Always executes | ✅ Zero overhead in prod |
| Structure | ❌ Unstructured strings | ✅ Typed context objects |
| Integrations | ❌ None | ✅ Sentry, LogRocket, etc. |
| Security | ❌ Exposes data | ✅ Level-based filtering |
| Searchability | ❌ Grep strings | ✅ JSON structured |

---

## Related Documents

- `IMMORTAL_STRATEGY.md` - Overall UI/UX defense system
- `BioSkinKnowledgeContract.ts` - Anti-pattern definitions
- `TOOL_12_BioSkinDeepScan.ts` - Detects console.log usage
