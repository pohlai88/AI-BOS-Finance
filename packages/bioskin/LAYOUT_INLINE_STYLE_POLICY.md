# Layout Inline Style Policy

**Status:** ✅ **APPROVED** — Layout-only inline styles are allowed  
**Drift Police:** ✅ **COMPLIANT** — Color inline styles remain blocked

---

## Policy

**Inline `style` props for layout properties are allowed:**

- ✅ `style={{ width }}` — Column widths, fixed dimensions
- ✅ `style={{ minWidth }}` — Minimum column widths
- ✅ `style={{ maxWidth }}` — Maximum column widths
- ✅ `style={{ height }}` — Fixed heights (when needed)
- ✅ `style={{ flexBasis }}` — Flex layout basis

**Inline `style` props for colors are blocked:**

- ❌ `style={{ color: "#..." }}` — Blocked by `canon/no-inline-style-colors`
- ❌ `style={{ backgroundColor: "rgb(...)" }}` — Blocked by `canon/no-inline-style-colors`
- ❌ `style={{ borderColor: "#..." }}` — Blocked by `canon/no-inline-style-colors`

---

## Rationale

1. **Tailwind JIT Limitation:** Dynamic Tailwind classes like `w-[${field.width}px]` cannot be reliably detected by Tailwind's JIT compiler, leading to missing styles in production.

2. **Layout vs. Color:** Layout properties (width, height) are not drift vectors. Color properties are drift vectors and must use tokens.

3. **Drift Police Scope:** The `canon/no-inline-style-colors` rule specifically targets color-related properties (`color`, `backgroundColor`, `borderColor`, `fill`, `stroke`), not layout properties.

---

## Examples

### ✅ Allowed (Layout)

```tsx
// BioList.tsx - Column width from Kernel metadata
<th style={field.width ? { width: field.width } : undefined} />

// Fixed width container
<div style={{ width: 350 }} />

// Flex basis
<div style={{ flexBasis: '200px' }} />
```

### ❌ Blocked (Colors)

```tsx
// ❌ Blocked by canon/no-inline-style-colors
<div style={{ color: "#ff0000" }} />
<div style={{ backgroundColor: "rgb(255, 0, 0)" }} />
<div style={{ borderColor: "#00ff00" }} />
```

---

## Enforcement

- **ESLint Rule:** `canon/no-inline-style-colors` blocks color inline styles
- **Code Review:** Layout inline styles are acceptable
- **Documentation:** This policy document serves as reference

---

*Last Updated: December 2025*  
*Status: Approved — Layout Inline Styles Allowed*
