/**
 * Payment UI Components - Barrel Export
 * 
 * @improvement Organized exports from private _components folder (Next.js 16 pattern)
 * 
 * These components are colocated with the payments route but not routable.
 * Use underscore prefix (_components) to exclude from routing.
 */

export { ApprovalButton } from './ApprovalButton';
export { PaymentActionMenu } from './PaymentActionMenu';
export {
  ExpandablePaymentRow,
  PaymentStatusBadge,
  EvidenceChecklist
} from './ExpandablePaymentRow';
export {
  RiskQueueDashboard,
  useExceptionCounts,
  type ExceptionCounts,
  type RiskQueueDashboardProps,
} from './RiskQueueDashboard';
export {
  ExceptionBadge,
  ExceptionBadgeList,
  SeverityIndicator,
  type PaymentException,
  type ExceptionType,
  type ExceptionSeverity,
  type ExceptionBadgeProps,
} from './ExceptionBadge';
export {
  ApprovalChainTimeline,
  CompactApprovalChain,
  type AuditEvent,
  type ApprovalChainTimelineProps,
} from './ApprovalChainTimeline';
export {
  QuickDocumentPreview,
  DocumentList,
  DocumentBadge,
  type DocumentInfo,
  type DocumentType,
  type QuickDocumentPreviewProps,
  type DocumentListProps,
} from './QuickDocumentPreview';

// Bio Transform Self components (schema-driven UI)
export {
  BioPaymentTable,
  PaymentTableRowSchema,
  type PaymentTableRow,
  type BioPaymentTableProps,
} from './BioPaymentTable';

// Phase 6 Proof of Concept
export { PaymentBioTableDemo, type PaymentBioTableDemoProps } from './PaymentBioTableDemo';

// Dashboard Components (AP-05 Backend Integration)
export { PaymentDashboardCards } from './PaymentDashboardCards';
export { CashPositionWidget } from './CashPositionWidget';
export { ControlHealthWidget } from './ControlHealthWidget';
