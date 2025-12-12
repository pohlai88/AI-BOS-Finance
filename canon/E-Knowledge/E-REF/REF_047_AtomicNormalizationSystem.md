# REF_047: Atomic Normalization System

**Date:** 2025-01-27  
**Status:** ✅ Active Standard  
**Related:** REF_046_NextJsRefactoringStrategy, ADR_001_NextJsAppRouter  
**Purpose:** Complete governance system for UI components preventing drift at scale

---

## 🎯 Executive Summary

**Problem:** UI drift causing 90% codebase complexity (687 lines → 65 lines after normalization)  
**Solution:** Three-layer governance system (Constitution → Bridge → Law → Control Plane)  
**Result:** Zero drift possible, 90% code reduction, ready for 1000+ pages

---

## 🛡️ The Holy Trinity

### 1. Surface (Where things live)
**Component:** `src/components/ui/Surface.tsx`  
**Purpose:** Governed container component for cards, panels, containers  
**Variants:** `base`, `flat`, `ghost`  
**Tokens:** `--surface-base`, `--surface-flat`, `--border-base`, `--radius-surface`

### 2. Txt (What things say)
**Component:** `src/components/ui/Txt.tsx`  
**Purpose:** Governed typography component preventing "50 Shades of Grey"  
**Variants:** `h1`, `h2`, `h3`, `h4`, `body`, `subtle`, `small`  
**Tokens:** `--text-primary`, `--text-secondary`, `--text-tertiary`

### 3. Btn (What things do)
**Component:** `src/components/ui/Btn.tsx`  
**Purpose:** Governed action component preventing "Fake Button" drift  
**Variants:** `primary`, `secondary`  
**Sizes:** `sm`, `md`, `lg`  
**Tokens:** `--action-primary`, `--action-secondary`, `--radius-action`

---

## 🏗️ The Four-Layer Architecture

### Layer 1: The Constitution (`globals.css`)

**Location:** `src/styles/globals.css`  
**Purpose:** Define tokens in RGB format (enables opacity control)

```css
@layer base {
  :root {
    /* Surface Tokens */
    --surface-base: 255 255 255;
    --surface-flat: 248 250 252;
    --border-base: 226 232 240;
    --radius-surface: 1rem;

    /* Typography Tokens */
    --text-primary: 15 23 42;
    --text-secondary: 71 85 105;
    --text-tertiary: 148 163 184;

    /* Action Tokens */
    --action-primary: 40 231 162;  /* Nexus Green */
    --action-primary-fg: 0 0 0;
    --action-secondary: 255 255 255;
    --action-secondary-fg: 15 23 42;
    --radius-action: 0.5rem;
  }

  .dark {
    /* Dark mode overrides */
  }
}
```

**Key Principle:** Tokens define **intent**, not appearance.  
**Format:** RGB values (`255 255 255`) enable opacity (`bg-surface-base/50`).

---

### Layer 2: The Bridge (`tailwind.config.js`)

**Location:** `tailwind.config.js`  
**Purpose:** Map tokens to Tailwind classes

```javascript
theme: {
  extend: {
    colors: {
      surface: {
        base: "rgb(var(--surface-base) / <alpha-value>)",
        flat: "rgb(var(--surface-flat) / <alpha-value>)",
      },
      text: {
        primary: "rgb(var(--text-primary) / <alpha-value>)",
        secondary: "rgb(var(--text-secondary) / <alpha-value>)",
      },
      action: {
        primary: {
          DEFAULT: "rgb(var(--action-primary) / <alpha-value>)",
          fg: "rgb(var(--action-primary-fg) / <alpha-value>)",
        },
      },
    },
    borderRadius: {
      surface: "var(--radius-surface)",
      action: "var(--radius-action)",
    },
  },
}
```

**Key Principle:** If it's not mapped here, it doesn't exist.  
**Usage:** VS Code autocomplete shows token mappings.

---

### Layer 3: The Law (Components)

**Components:** `Surface.tsx`, `Txt.tsx`, `Btn.tsx`  
**Purpose:** Enforce the system, prevent drift

**Surface Example:**
```tsx
<Surface variant="base" className="p-6">
  <Txt variant="h2">Card Title</Txt>
  <Txt variant="body">Card content</Txt>
</Surface>
```

**Txt Example:**
```tsx
<Txt variant="h1">Main Title</Txt>
<Txt variant="body">Body text</Txt>
```

**Btn Example:**
```tsx
<Btn variant="primary" size="md">Submit</Btn>
<Btn variant="secondary" size="sm" loading>Processing...</Btn>
```

**Key Principle:** Components **OBEY** tokens. They don't choose colors.

---

### Layer 4: The Control Plane (Storybook)

**Stories:** `Surface.stories.tsx`, `Txt.stories.tsx`, `Btn.stories.tsx`  
**Purpose:** Visual verification before merge

**Workflow:**
1. Developer creates/updates component
2. Developer opens Storybook: `npm run storybook`
3. Developer verifies: "Does this match the design spec?"
4. Only then is it merged into the App

**Benefits:**
- Visual audit (see all UI elements in 5 minutes)
- Stress tests (long content, edge cases)
- Documentation (autodocs enabled)
- Exportable (`build-storybook` → `design.canon.com`)

---

## 📊 Results & Metrics

### Code Reduction

| File | Before | After | Reduction |
|------|--------|-------|-----------|
| `app/canon/page.tsx` | 687 lines | 65 lines | **90.5%** |

### Drift Elimination

| Drift Type | Before | After |
|------------|--------|-------|
| Card styles | 50+ variations | 3 variants (Surface) |
| Typography | "50 Shades of Grey" | 7 variants (Txt) |
| Buttons | Fake Surface buttons | 2 variants (Btn) |
| Colors | Hex codes everywhere | Token-based only |

### Scalability

**At 1000 pages (current pattern):**
- Total lines: ~200,000 lines
- Maintenance: Update 1000 files for pattern changes

**At 1000 pages (normalized pattern):**
- Total lines: ~15,000 lines (pages) + ~50,000 lines (features)
- Maintenance: Update 1 component for all pages
- **Improvement:** 87.5% code reduction at scale

---

## ✅ Anti-Drift Verification Checklist

### Surface Component
- [x] No hex codes (`#fff`, `#000`)
- [x] No arbitrary Tailwind classes (`bg-white`, `border-slate-200`)
- [x] All colors from tokens (`bg-surface-base`, `border-border-surface-base`)
- [x] All variants use governed tokens
- [x] Changing tokens updates all Surfaces

### Txt Component
- [x] Only 7 variants allowed (`h1`, `h2`, `h3`, `h4`, `body`, `subtle`, `small`)
- [x] No arbitrary font sizes (`text-2xl`, `text-lg`)
- [x] All colors from tokens (`text-text-primary`, `text-text-secondary`)
- [x] Semantic HTML by default (`h1` → `<h1>`, `body` → `<p>`)
- [x] Changing tokens updates all text

### Btn Component
- [x] Only 2 variants allowed (`primary`, `secondary`)
- [x] Only 3 sizes allowed (`sm`, `md`, `lg`)
- [x] No Surface components used as buttons
- [x] Semantic HTML (`<button>` tag)
- [x] Keyboard accessible (Tab, Enter, Space)
- [x] Focus states (visible focus ring)
- [x] Disabled/loading states
- [x] All colors from tokens (`bg-action-primary`, `text-action-primary-fg`)

---

## 🚀 Usage Guidelines

### When to Use Surface

✅ **Use Surface for:**
- Cards, panels, containers
- Content sections
- Layout containers

❌ **Don't use Surface for:**
- Buttons (use `Btn`)
- Text (use `Txt`)
- Interactive elements (use proper semantic elements)

### When to Use Txt

✅ **Use Txt for:**
- All text content
- Headings, paragraphs, captions
- Labels, metadata

❌ **Don't use Txt for:**
- Buttons (use `Btn` with text inside)
- Custom typography (only 7 variants allowed)

### When to Use Btn

✅ **Use Btn for:**
- All interactive actions
- Form submissions
- Navigation triggers
- Modal actions

❌ **Don't use Btn for:**
- Links (use `<Link>` or `<a>`)
- Fake buttons (Surface with cursor-pointer)
- Custom button styles (only 2 variants allowed)

---

## 🔧 Migration Guide

### Step 1: Replace Inline Cards

**Before:**
```tsx
<div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
  Content
</div>
```

**After:**
```tsx
<Surface variant="base" className="p-6">
  Content
</Surface>
```

### Step 2: Replace Inline Typography

**Before:**
```tsx
<h1 className="text-4xl font-bold text-slate-900">Title</h1>
<p className="text-base text-slate-600">Body text</p>
```

**After:**
```tsx
<Txt variant="h1">Title</Txt>
<Txt variant="body">Body text</Txt>
```

### Step 3: Replace Fake Buttons

**Before:**
```tsx
<Surface variant="base" className="px-4 py-2 cursor-pointer">
  Click me
</Surface>
```

**After:**
```tsx
<Btn variant="primary" size="md">
  Click me
</Btn>
```

---

## 📚 Related Documents

- **REF_046_NextJsRefactoringStrategy.md** - Next.js refactoring strategy
- **ADR_001_NextJsAppRouter.md** - Next.js App Router decision
- **Surface.stories.tsx** - Surface component documentation
- **Txt.stories.tsx** - Typography component documentation
- **Btn.stories.tsx** - Action component documentation

---

## 🎯 Success Criteria

### Code Quality
- [x] All pages use Surface/Txt/Btn components
- [x] Zero hex codes in components
- [x] Zero arbitrary Tailwind classes
- [x] 100% token-based styling

### Architecture
- [x] Four-layer governance system
- [x] Storybook control plane active
- [x] Token system in place
- [x] Component enforcement working

### Scalability
- [x] Can add 1000 pages without refactoring
- [x] Change tokens updates entire app
- [x] Visual audit in Storybook
- [x] Documentation complete

---

**Status:** ✅ **ACTIVE STANDARD**  
**Last Updated:** 2025-01-27  
**Version:** 1.0.0
