// GovernanceEngine.ts
// The "Brain" - Pure logic, no UI concerns

// --- 1. THE DATA STRUCTURE (JSON) ---
export interface Transaction {
  id: string;
  vendor: string;
  amount: number;
  category: string;
  counterparty_type: 'VENDOR' | 'PROSPECT' | 'CLIENT' | 'INTERNAL';
  is_existing_customer: boolean;
}

// --- 2. THE RULE DEFINITIONS ---
// This is your "Configuration." You can add 100 rules here.
const RULES = [
  {
    id: 'TAX_RULE_99',
    name: 'Entertainment Deductibility',
    standard: 'IRS Pub 463',
    // LOGIC: If it's a Prospect and > $500, it's illegal to claim tax
    check: (tx: Transaction) => {
      if (
        tx.category === 'Entertainment' &&
        tx.counterparty_type === 'PROSPECT' &&
        tx.amount > 500
      ) {
        return { status: 'fail', msg: 'Non-Deductible: Prospect Ent. > $500' };
      }
      return { status: 'pass', msg: 'Deductible Expense' };
    },
  },
  {
    id: 'IFRS_15_CIRCULAR',
    name: 'Circular Revenue Risk',
    standard: 'IFRS 15',
    // LOGIC: If we pay a Customer, it might be a kickback
    check: (tx: Transaction) => {
      if (tx.is_existing_customer) {
        return { status: 'fail', msg: 'Risk: Vendor is also a Customer' };
      }
      return { status: 'pass', msg: "Arm's Length Vendor" };
    },
  },
  {
    id: 'MATERIALITY_CHECK',
    name: 'Materiality Threshold',
    standard: 'IAS 1',
    // LOGIC: Large transactions need extra scrutiny
    check: (tx: Transaction) => {
      if (tx.amount > 10000) {
        return { status: 'warning', msg: 'Requires CFO Approval' };
      }
      return { status: 'pass', msg: 'Within Authority Limits' };
    },
  },
];

// --- 3. THE ENGINE FUNCTION ---
// The UI calls this function. It returns the Verdict.
export const runAudit = (tx: Transaction) => {
  const results = RULES.map((rule) => ({
    ruleId: rule.id,
    ruleName: rule.name,
    standard: rule.standard,
    result: rule.check(tx),
  }));

  // Calculate high-level risk
  const hasCritical = results.some((r) => r.result.status === 'fail');
  const hasWarning = results.some((r) => r.result.status === 'warning');

  return {
    riskLevel: hasCritical ? 'CRITICAL' : hasWarning ? 'WARNING' : 'APPROVED',
    details: results,
    timestamp: new Date().toISOString(),
  };
};

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
];
