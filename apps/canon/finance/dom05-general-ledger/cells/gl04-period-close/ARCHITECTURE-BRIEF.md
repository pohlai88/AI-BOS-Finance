# GL-04 Period Close — Architecture Brief

> **Cell Code:** GL-04  
> **Domain:** General Ledger (DOM-05)  
> **Status:** 🟢 **PRD COMPLETE** — Ready for Implementation  
> **Date:** 2025-12-17

---

## 1. Purpose

GL-04 manages the **fiscal period lifecycle** — opening, soft close, hard close, and controlled reopen. It is the **time gate** that controls when transactions can be posted.

---

## 2. Key Responsibilities

| Responsibility | Description |
|---------------|-------------|
| **Period Lifecycle** | OPEN → SOFT_CLOSE → HARD_CLOSE |
| **Posting Control** | Gate keeper for GL-03 posting |
| **Soft Close Checklist** | Ensure period-end tasks complete |
| **TB Snapshot** | Trigger trial balance snapshot on close |
| **Controlled Reopen** | CFO-approved reopen for corrections |

---

## 3. Dependencies

### Kernel Services Used

| Service | Port | Purpose |
|---------|------|---------|
| K_TIME | `FiscalTimePort` | Period status management |
| K_LOG | `AuditPort` | Close audit trail |
| K_AUTH | `PolicyPort` | Approval workflow |
| K_CACHE | Redis | Period status caching |

### Upstream Dependencies

| Cell | What It Provides |
|------|------------------|
| GL-03 | Posted entries count for validation |

### Downstream Consumers

| Cell | Usage |
|------|-------|
| GL-03 | Checks period status before posting |
| GL-05 | Receives TB snapshot request |

---

## 4. State Machine

```
OPEN → SOFT_CLOSE → HARD_CLOSE
                        ↓
              CONTROLLED_REOPEN → HARD_CLOSE
```

| Transition | Trigger | Approval |
|------------|---------|:--------:|
| OPEN → SOFT_CLOSE | Controller initiates | No |
| SOFT_CLOSE → HARD_CLOSE | CFO approves | Yes |
| HARD_CLOSE → CONTROLLED_REOPEN | CFO approves | Yes |
| CONTROLLED_REOPEN → HARD_CLOSE | Corrections complete | Yes |

---

## 5. File Structure

```
gl04-period-close/
├── __tests__/
│   └── PeriodCloseService.test.ts
├── ARCHITECTURE-BRIEF.md         ← This file
├── ARCHITECTURE-REVIEW.md        ← Quality gate review
├── DashboardService.ts           ← Period dashboard metrics
├── errors.ts                     ← Error factory
├── index.ts                      ← Barrel exports
├── PeriodCloseService.ts         ← Main domain service
└── PRD-gl04-period-close.md      ← Requirements ✅
```

---

## 6. Implementation Checklist

- [x] Create PRD
- [ ] Create `errors.ts` — Error factory
- [ ] Create `PeriodCloseService.ts` — Domain service
- [ ] Create `DashboardService.ts` — Dashboard metrics
- [ ] Create `index.ts` — Barrel exports
- [ ] Create `ARCHITECTURE-REVIEW.md` — Quality gate

---

**📅 Date:** 2025-12-17  
**👤 Author:** AI-BOS Architecture Team
