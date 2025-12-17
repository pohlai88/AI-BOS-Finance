/**
 * BioSkin MCP - Model Context Protocol Server for UI/UX Auditing
 * 
 * Inspired by FastMCP (https://github.com/jlowin/fastmcp)
 * 
 * This MCP server exposes tools and resources for:
 * 1. Validating theme tokens
 * 2. Auditing components for issues
 * 3. Scanning for undefined Tailwind classes
 * 4. Generating fix suggestions
 * 
 * Can be used by Cursor, Claude, or any MCP-compatible client.
 * 
 * @see https://modelcontextprotocol.io/
 * @see IMMORTAL_STRATEGY.md
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// TYPES
// ============================================================

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<MCPResult>;
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
  handler: () => Promise<string>;
}

export interface MCPResult {
  content: Array<{
    type: 'text' | 'json';
    text?: string;
    json?: unknown;
  }>;
  isError?: boolean;
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

// ============================================================
// BIOSKIN MCP SERVER
// ============================================================

export class BioSkinMCP {
  private tools: Map<string, MCPTool> = new Map();
  private resources: Map<string, MCPResource> = new Map();
  private rootDir: string;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
    this.registerTools();
    this.registerResources();
  }

  // ============================================================
  // TOOL REGISTRATION
  // ============================================================

  private registerTools(): void {
    // Tool: Validate Theme Tokens
    this.tools.set('validate_theme', {
      name: 'validate_theme',
      description: 'Validates that all theme tokens in BioThemeContract exist in globals.css and tailwind.config.js',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
      handler: async () => this.validateTheme(),
    });

    // Tool: Audit Component
    this.tools.set('audit_component', {
      name: 'audit_component',
      description: 'Audits a specific component file for UI/UX issues',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Path to the component file' },
        },
        required: ['filePath'],
      },
      handler: async (args) => this.auditComponent(args.filePath as string),
    });

    // Tool: Scan Tailwind Classes
    this.tools.set('scan_tailwind', {
      name: 'scan_tailwind',
      description: 'Scans files for Tailwind classes that reference undefined tokens',
      inputSchema: {
        type: 'object',
        properties: {
          directory: { type: 'string', description: 'Directory to scan (default: packages/bioskin/src)' },
        },
        required: [],
      },
      handler: async (args) => this.scanTailwindClasses(args.directory as string),
    });

    // Tool: Fix Token
    this.tools.set('fix_token', {
      name: 'fix_token',
      description: 'Generates a fix for a missing token by adding it to all required files',
      inputSchema: {
        type: 'object',
        properties: {
          tokenName: { type: 'string', description: 'Token name (e.g., surface-elevated)' },
          tokenValue: { type: 'string', description: 'Token value (e.g., #262629)' },
          category: { type: 'string', description: 'Category (surfaces, text, borders, accents, status)' },
        },
        required: ['tokenName', 'tokenValue', 'category'],
      },
      handler: async (args) => this.generateTokenFix(
        args.tokenName as string,
        args.tokenValue as string,
        args.category as string
      ),
    });

    // Tool: Full Audit
    this.tools.set('full_audit', {
      name: 'full_audit',
      description: 'Runs a comprehensive 360° audit of the BioSkin system',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
      handler: async () => this.fullAudit(),
    });
  }

  // ============================================================
  // RESOURCE REGISTRATION
  // ============================================================

  private registerResources(): void {
    // Resource: Theme Contract
    this.resources.set('bioskin://theme/contract', {
      uri: 'bioskin://theme/contract',
      name: 'BioTheme Contract',
      description: 'The single source of truth for all theme tokens',
      mimeType: 'application/json',
      handler: async () => this.getThemeContract(),
    });

    // Resource: Component Registry
    this.resources.set('bioskin://components/registry', {
      uri: 'bioskin://components/registry',
      name: 'Component Registry',
      description: 'List of all BioSkin components with metadata',
      mimeType: 'application/json',
      handler: async () => this.getComponentRegistry(),
    });

    // Resource: Audit Results
    this.resources.set('bioskin://audit/results', {
      uri: 'bioskin://audit/results',
      name: 'Latest Audit Results',
      description: 'Results from the most recent audit run',
      mimeType: 'application/json',
      handler: async () => this.getLatestAuditResults(),
    });
  }

  // ============================================================
  // TOOL HANDLERS
  // ============================================================

  private async validateTheme(): Promise<MCPResult> {
    const issues: ValidationIssue[] = [];

    // Load files
    const globalsCssPath = path.join(this.rootDir, 'apps/web/src/styles/globals.css');
    const tailwindConfigPath = path.join(this.rootDir, 'apps/web/tailwind.config.js');
    const contractPath = path.join(this.rootDir, 'packages/bioskin/src/theme/BioThemeContract.ts');

    // Check files exist
    const missingFiles = [globalsCssPath, tailwindConfigPath, contractPath].filter(f => !fs.existsSync(f));
    if (missingFiles.length > 0) {
      return {
        content: [{ type: 'text', text: `Missing files: ${missingFiles.join(', ')}` }],
        isError: true,
      };
    }

    // Extract tokens from contract
    const contractContent = fs.readFileSync(contractPath, 'utf-8');
    const contractTokens: string[] = [];
    const tokenRegex = /token:\s*'([^']+)'/g;
    let match;
    while ((match = tokenRegex.exec(contractContent)) !== null) {
      contractTokens.push(match[1]);
    }

    // Check tokens in CSS
    const cssContent = fs.readFileSync(globalsCssPath, 'utf-8');
    for (const token of contractTokens) {
      if (!cssContent.includes(token)) {
        issues.push({
          type: 'error',
          code: 'MISSING_CSS_TOKEN',
          message: `Token ${token} is in contract but not in globals.css`,
          file: globalsCssPath,
          suggestion: `Add to globals.css: ${token}: #HEX_VALUE;`,
        });
      }
    }

    // Check tokens in Tailwind
    const tailwindContent = fs.readFileSync(tailwindConfigPath, 'utf-8');
    for (const token of contractTokens) {
      if (!tailwindContent.includes(token)) {
        issues.push({
          type: 'warning',
          code: 'MISSING_TAILWIND_TOKEN',
          message: `Token ${token} may not be mapped in tailwind.config.js`,
          file: tailwindConfigPath,
          suggestion: `Add Tailwind mapping for ${token}`,
        });
      }
    }

    const summary = issues.length === 0
      ? '✅ All theme tokens are valid'
      : `❌ Found ${issues.length} issues`;

    return {
      content: [
        { type: 'text', text: summary },
        { type: 'json', json: { issues, tokenCount: contractTokens.length } },
      ],
      isError: issues.some(i => i.type === 'error'),
    };
  }

  private async auditComponent(filePath: string): Promise<MCPResult> {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.rootDir, filePath);

    if (!fs.existsSync(fullPath)) {
      return {
        content: [{ type: 'text', text: `File not found: ${fullPath}` }],
        isError: true,
      };
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const issues: ValidationIssue[] = [];

    // Check for undefined token patterns
    const tokenPatterns = [
      { pattern: /bg-surface-(\w+)/g, category: 'surface' },
      { pattern: /text-text-(\w+)/g, category: 'text' },
      { pattern: /border-(\w+)/g, category: 'border' },
      { pattern: /ring-accent-(\w+)/g, category: 'accent' },
      { pattern: /text-status-(\w+)/g, category: 'status' },
    ];

    const knownTokens = new Set([
      'base', 'subtle', 'card', 'nested', 'hover',
      'primary', 'secondary', 'tertiary', 'muted', 'disabled',
      'default', 'active',
      'success', 'warning', 'danger', 'info',
    ]);

    for (const { pattern, category } of tokenPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const token = match[1];
        if (!knownTokens.has(token)) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          issues.push({
            type: 'warning',
            code: 'UNKNOWN_TOKEN',
            message: `Unknown ${category} token: ${token}`,
            file: filePath,
            line: lineNumber,
            suggestion: `Verify token '${token}' exists in BioThemeContract`,
          });
        }
      }
    }

    // Check for hardcoded colors
    const hardcodedColorRegex = /#[0-9A-Fa-f]{3,8}(?![^']*')/g;
    let colorMatch;
    while ((colorMatch = hardcodedColorRegex.exec(content)) !== null) {
      if (!content.substring(colorMatch.index - 20, colorMatch.index).includes('fallback')) {
        const lineNumber = content.substring(0, colorMatch.index).split('\n').length;
        issues.push({
          type: 'info',
          code: 'HARDCODED_COLOR',
          message: `Hardcoded color found: ${colorMatch[0]}`,
          file: filePath,
          line: lineNumber,
          suggestion: 'Consider using a theme token instead',
        });
      }
    }

    return {
      content: [
        { type: 'text', text: `Audit of ${filePath}: ${issues.length} issues found` },
        { type: 'json', json: { issues } },
      ],
      isError: issues.some(i => i.type === 'error'),
    };
  }

  private async scanTailwindClasses(directory?: string): Promise<MCPResult> {
    const targetDir = directory || path.join(this.rootDir, 'packages/bioskin/src');
    const issues: ValidationIssue[] = [];

    const scanDir = (dir: string) => {
      if (!fs.existsSync(dir)) return;

      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          scanDir(fullPath);
        } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, 'utf-8');

          // Look for potentially undefined token classes
          const undefinedPatterns = [
            /bg-surface-([a-z]+)/g,
            /text-text-([a-z]+)/g,
            /border-border-([a-z]+)/g,
            /ring-accent-([a-z]+)/g,
          ];

          for (const pattern of undefinedPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
              issues.push({
                type: 'info',
                code: 'TOKEN_USAGE',
                message: `Token class used: ${match[0]}`,
                file: fullPath.replace(this.rootDir, ''),
              });
            }
          }
        }
      }
    };

    scanDir(targetDir);

    return {
      content: [
        { type: 'text', text: `Scanned ${targetDir}: Found ${issues.length} token usages` },
        { type: 'json', json: { issues: issues.slice(0, 50) } }, // Limit output
      ],
    };
  }

  private async generateTokenFix(
    tokenName: string,
    tokenValue: string,
    category: string
  ): Promise<MCPResult> {
    const cssVar = `--color-${category}-${tokenName}`;

    const fixes = {
      contract: `${tokenName}: { token: '${cssVar}', fallback: '${tokenValue}', description: '${tokenName} ${category}' },`,
      css: `${cssVar}: ${tokenValue};`,
      tailwind: `'${category}-${tokenName}': 'var(${cssVar})',`,
    };

    return {
      content: [
        { type: 'text', text: `Generated fixes for token: ${tokenName}` },
        { type: 'json', json: fixes },
      ],
    };
  }

  private async fullAudit(): Promise<MCPResult> {
    const results: Record<string, unknown> = {};

    // Run all validations
    const themeResult = await this.validateTheme();
    results.theme = themeResult.content[1]?.json;

    // Scan BioSkin components
    const scanResult = await this.scanTailwindClasses();
    results.tailwindScan = scanResult.content[1]?.json;

    // Count total issues
    const themeIssues = (results.theme as { issues?: ValidationIssue[] })?.issues || [];
    const totalIssues = themeIssues.length;

    const status = totalIssues === 0 ? '✅ PASS' : `⚠️ ${totalIssues} issues found`;

    return {
      content: [
        { type: 'text', text: `Full Audit Complete: ${status}` },
        { type: 'json', json: results },
      ],
      isError: totalIssues > 0,
    };
  }

  // ============================================================
  // RESOURCE HANDLERS
  // ============================================================

  private async getThemeContract(): Promise<string> {
    const contractPath = path.join(this.rootDir, 'packages/bioskin/src/theme/BioThemeContract.ts');
    if (fs.existsSync(contractPath)) {
      return fs.readFileSync(contractPath, 'utf-8');
    }
    return '{}';
  }

  private async getComponentRegistry(): Promise<string> {
    const components: { name: string; path: string; layer: string }[] = [];

    const scanForComponents = (dir: string, layer: string) => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.tsx') && !entry.name.includes('.test.')) {
          components.push({
            name: entry.name.replace('.tsx', ''),
            path: path.join(dir, entry.name).replace(this.rootDir, ''),
            layer,
          });
        } else if (entry.isDirectory()) {
          scanForComponents(path.join(dir, entry.name), layer);
        }
      }
    };

    scanForComponents(path.join(this.rootDir, 'packages/bioskin/src/atoms'), 'atoms');
    scanForComponents(path.join(this.rootDir, 'packages/bioskin/src/molecules'), 'molecules');
    scanForComponents(path.join(this.rootDir, 'packages/bioskin/src/organisms'), 'organisms');

    return JSON.stringify(components, null, 2);
  }

  private async getLatestAuditResults(): Promise<string> {
    const result = await this.fullAudit();
    return JSON.stringify(result.content[1]?.json || {}, null, 2);
  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  listTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  listResources(): MCPResource[] {
    return Array.from(this.resources.values());
  }

  async callTool(name: string, args: Record<string, unknown> = {}): Promise<MCPResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }
    return tool.handler(args);
  }

  async readResource(uri: string): Promise<string> {
    const resource = this.resources.get(uri);
    if (!resource) {
      throw new Error(`Unknown resource: ${uri}`);
    }
    return resource.handler();
  }
}

// ============================================================
// CLI RUNNER
// ============================================================

async function main() {
  const mcp = new BioSkinMCP(path.resolve(__dirname, '../../../..'));

  console.log('\n🧬 BioSkin MCP Server\n');
  console.log('Available Tools:');
  for (const tool of mcp.listTools()) {
    console.log(`  • ${tool.name}: ${tool.description}`);
  }

  console.log('\nAvailable Resources:');
  for (const resource of mcp.listResources()) {
    console.log(`  • ${resource.uri}: ${resource.description}`);
  }

  // Run full audit
  console.log('\n' + '='.repeat(60));
  console.log('Running Full Audit...\n');

  const result = await mcp.callTool('full_audit');
  console.log(result.content[0].text);

  if (result.content[1]?.json) {
    console.log('\nDetails:');
    console.log(JSON.stringify(result.content[1].json, null, 2));
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export default BioSkinMCP;
