// ============================================================================
// COM_PAY_01: AUDIT SIDEBAR - The 4W1H Orchestra
// ============================================================================
// The "Wow" feature - Answers WHO/WHAT/WHEN/WHERE/HOW at a glance
// Conditionally shows Intercompany Context when tx_type = 'intercompany'
// ðŸ›¡ï¸ GOVERNANCE: Uses Surface, Txt, Btn, StatusDot components (no hardcoded colors)
// ============================================================================

import React from 'react'
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
} from 'lucide-react'
import { cn } from '@aibos/ui'
import { Surface, Txt, Btn, StatusDot } from '@aibos/ui'
import type { Payment } from '../mock-data''
import { PAYMENT_CONFIG } from '../mock-data''

// ============================================================================
// TYPES
// ============================================================================

interface AuditSidebarProps {
  payment: Payment | null
  currentUserId?: string
  onClose: () => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onSettleIC?: (id: string) => void
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface AuditSectionProps {
  icon: React.ElementType
  title: string
  iconColor?: string
  children: React.ReactNode
}

// ðŸ›¡ï¸ GOVERNANCE: Uses Txt component
const AuditSection = ({
  icon: Icon,
  title,
  iconColor = 'text-text-tertiary',
  children,
}: AuditSectionProps) => (
  <div className="mb-5">
    <div className="mb-2.5 flex items-center gap-2">
      <Icon className={cn('h-4 w-4', iconColor)} />
      <Txt
        variant="small"
        className="font-mono font-bold uppercase tracking-[0.15em] text-text-tertiary"
      >
        {title}
      </Txt>
    </div>
    <div className="border-border-surface-base space-y-1.5 border-l pl-6">
      {children}
    </div>
  </div>
)

interface DetailRowProps {
  label: string
  value: string | React.ReactNode
  highlight?: boolean
  mono?: boolean
  warning?: boolean
}

// ðŸ›¡ï¸ GOVERNANCE: Uses Txt component
const DetailRow = ({
  label,
  value,
  highlight = false,
  mono = false,
  warning = false,
}: DetailRowProps) => (
  <div className="flex items-start justify-between py-0.5">
    <Txt variant="small" className="text-text-tertiary">
      {label}
    </Txt>
    <Txt
      variant={mono ? 'small' : 'body'}
      className={cn(
        'max-w-[180px] truncate text-right font-medium',
        highlight && 'text-action-primary',
        warning && 'text-status-warning',
        !highlight && !warning && 'text-text-primary',
        mono && 'font-mono'
      )}
    >
      {value}
    </Txt>
  </div>
)

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
  // ðŸ›¡ï¸ GOVERNANCE: Uses Surface + Txt components
  if (!payment) {
    return (
      <Surface
        variant="base"
        className="flex h-full flex-col items-center justify-center p-8"
      >
        <ClipboardList className="mb-4 h-12 w-12 text-text-tertiary opacity-30" />
        <Txt
          variant="body"
          className="text-center font-mono text-text-tertiary"
        >
          Select a payment to view audit trail
        </Txt>
      </Surface>
    )
  }

  // Derived state
  const isPending = payment.status === 'pending'
  const isHighRisk = payment.risk_score > PAYMENT_CONFIG.risk_levels.medium
  const isIC = payment.tx_type === 'intercompany'
  const isICUnmatched = isIC && payment.elimination_status === 'unmatched'
  const isSoDViolation = payment.requestor_id === currentUserId
  const isDocsMissing = payment.docs_attached < payment.docs_required
  const isOverdue = new Date(payment.due_date) < new Date()

  // Can approve logic
  const canApprove = isPending && !isSoDViolation && !isICUnmatched

  // Formatters
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: payment.currency,
    }).format(amount)

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const getDaysUntilDue = () => {
    const diff = Math.ceil(
      (new Date(payment.due_date).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    )
    if (diff < 0) return `${Math.abs(diff)} days overdue`
    if (diff === 0) return 'Due today'
    if (diff === 1) return '1 day'
    return `${diff} days`
  }

  return (
    <Surface variant="base" className="flex h-full flex-col">
      {/* ================================================================ */}
      {/* HEADER - Payment Summary */}
      {/* ================================================================ */}
      {/* ðŸ›¡ï¸ GOVERNANCE: Uses Surface + Txt + StatusDot components */}
      <Surface variant="flat" className="shrink-0 border-b p-5">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <Txt
              variant="small"
              className="mb-0.5 font-mono text-action-primary"
            >
              {payment.tx_id}
            </Txt>
            <Txt variant="h2">{payment.beneficiary}</Txt>
          </div>
          <Btn variant="secondary" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
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
              <Surface
                variant="base"
                className="border border-purple-800 bg-purple-900/30 px-2 py-0.5"
              >
                <Txt
                  variant="small"
                  className="font-mono uppercase tracking-wider text-purple-400"
                >
                  IC
                </Txt>
              </Surface>
            )}
            {/* Status Badge - Uses StatusDot logic */}
            <Surface
              variant="base"
              className={cn(
                'rounded border px-2 py-0.5',
                payment.status === 'pending' &&
                  'bg-status-warning/30 border-status-warning',
                payment.status === 'approved' &&
                  'bg-status-success/30 border-status-success',
                payment.status === 'rejected' &&
                  'border-status-error bg-status-error/30',
                payment.status === 'paid' &&
                  'border-status-neutral bg-status-neutral/30',
                payment.status === 'draft' &&
                  'border-border-surface-base bg-surface-flat'
              )}
            >
              <Txt
                variant="small"
                className={cn(
                  'font-mono uppercase tracking-wider',
                  payment.status === 'pending' && 'text-status-warning',
                  payment.status === 'approved' && 'text-status-success',
                  payment.status === 'rejected' && 'text-status-error',
                  payment.status === 'paid' && 'text-status-neutral',
                  payment.status === 'draft' && 'text-text-tertiary'
                )}
              >
                {payment.status}
              </Txt>
            </Surface>
          </div>
        </div>
      </Surface>

      {/* ================================================================ */}
      {/* SCROLLABLE CONTENT - 4W1H Sections */}
      {/* ================================================================ */}
      <div className="flex-1 space-y-1 overflow-y-auto p-5">
        {/* ðŸ›¡ï¸ GOVERNANCE ALERT (High Risk) */}
        {/* ðŸ›¡ï¸ GOVERNANCE: Uses Surface + Txt + StatusDot components */}
        {isHighRisk && (
          <Surface
            variant="base"
            className="bg-status-warning/10 border-status-warning/30 mb-5 p-3"
          >
            <div className="mb-2 flex items-center gap-2">
              <StatusDot variant="warning" size="sm" />
              <Txt variant="small" className="font-bold text-status-warning">
                Governance Alert
              </Txt>
            </div>
            <Txt variant="small" className="text-status-warning/70 mb-2">
              {payment.policy_violation || 'High risk transaction'}
            </Txt>
            <div className="flex items-center justify-between">
              <Txt variant="small" className="font-mono text-text-tertiary">
                Risk Score
              </Txt>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-flat">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      payment.risk_score > 80
                        ? 'bg-status-error'
                        : payment.risk_score > 50
                          ? 'bg-status-warning'
                          : 'bg-status-success'
                    )}
                    style={{ width: `${payment.risk_score}%` }}
                  />
                </div>
                <Txt variant="small" className="font-mono text-status-warning">
                  {payment.risk_score}/100
                </Txt>
              </div>
            </div>
          </Surface>
        )}

        {/* âš ï¸ SOD VIOLATION WARNING */}
        {/* ðŸ›¡ï¸ GOVERNANCE: Uses Surface + Txt + StatusDot components */}
        {isSoDViolation && isPending && (
          <Surface
            variant="base"
            className="mb-5 border-status-error/30 bg-status-error/10 p-3"
          >
            <div className="flex items-center gap-2">
              <StatusDot variant="error" size="sm" />
              <Txt variant="small" className="font-bold text-status-error">
                SoD Violation
              </Txt>
            </div>
            <Txt variant="small" className="mt-1 text-status-error/70">
              You cannot approve your own payment request
            </Txt>
          </Surface>
        )}

        {/* â° OVERDUE WARNING */}
        {/* ðŸ›¡ï¸ GOVERNANCE: Uses Surface + Txt + StatusDot components */}
        {isOverdue && isPending && (
          <Surface
            variant="base"
            className="mb-5 border-status-error/30 bg-status-error/10 p-3"
          >
            <div className="flex items-center gap-2">
              <StatusDot variant="error" size="sm" />
              <Txt variant="small" className="font-bold text-status-error">
                Overdue
              </Txt>
            </div>
            <Txt variant="small" className="mt-1 text-status-error/70">
              Payment was due {formatDate(payment.due_date)}
            </Txt>
          </Surface>
        )}

        {/* ðŸ“„ MISSING DOCS WARNING */}
        {/* ðŸ›¡ï¸ GOVERNANCE: Uses Surface + Txt + StatusDot components */}
        {isDocsMissing && isPending && (
          <Surface
            variant="base"
            className="bg-status-warning/10 border-status-warning/30 mb-5 p-3"
          >
            <div className="flex items-center gap-2">
              <StatusDot variant="warning" size="sm" />
              <Txt variant="small" className="font-bold text-status-warning">
                Documentation Incomplete
              </Txt>
            </div>
            <Txt variant="small" className="text-status-warning/70 mt-1">
              {payment.docs_attached}/{payment.docs_required} required documents
              attached
            </Txt>
          </Surface>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {/* âš–ï¸ INTERCOMPANY CONTEXT (Conditional - Purple Theme) */}
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {/* ðŸ›¡ï¸ GOVERNANCE: Uses Surface + Txt + StatusDot components */}
        {isIC && (
          <Surface
            variant="base"
            className="mb-5 border-purple-900/30 bg-purple-900/10 p-3"
          >
            <div className="mb-3 flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-purple-400" />
              <Txt
                variant="small"
                className="font-mono font-bold uppercase tracking-[0.15em] text-purple-400"
              >
                Intercompany Context
              </Txt>
            </div>

            <div className="space-y-2">
              <DetailRow
                label="Route"
                value={`${payment.entity} â†’ ${payment.counterparty_entity || 'Unknown'}`}
              />

              <div className="flex items-center justify-between">
                <Txt variant="small" className="text-text-secondary">
                  Elimination Status
                </Txt>
                <Surface
                  variant="base"
                  className={cn(
                    'rounded border px-2 py-0.5',
                    payment.elimination_status === 'matched' &&
                      'bg-status-success/30 border-status-success',
                    payment.elimination_status === 'unmatched' &&
                      'border-status-error bg-status-error/30'
                  )}
                >
                  <Txt
                    variant="small"
                    className={cn(
                      'font-mono uppercase',
                      payment.elimination_status === 'matched' &&
                        'text-status-success',
                      payment.elimination_status === 'unmatched' &&
                        'text-status-error'
                    )}
                  >
                    {payment.elimination_status}
                  </Txt>
                </Surface>
              </div>

              {isICUnmatched && (
                <Surface
                  variant="base"
                  className="mt-2 border-t border-purple-900/30 pt-2"
                >
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

        {/* ðŸ“‹ WHAT */}
        <AuditSection
          icon={ClipboardList}
          title="What"
          iconColor="text-blue-400"
        >
          <DetailRow
            label="Invoice Reference"
            value={payment.invoice_ref}
            mono
          />
          <DetailRow
            label="Payment Method"
            value={payment.method.toUpperCase()}
            mono
          />
          <DetailRow
            label="Documents"
            value={`${payment.docs_attached}/${payment.docs_required}`}
            warning={isDocsMissing}
            mono
          />
        </AuditSection>

        {/* ðŸ‘¤ WHO */}
        <AuditSection icon={User} title="Who" iconColor="text-purple-400">
          <DetailRow label="Requested By" value={payment.requested_by} />
          {payment.approved_by ? (
            <>
              <DetailRow
                label="Approved By"
                value={payment.approved_by}
                highlight
              />
              <DetailRow
                label="Approved At"
                value={formatDateTime(payment.approved_at!)}
                mono
              />
            </>
          ) : (
            <div className="flex items-center gap-2 py-1">
              <StatusDot variant="warning" size="sm" />
              <Txt variant="small" className="text-status-warning">
                Awaiting Approval
              </Txt>
            </div>
          )}
        </AuditSection>

        {/* ðŸ• WHEN */}
        <AuditSection icon={Calendar} title="When" iconColor="text-amber-400">
          <DetailRow
            label="Created"
            value={formatDateTime(payment.created_at)}
            mono
          />
          <DetailRow
            label="Due Date"
            value={formatDate(payment.due_date)}
            warning={isOverdue}
            mono
          />
          <DetailRow
            label="Time Remaining"
            value={getDaysUntilDue()}
            warning={
              isOverdue ||
              new Date(payment.due_date).getTime() - Date.now() <
                3 * 24 * 60 * 60 * 1000
            }
          />
        </AuditSection>

        {/* ðŸ“ WHERE */}
        <AuditSection icon={MapPin} title="Where" iconColor="text-emerald-400">
          <DetailRow label="Entity" value={payment.entity} />
          <DetailRow label="Cost Center" value={payment.cost_center} mono />
          <DetailRow label="GL Account" value={payment.gl_account} mono />
        </AuditSection>

        {/* âš™ï¸ HOW */}
        <AuditSection icon={CreditCard} title="How" iconColor="text-pink-400">
          <DetailRow
            label="Payment Method"
            value={payment.method.toUpperCase()}
            mono
          />
          <DetailRow label="Currency" value={payment.currency} mono />
        </AuditSection>

        {/* ðŸ“Ž LINKED MANIFESTS */}
        {/* ðŸ›¡ï¸ GOVERNANCE: Uses Surface + Txt + Btn components */}
        {payment.manifests && payment.manifests.length > 0 && (
          <div className="pt-4">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-text-tertiary" />
              <Txt
                variant="small"
                className="font-mono font-bold uppercase tracking-[0.15em] text-text-tertiary"
              >
                Linked Manifests
              </Txt>
            </div>
            <div className="space-y-2">
              {payment.manifests.map((manifest, idx) => (
                <Surface
                  key={idx}
                  variant="flat"
                  className="flex w-full cursor-pointer items-center gap-3 border p-2.5 transition-colors hover:bg-surface-flat"
                >
                  <Surface
                    variant="base"
                    className={cn(
                      'rounded p-1.5',
                      manifest.type === 'invoice' &&
                        'bg-status-neutral/20 text-status-neutral',
                      manifest.type === 'contract' &&
                        'bg-purple-900/20 text-purple-400',
                      manifest.type === 'po' &&
                        'bg-status-success/20 text-status-success',
                      manifest.type === 'receipt' &&
                        'bg-status-warning/20 text-status-warning'
                    )}
                  >
                    <FileText className="h-3.5 w-3.5" />
                  </Surface>
                  <div className="min-w-0 flex-1 text-left">
                    <Txt variant="small" className="truncate text-text-primary">
                      {manifest.label}
                    </Txt>
                    <Txt variant="small" className="text-text-tertiary">
                      {manifest.type.toUpperCase()} â€¢ {manifest.file_size}
                    </Txt>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-text-tertiary" />
                </Surface>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* ACTION FOOTER */}
      {/* ================================================================ */}
      {/* ðŸ›¡ï¸ GOVERNANCE: Uses Surface + Btn + Txt components */}
      {isPending && (
        <Surface variant="flat" className="shrink-0 border-t p-4">
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
                  <ArrowRightLeft className="h-4 w-4" />
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
                  <XCircle className="h-4 w-4" />
                  Reject
                </Btn>
                <Btn
                  variant={canApprove ? 'primary' : 'secondary'}
                  size="md"
                  onClick={() => canApprove && onApprove(payment.id)}
                  disabled={!canApprove}
                  title={
                    !canApprove
                      ? isSoDViolation
                        ? 'SoD Violation'
                        : 'Cannot approve'
                      : undefined
                  }
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </Btn>
              </div>
              <Txt
                variant="small"
                className="mt-2 text-center font-mono text-text-tertiary"
              >
                Approving as:{' '}
                <span className="text-text-secondary">CFO (You)</span>
              </Txt>
            </>
          )}
        </Surface>
      )}

      {/* Historical View for non-pending */}
      {/* ðŸ›¡ï¸ GOVERNANCE: Uses Surface + Txt + StatusDot components */}
      {!isPending && (
        <Surface variant="flat" className="shrink-0 border-t p-4">
          <Surface
            variant="base"
            className={cn(
              'flex items-center justify-center gap-2 rounded py-2.5',
              payment.status === 'approved' && 'bg-status-success/10',
              payment.status === 'rejected' && 'bg-status-error/10',
              payment.status === 'paid' && 'bg-status-neutral/10',
              payment.status === 'draft' && 'bg-surface-flat'
            )}
          >
            {payment.status === 'approved' && (
              <StatusDot variant="success" size="sm" />
            )}
            {payment.status === 'rejected' && (
              <StatusDot variant="error" size="sm" />
            )}
            {payment.status === 'paid' && (
              <StatusDot variant="neutral" size="sm" />
            )}
            <Txt
              variant="body"
              className={cn(
                'font-medium capitalize',
                payment.status === 'approved' && 'text-status-success',
                payment.status === 'rejected' && 'text-status-error',
                payment.status === 'paid' && 'text-status-neutral',
                payment.status === 'draft' && 'text-text-tertiary'
              )}
            >
              {payment.status === 'paid'
                ? 'Payment Completed'
                : `Payment ${payment.status}`}
            </Txt>
          </Surface>
        </Surface>
      )}
    </Surface>
  )
}

export default AuditSidebar
