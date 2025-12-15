// metadata-studio/naming/name-resolver.ts

/**
 * Name Resolver
 * 
 * Central system for resolving naming variants across different contexts.
 * 
 * SSOT Rule: canonical_key in mdm_global_metadata is ALWAYS snake_case.
 * All other variants (camelCase, PascalCase, etc.) are generated from this SSOT.
 * 
 * Usage:
 * ```ts
 * const tsName = await resolveNameForConcept({
 *   canonicalKey: "receipt_outstanding_amount",
 *   context: "typescript",
 * }); // Returns: "receiptOutstandingAmount"
 * 
 * const apiPath = await resolveNameForConcept({
 *   canonicalKey: "receipt_outstanding_amount",
 *   context: "api_path",
 * }); // Returns: "receipt-outstanding-amount"
 * ```
 */

import { db } from '../db/client';
import { mdmGlobalMetadata } from '../db/schema/metadata.tables';
import { mdmNamingVariant } from '../db/schema/naming-variant.tables';
import type { NamingContext, NamingStyle } from '../db/schema/naming-variant.tables';
import { DEFAULT_STYLE_BY_CONTEXT } from '../db/schema/naming-variant.tables';
import { eq, and } from 'drizzle-orm';
import {
  snakeToCamel,
  snakeToPascal,
  snakeToUpperSnake,
  snakeToKebab,
  isValidSnakeCase,
} from './case-helpers';

/**
 * Generate a naming variant from snake_case canonical_key
 */
function generateVariantFromSnake(
  snake: string,
  style: NamingStyle,
): string {
  switch (style) {
    case 'snake_case':
      return snake;
    case 'camelCase':
      return snakeToCamel(snake);
    case 'PascalCase':
      return snakeToPascal(snake);
    case 'UPPER_SNAKE':
      return snakeToUpperSnake(snake);
    case 'kebab-case':
      return snakeToKebab(snake);
  }
}

/**
 * Resolve a name for a concept in a specific context.
 * 
 * Process:
 * 1. Validates canonical_key is snake_case
 * 2. Finds the concept in mdm_global_metadata
 * 3. Tries to read existing variant from mdm_naming_variant
 * 4. If not found, generates variant from canonical_key
 * 5. Optionally persists generated variant for future reuse
 * 
 * @param options Configuration for name resolution
 * @returns The resolved name variant
 * @throws Error if canonical_key is not snake_case or concept not found
 */
export async function resolveNameForConcept(options: {
  canonicalKey: string;
  context: NamingContext;
  styleOverride?: NamingStyle;
  persistIfMissing?: boolean; // if true, insert generated variant into mdm_naming_variant
  tenantId: string; // Required for multi-tenant lookups
}): Promise<string> {
  const {
    canonicalKey,
    context,
    styleOverride,
    persistIfMissing = false,
    tenantId,
  } = options;

  // Validate SSOT rule: canonical_key MUST be snake_case
  if (!isValidSnakeCase(canonicalKey)) {
    throw new Error(
      `canonical_key "${canonicalKey}" is not valid snake_case. SSOT requires snake_case canonical keys.`,
    );
  }

  // 1. Find the concept by canonical_key
  const [concept] = await db
    .select({
      id: mdmGlobalMetadata.id,
      canonicalKey: mdmGlobalMetadata.canonicalKey,
    })
    .from(mdmGlobalMetadata)
    .where(
      and(
        eq(mdmGlobalMetadata.canonicalKey, canonicalKey),
        eq(mdmGlobalMetadata.tenantId, tenantId),
      ),
    )
    .limit(1);

  if (!concept) {
    throw new Error(
      `Concept not found for canonical_key="${canonicalKey}" in tenant "${tenantId}". SSOT must exist first in mdm_global_metadata.`,
    );
  }

  const style = styleOverride ?? DEFAULT_STYLE_BY_CONTEXT[context];

  // 2. Try to get an explicit variant from DB
  const [variant] = await db
    .select()
    .from(mdmNamingVariant)
    .where(
      and(
        eq(mdmNamingVariant.conceptId, concept.id),
        eq(mdmNamingVariant.context, context),
        eq(mdmNamingVariant.style, style),
      ),
    )
    .limit(1);

  if (variant) {
    return variant.value;
  }

  // 3. Fallback: generate from canonicalKey (snake_case → style)
  const generated = generateVariantFromSnake(concept.canonicalKey, style);

  // 4. Optionally persist the generated variant so it becomes part of metadata
  if (persistIfMissing) {
    try {
      await db.insert(mdmNamingVariant).values({
        conceptId: concept.id,
        context,
        style,
        value: generated,
        isPrimary: true,
      });
    } catch (error) {
      // Ignore unique constraint violations (race condition)
      // Another process may have inserted it
      console.warn(
        `Failed to persist naming variant for ${canonicalKey} (${context}, ${style}):`,
        error,
      );
    }
  }

  return generated;
}

/**
 * Batch resolve multiple concepts at once (more efficient)
 * 
 * @param options Configuration for batch resolution
 * @returns Map of canonical_key → resolved name
 */
export async function batchResolveNames(options: {
  canonicalKeys: string[];
  context: NamingContext;
  tenantId: string;
  persistIfMissing?: boolean;
}): Promise<Map<string, string>> {
  const { canonicalKeys, context, tenantId, persistIfMissing = false } = options;
  const results = new Map<string, string>();

  // Resolve all in parallel
  await Promise.all(
    canonicalKeys.map(async (canonicalKey) => {
      try {
        const resolved = await resolveNameForConcept({
          canonicalKey,
          context,
          tenantId,
          persistIfMissing,
        });
        results.set(canonicalKey, resolved);
      } catch (error) {
        console.error(
          `Failed to resolve ${canonicalKey} for context ${context}:`,
          error,
        );
        // Still add to results with fallback
        results.set(canonicalKey, canonicalKey);
      }
    }),
  );

  return results;
}

/**
 * Pre-generate all standard variants for a concept
 * Useful when creating new metadata to populate all common contexts
 * 
 * @param canonicalKey The snake_case canonical key
 * @param conceptId The UUID of the concept
 * @returns Number of variants created
 */
export async function preGenerateStandardVariants(
  canonicalKey: string,
  conceptId: string,
): Promise<number> {
  if (!isValidSnakeCase(canonicalKey)) {
    throw new Error(
      `canonical_key "${canonicalKey}" is not valid snake_case.`,
    );
  }

  const contexts: NamingContext[] = [
    'db',
    'typescript',
    'graphql',
    'api_path',
    'const',
  ];

  let created = 0;

  for (const context of contexts) {
    const style = DEFAULT_STYLE_BY_CONTEXT[context];
    const value = generateVariantFromSnake(canonicalKey, style);

    try {
      await db.insert(mdmNamingVariant).values({
        conceptId,
        context,
        style,
        value,
        isPrimary: true,
      });
      created++;
    } catch (error) {
      // Ignore duplicates
      console.debug(
        `Variant already exists for ${canonicalKey} (${context}, ${style})`,
      );
    }
  }

  return created;
}

