#!/usr/bin/env tsx
/**
 * ============================================================================
 * TOOL_27: Canon Pages Synchronization Tool
 * ============================================================================
 * Canon Code: TOOL_27
 * Version: 1.0.0
 * Plane: D — Operations (Tool)
 * 
 * Purpose: Synchronizes canon files with canon-pages MDX files
 * 
 * Functions:
 * 1. Detects orphaned files in registry (files that no longer exist)
 * 2. Creates MDX scaffolds for canon files without corresponding MDX
 * 3. Updates cross-references between canon and canon-pages
 * 
 * Usage:
 *   npx tsx canon/D-Operations/D-TOOL/TOOL_27_SyncCanonPages.ts
 *   npm run canon:sync
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CANON_FILES, CanonFile } from '../../registry';
// Import from canon-pages registry when needed
// import { CANON_REGISTRY } from '../../../canon-pages/registry';

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CANON_ROOT = path.resolve(__dirname, '../../..');
const CANON_DIR = path.join(CANON_ROOT, 'canon');
const CANON_PAGES_DIR = path.join(CANON_ROOT, 'canon-pages');
const MDX_TEMPLATE_PATH = path.join(__dirname, 'templates/mdx-template.mdx');

// Interfaces
interface SyncResult {
  orphanedFiles: string[];
  missingMdx: string[];
  createdMdx: string[];
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
 * Get MDX template content
 */
function getMdxTemplate(): string {
  try {
    // If template exists, use it
    if (fileExists(MDX_TEMPLATE_PATH)) {
      return fs.readFileSync(MDX_TEMPLATE_PATH, 'utf-8');
    }
    
    // Otherwise use default template
    return `# {title}

{description}

## Overview

This document is synchronized with the canon file: \`{canonPath}\`.

## Content

Content from the canon file will be synchronized here.

## Related Documents

{relatedLinks}
`;
  } catch (error) {
    console.error('Error reading MDX template:', error);
    process.exit(1);
  }
}

/**
 * Generate MDX content from canon file
 */
async function generateMdxContent(canonFile: CanonFile): Promise<string> {
  const template = getMdxTemplate();
  const canonFilePath = path.join(CANON_DIR, canonFile.path);
  
  // Read canon file content
  let canonContent = '';
  try {
    canonContent = fs.readFileSync(canonFilePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading canon file ${canonFile.path}:`, error);
    return template;
  }
  
  // Extract description from content (first paragraph after title)
  const descriptionMatch = canonContent.match(/^#.*?\n\n(.*?)(\n\n|$)/s);
  const description = descriptionMatch ? descriptionMatch[1] : 'No description available.';
  
  // Find related documents
  const relatedFiles = Object.values(CANON_FILES)
    .filter(file => file.type === canonFile.type && file.path !== canonFile.path)
    .slice(0, 3);
  
  const relatedLinks = relatedFiles.length > 0
    ? relatedFiles.map(file => `- [${file.title}](/canon/${file.path.replace(/\.md$/, '')})`).join('\n')
    : 'No related documents found.';
  
  // Replace template placeholders
  return template
    .replace('{title}', canonFile.title)
    .replace('{description}', description)
    .replace('{canonPath}', canonFile.path)
    .replace('{relatedLinks}', relatedLinks);
}

/**
 * Create MDX file for a canon file
 */
async function createMdxFile(canonFile: CanonFile, mdxPath: string): Promise<boolean> {
  try {
    // Create directory if it doesn't exist
    const mdxDir = path.dirname(path.join(CANON_PAGES_DIR, mdxPath));
    if (!fs.existsSync(mdxDir)) {
      fs.mkdirSync(mdxDir, { recursive: true });
    }
    
    // Generate MDX content
    const mdxContent = await generateMdxContent(canonFile);
    
    // Write MDX file
    fs.writeFileSync(path.join(CANON_PAGES_DIR, `${mdxPath}.mdx`), mdxContent);
    
    return true;
  } catch (error) {
    console.error(`Error creating MDX file for ${canonFile.path}:`, error);
    return false;
  }
}

/**
 * Detect orphaned files in registry
 */
function detectOrphanedFiles(): string[] {
  const orphanedFiles: string[] = [];
  
  for (const [canonPath] of Object.entries(CANON_FILES)) {
    const fullPath = path.join(CANON_DIR, canonPath);
    if (!fileExists(fullPath)) {
      orphanedFiles.push(canonPath);
    }
  }
  
  return orphanedFiles;
}

/**
 * Find canon files without corresponding MDX
 */
function findMissingMdx(): string[] {
  const missingMdx: string[] = [];
  
  for (const [canonPath, canonFile] of Object.entries(CANON_FILES)) {
    // Skip if MDX path is already defined
    if (canonFile.mdxPath) {
      const mdxFullPath = path.join(CANON_PAGES_DIR, `${canonFile.mdxPath}.mdx`);
      if (!fileExists(mdxFullPath)) {
        missingMdx.push(canonPath);
      }
    } else {
      // No MDX path defined
      missingMdx.push(canonPath);
    }
  }
  
  return missingMdx;
}

/**
 * Synchronize canon files with MDX files
 */
async function syncCanonPages(): Promise<SyncResult> {
  const result: SyncResult = {
    orphanedFiles: [],
    missingMdx: [],
    createdMdx: [],
    errors: [],
  };
  
  console.log('🔄 Synchronizing canon files with canon-pages...');
  
  // Detect orphaned files
  result.orphanedFiles = detectOrphanedFiles();
  if (result.orphanedFiles.length > 0) {
    console.log(`⚠️ Found ${result.orphanedFiles.length} orphaned files in registry:`);
    result.orphanedFiles.forEach(file => console.log(`  - ${file}`));
  }
  
  // Find missing MDX files
  result.missingMdx = findMissingMdx();
  if (result.missingMdx.length > 0) {
    console.log(`ℹ️ Found ${result.missingMdx.length} canon files without MDX:`);
    
    // Create MDX files
    for (const canonPath of result.missingMdx) {
      const canonFile = CANON_FILES[canonPath];
      
      // Generate MDX path if not defined
      if (!canonFile.mdxPath) {
        // Extract section and name from path
        const pathParts = canonPath.split('/');
        const section = pathParts[0].toLowerCase().replace('a-', '').replace('b-', '').replace('c-', '').replace('d-', '').replace('e-', '');
        const fileName = path.basename(canonPath, '.md').toLowerCase().replace(/_/g, '-');
        
        canonFile.mdxPath = `${section}/${fileName}`;
      }
      
      console.log(`  - Creating MDX for ${canonPath} → ${canonFile.mdxPath}`);
      
      // Create MDX file
      const success = await createMdxFile(canonFile, canonFile.mdxPath);
      if (success) {
        result.createdMdx.push(canonPath);
      } else {
        result.errors.push(`Failed to create MDX for ${canonPath}`);
      }
    }
  }
  
  // Print summary
  console.log('\n📊 Synchronization Summary:');
  console.log(`  - Orphaned Files: ${result.orphanedFiles.length}`);
  console.log(`  - Missing MDX: ${result.missingMdx.length}`);
  console.log(`  - Created MDX: ${result.createdMdx.length}`);
  console.log(`  - Errors: ${result.errors.length}`);
  
  return result;
}

/**
 * Main function
 */
async function main() {
  console.log('');
  console.log('🎯 TOOL_27: Canon Pages Synchronization Tool');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   Version: 1.0.0');
  console.log('   Canon Directory: canon/');
  console.log('   MDX Directory: canon-pages/');
  console.log('───────────────────────────────────────────────────────────────');
  console.log('');
  
  try {
    const result = await syncCanonPages();
    
    // Exit with error if there were errors
    if (result.errors.length > 0) {
      console.error('\n❌ Synchronization completed with errors:');
      result.errors.forEach(error => console.error(`  - ${error}`));
      process.exit(1);
    }
    
    // Exit with success
    console.log('\n✅ Synchronization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Synchronization failed:', error);
    process.exit(1);
  }
}

// Run main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
