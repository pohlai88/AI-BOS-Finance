/**
 * Component Registry
 * 
 * Auto-discovers and catalogs all COMP_* components in the codebase.
 * 
 * Phase: UI System Next-Level Enhancement
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { glob } from 'glob';

// ============================================================================
// TYPES
// ============================================================================

export interface ComponentMeta {
  code: string;
  version: string;
  family: string;
  purpose: string;
  status: 'active' | 'deprecated' | 'experimental';
}

export interface ComponentInfo {
  id: string;
  name: string;
  filePath: string;
  meta: ComponentMeta;
  props?: Record<string, unknown>;
  examples?: string[];
  category?: string;
}

// ============================================================================
// REGISTRY
// ============================================================================

/**
 * Discover all COMP_* components in the codebase
 */
export async function discoverComponents(
  rootDir: string = process.cwd()
): Promise<ComponentInfo[]> {
  const components: ComponentInfo[] = [];

  // Search for COMP_* files
  const patterns = [
    '**/COMP_*.tsx',
    '**/components/**/*.tsx',
    '**/canon/**/*.tsx',
  ];

  for (const pattern of patterns) {
    const files = await glob(pattern, {
      cwd: rootDir,
      ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
    });

    for (const file of files) {
      const fullPath = join(rootDir, file);
      const component = await parseComponentFile(fullPath);
      if (component) {
        components.push(component);
      }
    }
  }

  return components.sort((a, b) => a.meta.code.localeCompare(b.meta.code));
}

/**
 * Parse a component file to extract metadata
 */
async function parseComponentFile(filePath: string): Promise<ComponentInfo | null> {
  try {
    const content = readFileSync(filePath, 'utf-8');

    // Extract COMPONENT_META
    const metaMatch = content.match(
      /export\s+const\s+COMPONENT_META\s*=\s*({[\s\S]*?})\s*as\s+const/
    );

    if (!metaMatch) {
      // Check if it's a COMP_* file by naming convention
      const fileName = filePath.split('/').pop() || '';
      if (!fileName.startsWith('COMP_') && !fileName.match(/^[A-Z]{3,4}\d{2,3}/)) {
        return null;
      }

      // Try to infer from filename
      const inferredCode = fileName.replace(/\.tsx?$/, '').toUpperCase();
      return {
        id: inferredCode,
        name: inferredCode,
        filePath,
        meta: {
          code: inferredCode,
          version: '1.0.0',
          family: 'UNKNOWN',
          purpose: 'UNKNOWN',
          status: 'active',
        },
      };
    }

    // Parse COMPONENT_META
    const metaStr = metaMatch[1];
    const meta: ComponentMeta = {
      code: extractValue(metaStr, 'code') || 'UNKNOWN',
      version: extractValue(metaStr, 'version') || '1.0.0',
      family: extractValue(metaStr, 'family') || 'UNKNOWN',
      purpose: extractValue(metaStr, 'purpose') || 'UNKNOWN',
      status: (extractValue(metaStr, 'status') as 'active' | 'deprecated' | 'experimental') || 'active',
    };

    // Extract component name
    const exportMatch = content.match(/export\s+(?:function|const)\s+(\w+)/);
    const componentName = exportMatch?.[1] || meta.code;

    return {
      id: meta.code,
      name: componentName,
      filePath,
      meta,
      category: inferCategory(meta.family, meta.purpose),
    };
  } catch (error) {
    console.warn(`Failed to parse component file: ${filePath}`, error);
    return null;
  }
}

/**
 * Extract a value from an object-like string
 */
function extractValue(objStr: string, key: string): string | null {
  const regex = new RegExp(`${key}:\\s*['"]([^'"]+)['"]`, 'i');
  const match = objStr.match(regex);
  return match ? match[1] : null;
}

/**
 * Infer component category from family and purpose
 */
function inferCategory(family: string, purpose: string): string {
  const categoryMap: Record<string, string> = {
    'TABLE': 'Data Display',
    'FORM': 'Forms',
    'CARD': 'Layout',
    'BUTTON': 'Actions',
    'NAVIGATION': 'Navigation',
    'FEEDBACK': 'Feedback',
    'OVERLAY': 'Overlay',
    'METRICS': 'Data Display',
  };

  return categoryMap[family] || categoryMap[purpose] || 'Other';
}

/**
 * Get component usage statistics
 */
export function getComponentStats(components: ComponentInfo[]): {
  total: number;
  byFamily: Record<string, number>;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
} {
  const stats = {
    total: components.length,
    byFamily: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
  };

  for (const comp of components) {
    stats.byFamily[comp.meta.family] = (stats.byFamily[comp.meta.family] || 0) + 1;
    stats.byStatus[comp.meta.status] = (stats.byStatus[comp.meta.status] || 0) + 1;
    stats.byCategory[comp.category || 'Other'] =
      (stats.byCategory[comp.category || 'Other'] || 0) + 1;
  }

  return stats;
}

/**
 * Search components by query
 */
export function searchComponents(
  components: ComponentInfo[],
  query: string
): ComponentInfo[] {
  const lowerQuery = query.toLowerCase();

  return components.filter(comp =>
    comp.meta.code.toLowerCase().includes(lowerQuery) ||
    comp.name.toLowerCase().includes(lowerQuery) ||
    comp.meta.family.toLowerCase().includes(lowerQuery) ||
    comp.meta.purpose.toLowerCase().includes(lowerQuery) ||
    (comp.category?.toLowerCase().includes(lowerQuery))
  );
}
