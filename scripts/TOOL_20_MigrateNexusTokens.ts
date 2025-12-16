/**
 * TOOL_20: Migrate Nexus Tokens to Semantic Tokens
 * 
 * Canon Code: TOOL_20
 * Purpose: Auto-replace legacy nexus-* classes with semantic tokens
 * Part of: CONT_09 UI/UX Architecture Contract - Phase 1
 * 
 * Usage: npx tsx scripts/TOOL_20_MigrateNexusTokens.ts [--dry-run] [--verbose]
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
const FILE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.css'];
const IGNORE_DIRS = ['node_modules', '.next', 'dist', '.git'];

// Token migration map: old -> new
const TOKEN_MIGRATIONS: Record<string, string> = {
  // Background colors
  'bg-nexus-void': 'bg-background',
  'bg-nexus-matter': 'bg-surface-card',
  'bg-nexus-surface': 'bg-surface-subtle',
  'bg-nexus-surface/10': 'bg-surface-subtle/10',
  'bg-nexus-surface/20': 'bg-surface-subtle/20',
  'bg-nexus-surface/50': 'bg-surface-subtle/50',
  'bg-nexus-surface/80': 'bg-surface-subtle/80',
  'bg-nexus-void/60': 'bg-background/60',
  'bg-nexus-void/80': 'bg-background/80',
  
  // Text colors
  'text-nexus-signal': 'text-text-primary',
  'text-nexus-signal/60': 'text-text-secondary',
  'text-nexus-signal/70': 'text-text-secondary',
  'text-nexus-signal/80': 'text-text-primary/80',
  'text-nexus-noise': 'text-text-secondary',
  'text-nexus-green': 'text-primary',
  'text-nexus-green/50': 'text-primary/50',
  
  // Border colors
  'border-nexus-structure': 'border-default',
  'border-nexus-border': 'border-subtle',
  'border-nexus-border/30': 'border-subtle/30',
  'border-nexus-border/50': 'border-subtle/50',
  'border-nexus-green': 'border-primary',
  
  // Accent/Primary
  'bg-nexus-green': 'bg-primary',
  'bg-nexus-green/10': 'bg-primary/10',
  'bg-nexus-green/20': 'bg-primary/20',
  'bg-nexus-green/50': 'bg-primary/50',
  
  // Ring
  'ring-nexus-green': 'ring-primary',
  'focus:ring-nexus-green': 'focus:ring-primary',
  
  // Hover states
  'hover:bg-nexus-surface': 'hover:bg-surface-hover',
  'hover:bg-nexus-surface/50': 'hover:bg-surface-hover/50',
  'hover:text-nexus-signal': 'hover:text-text-primary',
  'hover:text-nexus-green': 'hover:text-primary',
  'hover:border-nexus-green': 'hover:border-primary',
};

// CSS variable migrations (for globals.css)
const CSS_VAR_MIGRATIONS: Record<string, string> = {
  '--nexus-void': '--color-background',
  '--nexus-matter': '--color-surface-card',
  '--nexus-surface': '--color-surface-subtle',
  '--nexus-signal': '--color-text-primary',
  '--nexus-noise': '--color-text-secondary',
  '--nexus-green': '--color-primary',
  '--nexus-structure': '--color-border-default',
  '--nexus-border': '--color-border-subtle',
};

// ============================================================================
// TYPES
// ============================================================================

interface MigrationResult {
  file: string;
  changes: Array<{
    line: number;
    old: string;
    new: string;
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

function migrateContent(content: string, filePath: string): { newContent: string; changes: MigrationResult['changes'] } {
  const lines = content.split('\n');
  const changes: MigrationResult['changes'] = [];
  let newContent = content;
  
  // Apply token migrations
  for (const [oldToken, newToken] of Object.entries(TOKEN_MIGRATIONS)) {
    // Escape special regex characters
    const escapedOld = oldToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedOld}\\b`, 'g');
    
    if (regex.test(newContent)) {
      // Find line numbers for reporting
      lines.forEach((line, index) => {
        if (line.includes(oldToken)) {
          changes.push({
            line: index + 1,
            old: oldToken,
            new: newToken,
          });
        }
      });
      
      newContent = newContent.replace(regex, newToken);
    }
  }
  
  // Apply CSS variable migrations (for CSS files)
  if (filePath.endsWith('.css')) {
    for (const [oldVar, newVar] of Object.entries(CSS_VAR_MIGRATIONS)) {
      const regex = new RegExp(oldVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (regex.test(newContent)) {
        newContent = newContent.replace(regex, newVar);
      }
    }
  }
  
  return { newContent, changes };
}

function migrate(dryRun: boolean, verbose: boolean): Summary {
  console.log('🚀 TOOL_20: Migrate Nexus Tokens to Semantic Tokens\n');
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
          console.log(`   Line ${change.line}: "${change.old}" → "${change.new}"`);
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
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`  Files scanned:  ${summary.filesScanned}`);
  console.log(`  Files modified: ${summary.filesModified}`);
  console.log(`  Total changes:  ${summary.totalChanges}`);
  
  if (dryRun && summary.totalChanges > 0) {
    console.log('\n⚠️  DRY RUN - No files were modified.');
    console.log('   Run without --dry-run to apply changes.');
  } else if (summary.totalChanges > 0) {
    console.log('\n✅ Migration complete! Files have been updated.');
  } else {
    console.log('\n✅ No nexus-* tokens found. Migration not needed.');
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
