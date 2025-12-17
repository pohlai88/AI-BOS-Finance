/**
 * Goods Receipt Port (Procurement Integration)
 * 
 * Interface for fetching Goods Receipt Note (GRN) data.
 * Used by AP-03 (3-Way Match Engine) for 3-way matching.
 * 
 * Anti-Gravity: This is a PORT, not an adapter.
 * It defines WHAT we need, not HOW it's implemented.
 * 
 * Note: GRN data may come from:
 * - Internal warehouse module
 * - External WMS (Warehouse Management System)
 * - External ERP
 * 
 * @file packages/kernel-core/src/ports/goodsReceiptPort.ts
 */

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * Goods Receipt status
 */
export type GRNStatus =
  | 'draft'
  | 'pending_inspection'
  | 'inspected'
  | 'accepted'
  | 'rejected'
  | 'partial_accept'
  | 'closed';

/**
 * Goods Receipt line item
 */
export interface GRNLine {
  /** Line ID */
  id: string;
  /** Line number */
  lineNumber: number;
  /** PO line ID (reference) */
  poLineId?: string;
  /** PO number (reference) */
  poNumber?: string;
  /** PO line number (reference) */
  poLineNumber?: number;
  /** Item code/SKU */
  itemCode?: string;
  /** Description */
  description: string;
  /** Received quantity */
  receivedQty: number;
  /** Accepted quantity (after inspection) */
  acceptedQty: number;
  /** Rejected quantity */
  rejectedQty: number;
  /** Unit of measure */
  uom: string;
  /** Receipt date */
  receiptDate: Date;
  /** Storage location */
  storageLocation?: string;
  /** Batch/lot number */
  batchNumber?: string;
  /** Serial numbers (for serialized items) */
  serialNumbers?: string[];
}

/**
 * Goods Receipt entity
 */
export interface GoodsReceipt {
  /** GRN ID */
  id: string;
  /** GRN number */
  grnNumber: string;
  /** Tenant ID */
  tenantId: string;
  /** Company ID */
  companyId: string;
  /** PO ID (primary reference) */
  poId?: string;
  /** PO number */
  poNumber?: string;
  /** Vendor ID */
  vendorId: string;
  /** Vendor name */
  vendorName: string;
  /** Receipt date */
  receiptDate: Date;
  /** Status */
  status: GRNStatus;
  /** GRN lines */
  lines: GRNLine[];
  /** Delivery note number (from supplier) */
  deliveryNoteNumber?: string;
  /** Carrier/shipper */
  carrier?: string;
  /** Received by */
  receivedBy: string;
  /** Inspected by */
  inspectedBy?: string;
  /** Inspection date */
  inspectionDate?: Date;
  /** Created at */
  createdAt: Date;
  /** Updated at */
  updatedAt: Date;
  /** External reference */
  externalRef?: string;
  /** Source system */
  sourceSystem?: string;
}

/**
 * GRN search filters
 */
export interface GRNSearchFilters {
  /** Tenant ID (required) */
  tenantId: string;
  /** Company ID (optional) */
  companyId?: string;
  /** Vendor ID */
  vendorId?: string;
  /** PO number */
  poNumber?: string;
  /** GRN number */
  grnNumber?: string;
  /** Status filter */
  status?: GRNStatus | GRNStatus[];
  /** Date range start */
  fromDate?: Date;
  /** Date range end */
  toDate?: Date;
  /** Has unmatched lines */
  hasUnmatchedLines?: boolean;
}

/**
 * GRN lookup result for 3-way matching
 */
export interface GRNMatchData {
  /** GRN ID */
  grnId: string;
  /** GRN number */
  grnNumber: string;
  /** GRN line ID */
  grnLineId: string;
  /** Line number */
  lineNumber: number;
  /** PO number (reference) */
  poNumber?: string;
  /** PO line ID (reference) */
  poLineId?: string;
  /** PO line number (reference) */
  poLineNumber?: number;
  /** Vendor ID */
  vendorId: string;
  /** Accepted quantity */
  acceptedQty: number;
  /** Already matched quantity (against invoices) */
  matchedQty: number;
  /** Open quantity (accepted - matched) */
  openQty: number;
  /** Receipt date */
  receiptDate: Date;
  /** Item code */
  itemCode?: string;
}

// ============================================================================
// 2. PORT INTERFACE
// ============================================================================

/**
 * Goods Receipt Port for GRN data access
 * 
 * ENTERPRISE REQUIREMENTS:
 * - Must support external WMS/ERP integration
 * - Must handle 3-way match requirements
 * - Must track matched quantities
 */
export interface GoodsReceiptPort {
  /**
   * Get GRN by ID
   * 
   * @param grnId - GRN ID
   * @param tenantId - Tenant ID
   * @returns GRN or null
   */
  getGRNById(grnId: string, tenantId: string): Promise<GoodsReceipt | null>;

  /**
   * Get GRN by number
   * 
   * @param grnNumber - GRN number
   * @param tenantId - Tenant ID
   * @param companyId - Company ID (optional)
   * @returns GRN or null
   */
  getGRNByNumber(
    grnNumber: string,
    tenantId: string,
    companyId?: string
  ): Promise<GoodsReceipt | null>;

  /**
   * Search GRNs
   * 
   * @param filters - Search filters
   * @returns List of GRNs
   */
  searchGRNs(filters: GRNSearchFilters): Promise<GoodsReceipt[]>;

  /**
   * Get GRN match data for a PO line
   * 
   * @param poNumber - PO number
   * @param poLineNumber - PO line number
   * @param tenantId - Tenant ID
   * @returns List of matching GRN lines
   * 
   * Used by AP-03 for 3-way matching:
   * Invoice Line -> PO Line -> GRN Lines
   */
  getGRNMatchDataForPOLine(
    poNumber: string,
    poLineNumber: number,
    tenantId: string
  ): Promise<GRNMatchData[]>;

  /**
   * Get all GRN lines for a PO
   * 
   * @param poNumber - PO number
   * @param tenantId - Tenant ID
   * @returns List of GRN lines
   */
  getGRNLinesForPO(
    poNumber: string,
    tenantId: string
  ): Promise<GRNMatchData[]>;

  /**
   * Get open GRN lines for a vendor (not fully matched)
   * 
   * @param vendorId - Vendor ID
   * @param tenantId - Tenant ID
   * @returns List of open GRN lines
   */
  getOpenGRNLinesForVendor(
    vendorId: string,
    tenantId: string
  ): Promise<GRNMatchData[]>;

  /**
   * Update matched quantity on GRN line
   * 
   * @param grnLineId - GRN line ID
   * @param matchedQty - New matched quantity
   * @param tenantId - Tenant ID
   * @returns True if updated
   * 
   * Called after successful 3-way match
   */
  updateMatchedQty(
    grnLineId: string,
    matchedQty: number,
    tenantId: string
  ): Promise<boolean>;

  /**
   * Get total received quantity for PO line
   * 
   * @param poLineId - PO line ID
   * @param tenantId - Tenant ID
   * @returns Total accepted quantity across all GRNs
   */
  getTotalReceivedQtyForPOLine(
    poLineId: string,
    tenantId: string
  ): Promise<number>;

  /**
   * Check if goods have been received for invoicing
   * 
   * @param poNumber - PO number
   * @param poLineNumber - PO line number
   * @param requiredQty - Required quantity for invoice
   * @param tenantId - Tenant ID
   * @returns Validation result
   */
  validateGRNForInvoicing(
    poNumber: string,
    poLineNumber: number,
    requiredQty: number,
    tenantId: string
  ): Promise<{
    isValid: boolean;
    availableQty: number;
    errorCode?: 'NO_GRN_FOUND' | 'INSUFFICIENT_QTY' | 'GRN_NOT_ACCEPTED';
    errorMessage?: string;
  }>;
}
