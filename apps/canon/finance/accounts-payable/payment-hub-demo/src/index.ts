/**
 * Cell: Payment Hub
 * 
 * An atomic payment processing cell demonstrating the AI-BOS Finance
 * cell-based resilient architecture. Each internal "cell" (gateway,
 * processor, ledger) can fail independently without cascading.
 * 
 * Part of: molecule-accounts-payable
 * Canon: canon-finance
 * Location: apps/canon/finance/accounts-payable/payment-hub-demo
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// =============================================================================
// 1. Cell State (Finance Domain)
// =============================================================================
// These represent internal dependencies of this specific cell.
// In production, these would check actual service health.

type CellStatus = 'healthy' | 'degraded' | 'unhealthy';

interface Cell {
  status: CellStatus;
  lastChecked: string;
  description: string;
}

const cells: Record<string, Cell> = {
  gateway: {
    status: 'healthy',
    lastChecked: new Date().toISOString(),
    description: 'Payment gateway connectivity (e.g., Stripe, Swift)',
  },
  processor: {
    status: 'healthy',
    lastChecked: new Date().toISOString(),
    description: 'Payment processing logic engine',
  },
  ledger: {
    status: 'healthy',
    lastChecked: new Date().toISOString(),
    description: 'Internal ledger write capability',
  },
};

// In-memory payment store (simulated)
const payments: Map<string, {
  id: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  amount: number;
  currency: string;
  beneficiary: string;
  createdAt: string;
  tenantId?: string;
  correlationId?: string;
}> = new Map();

// =============================================================================
// 2. Infrastructure Endpoints
// =============================================================================

// Liveness Probe - Is the process running?
app.get('/ping', (_req: Request, res: Response) => {
  res.json({ message: 'pong' });
});

// Readiness/Health Probe - Are my cells working?
app.get('/health', (_req: Request, res: Response) => {
  const cellStatuses = Object.values(cells);
  const hasUnhealthy = cellStatuses.some(c => c.status === 'unhealthy');
  const hasDegraded = cellStatuses.some(c => c.status === 'degraded');

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (hasUnhealthy) {
    overallStatus = 'unhealthy';
  } else if (hasDegraded) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }

  res.json({
    service: 'cell-payment-hub',
    version: '1.0.0',
    location: 'apps/canon/finance/accounts-payable/payment-hub',
    status: overallStatus,
    cells: Object.fromEntries(
      Object.entries(cells).map(([name, cell]) => [
        name,
        { status: cell.status, lastChecked: cell.lastChecked },
      ])
    ),
    timestamp: new Date().toISOString(),
  });
});

// =============================================================================
// 3. Functional Endpoints (The Payment Logic)
// =============================================================================

// POST /payments/process - Process a payment
app.post('/payments/process', (req: Request, res: Response) => {
  const correlationId = req.header('x-correlation-id') || randomUUID();
  const tenantId = req.header('x-tenant-id');

  console.log(`[Payment] ${correlationId} - Processing request`);

  // 1. Check Gateway Health (Can we reach payment networks?)
  if (cells.gateway.status === 'unhealthy') {
    console.warn(`[Payment] ${correlationId} - Gateway cell is down`);
    return res.status(503).json({
      error: {
        code: 'GATEWAY_DOWN',
        message: 'Payment gateway unavailable. Please retry later.',
      },
      correlation_id: correlationId,
    });
  }

  // 2. Check Processor Health (Can we process the logic?)
  if (cells.processor.status === 'unhealthy') {
    console.warn(`[Payment] ${correlationId} - Processor cell is down`);
    return res.status(503).json({
      error: {
        code: 'PROCESSOR_DOWN',
        message: 'Payment processor unavailable. Please retry later.',
      },
      correlation_id: correlationId,
    });
  }

  // 3. Check Ledger Health (Can we record the transaction?)
  if (cells.ledger.status === 'unhealthy') {
    console.warn(`[Payment] ${correlationId} - Ledger cell is down`);
    return res.status(503).json({
      error: {
        code: 'LEDGER_DOWN',
        message: 'Cannot record transaction in ledger. Please retry later.',
      },
      correlation_id: correlationId,
    });
  }

  // 4. Validate Request
  const { amount, currency, beneficiary } = req.body;

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({
      error: {
        code: 'INVALID_AMOUNT',
        message: 'Amount must be a positive number',
      },
      correlation_id: correlationId,
    });
  }

  if (!currency || typeof currency !== 'string') {
    return res.status(400).json({
      error: {
        code: 'INVALID_CURRENCY',
        message: 'Currency is required',
      },
      correlation_id: correlationId,
    });
  }

  if (!beneficiary || typeof beneficiary !== 'string') {
    return res.status(400).json({
      error: {
        code: 'INVALID_BENEFICIARY',
        message: 'Beneficiary is required',
      },
      correlation_id: correlationId,
    });
  }

  // 5. Process Payment (simulated)
  const transactionId = randomUUID();
  const payment = {
    id: transactionId,
    status: 'PROCESSED' as const,
    amount,
    currency,
    beneficiary,
    createdAt: new Date().toISOString(),
    tenantId,
    correlationId,
  };

  payments.set(transactionId, payment);

  console.log(
    `[Payment] ${correlationId} - Processed ${currency} ${amount} for ${beneficiary} → ${transactionId}`
  );

  res.status(201).json({
    ok: true,
    data: {
      transaction_id: transactionId,
      status: 'PROCESSED',
      amount,
      currency,
      beneficiary,
      timestamp: payment.createdAt,
    },
    // Echo context to prove Gateway works
    trace: {
      tenant_id: tenantId || 'NOT_PROVIDED',
      correlation_id: correlationId,
      user_sub: req.header('x-user-sub') || 'NOT_PROVIDED',
    },
    correlation_id: correlationId,
  });
});

// GET /payments/status/:id - Check payment status
app.get('/payments/status/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const correlationId = req.header('x-correlation-id') || randomUUID();

  const payment = payments.get(id);

  if (!payment) {
    return res.status(404).json({
      error: {
        code: 'PAYMENT_NOT_FOUND',
        message: `Payment ${id} not found`,
      },
      correlation_id: correlationId,
    });
  }

  res.json({
    ok: true,
    data: {
      transaction_id: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      beneficiary: payment.beneficiary,
      created_at: payment.createdAt,
    },
    correlation_id: correlationId,
  });
});

// =============================================================================
// 4. Chaos Engineering Endpoints (Simulate Failures)
// =============================================================================

// POST /chaos/fail/:cell - Break a specific cell
app.post('/chaos/fail/:cell', (req: Request, res: Response) => {
  const { cell } = req.params;

  if (!cells[cell]) {
    return res.status(404).json({
      error: {
        code: 'CELL_NOT_FOUND',
        message: `Cell '${cell}' does not exist. Available: ${Object.keys(cells).join(', ')}`,
      },
    });
  }

  cells[cell].status = 'unhealthy';
  cells[cell].lastChecked = new Date().toISOString();

  console.log(`[Chaos] 🔥 Broke cell: ${cell}`);

  res.json({
    ok: true,
    message: `Cell '${cell}' is now unhealthy`,
    cell: {
      name: cell,
      status: cells[cell].status,
      lastChecked: cells[cell].lastChecked,
    },
  });
});

// POST /chaos/recover/:cell - Recover a specific cell
app.post('/chaos/recover/:cell', (req: Request, res: Response) => {
  const { cell } = req.params;

  if (!cells[cell]) {
    return res.status(404).json({
      error: {
        code: 'CELL_NOT_FOUND',
        message: `Cell '${cell}' does not exist. Available: ${Object.keys(cells).join(', ')}`,
      },
    });
  }

  cells[cell].status = 'healthy';
  cells[cell].lastChecked = new Date().toISOString();

  console.log(`[Chaos] ✅ Recovered cell: ${cell}`);

  res.json({
    ok: true,
    message: `Cell '${cell}' is now healthy`,
    cell: {
      name: cell,
      status: cells[cell].status,
      lastChecked: cells[cell].lastChecked,
    },
  });
});

// POST /chaos/degrade/:cell - Set a cell to degraded (partial failure)
app.post('/chaos/degrade/:cell', (req: Request, res: Response) => {
  const { cell } = req.params;

  if (!cells[cell]) {
    return res.status(404).json({
      error: {
        code: 'CELL_NOT_FOUND',
        message: `Cell '${cell}' does not exist. Available: ${Object.keys(cells).join(', ')}`,
      },
    });
  }

  cells[cell].status = 'degraded';
  cells[cell].lastChecked = new Date().toISOString();

  console.log(`[Chaos] ⚠️ Degraded cell: ${cell}`);

  res.json({
    ok: true,
    message: `Cell '${cell}' is now degraded`,
    cell: {
      name: cell,
      status: cells[cell].status,
      lastChecked: cells[cell].lastChecked,
    },
  });
});

// =============================================================================
// 5. Start Server
// =============================================================================

app.listen(PORT, () => {
  console.log(`🚀 Payment Hub Cell running on port ${PORT}`);
  console.log(`   Location: apps/canon/finance/accounts-payable/payment-hub-demo`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Process: POST http://localhost:${PORT}/payments/process`);
  console.log(`   Chaos:   POST http://localhost:${PORT}/chaos/fail/{gateway|processor|ledger}`);
});
