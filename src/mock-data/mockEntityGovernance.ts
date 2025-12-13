// ============================================================================
// MOCK ENTITY GOVERNANCE DATA
// Realistic enterprise shareholding, officers, and validation data
// ============================================================================

import {
  EntityGovernance,
  Shareholder,
  ConsolidationProfile,
  CapitalStructure,
  LegalRepresentative,
  BoardMember,
  KeyOfficer,
  PrincipalBank,
  EntityDocument,
  ValidationRecord,
  EntityProfile,
  calculateConsolidationMethod,
  calculateNCI,
  calculateGovernanceCompleteness,
  getMissingGovernanceItems,
} from '@/modules/system/types/entity-governance'

// ============================================================================
// MOCK DATA: NEXUS FARMING MY (Fully Verified Subsidiary)
// ============================================================================

const nexusFarmingMY: EntityGovernance = {
  // Tab A: Profile
  profile: {
    id: 'nexus-my',
    legalEntityName: 'Nexus Farming Sdn. Bhd.',
    tradingName: 'Nexus Farms',
    entityCode: 'MY01',
    entityType: 'Subsidiary',
    countryOfIncorporation: 'MY',
    countryOfOperations: 'MY',
    jurisdiction: 'Malaysia',
    registrationNumber: '202301-A',
    taxId: 'C 2345678901',
    incorporationDate: '2023-01-15',
    businessLicense: 'BL-MY-2023-001',
    licenseExpiryDate: '2026-01-14',
    status: 'Active',
    baseCurrency: 'MYR',
    reportingCurrency: 'USD',
    accountingFramework: 'MFRS',
    fiscalYearEnd: '31 Dec',
    primaryBusinessActivity: 'Agricultural Production',
    industryCode: '0111',
    employeeCount: 45,
    website: 'https://nexusfarming.my',
    registeredAddress:
      'Level 12, Menara Nexus, Jalan Sultan Ismail, 50250 Kuala Lumpur',
    operatingAddress: 'Lot 123, Jalan Kebun, 71700 Mantin, Negeri Sembilan',
    createdAt: '2023-01-15T08:00:00Z',
    createdBy: 'system',
    lastModifiedAt: '2025-12-09T10:30:00Z',
    lastModifiedBy: 'admin',
  },

  // Tab B: Ownership & Capital
  shareholders: [
    {
      id: 'sh-001',
      name: 'Nexus Group Holdings Ltd',
      type: 'Company',
      country: 'SG',
      ownershipPercent: 70,
      shareClass: 'Common',
      numberOfShares: 700000,
      effectiveFrom: '2023-01-15',
      isRelatedParty: true,
      partyId: 'nexus-hq',
    },
    {
      id: 'sh-002',
      name: 'AgriTech Ventures Fund II',
      type: 'Fund',
      country: 'SG',
      ownershipPercent: 20,
      shareClass: 'Preferred-A',
      numberOfShares: 200000,
      effectiveFrom: '2023-06-01',
      isRelatedParty: false,
      partyId: 'fund-agritech',
    },
    {
      id: 'sh-003',
      name: 'Tan Sri Ahmad bin Abdullah',
      type: 'Individual',
      country: 'MY',
      ownershipPercent: 10,
      shareClass: 'Common',
      numberOfShares: 100000,
      effectiveFrom: '2023-01-15',
      isRelatedParty: false,
      partyId: 'person-ahmad',
    },
  ],

  consolidation: {
    ultimateParent: 'nexus-hq',
    immediateParent: 'nexus-hq',
    totalParentOwnership: 70,
    nciPercent: 30,
    suggestedMethod: 'Full',
    actualMethod: 'Full',
    controlBasis: 'Voting Rights',
    controlStartDate: '2023-01-15',
    inConsolidationScope: true,
    consolidationNotes:
      'Fully consolidated as per MFRS 10. NCI recognized at 30%.',
  },

  capital: {
    authorizedCapital: 10000000,
    authorizedCurrency: 'MYR',
    paidUpCapital: 5000000,
    paidUpCurrency: 'MYR',
    shareCurrency: 'MYR',
    parValue: 5,
    totalShares: 1000000,
    lastCapitalChangeDate: '2024-03-01',
  },

  // Tab C: Officers & Board
  legalRepresentatives: [
    {
      id: 'lr-001',
      personId: 'person-tan',
      personName: 'Tan Wei Chen',
      roleTitle: 'Managing Director',
      appointmentDate: '2023-01-15',
      isActive: true,
      powerOfAttorney: true,
    },
  ],

  board: [
    {
      id: 'bd-001',
      personId: 'person-lim',
      personName: 'Lim Kian Huat',
      role: 'Chair',
      isIndependent: false,
      committeeRoles: [],
      appointmentDate: '2023-01-15',
      countryOfResidence: 'SG',
      isActive: true,
    },
    {
      id: 'bd-002',
      personId: 'person-tan',
      personName: 'Tan Wei Chen',
      role: 'Executive',
      isIndependent: false,
      committeeRoles: [],
      appointmentDate: '2023-01-15',
      countryOfResidence: 'MY',
      isActive: true,
      shareholding: 0,
    },
    {
      id: 'bd-003',
      personId: 'person-wong',
      personName: 'Wong Mei Ling',
      role: 'Independent',
      isIndependent: true,
      committeeRoles: ['Audit Committee', 'Risk Committee'],
      appointmentDate: '2023-03-01',
      countryOfResidence: 'MY',
      isActive: true,
    },
  ],

  keyOfficers: [
    {
      id: 'ko-001',
      personId: 'person-tan',
      personName: 'Tan Wei Chen',
      role: 'GM',
      appointmentDate: '2023-01-15',
      isActive: true,
    },
    {
      id: 'ko-002',
      personId: 'person-lee',
      personName: 'Lee Siew Yong',
      role: 'CFO',
      appointmentDate: '2023-02-01',
      isActive: true,
      reportingTo: 'ko-001',
    },
    {
      id: 'ko-003',
      personId: 'person-chong',
      personName: 'Chong Kar Mun',
      role: 'Company Secretary',
      appointmentDate: '2023-01-15',
      isActive: true,
    },
  ],

  principalBanks: [
    {
      id: 'bank-001',
      bankName: 'Maybank',
      bankId: 'bank-maybank',
      branch: 'Bukit Bintang Branch',
      country: 'MY',
      relationshipType: 'Operating',
      isPrimaryBank: true,
      accountNumber: '****5678',
      swiftCode: 'MBBEMYKL',
      contactPerson: 'Mr. Raj Kumar',
      effectiveFrom: '2023-01-20',
    },
    {
      id: 'bank-002',
      bankName: 'CIMB Bank',
      bankId: 'bank-cimb',
      branch: 'KL Sentral Branch',
      country: 'MY',
      relationshipType: 'Loan',
      isPrimaryBank: false,
      accountNumber: '****1234',
      swiftCode: 'CIBBMYKL',
      effectiveFrom: '2023-06-15',
    },
  ],

  // Tab D: Documents & Validation
  documents: [
    {
      id: 'doc-001',
      documentType: 'Business Registration',
      documentName: 'SSM Certificate of Incorporation.pdf',
      fileUrl: '/documents/nexus-my/ssm-cert.pdf',
      uploadedBy: 'admin',
      uploadedAt: '2023-01-16T09:00:00Z',
      isVerified: true,
      verifiedBy: 'compliance-officer',
      verifiedByName: 'Sarah Tan',
      verifiedAt: '2023-01-17T14:00:00Z',
    },
    {
      id: 'doc-002',
      documentType: 'Tax Certificate',
      documentName: 'LHDN Tax Registration.pdf',
      fileUrl: '/documents/nexus-my/tax-cert.pdf',
      uploadedBy: 'admin',
      uploadedAt: '2023-01-16T09:15:00Z',
      isVerified: true,
      verifiedBy: 'compliance-officer',
      verifiedByName: 'Sarah Tan',
      verifiedAt: '2023-01-17T14:15:00Z',
    },
    {
      id: 'doc-003',
      documentType: 'Articles of Association',
      documentName: 'M&A - Nexus Farming Sdn Bhd.pdf',
      fileUrl: '/documents/nexus-my/maa.pdf',
      uploadedBy: 'admin',
      uploadedAt: '2023-01-16T10:00:00Z',
      isVerified: true,
      verifiedBy: 'legal',
      verifiedByName: 'David Chong',
      verifiedAt: '2023-01-18T11:00:00Z',
    },
  ],

  validation: {
    status: 'VERIFIED',
    level: 'L2_DOC_VERIFIED',
    verifiedBy: 'compliance-officer',
    verifiedByName: 'Sarah Tan',
    verifiedAt: '2023-01-18T16:00:00Z',
    validationNotes:
      'All registration documents verified against SSM records. Tax ID confirmed with LHDN.',
    lastL1Check: '2023-01-17T10:00:00Z',
    lastL2Check: '2023-01-18T16:00:00Z',
  },

  // Computed Properties
  computed: {
    totalOwnership: 100,
    ownershipBalance: 0,
    isFullyOwned: false,
    hasNCI: true,
    isVerified: true,
    canConsolidate: true,
    governanceCompleteness: 100,
    missingGovernanceItems: [],
  },
}

// ============================================================================
// MOCK DATA: NEXUS RETAIL SG (Unverified, Pending Governance)
// ============================================================================

const nexusRetailSG: EntityGovernance = {
  // Tab A: Profile
  profile: {
    id: 'nexus-sg',
    legalEntityName: 'Nexus Retail Pte. Ltd.',
    tradingName: 'Nexus Shop',
    entityCode: 'SG01',
    entityType: 'Subsidiary',
    countryOfIncorporation: 'SG',
    countryOfOperations: 'SG',
    jurisdiction: 'Singapore',
    registrationNumber: '202312345A',
    taxId: '202312345A',
    incorporationDate: '2023-11-01',
    businessLicense: 'ACRA-2023-SG-001',
    status: 'Dormant',
    baseCurrency: 'SGD',
    reportingCurrency: 'USD',
    accountingFramework: 'IFRS',
    fiscalYearEnd: '31 Dec',
    primaryBusinessActivity: 'Retail Trade',
    industryCode: '4711',
    employeeCount: 0,
    website: 'https://nexusretail.sg',
    registeredAddress: '1 Marina Boulevard, #20-01, Singapore 018989',
    createdAt: '2023-11-01T08:00:00Z',
    createdBy: 'system',
    lastModifiedAt: '2025-12-09T08:00:00Z',
    lastModifiedBy: 'admin',
  },

  // Tab B: Ownership & Capital (INCOMPLETE)
  shareholders: [
    {
      id: 'sh-sg-001',
      name: 'Nexus Group Holdings Ltd',
      type: 'Company',
      country: 'SG',
      ownershipPercent: 100,
      shareClass: 'Common',
      numberOfShares: 100000,
      effectiveFrom: '2023-11-01',
      isRelatedParty: true,
      partyId: 'nexus-hq',
    },
  ],

  consolidation: {
    ultimateParent: 'nexus-hq',
    immediateParent: 'nexus-hq',
    totalParentOwnership: 100,
    nciPercent: 0,
    suggestedMethod: 'Full',
    actualMethod: 'Full',
    controlBasis: 'Voting Rights',
    controlStartDate: '2023-11-01',
    inConsolidationScope: false, // Dormant - excluded from scope
    consolidationNotes:
      'Dormant entity. Not included in consolidation scope until activated.',
  },

  capital: {
    authorizedCapital: 1000000,
    authorizedCurrency: 'SGD',
    paidUpCapital: 100000,
    paidUpCurrency: 'SGD',
    shareCurrency: 'SGD',
    parValue: 1,
    totalShares: 100000,
  },

  // Tab C: Officers & Board (MISSING)
  legalRepresentatives: [],
  board: [],
  keyOfficers: [],
  principalBanks: [],

  // Tab D: Documents & Validation (PENDING)
  documents: [
    {
      id: 'doc-sg-001',
      documentType: 'Business Registration',
      documentName: 'ACRA BizFile.pdf',
      fileUrl: '/documents/nexus-sg/acra.pdf',
      uploadedBy: 'admin',
      uploadedAt: '2023-11-02T10:00:00Z',
      isVerified: false,
    },
  ],

  validation: {
    status: 'PENDING_REVIEW',
    level: 'L1_REGEX',
    validationNotes:
      'Awaiting governance setup. Missing legal representative, board, and bank details.',
    lastL1Check: '2023-11-02T10:00:00Z',
  },

  // Computed Properties
  computed: {
    totalOwnership: 100,
    ownershipBalance: 0,
    isFullyOwned: true,
    hasNCI: false,
    isVerified: false,
    canConsolidate: false, // Cannot consolidate until verified
    governanceCompleteness: 40,
    missingGovernanceItems: [
      'Legal Representative',
      'Board Members',
      'Primary Bank',
      'Entity Verification',
    ],
  },
}

// ============================================================================
// MOCK DATA: NEXUS FARMING VN (Partial Governance)
// ============================================================================

const nexusFarmingVN: EntityGovernance = {
  profile: {
    id: 'nexus-vn',
    legalEntityName: 'Nexus Farming Vietnam Co., Ltd.',
    tradingName: 'Nexus Farms VN',
    entityCode: 'VN01',
    entityType: 'Subsidiary',
    countryOfIncorporation: 'VN',
    countryOfOperations: 'VN',
    jurisdiction: 'Vietnam',
    registrationNumber: '0123456789',
    taxId: '0123456789',
    incorporationDate: '2024-01-10',
    businessLicense: 'BRC-VN-2024-001',
    licenseExpiryDate: '2027-01-09',
    status: 'Active',
    baseCurrency: 'VND',
    reportingCurrency: 'USD',
    accountingFramework: 'Local GAAP',
    fiscalYearEnd: '31 Dec',
    primaryBusinessActivity: 'Agricultural Production',
    industryCode: '0111',
    employeeCount: 28,
    registeredAddress: '123 Nguyen Hue Street, District 1, Ho Chi Minh City',
    operatingAddress: 'Long An Province Industrial Zone, Plot 45',
    createdAt: '2024-01-10T08:00:00Z',
    createdBy: 'system',
    lastModifiedAt: '2025-12-09T09:00:00Z',
    lastModifiedBy: 'admin',
  },

  shareholders: [
    {
      id: 'sh-vn-001',
      name: 'Nexus Farming Sdn. Bhd.',
      type: 'Company',
      country: 'MY',
      ownershipPercent: 60,
      shareClass: 'Common',
      numberOfShares: 600000,
      effectiveFrom: '2024-01-10',
      isRelatedParty: true,
      partyId: 'nexus-my',
    },
    {
      id: 'sh-vn-002',
      name: 'Vietnam Growth Fund III',
      type: 'Fund',
      country: 'VN',
      ownershipPercent: 40,
      shareClass: 'Preferred-A',
      numberOfShares: 400000,
      effectiveFrom: '2024-03-01',
      isRelatedParty: false,
    },
  ],

  consolidation: {
    ultimateParent: 'nexus-hq',
    immediateParent: 'nexus-my',
    totalParentOwnership: 60,
    nciPercent: 40,
    suggestedMethod: 'Full',
    actualMethod: 'Full',
    controlBasis: 'Voting Rights',
    controlStartDate: '2024-01-10',
    inConsolidationScope: true,
  },

  capital: {
    authorizedCapital: 20000000000,
    authorizedCurrency: 'VND',
    paidUpCapital: 10000000000,
    paidUpCurrency: 'VND',
    shareCurrency: 'VND',
    totalShares: 1000000,
  },

  legalRepresentatives: [
    {
      id: 'lr-vn-001',
      personId: 'person-nguyen',
      personName: 'Nguyen Van Anh',
      roleTitle: 'General Director',
      appointmentDate: '2024-01-10',
      isActive: true,
    },
  ],

  board: [
    {
      id: 'bd-vn-001',
      personId: 'person-nguyen',
      personName: 'Nguyen Van Anh',
      role: 'Chair',
      isIndependent: false,
      committeeRoles: [],
      appointmentDate: '2024-01-10',
      countryOfResidence: 'VN',
      isActive: true,
    },
  ],

  keyOfficers: [
    {
      id: 'ko-vn-001',
      personId: 'person-nguyen',
      personName: 'Nguyen Van Anh',
      role: 'GM',
      appointmentDate: '2024-01-10',
      isActive: true,
    },
  ],

  principalBanks: [
    {
      id: 'bank-vn-001',
      bankName: 'Vietcombank',
      branch: 'HCMC Branch',
      country: 'VN',
      relationshipType: 'Operating',
      isPrimaryBank: true,
      accountNumber: '****9876',
      effectiveFrom: '2024-01-15',
    },
  ],

  documents: [
    {
      id: 'doc-vn-001',
      documentType: 'Business Registration',
      documentName: 'DPI Business Registration Certificate.pdf',
      fileUrl: '/documents/nexus-vn/dpi-cert.pdf',
      uploadedBy: 'admin',
      uploadedAt: '2024-01-11T10:00:00Z',
      isVerified: true,
      verifiedBy: 'compliance-officer',
      verifiedByName: 'Sarah Tan',
      verifiedAt: '2024-01-12T15:00:00Z',
    },
  ],

  validation: {
    status: 'VERIFIED',
    level: 'L2_DOC_VERIFIED',
    verifiedBy: 'compliance-officer',
    verifiedByName: 'Sarah Tan',
    verifiedAt: '2024-01-12T15:00:00Z',
    lastL1Check: '2024-01-11T10:00:00Z',
    lastL2Check: '2024-01-12T15:00:00Z',
  },

  computed: {
    totalOwnership: 100,
    ownershipBalance: 0,
    isFullyOwned: false,
    hasNCI: true,
    isVerified: true,
    canConsolidate: true,
    governanceCompleteness: 100,
    missingGovernanceItems: [],
  },
}

// ============================================================================
// EXPORT ALL MOCK DATA
// ============================================================================

export const MOCK_ENTITY_GOVERNANCE: Record<string, EntityGovernance> = {
  'nexus-my': nexusFarmingMY,
  'nexus-sg': nexusRetailSG,
  'nexus-vn': nexusFarmingVN,
}

// Helper to get entity by ID
export function getEntityGovernance(entityId: string): EntityGovernance | null {
  return MOCK_ENTITY_GOVERNANCE[entityId] || null
}

// Calculate computed properties for all entities
export function computeEntityProperties(
  entity: EntityGovernance
): EntityGovernance {
  const totalOwnership = entity.shareholders.reduce(
    (sum, sh) => sum + sh.ownershipPercent,
    0
  )

  return {
    ...entity,
    computed: {
      totalOwnership,
      ownershipBalance: 100 - totalOwnership,
      isFullyOwned: entity.consolidation.totalParentOwnership >= 95,
      hasNCI: entity.consolidation.nciPercent > 0,
      isVerified: entity.validation.status === 'VERIFIED',
      canConsolidate:
        entity.validation.status === 'VERIFIED' &&
        entity.consolidation.inConsolidationScope,
      governanceCompleteness: calculateGovernanceCompleteness(entity),
      missingGovernanceItems: getMissingGovernanceItems(entity),
    },
  }
}
