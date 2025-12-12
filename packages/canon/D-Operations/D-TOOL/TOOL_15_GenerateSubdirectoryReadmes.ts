#!/usr/bin/env tsx
/**
 * Generate Subdirectory README Headers
 * 
 * Generates README headers for subdirectories (A-CONT, A-ADR, etc.)
 * with SEAL format and auto-detected content.
 * 
 * Usage:
 *   npm run canon:generate-subdirectory-readmes
 */

import { existsSync, readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, relative, basename } from 'path';

const ROOT = process.cwd();
const CANON_DIR = join(ROOT, 'canon');

interface SubdirectoryInfo {
  path: string;
  plane: string;
  prefix: string;
  files: string[];
  ssot?: string;
}

function detectSubdirectories(): SubdirectoryInfo[] {
  const subdirs: SubdirectoryInfo[] = [];
  
  // Scan A-Governance subdirectories
  const aGovPath = join(CANON_DIR, 'A-Governance');
  if (existsSync(aGovPath)) {
    const entries = readdirSync(aGovPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('A-')) {
        const prefix = entry.name.replace('A-', '');
        const subPath = join(aGovPath, entry.name);
        const files = readdirSync(subPath).filter(f => f.endsWith('.md') && f !== 'README.md');
        
        // Detect SSOT (CONT_01 for A-CONT)
        let ssot: string | undefined;
        if (prefix === 'CONT') {
          const cont01 = files.find(f => f.startsWith('CONT_01'));
          if (cont01) ssot = cont01;
        }
        
        subdirs.push({
          path: subPath,
          plane: 'A-Governance',
          prefix,
          files,
          ssot
        });
      }
    }
  }
  
  return subdirs;
}

function generateSubdirectoryReadme(info: SubdirectoryInfo): string {
  const date = new Date().toISOString().split('T')[0];
  const relativePath = relative(ROOT, info.path);
  
  let content = `> **🟢 [ACTIVE]** — Navigation Index\n`;
  content += `> **Canon Plane:** ${info.plane}\n`;
  content += `> **Prefixes:** ${info.prefix}\n`;
  content += `> **Location:** \`${relativePath}/\`\n`;
  
  if (info.ssot) {
    content += `> **SSOT:** [\`${info.ssot}\`](./${info.ssot}) — Single Source of Truth\n`;
  }
  
  content += `> **Auto-Generated:** ${date}\n`;
  content += `\n---\n\n`;
  
  // Title
  const title = info.prefix === 'CONT' ? 'Canon Contracts' : 
                info.prefix === 'ADR' ? 'Architecture Decision Records (ADRs)' :
                `${info.prefix} Documents`;
  content += `# ${title}\n\n`;
  
  // SSOT section if applicable
  if (info.ssot) {
    content += `## 📜 Single Source of Truth (SSOT)\n\n`;
    content += `**SSOT Document:** [\`${info.ssot}\`](./${info.ssot})  \n`;
    content += `\nThis is the authoritative specification document.\n\n`;
    content += `---\n\n`;
  }
  
  // Active documents table
  if (info.prefix === 'CONT') {
    content += `## 📜 Active Contracts (Plane A — Governance)\n\n`;
    content += `| Canon Code | Document | Status | Version |\n`;
    content += `|------------|----------|--------|---------|\n`;
    
    for (const file of info.files.filter(f => f.startsWith('CONT_'))) {
      const code = file.replace('.md', '').replace('_', '_');
      const contentPreview = readFileSync(join(info.path, file), 'utf-8');
      const versionMatch = contentPreview.match(/\*\*Version:\*\*\s*([\d.]+)/);
      const version = versionMatch ? versionMatch[1] : 'N/A';
      content += `| **${code}** | [${code}](./${file}) | 🟢 ACTIVE | ${version} |\n`;
    }
    
    content += `\n---\n\n`;
    content += `## 📋 Architecture Decision Records (ADRs)\n\n`;
    content += `See: [../A-ADR/README.md](../A-ADR/README.md)\n\n`;
    
  } else if (info.prefix === 'ADR') {
    content += `## 📋 Active ADRs\n\n`;
    content += `| Canon Code | Title | Status | Date |\n`;
    content += `|------------|-------|--------|------|\n`;
    
    for (const file of info.files.filter(f => f.startsWith('ADR_'))) {
      const code = file.replace('.md', '');
      const contentPreview = readFileSync(join(info.path, file), 'utf-8');
      const titleMatch = contentPreview.match(/#\s*(ADR_\d+):\s*(.+)/);
      const dateMatch = contentPreview.match(/\*\*Date:\*\*\s*(\d{4}-\d{2}-\d{2})/);
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
  
  // Reference to CONT_01
  content += `---\n\n`;
  content += `**See:** [\`CONT_01_CanonIdentity.md\`](../A-CONT/CONT_01_CanonIdentity.md) for full Canon Identity Contract.\n`;
  
  return content;
}

async function main() {
  console.log('📝 TOOL_15: Generate Subdirectory README Headers\n');
  console.log('Generating README headers for subdirectories with SEAL format...\n');
  
  const subdirs = detectSubdirectories();
  
  if (subdirs.length === 0) {
    console.log('⚠️  No subdirectories found.');
    return;
  }
  
  console.log('📋 Processing subdirectories:\n');
  
  for (const info of subdirs) {
    try {
      const content = generateSubdirectoryReadme(info);
      const readmePath = join(info.path, 'README.md');
      writeFileSync(readmePath, content, 'utf-8');
      console.log(`  ✓ Generated: ${relative(ROOT, readmePath)}`);
      if (info.ssot) {
        console.log(`    └─ SSOT: ${info.ssot}`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${relative(ROOT, info.path)} - ${error}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Subdirectory README generation complete!');
  console.log(`\n📊 Result: ${subdirs.length} subdirectory(ies) processed`);
}

main().catch(console.error);
