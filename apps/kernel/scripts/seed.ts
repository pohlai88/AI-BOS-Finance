/**
 * Database Seeding Script - The "First Breath"
 * 
 * Populates the empty database with the "DNA" of the AIBOS system.
 * This script defines the core entities and fields that form the foundation
 * of the Global Metadata Registry.
 * 
 * Run: npm run seed
 * 
 * @see PRD_KERNEL_01_AIBOS_KERNEL.md
 */

// Load environment variables from root .env.local (monorepo setup)
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load root .env.local first (shared secrets), then app-level .env.local if exists
// seed.ts is in apps/kernel/scripts/, so ../../../ goes to root
config({ path: resolve(__dirname, '../../../.env.local') });
config({ path: resolve(__dirname, '../../.env.local') }); // App-level override (optional)
import { db } from '../src/db/index.js';
import {
  mdmGlobalMetadata,
  mdmEntityCatalog,
  mdmNamingPolicy,
} from '../src/db/schema.js';

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Clear existing data (for development)
    console.log('🧹 Clearing existing data...');
    await db.delete(mdmGlobalMetadata);
    await db.delete(mdmEntityCatalog);
    await db.delete(mdmNamingPolicy);

    // ============================================================================
    // ENTITIES - Core Business Entities
    // ============================================================================

    console.log('📦 Seeding entities...');

    const entities = [
      {
        entityId: 'ENT_INVOICE',
        entityName: 'Invoice',
        entityType: 'transactional' as const,
        domain: 'Finance',
        criticality: 'CRITICAL' as const,
        lifecycleStatus: 'active' as const,
      },
      {
        entityId: 'ENT_PAYMENT',
        entityName: 'Payment',
        entityType: 'transactional' as const,
        domain: 'Finance',
        criticality: 'CRITICAL' as const,
        lifecycleStatus: 'active' as const,
      },
      {
        entityId: 'ENT_VENDOR',
        entityName: 'Vendor',
        entityType: 'master' as const,
        domain: 'Finance',
        criticality: 'HIGH' as const,
        lifecycleStatus: 'active' as const,
      },
    ];

    await db.insert(mdmEntityCatalog).values(entities);
    console.log(`✅ Inserted ${entities.length} entities`);

    // ============================================================================
    // FIELDS - Core Metadata Fields
    // ============================================================================

    console.log('📋 Seeding metadata fields...');

    const fields = [
      // Invoice Fields
      {
        dictId: 'DS-INV-001',
        businessTerm: 'Invoice ID',
        technicalName: 'invoice_id',
        version: '1.0.0',
        domain: 'Finance',
        entityGroup: 'Transactional',
        canonStatus: 'LOCKED' as const,
        classification: 'INTERNAL' as const,
        criticality: 'CRITICAL' as const,
        dataOwner: 'Finance Team',
        dataSteward: 'Data Engineering',
        definitionShort: 'Unique identifier for an invoice',
        definitionFull: 'A unique identifier assigned to each invoice in the system. Used for tracking, reconciliation, and audit purposes.',
        dataTypeBiz: 'TEXT' as const,
        dataTypeTech: 'VARCHAR(50)',
        nullability: false,
        exampleValues: ['INV-2024-001', 'INV-2024-002'],
        sourceOfTruth: 'ERP Core',
        upstreamSrc: 'ERP Core',
        complianceTags: ['SOX', 'IFRS'],
        approvalRequired: true,
      },
      {
        dictId: 'DS-INV-002',
        businessTerm: 'Invoice Total Amount',
        technicalName: 'total_amount',
        version: '1.0.0',
        domain: 'Finance',
        entityGroup: 'Transactional',
        canonStatus: 'LOCKED' as const,
        classification: 'CONFIDENTIAL' as const,
        criticality: 'CRITICAL' as const,
        dataOwner: 'Finance Team',
        dataSteward: 'Data Engineering',
        definitionShort: 'Total monetary value of the invoice',
        definitionFull: 'The total amount due on the invoice, including all line items, taxes, and fees. Expressed in the base currency.',
        dataTypeBiz: 'MONEY' as const,
        dataTypeTech: 'DECIMAL(18,2)',
        precision: '18,2',
        nullability: false,
        exampleValues: ['1000.00', '2500.50'],
        sourceOfTruth: 'ERP Core',
        upstreamSrc: 'ERP Core',
        complianceTags: ['SOX', 'IFRS'],
        approvalRequired: true,
        errorsIfWrong: 'Financial reporting errors, audit failures',
      },
      {
        dictId: 'DS-INV-003',
        businessTerm: 'Invoice Status',
        technicalName: 'status',
        version: '1.0.0',
        domain: 'Finance',
        entityGroup: 'Transactional',
        canonStatus: 'LOCKED' as const,
        classification: 'INTERNAL' as const,
        criticality: 'HIGH' as const,
        dataOwner: 'Finance Team',
        dataSteward: 'Data Engineering',
        definitionShort: 'Current state of the invoice in the workflow',
        definitionFull: 'Indicates the current processing stage of the invoice: draft, submitted, approved, paid, or cancelled.',
        dataTypeBiz: 'ENUM' as const,
        dataTypeTech: 'VARCHAR(20)',
        nullability: false,
        validValues: ['draft', 'submitted', 'approved', 'paid', 'cancelled'],
        exampleValues: ['approved', 'paid'],
        sourceOfTruth: 'ERP Core',
        upstreamSrc: 'ERP Core',
      },
      // Payment Fields
      {
        dictId: 'DS-PAY-001',
        businessTerm: 'Payment ID',
        technicalName: 'payment_id',
        version: '1.0.0',
        domain: 'Finance',
        entityGroup: 'Transactional',
        canonStatus: 'LOCKED' as const,
        classification: 'INTERNAL' as const,
        criticality: 'CRITICAL' as const,
        dataOwner: 'Finance Team',
        dataSteward: 'Data Engineering',
        definitionShort: 'Unique identifier for a payment',
        definitionFull: 'A unique identifier assigned to each payment transaction. Links to invoices and vendor records.',
        dataTypeBiz: 'TEXT' as const,
        dataTypeTech: 'VARCHAR(50)',
        nullability: false,
        exampleValues: ['PAY-2024-001', 'PAY-2024-002'],
        sourceOfTruth: 'Payment Hub',
        upstreamSrc: 'Payment Hub',
        complianceTags: ['SOX', 'IFRS'],
        approvalRequired: true,
      },
      {
        dictId: 'DS-PAY-002',
        businessTerm: 'Payment Amount',
        technicalName: 'amount',
        version: '1.0.0',
        domain: 'Finance',
        entityGroup: 'Transactional',
        canonStatus: 'LOCKED' as const,
        classification: 'CONFIDENTIAL' as const,
        criticality: 'CRITICAL' as const,
        dataOwner: 'Finance Team',
        dataSteward: 'Data Engineering',
        definitionShort: 'Amount paid in the transaction',
        definitionFull: 'The monetary amount transferred in this payment. Must match the invoice total amount (or partial payment amount).',
        dataTypeBiz: 'MONEY' as const,
        dataTypeTech: 'DECIMAL(18,2)',
        precision: '18,2',
        nullability: false,
        exampleValues: ['1000.00', '2500.50'],
        sourceOfTruth: 'Payment Hub',
        upstreamSrc: 'Payment Hub',
        complianceTags: ['SOX', 'IFRS'],
        approvalRequired: true,
        errorsIfWrong: 'Financial reconciliation errors, audit failures',
      },
      // Vendor Fields
      {
        dictId: 'DS-VEN-001',
        businessTerm: 'Vendor Name',
        technicalName: 'vendor_name',
        version: '1.0.0',
        domain: 'Finance',
        entityGroup: 'Master Data',
        canonStatus: 'LOCKED' as const,
        classification: 'INTERNAL' as const,
        criticality: 'HIGH' as const,
        dataOwner: 'Procurement Team',
        dataSteward: 'Data Engineering',
        definitionShort: 'Legal name of the vendor',
        definitionFull: 'The official registered name of the vendor company. Used for contracts, payments, and compliance reporting.',
        dataTypeBiz: 'TEXT' as const,
        dataTypeTech: 'VARCHAR(255)',
        nullability: false,
        exampleValues: ['Acme Corporation', 'Tech Solutions Inc.'],
        sourceOfTruth: 'Vendor Master',
        upstreamSrc: 'Vendor Master',
        complianceTags: ['SOX'],
      },
    ];

    await db.insert(mdmGlobalMetadata).values(fields);
    console.log(`✅ Inserted ${fields.length} metadata fields`);

    // ============================================================================
    // POLICIES - Autonomy Tier Policies
    // ============================================================================

    console.log('🔒 Seeding naming policies...');

    const policies = [
      {
        policyId: 'POLY-TIER-0',
        tier: 0,
        allowedActions: ['read'] as const,
        constraints: {
          description: 'Read-only analysis. No changes allowed.',
        },
      },
      {
        policyId: 'POLY-TIER-1',
        tier: 1,
        allowedActions: ['read'] as const,
        constraints: {
          description: 'Can suggest changes but cannot write.',
        },
      },
      {
        policyId: 'POLY-TIER-2',
        tier: 2,
        allowedActions: ['read'] as const,
        constraints: {
          description: 'Can propose changes but requires approval.',
        },
      },
      {
        policyId: 'POLY-TIER-3',
        tier: 3,
        allowedActions: ['read', 'write'] as const,
        constraints: {
          description: 'Can auto-apply low-risk changes with guardrails.',
        },
      },
    ];

    await db.insert(mdmNamingPolicy).values(policies);
    console.log(`✅ Inserted ${policies.length} naming policies`);

    console.log('✅ Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${entities.length} entities`);
    console.log(`   - ${fields.length} metadata fields`);
    console.log(`   - ${policies.length} naming policies`);
    console.log('\n🧠 The Hippocampus now has memory!');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

// Run seed if executed directly
seed()
  .then(() => {
    console.log('✅ Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });

export { seed };
