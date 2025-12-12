// ============================================================================
// PAG_PAY_01: PAYMENT HUB (Dual-Lens Architecture)
// ============================================================================
// Document ID: DOC_PAY_01 | Version: 2.0
// The Group Controller's Financial Terminal
// Philosophy: "Observability First, Action Second."
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
    <div className="h-screen bg-[#050505] flex flex-col overflow-hidden">
      
      {/* ================================================================ */}
      {/* HEADER BAR */}
      {/* ================================================================ */}
      <header className="h-16 border-b border-[#1F1F1F] flex items-center justify-between px-6 bg-[#0A0A0A] shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-[#28E7A2] font-mono">PAY_01</span>
            <span className="text-[#333]">/</span>
            <span>Payment Hub</span>
          </h1>
          <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-[#1F1F1F] rounded text-[10px] font-mono text-gray-500">
            {PAYMENT_CONFIG.tenant}
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-gray-500">Pending:</span>
              <span className="text-white font-mono">{formatCurrency(stats.pendingAmount)}</span>
              <span className="text-amber-500 text-xs">({stats.pending})</span>
            </div>
            <div className="w-px h-4 bg-[#333]" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-gray-500">Approved:</span>
              <span className="text-[#28E7A2] font-mono">{formatCurrency(stats.approvedAmount)}</span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <button 
              className="p-2 hover:bg-[#1F1F1F] rounded text-gray-500 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button 
              className="p-2 hover:bg-[#1F1F1F] rounded text-gray-500 hover:text-white transition-colors"
              title="Export"
            >
              <Download className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#28E7A2] text-black font-bold text-sm rounded hover:bg-[#20b881] transition-colors">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Payment</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================================================================ */}
      {/* TAB NAVIGATION */}
      {/* ================================================================ */}
      <div className="border-b border-[#1F1F1F] bg-[#0A0A0A] shrink-0">
        <div className="flex items-center justify-between px-6">
          {/* View Tabs */}
          <div className="flex">
            <button
              onClick={() => setViewMode('functional')}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all',
                viewMode === 'functional'
                  ? 'border-[#28E7A2] text-white'
                  : 'border-transparent text-gray-500 hover:text-white'
              )}
            >
              <Zap className="w-4 h-4" />
              Functional View
              <span className={cn(
                'ml-1 px-1.5 py-0.5 text-[9px] font-mono rounded',
                viewMode === 'functional' ? 'bg-[#28E7A2]/20 text-[#28E7A2]' : 'bg-[#1F1F1F] text-gray-600'
              )}>
                BATCH
              </span>
            </button>
            <button
              onClick={() => setViewMode('entity')}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all',
                viewMode === 'entity'
                  ? 'border-[#28E7A2] text-white'
                  : 'border-transparent text-gray-500 hover:text-white'
              )}
            >
              <Building2 className="w-4 h-4" />
              Entity View
              <span className={cn(
                'ml-1 px-1.5 py-0.5 text-[9px] font-mono rounded',
                viewMode === 'entity' ? 'bg-[#28E7A2]/20 text-[#28E7A2]' : 'bg-[#1F1F1F] text-gray-600'
              )}>
                DETAIL
              </span>
            </button>
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <div className="flex bg-[#1F1F1F] rounded p-0.5">
              <button
                onClick={() => setFilterMode('pending')}
                className={cn(
                  'px-3 py-1.5 text-xs font-mono rounded transition-all',
                  filterMode === 'pending' 
                    ? 'bg-amber-500/20 text-amber-400' 
                    : 'text-gray-500 hover:text-white'
                )}
              >
                My Queue ({stats.pending})
              </button>
              <button
                onClick={() => setFilterMode('all')}
                className={cn(
                  'px-3 py-1.5 text-xs font-mono rounded transition-all',
                  filterMode === 'all' 
                    ? 'bg-[#28E7A2]/20 text-[#28E7A2]' 
                    : 'text-gray-500 hover:text-white'
                )}
              >
                All Payments ({stats.total})
              </button>
            </div>
          </div>
        </div>
      </div>

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
          {viewMode === 'functional' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-white mb-1">Batch Processing</h2>
                <p className="text-sm text-gray-500">
                  Approve clean clusters in bulk. Anomalies require individual review.
                </p>
              </div>
              
              <FunctionalCardGrid
                clusters={clusters}
                onApprove={handleBatchApprove}
                onReview={handleReviewCluster}
                onSettle={handleSettleIC}
              />
              
              {batchState.isProcessing && (
                <div className="mt-4 p-4 bg-[#1F1F1F] rounded border border-amber-900/30">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                    <div>
                      <p className="text-sm text-white font-medium">
                        Processing batch approval...
                      </p>
                      <p className="text-xs text-gray-500">
                        {batchState.processedCount} / {batchState.totalCount} payments
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════ */}
          {/* TAB 2: ENTITY VIEW */}
          {/* ════════════════════════════════════════════════════════════ */}
          {viewMode === 'entity' && (
            <>
              {/* Treasury Header */}
              <div className="p-4 bg-[#050505] border-b border-[#1F1F1F] shrink-0">
                <TreasuryHeader
                  selectedEntityId={selectedEntityId}
                  onEntityChange={setSelectedEntityId}
                />
              </div>
              
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
        <div className={cn(
          'hidden lg:block border-l border-[#1F1F1F] bg-[#0A0A0A] transition-all duration-300 ease-in-out',
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
        </div>
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

