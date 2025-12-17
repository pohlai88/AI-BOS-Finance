/**
 * TOOL_27: Fix Exception Colors (Automated)
 * 
 * One-command solution to replace harsh orange/red/yellow colors
 * with muted professional colors from the design system.
 * 
 * Usage:
 *   pnpm tsx scripts/TOOL_27_FixExceptionColors.ts
 * 
 * This script:
 * 1. Finds all harsh exception colors (orange-*, red-*, yellow-*)
 * 2. Replaces with muted design system colors (status-warning/10, etc.)
 * 3. Reports what was changed
 * 
 * Future: Can be extended to use Figma MCP to extract colors
 */

import { readFile, writeFile, readdir } from 'fs/promises';
import { join, extname } from 'path';
import { glob } from 'glob';

interface ColorReplacement {
  pattern: RegExp;
  replacement: string;
  description: string;
}

// Muted color replacements (from design system)
const COLOR_REPLACEMENTS: ColorReplacement[] = [
  // Orange → Muted Amber/Warning
  {
    pattern: /text-orange-(\d+)/g,
    replacement: 'text-status-warning/90',
    description: 'Orange text → Muted warning',
  },
  {
    pattern: /bg-orange-(\d+)/g,
    replacement: 'bg-status-warning/10',
    description: 'Orange background → Muted warning background',
  },
  {
    pattern: /border-orange-(\d+)/g,
    replacement: 'border-status-warning/20',
    description: 'Orange border → Muted warning border',
  },
  {
    pattern: /hover:bg-orange-(\d+)/g,
    replacement: 'hover:bg-status-warning/15',
    description: 'Orange hover → Muted warning hover',
  },

  // Red → Muted Danger (for critical)
  {
    pattern: /text-red-(\d+)/g,
    replacement: 'text-status-danger/90',
    description: 'Red text → Muted danger',
  },
  {
    pattern: /bg-red-(\d+)/g,
    replacement: 'bg-status-danger/10',
    description: 'Red background → Muted danger background',
  },
  {
    pattern: /border-red-(\d+)/g,
    replacement: 'border-status-danger/20',
    description: 'Red border → Muted danger border',
  },

  // Yellow → Muted Warning (for info warnings)
  {
    pattern: /text-yellow-(\d+)/g,
    replacement: 'text-status-warning/90',
    description: 'Yellow text → Muted warning',
  },
  {
    pattern: /bg-yellow-(\d+)/g,
    replacement: 'bg-status-warning/10',
    description: 'Yellow background → Muted warning background',
  },
  {
    pattern: /border-yellow-(\d+)/g,
    replacement: 'border-status-warning/20',
    description: 'Yellow border → Muted warning border',
  },
];

interface FixResult {
  file: string;
  changes: number;
  replacements: string[];
}

async function findTsxFiles(rootDir: string): Promise<string[]> {
  const files = await glob('**/*.{tsx,ts}', {
    cwd: rootDir,
    ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
  });
  return files.map(f => join(rootDir, f));
}

async function fixFile(filePath: string): Promise<FixResult> {
  const content = await readFile(filePath, 'utf-8');
  let newContent = content;
  const replacements: string[] = [];
  let changeCount = 0;

  for (const { pattern, replacement, description } of COLOR_REPLACEMENTS) {
    const matches = content.match(pattern);
    if (matches) {
      newContent = newContent.replace(pattern, replacement);
      replacements.push(`${description}: ${matches.length} occurrence(s)`);
      changeCount += matches.length;
    }
  }

  if (changeCount > 0) {
    await writeFile(filePath, newContent, 'utf-8');
  }

  return {
    file: filePath,
    changes: changeCount,
    replacements,
  };
}

async function main() {
  const rootDir = process.cwd();
  const targetDirs = [
    join(rootDir, 'apps/web/src/features/payments'),
    join(rootDir, 'packages/bioskin/src/molecules'),
  ];

  console.log('🎨 Fixing Exception Colors...\n');

  const results: FixResult[] = [];

  for (const dir of targetDirs) {
    try {
      const files = await findTsxFiles(dir);
      for (const file of files) {
        const result = await fixFile(file);
        if (result.changes > 0) {
          results.push(result);
        }
      }
    } catch (error) {
      console.error(`Error processing ${dir}:`, error);
    }
  }

  // Report
  console.log('✅ Fix Complete!\n');
  console.log(`📊 Summary: ${results.length} file(s) updated\n`);

  for (const result of results) {
    const relativePath = result.file.replace(rootDir + '\\', '').replace(rootDir + '/', '');
    console.log(`  📝 ${relativePath}`);
    console.log(`     ${result.changes} color(s) replaced`);
    result.replacements.forEach(r => console.log(`     • ${r}`));
    console.log('');
  }

  if (results.length === 0) {
    console.log('✨ No harsh colors found - all exception colors are already muted!');
  }
}

main().catch(console.error);
