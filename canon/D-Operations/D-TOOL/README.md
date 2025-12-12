# D-TOOL: Canon Operations Tools

**Purpose:** Reusable tools for Canon governance, validation, and synchronization.

---

## 📋 Rules

### 1. Tool Naming
- **Pattern:** `TOOL_{NUMBER}_{Purpose}.ts`
- **Examples:** `TOOL_18_ValidateCanonCompliance.ts`, `TOOL_29_PromoteUnauditedToCanon.ts`

### 2. Tool Classification
Every tool MUST be classified in `tool-metadata.json`:
- **Category:** `migration` | `cleanup` | `validation` | `sync` | `utility`
- **One-time use:** `true` | `false`
- **Status:** `active` | `archived` | `deprecated`

### 3. Archive Policy
- ✅ **One-time tools** → Archive after completion
- ✅ **Deprecated tools** → Archive immediately
- ✅ **Active tools only** → Keep in this directory

### 4. Active Tool Limits
- Maximum **15-20 active tools** in this directory
- One-time use tools go to `.archive/` after completion

---

## 🗂️ Directory Structure

```
D-TOOL/
├── .archive/              # Archived one-time tools
│   ├── migrations/        # Migration tools
│   └── cleanups/          # Cleanup tools
├── tool-metadata.json     # Tool classification
├── TOOL_03_*.ts          # Active validation tools
├── TOOL_18_*.ts          # Active compliance tools
├── TOOL_26_*.ts          # Active sync tools
└── TOOL_29_*.ts          # Active utility tools
```

---

## 🛠️ Active Tools

### Validation Tools
- `TOOL_03_CheckGovernanceStamps.ts` - Validates governance stamps
- `TOOL_04_ValidateCursorRules.ts` - Validates Cursor rules
- `TOOL_14_ValidateSEALFormat.ts` - Validates SEAL format
- `TOOL_17_ValidateDTOOLFiles.ts` - Validates D-TOOL structure
- `TOOL_18_ValidateCanonCompliance.ts` - Validates Canon compliance

### Sync Tools
- `TOOL_26_SyncFigmaTokens.ts` - Syncs Figma design tokens
- `TOOL_27_SyncCanonPages.ts` - Syncs canon to canon-pages
- `figma-sync.ts` - Syncs Figma design data
- `figma-push.ts` - Pushes data to Figma
- `sync-canon.ts` - Syncs canon registry
- `sync-readme.ts` - Syncs README files

### Utility Tools
- `TOOL_24_GenerateCanonPageWrapper.ts` - Generates page wrappers
- `TOOL_29_PromoteUnauditedToCanon.ts` - Promotes staging files to canon
- `TOOL_30_ArchiveOneTimeTools.ts` - Archives one-time tools

---

## 📦 Archive Management

### Archive One-Time Tools
```bash
# Dry run (see what would be archived)
npm run canon:archive-tools -- --dry-run

# Archive all one-time tools
npm run canon:archive-tools

# Archive specific tool
npm run canon:archive-tools -- --tool TOOL_05
```

### View Archived Tools
```bash
ls canon/D-Operations/D-TOOL/.archive/
cat canon/D-Operations/D-TOOL/tool-metadata.json
```

---

## 📝 Creating New Tools

### Step 1: Create Tool File
```typescript
// TOOL_31_NewTool.ts
#!/usr/bin/env tsx
/**
 * TOOL_31: New Tool
 * 
 * Purpose: Description of what this tool does
 * 
 * Usage:
 *   npm run canon:new-tool
 */
```

### Step 2: Add to package.json
```json
{
  "scripts": {
    "canon:new-tool": "tsx canon/D-Operations/D-TOOL/TOOL_31_NewTool.ts"
  }
}
```

### Step 3: Update tool-metadata.json
```json
{
  "id": "TOOL_31",
  "name": "New Tool",
  "category": "utility",
  "oneTimeUse": false,
  "status": "active",
  "description": "Description of tool"
}
```

---

## 🔍 Filesystem MCP Queries

**Query active tools:**
```
"List all active validation tools in D-TOOL"
```

**Query archived tools:**
```
"Show archived migration tools"
```

**Validate structure:**
```
"Check if D-TOOL follows archive rules"
```

---

## 📚 Related Documents

- **REF_041_CanonDirectoryCleanupStrategy.md** - Cleanup strategy
- **REF_039_FilesystemMCP_CanonIntegration.md** - MCP integration
- **CONT_01_CanonIdentity.md** - Canon governance

---

**Last Updated:** 2025-01-27
