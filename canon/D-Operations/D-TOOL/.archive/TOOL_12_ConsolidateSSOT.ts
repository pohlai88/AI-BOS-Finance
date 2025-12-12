#!/usr/bin/env tsx
/**
 * Consolidate SSOT Documents
 * 
 * Merges CONT_01 header into CANON_IDENTITY_CONTRACT_v2.2.0.md
 * and renames it to CONT_01_CanonIdentity.md to create a single SSOT.
 * 
 * This eliminates confusion about which document is the true SSOT.
 * 
 * Usage:
 *   npm run canon:consolidate-ssot
 */

import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const A_CONT_DIR = join(ROOT, 'canon', 'A-Governance', 'A-CONT');

const SSOT_SOURCE = join(A_CONT_DIR, 'CANON_IDENTITY_CONTRACT_v2.2.0.md');
const STUB_FILE = join(A_CONT_DIR, 'CONT_01_CanonIdentity.md');
const SSOT_DEST = join(A_CONT_DIR, 'CONT_01_CanonIdentity.md');
const LEGACY_README = join(A_CONT_DIR, 'README_IDENTITY_CONTRACT.md');

// Files that reference the SSOT
const FILES_TO_UPDATE = [
  {
    path: 'canon/A-Governance/A-CONT/README.md',
    patterns: [
      { 
        old: /SSOT:.*CONT_01_CanonIdentity\.md/gi, 
        new: 'SSOT: `CONT_01_CanonIdentity.md` (this file)' 
      },
      { 
        old: /CONT_01_CanonIdentity\.md.*# Main contract \(SSOT\)/gi, 
        new: 'CONT_01_CanonIdentity.md     # SSOT - Canon Identity Contract' 
      },
      { 
        old: /canon\/contracts\/CONT_01_CanonIdentity\.md/gi, 
        new: 'canon/A-Governance/A-CONT/CONT_01_CanonIdentity.md' 
      }
    ]
  },
  {
    path: 'canon/D-Operations/D-TOOL/sync-readme.ts',
    patterns: [
      { 
        old: /canon\/A-Governance\/A-CONT\/CANON_IDENTITY_CONTRACT_v2\.2\.0\.md/gi, 
        new: 'canon/A-Governance/A-CONT/CONT_01_CanonIdentity.md' 
      }
    ]
  }
];

function extractHeader(content: string): string {
  // Extract the header from CONT_01_CanonIdentity.md (up to "End of Contract Header")
  const headerEndMarker = '**End of Contract Header**';
  const headerEndIndex = content.indexOf(headerEndMarker);
  
  if (headerEndIndex === -1) return '';
  
  // Get everything up to and including the marker, plus the next line break
  const headerEnd = headerEndIndex + headerEndMarker.length;
  const nextLineBreak = content.indexOf('\n', headerEnd);
  
  if (nextLineBreak === -1) {
    return content.substring(0, headerEnd);
  }
  
  return content.substring(0, nextLineBreak + 1);
}

function mergeSSOT(): void {
  console.log('📜 Consolidating SSOT Documents\n');
  
  // Check if files exist
  if (!existsSync(SSOT_SOURCE)) {
    console.log('❌ SSOT source not found:', relative(ROOT, SSOT_SOURCE));
    return;
  }
  
  if (!existsSync(STUB_FILE)) {
    console.log('⚠️  Stub file not found, proceeding with SSOT only');
  }
  
  console.log('📋 Consolidation Plan:\n');
  console.log('  1. Extract header from CONT_01_CanonIdentity.md (stub)');
  console.log('  2. Merge header into CANON_IDENTITY_CONTRACT_v2.2.0.md');
  console.log('  3. Rename to CONT_01_CanonIdentity.md');
  console.log('  4. Update all references');
  console.log('  5. Remove legacy files\n');
  
  try {
    // Read SSOT (full content)
    const ssotContent = readFileSync(SSOT_SOURCE, 'utf-8');
    
    // Read stub header if it exists
    let headerContent = '';
    if (existsSync(STUB_FILE)) {
      const stubContent = readFileSync(STUB_FILE, 'utf-8');
      headerContent = extractHeader(stubContent);
    }
    
    // Merge: Use header from stub if available, otherwise keep SSOT's own header
    let mergedContent = ssotContent;
    
    if (headerContent) {
      // Find where the SSOT content starts (after the initial header)
      // The SSOT has its own header, but we want to replace it with the stamped header
      const ssotTitleMatch = ssotContent.match(/^# AI-BOS \/ NexusCanon\n## Canon Identity & Cell Registration Standard v2\.2\.0\n/);
      if (ssotTitleMatch) {
        // Find the start of the actual content (after title and metadata)
        const contentStart = ssotContent.indexOf('## Document Status');
        if (contentStart > 0) {
          // Merge: stamped header + SSOT body (from "## Document Status" onwards)
          const ssotBody = ssotContent.substring(contentStart);
          mergedContent = headerContent.trim() + '\n\n' + ssotBody;
        } else {
          // Fallback: just append header
          mergedContent = headerContent.trim() + '\n\n' + ssotContent;
        }
      } else {
        // Fallback: prepend header
        mergedContent = headerContent.trim() + '\n\n' + ssotContent;
      }
    }
    
    // Write merged content to destination
    writeFileSync(SSOT_DEST, mergedContent, 'utf-8');
    console.log(`  ✓ Merged and created: ${relative(ROOT, SSOT_DEST)}`);
    
    // Remove old SSOT file (if different name)
    if (SSOT_SOURCE !== SSOT_DEST && existsSync(SSOT_SOURCE)) {
      unlinkSync(SSOT_SOURCE);
      console.log(`  ✓ Removed old SSOT: ${relative(ROOT, SSOT_SOURCE)}`);
    }
    
    // Remove stub file
    if (existsSync(STUB_FILE) && STUB_FILE !== SSOT_DEST) {
      unlinkSync(STUB_FILE);
      console.log(`  ✓ Removed stub file: ${relative(ROOT, STUB_FILE)}`);
    }
    
    // Remove legacy README
    if (existsSync(LEGACY_README)) {
      unlinkSync(LEGACY_README);
      console.log(`  ✓ Removed legacy README: ${relative(ROOT, LEGACY_README)}`);
    }
    
    // Update references
    updateReferences();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ SSOT consolidation complete!');
    console.log('\n📊 Result:');
    console.log('   - Single SSOT: CONT_01_CanonIdentity.md');
    console.log('   - All references updated');
    console.log('   - Legacy files removed');
    console.log('\n💡 There is now ONE clear SSOT with no confusion.');
    
  } catch (error) {
    console.error('❌ Consolidation failed:', error);
    process.exit(1);
  }
}

function updateReferences(): void {
  console.log('\n📝 Updating file references...\n');
  
  let updatedCount = 0;
  
  for (const fileInfo of FILES_TO_UPDATE) {
    const filePath = join(ROOT, fileInfo.path);
    
    if (!existsSync(filePath)) {
      console.log(`  ⏭️  Skipped: ${fileInfo.path} (not found)`);
      continue;
    }
    
    try {
      let content = readFileSync(filePath, 'utf-8');
      const originalContent = content;
      
      for (const pattern of fileInfo.patterns) {
        content = content.replace(pattern.old, pattern.new);
      }
      
      if (content !== originalContent) {
        writeFileSync(filePath, content, 'utf-8');
        console.log(`  ✓ Updated: ${fileInfo.path}`);
        updatedCount++;
      } else {
        console.log(`  ⏭️  No changes: ${fileInfo.path}`);
      }
    } catch (error) {
      console.log(`  ❌ Error updating ${fileInfo.path}: ${error}`);
    }
  }
  
  if (updatedCount > 0) {
    console.log(`\n✅ Updated ${updatedCount} file(s)`);
  }
}

async function main() {
  console.log('🎯 TOOL_12: Consolidate SSOT Documents\n');
  console.log('This will create a single SSOT by merging the header and full content.\n');
  
  mergeSSOT();
}

main().catch(console.error);
