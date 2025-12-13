// ============================================================================
// ENTITY GOVERNANCE TYPES - SSOT
// Enterprise Entity Governance Configuration Model
// Implements IFRS/MFRS consolidation logic with full LEM (Legal Entity Management)
// ============================================================================

// ============================================================================
// CORE ENUMS
// ============================================================================

export type EntityType =
  | 'HQ'
  | 'Holding'
  | 'Subsidiary'
  | 'Branch'
  | 'JV'
  | 'Associate'
export type EntityStatus = 'Active' | 'Dormant' | 'Winding-up' | 'Dissolved'
export type ShareClass =
  | 'Common'
  | 'Preferred'
  | 'Preferred-A'
  | 'Preferred-B'
  | 'Others'
export type ShareholderType =
  | 'Company'
  | 'Individual'
  | 'Trust'
  | 'Fund'
  | 'Government'
export type ConsolidationMethod = 'Full' | 'Equity' | 'Proportionate' | 'None'
export type ControlBasis = 'Voting Rights' | 'Contractual' | 'De facto' | 'None'
export type ValidationStatus =
  | 'UNVERIFIED'
  | 'PENDING_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
export type ValidationLevel = 'L1_REGEX' | 'L2_DOC_VERIFIED' | 'L3_API_VERIFIED'
export type BankRelationshipType =
  | 'Operating'
  | 'Loan'
  | 'Custody'
  | 'Investment'
export type DirectorRole =
  | 'Chair'
  | 'Director'
  | 'Independent'
  | 'Executive'
  | 'Non-Executive'
export type OfficerRole =
  | 'Legal Rep'
  | 'GM'
  | 'CEO'
  | 'CFO'
  | 'COO'
  | 'Company Secretary'

// ============================================================================
// SHAREHOLDING STRUCTURE (Tab B)
// ============================================================================

export interface Shareholder {
  id: string
  name: string
  type: ShareholderType
  country: string
  ownershipPercent: number
  shareClass: ShareClass
  numberOfShares?: number
  effectiveFrom: string // ISO date
  effectiveTo?: string // ISO date (null = current)
  isRelatedParty: boolean
  partyId?: string // Link to Party master
}

export interface ConsolidationProfile {
  ultimateParent: string // Entity ID
  immediateParent: string | null // Entity ID
  totalParentOwnership: number // Derived from shareholders
  nciPercent: number // Non-Controlling Interest
  suggestedMethod: ConsolidationMethod // Auto-calculated from ownership %
  actualMethod: ConsolidationMethod // User override
  controlBasis: ControlBasis
  controlStartDate: string // ISO date
  controlEndDate?: string // ISO date (null = ongoing)
  inConsolidationScope: boolean // Toggle - can exclude even if controlled
  consolidationNotes?: string
}

export interface CapitalStructure {
  authorizedCapital: number
  authorizedCurrency: string
  paidUpCapital: number
  paidUpCurrency: string
  shareCurrency?: string // If different from base currency
  parValue?: number
  totalShares?: number
  lastCapitalChangeDate?: string // ISO date
}

// ============================================================================
// OFFICERS & BOARD (Tab C)
// ============================================================================

export interface LegalRepresentative {
  id: string
  personId: string // Link to Party/Contact
  personName: string
  roleTitle: string // e.g., "Managing Director", "Authorized Signatory"
  appointmentDate: string // ISO date
  termEndDate?: string // ISO date
  isActive: boolean
  signatureSpecimen?: string // URL to signature image
  powerOfAttorney?: boolean
}

export interface BoardMember {
  id: string
  personId: string
  personName: string
  role: DirectorRole
  isIndependent: boolean
  committeeRoles: string[] // e.g., ["Audit Committee", "Risk Committee"]
  appointmentDate: string
  resignationDate?: string
  countryOfResidence: string
  isActive: boolean
  shareholding?: number // % if they're also a shareholder
}

export interface KeyOfficer {
  id: string
  personId: string
  personName: string
  role: OfficerRole
  appointmentDate: string
  resignationDate?: string
  isActive: boolean
  reportingTo?: string // Officer ID
}

export interface PrincipalBank {
  id: string
  bankName: string
  bankId?: string // Link to Bank master
  branch: string
  country: string
  relationshipType: BankRelationshipType
  isPrimaryBank: boolean
  accountNumber?: string // Masked
  swiftCode?: string
  contactPerson?: string
  effectiveFrom: string
  effectiveTo?: string
}

// ============================================================================
// DOCUMENTS & VALIDATION (Tab D)
// ============================================================================

export interface EntityDocument {
  id: string
  documentType: string // e.g., "Business Registration", "Tax Certificate"
  documentName: string
  fileUrl: string
  uploadedBy: string // User ID
  uploadedAt: string // ISO timestamp
  expiryDate?: string // ISO date (for licenses)
  isVerified: boolean
  verifiedBy?: string // User ID
  verifiedAt?: string // ISO timestamp
  notes?: string
}

export interface ValidationRecord {
  status: ValidationStatus
  level: ValidationLevel
  verifiedBy?: string // User ID
  verifiedByName?: string
  verifiedAt?: string // ISO timestamp
  rejectedReason?: string
  validationNotes?: string
  lastL1Check?: string // Timestamp
  lastL2Check?: string // Timestamp
  lastL3Check?: string // Timestamp (API call)
  kybProvider?: string // e.g., "Trulioo", "Dow Jones"
  kybReferenceId?: string
}

// ============================================================================
// ENTITY PROFILE (Tab A)
// ============================================================================

export interface EntityProfile {
  // Identity
  id: string
  legalEntityName: string
  tradingName?: string
  entityCode: string // Short code (e.g., "MY01", "SG02")
  entityType: EntityType

  // Geography
  countryOfIncorporation: string
  countryOfOperations: string
  jurisdiction?: string // e.g., "Labuan", "Delaware"

  // Registry
  registrationNumber: string // CR/UEN/Company No
  taxId: string // Tax/VAT ID
  incorporationDate: string // ISO date
  businessLicense?: string
  licenseExpiryDate?: string

  // Status
  status: EntityStatus

  // Currency & Accounting
  baseCurrency: string
  reportingCurrency: string // Group currency
  accountingFramework: 'IFRS' | 'MFRS' | 'US GAAP' | 'Local GAAP'
  fiscalYearEnd: string // e.g., "31 Dec"

  // Operational
  primaryBusinessActivity?: string
  industryCode?: string // NAICS/SIC
  employeeCount?: number
  website?: string
  registeredAddress?: string
  operatingAddress?: string

  // Metadata
  createdAt: string
  createdBy: string
  lastModifiedAt: string
  lastModifiedBy: string
}

// ============================================================================
// COMPLETE ENTITY GOVERNANCE MODEL
// ============================================================================

export interface EntityGovernance {
  // Tab A: Profile
  profile: EntityProfile

  // Tab B: Ownership & Capital
  shareholders: Shareholder[]
  consolidation: ConsolidationProfile
  capital: CapitalStructure

  // Tab C: Officers & Board
  legalRepresentatives: LegalRepresentative[]
  board: BoardMember[]
  keyOfficers: KeyOfficer[]
  principalBanks: PrincipalBank[]

  // Tab D: Documents & Validation
  documents: EntityDocument[]
  validation: ValidationRecord

  // Computed Properties (for UI)
  computed: {
    totalOwnership: number // Sum of all shareholders
    ownershipBalance: number // Should be 100 - totalOwnership (warn if != 0)
    isFullyOwned: boolean // totalParentOwnership >= 95%
    hasNCI: boolean // NCI > 0
    isVerified: boolean // validation.status === 'VERIFIED'
    canConsolidate: boolean // isVerified && inConsolidationScope
    governanceCompleteness: number // % of required fields filled
    missingGovernanceItems: string[] // List of missing items
  }
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface EntityMasterState {
  activeTab: 'profile' | 'ownership' | 'officers' | 'documents'
  entity: EntityGovernance
  isDirty: boolean
  isSaving: boolean
  validationErrors: Record<string, string>
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

export interface ValidationRule {
  field: string
  level: ValidationLevel
  rule: 'required' | 'regex' | 'document_required' | 'api_check'
  pattern?: string // For regex rules
  message: string
}

// Validation rules per country/entity type (can be extended)
export const ENTITY_VALIDATION_RULES: Record<string, ValidationRule[]> = {
  MY: [
    {
      field: 'registrationNumber',
      level: 'L1_REGEX',
      rule: 'regex',
      pattern: '^[0-9]{6}-[A-Z]{1}$',
      message: 'Malaysian CR format: 123456-A',
    },
    {
      field: 'taxId',
      level: 'L1_REGEX',
      rule: 'regex',
      pattern: '^C [0-9]{10}$',
      message: 'Malaysian tax ID format: C 1234567890',
    },
    {
      field: 'businessRegistrationCert',
      level: 'L2_DOC_VERIFIED',
      rule: 'document_required',
      message: 'SSM registration certificate required',
    },
  ],
  SG: [
    {
      field: 'registrationNumber',
      level: 'L1_REGEX',
      rule: 'regex',
      pattern: '^[0-9]{9}[A-Z]{1}$',
      message: 'Singapore UEN format: 123456789A',
    },
    {
      field: 'taxId',
      level: 'L1_REGEX',
      rule: 'regex',
      pattern: '^[0-9]{9}[A-Z]{1}$',
      message: 'Singapore GST format matches UEN',
    },
    {
      field: 'acra',
      level: 'L3_API_VERIFIED',
      rule: 'api_check',
      message: 'ACRA verification required',
    },
  ],
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate suggested consolidation method based on ownership %
 */
export function calculateConsolidationMethod(
  ownershipPercent: number
): ConsolidationMethod {
  if (ownershipPercent > 50) return 'Full'
  if (ownershipPercent >= 20) return 'Equity'
  if (ownershipPercent > 0) return 'Proportionate'
  return 'None'
}

/**
 * Calculate NCI (Non-Controlling Interest)
 */
export function calculateNCI(totalParentOwnership: number): number {
  return Math.max(0, 100 - totalParentOwnership)
}

/**
 * Calculate governance completeness score (0-100%)
 */
export function calculateGovernanceCompleteness(
  entity: EntityGovernance
): number {
  const requiredChecks = [
    entity.profile.legalEntityName.length > 0,
    entity.profile.registrationNumber.length > 0,
    entity.profile.taxId.length > 0,
    entity.shareholders.length > 0,
    entity.capital.authorizedCapital > 0,
    entity.legalRepresentatives.filter((r) => r.isActive).length > 0,
    entity.board.filter((b) => b.isActive).length > 0,
    entity.principalBanks.filter((b) => b.isPrimaryBank).length > 0,
    entity.documents.filter((d) => d.documentType === 'Business Registration')
      .length > 0,
    entity.validation.status === 'VERIFIED',
  ]

  const completed = requiredChecks.filter((check) => check).length
  return Math.round((completed / requiredChecks.length) * 100)
}

/**
 * Get missing governance items
 */
export function getMissingGovernanceItems(entity: EntityGovernance): string[] {
  const missing: string[] = []

  if (!entity.profile.legalEntityName) missing.push('Legal Entity Name')
  if (!entity.profile.registrationNumber) missing.push('Registration Number')
  if (!entity.profile.taxId) missing.push('Tax ID')
  if (entity.shareholders.length === 0) missing.push('Shareholders')
  if (entity.capital.authorizedCapital === 0) missing.push('Authorized Capital')
  if (entity.legalRepresentatives.filter((r) => r.isActive).length === 0)
    missing.push('Legal Representative')
  if (entity.board.filter((b) => b.isActive).length === 0)
    missing.push('Board Members')
  if (entity.principalBanks.filter((b) => b.isPrimaryBank).length === 0)
    missing.push('Primary Bank')
  if (
    entity.documents.filter((d) => d.documentType === 'Business Registration')
      .length === 0
  )
    missing.push('Registration Certificate')
  if (entity.validation.status !== 'VERIFIED')
    missing.push('Entity Verification')

  return missing
}
