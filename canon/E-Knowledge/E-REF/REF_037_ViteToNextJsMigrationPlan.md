# REF_037: Vite to Next.js Migration Plan

**Date:** 2025-01-27  
**Status:** Migration Plan  
**Purpose:** Step-by-step guide to migrate from Vite to Next.js App Router  
**Related:** REF_036_CanonPageSystemCheckpoint.md, ADR_001_NextJsAppRouter.md

---

## Overview

This document provides a **production-ready migration plan** to replace Vite with Next.js 16+ App Router, enabling the Canon page system and following Next.js best practices.

**⚠️ VALIDATION:** This plan has been validated against Next.js 16+ requirements and critical issues have been addressed.

**Critical Fixes Applied:**
- ✅ Removed `output: 'export'` conflict with `rewrites` (Step 2) - Static exports cannot use rewrites
- ✅ Verified `mdx-components.tsx` requirement (Step 1) - Already exists at project root
- ✅ Added environment variable migration (Step 6) - `VITE_*` → `NEXT_PUBLIC_*`
- ✅ Enhanced SSR safety in SPA mode (Step 5) - Added `ssr: false` and warnings

**Validation Source:** Next.js MCP documentation + Next.js 16+ best practices

**Current State:**
- ✅ React 18.3.1
- ✅ TypeScript 5.6.2
- ✅ Tailwind CSS
- ✅ React Router (Vite-based)
- ❌ **Vite** (to be removed)
- ❌ **No Next.js** (to be installed)

**Target State:**
- ✅ Next.js 16+ App Router
- ✅ MDX support (`@next/mdx`)
- ✅ Canon page system functional
- ✅ Server Components support
- ✅ Automatic code splitting

---

## Validation Summary

**Validated:** 2025-01-27  
**Validator:** Next.js MCP + Next.js 16+ Documentation  
**Status:** ✅ All Critical Issues Resolved

### Critical Issues Found & Fixed

1. **🔴 CRITICAL: `output: 'export'` vs `rewrites` Conflict**
   - **Issue:** Static exports cannot use server-side rewrites
   - **Fix:** Removed `output: 'export'` from config (Step 2)
   - **Impact:** Proxy/rewrites now work correctly

2. **🔴 CRITICAL: `mdx-components.tsx` Requirement**
   - **Issue:** Next.js App Router requires `mdx-components.tsx` at root
   - **Status:** ✅ Already exists (created in previous commit)
   - **Location:** `mdx-components.tsx` at project root

3. **🟡 IMPORTANT: Environment Variables Migration**
   - **Issue:** Vite uses `import.meta.env.VITE_*`, Next.js uses `process.env.NEXT_PUBLIC_*`
   - **Fix:** Added Step 6 with automated tool (TOOL_25)
   - **Impact:** Prevents runtime errors from missing env vars

4. **🟡 IMPORTANT: SSR Safety in SPA Mode**
   - **Issue:** Client components accessing `window`/`document` can crash SSR
   - **Fix:** Enhanced Step 5 with `ssr: false` and warnings
   - **Impact:** Prevents hydration errors

### Validation Checklist

- [x] Next.js config compatible with rewrites
- [x] MDX components file exists
- [x] Environment variable migration documented
- [x] SSR safety measures in place
- [x] All steps validated against Next.js 16+ requirements

---

## Migration Strategy

**Approach:** Incremental migration, working Next.js app first, then optimize.

1. **Phase 1:** Install Next.js, keep React Router temporarily (SPA mode)
2. **Phase 2:** Migrate to Next.js App Router (replace React Router)
3. **Phase 3:** Enable Canon page system
4. **Phase 4:** Remove Vite completely

---

## Step-by-Step Migration

### Step 1: Install Next.js and MDX Dependencies

```bash
# Install Next.js
npm install next@latest react@latest react-dom@latest

# Install MDX support (required for Canon pages)
npm install @next/mdx @mdx-js/loader @mdx-js/react @types/mdx

# Install Next.js ESLint config (optional but recommended)
npm install --save-dev eslint-config-next
```

**Verify:**
- [ ] `next` appears in `package.json` dependencies
- [ ] `@next/mdx` appears in dependencies

**⚠️ CRITICAL:** Ensure `mdx-components.tsx` exists at project root (already created in previous commit).

---

### Step 2: Create Next.js Configuration

**File:** `next.config.mjs`

```js
import createMDX from '@next/mdx'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure page extensions to include MDX
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  
  // ⚠️ CRITICAL: Do NOT use output: 'export' if you need rewrites/proxy
  // Static exports cannot support server-side rewrites
  // Use default output (Node.js server) or 'standalone' for rewrites
  // output: 'export', // ❌ REMOVED - conflicts with rewrites
  
  // Proxy configuration (replaces Vite proxy)
  // ⚠️ Requires Node.js server (cannot use with output: 'export')
  async rewrites() {
    return [
      {
        source: '/odata/:path*',
        destination: 'http://localhost:4004/odata/:path*',
      },
    ]
  },
}

// Merge MDX config with Next.js config
const withMDX = createMDX({
  // Add markdown plugins here if needed
})

export default withMDX(nextConfig)
```

**Verify:**
- [ ] `next.config.mjs` created
- [ ] MDX configured
- [ ] Proxy configured for `/odata`
- [ ] **CRITICAL:** `output: 'export'` is NOT present (conflicts with rewrites)

**⚠️ Important:** If you need static export later (e.g., for CDN deployment), you'll need to:
- Remove `rewrites()` from config
- Add `output: 'export'`
- Handle `/odata` proxy differently (e.g., via external proxy or API routes)

---

### Step 3: Update TypeScript Configuration

**File:** `tsconfig.json`

Update to Next.js-compatible config:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "allowJs": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    
    /* Path Mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/canon/*": ["./canon/*"],
      "@/canon-pages/*": ["./canon-pages/*"],
      "@/app/*": ["./app/*"]
    }
  },
  "include": ["./src", "./app", "./canon", "./canon-pages", "./dist/types/**/*.ts", "./next-env.d.ts"],
  "exclude": ["./node_modules", ".next"]
}
```

**Changes:**
- ✅ Added `esModuleInterop: true`
- ✅ Added `allowJs: true`
- ✅ Added `forceConsistentCasingInFileNames: true`
- ✅ Added `incremental: true`
- ✅ Added `plugins: [{ "name": "next" }]`
- ✅ Added path aliases for Canon system
- ✅ Updated `include` to include `app`, `canon`, `canon-pages`
- ✅ Added `next-env.d.ts` to include

**Verify:**
- [ ] TypeScript config updated
- [ ] Path aliases configured
- [ ] No TypeScript errors

---

### Step 4: Create Root Layout

**File:** `app/layout.tsx`

Convert `index.html` to Next.js root layout:

```tsx
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import '../src/styles/globals.css'

// Optimize fonts with Next.js
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'NexusCanon | Forensic Architecture',
  description: 'Forensic metadata architecture and governance system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

**Key Changes:**
- ✅ Removed `<head>` tags (Next.js handles automatically)
- ✅ Moved metadata to `metadata` export
- ✅ Used `next/font` for font optimization
- ✅ Removed `<div id="root">` (not needed in App Router)

**⚠️ Important:** Verify the CSS import path matches your project:
- If you have `src/styles/globals.css` → use `'../src/styles/globals.css'`
- If you have `src/index.css` → use `'../src/index.css'`
- If you have `src/App.css` → use `'../src/App.css'`

**Verify:**
- [ ] `app/layout.tsx` created
- [ ] Fonts configured
- [ ] Global CSS imported (path verified)
- [ ] CSS file exists at specified path

---

### Step 5: Create Entry Point (SPA Mode - Temporary)

**For initial migration, keep React Router working:**

**File:** `app/[[...slug]]/page.tsx`

```tsx
'use client'

import dynamic from 'next/dynamic'
import '../src/styles/globals.css'

// ⚠️ CRITICAL: Disable SSR to prevent window/document access errors
// This ensures React Router (which may access browser APIs) doesn't crash during SSR
const App = dynamic(() => import('../../src/App'), { 
  ssr: false, // Prevents server-side rendering
  loading: () => <div>Loading...</div> // Optional loading state
})

export function generateStaticParams() {
  return [{ slug: [''] }]
}

export default function Page() {
  return <App />
}
```

**Why:** This keeps your existing React Router app working while we migrate incrementally.

**⚠️ Important Notes:**
- `ssr: false` is **required** if your `App.tsx` or its dependencies access `window`, `document`, or `localStorage` on load
- If you encounter hydration mismatches, wrap the import in a `useEffect` or add a client-only check
- Verify the import path `../../src/App` is correct for your project structure

**Verify:**
- [ ] Entry point created
- [ ] React Router still works
- [ ] App loads in browser
- [ ] No SSR errors in console

---

### Step 6: Migrate Environment Variables

**⚠️ CRITICAL:** Vite uses `import.meta.env.VITE_*`, Next.js uses `process.env.NEXT_PUBLIC_*`.

**Steps:**

1. **Rename environment variables in `.env` files:**
   ```bash
   # Find all .env files
   # Change VITE_ prefix to NEXT_PUBLIC_
   VITE_API_BASE_URL → NEXT_PUBLIC_API_BASE_URL
   VITE_WS_BASE_URL → NEXT_PUBLIC_WS_BASE_URL
   # ... etc
   ```

2. **Update code references:**
   ```bash
   # Find all import.meta.env.VITE_* references
   grep -r "import.meta.env.VITE" src/
   
   # Replace with process.env.NEXT_PUBLIC_*
   # Example:
   # Before: import.meta.env.VITE_API_BASE_URL
   # After:  process.env.NEXT_PUBLIC_API_BASE_URL
   ```

3. **Known files to update:**
   - `src/docs/04-guides/developer-handoff.md` (line 418)
   - Any other files using `import.meta.env.VITE_*`

4. **Alternative (temporary):** If you want to keep `VITE_` prefix temporarily, add to `next.config.mjs`:
   ```js
   env: {
     NEXT_PUBLIC_API_BASE_URL: process.env.VITE_API_BASE_URL,
     // ... map other vars
   }
   ```

5. **Automated Migration (Recommended):**
   ```bash
   # Dry-run first
   npx tsx canon/D-Operations/D-TOOL/TOOL_25_MigrateViteEnvVars.ts --dry-run
   
   # Execute migration
   npx tsx canon/D-Operations/D-TOOL/TOOL_25_MigrateViteEnvVars.ts --execute
   ```
   This tool automatically:
   - Finds all `.env` files
   - Renames `VITE_*` to `NEXT_PUBLIC_*`
   - Updates code references from `import.meta.env.VITE_*` to `process.env.NEXT_PUBLIC_*`

**Verify:**
- [ ] All `.env` files updated
- [ ] All code references updated
- [ ] No `import.meta.env.VITE_*` remaining
- [ ] Run TOOL_25 to automate (recommended)

---

### Step 7: Update package.json Scripts

**Update scripts:**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    // ... keep other scripts (canon:*, figma:*, etc.)
  }
}
```

**Add to `.gitignore`:**
```
.next
next-env.d.ts
dist
```

**Verify:**
- [ ] Scripts updated
- [ ] `.gitignore` updated

---

### Step 8: Test Next.js Dev Server

```bash
npm run dev
```

**Expected:**
- ✅ Dev server starts on `http://localhost:3000`
- ✅ React Router app loads
- ✅ All routes work
- ✅ Proxy works (`/odata` requests)

**If issues:**
- Check console for errors
- Verify `app/layout.tsx` is correct
- Verify `next.config.mjs` is correct

---

### Step 9: Migrate React Router to Next.js App Router

**This is Phase 2 - after Next.js is working.**

**Current:** React Router in `src/App.tsx`

**Target:** Next.js App Router routes

**Steps:**
1. Create route files in `app/` directory
2. Migrate each route one by one
3. Update navigation to use Next.js `Link`
4. Remove React Router dependency

**Example Migration:**

**Before (React Router):**
```tsx
// src/App.tsx
<Route path="/payments" element={<PAY01PaymentHubPage />} />
```

**After (Next.js App Router):**
```tsx
// app/payments/page.tsx
import PAY01PaymentHubPage from '@/src/pages/PAY_01_PaymentHubPage'

export default function PaymentsPage() {
  return <PAY01PaymentHubPage />
}
```

**Note:** This is a separate phase. Complete Step 1-7 first.

---

### Step 10: Enable Canon Page System

**After App Router migration:**

1. **Generate Canon Page Wrappers:**
   ```bash
   npx tsx canon/D-Operations/D-TOOL/TOOL_24_GenerateCanonPageWrapper.ts --execute
   ```

2. **Test Canon Routes:**
   - Navigate to `/canon/meta/meta-01-metadata-architecture`
   - Verify MDX renders
   - Verify CanonPageShell works

3. **Validate:**
   ```bash
   npx tsx canon/D-Operations/D-TOOL/TOOL_18_ValidateCanonCompliance.ts
   ```

---

### Step 11: Clean Up Vite

**After everything works:**

1. **Remove Vite files:**
   ```bash
   rm vite.config.ts
   rm index.html
   rm src/main.tsx
   rm vitest.config.ts  # Keep if using Vitest for tests
   ```

2. **Remove Vite dependencies:**
   ```bash
   npm uninstall vite @vitejs/plugin-react
   ```

3. **Update scripts:**
   - Remove `preview` script (Vite-specific)
   - Keep `test` script if using Vitest

4. **Verify:**
   - [ ] No Vite references in code
   - [ ] Next.js dev server works
   - [ ] Build works
   - [ ] All routes work

---

## Migration Checklist

### Phase 1: Next.js Setup (SPA Mode)
- [ ] Install Next.js and MDX dependencies
- [ ] **CRITICAL:** Verify `mdx-components.tsx` exists at root
- [ ] Create `next.config.mjs` with MDX (NO `output: 'export'` if using rewrites)
- [ ] Update `tsconfig.json`
- [ ] Migrate environment variables (`VITE_*` → `NEXT_PUBLIC_*`)
- [ ] Create `app/layout.tsx`
- [ ] Create `app/[[...slug]]/page.tsx` (SPA entry with `ssr: false`)
- [ ] Update `package.json` scripts
- [ ] Test dev server
- [ ] Verify React Router still works
- [ ] Verify proxy/rewrites work

### Phase 2: App Router Migration
- [ ] Create route structure in `app/`
- [ ] Migrate routes one by one
- [ ] Update navigation to Next.js `Link`
- [ ] Remove React Router
- [ ] Test all routes

### Phase 3: Canon Page System
- [ ] Generate Canon page wrappers (TOOL_24)
- [ ] Test Canon routes
- [ ] Verify MDX rendering
- [ ] Run TOOL_18 validation

### Phase 4: Cleanup
- [ ] Remove Vite files
- [ ] Remove Vite dependencies
- [ ] Update scripts
- [ ] Final validation

---

## Common Issues & Solutions

### Issue: TypeScript Errors

**Solution:** Ensure `tsconfig.json` includes Next.js plugins and path aliases.

### Issue: MDX Not Working

**Solution:** 
1. Verify `@next/mdx` is installed
2. Verify `next.config.mjs` has MDX config
3. **CRITICAL:** Verify `mdx-components.tsx` exists at project root (required by Next.js App Router)
4. Check that `useMDXComponents` function is exported correctly

### Issue: Proxy/Rewrites Not Working

**Solution:** 
1. **CRITICAL:** Ensure `output: 'export'` is NOT in `next.config.mjs` (static exports don't support rewrites)
2. Use Next.js `rewrites` instead of Vite `proxy`:
   ```js
   // next.config.mjs
   async rewrites() {
     return [
       {
         source: '/odata/:path*',
         destination: 'http://localhost:4004/odata/:path*',
       },
     ]
   }
   ```
3. If you need static export, remove `rewrites()` and handle proxy via external service

### Issue: Environment Variables Not Working

**Solution:**
1. Rename `VITE_*` to `NEXT_PUBLIC_*` in `.env` files
2. Replace `import.meta.env.VITE_*` with `process.env.NEXT_PUBLIC_*` in code
3. Restart dev server after changing `.env` files

### Issue: SSR/Hydration Errors

**Solution:**
1. Ensure `ssr: false` in dynamic import for client-only components
2. Wrap browser API access in `useEffect` or `typeof window !== 'undefined'` checks
3. Use `'use client'` directive for components that access browser APIs

### Issue: Images Not Loading

**Solution:** 
1. **If images are in `src/assets/`:** Move them to `public/` directory for string path access
2. **If using import:** Images can stay in `src/`, but Next.js handles them differently (returns object with `src` property)
3. **Recommended:** Move to `public/` and use `/image.png` instead of `import image from './image.png'`
4. **Or use Next.js `Image` component** for automatic optimization

**Pro-tip:** If your Vite app has images in `src/assets/`, move them to `public/` before migration to avoid path issues.

---

## Next Steps After Migration

1. **Optimize Images:**
   - Use Next.js `Image` component
   - Automatic optimization

2. **Optimize Fonts:**
   - Already done in `layout.tsx` with `next/font`

3. **Enable Server Components:**
   - Migrate components to Server Components where possible
   - Use `'use client'` only when needed

4. **Enable Streaming:**
   - Use `Suspense` boundaries
   - Enable streaming for better performance

---

## Related Documentation

- **REF_036:** Canon Page System Checkpoint
- **REF_038:** Vite to Next.js Migration Plan Validation Report ⚡ **VALIDATION REPORT**
- **REF_032:** Canon Page Thin Wrapper Pattern
- **REF_033:** Canon Page Implementation Guide
- **TOOL_25:** Migrate Vite Environment Variables (automated tool)
- **ADR_001:** Next.js App Router Adoption
- **Next.js Docs:** [Migrating from Vite](https://nextjs.org/docs/app/guides/migrating/from-vite)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2025-01-27 | Validated and fixed critical issues: removed output: 'export' conflict, verified mdx-components.tsx, added env var migration, enhanced SSR safety |
| 1.0.0 | 2025-01-27 | Initial migration plan created |
