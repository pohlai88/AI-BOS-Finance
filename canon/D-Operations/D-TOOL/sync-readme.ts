#!/usr/bin/env tsx
/**
 * Canon Identity Contract - README Sync Script
 * 
 * Synchronizes README.md from CANON_IDENTITY_CONTRACT_v2.2.0.md (SSOT)
 * 
 * This ensures README always matches the contract version and status.
 * 
 * Usage:
 *   npm run canon:sync-readme
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface ContractMetadata {
  version: string;
  status: string;
  lastUpdated: string;
  changelog: string[];
}

function extractContractMetadata(contractPath: string): ContractMetadata {
  const content = readFileSync(contractPath, 'utf-8');
  
  // Extract version
  const versionMatch = content.match(/\*\*Version:\*\*\s+(\d+\.\d+\.\d+)/);
  const version = versionMatch ? versionMatch[1] : 'unknown';
  
  // Extract status
  const statusMatch = content.match(/\*\*Status:\*\*\s+([^\n]+)/);
  const status = statusMatch ? statusMatch[1].trim() : 'unknown';
  
  // Extract last updated
  const lastUpdatedMatch = content.match(/\*\*Last Updated:\*\*\s+([^\n]+)/);
  const lastUpdated = lastUpdatedMatch ? lastUpdatedMatch[1].trim() : new Date().toISOString().split('T')[0];
  
  // Validate date format (YYYY-MM-DD) and use current date if invalid
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const finalLastUpdated = dateRegex.test(lastUpdated) ? lastUpdated : new Date().toISOString().split('T')[0];
  
  // Extract changelog (simplified - just version numbers)
  const changelogMatches = content.matchAll(/- \*\*v(\d+\.\d+\.\d+)\*\*/g);
  const changelog = Array.from(changelogMatches, m => `v${m[1]}`);
  
  return {
    version,
    status,
    lastUpdated: finalLastUpdated,
    changelog,
  };
}

function generateReadme(metadata: ContractMetadata, contractFilename: string): string {
  const version = metadata.version;
  const status = metadata.status;
  const lastUpdated = metadata.lastUpdated;
  
  return `# Canon Identity Contract Documentation

> **⚠️ IMPORTANT:** This README is a **navigation/index document** derived from the main contract.  
> **Single Source of Truth (SSOT):** \`${contractFilename}\`  
> For all technical specifications, refer to the contract, not this README.

**Current Version:** v${version}  
**Status:** ${status}  
**Last Updated:** ${lastUpdated}  
**SSOT:** \`${contractFilename}\`

---

## 📚 Active Documents

### Main Contract
- **\`${contractFilename}\`** - Current production-ready Canon Identity Contract (SSOT)
  - Next.js App Router integration
  - Complete YAML templates
  - TypeScript type definitions
  - Implementation patterns

### Supporting Documents (Reference)
- **\`SSOT_DEFINITION.md\`** - Single Source of Truth definition and sync rules
- **\`NEXTJS_IMPLEMENTATION_REVIEW.md\`** - Next.js MCP review and recommendations
- **\`SECURITY_ARCHITECTURE_REVIEW.md\`** - Security & architecture review

---

## 📦 Archived Documents

Legacy versions and superseded documents are archived in the \`archive/\` directory:

- \`CANON_IDENTITY_CONTRACT_v1.0.0.md\` - Original specification
- \`CANON_IDENTITY_CONTRACT_v2.0.0.md\` - Intermediate version (superseded by v${version})
- \`CANON_IDENTITY_CONTRACT_v2.0.1.md\` - Security & architecture enhancements (superseded by v${version})
- \`EVALUATION_CANON_CONTRACT.md\` - Initial evaluation (superseded by Next.js review)

See \`archive/README.md\` for detailed archive information.

---

## 🚀 Quick Start

1. **Read the Contract (SSOT):** Start with \`${contractFilename}\`
2. **Understand SSOT:** See \`SSOT_DEFINITION.md\`
3. **Review Next.js Integration:** Check \`NEXTJS_IMPLEMENTATION_REVIEW.md\`
4. **Review Security:** Check \`SECURITY_ARCHITECTURE_REVIEW.md\`

---

## 📋 Version History

- **v1.0.0** - Original specification (archived)
- **v2.0.0** - Next.js integration with technical issues (archived)
- **v2.0.1** - Security & architecture enhancements (archived)
- **v${version}** - Implementation complete (Enforcer + Generator) ✅ (current)

---

## 🔄 Synchronization

This README is automatically synchronized from the contract (SSOT).

**To sync manually:**
\`\`\`bash
npm run canon:sync-readme
\`\`\`

**SSOT:** \`${contractFilename}\`  
**Derived:** \`README.md\` (this file)

---

**For implementation, use v${version} only.**
`;
}

async function main() {
  console.log('🔄 Syncing README from contract (SSOT)...\n');
  
  try {
    const contractPath = join(process.cwd(), 'canon/A-Governance/A-CONT', 'CANON_IDENTITY_CONTRACT_v2.2.0.md');
    const readmePath = join(process.cwd(), 'canon/A-Governance/A-CONT', 'README.md');
    
    // Extract metadata from contract (SSOT)
    const metadata = extractContractMetadata(contractPath);
    
    console.log(`📋 Extracted from contract (SSOT):`);
    console.log(`   Version: ${metadata.version}`);
    console.log(`   Status: ${metadata.status}`);
    console.log(`   Last Updated: ${metadata.lastUpdated}\n`);
    
    // Generate README
    const readmeContent = generateReadme(metadata, 'CANON_IDENTITY_CONTRACT_v2.2.0.md');
    
    // Write README
    writeFileSync(readmePath, readmeContent, 'utf-8');
    
    console.log(`✅ README synchronized from contract (SSOT)`);
    console.log(`   Contract: ${contractPath}`);
    console.log(`   README: ${readmePath}`);
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
main().catch(console.error);

export { extractContractMetadata, generateReadme };

