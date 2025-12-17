/**
 * Purchase Order Port (Procurement Integration)
 * 
 * Interface for fetching Purchase Order data.
 * Used by AP-03 (3-Way Match Engine) for matching.
 * 
 * Anti-Gravity: This is a PORT, not an adapter.
 * It defines WHAT we need, not HOW it's implemented.
 * 
 * Note: PO data may come from:
 * - Internal procurement module
 * - External ERP (SAP, Oracle, etc.)
 * - Integration API
 * 
 * @file packages/kernel-core/src/ports/purchaseOrderPort.ts
 */

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * Purchase Order status
 */
export type POStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'partially_received'
  | 'fully_received'
  | 'closed'
  | 'cancelled';

/**
 * Purchase Order line item
 */
export interface POLine {
  /** Line ID */
  id: string;
  /** Line number */
  lineNumber: number;
  /** Item code/SKU */
  itemCode?: string;
  /** Description */
  description: string;
  /** Ordered quantity */
  orderedQty: number;
  /** Received quantity (from GRN) */
  receivedQty: number;
  /** Invoiced quantity */
  invoicedQty: number;
  /** Remaining to receive */
  remainingQty: number;
  /** Unit of measure */
  uom: string;
  /** Unit price */
  unitPrice: string;
  /** Line total (orderedQty * unitPrice) */
  lineTotal: string;
  /** Currency */
  currency: string;
  /** Tax rate */
  taxRate?: string;
  /** GL account code */
  accountCode?: string;
  /** Cost center */
  costCenter?: string;
}

/**
 * Purchase Order entity
 */
export interface PurchaseOrder {
  /** PO ID */
  id: string;
  /** PO number */
  poNumber: string;
  /** Tenant ID */
  tenantId: string;
  /** Company ID */
  companyId: string;
  /** Vendor ID (FK to AP-01) */
  vendorId: string;
  /** Vendor name */
  vendorName: string;
  /** PO date */
  poDate: Date;
  /** Expected delivery date */
  expectedDeliveryDate?: Date;
  /** Status */
  status: POStatus;
  /** Subtotal */
  subtotal: string;
  /** Tax amount */
  taxAmount: string;
  /** Total amount */
  totalAmount: string;
  /** Currency */
  currency: string;
  /** PO lines */
  lines: POLine[];
  /** Created by */
  createdBy: string;
  /** Created at */
  createdAt: Date;
  /** Updated at */
  updatedAt: Date;
  /** External reference (if from ERP) */
  externalRef?: string;
  /** Source system */
  sourceSystem?: string;
}

/**
 * PO search filters
 */
export interface POSearchFilters {
  /** Tenant ID (required) */
  tenantId: string;
  /** Company ID (optional) */
  companyId?: string;
  /** Vendor ID */
  vendorId?: string;
  /** PO number */
  poNumber?: string;
  /** Status filter */
  status?: POStatus | POStatus[];
  /** Date range start */
  fromDate?: Date;
  /** Date range end */
  toDate?: Date;
  /** Has open lines for matching */
  hasOpenLines?: boolean;
}

/**
 * PO lookup result for matching
 */
export interface POMatchData {
  /** PO ID */
  poId: string;
  /** PO number */
  poNumber: string;
  /** PO line ID */
  poLineId: string;
  /** Line number */
  lineNumber: number;
  /** Vendor ID */
  vendorId: string;
  /** Unit price on PO */
  poUnitPrice: string;
  /** Ordered quantity */
  orderedQty: number;
  /** Received quantity */
  receivedQty: number;
  /** Invoiced quantity */
  invoicedQty: number;
  /** Open quantity (ordered - invoiced) */
  openQty: number;
  /** Currency */
  currency: string;
  /** Item code */
  itemCode?: string;
}

// ============================================================================
// 2. PORT INTERFACE
// ============================================================================

/**
 * Purchase Order Port for PO data access
 * 
 * ENTERPRISE REQUIREMENTS:
 * - Must support external ERP integration
 * - Must cache data for performance
 * - Must handle network failures gracefully
 */
export interface PurchaseOrderPort {
  /**
   * Get PO by ID
   * 
   * @param poId - Purchase Order ID
   * @param tenantId - Tenant ID
   * @returns PO or null
   */
  getPOById(poId: string, tenantId: string): Promise<PurchaseOrder | null>;

  /**
   * Get PO by number
   * 
   * @param poNumber - PO number
   * @param tenantId - Tenant ID
   * @param companyId - Company ID (optional)
   * @returns PO or null
   */
  getPOByNumber(
    poNumber: string,
    tenantId: string,
    companyId?: string
  ): Promise<PurchaseOrder | null>;

  /**
   * Search POs
   * 
   * @param filters - Search filters
   * @returns List of POs
   */
  searchPOs(filters: POSearchFilters): Promise<PurchaseOrder[]>;

  /**
   * Get PO match data for an invoice line
   * 
   * @param poNumber - PO number
   * @param poLineNumber - PO line number
   * @param tenantId - Tenant ID
   * @returns Match data or null
   * 
   * Used by AP-03 for matching invoice lines to PO lines
   */
  getPOMatchData(
    poNumber: string,
    poLineNumber: number,
    tenantId: string
  ): Promise<POMatchData | null>;

  /**
   * Get all open PO lines for a vendor
   * 
   * @param vendorId - Vendor ID
   * @param tenantId - Tenant ID
   * @returns List of open PO lines for matching
   */
  getOpenPOLinesForVendor(
    vendorId: string,
    tenantId: string
  ): Promise<POMatchData[]>;

  /**
   * Update invoiced quantity on PO line
   * 
   * @param poLineId - PO line ID
   * @param invoicedQty - New invoiced quantity
   * @param tenantId - Tenant ID
   * @returns True if updated
   * 
   * Called after successful invoice matching
   */
  updateInvoicedQty(
    poLineId: string,
    invoicedQty: number,
    tenantId: string
  ): Promise<boolean>;

  /**
   * Check if PO exists and is valid for invoicing
   * 
   * @param poNumber - PO number
   * @param vendorId - Vendor ID
   * @param tenantId - Tenant ID
   * @returns Validation result
   */
  validatePOForInvoicing(
    poNumber: string,
    vendorId: string,
    tenantId: string
  ): Promise<{
    isValid: boolean;
    errorCode?: 'PO_NOT_FOUND' | 'PO_CLOSED' | 'PO_CANCELLED' | 'VENDOR_MISMATCH';
    errorMessage?: string;
  }>;
}
