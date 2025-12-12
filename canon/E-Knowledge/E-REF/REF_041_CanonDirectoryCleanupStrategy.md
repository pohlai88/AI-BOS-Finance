# REF_041: Canon Directory Cleanup & Strengthened Rules

**Date:** 2025-01-27  
**Status:** ✅ Active  
**Related:** CONT_01_CanonIdentity, REF_039_FilesystemMCP_CanonIntegration  
**Purpose:** Define cleanup strategy and strengthened rules for canon directory, especially D-TOOL

---

## 🎯 Problem Statement

**Issues:**
1. **D-TOOL directory growing** - Many one-time use tools (migrations, cleanups) accumulating
2. **No archive strategy** - Completed tools remain in active directory
3. **Weak rules** - No clear classification of tool types
4. **Filesystem MCP not utilized** - Could help with cleanup automation

---

## 📊 Current State Analysis

### D-TOOL Directory

**Total Tools:** 27 files

**Breakdown:**
- **One-time migrations:** ~12 tools (TOOL_05, TOOL_06, TOOL_08-12, TOOL_23, TOOL_25, TOOL_28)
- **One-time cleanups:** ~2 tools (TOOL_07, TOOL_16)
- **Active validators:** ~5 tools (TOOL_03, TOOL_04, TOOL_14, TOOL_17, TOOL_18)
- **Active sync tools:** ~4 tools (TOOL_26, TOOL_27, figma-sync, sync-canon)
- **Active utilities:** ~4 tools (TOOL_24, TOOL_29, figma-push, sync-readme)

**Problem:** ~50% of tools are one-time use but still in active directory

---

## 🔧 Solution: Archive Strategy

### Directory Structure

```
canon/D-Operations/D-TOOL/
├── .archive/                    # One-time use tools (archived)
│   ├── migrations/              # Migration tools
│   │   ├── TOOL_05_MigrateCanonPlanes.ts
│   │   ├── TOOL_08_RelocateDocumentation.ts
│   │   └── ...
│   └── cleanups/                # Cleanup tools
│       ├── TOOL_07_CleanupAnalysisFiles.ts
│       └── TOOL_16_ComprehensiveCanonCleanup.ts
├── tool-metadata.json           # Tool classification metadata
├── TOOL_03_CheckGovernanceStamps.ts  # Active tools
├── TOOL_04_ValidateCursorRules.ts
├── TOOL_18_ValidateCanonCompliance.ts
├── TOOL_26_SyncFigmaTokens.ts
├── TOOL_27_SyncCanonPages.ts
├── TOOL_29_PromoteUnauditedToCanon.ts
├── figma-sync.ts
├── figma-push.ts
└── sync-canon.ts
```

---

## 📋 Tool Classification System

### Categories

1. **Migration** - One-time structural changes
   - Status: `archived` after completion
   - Examples: TOOL_05, TOOL_08, TOOL_11

2. **Cleanup** - One-time cleanup operations
   - Status: `archived` after completion
   - Examples: TOOL_07, TOOL_16

3. **Validation** - Ongoing compliance checks
   - Status: `active`
   - Examples: TOOL_03, TOOL_04, TOOL_18

4. **Sync** - Regular synchronization tasks
   - Status: `active`
   - Examples: TOOL_26, TOOL_27, figma-sync

5. **Utility** - Reusable utility functions
   - Status: `active`
   - Examples: TOOL_24, TOOL_29

---

## 🛠️ Implementation

### Tool: TOOL_30_ArchiveOneTimeTools.ts

**Purpose:** Automatically archive one-time use tools

**Usage:**
```bash
# Dry run (see what would be archived)
npm run canon:archive-tools -- --dry-run

# Archive all one-time tools
npm run canon:archive-tools

# Archive specific tool
npm run canon:archive-tools -- --tool TOOL_05
```

**Features:**
- ✅ Classifies tools automatically
- ✅ Moves to `.archive/` directory
- ✅ Generates `tool-metadata.json`
- ✅ Dry-run mode for safety

### Tool Metadata File

**Location:** `canon/D-Operations/D-TOOL/tool-metadata.json`

**Structure:**
```json
[
  {
    "id": "TOOL_05",
    "name": "Migrate Canon Planes",
    "category": "migration",
    "oneTimeUse": true,
    "status": "archived",
    "description": "One-time migration to new plane structure"
  },
  {
    "id": "TOOL_18",
    "name": "Validate Canon Compliance",
    "category": "validation",
    "oneTimeUse": false,
    "status": "active",
    "description": "Validates overall Canon compliance"
  }
]
```

---

## 🔒 Strengthened Rules for D-TOOL

### Rule 1: Tool Naming Convention

**Required Pattern:**
```
TOOL_{NUMBER}_{Purpose}.ts
```

**Examples:**
- ✅ `TOOL_30_ArchiveOneTimeTools.ts`
- ✅ `TOOL_18_ValidateCanonCompliance.ts`
- ❌ `archive-tools.ts` (missing TOOL_ prefix)
- ❌ `TOOL_Archive.ts` (missing number)

### Rule 2: Tool Classification

**Every tool MUST be classified:**
- Category: `migration` | `cleanup` | `validation` | `sync` | `utility`
- One-time use: `true` | `false`
- Status: `active` | `archived` | `deprecated`

**Location:** `tool-metadata.json`

### Rule 3: Archive Policy

**Tools MUST be archived if:**
- ✅ One-time migration completed
- ✅ One-time cleanup completed
- ✅ Tool is deprecated
- ✅ Tool is no longer used

**Archive Location:** `canon/D-Operations/D-TOOL/.archive/`

### Rule 4: Active Tool Limits

**D-TOOL directory SHOULD contain:**
- ✅ Only active, reusable tools
- ✅ Maximum 15-20 active tools
- ❌ No one-time use tools (after completion)
- ❌ No deprecated tools

### Rule 5: Documentation

**Every tool MUST have:**
- ✅ Header comment with purpose
- ✅ Usage examples in header
- ✅ Entry in `tool-metadata.json`
- ✅ npm script in `package.json` (if reusable)

---

## 🤖 Filesystem MCP Integration

### Capabilities

**Filesystem MCP can:**
1. **Query tool status:**
   ```
   "List all archived tools in D-TOOL"
   "Show active validation tools"
   ```

2. **Validate structure:**
   ```
   "Check if D-TOOL follows archive rules"
   "Find tools that should be archived"
   ```

3. **Auto-archive:**
   ```
   "Archive all completed migration tools"
   "Move deprecated tools to archive"
   ```

4. **Generate reports:**
   ```
   "Show tool classification breakdown"
   "List tools by category"
   ```

### MCP Queries

```typescript
// Query archived tools
const archived = await mcp_filesystem.listDirectory('canon/D-Operations/D-TOOL/.archive');

// Check tool count
const activeTools = await mcp_filesystem.listDirectory('canon/D-Operations/D-TOOL');
const toolCount = activeTools.filter(f => f.endsWith('.ts')).length;

// Validate structure
const hasArchive = await mcp_filesystem.exists('canon/D-Operations/D-TOOL/.archive');
const hasMetadata = await mcp_filesystem.exists('canon/D-Operations/D-TOOL/tool-metadata.json');
```

---

## 📊 Cleanup Workflow

### Step 1: Classify Tools

**Run classification:**
```bash
npm run canon:archive-tools -- --dry-run
```

**Review output:**
- Tools to archive
- Tools to keep active
- Classification accuracy

### Step 2: Archive Tools

**Archive one-time tools:**
```bash
npm run canon:archive-tools
```

**Result:**
- Tools moved to `.archive/`
- `tool-metadata.json` updated
- Active directory cleaned

### Step 3: Verify

**Check structure:**
```bash
# List active tools
ls canon/D-Operations/D-TOOL/*.ts

# List archived tools
ls canon/D-Operations/D-TOOL/.archive/

# View metadata
cat canon/D-Operations/D-TOOL/tool-metadata.json
```

### Step 4: Update Documentation

**Update:**
- `canon/registry.ts` (mark archived tools)
- `package.json` (remove archived tool scripts)
- README files

---

## ✅ Benefits

### 1. Clean Directory
- ✅ Only active tools visible
- ✅ Easy to find current tools
- ✅ Reduced clutter

### 2. Better Organization
- ✅ Clear tool lifecycle
- ✅ Historical record preserved
- ✅ Easy to reference old tools

### 3. Governance
- ✅ Enforced tool classification
- ✅ Automatic archive policy
- ✅ Metadata-driven management

### 4. Filesystem MCP
- ✅ Query tool status
- ✅ Validate structure
- ✅ Auto-archive capabilities

---

## 📝 Implementation Checklist

- [x] Create TOOL_30_ArchiveOneTimeTools.ts
- [x] Define tool classification system
- [x] Create archive directory structure
- [x] Add npm scripts
- [ ] Run initial archive (after review)
- [ ] Update canon/registry.ts
- [ ] Update package.json scripts
- [ ] Create D-TOOL README
- [ ] Integrate with Filesystem MCP

---

## 🔗 Related Documents

- **CONT_01_CanonIdentity.md** - Canon governance rules
- **REF_039_FilesystemMCP_CanonIntegration.md** - Filesystem MCP integration
- **TOOL_30_ArchiveOneTimeTools.ts** - Archive tool implementation
- **canon/D-Operations/D-TOOL/tool-metadata.json** - Tool classification

---

## 🚨 Important Notes

1. **Archive is permanent** - Archived tools should not be moved back
2. **Metadata is source of truth** - Always update `tool-metadata.json`
3. **Review before archiving** - Use `--dry-run` first
4. **Keep history** - Archived tools are preserved for reference

---

**Status:** ✅ **Ready for Implementation**  
**Priority:** **High** (D-TOOL directory cleanup)  
**Effort:** **Low** (automated tool available)  
**Value:** **High** (cleaner codebase, better organization)

---

**Last Updated:** 2025-01-27  
**Next Action:** Review tool classification and run initial archive
