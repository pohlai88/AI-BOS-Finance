# REF_045: File Access Control Strategy

**Date:** 2025-01-27  
**Status:** ✅ Active  
**Related:** ADR_002_CanonSecurity, REF_040_UnauditedDocsWorkflow  
**Purpose:** Define strict file access control - only `src/` writable, all else read-only

---

## 🎯 Problem Statement

**Requirement:** Lock down entire project except `src/` directory. All other directories must be read-only to prevent accidental modifications to governance files, configuration, and application structure.

**Solution:** Multi-layer access control system enforcing write restrictions at IDE, MCP, and Git levels.

---

## 🔒 Access Control Matrix

| Directory | Write Access | Read Access | Notes |
|-----------|-------------|-------------|-------|
| `src/` | ✅ **ALLOWED** | ✅ Allowed | Only writable directory |
| `canon/` | ❌ **FORBIDDEN** | ✅ Allowed | Use `.staging-docs/` workflow |
| `canon-pages/` | ❌ **FORBIDDEN** | ✅ Allowed | Use promotion workflow |
| `app/` | ❌ **FORBIDDEN** | ✅ Allowed | Routes locked |
| `.staging-docs/` | ⚠️ **STAGING ONLY** | ✅ Allowed | Temporary staging area |
| `public/` | ❌ **FORBIDDEN** | ✅ Allowed | Static assets only |
| `db/` | ❌ **FORBIDDEN** | ✅ Allowed | Database schemas locked |
| Root config files | ❌ **FORBIDDEN** | ✅ Allowed | Manual approval required |

---

## 🛡️ Enforcement Layers

### Layer 1: Cursor IDE Rules

**File:** `.cursor/rules/file-access-control.mdc`

**Enforcement:**
- AI assistants blocked from writing outside `src/`
- Real-time validation during file operations
- Error messages on violation attempts

**Example Error:**
```
🔴 FORBIDDEN: File write outside src/ directory
   Attempted: app/page.tsx
   Allowed: Only files in src/ directory
```

### Layer 2: MCP Server Restrictions

#### Filesystem MCP Configuration
```json
"src-filesystem": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "c:\\AI-BOS\\AI-BOS-Finance\\src"
  ]
}
```

**Restriction:** Only `src/` directory accessible for writes.

#### Next.js MCP Configuration
```json
"next-devtools": {
  "command": "npx",
  "args": ["-y", "next-devtools-mcp@latest"],
  "env": {
    "NEXT_MCP_ALLOWED_DIRS": "src",
    "NEXT_MCP_BLOCKED_DIRS": "canon,canon-pages,app,public,db",
    "NEXT_MCP_READ_ONLY_MODE": "true"
  }
}
```

**Restriction:** Only allows operations in `src/` directory.

### Layer 3: Git Pre-commit Hooks

**File:** `.husky/pre-commit` (if using Husky)

```bash
#!/bin/sh
# Validate only src/ changes allowed

CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

for FILE in $CHANGED_FILES; do
  if [[ ! "$FILE" =~ ^src/ ]]; then
    echo "🔴 FORBIDDEN: Cannot commit changes outside src/ directory"
    echo "   File: $FILE"
    echo "   Action: Only src/ directory changes are allowed"
    exit 1
  fi
done
```

---

## 🔄 Workflows for Locked Directories

### Workflow 1: Canon Files (canon/)

**Problem:** Need to add/modify Canon governance files

**Solution:** Staging workflow
1. Create file in `.staging-docs/` (staging allowed)
2. Review and validate
3. Promote: `npm run canon:promote <file-path>`
4. File moved to `canon/` (automated, not manual edit)

**Example:**
```bash
# Step 1: Create in staging
.staging-docs/A-Governance/A-ADR/ADR_003_NewDecision.md

# Step 2: Promote
npm run canon:promote .staging-docs/A-Governance/A-ADR/ADR_003_NewDecision.md

# Result: File moved to canon/ automatically
```

### Workflow 2: App Routes (app/)

**Problem:** Need to modify route behavior

**Solution:** Edit `src/` components instead
- ✅ Edit `src/modules/` components
- ✅ Edit `src/components/` components
- ✅ Edit `src/hooks/` hooks
- ❌ Do NOT edit `app/` route files

**Example:**
```typescript
// ❌ FORBIDDEN: Editing app/payments/page.tsx
// ✅ ALLOWED: Editing src/modules/payment/PAY_01_PaymentHub.tsx
```

### Workflow 3: Configuration Files

**Problem:** Need to change `package.json`, `tsconfig.json`, etc.

**Solution:** Manual approval workflow
1. Request configuration change
2. Developer reviews and approves
3. Manual edit by developer (bypasses restrictions)
4. Commit with special flag: `[CONFIG]`

---

## 🧪 Validation Tool

**File:** `canon/D-Operations/D-TOOL/TOOL_31_ValidateFileAccess.ts`

**Purpose:** Validate file access control compliance

**Usage:**
```bash
npm run canon:validate-access
```

**Checks:**
- ✅ All files in `src/` are writable
- ❌ No write attempts outside `src/`
- ✅ Staging files in correct location
- ❌ No direct edits to `canon/`, `app/`, config files

---

## 📊 Access Control Rules

### Rule 1: Path Validation
```typescript
function isPathAllowed(filePath: string): boolean {
  // Only src/ is allowed
  return filePath.startsWith('src/');
}

// ✅ ALLOWED
isPathAllowed('src/components/MyComponent.tsx'); // true
isPathAllowed('src/modules/payment/hooks/usePayment.ts'); // true

// ❌ FORBIDDEN
isPathAllowed('app/page.tsx'); // false
isPathAllowed('canon/A-Governance/ADR_003.md'); // false
isPathAllowed('package.json'); // false
```

### Rule 2: Staging Exception
```typescript
function isStagingPath(filePath: string): boolean {
  // Staging directory allowed for temporary files
  return filePath.startsWith('.staging-docs/');
}

// ⚠️ STAGING ALLOWED (temporary)
isStagingPath('.staging-docs/A-Governance/ADR_003.md'); // true
```

### Rule 3: Read-Only Exception
```typescript
function isReadOnlyPath(filePath: string): boolean {
  const readOnlyDirs = ['canon/', 'canon-pages/', 'app/', 'public/', 'db/'];
  return readOnlyDirs.some(dir => filePath.startsWith(dir));
}

// ❌ READ-ONLY
isReadOnlyPath('canon/A-Governance/ADR_001.md'); // true
isReadOnlyPath('app/page.tsx'); // true
```

---

## 🔧 MCP Configuration Updates

### Updated Global MCP Config

```json
{
  "mcpServers": {
    "src-filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "c:\\AI-BOS\\AI-BOS-Finance\\src"
      ]
    },
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"],
      "env": {
        "NEXT_MCP_ALLOWED_DIRS": "src",
        "NEXT_MCP_BLOCKED_DIRS": "canon,canon-pages,app,public,db",
        "NEXT_MCP_READ_ONLY_MODE": "true"
      }
    },
    "canon-filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "c:\\AI-BOS\\AI-BOS-Finance\\canon"
      ],
      "readOnly": true
    }
  }
}
```

---

## 📋 Implementation Checklist

- [x] Create Cursor rule: `.cursor/rules/file-access-control.mdc`
- [x] Create Canon reference: `REF_045_FileAccessControl.md`
- [x] Update MCP configurations (global `mcp.json`)
- [x] Create validation tool: `TOOL_31_ValidateFileAccess.ts`
- [x] Add npm script: `canon:validate-access`
- [x] Test validation tool
- [ ] Add Git pre-commit hook (optional)
- [ ] Test enforcement with AI assistant
- [x] Document exceptions and workarounds

---

## 🚨 Security Considerations

### Why This Matters

1. **Governance Protection:** Prevents accidental modification of Canon files
2. **Configuration Safety:** Protects critical config files
3. **Structure Integrity:** Maintains application architecture
4. **Audit Trail:** All changes go through proper workflows

### Bypass Procedures

**Emergency Bypass (Developer Only):**
1. Temporarily disable Cursor rule
2. Make required change
3. Re-enable rule immediately
4. Document bypass in commit message: `[BYPASS] Reason: ...`

---

## 📚 Related Documents

- **`.cursor/rules/file-access-control.mdc`** - IDE enforcement rules
- **REF_040_UnauditedDocsWorkflow.md** - Staging workflow for canon files
- **ADR_002_CanonSecurity.md** - Security architecture decisions

---

**Status:** ✅ **ACTIVE**  
**Last Updated:** 2025-01-27  
**Enforcement:** Multi-layer (IDE, MCP, Git)
