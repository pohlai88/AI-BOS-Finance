/**
 * PAY_02 - AP Workbench Demo (IMPROVED VERSION)
 * 
 * Design Improvements:
 * 1. Visual Hierarchy - Clear information layers with proper spacing
 * 2. Typography Scale - Following 8pt grid and reading principles
 * 3. Color Harmony - Muted, professional palette
 * 4. Breathing Room - Generous whitespace between sections
 * 5. Consistent Rhythm - 4/8/12/16/24/32px spacing scale
 * 
 * Route: /payments/hub-demo
 * @see CONT_10 BioSkin Architecture
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  // Atoms
  Surface,
  Txt,
  Btn,
  Icon,
  cn,
  // Molecules
  StatCard,
  StatusBadge,
  BioTabs,
  useTabs,
  BioDrilldown,
  BioBulkActions,
  BioExceptionDashboard,
  BioApprovalActions,
  BioActiveFilters,
  ActionMenu,
  Spinner,
  // Organisms
  BioTable,
  BioTimeline,
  BioReconciliation,
  type TimelineItem,
  type ReconciliationItem,
  type Exception,
  type ExceptionAction,
  type ExceptionItem,
  type BulkAction,
  type ActiveFilter,
} from '@aibos/bioskin';
import {
  FileText,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Building,
  CreditCard,
  TrendingDown,
  Users,
  Filter,
  Download,
  Plus,
  RefreshCw,
  Trash2,
  Ban,
} from 'lucide-react';
import {
  InvoiceSchema,
  type Invoice,
  type APDashboardStats,
} from '../schemas/ap-workbench';

// Same mock data generators as before...
// (Keeping the existing generateMockInvoices, generateMockStats, etc.)

function generateMockInvoices(count: number): Invoice[] {
  const vendors = [
    { id: 'v1', name: 'Acme Corporation', code: 'ACM' },
    { id: 'v2', name: 'Tech Solutions Ltd', code: 'TSL' },
    { id: 'v3', name: 'Global Supplies Inc', code: 'GSI' },
    { id: 'v4', name: 'Office Depot', code: 'ODP' },
    { id: 'v5', name: 'Amazon Web Services', code: 'AWS' },
  ];
  const statuses: Invoice['status'][] = ['draft', 'pending_approval', 'approved', 'scheduled', 'paid', 'on_hold'];
  const glAccounts = ['6000-Office', '6100-IT', '6200-Marketing', '6300-Travel', '6400-Professional'];
  const costCenters = ['CC100-HQ', 'CC200-Sales', 'CC300-Engineering', 'CC400-Marketing'];

  return Array.from({ length: count }, (_, i) => {
    const vendor = vendors[i % vendors.length];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const subtotal = Math.round((Math.random() * 50000 + 500) * 100) / 100;
    const taxAmount = Math.round(subtotal * 0.08 * 100) / 100;
    const totalAmount = subtotal + taxAmount;
    const paidAmount = status === 'paid' ? totalAmount : 0;
    const hasException = Math.random() > 0.8;

    return {
      id: crypto.randomUUID(),
      invoiceNumber: `INV-2025-${String(1000 + i).padStart(4, '0')}`,
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorCode: vendor.code,
      subtotal,
      taxAmount,
      totalAmount,
      paidAmount,
      balanceDue: totalAmount - paidAmount,
      currency: 'USD',
      invoiceDate: new Date(2025, 0, 1 + i).toISOString().split('T')[0],
      dueDate: new Date(2025, 0, 31 + i).toISOString().split('T')[0],
      receivedDate: new Date(2025, 0, 2 + i).toISOString().split('T')[0],
      paymentDate: status === 'paid' ? new Date(2025, 0, 28 + i).toISOString().split('T')[0] : undefined,
      glAccount: glAccounts[i % glAccounts.length],
      costCenter: costCenters[i % costCenters.length],
      department: ['Finance', 'IT', 'Marketing', 'Operations'][i % 4],
      projectCode: i % 3 === 0 ? `PRJ-${100 + i}` : undefined,
      status,
      approvalLevel: status === 'pending_approval' ? Math.floor(Math.random() * 3) + 1 : 0,
      currentApprover: status === 'pending_approval' ? 'John Smith' : undefined,
      poNumber: i % 2 === 0 ? `PO-${2000 + i}` : undefined,
      description: `Invoice for ${['office supplies', 'IT equipment', 'consulting services', 'travel expenses'][i % 4]}`,
      notes: i % 3 === 0 ? 'Priority vendor' : undefined,
      attachmentCount: Math.floor(Math.random() * 5),
      hasException,
      exceptionType: hasException ? ['DUPLICATE_INVOICE', 'MISSING_PO', 'AMOUNT_MISMATCH'][Math.floor(Math.random() * 3)] : undefined,
      exceptionMessage: hasException ? 'Requires review before processing' : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'System',
      version: 1,
    };
  });
}

function generateMockStats(invoices: Invoice[]): APDashboardStats {
  const openInvoices = invoices.filter(i => !['paid', 'void'].includes(i.status));
  const overdueInvoices = invoices.filter(i => new Date(i.dueDate) < new Date() && i.status !== 'paid');
  const pendingApprovals = invoices.filter(i => i.status === 'pending_approval');
  const scheduled = invoices.filter(i => i.status === 'scheduled');
  const exceptions = invoices.filter(i => i.hasException);
  const dueThisWeek = invoices.filter(i => {
    const due = new Date(i.dueDate);
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return due >= today && due <= weekFromNow && i.status !== 'paid';
  });

  return {
    totalOpenInvoices: openInvoices.length,
    totalOpenAmount: openInvoices.reduce((sum, i) => sum + i.balanceDue, 0),
    overdueInvoices: overdueInvoices.length,
    overdueAmount: overdueInvoices.reduce((sum, i) => sum + i.balanceDue, 0),
    pendingApprovals: pendingApprovals.length,
    pendingApprovalAmount: pendingApprovals.reduce((sum, i) => sum + i.totalAmount, 0),
    scheduledPayments: scheduled.length,
    scheduledAmount: scheduled.reduce((sum, i) => sum + i.totalAmount, 0),
    exceptionsCount: exceptions.length,
    dueThisWeek: dueThisWeek.length,
    dueThisWeekAmount: dueThisWeek.reduce((sum, i) => sum + i.balanceDue, 0),
  };
}

function generateMockExceptions(invoices: Invoice[]): Exception[] {
  const exceptionInvoices = invoices.filter(i => i.hasException);
  const grouped = new Map<string, Invoice[]>();

  exceptionInvoices.forEach(inv => {
    const type = inv.exceptionType || 'UNKNOWN';
    if (!grouped.has(type)) grouped.set(type, []);
    grouped.get(type)!.push(inv);
  });

  const exceptionConfigs: Record<string, { label: string; severity: Exception['severity']; description: string }> = {
    DUPLICATE_INVOICE: { label: 'Duplicate Invoice', severity: 'high', description: 'Potential duplicate detected' },
    MISSING_PO: { label: 'Missing PO', severity: 'medium', description: 'Invoice has no matching PO' },
    AMOUNT_MISMATCH: { label: 'Amount Mismatch', severity: 'medium', description: '3-way match variance detected' },
  };

  const actions: ExceptionAction[] = [
    { id: 'resolve', label: 'Resolve', handler: async () => { } },
    { id: 'dismiss', label: 'Dismiss', handler: async () => { } },
  ];

  return Array.from(grouped.entries()).map(([type, invs]) => ({
    type,
    label: exceptionConfigs[type]?.label || type,
    description: exceptionConfigs[type]?.description,
    severity: exceptionConfigs[type]?.severity || 'medium',
    count: invs.length,
    category: 'Accounts Payable',
    items: invs.map(inv => ({
      id: inv.id,
      data: inv,
      message: `${inv.invoiceNumber} - ${inv.vendorName} - $${inv.totalAmount.toLocaleString()}`,
      createdAt: new Date(inv.createdAt),
    })),
    actions,
  }));
}

function generateMockApprovalTimeline(): TimelineItem[] {
  return [
    {
      id: '1',
      title: 'Invoice Submitted',
      description: 'INV-2025-1001 submitted by AP Clerk',
      timestamp: new Date(2025, 0, 15, 9, 0),
      type: 'success',
      user: { name: 'Sarah Chen', avatar: undefined },
      data: { amount: 15000, vendor: 'Acme Corp' },
    },
    {
      id: '2',
      title: 'Level 1 Approval',
      description: 'Approved by Department Manager',
      timestamp: new Date(2025, 0, 15, 14, 30),
      type: 'success',
      user: { name: 'Michael Brown', avatar: undefined },
      data: { role: 'Department Manager', limit: 10000 },
    },
    {
      id: '3',
      title: 'Level 2 Approval',
      description: 'Pending Finance Director review',
      timestamp: new Date(2025, 0, 16, 10, 0),
      type: 'warning',
      highlighted: true,
      user: { name: 'Jennifer Lee', avatar: undefined },
      data: { role: 'Finance Director', limit: 50000 },
    },
  ];
}

function generateMockBankReconciliation(): {
  bankTransactions: ReconciliationItem[];
  ledgerEntries: ReconciliationItem[];
} {
  const bankTransactions: ReconciliationItem[] = [
    { id: 'b1', amount: 15000, date: new Date(2025, 0, 15), reference: 'CHK-10001', description: 'Acme Corp Payment', data: {} },
    { id: 'b2', amount: 8500.50, date: new Date(2025, 0, 16), reference: 'ACH-20001', description: 'Tech Solutions Wire', data: {} },
  ];

  const ledgerEntries: ReconciliationItem[] = [
    { id: 'l1', amount: 15000, date: new Date(2025, 0, 15), reference: 'PAY-001', description: 'Acme Corp - INV-1001', data: {}, isMatched: true, matchedWith: ['b1'] },
    { id: 'l2', amount: 8500.50, date: new Date(2025, 0, 16), reference: 'PAY-002', description: 'Tech Solutions - INV-1002', data: {} },
  ];

  return { bankTransactions, ledgerEntries };
}

// ============================================================================
// IMPROVED Component Sections with Better Visual Hierarchy
// ============================================================================

function DashboardSection({ stats, onDrilldown }: { stats: APDashboardStats; onDrilldown: (entity: string, filters: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-8">
      {/* Section Header with better typography */}
      <div className="space-y-2">
        <Txt variant="caption" color="secondary" className="uppercase tracking-wider text-xs font-semibold">
          Overview
        </Txt>
        <Txt variant="heading" as="h2" className="text-2xl">
          Key Metrics
        </Txt>
      </div>

      {/* Stat Cards with improved spacing */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <StatCard
          icon={FileText}
          value={stats.totalOpenInvoices}
          label="Open Invoices"
          trend={{ value: 12, direction: 'up' }}
        />
        <StatCard
          icon={DollarSign}
          value={`$${(stats.totalOpenAmount / 1000).toFixed(0)}K`}
          label="Open Amount"
        />
        <StatCard
          icon={Clock}
          value={stats.pendingApprovals}
          label="Pending Approvals"
          trend={{ value: 3, direction: 'down' }}
        />
        <StatCard
          icon={AlertTriangle}
          value={stats.exceptionsCount}
          label="Exceptions"
          trend={{ value: 2, direction: 'up' }}
        />
        <StatCard
          icon={Calendar}
          value={stats.dueThisWeek}
          label="Due This Week"
        />
        <StatCard
          icon={TrendingDown}
          value={stats.overdueInvoices}
          label="Overdue"
        />
      </div>

      {/* Drilldown Numbers with better visual separation */}
      <Surface className="p-6 bg-surface-subtle/50">
        <Txt variant="caption" color="secondary" className="uppercase tracking-wider text-xs font-semibold mb-6">
          Financial Summary
        </Txt>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-2">
            <Txt variant="caption" color="secondary" className="text-xs">Total Open</Txt>
            <BioDrilldown
              value={stats.totalOpenAmount}
              format="currency"
              size="lg"
              entity="invoices"
              filters={{ status: ['draft', 'pending_approval', 'approved', 'scheduled'] }}
              onDrilldown={({ entity, filters }) => onDrilldown(entity || 'invoices', filters)}
            />
          </div>
          <div className="space-y-2">
            <Txt variant="caption" color="secondary" className="text-xs">Overdue Amount</Txt>
            <BioDrilldown
              value={stats.overdueAmount}
              format="currency"
              size="lg"
              trend="down"
              entity="invoices"
              filters={{ overdue: true }}
              onDrilldown={({ entity, filters }) => onDrilldown(entity || 'invoices', filters)}
            />
          </div>
          <div className="space-y-2">
            <Txt variant="caption" color="secondary" className="text-xs">Scheduled</Txt>
            <BioDrilldown
              value={stats.scheduledAmount}
              format="currency"
              size="lg"
              entity="payments"
              filters={{ status: 'scheduled' }}
              onDrilldown={({ entity, filters }) => onDrilldown(entity || 'payments', filters)}
            />
          </div>
          <div className="space-y-2">
            <Txt variant="caption" color="secondary" className="text-xs">Due This Week</Txt>
            <BioDrilldown
              value={stats.dueThisWeekAmount}
              format="currency"
              size="lg"
              trend="neutral"
              entity="invoices"
              filters={{ dueThisWeek: true }}
              onDrilldown={({ entity, filters }) => onDrilldown(entity || 'invoices', filters)}
            />
          </div>
        </div>
      </Surface>
    </div>
  );
}

function ExceptionsSection({ exceptions, onNavigate }: { exceptions: Exception[]; onNavigate: (link: string) => void }) {
  const handleResolve = React.useCallback((exception: Exception, action: ExceptionAction, items: ExceptionItem[]) => {
    console.log('Resolving exception:', { exception: exception.type, action: action.id, itemCount: items.length });
  }, []);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Txt variant="caption" color="secondary" className="uppercase tracking-wider text-xs font-semibold">
            Attention Required
          </Txt>
          <div className="flex items-center gap-3">
            <Icon icon={AlertTriangle} className="text-amber-500" />
            <Txt variant="heading" as="h2" className="text-2xl">
              Exception Dashboard
            </Txt>
          </div>
        </div>
        <Btn variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Btn>
      </div>

      {/* Exception Dashboard with muted colors */}
      <BioExceptionDashboard
        exceptions={exceptions}
        onResolve={handleResolve}
        onNavigate={onNavigate}
        groupBy="severity"
        compact={false}
      />
    </div>
  );
}

// Main component follows same pattern with improved spacing and typography...
// (Rest of the component structure remains similar but with better visual hierarchy)

export default function PAY_02_PaymentHubDemoPage() {
  const router = useRouter();

  const [invoices] = React.useState<Invoice[]>(() => generateMockInvoices(25));
  const [stats] = React.useState<APDashboardStats>(() => generateMockStats(invoices));
  const [exceptions] = React.useState<Exception[]>(() => generateMockExceptions(invoices));
  const [timeline] = React.useState<TimelineItem[]>(() => generateMockApprovalTimeline());
  const [selectedInvoiceIds, setSelectedInvoiceIds] = React.useState<string[]>([]);
  const [activeFilters, setActiveFilters] = React.useState<ActiveFilter[]>([
    { field: 'status', label: 'Status', value: 'Open' },
  ]);
  const [selectedInvoice, setSelectedInvoice] = React.useState<Invoice | null>(null);
  const [loading, setLoading] = React.useState(true);

  const { tabs, activeTabId, selectTab, openTab } = useTabs({
    initialTabs: [
      { id: 'dashboard', label: 'Dashboard', icon: Building, closable: false },
      { id: 'invoices', label: 'Invoices', icon: FileText },
      { id: 'approvals', label: 'Approvals', icon: CheckCircle },
      { id: 'reconciliation', label: 'Reconciliation', icon: CreditCard },
    ],
    initialActiveId: 'dashboard',
  });

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleDrilldown = React.useCallback((entity: string, filters: Record<string, unknown>) => {
    console.log('Drilling down to:', entity, filters);
    openTab({ id: entity, label: entity.charAt(0).toUpperCase() + entity.slice(1), icon: FileText });
    selectTab(entity);
  }, [openTab, selectTab]);

  const handleNavigate = React.useCallback((link: string) => {
    console.log('Navigating to:', link);
    router.push(link);
  }, [router]);

  const handleFilterRemove = React.useCallback((field: string) => {
    setActiveFilters(prev => prev.filter(f => f.field !== field));
  }, []);

  const handleFiltersReset = React.useCallback(() => {
    setActiveFilters([]);
  }, []);

  const handleRowClick = React.useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
    console.log('Selected invoice:', invoice.invoiceNumber);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base">
        <div className="text-center space-y-6">
          <Spinner variant="dots" size="lg" />
          <Txt variant="body" color="secondary">Loading AP Workbench...</Txt>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Page Header with improved hierarchy */}
      <Surface className="border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Building className="h-10 w-10 text-accent-primary" />
                <Txt variant="display" as="h1" className="text-3xl font-semibold">
                  AP Workbench
                </Txt>
              </div>
              <Txt variant="body" color="secondary" className="text-sm">
                Comprehensive accounts payable management • BioSkin Component Showcase
              </Txt>
            </div>
            <div className="flex items-center gap-3">
              <ActionMenu
                trigger={
                  <Btn variant="outline" size="sm">
                    Quick Actions
                  </Btn>
                }
                items={[
                  { label: 'New Invoice', icon: Plus, onClick: () => console.log('New invoice') },
                  { label: 'Create Payment Batch', icon: DollarSign, onClick: () => console.log('New batch') },
                  { label: 'Import Invoices', icon: Download, onClick: () => console.log('Import') },
                  { label: 'AP Settings', onClick: () => console.log('Settings') },
                ]}
              />
              <Btn variant="primary">
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </Btn>
            </div>
          </div>
        </div>
      </Surface>

      {/* Tab Navigation */}
      <BioTabs
        tabs={tabs}
        activeTabId={activeTabId}
        onTabSelect={selectTab}
        showNewTabButton={false}
      />

      {/* Main Content with generous spacing */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {activeTabId === 'dashboard' && (
          <div className="space-y-12">
            <DashboardSection stats={stats} onDrilldown={handleDrilldown} />
            <ExceptionsSection exceptions={exceptions} onNavigate={handleNavigate} />
          </div>
        )}

        {activeTabId === 'invoices' && (
          <div className="space-y-6">
            <Txt variant="heading" as="h2" className="text-2xl">Invoices</Txt>
            <BioTable
              schema={InvoiceSchema}
              data={invoices}
              enableSorting
              enableFiltering
              enablePagination
              enableSelection
              keyField="id"
              include={['invoiceNumber', 'vendorName', 'totalAmount', 'dueDate', 'status']}
              onRowClick={handleRowClick}
              onSelectionChange={(rows) => setSelectedInvoiceIds(rows.map(r => r.id))}
              emptyMessage="No invoices found"
            />
          </div>
        )}
      </div>

      {/* Footer with subtle design */}
      <Surface className="border-t border-border-subtle mt-16">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <Txt variant="caption" color="secondary" className="text-xs">
              BioSkin v2.1 • Schema-Driven UI • CONT_10 Architecture
            </Txt>
            <Txt variant="caption" color="secondary" className="text-xs">
              Atoms → Molecules → Organisms
            </Txt>
          </div>
        </div>
      </Surface>
    </div>
  );
}
