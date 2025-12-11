#!/usr/bin/env tsx
/**
 * Canon Identity Contract - Auto-Sync Script v1.1
 * 
 * Generates canon/pages.yaml from PAGE_META exports in codebase.
 * Solves the "Three Sources of Truth" problem by making Code Meta the master.
 * 
 * Usage:
 *   npm run canon:sync
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { glob } from 'glob';
import { load, dump } from 'js-yaml';

// --- Types ---

interface PageMeta {
  code: string;
  version: string;
  name: string;
  route: string;
  domain: string;
  status?: 'active' | 'draft' | 'deprecated';
  owner?: string;
}

interface PageRegistryItem {
  code: string;
  version: string;
  name: string;
  domain: string;
  app: string;
  route: string;
  impl_file: string;
  entry_file: string;
  status: 'active' | 'draft' | 'deprecated';
  owner: string;
  description?: string;
}

interface PagesYaml {
  pages: PageRegistryItem[];
}

// --- Utils ---

/**
 * Robustly extracts a property value from a JS object string.
 * Handles single/double quotes, trailing commas, and whitespace.
 * Regex: Matches key followed by colon, capturing content inside quotes.
 */
function extractProp(content: string, propName: string): string | null {
  // propName\s*:\s* -> matches "code :" or "code:"
  // ['"]              -> matches starting quote
  // ([^'"]+)          -> captures the value inside quotes
  // ['"]              -> matches ending quote
  const regex = new RegExp(`${propName}\\s*:\\s*['"]([^'"]+)['"]`);
  const match = content.match(regex);
  return match ? match[1] : null;
}

// --- Main Logic ---

async function findPageMetaFiles(): Promise<Array<{ file: string; meta: PageMeta }>> {
  const pages: Array<{ file: string; meta: PageMeta }> = [];
  
  // Patterns to search for canonical pages
  const patterns = [
    'src/views/**/*.tsx',
    'src/modules/**/*.tsx',
    'apps/web/canon-pages/**/*.tsx', 
  ];
  
  for (const pattern of patterns) {
    const files = await glob(pattern, { cwd: process.cwd() });
    
    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf-8');
        
        // 1. Find the PAGE_META block using a looser match that captures the object body
        // Matches: export const PAGE_META = { ... }
        // [\s\S]*? matches newlines non-greedily until the closing brace
        const blockMatch = content.match(/export\s+const\s+PAGE_META\s*=\s*({[\s\S]*?})\s+as\s+const/);
        
        if (blockMatch) {
          const metaBlock = blockMatch[1]; // The content inside { ... } including braces

          // 2. Extract fields individually from the block
          const code = extractProp(metaBlock, 'code');
          const version = extractProp(metaBlock, 'version');
          const name = extractProp(metaBlock, 'name');
          const route = extractProp(metaBlock, 'route');
          const domain = extractProp(metaBlock, 'domain');
          const owner = extractProp(metaBlock, 'owner');
          // status is optional, default to active if missing
          const status = extractProp(metaBlock, 'status') || 'active';

          if (code && version && name && route && domain) {
            const meta: PageMeta = {
              code,
              version,
              name,
              route,
              domain,
              status: status as any,
              owner: owner || 'UNKNOWN',
            };
            
            pages.push({ file, meta });
          } else {
            // Found the block, but missing keys. Warn the user.
            console.warn(`⚠️  Found PAGE_META in ${file} but missing required fields.`);
          }
        }
      } catch (err) {
        console.warn(`❌ Failed to parse ${file}:`, err);
      }
    }
  }
  
  return pages;
}

function generateEntryFile(implFile: string, route: string): string {
  // Logic for Next.js App Router
  if (implFile.includes('apps/web/canon-pages/')) {
    const routePath = route.replace(/^\//, '').replace(/\/$/, '');
    return `apps/web/app/${routePath || 'canon'}/page.tsx`;
  }
  
  // Logic for Module/Vite based projects
  if (implFile.includes('src/modules/')) {
    const pageCode = implFile.match(/([A-Z]+_\d+)/)?.[1];
    if (pageCode) {
      // Heuristic: Assumes a wrapper exists in src/views with the code prefix
      return `src/views/${pageCode}_Page.tsx`; 
    }
  }
  
  // Fallback for generic Vite apps
  return `src/routes/registry.ts#${route}`;
}

async function generatePagesYaml(): Promise<PagesYaml> {
  const pageFiles = await findPageMetaFiles();
  
  const pages: PageRegistryItem[] = pageFiles.map(({ file, meta }) => {
    const implFile = file.replace(/\\/g, '/'); // Ensure forward slashes
    const entryFile = generateEntryFile(implFile, meta.route);
    
    return {
      code: meta.code,
      version: meta.version,
      name: meta.name,
      domain: meta.domain,
      app: 'web',
      route: meta.route,
      impl_file: implFile,
      entry_file: entryFile,
      status: meta.status || 'active',
      owner: meta.owner || 'UNKNOWN',
      description: `Auto-generated from ${implFile}`,
    };
  });
  
  return { pages };
}

function mergeWithExisting(generated: PagesYaml, existingPath: string): PagesYaml {
  if (!existsSync(existingPath)) return generated;
  
  try {
    const existing = load(readFileSync(existingPath, 'utf-8')) as PagesYaml;
    const existingMap = new Map(existing.pages.map(p => [p.code, p]));
    
    const merged: PageRegistryItem[] = generated.pages.map(gen => {
      const exist = existingMap.get(gen.code);
      if (exist) {
        // Keep human-written descriptions and explicit owners
        // If description is still the auto-gen one, update it. If human changed it, keep it.
        const isAutoGenDesc = exist.description?.startsWith('Auto-generated');
        return {
          ...gen,
          description: !isAutoGenDesc && exist.description ? exist.description : gen.description,
          owner: exist.owner !== 'UNKNOWN' ? exist.owner : gen.owner,
        };
      }
      return gen;
    });

    // Handle deprecations (pages in YAML but not in code)
    for (const [code, page] of existingMap) {
      if (!generated.pages.find(p => p.code === code)) {
        merged.push({ ...page, status: 'deprecated' });
      }
    }
    
    return { pages: merged };
  } catch (err) {
    console.warn('Failed to merge YAML, overwriting:', err);
    return generated;
  }
}

async function main() {
  console.log('🔄 Syncing Canon Identity Registry...');
  
  try {
    const generated = await generatePagesYaml();
    
    if (generated.pages.length === 0) {
      console.warn('⚠️  No PAGE_META exports found. Nothing to sync.');
      process.exit(0);
    }

    const outputPath = join(process.cwd(), 'canon', 'pages.yaml');
    const merged = mergeWithExisting(generated, outputPath);
    
    // Ensure dir
    const dir = dirname(outputPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    // Write
    const yamlStr = dump(merged, { indent: 2, lineWidth: 120, quotingType: '"' });
    const header = `# canon/pages.yaml
# Auto-generated from PAGE_META exports.
# Master Source: Codebase (PAGE_META blocks).
# Last synced: ${new Date().toISOString()}
# Run 'npm run canon:sync' to update.

`;
    writeFileSync(outputPath, header + yamlStr, 'utf-8');
    
    console.log(`✅ Synced ${merged.pages.length} pages to ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

if (require.main === module) main();

export { generatePagesYaml, findPageMetaFiles };
