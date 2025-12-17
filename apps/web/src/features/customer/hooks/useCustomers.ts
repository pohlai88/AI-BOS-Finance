/**
 * AR-01 Customer Master - React Query Hooks
 * 
 * Client-side data fetching with automatic caching and invalidation.
 * 
 * @module AR-01
 */

'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import type {
  CustomerResponse,
  CreateCustomerInput,
  UpdateCustomerInput,
  ListCustomersQuery,
  ApprovalInput,
  RejectionInput,
  SuspendInput,
  VersionInput,
  CreditLimitChangeRequestInput,
  CreditLimitChangeApprovalInput,
  AddressResponse,
  ContactResponse,
  CreditHistoryResponse,
  CreateAddressInput,
  CreateContactInput,
} from '../schemas';

// =============================================================================
// Query Keys (for cache management)
// =============================================================================

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filter: ListCustomersQuery) => [...customerKeys.lists(), filter] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  addresses: (customerId: string) => [...customerKeys.detail(customerId), 'addresses'] as const,
  contacts: (customerId: string) => [...customerKeys.detail(customerId), 'contacts'] as const,
  creditHistory: (customerId: string) => [...customerKeys.detail(customerId), 'creditHistory'] as const,
};

// =============================================================================
// API Client Functions
// =============================================================================

const API_BASE = '/api/ar/customers';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }
  
  return res.json();
}

// List customers
async function listCustomers(params: ListCustomersQuery): Promise<{
  data: CustomerResponse[];
  total: number;
}> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', String(params.status));
  if (params.customerCategory) searchParams.set('customerCategory', params.customerCategory);
  if (params.riskLevel) searchParams.set('riskLevel', params.riskLevel);
  if (params.collectionStatus) searchParams.set('collectionStatus', params.collectionStatus);
  if (params.search) searchParams.set('search', params.search);
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.offset) searchParams.set('offset', String(params.offset));
  
  return fetchJson(`${API_BASE}?${searchParams.toString()}`);
}

// Get single customer
async function getCustomer(id: string): Promise<CustomerResponse> {
  return fetchJson(`${API_BASE}/${id}`);
}

// Create customer
async function createCustomer(data: CreateCustomerInput): Promise<CustomerResponse> {
  return fetchJson(API_BASE, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Update customer
async function updateCustomer(id: string, data: UpdateCustomerInput): Promise<CustomerResponse> {
  return fetchJson(`${API_BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// State transitions
async function submitCustomer(id: string, data: VersionInput): Promise<CustomerResponse> {
  return fetchJson(`${API_BASE}/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async function approveCustomer(id: string, data: ApprovalInput): Promise<CustomerResponse> {
  return fetchJson(`${API_BASE}/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async function rejectCustomer(id: string, data: RejectionInput): Promise<CustomerResponse> {
  return fetchJson(`${API_BASE}/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async function suspendCustomer(id: string, data: SuspendInput): Promise<CustomerResponse> {
  return fetchJson(`${API_BASE}/${id}/suspend`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async function reactivateCustomer(id: string, data: VersionInput): Promise<CustomerResponse> {
  return fetchJson(`${API_BASE}/${id}/reactivate`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async function archiveCustomer(id: string, data: VersionInput): Promise<CustomerResponse> {
  return fetchJson(`${API_BASE}/${id}/archive`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Credit limit
async function requestCreditLimitChange(
  id: string,
  data: Omit<CreditLimitChangeRequestInput, 'version'> & { version: number }
): Promise<CreditHistoryResponse> {
  return fetchJson(`${API_BASE}/${id}/credit-limit/change-request`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async function approveCreditLimitChange(
  id: string,
  data: CreditLimitChangeApprovalInput
): Promise<CustomerResponse> {
  return fetchJson(`${API_BASE}/${id}/credit-limit/approve-change`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Addresses
async function getAddresses(customerId: string): Promise<AddressResponse[]> {
  return fetchJson(`${API_BASE}/${customerId}/addresses`);
}

async function addAddress(customerId: string, data: CreateAddressInput): Promise<AddressResponse> {
  return fetchJson(`${API_BASE}/${customerId}/addresses`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Contacts
async function getContacts(customerId: string): Promise<ContactResponse[]> {
  return fetchJson(`${API_BASE}/${customerId}/contacts`);
}

async function addContact(customerId: string, data: CreateContactInput): Promise<ContactResponse> {
  return fetchJson(`${API_BASE}/${customerId}/contacts`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Credit history
async function getCreditHistory(customerId: string): Promise<CreditHistoryResponse[]> {
  return fetchJson(`${API_BASE}/${customerId}/credit-history`);
}

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * List customers with filtering
 */
export function useCustomers(
  filter: ListCustomersQuery = {},
  options?: Omit<UseQueryOptions<{ data: CustomerResponse[]; total: number }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: customerKeys.list(filter),
    queryFn: () => listCustomers(filter),
    staleTime: 30_000, // 30 seconds
    ...options,
  });
}

/**
 * Get single customer by ID
 */
export function useCustomer(
  id: string,
  options?: Omit<UseQueryOptions<CustomerResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => getCustomer(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Get customer addresses
 */
export function useCustomerAddresses(
  customerId: string,
  options?: Omit<UseQueryOptions<AddressResponse[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: customerKeys.addresses(customerId),
    queryFn: () => getAddresses(customerId),
    enabled: !!customerId,
    ...options,
  });
}

/**
 * Get customer contacts
 */
export function useCustomerContacts(
  customerId: string,
  options?: Omit<UseQueryOptions<ContactResponse[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: customerKeys.contacts(customerId),
    queryFn: () => getContacts(customerId),
    enabled: !!customerId,
    ...options,
  });
}

/**
 * Get customer credit history
 */
export function useCustomerCreditHistory(
  customerId: string,
  options?: Omit<UseQueryOptions<CreditHistoryResponse[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: customerKeys.creditHistory(customerId),
    queryFn: () => getCreditHistory(customerId),
    enabled: !!customerId,
    ...options,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Create a new customer
 */
export function useCreateCustomer(
  options?: UseMutationOptions<CustomerResponse, Error, CreateCustomerInput>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
    ...options,
  });
}

/**
 * Update a customer (draft only)
 */
export function useUpdateCustomer(
  options?: UseMutationOptions<CustomerResponse, Error, { id: string; data: UpdateCustomerInput }>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => updateCustomer(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(customerKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
    ...options,
  });
}

/**
 * Submit customer for approval
 */
export function useSubmitCustomer(
  options?: UseMutationOptions<CustomerResponse, Error, { id: string; data: VersionInput }>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => submitCustomer(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(customerKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
    ...options,
  });
}

/**
 * Approve customer (SoD enforced)
 */
export function useApproveCustomer(
  options?: UseMutationOptions<CustomerResponse, Error, { id: string; data: ApprovalInput }>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => approveCustomer(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(customerKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
    ...options,
  });
}

/**
 * Reject customer (SoD enforced)
 */
export function useRejectCustomer(
  options?: UseMutationOptions<CustomerResponse, Error, { id: string; data: RejectionInput }>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => rejectCustomer(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(customerKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
    ...options,
  });
}

/**
 * Suspend customer (SoD enforced)
 */
export function useSuspendCustomer(
  options?: UseMutationOptions<CustomerResponse, Error, { id: string; data: SuspendInput }>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => suspendCustomer(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(customerKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
    ...options,
  });
}

/**
 * Reactivate suspended customer (SoD enforced)
 */
export function useReactivateCustomer(
  options?: UseMutationOptions<CustomerResponse, Error, { id: string; data: VersionInput }>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => reactivateCustomer(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(customerKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
    ...options,
  });
}

/**
 * Archive customer (terminal state)
 */
export function useArchiveCustomer(
  options?: UseMutationOptions<CustomerResponse, Error, { id: string; data: VersionInput }>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => archiveCustomer(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(customerKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
    ...options,
  });
}

/**
 * Request credit limit change
 */
export function useRequestCreditLimitChange(
  options?: UseMutationOptions<
    CreditHistoryResponse,
    Error,
    { id: string; data: CreditLimitChangeRequestInput }
  >
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => requestCreditLimitChange(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.creditHistory(variables.id) });
    },
    ...options,
  });
}

/**
 * Approve credit limit change (SoD enforced)
 */
export function useApproveCreditLimitChange(
  options?: UseMutationOptions<
    CustomerResponse,
    Error,
    { id: string; data: CreditLimitChangeApprovalInput }
  >
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => approveCreditLimitChange(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(customerKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: customerKeys.creditHistory(data.id) });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
    ...options,
  });
}

/**
 * Add customer address
 */
export function useAddCustomerAddress(
  options?: UseMutationOptions<
    AddressResponse,
    Error,
    { customerId: string; data: CreateAddressInput }
  >
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ customerId, data }) => addAddress(customerId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.addresses(variables.customerId) });
    },
    ...options,
  });
}

/**
 * Add customer contact
 */
export function useAddCustomerContact(
  options?: UseMutationOptions<
    ContactResponse,
    Error,
    { customerId: string; data: CreateContactInput }
  >
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ customerId, data }) => addContact(customerId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.contacts(variables.customerId) });
    },
    ...options,
  });
}
