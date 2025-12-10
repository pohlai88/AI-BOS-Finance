export interface IndustrialCanonRecord {
  id: string;
  system: string;
  type: 'Open SME ERP' | 'Enterprise ERP' | 'Process Framework' | 'UX Reference';
  domain_strength: string;
  access_level: 'Open Source' | 'Proprietary' | 'Public Standard';
  nexus_usage: string;
}

export const industrialCanonRegistry: IndustrialCanonRecord[] = [
  {
    id: 'IND_01',
    system: 'ERPNext',
    type: 'Open SME ERP',
    domain_strength: 'Integrated Accounting, DocTypes',
    access_level: 'Open Source',
    nexus_usage: 'SME Accounting Operations Canon (Entities & State Machines)'
  },
  {
    id: 'IND_02',
    system: 'Odoo',
    type: 'Open SME ERP',
    domain_strength: 'Modular Apps, Multi-Company, Branch Logic',
    access_level: 'Open Source',
    nexus_usage: 'Branch/Multi-company reference & Mid-market logic'
  },
  {
    id: 'IND_03',
    system: 'SAP S/4HANA',
    type: 'Enterprise ERP',
    domain_strength: 'Best Practices (R2R, P2P, O2C)',
    access_level: 'Proprietary',
    nexus_usage: 'Enterprise Process Canon & Standard Config Objects'
  },
  {
    id: 'IND_04',
    system: 'Microsoft D365',
    type: 'Enterprise ERP',
    domain_strength: 'Financial Dimensions, Entity Model',
    access_level: 'Proprietary',
    nexus_usage: 'Entity & Dimension Model Reference'
  },
  {
    id: 'IND_05',
    system: 'APQC PCF',
    type: 'Process Framework',
    domain_strength: 'Process Taxonomy, KPIs, Benchmarks',
    access_level: 'Public Standard',
    nexus_usage: 'Backbone Vocabulary & Standard Process IDs (L1-L3)'
  },
  {
    id: 'IND_06',
    system: 'Xero / QuickBooks',
    type: 'UX Reference',
    domain_strength: 'SME Usability, Bank Feeds, Reconciliation',
    access_level: 'Proprietary',
    nexus_usage: 'Interaction Patterns & User Experience Benchmarks'
  }
];
