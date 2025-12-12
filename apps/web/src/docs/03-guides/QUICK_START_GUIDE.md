# ⚡ NEXUSCANON META-SERIES QUICK START GUIDE

**For:** New developers, stakeholders, users  
**Goal:** Get productive in 5 minutes

---

## 🎯 **WHAT IS THIS?**

NexusCanon is a **forensic financial data governance tool** with 8 META pages for managing enterprise data. Think "Linear meets Palantir" for financial metadata.

---

## 🚀 **TRY IT NOW (5-Minute Tour)**

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

## ⌨️ **ESSENTIAL KEYBOARD SHORTCUTS**

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

## 📍 **THE 8 META PAGES**

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

## 🎨 **DESIGN PHILOSOPHY**

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

## 🛠️ **DEVELOPER QUICK START**

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

### **Add a New Page:**

**1. Create Page Component:**
```tsx
// /pages/MyNewPage.tsx
import { MetaPageHeader } from '../components/MetaPageHeader';
import { PageAuditTrail } from '../components/PageAuditTrail';

export function MyNewPage() {
  return (
    <>
      <div className="px-12 py-[80px]">
        <div className="max-w-[1600px] mx-auto">
          
          <MetaPageHeader
            variant="document"
            code="META_09"
            title="My New Page"
            subtitle="DESCRIPTION"
            description="What this page does..."
          />

          {/* Your content */}
          <div>...</div>

        </div>
      </div>

      <PageAuditTrail data={auditData} />
    </>
  );
}
```

**2. Add Route in App.tsx:**
```tsx
<Route element={<MetaAppShell />}>
  {/* ... existing routes ... */}
  <Route path="/my-new-page" element={<MyNewPage />} />
</Route>
```

**3. Add to MetaSideNav:**
```tsx
// /components/MetaSideNav.tsx
const META_PAGES: MetaPage[] = [
  // ... existing pages ...
  {
    id: '09',
    code: 'META_09',
    title: 'MY NEW PAGE',
    subtitle: 'Brief description',
    route: '/my-new-page',
    status: 'ACTIVE',
    classification: 'OPERATIONAL'
  }
];
```

**Done!** Your page now has:
- ✅ Shared navigation (Cmd+.)
- ✅ Command palette (Cmd+K)
- ✅ Keyboard shortcuts
- ✅ Error boundaries
- ✅ Smooth transitions
- ✅ Recent pages tracking

---

### **Use State Management:**

**URL State (shareable links):**
```tsx
import { useUrlState } from '../lib/stateManager';

const [filters, setFilters] = useUrlState('filters', defaultFilters);
// URL automatically updates: /page?filters={"search":"test"}
```

**User Preferences (persistent):**
```tsx
import { useUserPreferences } from '../lib/stateManager';

const { preferences, updatePreference } = useUserPreferences();
updatePreference('tableDensity', 'compact');
// Persists across sessions
```

**Recent Pages (automatic):**
```tsx
import { useRecentPages } from '../lib/stateManager';

const { recentPages } = useRecentPages();
// Shows in command palette automatically
```

---

## 🎓 **COMMON TASKS**

### **Filter Data with URL State:**
```tsx
const { filters, updateFilter, clearFilters } = useFilterState();

<input 
  value={filters.search}
  onChange={(e) => updateFilter('search', e.target.value)}
/>

{/* URL updates automatically */}
```

---

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

---

### **Add Loading State:**
```tsx
import { MetaPageSkeleton } from '../components/shell/MetaPageSkeleton';

if (isLoading) {
  return <MetaPageSkeleton variant="document" />;
}
```

---

## 📚 **DOCUMENTATION INDEX**

**Read These in Order:**

1. **This Guide** - Quick start (you are here)
2. **NEXUSCANON_WORLD_CLASS_COMPLETE.md** - Overall summary
3. **PHASE_1_DELIVERED.md** - Infrastructure details
4. **PHASE_3_COMPLETE.md** - State management guide
5. **KEYBOARD_SHORTCUTS_REFERENCE.md** - Full shortcut list
6. **META_REFACTOR_COMPLETE.md** - Developer handbook

**Total: 109 pages of documentation**

---

## 🐛 **TROUBLESHOOTING**

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

## 🎯 **NEXT STEPS**

### **For Users:**
1. ✅ Try Cmd+K to search
2. ✅ Try Cmd+1-8 to jump between pages
3. ✅ Try Cmd+/ to see all shortcuts
4. ✅ Check breadcrumbs for navigation
5. ✅ Recent pages show in Cmd+K

### **For Developers:**
1. ✅ Read PHASE_1_DELIVERED.md for architecture
2. ✅ Read PHASE_3_COMPLETE.md for state management
3. ✅ Look at existing pages as examples
4. ✅ Follow Guidelines.md for design system
5. ✅ Use MetaPageHeader for consistency

### **For Stakeholders:**
1. ✅ Read NEXUSCANON_WORLD_CLASS_COMPLETE.md for ROI
2. ✅ Review quantifiable metrics (87% code reduction)
3. ✅ Compare to industry benchmarks (95% parity)
4. ✅ Plan Phase 4 (mobile, WCAG) if needed

---

## 💡 **PRO TIPS**

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

## 🎉 **WELCOME TO NEXUSCANON!**

You're now ready to use the Meta-series like a pro.

**Remember:**
- **Cmd+K** for anything
- **Cmd+/** for help
- **Cmd+1-8** for quick jumps
- **Breadcrumbs** show where you are

**Questions?** Check the full documentation (109 pages) or ask your team.

---

**Status:** 🟢 **READY TO GO**  
**Your First Action:** Press **Cmd+K** right now!

---

**Last Updated:** December 8, 2025  
**Version:** META_SHELL_v3.0.0
