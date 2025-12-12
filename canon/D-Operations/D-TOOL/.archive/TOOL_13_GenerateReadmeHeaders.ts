#!/usr/bin/env tsx
/**
 * Generate README Headers with SEAL Format
 * 
 * Auto-generates README headers by parsing directory structure,
 * detecting SSOT documents, and applying standardized SEAL format.
 * 
 * Usage:
 *   npm run canon:generate-readme-headers
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, relative, basename } from 'path';

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

interface SSOTInfo {
  file: string;
  code: string;
  version?: string;
}

function detectSSOT(dirPath: string, plane: PlaneConfig): SSOTInfo | null {
  if (!existsSync(dirPath)) return null;
  
  const files = readdirSync(dirPath).filter(f => f.endsWith('.md'));
  
  // Look for CONT_01 as SSOT in Plane A
  if (plane.letter === 'A') {
    const cont01 = files.find(f => f.startsWith('CONT_01'));
    if (cont01) {
      const content = readFileSync(join(dirPath, cont01), 'utf-8');
      const versionMatch = content.match(/\*\*Version:\*\*\s*([\d.]+)/);
      return {
        file: cont01,
        code: 'CONT_01',
        version: versionMatch ? versionMatch[1] : undefined
      };
    }
  }
  
  return null;
}

function generateSEALHeader(dirPath: string, plane: PlaneConfig, ssot: SSOTInfo | null): string {
  const relativePath = relative(ROOT, dirPath);
  const date = new Date().toISOString().split('T')[0];
  
  let header = `> **🟢 [ACTIVE]** — Navigation Index\n`;
  header += `> **Canon Plane:** ${plane.letter}-${plane.name}\n`;
  header += `> **Prefixes:** ${plane.prefixes.join(', ')}\n`;
  header += `> **Location:** \`${relativePath}/\`\n`;
  
  if (ssot) {
    header += `> **SSOT:** [\`${ssot.file}\`](./${ssot.file}) — Single Source of Truth`;
    if (ssot.version) {
      header += ` (v${ssot.version})`;
    }
    header += `\n`;
  }
  
  header += `> **Auto-Generated:** ${date}\n`;
  header += `\n---\n\n`;
  
  return header;
}

function generateReadmeContent(dirPath: string, plane: PlaneConfig, ssot: SSOTInfo | null): string {
  const dirName = basename(dirPath);
  const sealHeader = generateSEALHeader(dirPath, plane, ssot);
  
  let content = sealHeader;
  content += `# ${dirName} — ${plane.description}\n\n`;
  
  // Add plane information
  content += `**Canon Plane:** ${plane.letter}-${plane.name}  \n`;
  content += `**Prefixes:** ${plane.prefixes.join(', ')}  \n`;
  content += `**Location:** \`${relative(ROOT, dirPath)}/\`\n\n`;
  
  // Add structure section
  content += `## 📁 Structure\n\n`;
  content += `This directory contains subdirectories for each prefix type:\n\n`;
  
  for (const prefix of plane.prefixes) {
    const subDir = `${plane.letter}-${plane.name}-${prefix}`;
    content += `- \`${subDir}/\` - ${prefix} files\n`;
  }
  
  content += `\n`;
  
  // Add SSOT section if applicable
  if (ssot) {
    content += `## 📜 Single Source of Truth (SSOT)\n\n`;
    content += `**SSOT Document:** [\`${ssot.file}\`](./${ssot.file})  \n`;
    if (ssot.version) {
      content += `**Version:** ${ssot.version}  \n`;
    }
    content += `\nThis is the authoritative specification document for this plane.\n\n`;
  }
  
  // Add self-teaching section
  content += `## 🎓 Self-Teaching\n\n`;
  content += `The directory name \`${dirName}\` tells you:\n`;
  content += `- **Plane Letter:** ${plane.letter} (sorts alphabetically)\n`;
  content += `- **Description:** ${plane.description}\n`;
  content += `- **Prefixes:** ${plane.prefixes.join(', ')}\n\n`;
  content += `No memorization needed - the folder structure IS the cheat sheet!\n\n`;
  content += `---\n\n`;
  
  // Add reference to CONT_01
  content += `**See:** [\`CONT_01_CanonIdentity.md\`](../A-Governance/A-CONT/CONT_01_CanonIdentity.md) for full Canon Identity Contract.\n`;
  
  return content;
}

function processDirectory(dirPath: string): void {
  const dirName = basename(dirPath);
  const plane = PLANE_CONFIGS[dirName];
  
  if (!plane) {
    console.log(`  ⏭️  Skipped: ${relative(ROOT, dirPath)} (not a main plane directory)`);
    return;
  }
  
  const readmePath = join(dirPath, 'README.md');
  const ssot = detectSSOT(dirPath, plane);
  
  try {
    const content = generateReadmeContent(dirPath, plane, ssot);
    writeFileSync(readmePath, content, 'utf-8');
    console.log(`  ✓ Generated: ${relative(ROOT, readmePath)}`);
    if (ssot) {
      console.log(`    └─ SSOT detected: ${ssot.file}`);
    }
  } catch (error) {
    console.log(`  ❌ Error: ${relative(ROOT, readmePath)} - ${error}`);
  }
}

async function main() {
  console.log('📝 TOOL_13: Generate README Headers with SEAL Format\n');
  console.log('Auto-generating README headers by parsing directory structure...\n');
  
  if (!existsSync(CANON_DIR)) {
    console.log('❌ Canon directory not found:', CANON_DIR);
    return;
  }
  
  console.log('📋 Processing directories:\n');
  
  const entries = readdirSync(CANON_DIR, { withFileTypes: true });
  const directories = entries
    .filter(e => e.isDirectory() && !e.name.startsWith('z-'))
    .map(e => join(CANON_DIR, e.name));
  
  for (const dir of directories) {
    processDirectory(dir);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ README header generation complete!');
  console.log('\n📊 Result:');
  console.log(`   - Processed ${directories.length} plane directory(ies)`);
  console.log('   - All README headers now use standardized SEAL format');
  console.log('   - SSOT documents automatically detected and referenced');
  console.log('\n💡 README headers are now auto-generated and follow the SEAL standard.');
}

main().catch(console.error);
