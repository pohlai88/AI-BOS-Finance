#!/usr/bin/env npx tsx
/**
 * TOOL_12_BioSkinDeepScan - Deep Scan All BioSkin Components
 * 
 * Scans every component, detects anomalies, and generates a report.
 */

import * as fs from 'fs';
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
const MAGENTA = '\x1b[35m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

interface ScanResult {
  file: string;
  layer: string;
  healthScore: number;
  lineCount: number;
  issues: Issue[];
  patterns: string[];
}

interface Issue {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  line?: number;
}

interface ScanSummary {
  totalFiles: number;
  totalIssues: number;
  errors: number;
  warnings: number;
  infos: number;
  avgHealthScore: number;
  byLayer: Record<string, { files: number; issues: number; avgHealth: number }>;
}

// Files that are EXCEPTIONS (allowed to break rules)
const EXCEPTIONS = {
  // These files are allowed hardcoded colors (they ARE the token definitions)
  allowHardcodedColors: [
    'BioThemeContract.ts',
    'BioThemeGuard.tsx',
    'BioSkinKnowledgeContract.ts',
  ],
  // These files are allowed console.log (they are CLI/MCP tools)
  allowConsoleLog: [
    'BioSkinMCP.ts',
    'BioSkinMCPEnhanced.ts',
    'BioRegistry.ts',
  ],
  // These files are allowed direct DOM access (legitimate use cases)
  allowDirectDOM: [
    'BioSpotlight.tsx',     // Needs querySelector for tooltip positioning
    'BioTour.tsx',          // Needs querySelector for tour step targeting
    'BioPrintTemplate.tsx', // Needs DOM for injecting print styles
    'BioSkinKnowledgeContract.ts', // Just documentation example
  ],
};

// Anti-patterns to detect
const ANTI_PATTERNS = {
  hardcodedColors: {
    pattern: /#[0-9A-Fa-f]{6}(?![0-9A-Fa-f])/g,
    severity: 'warning' as const,
    message: 'Hardcoded hex color',
    exceptions: EXCEPTIONS.allowHardcodedColors,
  },
  inlineStyles: {
    pattern: /style=\{/g,
    severity: 'warning' as const,
    message: 'Inline style detected',
    exceptions: [],
  },
  anyType: {
    pattern: /:\s*any\b/g,
    severity: 'warning' as const,
    message: 'any type detected',
    exceptions: [],
  },
  consoleLog: {
    pattern: /console\.(log|warn|error)\(/g,
    severity: 'info' as const,
    message: 'Console statement',
    exceptions: EXCEPTIONS.allowConsoleLog,
  },
  todoComment: {
    pattern: /\/\/\s*(TODO|FIXME|HACK|XXX)/gi,
    severity: 'info' as const,
    message: 'Unresolved TODO/FIXME',
    exceptions: [],
  },
  directDOM: {
    pattern: /document\.(getElementById|querySelector)/g,
    severity: 'error' as const,
    message: 'Direct DOM manipulation',
    exceptions: EXCEPTIONS.allowDirectDOM,
  },
  eslintDisable: {
    pattern: /eslint-disable/g,
    severity: 'info' as const,
    message: 'ESLint rule disabled',
    exceptions: [],
  },
};

// Good patterns to detect
const GOOD_PATTERNS = [
  { pattern: /\.displayName\s*=/, name: 'displayName' },
  { pattern: /forwardRef/, name: 'forwardRef' },
  { pattern: /cn\(/, name: 'cn utility' },
  { pattern: /'use client'|"use client"/, name: 'use client' },
  { pattern: /export default/, name: 'default export' },
  { pattern: /interface\s+\w+Props/, name: 'Props interface' },
  { pattern: /aria-/, name: 'aria attributes' },
  { pattern: /bg-surface-|text-text-|border-border-/, name: 'design tokens' },
  { pattern: /React\.(memo|useCallback|useMemo)/, name: 'memoization' },
  { pattern: /data-testid/, name: 'test id' },
];

// Structure rules by layer
const LAYER_RULES = {
  atoms: { maxLines: 150, maxProps: 10 },
  molecules: { maxLines: 300, maxProps: 15 },
  organisms: { maxLines: 800, maxProps: 25 },
};

function detectLayer(filePath: string): string {
  if (filePath.includes('/atoms/') || filePath.includes('\\atoms\\')) return 'atoms';
  if (filePath.includes('/molecules/') || filePath.includes('\\molecules\\')) return 'molecules';
  if (filePath.includes('/organisms/') || filePath.includes('\\organisms\\')) return 'organisms';
  return 'unknown';
}

function scanFile(filePath: string, rootDir: string): ScanResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = filePath.replace(rootDir + path.sep, '');
  const layer = detectLayer(relativePath);
  const lineCount = content.split('\n').length;
  const issues: Issue[] = [];
  const patterns: string[] = [];

  // Check anti-patterns
  const fileName = path.basename(filePath);
  for (const [name, config] of Object.entries(ANTI_PATTERNS)) {
    // Skip if this file is an exception for this pattern
    if (config.exceptions && config.exceptions.some(exc => fileName.includes(exc))) {
      continue;
    }

    const matches = content.match(config.pattern);
    if (matches) {
      for (const match of matches) {
        const lineNum = content.substring(0, content.indexOf(match)).split('\n').length;
        issues.push({
          type: config.severity,
          code: name.toUpperCase(),
          message: `${config.message}: ${match.substring(0, 30)}`,
          line: lineNum,
        });
      }
    }
  }

  // Check good patterns
  for (const p of GOOD_PATTERNS) {
    if (p.pattern.test(content)) {
      patterns.push(p.name);
    }
  }

  // Check layer rules
  const rules = LAYER_RULES[layer as keyof typeof LAYER_RULES];
  if (rules) {
    if (lineCount > rules.maxLines) {
      issues.push({
        type: 'warning',
        code: 'MAX_LINES',
        message: `${lineCount} lines exceeds max ${rules.maxLines} for ${layer}`,
      });
    }
  }

  // Check for missing 'use client' with hooks
  // Skip hook files (use*.ts/tsx) - they don't need 'use client'
  const isHookFile = /^use[A-Z]/.test(path.basename(filePath));
  const isProviderFile = filePath.includes('Provider');
  const isTypeFile = filePath.endsWith('.ts') && !filePath.endsWith('.tsx');

  if (!isHookFile && !isProviderFile && !isTypeFile) {
    const usesHooks = /\b(useState|useEffect|useContext|useReducer|useCallback|useMemo|useRef)\b/.test(content);
    const hasUseClient = /'use client'|"use client"/.test(content);
    if (usesHooks && !hasUseClient) {
      issues.push({
        type: 'error',
        code: 'MISSING_USE_CLIENT',
        message: "Uses React hooks but missing 'use client'",
      });
    }
  }

  // Calculate health score
  const normalCount = patterns.length;
  const abnormalCount = issues.length;
  const healthScore = normalCount > 0 ? Math.round((normalCount / (normalCount + abnormalCount)) * 100) : 50;

  return {
    file: relativePath,
    layer,
    healthScore,
    lineCount,
    issues,
    patterns,
  };
}

function scanDirectory(dir: string, rootDir: string): ScanResult[] {
  const results: ScanResult[] = [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== '__tests__') {
        results.push(...scanDirectory(fullPath, rootDir));
      }
    } else if (entry.isFile() && /\.tsx?$/.test(entry.name) && !entry.name.includes('.test.')) {
      results.push(scanFile(fullPath, rootDir));
    }
  }

  return results;
}

function generateSummary(results: ScanResult[]): ScanSummary {
  const byLayer: Record<string, { files: number; issues: number; totalHealth: number }> = {};

  let totalIssues = 0;
  let errors = 0;
  let warnings = 0;
  let infos = 0;
  let totalHealth = 0;

  for (const r of results) {
    totalIssues += r.issues.length;
    totalHealth += r.healthScore;

    for (const issue of r.issues) {
      if (issue.type === 'error') errors++;
      else if (issue.type === 'warning') warnings++;
      else infos++;
    }

    if (!byLayer[r.layer]) {
      byLayer[r.layer] = { files: 0, issues: 0, totalHealth: 0 };
    }
    byLayer[r.layer].files++;
    byLayer[r.layer].issues += r.issues.length;
    byLayer[r.layer].totalHealth += r.healthScore;
  }

  // Calculate averages
  const avgHealthScore = results.length > 0 ? Math.round(totalHealth / results.length) : 0;
  const byLayerWithAvg: Record<string, { files: number; issues: number; avgHealth: number }> = {};
  for (const [layer, data] of Object.entries(byLayer)) {
    byLayerWithAvg[layer] = {
      files: data.files,
      issues: data.issues,
      avgHealth: data.files > 0 ? Math.round(data.totalHealth / data.files) : 0,
    };
  }

  return {
    totalFiles: results.length,
    totalIssues,
    errors,
    warnings,
    infos,
    avgHealthScore,
    byLayer: byLayerWithAvg,
  };
}

function printResults(results: ScanResult[], summary: ScanSummary): void {
  console.log(`\n${BOLD}${CYAN}🧬 BioSkin Deep Scan Results${RESET}`);
  console.log('═'.repeat(60));

  // Summary
  console.log(`\n${BOLD}📊 Summary${RESET}`);
  console.log(`   Files scanned: ${summary.totalFiles}`);
  console.log(`   Average health: ${summary.avgHealthScore >= 80 ? GREEN : summary.avgHealthScore >= 60 ? YELLOW : RED}${summary.avgHealthScore}%${RESET}`);
  console.log(`   Total issues: ${summary.totalIssues}`);
  console.log(`     ❌ Errors: ${summary.errors > 0 ? RED : GREEN}${summary.errors}${RESET}`);
  console.log(`     ⚠️  Warnings: ${summary.warnings > 0 ? YELLOW : GREEN}${summary.warnings}${RESET}`);
  console.log(`     ℹ️  Info: ${summary.infos}`);

  // By Layer
  console.log(`\n${BOLD}📁 By Layer${RESET}`);
  for (const [layer, data] of Object.entries(summary.byLayer)) {
    const healthColor = data.avgHealth >= 80 ? GREEN : data.avgHealth >= 60 ? YELLOW : RED;
    console.log(`   ${CYAN}${layer.padEnd(12)}${RESET} ${data.files} files, ${data.issues} issues, ${healthColor}${data.avgHealth}% health${RESET}`);
  }

  // Top issues
  const issuesByType = new Map<string, number>();
  for (const r of results) {
    for (const issue of r.issues) {
      issuesByType.set(issue.code, (issuesByType.get(issue.code) || 0) + 1);
    }
  }

  if (issuesByType.size > 0) {
    console.log(`\n${BOLD}🔍 Top Issues${RESET}`);
    const sorted = [...issuesByType.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    for (const [code, count] of sorted) {
      console.log(`   ${YELLOW}${code.padEnd(20)}${RESET} ${count} occurrences`);
    }
  }

  // Files with most issues
  const filesWithIssues = results.filter(r => r.issues.length > 0).sort((a, b) => b.issues.length - a.issues.length);
  if (filesWithIssues.length > 0) {
    console.log(`\n${BOLD}📄 Files Needing Attention${RESET}`);
    for (const r of filesWithIssues.slice(0, 10)) {
      const healthColor = r.healthScore >= 80 ? GREEN : r.healthScore >= 60 ? YELLOW : RED;
      console.log(`   ${DIM}[${r.layer}]${RESET} ${r.file}`);
      console.log(`      Health: ${healthColor}${r.healthScore}%${RESET}, Issues: ${r.issues.length}, Lines: ${r.lineCount}`);

      // Show first 3 issues
      for (const issue of r.issues.slice(0, 3)) {
        const issueColor = issue.type === 'error' ? RED : issue.type === 'warning' ? YELLOW : BLUE;
        console.log(`      ${issueColor}• ${issue.code}: ${issue.message}${RESET}`);
      }
      if (r.issues.length > 3) {
        console.log(`      ${DIM}... and ${r.issues.length - 3} more${RESET}`);
      }
    }
  }

  // Healthiest files
  const healthiest = results.filter(r => r.healthScore >= 90).sort((a, b) => b.healthScore - a.healthScore);
  if (healthiest.length > 0) {
    console.log(`\n${BOLD}${GREEN}✨ Healthiest Components (≥90%)${RESET}`);
    for (const r of healthiest.slice(0, 5)) {
      console.log(`   ${GREEN}${r.healthScore}%${RESET} ${r.file}`);
      console.log(`      ${DIM}Good patterns: ${r.patterns.join(', ')}${RESET}`);
    }
  }

  // Final verdict
  console.log('\n' + '═'.repeat(60));
  if (summary.errors === 0 && summary.avgHealthScore >= 70) {
    console.log(`${GREEN}${BOLD}✅ SCAN COMPLETE - System is HEALTHY${RESET}`);
  } else if (summary.errors > 0) {
    console.log(`${RED}${BOLD}❌ SCAN COMPLETE - ${summary.errors} ERRORS require attention${RESET}`);
  } else {
    console.log(`${YELLOW}${BOLD}⚠️ SCAN COMPLETE - ${summary.warnings} warnings to review${RESET}`);
  }
  console.log('');
}

async function main(): Promise<void> {
  const rootDir = path.resolve(__dirname, '..');
  const bioskinDir = path.join(rootDir, 'packages/bioskin/src');

  console.log(`\n${BOLD}🧬 BioSkin Deep Scan${RESET}`);
  console.log(`Scanning: ${bioskinDir}\n`);

  if (!fs.existsSync(bioskinDir)) {
    console.error(`${RED}Error: BioSkin directory not found${RESET}`);
    process.exit(1);
  }

  console.log(`${CYAN}Scanning components...${RESET}`);
  const results = scanDirectory(bioskinDir, rootDir);

  console.log(`${CYAN}Generating summary...${RESET}`);
  const summary = generateSummary(results);

  printResults(results, summary);

  // Generate report file
  const reportPath = path.join(rootDir, 'packages/bioskin/__tests__/DEEP_SCAN_REPORT.md');
  const reportContent = generateMarkdownReport(results, summary);
  fs.writeFileSync(reportPath, reportContent);
  console.log(`${DIM}Report saved to: ${reportPath}${RESET}\n`);

  // Exit with error if there are errors
  if (summary.errors > 0) {
    process.exit(1);
  }
}

function generateMarkdownReport(results: ScanResult[], summary: ScanSummary): string {
  const now = new Date().toISOString();

  let md = `# BioSkin Deep Scan Report

Generated: ${now}

## Summary

| Metric | Value |
|--------|-------|
| Files Scanned | ${summary.totalFiles} |
| Average Health | ${summary.avgHealthScore}% |
| Total Issues | ${summary.totalIssues} |
| Errors | ${summary.errors} |
| Warnings | ${summary.warnings} |
| Info | ${summary.infos} |

## By Layer

| Layer | Files | Issues | Avg Health |
|-------|-------|--------|------------|
`;

  for (const [layer, data] of Object.entries(summary.byLayer)) {
    md += `| ${layer} | ${data.files} | ${data.issues} | ${data.avgHealth}% |\n`;
  }

  md += `\n## Files with Issues\n\n`;

  const filesWithIssues = results.filter(r => r.issues.length > 0).sort((a, b) => b.issues.length - a.issues.length);
  for (const r of filesWithIssues) {
    md += `### ${r.file}\n\n`;
    md += `- **Layer:** ${r.layer}\n`;
    md += `- **Health:** ${r.healthScore}%\n`;
    md += `- **Lines:** ${r.lineCount}\n`;
    md += `- **Good Patterns:** ${r.patterns.join(', ') || 'None detected'}\n\n`;

    if (r.issues.length > 0) {
      md += `**Issues:**\n\n`;
      for (const issue of r.issues) {
        const emoji = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
        md += `- ${emoji} \`${issue.code}\`: ${issue.message}${issue.line ? ` (line ${issue.line})` : ''}\n`;
      }
      md += '\n';
    }
  }

  return md;
}

main().catch((err) => {
  console.error(`${RED}Fatal error:${RESET}`, err);
  process.exit(1);
});
