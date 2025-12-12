# REF_036: Canon Page System Checkpoint

**Date:** 2025-01-27  
**Status:** Checkpoint - Ready for Next.js Migration  
**Purpose:** Summary of current state and next steps  
**Related:** REF_032, REF_033, REF_034, REF_035

---

## ✅ Current State: System Complete

### What's Been Built

1. **✅ Canon Page Registry** (`canon/registry/canon-pages.ts`)
   - Single source of truth for all 20 Canon pages
   - Type-safe with query helpers
   - Ready for use

2. **✅ CanonPageShell Component** (`app/components/canon/CanonPageShell.tsx`)
   - Shared shell for all Canon pages
   - Uses NexusCanon design tokens
   - Ready for Next.js

3. **✅ MDX Components** (`mdx-components.tsx`)
   - Global MDX styling
   - Consistent typography
   - Ready for Next.js

4. **✅ Template Generator** (`TOOL_24_GenerateCanonPageWrapper.ts`)
   - Generates wrappers from registry
   - Dry-run mode
   - Ready to use

5. **✅ Documentation**
   - REF_032: Thin Wrapper Pattern (design)
   - REF_033: Implementation Guide (how-to)
   - REF_034: System Summary (overview)
   - REF_035: Implementation Roadmap (step-by-step)

---

## ⚠️ Current Limitation: Still on Vite

**Current Stack:**
- ✅ React 18.3.1
- ✅ TypeScript 5.6.2
- ✅ Tailwind CSS
- ✅ React Router (Vite-based)
- ❌ **Vite** (needs to be replaced with Next.js)
- ❌ **No Next.js** (needs to be installed)

**Impact:**
- Canon page system is **designed for Next.js**
- Cannot use until Next.js migration is complete
- Files are in place but not functional yet

---

## 🎯 Next Step: Vite → Next.js Migration

### Required Actions

1. **Install Next.js**
   - Install Next.js 16+ and dependencies
   - Install `@next/mdx` for MDX support

2. **Remove Vite**
   - Remove Vite config
   - Remove Vite dependencies
   - Remove Vite scripts

3. **Configure Next.js**
   - Create `next.config.js` with MDX support
   - Update `tsconfig.json` for Next.js
   - Configure path aliases

4. **Migrate Routing**
   - Replace React Router with Next.js App Router
   - Create `app/` directory structure
   - Migrate routes

5. **Update Entry Point**
   - Remove `index.html` (Next.js doesn't use it)
   - Remove `src/main.tsx` (Next.js uses `app/layout.tsx`)
   - Create `app/layout.tsx` root layout

6. **Test & Validate**
   - Test dev server
   - Test routes
   - Run TOOL_18 validation

---

## 📋 Migration Checklist

### Phase 1: Setup Next.js
- [ ] Install Next.js 16+ and dependencies
- [ ] Install `@next/mdx` and MDX dependencies
- [ ] Create `next.config.js` with MDX config
- [ ] Update `tsconfig.json` for Next.js
- [ ] Configure path aliases

### Phase 2: Remove Vite
- [ ] Remove `vite.config.ts`
- [ ] Remove Vite dependencies from `package.json`
- [ ] Remove Vite scripts from `package.json`
- [ ] Remove `index.html`
- [ ] Remove `src/main.tsx`

### Phase 3: Create Next.js Structure
- [ ] Create `app/` directory
- [ ] Create `app/layout.tsx` (root layout)
- [ ] Create `app/page.tsx` (home page)
- [ ] Migrate React Router routes to Next.js routes

### Phase 4: Migrate Canon Pages
- [ ] Run TOOL_24 to generate wrappers
- [ ] Test Canon page routes
- [ ] Verify MDX rendering

### Phase 5: Validate
- [ ] Run `npm run dev` (Next.js dev server)
- [ ] Test all routes
- [ ] Run TOOL_18 validation
- [ ] Fix any issues

---

## 📚 Related Documentation

- **REF_032:** Canon Page Thin Wrapper Pattern
- **REF_033:** Canon Page Implementation Guide
- **REF_034:** Canon Page System Summary
- **REF_035:** Canon Page Implementation Roadmap
- **REF_037:** Vite to Next.js Migration Plan ⚡ **NEXT STEP**

---

## 🚀 After Migration

Once Next.js is set up:

1. **Generate Canon Page Wrappers:**
   ```bash
   npx tsx canon/D-Operations/D-TOOL/TOOL_24_GenerateCanonPageWrapper.ts --execute
   ```

2. **Test Routes:**
   ```bash
   npm run dev
   # Navigate to /canon/meta/meta-01-metadata-architecture
   ```

3. **Continue Phase 2 & 3:**
   - Execute rename files (TOOL_23)
   - Migrate Canon pages (REF_026)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-27 | Initial checkpoint created |
