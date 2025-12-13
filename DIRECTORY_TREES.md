# Directory Tree Architecture

**Date:** 2025-01-27  
**Directories:** `app/`, `packages/`, `src/`

---

## 📁 `app/` - Next.js App Router Directory

```
app/
├── globals.css                    # Global CSS (design tokens)
├── layout.tsx                     # Root layout
├── page.tsx                       # Home page (/)
├── providers.tsx                  # React providers wrapper
│
├── bio-demo/                      # Bio demo route
│   ├── error.tsx
│   └── page.tsx
│
├── bioskin-demo/                  # Bioskin demo route
│   ├── error.tsx
│   ├── loading.tsx
│   └── page.tsx
│
├── canon/                         # Canon documentation routes
│   ├── layout.tsx
│   ├── page.tsx
│   └── [...slug]/                 # Catch-all route for MDX pages
│       ├── CanonPageShell.tsx
│       └── page.tsx
│
├── components/                    # App-level components
│   └── canon/
│       └── CanonPageShell.tsx
│
├── dashboard/                     # Dashboard route (/dashboard)
│   └── page.tsx
│
├── inventory/                     # Inventory route (/inventory)
│   └── page.tsx
│
├── payments/                      # Payments route (/payments)
│   └── page.tsx
│
└── system/                        # System route (/system)
    └── page.tsx
```

**Purpose:** Next.js App Router file-based routing structure  
**Pattern:** Each route directory contains `page.tsx` for that route

---

## 📦 `packages/` - Monorepo Packages

```
packages/
│
├── bioskin/                       # BioSkin Component Library
│   ├── LAYOUT_INLINE_STYLE_POLICY.md
│   ├── README.md
│   └── src/
│       ├── BioCell.tsx            # Cell component
│       ├── BioList.tsx            # List component
│       ├── BioObject.tsx          # Object component
│       ├── FieldContextSidebar.tsx
│       ├── index.ts               # Barrel exports
│       ├── types.ts               # TypeScript types
│       ├── ZodBioDemo.tsx         # Demo component
│       ├── ZodBioObject.tsx       # Zod-based object
│       └── ZodSchemaIntrospector.ts
│
└── ui/                            # UI Component Library
    ├── package.json
    ├── README.md
    ├── tsconfig.json
    └── src/
        ├── index.ts               # Barrel exports
        │
        ├── atoms/                 # Atomic components
        │   ├── Btn.tsx
        │   ├── index.ts
        │   ├── Input.tsx
        │   ├── StatusDot.tsx
        │   ├── Surface.tsx
        │   └── Txt.tsx
        │
        ├── lib/                   # Utilities
        │   └── utils.ts
        │
        └── primitives/            # Radix UI primitives
            ├── badge.tsx
            ├── card.tsx
            ├── dialog.tsx
            ├── index.ts
            ├── popover.tsx
            ├── scroll-area.tsx
            └── separator.tsx
```

**Purpose:** Reusable packages for monorepo  
**Pattern:** Each package is self-contained with its own `package.json` and exports

---

## 📂 `src/` - Source Code Directory

```
src/
│
├── components/                    # Shared UI Components
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
│   ├── SchematicBoat.tsx
│   │
│   ├── auth/                      # Authentication components
│   │   ├── BeamLine.tsx
│   │   ├── index.ts
│   │   ├── IntegratedEngine.tsx
│   │   └── MechanicalOrchestra.tsx
│   │
│   ├── canon/                     # Canon-specific components
│   │   ├── HealthScoreRing.tsx
│   │   ├── index.ts
│   │   ├── StatCard.tsx
│   │   ├── StatusBadge.tsx
│   │   └── StatusCard.tsx
│   │
│   ├── dashboard/                 # Dashboard components
│   │   ├── ActivityFeed.tsx
│   │   ├── DashboardHeader.tsx
│   │   └── StatusGrid.tsx
│   │
│   ├── figma/                     # Figma integration
│   │   └── ImageWithFallback.tsx
│   │
│   ├── health/                    # Health monitoring components
│   │   ├── HealthCoreGauge.tsx
│   │   ├── HealthDeepDivePanel.tsx
│   │   ├── HealthModuleCard.tsx
│   │   └── HealthRadar.tsx
│   │
│   ├── icons/                     # Icon components
│   │   └── LynxIcon.tsx
│   │
│   ├── lynx/                      # Lynx components
│   │   └── LynxChatMessage.tsx
│   │
│   ├── magicui/                   # Magic UI components
│   │   ├── orbiting-circles.tsx
│   │   └── ripple.tsx
│   │
│   ├── motion/                    # Animation components
│   │   ├── FadeIn.tsx
│   │   ├── index.ts
│   │   └── SlideUp.tsx
│   │
│   ├── nexus/                     # Nexus design system components
│   │   ├── __stories__/           # Storybook stories
│   │   │   ├── NexusButton.stories.tsx
│   │   │   ├── NexusCard.stories.tsx
│   │   │   ├── NexusIcon.stories.tsx
│   │   │   └── NexusInput.stories.tsx
│   │   ├── CardSection.tsx
│   │   ├── Header.tsx
│   │   ├── NexusBadge.tsx
│   │   ├── NexusButton.stories.tsx
│   │   ├── NexusButton.tsx
│   │   ├── NexusCard.stories.tsx
│   │   ├── NexusCard.tsx
│   │   ├── NexusIcon.tsx
│   │   └── NexusInput.tsx
│   │
│   ├── radar/                     # Radar visualization components
│   │   ├── App.tsx
│   │   ├── ControlPanel.tsx
│   │   ├── FacePage.tsx
│   │   ├── FacePage-1-270.tsx
│   │   ├── index.ts
│   │   ├── PointManager.tsx
│   │   ├── PresetManager.tsx
│   │   ├── RadarDecorations.tsx
│   │   ├── RadarDisplay.tsx
│   │   ├── svg-9qhzzjljdg.ts
│   │   ├── svg-jnt5ym17uj.ts
│   │   ├── TacticalRadar.tsx
│   │   └── ThreatRadar.tsx
│   │
│   ├── shell/                     # App shell components
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
│   ├── sys/                       # System components
│   │   ├── MissionControl.tsx
│   │   └── SetupCompanion.tsx
│   │
│   └── ui/                        # shadcn/ui components (Radix primitives)
│       ├── accordion.tsx
│       ├── alert-dialog.tsx
│       ├── alert.tsx
│       ├── aspect-ratio.tsx
│       ├── avatar.tsx
│       ├── Badge.stories.tsx
│       ├── badge.tsx
│       ├── breadcrumb.tsx
│       ├── Btn.stories.tsx
│       ├── Btn.tsx
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
│       ├── Input.stories.tsx
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
│       ├── StatusDot.stories.tsx
│       ├── StatusDot.tsx
│       ├── Surface.stories.tsx
│       ├── Surface.tsx
│       ├── switch.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       ├── toggle-group.tsx
│       ├── toggle.tsx
│       ├── tooltip.tsx
│       ├── Txt.stories.tsx
│       ├── Txt.tsx
│       ├── use-mobile.ts
│       └── utils.ts
│
├── data/                          # Mock data and fixtures
│   ├── industrialCanon.ts
│   ├── mockCanonMatrix.ts
│   ├── mockEntityGovernance.ts
│   ├── mockHealthScan.ts
│   ├── mockLynxData.ts
│   ├── mockMetadata.ts
│   └── systemMock.ts
│
├── hooks/                         # Custom React hooks
│   ├── useRiskTelemetry.ts
│   └── useRouterAdapter.tsx
│
├── kernel/                        # Core kernel functionality
│   ├── index.ts
│   └── SchemaColumnGenerator.tsx
│
├── lib/                           # Utility libraries
│   ├── env.ts                     # Environment variables
│   ├── prism-helpers.ts
│   ├── stateManager.ts            # State management
│   └── utils.ts                   # General utilities
│
├── modules/                       # Business domain modules (ORGAN pattern)
│   ├── index.ts                   # Barrel exports
│   │
│   ├── inventory/                 # Inventory module
│   │   ├── index.ts
│   │   └── INV_01_Dashboard.tsx
│   │
│   ├── metadata/                  # Metadata module
│   │   ├── index.ts
│   │   └── components/
│   │       ├── CanonDetailPanel.tsx
│   │       ├── ColumnVisibilityMenu.tsx
│   │       ├── ColumnVisibilitySelector.tsx
│   │       ├── DetailDrawer.tsx
│   │       ├── FlexibleFilterBar.tsx
│   │       ├── index.ts
│   │       ├── MetadataRequestForm.tsx
│   │       ├── SuperTable.tsx
│   │       ├── SuperTableBody.tsx
│   │       ├── SuperTableHeader.tsx
│   │       ├── SuperTableLite.tsx
│   │       └── SuperTablePagination.tsx
│   │
│   ├── payment/                   # Payment module
│   │   ├── index.ts
│   │   ├── PAY_01_PaymentHub.tsx
│   │   ├── TRANSFORMATION_GUIDE.md
│   │   ├── components/
│   │   │   ├── ApprovalActions.tsx
│   │   │   ├── AuditSidebar.tsx
│   │   │   ├── FunctionalCard.tsx
│   │   │   ├── index.ts
│   │   │   ├── PaymentTable.tsx
│   │   │   ├── PaymentTableGenerative.tsx
│   │   │   └── TreasuryHeader.tsx
│   │   ├── data/
│   │   │   ├── index.ts
│   │   │   ├── paymentSchema.ts
│   │   │   └── treasuryData.ts
│   │   ├── hooks/
│   │   │   ├── index.ts
│   │   │   ├── useBatchApproval.ts
│   │   │   ├── useDocumentValidation.ts
│   │   │   ├── useICValidation.ts
│   │   │   ├── usePaymentApproval.ts
│   │   │   └── usePaymentGovernance.ts
│   │   └── schemas/
│   │       └── PaymentZodSchema.ts
│   │
│   ├── simulation/                # Simulation module
│   │   ├── index.ts
│   │   └── components/
│   │       ├── index.ts
│   │       ├── StabilitySimulation.tsx
│   │       ├── types.ts
│   │       ├── useSimulationController.ts
│   │       └── primitives/
│   │           ├── BlockPrimitives.tsx
│   │           ├── ForensicHeader.tsx
│   │           ├── HexGridBackground.tsx
│   │           ├── index.ts
│   │           ├── LegacyStack.tsx
│   │           └── NexusStack.tsx
│   │
│   └── system/                    # System module
│       ├── index.ts
│       └── SYS_01_Bootloader.tsx
│
├── stories/                       # Storybook stories
│   ├── assets/                    # Storybook assets
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
│   ├── button.css
│   ├── Button.stories.ts
│   ├── Button.tsx
│   ├── Configure.mdx
│   ├── header.css
│   ├── Header.stories.ts
│   ├── Header.tsx
│   ├── page.css
│   ├── Page.stories.ts
│   └── Page.tsx
│
├── SysConfigContext.tsx           # System configuration context
│
├── test/                          # Test files
│   ├── example.test.tsx
│   └── setup.ts
│
├── types/                         # TypeScript type definitions
│   ├── entity-governance.ts
│   ├── js-yaml.d.ts
│   ├── metadata.ts
│   └── system.ts
│
└── views/                         # Page view components (legacy)
    ├── CoreCoaPage.tsx
    ├── DashboardPage.tsx
    ├── EntityMasterPage.tsx
    ├── META_01_MetadataArchitecturePage.tsx
    ├── META_02_MetadataGodView.tsx
    ├── META_03_ThePrismPage.tsx
    ├── META_04_MetaRiskRadarPage.tsx
    ├── META_05_MetaCanonMatrixPage.tsx
    ├── META_06_MetaHealthScanPage.tsx
    ├── META_07_MetaLynxCodexPage.tsx
    ├── META_08_ImplementationPlaybookPage.tsx
    ├── PAY_01_PaymentHubPage.tsx
    ├── REG_01_LoginPage.tsx
    ├── REG_02_SignUpPage.tsx
    ├── REG_03_ResetPasswordPage.tsx
    ├── SYS_01_SysBootloaderPage.tsx
    ├── SYS_02_SysOrganizationPage.tsx
    ├── SYS_03_SysAccessPage.tsx
    └── SYS_04_SysProfilePage.tsx
```

**Purpose:** Main source code directory  
**Pattern:** Organized by domain (modules), shared components, utilities, and views

---

## 📊 Summary Statistics

### `app/` Directory
- **Routes:** 7 routes (bio-demo, bioskin-demo, canon, dashboard, inventory, payments, system)
- **Files:** ~15 TypeScript/TSX files
- **Purpose:** Next.js App Router file-based routing

### `packages/` Directory
- **Packages:** 2 packages (bioskin, ui)
- **Total Files:** ~25 TypeScript files
- **Purpose:** Reusable monorepo packages

### `src/` Directory
- **Components:** ~150+ component files
- **Modules:** 5 business domain modules (inventory, metadata, payment, simulation, system)
- **Views:** 20+ page view components
- **Purpose:** Main application source code

---

**Last Updated:** 2025-01-27
