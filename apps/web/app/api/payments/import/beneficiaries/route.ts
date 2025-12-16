/**
 * Beneficiary Import API
 * 
 * POST /api/payments/import/beneficiaries - Bulk import beneficiaries
 * 
 * Phase 6b Enhancement: Integration Kit
 * 
 * This endpoint allows external systems to import beneficiary bank details
 * for use in payment execution.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPool } from '@/lib/db';
import { getActorContext } from '@/lib/payment-services.server';

// ============================================================================
// SCHEMAS
// ============================================================================

const BankDetailsSchema = z.object({
  accountNumber: z.string().min(1).max(50),
  accountName: z.string().min(1).max(255),
  routingNumber: z.string().max(20).optional(),
  bankName: z.string().min(1).max(255),
  bankCode: z.string().max(20).optional(),
  branchCode: z.string().max(20).optional(),
  swiftCode: z.string().max(11).optional(),
  iban: z.string().max(34).optional(),
  country: z.string().length(2).regex(/^[A-Z]{2}$/, 'Country must be ISO 3166-1 alpha-2'),
});

const BeneficiarySchema = z.object({
  externalId: z.string().min(1).max(100),
  vendorId: z.string().max(100).optional(),
  vendorName: z.string().min(1).max(255),
  bankDetails: BankDetailsSchema,
  metadata: z.record(z.unknown()).optional(),
});

const BulkImportSchema = z.object({
  beneficiaries: z.array(BeneficiarySchema).min(1).max(1000),
  mappingProfile: z.string().optional(),
  skipDuplicates: z.boolean().default(true),
  source: z.string().max(100).optional(),
});

// ============================================================================
// TYPES
// ============================================================================

interface ImportResult {
  imported: string[];
  skipped: string[];
  failed: Array<{ externalId: string; error: string }>;
}

// ============================================================================
// HANDLER
// ============================================================================

/**
 * POST /api/payments/import/beneficiaries - Bulk import beneficiaries
 */
export async function POST(request: NextRequest) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const actor = await getActorContext(request);
    const body = await request.json();

    // Validate input
    const input = BulkImportSchema.parse(body);

    const results: ImportResult = {
      imported: [],
      skipped: [],
      failed: [],
    };

    // Start transaction for atomic operation
    await client.query('BEGIN');

    for (const beneficiary of input.beneficiaries) {
      try {
        // Check for existing beneficiary
        if (input.skipDuplicates) {
          const existing = await client.query<{ id: string }>(`
            SELECT id FROM finance.beneficiaries 
            WHERE tenant_id = $1 AND external_id = $2
          `, [actor.tenantId, beneficiary.externalId]);

          if (existing.rows.length > 0) {
            results.skipped.push(beneficiary.externalId);
            continue;
          }
        }

        // Insert beneficiary
        const result = await client.query<{ id: string }>(`
          INSERT INTO finance.beneficiaries 
            (tenant_id, external_id, vendor_id, vendor_name,
             account_number, account_name, routing_number, bank_name,
             bank_code, branch_code, swift_code, iban, country,
             metadata, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (tenant_id, external_id) 
          DO UPDATE SET
            vendor_id = EXCLUDED.vendor_id,
            vendor_name = EXCLUDED.vendor_name,
            account_number = EXCLUDED.account_number,
            account_name = EXCLUDED.account_name,
            routing_number = EXCLUDED.routing_number,
            bank_name = EXCLUDED.bank_name,
            bank_code = EXCLUDED.bank_code,
            branch_code = EXCLUDED.branch_code,
            swift_code = EXCLUDED.swift_code,
            iban = EXCLUDED.iban,
            country = EXCLUDED.country,
            metadata = EXCLUDED.metadata,
            updated_at = NOW()
          RETURNING id
        `, [
          actor.tenantId,
          beneficiary.externalId,
          beneficiary.vendorId || null,
          beneficiary.vendorName,
          beneficiary.bankDetails.accountNumber,
          beneficiary.bankDetails.accountName,
          beneficiary.bankDetails.routingNumber || null,
          beneficiary.bankDetails.bankName,
          beneficiary.bankDetails.bankCode || null,
          beneficiary.bankDetails.branchCode || null,
          beneficiary.bankDetails.swiftCode || null,
          beneficiary.bankDetails.iban || null,
          beneficiary.bankDetails.country,
          JSON.stringify(beneficiary.metadata || {}),
          actor.userId,
        ]);

        results.imported.push(result.rows[0].id);
      } catch (error) {
        results.failed.push({
          externalId: beneficiary.externalId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Log the import
    await client.query(`
      INSERT INTO finance.beneficiary_import_logs 
        (tenant_id, imported_by, source, total_count, success_count, skip_count, error_count, errors, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      actor.tenantId,
      actor.userId,
      input.source || 'api',
      input.beneficiaries.length,
      results.imported.length,
      results.skipped.length,
      results.failed.length,
      JSON.stringify(results.failed),
      JSON.stringify({ mappingProfile: input.mappingProfile }),
    ]);

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      data: {
        total: input.beneficiaries.length,
        imported: results.imported.length,
        skipped: results.skipped.length,
        failed: results.failed.length,
        details: {
          importedIds: results.imported,
          skippedExternalIds: results.skipped,
          errors: results.failed,
        },
      },
    }, { status: results.failed.length > 0 && results.imported.length === 0 ? 400 : 201 });
  } catch (error) {
    await client.query('ROLLBACK');

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Beneficiary import failed:', error);
    return NextResponse.json(
      { success: false, error: 'Import failed' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
