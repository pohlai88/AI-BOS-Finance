/**
 * PaymentBioTableDemo - Proof of Concept for BioTable
 * 
 * Demonstrates the Bio Transform Self architecture by auto-generating
 * a payment table from the PaymentResponseSchema.
 * 
 * @see CONT_10 Section 3 - BioSkin Architecture
 * @see Phase 6: Wire BioTable to /payments page as proof of concept
 */

'use client';

import * as React from 'react';
import { z } from 'zod';
import { BioTable, Surface, Txt, DetailSheet, StatusBadge } from '@aibos/bioskin';

// Simplified Payment Schema for BioTable demonstration
// Uses .describe() for human-readable column labels
const PaymentDisplaySchema = z.object({
  id: z.string().uuid().describe('Payment ID'),
  paymentNumber: z.string().describe('Payment #'),
  vendorName: z.string().describe('Vendor'),
  amount: z.string().describe('Amount'),
  currency: z.string().describe('Currency'),
  status: z.enum(['draft', 'pending_approval', 'approved', 'rejected', 'processing', 'completed', 'failed']).describe('Status'),
  paymentDate: z.string().describe('Payment Date'),
  createdAt: z.string().describe('Created'),
}).describe('Payments');

type PaymentDisplay = z.infer<typeof PaymentDisplaySchema>;

// Mock data for demonstration
const mockPayments: PaymentDisplay[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    paymentNumber: 'PAY-2024-001',
    vendorName: 'Acme Corporation',
    amount: '15000.00',
    currency: 'USD',
    status: 'completed',
    paymentDate: '2024-12-15',
    createdAt: '2024-12-10T10:30:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    paymentNumber: 'PAY-2024-002',
    vendorName: 'Tech Solutions Ltd',
    amount: '8500.50',
    currency: 'USD',
    status: 'pending_approval',
    paymentDate: '2024-12-18',
    createdAt: '2024-12-12T14:15:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    paymentNumber: 'PAY-2024-003',
    vendorName: 'Global Supplies Inc',
    amount: '22750.00',
    currency: 'EUR',
    status: 'approved',
    paymentDate: '2024-12-20',
    createdAt: '2024-12-14T09:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    paymentNumber: 'PAY-2024-004',
    vendorName: 'Local Services Co',
    amount: '3200.00',
    currency: 'USD',
    status: 'draft',
    paymentDate: '2024-12-22',
    createdAt: '2024-12-15T16:45:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    paymentNumber: 'PAY-2024-005',
    vendorName: 'Premium Partners',
    amount: '45000.00',
    currency: 'GBP',
    status: 'processing',
    paymentDate: '2024-12-16',
    createdAt: '2024-12-11T11:20:00Z',
  },
];

export interface PaymentBioTableDemoProps {
  className?: string;
}

export function PaymentBioTableDemo({ className }: PaymentBioTableDemoProps) {
  const [selectedPayment, setSelectedPayment] = React.useState<PaymentDisplay | null>(null);

  const handleRowClick = (row: PaymentDisplay) => {
    setSelectedPayment(row);
  };

  return (
    <div className={className}>
      <Surface className="mb-6">
        <Txt variant="heading" as="h2" className="mb-2">
          Bio Transform Self - Proof of Concept
        </Txt>
        <Txt variant="body" color="secondary">
          This table is auto-generated from a Zod schema using BioTable.
          Column headers, types, and formatting are derived from schema introspection.
        </Txt>
      </Surface>

      <BioTable
        schema={PaymentDisplaySchema}
        data={mockPayments}
        onRowClick={handleRowClick}
        keyField="id"
        include={['paymentNumber', 'vendorName', 'amount', 'currency', 'status', 'paymentDate']}
        title="Recent Payments"
      />

      {selectedPayment && (
        <Surface className="mt-6">
          <Txt variant="subheading" as="h3" className="mb-4">
            Selected Payment Details
          </Txt>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Txt variant="label" color="secondary">Payment Number</Txt>
              <Txt variant="body">{selectedPayment.paymentNumber}</Txt>
            </div>
            <div>
              <Txt variant="label" color="secondary">Vendor</Txt>
              <Txt variant="body">{selectedPayment.vendorName}</Txt>
            </div>
            <div>
              <Txt variant="label" color="secondary">Amount</Txt>
              <Txt variant="body">{selectedPayment.currency} {selectedPayment.amount}</Txt>
            </div>
            <div>
              <Txt variant="label" color="secondary">Status</Txt>
              <Txt variant="body" className="capitalize">{selectedPayment.status.replace('_', ' ')}</Txt>
            </div>
          </div>
        </Surface>
      )}
    </div>
  );
}

PaymentBioTableDemo.displayName = 'PaymentBioTableDemo';

export default PaymentBioTableDemo;
