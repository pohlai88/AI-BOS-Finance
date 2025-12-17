#!/usr/bin/env npx tsx
/**
 * TOOL_10_ValidateBioTheme - Build-time theme validation
 * 
 * IMMORTAL Strategy - Layer 3: Build-time Defense
 * 
 * This script validates that:
 * 1. All tokens in BioThemeContract are defined in globals.css
 * 2. All tokens used in Tailwind config match the contract
 * 3. No orphan tokens exist (defined but not in contract)
 * 
 * Run: npx tsx scripts/TOOL_10_ValidateBioTheme.ts
 * 
 * Add to CI/CD pipeline to catch issues before deployment.
 */

import * as fs from 'fs';
import * as path from 'path';

// Colors for console output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

interface TokenDef {
  token: string;
  fallback: string;
  description: string;
}

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

// Load BioThemeContract
async function loadContract(): Promise<Record<string, Record<string, TokenDef>>> {
  // Import the contract
  const contractPath = path.resolve(__dirname, '../packages/bioskin/src/theme/BioThemeContract.ts');

  // Read and parse manually since it's TypeScript
  const content = fs.readFileSync(contractPath, 'utf-8');

  // Extract token definitions using regex (simplified approach)
  const tokenRegex = /token:\s*'([^']+)',\s*fallback:\s*'([^']+)'/g;
  const tokens: string[] = [];
  let match;

  while ((match = tokenRegex.exec(content)) !== null) {
    tokens.push(match[1]);
  }

  return { tokens: tokens.reduce((acc, t) => ({ ...acc, [t]: { token: t } }), {}) };
}

// Load globals.css and extract defined tokens
function loadCSSTokens(cssPath: string): Set<string> {
  const content = fs.readFileSync(cssPath, 'utf-8');
  const tokenRegex = /--color-[\w-]+/g;
  const tokens = new Set<string>();
  let match;

  while ((match = tokenRegex.exec(content)) !== null) {
    tokens.add(match[0]);
  }

  return tokens;
}

// Load Tailwind config and extract referenced tokens
function loadTailwindTokens(configPath: string): Set<string> {
  const content = fs.readFileSync(configPath, 'utf-8');
  const tokenRegex = /var\(([^)]+)\)/g;
  const tokens = new Set<string>();
  let match;

  while ((match = tokenRegex.exec(content)) !== null) {
    tokens.add(match[1]);
  }

  return tokens;
}

async function main(): Promise<void> {
  console.log('\n🎨 BioTheme Validation\n');
  console.log('='.repeat(60));

  const result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: [],
  };

  // Paths
  const rootDir = path.resolve(__dirname, '..');
  const globalsCssPath = path.join(rootDir, 'apps/web/src/styles/globals.css');
  const tailwindConfigPath = path.join(rootDir, 'apps/web/tailwind.config.js');
  const contractPath = path.join(rootDir, 'packages/bioskin/src/theme/BioThemeContract.ts');

  // Check files exist
  if (!fs.existsSync(globalsCssPath)) {
    result.errors.push(`globals.css not found at ${globalsCssPath}`);
  }
  if (!fs.existsSync(tailwindConfigPath)) {
    result.errors.push(`tailwind.config.js not found at ${tailwindConfigPath}`);
  }
  if (!fs.existsSync(contractPath)) {
    result.errors.push(`BioThemeContract.ts not found at ${contractPath}`);
  }

  if (result.errors.length > 0) {
    result.passed = false;
    printResult(result);
    process.exit(1);
  }

  // Load tokens
  console.log('\n📂 Loading token sources...');

  const contractContent = fs.readFileSync(contractPath, 'utf-8');
  const contractTokens: string[] = [];
  const contractRegex = /token:\s*'([^']+)'/g;
  let match;
  while ((match = contractRegex.exec(contractContent)) !== null) {
    contractTokens.push(match[1]);
  }
  console.log(`   Contract: ${contractTokens.length} tokens defined`);

  const cssTokens = loadCSSTokens(globalsCssPath);
  console.log(`   CSS: ${cssTokens.size} tokens found`);

  const tailwindTokens = loadTailwindTokens(tailwindConfigPath);
  console.log(`   Tailwind: ${tailwindTokens.size} token references`);

  // Validation 1: All contract tokens exist in CSS
  console.log('\n🔍 Checking contract tokens in CSS...');
  for (const token of contractTokens) {
    if (!cssTokens.has(token)) {
      result.errors.push(`Missing in CSS: ${token}`);
      result.passed = false;
    }
  }

  // Validation 2: All Tailwind references exist in CSS
  console.log('🔍 Checking Tailwind references in CSS...');
  for (const token of tailwindTokens) {
    if (token.startsWith('--color-') && !cssTokens.has(token)) {
      result.errors.push(`Tailwind references undefined token: ${token}`);
      result.passed = false;
    }
  }

  // Validation 3: Orphan tokens (in CSS but not in contract)
  console.log('🔍 Checking for orphan tokens...');
  for (const token of cssTokens) {
    if (!contractTokens.includes(token) && token.startsWith('--color-')) {
      // Only warn, don't fail - there may be legacy tokens
      result.warnings.push(`Orphan token in CSS (not in contract): ${token}`);
    }
  }

  // Print results
  printResult(result);

  process.exit(result.passed ? 0 : 1);
}

function printResult(result: ValidationResult): void {
  console.log('\n' + '='.repeat(60));

  if (result.errors.length > 0) {
    console.log(`\n${RED}❌ ERRORS (${result.errors.length}):${RESET}`);
    result.errors.forEach(e => console.log(`   ${RED}• ${e}${RESET}`));
  }

  if (result.warnings.length > 0) {
    console.log(`\n${YELLOW}⚠️  WARNINGS (${result.warnings.length}):${RESET}`);
    result.warnings.slice(0, 10).forEach(w => console.log(`   ${YELLOW}• ${w}${RESET}`));
    if (result.warnings.length > 10) {
      console.log(`   ${YELLOW}... and ${result.warnings.length - 10} more${RESET}`);
    }
  }

  if (result.passed) {
    console.log(`\n${GREEN}✅ VALIDATION PASSED${RESET}`);
    console.log('   All theme tokens are properly synchronized.\n');
  } else {
    console.log(`\n${RED}❌ VALIDATION FAILED${RESET}`);
    console.log('   Fix the errors above and run again.\n');
  }
}

main().catch((err) => {
  console.error(`${RED}Fatal error:${RESET}`, err);
  process.exit(1);
});
