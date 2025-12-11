> **🟢 [ACTIVE]** — Cursor IDE Configuration Index  
> **Derives From:** CONT_01 v2.2.0  
> **Purpose:** Index and quick reference for Cursor rules  
> **Last Updated:** 2025-12-11

---

# Cursor IDE Configuration

## 📁 Structure

| File | Type | Purpose |
|------|------|---------|
| `.cursorrules` | Framework | Main entry point (required by Cursor) |
| `rules/*.mdc` | Framework | Modular rule files (required format by Cursor) |
| `mcp.json` | Framework | MCP server configuration |

---

## Active Rules

| File | Lines | Scope | Always Apply |
|------|-------|-------|-------------|
| `rules/canon-governance.mdc` | 88 | TS/TSX/YAML/MD | ✅ |
| `rules/security-rules.mdc` | 105 | API/Actions | ✅ |
| `rules/react-conventions.mdc` | 84 | TS/TSX/JS/JSX | ❌ |
| `rules/mcp-workflows.mdc` | 76 | All | ❌ |

---

## Quick Reference

- **Canon Governance:** `canon/contracts/CONT_01_CanonIdentity.md`
- **Security Rules:** `canon/contracts/adrs/ADR_002_CanonSecurity.md`
- **Template:** `knowledge/REF_001_CursorRulesTemplate.md`

---

## Validation

```bash
npx tsx scripts/TOOL_04_ValidateCursorRules.ts
```

---

## Naming Convention Rationale

| File Type | Naming | Reason |
|-----------|--------|--------|
| `.cursorrules` | Exact name | Framework requirement |
| `*.mdc` | Descriptive | Cursor format requirement |
| `README.md` | Standard | Industry convention |
| `mcp.json` | Exact name | Framework requirement |

> **Note:** Files in `.cursor/` follow **framework conventions** (Cursor IDE requirements),
> not Canon ID patterns. This is consistent with CONT_01 Section 3.7 (Exclusions).

