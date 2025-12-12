#!/usr/bin/env tsx
/**
 * Canon Planes Migration Script
 * 
 * Migrates repository to "Self-Teaching Directory" structure:
 * canon/A-Governance/A-CONT/ (Plane + Prefix + Description)
 * 
 * This structure requires zero memorization - the folder name IS the cheat sheet.
 * 
 * Usage:
 *   npm run canon:migrate-planes
 * 
 * Safety: Creates backup before migration
 */

import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from 'fs';
import { join, dirname, basename, relative } from 'path';
const ROOT = process.cwd();

// --- Utility Functions ---

function ensureDir(path: string) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function moveFile(src: string, dest: string) {
  if (!existsSync(src)) {
    console.log(`  ⏭️  Skipped (already moved): ${relative(ROOT, src)}`);
    return;
  }
  if (existsSync(dest)) {
    console.log(`  ⏭️  Skipped (destination exists): ${relative(ROOT, dest)}`);
    return;
  }
  ensureDir(dirname(dest));
  renameSync(src, dest);
  console.log(`  ✓ Moved: ${relative(ROOT, src)} → ${relative(ROOT, dest)}`);
}

function findFiles(dir: string, pattern: RegExp): string[] {
  const files: string[] = [];
  if (!existsSync(dir)) return files;
  
  function walk(currentDir: string) {
    const entries = readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && pattern.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

// --- Migration Steps ---

function step1_CreateStructure() {
  console.log('\n📁 Step 1: Creating Self-Teaching Directory Structure...');
  
  const dirs = [
    'canon/A-Governance/A-CONT',
    'canon/A-Governance/A-ADR',
    'canon/B-Functional/B-PAGE',
    'canon/B-Functional/B-COMP',
    'canon/B-Functional/B-CELL',
    'canon/C-DataLogic/C-ENT',
    'canon/C-DataLogic/C-SCH',
    'canon/C-DataLogic/C-POLY',
    'canon/C-DataLogic/C-CONST',
    'canon/D-Operations/D-TOOL',
    'canon/D-Operations/D-MIG',
    'canon/D-Operations/D-INFRA',
    'canon/E-Knowledge/E-SPEC',
    'canon/E-Knowledge/E-REF',
  ];
  
  dirs.forEach(dir => {
    ensureDir(join(ROOT, dir));
    console.log(`  ✓ Created: ${dir}`);
  });
}

function step2_MigratePlaneA() {
  console.log('\n📜 Step 2: Migrating Plane A (Governance)...');
  
  const contractsDir = join(ROOT, 'canon/contracts');
  if (!existsSync(contractsDir)) {
    console.log('  ⚠️  canon/contracts/ not found, skipping Plane A migration');
    return;
  }
  
  // Move CONT files from contracts directory
  const contFiles = findFiles(contractsDir, /^CONT_\d+.*\.md$/);
  contFiles.forEach(file => {
    const name = basename(file);
    moveFile(file, join(ROOT, 'canon/A-Governance/A-CONT', name));
  });
  
  // Move ADR files from adrs subdirectory
  const adrsDir = join(contractsDir, 'adrs');
  if (existsSync(adrsDir)) {
    const adrFiles = findFiles(adrsDir, /^ADR_\d+.*\.md$/);
    adrFiles.forEach(file => {
      const name = basename(file);
      moveFile(file, join(ROOT, 'canon/A-Governance/A-ADR', name));
    });
    
    // Move ADR README if it exists
    const adrReadme = join(adrsDir, 'README.md');
    if (existsSync(adrReadme)) {
      moveFile(adrReadme, join(ROOT, 'canon/A-Governance/A-ADR', 'README.md'));
    }
  }
  
  // Move contracts README to A-CONT (navigation index)
  const contractsReadme = join(contractsDir, 'README.md');
  if (existsSync(contractsReadme)) {
    moveFile(contractsReadme, join(ROOT, 'canon/A-Governance/A-CONT', 'README.md'));
  }
}

function step3_MigratePlaneB() {
  console.log('\n🎨 Step 3: Migrating Plane B (Functional)...');
  
  // Move pages from src/views/ to B-PAGE (create registry structure)
  const pagesDir = join(ROOT, 'src/views');
  if (existsSync(pagesDir)) {
    console.log('  ℹ️  Views will remain in src/views/ (implementation location)');
    console.log('  ℹ️  Create registry.yaml in B-PAGE/ to register them');
  }
  
  // Move components (if there's a canon components directory)
  const componentsDir = join(ROOT, 'src/components');
  if (existsSync(componentsDir)) {
    console.log('  ℹ️  Components will remain in src/components/ (implementation location)');
    console.log('  ℹ️  Create registry.yaml in B-COMP/ to register them');
  }
  
  // Create placeholder registry files
  const registryYaml = `# Registry for ${basename(process.cwd())}
# Auto-generated during migration
# Update this file to register your ${basename(process.cwd())} items

items: []
`;
  
  const registryFiles = [
    { path: 'canon/B-Functional/B-PAGE/registry.yaml', type: 'Pages' },
    { path: 'canon/B-Functional/B-COMP/registry.yaml', type: 'Components' },
    { path: 'canon/B-Functional/B-CELL/registry.yaml', type: 'Cells' },
  ];
  
  registryFiles.forEach(({ path, type }) => {
    const fullPath = join(ROOT, path);
    if (!existsSync(fullPath)) {
      ensureDir(dirname(fullPath));
      writeFileSync(fullPath, registryYaml.replace('items', type.toLowerCase()));
      console.log(`  ✓ Created: ${path}`);
    }
  });
}

function step4_MigratePlaneC() {
  console.log('\n💾 Step 4: Migrating Plane C (Data & Logic)...');
  
  // Move database schema
  const dbDir = join(ROOT, 'db');
  if (existsSync(dbDir)) {
    console.log('  ℹ️  Database files will remain in db/ (implementation location)');
    console.log('  ℹ️  Create registry.yaml in C-ENT/ to register entities');
  }
  
  // Move constants
  const constantsDir = join(ROOT, 'src/constants');
  if (existsSync(constantsDir)) {
    console.log('  ℹ️  Constants will remain in src/constants/ (implementation location)');
    console.log('  ℹ️  Create registry.yaml in C-CONST/ to register them');
  }
  
  // Create placeholder registry files
  const registryYaml = `# Registry for ${basename(process.cwd())}
# Auto-generated during migration
# Update this file to register your ${basename(process.cwd())} items

items: []
`;
  
  const registryFiles = [
    { path: 'canon/C-DataLogic/C-ENT/registry.yaml', type: 'Entities' },
    { path: 'canon/C-DataLogic/C-SCH/registry.yaml', type: 'Schemas' },
    { path: 'canon/C-DataLogic/C-POLY/registry.yaml', type: 'Policies' },
    { path: 'canon/C-DataLogic/C-CONST/registry.yaml', type: 'Constants' },
  ];
  
  registryFiles.forEach(({ path, type }) => {
    const fullPath = join(ROOT, path);
    if (!existsSync(fullPath)) {
      ensureDir(dirname(fullPath));
      writeFileSync(fullPath, registryYaml.replace('items', type.toLowerCase()));
      console.log(`  ✓ Created: ${path}`);
    }
  });
}

function step5_MigratePlaneD() {
  console.log('\n🔧 Step 5: Migrating Plane D (Operations)...');
  
  // Move TOOL files from scripts/ (but skip this migration script itself)
  const scriptsDir = join(ROOT, 'scripts');
  if (existsSync(scriptsDir)) {
    const toolFiles = findFiles(scriptsDir, /^TOOL_\d+.*\.ts$/);
    toolFiles.forEach(file => {
      // Skip moving this migration script itself
      if (basename(file) === 'TOOL_05_MigrateCanonPlanes.ts') {
        console.log(`  ⏭️  Skipped: ${basename(file)} (migration script - will be moved manually)`);
        return;
      }
      const name = basename(file);
      moveFile(file, join(ROOT, 'canon/D-Operations/D-TOOL', name));
    });
    
    console.log('  ℹ️  Other scripts remain in scripts/ (ungoverned utilities)');
    console.log('  ℹ️  TOOL_05_MigrateCanonPlanes.ts should be moved manually after migration completes');
  }
  
  // Create migrations directory placeholder
  const migrationsDir = join(ROOT, 'canon/D-Operations/D-MIG');
  ensureDir(migrationsDir);
  console.log(`  ✓ Created: ${relative(ROOT, migrationsDir)}/ (for MIG_* files)`);
  
  // Create infra directory placeholder
  const infraDir = join(ROOT, 'canon/D-Operations/D-INFRA');
  ensureDir(infraDir);
  console.log(`  ✓ Created: ${relative(ROOT, infraDir)}/ (for INFRA_* files)`);
}

function step6_MigratePlaneE() {
  console.log('\n📚 Step 6: Migrating Plane E (Knowledge)...');
  
  // Move SPEC files
  const specFiles = [
    ...findFiles(join(ROOT, 'knowledge'), /^SPEC_\d+.*\.md$/),
    ...findFiles(join(ROOT, '.'), /^SPEC_\d+.*\.md$/),
    ...findFiles(join(ROOT, 'src/docs'), /^SPEC_\d+.*\.md$/),
  ];
  
  specFiles.forEach(file => {
    const name = basename(file);
    moveFile(file, join(ROOT, 'canon/E-Knowledge/E-SPEC', name));
  });
  
  // Move REF files
  const refFiles = [
    ...findFiles(join(ROOT, 'knowledge'), /^REF_\d+.*/),
    ...findFiles(join(ROOT, '.'), /^REF_\d+.*/),
    ...findFiles(join(ROOT, 'src/docs'), /^REF_\d+.*/),
  ];
  
  refFiles.forEach(file => {
    const name = basename(file);
    moveFile(file, join(ROOT, 'canon/E-Knowledge/E-REF', name));
  });
  
  // Move PRD files as potential SPEC
  const prdFiles = findFiles(join(ROOT, '.'), /^PRD_.*\.md$/);
  if (prdFiles.length > 0) {
    console.log('  ℹ️  Found PRD files (potential SPEC files):');
    prdFiles.forEach(file => {
      console.log(`    - ${relative(ROOT, file)}`);
    });
    console.log('  ℹ️  Review and rename to SPEC_* if they are specifications');
  }
}

function step7_Cleanup() {
  console.log('\n🧹 Step 7: Cleaning up old directories...');
  
  // Check and clean contracts directory
  const contractsDir = join(ROOT, 'canon/contracts');
  if (existsSync(contractsDir)) {
    const entries = readdirSync(contractsDir, { withFileTypes: true });
    const remainingFiles = entries.filter(e => {
      // Skip directories that might have been partially migrated
      if (e.isDirectory()) {
        const subEntries = readdirSync(join(contractsDir, e.name), { withFileTypes: true });
        return subEntries.length > 0;
      }
      // Skip README.md and non-CONT/ADR files
      return e.name !== 'README.md' && !/^(CONT_|ADR_)/.test(e.name);
    });
    
    if (remainingFiles.length === 0) {
      // Check if adrs subdirectory is empty
      const adrsDir = join(contractsDir, 'adrs');
      if (existsSync(adrsDir)) {
        const adrEntries = readdirSync(adrsDir);
        if (adrEntries.length === 0 || (adrEntries.length === 1 && adrEntries[0] === 'README.md')) {
          rmSync(adrsDir, { recursive: true });
        }
      }
      
      // Remove contracts directory if truly empty
      const finalEntries = readdirSync(contractsDir);
      if (finalEntries.length === 0) {
        rmSync(contractsDir, { recursive: true });
        console.log(`  ✓ Removed empty: canon/contracts/`);
      } else {
        console.log(`  ⚠️  Keeping canon/contracts/ (contains: ${finalEntries.join(', ')})`);
      }
    } else {
      console.log(`  ⚠️  Keeping canon/contracts/ (contains: ${remainingFiles.map(e => e.name).join(', ')})`);
    }
  }
  
  // Clean registry if it exists and is empty
  const registryDir = join(ROOT, 'canon/registry');
  if (existsSync(registryDir)) {
    const entries = readdirSync(registryDir);
    if (entries.length === 0) {
      rmSync(registryDir, { recursive: true });
      console.log(`  ✓ Removed empty: canon/registry/`);
    } else {
      console.log(`  ⚠️  Keeping canon/registry/ (contains: ${entries.join(', ')})`);
    }
  }
  
  // Note: Keep archive directory (now z-archive to sort at bottom)
  console.log('  ℹ️  Keeping canon/z-archive/ (historical documents)');
}

function step8_CreateReadme() {
  console.log('\n📝 Step 8: Creating README files...');
  
  const readmeContent = (plane: string, description: string, prefixes: string[]) => `# ${plane} — ${description}

**Canon Plane:** ${plane}  
**Prefixes:** ${prefixes.join(', ')}  
**Location:** \`canon/${plane}/\`

## Structure

This directory contains subdirectories for each prefix type:

${prefixes.map(p => `- \`${plane}-${p}/\` - ${p} files`).join('\n')}

## Self-Teaching

The directory name \`${plane}\` tells you:
- **Plane Letter:** ${plane[0]} (sorts alphabetically)
- **Description:** ${description}
- **Prefixes:** ${prefixes.join(', ')}

No memorization needed - the folder structure IS the cheat sheet!

---

**See:** \`canon/A-Governance/A-CONT/CONT_01_CanonIdentity.md\` for full Canon Identity Contract.
`;

  const planes = [
    {
      dir: 'canon/A-Governance',
      plane: 'A-Governance',
      desc: 'Governance',
      prefixes: ['CONT', 'ADR'],
    },
    {
      dir: 'canon/B-Functional',
      plane: 'B-Functional',
      desc: 'Functional',
      prefixes: ['PAGE', 'COMP', 'CELL'],
    },
    {
      dir: 'canon/C-DataLogic',
      plane: 'C-DataLogic',
      desc: 'Data & Logic',
      prefixes: ['ENT', 'SCH', 'POLY', 'CONST'],
    },
    {
      dir: 'canon/D-Operations',
      plane: 'D-Operations',
      desc: 'Operations',
      prefixes: ['TOOL', 'MIG', 'INFRA'],
    },
    {
      dir: 'canon/E-Knowledge',
      plane: 'E-Knowledge',
      desc: 'Knowledge',
      prefixes: ['SPEC', 'REF'],
    },
  ];
  
  planes.forEach(({ dir, plane, desc, prefixes }) => {
    const readmePath = join(ROOT, dir, 'README.md');
    if (!existsSync(readmePath)) {
      writeFileSync(readmePath, readmeContent(plane, desc, prefixes));
      console.log(`  ✓ Created: ${relative(ROOT, readmePath)}`);
    }
  });
}

// --- Main Execution ---

async function main() {
  console.log('🚀 Canon Planes Migration: Self-Teaching Directory Structure');
  console.log('=' .repeat(60));
  console.log('\nThis will migrate your repository to the "Self-Teaching" structure:');
  console.log('  canon/A-Governance/A-CONT/ (Plane + Prefix + Description)');
  console.log('\n⚠️  This is a DESTRUCTIVE operation. Make sure you have:');
  console.log('  1. Committed all changes');
  console.log('  2. Created a backup');
  console.log('  3. Tested on a branch');
  
  // Execute steps
  try {
    step1_CreateStructure();
    step2_MigratePlaneA();
    step3_MigratePlaneB();
    step4_MigratePlaneC();
    step5_MigratePlaneD();
    step6_MigratePlaneE();
    step7_Cleanup();
    step8_CreateReadme();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Migration Complete!');
    console.log('\n📋 Next Steps:');
    console.log('  1. Review the new structure in canon/');
    console.log('  2. Manually move TOOL_05_MigrateCanonPlanes.ts to canon/D-Operations/D-TOOL/');
    console.log('  3. Update import paths in your code (if any reference old paths)');
    console.log('  4. Update build configs (vite.config.ts, etc.) if needed');
    console.log('  5. Update documentation references');
    console.log('  6. Test your application: npm run dev');
    console.log('  7. Commit the changes');
    console.log('\n📚 The folder structure is now self-teaching:');
    console.log('   - A-Governance/A-CONT/ → Contracts use CONT_ prefix');
    console.log('   - B-Functional/B-PAGE/ → Pages use PAGE_ prefix');
    console.log('   - D-Operations/D-TOOL/ → Tools use TOOL_ prefix');
    console.log('   - Zero memorization required!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\n💡 Rollback: Restore from your backup or git reset');
    process.exit(1);
  }
}

// Run if executed directly
main().catch(console.error);
