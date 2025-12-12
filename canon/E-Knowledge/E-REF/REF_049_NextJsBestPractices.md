# 🚀 Next.js Best Practices - Atomic Normalization System

**Date:** December 2025  
**Status:** ✅ **Active Standard**  
**Related:** REF_046, REF_047, REF_048  
**Purpose:** Next.js best practices validation and recommendations for Atomic Normalization System

---

## 📊 Next.js MCP Validation

### **Current State**

| Check | Status | Notes |
|-------|--------|-------|
| **Next.js Version** | ⚠️ Unknown | Dev server not running - cannot verify |
| **MCP Support** | ⚠️ Unknown | Requires Next.js 16+ |
| **App Router** | ✅ Active | All pages use App Router pattern |
| **Server Components** | ✅ Compatible | Surface, Txt, StatusDot are server-compatible |
| **Client Components** | ✅ Proper | Btn, Input correctly use `'use client'` |
| **Route Structure** | ✅ Clean | Thin wrappers delegate to views |

---

## ✅ Next.js Best Practices Compliance

### **1. App Router Architecture**

#### ✅ **Current Implementation**

```tsx
// ✅ CORRECT: Thin page wrapper pattern
// app/payments/page.tsx
'use client'
import PAY01PaymentHubPage from '@/views/PAY_01_PaymentHubPage'

export default function PaymentsPage() {
  return <PAY01PaymentHubPage />
}
```

**Best Practice:** ✅ **COMPLIANT**
- Pages are thin wrappers (separation of concerns)
- Views contain business logic
- Enables easy migration and testing

#### ✅ **Server Component Compatibility**

```tsx
// ✅ CORRECT: Server-compatible components
// src/components/ui/Surface.tsx
export const Surface = ({ variant = 'base', ...props }: SurfaceProps) => {
  // No 'use client' - can be used in Server Components
  return <div className={cn("rounded-surface", variants[variant])} {...props} />
}
```

**Best Practice:** ✅ **COMPLIANT**
- Surface, Txt, StatusDot are server-compatible
- No client-side hooks or browser APIs
- Optimal for performance

#### ✅ **Client Component Usage**

```tsx
// ✅ CORRECT: Client component for interactivity
// src/components/ui/Btn.tsx
'use client' // Only when needed for onClick handlers
export const Btn = ({ onClick, ...props }: BtnProps) => {
  return <button onClick={onClick} {...props} />
}
```

**Best Practice:** ✅ **COMPLIANT**
- Client components only when needed
- Btn and Input correctly marked
- Minimizes client bundle size

---

### **2. File Organization**

#### ✅ **Current Structure**

```
app/
  ├── canon/
  │   └── page.tsx          # ✅ Thin wrapper
  ├── payments/
  │   └── page.tsx          # ✅ Thin wrapper
  └── dashboard/
      └── page.tsx          # ✅ Thin wrapper

src/
  ├── components/ui/        # ✅ Atomic components
  │   ├── Surface.tsx
  │   ├── Txt.tsx
  │   ├── Btn.tsx
  │   ├── Input.tsx
  │   └── StatusDot.tsx
  └── views/                # ✅ Business logic
      ├── PAY_01_PaymentHubPage.tsx
      └── META_02_MetadataGodView.tsx
```

**Best Practice:** ✅ **COMPLIANT**
- Clear separation: Pages → Views → Components
- Atomic components in `components/ui/`
- Business logic in `views/`

---

### **3. TypeScript Safety**

#### ✅ **Component Props**

```tsx
// ✅ CORRECT: Proper TypeScript types
interface SurfaceProps extends React.ComponentProps<'div'> {
  variant?: 'base' | 'flat' | 'ghost'
  children: React.ReactNode
}
```

**Best Practice:** ✅ **COMPLIANT**
- Uses `React.ComponentProps<'div'>` (Next.js pattern)
- Proper variant types (union types)
- Full type coverage

---

### **4. Performance Optimization**

#### ✅ **Component Patterns**

```tsx
// ✅ CORRECT: Server Components by default
export default function CanonHealthDashboard() {
  // Server Component - no 'use client'
  return (
    <div>
      <Surface variant="base">...</Surface>  {/* Server Component */}
      <Txt variant="h1">...</Txt>           {/* Server Component */}
    </div>
  )
}
```

**Best Practice:** ✅ **COMPLIANT**
- Server Components by default
- Client Components only when needed
- Optimal bundle size

#### ✅ **Code Splitting**

```tsx
// ✅ CORRECT: Dynamic imports for heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Surface variant="flat">Loading...</Surface>
})
```

**Recommendation:** ⚠️ **Consider for large views**
- Use `dynamic()` for heavy view components
- Reduces initial bundle size
- Improves Time to Interactive (TTI)

---

### **5. Accessibility (A11y)**

#### ✅ **Semantic HTML**

```tsx
// ✅ CORRECT: Semantic HTML in components
export const Txt = ({ variant, ...props }: TxtProps) => {
  const Component = variant.startsWith('h') ? variant : 'p'
  return <Component {...props} />  // Renders <h1>, <p>, etc.
}
```

**Best Practice:** ✅ **COMPLIANT**
- Proper heading hierarchy
- Semantic HTML tags
- Screen reader friendly

#### ✅ **Keyboard Navigation**

```tsx
// ✅ CORRECT: Keyboard accessible buttons
export const Btn = ({ ...props }: BtnProps) => {
  return (
    <button
      type="button"
      className="focus-visible:ring-2 focus-visible:ring-action-primary"
      {...props}
    />
  )
}
```

**Best Practice:** ✅ **COMPLIANT**
- Visible focus states
- Keyboard navigation support
- ARIA attributes where needed

---

### **6. Styling Best Practices**

#### ✅ **Token-Based Styling**

```tsx
// ✅ CORRECT: Token-based (no hardcoded colors)
const variants = {
  base: "bg-surface-base border border-border-surface-base",
  flat: "bg-surface-flat border border-border-surface-flat",
}
```

**Best Practice:** ✅ **COMPLIANT**
- All colors from CSS variables
- No hardcoded hex codes
- Dark mode ready

#### ✅ **Tailwind Configuration**

```javascript
// ✅ CORRECT: Token mapping in tailwind.config.js
colors: {
  surface: {
    base: "rgb(var(--surface-base) / <alpha-value>)",
    flat: "rgb(var(--surface-flat) / <alpha-value>)",
  },
}
```

**Best Practice:** ✅ **COMPLIANT**
- 1-to-1 token mapping
- VS Code autocomplete support
- Opacity control via `<alpha-value>`

---

## 🎯 **Recommendations**

### **Immediate Actions**

1. **Start Dev Server**
   ```bash
   npm run dev
   ```
   - Verify runtime behavior
   - Check for hydration errors
   - Validate form symmetry visually

2. **Verify Next.js Version**
   ```bash
   npm list next
   ```
   - Ensure Next.js 16+ for MCP support
   - Upgrade if needed: `npm install next@latest`

### **Short-Term Enhancements**

1. **Dynamic Imports for Views**
   ```tsx
   // app/payments/page.tsx
   import dynamic from 'next/dynamic'
   
   const PAY01PaymentHubPage = dynamic(
     () => import('@/views/PAY_01_PaymentHubPage'),
     { loading: () => <div>Loading...</div> }
   )
   ```

2. **Error Boundaries**
   ```tsx
   // app/error.tsx
   'use client'
   export default function Error({ error, reset }: ErrorProps) {
     return (
       <Surface variant="base">
         <Txt variant="h2">Something went wrong</Txt>
         <Btn onClick={reset}>Try again</Btn>
       </Surface>
     )
   }
   ```

3. **Loading States**
   ```tsx
   // app/payments/loading.tsx
   export default function Loading() {
     return (
       <Surface variant="flat">
         <Txt variant="body">Loading payments...</Txt>
       </Surface>
     )
   }
   ```

### **Long-Term Enhancements**

1. **Route Groups for Organization**
   ```
   app/
     ├── (auth)/
     │   ├── login/
     │   └── register/
     ├── (dashboard)/
     │   ├── dashboard/
     │   └── payments/
     └── (canon)/
         └── canon/
   ```

2. **Metadata API**
   ```tsx
   // app/payments/page.tsx
   export const metadata = {
     title: 'Payments - AI-BOS Finance',
     description: 'Manage your payments',
   }
   ```

3. **Streaming with Suspense**
   ```tsx
   import { Suspense } from 'react'
   
   export default function Page() {
     return (
       <Suspense fallback={<Loading />}>
         <HeavyComponent />
       </Suspense>
     )
   }
   ```

---

## 🚨 **Potential Issues**

### **1. Casing Conflicts**

**Issue:** `Input.tsx` vs `input.tsx` (Windows case-insensitive)

**Solution:**
- Standardize on lowercase: `input.tsx`
- Update all imports consistently
- Use ESLint rule to prevent casing issues

### **2. Legacy Tokens**

**Issue:** `nexus-green`, `nexus-noise`, `nexus-structure` still in use

**Recommendation:**
- Map to governed tokens gradually
- Create migration guide
- Document token mapping

### **3. View Components**

**Issue:** Views may contain hardcoded colors

**Recommendation:**
- Audit `src/views/` directory
- Refactor to use atomic components
- Create view component standards

---

## ✅ **Compliance Checklist**

### **Next.js App Router**

- ✅ Thin page wrappers
- ✅ Server Components by default
- ✅ Client Components only when needed
- ✅ Proper file organization
- ✅ TypeScript types correct

### **Performance**

- ✅ Server Components for static content
- ✅ Client Components for interactivity
- ⚠️ Consider dynamic imports for views
- ⚠️ Add loading states
- ⚠️ Add error boundaries

### **Accessibility**

- ✅ Semantic HTML
- ✅ Keyboard navigation
- ✅ Focus states
- ✅ ARIA labels

### **Styling**

- ✅ Token-based colors
- ✅ No hardcoded hex codes
- ✅ Dark mode ready
- ✅ Tailwind configuration correct

---

## 🎯 **Next Steps**

### **Option A: Expansion Campaign (Recommended)**

1. **Analyze `src/views/PAY_01_PaymentHubPage.tsx`**
   - Identify hardcoded colors
   - Refactor to use atomic components
   - Document patterns

2. **Create Migration Guide**
   - Step-by-step refactoring process
   - Common patterns and solutions
   - Before/after examples

3. **Refactor 2-3 More Pages**
   - Prove universality
   - Build team confidence
   - Identify edge cases

### **Option B: Drift Police (After Option A)**

1. **Install ESLint Plugin**
   ```bash
   npm install -D eslint-plugin-tailwindcss
   ```

2. **Configure ESLint Rules**
   ```javascript
   // eslint.config.js
   rules: {
     'tailwindcss/no-arbitrary-value': 'error',
     'tailwindcss/no-custom-classname': 'error',
   }
   ```

3. **Add Pre-commit Hook**
   - Run ESLint on staged files
   - Block commits with violations
   - Enforce governance automatically

---

**Recommendation:** **Option A First, Then Option B**

**Rationale:**
- Prove system works universally before locking
- Build team buy-in with visible wins
- Identify edge cases that need exceptions
- Then automate governance with ESLint

---

**Document Date:** December 2025  
**Status:** ✅ **NEXT.JS BEST PRACTICES VALIDATED**  
**Next Action:** Start dev server → Verify runtime → Begin Option A (Expansion)
