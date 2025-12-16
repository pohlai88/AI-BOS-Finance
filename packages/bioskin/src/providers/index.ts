/**
 * BioSkin Providers - Context providers for cross-cutting concerns
 *
 * Sprint E3: Enterprise i18n Foundation
 */

export {
  BioLocaleProvider,
  useLocale,
  type BioLocaleConfig,
  type BioLocaleContextValue,
  type BioLocaleProviderProps,
  COMPONENT_META as BIO_LOCALE_META,
} from './BioLocaleProvider';

// Governance / RBAC (Sprint E6)
export {
  BioPermissionProvider,
  usePermissions,
  type BioUser,
  type BioPermissionMap,
  type BioFieldRule,
  type BioFieldSecurityMap,
  type BioAuditEvent,
  type BioAuditCallback,
  type BioDocumentState,
  type BioStatePermission,
  type BioStatePermissionMap,
  type BioPermissionContextValue,
  type BioPermissionProviderProps,
  PERMISSION_COMPONENT_META,
} from './BioPermissionProvider';

export {
  withFieldSecurity,
  useFieldSecurity,
  SecuredField,
  ActionGate,
  RoleGate,
  StateGate,
  type FieldSecurityProps,
  type SecuredFieldProps,
  type SecuredFieldWrapperProps,
  type ActionGateProps,
  type RoleGateProps,
  type StateGateProps,
} from './withFieldSecurity';

export { useAudit, type AuditActions } from './useAudit';
