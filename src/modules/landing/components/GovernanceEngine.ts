// ============================================================================
// GOVERNANCE ENGINE v2.0 - "The Truth Engine"
// A Deterministic Legal Logic Processor
// Architecture: Mapper (Ear) -> Traverser (Brain) -> Adjudicator (Mouth)
// ============================================================================

// --- 1. THE DATA STRUCTURES ---
export interface Transaction {
  id: string
  vendor: string
  amount: number
  category: string
  counterparty_type: 'VENDOR' | 'PROSPECT' | 'CLIENT' | 'INTERNAL'
  is_existing_customer: boolean
}

export type TraceStep = {
  node: string // e.g., "RULE_ENTRY", "CONDITION_CHECK", "EXCEPTION_APPLIED"
  description: string // Human-readable step
  result: 'pass' | 'fail' | 'skip' | 'apply'
  timestamp: number // ms since audit start
}

export type RuleResult = {
  ruleId: string
  ruleName: string
  standard: string
  result: { status: 'pass' | 'fail' | 'warning'; msg: string }
  logicTrace: TraceStep[] // THE GLASS BOX - every decision recorded
}

export type Verdict = {
  riskLevel: 'CRITICAL' | 'WARNING' | 'APPROVED'
  details: RuleResult[]
  logicTrace: TraceStep[] // Aggregated trace across all rules
  timestamp: string
  processingTimeMs: number
}

// --- 2. THE RULE DEFINITIONS (Deterministic Logic Paths) ---
const RULES = [
  {
    id: 'TAX_RULE_99',
    name: 'Entertainment Deductibility',
    standard: 'IRS Pub 463 / Section 274',
    defaultVerdict: 'DEDUCTIBLE', // What happens if no exceptions match
    check: (
      tx: Transaction
    ): { result: RuleResult['result']; trace: TraceStep[] } => {
      const trace: TraceStep[] = []
      const start = performance.now()

      // Step 1: Enter Rule
      trace.push({
        node: 'RULE_ENTRY',
        description: `Evaluating ${tx.id} against IRS Pub 463`,
        result: 'pass',
        timestamp: 0,
      })

      // Step 2: Check Category
      if (tx.category !== 'Entertainment') {
        trace.push({
          node: 'CATEGORY_CHECK',
          description: `Category "${tx.category}" ≠ Entertainment`,
          result: 'skip',
          timestamp: performance.now() - start,
        })
        return {
          result: { status: 'pass', msg: 'Rule N/A: Not Entertainment' },
          trace,
        }
      }
      trace.push({
        node: 'CATEGORY_CHECK',
        description: `Category = Entertainment → Continue`,
        result: 'pass',
        timestamp: performance.now() - start,
      })

      // Step 3: Check Counterparty Type
      if (tx.counterparty_type !== 'PROSPECT') {
        trace.push({
          node: 'COUNTERPARTY_CHECK',
          description: `Type "${tx.counterparty_type}" ≠ PROSPECT`,
          result: 'skip',
          timestamp: performance.now() - start,
        })
        return {
          result: {
            status: 'pass',
            msg: 'Deductible: Not prospect entertainment',
          },
          trace,
        }
      }
      trace.push({
        node: 'COUNTERPARTY_CHECK',
        description: `Type = PROSPECT → Exception Path`,
        result: 'apply',
        timestamp: performance.now() - start,
      })

      // Step 4: Check Amount Threshold
      if (tx.amount <= 500) {
        trace.push({
          node: 'THRESHOLD_CHECK',
          description: `$${tx.amount} ≤ $500 threshold`,
          result: 'pass',
          timestamp: performance.now() - start,
        })
        trace.push({
          node: 'EXCEPTION_APPLIED',
          description: `De minimis exception → DEDUCTIBLE`,
          result: 'apply',
          timestamp: performance.now() - start,
        })
        return {
          result: { status: 'pass', msg: 'Deductible: Under $500 de minimis' },
          trace,
        }
      }

      // Step 5: Rejection Path
      trace.push({
        node: 'THRESHOLD_CHECK',
        description: `$${tx.amount} > $500 threshold`,
        result: 'fail',
        timestamp: performance.now() - start,
      })
      trace.push({
        node: 'VERDICT',
        description: `Default Rule (Reject) → NON-DEDUCTIBLE`,
        result: 'fail',
        timestamp: performance.now() - start,
      })

      return {
        result: { status: 'fail', msg: 'Non-Deductible: Prospect Ent. > $500' },
        trace,
      }
    },
  },
  {
    id: 'IFRS_15_CIRCULAR',
    name: 'Circular Revenue Risk',
    standard: 'IFRS 15.47',
    defaultVerdict: 'ARMS_LENGTH',
    check: (
      tx: Transaction
    ): { result: RuleResult['result']; trace: TraceStep[] } => {
      const trace: TraceStep[] = []
      const start = performance.now()

      trace.push({
        node: 'RULE_ENTRY',
        description: `Evaluating ${tx.id} for circular risk`,
        result: 'pass',
        timestamp: 0,
      })

      if (!tx.is_existing_customer) {
        trace.push({
          node: 'CUSTOMER_CHECK',
          description: `Vendor NOT in customer registry`,
          result: 'pass',
          timestamp: performance.now() - start,
        })
        trace.push({
          node: 'VERDICT',
          description: `Arm's length confirmed`,
          result: 'pass',
          timestamp: performance.now() - start,
        })
        return { result: { status: 'pass', msg: "Arm's Length Vendor" }, trace }
      }

      trace.push({
        node: 'CUSTOMER_CHECK',
        description: `⚠ Vendor EXISTS in customer registry`,
        result: 'fail',
        timestamp: performance.now() - start,
      })
      trace.push({
        node: 'CIRCULAR_RISK',
        description: `Potential revenue-expense netting detected`,
        result: 'fail',
        timestamp: performance.now() - start,
      })
      trace.push({
        node: 'VERDICT',
        description: `IFRS 15.47 violation flagged`,
        result: 'fail',
        timestamp: performance.now() - start,
      })

      return {
        result: { status: 'fail', msg: 'Risk: Vendor is also a Customer' },
        trace,
      }
    },
  },
  {
    id: 'MATERIALITY_CHECK',
    name: 'Materiality Threshold',
    standard: 'IAS 1.7',
    defaultVerdict: 'APPROVED',
    check: (
      tx: Transaction
    ): { result: RuleResult['result']; trace: TraceStep[] } => {
      const trace: TraceStep[] = []
      const start = performance.now()

      trace.push({
        node: 'RULE_ENTRY',
        description: `Evaluating materiality for $${tx.amount}`,
        result: 'pass',
        timestamp: 0,
      })

      // Tiered thresholds
      if (tx.amount > 50000) {
        trace.push({
          node: 'TIER_CHECK',
          description: `$${tx.amount} > $50,000 → BOARD LEVEL`,
          result: 'fail',
          timestamp: performance.now() - start,
        })
        return {
          result: { status: 'fail', msg: 'Requires Board Approval' },
          trace,
        }
      }

      if (tx.amount > 10000) {
        trace.push({
          node: 'TIER_CHECK',
          description: `$${tx.amount} > $10,000 → CFO LEVEL`,
          result: 'apply',
          timestamp: performance.now() - start,
        })
        return {
          result: { status: 'warning', msg: 'Requires CFO Approval' },
          trace,
        }
      }

      trace.push({
        node: 'TIER_CHECK',
        description: `$${tx.amount} ≤ $10,000 → AUTO-APPROVED`,
        result: 'pass',
        timestamp: performance.now() - start,
      })
      trace.push({
        node: 'VERDICT',
        description: `Within delegation of authority`,
        result: 'pass',
        timestamp: performance.now() - start,
      })

      return {
        result: { status: 'pass', msg: 'Within Authority Limits' },
        trace,
      }
    },
  },
]

// --- 3. THE ENGINE FUNCTION (Deterministic Processor) ---
export const runAudit = (tx: Transaction): Verdict => {
  const auditStart = performance.now()
  const aggregatedTrace: TraceStep[] = []

  // MAPPER: Parse input (already typed, so pass-through)
  aggregatedTrace.push({
    node: 'MAPPER',
    description: `Input parsed: ${tx.id} | ${tx.vendor} | $${tx.amount}`,
    result: 'pass',
    timestamp: 0,
  })

  // TRAVERSER: Run through all rules
  const results: RuleResult[] = RULES.map((rule) => {
    aggregatedTrace.push({
      node: 'TRAVERSER',
      description: `→ Entering ${rule.id}`,
      result: 'pass',
      timestamp: performance.now() - auditStart,
    })

    const { result, trace } = rule.check(tx)

    // Merge rule trace into aggregate
    trace.forEach((step) => {
      aggregatedTrace.push({
        ...step,
        node: `${rule.id}::${step.node}`,
        timestamp: performance.now() - auditStart,
      })
    })

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      standard: rule.standard,
      result,
      logicTrace: trace,
    }
  })

  // ADJUDICATOR: Compute final verdict
  const hasCritical = results.some((r) => r.result.status === 'fail')
  const hasWarning = results.some((r) => r.result.status === 'warning')
  const riskLevel = hasCritical
    ? 'CRITICAL'
    : hasWarning
      ? 'WARNING'
      : 'APPROVED'

  aggregatedTrace.push({
    node: 'ADJUDICATOR',
    description: `Final Verdict: ${riskLevel}`,
    result: riskLevel === 'APPROVED' ? 'pass' : 'fail',
    timestamp: performance.now() - auditStart,
  })

  return {
    riskLevel,
    details: results,
    logicTrace: aggregatedTrace,
    timestamp: new Date().toISOString(),
    processingTimeMs: performance.now() - auditStart,
  }
}

// --- 4. SIMULATED TRANSACTION STREAM ---
// In production, this would come from your ERP/API
export const TRANSACTION_STREAM: Transaction[] = [
  {
    id: 'TX-8821',
    vendor: 'Nobu Hospitality',
    amount: 4200,
    category: 'Entertainment',
    counterparty_type: 'PROSPECT',
    is_existing_customer: true,
  },
  {
    id: 'TX-8822',
    vendor: 'AWS Cloud Services',
    amount: 12000,
    category: 'Software',
    counterparty_type: 'VENDOR',
    is_existing_customer: false,
  },
  {
    id: 'TX-8823',
    vendor: 'Acme Corp',
    amount: 850,
    category: 'Consulting',
    counterparty_type: 'VENDOR',
    is_existing_customer: true,
  },
  {
    id: 'TX-8824',
    vendor: 'OfficeMax',
    amount: 340,
    category: 'Supplies',
    counterparty_type: 'VENDOR',
    is_existing_customer: false,
  },
  {
    id: 'TX-8825',
    vendor: 'Client Solutions Inc',
    amount: 15000,
    category: 'Professional Services',
    counterparty_type: 'CLIENT',
    is_existing_customer: true,
  },
]
