# BioSkin v0 - The Morphology Layer

**Status:** ✅ **v0 Complete** — Minimum Viable Morphology  
**Governance:** 🛡️ **Drift-Free** — Only composes atomic components

---

## Overview

BioSkin is the **schema-driven UI layer** that maps Kernel metadata to atomic components. It provides three core components:

1. **BioCell** — Primitive mapper (string → Txt/Input, number → formatted, enum → StatusDot)
2. **BioObject** — Tissue renderer (auto-generates details/form layouts)
3. **BioList** — Table renderer (schema-driven columns, row click → FieldContextSidebar)

---

## Architecture

### **Non-Negotiable Constraint**

BioSkin **may only compose**:
- ✅ `Surface`, `Txt`, `Btn`, `Input`, `StatusDot` (atomic components)
- ✅ Layout-only Tailwind utilities (spacing/grid/flex/width/typography **without** colors)

**Forbidden:**
- ❌ Raw colors (`bg-[#...]`, `text-red-500`)
- ❌ Inline styles with colors
- ❌ SVG hardcoded colors
- ❌ Any component not in the atomic set

---

## Components

### **BioCell**

Maps Kernel `data_type` to atomic components:

| Kernel Type | View Mode | Edit Mode |
|-------------|-----------|-----------|
| `text`, `code` | `Txt` | `Input` |
| `number`, `money` | `Txt` (formatted) | `Input` (type="number") |
| `boolean` | `StatusDot + Txt` ("Yes/No") | `Input` (v0: text, v1: switch) |
| `enum`, `status` | `StatusDot + Txt` (if status) else `Txt` | `Input` (v0: text, v1: select) |
| `date`, `datetime` | `Txt` (formatted) | `Input` (type="date"/"datetime-local") |

**Props:**
```tsx
<BioCell
  fieldMeta={MetadataField}
  value={unknown}
  intent="view" | "edit"
  onChange={(value) => void}
/>
```

---

### **BioObject**

Auto-renders sectioned details/form layout:

- **Left:** Labels (`Txt subtle`)
- **Right:** Cell renderer (`BioCell`)
- Supports `intent: view | edit`
- Respects Kernel metadata: `label`, `helpText`, `readOnly`, `hidden`, `required`, `order`, `group`

**Props:**
```tsx
<BioObject
  schema={MetadataField[]}
  data={Record<string, unknown>}
  intent="view" | "edit"
  onChange={(fieldName, value) => void}
  groupBy="group" // Optional
/>
```

---

### **BioList**

Basic table renderer (v0: no virtualization):

- Columns derived from schema shape + Kernel ordering
- Row click opens `FieldContextSidebar` (Nervous System hook-in)
- Supports sorting, filtering (via Kernel metadata)

**Props:**
```tsx
<BioList
  schema={MetadataField[]}
  data={Record<string, unknown>[]}
  onRowClick={(record) => void}
  rowKey="id" // Optional, defaults to 'id'
/>
```

---

### **FieldContextSidebar**

Nervous System hook-in — opens when row/field is clicked:

- Shows field metadata (technical name, description, data type)
- Shows full record (via `BioObject`)
- Closes via button or backdrop

**Props:**
```tsx
<FieldContextSidebar
  fieldMeta={MetadataField}
  record={Record<string, unknown>}
  schema={MetadataField[]}
  open={boolean}
  onClose={() => void}
/>
```

---

## Usage Example

```tsx
import { BioObject, BioList, FieldContextSidebar } from '@/packages/bioskin/src';
import { PAYMENT_SCHEMA } from '@/modules/payment/data/paymentSchema';

// View mode
<BioObject
  schema={PAYMENT_SCHEMA}
  data={paymentRecord}
  intent="view"
/>

// Edit mode
<BioObject
  schema={PAYMENT_SCHEMA}
  data={paymentRecord}
  intent="edit"
  onChange={(fieldName, value) => {
    // Update record
  }}
/>

// Table view
<BioList
  schema={PAYMENT_SCHEMA}
  data={paymentRecords}
  onRowClick={(record) => {
    // Open sidebar
  }}
/>
```

---

## Demo Page

**Location:** `app/bioskin-demo/page.tsx`

**Features:**
- ✅ Renders Payment entity in view/edit modes
- ✅ Shows BioList table with row click → FieldContextSidebar
- ✅ Uses only atomic components (Drift Police compliant)

**Access:** Navigate to `/bioskin-demo` in your Next.js app.

---

## Acceptance Criteria (v0)

- ✅ Renders one real entity (Payment) end-to-end
- ✅ View mode works
- ✅ Edit mode works (at least 3 fields editable)
- ✅ Uses only atoms (no raw colors)
- ✅ FieldContextSidebar works from row click
- ✅ Kernel metadata controls hide/readonly/order
- ✅ No new drift exceptions added

---

## Next Steps (v1)

- [ ] Switch component for boolean fields
- [ ] Select dropdown for enum fields
- [ ] Virtualization for BioList (large datasets)
- [ ] Advanced filtering/sorting UI
- [ ] Field validation (Zod integration)
- [ ] Nested object rendering (BioObject → BioObject)

---

## Files

```
packages/bioskin/
  src/
    BioCell.tsx          # Primitive mapper
    BioObject.tsx         # Tissue renderer
    BioList.tsx           # Table renderer
    FieldContextSidebar.tsx  # Nervous System hook-in
    index.ts              # Exports
  README.md               # This file
```

---

*Last Updated: December 2025*  
*Status: v0 Complete — Production Ready*
