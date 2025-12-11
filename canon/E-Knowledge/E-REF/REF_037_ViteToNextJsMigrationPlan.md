# REF_037: Vite to Next.js Migration Plan

**Date:** 2025-01-27  
**Status:** Migration Plan  
**Purpose:** Step-by-step guide to migrate from Vite to Next.js App Router  
**Related:** REF_036_CanonPageSystemCheckpoint.md, ADR_001_NextJsAppRouter.md

---

## Overview

This document provides a **production-ready migration plan** to replace Vite with Next.js 16+ App Router, enabling the Canon page system and following Next.js best practices.

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

---

### Step 2: Create Next.js Configuration

**File:** `next.config.mjs`

```js
import createMDX from '@next/mdx'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure page extensions to include MDX
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  
  // For initial migration: SPA mode (keeps React Router working)
  // Remove this after migrating to App Router
  output: 'export',
  distDir: './dist',
  
  // Proxy configuration (replaces Vite proxy)
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

**Verify:**
- [ ] `app/layout.tsx` created
- [ ] Fonts configured
- [ ] Global CSS imported

---

### Step 5: Create Entry Point (SPA Mode - Temporary)

**For initial migration, keep React Router working:**

**File:** `app/[[...slug]]/page.tsx`

```tsx
'use client'

import dynamic from 'next/dynamic'
import '../src/styles/globals.css'

// Disable SSR for React Router (temporary)
const App = dynamic(() => import('../../src/App'), { ssr: false })

export function generateStaticParams() {
  return [{ slug: [''] }]
}

export default function Page() {
  return <App />
}
```

**Why:** This keeps your existing React Router app working while we migrate incrementally.

**Verify:**
- [ ] Entry point created
- [ ] React Router still works
- [ ] App loads in browser

---

### Step 6: Update package.json Scripts

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

### Step 7: Test Next.js Dev Server

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

### Step 8: Migrate React Router to Next.js App Router

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

### Step 9: Enable Canon Page System

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

### Step 10: Clean Up Vite

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
- [ ] Create `next.config.mjs` with MDX
- [ ] Update `tsconfig.json`
- [ ] Create `app/layout.tsx`
- [ ] Create `app/[[...slug]]/page.tsx` (SPA entry)
- [ ] Update `package.json` scripts
- [ ] Test dev server
- [ ] Verify React Router still works

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
3. Verify `mdx-components.tsx` exists at root

### Issue: Proxy Not Working

**Solution:** Use Next.js `rewrites` instead of Vite `proxy`:

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

### Issue: Images Not Loading

**Solution:** 
1. Move images to `public/` directory
2. Use `/image.png` instead of `import image from './image.png'`
3. Or use Next.js `Image` component

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
- **REF_032:** Canon Page Thin Wrapper Pattern
- **REF_033:** Canon Page Implementation Guide
- **ADR_001:** Next.js App Router Adoption
- **Next.js Docs:** [Migrating from Vite](https://nextjs.org/docs/app/guides/migrating/from-vite)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-27 | Initial migration plan created |
