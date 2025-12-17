/**
 * BioPaymentTable - Schema-driven payment table using Bio Transform Self
 * 
 * Proof of Concept: Demonstrates @aibos/bioskin integration
 * Uses Zod schema introspection to auto-generate table columns.
 * 
 * @see CONT_10 Section 3 - BioSkin Architecture
 * @see Plan Phase 6: Wire BioTable to /payments page as proof of concept
 */

'use client';

import * as React from 'react';
import { z } from 'zod';
import { BioTable, type BioTableProps } from '@aibos/bioskin';
import { PaymentStatusSchema, CurrencyCodeSchema } from '../schemas/paymentZodSchemas';

// ============================================================================
// PAYMENT TABLE SCHEMA (simplified for table display)
// ============================================================================

/**
 * Simplified Payment Schema for Table Display
 * 
 * This schema is tailored for the table view - it includes only the fields
 * that make sense for a list view. The full PaymentResponseSchema is used
 * for detail views/forms.
 */
export const PaymentTableRowSchema = z.object({
  id: z.string().uuid().describe('Payment ID'),
  paymentNumber: z.string().describe('Payment reference number'),
  vendorName: z.string().describe('Vendor receiving payment'),
  amount: z.string().describe('Payment amount'),
  currency: CurrencyCodeSchema.describe('Currency code'),
  paymentDate: z.string().describe('Scheduled payment date'),
  dueDate: z.string().optional().describe('Due date'),
  status: PaymentStatusSchema.describe('Current status'),
}).describe('Payment');

export type PaymentTableRow = z.infer<typeof PaymentTableRowSchema>;

// ============================================================================
// COMPONENT
// ============================================================================

export interface BioPaymentTableProps {
  /** Array of payments to display */
  payments: PaymentTableRow[];
  /** Called when a row is clicked */
  onRowClick?: (payment: PaymentTableRow) => void;
  /** Title for the table */
  title?: string;
  /** Show title */
  showTitle?: boolean;
  /** Additional className */
  className?: string;
}

export function BioPaymentTable({
  payments,
  onRowClick,
  title = 'Payments',
  showTitle = true,
  className,
}: BioPaymentTableProps) {
  return (
    <BioTable<typeof PaymentTableRowSchema.shape>
      schema={PaymentTableRowSchema}
      data={payments}
      onRowClick={onRowClick}
      title={title}
      showTitle={showTitle}
      keyField="id"
      exclude={['id']} // Hide ID column since we have paymentNumber
      className={className}
    />
  );
}

BioPaymentTable.displayName = 'BioPaymentTable';

export default BioPaymentTable;
