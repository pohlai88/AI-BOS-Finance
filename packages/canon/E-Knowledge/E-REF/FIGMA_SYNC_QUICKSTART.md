# 🚀 Figma Integration - Quick Start Guide

## Two-Way Sync Available

- **Pull FROM Figma** → `npm run figma:sync` (Figma → Codebase)
- **Push TO Figma** → `npm run figma:push` (Codebase → Figma)

## Setup in 3 Steps

### Step 1: Get Figma API Token
1. Go to https://www.figma.com/settings
2. Click **Personal Access Tokens** → **Create new token**
3. Copy the token

### Step 2: Create `.env` File
```bash
FIGMA_API_TOKEN=your_token_here
FIGMA_FILE_KEY=w0bI6UKGtkTUwzhMGMhs93
```

### Step 3: Run Sync
```bash
npm install
npm run figma:sync
```

## ✅ What Gets Synced

- **Architecture Structure**: Atomic Cells, Molecules, Flows, Kernel Layer
- **Design Metadata**: File info, last modified dates
- **TypeScript Types**: Auto-generated type definitions
- **JSON Data**: Structured design data

## 📁 Output Location

Synced files are saved to: `src/data/figma/`

## 🔄 Automatic Sync

The GitHub Actions workflow runs **daily at 9 AM UTC** and creates PRs when designs change.

**To enable:**
1. Add `FIGMA_API_TOKEN` to GitHub Secrets
2. Workflow is already configured in `.github/workflows/figma-sync.yml`

## 🔄 Populate Mindmap from Codebase

To automatically populate your Figma mindmap with codebase data:

```bash
npm run figma:push
```

This generates:
- `.figma/mindmap-structure.json` - Mindmap data
- `.figma/plugin-code.ts` - Figma Plugin code

See [FIGMA_PUSH_SETUP.md](./FIGMA_PUSH_SETUP.md) for details.

## 📖 Full Documentation

- [Figma Sync Setup](./FIGMA_SYNC_SETUP.md) - Pulling FROM Figma
- [Figma Push Setup](./FIGMA_PUSH_SETUP.md) - Pushing TO Figma

