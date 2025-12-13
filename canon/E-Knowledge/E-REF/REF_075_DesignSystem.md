> **🟢 [ACTIVE]** — Canon Reference  
> **Canon Code:** REF_075  
> **Plane:** E — Knowledge (Reference)  
> **Related:** CONT_01_CanonIdentity, REF_076_BrandIdentity, REF_077_UXGuidelines  
> **Source:** Consolidated from `src/docs/01-foundations/design-system.md` and `src/docs/02-design-system/DESIGN_SYSTEM.md`  
> **Date:** 2025-01-27

---

# REF_075: NexusCanon Design System

**Purpose:** Complete design system reference for NexusCanon - Crystallized Nexus Aesthetic Guide  
**Version:** 2.4  
**Status:** 🟢 Active  
**Design Philosophy:** Forensic Architecture  
**Last Updated:** 2025-01-27

---

## 1. Design Principles

### 1.1 Core Philosophy: "Sexy" Design
- **Hero Section:** Must occupy full laptop screen (100vh)
- **Scroll Indicators:** Always present to guide users
- **No Soft Marketing:** Aggressive, engineering-focused language
- **Forensic Urgency:** Create pressure, not comfort

### 1.2 Psychological Foundations
- **Spinozan Belief:** UI feels inherently trustworthy through consistency
- **Direct Perception (J.J. Gibson):** Affordances are immediately clear
- **Terminal Metaphor:** Living forensic engine, not static website

### 1.3 Financial Compliance
- **Minimum Text Size:** 12px (audit compliance)
- **No Blur Effects:** Prohibited on text
- **No Text Shadows:** Financial reporting standards
- **No Decorative Filters:** All elements must be readable in print

---

## 2. Color System

### 2.1 Primary Palette

```css
/* Void Backgrounds */
--color-void-primary: #000000;      /* Pure black */
--color-void-secondary: #0A0A0A;    /* Command palette */
--color-void-tertiary: #18181B;     /* Zinc-900 */

/* Crystalline Accents */
--color-crystal-emerald: #10B981;   /* Primary brand */
--color-crystal-emerald-dim: #4ADE80; /* Hover states */
--color-crystal-emerald-dark: #059669; /* Active states */

/* Forensic States */
--color-state-critical: #EF4444;    /* Red - Critical findings */
--color-state-warning: #F59E0B;     /* Amber - Warnings */
--color-state-verified: #10B981;    /* Emerald - Verified */
--color-state-scanning: #3B82F6;    /* Blue - In progress */
--color-state-neutral: #6366F1;     /* Indigo - Neutral */
```

### 2.2 Grayscale System

```css
/* Text Hierarchy */
--text-primary: #FFFFFF;            /* Headings */
--text-secondary: #D4D4D8;          /* Zinc-300, body text */
--text-tertiary: #A1A1AA;           /* Zinc-400, labels */
--text-quaternary: #71717A;         /* Zinc-500, hints */
--text-disabled: #52525B;           /* Zinc-600, disabled */

/* UI Elements */
--border-strong: rgba(255, 255, 255, 0.1);
--border-medium: rgba(255, 255, 255, 0.05);
--border-subtle: rgba(255, 255, 255, 0.02);

--bg-glass-strong: rgba(255, 255, 255, 0.05);
--bg-glass-medium: rgba(255, 255, 255, 0.02);
--bg-glass-subtle: rgba(0, 0, 0, 0.5);
```

### 2.3 Semantic Colors

| Use Case | Color | Tailwind Class |
|----------|-------|----------------|
| Success | Emerald-500 | `text-emerald-500` |
| Error | Red-500 | `text-red-500` |
| Warning | Amber-500 | `text-amber-500` |
| Info | Blue-500 | `text-blue-500` |
| Link | Emerald-400 | `text-emerald-400` |
| Link Hover | Emerald-300 | `hover:text-emerald-300` |

### 2.4 Color Usage Rules

**DO:**
- Use deep blacks for backgrounds (`bg-black`, `bg-zinc-950`)
- Use emerald for all interactive elements
- Use red sparingly for critical alerts only
- Maintain 4.5:1 contrast ratio minimum

**DON'T:**
- Use bright whites (`#FFFFFF`) for large backgrounds
- Mix warm and cool accent colors
- Use gradients on text
- Use color as the only indicator of state

---

## 3. Typography

### 3.1 Font Stack

```css
/* Primary: Inter */
font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Monospace: JetBrains Mono (fallback to system) */
font-family: 'JetBrains Mono', 'Courier New', monospace;
```

### 3.2 Type Scale

**CRITICAL:** Do not use Tailwind typography classes. All sizing is defined in `/styles/globals.css`.

```css
/* Defined in globals.css */
h1 { font-size: 3.5rem; }      /* 56px - Hero headlines */
h2 { font-size: 2.5rem; }      /* 40px - Section titles */
h3 { font-size: 1.875rem; }    /* 30px - Subsection titles */
h4 { font-size: 1.5rem; }      /* 24px - Card titles */
h5 { font-size: 1.25rem; }     /* 20px - Small headings */
h6 { font-size: 1rem; }        /* 16px - Labels */

p { font-size: 1rem; }         /* 16px - Body */
small { font-size: 0.875rem; } /* 14px - Captions */

/* Minimum allowed */
.text-minimum { font-size: 0.75rem; } /* 12px - Audit compliance */
```

### 3.3 Font Weights

```css
/* Defined in globals.css - DO NOT override with Tailwind */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

**Usage:**
- Headlines: 700 (bold)
- Subheadings: 600 (semibold)
- Body: 400 (normal)
- Captions: 300 (light)
- Monospace Labels: 500 (medium)

### 3.4 Letter Spacing

```css
/* Tracking for forensic aesthetic */
.tracking-tight { letter-spacing: -0.05em; }    /* Headlines */
.tracking-normal { letter-spacing: 0; }         /* Body */
.tracking-wide { letter-spacing: 0.05em; }      /* Labels */
.tracking-widest { letter-spacing: 0.1em; }     /* Commands */
```

---

## 4. Spacing System

### 4.1 Base Unit: 4px

```css
/* Tailwind spacing scale */
1 = 0.25rem (4px)
2 = 0.5rem (8px)
3 = 0.75rem (12px)
4 = 1rem (16px)
6 = 1.5rem (24px)
8 = 2rem (32px)
12 = 3rem (48px)
16 = 4rem (64px)
24 = 6rem (96px)
32 = 8rem (128px)
```

### 4.2 Component Spacing

| Element | Padding | Margin |
|---------|---------|--------|
| Button (Small) | `px-4 py-2` | - |
| Button (Medium) | `px-6 py-3` | - |
| Button (Large) | `px-8 py-4` | - |
| Card | `p-6` | `mb-6` |
| Section | `px-8 py-16` | - |
| Container | `px-8` | `mx-auto` |
| Input | `px-4 py-3` | - |

---

## 5. Components

### 5.1 Buttons

**Primary CTA (Terminal Access):**
```tsx
<button className="
  group 
  flex items-center gap-3 
  px-5 py-2 
  bg-zinc-950 hover:bg-zinc-900 
  border border-white/10 hover:border-emerald-500/50 
  rounded-full 
  transition-all duration-300
  shadow-[0_0_20px_rgba(0,0,0,0.5)] 
  hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]
">
  <LogIn className="w-3 h-3 text-zinc-400 group-hover:text-emerald-400" />
  <span className="text-xs tracking-widest uppercase text-white group-hover:text-emerald-400">
    Terminal Access
  </span>
  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
</button>
```

### 5.2 Input Fields

**Standard Input:**
```tsx
<input className="
  w-full 
  px-4 py-3 
  bg-black/50 
  border border-white/10 
  focus:border-emerald-500/50 
  rounded-lg 
  text-white 
  placeholder-zinc-600
  transition-colors
" />
```

### 5.3 Cards

**Glassmorphic Card:**
```tsx
<div className="
  p-6 
  bg-white/5 
  border border-white/10 
  rounded-xl 
  backdrop-blur-sm
">
  {/* Content */}
</div>
```

---

## 6. Iconography

### 6.1 Icon Library
**Source:** Lucide React

**Installation:**
```bash
npm install lucide-react
```

### 6.2 Icon Sizing

| Context | Size Class | Actual Size |
|---------|-----------|-------------|
| Small (Nav) | `w-3 h-3` | 12px |
| Medium (Buttons) | `w-4 h-4` | 16px |
| Large (Features) | `w-5 h-5` | 20px |
| Hero | `w-6 h-6` | 24px |

---

## 7. Animation Guidelines

### 7.1 Animation Library
**Motion (Framer Motion successor)**

```bash
npm install motion
```

**Import:**
```tsx
import { motion } from 'motion/react';
```

### 7.2 Animation Principles

**DO:**
- Use for state transitions
- Use for micro-interactions
- Keep under 300ms for UI feedback
- Respect `prefers-reduced-motion`

**DON'T:**
- Animate on page load excessively
- Use bouncy easings for professional interfaces
- Animate layout properties (width, height) - use transform instead
- Create animations longer than 1 second for UI elements

---

## 8. Glassmorphism Effects

### 8.1 Header Glass

```css
bg-black/95
backdrop-blur-md
border border-white/10
```

### 8.2 Card Glass

```css
bg-white/5
backdrop-blur-sm
border border-white/10
```

**IMPORTANT:** No blur effects on TEXT. Only on container backgrounds.

---

## 9. Layout Patterns

### 9.1 Container

```tsx
<div className="max-w-7xl mx-auto px-8">
  {/* Content */}
</div>
```

### 9.2 Grid Layouts

```tsx
/* Responsive */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

---

## 10. Responsive Design

### 10.1 Breakpoints

```css
/* Tailwind defaults */
sm: 640px   /* Tablet portrait */
md: 768px   /* Tablet landscape */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### 10.2 Mobile-First Approach

```tsx
/* Mobile default, scale up */
<div className="
  text-sm           /* Mobile */
  md:text-base      /* Tablet */
  lg:text-lg        /* Desktop */
">
```

---

## 11. Accessibility Standards

### 11.1 WCAG 2.1 Level AA Compliance

**Requirements:**
- Color contrast ratio ≥ 4.5:1 for normal text
- Color contrast ratio ≥ 3:1 for large text (18px+)
- All interactive elements keyboard accessible
- Focus indicators visible
- Alternative text for images
- ARIA labels for icon-only buttons

### 11.2 Focus States

```tsx
/* Visible focus ring */
<button className="
  focus:outline-none 
  focus:ring-2 
  focus:ring-emerald-500 
  focus:ring-offset-2 
  focus:ring-offset-black
">
```

---

## 12. Brand Voice & Copy

### 12.1 Tone of Voice

**Engineering-Focused:**
- "Crystallize" not "save"
- "Forensic scan" not "check"
- "Terminal access" not "sign in"
- "The Canon" not "documentation"

**Aggressive, Not Soft:**
- ❌ "Keep your data safe"
- ✅ "Lock down every transaction"

---

## 13. Component Library Index

| Component | File | Purpose |
|-----------|------|---------|
| Header | `Header.tsx` | 2-layer HUD navigation |
| CommandPalette | `CommandPalette.tsx` | Cmd+K search terminal |
| HeroSection | `HeroSection.tsx` | Full-screen hero |
| LogicKernelSection | `LogicKernelSection.tsx` | Forensic terminal animation |
| ImageWithFallback | `figma/ImageWithFallback.tsx` | Protected image component |

---

## 14. Design System Updates

**Process for Changes:**
1. Propose change in design review meeting
2. Update this document FIRST
3. Update `/styles/globals.css` if needed
4. Implement in components
5. Document in component comments

**Version History:**
- v2.4 (Dec 2025): Command Palette + Header finalized
- v2.3 (Dec 2025): Logic Kernel Section complete
- v2.2 (Dec 2025): Hero Section + typography tokens
- v2.1 (Dec 2025): Initial color system
- v2.0 (Dec 2025): Design system foundation

---

**Last Updated:** 2025-01-27  
**Status:** 🟢 Active  
**Related Documents:** REF_076_BrandIdentity, REF_077_UXGuidelines, CONT_01_CanonIdentity  
**Maintained by:** Design Team
