# META SIDE NAVIGATION - Design Specification

## 🎯 Purpose
Forensic overlay navigation for META-related pages (Architecture, Registry, Governance, Lineage)

---

## 📐 Layout Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     APP SHELL HEADER                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────┐                                               │
│  │ META │ ← Floating Trigger Button (Left: 24px)       │
│  │ Nav  │                                               │
│  └──────┘                                               │
│                                                          │
│              PAGE CONTENT                                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### When Activated:

```
┌──────────────────────┬──────────────────────────────────┐
│   OVERLAY PANEL      │    PAGE CONTENT (Blurred)        │
│   Width: 420px       │                                   │
│   Border: 2px Green  │    Semi-transparent backdrop      │
│                      │                                   │
│  ┌────────────────┐  │                                   │
│  │ META_01        │  │                                   │
│  │ Architecture   │  │                                   │
│  │ [DEPLOYED]     │  │                                   │
│  └────────────────┘  │                                   │
│                      │                                   │
│  ┌────────────────┐  │                                   │
│  │ META_02 ●      │  │ (Active - Green indicator)       │
│  │ Registry       │  │                                   │
│  │ [ACTIVE]       │  │                                   │
│  └────────────────┘  │                                   │
│                      │                                   │
│  ┌────────────────┐  │                                   │
│  │ META_03        │  │                                   │
│  │ Governance     │  │                                   │
│  │ [BETA]         │  │                                   │
│  └────────────────┘  │                                   │
│                      │                                   │
└──────────────────────┴──────────────────────────────────┘
```

---

## 🎨 Forensic Design Elements

### 1. **Trigger Button**
- **Position:** `fixed left-6 top-24`
- **Background:** `#0A0A0A` (Matter)
- **Border:** `1px #1F1F1F` → Hover: `#28E7A2`
- **Icon:** Menu (lucide-react)
- **Pulse Indicator:** Animated green dot
- **Corner Crosshairs:** Top-left, bottom-right

### 2. **Overlay Panel**
- **Width:** 420px
- **Background:** `#000000` (Void Black)
- **Right Border:** `2px #28E7A2` (Terminal Edge)
- **HUD Grid:** 20px × 20px at 3% opacity
- **Scanlines:** Horizontal repeating pattern
- **Scanning Animation:** Vertical sweep every 8 seconds
- **Corner Crosshairs:** All 4 corners (6px × 6px)

### 3. **Navigation Items**

#### **Default State:**
```tsx
Background: #0A0A0A
Border: 1px #1F1F1F
Text: #CCC (label), #666 (subtitle)
Status Dot: Based on page status
```

#### **Hover State:**
```tsx
Border-Top: #28E7A2
Background: #0F0F0F
Text: White (label)
Arrow: Translate right 4px
```

#### **Active State:**
```tsx
Border-Left: 2px #28E7A2
Background: #0D1510 (green tint)
Top Inner Glow: Green gradient
Text: White (label), #28E7A2 (code)
```

#### **Locked State:**
```tsx
Opacity: 40%
Cursor: not-allowed
Badge: "LOCKED" in #555
```

### 4. **Status Indicators**

| Status | Color | Animation |
|--------|-------|-----------|
| ACTIVE | `#28E7A2` | Pulse |
| DEPLOYED | `#28E7A2` | Pulse |
| BETA | `#FFD600` | None |
| LOCKED | `#666` | None |

### 5. **Typography**

```tsx
// Header
Title: font-mono text-lg tracking-wide

// Navigation Items
Code: font-mono text-[11px] tracking-[0.15em] uppercase
Title: font-mono text-sm tracking-wide
Subtitle: font-mono text-[11px]

// Metadata Footer
Labels: font-mono text-[8px] tracking-wider uppercase
```

---

## ⚙️ Interactions

### **Open Navigation:**
- Click trigger button
- Body scroll locked
- Backdrop appears with blur

### **Close Navigation:**
- Click backdrop
- Press ESC key
- Click close button (X)
- Navigate to new page

### **Navigation:**
- Click unlocked item → Navigate + Close
- Locked items are disabled
- Active page highlighted

---

## 📦 Components Created

### 1. `/components/MetaSideNav.tsx`
Main overlay navigation panel with:
- HUD backgrounds
- Scanning animations
- Navigation items
- Status indicators
- Keyboard controls (ESC)

### 2. `/components/MetaNavTrigger.tsx`
Floating trigger button with:
- Forensic glass styling
- Pulse indicator
- Corner crosshairs
- Hover effects

---

## 🔗 Integration

```tsx
import { MetaSideNav } from '../components/MetaSideNav';
import { MetaNavTrigger } from '../components/MetaNavTrigger';
import { useState } from 'react';

// In component:
const [isNavOpen, setIsNavOpen] = useState(false);

// In JSX:
<MetaNavTrigger onClick={() => setIsNavOpen(true)} />
<MetaSideNav isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
```

---

## 🎯 Pages Configured

1. **META_01** - `/metadata-architecture` (Forensic Architecture)
2. **META_02** - `/metadata` (Registry // God View)
3. **META_03** - `/governance` (Governance Dashboard) [BETA]
4. **META_04** - `/lineage` (Lineage Graph) [LOCKED]

---

## ✅ Canon Compliance

- ✅ **1px Borders** - All structural separation
- ✅ **Micro-Glows** - Top inner border on active state
- ✅ **HUD Metadata** - Coordinates, classification labels
- ✅ **Corner Crosshairs** - All panels
- ✅ **Scanlines** - Background texture
- ✅ **Monospace Typography** - All text
- ✅ **Status Indicators** - Pulsing dots for active states
- ✅ **Terminal Language** - "Mission Select", "Canon Access"
- ✅ **Green Accent Discipline** - <5% of screen
- ✅ **Sharp Corners** - No border-radius (except 1px for status dots)

---

## 🚀 Future Enhancements

- Add page access permissions based on user role
- Add "Recent Pages" section
- Add search/filter for pages
- Add keyboard shortcuts (1-4 for quick navigation)
- Add breadcrumb trail showing navigation history
