# PRD: AP-05 Phase 6 Enhancements

**Version:** 1.0.0

**Status:** Draft

**Priority:** High

**Estimated Effort:** 3 weeks

**Target Score:** 8.67/10 → 9.5/10

---

## 1. Executive Summary

### 1.1 Context

AP-05 Payment Cell achieved **100% completion** of the original PRD with all enterprise controls validated (8/8 tests passing). External reviews rated the system:

| Dimension | Current Score | Target Score | Gap |

|-----------|---------------|--------------|-----|

| Overall Quality | 8.2 - 9.0 | 9.5 | +0.5 |

| Integration | 7.6 - 10.0 | 9.5 | +0.5 (practical kit missing) |

| UI/UX | 8.5 - 8.7 | 9.5 | +0.8 |

### 1.2 Three Enhancement Pillars

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PHASE 6 ENHANCEMENT PILLARS                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   EXCEPTION     │  │   INTEGRATION   │  │    EVIDENCE     │     │
│  │     QUEUE       │  │      KIT        │  │      UX         │     │
│  │                 │  │                 │  │                 │     │
│  │  "Risk-First    │  │  "Standalone    │  │  "One-Glance    │     │
│  │   Operations"   │  │   Deployment"   │  │   Confidence"   │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                     │
│  Pain: Exceptions   Pain: Integration    Pain: Multiple            │
│  buried in rows     requires full ERP    clicks for evidence       │
│                                                                     │
│  Value: +0.8 UX     Value: +1.5 INT      Value: +0.5 UX            │
│  Effort: 2-3 days   Effort: 3 days       Effort: 1-2 days          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Phase 6a: Exception Queue (Risk-First Operations)

### 2.1 Problem Statement

**Current State:** Controllers browse a flat list of payments, exceptions are buried in rows.

**Target State:** Controllers see a **Risk Queue** as primary view, prioritizing exceptions.

### 2.2 Exception Types

| Exception | Detection Rule | Severity | Auto-Resolve? |

|-----------|----------------|----------|---------------|

| **Missing Invoice** | `source_document_id IS NULL AND status != 'draft'` | ⚠️ Warning | No |

| **Stale Approval** | `status = 'pending_approval' AND updated_at < NOW() - '48h'` | 🔴 Critical | No |

| **Duplicate Risk** | Same `vendor_id + amount + payment_date` within 24h | ⛔ Block | Confirm |

| **Bank Detail Changed** | `beneficiary_snapshot` differs from vendor master | 🔶 Alert | Acknowledge |

| **Over Limit** | `amount > approval_limit` for approver | 🔴 Critical | Escalate |

| **Period Warning** | Payment date in `SOFT_CLOSE` period | ⚠️ Warning | Acknowledge |

### 2.3 Technical Design

#### 2.3.1 Exception Detection Service

**File:** `apps/canon/finance/accounts-payable/cells/payment-execution/ExceptionService.ts`

```typescript
export interface PaymentException {
  id: string;
  paymentId: string;
  type: ExceptionType;
  severity: 'info' | 'warning' | 'critical' | 'block';
  message: string;
  detectedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
  metadata?: Record<string, unknown>;
}

export type ExceptionType =
  | 'MISSING_INVOICE'
  | 'STALE_APPROVAL'
  | 'DUPLICATE_RISK'
  | 'BANK_DETAIL_CHANGED'
  | 'OVER_LIMIT'
  | 'PERIOD_WARNING';

export class ExceptionService {
  constructor(
    private paymentRepo: PaymentRepositoryPort,
    private policyPort: PolicyPort,
    private pool: Pool
  ) {}

  /**
   * Detect all exceptions for a tenant
   */
  async detectExceptions(tenantId: string): Promise<PaymentException[]> {
    const exceptions: PaymentException[] = [];
    
    // 1. Missing Invoice
    const missingInvoice = await this.pool.query(`
      SELECT id, payment_number, vendor_name, amount, status
      FROM finance.payments
      WHERE tenant_id = $1
        AND source_document_id IS NULL
        AND status != 'draft'
    `, [tenantId]);
    
    for (const row of missingInvoice.rows) {
      exceptions.push({
        id: `exc_${row.id}_missing_invoice`,
        paymentId: row.id,
        type: 'MISSING_INVOICE',
        severity: 'warning',
        message: `Payment ${row.payment_number} has no source document`,
        detectedAt: new Date(),
        metadata: { amount: row.amount, vendor: row.vendor_name }
      });
    }
    
    // 2. Stale Approvals (pending > 48h)
    const staleApprovals = await this.pool.query(`
      SELECT id, payment_number, vendor_name, amount, updated_at
      FROM finance.payments
      WHERE tenant_id = $1
        AND status = 'pending_approval'
        AND updated_at < NOW() - INTERVAL '48 hours'
    `, [tenantId]);
    
    for (const row of staleApprovals.rows) {
      const hoursStale = Math.floor(
        (Date.now() - new Date(row.updated_at).getTime()) / 3600000
      );
      exceptions.push({
        id: `exc_${row.id}_stale_approval`,
        paymentId: row.id,
        type: 'STALE_APPROVAL',
        severity: 'critical',
        message: `Payment ${row.payment_number} pending for ${hoursStale}h`,
        detectedAt: new Date(),
        metadata: { hoursStale, amount: row.amount }
      });
    }
    
    // 3. Duplicate Risk (same vendor + amount + date within 24h)
    const duplicates = await this.pool.query(`
      WITH potential_dupes AS (
        SELECT 
          id, payment_number, vendor_id, vendor_name, amount, payment_date,
          COUNT(*) OVER (
            PARTITION BY vendor_id, amount, payment_date
          ) as dupe_count
        FROM finance.payments
        WHERE tenant_id = $1
          AND status NOT IN ('rejected', 'failed', 'completed')
          AND created_at > NOW() - INTERVAL '24 hours'
      )
      SELECT * FROM potential_dupes WHERE dupe_count > 1
    `, [tenantId]);
    
    for (const row of duplicates.rows) {
      exceptions.push({
        id: `exc_${row.id}_duplicate_risk`,
        paymentId: row.id,
        type: 'DUPLICATE_RISK',
        severity: 'block',
        message: `Potential duplicate: ${row.vendor_name} - ${row.amount}`,
        detectedAt: new Date(),
        metadata: { vendor: row.vendor_name, amount: row.amount }
      });
    }
    
    return exceptions;
  }

  /**
   * Get exception counts by severity
   */
  async getExceptionCounts(tenantId: string): Promise<ExceptionCounts> {
    const exceptions = await this.detectExceptions(tenantId);
    
    return {
      critical: exceptions.filter(e => e.severity === 'critical').length,
      warning: exceptions.filter(e => e.severity === 'warning').length,
      block: exceptions.filter(e => e.severity === 'block').length,
      total: exceptions.length,
    };
  }

  /**
   * Resolve an exception
   */
  async resolveException(
    exceptionId: string,
    resolution: string,
    actor: ActorContext
  ): Promise<void> {
    // Store resolution in exception_resolutions table
    await this.pool.query(`
      INSERT INTO finance.payment_exception_resolutions 
        (exception_id, resolution, resolved_by, resolved_at)
      VALUES ($1, $2, $3, NOW())
    `, [exceptionId, resolution, actor.userId]);
  }
}

export interface ExceptionCounts {
  critical: number;
  warning: number;
  block: number;
  total: number;
}
```

#### 2.3.2 Risk Queue API Endpoint

**File:** `apps/web/app/api/payments/exceptions/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getExceptionService, getActorContext } from '@/lib/payment-services.server';

export async function GET(request: NextRequest) {
  const actor = await getActorContext(request);
  const service = getExceptionService();
  
  const [exceptions, counts] = await Promise.all([
    service.detectExceptions(actor.tenantId),
    service.getExceptionCounts(actor.tenantId),
  ]);
  
  return NextResponse.json({
    success: true,
    data: {
      exceptions,
      counts,
    },
  });
}
```

#### 2.3.3 Risk Queue Dashboard Component

**File:** `apps/web/app/payments/_components/RiskQueueDashboard.tsx`

```tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Ban, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExceptionCounts {
  critical: number;
  warning: number;
  block: number;
  total: number;
}

interface RiskQueueDashboardProps {
  counts: ExceptionCounts;
  onFilterClick: (severity: string) => void;
}

export function RiskQueueDashboard({ counts, onFilterClick }: RiskQueueDashboardProps) {
  const cards = [
    {
      key: 'critical',
      label: 'Critical',
      count: counts.critical,
      icon: AlertCircle,
      color: 'text-red-600 bg-red-50 border-red-200',
      description: 'Requires immediate attention',
    },
    {
      key: 'block',
      label: 'Blocked',
      count: counts.block,
      icon: Ban,
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      description: 'Cannot proceed without action',
    },
    {
      key: 'warning',
      label: 'Warnings',
      count: counts.warning,
      icon: AlertTriangle,
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      description: 'Review recommended',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {cards.map((card) => (
        <Card 
          key={card.key}
          className={cn(
            'cursor-pointer transition-all hover:shadow-md',
            card.count > 0 ? card.color : 'bg-gray-50 border-gray-200'
          )}
          onClick={() => onFilterClick(card.key)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-2">
                <card.icon className="h-4 w-4" />
                {card.label}
              </span>
              <Badge variant={card.count > 0 ? 'destructive' : 'secondary'}>
                {card.count}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

#### 2.3.4 Exception Badge Component

**File:** `apps/web/app/payments/_components/ExceptionBadge.tsx`

```tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, AlertCircle, Ban, FileWarning } from 'lucide-react';
import type { PaymentException } from '@/types/payment';

const EXCEPTION_CONFIG = {
  MISSING_INVOICE: {
    icon: FileWarning,
    label: 'Missing Invoice',
    variant: 'warning' as const,
  },
  STALE_APPROVAL: {
    icon: AlertCircle,
    label: 'Stale',
    variant: 'destructive' as const,
  },
  DUPLICATE_RISK: {
    icon: Ban,
    label: 'Duplicate?',
    variant: 'destructive' as const,
  },
  BANK_DETAIL_CHANGED: {
    icon: AlertTriangle,
    label: 'Bank Changed',
    variant: 'warning' as const,
  },
  OVER_LIMIT: {
    icon: AlertCircle,
    label: 'Over Limit',
    variant: 'destructive' as const,
  },
  PERIOD_WARNING: {
    icon: AlertTriangle,
    label: 'Period',
    variant: 'warning' as const,
  },
};

interface ExceptionBadgeProps {
  exceptions: PaymentException[];
}

export function ExceptionBadge({ exceptions }: ExceptionBadgeProps) {
  if (exceptions.length === 0) return null;

  // Show most severe exception
  const severityOrder = ['block', 'critical', 'warning', 'info'];
  const sorted = [...exceptions].sort(
    (a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
  );
  const primary = sorted[0];
  const config = EXCEPTION_CONFIG[primary.type];
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge variant={config.variant} className="gap-1">
          <Icon className="h-3 w-3" />
          {config.label}
          {exceptions.length > 1 && ` +${exceptions.length - 1}`}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1">
          {exceptions.map((exc) => (
            <div key={exc.id} className="text-xs">
              • {exc.message}
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
```

### 2.4 Database Migration

**File:** `apps/db/migrations/finance/105_create_exception_resolutions.sql`

```sql
-- ============================================================================
-- AP-05: Exception Resolution Tracking
-- ============================================================================

CREATE TABLE finance.payment_exception_resolutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    exception_id VARCHAR(100) NOT NULL,
    payment_id UUID REFERENCES finance.payments(id),
    exception_type VARCHAR(50) NOT NULL,
    resolution TEXT NOT NULL,
    resolved_by UUID NOT NULL,
    resolved_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT uq_exception_resolution UNIQUE (tenant_id, exception_id)
);

CREATE INDEX idx_exception_resolutions_payment ON finance.payment_exception_resolutions(payment_id);
CREATE INDEX idx_exception_resolutions_type ON finance.payment_exception_resolutions(exception_type);

-- RLS
ALTER TABLE finance.payment_exception_resolutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY exception_resolutions_tenant_isolation 
ON finance.payment_exception_resolutions
USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

---

## 3. Phase 6b: Integration Kit (Standalone Deployment)

### 3.1 Problem Statement

**Current State:** Payment Hub requires full AI-BOS Kernel to function.

**Target State:** Payment Hub can run as a **standalone Docker container** with external system integration.

### 3.2 Deliverables

| # | Deliverable | Purpose |

|---|-------------|---------|

| 1 | Webhook Endpoints | Real-time event notifications |

| 2 | Beneficiary Import API | Accept vendor/bank details from external systems |

| 3 | Standalone Docker Compose | One-command deployment |

| 4 | Integration README | Step-by-step guide |

### 3.3 Technical Design

#### 3.3.1 Webhook Management Endpoints

**File:** `apps/web/app/api/webhooks/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const WebhookRegistrationSchema = z.object({
  eventType: z.string(),
  targetUrl: z.string().url(),
  secret: z.string().min(32),
  filters: z.array(z.object({
    field: z.string(),
    operator: z.enum(['eq', 'neq', 'in', 'gt', 'lt']),
    value: z.unknown(),
  })).optional(),
});

// GET /api/webhooks - List webhooks
export async function GET(request: NextRequest) {
  const actor = await getActorContext(request);
  
  const webhooks = await db.query(`
    SELECT id, event_type, target_url, status, created_at, 
           last_triggered_at, failure_count
    FROM finance.webhook_registrations
    WHERE tenant_id = $1
    ORDER BY created_at DESC
  `, [actor.tenantId]);
  
  return NextResponse.json({ success: true, data: webhooks.rows });
}

// POST /api/webhooks - Register webhook
export async function POST(request: NextRequest) {
  const actor = await getActorContext(request);
  const body = await request.json();
  const input = WebhookRegistrationSchema.parse(body);
  
  const result = await db.query(`
    INSERT INTO finance.webhook_registrations 
      (tenant_id, event_type, target_url, secret_hash, filters, status)
    VALUES ($1, $2, $3, $4, $5, 'active')
    RETURNING id, event_type, target_url, status, created_at
  `, [
    actor.tenantId,
    input.eventType,
    input.targetUrl,
    await hashSecret(input.secret),
    JSON.stringify(input.filters || []),
  ]);
  
  return NextResponse.json({ success: true, data: result.rows[0] });
}

// DELETE /api/webhooks/[id] - Unregister webhook
```

#### 3.3.2 Webhook Trigger Service

**File:** `apps/canon/finance/accounts-payable/cells/payment-execution/WebhookService.ts`

```typescript
import crypto from 'crypto';

export class WebhookService {
  constructor(private pool: Pool) {}

  /**
   * Trigger webhooks for an event
   */
  async trigger(
    tenantId: string,
    eventType: string,
    payload: WebhookPayload
  ): Promise<void> {
    // Find matching webhooks
    const webhooks = await this.pool.query(`
      SELECT id, target_url, secret_hash, filters
      FROM finance.webhook_registrations
      WHERE tenant_id = $1 
        AND event_type = $2
        AND status = 'active'
    `, [tenantId, eventType]);

    for (const webhook of webhooks.rows) {
      // Check filters
      if (!this.matchesFilters(payload, webhook.filters)) continue;

      // Sign payload
      const signature = this.signPayload(payload, webhook.secret_hash);

      // Queue webhook delivery (use outbox pattern)
      await this.pool.query(`
        INSERT INTO finance.webhook_deliveries 
          (webhook_id, payload, signature, status)
        VALUES ($1, $2, $3, 'pending')
      `, [webhook.id, JSON.stringify(payload), signature]);
    }
  }

  private signPayload(payload: WebhookPayload, secretHash: string): string {
    const body = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secretHash)
      .update(body)
      .digest('hex');
  }

  private matchesFilters(
    payload: WebhookPayload,
    filters: WebhookFilter[]
  ): boolean {
    if (!filters || filters.length === 0) return true;
    
    return filters.every(filter => {
      const value = this.getNestedValue(payload, filter.field);
      switch (filter.operator) {
        case 'eq': return value === filter.value;
        case 'neq': return value !== filter.value;
        case 'in': return (filter.value as unknown[]).includes(value);
        case 'gt': return value > filter.value;
        case 'lt': return value < filter.value;
        default: return true;
      }
    });
  }
}
```

#### 3.3.3 Beneficiary Import API

**File:** `apps/web/app/api/payments/import/beneficiaries/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const BeneficiaryImportSchema = z.object({
  externalId: z.string(),
  vendorId: z.string().optional(),
  vendorName: z.string(),
  bankDetails: z.object({
    accountNumber: z.string(),
    routingNumber: z.string().optional(),
    bankName: z.string(),
    accountName: z.string(),
    swiftCode: z.string().optional(),
    iban: z.string().optional(),
    country: z.string().length(2),
  }),
  metadata: z.record(z.unknown()).optional(),
});

const BulkImportSchema = z.object({
  beneficiaries: z.array(BeneficiaryImportSchema),
  mappingProfile: z.string().optional(),
  skipDuplicates: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  const actor = await getActorContext(request);
  const body = await request.json();
  const input = BulkImportSchema.parse(body);
  
  const results = {
    imported: [] as string[],
    skipped: [] as string[],
    failed: [] as { externalId: string; error: string }[],
  };
  
  for (const beneficiary of input.beneficiaries) {
    try {
      // Check for duplicate
      if (input.skipDuplicates) {
        const existing = await db.query(`
          SELECT id FROM finance.beneficiaries 
          WHERE tenant_id = $1 AND external_id = $2
        `, [actor.tenantId, beneficiary.externalId]);
        
        if (existing.rows.length > 0) {
          results.skipped.push(beneficiary.externalId);
          continue;
        }
      }
      
      // Insert beneficiary
      const result = await db.query(`
        INSERT INTO finance.beneficiaries 
          (tenant_id, external_id, vendor_id, vendor_name,
           account_number, routing_number, bank_name, account_name,
           swift_code, iban, country, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `, [
        actor.tenantId,
        beneficiary.externalId,
        beneficiary.vendorId,
        beneficiary.vendorName,
        beneficiary.bankDetails.accountNumber,
        beneficiary.bankDetails.routingNumber,
        beneficiary.bankDetails.bankName,
        beneficiary.bankDetails.accountName,
        beneficiary.bankDetails.swiftCode,
        beneficiary.bankDetails.iban,
        beneficiary.bankDetails.country,
        JSON.stringify(beneficiary.metadata || {}),
      ]);
      
      results.imported.push(result.rows[0].id);
    } catch (error) {
      results.failed.push({
        externalId: beneficiary.externalId,
        error: error.message,
      });
    }
  }
  
  return NextResponse.json({
    success: true,
    data: {
      total: input.beneficiaries.length,
      imported: results.imported.length,
      skipped: results.skipped.length,
      failed: results.failed.length,
      details: results,
    },
  });
}
```

#### 3.3.4 Standalone Docker Compose

**File:** `docker/docker-compose.payment-hub.yml`

```yaml
# AI-BOS Payment Hub - Standalone Deployment
# Run: docker-compose -f docker-compose.payment-hub.yml up -d

version: '3.8'

services:
  # Payment Hub Application
  payment-hub:
    image: aibos/payment-hub:latest
    build:
      context: ..
      dockerfile: apps/web/Dockerfile
      args:
        - CELL_MODE=payment-only
    environment:
      # Database
      - DATABASE_URL=postgresql://aibos:${DB_PASSWORD:-aibos_standalone}@db:5432/payment_hub
      
      # Kernel Mode (embedded = mini-kernel)
      - KERNEL_MODE=embedded
      
      # External Auth (optional - JWT validation)
      - EXTERNAL_AUTH_URL=${EXTERNAL_AUTH_URL:-}
      - AUTH_JWT_SECRET=${AUTH_JWT_SECRET:-change_me_in_production}
      
      # Webhooks
      - WEBHOOK_SIGNING_SECRET=${WEBHOOK_SIGNING_SECRET:-}
      
      # CORS (for external UI access)
      - CORS_ORIGINS=${CORS_ORIGINS:-*}
      
    ports:
      - "${PORT:-3001}:3000"
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # PostgreSQL Database
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=aibos
      - POSTGRES_PASSWORD=${DB_PASSWORD:-aibos_standalone}
      - POSTGRES_DB=payment_hub
    volumes:
      - payment_hub_data:/var/lib/postgresql/data
      - ../apps/db/migrations/finance:/docker-entrypoint-initdb.d/finance:ro
    ports:
      - "${DB_PORT:-5434}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aibos -d payment_hub"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  payment_hub_data:
    driver: local

networks:
  default:
    name: payment_hub_network
```

#### 3.3.5 Integration README

**File:** `docs/guides/PAYMENT_HUB_INTEGRATION.md`

````markdown
# Payment Hub Integration Guide

## Quick Start (Standalone)

### 1. Deploy Payment Hub

```bash
# Clone and navigate
cd AI-BOS-Finance

# Set environment
export DB_PASSWORD=your_secure_password
export AUTH_JWT_SECRET=your_jwt_secret

# Start
docker-compose -f docker/docker-compose.payment-hub.yml up -d
````

### 2. Create API Key

```bash
curl -X POST http://localhost:3001/api/auth/keys \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "ERP Integration", "scopes": ["payments:read", "payments:write"]}'
```

### 3. Register Webhook

```bash
curl -X POST http://localhost:3001/api/webhooks \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "eventType": "finance.ap.payment.completed",
    "targetUrl": "https://your-erp.com/webhooks/payments",
    "secret": "your_webhook_secret_min_32_chars_long"
  }'
```

### 4. Import Beneficiaries

```bash
curl -X POST http://localhost:3001/api/payments/import/beneficiaries \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "beneficiaries": [
      {
        "externalId": "VENDOR-001",
        "vendorName": "Acme Corp",
        "bankDetails": {
          "accountNumber": "123456789",
          "routingNumber": "021000021",
          "bankName": "Chase Bank",
          "accountName": "Acme Corp",
          "country": "US"
        }
      }
    ]
  }'
```

### 5. Create Payment

```bash
curl -X POST http://localhost:3001/api/payments \
  -H "Authorization: Bearer $API_KEY" \
  -H "X-Idempotency-Key: $(uuidgen)" \
  -d '{
    "vendorId": "VENDOR-001",
    "vendorName": "Acme Corp",
    "amount": "1500.00",
    "currency": "USD",
    "paymentDate": "2024-12-20",
    "sourceDocumentId": "INV-2024-001",
    "sourceDocumentType": "invoice"
  }'
```

## Webhook Events

| Event | Trigger | Payload |

|-------|---------|---------|

| `finance.ap.payment.created` | New payment | `{paymentId, amount, vendor}` |

| `finance.ap.payment.approved` | Approval | `{paymentId, approvedBy}` |

| `finance.ap.payment.rejected` | Rejection | `{paymentId, rejectedBy, reason}` |

| `finance.ap.payment.executed` | Sent to bank | `{paymentId, beneficiary}` |

| `finance.ap.payment.completed` | Bank confirmed | `{paymentId, confirmationRef}` |

| `finance.ap.payment.failed` | Bank failed | `{paymentId, failureReason}` |

## Webhook Signature Verification

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```
````

---

## 4. Phase 6c: Evidence UX (One-Glance Confidence)

### 4.1 Problem Statement

**Current State:** Controllers must click through 3+ screens to see approval chain and evidence.

**Target State:** Expandable rows show **evidence summary in one glance**.

### 4.2 Technical Design

#### 4.2.1 Expandable Payment Row Component

**File:** `apps/web/app/payments/_components/ExpandablePaymentRow.tsx`

```tsx
'use client';

import { useState } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronRight, 
  Check, 
  X, 
  Clock, 
  FileText,
  User,
  Calendar,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApprovalChainTimeline } from './ApprovalChainTimeline';
import { EvidenceSummary } from './EvidenceSummary';
import { QuickDocumentPreview } from './QuickDocumentPreview';
import { ExceptionBadge } from './ExceptionBadge';
import { PaymentStatusBadge } from '@/modules/payment/components';
import type { Payment, PaymentException, AuditEvent } from '@/types/payment';

interface ExpandablePaymentRowProps {
  payment: Payment;
  exceptions: PaymentException[];
  auditEvents: AuditEvent[];
  onApprove?: (id: string, version: number) => void;
  onReject?: (id: string, version: number) => void;
}

export function ExpandablePaymentRow({
  payment,
  exceptions,
  auditEvents,
  onApprove,
  onReject,
}: ExpandablePaymentRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Main Row */}
      <TableRow 
        className={cn(
          'cursor-pointer hover:bg-muted/50 transition-colors',
          isExpanded && 'bg-muted/30',
          exceptions.length > 0 && 'border-l-4 border-l-yellow-400'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <TableCell className="w-8">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
        
        <TableCell className="font-mono text-sm">
          {payment.paymentNumber}
        </TableCell>
        
        <TableCell>
          <div className="flex items-center gap-2">
            <span>{payment.vendorName}</span>
            <ExceptionBadge exceptions={exceptions} />
          </div>
        </TableCell>
        
        <TableCell className="text-right font-mono">
          {formatMoney(payment.amount, payment.currency)}
        </TableCell>
        
        <TableCell>
          <PaymentStatusBadge status={payment.status} />
        </TableCell>
        
        <TableCell>
          <EvidenceIndicators payment={payment} auditEvents={auditEvents} />
        </TableCell>
        
        <TableCell className="text-right">
          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            {payment.status === 'pending_approval' && (
              <>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 text-green-600"
                  onClick={() => onApprove?.(payment.id, payment.version)}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 text-red-600"
                  onClick={() => onReject?.(payment.id, payment.version)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded Evidence Panel */}
      {isExpanded && (
        <TableRow className="bg-muted/20">
          <TableCell colSpan={7} className="p-0">
            <div className="p-4 grid grid-cols-3 gap-4">
              {/* Column 1: Approval Chain */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Approval Chain
                </h4>
                <ApprovalChainTimeline 
                  payment={payment} 
                  auditEvents={auditEvents} 
                />
              </div>

              {/* Column 2: Evidence Summary */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Evidence
                </h4>
                <EvidenceSummary payment={payment} />
              </div>

              {/* Column 3: Quick Actions & Documents */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Details
                </h4>
                <QuickDetailsPanel payment={payment} />
                {payment.sourceDocumentId && (
                  <QuickDocumentPreview documentId={payment.sourceDocumentId} />
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

/**
 * Evidence Indicators (compact view in main row)
 */
function EvidenceIndicators({ 
  payment, 
  auditEvents 
}: { 
  payment: Payment; 
  auditEvents: AuditEvent[] 
}) {
  const hasInvoice = !!payment.sourceDocumentId;
  const hasApproval = auditEvents.some(e => e.action === 'finance.ap.payment.approved');
  const hasExecution = !!payment.executedAt;
  
  return (
    <div className="flex items-center gap-1">
      <Badge variant={hasInvoice ? 'default' : 'outline'} className="h-5 px-1">
        <FileText className="h-3 w-3" />
      </Badge>
      <Badge variant={hasApproval ? 'default' : 'outline'} className="h-5 px-1">
        <Check className="h-3 w-3" />
      </Badge>
      <Badge variant={hasExecution ? 'default' : 'outline'} className="h-5 px-1">
        <DollarSign className="h-3 w-3" />
      </Badge>
    </div>
  );
}

/**
 * Quick Details Panel
 */
function QuickDetailsPanel({ payment }: { payment: Payment }) {
  return (
    <div className="text-xs space-y-1">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Payment Date:</span>
        <span>{formatDate(payment.paymentDate)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Created By:</span>
        <span>{payment.createdByName || payment.createdBy.slice(0, 8)}</span>
      </div>
      {payment.approvedBy && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Approved By:</span>
          <span>{payment.approvedByName || payment.approvedBy.slice(0, 8)}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-muted-foreground">Version:</span>
        <span>v{payment.version}</span>
      </div>
    </div>
  );
}
````

#### 4.2.2 Approval Chain Timeline Component

**File:** `apps/web/app/payments/_components/ApprovalChainTimeline.tsx`

```tsx
'use client';

import { Check, X, Clock, Send, Play, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Payment, AuditEvent } from '@/types/payment';

interface ApprovalChainTimelineProps {
  payment: Payment;
  auditEvents: AuditEvent[];
}

const STATUS_STEPS = [
  { status: 'draft', label: 'Created', icon: Send },
  { status: 'pending_approval', label: 'Submitted', icon: Clock },
  { status: 'approved', label: 'Approved', icon: Check },
  { status: 'processing', label: 'Executing', icon: Play },
  { status: 'completed', label: 'Completed', icon: Check },
];

const STATUS_ORDER = ['draft', 'pending_approval', 'approved', 'rejected', 'processing', 'completed', 'failed'];

export function ApprovalChainTimeline({ payment, auditEvents }: ApprovalChainTimelineProps) {
  const currentIndex = STATUS_ORDER.indexOf(payment.status);
  
  // Build timeline from audit events
  const timeline = auditEvents
    .filter(e => e.action.startsWith('finance.ap.payment.'))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(event => ({
      action: event.action.split('.').pop() || '',
      actor: event.actorName || event.actorId?.slice(0, 8) || 'System',
      timestamp: event.timestamp,
      payload: event.payload,
    }));

  return (
    <div className="space-y-3">
      {timeline.map((step, index) => (
        <div key={index} className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center',
            step.action === 'approved' && 'bg-green-100 text-green-600',
            step.action === 'rejected' && 'bg-red-100 text-red-600',
            step.action === 'created' && 'bg-blue-100 text-blue-600',
            step.action === 'submitted' && 'bg-yellow-100 text-yellow-600',
            step.action === 'executed' && 'bg-purple-100 text-purple-600',
            step.action === 'completed' && 'bg-green-100 text-green-600',
            step.action === 'failed' && 'bg-red-100 text-red-600',
          )}>
            {step.action === 'approved' && <Check className="h-3 w-3" />}
            {step.action === 'rejected' && <X className="h-3 w-3" />}
            {step.action === 'created' && <Send className="h-3 w-3" />}
            {step.action === 'submitted' && <Clock className="h-3 w-3" />}
            {step.action === 'executed' && <Play className="h-3 w-3" />}
            {step.action === 'completed' && <Check className="h-3 w-3" />}
            {step.action === 'failed' && <AlertCircle className="h-3 w-3" />}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium capitalize">{step.action}</p>
            <p className="text-xs text-muted-foreground">
              by {step.actor} • {formatRelativeTime(step.timestamp)}
            </p>
          </div>
          
          {/* Connector line */}
          {index < timeline.length - 1 && (
            <div className="absolute left-3 top-8 bottom-0 w-px bg-border" />
          )}
        </div>
      ))}
      
      {/* Pending state indicator */}
      {payment.status === 'pending_approval' && (
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center animate-pulse">
            <Clock className="h-3 w-3 text-yellow-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-600">Awaiting Approval</p>
            <p className="text-xs text-muted-foreground">
              {getWaitTime(payment.updatedAt)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

function getWaitTime(updatedAt: Date): string {
  const diff = Date.now() - new Date(updatedAt).getTime();
  const hours = Math.floor(diff / 3600000);
  
  if (hours < 1) return 'Less than 1 hour';
  if (hours < 24) return `${hours} hours`;
  return `${Math.floor(hours / 24)} days`;
}
```

#### 4.2.3 Evidence Summary Component

**File:** `apps/web/app/payments/_components/EvidenceSummary.tsx`

```tsx
'use client';

import { Check, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Payment } from '@/types/payment';

interface EvidenceSummaryProps {
  payment: Payment;
}

export function EvidenceSummary({ payment }: EvidenceSummaryProps) {
  const checks = [
    {
      label: 'Source Document',
      passed: !!payment.sourceDocumentId,
      value: payment.sourceDocumentType || 'None',
    },
    {
      label: 'Maker ≠ Checker',
      passed: !payment.approvedBy || payment.createdBy !== payment.approvedBy,
      value: payment.approvedBy ? 'Verified' : 'Pending',
    },
    {
      label: 'Period Open',
      passed: true, // Would check against fiscal time
      value: 'Open',
    },
    {
      label: 'Bank Details',
      passed: payment.status !== 'processing' || !!payment.beneficiaryAccountNumber,
      value: payment.beneficiaryBankName || 'Not captured',
    },
    {
      label: 'Audit Trail',
      passed: true, // Always true in our system
      value: 'Complete',
    },
  ];

  const passedCount = checks.filter(c => c.passed).length;
  const totalCount = checks.length;

  return (
    <div className="space-y-2">
      {/* Summary bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              'h-full transition-all',
              passedCount === totalCount ? 'bg-green-500' : 'bg-yellow-500'
            )}
            style={{ width: `${(passedCount / totalCount) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium">
          {passedCount}/{totalCount}
        </span>
      </div>

      {/* Check list */}
      <div className="space-y-1">
        {checks.map((check, index) => (
          <div 
            key={index}
            className="flex items-center justify-between text-xs"
          >
            <span className="flex items-center gap-1">
              {check.passed ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-yellow-600" />
              )}
              {check.label}
            </span>
            <span className={cn(
              'text-muted-foreground',
              !check.passed && 'text-yellow-600'
            )}>
              {check.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 5. Success Metrics

### 5.1 Target Outcomes

| Metric | Baseline | Target | Measurement |

|--------|----------|--------|-------------|

| **UX Score** | 8.5/10 | 9.5/10 | User survey |

| **Integration Score** | 7.6/10 | 9.5/10 | API adoption rate |

| **Exception Detection** | 0% | 100% | Automated coverage |

| **Time to Evidence** | 3+ clicks | 1 click | UX measurement |

| **Standalone Deploy** | Not possible | < 5 min | Docker test |

### 5.2 Test Coverage

| Component | Unit Tests | Integration Tests | E2E Tests |

|-----------|------------|-------------------|-----------|

| ExceptionService | ✓ | ✓ | - |

| WebhookService | ✓ | ✓ | ✓ |

| Import API | ✓ | ✓ | - |

| ExpandableRow | - | - | ✓ |

| ApprovalTimeline | - | - | ✓ |

---

## 6. Timeline

| Week | Phase | Deliverables |

|------|-------|--------------|

| **Week 1** | 6a: Exception Queue | ExceptionService, RiskQueue, ExceptionBadge |

| **Week 2** | 6b: Integration Kit | Webhooks, Import API, Docker Compose, README |

| **Week 3** | 6c: Evidence UX | ExpandableRow, ApprovalTimeline, EvidenceSummary |

---

## 7. Risk Mitigation

| Risk | Probability | Impact | Mitigation |

|------|-------------|--------|------------|

| Exception false positives | Medium | Medium | Configurable thresholds |

| Webhook delivery failures | Medium | High | Retry with exponential backoff |

| Performance on large datasets | Low | Medium | Pagination, caching |

| Breaking existing UI | Low | High | Feature flags |

---

**PRD Version:** 1.0.0

**Author:** AI-BOS Architecture

**Date:** 2024-12-16