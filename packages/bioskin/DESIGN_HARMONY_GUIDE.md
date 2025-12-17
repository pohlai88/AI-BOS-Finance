# Design Harmony Guide
## Using Figma MCP to Improve UI Quality

### Problem Statement

The current AP Workbench demo has these issues:
1. **No Visual Hierarchy** - Everything looks flat, no clear information layers
2. **Poor Spacing Rhythm** - Elements cramped together, no breathing room
3. **Color Disharmony** - Exception cards (red) clash with overall theme
4. **Typography Issues** - No clear reading flow, inconsistent sizes
5. **Lack of Professional Polish** - Feels like a prototype, not production

### Solution: Figma MCP Integration

## Step 1: Extract Design Tokens from Figma

Your Figma file: `w0bI6UKGtkTUwzhMGMhs93`

### What Figma MCP Can Do

```typescript
// Use Figma MCP to extract:
1. Color Palette (with semantic names)
2. Typography Scale (sizes, weights, line heights)
3. Spacing Scale (4/8/12/16/24/32/48/64px)
4. Border Radius Values
5. Shadow Definitions
6. Component Variants
```

### Example Figma MCP Commands

```bash
# Get design tokens from Figma
figma-mcp get-tokens --file w0bI6UKGtkTUwzhMGMhs93 --node 0:1

# Extract typography system
figma-mcp get-typography --file w0bI6UKGtkTUwzhMGMhs93

# Get color styles
figma-mcp get-colors --file w0bI6UKGtkTUwzhMGMhs93
```

## Step 2: Apply Design Principles

### Visual Hierarchy (Information Layers)

```
Layer 1: Page Title & Primary Actions
  ↓ 32px spacing
Layer 2: Section Headers & Metrics
  ↓ 24px spacing
Layer 3: Content Cards & Tables
  ↓ 16px spacing
Layer 4: Card Content & Details
```

### Typography Scale (8pt Grid)

```typescript
const TYPOGRAPHY_SCALE = {
  display: '32px',    // Page titles
  heading: '24px',    // Section headers
  subheading: '20px', // Card titles
  body: '16px',       // Body text
  caption: '14px',    // Labels
  small: '12px',      // Meta info
};
```

### Spacing Scale (Consistent Rhythm)

```typescript
const SPACING_SCALE = {
  xs: '4px',   // Tight spacing (icon gaps)
  sm: '8px',   // Small spacing (button padding)
  md: '12px',  // Medium spacing (card padding)
  lg: '16px',  // Large spacing (section gaps)
  xl: '24px',  // Extra large (major sections)
  '2xl': '32px', // Section dividers
  '3xl': '48px', // Page sections
};
```

### Color Harmony (Muted Professional Palette)

```typescript
const COLOR_HARMONY = {
  // Base (Dark Mode)
  background: '#0A0A0B',      // Deep black
  surface: '#141416',         // Card background
  surfaceHover: '#1A1A1D',    // Hover state
  
  // Text (High Contrast)
  textPrimary: '#FFFFFF',     // Primary text
  textSecondary: '#A0A0A5',   // Secondary text
  textTertiary: '#707075',    // Tertiary text
  
  // Accent (Professional Blue)
  accentPrimary: '#4A90E2',   // Primary actions
  accentHover: '#5BA3F5',     // Hover state
  
  // Status (Muted, Not Alarming)
  statusSuccess: '#27AE60',   // Success (muted green)
  statusWarning: '#F5A623',   // Warning (muted amber)
  statusDanger: '#E74C3C',    // Danger (muted red)
  statusInfo: '#4A90E2',      // Info (blue)
  
  // Exception Colors (Subtle, Not Screaming)
  exceptionHigh: '#FFF4E6',   // Light amber background
  exceptionHighText: '#B7791F', // Amber text
  exceptionMedium: '#FFF9E6', // Light yellow background
  exceptionMediumText: '#9C6F19', // Yellow text
};
```

## Step 3: Improved Component Patterns

### StatCard (Before vs After)

**Before:**
```tsx
// Cramped, no hierarchy
<div className="grid grid-cols-6 gap-4">
  <StatCard icon={FileText} value={20} label="Open Invoices" />
</div>
```

**After:**
```tsx
// Generous spacing, clear hierarchy
<div className="space-y-8">
  <div className="space-y-2">
    <Txt variant="caption" color="secondary" className="uppercase tracking-wider text-xs">
      Overview
    </Txt>
    <Txt variant="heading" as="h2" className="text-2xl">
      Key Metrics
    </Txt>
  </div>
  <div className="grid grid-cols-6 gap-6">
    <StatCard icon={FileText} value={20} label="Open Invoices" />
  </div>
</div>
```

### Exception Dashboard (Before vs After)

**Before:**
```tsx
// Harsh red, alarming
<div className="bg-red-50 border-red-200">
  <AlertTriangle className="text-red-600" />
  <span>Duplicate Invoice</span>
</div>
```

**After:**
```tsx
// Muted amber, professional
<div className="bg-amber-50/50 border-amber-200/30">
  <AlertTriangle className="text-amber-600" />
  <span className="text-amber-900">Duplicate Invoice</span>
  <span className="text-xs text-amber-700">Requires review</span>
</div>
```

### Section Headers (Before vs After)

**Before:**
```tsx
// No hierarchy, cramped
<h2>Exception Dashboard</h2>
<BioExceptionDashboard ... />
```

**After:**
```tsx
// Clear hierarchy, breathing room
<div className="space-y-6">
  <div className="space-y-2">
    <Txt variant="caption" color="secondary" className="uppercase tracking-wider text-xs">
      Attention Required
    </Txt>
    <div className="flex items-center gap-3">
      <Icon icon={AlertTriangle} className="text-amber-500" />
      <Txt variant="heading" as="h2" className="text-2xl">
        Exception Dashboard
      </Txt>
    </div>
  </div>
  <BioExceptionDashboard ... />
</div>
```

## Step 4: Figma MCP Workflow

### 1. Sync Design Tokens

```bash
# Run Figma sync
pnpm figma:sync

# This generates:
# - src/data/figma/tokens.json
# - src/data/figma/typography.json
# - src/data/figma/colors.json
```

### 2. Update BioThemeContract

```typescript
// packages/bioskin/src/theme/BioThemeContract.ts
// Import Figma tokens
import figmaTokens from '@/data/figma/tokens.json';

export const BIO_THEME_CONTRACT = {
  surfaces: {
    base: { 
      token: '--color-surface-base', 
      fallback: figmaTokens.colors.surface.base, // From Figma
      description: 'Input/form field base' 
    },
    // ...
  },
};
```

### 3. Generate CSS Variables

```bash
# Run token generator
pnpm generate:tokens

# This updates:
# - apps/web/src/app/globals.css
```

### 4. Validate Design Tokens

```bash
# Run validation
pnpm validate:theme

# Checks:
# - All tokens defined in contract exist in CSS
# - All CSS variables match Figma values
# - No hardcoded colors in components
```

## Step 5: Human Reading Principles

### F-Pattern Layout

```
┌─────────────────────────────────┐
│ [Header]                [Action]│ ← Primary scan line
├─────────────────────────────────┤
│ [Metrics] [Metrics] [Metrics]   │ ← Secondary scan line
│                                  │
│ [Section Title]                 │ ← Tertiary scan line
│ [Content Card]                  │
│   - Detail 1                    │
│   - Detail 2                    │
└─────────────────────────────────┘
```

### Information Hierarchy

1. **Primary**: Page title, critical actions (32px, bold, high contrast)
2. **Secondary**: Section headers, key metrics (24px, semibold, medium contrast)
3. **Tertiary**: Card titles, labels (16-20px, medium, medium contrast)
4. **Quaternary**: Body text, details (14-16px, regular, lower contrast)
5. **Meta**: Timestamps, tags (12px, regular, low contrast)

### Breathing Room (Whitespace)

```typescript
const BREATHING_ROOM = {
  // Between major sections
  sectionGap: '48px',
  
  // Between cards in a section
  cardGap: '24px',
  
  // Inside cards
  cardPadding: '24px',
  
  // Between elements in a card
  elementGap: '16px',
  
  // Between lines of text
  lineHeight: '1.5',
};
```

## Step 6: Before & After Comparison

### Before (Current Demo)
```
❌ Flat hierarchy - everything same size
❌ Cramped spacing - 4px gaps everywhere
❌ Harsh colors - bright red exceptions
❌ No rhythm - inconsistent spacing
❌ Poor contrast - hard to scan
```

### After (Improved Demo)
```
✅ Clear hierarchy - 3 distinct levels
✅ Generous spacing - 8/16/24/32px scale
✅ Muted colors - professional amber/blue
✅ Consistent rhythm - 8pt grid
✅ High contrast - easy to scan
```

## Step 7: Implementation Checklist

- [ ] Extract design tokens from Figma using MCP
- [ ] Update BioThemeContract with Figma values
- [ ] Generate CSS variables from contract
- [ ] Apply typography scale (8pt grid)
- [ ] Implement spacing scale (4/8/12/16/24/32px)
- [ ] Replace harsh colors with muted palette
- [ ] Add section headers with hierarchy
- [ ] Increase whitespace between sections
- [ ] Add uppercase labels for context
- [ ] Test with real accounting users

## Step 8: Figma MCP Commands Reference

```bash
# List all available styles
figma-mcp list-styles --file w0bI6UKGtkTUwzhMGMhs93

# Get specific component
figma-mcp get-component --file w0bI6UKGtkTUwzhMGMhs93 --name "StatCard"

# Export all design tokens
figma-mcp export-tokens --file w0bI6UKGtkTUwzhMGMhs93 --output src/data/figma

# Watch for Figma changes
figma-mcp watch --file w0bI6UKGtkTUwzhMGMhs93
```

## Result

With Figma MCP integration:
1. **Design tokens sync automatically** from Figma to code
2. **Consistent visual language** across all components
3. **Professional polish** that meets enterprise standards
4. **Easy to maintain** - update Figma, tokens sync
5. **Type-safe** - TypeScript knows all token names

---

**Next Steps:**
1. Run `figma-mcp get-tokens` to extract design system
2. Update `BioThemeContract.ts` with Figma values
3. Replace current demo with improved version
4. Validate with `pnpm validate:theme`
