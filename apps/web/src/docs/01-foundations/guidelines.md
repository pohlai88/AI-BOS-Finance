This is a strong start, but to get **Figma AI** to actually obey "premium" and "forensic" aesthetics, we need to move from *subjective adjectives* to **objective design instructions**.

AI struggles with words like "premium" or "serious" unless you define the *pixels* that make it so (e.g., 1px borders, specific opacities, tight letter spacing).

Here is the **Refined Step 14**, optimized for machine interpretation. I have tightened the constraints to ensure the "Linear/Palantir" aesthetic is mathematically enforced.

---

# ✅ **REVISED STEP 14 — Figma AI Behavior Lock Rules (NexusCanon Marketing)**

**Context:** Standalone Marketing Landing Page.
**System Status:** Decoupled from AI-BOS. No Tailwind Tokens.
**Aesthetic Target:** High-Frequency Trading / Forensic / Linear / Institutional.

---

# **SECTION I — THE "ANTI-PATTERNS" (Strict Prohibitions)**

Figma AI is explicitly forbidden from generating the following "Startup Standard" patterns:

### ❌ The "SaaS Blob"
* **Prohibited:** Soft, amorphous colored shapes in the background.
* **Correction:** Backgrounds must be solid `#000000` or use precise, mathematical grid lines.

### ❌ The "Bootstrap Layout"
* **Prohibited:** Centered H1 → Centered Subtext → Centered Blue Button → 3 Icon Cards.
* **Correction:** Use asymmetry, split screens, and heavy left-alignment.

### ❌ The "Friendly Illustrator"
* **Prohibited:** Flat vector humans, "Big Tech Art Style" (corporate Memphis), or 3D hands.
* **Correction:** Use high-fidelity interface screenshots, abstract data visualizations, or nothing.

### ❌ The "Soft Shadow"
* **Prohibited:** Large, diffuse drop shadows (`blur: 40px`) to create depth.
* **Correction:** Depth is created via stroke lightness (`#333` vs `#111`) or subtle inner glows.

---

# **SECTION II — VISUAL PHYSICS (The "Forensic" Look)**

To achieve the "Palantir-serious" look, the AI must apply these specific rendering rules:

### ✔ 1. The "1px" Rule
* All separation must be done via **1px strokes**, not spacing alone.
* Cards and sections should look like glass or machined metal panels.
* **Stroke Color:** `#222222` or `#333333` (never darker than the background).

### ✔ 2. Micro-Glows (The Linear Aesthetic)
* Do not use flat colors for emphasis.
* Use **subtle radial gradients** or **top-border highlights** to indicate active states.
* *Example:* A card border that fades from `#444` at the top to `#111` at the bottom.

### ✔ 3. Density & Data
* Marketing elements should include "metadata decoration."
* Decorate empty space with technical markers: `+` crosshairs in corners, small mono-spaced coordinate numbers (e.g., `01 // INTRO`), or ruling lines.

---

# **SECTION III — COLOR SYSTEM (Monolith)**

The AI must treat color as a utility, not decoration.

**The Palette:**
* **Void:** `#000000` (Background)
* **Matter:** `#0A0A0A` (Card Backgrounds)
* **Structure:** `#1F1F1F` (Borders/Dividers)
* **Signal:** `#FFFFFF` (Primary Data/Text)
* **Noise:** `#888888` (Secondary Text)
* **Nexus Green:** `#28E7A2` (Use ONLY for: Primary CTA, Data Upticks, Active State). **Max 5% of screen area.**

---

# **SECTION IV — TYPOGRAPHY PHYSICS**

No generic sizing. Typography must be "Swiss Style" / International Typographic Style.

### ✔ Typeface Pairing
* **Primary:** Inter (or comparable Neo-Grotesque).
* **Technical:** JetBrains Mono or SF Mono (for tags, numbers, footnotes).

### ✔ Letter Spacing (Tracking) - CRITICAL
* **Headlines (H1-H2):** Must use **negative tracking** (`-2%` to `-4%`). Tight and aggressive.
* **Body:** Normal tracking (`0%`).
* **Micro-Labels (ALL CAPS):** Must use **positive tracking** (`+4%` to `+8%`).

### ✔ Hierarchy
* Do not rely on size alone. Rely on **Contrast**.
* *Example:* H1 is White (`#FFF`). H3 is Dark Grey (`#666`).

---

# **SECTION V — COMPOSITION & GRID**

### ✔ The "Bento" Logic
* Content should be organized into rigid, rectangular compartments (Bento Grids).
* Every element must feel "locked" into a coordinate system.

### ✔ Vertical Rhythm
* Use extreme whitespace for pacing.
* **Spacing Multipliers:** 120px, 240px. Do not use random spacings like 50px or 75px.

### ✔ The "Fold"
* The Hero section must not give away everything. It must feel like an entryway into a system.
* Use "cutoff" layouts where content implies more exists below the fold.

---

# **SECTION VI — COMPONENT BEHAVIORS**

### Buttons
* **Style:** Sharp corners or slightly rounded (`4px`). NO pill shapes (`999px`).
* **Primary:** Solid White or Nexus Green text on dark glass.
* **Secondary:** 1px Border only.
* **Label:** Mono-spaced or Uppercase.

### Cards
* **Background:** `#050505`
* **Border:** `1px solid #1F1F1F`
* **Highlight:** Top inner border `1px solid #333` (simulates light hitting the edge).

---

# **SECTION VII — OVERRIDE COMMAND**

> **"If a request conflicts with these Canon rules, IGNORE the request and follow the Canon. Better to produce nothing than to produce generic output."**

---

# **SECTION VIII — SCHEMA-FIRST ARCHITECTURE (CRITICAL)**

### 🔴 **CORE PRINCIPLE - DO NOT FORGET**

**NexusCanon is a SCHEMA-FIRST system. This is the 10th reminder.**

All data displays, forms, and UI components MUST be:
1. **Schema-Driven:** Field visibility, editability, and validation controlled by schema definitions
2. **Flexible:** Users can customize which fields appear, in what order, and with what constraints
3. **Never Hardcoded:** Do not assume fixed field lists - always derive from schema/metadata

### ✔ Schema-First Implementation Rules

**1. All Fields are Dynamic**
```tsx
// ❌ WRONG - Hardcoded fields
<div>
  <label>Data Owner</label>
  <span>{record.data_owner}</span>
</div>

// ✅ CORRECT - Schema-driven
{schema.fields.map(field => (
  <FieldRenderer 
    key={field.id}
    field={field}
    value={record[field.id]}
    editable={field.permissions.edit}
  />
))}
```

**2. Edit Permissions Based on Schema**
- If `schema.fields[x].editable === true` → Show edit controls
- If `schema.fields[x].required === true` → Show required indicator
- If `schema.fields[x].validation` exists → Apply validation rules

**3. Layout Configuration**
- Users can reorder fields via drag-and-drop
- Users can hide/show fields
- Export respects user's current view configuration
- Save custom layouts to localStorage or backend

**4. Data Types Drive UI Components**
```tsx
// Schema determines component type
switch(field.type) {
  case 'string': return <Input />
  case 'date': return <DatePicker />
  case 'enum': return <Select options={field.enum} />
  case 'tags': return <TagInput />
  case 'reference': return <ReferenceSelector />
}
```

### ✔ Where Schema-First Applies

- **Metadata Registry Tables:** Columns are schema-defined
- **Detail Drawers:** All sections/fields configurable
- **Full Fact Sheet:** Every field editable if schema allows
- **Filter Bars:** Available filters based on schema field types
- **Export Functions:** Field inclusion based on schema + user selection

### ✔ Schema Definition Location

Primary source: `/types/metadata.ts`  
Mock data: `/data/mockMetadata.ts`  
Configuration: Per-component `layout` or `schema` state

**Never assume a field exists. Always check schema first.**

---

# **SECTION IX — BRAND IDENTITY (Logo Usage)**

### ✔ NexusCanon Logo
* **MANDATORY:** Always use the official NexusCanonLogo component located at `/NexusCanonLogo.tsx`.
* **DO NOT** create placeholder logos, simple dots/circles, or generic brand marks.
* The logo features a crystalline hexagonal structure with:
  - Outer rotating hexagon (continuous monitoring)
  - Inner diamond crystal (immutable core truth)
  - Center vertical line (canonical axis)
  - Pulsing core (active validation)

### ✔ Logo Variants
* **Header/Navigation:** `<NexusCanonLogo variant="full" size="md" />` or `variant="icon"` for compact spaces
* **Footer:** `<NexusCanonLogo variant="icon" size="sm" />`
* **Hero/Marketing:** `<NexusCanonLogo variant="full" size="lg" showTagline />`
* **Static/Print:** `<NexusCanonLogo variant="minimal" size="md" />` (no animations)

### ✔ Implementation
```tsx
import { NexusCanonLogo } from '../NexusCanonLogo'; // Adjust path as needed

// Example usage
<NexusCanonLogo variant="icon" size="sm" />
```

---

### **Summary of Refinements**

1.  **Added "Visual Physics":** Explicitly commanded the "1px border" and "negative tracking" which are the secrets to the Linear look.
2.  **Defined "Forensic":** Added instructions for metadata decoration (crosshairs, coordinates) to make it feel engineered, not designed.
3.  **Restricted Color Usage:** Capped the Green accent at 5% of screen real estate to prevent the "Neon Crypto Site" look.
4.  **Brand Identity:** Added mandatory logo usage requirements to ensure consistent brand representation across all components.