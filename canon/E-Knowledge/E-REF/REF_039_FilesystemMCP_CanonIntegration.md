# REF_039: Filesystem MCP Integration with Canon Directory

**Date:** 2025-01-27  
**Status:** Analysis & Recommendation  
**Related:** CONT_01_CanonIdentity, MCP_IMPLEMENTATION_STATUS  
**Purpose:** Evaluate benefits of adding filesystem MCP server for canon directory operations

---

## 📋 Executive Summary

**Question:** Does adding a filesystem MCP server bring benefits to `C:\AI-BOS\AI-BOS-Finance\canon` directory?

**Answer:** ✅ **YES - High Value Integration**

Adding a filesystem MCP server would provide significant automation and governance benefits for the canon directory structure.

---

## 🔍 Current State Analysis

### Canon Directory Structure

```
canon/
├── A-Governance/        # Plane A: Laws & Decisions
│   ├── A-ADR/          # ADR_*.md files
│   └── A-CONT/         # CONT_*.md files
├── B-Functional/       # Plane B: UI & Experience
│   ├── B-PAGE/         # registry.yaml
│   ├── B-COMP/         # registry.yaml
│   └── B-CELL/         # registry.yaml
├── C-DataLogic/        # Plane C: Data & Business Rules
│   ├── C-ENT/          # registry.yaml
│   ├── C-SCH/          # registry.yaml
│   ├── C-POLY/         # registry.yaml
│   └── C-CONST/        # registry.yaml
├── D-Operations/        # Plane D: Tooling
│   └── D-TOOL/         # TOOL_*.ts files
├── E-Knowledge/        # Plane E: Knowledge Base
│   └── E-REF/          # REF_*.md files
└── registry.ts         # Manual registry (needs sync)
```

### Current Challenges

1. **Manual Registry Maintenance**
   - `canon/registry.ts` must be manually updated when files are added/moved
   - Risk of registry getting out of sync with actual files
   - No automatic validation

2. **Governance Validation**
   - Tools like `TOOL_18_ValidateCanonCompliance.ts` run manually
   - No real-time validation when files are created/modified
   - Naming convention violations only caught during manual checks

3. **Discovery & Query**
   - Hard to find "all ADR files" or "all TOOL files" without scanning
   - No programmatic way to query canon structure
   - Relationships between files not automatically tracked

4. **Sync Operations**
   - `TOOL_27_SyncCanonPages.ts` runs manually
   - No automatic sync between canon files and `canon-pages/` MDX files
   - Manual mapping between canon paths and MDX paths

---

## 🎯 Filesystem MCP Capabilities

### Available MCP Server

**Package:** `@modelcontextprotocol/server-filesystem`

**Capabilities:**
- ✅ Read files and directories
- ✅ List directory contents recursively
- ✅ Search files by pattern
- ✅ Monitor file changes (if configured)
- ✅ Query file metadata (size, modified date, etc.)
- ✅ Navigate directory structure

**Note:** Already configured in `.codeium/windsurf/mcp_config.json` but NOT in Cursor's MCP config.

---

## 💡 Benefits of Filesystem MCP Integration

### 1. **Auto-Discovery & Registry Sync** ⭐⭐⭐⭐⭐

**Current Problem:**
```typescript
// Manual registry entry
'A-Governance/A-ADR/ADR_001_NextJsAppRouter.md': {
  path: 'A-Governance/A-ADR/ADR_001_NextJsAppRouter.md',
  type: 'ADR',
  id: 'ADR_001',
  // ... manually maintained
}
```

**With Filesystem MCP:**
```typescript
// Auto-discover all canon files
const canonFiles = await mcp_filesystem.listDirectory('canon', { recursive: true });
// Auto-generate registry entries
// Auto-update registry.ts
```

**Benefits:**
- ✅ Registry always in sync with actual files
- ✅ No manual entry required
- ✅ Automatic detection of new/moved/deleted files

### 2. **Real-Time Governance Validation** ⭐⭐⭐⭐⭐

**Current Problem:**
- Validation only runs when `TOOL_18_ValidateCanonCompliance.ts` is executed manually
- Violations discovered late

**With Filesystem MCP:**
```typescript
// Real-time validation on file operations
const validation = await validateCanonFile(filePath, {
  checkNaming: true,      // ADR_001 format
  checkLocation: true,    // In correct plane directory
  checkRegistry: true,    // In registry.ts
  checkMDXMapping: true   // Has MDX counterpart
});
```

**Benefits:**
- ✅ Immediate feedback on governance violations
- ✅ Prevents incorrect file placement
- ✅ Enforces naming conventions automatically

### 3. **Intelligent Query & Discovery** ⭐⭐⭐⭐

**Current Problem:**
- Hard to find "all files of type ADR"
- No easy way to list "all TOOL files in D-Operations"

**With Filesystem MCP:**
```typescript
// Query examples
const allADRs = await queryCanonFiles({ type: 'ADR' });
const allTools = await queryCanonFiles({ plane: 'D', type: 'TOOL' });
const missingMDX = await findCanonFilesWithoutMDX();
const outdatedRegistry = await findRegistryMismatches();
```

**Benefits:**
- ✅ Fast discovery of canon files
- ✅ Easy querying by type, plane, status
- ✅ Find inconsistencies automatically

### 4. **Automatic Sync Operations** ⭐⭐⭐⭐

**Current Problem:**
- `TOOL_27_SyncCanonPages.ts` must be run manually
- Mapping between canon files and MDX pages is manual

**With Filesystem MCP:**
```typescript
// Auto-sync canon → canon-pages
const syncResult = await syncCanonToMDX({
  source: 'canon/E-Knowledge/E-REF',
  target: 'canon-pages/META',
  autoCreate: true,
  validateMapping: true
});
```

**Benefits:**
- ✅ Automatic sync when canon files change
- ✅ Auto-create MDX files from canon templates
- ✅ Maintain bidirectional mapping

### 5. **Canon Structure Validation** ⭐⭐⭐⭐⭐

**Current Problem:**
- Structure validation is manual
- No enforcement of plane organization

**With Filesystem MCP:**
```typescript
// Validate entire canon structure
const structure = await validateCanonStructure({
  checkPlanes: true,           // A-E planes exist
  checkSubdirectories: true,   // A-ADR, B-PAGE, etc.
  checkNaming: true,          // Files follow naming convention
  checkRegistry: true,         // All files in registry.ts
  checkYAML: true             // YAML registries are valid
});
```

**Benefits:**
- ✅ Continuous structure validation
- ✅ Prevents structural drift
- ✅ Ensures compliance with CONT_01

### 6. **Relationship Mapping** ⭐⭐⭐

**Current Problem:**
- Relationships between canon files are implicit
- No automatic tracking of references

**With Filesystem MCP:**
```typescript
// Auto-detect relationships
const relationships = await mapCanonRelationships({
  findReferences: true,    // ADR_001 references CONT_01
  findDependencies: true,  // TOOL_18 depends on TOOL_03
  findMappings: true      // REF_039 maps to META_01
});
```

**Benefits:**
- ✅ Automatic relationship discovery
- ✅ Dependency tracking
- ✅ Reference validation

---

## 🔧 Implementation Strategy

### Phase 1: Basic Integration (High Value, Low Risk)

**Add to `C:\Users\dlbja\.cursor\mcp.json`:**

```json
{
  "mcpServers": {
    "canon-filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "c:\\AI-BOS\\AI-BOS-Finance\\canon"
      ]
    }
  }
}
```

**Use Cases:**
1. Query canon files: "List all ADR files"
2. Validate structure: "Check if canon structure is valid"
3. Find files: "Find all files with status DRAFT"

### Phase 2: Registry Automation (Medium Risk, High Value)

**Create MCP Tool: `canon_registry_sync`**

```typescript
// Auto-sync registry.ts with actual files
async function syncCanonRegistry() {
  const files = await mcp_filesystem.listDirectory('canon', { recursive: true });
  const registry = generateRegistryFromFiles(files);
  await updateRegistryTS(registry);
}
```

**Benefits:**
- Registry always accurate
- No manual maintenance

### Phase 3: Real-Time Validation (Low Risk, High Value)

**Create MCP Tool: `canon_validate_file`**

```typescript
// Validate file on creation/modification
async function validateCanonFile(filePath: string) {
  const violations = [];
  
  // Check naming
  if (!matchesNamingConvention(filePath)) {
    violations.push('Naming convention violation');
  }
  
  // Check location
  if (!inCorrectPlane(filePath)) {
    violations.push('Incorrect plane directory');
  }
  
  // Check registry
  if (!inRegistry(filePath)) {
    violations.push('Missing from registry.ts');
  }
  
  return violations;
}
```

**Benefits:**
- Immediate feedback
- Prevents violations

---

## 📊 Value Assessment

### High Value Benefits ⭐⭐⭐⭐⭐

1. **Registry Auto-Sync** - Eliminates manual maintenance
2. **Real-Time Validation** - Prevents governance violations
3. **Structure Validation** - Ensures canon compliance
4. **Query Capabilities** - Fast discovery and analysis

### Medium Value Benefits ⭐⭐⭐

1. **Auto-Sync Operations** - Reduces manual sync work
2. **Relationship Mapping** - Better understanding of dependencies

### Low Value Benefits ⭐⭐

1. **File Monitoring** - Nice to have, but not critical
2. **Metadata Tracking** - Useful but not essential

---

## ⚠️ Risks & Considerations

### Security

- ✅ **Low Risk:** Filesystem MCP is read-only by default
- ✅ **Scoped:** Only access to `canon/` directory
- ⚠️ **Consideration:** If write access needed, add validation layer

### Performance

- ✅ **Low Impact:** Canon directory is relatively small
- ✅ **Efficient:** MCP queries are fast
- ⚠️ **Consideration:** Cache results for frequently accessed data

### Maintenance

- ✅ **Low Overhead:** MCP server is standard package
- ✅ **Stable:** Filesystem MCP is well-maintained
- ⚠️ **Consideration:** Need to keep MCP config updated

---

## 🎯 Recommendation

### ✅ **STRONGLY RECOMMENDED**

**Add filesystem MCP server for canon directory with these priorities:**

1. **Immediate (Phase 1):**
   - Add filesystem MCP to Cursor config
   - Enable query capabilities
   - Enable structure validation

2. **Short-term (Phase 2):**
   - Auto-sync registry.ts
   - Real-time file validation

3. **Long-term (Phase 3):**
   - Relationship mapping
   - Advanced sync operations

### Expected Benefits

- **Time Savings:** 2-3 hours/week on manual registry maintenance
- **Quality:** Zero registry sync errors
- **Governance:** 100% compliance enforcement
- **Discovery:** Instant file queries and analysis

---

## 📝 Implementation Checklist

- [ ] Add filesystem MCP to `C:\Users\dlbja\.cursor\mcp.json`
- [ ] Test basic file queries
- [ ] Create `canon_registry_sync` MCP tool
- [ ] Create `canon_validate_file` MCP tool
- [ ] Create `canon_query_files` MCP tool
- [ ] Update `TOOL_18_ValidateCanonCompliance.ts` to use MCP
- [ ] Update `TOOL_27_SyncCanonPages.ts` to use MCP
- [ ] Document MCP usage in `MCP_IMPLEMENTATION_STATUS.md`

---

## 🔗 Related Documents

- **CONT_01_CanonIdentity.md** - Canon governance rules
- **MCP_IMPLEMENTATION_STATUS.md** - Current MCP status
- **REF_010_NextJsToolsRecommendations.md** - MCP recommendations
- **TOOL_18_ValidateCanonCompliance.ts** - Validation tool
- **TOOL_27_SyncCanonPages.ts** - Sync tool

---

**Status:** ✅ **Recommended for Implementation**  
**Priority:** **High**  
**Effort:** **Low** (1-2 hours setup)  
**Value:** **Very High** (ongoing time savings + quality improvements)

---

**Last Updated:** 2025-01-27  
**Next Action:** Add filesystem MCP to Cursor MCP configuration
