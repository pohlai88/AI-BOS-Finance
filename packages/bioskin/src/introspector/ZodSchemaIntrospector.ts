/**
 * ZodSchemaIntrospector - RNA Layer of Bio Transform Self
 * 
 * Extracts field metadata from Zod schemas to enable schema-driven UI generation.
 * This is the "RNA" that translates "DNA" (Zod schemas) into UI atoms.
 * 
 * Compatible with Zod v4.
 * 
 * @see CONT_10 Section 3 - BioSkin Architecture
 */

import { z } from 'zod';

/**
 * Field definition extracted from Zod schema
 */
export interface BioFieldDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'array' | 'object';
  label: string;
  description?: string;
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
  uiHints?: {
    component?: string;
    placeholder?: string;
    readonly?: boolean;
  };
}

/**
 * Schema definition extracted from Zod schema
 */
export interface BioSchemaDefinition {
  name: string;
  description?: string;
  fields: BioFieldDefinition[];
}

/**
 * Convert camelCase or snake_case to Title Case with spaces
 */
function toLabel(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1') // camelCase
    .replace(/_/g, ' ') // snake_case
    .replace(/^\s+/, '') // trim leading space
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Type guard to check if a schema is optional
 */
function isOptional(schema: z.ZodTypeAny): boolean {
  // Check for ZodOptional, ZodNullable, ZodDefault by checking the type string
  const typeName = schema.constructor.name;
  return (
    typeName === 'ZodOptional' ||
    typeName === 'ZodNullable' ||
    typeName === 'ZodDefault' ||
    typeName === '$ZodOptional' ||
    typeName === '$ZodNullable' ||
    typeName === '$ZodDefault'
  );
}

/**
 * Get the inner type from optional/nullable wrappers
 */
function unwrapType(schema: z.ZodTypeAny): { inner: z.ZodTypeAny; required: boolean } {
  let current = schema;
  let required = true;

  // Unwrap optional/nullable/default wrappers
  while (isOptional(current)) {
    required = false;
    // Access the inner type - different methods for different wrapper types
    const inner = (current as unknown as { _def?: { innerType?: z.ZodTypeAny } })._def?.innerType;
    if (inner) {
      current = inner;
    } else {
      break;
    }
  }

  return { inner: current, required };
}

/**
 * Determine the field type from Zod schema
 */
function getFieldType(schema: z.ZodTypeAny): BioFieldDefinition['type'] {
  const { inner } = unwrapType(schema);
  const typeName = inner.constructor.name;

  // Handle both Zod v3 and v4 class names
  if (typeName.includes('String')) return 'string';
  if (typeName.includes('Number')) return 'number';
  if (typeName.includes('Boolean')) return 'boolean';
  if (typeName.includes('Date')) return 'date';
  if (typeName.includes('Enum') || typeName.includes('NativeEnum')) return 'enum';
  if (typeName.includes('Array')) return 'array';
  if (typeName.includes('Object')) return 'object';

  // Default to string for unknown types
  return 'string';
}

/**
 * Extract enum values from an enum schema
 */
function getEnumValues(schema: z.ZodTypeAny): string[] | undefined {
  const { inner } = unwrapType(schema);
  const typeName = inner.constructor.name;

  if (typeName.includes('Enum')) {
    // Try to access enum values from definition
    const def = (inner as unknown as { _def?: { values?: readonly string[] } })._def;
    if (def?.values) {
      return [...def.values];
    }
  }

  return undefined;
}

/**
 * Extract description from Zod schema
 */
function getDescription(schema: z.ZodTypeAny): string | undefined {
  // In Zod v4, description is accessed differently
  const def = (schema as unknown as { _def?: { description?: string } })._def;
  return def?.description;
}

/**
 * Introspect a single field from a Zod object schema
 */
function introspectField(name: string, schema: z.ZodTypeAny): BioFieldDefinition {
  const { required } = unwrapType(schema);
  const description = getDescription(schema);
  const fieldType = getFieldType(schema);
  const enumValues = fieldType === 'enum' ? getEnumValues(schema) : undefined;

  return {
    name,
    type: fieldType,
    label: toLabel(name),
    description,
    required,
    validation: enumValues ? { options: enumValues } : undefined,
  };
}

/**
 * Introspect a Zod object schema and extract field definitions
 * 
 * @param schema - A Zod object schema
 * @returns BioSchemaDefinition with field metadata
 * 
 * @example
 * const PaymentSchema = z.object({
 *   vendorName: z.string().describe('Vendor display name'),
 *   amount: z.number().positive(),
 *   status: z.enum(['draft', 'pending', 'approved']),
 * });
 * 
 * const definition = introspectZodSchema(PaymentSchema);
 * // Returns { name: 'Object', fields: [...] }
 */
export function introspectZodSchema<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
): BioSchemaDefinition {
  const fields: BioFieldDefinition[] = [];

  // In Zod v4, shape is a property, not a function
  const def = (schema as unknown as { _def?: { shape?: Record<string, z.ZodTypeAny>; description?: string } })._def;
  const shape = def?.shape || {};
  const description = def?.description;

  for (const [name, fieldSchema] of Object.entries(shape)) {
    fields.push(introspectField(name, fieldSchema as z.ZodTypeAny));
  }

  return {
    name: description || 'Object',
    description,
    fields,
  };
}

/**
 * Get the Zod schema for a specific field
 */
export function getFieldSchema<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  fieldName: keyof T
): z.ZodTypeAny | undefined {
  const def = (schema as unknown as { _def?: { shape?: Record<string, z.ZodTypeAny> } })._def;
  const shape = def?.shape || {};
  return shape[fieldName as string] as z.ZodTypeAny | undefined;
}

/**
 * Validate a single field value against its schema
 */
export function validateField<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  fieldName: keyof T,
  value: unknown
): { success: boolean; error?: string } {
  const fieldSchema = getFieldSchema(schema, fieldName);
  if (!fieldSchema) {
    return { success: false, error: `Unknown field: ${String(fieldName)}` };
  }

  const result = fieldSchema.safeParse(value);
  if (result.success) {
    return { success: true };
  }

  // In Zod v4, error issues are accessed via .issues
  const issues = (result.error as unknown as { issues?: Array<{ message: string }> })?.issues;
  return {
    success: false,
    error: issues?.[0]?.message || 'Validation failed',
  };
}
