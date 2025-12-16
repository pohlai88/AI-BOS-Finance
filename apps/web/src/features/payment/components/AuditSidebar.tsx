// ============================================================================
// COM_PAY_01: AUDIT SIDEBAR - The 4W1H Orchestra
// ============================================================================
// The "Wow" feature - Answers WHO/WHAT/WHEN/WHERE/HOW at a glance
// Conditionally shows Intercompany Context when tx_type = 'intercompany'
// ============================================================================

import React from 'react';
import { 
  ClipboardList, 
  User, 
  Calendar, 
  MapPin, 
  CreditCard, 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle,
  ExternalLink,
  Clock,
  X,
  AlertTriangle,
  ArrowRightLeft,
  Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Payment } from '../data';
import { PAYMENT_CONFIG } from '../data';

// ============================================================================
// TYPES
// ============================================================================

interface AuditSidebarProps {
  payment: Payment | null;
  currentUserId?: string;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSettleIC?: (id: string) => void;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface AuditSectionProps {
  icon: React.ElementType;
  title: string;
  iconColor?: string;
  children: React.ReactNode;
}

const AuditSection = ({ icon: Icon, title, iconColor = 'text-[#555]', children }: AuditSectionProps) => (
  <div className="mb-5">
    <div className="flex items-center gap-2 mb-2.5">
      <Icon className={cn('w-4 h-4', iconColor)} />
      <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-[#666]">
        {title}
      </span>
    </div>
    <div className="pl-6 border-l border-[#1F1F1F] space-y-1.5">
      {children}
    </div>
  </div>
);

interface DetailRowProps {
  label: string;
  value: string | React.ReactNode;
  highlight?: boolean;
  mono?: boolean;
  warning?: boolean;
}

const DetailRow = ({ label, value, highlight = false, mono = false, warning = false }: DetailRowProps) => (
  <div className="flex justify-between items-start text-sm py-0.5">
    <span className="text-[#666] text-xs">{label}</span>
    <span className={cn(
      'font-medium text-right max-w-[180px] truncate',
      highlight && 'text-[#28E7A2]',
      warning && 'text-amber-400',
      !highlight && !warning && 'text-[#CCC]',
      mono && 'font-mono text-[11px]'
    )}>
      {value}
    </span>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AuditSidebar({ 
  payment, 
  currentUserId = 'USR-CFO',
  onClose, 
  onApprove, 
  onReject,
  onSettleIC,
}: AuditSidebarProps) {
  // Empty state
  if (!payment) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0A0A0A] text-[#555] p-8">
        <ClipboardList className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-sm text-center font-mono">Select a payment to view audit trail</p>
      </div>
    );
  }

  // Derived state
  const isPending = payment.status === 'pending';
  const isHighRisk = payment.risk_score > PAYMENT_CONFIG.risk_levels.medium;
  const isIC = payment.tx_type === 'intercompany';
  const isICUnmatched = isIC && payment.elimination_status === 'unmatched';
  const isSoDViolation = payment.requestor_id === currentUserId;
  const isDocsMissing = payment.docs_attached < payment.docs_required;
  const isOverdue = new Date(payment.due_date) < new Date();
  
  // Can approve logic
  const canApprove = isPending && !isSoDViolation && !isICUnmatched;

  // Formatters
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: payment.currency }).format(amount);

  const formatDate = (dateStr: string) => 
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const formatDateTime = (dateStr: string) => 
    new Date(dateStr).toLocaleString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  const getDaysUntilDue = () => {
    const diff = Math.ceil((new Date(payment.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)} days overdue`;
    if (diff === 0) return 'Due today';
    if (diff === 1) return '1 day';
    return `${diff} days`;
  };

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A]">
      
      {/* ================================================================ */}
      {/* HEADER - Payment Summary */}
      {/* ================================================================ */}
      <div className="p-5 border-b border-[#1F1F1F] bg-[#050505] shrink-0">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-[10px] font-mono text-[#28E7A2] mb-0.5">{payment.tx_id}</p>
            <h2 className="text-base font-bold text-white leading-tight">{payment.beneficiary}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-[#1F1F1F] rounded text-[#666] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Amount + Status Row */}
        <div className="flex items-center justify-between">
          <span className="text-2xl font-mono font-bold text-white">
            {formatCurrency(payment.amount)}
          </span>
          <div className="flex items-center gap-2">
            {/* Transaction Type Badge */}
            {isIC && (
              <span className="px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded border bg-purple-900/30 text-purple-400 border-purple-800">
                IC
              </span>
            )}
            {/* Status Badge */}
            <span className={cn(
              'px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded border',
              payment.status === 'pending' && 'bg-amber-900/30 text-amber-400 border-amber-800',
              payment.status === 'approved' && 'bg-emerald-900/30 text-emerald-400 border-emerald-800',
              payment.status === 'rejected' && 'bg-red-900/30 text-red-400 border-red-800',
              payment.status === 'paid' && 'bg-blue-900/30 text-blue-400 border-blue-800',
              payment.status === 'draft' && 'bg-gray-800 text-gray-400 border-gray-600',
            )}>
              {payment.status}
            </span>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* SCROLLABLE CONTENT - 4W1H Sections */}
      {/* ================================================================ */}
      <div className="flex-1 overflow-y-auto p-5 space-y-1">
        
        {/* 🛡️ GOVERNANCE ALERT (High Risk) */}
        {isHighRisk && (
          <div className="mb-5 p-3 bg-amber-900/10 border border-amber-900/30 rounded">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <ShieldAlert className="w-4 h-4" />
              <span className="font-bold text-xs">Governance Alert</span>
            </div>
            <p className="text-[11px] text-amber-200/70 mb-2">{payment.policy_violation || 'High risk transaction'}</p>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-[#666]">Risk Score</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-[#1F1F1F] rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      'h-full rounded-full transition-all',
                      payment.risk_score > 80 ? 'bg-red-500' :
                      payment.risk_score > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                    )}
                    style={{ width: `${payment.risk_score}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-amber-400">{payment.risk_score}/100</span>
              </div>
            </div>
          </div>
        )}

        {/* ⚠️ SOD VIOLATION WARNING */}
        {isSoDViolation && isPending && (
          <div className="mb-5 p-3 bg-red-900/10 border border-red-900/30 rounded">
            <div className="flex items-center gap-2 text-red-400">
              <Ban className="w-4 h-4" />
              <span className="font-bold text-xs">SoD Violation</span>
            </div>
            <p className="text-[11px] text-red-200/70 mt-1">
              You cannot approve your own payment request
            </p>
          </div>
        )}

        {/* ⏰ OVERDUE WARNING */}
        {isOverdue && isPending && (
          <div className="mb-5 p-3 bg-red-900/10 border border-red-900/30 rounded">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-bold text-xs">Overdue</span>
            </div>
            <p className="text-[11px] text-red-200/70 mt-1">
              Payment was due {formatDate(payment.due_date)}
            </p>
          </div>
        )}

        {/* 📄 MISSING DOCS WARNING */}
        {isDocsMissing && isPending && (
          <div className="mb-5 p-3 bg-amber-900/10 border border-amber-900/30 rounded">
            <div className="flex items-center gap-2 text-amber-400">
              <FileText className="w-4 h-4" />
              <span className="font-bold text-xs">Documentation Incomplete</span>
            </div>
            <p className="text-[11px] text-amber-200/70 mt-1">
              {payment.docs_attached}/{payment.docs_required} required documents attached
            </p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ⚖️ INTERCOMPANY CONTEXT (Conditional - Purple Theme) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {isIC && (
          <div className="mb-5 p-3 bg-purple-900/10 border border-purple-900/30 rounded">
            <div className="flex items-center gap-2 mb-3">
              <ArrowRightLeft className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-purple-400">
                Intercompany Context
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-[#888]">Route</span>
                <span className="text-[11px] font-mono text-purple-300">
                  {payment.entity} → {payment.counterparty_entity || 'Unknown'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-[#888]">Elimination Status</span>
                <span className={cn(
                  'px-2 py-0.5 text-[9px] font-mono uppercase rounded border',
                  payment.elimination_status === 'matched' && 'bg-emerald-900/30 text-emerald-400 border-emerald-800',
                  payment.elimination_status === 'unmatched' && 'bg-red-900/30 text-red-400 border-red-800',
                )}>
                  {payment.elimination_status}
                </span>
              </div>

              {isICUnmatched && (
                <div className="mt-2 pt-2 border-t border-purple-900/30">
                  <div className="flex items-center gap-2 text-red-400 text-[10px]">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Unilateral booking - no matching entry in counterparty</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 📋 WHAT */}
        <AuditSection icon={ClipboardList} title="What" iconColor="text-blue-400">
          <DetailRow label="Invoice Reference" value={payment.invoice_ref} mono />
          <DetailRow label="Payment Method" value={payment.method.toUpperCase()} mono />
          <DetailRow 
            label="Documents" 
            value={`${payment.docs_attached}/${payment.docs_required}`} 
            warning={isDocsMissing}
            mono 
          />
        </AuditSection>

        {/* 👤 WHO */}
        <AuditSection icon={User} title="Who" iconColor="text-purple-400">
          <DetailRow label="Requested By" value={payment.requested_by} />
          {payment.approved_by ? (
            <>
              <DetailRow label="Approved By" value={payment.approved_by} highlight />
              <DetailRow label="Approved At" value={formatDateTime(payment.approved_at!)} mono />
            </>
          ) : (
            <div className="flex items-center gap-2 text-amber-500 text-[11px] py-1">
              <Clock className="w-3 h-3" />
              <span>Awaiting Approval</span>
            </div>
          )}
        </AuditSection>

        {/* 🕐 WHEN */}
        <AuditSection icon={Calendar} title="When" iconColor="text-amber-400">
          <DetailRow label="Created" value={formatDateTime(payment.created_at)} mono />
          <DetailRow 
            label="Due Date" 
            value={formatDate(payment.due_date)} 
            warning={isOverdue}
            mono 
          />
          <DetailRow 
            label="Time Remaining" 
            value={getDaysUntilDue()} 
            warning={isOverdue || new Date(payment.due_date).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000}
          />
        </AuditSection>

        {/* 📍 WHERE */}
        <AuditSection icon={MapPin} title="Where" iconColor="text-emerald-400">
          <DetailRow label="Entity" value={payment.entity} />
          <DetailRow label="Cost Center" value={payment.cost_center} mono />
          <DetailRow label="GL Account" value={payment.gl_account} mono />
        </AuditSection>

        {/* ⚙️ HOW */}
        <AuditSection icon={CreditCard} title="How" iconColor="text-pink-400">
          <DetailRow label="Payment Method" value={payment.method.toUpperCase()} mono />
          <DetailRow label="Currency" value={payment.currency} mono />
        </AuditSection>

        {/* 📎 LINKED MANIFESTS */}
        {payment.manifests && payment.manifests.length > 0 && (
          <div className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-[#555]" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-[#666]">
                Linked Manifests
              </span>
            </div>
            <div className="space-y-2">
              {payment.manifests.map((manifest, idx) => (
                <button 
                  key={idx}
                  className="w-full flex items-center gap-3 p-2.5 bg-[#111] hover:bg-[#161616] border border-[#1F1F1F] rounded transition-colors group"
                >
                  <div className={cn(
                    'p-1.5 rounded',
                    manifest.type === 'invoice' && 'bg-blue-900/20 text-blue-400',
                    manifest.type === 'contract' && 'bg-purple-900/20 text-purple-400',
                    manifest.type === 'po' && 'bg-emerald-900/20 text-emerald-400',
                    manifest.type === 'receipt' && 'bg-amber-900/20 text-amber-400',
                  )}>
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-[11px] text-[#CCC] group-hover:text-white truncate">
                      {manifest.label}
                    </div>
                    <div className="text-[9px] text-[#555]">
                      {manifest.type.toUpperCase()} • {manifest.file_size}
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#444] group-hover:text-[#888]" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* ACTION FOOTER */}
      {/* ================================================================ */}
      {isPending && (
        <div className="p-4 border-t border-[#1F1F1F] bg-[#050505] shrink-0">
          {/* IC Unmatched - Special Action */}
          {isICUnmatched ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 py-2 text-red-400 text-[11px]">
                <Ban className="w-4 h-4" />
                <span>Cannot approve unmatched IC transaction</span>
              </div>
              {onSettleIC && (
                <button 
                  onClick={() => onSettleIC(payment.id)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded border border-purple-900/50 text-purple-400 hover:bg-purple-900/10 font-medium text-sm transition-all"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Initiate IC Settlement
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => onReject(payment.id)}
                  className="flex items-center justify-center gap-2 py-2.5 rounded border border-red-900/30 text-red-500 hover:bg-red-900/10 font-medium text-sm transition-all"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
                <button 
                  onClick={() => canApprove && onApprove(payment.id)}
                  disabled={!canApprove}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2.5 rounded font-bold text-sm transition-all',
                    canApprove 
                      ? 'bg-[#28E7A2] text-black hover:bg-[#20b881] shadow-[0_0_15px_rgba(40,231,162,0.3)]'
                      : 'bg-[#1F1F1F] text-[#555] cursor-not-allowed'
                  )}
                  title={!canApprove ? (isSoDViolation ? 'SoD Violation' : 'Cannot approve') : undefined}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </button>
              </div>
              <p className="text-[9px] text-[#555] text-center mt-2 font-mono">
                Approving as: <span className="text-[#888]">CFO (You)</span>
              </p>
            </>
          )}
        </div>
      )}
      
      {/* Historical View for non-pending */}
      {!isPending && (
        <div className="p-4 border-t border-[#1F1F1F] bg-[#050505] shrink-0">
          <div className={cn(
            'flex items-center justify-center gap-2 py-2.5 rounded',
            payment.status === 'approved' && 'bg-emerald-900/10 text-emerald-400',
            payment.status === 'rejected' && 'bg-red-900/10 text-red-400',
            payment.status === 'paid' && 'bg-blue-900/10 text-blue-400',
            payment.status === 'draft' && 'bg-gray-800/50 text-gray-400',
          )}>
            {payment.status === 'approved' && <CheckCircle2 className="w-4 h-4" />}
            {payment.status === 'rejected' && <XCircle className="w-4 h-4" />}
            {payment.status === 'paid' && <CheckCircle2 className="w-4 h-4" />}
            <span className="font-medium text-sm capitalize">
              {payment.status === 'paid' ? 'Payment Completed' : `Payment ${payment.status}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditSidebar;

