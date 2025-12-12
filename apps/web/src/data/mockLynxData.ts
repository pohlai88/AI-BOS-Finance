export interface LynxMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  structuredResponse?: StructuredResponse;
}

export interface StructuredResponse {
  directAnswer: string;
  canonBasis: {
    title: string;
    items: { id: string; name: string; type: string }[];
    summary: string;
  };
  standards: {
    primary: string;
    supporting: string[];
    internal: string;
  };
  evidence: {
    summary: string;
    stats: { label: string; value: string; color?: string }[];
  };
  siloDiagnosis?: {
    nature: 'HIDDEN' | 'UNKNOWN' | 'INTENTIONAL' | 'COMMUNICATION';
    confidence: string;
    vector: string;
    description: string;
  };
  risk: {
    types: string[];
    impact: string;
  };
  nextSteps: string[];
  links: { label: string; type: string }[];
}

// NEW SCENARIO: The "Silent CAPEX Boost" (The CFO Trap)
export const mockLynxHistory: LynxMessage[] = [
  {
    id: 'msg_01',
    role: 'user',
    content: 'Why is our EBITDA 12% higher than forecast this month? Did we sell more?',
    timestamp: '10:42 AM',
  },
  {
    id: 'msg_02',
    role: 'assistant',
    content: '',
    timestamp: '10:42 AM',
    structuredResponse: {
      directAnswer:
        "No, sales are flat. EBITDA is inflated by $2.4M due to a manual reclassification of 'Cloud Hosting Costs' (OPEX) to 'Software Assets' (CAPEX) on Dec 28th.",
      canonBasis: {
        title: 'Canon Violation Detected',
        items: [
          { id: 'CPX-SFT-001', name: 'Capitalization of Intangibles', type: 'rule' },
          { id: 'EVID-LNK-099', name: 'Timesheet Linkage Requirement', type: 'rule' },
        ],
        summary:
          'Canon CPX-SFT-001 strictly requires R&D timesheets to justify capitalizing software costs. Journal #J-9942 has ZERO linked timesheets.',
      },
      standards: {
        primary: 'IAS 38 (Intangible Assets) — Para 57',
        supporting: ['GAAP ASC 350-40 (Internal-Use Software)'],
        internal: 'FIN-POL-08: R&D Capitalization Thresholds',
      },
      evidence: {
        summary: 'I traced the lineage of Journal #J-9942:',
        stats: [
          { label: 'Reclassified Amount', value: '$2,400,000', color: '#FBBF24' },
          { label: 'Linked Evidence', value: '0 Timesheets', color: '#EF4444' },
          { label: 'EBITDA Impact', value: '+12.4% (Artificial)', color: '#EF4444' },
        ],
      },
      siloDiagnosis: {
        nature: 'INTENTIONAL',
        confidence: '99.8%',
        vector: 'Manual Decoupling',
        description:
          "The 'Cloud Hosting' metadata was manually stripped by user CFO_ADJ_01. This indicates deliberate obfuscation to bypass OPEX budget limits.",
      },
      risk: {
        types: ['Financial Misstatement', 'Audit Failure'],
        impact:
          'This artificially boosts profit. External auditors will likely force a write-off, reversing this EBITDA gain and triggering a restatement.',
      },
      nextSteps: [
        'Reverse Journal #J-9942 immediately to restore OPEX.',
        'Request Engineering to tag timesheets if this was legitimate work.',
        "Lock manual journals to 'CAPEX' accounts without evidence attachment.",
      ],
      links: [
        { label: 'View Journal #J-9942', type: 'radar' },
        { label: 'Open Canon CPX-SFT-001', type: 'canon' },
        { label: 'Review EBITDA Bridge', type: 'factsheet' },
      ],
    },
  },
];

export const mockLynxPresets = [
  { id: 'q1', text: "Scan for 'Profit Smoothing' adjustments.", category: 'Risk Radar' },
  { id: 'q2', text: 'Show me unlinked Capitalized Interest.', category: 'Health Scan' },
  { id: 'q3', text: 'Explain the variance in Q4 T&E expenses.', category: 'Risk Radar' },
  { id: 'q4', text: "Audit my 'Suspense Account' usage.", category: 'Audit Trail' },
];
