# src/ Directory Tree Architecture

**Last Updated:** 2025-01-27  
**Purpose:** Complete directory structure of the `src/` directory

---

## 📁 Complete Directory Structure

```
src/
├── components/                    # Shared UI Components
│   ├── auth/                      # Authentication Components
│   │   ├── BeamLine.tsx
│   │   ├── IntegratedEngine.tsx
│   │   ├── MechanicalOrchestra.tsx
│   │   └── index.ts
│   │
│   ├── figma/                     # Figma Integration
│   │   └── ImageWithFallback.tsx
│   │
│   ├── icons/                     # Icon Components
│   │   └── LynxIcon.tsx
│   │
│   ├── lynx/                      # Lynx Chat Components
│   │   └── LynxChatMessage.tsx
│   │
│   ├── magicui/                   # Magic UI Components
│   │   ├── orbiting-circles.tsx
│   │   └── ripple.tsx
│   │
│   ├── motion/                    # Animation Components
│   │   ├── FadeIn.tsx
│   │   ├── SlideUp.tsx
│   │   └── index.ts
│   │
│   ├── nexus/                     # Nexus Design System Components
│   │   ├── __stories__/           # Storybook Stories
│   │   │   ├── NexusButton.stories.tsx
│   │   │   ├── NexusCard.stories.tsx
│   │   │   ├── NexusIcon.stories.tsx
│   │   │   └── NexusInput.stories.tsx
│   │   ├── CardSection.tsx
│   │   ├── Header.tsx
│   │   ├── NexusBadge.tsx
│   │   ├── NexusButton.tsx
│   │   ├── NexusCard.tsx
│   │   ├── NexusIcon.tsx
│   │   └── NexusInput.tsx
│   │
│   ├── shell/                     # Application Shell Components
│   │   ├── hooks/                 # Shell-specific Hooks
│   │   │   └── useRecentPages.ts
│   │   ├── AppFooter.tsx
│   │   ├── AppShell.tsx
│   │   ├── Footer.tsx
│   │   ├── MetaAppShell.tsx
│   │   ├── MetaCommandPalette.tsx
│   │   ├── MetaErrorBoundary.tsx
│   │   ├── MetaKeyboardShortcuts.tsx
│   │   ├── MetaPageSkeleton.tsx
│   │   ├── MiniSidebar.tsx
│   │   ├── NavMiniSidebar.tsx
│   │   ├── PageContainer.tsx
│   │   └── RegAppShell.tsx
│   │
│   ├── sys/                       # System Components
│   │   ├── MissionControl.tsx
│   │   └── SetupCompanion.tsx
│   │
│   ├── ui/                        # Shadcn/UI Primitives
│   │   ├── accordion.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── alert.tsx
│   │   ├── aspect-ratio.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── Btn.tsx                # Custom Button Component
│   │   ├── button.tsx             # Shadcn Button
│   │   ├── calendar.tsx
│   │   ├── card.tsx
│   │   ├── carousel.tsx
│   │   ├── chart.tsx
│   │   ├── checkbox.tsx
│   │   ├── collapsible.tsx
│   │   ├── command.tsx
│   │   ├── context-menu.tsx
│   │   ├── dialog.tsx
│   │   ├── drawer.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── form.tsx
│   │   ├── hover-card.tsx
│   │   ├── input-otp.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── menubar.tsx
│   │   ├── navigation-menu.tsx
│   │   ├── pagination.tsx
│   │   ├── popover.tsx
│   │   ├── progress.tsx
│   │   ├── radio-group.tsx
│   │   ├── resizable.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── sidebar.tsx
│   │   ├── skeleton.tsx
│   │   ├── slider.tsx
│   │   ├── sonner.tsx
│   │   ├── StatusDot.tsx          # Custom Status Component
│   │   ├── Surface.tsx            # Custom Surface Component
│   │   ├── switch.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── toggle-group.tsx
│   │   ├── toggle.tsx
│   │   ├── tooltip.tsx
│   │   ├── Txt.tsx                # Custom Text Component
│   │   ├── use-mobile.ts
│   │   └── utils.ts               # Re-export from @aibos/ui
│   │
│   ├── AgriMetadataLifecycle.tsx
│   ├── Breadcrumbs.tsx
│   ├── BYOFOnboarding.tsx
│   ├── DashboardView.tsx
│   ├── ForensicClassificationStrip.tsx
│   ├── Header.tsx
│   ├── IndustrialCanonTable.tsx
│   ├── LemonLifecycle.tsx
│   ├── MetaNavTrigger.tsx
│   ├── MetaPageHeader.tsx
│   ├── MetaSideNav.tsx
│   ├── PageAuditTrail.tsx
│   └── SchematicBoat.tsx
│
├── hooks/                         # Global React Hooks
│   ├── stateManager.ts            # Unused hooks (can be removed)
│   └── useRouterAdapter.tsx       # Global routing adapter (27+ usages)
│
├── mock-data/                     # Mock Data & Fixtures
│   ├── industrialCanon.ts
│   ├── mockCanonMatrix.ts
│   ├── mockEntityGovernance.ts
│   ├── mockHealthScan.ts
│   ├── mockLynxData.ts
│   ├── mockMetadata.ts
│   └── systemMock.ts
│
├── modules/                       # Business Domain Modules (Organ System)
│   ├── canon/                     # Canon Module
│   │   ├── components/
│   │   │   ├── HealthScoreRing.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── StatusCard.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── dashboard/                 # Dashboard Module
│   │   ├── components/
│   │   │   ├── ActivityFeed.tsx
│   │   │   ├── DashboardHeader.tsx
│   │   │   ├── StatusGrid.tsx
│   │   │   └── index.ts
│   │   ├── views/
│   │   │   └── DashboardPage.tsx
│   │   └── index.ts
│   │
│   ├── health/                    # Health Module
│   │   ├── components/
│   │   │   ├── HealthCoreGauge.tsx
│   │   │   ├── HealthDeepDivePanel.tsx
│   │   │   ├── HealthModuleCard.tsx
│   │   │   ├── HealthRadar.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── inventory/                 # Inventory Module
│   │   ├── INV_01_Dashboard.tsx
│   │   └── index.ts
│   │
│   ├── metadata/                  # Metadata Module (Knowledge Graph)
│   │   ├── components/             # Metadata UI Components
│   │   │   ├── CanonDetailPanel.tsx
│   │   │   ├── ColumnVisibilityMenu.tsx
│   │   │   ├── ColumnVisibilitySelector.tsx
│   │   │   ├── DetailDrawer.tsx
│   │   │   ├── FlexibleFilterBar.tsx
│   │   │   ├── MetadataRequestForm.tsx
│   │   │   ├── SuperTable.tsx
│   │   │   ├── SuperTableBody.tsx
│   │   │   ├── SuperTableHeader.tsx
│   │   │   ├── SuperTableLite.tsx
│   │   │   ├── SuperTablePagination.tsx
│   │   │   └── index.ts
│   │   ├── kernel/                 # Schema Column Generator
│   │   │   ├── SchemaColumnGenerator.tsx
│   │   │   └── index.ts
│   │   ├── types/                  # Metadata Type Definitions
│   │   │   └── metadata.ts
│   │   ├── views/                  # Metadata Page Views
│   │   │   ├── META_01_MetadataArchitecturePage.tsx
│   │   │   ├── META_02_MetadataGodView.tsx
│   │   │   ├── META_03_ThePrismPage.tsx
│   │   │   ├── META_04_MetaRiskRadarPage.tsx
│   │   │   ├── META_05_MetaCanonMatrixPage.tsx
│   │   │   ├── META_06_MetaHealthScanPage.tsx
│   │   │   ├── META_07_MetaLynxCodexPage.tsx
│   │   │   └── META_08_ImplementationPlaybookPage.tsx
│   │   └── index.ts
│   │
│   ├── payment/                    # Payment Module
│   │   ├── components/             # Payment UI Components
│   │   │   ├── ApprovalActions.tsx
│   │   │   ├── AuditSidebar.tsx
│   │   │   ├── FunctionalCard.tsx
│   │   │   ├── PaymentTable.tsx
│   │   │   ├── PaymentTableGenerative.tsx
│   │   │   ├── TreasuryHeader.tsx
│   │   │   └── index.ts
│   │   ├── data/                   # Payment Data & Schemas
│   │   │   ├── paymentSchema.ts
│   │   │   ├── treasuryData.ts
│   │   │   └── index.ts
│   │   ├── hooks/                  # Payment Business Logic Hooks
│   │   │   ├── useBatchApproval.ts
│   │   │   ├── useDocumentValidation.ts
│   │   │   ├── useICValidation.ts
│   │   │   ├── usePaymentApproval.ts
│   │   │   ├── usePaymentGovernance.ts
│   │   │   └── index.ts
│   │   ├── schemas/                # Payment Zod Schemas
│   │   │   └── PaymentZodSchema.ts
│   │   ├── views/                  # Payment Page Views
│   │   │   └── PaymentHubPage.tsx
│   │   ├── PAY_01_PaymentHub.tsx
│   │   ├── TRANSFORMATION_GUIDE.md
│   │   └── index.ts
│   │
│   ├── radar/                      # Radar Module
│   │   ├── components/             # Radar Visualization Components
│   │   │   ├── App.tsx
│   │   │   ├── ControlPanel.tsx
│   │   │   ├── FacePage.tsx
│   │   │   ├── FacePage-1-270.tsx
│   │   │   ├── PointManager.tsx
│   │   │   ├── PresetManager.tsx
│   │   │   ├── RadarDecorations.tsx
│   │   │   ├── RadarDisplay.tsx
│   │   │   ├── TacticalRadar.tsx
│   │   │   ├── ThreatRadar.tsx
│   │   │   ├── svg-9qhzzjljdg.ts
│   │   │   ├── svg-jnt5ym17uj.ts
│   │   │   └── index.ts
│   │   ├── hooks/                  # Radar-specific Hooks
│   │   │   └── useRiskTelemetry.ts
│   │   └── index.ts
│   │
│   ├── registration/               # Registration Module
│   │   ├── views/                  # Registration Page Views
│   │   │   ├── REG_01_LoginPage.tsx
│   │   │   ├── REG_02_SignUpPage.tsx
│   │   │   └── REG_03_ResetPasswordPage.tsx
│   │   └── index.ts
│   │
│   ├── simulation/                 # Simulation Module
│   │   ├── components/
│   │   │   ├── primitives/         # Simulation Primitives
│   │   │   │   ├── BlockPrimitives.tsx
│   │   │   │   ├── ForensicHeader.tsx
│   │   │   │   ├── HexGridBackground.tsx
│   │   │   │   ├── LegacyStack.tsx
│   │   │   │   ├── NexusStack.tsx
│   │   │   │   └── index.ts
│   │   │   ├── StabilitySimulation.tsx
│   │   │   ├── types.ts
│   │   │   ├── useSimulationController.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── system/                     # System Module
│   │   ├── context/                # System Context Providers
│   │   │   └── SysConfigContext.tsx
│   │   ├── types/                  # System Type Definitions
│   │   │   ├── entity-governance.ts
│   │   │   └── system.ts
│   │   ├── views/                  # System Page Views
│   │   │   ├── EntityMasterPage.tsx
│   │   │   ├── SYS_01_SysBootloaderPage.tsx
│   │   │   ├── SYS_02_SysOrganizationPage.tsx
│   │   │   ├── SYS_03_SysAccessPage.tsx
│   │   │   └── SYS_04_SysProfilePage.tsx
│   │   ├── SYS_01_Bootloader.tsx
│   │   └── index.ts
│   │
│   └── index.ts                    # Module Barrel Export
│
├── stories/                        # Storybook Stories
│   ├── assets/                     # Storybook Assets
│   │   ├── accessibility.png
│   │   ├── accessibility.svg
│   │   ├── addon-library.png
│   │   ├── assets.png
│   │   ├── avif-test-image.avif
│   │   ├── context.png
│   │   ├── discord.svg
│   │   ├── docs.png
│   │   ├── figma-plugin.png
│   │   ├── github.svg
│   │   ├── share.png
│   │   ├── styling.png
│   │   ├── testing.png
│   │   ├── theming.png
│   │   ├── tutorials.svg
│   │   └── youtube.svg
│   ├── Button.stories.ts
│   ├── Button.tsx
│   ├── button.css
│   ├── Configure.mdx
│   ├── Header.stories.ts
│   ├── Header.tsx
│   ├── header.css
│   ├── Page.stories.ts
│   ├── Page.tsx
│   └── page.css
│
└── test/                           # Test Files
    ├── example.test.tsx
    └── setup.ts
```

---

## 📊 Directory Statistics

### Top-Level Directories

| Directory | Purpose | File Count (approx) |
|-----------|---------|---------------------|
| `components/` | Shared UI Components | ~150+ files |
| `modules/` | Business Domain Modules | ~60+ files |
| `hooks/` | Global React Hooks | 2 files |
| `mock-data/` | Mock Data & Fixtures | 7 files |
| `stories/` | Storybook Stories | ~20 files |
| `test/` | Test Files | 2 files |

### Module Breakdown

| Module | Components | Views | Hooks | Data | Types |
|--------|-----------|-------|-------|------|-------|
| **metadata** | 11 | 8 | 0 | 0 | 1 |
| **payment** | 6 | 1 | 5 | 2 | 0 |
| **system** | 0 | 5 | 0 | 0 | 2 |
| **radar** | 11 | 0 | 1 | 0 | 0 |
| **simulation** | 6 | 0 | 1 | 0 | 1 |
| **health** | 4 | 0 | 0 | 0 | 0 |
| **dashboard** | 3 | 1 | 0 | 0 | 0 |
| **canon** | 4 | 0 | 0 | 0 | 0 |
| **inventory** | 0 | 1 | 0 | 0 | 0 |
| **registration** | 0 | 3 | 0 | 0 | 0 |

---

## 🏗️ Architecture Patterns

### 1. Module Structure (Organ System)

Each module follows the Canon standard:

```
modules/{domain}/
├── index.ts              # Public exports
├── components/           # Domain-specific UI components
├── views/                # Full page views
├── hooks/                # Business logic hooks
├── data/                 # Mock data / constants
├── schemas/              # Zod validation schemas
└── types/                # TypeScript type definitions
```

### 2. Component Organization

- **`components/ui/`** - Shadcn/UI primitives (Radix wrappers)
- **`components/nexus/`** - Nexus Design System components
- **`components/shell/`** - Application shell (navigation, layout)
- **`components/sys/`** - System-level components
- **`components/auth/`** - Authentication components
- **`components/magicui/`** - Magic UI animations
- **`components/motion/`** - Animation utilities

### 3. Hook Organization

- **`hooks/`** - Global infrastructure hooks (routing, etc.)
- **`modules/{domain}/hooks/`** - Domain-specific business logic
- **`components/{comp}/hooks/`** - Component-specific hooks

### 4. Data Organization

- **`mock-data/`** - Global mock data (shared across modules)
- **`modules/{domain}/data/`** - Module-specific data

---

## 🔍 Key Directories Explained

### `components/shell/`
Application shell components (navigation, command palette, error boundaries, etc.)

### `components/ui/`
Shadcn/UI primitives - Radix UI wrappers and base components

### `components/nexus/`
Nexus Design System components - Custom design system components

### `modules/metadata/kernel/`
Schema Column Generator - Translates metadata schemas to table columns

### `modules/payment/`
Complete payment module with components, hooks, data, and schemas

### `modules/system/`
System configuration module with entity governance and system setup

---

## 📝 Notes

- **Module Pattern:** All modules follow the "Organ System" pattern with consistent structure
- **Hook Co-location:** Hooks are placed next to components that use them
- **Design Tokens:** Components should use tokens from `app/globals.css` (see `HARDCODED_VALUES_REPORT.md`)
- **Kernel Location:** Schema generator moved to `modules/metadata/kernel/` (was `src/kernel/`)
- **Mock Data:** Renamed from `src/data/` to `src/mock-data/` for clarity

---

**Last Updated:** 2025-01-27
