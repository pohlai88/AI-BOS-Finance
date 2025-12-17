/**
 * Payment Hub Demo - Foundation Direct
 * 
 * This page uses the foundation CSS classes directly.
 * No backward compatibility mappings required.
 * 
 * Route: /payments/hub-demo
 */

'use client';

import * as React from 'react';
import {
  FileText,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Building,
  TrendingDown,
  Plus,
  RefreshCw,
  Search,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface Payment {
  id: string;
  paymentNumber: string;
  vendorName: string;
  amount: number;
  currency: string;
  paymentDate: string;
  dueDate: string;
  status: 'draft' | 'pending' | 'approved' | 'completed' | 'rejected';
  hasException: boolean;
}

interface DashboardStats {
  totalOpen: number;
  totalAmount: number;
  pendingApprovals: number;
  pendingAmount: number;
  exceptions: number;
  dueThisWeek: number;
}

// ============================================================================
// Mock Data (Deterministic - no Math.random() to avoid hydration mismatch)
// ============================================================================

// Pre-defined amounts to avoid Math.random() hydration issues
const MOCK_AMOUNTS = [
  15420.50, 8750.00, 32100.75, 5200.25, 18900.00,
  42500.00, 9800.50, 27650.25, 11200.00, 38750.75,
  6500.00, 21300.50, 14800.25, 45200.00, 7900.75,
];

const MOCK_EXCEPTIONS = [false, false, true, false, false, false, true, false, false, false, false, false, false, true, false];

function generateMockPayments(count: number): Payment[] {
  const vendors = ['Acme Corp', 'GlobalTech Ltd', 'Office Supplies Inc', 'Cloud Services LLC', 'Tech Ventures'];
  const statuses: Payment['status'][] = ['draft', 'pending', 'approved', 'completed', 'rejected'];

  return Array.from({ length: count }, (_, i) => ({
    id: `pay-${i + 1}`,
    paymentNumber: `PAY-2024-${String(i + 1).padStart(4, '0')}`,
    vendorName: vendors[i % vendors.length],
    amount: MOCK_AMOUNTS[i % MOCK_AMOUNTS.length],
    currency: 'USD',
    paymentDate: '2024-12-15',
    dueDate: '2024-12-25',
    status: statuses[i % statuses.length],
    hasException: MOCK_EXCEPTIONS[i % MOCK_EXCEPTIONS.length],
  }));
}

function generateMockStats(payments: Payment[]): DashboardStats {
  const open = payments.filter(p => p.status !== 'completed' && p.status !== 'rejected');
  const pending = payments.filter(p => p.status === 'pending');
  const exceptions = payments.filter(p => p.hasException);

  return {
    totalOpen: open.length,
    totalAmount: open.reduce((sum, p) => sum + p.amount, 0),
    pendingApprovals: pending.length,
    pendingAmount: pending.reduce((sum, p) => sum + p.amount, 0),
    exceptions: exceptions.length,
    dueThisWeek: 4, // Fixed value instead of calculation
  };
}

// ============================================================================
// Sub-Components (Using Foundation Classes Directly)
// ============================================================================

function StatCard({
  icon: Icon,
  value,
  label,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  trend?: { value: number; direction: 'up' | 'down' };
}) {
  return (
    <div className="bg-card p-5 rounded-lg border border-border">
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-md bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {trend && (
          <span className={`text-caption font-medium ${trend.direction === 'up' ? 'text-green-500' : 'text-red-500'
            }`}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
          </span>
        )}
      </div>
      <div className="mt-4 space-y-1">
        <p className="text-heading text-foreground font-semibold">{value}</p>
        <p className="text-caption text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Payment['status'] }) {
  const config = {
    draft: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Draft' },
    pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', label: 'Pending Approval' },
    approved: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Approved' },
    completed: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Completed' },
    rejected: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Rejected' },
  };

  const { bg, text, label } = config[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
}

function PaymentTable({
  payments,
  onRowClick,
}: {
  payments: Payment[];
  onRowClick: (payment: Payment) => void;
}) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredPayments = React.useMemo(() => {
    if (!searchQuery) return payments;
    const query = searchQuery.toLowerCase();
    return payments.filter(
      p =>
        p.paymentNumber.toLowerCase().includes(query) ||
        p.vendorName.toLowerCase().includes(query)
    );
  }, [payments, searchQuery]);

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-subheading text-foreground font-medium">Active Payments</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-background border border-input rounded-md text-small text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-64"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-6 py-3 text-small font-medium text-muted-foreground">Payment Number</th>
              <th className="text-left px-6 py-3 text-small font-medium text-muted-foreground">Vendor Name</th>
              <th className="text-right px-6 py-3 text-small font-medium text-muted-foreground">Amount</th>
              <th className="text-left px-6 py-3 text-small font-medium text-muted-foreground">Payment Date</th>
              <th className="text-left px-6 py-3 text-small font-medium text-muted-foreground">Due Date</th>
              <th className="text-left px-6 py-3 text-small font-medium text-muted-foreground">Status</th>
              <th className="w-12 px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredPayments.map(payment => (
              <tr
                key={payment.id}
                onClick={() => onRowClick(payment)}
                className="hover:bg-muted/30 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 text-body text-foreground font-medium">
                  {payment.paymentNumber}
                </td>
                <td className="px-6 py-4 text-body text-foreground">
                  {payment.vendorName}
                </td>
                <td className="px-6 py-4 text-body text-foreground text-right font-mono">
                  ${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 text-body text-muted-foreground">
                  {payment.paymentDate}
                </td>
                <td className="px-6 py-4 text-body text-muted-foreground">
                  {payment.dueDate}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={payment.status} />
                </td>
                <td className="px-6 py-4">
                  <button className="p-1 rounded hover:bg-muted transition-colors">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-3 border-t border-border bg-muted/30 flex items-center justify-between">
        <p className="text-caption text-muted-foreground">
          Showing <span className="text-foreground font-medium">{filteredPayments.length}</span> of{' '}
          <span className="text-foreground font-medium">{payments.length}</span> payments
        </p>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-small text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50" disabled>
            Previous
          </button>
          <button className="px-3 py-1.5 text-small text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted transition-colors">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function ExceptionCard({
  count,
  type,
  severity,
}: {
  count: number;
  type: string;
  severity: 'high' | 'medium' | 'low';
}) {
  const severityConfig = {
    high: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30' },
    medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/30' },
    low: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30' },
  };

  const { bg, text, border } = severityConfig[severity];

  return (
    <div className={`p-4 rounded-lg border ${border} ${bg} flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        <AlertTriangle className={`h-5 w-5 ${text}`} />
        <div>
          <p className={`text-small font-medium ${text}`}>{type}</p>
          <p className="text-caption text-muted-foreground">{count} items require attention</p>
        </div>
      </div>
      <button className={`flex items-center gap-1 text-small font-medium ${text} hover:underline`}>
        Review <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function PaymentDetails({
  payment,
  onClose,
}: {
  payment: Payment;
  onClose: () => void;
}) {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h3 className="text-subheading text-foreground font-medium">Payment Details</h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-caption text-muted-foreground mb-1">Payment Number</p>
            <p className="text-body text-foreground font-medium">{payment.paymentNumber}</p>
          </div>
          <div>
            <p className="text-caption text-muted-foreground mb-1">Status</p>
            <StatusBadge status={payment.status} />
          </div>
          <div>
            <p className="text-caption text-muted-foreground mb-1">Vendor</p>
            <p className="text-body text-foreground">{payment.vendorName}</p>
          </div>
          <div>
            <p className="text-caption text-muted-foreground mb-1">Amount</p>
            <p className="text-body text-foreground font-medium font-mono">
              ${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-caption text-muted-foreground mb-1">Payment Date</p>
            <p className="text-body text-foreground">{payment.paymentDate}</p>
          </div>
          <div>
            <p className="text-caption text-muted-foreground mb-1">Due Date</p>
            <p className="text-body text-foreground">{payment.dueDate}</p>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-border">
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-small font-medium hover:bg-primary/90 transition-colors">
            Approve
          </button>
          <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-small font-medium border border-border hover:bg-muted transition-colors">
            Request Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function PaymentHubDemoPage() {
  const [payments] = React.useState<Payment[]>(() => generateMockPayments(15));
  const [stats] = React.useState<DashboardStats>(() => generateMockStats(payments));
  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-display text-foreground font-semibold">Payment Hub</h1>
              </div>
              <p className="text-body text-muted-foreground">
                Foundation Direct • No backward compatibility mappings
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 text-small text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted transition-colors">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-small font-medium hover:bg-primary/90 transition-colors">
                <Plus className="h-4 w-4" />
                New Payment
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-10 space-y-10">
        {/* Stats Grid */}
        <section>
          <div className="mb-6">
            <p className="text-label text-muted-foreground uppercase tracking-wider">Overview</p>
            <h2 className="text-heading text-foreground mt-1">Key Metrics</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard
              icon={FileText}
              value={stats.totalOpen}
              label="Open Payments"
              trend={{ value: 12, direction: 'up' }}
            />
            <StatCard
              icon={DollarSign}
              value={`$${(stats.totalAmount / 1000).toFixed(0)}K`}
              label="Total Amount"
            />
            <StatCard
              icon={Clock}
              value={stats.pendingApprovals}
              label="Pending Approvals"
              trend={{ value: 3, direction: 'down' }}
            />
            <StatCard
              icon={AlertTriangle}
              value={stats.exceptions}
              label="Exceptions"
            />
            <StatCard
              icon={Calendar}
              value={stats.dueThisWeek}
              label="Due This Week"
            />
            <StatCard
              icon={TrendingDown}
              value={2}
              label="Overdue"
            />
          </div>
        </section>

        {/* Exceptions */}
        {stats.exceptions > 0 && (
          <section>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-label text-muted-foreground uppercase tracking-wider">Attention Required</p>
                <h2 className="text-heading text-foreground mt-1">Exceptions</h2>
              </div>
              <button className="text-small text-primary hover:underline">View all</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ExceptionCard count={2} type="Missing Documentation" severity="high" />
              <ExceptionCard count={3} type="Amount Mismatch" severity="medium" />
              <ExceptionCard count={1} type="Duplicate Entry" severity="low" />
            </div>
          </section>
        )}

        {/* Main Content Area */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table */}
          <div className={selectedPayment ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <PaymentTable
              payments={payments}
              onRowClick={setSelectedPayment}
            />
          </div>

          {/* Details Panel */}
          {selectedPayment && (
            <div className="lg:col-span-1">
              <PaymentDetails
                payment={selectedPayment}
                onClose={() => setSelectedPayment(null)}
              />
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <p className="text-caption text-muted-foreground">
            Foundation Direct • globals-foundation.css • No BIOSKIN mappings
          </p>
          <p className="text-caption text-muted-foreground">
            Warm neutrals • Clear hierarchy • Comfortable reading
          </p>
        </div>
      </footer>
    </div>
  );
}
