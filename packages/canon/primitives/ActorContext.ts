/**
 * Actor Context
 * 
 * Represents the authenticated user/system performing an action.
 * Used for audit trails and access control.
 */

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * Actor types
 */
export type ActorType = 'user' | 'system' | 'service' | 'scheduler';

/**
 * Actor Context - Who is performing the action
 * 
 * Every mutation in the system must have an ActorContext.
 * This enables:
 * - Audit trail: Who did what, when
 * - Access control: Permission checks
 * - Tenant isolation: Data scoping
 */
export interface ActorContext {
  /** Unique identifier for the actor */
  userId: string;

  /** Type of actor */
  type: ActorType;

  /** Tenant identifier (multi-tenancy) */
  tenantId: string;

  /** Company identifier (within tenant) */
  companyId?: string;

  /** Actor's roles (for authorization) */
  roles: string[];

  /** Session identifier (for tracing) */
  sessionId?: string;

  /** IP address (for security) */
  ipAddress?: string;

  /** User agent (for security) */
  userAgent?: string;

  /** Display name (for UI/audit) */
  displayName?: string;

  /** Email address */
  email?: string;
}

// ============================================================================
// 2. FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a user actor context
 */
export function createUserActor(params: {
  userId: string;
  tenantId: string;
  roles: string[];
  companyId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  displayName?: string;
  email?: string;
}): ActorContext {
  return {
    userId: params.userId,
    type: 'user',
    tenantId: params.tenantId,
    companyId: params.companyId,
    roles: params.roles,
    sessionId: params.sessionId,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    displayName: params.displayName,
    email: params.email,
  };
}

/**
 * Create a system actor context (for automated processes)
 */
export function createSystemActor(params: {
  tenantId: string;
  serviceName: string;
  companyId?: string;
}): ActorContext {
  return {
    userId: `system:${params.serviceName}`,
    type: 'system',
    tenantId: params.tenantId,
    companyId: params.companyId,
    roles: ['ROLE_SYSTEM'],
    displayName: `System (${params.serviceName})`,
  };
}

/**
 * Create a service actor context (for service-to-service calls)
 */
export function createServiceActor(params: {
  tenantId: string;
  serviceName: string;
  companyId?: string;
}): ActorContext {
  return {
    userId: `service:${params.serviceName}`,
    type: 'service',
    tenantId: params.tenantId,
    companyId: params.companyId,
    roles: ['ROLE_SERVICE'],
    displayName: `Service (${params.serviceName})`,
  };
}

/**
 * Create a scheduler actor context (for scheduled jobs)
 */
export function createSchedulerActor(params: {
  tenantId: string;
  jobName: string;
  companyId?: string;
}): ActorContext {
  return {
    userId: `scheduler:${params.jobName}`,
    type: 'scheduler',
    tenantId: params.tenantId,
    companyId: params.companyId,
    roles: ['ROLE_SCHEDULER'],
    displayName: `Scheduler (${params.jobName})`,
  };
}

// ============================================================================
// 3. VALIDATION
// ============================================================================

/**
 * Check if an actor has a specific role
 */
export function actorHasRole(actor: ActorContext, role: string): boolean {
  return actor.roles.includes(role);
}

/**
 * Check if an actor has any of the specified roles
 */
export function actorHasAnyRole(actor: ActorContext, roles: string[]): boolean {
  return roles.some((role) => actor.roles.includes(role));
}

/**
 * Check if an actor has all of the specified roles
 */
export function actorHasAllRoles(actor: ActorContext, roles: string[]): boolean {
  return roles.every((role) => actor.roles.includes(role));
}

/**
 * Check if actor is a system/service/scheduler (not a human user)
 */
export function isAutomatedActor(actor: ActorContext): boolean {
  return ['system', 'service', 'scheduler'].includes(actor.type);
}

/**
 * Check if actor is a human user
 */
export function isHumanActor(actor: ActorContext): boolean {
  return actor.type === 'user';
}

// ============================================================================
// 4. EXPORTS
// ============================================================================

export default ActorContext;
