# REF_103: CSS Organization Guide

**Date:** 2025-01-27  
**Status:** 🟢 Active  
**Purpose:** Guide for organizing UI CSS files in Next.js App Router with Canon governance  
**Related:** REF_075_DesignSystem, REF_049_NextJsBestPractices, CONT_01_CanonIdentity  
**Source:** Analysis of current project structure and Next.js best practices

---

## 🎯 Executive Summary

**Current State:**
- ✅ `src/styles/globals.css` - Design tokens (SSOT)
- ✅ Tailwind CSS for utilities
- ✅ Storybook CSS files in `src/stories/`
- ⚠️ Need clear guidance for component-level CSS

**Recommendation:** Follow Next.js App Router conventions with Canon governance alignment.

---

## 📁 Recommended CSS File Organization

### **1. Global Styles (SSOT)**
**Location:** `src/styles/globals.css`

**Purpose:** Single Source of Truth for design tokens
- Design tokens (CSS variables)
- Base layer styles (`@layer base`)
- Global animations
- Scrollbar styling
- Selection styling

**Status:** ✅ **KEEP AS-IS** - This is your design system foundation

```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Design tokens */
    --surface-base: 255 255 255;
    --text-primary: 15 23 42;
    /* ... */
  }
}

/* Global animations */
@keyframes orbit { /* ... */ }
```

**Import:** Imported once in `app/layout.tsx`
```tsx
import '../src/styles/globals.css'
```

---

### **2. Component-Level CSS (Next.js App Router)**

#### **Option A: CSS Modules (Recommended for Complex Components)**

**Location:** Colocated with component
```
src/components/ui/
  ├── Button.tsx
  ├── Button.module.css      ← Component-specific styles
  └── Button.stories.tsx
```

**Usage:**
```tsx
// src/components/ui/Button.tsx
import styles from './Button.module.css'

export function Button({ variant }: ButtonProps) {
  return (
    <button className={cn('base-button-classes', styles[variant])}>
      {/* ... */}
    </button>
  )
}
```

**When to Use:**
- ✅ Complex component-specific animations
- ✅ Component-specific pseudo-selectors (`:hover`, `:focus`)
- ✅ Component-specific keyframes
- ✅ Styles that can't be expressed with Tailwind utilities

**When NOT to Use:**
- ❌ Simple utility-based styling (use Tailwind)
- ❌ Design tokens (use `globals.css`)
- ❌ Global styles (use `globals.css`)

---

#### **Option B: Tailwind Utilities (Preferred)**

**Location:** Inline with component (no separate CSS file)

**Usage:**
```tsx
// src/components/ui/Button.tsx
export function Button({ variant }: ButtonProps) {
  return (
    <button className={cn(
      'px-4 py-2 rounded-md',           // Base styles
      variant === 'primary' && 'bg-action-primary text-action-primary-fg',
      variant === 'secondary' && 'bg-action-secondary text-action-secondary-fg',
      'hover:bg-action-primary-hover',   // Hover states
      'focus:ring-2 focus:ring-action-primary' // Focus states
    )}>
      {/* ... */}
    </button>
  )
}
```

**When to Use:**
- ✅ **Default choice** - Most component styling
- ✅ Simple variants and states
- ✅ Responsive design
- ✅ Design token-based styling

**Benefits:**
- ✅ No CSS file to maintain
- ✅ Type-safe with Tailwind IntelliSense
- ✅ Uses design tokens from `globals.css`
- ✅ Better performance (no CSS-in-JS runtime)

---

### **3. Page-Level CSS (Next.js App Router)**

**Location:** Colocated with page route
```
app/
  ├── dashboard/
  │   ├── page.tsx
  │   └── page.module.css      ← Page-specific styles (if needed)
  └── payments/
      ├── page.tsx
      └── page.module.css
```

**Usage:**
```tsx
// app/dashboard/page.tsx
import styles from './page.module.css'

export default function DashboardPage() {
  return (
    <main className={styles.dashboard}>
      {/* ... */}
    </main>
  )
}
```

**When to Use:**
- ✅ Page-specific layout styles
- ✅ Page-specific animations
- ✅ Styles that don't belong in components

**When NOT to Use:**
- ❌ Component styles (use component CSS Modules or Tailwind)
- ❌ Global styles (use `globals.css`)

---

### **4. Storybook CSS (Development Only)**

**Location:** `src/stories/*.css`

**Purpose:** Storybook-specific demo styles

**Status:** ✅ **KEEP AS-IS** - These are for Storybook demos only

**Note:** These files are NOT imported in production code.

---

## 🎨 Design Token Usage

### **Using CSS Variables from `globals.css`**

```tsx
// ✅ CORRECT: Use Tailwind with design tokens
<button className="bg-[rgb(var(--action-primary))] text-[rgb(var(--action-primary-fg))]">
  Click me
</button>

// ✅ BETTER: Use Tailwind config mapping (recommended)
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'action-primary': 'rgb(var(--action-primary) / <alpha-value>)',
        'action-primary-fg': 'rgb(var(--action-primary-fg) / <alpha-value>)',
      }
    }
  }
}

// Then use:
<button className="bg-action-primary text-action-primary-fg">
  Click me
</button>
```

---

## 📋 Decision Tree

```
Need to style a component?
│
├─ Can it be done with Tailwind utilities?
│  ├─ YES → Use Tailwind classes inline ✅
│  └─ NO → Continue
│
├─ Is it a design token?
│  ├─ YES → Add to globals.css ✅
│  └─ NO → Continue
│
├─ Is it component-specific complex styling?
│  ├─ YES → Create Component.module.css ✅
│  └─ NO → Continue
│
└─ Is it page-specific layout?
   ├─ YES → Create page.module.css ✅
   └─ NO → Review: Should be in globals.css or Tailwind
```

---

## 🏗️ Recommended Structure

```
src/
├── styles/
│   └── globals.css              ← SSOT: Design tokens, global styles
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx           ← Tailwind utilities (preferred)
│   │   ├── Button.module.css    ← Only if complex styling needed
│   │   └── Button.stories.tsx
│   │
│   └── nexus/
│       ├── NexusCard.tsx        ← Tailwind utilities
│       └── NexusCard.module.css ← Only if complex styling needed
│
└── stories/                      ← Storybook demos (dev only)
    ├── Button.tsx
    └── button.css

app/
├── layout.tsx                    ← Imports globals.css
├── dashboard/
│   ├── page.tsx
│   └── page.module.css          ← Only if page-specific layout needed
└── payments/
    ├── page.tsx
    └── page.module.css          ← Only if page-specific layout needed
```

---

## ✅ Best Practices

### **1. Prefer Tailwind Utilities**
```tsx
// ✅ GOOD: Tailwind utilities
<div className="flex items-center gap-4 p-6 bg-surface-base">

// ❌ AVOID: Custom CSS for simple styling
<div className={styles.container}>
```

### **2. Use CSS Modules for Complex Cases**
```tsx
// ✅ GOOD: CSS Module for complex animations
import styles from './Button.module.css'
<button className={cn('base-classes', styles.ripple)}>

// ❌ AVOID: Inline styles for complex animations
<button style={{ animation: 'ripple 2s infinite' }}>
```

### **3. Design Tokens Always in `globals.css`**
```css
/* ✅ GOOD: Design token in globals.css */
:root {
  --action-primary: 40 231 162;
}

/* ❌ AVOID: Hardcoded colors in components */
<button className="bg-[#28E7A2]">
```

### **4. Colocate CSS with Components**
```
✅ GOOD:
src/components/ui/Button.tsx
src/components/ui/Button.module.css

❌ AVOID:
src/components/ui/Button.tsx
src/styles/components/Button.css
```

### **5. Use `cn()` Utility for Conditional Classes**
```tsx
import { cn } from '@/lib/utils'

// ✅ GOOD: Conditional classes with cn()
<button className={cn(
  'base-classes',
  variant === 'primary' && 'bg-action-primary',
  disabled && 'opacity-50 cursor-not-allowed'
)}>
```

---

## 🚫 Anti-Patterns to Avoid

### **1. Global CSS Files for Components**
```tsx
// ❌ AVOID: Global CSS file for component styles
// src/styles/components.css
.button { /* ... */ }

// ✅ USE: CSS Modules or Tailwind
// src/components/ui/Button.tsx
import styles from './Button.module.css'
```

### **2. Inline Styles**
```tsx
// ❌ AVOID: Inline styles
<div style={{ backgroundColor: '#28E7A2' }}>

// ✅ USE: Tailwind or CSS Modules
<div className="bg-action-primary">
```

### **3. Multiple Global CSS Files**
```tsx
// ❌ AVOID: Multiple global CSS files
import './styles/base.css'
import './styles/components.css'
import './styles/utilities.css'

// ✅ USE: Single globals.css
import '../src/styles/globals.css'
```

### **4. CSS-in-JS Libraries**
```tsx
// ❌ AVOID: CSS-in-JS (adds runtime overhead)
import styled from 'styled-components'

// ✅ USE: Tailwind or CSS Modules (zero runtime)
```

---

## 🔄 Migration Path

If you have existing CSS files:

1. **Review existing CSS files**
   - Identify design tokens → Move to `globals.css`
   - Identify component styles → Convert to Tailwind or CSS Modules
   - Identify page styles → Convert to `page.module.css`

2. **Update imports**
   - Remove global CSS imports from components
   - Add CSS Module imports where needed
   - Ensure `globals.css` imported only in `app/layout.tsx`

3. **Update Tailwind config**
   - Map design tokens to Tailwind classes
   - Enable CSS Modules support (default in Next.js)

---

## 📚 References

- **Design System:** REF_075_DesignSystem.md
- **Next.js Best Practices:** REF_049_NextJsBestPractices.md
- **Canon Identity:** CONT_01_CanonIdentity.md
- **Next.js CSS Docs:** https://nextjs.org/docs/app/building-your-application/styling

---

## ✅ Summary

**Recommended CSS Organization:**

1. **`src/styles/globals.css`** - SSOT for design tokens and global styles ✅
2. **Tailwind utilities** - Default choice for component styling ✅
3. **CSS Modules** - For complex component-specific styling ✅
4. **Page CSS Modules** - For page-specific layouts ✅
5. **Storybook CSS** - Keep in `src/stories/` for demos ✅

**Key Principle:** Prefer Tailwind utilities over custom CSS. Use CSS Modules only when Tailwind is insufficient.

---

**Status:** 🟢 Active  
**Last Updated:** 2025-01-27  
**Maintainer:** Canon Governance System
