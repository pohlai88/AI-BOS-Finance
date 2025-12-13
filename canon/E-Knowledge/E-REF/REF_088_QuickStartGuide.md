> **🟢 [ACTIVE]** — Canon Reference  
> **Canon Code:** REF_088  
> **Plane:** E — Knowledge (Reference)  
> **Related:** CONT_01_CanonIdentity, REF_089_KeyboardShortcuts, REF_082_PageCodingStandards  
> **Source:** Consolidated from `src/docs/04-guides/quick-start.md` and `src/docs/03-guides/QUICK_START_GUIDE.md`  
> **Date:** 2025-01-27

---

# REF_088: NexusCanon META-Series Quick Start Guide

**Purpose:** Get productive in 5 minutes - Quick start guide for new developers, stakeholders, and users  
**Status:** 🟢 Active  
**Last Updated:** 2025-01-27

---

## 🎯 WHAT IS THIS?

NexusCanon is a **forensic financial data governance tool** with 8 META pages for managing enterprise data. Think "Linear meets Palantir" for financial metadata.

---

## 🚀 TRY IT NOW (5-Minute Tour)

### **1. Open Command Palette**
```
Press: Cmd+K (Mac) or Ctrl+K (Windows)
```
- Type "prism" → Hit Enter
- **You're now at The Prism (META_03)**

### **2. Navigate Between Pages**
```
Press: Cmd+2
```
- **You're now at Registry // God View**

### **3. See All Shortcuts**
```
Press: Cmd+/
```
- **Complete keyboard shortcuts list appears**

### **4. Check Recent Pages**
```
Press: Cmd+K again
```
- **Your recent pages show at the top**

### **5. Navigate with Breadcrumbs**
- Look at top of page: **Home > Meta > Page Name**
- Click any breadcrumb to navigate back

---

## ⌨️ ESSENTIAL KEYBOARD SHORTCUTS

| Shortcut | Action |
|----------|--------|
| **Cmd+K** | Open command palette (universal search) |
| **Cmd+1** | Jump to META_01 (Architecture) |
| **Cmd+2** | Jump to META_02 (Registry) |
| **Cmd+3** | Jump to META_03 (The Prism) |
| **Cmd+/** | Show all keyboard shortcuts |
| **Cmd+.** | Toggle Meta navigation |
| **Esc** | Close any overlay/dialog |

*Windows users: Replace `Cmd` with `Ctrl`*

---

## 📍 THE 8 META PAGES

| Code | Page | Purpose | Shortcut |
|------|------|---------|----------|
| **META_01** | Forensic Architecture | System doctrine & philosophy | Cmd+1 |
| **META_02** | Registry // God View | Universal search across datasets | Cmd+2 |
| **META_03** | The Prism | Dataset comparison (Lemon Theory) | Cmd+3 |
| **META_04** | Risk Radar | Compliance & legal exposure | Cmd+4 |
| **META_05** | Canon Matrix | Governance hierarchy | Cmd+5 |
| **META_06** | Health Scan | System telemetry | Cmd+6 |
| **META_07** | Lynx Codex | AI investigator chat | Cmd+7 |
| **META_08** | Implementation Playbook | Getting started guide | Cmd+8 |

---

## 🎨 DESIGN PHILOSOPHY

**"Forensic Aesthetic"** - Inspired by:
- Trading terminals (high-frequency precision)
- Palantir Gotham (forensic analysis)
- Linear (minimal, fast UX)

**Visual Rules:**
- Black background (#000000)
- 1px borders everywhere
- Nexus Green (#28E7A2) for active states only
- Mono-spaced labels (UPPERCASE)
- No soft shadows, no friendly illustrations

---

## 🛠️ DEVELOPER QUICK START

### **Project Structure:**
```
/
├── components/
│   ├── shell/
│   │   ├── MetaAppShell.tsx      ← Persistent layout wrapper
│   │   ├── MetaCommandPalette.tsx ← Cmd+K search
│   │   └── MetaErrorBoundary.tsx  ← Crash recovery
│   ├── MetaPageHeader.tsx         ← Standardized headers
│   └── Breadcrumbs.tsx            ← Navigation trail
├── pages/
│   ├── MetadataArchitecturePage.tsx (META_01)
│   ├── ThePrismPage.tsx             (META_03)
│   └── ... (8 total)
├── lib/
│   └── stateManager.ts            ← State persistence hooks
└── App.tsx                        ← Main routing
```

---

## 🎓 COMMON TASKS

### **Filter Data with URL State:**
```tsx
const { filters, updateFilter, clearFilters } = useFilterState();

<input 
  value={filters.search}
  onChange={(e) => updateFilter('search', e.target.value)}
/>

{/* URL updates automatically */}
```

### **Show Toast Notification:**
```tsx
import { toast } from 'sonner';

// Success
toast.success('Dataset saved successfully');

// Error
toast.error('Failed to load data');

// Info
toast.info('Filters applied');
```

### **Add Loading State:**
```tsx
import { MetaPageSkeleton } from '../components/shell/MetaPageSkeleton';

if (isLoading) {
  return <MetaPageSkeleton variant="document" />;
}
```

---

## 🐛 TROUBLESHOOTING

### **Problem: Keyboard shortcuts not working**
**Solution:** 
- Check if input is focused (shortcuts disabled while typing)
- Press `Esc` to defocus, then try shortcut
- Some browsers override Cmd+K (use Cmd+. instead)

### **Problem: State not persisting**
**Solution:**
- Check localStorage not disabled
- Check browser privacy settings
- Clear cache and try again

### **Problem: Page not showing in command palette**
**Solution:**
- Ensure route added to App.tsx under `<MetaAppShell />`
- Check page title in `getPageTitleFromPath()` in MetaAppShell.tsx
- Visit page once to add to recent pages

---

## 🎯 NEXT STEPS

### **For Users:**
1. ✅ Try Cmd+K to search
2. ✅ Try Cmd+1-8 to jump between pages
3. ✅ Try Cmd+/ to see all shortcuts
4. ✅ Check breadcrumbs for navigation
5. ✅ Recent pages show in Cmd+K

### **For Developers:**
1. ✅ Read REF_081_SchemaFirstArchitecture for architecture
2. ✅ Read REF_082_PageCodingStandards for page standards
3. ✅ Look at existing pages as examples
4. ✅ Follow REF_077_UXGuidelines for design system
5. ✅ Use MetaPageHeader for consistency

---

## 💡 PRO TIPS

### **Tip 1: Master Cmd+K**
Command palette is the fastest way to do anything. Learn to use it.

### **Tip 2: Use Keyboard Shortcuts**
Cmd+1-8 for instant page jumps. 8x faster than clicking.

### **Tip 3: Share Links**
All filters/selections in URL. Share exact view with colleagues.

### **Tip 4: Check Recent Pages**
Cmd+K shows your recent work. No manual bookmarking needed.

### **Tip 5: Read Error Messages**
Error boundary shows helpful recovery actions. Don't just refresh.

---

## 🎉 WELCOME TO NEXUSCANON!

You're now ready to use the Meta-series like a pro.

**Remember:**
- **Cmd+K** for anything
- **Cmd+/** for help
- **Cmd+1-8** for quick jumps
- **Breadcrumbs** show where you are

**Questions?** Check the full documentation or ask your team.

---

**Status:** 🟢 **READY TO GO**  
**Your First Action:** Press **Cmd+K** right now!

---

**Last Updated:** 2025-01-27  
**Version:** META_SHELL_v3.0.0  
**Related Documents:** REF_089_KeyboardShortcuts, REF_082_PageCodingStandards, REF_081_SchemaFirstArchitecture  
**Maintained by:** Design Team
