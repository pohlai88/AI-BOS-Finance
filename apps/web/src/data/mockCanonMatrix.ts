export interface CanonRecord {
  id: string;
  name: string;
  type: 'Group' | 'Transaction' | 'Cell';
  domain: string;
  bindable: boolean;
  primaryStandard: string;
  supportingFrameworks: string[];
  internalPolicy: string;
  maxDepth: number;
  linkedItems: string;
  status: 'ACTIVE' | 'DRAFT' | 'DEPRECATED';
  riskWeight: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  // For inheritance
  parentId?: string;
  childrenIds?: string[];
  // For Usage
  usage: {
    systems: string[];
    entities: string[];
    metadataCount: number;
    glAccounts: string[];
    riskSignals: number;
  };
}

export const mockCanonRecords: CanonRecord[] = [
  {
    id: 'GC-REV-001',
    name: 'Revenue Recognition',
    type: 'Group',
    domain: 'Revenue',
    bindable: false,
    primaryStandard: 'IFRS 15',
    supportingFrameworks: ['SOC2', 'COSO'],
    internalPolicy: 'FIN-REV-01',
    maxDepth: 1,
    linkedItems: '12 Ledgers',
    status: 'ACTIVE',
    riskWeight: 'CRITICAL',
    description: 'Defines what "revenue" means and when it is considered earned across the group.',
    childrenIds: ['TL-REV-ANNUAL-001'],
    usage: {
      systems: [],
      entities: ['Global'],
      metadataCount: 0,
      glAccounts: [],
      riskSignals: 0,
    },
  },
  {
    id: 'TL-REV-ANNUAL-001',
    name: 'Subscription Revenue – Annual',
    type: 'Transaction',
    domain: 'Revenue',
    bindable: true,
    primaryStandard: 'IFRS 15',
    supportingFrameworks: ['SOC2 (Proc. Integrity)'],
    internalPolicy: 'FIN-REV-03',
    maxDepth: 3,
    linkedItems: '4 Cell Canons',
    status: 'ACTIVE',
    riskWeight: 'HIGH',
    description:
      'Configures how annual subscription invoices are recorded, scheduled, and recognized over time.',
    parentId: 'GC-REV-001',
    childrenIds: ['CC-REV-RECOG-MONTH-001', 'CC-REV-DEF-FLAG-001'],
    usage: {
      systems: ['ERP - FinanceCore'],
      entities: ['MY Holding', 'SG Subsidiary'],
      metadataCount: 8,
      glAccounts: ['4100', '4150'],
      riskSignals: 3,
    },
  },
  {
    id: 'CC-REV-RECOG-MONTH-001',
    name: 'Recognition Month',
    type: 'Cell',
    domain: 'Revenue',
    bindable: true,
    primaryStandard: 'IFRS 15',
    supportingFrameworks: ['SOC2'],
    internalPolicy: 'FIN-REV-03.B',
    maxDepth: 5,
    linkedItems: '1 Field',
    status: 'ACTIVE',
    riskWeight: 'HIGH',
    description:
      'Ensures each month’s GL posting matches actual service delivered. Derived from Contract Period.',
    parentId: 'TL-REV-ANNUAL-001',
    usage: {
      systems: ['ERP - FinanceCore', 'Data Warehouse'],
      entities: ['All'],
      metadataCount: 1,
      glAccounts: ['4100'],
      riskSignals: 0,
    },
  },
  {
    id: 'GC-EXP-001',
    name: 'Expense Management',
    type: 'Group',
    domain: 'Expense',
    bindable: false,
    primaryStandard: 'IAS 1',
    supportingFrameworks: ['ISO 27001'],
    internalPolicy: 'FIN-EXP-01',
    maxDepth: 1,
    linkedItems: '5 Ledgers',
    status: 'ACTIVE',
    riskWeight: 'MEDIUM',
    description: 'Global policy for expense categorization, approval limits, and reimbursement.',
    childrenIds: ['TL-EXP-TRAVEL-001'],
    usage: {
      systems: [],
      entities: ['Global'],
      metadataCount: 0,
      glAccounts: [],
      riskSignals: 0,
    },
  },
  {
    id: 'TL-EXP-TRAVEL-001',
    name: 'Travel & Entertainment',
    type: 'Transaction',
    domain: 'Expense',
    bindable: true,
    primaryStandard: 'Tax Regulation 88',
    supportingFrameworks: ['Internal Audit'],
    internalPolicy: 'FIN-EXP-02',
    maxDepth: 3,
    linkedItems: '15 Cell Canons',
    status: 'ACTIVE',
    riskWeight: 'MEDIUM',
    description: 'Rules for booking, substantiating, and reconciling T&E expenses.',
    parentId: 'GC-EXP-001',
    usage: {
      systems: ['Expensify', 'NetSuite'],
      entities: ['All'],
      metadataCount: 24,
      glAccounts: ['6100', '6120'],
      riskSignals: 1,
    },
  },
  {
    id: 'CC-TAX-GST-001',
    name: 'GST Tax Code',
    type: 'Cell',
    domain: 'Tax',
    bindable: true,
    primaryStandard: 'Local Tax Law',
    supportingFrameworks: ['Statutory Compliance'],
    internalPolicy: 'TAX-01',
    maxDepth: 5,
    linkedItems: '1 Field',
    status: 'ACTIVE',
    riskWeight: 'CRITICAL',
    description: 'Mandatory tax code field for all AP/AR transactions in GST jurisdictions.',
    parentId: 'TL-AP-STD-001',
    usage: {
      systems: ['ERP'],
      entities: ['SG Subsidiary', 'MY Holding'],
      metadataCount: 1,
      glAccounts: ['2200'],
      riskSignals: 0,
    },
  },
];
