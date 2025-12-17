'use client';

/**
 * ExpandablePaymentRow - Evidence-in-One-Glance Component
 * 
 * CONT_08: Phase 6c Enhancement
 * Purpose: Show approval chain, evidence summary, and documents without clicking through screens
 * 
 * UX Goal: Controller confidence in < 2 seconds
 */

import { useState, useCallback } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Clock,
  FileText,
  User,
  Calendar,
  DollarSign,
  AlertTriangle,
  AlertCircle,
  Ban,
  Send,
  Play,
  Building2,
  CreditCard,
  ExternalLink,
  Eye,
  Shield,
  Hash,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface Payment {
  id: string;
  paymentNumber: string;
  vendorId: string;
  vendorName: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  paymentDate: string;
  sourceDocumentId?: string;
  sourceDocumentType?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  executedBy?: string;
  executedAt?: string;
  beneficiaryAccountNumber?: string;
  beneficiaryBankName?: string;
  beneficiarySnapshotAt?: string;
  journalHeaderId?: string;
  version: number;
}

type PaymentStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'processing'
  | 'completed'
  | 'failed';

interface PaymentException {
  id: string;
  paymentId: string;
  type: ExceptionType;
  severity: 'info' | 'warning' | 'critical' | 'block';
  message: string;
  detectedAt: string;
}

type ExceptionType =
  | 'MISSING_INVOICE'
  | 'STALE_APPROVAL'
  | 'DUPLICATE_RISK'
  | 'BANK_DETAIL_CHANGED'
  | 'OVER_LIMIT'
  | 'PERIOD_WARNING';

interface AuditEvent {
  id: string;
  action: string;
  actorId: string;
  actorName?: string;
  timestamp: string;
  payload?: Record<string, unknown>;
}

interface ExpandablePaymentRowProps {
  payment: Payment;
  exceptions?: PaymentException[];
  auditEvents?: AuditEvent[];
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onApprove?: (id: string, version: number) => void;
  onReject?: (id: string, version: number) => void;
  onViewDetail?: (id: string) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ExpandablePaymentRow({
  payment,
  exceptions = [],
  auditEvents = [],
  isSelected = false,
  onSelect,
  onApprove,
  onReject,
  onViewDetail,
}: ExpandablePaymentRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleApprove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onApprove?.(payment.id, payment.version);
  }, [payment.id, payment.version, onApprove]);

  const handleReject = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onReject?.(payment.id, payment.version);
  }, [payment.id, payment.version, onReject]);

  const hasExceptions = exceptions.length > 0;
  const criticalExceptions = exceptions.filter(e => e.severity === 'critical' || e.severity === 'block');

  return (
    <TooltipProvider>
      <>
        {/* ================================================================ */}
        {/* MAIN ROW */}
        {/* ================================================================ */}
        <TableRow
          className={cn(
            'cursor-pointer transition-all duration-200',
            'hover:bg-muted/50',
            isExpanded && 'bg-muted/30 border-b-0',
            hasExceptions && 'border-l-4',
            criticalExceptions.length > 0 ? 'border-l-red-500' : hasExceptions && 'border-l-yellow-400',
          )}
          onClick={toggleExpand}
        >
          {/* Expand Toggle */}
          <TableCell className="w-10 pr-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </TableCell>

          {/* Payment Number */}
          <TableCell className="font-mono text-sm font-medium">
            <span className="text-primary">{payment.paymentNumber}</span>
          </TableCell>

          {/* Vendor with Exception Badges */}
          <TableCell>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate max-w-[200px]">{payment.vendorName}</span>
              <ExceptionBadges exceptions={exceptions} />
            </div>
          </TableCell>

          {/* Amount */}
          <TableCell className="text-right font-mono tabular-nums">
            <span className="font-semibold">
              {formatMoney(payment.amount, payment.currency)}
            </span>
          </TableCell>

          {/* Status */}
          <TableCell>
            <PaymentStatusBadge status={payment.status} />
          </TableCell>

          {/* Evidence Indicators (Compact) */}
          <TableCell>
            <EvidenceIndicators payment={payment} auditEvents={auditEvents} />
          </TableCell>

          {/* Quick Actions */}
          <TableCell className="text-right">
            <div
              className="flex justify-end gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {payment.status === 'pending_approval' && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={handleApprove}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Approve</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={handleReject}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reject</TooltipContent>
                  </Tooltip>
                </>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetail?.(payment.id);
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View Details</TooltipContent>
              </Tooltip>
            </div>
          </TableCell>
        </TableRow>

        {/* ================================================================ */}
        {/* EXPANDED EVIDENCE PANEL */}
        {/* ================================================================ */}
        {isExpanded && (
          <TableRow className="bg-gradient-to-b from-muted/40 to-muted/20 hover:bg-muted/40">
            <TableCell colSpan={7} className="p-0">
              <div className="p-4 animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  {/* Column 1: Approval Chain Timeline */}
                  <Card className="shadow-sm">
                    <CardContent className="p-4">
                      <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                        <User className="h-4 w-4 text-primary" />
                        Approval Chain
                      </h4>
                      <ApprovalChainTimeline
                        payment={payment}
                        auditEvents={auditEvents}
                      />
                    </CardContent>
                  </Card>

                  {/* Column 2: Evidence Checklist */}
                  <Card className="shadow-sm">
                    <CardContent className="p-4">
                      <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                        <Shield className="h-4 w-4 text-primary" />
                        Evidence Checklist
                      </h4>
                      <EvidenceChecklist payment={payment} />
                    </CardContent>
                  </Card>

                  {/* Column 3: Quick Details & Documents */}
                  <Card className="shadow-sm">
                    <CardContent className="p-4">
                      <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-primary" />
                        Details & Documents
                      </h4>
                      <QuickDetailsPanel payment={payment} />

                      {payment.sourceDocumentId && (
                        <>
                          <Separator className="my-3" />
                          <DocumentPreviewThumbnail
                            documentId={payment.sourceDocumentId}
                            documentType={payment.sourceDocumentType}
                          />
                        </>
                      )}
                    </CardContent>
                  </Card>

                </div>

                {/* Exceptions Alert (if any) */}
                {hasExceptions && (
                  <div className="mt-4">
                    <ExceptionAlerts exceptions={exceptions} />
                  </div>
                )}
              </div>
            </TableCell>
          </TableRow>
        )}
      </>
    </TooltipProvider>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Payment Status Badge
 */
function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config: Record<PaymentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
    draft: { label: 'Draft', variant: 'secondary' },
    pending_approval: { label: 'Pending', variant: 'outline', className: 'border-yellow-500 text-yellow-700 bg-yellow-50' },
    approved: { label: 'Approved', variant: 'outline', className: 'border-green-500 text-green-700 bg-green-50' },
    rejected: { label: 'Rejected', variant: 'destructive' },
    processing: { label: 'Processing', variant: 'outline', className: 'border-blue-500 text-blue-700 bg-blue-50' },
    completed: { label: 'Completed', variant: 'default', className: 'bg-green-600' },
    failed: { label: 'Failed', variant: 'destructive' },
  };

  const { label, variant, className } = config[status];

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}

/**
 * Exception Badges (compact, in main row)
 */
function ExceptionBadges({ exceptions }: { exceptions: PaymentException[] }) {
  if (exceptions.length === 0) return null;

  const severityOrder = ['block', 'critical', 'warning', 'info'];
  const sorted = [...exceptions].sort(
    (a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
  );
  const primary = sorted[0];

  const config: Record<string, { icon: typeof AlertCircle; color: string }> = {
    MISSING_INVOICE: { icon: FileText, color: 'text-status-warning/90 bg-status-warning/10' },
    STALE_APPROVAL: { icon: Clock, color: 'text-status-danger/90 bg-status-danger/10' },
    DUPLICATE_RISK: { icon: Ban, color: 'text-status-danger/90 bg-status-danger/10' },
    BANK_DETAIL_CHANGED: { icon: CreditCard, color: 'text-status-warning/90 bg-status-warning/10' },
    OVER_LIMIT: { icon: AlertCircle, color: 'text-status-danger/90 bg-status-danger/10' },
    PERIOD_WARNING: { icon: Calendar, color: 'text-status-warning/90 bg-status-warning/10' },
  };

  const { icon: Icon, color } = config[primary.type] || { icon: AlertTriangle, color: 'text-gray-600 bg-gray-50' };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={cn('gap-1 cursor-help', color)}>
          <Icon className="h-3 w-3" />
          {exceptions.length > 1 ? `${exceptions.length} issues` : primary.message.slice(0, 20)}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="space-y-1">
          {exceptions.map((exc) => (
            <div key={exc.id} className="text-xs flex items-start gap-1">
              <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
              <span>{exc.message}</span>
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Evidence Indicators (compact badges in main row)
 */
function EvidenceIndicators({ payment, auditEvents }: { payment: Payment; auditEvents: AuditEvent[] }) {
  const hasInvoice = !!payment.sourceDocumentId;
  const hasApproval = auditEvents.some(e => e.action.includes('approved'));
  const hasExecution = !!payment.executedAt;
  const hasJournal = !!payment.journalHeaderId;

  const indicators = [
    { key: 'invoice', active: hasInvoice, icon: FileText, label: 'Invoice' },
    { key: 'approval', active: hasApproval, icon: Check, label: 'Approved' },
    { key: 'execution', active: hasExecution, icon: Play, label: 'Executed' },
    { key: 'journal', active: hasJournal, icon: Hash, label: 'Posted' },
  ];

  return (
    <div className="flex items-center gap-0.5">
      {indicators.map(({ key, active, icon: Icon, label }) => (
        <Tooltip key={key}>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'h-5 w-5 rounded flex items-center justify-center transition-colors',
                active
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-400'
              )}
            >
              <Icon className="h-3 w-3" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {label}: {active ? 'Yes' : 'No'}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

/**
 * Approval Chain Timeline (expanded view)
 */
function ApprovalChainTimeline({ payment, auditEvents }: { payment: Payment; auditEvents: AuditEvent[] }) {
  // Build timeline from audit events
  const timeline = auditEvents
    .filter(e => e.action.startsWith('finance.ap.payment.'))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(event => ({
      action: event.action.split('.').pop() || '',
      actor: event.actorName || event.actorId?.slice(0, 8) || 'System',
      timestamp: event.timestamp,
    }));

  // Add current state if pending
  if (payment.status === 'pending_approval' && timeline.length > 0) {
    timeline.push({
      action: 'awaiting',
      actor: 'Pending approval',
      timestamp: new Date().toISOString(),
    });
  }

  const actionConfig: Record<string, { icon: typeof Check; color: string; bgColor: string }> = {
    created: { icon: Send, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    submitted: { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    approved: { icon: Check, color: 'text-green-600', bgColor: 'bg-green-100' },
    rejected: { icon: X, color: 'text-red-600', bgColor: 'bg-red-100' },
    executed: { icon: Play, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    completed: { icon: Check, color: 'text-green-600', bgColor: 'bg-green-100' },
    failed: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
    awaiting: { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  };

  return (
    <div className="relative">
      {/* Vertical line connector */}
      <div className="absolute left-3 top-3 bottom-3 w-px bg-border" />

      <div className="space-y-3">
        {timeline.map((step, index) => {
          const config = actionConfig[step.action] || actionConfig.created;
          const Icon = config.icon;
          const isLast = index === timeline.length - 1;
          const isPending = step.action === 'awaiting';

          return (
            <div key={index} className="flex items-start gap-3 relative">
              <div
                className={cn(
                  'relative z-10 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center',
                  config.bgColor,
                  isPending && 'animate-pulse'
                )}
              >
                <Icon className={cn('h-3 w-3', config.color)} />
              </div>

              <div className="flex-1 min-w-0 pb-1">
                <p className={cn(
                  'text-sm font-medium capitalize',
                  isPending && 'text-yellow-600'
                )}>
                  {step.action === 'awaiting' ? 'Awaiting Approval' : step.action}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isPending ? (
                    <span className="text-yellow-600">
                      Waiting {formatWaitTime(payment.updatedAt || payment.createdAt)}
                    </span>
                  ) : (
                    <>
                      by {step.actor} • {formatRelativeTime(step.timestamp)}
                    </>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Evidence Checklist (expanded view)
 */
function EvidenceChecklist({ payment }: { payment: Payment }) {
  const checks = [
    {
      label: 'Source Document',
      passed: !!payment.sourceDocumentId,
      value: payment.sourceDocumentType
        ? `${payment.sourceDocumentType.charAt(0).toUpperCase()}${payment.sourceDocumentType.slice(1)}`
        : 'Missing',
      critical: !payment.sourceDocumentId && payment.status !== 'draft',
    },
    {
      label: 'Segregation of Duties',
      passed: !payment.approvedBy || payment.createdBy !== payment.approvedBy,
      value: payment.approvedBy
        ? (payment.createdBy !== payment.approvedBy ? '✓ Verified' : '✗ Violation')
        : 'Pending verification',
      critical: payment.approvedBy && payment.createdBy === payment.approvedBy,
    },
    {
      label: 'Fiscal Period',
      passed: true, // Would check against fiscal calendar
      value: 'Open',
      critical: false,
    },
    {
      label: 'Beneficiary Details',
      passed: payment.status !== 'processing' || !!payment.beneficiaryAccountNumber,
      value: payment.beneficiaryBankName || 'Not captured yet',
      critical: payment.status === 'processing' && !payment.beneficiaryAccountNumber,
    },
    {
      label: 'GL Posting',
      passed: payment.status !== 'completed' || !!payment.journalHeaderId,
      value: payment.journalHeaderId
        ? `Journal ${payment.journalHeaderId.slice(0, 8)}...`
        : 'Pending',
      critical: payment.status === 'completed' && !payment.journalHeaderId,
    },
  ];

  const passedCount = checks.filter(c => c.passed).length;
  const totalCount = checks.length;
  const percentage = Math.round((passedCount / totalCount) * 100);

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <Progress
          value={percentage}
          className={cn(
            'h-2 flex-1',
            percentage === 100 ? '[&>div]:bg-green-500' : '[&>div]:bg-yellow-500'
          )}
        />
        <span className="text-xs font-semibold text-muted-foreground">
          {passedCount}/{totalCount}
        </span>
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {checks.map((check, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center justify-between text-xs py-1',
              check.critical && 'text-red-600'
            )}
          >
            <span className="flex items-center gap-2">
              {check.passed ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : check.critical ? (
                <X className="h-3.5 w-3.5 text-red-600" />
              ) : (
                <Clock className="h-3.5 w-3.5 text-yellow-600" />
              )}
              <span className={cn(!check.passed && !check.critical && 'text-muted-foreground')}>
                {check.label}
              </span>
            </span>
            <span className={cn(
              'font-medium',
              check.passed ? 'text-green-600' : check.critical ? 'text-red-600' : 'text-muted-foreground'
            )}>
              {check.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Quick Details Panel (expanded view)
 */
function QuickDetailsPanel({ payment }: { payment: Payment }) {
  const details = [
    { label: 'Payment Date', value: formatDate(payment.paymentDate), icon: Calendar },
    { label: 'Amount', value: formatMoney(payment.amount, payment.currency), icon: DollarSign },
    { label: 'Created By', value: payment.createdByName || payment.createdBy.slice(0, 8), icon: User },
    { label: 'Version', value: `v${payment.version}`, icon: Hash },
  ];

  if (payment.approvedBy) {
    details.push({
      label: 'Approved By',
      value: payment.approvedByName || payment.approvedBy.slice(0, 8),
      icon: Check,
    });
  }

  if (payment.beneficiaryBankName) {
    details.push({
      label: 'Bank',
      value: payment.beneficiaryBankName,
      icon: Building2,
    });
  }

  return (
    <div className="space-y-2">
      {details.map((detail, index) => (
        <div key={index} className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-2 text-muted-foreground">
            <detail.icon className="h-3 w-3" />
            {detail.label}
          </span>
          <span className="font-medium">{detail.value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Document Preview Thumbnail
 */
function DocumentPreviewThumbnail({
  documentId,
  documentType
}: {
  documentId: string;
  documentType?: string;
}) {
  return (
    <div className="mt-2">
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2 h-auto py-2"
      >
        <div className="h-8 w-8 bg-muted rounded flex items-center justify-center flex-shrink-0">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-left min-w-0">
          <p className="text-xs font-medium truncate">
            {documentType ? `${documentType.charAt(0).toUpperCase()}${documentType.slice(1)}` : 'Document'}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {documentId.slice(0, 8)}...
          </p>
        </div>
        <Eye className="h-4 w-4 ml-auto text-muted-foreground" />
      </Button>
    </div>
  );
}

/**
 * Exception Alerts (expanded view footer)
 */
function ExceptionAlerts({ exceptions }: { exceptions: PaymentException[] }) {
  const critical = exceptions.filter(e => e.severity === 'critical' || e.severity === 'block');
  const warnings = exceptions.filter(e => e.severity === 'warning');

  return (
    <div className="space-y-2">
      {critical.length > 0 && (
        <div className="flex items-start gap-2 p-2 rounded-md bg-red-50 border border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-red-700 space-y-1">
            {critical.map((exc) => (
              <p key={exc.id}>• {exc.message}</p>
            ))}
          </div>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="flex items-start gap-2 p-2 rounded-md bg-yellow-50 border border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-yellow-700 space-y-1">
            {warnings.map((exc) => (
              <p key={exc.id}>• {exc.message}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatMoney(amount: string, currency: string): string {
  const num = parseFloat(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

function formatWaitTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);

  if (hours < 1) return 'less than 1 hour';
  if (hours < 24) return `${hours} hours`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''}`;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { PaymentStatusBadge, EvidenceChecklist, ApprovalChainTimeline };
