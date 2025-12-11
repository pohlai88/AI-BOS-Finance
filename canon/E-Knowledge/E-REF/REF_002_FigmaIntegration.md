> **🟢 [ACTIVE]** — Reference Document  
> **Canon Code:** REF_002  
> **Version:** 1.0.0  
> **Purpose:** Figma/FigJam integration guide for AI-BOS  
> **Plane:** E — Knowledge (Reference)

---

# REF_002: Figma Integration Guide

> **Purpose:** Complete guide for Figma/FigJam sync with AI-BOS codebase.  
> **Output Directory:** `.figma/`

---

## 📋 Overview

AI-BOS uses bidirectional sync with Figma/FigJam for architecture visualization:

| Direction | Command | Description |
|-----------|---------|-------------|
| Pull | `npm run figma:sync` | Figma → Codebase |
| Push | `npm run figma:push` | Codebase → Figma |

---

## 🔄 Pull: Figma → Codebase

```bash
npm run figma:sync
```

**What gets synced:**
- Architecture structure (Atomic Cells, Molecules, Flows)
- Design metadata
- TypeScript types
- JSON data files

**Output location:** `src/data/figma/`

---

## 🔄 Push: Codebase → Figma

```bash
npm run figma:push
```

**What gets synced:**
- Canon records from `src/data/mockCanonMatrix.ts`
- Metadata types from `src/types/metadata.ts`
- Payment flows from `src/modules/payment/data/paymentSchema.ts`
- Architecture components

**Output location:** `.figma/`

---

## 📁 Generated Files

### `.figma/mindmap-structure.json`

Mindmap structure in JSON format:

```json
{
  "name": "AI-BOS Finance Architecture",
  "children": [
    { "name": "Principle Layer", "children": [...] },
    { "name": "Process Layer", "children": [...] },
    { "name": "Kernel Layer", "children": [...] },
    { "name": "Canon & Standards", "children": [...] }
  ]
}
```

### `.figma/plugin-code.ts`

Figma Plugin code for auto-populating mindmap.

---

## 🔌 Using Generated Files

### Option 1: Figma Plugin (Recommended)

1. Open your Figma file
2. Go to **Plugins** → **Development** → **Import plugin from manifest**
3. Create a new plugin with the code from `plugin-code.ts`
4. Run the plugin to populate the mindmap

### Option 2: Manual Import

1. Use the `mindmap-structure.json` file
2. Import it using a Figma plugin that supports JSON import
3. Or manually recreate the structure based on the JSON

### Option 3: Figma REST API (Limited)

The Figma REST API has limitations for creating FigJam nodes. For full automation, use the plugin approach.

---

## 🏗️ Mindmap Hierarchy

```
AI-BOS Finance Architecture
├── Principle Layer
│   ├── Atomic Cells
│   └── Domain Molecules
├── Process Layer
│   └── Process Families
├── Kernel Layer
│   └── Core Services
└── Canon & Standards
    └── Canon Records
```

---

## ⚙️ Environment Setup

Required: `FIGMA_API_TOKEN` in `.env` file

```bash
# Get token from Figma
# https://www.figma.com/settings → Personal Access Tokens

FIGMA_API_TOKEN=your_token_here
```

---

## 🎨 Customization

Edit `canon/D-Operations/D-TOOL/figma-push.ts` to:
- Add more data sources
- Customize node styling
- Change mindmap layout
- Add custom node types

---

## Related Documents

- **CONT_01:** `canon/contracts/CONT_01_CanonIdentity.md`
- **Output Directory:** `.figma/README.md`

---

**End of Reference**

