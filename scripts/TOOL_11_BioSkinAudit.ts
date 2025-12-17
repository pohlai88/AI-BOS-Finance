#!/usr/bin/env npx tsx
/**
 * TOOL_11_BioSkinAudit - BioSkin MCP CLI Auditor
 * 
 * Run comprehensive UI/UX audits using the BioSkin MCP.
 * 
 * Usage:
 *   npx tsx scripts/TOOL_11_BioSkinAudit.ts [command] [options]
 * 
 * Commands:
 *   audit       Run full 360° audit (default)
 *   validate    Validate theme tokens only
 *   scan        Scan for Tailwind token usage
 *   component   Audit a specific component
 *   fix         Generate fix for missing token
 * 
 * Examples:
 *   npx tsx scripts/TOOL_11_BioSkinAudit.ts
 *   npx tsx scripts/TOOL_11_BioSkinAudit.ts validate
 *   npx tsx scripts/TOOL_11_BioSkinAudit.ts component packages/bioskin/src/organisms/BioForm/BioFormField.tsx
 *   npx tsx scripts/TOOL_11_BioSkinAudit.ts fix elevated '#262629' surfaces
 */

import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

// Import BioSkinMCP (dynamic to handle path)
async function loadMCP() {
  const rootDir = path.resolve(__dirname, '..');

  // Since we can't directly import TS, we'll inline the core logic
  const fs = await import('fs');

  return {
    rootDir,
    fs: fs.default,
  };
}

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

async function validateTheme(rootDir: string, fs: typeof import('fs')): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  const globalsCssPath = path.join(rootDir, 'apps/web/src/styles/globals.css');
  const tailwindConfigPath = path.join(rootDir, 'apps/web/tailwind.config.js');
  const contractPath = path.join(rootDir, 'packages/bioskin/src/theme/BioThemeContract.ts');

  // Check files exist
  if (!fs.existsSync(contractPath)) {
    issues.push({
      type: 'error',
      code: 'MISSING_CONTRACT',
      message: 'BioThemeContract.ts not found',
      suggestion: 'Create packages/bioskin/src/theme/BioThemeContract.ts',
    });
    return issues;
  }

  // Extract tokens from contract
  const contractContent = fs.readFileSync(contractPath, 'utf-8');
  const contractTokens: string[] = [];
  const tokenRegex = /token:\s*'([^']+)'/g;
  let match;
  while ((match = tokenRegex.exec(contractContent)) !== null) {
    contractTokens.push(match[1]);
  }

  console.log(`${CYAN}Found ${contractTokens.length} tokens in contract${RESET}`);

  // Check CSS
  if (fs.existsSync(globalsCssPath)) {
    const cssContent = fs.readFileSync(globalsCssPath, 'utf-8');
    for (const token of contractTokens) {
      if (!cssContent.includes(token)) {
        issues.push({
          type: 'error',
          code: 'MISSING_CSS_TOKEN',
          message: `Token ${token} not in globals.css`,
          file: 'apps/web/src/styles/globals.css',
          suggestion: `Add: ${token}: #HEX;`,
        });
      }
    }
  } else {
    issues.push({
      type: 'error',
      code: 'MISSING_CSS',
      message: 'globals.css not found',
    });
  }

  // Check Tailwind
  if (fs.existsSync(tailwindConfigPath)) {
    const tailwindContent = fs.readFileSync(tailwindConfigPath, 'utf-8');
    for (const token of contractTokens) {
      if (!tailwindContent.includes(token)) {
        issues.push({
          type: 'warning',
          code: 'MISSING_TAILWIND',
          message: `Token ${token} may not be in tailwind.config.js`,
          file: 'apps/web/tailwind.config.js',
        });
      }
    }
  }

  return issues;
}

async function scanComponents(rootDir: string, fs: typeof import('fs')): Promise<{ file: string; tokens: string[] }[]> {
  const results: { file: string; tokens: string[] }[] = [];

  const scanDir = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== '__tests__') {
        scanDir(fullPath);
      } else if (entry.isFile() && /\.tsx?$/.test(entry.name) && !entry.name.includes('.test.')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const tokens: string[] = [];

        // Find token usages
        const patterns = [
          /bg-surface-(\w+)/g,
          /text-text-(\w+)/g,
          /border-border-(\w+)/g,
          /ring-accent-(\w+)/g,
          /text-status-(\w+)/g,
          /bg-status-(\w+)/g,
        ];

        for (const pattern of patterns) {
          let match;
          while ((match = pattern.exec(content)) !== null) {
            tokens.push(match[0]);
          }
        }

        if (tokens.length > 0) {
          results.push({
            file: fullPath.replace(rootDir + path.sep, ''),
            tokens: [...new Set(tokens)],
          });
        }
      }
    }
  };

  scanDir(path.join(rootDir, 'packages/bioskin/src'));
  return results;
}

function printIssues(issues: ValidationIssue[]): void {
  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');
  const infos = issues.filter(i => i.type === 'info');

  if (errors.length > 0) {
    console.log(`\n${RED}${BOLD}❌ ERRORS (${errors.length})${RESET}`);
    for (const issue of errors) {
      console.log(`   ${RED}[${issue.code}]${RESET} ${issue.message}`);
      if (issue.file) console.log(`      ${CYAN}File: ${issue.file}${RESET}`);
      if (issue.suggestion) console.log(`      ${GREEN}Fix: ${issue.suggestion}${RESET}`);
    }
  }

  if (warnings.length > 0) {
    console.log(`\n${YELLOW}${BOLD}⚠️  WARNINGS (${warnings.length})${RESET}`);
    for (const issue of warnings.slice(0, 10)) {
      console.log(`   ${YELLOW}[${issue.code}]${RESET} ${issue.message}`);
    }
    if (warnings.length > 10) {
      console.log(`   ${YELLOW}... and ${warnings.length - 10} more${RESET}`);
    }
  }

  if (infos.length > 0 && process.argv.includes('--verbose')) {
    console.log(`\n${BLUE}ℹ️  INFO (${infos.length})${RESET}`);
    for (const issue of infos.slice(0, 5)) {
      console.log(`   ${BLUE}[${issue.code}]${RESET} ${issue.message}`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'audit';

  console.log(`\n${BOLD}🧬 BioSkin Audit Tool${RESET}`);
  console.log('='.repeat(50));

  const { rootDir, fs } = await loadMCP();

  switch (command) {
    case 'validate': {
      console.log(`\n${CYAN}Validating theme tokens...${RESET}`);
      const issues = await validateTheme(rootDir, fs);
      printIssues(issues);

      if (issues.filter(i => i.type === 'error').length === 0) {
        console.log(`\n${GREEN}✅ Theme validation passed${RESET}`);
      } else {
        console.log(`\n${RED}❌ Theme validation failed${RESET}`);
        process.exit(1);
      }
      break;
    }

    case 'scan': {
      console.log(`\n${CYAN}Scanning component token usage...${RESET}`);
      const results = await scanComponents(rootDir, fs);

      console.log(`\n${BOLD}Token Usage Report${RESET}`);
      for (const result of results.slice(0, 20)) {
        console.log(`\n${CYAN}${result.file}${RESET}`);
        for (const token of result.tokens) {
          console.log(`   • ${token}`);
        }
      }

      if (results.length > 20) {
        console.log(`\n... and ${results.length - 20} more files`);
      }

      console.log(`\n${GREEN}Scanned ${results.length} files with token usage${RESET}`);
      break;
    }

    case 'component': {
      const filePath = args[1];
      if (!filePath) {
        console.log(`${RED}Usage: audit component <file-path>${RESET}`);
        process.exit(1);
      }
      console.log(`\n${CYAN}Auditing component: ${filePath}${RESET}`);
      // Component audit logic here
      break;
    }

    case 'fix': {
      const [, tokenName, tokenValue, category] = args;
      if (!tokenName || !tokenValue || !category) {
        console.log(`${RED}Usage: audit fix <tokenName> <tokenValue> <category>${RESET}`);
        console.log(`Example: audit fix elevated '#262629' surfaces`);
        process.exit(1);
      }

      const cssVar = `--color-${category}-${tokenName}`;
      console.log(`\n${CYAN}Generated fixes for token: ${tokenName}${RESET}`);
      console.log(`\n${BOLD}1. Add to BioThemeContract.ts:${RESET}`);
      console.log(`   ${tokenName}: { token: '${cssVar}', fallback: '${tokenValue}', description: '${tokenName}' },`);
      console.log(`\n${BOLD}2. Add to globals.css:${RESET}`);
      console.log(`   ${cssVar}: ${tokenValue};`);
      console.log(`\n${BOLD}3. Add to tailwind.config.js:${RESET}`);
      console.log(`   '${category}-${tokenName}': 'var(${cssVar})',`);
      break;
    }

    case 'audit':
    default: {
      console.log(`\n${CYAN}Running full 360° audit...${RESET}`);

      // Theme validation
      console.log(`\n${BOLD}[1/2] Theme Token Validation${RESET}`);
      const themeIssues = await validateTheme(rootDir, fs);
      printIssues(themeIssues);

      // Component scan
      console.log(`\n${BOLD}[2/2] Component Token Scan${RESET}`);
      const scanResults = await scanComponents(rootDir, fs);
      console.log(`   Found ${scanResults.length} components using theme tokens`);

      // Summary
      const errorCount = themeIssues.filter(i => i.type === 'error').length;
      const warningCount = themeIssues.filter(i => i.type === 'warning').length;

      console.log('\n' + '='.repeat(50));
      if (errorCount === 0) {
        console.log(`${GREEN}${BOLD}✅ AUDIT PASSED${RESET}`);
        console.log(`   ${warningCount} warnings (non-blocking)`);
      } else {
        console.log(`${RED}${BOLD}❌ AUDIT FAILED${RESET}`);
        console.log(`   ${errorCount} errors, ${warningCount} warnings`);
        process.exit(1);
      }
      break;
    }
  }

  console.log('');
}

main().catch((err) => {
  console.error(`${RED}Fatal error:${RESET}`, err);
  process.exit(1);
});
