> **🟢 [ACTIVE]** — Figma Integration Directory  
> **Purpose:** Tool outputs for Figma/FigJam sync  
> **Reference:** `knowledge/REF_002_FigmaIntegration.md`  
> **Last Updated:** 2025-12-11

---

# Figma Integration

## 📁 Directory Contents

| File | Type | Description |
|------|------|-------------|
| `mindmap-structure.json` | Auto-generated | Mindmap structure from codebase |
| `plugin-code.ts` | Auto-generated | Figma Plugin code for populating mindmap |

> **Note:** Auto-generated files do not have Canon IDs (CONT_01 Section 3.7)

---

## 🔧 Quick Commands

```bash
# Pull from Figma (Figma → Codebase)
npm run figma:sync

# Push to Figma (Codebase → Figma)
npm run figma:push
```

---

## 📚 Documentation

For full integration guide, see: `knowledge/REF_002_FigmaIntegration.md`

---

## ⚙️ Environment

Required: `FIGMA_API_TOKEN` in `.env` file

Get token: https://www.figma.com/settings → Personal Access Tokens
