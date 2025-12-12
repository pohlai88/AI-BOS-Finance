export interface HealthModule {
  id: string;
  name: string;
  score: number;
  status: 'Governed' | 'Watch' | 'Exposed';
  keyIssue: string;
  subScores: {
    ifrs: number;
    tax: number;
    controls: number;
  };
  issues: HealthIssue[];
}

export interface HealthIssue {
  id: string;
  summary: string;
  severity: 'Critical' | 'Major' | 'Minor';
  source: 'IFRS' | 'Tax' | 'SOC2' | 'Internal';
  impact: string;
  canonId?: string;
}

export const mockHealthModules: HealthModule[] = [
  {
    id: 'MOD_GL',
    name: 'General Ledger & Reporting',
    score: 78,
    status: 'Governed',
    keyIssue: '4 critical misclassification risks detected.',
    subScores: { ifrs: 85, tax: 70, controls: 75 },
    issues: [
      {
        id: 'ISS_GL_01',
        summary: 'Misclassification of OPEX as CAPEX',
        severity: 'Critical',
        source: 'IFRS',
        impact: 'Potential profit overstatement',
        canonId: 'GC-FA-001',
      },
      {
        id: 'ISS_GL_02',
        summary: 'Unreconciled suspense accounts > 30 days',
        severity: 'Major',
        source: 'Internal',
        impact: 'Balance sheet accuracy risk',
        canonId: 'TL-GL-SUSP-01',
      },
    ],
  },
  {
    id: 'MOD_REV',
    name: 'Revenue & Tax',
    score: 64,
    status: 'Watch',
    keyIssue: 'Revenue recognition timing inconsistent.',
    subScores: { ifrs: 70, tax: 58, controls: 62 },
    issues: [
      {
        id: 'ISS_REV_01',
        summary: 'Mis-timed recognition on annual subs',
        severity: 'Critical',
        source: 'IFRS',
        impact: 'Revenue overstatement ~ RM 450K',
        canonId: 'TL-REV-ANNUAL',
      },
      {
        id: 'ISS_REV_02',
        summary: 'WHT flags missing on cross-border invoices',
        severity: 'Major',
        source: 'Tax',
        impact: 'Regulatory penalty risk',
        canonId: 'CC-TAX-WHT',
      },
    ],
  },
  {
    id: 'MOD_GRANT',
    name: 'Grants & Subsidies',
    score: 55,
    status: 'Exposed',
    keyIssue: 'Inadequate documentation for grant conditions.',
    subScores: { ifrs: 60, tax: 50, controls: 45 },
    issues: [
      {
        id: 'ISS_GR_01',
        summary: 'Missing utilization evidence for Grant A',
        severity: 'Critical',
        source: 'SOC2',
        impact: 'Clawback risk',
        canonId: 'GC-GR-UTIL',
      },
    ],
  },
  {
    id: 'MOD_INV',
    name: 'Inventory & Cost of Sales',
    score: 70,
    status: 'Watch',
    keyIssue: 'Manual adjustments not linked to Canon.',
    subScores: { ifrs: 75, tax: 65, controls: 68 },
    issues: [
      {
        id: 'ISS_INV_01',
        summary: 'Stock write-offs lacking approval logs',
        severity: 'Major',
        source: 'SOC2',
        impact: 'Inventory shrinkage visibility',
        canonId: 'TL-INV-ADJ',
      },
    ],
  },
  {
    id: 'MOD_CTRL',
    name: 'Controls & Approvals',
    score: 60,
    status: 'Watch',
    keyIssue: 'Manual JEs > 100K without logged approval.',
    subScores: { ifrs: 65, tax: 60, controls: 55 },
    issues: [
      {
        id: 'ISS_CTRL_01',
        summary: 'SOD conflict: Creator posting journals',
        severity: 'Critical',
        source: 'SOC2',
        impact: 'Fraud risk',
        canonId: 'GC-CTRL-SOD',
      },
    ],
  },
  {
    id: 'MOD_DATA',
    name: 'Data Quality',
    score: 82,
    status: 'Governed',
    keyIssue: 'Some canons defined but not bound.',
    subScores: { ifrs: 85, tax: 80, controls: 80 },
    issues: [
      {
        id: 'ISS_DQ_01',
        summary: 'Duplicate entity records found',
        severity: 'Minor',
        source: 'Internal',
        impact: 'Reporting noise',
        canonId: 'CC-MDM-ENT',
      },
    ],
  },
];

export const overallHealthStats = {
  score: 74,
  status: 'Watch',
  label: 'At Risk but Recoverable',
  ifrs: 72,
  soc2: 65,
  internal: 80,
};
