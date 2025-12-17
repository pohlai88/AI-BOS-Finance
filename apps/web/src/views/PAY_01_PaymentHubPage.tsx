// ============================================================================
// PAY_01 Payment Hub Page - CFO-Ready Payment Command Center
// Route: /payments or /payment-hub
// 
// This page demonstrates the schema-driven UI generation using @aibos/bioskin.
// Now powered by real-time AP-05 backend APIs for dashboard metrics.
// ============================================================================

'use client';

import * as React from 'react';
import { BioPaymentTable, type PaymentTableRow } from '@/features/payment';
import { 
  PaymentDashboardCards,
  CashPositionWidget,
  ControlHealthWidget,
} from '@/features/payment';
import { Txt, Surface } from '@aibos/bioskin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard,
  Table2,
  Wallet,
  Shield,
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = React.useState('dashboard');

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
              Real-time payment visibility and control
            </Txt>
          </div>
          <Surface variant="subtle" padding="sm" className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            <Txt variant="small" color="secondary">Live Dashboard</Txt>
          </Surface>
        </div>

        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <Table2 className="h-4 w-4" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="cash" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Cash Position</span>
            </TabsTrigger>
            <TabsTrigger value="controls" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Controls</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <PaymentDashboardCards />
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
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
          </TabsContent>

          {/* Cash Position Tab */}
          <TabsContent value="cash" className="space-y-6">
            <CashPositionWidget days={90} />
            
            {/* Additional Cash Context */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Surface variant="subtle" padding="lg">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">💰</div>
                  <div>
                    <Txt variant="subheading" weight="semibold">Cash Projection</Txt>
                    <Txt variant="body" color="secondary" className="mt-1">
                      View scheduled payment obligations by day, week, and month.
                      Plan your cash position with confidence.
                    </Txt>
                  </div>
                </div>
              </Surface>
              <Surface variant="subtle" padding="lg">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">📊</div>
                  <div>
                    <Txt variant="subheading" weight="semibold">Group View</Txt>
                    <Txt variant="body" color="secondary" className="mt-1">
                      Aggregate cash positions across all subsidiaries.
                      One view, all companies.
                    </Txt>
                  </div>
                </div>
              </Surface>
            </div>
          </TabsContent>

          {/* Controls Tab */}
          <TabsContent value="controls" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ControlHealthWidget />
              
              {/* Control Explainer */}
              <Surface variant="card" padding="lg" className="space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <Txt variant="subheading" weight="semibold">Built-in Controls</Txt>
                </div>
                
                <div className="space-y-3">
                  <ControlItem 
                    title="Segregation of Duties (SoD)"
                    description="Creator cannot approve. DB-enforced."
                    status="enforced"
                  />
                  <ControlItem 
                    title="Approval Thresholds"
                    description="Amount-based approval chains up to CFO."
                    status="enforced"
                  />
                  <ControlItem 
                    title="Transactional Audit"
                    description="Every mutation logged atomically."
                    status="enforced"
                  />
                  <ControlItem 
                    title="Optimistic Locking"
                    description="No lost updates with version control."
                    status="enforced"
                  />
                  <ControlItem 
                    title="Period Lock"
                    description="Closed periods block new transactions."
                    status="enforced"
                  />
                </div>
              </Surface>
            </div>
          </TabsContent>
        </Tabs>
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

interface ControlItemProps {
  title: string;
  description: string;
  status: 'enforced' | 'optional' | 'disabled';
}

function ControlItem({ title, description, status }: ControlItemProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-subtle last:border-0">
      <div>
        <Txt variant="body" weight="medium">{title}</Txt>
        <Txt variant="small" color="secondary">{description}</Txt>
      </div>
      <Badge 
        variant={status === 'enforced' ? 'default' : 'outline'} 
        className={status === 'enforced' ? 'bg-emerald-500/20 text-emerald-600 border-0' : ''}
      >
        {status === 'enforced' ? '✓ Enforced' : status}
      </Badge>
    </div>
  );
}
