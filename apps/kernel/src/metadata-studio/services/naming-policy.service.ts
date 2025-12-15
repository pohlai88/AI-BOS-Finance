// metadata-studio/services/naming-policy.service.ts

/**
 * Naming Policy Service
 * 
 * GRCD Phase 2: Naming Policy Enforcement
 * 
 * Validates names against configured policies before allowing
 * creation/update of metadata, ensuring SSOT naming consistency.
 */

import { db } from '../db/client';
import { mdmNamingPolicy, type NamingPolicyRules } from '../db/schema/naming-policy.tables';
import { eq, and, or, isNull } from 'drizzle-orm';

// ============================================================================
// Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  policyKey: string;
  enforcement: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

export interface NamingValidationReport {
  name: string;
  context: string;
  isValid: boolean;
  errors: ValidationResult[];
  warnings: ValidationResult[];
  infos: ValidationResult[];
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Validate a name against all applicable policies
 * 
 * @param name - The name to validate
 * @param context - What type of name (canonical_key, db_column, typescript, etc.)
 * @param domain - Optional domain filter
 * @param tenantId - Tenant ID
 * @returns Validation report with all policy checks
 */
export async function validateName(
  name: string,
  context: 'canonical_key' | 'db_column' | 'typescript' | 'api_path' | 'graphql' | 'const',
  domain: string | null,
  tenantId: string,
): Promise<NamingValidationReport> {
  // Get all applicable policies
  const policies = await db
    .select()
    .from(mdmNamingPolicy)
    .where(
      and(
        eq(mdmNamingPolicy.tenantId, tenantId),
        eq(mdmNamingPolicy.appliesTo, context),
        eq(mdmNamingPolicy.isActive, true),
        or(
          isNull(mdmNamingPolicy.domain),
          domain ? eq(mdmNamingPolicy.domain, domain) : isNull(mdmNamingPolicy.domain),
        ),
      ),
    );

  const results: ValidationResult[] = [];

  for (const policy of policies) {
    const policyResults = validateAgainstPolicy(name, policy.policyKey, policy.rules, policy.enforcement);
    results.push(...policyResults);
  }

  // If no policies found, apply default validation
  if (policies.length === 0) {
    const defaultResults = applyDefaultValidation(name, context);
    results.push(...defaultResults);
  }

  return {
    name,
    context,
    isValid: !results.some(r => r.enforcement === 'error' && !r.valid),
    errors: results.filter(r => r.enforcement === 'error' && !r.valid),
    warnings: results.filter(r => r.enforcement === 'warning' && !r.valid),
    infos: results.filter(r => r.enforcement === 'info' && !r.valid),
  };
}

/**
 * Validate a name against a single policy
 */
function validateAgainstPolicy(
  name: string,
  policyKey: string,
  rules: NamingPolicyRules,
  enforcement: 'error' | 'warning' | 'info',
): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Pattern validation
  if (rules.pattern) {
    try {
      const regex = new RegExp(rules.pattern);
      if (!regex.test(name)) {
        results.push({
          valid: false,
          policyKey,
          enforcement,
          message: rules.patternDescription ?? `Name does not match required pattern: ${rules.pattern}`,
          suggestion: `Ensure name follows pattern: ${rules.patternDescription ?? rules.pattern}`,
        });
      }
    } catch {
      // Invalid regex - skip this check
    }
  }

  // Length validation
  if (rules.minLength && name.length < rules.minLength) {
    results.push({
      valid: false,
      policyKey,
      enforcement,
      message: `Name is too short. Minimum length: ${rules.minLength}`,
      suggestion: `Add more descriptive words to meet minimum length of ${rules.minLength}`,
    });
  }

  if (rules.maxLength && name.length > rules.maxLength) {
    results.push({
      valid: false,
      policyKey,
      enforcement,
      message: `Name is too long. Maximum length: ${rules.maxLength}`,
      suggestion: `Shorten the name or use abbreviations`,
    });
  }

  // Prefix validation
  if (rules.requiredPrefix && !name.startsWith(rules.requiredPrefix)) {
    results.push({
      valid: false,
      policyKey,
      enforcement,
      message: `Name must start with: ${rules.requiredPrefix}`,
      suggestion: `Add prefix: ${rules.requiredPrefix}${name}`,
    });
  }

  // Suffix validation
  if (rules.requiredSuffix && !name.endsWith(rules.requiredSuffix)) {
    results.push({
      valid: false,
      policyKey,
      enforcement,
      message: `Name must end with: ${rules.requiredSuffix}`,
      suggestion: `Add suffix: ${name}${rules.requiredSuffix}`,
    });
  }

  // Forbidden patterns
  if (rules.forbiddenPatterns) {
    for (const pattern of rules.forbiddenPatterns) {
      try {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(name)) {
          results.push({
            valid: false,
            policyKey,
            enforcement,
            message: `Name contains forbidden pattern: ${pattern}`,
            suggestion: `Remove or replace the forbidden pattern`,
          });
        }
      } catch {
        // Invalid regex - skip
      }
    }
  }

  // Reserved words
  if (rules.reservedWords) {
    const nameLower = name.toLowerCase();
    const nameParts = nameLower.split(/[_\-\s]+/);
    
    for (const reserved of rules.reservedWords) {
      if (nameParts.includes(reserved.toLowerCase())) {
        results.push({
          valid: false,
          policyKey,
          enforcement,
          message: `Name contains reserved word: ${reserved}`,
          suggestion: `Use an alternative term instead of "${reserved}"`,
        });
      }
    }
  }

  // Case style validation
  if (rules.caseStyle) {
    const isValidCase = validateCaseStyle(name, rules.caseStyle);
    if (!isValidCase) {
      results.push({
        valid: false,
        policyKey,
        enforcement,
        message: `Name must be in ${rules.caseStyle} format`,
        suggestion: `Convert name to ${rules.caseStyle}`,
      });
    }
  }

  return results;
}

/**
 * Apply default validation when no policies exist
 */
function applyDefaultValidation(
  name: string,
  context: string,
): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Default case style by context
  const defaultCaseStyles: Record<string, string> = {
    canonical_key: 'snake_case',
    db_column: 'snake_case',
    typescript: 'camelCase',
    api_path: 'kebab-case',
    graphql: 'camelCase',
    const: 'UPPER_SNAKE',
  };

  const expectedStyle = defaultCaseStyles[context];
  if (expectedStyle && !validateCaseStyle(name, expectedStyle as any)) {
    results.push({
      valid: false,
      policyKey: 'default',
      enforcement: 'warning',
      message: `Name should be in ${expectedStyle} format for ${context}`,
      suggestion: `Convert name to ${expectedStyle}`,
    });
  }

  // Default length check
  if (name.length < 2) {
    results.push({
      valid: false,
      policyKey: 'default',
      enforcement: 'error',
      message: 'Name is too short (minimum 2 characters)',
    });
  }

  if (name.length > 100) {
    results.push({
      valid: false,
      policyKey: 'default',
      enforcement: 'warning',
      message: 'Name is very long (>100 characters)',
    });
  }

  return results;
}

/**
 * Validate case style
 */
function validateCaseStyle(
  name: string,
  style: 'snake_case' | 'camelCase' | 'PascalCase' | 'UPPER_SNAKE' | 'kebab-case',
): boolean {
  switch (style) {
    case 'snake_case':
      return /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/.test(name);
    case 'camelCase':
      return /^[a-z][a-zA-Z0-9]*$/.test(name);
    case 'PascalCase':
      return /^[A-Z][a-zA-Z0-9]*$/.test(name);
    case 'UPPER_SNAKE':
      return /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/.test(name);
    case 'kebab-case':
      return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name);
    default:
      return true;
  }
}

/**
 * Get all policies for a tenant
 */
export async function listPolicies(tenantId: string) {
  return db
    .select()
    .from(mdmNamingPolicy)
    .where(eq(mdmNamingPolicy.tenantId, tenantId));
}

/**
 * Create a new naming policy
 */
export async function createPolicy(
  policy: {
    tenantId: string;
    policyKey: string;
    label: string;
    description?: string;
    appliesTo: 'canonical_key' | 'db_column' | 'typescript' | 'api_path' | 'graphql' | 'const';
    domain?: string;
    rules: NamingPolicyRules;
    tier?: 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'tier5';
    enforcement?: 'error' | 'warning' | 'info';
    createdBy: string;
  },
) {
  const [inserted] = await db
    .insert(mdmNamingPolicy)
    .values({
      tenantId: policy.tenantId,
      policyKey: policy.policyKey,
      label: policy.label,
      description: policy.description,
      appliesTo: policy.appliesTo,
      domain: policy.domain,
      rules: policy.rules,
      tier: policy.tier ?? 'tier2',
      enforcement: policy.enforcement ?? 'error',
      isActive: true,
      createdBy: policy.createdBy,
      updatedBy: policy.createdBy,
    })
    .returning();

  return inserted;
}

/**
 * Seed default naming policies for a tenant
 */
export async function seedDefaultPolicies(tenantId: string, createdBy: string) {
  const defaultPolicies = [
    {
      policyKey: 'canonical_key_snake_case',
      label: 'Canonical Key Snake Case',
      description: 'All canonical keys must be in snake_case format',
      appliesTo: 'canonical_key' as const,
      rules: {
        pattern: '^[a-z][a-z0-9]*(_[a-z0-9]+)*$',
        patternDescription: 'Must be lowercase with underscores (snake_case)',
        minLength: 3,
        maxLength: 64,
        caseStyle: 'snake_case' as const,
        reservedWords: ['system', 'admin', 'test', 'null', 'undefined', 'true', 'false'],
      },
      enforcement: 'error' as const,
    },
    {
      policyKey: 'db_column_naming',
      label: 'Database Column Naming',
      description: 'Database columns must follow snake_case and avoid SQL reserved words',
      appliesTo: 'db_column' as const,
      rules: {
        pattern: '^[a-z][a-z0-9]*(_[a-z0-9]+)*$',
        patternDescription: 'Must be lowercase with underscores (snake_case)',
        minLength: 2,
        maxLength: 63, // PostgreSQL limit
        caseStyle: 'snake_case' as const,
        reservedWords: ['select', 'from', 'where', 'insert', 'update', 'delete', 'table', 'index', 'key', 'primary', 'foreign', 'constraint'],
      },
      enforcement: 'error' as const,
    },
    {
      policyKey: 'typescript_field_naming',
      label: 'TypeScript Field Naming',
      description: 'TypeScript fields should be camelCase',
      appliesTo: 'typescript' as const,
      rules: {
        pattern: '^[a-z][a-zA-Z0-9]*$',
        patternDescription: 'Must be camelCase',
        caseStyle: 'camelCase' as const,
      },
      enforcement: 'warning' as const,
    },
    {
      policyKey: 'api_path_naming',
      label: 'API Path Naming',
      description: 'API paths should be kebab-case',
      appliesTo: 'api_path' as const,
      rules: {
        pattern: '^[a-z][a-z0-9]*(-[a-z0-9]+)*$',
        patternDescription: 'Must be kebab-case',
        caseStyle: 'kebab-case' as const,
      },
      enforcement: 'warning' as const,
    },
  ];

  for (const policy of defaultPolicies) {
    try {
      await createPolicy({
        tenantId,
        createdBy,
        ...policy,
      });
    } catch {
      // Policy may already exist - skip
    }
  }
}

