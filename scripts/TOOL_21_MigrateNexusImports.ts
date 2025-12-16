/**
 * TOOL_21: Migrate Nexus Imports to New Locations
 * 
 * Canon Code: TOOL_21
 * Purpose: Auto-replace legacy nexus/* imports with new component paths
 * Part of: CONT_09 UI/UX Architecture Contract - Phase 0
 * 
 * This tool handles import statement migrations that TOOL_20 cannot handle.
 * TOOL_20 handles CSS class migrations (bg-nexus-* -> bg-surface-*).
 * TOOL_21 handles import statement migrations (from '@/components/nexus/*').
 * 
 * Usage: npx tsx scripts/TOOL_21_MigrateNexusImports.ts [--dry-run] [--verbose]
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

const ROOT_DIR = join(__dirname, '../apps/web');
const FILE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];
const IGNORE_DIRS = ['node_modules', '.next', 'dist', '.git'];

// Import path migrations
const IMPORT_PATH_MIGRATIONS: Array<{
  pattern: RegExp;
  replacement: string;
  description: string;
}> = [
    // NexusIcon -> icons/NexusIcon
    {
      pattern: /from\s+['"]@\/components\/nexus\/NexusIcon['"]/g,
      replacement: "from '@/components/icons/NexusIcon'",
      description: 'NexusIcon -> icons/NexusIcon',
    },
    {
      pattern: /from\s+['"]\.\.\/components\/nexus\/NexusIcon['"]/g,
      replacement: "from '@/components/icons/NexusIcon'",
      description: 'NexusIcon (relative) -> icons/NexusIcon',
    },
    {
      pattern: /from\s+['"]\.\.\/\.\.\/components\/nexus\/NexusIcon['"]/g,
      replacement: "from '@/components/icons/NexusIcon'",
      description: 'NexusIcon (relative 2) -> icons/NexusIcon',
    },

    // NexusCard -> ui/card (ForensicCard)
    {
      pattern: /from\s+['"]@\/components\/nexus\/NexusCard['"]/g,
      replacement: "from '@/components/ui/card'",
      description: 'NexusCard -> ui/card',
    },
    {
      pattern: /from\s+['"]\.\.\/components\/nexus\/NexusCard['"]/g,
      replacement: "from '@/components/ui/card'",
      description: 'NexusCard (relative) -> ui/card',
    },
    {
      pattern: /from\s+['"]\.\.\/\.\.\/components\/nexus\/NexusCard['"]/g,
      replacement: "from '@/components/ui/card'",
      description: 'NexusCard (relative 2) -> ui/card',
    },

    // NexusButton -> ui/button
    {
      pattern: /from\s+['"]@\/components\/nexus\/NexusButton['"]/g,
      replacement: "from '@/components/ui/button'",
      description: 'NexusButton -> ui/button',
    },
    {
      pattern: /from\s+['"]\.\.\/components\/nexus\/NexusButton['"]/g,
      replacement: "from '@/components/ui/button'",
      description: 'NexusButton (relative) -> ui/button',
    },
    {
      pattern: /from\s+['"]\.\.\/\.\.\/components\/nexus\/NexusButton['"]/g,
      replacement: "from '@/components/ui/button'",
      description: 'NexusButton (relative 2) -> ui/button',
    },

    // NexusBadge -> ui/badge
    {
      pattern: /from\s+['"]@\/components\/nexus\/NexusBadge['"]/g,
      replacement: "from '@/components/ui/badge'",
      description: 'NexusBadge -> ui/badge',
    },
    {
      pattern: /from\s+['"]\.\.\/components\/nexus\/NexusBadge['"]/g,
      replacement: "from '@/components/ui/badge'",
      description: 'NexusBadge (relative) -> ui/badge',
    },
    {
      pattern: /from\s+['"]\.\.\/\.\.\/components\/nexus\/NexusBadge['"]/g,
      replacement: "from '@/components/ui/badge'",
      description: 'NexusBadge (relative 2) -> ui/badge',
    },

    // NexusInput -> ui/input
    {
      pattern: /from\s+['"]@\/components\/nexus\/NexusInput['"]/g,
      replacement: "from '@/components/ui/input'",
      description: 'NexusInput -> ui/input',
    },
    {
      pattern: /from\s+['"]\.\.\/components\/nexus\/NexusInput['"]/g,
      replacement: "from '@/components/ui/input'",
      description: 'NexusInput (relative) -> ui/input',
    },
    {
      pattern: /from\s+['"]\.\.\/\.\.\/components\/nexus\/NexusInput['"]/g,
      replacement: "from '@/components/ui/input'",
      description: 'NexusInput (relative 2) -> ui/input',
    },

    // CardSection -> canon/CardSection
    {
      pattern: /from\s+['"]@\/components\/nexus\/CardSection['"]/g,
      replacement: "from '@/components/canon/CardSection'",
      description: 'CardSection -> canon/CardSection',
    },
    {
      pattern: /from\s+['"]\.\.\/components\/nexus\/CardSection['"]/g,
      replacement: "from '@/components/canon/CardSection'",
      description: 'CardSection (relative) -> canon/CardSection',
    },
    {
      pattern: /from\s+['"]\.\.\/\.\.\/components\/nexus\/CardSection['"]/g,
      replacement: "from '@/components/canon/CardSection'",
      description: 'CardSection (relative 2) -> canon/CardSection',
    },
    {
      pattern: /from\s+['"]\.\/NexusCard['"]/g,
      replacement: "from '@/components/ui/card'",
      description: 'NexusCard (local) -> ui/card',
    },
    {
      pattern: /from\s+['"]\.\/NexusBadge['"]/g,
      replacement: "from '@/components/ui/badge'",
      description: 'NexusBadge (local) -> ui/badge',
    },
  ];

// Named import migrations (component name changes)
const NAMED_IMPORT_MIGRATIONS: Array<{
  pattern: RegExp;
  replacement: string;
  description: string;
}> = [
    // NexusCard -> ForensicCard (alias for compatibility)
    {
      pattern: /\{\s*NexusCard\s*\}/g,
      replacement: '{ ForensicCard as NexusCard }',
      description: 'NexusCard -> ForensicCard as NexusCard',
    },
    // NexusButton -> Button (alias for compatibility)
    {
      pattern: /\{\s*NexusButton\s*\}/g,
      replacement: '{ Button as NexusButton }',
      description: 'NexusButton -> Button as NexusButton',
    },
    // NexusBadge -> Badge (alias for compatibility)
    {
      pattern: /\{\s*NexusBadge\s*\}/g,
      replacement: '{ Badge as NexusBadge }',
      description: 'NexusBadge -> Badge as NexusBadge',
    },
    // NexusInput -> Input (alias for compatibility)
    {
      pattern: /\{\s*NexusInput\s*\}/g,
      replacement: '{ Input as NexusInput }',
      description: 'NexusInput -> Input as NexusInput',
    },
  ];

// ============================================================================
// TYPES
// ============================================================================

interface MigrationResult {
  file: string;
  changes: Array<{
    line: number;
    type: 'path' | 'named';
    description: string;
    before: string;
    after: string;
  }>;
}

interface Summary {
  filesScanned: number;
  filesModified: number;
  totalChanges: number;
  results: MigrationResult[];
}

// ============================================================================
// FUNCTIONS
// ============================================================================

function getAllFiles(dir: string, files: string[] = []): string[] {
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.includes(item)) {
        getAllFiles(fullPath, files);
      }
    } else if (FILE_EXTENSIONS.includes(extname(item))) {
      files.push(fullPath);
    }
  }

  return files;
}

function migrateContent(content: string, filePath: string): {
  newContent: string;
  changes: MigrationResult['changes']
} {
  const lines = content.split('\n');
  const changes: MigrationResult['changes'] = [];
  let newContent = content;

  // Apply import path migrations
  for (const migration of IMPORT_PATH_MIGRATIONS) {
    if (migration.pattern.test(newContent)) {
      // Find line numbers for reporting
      lines.forEach((line, index) => {
        // Reset regex lastIndex since we're testing multiple times
        migration.pattern.lastIndex = 0;
        if (migration.pattern.test(line)) {
          changes.push({
            line: index + 1,
            type: 'path',
            description: migration.description,
            before: line.trim(),
            after: line.replace(migration.pattern, migration.replacement).trim(),
          });
        }
      });

      // Reset regex and apply replacement
      migration.pattern.lastIndex = 0;
      newContent = newContent.replace(migration.pattern, migration.replacement);
    }
  }

  // Apply named import migrations (only for files that had path changes)
  if (changes.length > 0) {
    for (const migration of NAMED_IMPORT_MIGRATIONS) {
      if (migration.pattern.test(newContent)) {
        lines.forEach((line, index) => {
          migration.pattern.lastIndex = 0;
          if (migration.pattern.test(line)) {
            changes.push({
              line: index + 1,
              type: 'named',
              description: migration.description,
              before: line.trim(),
              after: line.replace(migration.pattern, migration.replacement).trim(),
            });
          }
        });

        migration.pattern.lastIndex = 0;
        newContent = newContent.replace(migration.pattern, migration.replacement);
      }
    }
  }

  return { newContent, changes };
}

function migrate(dryRun: boolean, verbose: boolean): Summary {
  console.log('🚀 TOOL_21: Migrate Nexus Imports to New Locations\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no files will be modified)' : 'LIVE (files will be modified)'}\n`);

  const summary: Summary = {
    filesScanned: 0,
    filesModified: 0,
    totalChanges: 0,
    results: [],
  };

  const files = getAllFiles(ROOT_DIR);
  summary.filesScanned = files.length;

  console.log(`📂 Scanning ${files.length} files in ${ROOT_DIR}...\n`);

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const { newContent, changes } = migrateContent(content, file);

    if (changes.length > 0) {
      const relativePath = file.replace(ROOT_DIR, '');

      summary.filesModified++;
      summary.totalChanges += changes.length;
      summary.results.push({ file: relativePath, changes });

      if (verbose) {
        console.log(`\n📄 ${relativePath}`);
        for (const change of changes) {
          console.log(`   Line ${change.line} [${change.type}]: ${change.description}`);
          console.log(`     - ${change.before}`);
          console.log(`     + ${change.after}`);
        }
      } else {
        console.log(`  ✏️  ${relativePath} (${changes.length} changes)`);
      }

      if (!dryRun) {
        writeFileSync(file, newContent, 'utf-8');
      }
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMPORT MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`  Files scanned:  ${summary.filesScanned}`);
  console.log(`  Files modified: ${summary.filesModified}`);
  console.log(`  Total changes:  ${summary.totalChanges}`);

  if (dryRun && summary.totalChanges > 0) {
    console.log('\n⚠️  DRY RUN - No files were modified.');
    console.log('   Run without --dry-run to apply changes.');
  } else if (summary.totalChanges > 0) {
    console.log('\n✅ Migration complete! Import statements have been updated.');
    console.log('\n📝 Next steps:');
    console.log('   1. Run `pnpm run type-check` to verify no broken imports');
    console.log('   2. Run `pnpm run dev` to verify application works');
    console.log('   3. Delete the old nexus/ folder after verifying');
  } else {
    console.log('\n✅ No nexus imports found. Migration not needed.');
  }

  return summary;
}

// ============================================================================
// MAIN
// ============================================================================

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');

migrate(dryRun, verbose);
