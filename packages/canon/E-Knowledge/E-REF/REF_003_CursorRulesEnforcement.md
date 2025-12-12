> **🟢 [ACTIVE]** — Reference Document  
> **Canon Code:** REF_003  
> **Version:** 1.0.0  
> **Purpose:** Guide to ensure Cursor IDE rules are being applied  
> **Plane:** E — Knowledge (Reference)

---

# REF_003: Cursor Rules Enforcement Guide

> **Purpose:** Complete guide for verifying and ensuring Cursor IDE rules are actively applied and enforced.

---

## 📋 Quick Verification

### 1. Run Validation Script

```bash
# Validate all rule files
npx tsx canon/D-Operations/D-TOOL/TOOL_04_ValidateCursorRules.ts
```

**Expected Output:**
```
✨ PASSED: All rule files are valid and optimized.
```

### 2. Check Rule Files Exist

```bash
# Verify rule files are in place
ls .cursor/rules/*.mdc
ls .cursor/.cursorrules
```

**Required Files:**
- `.cursor/.cursorrules` - Main entry point (required by Cursor)
- `.cursor/rules/*.mdc` - Modular rule files (4 files currently)

---

## 🎯 How Cursor Applies Rules

### File Locations (Priority Order)

1. **`.cursor/.cursorrules`** (or `.cursorrules` at root)
   - Main entry point
   - Cursor reads this first
   - Can reference modular rules

2. **`.cursor/rules/*.mdc`** (Modular Rules)
   - Individual rule files with frontmatter
   - Applied based on `globs` patterns
   - `alwaysApply: true` = always active

### Rule File Format (`.mdc`)

```markdown
---
description: Rule Description
globs: ["**/*.tsx", "**/*.ts"]
alwaysApply: true
---

# Rule Content
...
```

**Key Fields:**
- `description` - Human-readable description
- `globs` - File patterns to apply rule to
- `alwaysApply` - If `true`, rule is always active (not context-based)

---

## ✅ Verification Checklist

### 1. File Structure ✓

```
.cursor/
├── .cursorrules          # Main entry (159 lines) ✅
├── README.md            # Documentation ✅
├── mcp.json             # MCP config ✅
└── rules/
    ├── canon-governance.mdc    # [always] ✅
    ├── security-rules.mdc      # [always] ✅
    ├── react-conventions.mdc   # Context-based ✅
    └── mcp-workflows.mdc       # Context-based ✅
```

### 2. Validation Status ✓

Run validation:
```bash
npx tsx canon/D-Operations/D-TOOL/TOOL_04_ValidateCursorRules.ts
```

**All checks should pass:**
- ✅ File size limits (< 500 lines)
- ✅ MDC frontmatter present
- ✅ Canon references present
- ✅ Required sections present

### 3. Active Rules Status

| Rule File | Lines | Always Apply | Status |
|-----------|-------|--------------|--------|
| `canon-governance.mdc` | 88 | ✅ Yes | ✅ Active |
| `security-rules.mdc` | 105 | ✅ Yes | ✅ Active |
| `react-conventions.mdc` | 84 | ❌ No | Context-based |
| `mcp-workflows.mdc` | 76 | ❌ No | Context-based |

---

## 🧪 Testing Rule Enforcement

### Test 1: Canon Governance Rule

**Try to create a page without `PAGE_META`:**

```typescript
// ❌ This should trigger a warning from canon-governance.mdc
export default function MyPage() {
  return <div>Page</div>;
}
```

**Expected:** Cursor should suggest adding `PAGE_META` export.

### Test 2: Security Rule

**Try to trust client CanonContext:**

```typescript
// ❌ This should trigger a warning from security-rules.mdc
export async function POST(request: NextRequest) {
  const { canon } = await request.json();
  const schema = await loadSchema(canon.schemaCode); // Client-provided!
}
```

**Expected:** Cursor should warn about trusting client data.

### Test 3: React Conventions

**Try to use relative imports beyond 2 levels:**

```typescript
// ❌ This should trigger a suggestion from react-conventions.mdc
import { Button } from '../../../components/Button';
```

**Expected:** Cursor should suggest using path aliases (`@/`).

---

## 🔧 Troubleshooting

### Issue: Rules Not Being Applied

**Check 1: File Location**
```bash
# Ensure .cursorrules exists
ls -la .cursor/.cursorrules
```

**Check 2: Cursor Settings**
- Open Cursor Settings
- Search for "rules" or "cursorrules"
- Ensure rules are enabled

**Check 3: Restart Cursor**
- Close and reopen Cursor IDE
- Rules are loaded on startup

### Issue: Validation Fails

**Check MDC Frontmatter:**
```markdown
---
description: Rule Description
globs: ["**/*.tsx"]
alwaysApply: true
---
```

**Required:**
- Frontmatter must start with `---`
- Must include `description`
- `globs` should be an array
- `alwaysApply` should be boolean

### Issue: Rules Too Large

**Solution:** Split into smaller files
- Keep each rule file < 200 lines (warning)
- Keep each rule file < 500 lines (error)
- Use modular structure (`.mdc` files)

---

## 📊 Current Rule Status

**Last Validated:** 2025-12-11  
**Status:** ✅ All rules valid

```
Total Files:        5
MDC Rules:          4
Total Lines:        512
Canon References:   5/5
Errors:             0
Warnings:           0
```

---

## 🎯 Best Practices

### 1. Keep Rules Modular
- One concern per `.mdc` file
- Use descriptive names
- Keep files < 200 lines

### 2. Use `alwaysApply` Wisely
- Only for critical rules (governance, security)
- Context-based rules for conventions

### 3. Validate Regularly
```bash
# Add to pre-commit hook or CI
npx tsx canon/D-Operations/D-TOOL/TOOL_04_ValidateCursorRules.ts
```

### 4. Update Rules When Contract Changes
- When CONT_01 updates, update rules
- Keep rules in sync with SSOT
- Document changes in rule files

---

## 📚 Related Documents

- **CONT_01:** `canon/A-Governance/A-CONT/CONT_01_CanonIdentity.md`
- **ADR_002:** `canon/A-Governance/A-ADR/ADR_002_CanonSecurity.md`
- **Template:** `canon/E-Knowledge/E-REF/REF_001_CursorRulesTemplate.md`
- **Validation Tool:** `canon/D-Operations/D-TOOL/TOOL_04_ValidateCursorRules.ts`

---

## ✅ Quick Reference Commands

```bash
# Validate rules
npx tsx canon/D-Operations/D-TOOL/TOOL_04_ValidateCursorRules.ts

# Check rule files
ls .cursor/rules/*.mdc

# View main rules
cat .cursor/.cursorrules

# View specific rule
cat .cursor/rules/canon-governance.mdc
```

---

**Last Updated:** 2025-12-11  
**Status:** ✅ Active and Validated
