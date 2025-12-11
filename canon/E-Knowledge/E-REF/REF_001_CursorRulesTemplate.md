> **🟢 [ACTIVE]** — Reference Document  
> **Canon Code:** REF_001  
> **Version:** 1.0.0  
> **Purpose:** Best practice template for Cursor IDE rules  
> **Plane:** E — Knowledge (Reference)

---

# REF_001: Cursor Rules Template

> **Purpose:** Reference template for creating optimized `.cursorrules` files.  
> **Usage:** Copy and customize for new projects.

---

## 📋 Template Structure

A well-structured `.cursorrules` file should contain these sections:

### 1. Header (Identity)
```markdown
# [Project Name] — Cursor IDE Rules
# ═══════════════════════════════════════════════════════════════
# Version: X.X.X | Last Updated: YYYY-MM-DD
# Modular rules: .cursor/rules/*.mdc (if using)
# ═══════════════════════════════════════════════════════════════
```

### 2. Governance/SSOT Reference
```markdown
## 🏛️ Governance (SSOT)

**Contract:** [Contract ID and version]
**Location:** [Path to contract]
```

### 3. Tech Stack (Concise Table)
```markdown
## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | React/Vue/etc | X.X+ |
| Language | TypeScript | X.X+ |
| Build | Vite/Next.js/etc | X.X |
| Styling | Tailwind/CSS | X.X+ |
```

### 4. Directory Structure (Brief)
```markdown
## 📁 Directory Structure

\`\`\`
src/          # Source code
components/   # UI components
lib/          # Utilities
\`\`\`
```

### 5. Forbidden Patterns (❌)
```markdown
## 🚫 Forbidden Patterns

1. ❌ [Specific anti-pattern]
2. ❌ [Another anti-pattern]
```

### 6. Preferred Patterns (✅)
```markdown
## ✅ Preferred Patterns

1. ✅ [Specific pattern to follow]
2. ✅ [Another pattern]
```

### 7. Commands (Quick Reference)
```markdown
## 🔍 Commands

\`\`\`bash
npm run dev       # Start dev server
npm run build     # Build for production
npm run lint      # Run linter
\`\`\`
```

### 8. Integrations (MCP/Tools)
```markdown
## 🔌 Integrations

| Tool | Purpose |
|------|---------|
| [Tool] | [Purpose] |
```

---

## 📐 Best Practices

### DO ✅

| Practice | Reason |
|----------|--------|
| Keep under 150 lines | AI reads full file each request |
| Use tables for data | Scannable, compact |
| Reference SSOT | Don't duplicate full specs |
| Use emoji headers | Quick visual scanning |
| Include forbidden patterns | Prevent common mistakes |
| Version the file | Track changes |

### DON'T ❌

| Anti-Pattern | Reason |
|--------------|--------|
| Long code examples | Use separate docs |
| Duplicate documentation | Reference instead |
| Generic advice | Be project-specific |
| Entire tutorials | Link to external docs |
| Verbose explanations | Keep concise |

---

## 📁 Modular Rules Structure

For larger projects, use `.cursor/rules/*.mdc`:

```
.cursor/
├── rules/
│   ├── governance.mdc        # [alwaysApply: true]
│   ├── security.mdc          # [alwaysApply: true]
│   ├── react-patterns.mdc    # [globs: **/*.tsx]
│   ├── api-conventions.mdc   # [globs: **/api/**]
│   └── testing.mdc           # [globs: **/*.test.*]
├── .cursorrules              # Summary/index (framework name)
└── README.md                 # Index (standard convention)
```

### MDC Frontmatter Format
```yaml
---
description: Brief description of rules
globs: ["**/*.tsx", "**/*.ts"]
alwaysApply: true  # or false
---

# Rule Content Here
```

---

## 🔢 Size Guidelines

| File Type | Target Lines | Max Lines |
|-----------|--------------|-----------|
| `.cursorrules` (main) | 80-120 | 150 |
| `.mdc` (modular rule) | 50-100 | 200 |
| Total across all rules | 300-400 | 500 |

---

## 🎯 Validation Script

Add to `package.json`:

```json
{
  "scripts": {
    "cursor:validate": "tsx scripts/TOOL_04_ValidateCursorRules.ts"
  }
}
```

---

## 📝 Changelog Template

Add at bottom of `.cursorrules`:

```markdown
---
## Changelog
- v1.1.0 (YYYY-MM-DD): Added security rules
- v1.0.0 (YYYY-MM-DD): Initial template
```

---

## Related Documents

- **CONT_01:** `canon/contracts/CONT_01_CanonIdentity.md`
- **TOOL_04:** `scripts/TOOL_04_ValidateCursorRules.ts`

---

**End of Template**

