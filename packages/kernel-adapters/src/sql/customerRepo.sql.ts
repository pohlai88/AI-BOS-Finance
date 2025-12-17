/**
 * AR-01 Customer Master - SQL Repository Adapter
 * 
 * PostgreSQL implementation of CustomerRepositoryPort.
 * 
 * @module AR-01
 */

import { Pool, PoolClient } from 'pg';
import {
  Customer,
  CustomerAddress,
  CustomerContact,
  CustomerCreditHistory,
  CustomerRepositoryPort,
  CustomerFilter,
  CreateCustomerData,
  UpdateCustomerData,
  CreateAddressData,
  CreateContactData,
  CreateCreditHistoryData,
  TransactionContext,
} from '@aibos/kernel-core';

// =============================================================================
// SQL Queries
// =============================================================================

const SQL = {
  // Customer queries
  INSERT_CUSTOMER: `
    INSERT INTO ar.customers (
      tenant_id, customer_code, legal_name, display_name, tax_id,
      registration_number, country, currency_preference, customer_category,
      status, risk_level, credit_limit, current_balance, default_payment_terms,
      created_by, version
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', $10, $11, 0, $12, $13, 1
    )
    RETURNING *
  `,
  
  SELECT_CUSTOMER_BY_ID: `
    SELECT * FROM ar.customers WHERE id = $1 AND tenant_id = $2
  `,
  
  SELECT_CUSTOMER_BY_CODE: `
    SELECT * FROM ar.customers WHERE customer_code = $1 AND tenant_id = $2
  `,
  
  EXISTS_BY_TAX_ID: `
    SELECT 1 FROM ar.customers 
    WHERE tax_id = $1 AND tenant_id = $2 AND ($3::uuid IS NULL OR id != $3)
    LIMIT 1
  `,
  
  // Address queries
  INSERT_ADDRESS: `
    INSERT INTO ar.customer_addresses (
      customer_id, tenant_id, address_type, address_line_1, address_line_2,
      city, state_province, postal_code, country, is_primary, is_active, version
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, 1
    )
    RETURNING *
  `,
  
  SELECT_ADDRESSES: `
    SELECT * FROM ar.customer_addresses 
    WHERE customer_id = $1 AND tenant_id = $2
    ORDER BY is_primary DESC, created_at ASC
  `,
  
  // Contact queries
  INSERT_CONTACT: `
    INSERT INTO ar.customer_contacts (
      customer_id, tenant_id, contact_type, first_name, last_name,
      email, phone, title, is_primary, is_active, 
      receives_invoices, receives_statements, version
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, $11, 1
    )
    RETURNING *
  `,
  
  SELECT_CONTACTS: `
    SELECT * FROM ar.customer_contacts 
    WHERE customer_id = $1 AND tenant_id = $2
    ORDER BY is_primary DESC, created_at ASC
  `,
  
  // Credit history queries
  INSERT_CREDIT_HISTORY: `
    INSERT INTO ar.customer_credit_history (
      customer_id, tenant_id, old_credit_limit, new_credit_limit,
      change_reason, change_request_status, change_requested_by,
      change_requested_at, created_by, version
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, CASE WHEN $7 IS NOT NULL THEN NOW() ELSE NULL END, $8, 1
    )
    RETURNING *
  `,
  
  SELECT_CREDIT_HISTORY: `
    SELECT * FROM ar.customer_credit_history 
    WHERE customer_id = $1 AND tenant_id = $2
    ORDER BY created_at DESC
  `,
  
  SELECT_PENDING_CREDIT_CHANGE: `
    SELECT * FROM ar.customer_credit_history 
    WHERE customer_id = $1 AND tenant_id = $2 AND change_request_status = 'pending_approval'
    LIMIT 1
  `,
  
  APPROVE_CREDIT_CHANGE: `
    UPDATE ar.customer_credit_history
    SET change_request_status = 'approved',
        change_approved_by = $1,
        change_approved_at = NOW(),
        version = version + 1,
        updated_at = NOW()
    WHERE id = $2 AND tenant_id = $3 AND version = $4
    RETURNING *
  `,
  
  REJECT_CREDIT_CHANGE: `
    UPDATE ar.customer_credit_history
    SET change_request_status = 'rejected',
        change_approved_by = $1,
        change_approved_at = NOW(),
        version = version + 1,
        updated_at = NOW()
    WHERE id = $2 AND tenant_id = $3 AND version = $4
    RETURNING *
  `,
};

// =============================================================================
// Row Mappers
// =============================================================================

function mapCustomerRow(row: Record<string, unknown>): Customer {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    customerCode: row.customer_code as string,
    legalName: row.legal_name as string,
    displayName: row.display_name as string | null,
    taxId: row.tax_id as string | null,
    registrationNumber: row.registration_number as string | null,
    country: row.country as string,
    currencyPreference: row.currency_preference as string,
    customerCategory: row.customer_category as string | null,
    status: row.status as Customer['status'],
    riskLevel: row.risk_level as Customer['riskLevel'],
    creditLimit: parseFloat(row.credit_limit as string),
    currentBalance: parseFloat(row.current_balance as string),
    availableCredit: parseFloat(row.available_credit as string),
    defaultPaymentTerms: row.default_payment_terms as number,
    creditRiskScore: row.credit_risk_score as number | null,
    paymentHistoryFlag: row.payment_history_flag as Customer['paymentHistoryFlag'],
    collectionStatus: row.collection_status as Customer['collectionStatus'],
    lastBalanceUpdatedAt: row.last_balance_updated_at ? new Date(row.last_balance_updated_at as string) : null,
    lastReconciledAt: row.last_reconciled_at ? new Date(row.last_reconciled_at as string) : null,
    createdBy: row.created_by as string,
    createdAt: new Date(row.created_at as string),
    approvedBy: row.approved_by as string | null,
    approvedAt: row.approved_at ? new Date(row.approved_at as string) : null,
    version: row.version as number,
    updatedAt: new Date(row.updated_at as string),
  };
}

function mapAddressRow(row: Record<string, unknown>): CustomerAddress {
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    tenantId: row.tenant_id as string,
    addressType: row.address_type as CustomerAddress['addressType'],
    addressLine1: row.address_line_1 as string,
    addressLine2: row.address_line_2 as string | null,
    city: row.city as string,
    stateProvince: row.state_province as string | null,
    postalCode: row.postal_code as string | null,
    country: row.country as string,
    isPrimary: row.is_primary as boolean,
    isActive: row.is_active as boolean,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    version: row.version as number,
  };
}

function mapContactRow(row: Record<string, unknown>): CustomerContact {
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    tenantId: row.tenant_id as string,
    contactType: row.contact_type as CustomerContact['contactType'],
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    email: row.email as string | null,
    phone: row.phone as string | null,
    title: row.title as string | null,
    isPrimary: row.is_primary as boolean,
    isActive: row.is_active as boolean,
    receivesInvoices: row.receives_invoices as boolean,
    receivesStatements: row.receives_statements as boolean,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    version: row.version as number,
  };
}

function mapCreditHistoryRow(row: Record<string, unknown>): CustomerCreditHistory {
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    tenantId: row.tenant_id as string,
    oldCreditLimit: row.old_credit_limit ? parseFloat(row.old_credit_limit as string) : null,
    newCreditLimit: parseFloat(row.new_credit_limit as string),
    changeReason: row.change_reason as string,
    changeRequestStatus: row.change_request_status as CustomerCreditHistory['changeRequestStatus'],
    changeRequestedBy: row.change_requested_by as string | null,
    changeRequestedAt: row.change_requested_at ? new Date(row.change_requested_at as string) : null,
    changeApprovedBy: row.change_approved_by as string | null,
    changeApprovedAt: row.change_approved_at ? new Date(row.change_approved_at as string) : null,
    createdBy: row.created_by as string,
    createdAt: new Date(row.created_at as string),
    version: row.version as number,
    updatedAt: new Date(row.updated_at as string),
  };
}

// =============================================================================
// Adapter Implementation
// =============================================================================

export class SqlCustomerAdapter implements CustomerRepositoryPort {
  constructor(private readonly pool: Pool) {}

  private getClient(ctx?: TransactionContext): Pool | PoolClient {
    return (ctx?.client as PoolClient) ?? this.pool;
  }

  // ---------------------------------------------------------------------------
  // Customer CRUD
  // ---------------------------------------------------------------------------

  async create(
    data: CreateCustomerData,
    customerCode: string,
    ctx?: TransactionContext
  ): Promise<Customer> {
    const client = this.getClient(ctx);
    const result = await client.query(SQL.INSERT_CUSTOMER, [
      data.tenantId,
      customerCode,
      data.legalName,
      data.displayName ?? null,
      data.taxId ?? null,
      data.registrationNumber ?? null,
      data.country,
      data.currencyPreference ?? 'USD',
      data.customerCategory ?? null,
      data.riskLevel ?? 'LOW',
      data.creditLimit ?? 0,
      data.defaultPaymentTerms ?? 30,
      data.createdBy,
    ]);
    return mapCustomerRow(result.rows[0]);
  }

  async getById(
    id: string,
    tenantId: string,
    ctx?: TransactionContext
  ): Promise<Customer | null> {
    const client = this.getClient(ctx);
    const result = await client.query(SQL.SELECT_CUSTOMER_BY_ID, [id, tenantId]);
    return result.rows.length > 0 ? mapCustomerRow(result.rows[0]) : null;
  }

  async getByCode(
    customerCode: string,
    tenantId: string,
    ctx?: TransactionContext
  ): Promise<Customer | null> {
    const client = this.getClient(ctx);
    const result = await client.query(SQL.SELECT_CUSTOMER_BY_CODE, [customerCode, tenantId]);
    return result.rows.length > 0 ? mapCustomerRow(result.rows[0]) : null;
  }

  async update(
    id: string,
    tenantId: string,
    data: UpdateCustomerData,
    expectedVersion: number,
    ctx?: TransactionContext
  ): Promise<Customer | null> {
    const client = this.getClient(ctx);
    
    // Build dynamic UPDATE query
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const fieldMappings: Record<string, string> = {
      legalName: 'legal_name',
      displayName: 'display_name',
      taxId: 'tax_id',
      registrationNumber: 'registration_number',
      country: 'country',
      currencyPreference: 'currency_preference',
      customerCategory: 'customer_category',
      riskLevel: 'risk_level',
      creditLimit: 'credit_limit',
      defaultPaymentTerms: 'default_payment_terms',
      status: 'status',
      approvedBy: 'approved_by',
      approvedAt: 'approved_at',
      creditRiskScore: 'credit_risk_score',
      paymentHistoryFlag: 'payment_history_flag',
      collectionStatus: 'collection_status',
      currentBalance: 'current_balance',
      lastBalanceUpdatedAt: 'last_balance_updated_at',
    };

    for (const [key, column] of Object.entries(fieldMappings)) {
      if (data[key as keyof UpdateCustomerData] !== undefined) {
        setClauses.push(`${column} = $${paramIndex}`);
        values.push(data[key as keyof UpdateCustomerData]);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      // No fields to update
      return this.getById(id, tenantId, ctx);
    }

    // Always update version and updated_at
    setClauses.push(`version = version + 1`);
    setClauses.push(`updated_at = NOW()`);

    const sql = `
      UPDATE ar.customers
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1} AND version = $${paramIndex + 2}
      RETURNING *
    `;
    values.push(id, tenantId, expectedVersion);

    const result = await client.query(sql, values);
    return result.rows.length > 0 ? mapCustomerRow(result.rows[0]) : null;
  }

  async list(
    tenantId: string,
    filter: CustomerFilter,
    ctx?: TransactionContext
  ): Promise<{ data: Customer[]; total: number }> {
    const client = this.getClient(ctx);
    
    const conditions: string[] = ['tenant_id = $1'];
    const values: unknown[] = [tenantId];
    let paramIndex = 2;

    if (filter.status) {
      if (Array.isArray(filter.status)) {
        conditions.push(`status = ANY($${paramIndex})`);
        values.push(filter.status);
      } else {
        conditions.push(`status = $${paramIndex}`);
        values.push(filter.status);
      }
      paramIndex++;
    }

    if (filter.customerCategory) {
      conditions.push(`customer_category = $${paramIndex}`);
      values.push(filter.customerCategory);
      paramIndex++;
    }

    if (filter.riskLevel) {
      conditions.push(`risk_level = $${paramIndex}`);
      values.push(filter.riskLevel);
      paramIndex++;
    }

    if (filter.collectionStatus) {
      conditions.push(`collection_status = $${paramIndex}`);
      values.push(filter.collectionStatus);
      paramIndex++;
    }

    if (filter.search) {
      conditions.push(`(
        legal_name ILIKE $${paramIndex} OR 
        display_name ILIKE $${paramIndex} OR 
        customer_code ILIKE $${paramIndex} OR
        tax_id ILIKE $${paramIndex}
      )`);
      values.push(`%${filter.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const limit = filter.limit ?? 50;
    const offset = filter.offset ?? 0;

    // Query with window function for total count
    const sql = `
      SELECT *, COUNT(*) OVER() as total_count
      FROM ar.customers
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    values.push(limit, offset);

    const result = await client.query(sql, values);
    
    const data = result.rows.map(mapCustomerRow);
    const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;

    return { data, total };
  }

  async existsByTaxId(
    taxId: string,
    tenantId: string,
    excludeId?: string,
    ctx?: TransactionContext
  ): Promise<boolean> {
    const client = this.getClient(ctx);
    const result = await client.query(SQL.EXISTS_BY_TAX_ID, [taxId, tenantId, excludeId ?? null]);
    return result.rows.length > 0;
  }

  // ---------------------------------------------------------------------------
  // Addresses
  // ---------------------------------------------------------------------------

  async createAddress(
    data: CreateAddressData,
    ctx?: TransactionContext
  ): Promise<CustomerAddress> {
    const client = this.getClient(ctx);
    const result = await client.query(SQL.INSERT_ADDRESS, [
      data.customerId,
      data.tenantId,
      data.addressType,
      data.addressLine1,
      data.addressLine2 ?? null,
      data.city,
      data.stateProvince ?? null,
      data.postalCode ?? null,
      data.country,
      data.isPrimary ?? false,
    ]);
    return mapAddressRow(result.rows[0]);
  }

  async getAddresses(
    customerId: string,
    tenantId: string,
    ctx?: TransactionContext
  ): Promise<CustomerAddress[]> {
    const client = this.getClient(ctx);
    const result = await client.query(SQL.SELECT_ADDRESSES, [customerId, tenantId]);
    return result.rows.map(mapAddressRow);
  }

  async updateAddress(
    id: string,
    tenantId: string,
    data: Partial<CreateAddressData>,
    expectedVersion: number,
    ctx?: TransactionContext
  ): Promise<CustomerAddress | null> {
    const client = this.getClient(ctx);
    
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const fieldMappings: Record<string, string> = {
      addressType: 'address_type',
      addressLine1: 'address_line_1',
      addressLine2: 'address_line_2',
      city: 'city',
      stateProvince: 'state_province',
      postalCode: 'postal_code',
      country: 'country',
      isPrimary: 'is_primary',
    };

    for (const [key, column] of Object.entries(fieldMappings)) {
      if (data[key as keyof CreateAddressData] !== undefined) {
        setClauses.push(`${column} = $${paramIndex}`);
        values.push(data[key as keyof CreateAddressData]);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return null;
    }

    setClauses.push(`version = version + 1`);
    setClauses.push(`updated_at = NOW()`);

    const sql = `
      UPDATE ar.customer_addresses
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1} AND version = $${paramIndex + 2}
      RETURNING *
    `;
    values.push(id, tenantId, expectedVersion);

    const result = await client.query(sql, values);
    return result.rows.length > 0 ? mapAddressRow(result.rows[0]) : null;
  }

  async deleteAddress(
    id: string,
    tenantId: string,
    ctx?: TransactionContext
  ): Promise<boolean> {
    const client = this.getClient(ctx);
    const result = await client.query(
      `DELETE FROM ar.customer_addresses WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  // ---------------------------------------------------------------------------
  // Contacts
  // ---------------------------------------------------------------------------

  async createContact(
    data: CreateContactData,
    ctx?: TransactionContext
  ): Promise<CustomerContact> {
    const client = this.getClient(ctx);
    const result = await client.query(SQL.INSERT_CONTACT, [
      data.customerId,
      data.tenantId,
      data.contactType,
      data.firstName,
      data.lastName,
      data.email ?? null,
      data.phone ?? null,
      data.title ?? null,
      data.isPrimary ?? false,
      data.receivesInvoices ?? false,
      data.receivesStatements ?? false,
    ]);
    return mapContactRow(result.rows[0]);
  }

  async getContacts(
    customerId: string,
    tenantId: string,
    ctx?: TransactionContext
  ): Promise<CustomerContact[]> {
    const client = this.getClient(ctx);
    const result = await client.query(SQL.SELECT_CONTACTS, [customerId, tenantId]);
    return result.rows.map(mapContactRow);
  }

  async updateContact(
    id: string,
    tenantId: string,
    data: Partial<CreateContactData>,
    expectedVersion: number,
    ctx?: TransactionContext
  ): Promise<CustomerContact | null> {
    const client = this.getClient(ctx);
    
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const fieldMappings: Record<string, string> = {
      contactType: 'contact_type',
      firstName: 'first_name',
      lastName: 'last_name',
      email: 'email',
      phone: 'phone',
      title: 'title',
      isPrimary: 'is_primary',
      receivesInvoices: 'receives_invoices',
      receivesStatements: 'receives_statements',
    };

    for (const [key, column] of Object.entries(fieldMappings)) {
      if (data[key as keyof CreateContactData] !== undefined) {
        setClauses.push(`${column} = $${paramIndex}`);
        values.push(data[key as keyof CreateContactData]);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return null;
    }

    setClauses.push(`version = version + 1`);
    setClauses.push(`updated_at = NOW()`);

    const sql = `
      UPDATE ar.customer_contacts
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1} AND version = $${paramIndex + 2}
      RETURNING *
    `;
    values.push(id, tenantId, expectedVersion);

    const result = await client.query(sql, values);
    return result.rows.length > 0 ? mapContactRow(result.rows[0]) : null;
  }

  async deleteContact(
    id: string,
    tenantId: string,
    ctx?: TransactionContext
  ): Promise<boolean> {
    const client = this.getClient(ctx);
    const result = await client.query(
      `DELETE FROM ar.customer_contacts WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  // ---------------------------------------------------------------------------
  // Credit History
  // ---------------------------------------------------------------------------

  async createCreditHistory(
    data: CreateCreditHistoryData,
    ctx?: TransactionContext
  ): Promise<CustomerCreditHistory> {
    const client = this.getClient(ctx);
    const result = await client.query(SQL.INSERT_CREDIT_HISTORY, [
      data.customerId,
      data.tenantId,
      data.oldCreditLimit ?? null,
      data.newCreditLimit,
      data.changeReason,
      data.changeRequestStatus ?? null,
      data.changeRequestedBy ?? null,
      data.createdBy,
    ]);
    return mapCreditHistoryRow(result.rows[0]);
  }

  async getCreditHistory(
    customerId: string,
    tenantId: string,
    ctx?: TransactionContext
  ): Promise<CustomerCreditHistory[]> {
    const client = this.getClient(ctx);
    const result = await client.query(SQL.SELECT_CREDIT_HISTORY, [customerId, tenantId]);
    return result.rows.map(mapCreditHistoryRow);
  }

  async getPendingCreditChangeRequest(
    customerId: string,
    tenantId: string,
    ctx?: TransactionContext
  ): Promise<CustomerCreditHistory | null> {
    const client = this.getClient(ctx);
    const result = await client.query(SQL.SELECT_PENDING_CREDIT_CHANGE, [customerId, tenantId]);
    return result.rows.length > 0 ? mapCreditHistoryRow(result.rows[0]) : null;
  }

  async approveCreditChangeRequest(
    id: string,
    tenantId: string,
    approvedBy: string,
    expectedVersion: number,
    ctx?: TransactionContext
  ): Promise<CustomerCreditHistory | null> {
    const client = this.getClient(ctx);
    const result = await client.query(SQL.APPROVE_CREDIT_CHANGE, [
      approvedBy, id, tenantId, expectedVersion,
    ]);
    return result.rows.length > 0 ? mapCreditHistoryRow(result.rows[0]) : null;
  }

  async rejectCreditChangeRequest(
    id: string,
    tenantId: string,
    rejectedBy: string,
    expectedVersion: number,
    ctx?: TransactionContext
  ): Promise<CustomerCreditHistory | null> {
    const client = this.getClient(ctx);
    const result = await client.query(SQL.REJECT_CREDIT_CHANGE, [
      rejectedBy, id, tenantId, expectedVersion,
    ]);
    return result.rows.length > 0 ? mapCreditHistoryRow(result.rows[0]) : null;
  }

  // ---------------------------------------------------------------------------
  // Transaction Support
  // ---------------------------------------------------------------------------

  async beginTransaction(): Promise<TransactionContext> {
    const client = await this.pool.connect();
    await client.query('BEGIN');
    return { client };
  }

  async commitTransaction(ctx: TransactionContext): Promise<void> {
    const client = ctx.client as PoolClient;
    await client.query('COMMIT');
    client.release();
  }

  async rollbackTransaction(ctx: TransactionContext): Promise<void> {
    const client = ctx.client as PoolClient;
    await client.query('ROLLBACK');
    client.release();
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createSqlCustomerAdapter(pool: Pool): SqlCustomerAdapter {
  return new SqlCustomerAdapter(pool);
}
