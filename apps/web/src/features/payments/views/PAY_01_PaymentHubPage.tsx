// ============================================================================
// PAY_01 Payment Hub Page - Bio Transform Self Proof of Concept
// Route: /payments or /payment-hub
// 
// This page demonstrates the schema-driven UI generation using @aibos/bioskin.
// The BioPaymentTable auto-generates columns from the PaymentTableRowSchema.
// ============================================================================

'use client';

import * as React from 'react';
import { BioPaymentTable, type PaymentTableRow } from '@/features/payment';
import { Txt, Surface } from '@aibos/bioskin';

// ============================================================================
// MOCK DATA - In production, this comes from API
// ============================================================================

const MOCK_PAYMENTS: PaymentTableRow[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    paymentNumber: 'PAY-2024-0001',
    vendorName: 'Acme Corp',
    amount: '15000.00',
    currency: 'USD',
    paymentDate: '2024-12-20',
    dueDate: '2024-12-25',
    status: 'pending_approval',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    paymentNumber: 'PAY-2024-0002',
    vendorName: 'GlobalTech Ltd',
    amount: '8500.50',
    currency: 'EUR',
    paymentDate: '2024-12-18',
    dueDate: '2024-12-22',
    status: 'approved',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    paymentNumber: 'PAY-2024-0003',
    vendorName: 'Office Supplies Inc',
    amount: '1250.00',
    currency: 'USD',
    paymentDate: '2024-12-15',
    status: 'completed',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    paymentNumber: 'PAY-2024-0004',
    vendorName: 'Cloud Services LLC',
    amount: '3200.00',
    currency: 'USD',
    paymentDate: '2024-12-21',
    dueDate: '2024-12-28',
    status: 'draft',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    paymentNumber: 'PAY-2024-0005',
    vendorName: 'Legal Partners LLP',
    amount: '12750.00',
    currency: 'GBP',
    paymentDate: '2024-12-19',
    dueDate: '2024-12-26',
    status: 'processing',
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function PAY01PaymentHubPage() {
  const [selectedPayment, setSelectedPayment] = React.useState<PaymentTableRow | null>(null);

  const handleRowClick = React.useCallback((payment: PaymentTableRow) => {
    setSelectedPayment(payment);
  }, []);

  return (
    <div className="min-h-screen bg-background p-layout-lg">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Txt variant="display" as="h1">Payment Hub</Txt>
            <Txt variant="body" color="secondary">
              Schema-driven payment management powered by Bio Transform Self
            </Txt>
          </div>
          <Surface variant="subtle" padding="sm" className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            <Txt variant="small" color="secondary">BioTable Active</Txt>
          </Surface>
        </div>

        {/* Bio Transform Self Info Banner */}
        <Surface variant="glass" padding="md" className="border-primary/20">
          <div className="flex items-start gap-4">
            <div className="text-2xl">🧬</div>
            <div>
              <Txt variant="subheading" weight="semibold">Bio Transform Self - Proof of Concept</Txt>
              <Txt variant="body" color="secondary" className="mt-1">
                This table is auto-generated from <code className="px-1 bg-surface-subtle rounded">PaymentTableRowSchema</code> using Zod schema introspection.
                Columns, labels, and data types are derived automatically from the schema definition.
              </Txt>
            </div>
          </div>
        </Surface>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Table */}
          <div className="lg:col-span-2">
            <BioPaymentTable
              payments={MOCK_PAYMENTS}
              onRowClick={handleRowClick}
              title="Active Payments"
            />
          </div>

          {/* Selected Payment Detail */}
          <div className="lg:col-span-1">
            {selectedPayment ? (
              <Surface padding="lg" className="space-y-4">
                <Txt variant="subheading" weight="semibold">Payment Details</Txt>
                <div className="space-y-3">
                  <DetailRow label="Payment #" value={selectedPayment.paymentNumber} />
                  <DetailRow label="Vendor" value={selectedPayment.vendorName} />
                  <DetailRow label="Amount" value={`${selectedPayment.amount} ${selectedPayment.currency}`} />
                  <DetailRow label="Payment Date" value={selectedPayment.paymentDate} />
                  {selectedPayment.dueDate && (
                    <DetailRow label="Due Date" value={selectedPayment.dueDate} />
                  )}
                  <DetailRow label="Status" value={selectedPayment.status} />
                </div>
              </Surface>
            ) : (
              <Surface padding="lg" className="flex flex-col items-center justify-center min-h-[200px] text-center">
                <Txt variant="body" color="tertiary">
                  Click a row to view payment details
                </Txt>
              </Surface>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-subtle last:border-0">
      <Txt variant="small" color="secondary">{label}</Txt>
      <Txt variant="body" weight="medium">{value}</Txt>
    </div>
  );
}
