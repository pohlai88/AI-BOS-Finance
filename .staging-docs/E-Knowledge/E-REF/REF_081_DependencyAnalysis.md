# REF_081: Dependency Analysis & pnpm Migration Handoff

> **🟡 [STAGING]** — Dependency Analysis Document  
> **Date:** 2025-01-27  
> **Purpose:** Pre-migration dependency audit before pnpm + Turborepo conversion  
> **Status:** Ready for Review → Promote to Canon

---

## 🎯 Executive Summary

**Current State:** Monorepo using npm workspaces + Turborepo (partially configured)  
**Target State:** Full pnpm + Turborepo monorepo  
**Critical Issues Found:** 3 version conflicts, 47 duplicate dependencies, improper hoisting

---

## 📊 Dependency Inventory

### Root Package (`package.json`)
- **Total Dependencies:** 60
- **Total DevDependencies:** 24
- **Package Manager:** npm (with workspaces)
- **Turborepo:** ✅ Installed (v2.6.3) but not fully utilized

### Apps/Web (`apps/web/package.json`)
- **Total Dependencies:** 57
- **Total DevDependencies:** 22
- **Internal Dependencies:** `@aibos/canon: *`

### Apps/Kernel (`apps/kernel/package.json`)
- **Total Dependencies:** 6
- **Total DevDependencies:** 4
- **Internal Dependencies:** `@aibos/schemas: *`
- **Missing:** `drizzle-kit` (used in scripts but not in devDependencies)

### Packages/Schemas (`packages/schemas/package.json`)
- **Total Dependencies:** 1
- **Total DevDependencies:** 2
- **⚠️ CRITICAL:** Uses `zod: ^3.25.76` (root uses `zod: ^4.1.13`)

### Packages/Canon (`packages/canon/package.json`)
- **Total Dependencies:** 0
- **Total DevDependencies:** 2

---

## 🔴 Critical Issues

### 1. **Zod Version Conflict** (BLOCKER)
```
Root:           zod: ^4.1.13
packages/schemas: zod: ^3.25.76  ← MAJOR VERSION MISMATCH
```
**Impact:** Type incompatibility, runtime errors  
**Fix:** Upgrade `packages/schemas` to `zod: ^4.1.13`

### 2. **Duplicate Dependencies** (47 packages)
Root package.json contains ALL dependencies that should be hoisted:
- All `@radix-ui/*` packages (duplicated in apps/web)
- All `@dnd-kit/*` packages (duplicated in apps/web)
- React ecosystem (react, react-dom, next, etc.)
- Testing tools (vitest, @testing-library/*)

**Impact:** Larger node_modules, slower installs, potential version conflicts  
**Fix:** Remove from root, let pnpm hoist automatically

### 3. **Missing drizzle-kit**
```json
// apps/kernel/package.json
"scripts": {
  "db:push": "drizzle-kit push",  // ← Uses drizzle-kit
  "db:generate": "drizzle-kit generate"
}
// But drizzle-kit is NOT in devDependencies!
```
**Fix:** Add `"drizzle-kit": "^0.31.4"` to `apps/kernel/devDependencies`

### 4. **TypeScript Version Consistency**
All packages use `typescript: ~5.6.2` ✅ (Good)

### 5. **ESLint Version Consistency**
All packages use `eslint: ^9.39.1` ✅ (Good)

---

## 📦 Dependency Breakdown by Category

### React Ecosystem
| Package | Root | apps/web | apps/kernel | packages/schemas | Status |
|---------|------|----------|-------------|-----------------|--------|
| `react` | ^18.3.1 | ^18.3.1 | - | - | ✅ Match |
| `react-dom` | ^18.3.1 | ^18.3.1 | - | - | ✅ Match |
| `next` | ^16.0.8 | ^16.0.8 | - | - | ✅ Match |
| `@next/mdx` | ^16.0.8 | ^16.0.8 | - | - | ✅ Match |

### UI Libraries (Radix UI)
| Package | Root | apps/web | Status |
|---------|------|----------|--------|
| `@radix-ui/react-*` | 20 packages | 20 packages | ⚠️ Duplicate (should hoist) |

### Form & Validation
| Package | Root | apps/web | packages/schemas | Status |
|---------|------|----------|------------------|--------|
| `zod` | ^4.1.13 | ^4.1.13 | ^3.25.76 | 🔴 CONFLICT |
| `react-hook-form` | ^7.55.0 | ^7.55.0 | - | ✅ Match |

### Backend (Kernel)
| Package | apps/kernel | Status |
|---------|-------------|--------|
| `hono` | ^4.6.14 | ✅ |
| `drizzle-orm` | ^0.45.1 | ✅ |
| `postgres` | ^3.4.7 | ✅ |
| `drizzle-kit` | ❌ MISSING | 🔴 Add to devDependencies |

### Testing
| Package | Root | apps/web | Status |
|---------|------|----------|--------|
| `vitest` | ^4.0.15 | ^4.0.15 | ✅ Match |
| `@testing-library/react` | ^16.3.0 | ^16.3.0 | ✅ Match |
| `playwright` | ^1.57.0 | ^1.57.0 | ✅ Match |

### Build Tools
| Package | Root | apps/web | apps/kernel | Status |
|---------|------|----------|-------------|--------|
| `typescript` | ~5.6.2 | ~5.6.2 | ~5.6.2 | ✅ Match |
| `tsx` | ^4.19.2 | - | ^4.19.2 | ✅ Match |
| `turbo` | ^2.6.3 | - | - | ✅ Root only |

---

## 🔧 pnpm Migration Plan

### Phase 1: Fix Critical Issues (Before Migration)

#### Step 1.1: Fix Zod Version Conflict
```bash
cd packages/schemas
npm install zod@^4.1.13
# Test: npm run type-check
```

#### Step 1.2: Add Missing drizzle-kit
```bash
cd apps/kernel
npm install --save-dev drizzle-kit@^0.31.4
```

#### Step 1.3: Clean Root Dependencies
**Remove from root `package.json` dependencies:**
- All `@radix-ui/*` packages (20 packages)
- All `@dnd-kit/*` packages (3 packages)
- React ecosystem (react, react-dom, next, @next/*)
- UI libraries (lucide-react, recharts, sonner, etc.)
- Form libraries (react-hook-form, zod)
- Testing tools (vitest, @testing-library/*, playwright)

**Keep in root `package.json` dependencies:**
- `@cap-js/sqlite` (if used by root scripts)
- `@sap/cds` (if used by root scripts)
- `express` (if used by root scripts)
- `@modelcontextprotocol/server-filesystem` (MCP tools)

**Keep in root `package.json` devDependencies:**
- `turbo` (monorepo orchestrator)
- `prettier` (root formatting)
- `tsx` (for root scripts)
- `typescript` (for root type-checking)
- `eslint` (root linting config)
- Canon tools dependencies (`@modelcontextprotocol/*`, `mcp-remote`, `next-devtools-mcp`)

### Phase 2: pnpm Installation

#### Step 2.1: Install pnpm
```bash
npm install -g pnpm
# Or: corepack enable && corepack prepare pnpm@latest --activate
```

#### Step 2.2: Create `.npmrc` (pnpm config)
```ini
# .npmrc
shamefully-hoist=true
strict-peer-dependencies=false
auto-install-peers=true
```

**Why `shamefully-hoist=true`?**
- Next.js and some tools expect flat node_modules
- Prevents "module not found" errors
- Trade-off: Larger node_modules, but more compatible

#### Step 2.3: Delete node_modules & Lock Files
```bash
# Backup first!
git add .
git commit -m "chore: pre-pnpm migration checkpoint"

# Remove
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
rm package-lock.json
```

#### Step 2.4: Install with pnpm
```bash
pnpm install
```

### Phase 3: Verify Installation

#### Step 3.1: Check Dependency Tree
```bash
pnpm list --depth=0
pnpm list --depth=1 --filter @aibos/web
pnpm list --depth=1 --filter @aibos/kernel
```

#### Step 3.2: Test Builds
```bash
pnpm --filter @aibos/web build
pnpm --filter @aibos/kernel build
```

#### Step 3.3: Test Dev Servers
```bash
# Terminal 1
pnpm --filter @aibos/kernel dev

# Terminal 2
pnpm --filter @aibos/web dev
```

---

## 📋 Recommended Root `package.json` (After Cleanup)

```json
{
  "name": "aibos-finance",
  "version": "2.4.1",
  "private": true,
  "type": "module",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "type-check": "turbo run type-check",
    "format": "prettier --write .",
    "kernel:seed": "pnpm --filter @aibos/kernel seed",
    "kernel:db:push": "pnpm --filter @aibos/kernel db:push",
    "canon:*": "tsx packages/canon/D-Operations/D-TOOL/TOOL_*.ts"
  },
  "dependencies": {
    "@cap-js/sqlite": "^2.1.0",
    "@sap/cds": "^9.5.2",
    "@modelcontextprotocol/server-filesystem": "^2025.11.25"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@modelcontextprotocol/server-github": "^2025.4.8",
    "eslint": "^9.39.1",
    "mcp-remote": "^0.1.31",
    "next-devtools-mcp": "^0.3.6",
    "prettier": "^3.7.4",
    "prettier-plugin-tailwindcss": "^0.7.2",
    "tsx": "^4.19.2",
    "turbo": "^2.6.3",
    "typescript": "~5.6.2"
  },
  "overrides": {
    "@modelcontextprotocol/sdk": "^1.24.3"
  },
  "pnpm": {
    "overrides": {
      "@modelcontextprotocol/sdk": "^1.24.3"
    }
  }
}
```

---

## 🎯 Turborepo Configuration Updates

### Update `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "db:push": {
      "cache": false
    },
    "seed": {
      "cache": false
    }
  }
}
```

---

## ✅ Pre-Migration Checklist

- [ ] Fix Zod version conflict (`packages/schemas`)
- [ ] Add `drizzle-kit` to `apps/kernel/devDependencies`
- [ ] Remove duplicate dependencies from root `package.json`
- [ ] Test all builds with npm (verify everything works)
- [ ] Commit current state (checkpoint)
- [ ] Install pnpm globally
- [ ] Create `.npmrc` with pnpm config
- [ ] Delete `node_modules` and `package-lock.json`
- [ ] Run `pnpm install`
- [ ] Verify dependency tree
- [ ] Test builds (`pnpm build`)
- [ ] Test dev servers (`pnpm dev`)
- [ ] Update CI/CD (if applicable)
- [ ] Update README with pnpm commands

---

## 🚨 Known Risks & Mitigations

### Risk 1: Next.js Module Resolution
**Issue:** Next.js may not find hoisted dependencies  
**Mitigation:** Use `shamefully-hoist=true` in `.npmrc`

### Risk 2: TypeScript Path Mapping
**Issue:** Path aliases (`@/*`) may break  
**Mitigation:** Verify `tsconfig.json` paths after migration

### Risk 3: Storybook Compatibility
**Issue:** Storybook may have pnpm-specific issues  
**Mitigation:** Test Storybook build after migration

### Risk 4: CI/CD Pipeline
**Issue:** CI may need pnpm installation  
**Mitigation:** Update GitHub Actions to install pnpm

---

## 📚 References

- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Turborepo + pnpm](https://turbo.build/repo/docs/handbook/package-managers/pnpm)
- [Next.js + pnpm](https://nextjs.org/docs/app/api-reference/next-config-js/output#pnpm)
- [Zod v4 Migration](https://zod.dev/?id=v4-migration-guide)

---

## 🔄 Migration Script (Optional)

```bash
#!/bin/bash
# migrate-to-pnpm.sh

set -e

echo "🔍 Step 1: Fixing Zod version..."
cd packages/schemas
npm install zod@^4.1.13

echo "🔍 Step 2: Adding drizzle-kit..."
cd ../../apps/kernel
npm install --save-dev drizzle-kit@^0.31.4

echo "🔍 Step 3: Installing pnpm..."
npm install -g pnpm

echo "🔍 Step 4: Creating .npmrc..."
cd ../..
cat > .npmrc << EOF
shamefully-hoist=true
strict-peer-dependencies=false
auto-install-peers=true
EOF

echo "🔍 Step 5: Removing old dependencies..."
rm -rf node_modules apps/*/node_modules packages/*/node_modules
rm -f package-lock.json

echo "🔍 Step 6: Installing with pnpm..."
pnpm install

echo "✅ Migration complete! Run 'pnpm dev' to test."
```

---

**Last Updated:** 2025-01-27  
**Status:** Ready for Review → Promote to Canon after validation
