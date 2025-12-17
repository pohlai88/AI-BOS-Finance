# Supabase Design System - Complete Extraction

> **Extracted from:** Supabase GitHub Repository (December 2024)  
> **Source:** `github.com/supabase/supabase/packages/ui`  
> **Version:** Latest (master branch)

---

## Table of Contents

1. [Color System](#1-color-system)
2. [Typography](#2-typography)
3. [Spacing](#3-spacing)
4. [Border Radius](#4-border-radius)
5. [Shadows](#5-shadows)
6. [Component Sizing](#6-component-sizing)
7. [Animations](#7-animations)
8. [CSS Variables Reference](#8-css-variables-reference)
9. [Implementation Guide](#9-implementation-guide)

---

## 1. Color System

### Brand Colors (Supabase Green)

The signature Supabase green with HSL values for both light and dark modes:

#### Dark Mode (Default)

```css
/* Brand Scale - Dark Mode */
--brand-200: 162deg 100% 2%;
--brand-300: 155.1deg 100% 8%;
--brand-400: 155.5deg 100% 9.6%;
--brand-500: 154.9deg 100% 19.2%;
--brand-600: 154.9deg 59.5% 70%;
--brand-default: 153.1deg 60.2% 52.7%;
--brand-link: 155deg 100% 38.6%;
```

#### Light Mode

```css
/* Brand Scale - Light Mode */
--brand-200: 147.6deg 72.5% 90%;
--brand-300: 147.5deg 72% 80.4%;
--brand-400: 151.3deg 66.9% 66.9%;
--brand-500: 155.3deg 78.4% 40%;
--brand-600: 156.5deg 86.5% 26.1%;
--brand-default: 152.9deg 60% 52.9%;
--brand-link: 153.4deg 100% 36.7%;
```

#### Brand Colors (Hex Values)

| Token | Dark Mode HSL | Approximate Hex |
|-------|--------------|-----------------|
| brand-default | hsl(153, 60%, 53%) | `#3ECF8E` |
| brand-600 | hsl(155, 60%, 70%) | `#69D9A8` |
| brand-500 | hsl(155, 100%, 19%) | `#006239` |
| brand-400 | hsl(156, 100%, 10%) | `#003320` |
| brand-300 | hsl(155, 100%, 8%) | `#002919` |
| brand-200 | hsl(162, 100%, 2%) | `#000A05` |

### Gray Scale

#### Dark Mode Grays

```css
/* Gray Dark Scale */
--colors-gray-dark-100: 0deg 0% 8.6%;   /* #161616 */
--colors-gray-dark-200: 0deg 0% 11%;    /* #1C1C1C */
--colors-gray-dark-300: 0deg 0% 13.7%;  /* #232323 */
--colors-gray-dark-400: 0deg 0% 15.7%;  /* #282828 */
--colors-gray-dark-500: 0deg 0% 18%;    /* #2E2E2E */
--colors-gray-dark-600: 0deg 0% 20.4%;  /* #343434 */
--colors-gray-dark-700: 0deg 0% 24.3%;  /* #3E3E3E */
--colors-gray-dark-800: 0deg 0% 31.4%;  /* #505050 */
--colors-gray-dark-900: 0deg 0% 43.9%;  /* #707070 */
--colors-gray-dark-1000: 0deg 0% 49.4%; /* #7E7E7E */
--colors-gray-dark-1100: 0deg 0% 62.7%; /* #A0A0A0 */
--colors-gray-dark-1200: 0deg 0% 92.9%; /* #EDEDED */
```

#### Light Mode Grays

```css
/* Gray Light Scale */
--colors-gray-light-100: 0deg 0% 98.8%;  /* #FCFCFC */
--colors-gray-light-200: 0deg 0% 97.3%;  /* #F8F8F8 */
--colors-gray-light-300: 0deg 0% 95.3%;  /* #F3F3F3 */
--colors-gray-light-400: 0deg 0% 92.9%;  /* #EDEDED */
--colors-gray-light-500: 0deg 0% 91%;    /* #E8E8E8 */
--colors-gray-light-600: 0deg 0% 88.6%;  /* #E2E2E2 */
--colors-gray-light-700: 0deg 0% 85.9%;  /* #DBDBDB */
--colors-gray-light-800: 0deg 0% 78%;    /* #C7C7C7 */
--colors-gray-light-900: 0deg 0% 56.1%;  /* #8F8F8F */
--colors-gray-light-1000: 0deg 0% 52.2%; /* #858585 */
--colors-gray-light-1100: 0deg 0% 43.5%; /* #6F6F6F */
--colors-gray-light-1200: 0deg 0% 9%;    /* #171717 */
```

### Semantic Colors

#### Foreground (Text)

```css
/* Dark Mode */
--foreground-default: 0deg 0% 98%;       /* #FAFAFA - Primary text */
--foreground-light: 0deg 0% 70.6%;       /* #B4B4B4 - Secondary text */
--foreground-lighter: 0deg 0% 53.7%;     /* #898989 - Tertiary text */
--foreground-muted: 0deg 0% 30.2%;       /* #4D4D4D - Disabled text */
--foreground-contrast: 0deg 0% 8.6%;     /* #161616 - For light backgrounds */

/* Light Mode */
--foreground-default: var(--colors-gray-light-1200);  /* #171717 */
--foreground-light: 0deg 0% 32.2%;       /* #525252 */
--foreground-lighter: 0deg 0% 43.9%;     /* #707070 */
--foreground-muted: 0deg 0% 69.8%;       /* #B2B2B2 */
--foreground-contrast: 0deg 0% 98.4%;    /* #FAFAFA */
```

#### Background (Surfaces)

```css
/* Dark Mode */
--background-default: 0deg 0% 7.1%;           /* #121212 - Main background */
--background-200: 0deg 0% 9%;                 /* #171717 - Sidebar */
--background-alternative-default: 0deg 0% 5.9%; /* #0F0F0F */
--background-surface-75: 0deg 0% 9%;          /* #171717 */
--background-surface-100: 0deg 0% 12.2%;      /* #1F1F1F */
--background-surface-200: 0deg 0% 12.9%;      /* #212121 */
--background-surface-300: 0deg 0% 16.1%;      /* #292929 */
--background-surface-400: 0deg 0% 16.1%;      /* #292929 */
--background-control: 0deg 0% 14.1%;          /* #242424 */
--background-selection: 0deg 0% 19.2%;        /* #313131 */
--background-overlay-default: 0deg 0% 14.1%;  /* #242424 */
--background-overlay-hover: 0deg 0% 18%;      /* #2E2E2E */
--background-muted: 0deg 0% 14.1%;            /* #242424 */
--background-dash-sidebar: 0deg 0% 9%;        /* #171717 */
--background-dash-canvas: 0deg 0% 7.1%;       /* #121212 */

/* Light Mode */
--background-default: var(--colors-gray-light-100);  /* #FCFCFC */
--background-200: var(--colors-gray-light-200);      /* #F8F8F8 */
--background-alternative-default: 0deg 0% 99.2%;     /* #FDFDFD */
--background-surface-75: 0deg 0% 100%;               /* #FFFFFF */
--background-surface-100: 0deg 0% 98.8%;             /* #FCFCFC */
--background-surface-200: 0deg 0% 95.3%;             /* #F3F3F3 */
--background-surface-300: 0deg 0% 92.9%;             /* #EDEDED */
--background-surface-400: 0deg 0% 89.8%;             /* #E5E5E5 */
--background-muted: 0deg 0% 96.9%;                   /* #F7F7F7 */
```

#### Borders

```css
/* Dark Mode */
--border-default: 0deg 0% 18%;           /* #2E2E2E */
--border-muted: 0deg 0% 14.1%;           /* #242424 */
--border-secondary: 0deg 0% 14.1%;       /* #242424 */
--border-overlay: 0deg 0% 20%;           /* #333333 */
--border-control: 0deg 0% 22.4%;         /* #393939 */
--border-alternative: 0deg 0% 26.7%;     /* #444444 */
--border-strong: 0deg 0% 21.2%;          /* #363636 */
--border-stronger: 0deg 0% 27.1%;        /* #454545 */

/* Light Mode */
--border-default: 0deg 0% 87.5%;         /* #DFDFDF */
--border-strong: 0deg 0% 83.1%;          /* #D4D4D4 */
--border-stronger: 0deg 0% 56.1%;        /* #8F8F8F */
```

### Status Colors

```css
/* Destructive (Red) - Dark Mode */
--destructive-200: 10.9deg 23.4% 9.2%;    /* Dark red bg */
--destructive-300: 7.5deg 51.3% 15.3%;
--destructive-400: 6.7deg 60% 20.6%;
--destructive-500: 7.9deg 71.6% 29%;
--destructive-600: 9.7deg 85.2% 62.9%;    /* #E86A6A */
--destructive-default: 10.2deg 77.9% 53.9%; /* #E54D4D */

/* Warning (Amber) - Dark Mode */
--warning-200: 36.6deg 100% 8%;
--warning-300: 32.3deg 100% 10.2%;
--warning-400: 33.2deg 100% 14.5%;
--warning-500: 34.8deg 90.9% 21.6%;
--warning-600: 38.9deg 100% 42.9%;        /* #DB9B00 */
--warning-default: 38.9deg 100% 42.9%;    /* #DB9B00 */

/* Secondary (Purple) */
--secondary-200: 248deg 53.6% 11%;
--secondary-400: 248.3deg 54.5% 25.9%;
--secondary-default: 247.8deg 100% 70%;   /* #A585FF */
```

### Code Block Syntax Highlighting

```css
--code-block-1: 170.8deg 43.1% 61.4%;  /* Cyan - Strings */
--code-block-2: 33.2deg 90.3% 75.7%;   /* Orange - Numbers */
--code-block-3: 83.8deg 61.7% 63.1%;   /* Green - Functions */
--code-block-4: 276.1deg 67.7% 74.5%;  /* Purple - Keywords */
--code-block-5: 13.8deg 89.7% 69.6%;   /* Coral - Variables */
```

---

## 2. Typography

### Font Families

```css
--font-family-body: Inter;
--font-sans: var(--font-custom, Circular, custom-font, Helvetica Neue, Helvetica, Arial, sans-serif);
--font-mono: var(--font-source-code-pro, Source Code Pro, Office Code Pro, Menlo, monospace);
```

**Supabase uses:**
- **Body/UI:** Inter, Circular (fallback to system fonts)
- **Code:** Source Code Pro, Office Code Pro, Menlo

### Font Sizes & Line Heights

| Scale | CSS Variable | Size | Use Case |
|-------|-------------|------|----------|
| xs | `text-xs` | 12px | Labels, captions |
| sm | `text-sm` | 14px | Body small, table cells |
| base | `text-base` | 16px | Body default |
| lg | `text-lg` | 18px | Subheadings |
| xl | `text-xl` | 20px | Section headers |
| 2xl | `text-2xl` | 24px | Page titles |
| 3xl | `text-3xl` | 30px | Hero text |

### Font Weights

```css
h1, h2, h3, h4, h5, h6 {
  font-weight: 400; /* Headers use regular weight */
}

p {
  font-weight: 400;
}
```

**Note:** Supabase uses surprisingly light font weights (400) for headings, relying on size and color for hierarchy rather than boldness.

### Typography Theme Classes

```css
/* Prose typography overrides */
--tw-prose-body: hsl(var(--foreground-light));
--tw-prose-headings: hsl(var(--foreground-default));
--tw-prose-lead: hsl(var(--foreground-light));
--tw-prose-links: hsl(var(--foreground-light));
--tw-prose-bold: hsl(var(--foreground-light));
--tw-prose-counters: hsl(var(--foreground-light));
--tw-prose-bullets: hsl(var(--foreground-muted));
--tw-prose-hr: hsl(var(--background-surface-300));
--tw-prose-quotes: hsl(var(--foreground-light));
--tw-prose-quote-borders: hsl(var(--background-surface-300));
--tw-prose-code: hsl(var(--foreground-default));
--tw-prose-pre-code: hsl(var(--foreground-muted));
--tw-prose-pre-bg: hsl(var(--background-surface-200));
```

---

## 3. Spacing

### Base Spacing Scale

```css
--spacing-scale: 2px;
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 32px;
--spacing-xl: 64px;
```

### Component-Specific Spacing

| Component | Padding X | Padding Y | Gap |
|-----------|----------|-----------|-----|
| tiny | 10px (px-2.5) | 4px (py-1) | - |
| small | 12px (px-3) | 8px (py-2) | - |
| medium | 16px (px-4) | 8px (py-2) | - |
| large | 16px (px-4) | 8px (py-2) | - |
| xlarge | 24px (px-6) | 12px (py-3) | - |

### Height Scale (Buttons/Inputs)

```css
--height-tiny: 26px;
--height-small: 34px;
--height-medium: 38px;
--height-large: 42px;
--height-xlarge: 50px;
```

### Card Spacing

```css
--padding-x-sm: 1rem;     /* 16px - px-4 */
--padding-x-md: 1.5rem;   /* 24px - px-6 */
--card-padding-x: var(--padding-x-sm);
--card-padding-x-md: var(--padding-x-md);
```

### Layout Spacing

```css
--content-width-screen-xl: 1128px;
--xxl: 128px;
```

---

## 4. Border Radius

```css
--borderradius-xs: 2px;
--borderradius-sm: 4px;
--borderradius-lg: 8px;
--borderradius-xl: 16px;
--borderradius-tableheader: 4px;
--panel: 2px;
--panel2: 4px;
```

### Component Border Radius

| Component | Radius |
|-----------|--------|
| Buttons | 4px (rounded-md) |
| Cards | 6px (rounded-md) |
| Inputs | 4px (rounded-md) |
| Modals | 6px (rounded-md) |
| Badges | 9999px (rounded-full) |
| Panels | 4-6px |
| Table Headers | 4px |

---

## 5. Shadows

```css
/* Card shadow */
box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.25);

/* Overlay shadow */
box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

/* Dropdown shadow */
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 
            0 4px 6px -2px rgba(0, 0, 0, 0.05);

/* Focus ring */
ring: 2px solid var(--ring-color);
ring-offset: 1px;
```

---

## 6. Component Sizing

### Icon Sizes

```css
--icon-xs: 12px;
--icon-sm: 16px;
--icon-md: 18px;
--datatable-headericon: 16px;
--options-icon: 18px;
```

### Input/Control Sizes

```css
--input-sm-height: 28px;
--datatable-rowheight: 28px;
```

### Border Widths

```css
--borderwidth-none: 0;
--borderwidth-xs: 1px;
--borderwidth-sm: 2px;
--borderwidth-md: 4px;
--borderwidth-lg: 8px;
--iconwidth-default: 1px;
```

---

## 7. Animations

### Timing Functions

```css
/* Standard easing */
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);

/* Dropdown/overlay easing */
transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);

/* Accordion easing */
transition-timing-function: cubic-bezier(0.87, 0, 0.13, 1);
```

### Durations

```css
/* Fast (hover states) */
--duration-fast: 100ms;

/* Normal (interactions) */
--duration-normal: 150ms;

/* Slow (complex animations) */
--duration-slow: 200-300ms;
```

### Animation Keyframes

```css
/* Fade animations */
@keyframes fadeIn {
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes fadeOut {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0; }
}

/* Slide animations */
@keyframes slideDown {
  0% { height: 0; opacity: 0; }
  100% { height: var(--radix-accordion-content-height); opacity: 1; }
}

@keyframes slideUp {
  0% { height: var(--radix-accordion-content-height); opacity: 1; }
  100% { height: 0; opacity: 0; }
}

/* Panel slide animations */
@keyframes panelSlideRightOut {
  0% { transform: translateX(100%); opacity: 0; }
  100% { transform: translate-x-0; opacity: 1; }
}

/* Overlay animations */
@keyframes overlayContentShow {
  0% { opacity: 0; transform: translate(0%, -2%) scale(1); }
  100% { opacity: 1; transform: translate(0%, 0%) scale(1); }
}

/* Line loading animation */
@keyframes lineLoading {
  0% { margin-left: -10%; width: 80px; }
  25% { width: 240px; }
  50% { margin-left: 100%; width: 80px; }
  75% { width: 240px; }
  100% { margin-left: -10%; width: 80px; }
}
```

### Animation Classes

```css
.animate-fade-in: fadeIn 300ms both;
.animate-dropdown-content-show: overlayContentShow 100ms cubic-bezier(0.16, 1, 0.3, 1);
.animate-overlay-show: overlayContentShow 300ms cubic-bezier(0.16, 1, 0.3, 1);
.animate-slide-down: slideDown 300ms cubic-bezier(0.87, 0, 0.13, 1);
.animate-slide-up: slideUp 300ms cubic-bezier(0.87, 0, 0.13, 1);
.animate-panel-slide-right-out: panelSlideRightOut 200ms cubic-bezier(0.87, 0, 0.13, 1);
.animate-line-loading: lineLoading 1.8s infinite;
```

---

## 8. CSS Variables Reference

### Complete Dark Theme Variables

```css
[data-theme='dark'], .dark {
  /* Helpers */
  --helpers-os-appearance: Dark;
  
  /* Code Blocks */
  --code-block-5: 13.8deg 89.7% 69.6%;
  --code-block-4: 276.1deg 67.7% 74.5%;
  --code-block-3: 83.8deg 61.7% 63.1%;
  --code-block-2: 33.2deg 90.3% 75.7%;
  --code-block-1: 170.8deg 43.1% 61.4%;
  
  /* Secondary */
  --secondary-default: 247.8deg 100% 70%;
  --secondary-400: 248.3deg 54.5% 25.9%;
  --secondary-200: 248deg 53.6% 11%;
  
  /* Brand */
  --brand-link: 155deg 100% 38.6%;
  --brand-default: 153.1deg 60.2% 52.7%;
  --brand-600: 154.9deg 59.5% 70%;
  --brand-500: 154.9deg 100% 19.2%;
  --brand-400: 155.5deg 100% 9.6%;
  --brand-300: 155.1deg 100% 8%;
  --brand-200: 162deg 100% 2%;
  
  /* Warning */
  --warning-default: 38.9deg 100% 42.9%;
  --warning-600: 38.9deg 100% 42.9%;
  --warning-500: 34.8deg 90.9% 21.6%;
  --warning-400: 33.2deg 100% 14.5%;
  --warning-300: 32.3deg 100% 10.2%;
  --warning-200: 36.6deg 100% 8%;
  
  /* Destructive */
  --destructive-default: 10.2deg 77.9% 53.9%;
  --destructive-600: 9.7deg 85.2% 62.9%;
  --destructive-500: 7.9deg 71.6% 29%;
  --destructive-400: 6.7deg 60% 20.6%;
  --destructive-300: 7.5deg 51.3% 15.3%;
  --destructive-200: 10.9deg 23.4% 9.2%;
  
  /* Borders */
  --border-stronger: 0deg 0% 27.1%;
  --border-strong: 0deg 0% 21.2%;
  --border-alternative: 0deg 0% 26.7%;
  --border-control: 0deg 0% 22.4%;
  --border-overlay: 0deg 0% 20%;
  --border-secondary: 0deg 0% 14.1%;
  --border-muted: 0deg 0% 14.1%;
  --border-default: 0deg 0% 18%;
  
  /* Backgrounds */
  --background-dash-canvas: 0deg 0% 7.1%;
  --background-dash-sidebar: 0deg 0% 9%;
  --background-dialog-default: 0deg 0% 7.1%;
  --background-muted: 0deg 0% 14.1%;
  --background-overlay-hover: 0deg 0% 18%;
  --background-overlay-default: 0deg 0% 14.1%;
  --background-surface-400: 0deg 0% 16.1%;
  --background-surface-300: 0deg 0% 16.1%;
  --background-surface-200: 0deg 0% 12.9%;
  --background-surface-100: 0deg 0% 12.2%;
  --background-surface-75: 0deg 0% 9%;
  --background-control: 0deg 0% 14.1%;
  --background-selection: 0deg 0% 19.2%;
  --background-alternative-default: 0deg 0% 5.9%;
  --background-default: 0deg 0% 7.1%;
  --background-200: 0deg 0% 9%;
  
  /* Foreground */
  --foreground-contrast: 0deg 0% 8.6%;
  --foreground-muted: 0deg 0% 30.2%;
  --foreground-lighter: 0deg 0% 53.7%;
  --foreground-light: 0deg 0% 70.6%;
  --foreground-default: 0deg 0% 98%;
}
```

### Complete Light Theme Variables

```css
[data-theme='light'], .light {
  /* Helpers */
  --helpers-os-appearance: Light;
  
  /* Code Blocks */
  --code-block-5: 14deg 80.4% 58%;
  --code-block-4: 276.3deg 60% 52.9%;
  --code-block-3: 83.8deg 61.6% 48%;
  --code-block-2: 33.1deg 80% 52.9%;
  --code-block-1: 170.6deg 43.2% 51%;
  
  /* Secondary */
  --secondary-default: 247.8deg 100% 70%;
  --secondary-400: 248.3deg 54.5% 25.9%;
  --secondary-200: 248deg 53.6% 11%;
  
  /* Brand */
  --brand-link: 153.4deg 100% 36.7%;
  --brand-default: 152.9deg 60% 52.9%;
  --brand-600: 156.5deg 86.5% 26.1%;
  --brand-500: 155.3deg 78.4% 40%;
  --brand-400: 151.3deg 66.9% 66.9%;
  --brand-300: 147.5deg 72% 80.4%;
  --brand-200: 147.6deg 72.5% 90%;
  
  /* Warning */
  --warning-default: 30.3deg 80.3% 47.8%;
  --warning-600: 30.3deg 80.3% 47.8%;
  --warning-500: 36.3deg 85.7% 67.1%;
  --warning-400: 41.9deg 100% 81.8%;
  --warning-300: 44.3deg 100% 91.8%;
  --warning-200: 40deg 81.8% 97.8%;
  
  /* Destructive */
  --destructive-default: 10.2deg 77.9% 53.9%;
  --destructive-600: 9.9deg 82% 43.5%;
  --destructive-500: 10.4deg 77.1% 79.4%;
  --destructive-400: 7.1deg 91.3% 91%;
  --destructive-300: 7.1deg 100% 96.7%;
  --destructive-200: 0deg 100% 99.4%;
  
  /* Borders */
  --border-stronger: 0deg 0% 56.1%;
  --border-strong: 0deg 0% 83.1%;
  --border-default: 0deg 0% 87.5%;
  
  /* Backgrounds */
  --background-dialog-default: 0deg 0% 100%;
  --background-muted: 0deg 0% 96.9%;
  --background-surface-400: 0deg 0% 89.8%;
  --background-surface-300: 0deg 0% 92.9%;
  --background-surface-200: 0deg 0% 95.3%;
  --background-surface-100: 0deg 0% 98.8%;
  --background-surface-75: 0deg 0% 100%;
  --background-alternative-default: 0deg 0% 99.2%;
  
  /* Foreground */
  --foreground-contrast: 0deg 0% 98.4%;
  --foreground-muted: 0deg 0% 69.8%;
  --foreground-lighter: 0deg 0% 43.9%;
  --foreground-light: 0deg 0% 32.2%;
}
```

---

## 9. Implementation Guide

### Step 1: Update globals.css

Add Supabase color variables to your `:root`:

```css
:root {
  /* Supabase Brand Colors */
  --supabase-brand-default: hsl(153.1deg 60.2% 52.7%);
  --supabase-brand-600: hsl(154.9deg 59.5% 70%);
  --supabase-brand-500: hsl(154.9deg 100% 19.2%);
  
  /* Apply as primary if desired */
  --color-primary: var(--supabase-brand-default);
}
```

### Step 2: Update tailwind.config.js

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        // Supabase semantic colors
        'foreground': {
          DEFAULT: 'hsl(var(--foreground-default) / <alpha-value>)',
          light: 'hsl(var(--foreground-light) / <alpha-value>)',
          lighter: 'hsl(var(--foreground-lighter) / <alpha-value>)',
          muted: 'hsl(var(--foreground-muted) / <alpha-value>)',
        },
        'background': {
          DEFAULT: 'hsl(var(--background-default) / <alpha-value>)',
          surface: {
            75: 'hsl(var(--background-surface-75) / <alpha-value>)',
            100: 'hsl(var(--background-surface-100) / <alpha-value>)',
            200: 'hsl(var(--background-surface-200) / <alpha-value>)',
            300: 'hsl(var(--background-surface-300) / <alpha-value>)',
          },
        },
        'brand': {
          DEFAULT: 'hsl(var(--brand-default) / <alpha-value>)',
          200: 'hsl(var(--brand-200) / <alpha-value>)',
          300: 'hsl(var(--brand-300) / <alpha-value>)',
          400: 'hsl(var(--brand-400) / <alpha-value>)',
          500: 'hsl(var(--brand-500) / <alpha-value>)',
          600: 'hsl(var(--brand-600) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Circular', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['Source Code Pro', 'Office Code Pro', 'Menlo', 'monospace'],
      },
      borderRadius: {
        'panel': '6px',
      },
    },
  },
};
```

### Step 3: Font Installation

Install Inter font:

```bash
npm install @fontsource/inter
```

In your layout:

```typescript
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
```

Or use Next.js font optimization:

```typescript
import { Inter } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});
```

### Step 4: Theme Toggle Support

Use `next-themes` for theme switching:

```typescript
import { ThemeProvider } from 'next-themes';

export function Providers({ children }) {
  return (
    <ThemeProvider 
      attribute="data-theme" 
      defaultTheme="dark"
      themes={['light', 'dark']}
    >
      {children}
    </ThemeProvider>
  );
}
```

---

## Quick Reference Card

| Category | Key Values |
|----------|-----------|
| **Primary Brand** | `hsl(153, 60%, 53%)` - #3ECF8E |
| **Background Dark** | `hsl(0, 0%, 7%)` - #121212 |
| **Background Light** | `hsl(0, 0%, 99%)` - #FCFCFC |
| **Font Family** | Inter, Circular, system-ui |
| **Base Font Size** | 14px (text-sm) |
| **Border Radius** | 4-6px (cards), full (badges) |
| **Transition Speed** | 150ms |
| **Easing** | cubic-bezier(0.4, 0, 0.2, 1) |

---

*Extracted from Supabase's official UI package on GitHub.*
*Last updated: December 2024*
