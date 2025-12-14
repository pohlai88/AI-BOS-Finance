/**
 * @aibos/contracts - Schema-First Contract Definitions
 * 
 * This package is the Single Source of Truth (SSOT) for all API contracts.
 * Zod schemas define the shape; TypeScript types are inferred.
 * 
 * Anti-Gravity Rule: This package has NO dependencies on adapters or apps.
 */

// Kernel contracts
export * from './kernel/tenants.schema';
export * from './kernel/audit.schema';
export * from './kernel/registry.schema';
export * from './kernel/events.schema';
export * from './kernel/iam.schema';

// Shared contracts
export * from './shared/envelope.schema';

