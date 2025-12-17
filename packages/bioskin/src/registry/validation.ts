/**
 * @fileoverview BioRegistry Validation Schemas
 * 
 * Zod schemas for validating industry adapters at registration time.
 * Per CONT_12: Invalid adapters throw with helpful Zod errors.
 * 
 * @module @aibos/bioskin/registry
 * @version 1.0.0
 */

import { z } from 'zod';
import type { IndustryAdapter, AdapterCluster } from './types';

// ============================================================
// ADAPTER CLUSTER SCHEMA
// ============================================================

/**
 * Valid adapter cluster identifiers
 */
export const AdapterClusterSchema = z.enum([
  'agriops',
  'production',
  'outlet',
  'supplychain',
  'corporate',
]);

// ============================================================
// MODULE CONFIGURATION SCHEMA
// ============================================================

/**
 * Schema for module configuration
 */
export const ModuleConfigSchema = z.object({
  code: z.string().min(1, 'Module code is required'),
  name: z.string().min(1, 'Module name is required'),
  icon: z.any(), // LucideIcon - validated at runtime
  route: z.string().startsWith('/', 'Route must start with /'),
  capabilities: z.array(z.string()).optional(),
  parent: z.string().optional(),
});

// ============================================================
// QUICK ACTION SCHEMA
// ============================================================

/**
 * Schema for quick actions
 */
export const QuickActionSchema = z.object({
  id: z.string().min(1, 'Action ID is required'),
  label: z.string().min(1, 'Action label is required'),
  icon: z.any(), // LucideIcon
  route: z.string().optional(),
  handler: z.function().optional(),
  permissions: z.array(z.string()).optional(),
  shortcut: z.string().optional(),
}).refine(
  (data) => data.route !== undefined || data.handler !== undefined,
  { message: 'Quick action must have either route or handler' }
);

// ============================================================
// EMPTY STATE SCHEMA
// ============================================================

/**
 * Schema for empty state action
 */
export const EmptyStateActionSchema = z.object({
  label: z.string().min(1, 'Action label is required'),
  route: z.string().optional(),
  handler: z.function().optional(),
  variant: z.enum(['primary', 'secondary']).optional(),
});

/**
 * Schema for empty state configuration
 */
export const EmptyStateConfigSchema = z.object({
  icon: z.any(), // LucideIcon
  title: z.string().min(1, 'Empty state title is required'),
  description: z.string().min(1, 'Empty state description is required'),
  action: EmptyStateActionSchema,
  hints: z.array(z.string()).optional(),
  quickActions: z.array(QuickActionSchema).optional(),
  docsUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
});

// ============================================================
// COMMAND SCHEMA
// ============================================================

/**
 * Schema for command configuration
 */
export const CommandConfigSchema = z.object({
  id: z.string().min(1, 'Command ID is required'),
  label: z.string().min(1, 'Command label is required'),
  keywords: z.array(z.string()).optional(),
  module: z.string().min(1, 'Command module is required'),
  category: z.string().optional(),
  icon: z.any().optional(), // LucideIcon
  shortcut: z.string().optional(),
  route: z.string().optional(),
  handler: z.function().optional(),
  permissions: z.array(z.string()).optional(),
  priority: z.number().optional(),
});

/**
 * Schema for command category
 */
export const CommandCategorySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  order: z.number().optional(),
});

// ============================================================
// FILTER SCHEMA
// ============================================================

/**
 * Schema for filter operator
 */
export const FilterOperatorSchema = z.enum([
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
  'contains', 'startsWith', 'endsWith',
  'between', 'in', 'notIn', 'isNull', 'isNotNull',
]);

/**
 * Schema for filter definition
 */
export const FilterDefinitionSchema = z.object({
  field: z.string().min(1),
  operator: FilterOperatorSchema,
  value: z.unknown(),
  label: z.string().optional(),
});

/**
 * Schema for filter preset
 */
export const FilterPresetSchema = z.object({
  id: z.string().min(1, 'Preset ID is required'),
  name: z.string().min(1, 'Preset name is required'),
  filters: z.array(FilterDefinitionSchema).min(1, 'At least one filter required'),
  isDefault: z.boolean().optional(),
  isShared: z.boolean().optional(),
  icon: z.any().optional(), // LucideIcon
});

// ============================================================
// EXCEPTION SCHEMA
// ============================================================

/**
 * Schema for exception severity
 */
export const ExceptionSeveritySchema = z.enum(['critical', 'warning', 'info']);

/**
 * Schema for exception type configuration
 */
export const ExceptionTypeConfigSchema = z.object({
  code: z.string().min(1, 'Exception code is required'),
  label: z.string().min(1, 'Exception label is required'),
  severity: ExceptionSeveritySchema,
  module: z.string().min(1, 'Exception module is required'),
  resolution: z.string().optional(),
  docsUrl: z.string().url().optional(),
  autoResolveAfter: z.number().positive().optional(),
});

// ============================================================
// DESIGN TOKEN SCHEMA
// ============================================================

/**
 * Schema for design token overrides
 */
export const DesignTokenOverridesSchema = z.object({
  colors: z.object({
    primary: z.string().optional(),
    primaryHover: z.string().optional(),
    primaryLight: z.string().optional(),
    secondary: z.string().optional(),
  }).optional(),
  status: z.object({
    success: z.string().optional(),
    warning: z.string().optional(),
    danger: z.string().optional(),
    info: z.string().optional(),
  }).optional(),
}).optional();

// ============================================================
// INDUSTRY ADAPTER SCHEMA
// ============================================================

/**
 * Complete schema for industry adapter validation
 */
export const IndustryAdapterSchema = z.object({
  id: AdapterClusterSchema,
  name: z.string().min(1, 'Adapter name is required'),
  modules: z.array(ModuleConfigSchema).min(1, 'At least one module required'),
  emptyStates: z.record(z.string(), EmptyStateConfigSchema),
  commands: z.array(CommandConfigSchema),
  commandCategories: z.array(CommandCategorySchema).optional(),
  filterPresets: z.record(z.string(), z.array(FilterPresetSchema)),
  validationMessages: z.record(z.string(), z.string()).optional(),
  quickActions: z.record(z.string(), z.array(QuickActionSchema)).optional(),
  exceptionTypes: z.array(ExceptionTypeConfigSchema),
  tokens: DesignTokenOverridesSchema,
  version: z.string().optional(),
  description: z.string().optional(),
});

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

/**
 * Validation result with parsed adapter or errors
 */
export interface ValidationResult {
  success: boolean;
  data?: IndustryAdapter;
  errors?: z.ZodError;
}

/**
 * Validate an industry adapter
 * 
 * @param adapter - The adapter to validate
 * @returns Validation result with parsed data or errors
 * 
 * @example
 * ```typescript
 * const result = validateAdapter(myAdapter);
 * if (!result.success) {
 *   console.error(result.errors?.format());
 * }
 * ```
 */
export function validateAdapter(adapter: unknown): ValidationResult {
  const result = IndustryAdapterSchema.safeParse(adapter);

  if (result.success) {
    return {
      success: true,
      data: result.data as IndustryAdapter,
    };
  }

  return {
    success: false,
    errors: result.error,
  };
}

/**
 * Validate an adapter and throw on failure
 * 
 * @param adapter - The adapter to validate
 * @returns The validated adapter
 * @throws ZodError if validation fails
 * 
 * @example
 * ```typescript
 * try {
 *   const validAdapter = validateAdapterOrThrow(myAdapter);
 * } catch (error) {
 *   if (error instanceof z.ZodError) {
 *     console.error('Invalid adapter:', error.format());
 *   }
 * }
 * ```
 */
export function validateAdapterOrThrow(adapter: unknown): IndustryAdapter {
  return IndustryAdapterSchema.parse(adapter) as IndustryAdapter;
}

/**
 * Format validation errors for display
 * 
 * @param errors - Zod validation errors
 * @returns Formatted error messages
 */
export function formatValidationErrors(errors: z.ZodError): string[] {
  // Zod v4 uses .issues, v3 uses .errors - handle both
  const issues = errors.issues ?? (errors as unknown as { errors: z.ZodIssue[] }).errors ?? [];
  return issues.map((err) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
}
