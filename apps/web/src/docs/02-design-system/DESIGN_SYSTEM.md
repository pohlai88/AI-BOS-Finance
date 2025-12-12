# NexusCanon Design System
## Crystallized Nexus Aesthetic Guide

**Version:** 2.4  
**Design Philosophy:** Forensic Architecture  
**Last Updated:** December 6, 2025

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

### 3.4 Line Height

```css
/* Defined in globals.css */
--leading-tight: 1.1;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### 3.5 Letter Spacing

```css
/* Tracking for forensic aesthetic */
.tracking-tight { letter-spacing: -0.05em; }    /* Headlines */
.tracking-normal { letter-spacing: 0; }         /* Body */
.tracking-wide { letter-spacing: 0.05em; }      /* Labels */
.tracking-widest { letter-spacing: 0.1em; }     /* Commands */
```

**Usage:**
- Headlines: `tracking-tight`
- Navigation: `tracking-widest uppercase`
- Body text: `tracking-normal`
- Mono commands: `tracking-widest`

### 3.6 Typography Examples

```tsx
/* Hero Headline */
<h1 className="tracking-tight text-white">
  Every Connection Crystallized
</h1>

/* Section Title */
<h2 className="tracking-tight text-white">
  The Logic Kernel
</h2>

/* Body Text */
<p className="text-zinc-300">
  NexusCanon transforms your financial data into an immutable 
  forensic architecture.
</p>

/* Command Label */
<span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
  Terminal Access
</span>

/* Data Hash */
<span className="font-mono text-emerald-400 tracking-wide">
  #AR_2024_Q4
</span>
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

### 4.3 Layout Grid

```css
/* Desktop: 12-column grid */
max-width: 1280px (max-w-7xl)
gutter: 32px (gap-8)

/* Tablet: 8-column grid */
max-width: 1024px (max-w-5xl)
gutter: 24px (gap-6)

/* Mobile: 4-column grid */
max-width: 100%
gutter: 16px (gap-4)
```

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

**Secondary CTA:**
```tsx
<button className="
  px-6 py-3 
  bg-transparent 
  border border-emerald-500/30 
  hover:border-emerald-500 
  hover:bg-emerald-500/10
  rounded-lg 
  text-emerald-400 
  transition-all duration-300
">
  Learn More
</button>
```

**Ghost Button:**
```tsx
<button className="
  px-4 py-2 
  text-zinc-400 
  hover:text-white 
  hover:bg-white/5 
  rounded-lg 
  transition-colors
">
  Cancel
</button>
```

### 5.2 Input Fields

**Command Palette Input:**
```tsx
<input className="
  flex-1 
  bg-transparent 
  text-lg text-white 
  placeholder-zinc-600 
  focus:outline-none 
  font-light
" 
placeholder="Type a command or search assets..."
/>
```

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
" 
/>
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

**Module Status Card:**
```tsx
<div className="
  p-4 
  bg-zinc-950 
  border-l-2 border-emerald-500 
  rounded-r-lg
  hover:bg-zinc-900 
  transition-colors 
  cursor-pointer
">
  <div className="flex items-center justify-between">
    <span className="font-mono text-sm text-white">Balance Sheet</span>
    <span className="text-xs text-emerald-400">VERIFIED</span>
  </div>
</div>
```

### 5.4 Navigation Items

```tsx
<a className="
  flex items-center justify-center gap-2 
  text-zinc-400 
  hover:text-white 
  cursor-pointer 
  transition-colors 
  group
">
  <span className="text-zinc-600 group-hover:text-emerald-500 transition-colors">
    {icon}
  </span>
  <span className="text-xs font-mono uppercase tracking-widest">
    {label}
  </span>
</a>
```

### 5.5 Modals

**Command Palette Modal:**
```tsx
<div className="
  fixed inset-0 z-[100] 
  flex items-start justify-center 
  pt-[20vh] px-4
">
  {/* Backdrop */}
  <div className="
    absolute inset-0 
    bg-black/60 
    backdrop-blur-sm
  " />
  
  {/* Window */}
  <div className="
    relative w-full max-w-2xl 
    bg-[#0A0A0A] 
    border border-white/10 
    rounded-xl 
    shadow-2xl 
    overflow-hidden
  ">
    {/* Content */}
  </div>
</div>
```

### 5.6 Status Indicators

**State Dots:**
```tsx
{/* Verified */}
<div className="w-2 h-2 rounded-full bg-emerald-500" />

{/* Scanning */}
<div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />

{/* Critical */}
<div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />

{/* Warning */}
<div className="w-2 h-2 rounded-full bg-amber-500" />
```

**Progress Bars:**
```tsx
<div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
  <div 
    className="h-full bg-emerald-500 transition-all duration-300"
    style={{ width: `${progress}%` }}
  />
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

### 6.3 Icon Colors

```tsx
/* Default */
<Icon className="text-zinc-500" />

/* Active */
<Icon className="text-emerald-500" />

/* Hover */
<Icon className="text-zinc-400 group-hover:text-emerald-400 transition-colors" />
```

### 6.4 Common Icons

```tsx
import {
  // Navigation
  Layers, FileText, BarChart3, Shield, Users, Lock,
  
  // Actions
  Search, LogIn, Command, Zap, ArrowRight,
  
  // States
  CheckCircle, AlertTriangle, XCircle, Loader,
  
  // UI
  X, ChevronDown, ChevronRight, Menu
} from 'lucide-react';
```

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

### 7.3 Standard Transitions

```tsx
/* Fade In */
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
/>

/* Slide Up */
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
/>

/* Scale In */
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.3 }}
/>

/* Stagger Children */
<motion.div variants={container}>
  {items.map(item => (
    <motion.div key={item.id} variants={itemVariants} />
  ))}
</motion.div>

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};
```

### 7.4 Hover States

```css
/* Standard */
transition-colors duration-300

/* Complex */
transition-all duration-300

/* Fast Feedback */
transition-colors duration-150
```

### 7.5 Easing Functions

```tsx
/* Default: easeInOut */
transition={{ ease: "easeInOut" }}

/* Sharp Entry */
transition={{ ease: [0.4, 0, 0.2, 1] }}

/* Smooth Continuous */
transition={{ ease: "linear" }}
```

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

### 8.3 Modal Backdrop

```css
bg-black/60
backdrop-blur-sm
```

### 8.4 Input Glass

```css
bg-black/50
border border-white/10
focus:border-emerald-500/50
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

### 9.2 Section

```tsx
<section className="min-h-screen py-16 px-8 bg-black">
  <div className="max-w-7xl mx-auto">
    {/* Section Content */}
  </div>
</section>
```

### 9.3 Grid Layouts

```tsx
/* 2-Column */
<div className="grid grid-cols-2 gap-8">

/* 3-Column */
<div className="grid grid-cols-3 gap-6">

/* 6-Column Navigation */
<nav className="grid grid-cols-6 gap-4">

/* Responsive */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

### 9.4 Flexbox Patterns

```tsx
/* Horizontal Center */
<div className="flex items-center justify-center">

/* Space Between */
<div className="flex items-center justify-between">

/* Vertical Stack */
<div className="flex flex-col gap-4">
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

/* Hide on mobile, show on desktop */
<div className="hidden lg:flex">

/* Show on mobile, hide on desktop */
<div className="flex lg:hidden">
```

### 10.3 Responsive Header

```tsx
/* Command Palette: Desktop only */
<CommandPalette className="hidden lg:flex" />

/* Mobile menu replacement */
<MobileMenu className="flex lg:hidden" />
```

---

## 11. Accessibility Standards

### 11.1 WCAG 2.1 Level AA Compliance

**Requirements:**
- [ ] Color contrast ratio ≥ 4.5:1 for normal text
- [ ] Color contrast ratio ≥ 3:1 for large text (18px+)
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] Alternative text for images
- [ ] ARIA labels for icon-only buttons

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

### 11.3 Screen Reader Support

```tsx
/* Icon-only button */
<button aria-label="Open command palette">
  <Search className="w-4 h-4" aria-hidden="true" />
</button>

/* Status indicator */
<div role="status" aria-live="polite">
  Scan complete: 3 critical findings
</div>

/* Skip navigation */
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
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

- ❌ "Easy to use"
- ✅ "Built for auditors who demand precision"

### 12.2 Headline Formulas

**Problem → Solution:**
```
"Every Connection Crystallized"
"Financial Chaos → Forensic Architecture"
```

**Command Statements:**
```
"Execute the Canon"
"Initiate Forensic Scan"
"Crystallize Current Period"
```

### 12.3 Microcopy Examples

| Element | Copy |
|---------|------|
| Search Placeholder | "Search ledger hash..." |
| CTA Button | "Terminal Access" |
| Modal Footer | "NexusCanon Terminal v2.4" |
| Status | "VERIFIED" / "CRITICAL" / "SCANNING" |
| Keyboard Hint | "⌘K to search" |

---

## 13. Assets & Resources

### 13.1 Logo

**Animated Crystal Logo:**
- File: SVG (inline component)
- Colors: Emerald-500 gradient
- Animation: 2-second path draw + 20s rotation
- Size: 40x40px (header), scalable

**Usage:**
```tsx
<div className="relative w-10 h-10">
  {/* See Header.tsx for full SVG */}
</div>
```

### 13.2 Image Guidelines

**DO:**
- Use `ImageWithFallback` component for all new images
- Compress images (target: < 200kb)
- Provide alt text for accessibility
- Use WebP format when possible

**DON'T:**
- Hotlink external images
- Use images wider than 2000px
- Skip lazy loading

### 13.3 Figma Assets

**Imported Assets Location:**
```
/imports/
  svg-*.ts        # SVG path data
figma:asset/*.png # Raster images (virtual module)
```

**Import Syntax:**
```tsx
// SVGs
import svgPaths from "./imports/svg-wg56ef214f";

// Raster images
import imgA from "figma:asset/76faf8f617b56e6f079c5a7ead8f927f5a5fee32.png";
```

---

## 14. Style Tokens Reference

### 14.1 Colors (Tailwind Classes)

```css
/* Backgrounds */
bg-black
bg-zinc-950
bg-zinc-900
bg-white/5 (glassmorphic)

/* Text */
text-white
text-zinc-300
text-zinc-400
text-zinc-500
text-zinc-600

/* Borders */
border-white/10
border-white/5
border-emerald-500

/* Accents */
text-emerald-400
text-emerald-500
bg-emerald-500
```

### 14.2 Shadows

```css
/* Subtle Depth */
shadow-sm

/* Card Elevation */
shadow-lg

/* Modal */
shadow-2xl

/* Custom Glow */
shadow-[0_0_20px_rgba(0,0,0,0.5)]
shadow-[0_0_25px_rgba(16,185,129,0.15)]
```

### 14.3 Border Radius

```css
/* Small */
rounded-lg (8px)

/* Medium */
rounded-xl (12px)

/* Large */
rounded-2xl (16px)

/* Full */
rounded-full (9999px)
```

---

## 15. Component Library Index

| Component | File | Purpose |
|-----------|------|---------|
| Header | `Header.tsx` | 2-layer HUD navigation |
| CommandPalette | `CommandPalette.tsx` | Cmd+K search terminal |
| HeroSection | `HeroSection.tsx` | Full-screen hero |
| LogicKernelSection | `LogicKernelSection.tsx` | Forensic terminal animation |
| ImageWithFallback | `figma/ImageWithFallback.tsx` | Protected image component |

---

## 16. Design System Updates

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

**Maintained by:** Design Team  
**Last Review:** December 6, 2025  
**Next Review:** January 2026
