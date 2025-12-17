# BioSkin MCP - Model Context Protocol Server

A custom MCP server for UI/UX auditing, inspired by [FastMCP](https://github.com/jlowin/fastmcp).

## Overview

BioSkin MCP provides AI-powered auditing for your UI/UX system:

- **Theme Validation**: Ensures CSS tokens match the BioThemeContract
- **TypeScript Checking**: Validates type safety across components
- **Next.js Integration**: Checks for common Next.js patterns
- **Component Auditing**: Analyzes individual components for issues

## Available Tools

| Tool | Description |
|------|-------------|
| `validate_theme` | Validates all theme tokens exist in CSS and Tailwind |
| `sync_theme` | Synchronizes tokens across Contract, CSS, and Tailwind |
| `audit_component` | Audits a specific component for issues |
| `analyze_component` | Deep analysis of component structure |
| `check_nextjs_errors` | Checks for Next.js build errors |
| `check_typescript` | Runs TypeScript type checking |
| `check_lint` | Runs ESLint on components |
| `scan_tailwind` | Scans for undefined Tailwind classes |
| `scan_imports` | Checks import patterns |
| `fix_token` | Generates fix for missing token |
| `full_audit` | Runs comprehensive 360° audit |
| `generate_report` | Generates Markdown audit report |

## Available Resources

| Resource | Description |
|----------|-------------|
| `bioskin://theme/contract` | The BioThemeContract source |
| `bioskin://components/registry` | All BioSkin components |
| `bioskin://config` | Current MCP configuration |
| `bioskin://nextjs/status` | Next.js environment status |

## Configuration

```typescript
import { BioSkinMCPEnhanced } from './BioSkinMCPEnhanced';

const mcp = new BioSkinMCPEnhanced(process.cwd(), {
  // Next.js configuration
  nextjsDir: 'apps/web',
  devServerPort: 3000,
  
  // BioSkin configuration
  bioskinDir: 'packages/bioskin',
  globalsPath: 'apps/web/src/styles/globals.css',
  tailwindPath: 'apps/web/tailwind.config.js',
  
  // Validation configuration
  strictMode: true,
  autoFix: false,
  
  // Integration configuration
  enableTypeCheck: true,
  enableLintCheck: true,
});
```

## CLI Usage

```bash
# Run via the audit script
npx tsx scripts/TOOL_11_BioSkinAudit.ts

# Or use directly
npx tsx packages/bioskin/src/mcp/BioSkinMCPEnhanced.ts
```

## Integration with Cursor

To use with Cursor's AI assistant, the MCP can be registered in `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "bioskin": {
      "command": "npx",
      "args": ["tsx", "packages/bioskin/src/mcp/BioSkinMCPEnhanced.ts"]
    }
  }
}
```

## Example Usage

### Programmatic Usage

```typescript
const mcp = new BioSkinMCPEnhanced(process.cwd());

// Run full audit
const result = await mcp.callTool('full_audit');
console.log(result.content[0].text);

// Validate theme only
const themeResult = await mcp.callTool('validate_theme');

// Audit specific component
const componentResult = await mcp.callTool('audit_component', {
  filePath: 'packages/bioskin/src/organisms/BioForm/BioForm.tsx',
  deep: true,
});

// Generate fix for missing token
const fixResult = await mcp.callTool('fix_token', {
  tokenName: 'elevated',
  tokenValue: '#262629',
  category: 'surfaces',
});
```

### Resource Access

```typescript
// Get theme contract
const contract = await mcp.readResource('bioskin://theme/contract');

// Get component registry
const registry = await mcp.readResource('bioskin://components/registry');

// Get Next.js status
const status = await mcp.readResource('bioskin://nextjs/status');
```

## Architecture

```
BioSkin MCP Enhanced
├── Tools (Actions)
│   ├── Theme Tools
│   │   ├── validate_theme
│   │   └── sync_theme
│   ├── Component Tools
│   │   ├── audit_component
│   │   └── analyze_component
│   ├── Next.js Tools
│   │   ├── check_nextjs_errors
│   │   ├── check_typescript
│   │   └── check_lint
│   ├── Scan Tools
│   │   ├── scan_tailwind
│   │   └── scan_imports
│   └── Fix Tools
│       ├── fix_token
│       ├── full_audit
│       └── generate_report
│
├── Resources (Data)
│   ├── bioskin://theme/contract
│   ├── bioskin://components/registry
│   ├── bioskin://config
│   └── bioskin://nextjs/status
│
└── Configuration
    ├── Next.js paths
    ├── BioSkin paths
    └── Validation options
```

## IMMORTAL Strategy Integration

This MCP is Layer 4 of the IMMORTAL Strategy:

1. **Layer 1**: BioThemeContract (Single Source of Truth)
2. **Layer 2**: BioThemeGuard (Runtime Validation)
3. **Layer 3**: TOOL_10 (Build-time Validation)
4. **Layer 4**: BioSkin MCP (AI-Powered Auditing)

See `packages/canon/E-Knowledge/E-SPEC/IMMORTAL_STRATEGY.md` for full documentation.
