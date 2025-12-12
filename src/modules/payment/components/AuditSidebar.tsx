// ============================================================================
// COM_PAY_01: AUDIT SIDEBAR - The 4W1H Orchestra
// ============================================================================
// The "Wow" feature - Answers WHO/WHAT/WHEN/WHERE/HOW at a glance
// Conditionally shows Intercompany Context when tx_type = 'intercompany'
// 🛡️ GOVERNANCE: Uses Surface, Txt, Btn, StatusDot components (no hardcoded colors)
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
import { Surface } from '@/components/ui/Surface';
import { Txt } from '@/components/ui/Txt';
import { Btn } from '@/components/ui/Btn';
import { StatusDot } from '@/components/ui/StatusDot';
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

// 🛡️ GOVERNANCE: Uses Txt component
const AuditSection = ({ icon: Icon, title, iconColor = 'text-text-tertiary', children }: AuditSectionProps) => (
  <div className="mb-5">
    <div className="flex items-center gap-2 mb-2.5">
      <Icon className={cn('w-4 h-4', iconColor)} />
      <Txt variant="small" className="font-mono font-bold uppercase tracking-[0.15em] text-text-tertiary">
        {title}
      </Txt>
    </div>
    <div className="pl-6 border-l border-border-surface-base space-y-1.5">
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

// 🛡️ GOVERNANCE: Uses Txt component
const DetailRow = ({ label, value, highlight = false, mono = false, warning = false }: DetailRowProps) => (
  <div className="flex justify-between items-start py-0.5">
    <Txt variant="small" className="text-text-tertiary">{label}</Txt>
    <Txt variant={mono ? "small" : "body"} className={cn(
      'font-medium text-right max-w-[180px] truncate',
      highlight && 'text-action-primary',
      warning && 'text-status-warning',
      !highlight && !warning && 'text-text-primary',
      mono && 'font-mono'
    )}>
      {value}
    </Txt>
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
  // 🛡️ GOVERNANCE: Uses Surface + Txt components
  if (!payment) {
    return (
      <Surface variant="base" className="h-full flex flex-col items-center justify-center p-8">
        <ClipboardList className="w-12 h-12 mb-4 opacity-30 text-text-tertiary" />
        <Txt variant="body" className="text-center text-text-tertiary font-mono">
          Select a payment to view audit trail
        </Txt>
      </Surface>
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
    <Surface variant="base" className="h-full flex flex-col">

      {/* ================================================================ */}
      {/* HEADER - Payment Summary */}
      {/* ================================================================ */}
      {/* 🛡️ GOVERNANCE: Uses Surface + Txt + StatusDot components */}
      <Surface variant="flat" className="p-5 border-b shrink-0">
        <div className="flex justify-between items-start mb-3">
          <div>
            <Txt variant="small" className="font-mono text-action-primary mb-0.5">{payment.tx_id}</Txt>
            <Txt variant="h2">{payment.beneficiary}</Txt>
          </div>
          <Btn
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Btn>
        </div>

        {/* Amount + Status Row */}
        <div className="flex items-center justify-between">
          <Txt variant="h1" className="font-mono">
            {formatCurrency(payment.amount)}
          </Txt>
          <div className="flex items-center gap-2">
            {/* Transaction Type Badge */}
            {isIC && (
              <Surface variant="base" className="px-2 py-0.5 border border-purple-800 bg-purple-900/30">
                <Txt variant="small" className="font-mono uppercase tracking-wider text-purple-400">
                  IC
                </Txt>
              </Surface>
            )}
            {/* Status Badge - Uses StatusDot logic */}
            <Surface variant="base" className={cn(
              'px-2 py-0.5 border rounded',
              payment.status === 'pending' && 'bg-status-warning/30 border-status-warning',
              payment.status === 'approved' && 'bg-status-success/30 border-status-success',
              payment.status === 'rejected' && 'bg-status-error/30 border-status-error',
              payment.status === 'paid' && 'bg-status-neutral/30 border-status-neutral',
              payment.status === 'draft' && 'bg-surface-flat border-border-surface-base',
            )}>
              <Txt variant="small" className={cn(
                'font-mono uppercase tracking-wider',
                payment.status === 'pending' && 'text-status-warning',
                payment.status === 'approved' && 'text-status-success',
                payment.status === 'rejected' && 'text-status-error',
                payment.status === 'paid' && 'text-status-neutral',
                payment.status === 'draft' && 'text-text-tertiary',
              )}>
                {payment.status}
              </Txt>
            </Surface>
          </div>
        </div>
      </Surface>

      {/* ================================================================ */}
      {/* SCROLLABLE CONTENT - 4W1H Sections */}
      {/* ================================================================ */}
      <div className="flex-1 overflow-y-auto p-5 space-y-1">

        {/* 🛡️ GOVERNANCE ALERT (High Risk) */}
        {/* 🛡️ GOVERNANCE: Uses Surface + Txt + StatusDot components */}
        {isHighRisk && (
          <Surface variant="base" className="mb-5 p-3 bg-status-warning/10 border-status-warning/30">
            <div className="flex items-center gap-2 mb-2">
              <StatusDot variant="warning" size="sm" />
              <Txt variant="small" className="font-bold text-status-warning">Governance Alert</Txt>
            </div>
            <Txt variant="small" className="text-status-warning/70 mb-2">
              {payment.policy_violation || 'High risk transaction'}
            </Txt>
            <div className="flex items-center justify-between">
              <Txt variant="small" className="font-mono text-text-tertiary">Risk Score</Txt>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-surface-flat rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      payment.risk_score > 80 ? 'bg-status-error' :
                        payment.risk_score > 50 ? 'bg-status-warning' : 'bg-status-success'
                    )}
                    style={{ width: `${payment.risk_score}%` }}
                  />
                </div>
                <Txt variant="small" className="font-mono text-status-warning">{payment.risk_score}/100</Txt>
              </div>
            </div>
          </Surface>
        )}

        {/* ⚠️ SOD VIOLATION WARNING */}
        {/* 🛡️ GOVERNANCE: Uses Surface + Txt + StatusDot components */}
        {isSoDViolation && isPending && (
          <Surface variant="base" className="mb-5 p-3 bg-status-error/10 border-status-error/30">
            <div className="flex items-center gap-2">
              <StatusDot variant="error" size="sm" />
              <Txt variant="small" className="font-bold text-status-error">SoD Violation</Txt>
            </div>
            <Txt variant="small" className="text-status-error/70 mt-1">
              You cannot approve your own payment request
            </Txt>
          </Surface>
        )}

        {/* ⏰ OVERDUE WARNING */}
        {/* 🛡️ GOVERNANCE: Uses Surface + Txt + StatusDot components */}
        {isOverdue && isPending && (
          <Surface variant="base" className="mb-5 p-3 bg-status-error/10 border-status-error/30">
            <div className="flex items-center gap-2">
              <StatusDot variant="error" size="sm" />
              <Txt variant="small" className="font-bold text-status-error">Overdue</Txt>
            </div>
            <Txt variant="small" className="text-status-error/70 mt-1">
              Payment was due {formatDate(payment.due_date)}
            </Txt>
          </Surface>
        )}

        {/* 📄 MISSING DOCS WARNING */}
        {/* 🛡️ GOVERNANCE: Uses Surface + Txt + StatusDot components */}
        {isDocsMissing && isPending && (
          <Surface variant="base" className="mb-5 p-3 bg-status-warning/10 border-status-warning/30">
            <div className="flex items-center gap-2">
              <StatusDot variant="warning" size="sm" />
              <Txt variant="small" className="font-bold text-status-warning">Documentation Incomplete</Txt>
            </div>
            <Txt variant="small" className="text-status-warning/70 mt-1">
              {payment.docs_attached}/{payment.docs_required} required documents attached
            </Txt>
          </Surface>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ⚖️ INTERCOMPANY CONTEXT (Conditional - Purple Theme) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* 🛡️ GOVERNANCE: Uses Surface + Txt + StatusDot components */}
        {isIC && (
          <Surface variant="base" className="mb-5 p-3 bg-purple-900/10 border-purple-900/30">
            <div className="flex items-center gap-2 mb-3">
              <ArrowRightLeft className="w-4 h-4 text-purple-400" />
              <Txt variant="small" className="font-mono font-bold uppercase tracking-[0.15em] text-purple-400">
                Intercompany Context
              </Txt>
            </div>

            <div className="space-y-2">
              <DetailRow label="Route" value={`${payment.entity} → ${payment.counterparty_entity || 'Unknown'}`} />

              <div className="flex justify-between items-center">
                <Txt variant="small" className="text-text-secondary">Elimination Status</Txt>
                <Surface variant="base" className={cn(
                  'px-2 py-0.5 border rounded',
                  payment.elimination_status === 'matched' && 'bg-status-success/30 border-status-success',
                  payment.elimination_status === 'unmatched' && 'bg-status-error/30 border-status-error',
                )}>
                  <Txt variant="small" className={cn(
                    'font-mono uppercase',
                    payment.elimination_status === 'matched' && 'text-status-success',
                    payment.elimination_status === 'unmatched' && 'text-status-error',
                  )}>
                    {payment.elimination_status}
                  </Txt>
                </Surface>
              </div>

              {isICUnmatched && (
                <Surface variant="base" className="mt-2 pt-2 border-t border-purple-900/30">
                  <div className="flex items-center gap-2">
                    <StatusDot variant="error" size="sm" />
                    <Txt variant="small" className="text-status-error">
                      Unilateral booking - no matching entry in counterparty
                    </Txt>
                  </div>
                </Surface>
              )}
            </div>
          </Surface>
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
            <div className="flex items-center gap-2 py-1">
              <StatusDot variant="warning" size="sm" />
              <Txt variant="small" className="text-status-warning">Awaiting Approval</Txt>
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
        {/* 🛡️ GOVERNANCE: Uses Surface + Txt + Btn components */}
        {payment.manifests && payment.manifests.length > 0 && (
          <div className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-text-tertiary" />
              <Txt variant="small" className="font-mono font-bold uppercase tracking-[0.15em] text-text-tertiary">
                Linked Manifests
              </Txt>
            </div>
            <div className="space-y-2">
              {payment.manifests.map((manifest, idx) => (
                <Surface
                  key={idx}
                  variant="flat"
                  className="w-full flex items-center gap-3 p-2.5 border hover:bg-surface-flat transition-colors cursor-pointer"
                >
                  <Surface variant="base" className={cn(
                    'p-1.5 rounded',
                    manifest.type === 'invoice' && 'bg-status-neutral/20 text-status-neutral',
                    manifest.type === 'contract' && 'bg-purple-900/20 text-purple-400',
                    manifest.type === 'po' && 'bg-status-success/20 text-status-success',
                    manifest.type === 'receipt' && 'bg-status-warning/20 text-status-warning',
                  )}>
                    <FileText className="w-3.5 h-3.5" />
                  </Surface>
                  <div className="flex-1 text-left min-w-0">
                    <Txt variant="small" className="text-text-primary truncate">
                      {manifest.label}
                    </Txt>
                    <Txt variant="small" className="text-text-tertiary">
                      {manifest.type.toUpperCase()} • {manifest.file_size}
                    </Txt>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-text-tertiary" />
                </Surface>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* ACTION FOOTER */}
      {/* ================================================================ */}
      {/* 🛡️ GOVERNANCE: Uses Surface + Btn + Txt components */}
      {isPending && (
        <Surface variant="flat" className="p-4 border-t shrink-0">
          {/* IC Unmatched - Special Action */}
          {isICUnmatched ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 py-2">
                <StatusDot variant="error" size="sm" />
                <Txt variant="small" className="text-status-error">
                  Cannot approve unmatched IC transaction
                </Txt>
              </div>
              {onSettleIC && (
                <Btn
                  variant="secondary"
                  size="md"
                  onClick={() => onSettleIC(payment.id)}
                  className="w-full"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Initiate IC Settlement
                </Btn>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Btn
                  variant="secondary"
                  size="md"
                  onClick={() => onReject(payment.id)}
                  className="border-status-error/30 text-status-error hover:bg-status-error/10"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </Btn>
                <Btn
                  variant={canApprove ? "primary" : "secondary"}
                  size="md"
                  onClick={() => canApprove && onApprove(payment.id)}
                  disabled={!canApprove}
                  title={!canApprove ? (isSoDViolation ? 'SoD Violation' : 'Cannot approve') : undefined}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </Btn>
              </div>
              <Txt variant="small" className="text-text-tertiary text-center mt-2 font-mono">
                Approving as: <span className="text-text-secondary">CFO (You)</span>
              </Txt>
            </>
          )}
        </Surface>
      )}

      {/* Historical View for non-pending */}
      {/* 🛡️ GOVERNANCE: Uses Surface + Txt + StatusDot components */}
      {!isPending && (
        <Surface variant="flat" className="p-4 border-t shrink-0">
          <Surface variant="base" className={cn(
            'flex items-center justify-center gap-2 py-2.5 rounded',
            payment.status === 'approved' && 'bg-status-success/10',
            payment.status === 'rejected' && 'bg-status-error/10',
            payment.status === 'paid' && 'bg-status-neutral/10',
            payment.status === 'draft' && 'bg-surface-flat',
          )}>
            {payment.status === 'approved' && <StatusDot variant="success" size="sm" />}
            {payment.status === 'rejected' && <StatusDot variant="error" size="sm" />}
            {payment.status === 'paid' && <StatusDot variant="neutral" size="sm" />}
            <Txt variant="body" className={cn(
              'font-medium capitalize',
              payment.status === 'approved' && 'text-status-success',
              payment.status === 'rejected' && 'text-status-error',
              payment.status === 'paid' && 'text-status-neutral',
              payment.status === 'draft' && 'text-text-tertiary',
            )}>
              {payment.status === 'paid' ? 'Payment Completed' : `Payment ${payment.status}`}
            </Txt>
          </Surface>
        </Surface>
      )}
    </div>
  );
}

export default AuditSidebar;

