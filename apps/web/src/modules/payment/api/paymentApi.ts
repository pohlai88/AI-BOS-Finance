// ============================================================================
// API_PAY_01: PAYMENT API CLIENT
// Enterprise-grade API client for AP-05 Payment Execution Cell
// ============================================================================
// PHILOSOPHY: "Idempotency is not optional. Every mutation gets a key."
// - All mutating operations include X-Idempotency-Key header
// - All operations include version for optimistic locking
// - Money is always serialized as string, never number
// ============================================================================

import type {
  CreatePaymentInput,
  PaymentResponse,
  ApprovalResult,
  RejectionResult,
  SubmissionResult,
  ExecutionResult,
  CompletionResult,
  FailureResult,
  RetryResult,
  BeneficiarySnapshot,
} from '../schemas/paymentZodSchemas';

// ============================================================================
// 1. ERROR TYPES
// ============================================================================

export class PaymentApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'PaymentApiError';
  }
}

export class ConcurrencyError extends PaymentApiError {
  constructor(message: string = 'Payment was modified by another user') {
    super(message, 409, 'CONCURRENCY_CONFLICT');
    this.name = 'ConcurrencyError';
  }
}

export class ValidationError extends PaymentApiError {
  constructor(message: string, public readonly errors?: Record<string, string[]>) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends PaymentApiError {
  constructor(message: string = 'Payment not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class SoDViolationError extends PaymentApiError {
  constructor(message: string = 'Segregation of Duties violation') {
    super(message, 403, 'SOD_VIOLATION');
    this.name = 'SoDViolationError';
  }
}

export class PeriodClosedError extends PaymentApiError {
  constructor(message: string = 'Period is closed for posting') {
    super(message, 422, 'PERIOD_CLOSED');
    this.name = 'PeriodClosedError';
  }
}

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 409) {
    throw new ConcurrencyError();
  }

  if (res.status === 404) {
    throw new NotFoundError();
  }

  if (res.status === 403) {
    const error = await res.json().catch(() => ({}));
    if (error.code === 'SOD_VIOLATION') {
      throw new SoDViolationError(error.message);
    }
    throw new PaymentApiError(error.message || 'Forbidden', 403);
  }

  if (res.status === 422) {
    const error = await res.json().catch(() => ({}));
    if (error.code === 'PERIOD_CLOSED') {
      throw new PeriodClosedError(error.message);
    }
    throw new PaymentApiError(error.message || 'Unprocessable entity', 422);
  }

  if (res.status === 400) {
    const error = await res.json().catch(() => ({}));
    throw new ValidationError(error.message || 'Validation failed', error.errors);
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new PaymentApiError(error.message || 'Request failed', res.status);
  }

  return res.json();
}

function createHeaders(idempotencyKey?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (idempotencyKey) {
    headers['X-Idempotency-Key'] = idempotencyKey;
  }

  return headers;
}

// ============================================================================
// 3. PAYMENT API CLIENT
// ============================================================================

export const paymentApi = {
  // ==========================================================================
  // CREATE PAYMENT
  // ==========================================================================

  /**
   * Create a new payment
   * 
   * @param data - Payment creation data (amount MUST be string)
   * @returns Created payment with version=1
   */
  async create(data: CreatePaymentInput): Promise<PaymentResponse> {
    const idempotencyKey = crypto.randomUUID();

    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: createHeaders(idempotencyKey),
      body: JSON.stringify({
        ...data,
        // Ensure amount is string (defensive, should already be)
        amount: String(data.amount),
      }),
    });

    return handleResponse<PaymentResponse>(res);
  },

  // ==========================================================================
  // RETRIEVE PAYMENTS
  // ==========================================================================

  /**
   * Get a single payment by ID
   */
  async getById(id: string): Promise<PaymentResponse> {
    const res = await fetch(`/api/payments/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });

    return handleResponse<PaymentResponse>(res);
  },

  /**
   * List payments with optional filters
   */
  async list(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ payments: PaymentResponse[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    const url = query ? `/api/payments?${query}` : '/api/payments';

    const res = await fetch(url, {
      method: 'GET',
      headers: createHeaders(),
    });

    return handleResponse<{ payments: PaymentResponse[]; total: number }>(res);
  },

  // ==========================================================================
  // SUBMIT FOR APPROVAL
  // ==========================================================================

  /**
   * Submit a draft payment for approval
   * 
   * @param id - Payment ID
   * @param version - Expected version (optimistic locking)
   */
  async submit(id: string, version: number): Promise<SubmissionResult> {
    const idempotencyKey = crypto.randomUUID();

    const res = await fetch(`/api/payments/${id}/submit`, {
      method: 'POST',
      headers: createHeaders(idempotencyKey),
      body: JSON.stringify({ version }),
    });

    return handleResponse<SubmissionResult>(res);
  },

  // ==========================================================================
  // APPROVE
  // ==========================================================================

  /**
   * Approve a pending payment
   * 
   * @param id - Payment ID
   * @param version - Expected version (optimistic locking)
   * @param comment - Optional approval comment
   * @throws ConcurrencyError if version mismatch
   * @throws SoDViolationError if creator tries to approve
   */
  async approve(
    id: string,
    version: number,
    comment?: string,
  ): Promise<ApprovalResult> {
    const idempotencyKey = crypto.randomUUID();

    const res = await fetch(`/api/payments/${id}/approve`, {
      method: 'POST',
      headers: createHeaders(idempotencyKey),
      body: JSON.stringify({ version, comment }),
    });

    return handleResponse<ApprovalResult>(res);
  },

  // ==========================================================================
  // REJECT
  // ==========================================================================

  /**
   * Reject a pending payment
   * 
   * @param id - Payment ID
   * @param version - Expected version (optimistic locking)
   * @param comment - Optional rejection reason
   */
  async reject(
    id: string,
    version: number,
    comment?: string,
  ): Promise<RejectionResult> {
    const idempotencyKey = crypto.randomUUID();

    const res = await fetch(`/api/payments/${id}/reject`, {
      method: 'POST',
      headers: createHeaders(idempotencyKey),
      body: JSON.stringify({ version, comment }),
    });

    return handleResponse<RejectionResult>(res);
  },

  // ==========================================================================
  // EXECUTE
  // ==========================================================================

  /**
   * Execute an approved payment (send to bank)
   * 
   * @param id - Payment ID
   * @param version - Expected version (optimistic locking)
   * @param beneficiary - Beneficiary snapshot (captured at execution time)
   */
  async execute(
    id: string,
    version: number,
    beneficiary: BeneficiarySnapshot,
  ): Promise<ExecutionResult> {
    const idempotencyKey = crypto.randomUUID();

    const res = await fetch(`/api/payments/${id}/execute`, {
      method: 'POST',
      headers: createHeaders(idempotencyKey),
      body: JSON.stringify({ version, beneficiary }),
    });

    return handleResponse<ExecutionResult>(res);
  },

  // ==========================================================================
  // COMPLETE
  // ==========================================================================

  /**
   * Complete a processing payment (bank confirmed)
   * 
   * @param id - Payment ID
   * @param version - Expected version (optimistic locking)
   * @param bankConfirmationRef - Bank confirmation reference
   */
  async complete(
    id: string,
    version: number,
    bankConfirmationRef: string,
  ): Promise<CompletionResult> {
    const idempotencyKey = crypto.randomUUID();

    const res = await fetch(`/api/payments/${id}/complete`, {
      method: 'POST',
      headers: createHeaders(idempotencyKey),
      body: JSON.stringify({ version, bankConfirmationRef }),
    });

    return handleResponse<CompletionResult>(res);
  },

  // ==========================================================================
  // FAIL
  // ==========================================================================

  /**
   * Mark a processing payment as failed
   * 
   * @param id - Payment ID
   * @param version - Expected version (optimistic locking)
   * @param failureReason - Reason for failure
   */
  async fail(
    id: string,
    version: number,
    failureReason: string,
  ): Promise<FailureResult> {
    const idempotencyKey = crypto.randomUUID();

    const res = await fetch(`/api/payments/${id}/fail`, {
      method: 'POST',
      headers: createHeaders(idempotencyKey),
      body: JSON.stringify({ version, failureReason }),
    });

    return handleResponse<FailureResult>(res);
  },

  // ==========================================================================
  // RETRY
  // ==========================================================================

  /**
   * Retry a failed payment
   * 
   * @param id - Payment ID
   * @param version - Expected version (optimistic locking)
   */
  async retry(id: string, version: number): Promise<RetryResult> {
    const idempotencyKey = crypto.randomUUID();

    const res = await fetch(`/api/payments/${id}/retry`, {
      method: 'POST',
      headers: createHeaders(idempotencyKey),
      body: JSON.stringify({ version }),
    });

    return handleResponse<RetryResult>(res);
  },
};

// ============================================================================
// 4. EXPORTS
// ============================================================================

export type { PaymentResponse, CreatePaymentInput, BeneficiarySnapshot };
