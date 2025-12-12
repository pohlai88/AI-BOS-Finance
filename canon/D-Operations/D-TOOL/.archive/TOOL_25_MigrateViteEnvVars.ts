#!/usr/bin/env tsx
/**
 * TOOL_25: Migrate Vite Environment Variables to Next.js
 * 
 * Migrates environment variables from Vite format to Next.js format:
 * - Renames VITE_* to NEXT_PUBLIC_* in .env files
 * - Updates code references from import.meta.env.VITE_* to process.env.NEXT_PUBLIC_*
 * 
 * Usage:
 *   npx tsx canon/D-Operations/D-TOOL/TOOL_25_MigrateViteEnvVars.ts --dry-run
 *   npx tsx canon/D-Operations/D-TOOL/TOOL_25_MigrateViteEnvVars.ts --execute
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, extname } from 'path';

const DRY_RUN = !process.argv.includes('--execute');
const ROOT = process.cwd();

interface EnvVar {
  oldName: string;
  newName: string;
  oldUsage: string;
  newUsage: string;
}

/**
 * Find all .env files
 */
function findEnvFiles(): string[] {
  const envFiles: string[] = [];
  
  function searchDir(dir: string) {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        // Skip node_modules and .git
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next') {
          continue;
        }
        
        if (entry.isDirectory()) {
          searchDir(fullPath);
        } else if (entry.name.startsWith('.env')) {
          envFiles.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  searchDir(ROOT);
  return envFiles;
}

/**
 * Extract VITE_ variables from .env file
 */
function extractViteVars(filePath: string): EnvVar[] {
  if (!existsSync(filePath)) return [];
  
  const content = readFileSync(filePath, 'utf-8');
  const vars: EnvVar[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('VITE_') && trimmed.includes('=')) {
      const [name] = trimmed.split('=');
      const newName = name.replace('VITE_', 'NEXT_PUBLIC_');
      vars.push({
        oldName: name,
        newName,
        oldUsage: `import.meta.env.${name}`,
        newUsage: `process.env.${newName}`,
      });
    }
  }
  
  return vars;
}

/**
 * Migrate .env file
 */
function migrateEnvFile(filePath: string, vars: EnvVar[]): void {
  if (vars.length === 0) return;
  
  let content = readFileSync(filePath, 'utf-8');
  let changed = false;
  
  for (const v of vars) {
    if (content.includes(v.oldName)) {
      content = content.replace(new RegExp(`^${v.oldName}`, 'gm'), v.newName);
      changed = true;
    }
  }
  
  if (changed) {
    if (!DRY_RUN) {
      writeFileSync(filePath, content, 'utf-8');
      console.log(`  ✅ Updated: ${filePath}`);
    } else {
      console.log(`  💡 Would update: ${filePath}`);
    }
  }
}

/**
 * Find code files that use import.meta.env.VITE_*
 */
function findCodeFiles(): string[] {
  const codeFiles: string[] = [];
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  
  function searchDir(dir: string) {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        // Skip certain directories
        if (
          entry.name === 'node_modules' ||
          entry.name === '.git' ||
          entry.name === '.next' ||
          entry.name === 'dist' ||
          entry.name === 'build'
        ) {
          continue;
        }
        
        if (entry.isDirectory()) {
          searchDir(fullPath);
        } else if (extensions.includes(extname(entry.name))) {
          const content = readFileSync(fullPath, 'utf-8');
          if (content.includes('import.meta.env.VITE_')) {
            codeFiles.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  searchDir(join(ROOT, 'src'));
  return codeFiles;
}

/**
 * Migrate code file
 */
function migrateCodeFile(filePath: string, vars: EnvVar[]): void {
  let content = readFileSync(filePath, 'utf-8');
  let changed = false;
  
  for (const v of vars) {
    if (content.includes(v.oldUsage)) {
      content = content.replace(new RegExp(v.oldUsage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), v.newUsage);
      changed = true;
    }
  }
  
  if (changed) {
    if (!DRY_RUN) {
      writeFileSync(filePath, content, 'utf-8');
      console.log(`  ✅ Updated: ${filePath}`);
    } else {
      console.log(`  💡 Would update: ${filePath}`);
    }
  }
}

async function main() {
  console.log('🚀 TOOL_25: Migrate Vite Environment Variables to Next.js\n');
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No files will be modified');
    console.log('   Use --execute flag to perform migration\n');
  } else {
    console.log('✅ EXECUTE MODE - Files will be modified\n');
  }
  
  // Step 1: Find all .env files
  console.log('📁 Step 1: Finding .env files...');
  const envFiles = findEnvFiles();
  console.log(`   Found ${envFiles.length} .env file(s)\n`);
  
  // Step 2: Extract all VITE_ variables
  console.log('🔍 Step 2: Extracting VITE_ variables...');
  const allVars = new Map<string, EnvVar>();
  
  for (const envFile of envFiles) {
    const vars = extractViteVars(envFile);
    for (const v of vars) {
      if (!allVars.has(v.oldName)) {
        allVars.set(v.oldName, v);
      }
    }
  }
  
  const vars = Array.from(allVars.values());
  console.log(`   Found ${vars.length} VITE_ variable(s):`);
  for (const v of vars) {
    console.log(`     ${v.oldName} → ${v.newName}`);
  }
  console.log('');
  
  if (vars.length === 0) {
    console.log('✨ No VITE_ variables found. Migration not needed.');
    return;
  }
  
  // Step 3: Migrate .env files
  console.log('📝 Step 3: Migrating .env files...');
  for (const envFile of envFiles) {
    const fileVars = extractViteVars(envFile);
    if (fileVars.length > 0) {
      console.log(`   ${envFile}:`);
      migrateEnvFile(envFile, fileVars);
    }
  }
  console.log('');
  
  // Step 4: Find and migrate code files
  console.log('💻 Step 4: Finding code files with import.meta.env.VITE_*...');
  const codeFiles = findCodeFiles();
  console.log(`   Found ${codeFiles.length} file(s) with VITE_ references\n`);
  
  if (codeFiles.length > 0) {
    console.log('📝 Step 5: Migrating code files...');
    for (const codeFile of codeFiles) {
      console.log(`   ${codeFile}:`);
      migrateCodeFile(codeFile, vars);
    }
    console.log('');
  }
  
  // Summary
  console.log('='.repeat(60));
  console.log('📊 Summary:');
  console.log(`   📁 .env files processed: ${envFiles.length}`);
  console.log(`   🔧 Variables found: ${vars.length}`);
  console.log(`   💻 Code files found: ${codeFiles.length}`);
  
  if (DRY_RUN) {
    console.log('\n💡 To perform migration, run with --execute flag:');
    console.log('   npx tsx canon/D-Operations/D-TOOL/TOOL_25_MigrateViteEnvVars.ts --execute');
  } else {
    console.log('\n✅ Migration completed!');
    console.log('💡 Next steps:');
    console.log('   1. Review changes in .env files');
    console.log('   2. Review changes in code files');
    console.log('   3. Test application');
    console.log('   4. Update any documentation that references VITE_ variables');
  }
}

main().catch(console.error);
