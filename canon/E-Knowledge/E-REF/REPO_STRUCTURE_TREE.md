# NEXUSCANON REPOSITORY STRUCTURE

Generated: December 11, 2025

```
./
│
├── 📜 canon                                          # Canon Identity contracts and ADRs (6 files)
│   │
│   ├── archive                                           (1 file)
│   │   │
│   │   └── SSOT_DEFINITION_v1.md
│   ├── contracts                                         (5 files)
│   │   │
│   │   ├── adrs                                              (3 files)
│   │   │   │
│   │   │   ├── ADR_001_NextJsAppRouter.md
│   │   │   ├── ADR_002_CanonSecurity.md
│   │   │   └── 📄 README.md                                      # Project documentation
│   │   ├── CONT_01_CanonIdentity.md
│   │   └── 📄 README.md                                      # Project documentation
│   └── registry
├── db                                                (2 files)
│   │
│   ├── data                                              (1 file)
│   │   │
│   │   └── nexus.canon-Ledger.csv
│   └── schema.cds
├── 📚 docs                                           # Documentation (2 files)
│   │
│   ├── FIGMA_PUSH_SETUP.md
│   └── FIGMA_SYNC_SETUP.md
├── 🧠 knowledge                                      # Knowledge base and references (2 files)
│   │
│   ├── REF_001_CursorRulesTemplate.md
│   └── REF_002_FigmaIntegration.md
├── 🔧 scripts                                        # Build and utility scripts (10 files)
│   │
│   ├── figma-push.ts
│   ├── figma-sync.ts
│   ├── generate-repo-tree.ts
│   ├── 📄 README.md                                      # Project documentation
│   ├── REPO_TREE_GENERATOR.md
│   ├── repo-tree.config.json
│   ├── sync-canon.ts
│   ├── sync-readme.ts
│   ├── TOOL_03_CheckGovernanceStamps.ts
│   └── TOOL_04_ValidateCursorRules.ts
├── 📁 src                                            # Source code (286 files)
│   │
│   ├── components                                        (166 files)
│   │   │
│   │   ├── auth                                              (4 files)
│   │   │   │
│   │   │   ├── BeamLine.tsx
│   │   │   ├── index.ts
│   │   │   ├── IntegratedEngine.tsx
│   │   │   └── MechanicalOrchestra.tsx
│   │   ├── dashboard                                         (3 files)
│   │   │   │
│   │   │   ├── ActivityFeed.tsx
│   │   │   ├── DashboardHeader.tsx
│   │   │   └── StatusGrid.tsx
│   │   ├── figma                                             (1 file)
│   │   │   │
│   │   │   └── ImageWithFallback.tsx
│   │   ├── health                                            (4 files)
│   │   │   │
│   │   │   ├── HealthCoreGauge.tsx
│   │   │   ├── HealthDeepDivePanel.tsx
│   │   │   ├── HealthModuleCard.tsx
│   │   │   └── HealthRadar.tsx
│   │   ├── icons                                             (1 file)
│   │   │   │
│   │   │   └── LynxIcon.tsx
│   │   ├── landing                                           (26 files)
│   │   │   │
│   │   │   ├── __tests__                                         (1 file)
│   │   │   │   │
│   │   │   │   └── StabilitySimulation.test.tsx
│   │   │   ├── BackgroundGrid.tsx
│   │   │   ├── CanonConnection.tsx
│   │   │   ├── CanonMapping.tsx
│   │   │   ├── CommandPalette.tsx
│   │   │   ├── CrystallizationSphere.tsx
│   │   │   ├── FeatureVisuals.tsx
│   │   │   ├── FinalCTA.tsx
│   │   │   ├── ForensicHero.tsx
│   │   │   ├── ForensicRadar.tsx
│   │   │   ├── ForensicRadarEnhanced.tsx
│   │   │   ├── GovernanceEngine.ts
│   │   │   ├── Header.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   ├── HeroSectionRadar.tsx
│   │   │   ├── HybridRadar.tsx
│   │   │   ├── LandingFooter.tsx
│   │   │   ├── LineageBeamCard.tsx
│   │   │   ├── LinearFeatureCard.tsx
│   │   │   ├── LivingLens.tsx
│   │   │   ├── MagicUIRadar.tsx
│   │   │   ├── ReasoningDemo.tsx
│   │   │   ├── RegistryGrid.tsx
│   │   │   ├── RiskRadar.tsx
│   │   │   ├── StabilitySimulation.tsx
│   │   │   └── TruthBar.tsx
│   │   ├── lynx                                              (1 file)
│   │   │   │
│   │   │   └── LynxChatMessage.tsx
│   │   ├── magicui                                           (2 files)
│   │   │   │
│   │   │   ├── orbiting-circles.tsx
│   │   │   └── ripple.tsx
│   │   ├── metadata                                          (12 files)
│   │   │   │
│   │   │   ├── CanonDetailPanel.tsx
│   │   │   ├── ColumnVisibilityMenu.tsx
│   │   │   ├── ColumnVisibilitySelector.tsx
│   │   │   ├── DetailDrawer.tsx
│   │   │   ├── FlexibleFilterBar.tsx
│   │   │   ├── index.ts
│   │   │   ├── MetadataRequestForm.tsx
│   │   │   ├── SuperTable.tsx
│   │   │   ├── SuperTableBody.tsx
│   │   │   ├── SuperTableHeader.tsx
│   │   │   ├── SuperTableLite.tsx
│   │   │   └── SuperTablePagination.tsx
│   │   ├── motion                                            (3 files)
│   │   │   │
│   │   │   ├── FadeIn.tsx
│   │   │   ├── index.ts
│   │   │   └── SlideUp.tsx
│   │   ├── nexus                                             (13 files)
│   │   │   │
│   │   │   ├── __stories__                                       (4 files)
│   │   │   │   │
│   │   │   │   ├── NexusButton.stories.tsx
│   │   │   │   ├── NexusCard.stories.tsx
│   │   │   │   ├── NexusIcon.stories.tsx
│   │   │   │   └── NexusInput.stories.tsx
│   │   │   ├── CardSection.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── NexusBadge.tsx
│   │   │   ├── NexusButton.stories.tsx
│   │   │   ├── NexusButton.tsx
│   │   │   ├── NexusCard.stories.tsx
│   │   │   ├── NexusCard.tsx
│   │   │   ├── NexusIcon.tsx
│   │   │   └── NexusInput.tsx
│   │   ├── radar                                             (13 files)
│   │   │   │
│   │   │   ├── App.tsx
│   │   │   ├── ControlPanel.tsx
│   │   │   ├── FacePage-1-270.tsx
│   │   │   ├── FacePage.tsx
│   │   │   ├── index.ts
│   │   │   ├── PointManager.tsx
│   │   │   ├── PresetManager.tsx
│   │   │   ├── RadarDecorations.tsx
│   │   │   ├── RadarDisplay.tsx
│   │   │   ├── svg-9qhzzjljdg.ts
│   │   │   ├── svg-jnt5ym17uj.ts
│   │   │   ├── TacticalRadar.tsx
│   │   │   └── ThreatRadar.tsx
│   │   ├── shell                                             (12 files)
│   │   │   │
│   │   │   ├── AppFooter.tsx
│   │   │   ├── AppShell.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── MetaAppShell.tsx
│   │   │   ├── MetaCommandPalette.tsx
│   │   │   ├── MetaErrorBoundary.tsx
│   │   │   ├── MetaKeyboardShortcuts.tsx
│   │   │   ├── MetaPageSkeleton.tsx
│   │   │   ├── MiniSidebar.tsx
│   │   │   ├── NavMiniSidebar.tsx
│   │   │   ├── PageContainer.tsx
│   │   │   └── RegAppShell.tsx
│   │   ├── simulation                                        (10 files)
│   │   │   │
│   │   │   ├── primitives                                        (6 files)
│   │   │   │   │
│   │   │   │   ├── BlockPrimitives.tsx
│   │   │   │   ├── ForensicHeader.tsx
│   │   │   │   ├── HexGridBackground.tsx
│   │   │   │   ├── index.ts
│   │   │   │   ├── LegacyStack.tsx
│   │   │   │   └── NexusStack.tsx
│   │   │   ├── index.ts
│   │   │   ├── StabilitySimulation.tsx
│   │   │   ├── types.ts
│   │   │   └── useSimulationController.ts
│   │   ├── sys                                               (2 files)
│   │   │   │
│   │   │   ├── MissionControl.tsx
│   │   │   └── SetupCompanion.tsx
│   │   ├── ui                                                (46 files)
│   │   │   │
│   │   │   ├── accordion.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── aspect-ratio.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── breadcrumb.tsx
│   │   │   ├── button.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── card.tsx
│   │   │   ├── carousel.tsx
│   │   │   ├── chart.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── command.tsx
│   │   │   ├── context-menu.tsx
│   │   │   ├── drawer.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── hover-card.tsx
│   │   │   ├── input-otp.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── menubar.tsx
│   │   │   ├── navigation-menu.tsx
│   │   │   ├── pagination.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── resizable.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── sonner.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── toggle-group.tsx
│   │   │   ├── toggle.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── use-mobile.ts
│   │   │   └── utils.ts
│   │   ├── AgriMetadataLifecycle.tsx
│   │   ├── Breadcrumbs.tsx
│   │   ├── BYOFOnboarding.tsx
│   │   ├── DashboardView.tsx
│   │   ├── ForensicClassificationStrip.tsx
│   │   ├── Header.tsx
│   │   ├── IndustrialCanonTable.tsx
│   │   ├── LemonLifecycle.tsx
│   │   ├── MetaNavTrigger.tsx
│   │   ├── MetaPageHeader.tsx
│   │   ├── MetaSideNav.tsx
│   │   ├── PageAuditTrail.tsx
│   │   └── SchematicBoat.tsx
│   ├── constants                                         (2 files)
│   │   │
│   │   ├── app.ts
│   │   └── design-tokens.ts
│   ├── context                                           (1 file)
│   │   │
│   │   └── SysConfigContext.tsx
│   ├── data                                              (7 files)
│   │   │
│   │   ├── figma
│   │   ├── industrialCanon.ts
│   │   ├── mockCanonMatrix.ts
│   │   ├── mockEntityGovernance.ts
│   │   ├── mockHealthScan.ts
│   │   ├── mockLynxData.ts
│   │   ├── mockMetadata.ts
│   │   └── systemMock.ts
│   ├── 📚 docs                                           # Documentation (27 files)
│   │   │
│   │   ├── 01-architecture                                   (5 files)
│   │   │   │
│   │   │   ├── BUILD_READY.md
│   │   │   ├── META_NAV_DESIGN.md
│   │   │   ├── META_NAVIGATION_AUDIT_SYSTEM.md
│   │   │   ├── PAGE_CODING_STANDARD.md
│   │   │   └── SCHEMA_FIRST_ARCHITECTURE.md
│   │   ├── 01-foundations                                    (3 files)
│   │   │   │
│   │   │   ├── brand-identity.md
│   │   │   ├── design-system.md
│   │   │   └── guidelines.md
│   │   ├── 02-architecture                                   (3 files)
│   │   │   │
│   │   │   ├── coding-standards.md
│   │   │   ├── schema-architecture.md
│   │   │   └── technical-register.md
│   │   ├── 02-design-system                                  (3 files)
│   │   │   │
│   │   │   ├── DESIGN_SYSTEM.md
│   │   │   ├── GUIDELINES.md
│   │   │   └── NEXUSCANON_BRAND_GUIDE.md
│   │   ├── 03-features                                       (3 files)
│   │   │   │
│   │   │   ├── meta-series-completion.md
│   │   │   ├── reg-series-completion.md
│   │   │   └── sys-series-completion.md
│   │   ├── 03-guides                                         (2 files)
│   │   │   │
│   │   │   ├── KEYBOARD_SHORTCUTS_REFERENCE.md
│   │   │   └── QUICK_START_GUIDE.md
│   │   ├── 04-guides                                         (3 files)
│   │   │   │
│   │   │   ├── developer-handoff.md
│   │   │   ├── quick-start.md
│   │   │   └── shortcuts.md
│   │   ├── 05-archive                                        (1 file)
│   │   │   │
│   │   │   └── template-series.md
│   │   ├── AUDIT_TRAIL_EXAMPLE.md
│   │   ├── META_NAV_DESIGN.md
│   │   ├── META_NAVIGATION_AUDIT_SYSTEM.md
│   │   └── 📄 README.md                                      # Project documentation
│   ├── hooks                                             (1 file)
│   │   │
│   │   └── useRiskTelemetry.ts
│   ├── kernel                                            (2 files)
│   │   │
│   │   ├── index.ts
│   │   └── SchemaColumnGenerator.tsx
│   ├── lib                                               (3 files)
│   │   │
│   │   ├── prism-helpers.ts
│   │   ├── stateManager.ts
│   │   └── utils.ts
│   ├── modules                                           (22 files)
│   │   │
│   │   ├── inventory                                         (2 files)
│   │   │   │
│   │   │   ├── index.ts
│   │   │   └── INV_01_Dashboard.tsx
│   │   ├── payment                                           (17 files)
│   │   │   │
│   │   │   ├── components                                        (6 files)
│   │   │   │   │
│   │   │   │   ├── ApprovalActions.tsx
│   │   │   │   ├── AuditSidebar.tsx
│   │   │   │   ├── FunctionalCard.tsx
│   │   │   │   ├── index.ts
│   │   │   │   ├── PaymentTable.tsx
│   │   │   │   └── TreasuryHeader.tsx
│   │   │   ├── data                                              (3 files)
│   │   │   │   │
│   │   │   │   ├── index.ts
│   │   │   │   ├── paymentSchema.ts
│   │   │   │   └── treasuryData.ts
│   │   │   ├── hooks                                             (6 files)
│   │   │   │   │
│   │   │   │   ├── index.ts
│   │   │   │   ├── useBatchApproval.ts
│   │   │   │   ├── useDocumentValidation.ts
│   │   │   │   ├── useICValidation.ts
│   │   │   │   ├── usePaymentApproval.ts
│   │   │   │   └── usePaymentGovernance.ts
│   │   │   ├── index.ts
│   │   │   └── PAY_01_PaymentHub.tsx
│   │   ├── system                                            (2 files)
│   │   │   │
│   │   │   ├── index.ts
│   │   │   └── SYS_01_Bootloader.tsx
│   │   └── index.ts
│   ├── pages                                             (20 files)
│   │   │
│   │   ├── CoreCoaPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── EntityMasterPage.tsx
│   │   ├── LandingPage.tsx
│   │   ├── META_01_MetadataArchitecturePage.tsx
│   │   ├── META_02_MetadataGodView.tsx
│   │   ├── META_03_ThePrismPage.tsx
│   │   ├── META_04_MetaRiskRadarPage.tsx
│   │   ├── META_05_MetaCanonMatrixPage.tsx
│   │   ├── META_06_MetaHealthScanPage.tsx
│   │   ├── META_07_MetaLynxCodexPage.tsx
│   │   ├── META_08_ImplementationPlaybookPage.tsx
│   │   ├── PAY_01_PaymentHubPage.tsx
│   │   ├── REG_01_LoginPage.tsx
│   │   ├── REG_02_SignUpPage.tsx
│   │   ├── REG_03_ResetPasswordPage.tsx
│   │   ├── SYS_01_SysBootloaderPage.tsx
│   │   ├── SYS_02_SysOrganizationPage.tsx
│   │   ├── SYS_03_SysAccessPage.tsx
│   │   └── SYS_04_SysProfilePage.tsx
│   ├── providers                                         (1 file)
│   │   │
│   │   └── AppProviders.tsx
│   ├── stories                                           (26 files)
│   │   │
│   │   ├── assets                                            (16 files)
│   │   │   │
│   │   │   ├── accessibility.png
│   │   │   ├── accessibility.svg
│   │   │   ├── addon-library.png
│   │   │   ├── assets.png
│   │   │   ├── avif-test-image.avif
│   │   │   ├── context.png
│   │   │   ├── discord.svg
│   │   │   ├── docs.png
│   │   │   ├── figma-plugin.png
│   │   │   ├── github.svg
│   │   │   ├── share.png
│   │   │   ├── styling.png
│   │   │   ├── testing.png
│   │   │   ├── theming.png
│   │   │   ├── tutorials.svg
│   │   │   └── youtube.svg
│   │   ├── button.css
│   │   ├── Button.stories.ts
│   │   ├── Button.tsx
│   │   ├── Configure.mdx
│   │   ├── header.css
│   │   ├── Header.stories.ts
│   │   ├── Header.tsx
│   │   ├── page.css
│   │   ├── Page.stories.ts
│   │   └── Page.tsx
│   ├── styles                                            (1 file)
│   │   │
│   │   └── globals.css
│   ├── test                                              (2 files)
│   │   │
│   │   ├── example.test.tsx
│   │   └── setup.ts
│   ├── types                                             (3 files)
│   │   │
│   │   ├── entity-governance.ts
│   │   ├── metadata.ts
│   │   └── system.ts
│   ├── App.tsx
│   └── main.tsx
├── srv                                               (2 files)
│   │
│   ├── service.cds
│   └── service.cjs
├── .prettierignore
├── .prettierrc
├── AUDIT_PAYMENT_HUB.md
├── DEVELOPER_NOTE.md
├── eslint-local-rules.js
├── eslint.config.js
├── FIGMA_SYNC_QUICKSTART.md
├── figma-sync.config.json
├── HONEST_AUDIT_VALIDATION.md
├── index.html
├── package-lock.json
├── 📦 package.json                                   # Dependencies and scripts
├── postcss.config.js
├── PRD_PAY_01_PAYMENT_HUB.md
├── README_CANON_IMPLEMENTATION.md
├── 📄 README.md                                      # Project documentation
├── REPO_STRUCTURE_TREE.md
├── tailwind.config.js
├── ⚙️ tsconfig.json                                  # TypeScript configuration
├── ⚡ vite.config.ts                                  # Vite build configuration
├── vitest.config.ts
└── vitest.shims.d.ts

```

---

## 📊 REPOSITORY STATISTICS

### File Counts by Category

| Category | Count |
|----------|-------|
| **React Components** | 190 |
| **Documentation** | 47 |
| **TypeScript/JavaScript** | 45 |
| **Other** | 24 |
| **Components** | 14 |
| **Configuration** | 5 |
| **Styles** | 4 |
| **Utilities** | 3 |

### File Counts by Extension

| Extension | Count |
|-----------|-------|
| **.tsx** | 190 |
| **.ts** | 58 |
| **.md** | 47 |
| **.png** | 10 |
| **.json** | 5 |
| **.svg** | 5 |
| **.css** | 4 |
| **.js** | 4 |
| **.cds** | 2 |
| **.csv** | 1 |
| **.avif** | 1 |
| **.mdx** | 1 |
| **.cjs** | 1 |
| **.prettierignore** | 1 |
| **.prettierrc** | 1 |
| **.html** | 1 |

**Total Files:** 394

---

## 🔄 Auto-Generated

This file is automatically generated. To update:
```bash
npm run repo:tree
```

For annotations and custom notes, edit:
```bash
scripts/repo-tree.config.json
```