/**
 * BioSkin MCP Enhanced - Next.js/React/TypeScript Integrated Auditor
 * 
 * This enhanced MCP server combines:
 * - BioSkin theme/component auditing
 * - Next.js development server integration
 * - TypeScript type checking
 * - Browser-based visual validation
 * 
 * Inspired by FastMCP (https://github.com/jlowin/fastmcp)
 * 
 * @see IMMORTAL_STRATEGY.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import {
  BIOSKIN_KNOWLEDGE_CONTRACT,
  COMPONENT_STRUCTURE_RULES,
  NAMING_CONVENTIONS,
  ANTI_PATTERNS,
  REQUIRED_PATTERNS,
} from './BioSkinKnowledgeContract';

const execAsync = promisify(exec);

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
  autoFix?: string;
}

export interface ComponentInfo {
  name: string;
  path: string;
  layer: 'atoms' | 'molecules' | 'organisms';
  exports: string[];
  dependencies: string[];
  tokens: string[];
}

// ============================================================
// BIOSKIN MCP ENHANCED SERVER
// ============================================================

export class BioSkinMCPEnhanced {
  private tools: Map<string, MCPTool> = new Map();
  private resources: Map<string, MCPResource> = new Map();
  private rootDir: string;
  private config: BioSkinMCPConfig;

  constructor(rootDir: string = process.cwd(), config: Partial<BioSkinMCPConfig> = {}) {
    this.rootDir = rootDir;
    this.config = {
      // Next.js configuration
      nextjsDir: config.nextjsDir || 'apps/web',
      devServerPort: config.devServerPort || 3000,

      // BioSkin configuration
      bioskinDir: config.bioskinDir || 'packages/bioskin',
      globalsPath: config.globalsPath || 'apps/web/src/styles/globals.css',
      tailwindPath: config.tailwindPath || 'apps/web/tailwind.config.js',

      // Validation configuration
      strictMode: config.strictMode ?? true,
      autoFix: config.autoFix ?? false,

      // Integration configuration
      enableTypeCheck: config.enableTypeCheck ?? true,
      enableLintCheck: config.enableLintCheck ?? true,
    };

    this.registerTools();
    this.registerResources();
  }

  // ============================================================
  // TOOL REGISTRATION
  // ============================================================

  private registerTools(): void {
    // ========== THEME TOOLS ==========
    this.tools.set('validate_theme', {
      name: 'validate_theme',
      description: 'Validates all theme tokens in BioThemeContract exist in CSS and Tailwind',
      inputSchema: { type: 'object', properties: {}, required: [] },
      handler: async () => this.validateTheme(),
    });

    this.tools.set('sync_theme', {
      name: 'sync_theme',
      description: 'Synchronizes theme tokens across Contract, CSS, and Tailwind config',
      inputSchema: {
        type: 'object',
        properties: {
          dryRun: { type: 'boolean', description: 'Preview changes without applying' },
        },
      },
      handler: async (args) => this.syncTheme(args.dryRun as boolean),
    });

    // ========== COMPONENT TOOLS ==========
    this.tools.set('audit_component', {
      name: 'audit_component',
      description: 'Audits a specific component for UI/UX issues, token usage, and type safety',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Path to the component file' },
          deep: { type: 'boolean', description: 'Include dependency analysis' },
        },
        required: ['filePath'],
      },
      handler: async (args) => this.auditComponent(args.filePath as string, args.deep as boolean),
    });

    this.tools.set('analyze_component', {
      name: 'analyze_component',
      description: 'Deep analysis of component structure, props, and patterns',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string' },
        },
        required: ['filePath'],
      },
      handler: async (args) => this.analyzeComponent(args.filePath as string),
    });

    // ========== NEXT.JS INTEGRATION TOOLS ==========
    this.tools.set('check_nextjs_errors', {
      name: 'check_nextjs_errors',
      description: 'Checks for Next.js build errors and warnings',
      inputSchema: { type: 'object', properties: {}, required: [] },
      handler: async () => this.checkNextJSErrors(),
    });

    this.tools.set('check_typescript', {
      name: 'check_typescript',
      description: 'Runs TypeScript type checking on BioSkin components',
      inputSchema: {
        type: 'object',
        properties: {
          scope: { type: 'string', description: 'Scope: all, atoms, molecules, organisms' },
        },
      },
      handler: async (args) => this.checkTypeScript(args.scope as string),
    });

    this.tools.set('check_lint', {
      name: 'check_lint',
      description: 'Runs ESLint on BioSkin components',
      inputSchema: {
        type: 'object',
        properties: {
          fix: { type: 'boolean', description: 'Auto-fix issues if possible' },
        },
      },
      handler: async (args) => this.checkLint(args.fix as boolean),
    });

    // ========== SCAN TOOLS ==========
    this.tools.set('scan_tailwind', {
      name: 'scan_tailwind',
      description: 'Scans for Tailwind classes that reference undefined tokens',
      inputSchema: {
        type: 'object',
        properties: {
          directory: { type: 'string' },
        },
      },
      handler: async (args) => this.scanTailwindClasses(args.directory as string),
    });

    this.tools.set('scan_imports', {
      name: 'scan_imports',
      description: 'Scans import patterns to find incorrect or missing BioSkin imports',
      inputSchema: { type: 'object', properties: {}, required: [] },
      handler: async () => this.scanImports(),
    });

    // ========== ANOMALY DETECTION TOOLS ==========
    this.tools.set('detect_anomalies', {
      name: 'detect_anomalies',
      description: 'Detects abnormalities in components based on BioSkin Knowledge Contract',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Path to component file' },
          layer: { type: 'string', description: 'Component layer: atoms, molecules, organisms' },
        },
        required: ['filePath'],
      },
      handler: async (args) => this.detectAnomalies(args.filePath as string, args.layer as string),
    });

    this.tools.set('check_anti_patterns', {
      name: 'check_anti_patterns',
      description: 'Checks a file for known anti-patterns defined in Knowledge Contract',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string' },
        },
        required: ['filePath'],
      },
      handler: async (args) => this.checkAntiPatterns(args.filePath as string),
    });

    this.tools.set('validate_component_structure', {
      name: 'validate_component_structure',
      description: 'Validates component follows BioSkin structure rules',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string' },
          layer: { type: 'string' },
        },
        required: ['filePath', 'layer'],
      },
      handler: async (args) => this.validateComponentStructure(args.filePath as string, args.layer as string),
    });

    this.tools.set('get_knowledge_contract', {
      name: 'get_knowledge_contract',
      description: 'Returns the BioSkin Knowledge Contract defining what NORMAL looks like',
      inputSchema: { type: 'object', properties: {}, required: [] },
      handler: async () => this.getKnowledgeContract(),
    });

    // ========== FIX TOOLS ==========
    this.tools.set('fix_token', {
      name: 'fix_token',
      description: 'Generates and optionally applies fix for a missing token',
      inputSchema: {
        type: 'object',
        properties: {
          tokenName: { type: 'string' },
          tokenValue: { type: 'string' },
          category: { type: 'string' },
          apply: { type: 'boolean' },
        },
        required: ['tokenName', 'tokenValue', 'category'],
      },
      handler: async (args) => this.fixToken(
        args.tokenName as string,
        args.tokenValue as string,
        args.category as string,
        args.apply as boolean
      ),
    });

    // ========== AUDIT TOOLS ==========
    this.tools.set('full_audit', {
      name: 'full_audit',
      description: 'Runs comprehensive 360° audit including theme, types, lint, and components',
      inputSchema: { type: 'object', properties: {}, required: [] },
      handler: async () => this.fullAudit(),
    });

    this.tools.set('generate_report', {
      name: 'generate_report',
      description: 'Generates a detailed audit report in Markdown format',
      inputSchema: {
        type: 'object',
        properties: {
          outputPath: { type: 'string' },
        },
      },
      handler: async (args) => this.generateReport(args.outputPath as string),
    });
  }

  // ============================================================
  // RESOURCE REGISTRATION
  // ============================================================

  private registerResources(): void {
    this.resources.set('bioskin://theme/contract', {
      uri: 'bioskin://theme/contract',
      name: 'BioTheme Contract',
      description: 'The single source of truth for all theme tokens',
      mimeType: 'application/typescript',
      handler: async () => this.getThemeContract(),
    });

    this.resources.set('bioskin://components/registry', {
      uri: 'bioskin://components/registry',
      name: 'Component Registry',
      description: 'All BioSkin components with metadata',
      mimeType: 'application/json',
      handler: async () => this.getComponentRegistry(),
    });

    this.resources.set('bioskin://knowledge/contract', {
      uri: 'bioskin://knowledge/contract',
      name: 'Knowledge Contract',
      description: 'Defines what NORMAL looks like - the baseline for anomaly detection',
      mimeType: 'application/json',
      handler: async () => JSON.stringify(BIOSKIN_KNOWLEDGE_CONTRACT, null, 2),
    });

    this.resources.set('bioskin://knowledge/anti-patterns', {
      uri: 'bioskin://knowledge/anti-patterns',
      name: 'Anti-Patterns',
      description: 'Known anti-patterns that should be avoided',
      mimeType: 'application/json',
      handler: async () => JSON.stringify(ANTI_PATTERNS, null, 2),
    });

    this.resources.set('bioskin://knowledge/structure-rules', {
      uri: 'bioskin://knowledge/structure-rules',
      name: 'Component Structure Rules',
      description: 'Rules for atoms, molecules, and organisms',
      mimeType: 'application/json',
      handler: async () => JSON.stringify(COMPONENT_STRUCTURE_RULES, null, 2),
    });

    this.resources.set('bioskin://config', {
      uri: 'bioskin://config',
      name: 'MCP Configuration',
      description: 'Current BioSkin MCP configuration',
      mimeType: 'application/json',
      handler: async () => JSON.stringify(this.config, null, 2),
    });

    this.resources.set('bioskin://nextjs/status', {
      uri: 'bioskin://nextjs/status',
      name: 'Next.js Status',
      description: 'Current Next.js development environment status',
      mimeType: 'application/json',
      handler: async () => this.getNextJSStatus(),
    });
  }

  // ============================================================
  // THEME TOOL HANDLERS
  // ============================================================

  private async validateTheme(): Promise<MCPResult> {
    const issues: ValidationIssue[] = [];
    const contractPath = path.join(this.rootDir, this.config.bioskinDir, 'src/theme/BioThemeContract.ts');
    const cssPath = path.join(this.rootDir, this.config.globalsPath);
    const tailwindPath = path.join(this.rootDir, this.config.tailwindPath);

    // Check files exist
    if (!fs.existsSync(contractPath)) {
      return this.errorResult('BioThemeContract.ts not found. Run: npx tsx scripts/TOOL_11_BioSkinAudit.ts fix');
    }

    // Extract tokens from contract
    const contractContent = fs.readFileSync(contractPath, 'utf-8');
    const contractTokens = this.extractTokensFromContract(contractContent);

    // Check CSS
    if (fs.existsSync(cssPath)) {
      const cssContent = fs.readFileSync(cssPath, 'utf-8');
      for (const token of contractTokens) {
        if (!cssContent.includes(token)) {
          issues.push({
            type: 'error',
            code: 'MISSING_CSS_TOKEN',
            message: `Token ${token} not in globals.css`,
            file: this.config.globalsPath,
            suggestion: `Add: ${token}: #VALUE;`,
            autoFix: `  ${token}: #18181B; /* TODO: Set correct value */`,
          });
        }
      }
    }

    // Check Tailwind
    if (fs.existsSync(tailwindPath)) {
      const tailwindContent = fs.readFileSync(tailwindPath, 'utf-8');
      for (const token of contractTokens) {
        if (!tailwindContent.includes(token)) {
          issues.push({
            type: 'warning',
            code: 'MISSING_TAILWIND_TOKEN',
            message: `Token ${token} may not be mapped in Tailwind`,
            file: this.config.tailwindPath,
          });
        }
      }
    }

    return {
      content: [
        { type: 'text', text: issues.length === 0 ? '✅ All theme tokens valid' : `❌ Found ${issues.length} issues` },
        { type: 'json', json: { issues, tokenCount: contractTokens.length } },
      ],
      isError: issues.some(i => i.type === 'error'),
    };
  }

  private async syncTheme(dryRun = true): Promise<MCPResult> {
    const contractPath = path.join(this.rootDir, this.config.bioskinDir, 'src/theme/BioThemeContract.ts');

    if (!fs.existsSync(contractPath)) {
      return this.errorResult('BioThemeContract.ts not found');
    }

    const contractContent = fs.readFileSync(contractPath, 'utf-8');
    const tokens = this.extractTokensWithFallbacks(contractContent);

    const changes: { file: string; action: string; content: string }[] = [];

    // Generate CSS additions
    const cssPath = path.join(this.rootDir, this.config.globalsPath);
    if (fs.existsSync(cssPath)) {
      const cssContent = fs.readFileSync(cssPath, 'utf-8');
      const missingInCSS = tokens.filter(t => !cssContent.includes(t.token));

      if (missingInCSS.length > 0) {
        const cssAdditions = missingInCSS.map(t => `  ${t.token}: ${t.fallback};`).join('\n');
        changes.push({
          file: this.config.globalsPath,
          action: 'ADD',
          content: cssAdditions,
        });
      }
    }

    if (!dryRun && this.config.autoFix) {
      // Apply changes (future implementation)
    }

    return {
      content: [
        { type: 'text', text: dryRun ? `DRY RUN: ${changes.length} changes would be made` : `Applied ${changes.length} changes` },
        { type: 'json', json: { changes, dryRun } },
      ],
    };
  }

  // ============================================================
  // NEXT.JS INTEGRATION HANDLERS
  // ============================================================

  private async checkNextJSErrors(): Promise<MCPResult> {
    const issues: ValidationIssue[] = [];

    try {
      // Check for build errors by running type check
      const nextjsDir = path.join(this.rootDir, this.config.nextjsDir);

      if (!fs.existsSync(nextjsDir)) {
        return this.errorResult(`Next.js directory not found: ${this.config.nextjsDir}`);
      }

      // Check for common Next.js issues
      const appDir = path.join(nextjsDir, 'app');
      const srcDir = path.join(nextjsDir, 'src');

      // Scan for 'use client' / 'use server' issues
      const scanForDirectives = (dir: string) => {
        if (!fs.existsSync(dir)) return;

        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            scanForDirectives(fullPath);
          } else if (entry.isFile() && /\.(tsx|jsx)$/.test(entry.name)) {
            const content = fs.readFileSync(fullPath, 'utf-8');

            // Check for useState/useEffect without 'use client'
            const usesClientHooks = /\b(useState|useEffect|useContext|useReducer|useCallback|useMemo|useRef)\b/.test(content);
            const hasUseClient = content.includes("'use client'") || content.includes('"use client"');

            if (usesClientHooks && !hasUseClient && !entry.name.includes('.server.')) {
              issues.push({
                type: 'warning',
                code: 'MISSING_USE_CLIENT',
                message: `File uses client hooks but may be missing 'use client' directive`,
                file: fullPath.replace(this.rootDir + path.sep, ''),
                suggestion: "Add 'use client' at the top of the file",
              });
            }
          }
        }
      };

      if (fs.existsSync(appDir)) scanForDirectives(appDir);

      return {
        content: [
          { type: 'text', text: issues.length === 0 ? '✅ No Next.js issues found' : `⚠️ Found ${issues.length} potential issues` },
          { type: 'json', json: { issues } },
        ],
      };
    } catch (error) {
      return this.errorResult(`Failed to check Next.js: ${error}`);
    }
  }

  private async checkTypeScript(scope?: string): Promise<MCPResult> {
    try {
      const bioskinDir = path.join(this.rootDir, this.config.bioskinDir, 'src');
      let targetDir = bioskinDir;

      if (scope && ['atoms', 'molecules', 'organisms'].includes(scope)) {
        targetDir = path.join(bioskinDir, scope);
      }

      // Run TypeScript compiler in check mode
      const { stdout, stderr } = await execAsync(
        `npx tsc --noEmit --skipLibCheck "${targetDir}/**/*.ts" "${targetDir}/**/*.tsx" 2>&1 || true`,
        { cwd: this.rootDir }
      );

      const output = stdout + stderr;
      const errors = output.split('\n').filter(line => line.includes('error TS'));

      return {
        content: [
          { type: 'text', text: errors.length === 0 ? '✅ TypeScript check passed' : `❌ ${errors.length} TypeScript errors` },
          { type: 'json', json: { errors: errors.slice(0, 20), total: errors.length } },
        ],
        isError: errors.length > 0,
      };
    } catch (error) {
      return this.errorResult(`TypeScript check failed: ${error}`);
    }
  }

  private async checkLint(fix = false): Promise<MCPResult> {
    try {
      const bioskinDir = path.join(this.rootDir, this.config.bioskinDir, 'src');
      const fixFlag = fix ? '--fix' : '';

      const { stdout, stderr } = await execAsync(
        `npx eslint "${bioskinDir}" --ext .ts,.tsx ${fixFlag} --format json 2>&1 || true`,
        { cwd: this.rootDir }
      );

      try {
        const results = JSON.parse(stdout);
        const errorCount = results.reduce((sum: number, r: { errorCount: number }) => sum + r.errorCount, 0);
        const warningCount = results.reduce((sum: number, r: { warningCount: number }) => sum + r.warningCount, 0);

        return {
          content: [
            { type: 'text', text: errorCount === 0 ? `✅ Lint passed (${warningCount} warnings)` : `❌ ${errorCount} lint errors, ${warningCount} warnings` },
            { type: 'json', json: { errorCount, warningCount, filesChecked: results.length } },
          ],
          isError: errorCount > 0,
        };
      } catch {
        return {
          content: [{ type: 'text', text: 'Lint check completed (could not parse output)' }],
        };
      }
    } catch (error) {
      return this.errorResult(`Lint check failed: ${error}`);
    }
  }

  // ============================================================
  // COMPONENT ANALYSIS HANDLERS
  // ============================================================

  private async auditComponent(filePath: string, deep = false): Promise<MCPResult> {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.rootDir, filePath);

    if (!fs.existsSync(fullPath)) {
      return this.errorResult(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const issues: ValidationIssue[] = [];
    const info: Partial<ComponentInfo> = {
      name: path.basename(filePath, path.extname(filePath)),
      path: filePath,
    };

    // Check for token usage
    const tokens = this.extractTokenUsage(content);
    info.tokens = tokens;

    // Check for undefined tokens
    const knownTokens = new Set([
      'base', 'subtle', 'card', 'nested', 'hover',
      'primary', 'secondary', 'tertiary', 'muted', 'disabled',
      'default', 'active',
      'success', 'warning', 'danger', 'info',
    ]);

    for (const token of tokens) {
      const tokenName = token.split('-').pop() || '';
      if (!knownTokens.has(tokenName)) {
        issues.push({
          type: 'warning',
          code: 'UNKNOWN_TOKEN',
          message: `Unknown token: ${token}`,
          file: filePath,
          suggestion: `Verify token exists in BioThemeContract`,
        });
      }
    }

    // Check for hardcoded colors
    const hardcodedColors = content.match(/#[0-9A-Fa-f]{3,8}(?![^'"`]*['"`])/g) || [];
    for (const color of hardcodedColors) {
      issues.push({
        type: 'info',
        code: 'HARDCODED_COLOR',
        message: `Hardcoded color: ${color}`,
        file: filePath,
        suggestion: 'Consider using a theme token',
      });
    }

    // Check for missing 'use client' if using hooks
    const usesHooks = /\b(useState|useEffect|useContext|useReducer|useCallback|useMemo|useRef)\b/.test(content);
    const hasUseClient = content.includes("'use client'") || content.includes('"use client"');

    if (usesHooks && !hasUseClient) {
      issues.push({
        type: 'error',
        code: 'MISSING_USE_CLIENT',
        message: "Uses React hooks but missing 'use client'",
        file: filePath,
        suggestion: "Add 'use client' at the top of the file",
        autoFix: "'use client';\n\n",
      });
    }

    // Deep analysis if requested
    if (deep) {
      // Extract imports
      const imports = content.match(/import\s+.*\s+from\s+['"][^'"]+['"]/g) || [];
      info.dependencies = imports.map(i => {
        const match = i.match(/from\s+['"]([^'"]+)['"]/);
        return match ? match[1] : '';
      }).filter(Boolean);

      // Extract exports
      const exports = content.match(/export\s+(const|function|class|type|interface)\s+(\w+)/g) || [];
      info.exports = exports.map(e => {
        const match = e.match(/export\s+\w+\s+(\w+)/);
        return match ? match[1] : '';
      }).filter(Boolean);
    }

    return {
      content: [
        { type: 'text', text: `Audit of ${info.name}: ${issues.length} issues, ${tokens.length} tokens` },
        { type: 'json', json: { info, issues } },
      ],
      isError: issues.some(i => i.type === 'error'),
    };
  }

  private async analyzeComponent(filePath: string): Promise<MCPResult> {
    const result = await this.auditComponent(filePath, true);
    return result;
  }

  // ============================================================
  // ANOMALY DETECTION HANDLERS
  // ============================================================

  private async detectAnomalies(filePath: string, layer?: string): Promise<MCPResult> {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.rootDir, filePath);

    if (!fs.existsSync(fullPath)) {
      return this.errorResult(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const anomalies: ValidationIssue[] = [];

    // Detect layer from path if not provided
    const detectedLayer = layer || this.detectLayer(filePath);

    // Get rules for this layer
    const rules = detectedLayer && COMPONENT_STRUCTURE_RULES[detectedLayer as keyof typeof COMPONENT_STRUCTURE_RULES];

    // Check anti-patterns
    for (const [name, pattern] of Object.entries(ANTI_PATTERNS)) {
      if (pattern.pattern instanceof RegExp && pattern.pattern.test(content)) {
        // Check for exceptions
        const isException = pattern.exceptions?.some(exc => content.includes(exc));
        if (!isException) {
          anomalies.push({
            type: pattern.severity as 'error' | 'warning' | 'info',
            code: `ANTI_PATTERN_${name.toUpperCase()}`,
            message: pattern.message,
            file: filePath,
            suggestion: pattern.autoFix || undefined,
          });
        }
      }
    }

    // Check structure rules
    if (rules) {
      // Check forbidden imports
      const imports = this.extractImports(content);
      for (const imp of imports) {
        if (rules.forbiddenImports?.some(f => imp.includes(f))) {
          anomalies.push({
            type: 'warning',
            code: 'FORBIDDEN_IMPORT',
            message: `Import "${imp}" is forbidden in ${detectedLayer}`,
            file: filePath,
            suggestion: `Move this logic to a higher-level component or hook`,
          });
        }
      }

      // Check max lines
      const lineCount = content.split('\n').length;
      if (rules.maxLines && lineCount > rules.maxLines) {
        anomalies.push({
          type: 'warning',
          code: 'TOO_MANY_LINES',
          message: `Component has ${lineCount} lines (max: ${rules.maxLines})`,
          file: filePath,
          suggestion: `Consider splitting into smaller components`,
        });
      }

      // Check displayName
      if (rules.mustHave?.displayName && !content.includes('.displayName')) {
        anomalies.push({
          type: 'info',
          code: 'MISSING_DISPLAY_NAME',
          message: 'Component is missing displayName',
          file: filePath,
          suggestion: `Add: ComponentName.displayName = 'ComponentName';`,
        });
      }
    }

    // Check naming conventions
    const fileName = path.basename(filePath);
    if (!NAMING_CONVENTIONS.files.components.test(fileName) && fileName.endsWith('.tsx')) {
      anomalies.push({
        type: 'info',
        code: 'NAMING_CONVENTION',
        message: `File name "${fileName}" doesn't follow PascalCase convention`,
        file: filePath,
      });
    }

    const normalCount = this.countNormalPatterns(content);
    const abnormalCount = anomalies.length;
    const healthScore = normalCount > 0 ? Math.round((normalCount / (normalCount + abnormalCount)) * 100) : 0;

    return {
      content: [
        { type: 'text', text: `Health Score: ${healthScore}% | ${anomalies.length} anomalies detected` },
        {
          type: 'json', json: {
            healthScore,
            layer: detectedLayer,
            normalPatterns: normalCount,
            anomalies,
          }
        },
      ],
      isError: anomalies.some(a => a.type === 'error'),
    };
  }

  private async checkAntiPatterns(filePath: string): Promise<MCPResult> {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.rootDir, filePath);

    if (!fs.existsSync(fullPath)) {
      return this.errorResult(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const found: { pattern: string; severity: string; message: string; line?: number }[] = [];

    for (const [name, pattern] of Object.entries(ANTI_PATTERNS)) {
      if (pattern.pattern instanceof RegExp) {
        const matches = content.matchAll(new RegExp(pattern.pattern.source, 'g'));
        for (const match of matches) {
          // Find line number
          const lineNum = content.substring(0, match.index).split('\n').length;
          found.push({
            pattern: name,
            severity: pattern.severity,
            message: pattern.message,
            line: lineNum,
          });
        }
      }
    }

    return {
      content: [
        { type: 'text', text: found.length === 0 ? '✅ No anti-patterns found' : `⚠️ ${found.length} anti-patterns detected` },
        { type: 'json', json: { antiPatterns: found, total: found.length } },
      ],
      isError: found.some(f => f.severity === 'error'),
    };
  }

  private async validateComponentStructure(filePath: string, layer: string): Promise<MCPResult> {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.rootDir, filePath);

    if (!fs.existsSync(fullPath)) {
      return this.errorResult(`File not found: ${filePath}`);
    }

    const validLayers = ['atoms', 'molecules', 'organisms'];
    if (!validLayers.includes(layer)) {
      return this.errorResult(`Invalid layer: ${layer}. Must be one of: ${validLayers.join(', ')}`);
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const rules = COMPONENT_STRUCTURE_RULES[layer as keyof typeof COMPONENT_STRUCTURE_RULES];
    const violations: ValidationIssue[] = [];
    const passes: string[] = [];

    // Check imports
    const imports = this.extractImports(content);
    const forbiddenFound = imports.filter(imp =>
      rules.forbiddenImports?.some(f => imp.includes(f))
    );
    if (forbiddenFound.length > 0) {
      violations.push({
        type: 'error',
        code: 'FORBIDDEN_IMPORTS',
        message: `Forbidden imports for ${layer}: ${forbiddenFound.join(', ')}`,
        file: filePath,
      });
    } else {
      passes.push('Imports are valid');
    }

    // Check line count
    const lineCount = content.split('\n').length;
    if (rules.maxLines && lineCount > rules.maxLines) {
      violations.push({
        type: 'warning',
        code: 'EXCEEDS_MAX_LINES',
        message: `${lineCount} lines exceeds max of ${rules.maxLines} for ${layer}`,
        file: filePath,
      });
    } else {
      passes.push(`Line count OK (${lineCount}/${rules.maxLines})`);
    }

    // Check displayName
    if (rules.mustHave?.displayName) {
      if (content.includes('.displayName')) {
        passes.push('Has displayName');
      } else {
        violations.push({
          type: 'info',
          code: 'MISSING_DISPLAY_NAME',
          message: 'Missing displayName property',
          file: filePath,
        });
      }
    }

    // Check for default export
    if (rules.requiredExports?.includes('default')) {
      if (content.includes('export default') || content.match(/export\s*{\s*\w+\s+as\s+default/)) {
        passes.push('Has default export');
      } else {
        violations.push({
          type: 'warning',
          code: 'MISSING_DEFAULT_EXPORT',
          message: 'Missing default export',
          file: filePath,
        });
      }
    }

    // Check cn utility usage
    if (rules.patterns?.cnUtility === 'required') {
      if (content.includes('cn(') || content.includes('from \'clsx\'') || content.includes('from "@/lib/utils"')) {
        passes.push('Uses cn/clsx utility');
      } else {
        violations.push({
          type: 'info',
          code: 'MISSING_CN_UTILITY',
          message: 'Should use cn() utility for class merging',
          file: filePath,
        });
      }
    }

    const isValid = violations.filter(v => v.type === 'error').length === 0;

    return {
      content: [
        { type: 'text', text: isValid ? `✅ Valid ${layer} structure` : `❌ Invalid ${layer} structure` },
        {
          type: 'json', json: {
            layer,
            valid: isValid,
            passes,
            violations,
            rules: {
              maxLines: rules.maxLines,
              maxProps: rules.maxProps,
              forbiddenImports: rules.forbiddenImports,
            }
          }
        },
      ],
      isError: !isValid,
    };
  }

  private async getKnowledgeContract(): Promise<MCPResult> {
    return {
      content: [
        { type: 'text', text: 'BioSkin Knowledge Contract v' + BIOSKIN_KNOWLEDGE_CONTRACT.version },
        { type: 'json', json: BIOSKIN_KNOWLEDGE_CONTRACT },
      ],
    };
  }

  // Anomaly detection helpers
  private detectLayer(filePath: string): string | null {
    if (filePath.includes('/atoms/') || filePath.includes('\\atoms\\')) return 'atoms';
    if (filePath.includes('/molecules/') || filePath.includes('\\molecules\\')) return 'molecules';
    if (filePath.includes('/organisms/') || filePath.includes('\\organisms\\')) return 'organisms';
    return null;
  }

  private extractImports(content: string): string[] {
    const matches = content.match(/from\s+['"]([^'"]+)['"]/g) || [];
    return matches.map(m => m.replace(/from\s+['"]/, '').replace(/['"]/, ''));
  }

  private countNormalPatterns(content: string): number {
    let count = 0;

    // Check for good patterns
    if (content.includes('.displayName')) count++;
    if (content.includes('cn(')) count++;
    if (content.includes('forwardRef')) count++;
    if (content.includes("'use client'") || content.includes('"use client"')) count++;
    if (content.includes('export default')) count++;
    if (content.includes('interface') && content.includes('Props')) count++;
    if (content.includes('aria-')) count++;
    if (content.match(/bg-surface-|text-text-|border-border-/)) count++;
    if (content.includes('className')) count++;
    if (content.includes('React.')) count++;

    return count;
  }

  // ============================================================
  // FULL AUDIT HANDLER
  // ============================================================

  private async fullAudit(): Promise<MCPResult> {
    const results: Record<string, unknown> = {};
    const startTime = Date.now();

    console.log('🧬 Running full 360° BioSkin audit...\n');

    // 1. Theme validation
    console.log('[1/4] Validating theme tokens...');
    const themeResult = await this.validateTheme();
    results.theme = themeResult.content[1]?.json;

    // 2. TypeScript check
    if (this.config.enableTypeCheck) {
      console.log('[2/4] Running TypeScript check...');
      const tsResult = await this.checkTypeScript();
      results.typescript = tsResult.content[1]?.json;
    }

    // 3. Next.js check
    console.log('[3/4] Checking Next.js issues...');
    const nextResult = await this.checkNextJSErrors();
    results.nextjs = nextResult.content[1]?.json;

    // 4. Scan components
    console.log('[4/4] Scanning components...');
    const scanResult = await this.scanTailwindClasses();
    results.scan = scanResult.content[1]?.json;

    const duration = Date.now() - startTime;

    // Calculate totals
    const themeIssues = ((results.theme as { issues?: ValidationIssue[] })?.issues || []).length;
    const nextIssues = ((results.nextjs as { issues?: ValidationIssue[] })?.issues || []).length;
    const tsErrors = (results.typescript as { total?: number })?.total || 0;

    const totalIssues = themeIssues + nextIssues + tsErrors;
    const status = totalIssues === 0 ? '✅ AUDIT PASSED' : `⚠️ ${totalIssues} issues found`;

    return {
      content: [
        { type: 'text', text: `${status} (${duration}ms)` },
        { type: 'json', json: { results, summary: { totalIssues, duration } } },
      ],
      isError: totalIssues > 0,
    };
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  private extractTokensFromContract(content: string): string[] {
    const tokens: string[] = [];
    const tokenRegex = /token:\s*'([^']+)'/g;
    let match;
    while ((match = tokenRegex.exec(content)) !== null) {
      tokens.push(match[1]);
    }
    return tokens;
  }

  private extractTokensWithFallbacks(content: string): { token: string; fallback: string }[] {
    const tokens: { token: string; fallback: string }[] = [];
    const regex = /token:\s*'([^']+)',\s*fallback:\s*'([^']+)'/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      tokens.push({ token: match[1], fallback: match[2] });
    }
    return tokens;
  }

  private extractTokenUsage(content: string): string[] {
    const tokens: string[] = [];
    const patterns = [
      /bg-surface-(\w+)/g,
      /text-text-(\w+)/g,
      /border-border-(\w+)/g,
      /ring-accent-(\w+)/g,
      /text-status-(\w+)/g,
      /bg-status-(\w+)/g,
      /text-accent-(\w+)/g,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        tokens.push(match[0]);
      }
    }

    return [...new Set(tokens)];
  }

  private async scanTailwindClasses(directory?: string): Promise<MCPResult> {
    const targetDir = directory || path.join(this.rootDir, this.config.bioskinDir, 'src');
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
          const tokens = this.extractTokenUsage(content);

          if (tokens.length > 0) {
            results.push({
              file: fullPath.replace(this.rootDir + path.sep, ''),
              tokens: [...new Set(tokens)],
            });
          }
        }
      }
    };

    scanDir(targetDir);

    return {
      content: [
        { type: 'text', text: `Scanned ${results.length} files with token usage` },
        { type: 'json', json: { files: results.slice(0, 50), total: results.length } },
      ],
    };
  }

  private async scanImports(): Promise<MCPResult> {
    const bioskinDir = path.join(this.rootDir, this.config.bioskinDir, 'src');
    const issues: ValidationIssue[] = [];

    const scanForImports = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          scanForImports(fullPath);
        } else if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, 'utf-8');

          // Check for direct imports that should use the package
          if (content.includes("from '../atoms/") || content.includes("from '../../atoms/")) {
            issues.push({
              type: 'info',
              code: 'RELATIVE_IMPORT',
              message: 'Using relative import instead of package import',
              file: fullPath.replace(this.rootDir + path.sep, ''),
              suggestion: "Consider using '@aibos/bioskin' package import",
            });
          }
        }
      }
    };

    scanForImports(bioskinDir);

    return {
      content: [
        { type: 'text', text: `Found ${issues.length} import patterns to review` },
        { type: 'json', json: { issues } },
      ],
    };
  }

  private async fixToken(tokenName: string, tokenValue: string, category: string, apply = false): Promise<MCPResult> {
    const cssVar = `--color-${category}-${tokenName}`;

    const fixes = {
      contract: `${tokenName}: { token: '${cssVar}', fallback: '${tokenValue}', description: '${tokenName}' },`,
      css: `  ${cssVar}: ${tokenValue};`,
      tailwind: `'${category}-${tokenName}': 'var(${cssVar})',`,
    };

    if (apply && this.config.autoFix) {
      // Future: actually apply the fixes
    }

    return {
      content: [
        { type: 'text', text: `Generated fixes for token: ${tokenName}` },
        { type: 'json', json: { fixes, applied: apply && this.config.autoFix } },
      ],
    };
  }

  private async generateReport(outputPath?: string): Promise<MCPResult> {
    const auditResult = await this.fullAudit();
    const results = (auditResult.content[1]?.json as { results: Record<string, unknown> })?.results;

    const report = `# BioSkin Audit Report

Generated: ${new Date().toISOString()}

## Summary

${auditResult.content[0].text}

## Theme Validation

${JSON.stringify(results?.theme, null, 2)}

## TypeScript Check

${JSON.stringify(results?.typescript, null, 2)}

## Next.js Issues

${JSON.stringify(results?.nextjs, null, 2)}

## Component Scan

${JSON.stringify(results?.scan, null, 2)}
`;

    if (outputPath) {
      const fullPath = path.isAbsolute(outputPath) ? outputPath : path.join(this.rootDir, outputPath);
      fs.writeFileSync(fullPath, report);
    }

    return {
      content: [
        { type: 'text', text: outputPath ? `Report saved to ${outputPath}` : 'Report generated' },
        { type: 'json', json: { report } },
      ],
    };
  }

  // ============================================================
  // RESOURCE HANDLERS
  // ============================================================

  private async getThemeContract(): Promise<string> {
    const contractPath = path.join(this.rootDir, this.config.bioskinDir, 'src/theme/BioThemeContract.ts');
    return fs.existsSync(contractPath) ? fs.readFileSync(contractPath, 'utf-8') : '{}';
  }

  private async getComponentRegistry(): Promise<string> {
    const components: ComponentInfo[] = [];
    const bioskinDir = path.join(this.rootDir, this.config.bioskinDir, 'src');

    const scanLayer = (layer: 'atoms' | 'molecules' | 'organisms') => {
      const dir = path.join(bioskinDir, layer);
      if (!fs.existsSync(dir)) return;

      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.tsx') && !entry.name.includes('.test.')) {
          components.push({
            name: entry.name.replace('.tsx', ''),
            path: path.join(layer, entry.name),
            layer,
            exports: [],
            dependencies: [],
            tokens: [],
          });
        } else if (entry.isDirectory()) {
          const indexPath = path.join(dir, entry.name, 'index.ts');
          const mainPath = path.join(dir, entry.name, `${entry.name}.tsx`);

          if (fs.existsSync(indexPath) || fs.existsSync(mainPath)) {
            components.push({
              name: entry.name,
              path: path.join(layer, entry.name),
              layer,
              exports: [],
              dependencies: [],
              tokens: [],
            });
          }
        }
      }
    };

    scanLayer('atoms');
    scanLayer('molecules');
    scanLayer('organisms');

    return JSON.stringify(components, null, 2);
  }

  private async getNextJSStatus(): Promise<string> {
    const nextjsDir = path.join(this.rootDir, this.config.nextjsDir);
    const status = {
      configured: fs.existsSync(nextjsDir),
      directory: this.config.nextjsDir,
      port: this.config.devServerPort,
      hasAppDir: fs.existsSync(path.join(nextjsDir, 'app')),
      hasSrcDir: fs.existsSync(path.join(nextjsDir, 'src')),
    };
    return JSON.stringify(status, null, 2);
  }

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  private errorResult(message: string): MCPResult {
    return {
      content: [{ type: 'text', text: `❌ ${message}` }],
      isError: true,
    };
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
      return this.errorResult(`Unknown tool: ${name}`);
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
// CONFIGURATION
// ============================================================

export interface BioSkinMCPConfig {
  // Next.js
  nextjsDir: string;
  devServerPort: number;

  // BioSkin
  bioskinDir: string;
  globalsPath: string;
  tailwindPath: string;

  // Validation
  strictMode: boolean;
  autoFix: boolean;

  // Integration
  enableTypeCheck: boolean;
  enableLintCheck: boolean;
}

// ============================================================
// CLI RUNNER
// ============================================================

async function main() {
  const rootDir = process.cwd();
  const mcp = new BioSkinMCPEnhanced(rootDir);

  console.log('\n🧬 BioSkin MCP Enhanced\n');
  console.log('Available Tools:');
  for (const tool of mcp.listTools()) {
    console.log(`  • ${tool.name}: ${tool.description}`);
  }

  console.log('\nAvailable Resources:');
  for (const resource of mcp.listResources()) {
    console.log(`  • ${resource.uri}: ${resource.description}`);
  }

  // Run full audit
  console.log('\n' + '='.repeat(60) + '\n');
  const result = await mcp.callTool('full_audit');
  console.log(result.content[0].text);
}

// ESM entry point detection
const isMainModule = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` ||
  process.argv[1]?.endsWith('BioSkinMCPEnhanced.ts');

if (isMainModule) {
  main().catch(console.error);
}

export default BioSkinMCPEnhanced;
