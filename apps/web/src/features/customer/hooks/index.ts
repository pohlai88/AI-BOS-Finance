/**
 * AR-01 Customer Master - Hook Exports
 */

export {
  // Query keys
  customerKeys,
  
  // Query hooks
  useCustomers,
  useCustomer,
  useCustomerAddresses,
  useCustomerContacts,
  useCustomerCreditHistory,
  
  // Mutation hooks
  useCreateCustomer,
  useUpdateCustomer,
  useSubmitCustomer,
  useApproveCustomer,
  useRejectCustomer,
  useSuspendCustomer,
  useReactivateCustomer,
  useArchiveCustomer,
  useRequestCreditLimitChange,
  useApproveCreditLimitChange,
  useAddCustomerAddress,
  useAddCustomerContact,
} from './useCustomers';
