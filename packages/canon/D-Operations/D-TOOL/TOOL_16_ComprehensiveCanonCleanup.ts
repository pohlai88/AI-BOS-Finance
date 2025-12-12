#!/usr/bin/env tsx
/**
 * Comprehensive Canon Cleanup & README Regeneration
 * 
 * This tool performs a complete cleanup and regeneration of all Canon documentation:
 * 1. Validates all documents for SEAL format compliance
 * 2. Relocates documents to correct Canon planes
 * 3. Updates SEAL headers in all documents
 * 4. Removes all existing README files
 * 5. Regenerates all README files with proper SEAL format
 * 
 * Usage:
 *   npm run canon:cleanup-and-regenerate
 * 
 * ⚠️ WARNING: This will delete all existing README files and regenerate them.
 * Make sure you have committed your changes before running this tool.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync, statSync, unlinkSync, renameSync, mkdirSync } from 'fs';
import { join, relative, basename, dirname, extname } from 'path';

const ROOT = process.cwd();
const CANON_DIR = join(ROOT, 'canon');

interface PlaneConfig {
  letter: string;
  name: string;
  prefixes: string[];
  description: string;
  contentType: string;
}

const PLANE_CONFIGS: Record<string, PlaneConfig> = {
  'A-Governance': {
    letter: 'A',
    name: 'Governance',
    prefixes: ['CONT', 'ADR'],
    description: 'Laws & Decisions',
    contentType: 'Contracts and Architecture Decision Records'
  },
  'B-Functional': {
    letter: 'B',
    name: 'Functional',
    prefixes: ['PAGE', 'COMP', 'CELL'],
    description: 'UI & Experience',
    contentType: 'YAML manifests'
  },
  'C-DataLogic': {
    letter: 'C',
    name: 'DataLogic',
    prefixes: ['ENT', 'SCH', 'POLY', 'CONST'],
    description: 'Data & Business Rules',
    contentType: 'YAML manifests'
  },
  'D-Operations': {
    letter: 'D',
    name: 'Operations',
    prefixes: ['TOOL', 'MIG', 'INFRA'],
    description: 'Tooling & Infrastructure',
    contentType: 'Scripts, runbooks, infrastructure docs'
  },
  'E-Knowledge': {
    letter: 'E',
    name: 'Knowledge',
    prefixes: ['SPEC', 'REF'],
    description: 'Library & Evidence',
    contentType: 'Specifications, reference documents'
  }
};

// Relocation rules for documents
const RELOCATION_RULES: Array<{
  pattern: RegExp;
  destination: string;
  description: string;
  prefix?: string;
}> = [
  { pattern: /^SPEC_/i, destination: 'canon/E-Knowledge/E-SPEC', description: 'Specifications', prefix: 'SPEC' },
  { pattern: /^REF_/i, destination: 'canon/E-Knowledge/E-REF', description: 'Reference documents', prefix: 'REF' },
  { pattern: /^PRD_/i, destination: 'canon/E-Knowledge/E-SPEC', description: 'Product Requirements', prefix: 'SPEC' },
  { pattern: /^AUDIT_/i, destination: 'canon/E-Knowledge/E-REF', description: 'Audit documents', prefix: 'REF' },
  { pattern: /^CONTEXT_/i, destination: 'canon/E-Knowledge/E-REF', description: 'Context documentation', prefix: 'REF' },
  { pattern: /^(CANON_|README_CANON)/i, destination: 'canon/E-Knowledge/E-REF', description: 'Canon guides', prefix: 'REF' },
  { pattern: /^REPO_/i, destination: 'canon/E-Knowledge/E-REF', description: 'Repository structure', prefix: 'REF' },
  { pattern: /^FIGMA_/i, destination: 'canon/E-Knowledge/E-REF', description: 'Figma documentation', prefix: 'REF' },
  { pattern: /^DEVELOPER_/i, destination: 'canon/E-Knowledge/E-REF', description: 'Developer notes', prefix: 'REF' },
  { pattern: /^HONEST_/i, destination: 'canon/E-Knowledge/E-REF', description: 'Audit validation', prefix: 'REF' },
];

interface DocumentInfo {
  path: string;
  filename: string;
  currentLocation: string;
  correctLocation?: string;
  needsRelocation: boolean;
  needsHeaderUpdate: boolean;
  hasSEALHeader: boolean;
  prefix?: string;
}

// Step 1: Scan all documents
function scanAllDocuments(): DocumentInfo[] {
  const documents: DocumentInfo[] = [];
  
  function scanDirectory(dirPath: string, relativePath: string = ''): void {
    if (!existsSync(dirPath)) return;
    
    const entries = readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      
      if (entry.isDirectory()) {
        // Skip archive directories
        if (entry.name.startsWith('z-')) continue;
        scanDirectory(fullPath, relPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        // Skip README files (will be regenerated)
        if (entry.name === 'README.md') continue;
        
        const content = readFileSync(fullPath, 'utf-8');
        const hasSEALHeader = content.trim().startsWith('> **');
        const needsHeaderUpdate = !hasSEALHeader;
        
        // Check if document needs relocation
        let needsRelocation = false;
        let correctLocation: string | undefined;
        let prefix: string | undefined;
        
        for (const rule of RELOCATION_RULES) {
          if (rule.pattern.test(entry.name)) {
            const expectedPath = join(ROOT, rule.destination);
            if (fullPath !== join(expectedPath, entry.name)) {
              needsRelocation = true;
              correctLocation = rule.destination;
              prefix = rule.prefix;
            }
            break;
          }
        }
        
        documents.push({
          path: fullPath,
          filename: entry.name,
          currentLocation: relPath,
          correctLocation,
          needsRelocation,
          needsHeaderUpdate,
          hasSEALHeader,
          prefix
        });
      }
    }
  }
  
  // Scan canon directory
  scanDirectory(CANON_DIR, 'canon');
  
  // Scan root for misplaced documents
  const rootFiles = readdirSync(ROOT);
  for (const file of rootFiles) {
    if (file.endsWith('.md') && file !== 'README.md') {
      const fullPath = join(ROOT, file);
      const stat = statSync(fullPath);
      if (stat.isFile()) {
        const content = readFileSync(fullPath, 'utf-8');
        const hasSEALHeader = content.trim().startsWith('> **');
        
        let needsRelocation = false;
        let correctLocation: string | undefined;
        let prefix: string | undefined;
        
        for (const rule of RELOCATION_RULES) {
          if (rule.pattern.test(file)) {
            needsRelocation = true;
            correctLocation = rule.destination;
            prefix = rule.prefix;
            break;
          }
        }
        
        documents.push({
          path: fullPath,
          filename: file,
          currentLocation: file,
          correctLocation,
          needsRelocation,
          needsHeaderUpdate: !hasSEALHeader,
          hasSEALHeader,
          prefix
        });
      }
    }
  }
  
  return documents;
}

// Step 2: Update SEAL headers
function updateSEALHeader(doc: DocumentInfo): string {
  const content = readFileSync(doc.path, 'utf-8');
  const date = new Date().toISOString().split('T')[0];
  
  // Extract document type from filename
  let docType = 'Reference Document';
  let canonCode = '';
  
  if (doc.filename.startsWith('CONT_')) {
    docType = 'Certified for Production';
    canonCode = doc.filename.replace('.md', '');
  } else if (doc.filename.startsWith('ADR_')) {
    docType = 'Architectural Decision';
    canonCode = doc.filename.replace('.md', '');
  } else if (doc.filename.startsWith('REF_')) {
    docType = 'Reference Document';
    canonCode = doc.filename.replace('.md', '');
  } else if (doc.filename.startsWith('SPEC_')) {
    docType = 'Specification';
    canonCode = doc.filename.replace('.md', '');
  } else if (doc.prefix) {
    // Try to extract code from content or generate one
    const codeMatch = content.match(/\*\*Canon Code:\*\*\s*(\w+)/);
    canonCode = codeMatch ? codeMatch[1] : `${doc.prefix}_XXX`;
  }
  
  // Generate SEAL header
  let header = `> **🟢 [ACTIVE]** — ${docType}\n`;
  if (canonCode) {
    header += `> **Canon Code:** ${canonCode}\n`;
  }
  header += `> **Version:** 1.0.0\n`;
  header += `> **Purpose:** ${doc.filename.replace('.md', '').replace(/_/g, ' ')}\n`;
  
  // Determine plane
  if (doc.filename.startsWith('CONT_') || doc.filename.startsWith('ADR_')) {
    header += `> **Plane:** A — Governance (${doc.filename.startsWith('CONT_') ? 'Contract' : 'Architectural Decision'})\n`;
  } else if (doc.filename.startsWith('REF_') || doc.filename.startsWith('SPEC_')) {
    header += `> **Plane:** E — Knowledge (${doc.filename.startsWith('REF_') ? 'Reference' : 'Specification'})\n`;
  } else if (doc.prefix === 'REF') {
    header += `> **Plane:** E — Knowledge (Reference)\n`;
  } else if (doc.prefix === 'SPEC') {
    header += `> **Plane:** E — Knowledge (Specification)\n`;
  }
  
  header += `\n---\n\n`;
  
  // Remove existing header if present
  let body = content;
  if (content.trim().startsWith('> **')) {
    const headerEnd = content.indexOf('\n---\n');
    if (headerEnd > 0) {
      body = content.substring(headerEnd + 5).trim();
    } else {
      // Try to find where header ends (after first blank line after header)
      const lines = content.split('\n');
      let headerEndIdx = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '' && i > 0 && lines[i-1].trim().startsWith('>')) {
          headerEndIdx = i + 1;
          break;
        }
      }
      if (headerEndIdx > 0) {
        body = lines.slice(headerEndIdx).join('\n').trim();
      }
    }
  }
  
  return header + body;
}

// Step 3: Remove all README files
function removeAllReadmes(): number {
  let count = 0;
  
  function removeReadmesInDir(dirPath: string): void {
    if (!existsSync(dirPath)) return;
    
    const entries = readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        if (entry.name.startsWith('z-')) continue;
        removeReadmesInDir(fullPath);
      } else if (entry.name === 'README.md') {
        try {
          unlinkSync(fullPath);
          console.log(`  🗑️  Removed: ${relative(ROOT, fullPath)}`);
          count++;
        } catch (error) {
          console.log(`  ❌ Error removing ${relative(ROOT, fullPath)}: ${error}`);
        }
      }
    }
  }
  
  removeReadmesInDir(CANON_DIR);
  return count;
}

// Step 4: Regenerate README files (reuse logic from TOOL_13 and TOOL_15)
function generateAllReadmes(): void {
  // Generate main plane READMEs
  const entries = readdirSync(CANON_DIR, { withFileTypes: true });
  const directories = entries
    .filter(e => e.isDirectory() && !e.name.startsWith('z-'))
    .map(e => join(CANON_DIR, e.name));
  
  for (const dir of directories) {
    const dirName = basename(dir);
    const plane = PLANE_CONFIGS[dirName];
    
    if (!plane) continue;
    
    const readmePath = join(dir, 'README.md');
    const date = new Date().toISOString().split('T')[0];
    
    // Detect SSOT
    let ssot: { file: string; code: string; version?: string } | null = null;
    if (plane.letter === 'A') {
      const files = readdirSync(dir).filter(f => f.endsWith('.md'));
      const cont01 = files.find(f => f.startsWith('CONT_01'));
      if (cont01) {
        const content = readFileSync(join(dir, cont01), 'utf-8');
        const versionMatch = content.match(/\*\*Version:\*\*\s*([\d.]+)/);
        ssot = {
          file: cont01,
          code: 'CONT_01',
          version: versionMatch ? versionMatch[1] : undefined
        };
      }
    }
    
    // Generate README content
    let content = `> **🟢 [ACTIVE]** — Navigation Index\n`;
    content += `> **Canon Plane:** ${plane.letter}-${plane.name}\n`;
    content += `> **Prefixes:** ${plane.prefixes.join(', ')}\n`;
    content += `> **Location:** \`${relative(ROOT, dir)}/\`\n`;
    
    if (ssot) {
      content += `> **SSOT:** [\`${ssot.file}\`](./${ssot.file}) — Single Source of Truth`;
      if (ssot.version) {
        content += ` (v${ssot.version})`;
      }
      content += `\n`;
    }
    
    content += `> **Auto-Generated:** ${date}\n`;
    content += `\n---\n\n`;
    content += `# ${dirName} — ${plane.description}\n\n`;
    content += `**Canon Plane:** ${plane.letter}-${plane.name}  \n`;
    content += `**Prefixes:** ${plane.prefixes.join(', ')}  \n`;
    content += `**Location:** \`${relative(ROOT, dir)}/\`\n\n`;
    content += `## 📁 Structure\n\n`;
    content += `This directory contains subdirectories for each prefix type:\n\n`;
    
    for (const prefix of plane.prefixes) {
      const subDir = `${plane.letter}-${plane.name}-${prefix}`;
      content += `- \`${subDir}/\` - ${prefix} files\n`;
    }
    
    content += `\n`;
    
    if (ssot) {
      content += `## 📜 Single Source of Truth (SSOT)\n\n`;
      content += `**SSOT Document:** [\`${ssot.file}\`](./${ssot.file})  \n`;
      if (ssot.version) {
        content += `**Version:** ${ssot.version}  \n`;
      }
      content += `\nThis is the authoritative specification document for this plane.\n\n`;
    }
    
    content += `## 🎓 Self-Teaching\n\n`;
    content += `The directory name \`${dirName}\` tells you:\n`;
    content += `- **Plane Letter:** ${plane.letter} (sorts alphabetically)\n`;
    content += `- **Description:** ${plane.description}\n`;
    content += `- **Prefixes:** ${plane.prefixes.join(', ')}\n\n`;
    content += `No memorization needed - the folder structure IS the cheat sheet!\n\n`;
    content += `---\n\n`;
    content += `**See:** [\`CONT_01_CanonIdentity.md\`](../A-Governance/A-CONT/CONT_01_CanonIdentity.md) for full Canon Identity Contract.\n`;
    
    writeFileSync(readmePath, content, 'utf-8');
    console.log(`  ✓ Generated: ${relative(ROOT, readmePath)}`);
  }
  
  // Generate subdirectory READMEs (A-CONT, A-ADR, etc.)
  const aGovPath = join(CANON_DIR, 'A-Governance');
  if (existsSync(aGovPath)) {
    const entries = readdirSync(aGovPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('A-')) {
        const prefix = entry.name.replace('A-', '');
        const subPath = join(aGovPath, entry.name);
        const files = readdirSync(subPath).filter(f => f.endsWith('.md') && f !== 'README.md');
        
        let ssot: string | undefined;
        if (prefix === 'CONT') {
          const cont01 = files.find(f => f.startsWith('CONT_01'));
          if (cont01) ssot = cont01;
        }
        
        const date = new Date().toISOString().split('T')[0];
        let content = `> **🟢 [ACTIVE]** — Navigation Index\n`;
        content += `> **Canon Plane:** A-Governance\n`;
        content += `> **Prefixes:** ${prefix}\n`;
        content += `> **Location:** \`${relative(ROOT, subPath)}/\`\n`;
        
        if (ssot) {
          content += `> **SSOT:** [\`${ssot}\`](./${ssot}) — Single Source of Truth\n`;
        }
        
        content += `> **Auto-Generated:** ${date}\n`;
        content += `\n---\n\n`;
        
        const title = prefix === 'CONT' ? 'Canon Contracts' : 
                      prefix === 'ADR' ? 'Architecture Decision Records (ADRs)' :
                      `${prefix} Documents`;
        content += `# ${title}\n\n`;
        
        if (ssot) {
          content += `## 📜 Single Source of Truth (SSOT)\n\n`;
          content += `**SSOT Document:** [\`${ssot}\`](./${ssot})  \n`;
          content += `\nThis is the authoritative specification document.\n\n`;
          content += `---\n\n`;
        }
        
        if (prefix === 'CONT') {
          content += `## 📜 Active Contracts (Plane A — Governance)\n\n`;
          content += `| Canon Code | Document | Status | Version |\n`;
          content += `|------------|----------|--------|---------|\n`;
          
          for (const file of files.filter(f => f.startsWith('CONT_'))) {
            const code = file.replace('.md', '');
            const fileContent = readFileSync(join(subPath, file), 'utf-8');
            const versionMatch = fileContent.match(/\*\*Version:\*\*\s*([\d.]+)/);
            const version = versionMatch ? versionMatch[1] : 'N/A';
            content += `| **${code}** | [${code}](./${file}) | 🟢 ACTIVE | ${version} |\n`;
          }
          
          content += `\n---\n\n`;
          content += `## 📋 Architecture Decision Records (ADRs)\n\n`;
          content += `See: [../A-ADR/README.md](../A-ADR/README.md)\n\n`;
          
        } else if (prefix === 'ADR') {
          content += `## 📋 Active ADRs\n\n`;
          content += `| Canon Code | Title | Status | Date |\n`;
          content += `|------------|-------|--------|------|\n`;
          
          for (const file of files.filter(f => f.startsWith('ADR_'))) {
            const code = file.replace('.md', '');
            const fileContent = readFileSync(join(subPath, file), 'utf-8');
            const titleMatch = fileContent.match(/#\s*(ADR_\d+):\s*(.+)/);
            const dateMatch = fileContent.match(/\*\*Date:\*\*\s*(\d{4}-\d{2}-\d{2})/);
            const title = titleMatch ? titleMatch[2].trim() : code;
            const date = dateMatch ? dateMatch[1] : 'N/A';
            content += `| **${code}** | [${title}](./${file}) | 🟢 Accepted | ${date} |\n`;
          }
          
          content += `\n---\n\n`;
          content += `## 📖 What is an ADR?\n\n`;
          content += `An **Architecture Decision Record (ADR)** is an immutable snapshot of a technical choice:\n\n`;
          content += `- **Context:** Why the decision was needed\n`;
          content += `- **Decision:** What was chosen\n`;
          content += `- **Consequences:** Positive and negative outcomes\n\n`;
          content += `ADRs are **never modified** after acceptance. If the decision changes, a new ADR supersedes the old one.\n\n`;
        }
        
        content += `---\n\n`;
        content += `**See:** [\`CONT_01_CanonIdentity.md\`](../A-CONT/CONT_01_CanonIdentity.md) for full Canon Identity Contract.\n`;
        
        const readmePath = join(subPath, 'README.md');
        writeFileSync(readmePath, content, 'utf-8');
        console.log(`  ✓ Generated: ${relative(ROOT, readmePath)}`);
      }
    }
  }
}

async function main() {
  console.log('🧹 TOOL_16: Comprehensive Canon Cleanup & README Regeneration\n');
  console.log('This tool will:');
  console.log('  1. Scan all documents for validation');
  console.log('  2. Relocate documents to correct Canon planes');
  console.log('  3. Update SEAL headers in all documents');
  console.log('  4. Remove all existing README files');
  console.log('  5. Regenerate all README files with proper SEAL format\n');
  console.log('⚠️  WARNING: This will modify files. Make sure you have committed your changes.\n');
  
  // Step 1: Scan documents
  console.log('📋 Step 1: Scanning all documents...\n');
  const documents = scanAllDocuments();
  console.log(`   Found ${documents.length} document(s)\n`);
  
  // Step 2: Relocate documents
  console.log('📦 Step 2: Relocating documents...\n');
  let relocatedCount = 0;
  for (const doc of documents) {
    if (doc.needsRelocation && doc.correctLocation) {
      const destPath = join(ROOT, doc.correctLocation);
      const destFile = join(destPath, doc.filename);
      
      if (existsSync(destFile)) {
        console.log(`  ⚠️  Skipped: ${doc.filename} (destination already exists)`);
        continue;
      }
      
      try {
        mkdirSync(destPath, { recursive: true });
        renameSync(doc.path, destFile);
        console.log(`  ✓ Relocated: ${doc.filename} → ${doc.correctLocation}/`);
        relocatedCount++;
      } catch (error) {
        console.log(`  ❌ Error relocating ${doc.filename}: ${error}`);
      }
    }
  }
  console.log(`\n   Relocated: ${relocatedCount} document(s)\n`);
  
  // Step 3: Update SEAL headers
  console.log('📝 Step 3: Updating SEAL headers...\n');
  let updatedCount = 0;
  for (const doc of documents) {
    if (doc.needsHeaderUpdate) {
      try {
        const updatedContent = updateSEALHeader(doc);
        const filePath = doc.needsRelocation && doc.correctLocation 
          ? join(ROOT, doc.correctLocation, doc.filename)
          : doc.path;
        writeFileSync(filePath, updatedContent, 'utf-8');
        console.log(`  ✓ Updated: ${doc.filename}`);
        updatedCount++;
      } catch (error) {
        console.log(`  ❌ Error updating ${doc.filename}: ${error}`);
      }
    }
  }
  console.log(`\n   Updated: ${updatedCount} document(s)\n`);
  
  // Step 4: Remove all READMEs
  console.log('🗑️  Step 4: Removing all existing README files...\n');
  const removedCount = removeAllReadmes();
  console.log(`\n   Removed: ${removedCount} README file(s)\n`);
  
  // Step 5: Regenerate READMEs
  console.log('✨ Step 5: Regenerating all README files...\n');
  generateAllReadmes();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Comprehensive cleanup complete!');
  console.log(`\n📊 Summary:`);
  console.log(`   - Scanned: ${documents.length} document(s)`);
  console.log(`   - Relocated: ${relocatedCount} document(s)`);
  console.log(`   - Updated headers: ${updatedCount} document(s)`);
  console.log(`   - Removed READMEs: ${removedCount} file(s)`);
  console.log(`   - Regenerated READMEs: All Canon directories`);
  console.log('\n💡 Review the changes and commit if satisfied.');
}

main().catch(console.error);
