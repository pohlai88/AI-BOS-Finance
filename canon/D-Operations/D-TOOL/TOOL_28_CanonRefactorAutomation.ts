#!/usr/bin/env tsx
/**
 * ============================================================================
 * TOOL_28: Canon Refactor Automation Tool
 * ============================================================================
 * Canon Code: TOOL_28
 * Version: 1.0.0
 * Plane: D — Operations (Tool)
 * 
 * Purpose: Automates the refactoring process between canon and canon-pages
 * 
 * Functions:
 * 1. Maps canon documentation to canon-pages MDX files
 * 2. Updates registry entries with proper references
 * 3. Ensures SSOT principles between backend and frontend
 * 
 * Usage:
 *   npx tsx canon/D-Operations/D-TOOL/TOOL_28_CanonRefactorAutomation.ts
 *   npm run canon:refactor
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CANON_FILES } from '../../registry';

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CANON_ROOT = path.resolve(__dirname, '../../..');
const CANON_DIR = path.join(CANON_ROOT, 'canon');
const CANON_PAGES_DIR = path.join(CANON_ROOT, 'canon-pages');

// Mapping configuration
const SECTION_MAPPING: Record<string, string> = {
  'A-Governance': 'governance',
  'B-Functional': 'functional',
  'C-DataLogic': 'data',
  'D-Operations': 'operations',
  'E-Knowledge': 'knowledge'
};

// Type definitions
interface RefactorResult {
  mappedFiles: Array<{canonPath: string, mdxPath: string}>;
  updatedRegistry: boolean;
  errors: string[];
}

/**
 * Check if a file exists
 */
function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Get proper MDX path from canon path
 */
function getMdxPathFromCanonPath(canonPath: string): string {
  // Extract main section and subsection
  const pathParts = canonPath.split('/');
  const mainSection = pathParts[0];
  const mdxSection = SECTION_MAPPING[mainSection] || mainSection.toLowerCase();
  
  // Extract filename without extension
  const fileName = path.basename(canonPath, '.md').toLowerCase();
  
  // Create MDX path
  return `${mdxSection}/${fileName}`;
}

/**
 * Update canon registry with MDX paths
 */
function updateCanonRegistry(): boolean {
  try {
    const registryPath = path.join(CANON_DIR, 'registry.ts');
    let registryContent = fs.readFileSync(registryPath, 'utf-8');
    let updated = false;
    
    // Update each file entry
    for (const [canonPath, canonFile] of Object.entries(CANON_FILES)) {
      if (!canonFile.mdxPath) {
        const mdxPath = getMdxPathFromCanonPath(canonPath);
        const mdxFullPath = path.join(CANON_PAGES_DIR, `${mdxPath}.mdx`);
        
        if (fileExists(mdxFullPath)) {
          // Find the file entry in the registry content
          const fileEntryPattern = new RegExp(`'${canonPath}':\\s*{[^}]*?}`, 's');
          const fileEntryMatch = registryContent.match(fileEntryPattern);
          
          if (fileEntryMatch) {
            const fileEntry = fileEntryMatch[0];
            
            // Check if mdxPath already exists
            if (!fileEntry.includes('mdxPath:')) {
              // Add mdxPath property
              const updatedFileEntry = fileEntry.replace(
                /(\s*})$/,
                `,\n    mdxPath: '${mdxPath}',\n  }`
              );
              
              // Replace in registry content
              registryContent = registryContent.replace(fileEntry, updatedFileEntry);
              updated = true;
            }
          }
        }
      }
    }
    
    if (updated) {
      // Write updated registry
      fs.writeFileSync(registryPath, registryContent);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error updating canon registry:', error);
    return false;
  }
}

/**
 * Map canon files to MDX files
 */
function mapCanonToMdx(): Array<{canonPath: string, mdxPath: string}> {
  const mappedFiles: Array<{canonPath: string, mdxPath: string}> = [];
  
  for (const [canonPath, canonFile] of Object.entries(CANON_FILES)) {
    const mdxPath = canonFile.mdxPath || getMdxPathFromCanonPath(canonPath);
    const mdxFullPath = path.join(CANON_PAGES_DIR, `${mdxPath}.mdx`);
    
    if (fileExists(mdxFullPath)) {
      mappedFiles.push({
        canonPath,
        mdxPath
      });
    }
  }
  
  return mappedFiles;
}

/**
 * Main refactor function
 */
async function refactorCanon(): Promise<RefactorResult> {
  const result: RefactorResult = {
    mappedFiles: [],
    updatedRegistry: false,
    errors: []
  };
  
  try {
    console.log('🔄 Starting Canon refactoring...');
    
    // Map canon files to MDX files
    result.mappedFiles = mapCanonToMdx();
    console.log(`📊 Mapped ${result.mappedFiles.length} canon files to MDX files`);
    
    // Update canon registry
    result.updatedRegistry = updateCanonRegistry();
    if (result.updatedRegistry) {
      console.log('✅ Updated canon registry with MDX paths');
    } else {
      console.log('ℹ️ No updates needed for canon registry');
    }
    
    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error during refactoring:', errorMessage);
    result.errors.push(`Refactoring error: ${errorMessage}`);
    return result;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('');
  console.log('🎯 TOOL_28: Canon Refactor Automation Tool');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   Version: 1.0.0');
  console.log('   Canon Directory: canon/');
  console.log('   MDX Directory: canon-pages/');
  console.log('───────────────────────────────────────────────────────────────');
  console.log('');
  
  try {
    const result = await refactorCanon();
    
    // Print summary
    console.log('\n📊 Refactoring Summary:');
    console.log(`  - Mapped Files: ${result.mappedFiles.length}`);
    console.log(`  - Updated Registry: ${result.updatedRegistry ? 'Yes' : 'No'}`);
    console.log(`  - Errors: ${result.errors.length}`);
    
    // Exit with error if there were errors
    if (result.errors.length > 0) {
      console.error('\n❌ Refactoring completed with errors:');
      result.errors.forEach(error => console.error(`  - ${error}`));
      process.exit(1);
    }
    
    // Exit with success
    console.log('\n✅ Refactoring completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Refactoring failed:', error);
    process.exit(1);
  }
}

// Run main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
