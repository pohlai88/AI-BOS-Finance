# NEXUSCANON REPOSITORY STRUCTURE

Generated: December 9, 2025

```
NEXUSCANON/
│
├── 📄 ROOT FILES (27 files)
│   ├── index.html                              # Entry point
│   ├── App.tsx                                 # Main React app
│   ├── README.md                               # Project documentation
│   │
│   ├── 🎨 LOGO COMPONENTS (2)
│   │   ├── NexusCanonLogo.tsx                  # Animated crystalline logo
│   │   └── NexusCanonLogoCircular.tsx          # Circular variant
│   │
│   └── 📝 DOCUMENTATION POLLUTION (23 markdown files - SHOULD BE MOVED)
│       ├── ANSWER_8PX_QUESTION.md
│       ├── Attributions.md
│       ├── BACKUP_LoginPage_EMERGENCY.tsx      # ⚠️ Backup file in root
│       ├── BUILD_READY.md
│       ├── CHANGELOG.md
│       ├── CODEBASE_AUDIT_REPORT.md
│       ├── COMPLETE_CODEBASE_AUDIT.md          # ✅ Latest comprehensive audit
│       ├── DEVELOPER_HANDOFF.md
│       ├── ENTERPRISE_DESIGN_AUDIT.md
│       ├── ENTITY_GOVERNANCE_COMPLETE.md
│       ├── ENTITY_GOVERNANCE_IMPLEMENTATION_PLAN.md
│       ├── FIGMA_AI_FAILURE_ANALYSIS.md
│       ├── FONT_SIZE_VIOLATION_AUDIT.md
│       ├── FRONTED_PRD_TEMPLATE_SERIES.md
│       ├── FRONTEND_COMPLETION_PACK_TEMPLATE_SERIES.md
│       ├── FRONTEND_DOCUMENTATION.md
│       ├── KEYBOARD_SHORTCUTS_REFERENCE.md
│       ├── META_SERIES_COMPLETE_2025.md
│       ├── META_SERIES_FIX.md
│       ├── NEXUSCANON_WORLD_CLASS_COMPLETE.md
│       ├── OPTIMIZATION_COMPLETE.md
│       ├── QUICK_WINS_IMPLEMENTATION.md
│       ├── SYS_04_LOCKED.md
│       ├── SYS_SERIES_STATUS.md
│       └── UPGRADE_SUMMARY.md
│
├── 📁 components/ (100+ files)
│   │
│   ├── 📄 LOOSE COMPONENTS (13 files - SHOULD BE ORGANIZED)
│   │   ├── AgriMetadataLifecycle.tsx           # ✅ Sophisticated flower viz
│   │   ├── BYOFOnboarding.tsx
│   │   ├── Breadcrumbs.tsx
│   │   ├── DashboardView.tsx
│   │   ├── ForensicClassificationStrip.tsx
│   │   ├── Header.tsx
│   │   ├── IndustrialCanonTable.tsx            # ✅ Canon table component
│   │   ├── LandingPage.tsx                     # 🎯 CURRENT REFACTOR TARGET
│   │   ├── LemonLifecycle.tsx
│   │   ├── MetaNavTrigger.tsx
│   │   ├── MetaPageHeader.tsx                  # ✅ Good page header
│   │   ├── MetaSideNav.tsx
│   │   ├── PageAuditTrail.tsx
│   │   └── SchematicBoat.tsx
│   │
│   ├── 📁 auth/ (4 files)
│   │   ├── BeamLine.tsx                        # ✅ EXCELLENT - Login viz
│   │   ├── IntegratedEngine.tsx                # ✅ EXCELLENT - Auth engine
│   │   ├── MechanicalOrchestra.tsx             # ✅ EXCELLENT - Auth animation
│   │   └── index.ts
│   │
│   ├── 📁 dashboard/ (3 files)
│   │   ├── ActivityFeed.tsx                    # ✅ Good live feed
│   │   ├── DashboardHeader.tsx
│   │   └── StatusGrid.tsx                      # ✅ Good metrics grid
│   │
│   ├── 📁 figma/ (1 file)
│   │   └── ImageWithFallback.tsx               # 🔒 PROTECTED - Do not modify
│   │
│   ├── 📁 health/ (4 files)
│   │   ├── HealthCoreGauge.tsx                 # ✅ Good gauge component
│   │   ├── HealthDeepDivePanel.tsx
│   │   ├── HealthModuleCard.tsx
│   │   └── HealthRadar.tsx                     # ✅ Good radar chart
│   │
│   ├── 📁 icons/ (1 file)
│   │   └── LynxIcon.tsx                        # ✅ Lynx AI icon
│   │
│   ├── 📁 landing/ (12 files)
│   │   ├── CanonConnection.tsx
│   │   ├── CanonMapping.tsx
│   │   ├── CommandPalette.tsx
│   │   ├── FinalCTA.tsx
│   │   ├── ForensicHero.tsx
│   │   ├── GovernanceEngine.ts
│   │   ├── Header.tsx
│   │   ├── HeroSection.tsx
│   │   ├── HeroSectionRadar.tsx
│   │   ├── LineageBeamCard.tsx
│   │   ├── LivingLens.tsx
│   │   ├── ReasoningDemo.tsx
│   │   ├── RegistryGrid.tsx
│   │   └── StabilitySimulation.tsx
│   │
│   ├── 📁 lynx/ (1 file)
│   │   └── LynxChatMessage.tsx                 # ✅ Good chat message component
│   │
│   ├── 📁 metadata/ (5 files + 1 subfolder)
│   │   ├── CanonDetailPanel.tsx                # ✅ Canon record details
│   │   ├── DetailDrawer.tsx                    # ✅ Side drawer component
│   │   ├── FlexibleFilterBar.tsx               # ✅ Schema-driven filters
│   │   ├── SuperTable.tsx                      # ✅ EXCELLENT - TanStack Table
│   │   └── pages/
│   │       └── MetadataGodView.tsx             # ✅ GOOD - Schema-first table
│   │
│   ├── 📁 motion/ (3 files)
│   │   ├── FadeIn.tsx
│   │   ├── SlideUp.tsx
│   │   └── index.ts
│   │
│   ├── 📁 nexus/ (5 files) ⚠️ COMPONENT LIBRARY - UNDER-USED
│   │   ├── CardSection.tsx                     # ❌ Not used anywhere
│   │   ├── NexusBadge.tsx                      # ⚠️ Used in 1 file only
│   │   ├── NexusButton.tsx                     # ⚠️ Used in 2 files only
│   │   ├── NexusCard.tsx                       # ⚠️ Used in 3 files only (23% usage)
│   │   └── NexusInput.tsx                      # ⚠️ Barely used
│   │
│   ├── 📁 shell/ (11 files)
│   │   ├── AppFooter.tsx
│   │   ├── AppShell.tsx                        # ✅ Main app shell
│   │   ├── Footer.tsx
│   │   ├── MetaAppShell.tsx                    # ✅ META-series shell
│   │   ├── MetaCommandPalette.tsx              # ⚠️ Keyboard shortcuts
│   │   ├── MetaErrorBoundary.tsx               # ✅ Error boundary
│   │   ├── MetaKeyboardShortcuts.tsx
│   │   ├── MetaPageSkeleton.tsx
│   │   ├── MiniSidebar.tsx
│   │   ├── NavMiniSidebar.tsx
│   │   ├── PageContainer.tsx
│   │   └── RegAppShell.tsx                     # ✅ REG-series shell
│   │
│   ├── 📁 sys/ (2 files)
│   │   ├── MissionControl.tsx                  # ✅ SYS dashboard component
│   │   └── SetupCompanion.tsx                  # ✅ Setup wizard
│   │
│   └── 📁 ui/ (52 files) - SHADCN COMPONENTS
│       ├── accordion.tsx
│       ├── alert-dialog.tsx
│       ├── alert.tsx
│       ├── aspect-ratio.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── breadcrumb.tsx
│       ├── button.tsx
│       ├── calendar.tsx
│       ├── card.tsx
│       ├── carousel.tsx
│       ├── chart.tsx
│       ├── checkbox.tsx
│       ├── collapsible.tsx
│       ├── command.tsx
│       ├── context-menu.tsx
│       ├── dialog.tsx
│       ├── drawer.tsx
│       ├── dropdown-menu.tsx
│       ├── form.tsx
│       ├── hover-card.tsx
│       ├── input-otp.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── menubar.tsx
│       ├── navigation-menu.tsx
│       ├── pagination.tsx
│       ├── popover.tsx
│       ├── progress.tsx
│       ├── radio-group.tsx
│       ├── resizable.tsx
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── sidebar.tsx
│       ├── skeleton.tsx
│       ├── slider.tsx
│       ├── sonner.tsx
│       ├── switch.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       ├── toggle-group.tsx
│       ├── toggle.tsx
│       ├── tooltip.tsx
│       ├── use-mobile.ts
│       └── utils.ts
│
├── 📁 constants/ (1 file)
│   └── design-tokens.ts                        # ✅ Design system tokens
│
├── 📁 context/ (1 file)
│   └── SysConfigContext.tsx                    # ✅ System configuration state
│
├── 📁 data/ (7 files) - MOCK DATA
│   ├── industrialCanon.ts                      # ✅ Canon hierarchy data
│   ├── mockCanonMatrix.ts                      # Mock Canon Matrix records
│   ├── mockEntityGovernance.ts                 # Mock entity governance
│   ├── mockHealthScan.ts                       # Mock health scan data
│   ├── mockLynxData.ts                         # Mock Lynx chat history
│   ├── mockMetadata.ts                         # Mock metadata registry
│   └── systemMock.ts                           # Mock system data
│
├── 📁 docs/ (25+ files)
│   │
│   ├── 📁 01-architecture/ (5 files)
│   │   ├── BUILD_READY.md
│   │   ├── META_NAVIGATION_AUDIT_SYSTEM.md
│   │   ├── META_NAV_DESIGN.md
│   │   ├── PAGE_CODING_STANDARD.md
│   │   └── SCHEMA_FIRST_ARCHITECTURE.md        # ✅ CRITICAL - Schema-first rules
│   │
│   ├── 📁 01-foundations/ (3 files)
│   │   ├── brand-identity.md
│   │   ├── design-system.md
│   │   └── guidelines.md
│   │
│   ├── 📁 02-architecture/ (3 files)
│   │   ├── coding-standards.md
│   │   ├── schema-architecture.md
│   │   └── technical-register.md               # ✅ Operational codes (META_01-08, SYS_01-04)
│   │
│   ├── 📁 02-design-system/ (3 files)
│   │   ├── DESIGN_SYSTEM.md
│   │   ├── GUIDELINES.md                       # ⚠️ Duplicate of root Guidelines.md
│   │   └── NEXUSCANON_BRAND_GUIDE.md
│   │
│   ├── 📁 03-features/ (3 files)
│   │   ├── meta-series-completion.md
│   │   ├── reg-series-completion.md
│   │   └── sys-series-completion.md
│   │
│   ├── 📁 03-guides/ (2 files)
│   │   ├── KEYBOARD_SHORTCUTS_REFERENCE.md
│   │   └── QUICK_START_GUIDE.md
│   │
│   ├── 📁 04-guides/ (3 files)
│   │   ├── developer-handoff.md
│   │   ├── quick-start.md
│   │   └── shortcuts.md
│   │
│   ├── 📁 05-archive/ (1 file)
│   │   └── template-series.md
│   │
│   └── 📄 LOOSE DOCS (4 files)
│       ├── AUDIT_TRAIL_EXAMPLE.md
│       ├── META_NAVIGATION_AUDIT_SYSTEM.md     # ⚠️ Duplicate
│       ├── META_NAV_DESIGN.md                  # ⚠️ Duplicate
│       └── README.md                           # ✅ Docs index
│
├── 📁 guidelines/ (1 file)
│   └── Guidelines.md                           # ✅ MASTER DESIGN SYSTEM RULES
│
├── 📁 imports/ (6 files) - FIGMA ASSETS
│   ├── Leaf1.tsx                               # SVG leaf component
│   ├── Leaf5.tsx                               # SVG leaf component
│   ├── Leaf8.tsx                               # SVG leaf component
│   ├── svg-3axgu4dlwe.ts                       # SVG paths
│   ├── svg-ggtec43sna.ts                       # SVG paths
│   └── svg-rrvhu5n8ah.ts                       # SVG paths
│
├── 📁 lib/ (3 files)
│   ├── prism-helpers.ts                        # PRISM design token helpers
│   ├── stateManager.ts                         # State management utilities
│   └── utils.ts                                # General utilities
│
├── 📁 pages/ (17 files)
│   │
│   ├── 🔐 AUTH PAGES (3 files)
│   │   ├── LoginPage.tsx                       # ✅ A+ QUALITY - Cinematic
│   │   ├── SignUpPage.tsx
│   │   └── ResetPasswordPage.tsx
│   │
│   ├── 🎛️ SYS SERIES (4 files) - System Configuration
│   │   ├── SysBootloaderPage.tsx               # ✅ B+ - Setup Companion (SYS_01)
│   │   ├── SysOrganizationPage.tsx             # Organization settings (SYS_02)
│   │   ├── SysAccessPage.tsx                   # Access control (SYS_03)
│   │   └── SysProfilePage.tsx                  # User profile (SYS_04)
│   │
│   ├── 📊 META SERIES (7 files) - Metadata Governance
│   │   ├── MetadataArchitecturePage.tsx        # ⚠️ D+ - Schema Governance (META_01)
│   │   ├── (MetadataGodView in /components)    # ✅ B - Registry God View (META_02)
│   │   ├── EntityMasterPage.tsx                # Entity Master (META_03)
│   │   ├── ThePrismPage.tsx                    # The Prism (META_04)
│   │   ├── MetaCanonMatrixPage.tsx             # ⚠️ C+ - Canon Matrix (META_05)
│   │   ├── MetaHealthScanPage.tsx              # ⚠️ C - Health Scan (META_06)
│   │   ├── MetaLynxCodexPage.tsx               # ✅ B - Lynx Codex (META_07)
│   │   └── MetaRiskRadarPage.tsx               # Risk Radar (META_08)
│   │
│   ├── 🏢 CORE SERIES (1 file)
│   │   └── CoreCoaPage.tsx                     # ✅ B - Core COA (CORE_01)
│   │
│   ├── 📋 OTHER PAGES (2 files)
│   │   ├── DashboardPage.tsx                   # ⚠️ C - Main dashboard
│   │   └── ImplementationPlaybookPage.tsx      # Implementation guide
│   │
│   └── 📁 STRUCTURE NOTES
│       ├── Total: 17 page files
│       ├── Grade A: 1 (LoginPage)
│       ├── Grade B: 4 (SysBootloader, MetaLynx, CoreCoa, MetadataGodView)
│       ├── Grade C: 3 (Dashboard, MetaHealth, MetaCanon)
│       └── Grade D: 1 (MetadataArchitecture)
│
├── 📁 providers/ (1 file)
│   └── AppProviders.tsx                        # React context providers wrapper
│
├── 📁 styles/ (1 file)
│   └── globals.css                             # ✅ PRISM design tokens + Tailwind v4
│
└── 📁 types/ (3 files)
    ├── entity-governance.ts                    # Entity governance types
    ├── metadata.ts                             # ✅ Metadata record types
    └── system.ts                               # System types

```

---

## 📊 REPOSITORY STATISTICS

### File Counts by Category

| Category | Count | Notes |
|----------|-------|-------|
| **Total Files** | 200+ | Estimated across all directories |
| **Root Markdown Files** | 23 | ⚠️ SHOULD BE MOVED to /docs/archive |
| **Components** | 100+ | Including loose + organized |
| **Pages** | 17 | AUTH (3) + SYS (4) + META (7) + CORE (1) + Other (2) |
| **Shadcn UI Components** | 52 | Complete UI component library |
| **Mock Data Files** | 7 | All hardcoded data |
| **Documentation Files** | 25+ | Scattered across root + /docs |
| **Types** | 3 | TypeScript interfaces |
| **Context Providers** | 1 | System configuration only |
| **Utilities** | 3 | lib/ directory |

### Component Organization Score: D

- ✅ **Well Organized:** auth/, dashboard/, health/, shell/, sys/, ui/
- ⚠️ **Partially Organized:** landing/, metadata/, motion/
- ❌ **Not Organized:** 13 loose components in root /components

### Design System Compliance: 49% (FAILING)

- ✅ LoginPage: 75% compliant (A+)
- ✅ SysBootloader: 60% compliant (B+)
- ⚠️ Most META pages: 30-40% compliant (C-D)
- ❌ Guidelines.md exists but violated constantly

### Code Quality by Directory

| Directory | Grade | Issues |
|-----------|-------|--------|
| `/pages` | C+ | Mixed quality, inconsistent patterns |
| `/components/auth` | A | Excellent, benchmark quality |
| `/components/nexus` | B | Good components, barely used |
| `/components/landing` | C | Needs refactoring |
| `/components/metadata` | B+ | SuperTable excellent, others good |
| `/components/shell` | B | Solid architecture |
| `/components/ui` | A | Shadcn standard quality |
| `/data` | D | All mock/hardcoded |
| `/docs` | D | Too many duplicates, disorganized |

---

## 🚨 CRITICAL ISSUES

### 1. Documentation Pollution (ROOT)
- **23 markdown files** cluttering root directory
- **Multiple duplicates** across root, /docs, /guidelines
- **Outdated files** like BACKUP_LoginPage_EMERGENCY.tsx

### 2. Component Library Underutilization
- **NexusCard usage: 23%** (3 files out of 13 eligible)
- **54 instances** of inline card styles duplicated
- **NexusBadge, NexusButton** barely used

### 3. Inconsistent Page Quality
- **LoginPage (A+)** proves the aesthetic is achievable
- **Most META pages (C-D)** don't match the quality benchmark
- **No consistent patterns** across pages

### 4. Missing Functionality
- **All data is mock** (7 files in /data)
- **No API integration layer**
- **No error handling** (except basic boundary)
- **No state management** beyond single context

---

## 🎯 CLEANUP RECOMMENDATIONS

### Phase 1: Documentation Cleanup (2 hours)
```bash
# Move all root markdown files to /docs/archive
mv /ANSWER_8PX_QUESTION.md /docs/archive/
mv /BUILD_READY.md /docs/archive/
# ... (21 more files)

# Delete duplicates
rm /docs/02-design-system/GUIDELINES.md  # Keep /guidelines/Guidelines.md
rm /docs/META_NAVIGATION_AUDIT_SYSTEM.md # Duplicate

# Delete backup files
rm /BACKUP_LoginPage_EMERGENCY.tsx
```

### Phase 2: Component Organization (4 hours)
```bash
# Create subdirectories for loose components
mkdir /components/common
mkdir /components/visualizations

# Move loose components
mv /components/AgriMetadataLifecycle.tsx /components/visualizations/
mv /components/LemonLifecycle.tsx /components/visualizations/
mv /components/Breadcrumbs.tsx /components/common/
# ... (11 more files)
```

### Phase 3: Component Library Enforcement (24 hours)
- Replace 54 inline card instances with `<NexusCard>`
- Create `<MetricCard>` wrapper component
- Create `<TechnicalMarker>` component
- Document Nexus components

### Phase 4: Visual Compliance (40 hours)
- Fix letter spacing on all pages
- Replace rounded corners with sharp
- Implement 120px/240px rhythm
- Add micro-glows and depth

---

## 📁 RECOMMENDED NEW STRUCTURE

```
NEXUSCANON/
│
├── 📄 CLEAN ROOT (5 files only)
│   ├── index.html
│   ├── App.tsx
│   ├── README.md
│   ├── NexusCanonLogo.tsx
│   └── NexusCanonLogoCircular.tsx
│
├── 📁 components/
│   ├── /auth          ✅ Keep as-is
│   ├── /common        🆕 Breadcrumbs, Header, etc.
│   ├── /dashboard     ✅ Keep as-is
│   ├── /health        ✅ Keep as-is
│   ├── /landing       ⚠️ Refactor contents
│   ├── /metadata      ✅ Keep as-is
│   ├── /nexus         ✅ Keep, enforce usage
│   ├── /shell         ✅ Keep as-is
│   ├── /sys           ✅ Keep as-is
│   ├── /ui            ✅ Keep as-is
│   └── /visualizations 🆕 Lifecycle components
│
├── 📁 docs/
│   ├── /architecture  ✅ Keep
│   ├── /design-system ✅ Keep (no duplicates)
│   ├── /features      ✅ Keep
│   ├── /guides        ✅ Keep
│   └── /archive       🆕 Move 23 root files here
│
└── 📁 guidelines/
    └── Guidelines.md  ✅ Single source of truth
```

---

## ✅ WHAT'S GOOD

1. **File Organization:** Good separation of pages/components/data
2. **Routing Architecture:** Clean shell separation (App/Meta/Reg)
3. **LoginPage:** A+ quality benchmark
4. **Component Library:** Exists, well-designed (just not used)
5. **Design Tokens:** Well-defined in globals.css
6. **Guidelines.md:** Comprehensive design system documented

---

## ❌ WHAT'S BAD

1. **Documentation Pollution:** 23 files in root
2. **Component Duplication:** 54 inline card instances
3. **Inconsistent Quality:** Every page implements UI differently
4. **Mock Data Everywhere:** No real functionality
5. **Guidelines Violations:** 51% non-compliance across pages
6. **No Error Handling:** Zero try/catch, minimal boundaries

---

**What do you want to refactor first?**

1. **Cleanup root directory** (move 23 markdown files)
2. **LandingPage.tsx** (your selected snippet + full file)
3. **Component library enforcement** (replace inline styles)
4. **Visual compliance** (fix letter spacing, corners, spacing)
5. **Something else?**
