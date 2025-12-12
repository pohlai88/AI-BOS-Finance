// ============================================================================
// PAG_PAY_01: PAYMENT HUB (Dual-Lens Architecture)
// ============================================================================
// Document ID: DOC_PAY_01 | Version: 2.0
// The Group Controller's Financial Terminal
// Philosophy: "Observability First, Action Second."
// 🛡️ GOVERNANCE: Uses Surface, Txt, Btn, StatusDot components (no hardcoded colors)
// ============================================================================
// FEATURES:
// - Tab 1: Functional View (Efficiency) - Batch cluster approval
// - Tab 2: Entity View (Strategy) - Deep dive with treasury context
// - Shared: AuditSidebar (4W1H Orchestra)
// - Shared: All governance rules enforced (SoD, IC, Batch, Docs)
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  Filter,
  Download,
  Plus,
  RefreshCw,
  Zap,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Surface, Txt, Btn, StatusDot } from '@aibos/ui'

// Components
import {
  AuditSidebar,
  TreasuryHeader,
  FunctionalCardGrid,
  PaymentTable,
} from './components';

// Data & Hooks
import {
  MOCK_PAYMENTS,
  PAYMENT_CONFIG,
  TREASURY_DATA,
  type Payment,
  type PaymentStatus,
  type FunctionalCluster,
} from './data';

import {
  usePaymentApproval,
  useBatchApproval,
  DEFAULT_USER,
} from './hooks';

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = 'functional' | 'entity';
type FilterMode = 'all' | 'pending';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PAY01PaymentHub() {
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════

  const [viewMode, setViewMode] = useState<ViewMode>('entity');
  const [filterMode, setFilterMode] = useState<FilterMode>('pending');
  const [selectedEntityId, setSelectedEntityId] = useState('hq');

  // Payment approval with all governance rules
  const {
    payments,
    selectedPayment,
    selectedId,
    isProcessing,
    approvalDecision,
    selectPayment,
    approvePayment,
    rejectPayment,
    stats,
    currentUser,
  } = usePaymentApproval(MOCK_PAYMENTS, DEFAULT_USER);

  // Batch approval logic
  const {
    clusters,
    state: batchState,
    executeBatchApproval,
  } = useBatchApproval(payments, (id) => {
    const result = approvePayment(id);
    if (!result.success) {
      toast.error('Approval failed', { description: result.error });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DERIVED STATE
  // ═══════════════════════════════════════════════════════════════════════════

  const filteredPayments = useMemo(() => {
    let result = [...payments];

    if (filterMode === 'pending') {
      result = result.filter(p => p.status === 'pending');
    }

    // In Entity View, filter by selected entity
    if (viewMode === 'entity') {
      const entityName = TREASURY_DATA[selectedEntityId]?.entity_name;
      if (entityName) {
        result = result.filter(p => p.entity === entityName);
      }
    }

    return result;
  }, [payments, filterMode, viewMode, selectedEntityId]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleApprove = (id: string) => {
    const result = approvePayment(id);
    if (result.success) {
      const payment = payments.find(p => p.id === id);
      toast.success('Payment approved', {
        description: `${payment?.tx_id} - ${formatCurrency(payment?.amount || 0)}`,
      });
    } else {
      toast.error('Approval blocked', {
        description: result.error,
      });
    }
  };

  const handleReject = (id: string) => {
    // In production, would show rejection reason modal
    rejectPayment(id);
    const payment = payments.find(p => p.id === id);
    toast.error('Payment rejected', {
      description: `${payment?.tx_id} has been rejected`,
    });
  };

  const handleBatchApprove = async (clusterId: string) => {
    const cluster = clusters.find(c => c.cluster_id === clusterId);
    if (!cluster) return;

    toast.loading(`Approving ${cluster.invoice_count} payments...`, {
      id: `batch-${clusterId}`,
    });

    const result = await executeBatchApproval(clusterId as FunctionalCluster);

    if (result.success) {
      toast.success('Batch approved', {
        id: `batch-${clusterId}`,
        description: `${result.processedCount} payments approved - ${formatCurrency(cluster.total_amount)}`,
      });
    } else {
      toast.error('Batch approval failed', {
        id: `batch-${clusterId}`,
        description: result.errors.join(', '),
      });
    }
  };

  const handleReviewCluster = (clusterId: string) => {
    // Switch to entity view and filter to cluster
    setViewMode('entity');
    // In production, would apply cluster filter
    toast.info('Switching to entity view', {
      description: 'Review anomalous payments individually',
    });
  };

  const handleSettleIC = (id: string) => {
    // In production, would open IC settlement modal
    toast.info('IC Settlement', {
      description: 'Settlement workflow would open here (Phase 2)',
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: amount > 100000 ? 'compact' : 'standard',
      maximumFractionDigits: amount > 100000 ? 1 : 0,
    }).format(amount);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="h-screen bg-surface-base flex flex-col overflow-hidden">

      {/* ================================================================ */}
      {/* HEADER BAR */}
      {/* ================================================================ */}
      {/* 🛡️ GOVERNANCE: Uses Surface + Txt + Btn + StatusDot components */}
      <Surface variant="flat" className="h-16 border-b flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Txt variant="h1" className="flex items-center gap-2">
            <span className="text-action-primary font-mono">PAY_01</span>
            <span className="text-text-tertiary">/</span>
            <span>Payment Hub</span>
          </Txt>
          <Surface variant="flat" className="hidden md:flex items-center gap-1 px-2 py-1 rounded">
            <Txt variant="small" className="font-mono text-text-tertiary">
              {PAYMENT_CONFIG.tenant}
            </Txt>
          </Surface>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <StatusDot variant="warning" size="sm" />
              <Txt variant="body" className="text-text-tertiary">Pending:</Txt>
              <Txt variant="body" className="font-mono">{formatCurrency(stats.pendingAmount)}</Txt>
              <Txt variant="small" className="text-status-warning">({stats.pending})</Txt>
            </div>
            <div className="w-px h-4 bg-border-surface-base" />
            <div className="flex items-center gap-2">
              <StatusDot variant="success" size="sm" />
              <Txt variant="body" className="text-text-tertiary">Approved:</Txt>
              <Txt variant="body" className="text-action-primary font-mono">
                {formatCurrency(stats.approvedAmount)}
              </Txt>
            </div>
          </div>

          {/* Actions */}
          {/* 🛡️ GOVERNANCE: Uses Btn component */}
          <div className="flex items-center gap-2">
            <Btn
              variant="secondary"
              size="sm"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </Btn>
            <Btn
              variant="secondary"
              size="sm"
              title="Export"
            >
              <Download className="w-4 h-4" />
            </Btn>
            <Btn variant="primary" size="md">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Payment</span>
            </Btn>
          </div>
        </div>
      </Surface>

      {/* ================================================================ */}
      {/* TAB NAVIGATION */}
      {/* ================================================================ */}
      {/* 🛡️ GOVERNANCE: Uses Surface + Txt + Btn components */}
      <Surface variant="flat" className="border-b shrink-0">
        <div className="flex items-center justify-between px-6">
          {/* View Tabs */}
          <div className="flex">
            <Btn
              variant="ghost"
              size="md"
              onClick={() => setViewMode('functional')}
              className={cn(
                'flex items-center gap-2 border-b-2 rounded-none',
                viewMode === 'functional'
                  ? 'border-action-primary text-text-primary'
                  : 'border-transparent text-text-tertiary hover:text-text-primary'
              )}
            >
              <Zap className="w-4 h-4" />
              Functional View
              <Surface variant={viewMode === 'functional' ? 'base' : 'flat'} className={cn(
                'ml-1 px-1.5 py-0.5 rounded',
                viewMode === 'functional' && 'bg-action-primary/20'
              )}>
                <Txt variant="small" className={cn(
                  'font-mono',
                  viewMode === 'functional' ? 'text-action-primary' : 'text-text-tertiary'
                )}>
                  BATCH
                </Txt>
              </Surface>
            </Btn>
            <Btn
              variant="ghost"
              size="md"
              onClick={() => setViewMode('entity')}
              className={cn(
                'flex items-center gap-2 border-b-2 rounded-none',
                viewMode === 'entity'
                  ? 'border-action-primary text-text-primary'
                  : 'border-transparent text-text-tertiary hover:text-text-primary'
              )}
            >
              <Building2 className="w-4 h-4" />
              Entity View
              <Surface variant={viewMode === 'entity' ? 'base' : 'flat'} className={cn(
                'ml-1 px-1.5 py-0.5 rounded',
                viewMode === 'entity' && 'bg-action-primary/20'
              )}>
                <Txt variant="small" className={cn(
                  'font-mono',
                  viewMode === 'entity' ? 'text-action-primary' : 'text-text-tertiary'
                )}>
                  DETAIL
                </Txt>
              </Surface>
            </Btn>
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-tertiary" />
            <Surface variant="flat" className="flex rounded p-0.5">
              <Btn
                variant="ghost"
                size="sm"
                onClick={() => setFilterMode('pending')}
                className={cn(
                  'font-mono rounded',
                  filterMode === 'pending'
                    ? 'bg-status-warning/20 text-status-warning'
                    : 'text-text-tertiary hover:text-text-primary'
                )}
              >
                My Queue ({stats.pending})
              </Btn>
              <Btn
                variant="ghost"
                size="sm"
                onClick={() => setFilterMode('all')}
                className={cn(
                  'font-mono rounded',
                  filterMode === 'all'
                    ? 'bg-action-primary/20 text-action-primary'
                    : 'text-text-tertiary hover:text-text-primary'
                )}
              >
                All Payments ({stats.total})
              </Btn>
            </Surface>
          </div>
        </div>
      </Surface>

      {/* ================================================================ */}
      {/* MAIN CONTENT AREA */}
      {/* ================================================================ */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT/MAIN: Content (75% when sidebar open, 100% when closed) */}
        <div className={cn(
          'flex-1 flex flex-col min-w-0 transition-all duration-300',
          selectedId ? 'lg:w-3/4' : 'w-full'
        )}>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* TAB 1: FUNCTIONAL VIEW */}
          {/* ════════════════════════════════════════════════════════════ */}
          {/* 🛡️ GOVERNANCE: Uses Surface + Txt components */}
          {viewMode === 'functional' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="mb-4">
                <Txt variant="h2" className="mb-1">Batch Processing</Txt>
                <Txt variant="body" className="text-text-tertiary">
                  Approve clean clusters in bulk. Anomalies require individual review.
                </Txt>
              </div>

              <FunctionalCardGrid
                clusters={clusters}
                onApprove={handleBatchApprove}
                onReview={handleReviewCluster}
                onSettle={handleSettleIC}
              />

              {batchState.isProcessing && (
                <Surface variant="flat" className="mt-4 p-4 border-status-warning/30">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-4 h-4 text-status-warning animate-spin" />
                    <div>
                      <Txt variant="body" className="font-medium">
                        Processing batch approval...
                      </Txt>
                      <Txt variant="small" className="text-text-tertiary">
                        {batchState.processedCount} / {batchState.totalCount} payments
                      </Txt>
                    </div>
                  </div>
                </Surface>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════ */}
          {/* TAB 2: ENTITY VIEW */}
          {/* ════════════════════════════════════════════════════════════ */}
          {/* 🛡️ GOVERNANCE: Uses Surface component */}
          {viewMode === 'entity' && (
            <>
              {/* Treasury Header */}
              <Surface variant="base" className="p-4 border-b shrink-0">
                <TreasuryHeader
                  selectedEntityId={selectedEntityId}
                  onEntityChange={setSelectedEntityId}
                />
              </Surface>

              {/* Payment Table */}
              <div className="flex-1 p-4 overflow-hidden">
                <PaymentTable
                  payments={filteredPayments}
                  selectedId={selectedId}
                  onRowClick={(payment) => selectPayment(payment.id)}
                />
              </div>
            </>
          )}
        </div>

        {/* RIGHT: AUDIT SIDEBAR (25% or hidden) */}
        {/* 🛡️ GOVERNANCE: Uses Surface component */}
        <Surface variant="flat" className={cn(
          'hidden lg:block border-l transition-all duration-300 ease-in-out',
          selectedId
            ? 'w-[400px] translate-x-0 opacity-100'
            : 'w-0 translate-x-full opacity-0 overflow-hidden'
        )}>
          <AuditSidebar
            payment={selectedPayment}
            currentUserId={currentUser.id}
            onClose={() => selectPayment(null)}
            onApprove={handleApprove}
            onReject={handleReject}
            onSettleIC={handleSettleIC}
          />
        </Surface>
      </div>

      {/* MOBILE: Slide-over Drawer */}
      {selectedId && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => selectPayment(null)}
          />
          <div className="relative ml-auto w-full max-w-md h-full shadow-2xl">
            <AuditSidebar
              payment={selectedPayment}
              currentUserId={currentUser.id}
              onClose={() => selectPayment(null)}
              onApprove={handleApprove}
              onReject={handleReject}
              onSettleIC={handleSettleIC}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default PAY01PaymentHub;

