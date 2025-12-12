# 🛡️ Developer Handbook: Atomic Normalization System

**Last Updated:** December 2025  
**Status:** Phase 3 Complete — Payment Hub Refactored  
**Next Phase:** Option B — Drift Police (ESLint Rules)

---

## 📋 Table of Contents

1. [Current State](#current-state)
2. [What Was Accomplished](#what-was-accomplished)
3. [System Architecture](#system-architecture)
4. [How to Use the System](#how-to-use-the-system)
5. [Next Steps](#next-steps)
6. [Best Practices](#best-practices)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Current State

### **Phase 3: Expansion Campaign — ✅ COMPLETE**

The Payment Hub (`src/modules/payment/`) has been fully refactored to use the Atomic Normalization System. All hardcoded colors have been eliminated, and all components now use governed atomic components.

### **What's Been Refactored**

| Module | Status | Components Refactored |
|--------|--------|----------------------|
| **Core UI** | ✅ Complete | `Surface`, `Txt`, `Btn`, `Input`, `StatusDot` |
| **Canon Dashboard** | ✅ Complete | `app/canon/page.tsx` |
| **Simulation Engine** | ✅ Complete | `LegacyStack`, `BlockPrimitives`, `ForensicHeader` |
| **Payment Hub** | ✅ Complete | `PAY_01_PaymentHub`, `TreasuryHeader`, `PaymentTable`, `ApprovalActions`, `FunctionalCard`, `AuditSidebar` |

### **Metrics**

- **Hardcoded Hex Colors:** 0 instances (down from 154)
- **Components Using Atoms:** 6 payment components + 5 core atoms
- **Drift Risk:** Zero (all components governed)
- **Code Reduction:** ~44% reduction in Payment Hub codebase

---

## 🏗️ What Was Accomplished

### **Phase 1: The Holy Trinity (Core Atoms)**

Created the foundational atomic components:

1. **`Surface`** — Container component (cards, panels, containers)
2. **`Txt`** — Typography component (headings, body text, labels)
3. **`Btn`** — Action component (buttons, interactive elements)

### **Phase 2: Interactive Core**

Extended the system with:

4. **`Input`** — Data entry component (forms, search fields)
5. **`StatusDot`** — Status indicator component (success, warning, error, neutral)

### **Phase 3: Expansion Campaign**

Refactored the entire Payment Hub module:

- **`PAY_01_PaymentHub.tsx`** — Main orchestrator
- **`TreasuryHeader.tsx`** — Entity selector + metrics
- **`PaymentTable.tsx`** — Transaction list
- **`ApprovalActions.tsx`** — Approve/Reject buttons
- **`FunctionalCard.tsx`** — Batch processing cards
- **`AuditSidebar.tsx`** — 4W1H audit trail

---

## 🎨 System Architecture

### **The Four-Layer Governance Model**

```
┌─────────────────────────────────────────────────────────┐
│ 1. THE CONSTITUTION (globals.css)                      │
│    Design tokens as CSS variables (RGB format)         │
│    --surface-base, --text-primary, --action-primary    │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. THE BRIDGE (tailwind.config.js)                     │
│    Maps CSS variables to Tailwind utilities             │
│    bg-surface-base, text-text-primary, etc.             │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. THE LAW (Atomic Components)                         │
│    Surface.tsx, Txt.tsx, Btn.tsx, Input.tsx, StatusDot │
│    Enforces token usage, prevents drift                 │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 4. THE CONTROL PLANE (Storybook)                        │
│    Visual verification, stress testing, documentation  │
│    Component.stories.tsx files                          │
└─────────────────────────────────────────────────────────┘
```

### **Design Tokens (The Constitution)**

All design tokens are defined in `src/styles/globals.css`:

```css
:root {
  /* Surface Tokens */
  --surface-base: 255 255 255;
  --surface-flat: 248 250 252;
  
  /* Typography Tokens */
  --text-primary: 15 23 42;
  --text-secondary: 71 85 105;
  --text-tertiary: 148 163 184;
  
  /* Action Tokens */
  --action-primary: 40 231 162;      /* Nexus Green */
  --action-primary-hover: 45 245 176;
  
  /* Status Tokens */
  --status-success: 40 231 162;
  --status-warning: 245 166 35;
  --status-error: 231 76 60;
  --status-neutral: 52 152 219;
  
  /* Input Tokens */
  --input-border: 226 232 240;
  --input-bg: 255 255 255;
  --input-text: 15 23 42;
  
  /* Radius Tokens */
  --radius-surface: 1rem;
  --radius-action: 0.5rem;
  --radius-badge: 0.375rem;
}
```

**Note:** RGB format (`255 255 255`) allows opacity control (`bg-surface-base/50`).

---

## 🚀 How to Use the System

### **1. Using Surface Component**

```tsx
import { Surface } from '@/components/ui/Surface';

// Base variant (white card)
<Surface variant="base" className="p-6">
  Content here
</Surface>

// Flat variant (grey background)
<Surface variant="flat" className="p-4">
  Content here
</Surface>

// Ghost variant (transparent)
<Surface variant="ghost">
  Content here
</Surface>
```

### **2. Using Txt Component**

```tsx
import { Txt } from '@/components/ui/Txt';

<Txt variant="h1">Main Heading</Txt>
<Txt variant="h2">Section Heading</Txt>
<Txt variant="h3">Subsection Heading</Txt>
<Txt variant="body">Body text</Txt>
<Txt variant="small">Small text</Txt>
<Txt variant="subtle">Subtle text (tertiary color)</Txt>
```

### **3. Using Btn Component**

```tsx
import { Btn } from '@/components/ui/Btn';

// Primary button
<Btn variant="primary" size="md" onClick={handleClick}>
  Submit
</Btn>

// Secondary button
<Btn variant="secondary" size="sm">
  Cancel
</Btn>

// With loading state
<Btn variant="primary" loading={isLoading}>
  Processing...
</Btn>

// Disabled state
<Btn variant="primary" disabled={!canSubmit}>
  Submit
</Btn>
```

### **4. Using Input Component**

```tsx
import { Input } from '@/components/ui/input';

<Input 
  placeholder="Search..."
  size="md"
  error={hasError}
  disabled={isDisabled}
/>
```

### **5. Using StatusDot Component**

```tsx
import { StatusDot } from '@/components/ui/StatusDot';

<StatusDot variant="success" size="md" />
<StatusDot variant="warning" size="sm" />
<StatusDot variant="error" size="lg" />
<StatusDot variant="neutral" size="md" />
```

### **6. Complete Example**

```tsx
import { Surface } from '@/components/ui/Surface';
import { Txt } from '@/components/ui/Txt';
import { Btn } from '@/components/ui/Btn';
import { Input } from '@/components/ui/input';
import { StatusDot } from '@/components/ui/StatusDot';

export function MyComponent() {
  return (
    <Surface variant="base" className="p-6">
      <Txt variant="h2">My Component</Txt>
      <Txt variant="body" className="text-text-tertiary mb-4">
        Description here
      </Txt>
      
      <div className="flex items-center gap-3 mb-4">
        <Input placeholder="Search..." size="md" />
        <Btn variant="primary" size="md">Search</Btn>
      </div>
      
      <div className="flex items-center gap-2">
        <StatusDot variant="success" size="sm" />
        <Txt variant="body">Status: Active</Txt>
      </div>
    </Surface>
  );
}
```

---

## 📍 Next Steps

### **Option B: Drift Police (ESLint Rules)**

**Objective:** Automatically prevent future drift by banning ungoverned colors.

**Tasks:**

1. **Install ESLint Plugin**
   ```bash
   npm install --save-dev eslint-plugin-tailwindcss
   ```

2. **Create Custom ESLint Rule**
   - Ban hardcoded hex colors (`bg-[#...]`, `text-[#...]`)
   - Ban arbitrary Tailwind colors (`bg-red-500`, `text-amber-400`)
   - Allow only token-based classes (`bg-surface-base`, `text-status-success`)

3. **Configure ESLint**
   ```json
   // .eslintrc.json
   {
     "rules": {
       "no-hardcoded-colors": "error",
       "tailwindcss/no-arbitrary-color": "error"
     }
   }
   ```

4. **Test the Rules**
   - Try to use `bg-[#123456]` → Should fail
   - Try to use `bg-red-500` → Should fail
   - Use `bg-status-error` → Should pass

### **Option C: Continue Expansion**

**Target Modules:**

1. **`app/payments/page.tsx`** — Payment listing page
2. **`app/dashboard/page.tsx`** — Main dashboard
3. **Other modules** — As needed

**Process:**

1. Analyze the module for hardcoded colors
2. Map colors to tokens (see `REF_050_PaymentHubRefactoringPlan.md`)
3. Replace components systematically:
   - Containers → `Surface`
   - Text → `Txt`
   - Buttons → `Btn`
   - Inputs → `Input`
   - Status indicators → `StatusDot`
4. Verify zero hardcoded colors
5. Test visual consistency

---

## ✅ Best Practices

### **1. Always Use Atomic Components**

❌ **DON'T:**
```tsx
<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
  <h1 className="text-2xl font-bold text-slate-900">Title</h1>
  <button className="bg-[#28E7A2] text-black px-4 py-2 rounded">
    Click me
  </button>
</div>
```

✅ **DO:**
```tsx
<Surface variant="base" className="p-6">
  <Txt variant="h1">Title</Txt>
  <Btn variant="primary">Click me</Btn>
</Surface>
```

### **2. Never Use Hardcoded Colors**

❌ **DON'T:**
```tsx
<div className="bg-[#050505] text-[#666] border-[#1F1F1F]">
```

✅ **DO:**
```tsx
<Surface variant="base" className="text-text-tertiary border-border-surface-base">
```

### **3. Use Status Tokens for Status Indicators**

❌ **DON'T:**
```tsx
<span className="bg-emerald-500 text-white">Success</span>
```

✅ **DO:**
```tsx
<StatusDot variant="success" size="md" />
```

### **4. Maintain Form Symmetry**

When using `Input` and `Btn` together, they automatically align:

```tsx
<div className="flex items-center gap-3">
  <Input placeholder="Search..." size="md" />
  <Btn variant="primary" size="md">Search</Btn>
</div>
```

Both use `rounded-action` (0.5rem) and matching heights.

### **5. Use Semantic Variants**

```tsx
// ✅ Good - Semantic
<Txt variant="h1">Main Title</Txt>
<Txt variant="body">Body text</Txt>

// ❌ Bad - Arbitrary
<div className="text-2xl font-bold">Title</div>
<div className="text-base">Body</div>
```

---

## 🔄 Common Patterns

### **Pattern 1: Card with Header and Actions**

```tsx
<Surface variant="base" className="p-6">
  <div className="flex items-center justify-between mb-4">
    <Txt variant="h2">Card Title</Txt>
    <Btn variant="secondary" size="sm">Action</Btn>
  </div>
  <Txt variant="body" className="text-text-tertiary">
    Card content
  </Txt>
</Surface>
```

### **Pattern 2: Status Badge**

```tsx
<div className="flex items-center gap-2">
  <StatusDot variant="success" size="sm" />
  <Txt variant="body">Status: Active</Txt>
</div>
```

### **Pattern 3: Warning Alert**

```tsx
<Surface variant="base" className="p-3 bg-status-warning/10 border-status-warning/30">
  <div className="flex items-center gap-2">
    <StatusDot variant="warning" size="sm" />
    <Txt variant="small" className="font-bold text-status-warning">
      Warning Message
    </Txt>
  </div>
  <Txt variant="small" className="text-status-warning/70 mt-1">
    Additional details here
  </Txt>
</Surface>
```

### **Pattern 4: Form with Actions**

```tsx
<Surface variant="base" className="p-6">
  <Txt variant="h2" className="mb-4">Form Title</Txt>
  <div className="space-y-4">
    <Input placeholder="Name" size="md" />
    <Input placeholder="Email" size="md" />
  </div>
  <div className="flex items-center gap-3 mt-6">
    <Btn variant="secondary" size="md">Cancel</Btn>
    <Btn variant="primary" size="md">Submit</Btn>
  </div>
</Surface>
```

### **Pattern 5: Metric Card**

```tsx
<Surface variant="base" className="p-4">
  <Txt variant="small" className="text-text-tertiary mb-1">
    Metric Label
  </Txt>
  <div className="flex items-center gap-2">
    <Txt variant="h2" className="text-action-primary">
      $1,234
    </Txt>
    <StatusDot variant="success" size="sm" />
  </div>
</Surface>
```

---

## 🐛 Troubleshooting

### **Issue: TypeScript Errors**

**Symptoms:** `Cannot find namespace 'React'`, `Property 'className' does not exist`

**Solution:** These are transient linting issues. Try:
1. Restart the TypeScript server
2. Run `npm run build` to verify compilation
3. Check that imports are correct

### **Issue: Colors Not Updating**

**Symptoms:** Changing tokens in `globals.css` doesn't update components

**Solution:**
1. Verify tokens are in RGB format (`255 255 255`, not `#ffffff`)
2. Check `tailwind.config.js` mapping is correct
3. Restart the dev server
4. Clear browser cache

### **Issue: Form Elements Not Aligning**

**Symptoms:** `Input` and `Btn` have different heights

**Solution:**
1. Ensure both use the same `size` prop (`md` is default)
2. Both automatically use `rounded-action` (0.5rem)
3. Check for custom `className` overrides

### **Issue: Dark Mode Not Working**

**Symptoms:** Components don't change in dark mode

**Solution:**
1. Verify `.dark` class is applied to root element
2. Check `globals.css` has dark mode overrides
3. Ensure tokens use RGB format for opacity control

---

## 📚 Reference Documents

### **Canon References**

- **`REF_046_NextJsRefactoringStrategy.md`** — Initial analysis and strategy
- **`REF_047_AtomicNormalizationSystem.md`** — Core system documentation
- **`REF_048_RefactoringAuditEvaluation.md`** — Phase 1 & 2 audit
- **`REF_049_NextJsBestPractices.md`** — Next.js validation
- **`REF_050_PaymentHubRefactoringPlan.md`** — Phase 3 refactoring plan

### **Component Stories (Storybook)**

- `src/components/ui/Surface.stories.tsx`
- `src/components/ui/Txt.stories.tsx`
- `src/components/ui/Btn.stories.tsx`
- `src/components/ui/Input.stories.tsx`
- `src/components/ui/StatusDot.stories.tsx`

### **Key Files**

- **`src/styles/globals.css`** — Design tokens (The Constitution)
- **`tailwind.config.js`** — Token mapping (The Bridge)
- **`src/components/ui/Surface.tsx`** — Container component
- **`src/components/ui/Txt.tsx`** — Typography component
- **`src/components/ui/Btn.tsx`** — Action component
- **`src/components/ui/Input.tsx`** — Input component
- **`src/components/ui/StatusDot.tsx`** — Status indicator

---

## 🎯 Success Criteria

When refactoring a new module, verify:

- ✅ Zero hardcoded hex colors (`bg-[#...]`, `text-[#...]`)
- ✅ Zero arbitrary Tailwind colors (`bg-red-500`, `text-amber-400`)
- ✅ All containers use `Surface` component
- ✅ All text uses `Txt` component
- ✅ All buttons use `Btn` component
- ✅ All inputs use `Input` component
- ✅ All status indicators use `StatusDot` component
- ✅ Visual consistency maintained
- ✅ Dark mode works correctly
- ✅ No TypeScript errors
- ✅ No lint errors

---

## 🚦 Quick Start Checklist

When starting a new refactoring task:

1. **Analyze** — Identify all hardcoded colors
2. **Map** — Map colors to tokens (see `REF_050` for reference)
3. **Replace** — Systematically replace components:
   - Containers → `Surface`
   - Text → `Txt`
   - Buttons → `Btn`
   - Inputs → `Input`
   - Status → `StatusDot`
4. **Verify** — Run `grep` to confirm zero hardcoded colors
5. **Test** — Visual consistency + dark mode
6. **Document** — Update this handbook if needed

---

## 📞 Questions?

If you encounter issues or need clarification:

1. Check the reference documents (`REF_046` through `REF_050`)
2. Review component stories in Storybook
3. Check existing refactored components for patterns
4. Verify tokens are correctly defined in `globals.css`

---

## 🎉 Final Notes

**You are now part of a drift-free, governed design system.**

Every component you create using the atomic components is:
- ✅ Maintainable (change tokens, update everywhere)
- ✅ Consistent (same look and feel)
- ✅ Accessible (built-in a11y features)
- ✅ Scalable (ready for 1000+ pages)

**Remember:** The system protects itself. Use the atoms, and drift cannot occur.

---

**Happy Coding! 🚀**

*Last Updated: December 2025*  
*Phase: 3 Complete — Payment Hub Refactored*  
*Next: Option B — Drift Police (ESLint Rules)*
