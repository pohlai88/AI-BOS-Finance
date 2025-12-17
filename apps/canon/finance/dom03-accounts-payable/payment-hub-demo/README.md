# Payment Hub Demo Backend

**Port:** 4000  
**Location:** `apps/canon/finance/accounts-payable/payment-hub-demo`

## Quick Start

```bash
# From project root
cd apps/canon/finance/accounts-payable/payment-hub-demo
pnpm install
pnpm dev

# Or from root (if workspace configured)
pnpm --filter @aibos/cell-payment-hub dev
```

## Endpoints

- **Health Check:** `GET http://localhost:4000/health`
- **Process Payment:** `POST http://localhost:4000/payments/process`
- **Payment Status:** `GET http://localhost:4000/payments/status/:id`
- **Chaos Engineering:**
  - `POST http://localhost:4000/chaos/fail/:cell` (gateway|processor|ledger)
  - `POST http://localhost:4000/chaos/recover/:cell`
  - `POST http://localhost:4000/chaos/degrade/:cell`

## Frontend Connection

The frontend (`apps/web`) connects to this backend automatically via:
- Environment variable: `NEXT_PUBLIC_PAYMENT_HUB_URL` (defaults to `http://localhost:4000`)
- Frontend route: `/payments/hub-demo`
- Frontend component: `PAY_02_PaymentHubDemoPage`

## Development

```bash
# Start backend
pnpm dev

# Backend will run on http://localhost:4000
# Frontend should connect automatically
```
