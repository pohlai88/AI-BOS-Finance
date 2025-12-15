// metadata-studio/services/mapping.service.ts

/**
 * Mapping Service
 * 
 * Implements GRCD Section 2.3 Mandatory Services:
 * - metadata.mappings.lookup(local_field) → canonical mapping
 * - metadata.mappings.suggest(local_fields[]) → suggested mappings
 * 
 * This service resolves local field names (aliases, business terms) to
 * canonical metadata concepts with context-aware confidence scoring.
 */

import { db } from '../db/client';
import { mdmAlias, type ContextDomain, type AliasStrength, isAliasAllowed, getAliasWarning } from '../db/schema/alias.tables';
import { mdmGlobalMetadata } from '../db/schema/metadata.tables';
import { eq, and, ilike, or } from 'drizzle-orm';
import { snakeToCamel, snakeToPascal, snakeToKebab, camelToSnake, pascalToSnake, kebabToSnake } from '../naming/case-helpers';

// ============================================================================
// Types
// ============================================================================

export interface MappingResult {
  localFieldName: string;
  canonicalKey: string | null;
  confidence: number;  // 0-100
  matchType: 'exact_alias' | 'case_variant' | 'fuzzy' | 'not_found';
  strength?: AliasStrength;
  warning?: string;
  metadata?: {
    id: string;
    label: string;
    domain: string;
    module: string;
    tier: string;
  } | null;
}

export interface SuggestedMapping {
  localFieldName: string;
  suggestions: Array<{
    canonicalKey: string;
    confidence: number;
    matchReason: string;
    metadata?: {
      id: string;
      label: string;
      domain: string;
      module: string;
      tier: string;
    };
  }>;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Lookup a single local field name and find its canonical mapping.
 * 
 * GRCD Service: metadata.mappings.lookup(local_field)
 * 
 * Resolution Order:
 * 1. Exact alias match in mdm_alias
 * 2. Case-variant match (camelCase, PascalCase, kebab-case → snake_case)
 * 3. Direct canonical_key match in mdm_global_metadata
 * 
 * @param localFieldName - The local field name to resolve (e.g., "customerName", "Sales")
 * @param contextDomain - The business context (FINANCIAL_REPORTING, OPERATIONS, etc.)
 * @param tenantId - Tenant ID for multi-tenant isolation
 * @returns MappingResult with canonical key and confidence
 */
export async function lookupMapping(
  localFieldName: string,
  contextDomain: ContextDomain,
  tenantId: string,
): Promise<MappingResult> {
  const normalizedInput = localFieldName.trim();
  
  // 1. Try exact alias match
  const aliasMatch = await findAliasByText(normalizedInput, contextDomain);
  if (aliasMatch) {
    const metadata = await getMetadataForCanonicalKey(aliasMatch.canonicalKey, tenantId);
    return {
      localFieldName,
      canonicalKey: aliasMatch.canonicalKey,
      confidence: aliasMatch.strength === 'PRIMARY_LABEL' ? 100 : 90,
      matchType: 'exact_alias',
      strength: aliasMatch.strength,
      warning: getAliasWarning(normalizedInput, aliasMatch.strength, contextDomain, aliasMatch.canonicalKey) ?? undefined,
      metadata,
    };
  }
  
  // 2. Try case-variant conversion
  const snakeVariant = normalizeToSnakeCase(normalizedInput);
  if (snakeVariant !== normalizedInput.toLowerCase()) {
    const conceptMatch = await findConceptByCanonicalKey(snakeVariant, tenantId);
    if (conceptMatch) {
      return {
        localFieldName,
        canonicalKey: snakeVariant,
        confidence: 95,
        matchType: 'case_variant',
        metadata: {
          id: conceptMatch.id,
          label: conceptMatch.label,
          domain: conceptMatch.domain,
          module: conceptMatch.module,
          tier: conceptMatch.tier,
        },
      };
    }
  }
  
  // 3. Try direct canonical_key match
  const directMatch = await findConceptByCanonicalKey(normalizedInput, tenantId);
  if (directMatch) {
    return {
      localFieldName,
      canonicalKey: directMatch.canonicalKey,
      confidence: 100,
      matchType: 'exact_alias',  // Direct match is essentially exact
      metadata: {
        id: directMatch.id,
        label: directMatch.label,
        domain: directMatch.domain,
        module: directMatch.module,
        tier: directMatch.tier,
      },
    };
  }
  
  // 4. Not found
  return {
    localFieldName,
    canonicalKey: null,
    confidence: 0,
    matchType: 'not_found',
    metadata: null,
  };
}

/**
 * Suggest mappings for multiple local field names.
 * 
 * GRCD Service: metadata.mappings.suggest(local_fields[])
 * 
 * Returns up to 3 suggestions per field, ranked by confidence.
 * Uses fuzzy matching for fields without exact matches.
 * 
 * @param localFieldNames - Array of local field names to resolve
 * @param contextDomain - The business context
 * @param tenantId - Tenant ID
 * @returns Array of suggestions with confidence scores
 */
export async function suggestMappings(
  localFieldNames: string[],
  contextDomain: ContextDomain,
  tenantId: string,
): Promise<SuggestedMapping[]> {
  const results: SuggestedMapping[] = [];
  
  for (const localFieldName of localFieldNames) {
    const suggestions: SuggestedMapping['suggestions'] = [];
    const normalizedInput = localFieldName.trim().toLowerCase();
    
    // 1. Try exact alias matches (may return multiple for different canonical keys)
    const aliasMatches = await findAliasesByTextFuzzy(normalizedInput, contextDomain);
    for (const alias of aliasMatches) {
      if (isAliasAllowed(alias.strength)) {
        const metadata = await getMetadataForCanonicalKey(alias.canonicalKey, tenantId);
        if (metadata) {
          suggestions.push({
            canonicalKey: alias.canonicalKey,
            confidence: alias.strength === 'PRIMARY_LABEL' ? 95 : 80,
            matchReason: `Alias match: "${alias.aliasText}" → ${alias.canonicalKey}`,
            metadata,
          });
        }
      }
    }
    
    // 2. Try case-variant conversion
    const snakeVariant = normalizeToSnakeCase(localFieldName);
    const conceptMatch = await findConceptByCanonicalKey(snakeVariant, tenantId);
    if (conceptMatch) {
      const alreadyHas = suggestions.some(s => s.canonicalKey === snakeVariant);
      if (!alreadyHas) {
        suggestions.push({
          canonicalKey: snakeVariant,
          confidence: 90,
          matchReason: `Case conversion: ${localFieldName} → ${snakeVariant}`,
          metadata: {
            id: conceptMatch.id,
            label: conceptMatch.label,
            domain: conceptMatch.domain,
            module: conceptMatch.module,
            tier: conceptMatch.tier,
          },
        });
      }
    }
    
    // 3. Fuzzy match on canonical_key patterns
    const fuzzyMatches = await findConceptsFuzzy(normalizedInput, tenantId, 3);
    for (const concept of fuzzyMatches) {
      const alreadyHas = suggestions.some(s => s.canonicalKey === concept.canonicalKey);
      if (!alreadyHas) {
        suggestions.push({
          canonicalKey: concept.canonicalKey,
          confidence: 60,
          matchReason: `Fuzzy match: "${localFieldName}" ~ "${concept.label}"`,
          metadata: {
            id: concept.id,
            label: concept.label,
            domain: concept.domain,
            module: concept.module,
            tier: concept.tier,
          },
        });
      }
    }
    
    // Sort by confidence and take top 3
    suggestions.sort((a, b) => b.confidence - a.confidence);
    
    results.push({
      localFieldName,
      suggestions: suggestions.slice(0, 3),
    });
  }
  
  return results;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize various case styles to snake_case
 */
function normalizeToSnakeCase(input: string): string {
  const trimmed = input.trim();
  
  // Already snake_case?
  if (/^[a-z][a-z0-9]*(_[a-z0-9]+)*$/.test(trimmed)) {
    return trimmed;
  }
  
  // Try camelCase → snake_case
  if (/^[a-z][a-zA-Z0-9]*$/.test(trimmed)) {
    return camelToSnake(trimmed);
  }
  
  // Try PascalCase → snake_case
  if (/^[A-Z][a-zA-Z0-9]*$/.test(trimmed)) {
    return pascalToSnake(trimmed);
  }
  
  // Try kebab-case → snake_case
  if (/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(trimmed)) {
    return kebabToSnake(trimmed);
  }
  
  // Fallback: replace common separators with underscore and lowercase
  return trimmed
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
}

/**
 * Find alias by exact text match
 */
async function findAliasByText(
  aliasText: string,
  contextDomain: ContextDomain,
): Promise<{ canonicalKey: string; strength: AliasStrength } | null> {
  const [alias] = await db
    .select({
      canonicalKey: mdmAlias.canonicalKey,
      strength: mdmAlias.strength,
    })
    .from(mdmAlias)
    .where(
      and(
        ilike(mdmAlias.aliasText, aliasText),
        eq(mdmAlias.contextDomain, contextDomain),
        eq(mdmAlias.isActive, true),
      ),
    )
    .limit(1);
  
  return alias ? { canonicalKey: alias.canonicalKey, strength: alias.strength as AliasStrength } : null;
}

/**
 * Find aliases by fuzzy text match
 */
async function findAliasesByTextFuzzy(
  aliasText: string,
  contextDomain: ContextDomain,
): Promise<Array<{ aliasText: string; canonicalKey: string; strength: AliasStrength }>> {
  const aliases = await db
    .select({
      aliasText: mdmAlias.aliasText,
      canonicalKey: mdmAlias.canonicalKey,
      strength: mdmAlias.strength,
    })
    .from(mdmAlias)
    .where(
      and(
        or(
          ilike(mdmAlias.aliasText, aliasText),
          ilike(mdmAlias.aliasText, `%${aliasText}%`),
        ),
        eq(mdmAlias.contextDomain, contextDomain),
        eq(mdmAlias.isActive, true),
      ),
    )
    .limit(5);
  
  return aliases.map(a => ({
    aliasText: a.aliasText,
    canonicalKey: a.canonicalKey,
    strength: a.strength as AliasStrength,
  }));
}

/**
 * Find concept by canonical_key
 */
async function findConceptByCanonicalKey(
  canonicalKey: string,
  tenantId: string,
): Promise<{
  id: string;
  canonicalKey: string;
  label: string;
  domain: string;
  module: string;
  tier: string;
} | null> {
  const [concept] = await db
    .select({
      id: mdmGlobalMetadata.id,
      canonicalKey: mdmGlobalMetadata.canonicalKey,
      label: mdmGlobalMetadata.label,
      domain: mdmGlobalMetadata.domain,
      module: mdmGlobalMetadata.module,
      tier: mdmGlobalMetadata.tier,
    })
    .from(mdmGlobalMetadata)
    .where(
      and(
        eq(mdmGlobalMetadata.canonicalKey, canonicalKey),
        eq(mdmGlobalMetadata.tenantId, tenantId),
        eq(mdmGlobalMetadata.status, 'active'),
      ),
    )
    .limit(1);
  
  return concept ?? null;
}

/**
 * Find concepts by fuzzy match on canonical_key or label
 */
async function findConceptsFuzzy(
  searchTerm: string,
  tenantId: string,
  limit: number = 3,
): Promise<Array<{
  id: string;
  canonicalKey: string;
  label: string;
  domain: string;
  module: string;
  tier: string;
}>> {
  const concepts = await db
    .select({
      id: mdmGlobalMetadata.id,
      canonicalKey: mdmGlobalMetadata.canonicalKey,
      label: mdmGlobalMetadata.label,
      domain: mdmGlobalMetadata.domain,
      module: mdmGlobalMetadata.module,
      tier: mdmGlobalMetadata.tier,
    })
    .from(mdmGlobalMetadata)
    .where(
      and(
        eq(mdmGlobalMetadata.tenantId, tenantId),
        eq(mdmGlobalMetadata.status, 'active'),
        or(
          ilike(mdmGlobalMetadata.canonicalKey, `%${searchTerm}%`),
          ilike(mdmGlobalMetadata.label, `%${searchTerm}%`),
        ),
      ),
    )
    .limit(limit);
  
  return concepts;
}

/**
 * Get metadata for a canonical key
 */
async function getMetadataForCanonicalKey(
  canonicalKey: string,
  tenantId: string,
): Promise<MappingResult['metadata']> {
  const concept = await findConceptByCanonicalKey(canonicalKey, tenantId);
  return concept ? {
    id: concept.id,
    label: concept.label,
    domain: concept.domain,
    module: concept.module,
    tier: concept.tier,
  } : null;
}

