// ============================================================================
// SYS_02 :: COMPANY CONFIGURATION - OPTIMIZED
// Space-efficient enterprise configuration with forensic precision
// ============================================================================

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MetaAppShell } from '../components/shell/MetaAppShell'
import { CardSection } from '../components/nexus/CardSection'
import { NexusBadge } from '../components/nexus/NexusBadge'
import { useSysConfig } from '../context/SysConfigContext'
import {
  Building2,
  Globe,
  Shield,
  ArrowLeft,
  Info,
  Plus,
  MoreVertical,
  Palette,
  Link2,
  AlertCircle,
  Zap,
  Edit2,
  Users,
  ExternalLink,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { MOCK_ENTITY_GOVERNANCE } from '../data/mockEntityGovernance'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Entity {
  id: string
  name: string
  code: string
  type: 'HQ' | 'Subsidiary' | 'Branch'
  status: 'Active' | 'Dormant'
  parent: string | null
  currency: string
  reportingCurrency: string
  children?: Entity[]
}

interface CardSaveState {
  isSaving: boolean
  saveSuccess: boolean
  hasChanges: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SysOrganizationPage() {
  const navigate = useNavigate()
  const { markStepComplete } = useSysConfig()

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [cardStates, setCardStates] = useState<Record<string, CardSaveState>>({
    structure: { isSaving: false, saveSuccess: false, hasChanges: false },
    standards: { isSaving: false, saveSuccess: false, hasChanges: false },
    intercompany: { isSaving: false, saveSuccess: false, hasChanges: false },
    localization: { isSaving: false, saveSuccess: false, hasChanges: false },
    branding: { isSaving: false, saveSuccess: false, hasChanges: false },
  })

  const [isSavingAll, setIsSavingAll] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  // Data states
  const [structureData, setStructureData] = useState<{
    selectedEntityId: string
    entities: Entity[]
  }>({
    selectedEntityId: 'nexus-hq',
    entities: [
      {
        id: 'nexus-hq',
        name: 'Nexus Group Holdings',
        code: 'HQ',
        type: 'HQ',
        status: 'Active',
        parent: null,
        currency: 'USD',
        reportingCurrency: 'USD',
        children: [
          {
            id: 'nexus-my',
            name: 'Nexus Farming MY',
            code: 'MY01',
            type: 'Subsidiary',
            status: 'Active',
            parent: 'nexus-hq',
            currency: 'MYR',
            reportingCurrency: 'USD',
          },
          {
            id: 'nexus-vn',
            name: 'Nexus Farming VN',
            code: 'VN01',
            type: 'Subsidiary',
            status: 'Active',
            parent: 'nexus-hq',
            currency: 'VND',
            reportingCurrency: 'USD',
          },
          {
            id: 'nexus-sg',
            name: 'Nexus Retail SG',
            code: 'SG01',
            type: 'Subsidiary',
            status: 'Dormant',
            parent: 'nexus-hq',
            currency: 'SGD',
            reportingCurrency: 'USD',
          },
        ],
      },
    ],
  })

  const [standardsData] = useState({
    fiscalYearEnd: '31 Dec',
    reportingCurrency: 'USD',
    accountingFramework: 'IFRS',
    coaTemplate: 'GROUP_COA_V1',
    appliedEntities: 9,
    totalEntities: 12,
  })

  const [intercompanyData] = useState({
    pairsConfigured: 10,
    totalPairs: 12,
    matrix: [
      { from: 'HQ', to: 'MY01', status: 'On' as const },
      { from: 'HQ', to: 'VN01', status: 'On' as const },
      { from: 'MY01', to: 'VN01', status: 'On' as const },
      { from: 'HQ', to: 'SG01', status: 'Off' as const },
    ],
  })

  const [localizationData] = useState({
    profiles: [
      { region: 'MY', taxProfile: 'MY_SST_V1', entityCount: 4 },
      { region: 'SG', taxProfile: 'GST_V2', entityCount: 3 },
      { region: 'VN', taxProfile: 'VN_VAT_V1', entityCount: 2 },
    ],
  })

  const [brandingData] = useState({
    brandMode: 'Group Brand',
    colorPack: 'Forest Green V1',
    documentTemplates: 'GROUP_STD_V1',
    usedByEntities: 5,
  })

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const changedCardsCount = Object.values(cardStates).filter(
    (s) => s.hasChanges
  ).length
  const hasAnyChanges = changedCardsCount > 0
  const selectedEntity =
    structureData.entities[0]?.children?.find(
      (e) => e.id === structureData.selectedEntityId
    ) || structureData.entities[0]

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (hasAnyChanges) {
          handleSaveAll()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasAnyChanges])

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCardSave = async (cardId: string) => {
    setCardStates((prev) => ({
      ...prev,
      [cardId]: { ...prev[cardId], isSaving: true },
    }))

    await new Promise((resolve) => setTimeout(resolve, 1200))

    setCardStates((prev) => ({
      ...prev,
      [cardId]: { isSaving: false, saveSuccess: true, hasChanges: false },
    }))

    setTimeout(() => {
      setCardStates((prev) => ({
        ...prev,
        [cardId]: { ...prev[cardId], saveSuccess: false },
      }))
    }, 3000)

    const allSaved = Object.values(cardStates).every(
      (state) => !state.hasChanges
    )
    if (allSaved) {
      markStepComplete('organization')
    }
  }

  const handleCardRevert = (cardId: string) => {
    setCardStates((prev) => ({
      ...prev,
      [cardId]: { isSaving: false, saveSuccess: false, hasChanges: false },
    }))
  }

  const markCardChanged = (cardId: string) => {
    setCardStates((prev) => ({
      ...prev,
      [cardId]: { ...prev[cardId], hasChanges: true, saveSuccess: false },
    }))
  }

  const handleSaveAll = async () => {
    setIsSavingAll(true)
    const changedCards = Object.keys(cardStates).filter(
      (id) => cardStates[id].hasChanges
    )
    await Promise.all(changedCards.map((id) => handleCardSave(id)))
    setIsSavingAll(false)
    markStepComplete('organization')
  }

  // ============================================================================
  // LOADING SKELETON
  // ============================================================================

  if (pageLoading) {
    return (
      <MetaAppShell>
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="font-mono text-sm uppercase tracking-wider text-zinc-500">
              Loading Configuration
            </p>
          </div>
        </div>
      </MetaAppShell>
    )
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <MetaAppShell>
      <div className="relative flex min-h-[calc(100vh-64px)] flex-col items-center justify-start overflow-hidden p-6 pt-8">
        {/* Ambient Background */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_10%,#0A0A0A_0%,#000000_60%)]" />
        <div className="absolute left-0 top-0 h-[1px] w-full bg-gradient-to-r from-transparent via-[#1F1F1F] to-transparent" />

        {/* 12-COLUMN GRID CONTAINER */}
        <div className="z-10 w-full max-w-[1280px] space-y-6">
          {/* ================================================================ */}
          {/* STICKY HEADER WITH SAVE ALL */}
          {/* ================================================================ */}
          <div className="sticky top-4 z-30 border-b border-[#1F1F1F] bg-[#0A0A0A] pb-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2"
                  >
                    <div className="h-[1px] w-8 bg-emerald-500" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-500">
                      System Configuration
                    </span>
                  </motion.div>

                  <h1 className="text-4xl tracking-tight text-white">
                    Group Configuration
                  </h1>
                  <p className="font-mono text-sm text-zinc-500">
                    Control structure, standards, intercompany, localization and
                    branding.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <AnimatePresence>
                    {hasAnyChanges && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-2 border border-amber-500/40 bg-amber-950/10 px-3 py-2"
                      >
                        <AlertCircle className="h-3 w-3 text-amber-500" />
                        <span className="font-mono text-[10px] tracking-wider text-amber-500">
                          {changedCardsCount}{' '}
                          {changedCardsCount === 1 ? 'section' : 'sections'}{' '}
                          unsaved
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={handleSaveAll}
                    disabled={!hasAnyChanges || isSavingAll}
                    className={`relative h-10 border px-4 font-mono text-[10px] uppercase tracking-[0.15em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] ${
                      hasAnyChanges && !isSavingAll
                        ? 'border-emerald-500 bg-emerald-950/20 text-emerald-500 hover:bg-emerald-900/20'
                        : 'cursor-not-allowed border-[#1F1F1F] bg-[#050505] text-zinc-700'
                    } `}
                  >
                    {hasAnyChanges && !isSavingAll && (
                      <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
                    )}
                    <div className="flex items-center gap-2">
                      {isSavingAll ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border border-emerald-500 border-t-transparent" />
                          <span>Saving All</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-3 w-3" />
                          <span>Save All</span>
                          {hasAnyChanges && (
                            <NexusBadge variant="success" size="sm">
                              {changedCardsCount}
                            </NexusBadge>
                          )}
                        </>
                      )}
                    </div>
                  </button>

                  <div className="flex h-10 items-center border border-[#1F1F1F] bg-[#050505] px-3 py-2 font-mono text-[10px] text-[rgba(95,95,106,0.96)]">
                    SYS_02
                  </div>
                </div>
              </div>

              {/* Context Strip */}
              <div className="flex items-center justify-between border-t border-[#1F1F1F] pt-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigate('/sys-bootloader')}
                    className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500 transition-colors hover:text-emerald-500 focus-visible:text-emerald-500 focus-visible:outline-none"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Setup
                  </button>
                  <div className="h-3 w-[1px] bg-[#1F1F1F]" />
                  <div className="flex items-center gap-2">
                    <NexusBadge variant="neutral">
                      Tenant: Nexus Group – Production
                    </NexusBadge>
                    <NexusBadge variant="neutral">Scope: Group HQ</NexusBadge>
                  </div>
                </div>
                <div className="flex items-center gap-2 font-mono text-[9px] text-zinc-600">
                  <kbd className="border border-[#1F1F1F] bg-[#050505] px-1.5 py-0.5">
                    ⌘S
                  </kbd>
                  <span>Save All</span>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* OPTIMIZED BENTO GRID - COMPACT LAYOUT */}
          {/* ================================================================ */}
          <div className="grid grid-cols-12 gap-6">
            {/* ============================================================ */}
            {/* CARD A: GROUP STRUCTURE (Full Width, Compact Height) */}
            {/* ============================================================ */}
            <CardSection
              className="col-span-12"
              height="h-[320px]"
              icon={Building2}
              title="Group Structure"
              subtitle="12 Entities · 3 Countries"
              badge={
                <NexusBadge variant="neutral" size="sm">
                  3 Active
                </NexusBadge>
              }
              compact
              headerActions={
                <>
                  <button
                    onClick={() => markCardChanged('structure')}
                    className="h-7 border border-[#1F1F1F] bg-[#050505] px-2.5 font-mono text-[9px] uppercase tracking-wider text-zinc-500 transition-colors hover:border-emerald-900/40 hover:text-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                  >
                    <Plus className="mr-1 inline h-3 w-3" />
                    Add
                  </button>
                  <button className="flex h-7 w-7 items-center justify-center border border-[#1F1F1F] bg-[#050505] text-zinc-500 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40">
                    <MoreVertical className="h-3 w-3" />
                  </button>
                </>
              }
              bodyClassName="p-0"
              scrollable={false}
              onSave={() => handleCardSave('structure')}
              onRevert={() => handleCardRevert('structure')}
              saveState={cardStates.structure}
            >
              <div className="flex h-full">
                {/* Left: Compact Tree */}
                <div className="w-[40%] overflow-y-auto border-r border-[#1F1F1F] p-4">
                  <div
                    onClick={() => {
                      setStructureData((prev) => ({
                        ...prev,
                        selectedEntityId: 'nexus-hq',
                      }))
                      markCardChanged('structure')
                    }}
                    className={`mb-2 flex cursor-pointer items-center justify-between border border-[#1F1F1F] p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${structureData.selectedEntityId === 'nexus-hq' ? 'border-emerald-900/40 bg-emerald-950/10' : 'hover:bg-[#0A0A0A]'} `}
                    tabIndex={0}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3 w-3 text-zinc-500" />
                      <span className="text-[11px] tracking-tight text-white">
                        Nexus Holdings
                      </span>
                    </div>
                    <NexusBadge variant="success" size="sm">
                      HQ
                    </NexusBadge>
                  </div>

                  <div className="space-y-1.5 pl-4">
                    {structureData.entities[0]?.children?.map((entity) => (
                      <div
                        key={entity.id}
                        onClick={() => {
                          setStructureData((prev) => ({
                            ...prev,
                            selectedEntityId: entity.id,
                          }))
                          markCardChanged('structure')
                        }}
                        className={`flex cursor-pointer items-center justify-between border border-[#1F1F1F] p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${structureData.selectedEntityId === entity.id ? 'border-emerald-900/40 bg-emerald-950/10' : 'hover:bg-[#0A0A0A]'} `}
                        tabIndex={0}
                      >
                        <span className="text-[11px] tracking-tight text-white">
                          {entity.code}
                        </span>
                        <NexusBadge
                          variant={
                            entity.status === 'Active' ? 'success' : 'warning'
                          }
                          size="sm"
                        >
                          {entity.status === 'Active' ? 'On' : 'Off'}
                        </NexusBadge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Compact Detail */}
                <div className="w-[60%] bg-[#050505] p-4">
                  {selectedEntity && (
                    <div className="space-y-2.5">
                      <div className="border-b border-[#1F1F1F] pb-2.5">
                        <h3 className="mb-0.5 text-sm tracking-tight text-white">
                          {selectedEntity.name}
                        </h3>
                        <p className="font-mono text-[9px] tracking-wider text-zinc-600">
                          {selectedEntity.code}
                        </p>
                      </div>

                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between border-b border-[#1F1F1F] py-1.5">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                            Type
                          </span>
                          <span className="text-white">
                            {selectedEntity.type}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-[#1F1F1F] py-1.5">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                            Currency
                          </span>
                          <span className="text-white">
                            {selectedEntity.currency}
                          </span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                            Reporting
                          </span>
                          <span className="text-white">
                            {selectedEntity.reportingCurrency}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardSection>

            {/* ============================================================ */}
            {/* ROW 2: THREE COMPACT CARDS */}
            {/* ============================================================ */}

            {/* CARD B: GLOBAL STANDARDS */}
            <CardSection
              className="col-span-12 md:col-span-4"
              icon={Shield}
              title="Global Standards"
              compact
              badge={
                <NexusBadge variant="warning" size="sm">
                  Mandatory
                </NexusBadge>
              }
              onSave={() => handleCardSave('standards')}
              onRevert={() => handleCardRevert('standards')}
              saveState={cardStates.standards}
              footerLeft={
                <button
                  onClick={() => markCardChanged('standards')}
                  className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-emerald-500 hover:text-emerald-400 focus-visible:text-emerald-400 focus-visible:outline-none"
                >
                  <Edit2 className="h-2.5 w-2.5" />
                  Edit
                </button>
              }
            >
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between py-1">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                    FYE
                  </span>
                  <span className="text-white">
                    {standardsData.fiscalYearEnd}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                    Currency
                  </span>
                  <span className="text-white">
                    {standardsData.reportingCurrency}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                    Framework
                  </span>
                  <span className="text-white">
                    {standardsData.accountingFramework}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                    COA
                  </span>
                  <span className="font-mono text-[10px] text-white">
                    {standardsData.coaTemplate}
                  </span>
                </div>
              </div>
            </CardSection>

            {/* CARD C: INTERCOMPANY MATRIX */}
            <CardSection
              className="col-span-12 md:col-span-4"
              icon={Link2}
              title="Intercompany"
              compact
              badge={
                <NexusBadge variant="neutral" size="sm">
                  {intercompanyData.pairsConfigured}/
                  {intercompanyData.totalPairs}
                </NexusBadge>
              }
              onSave={() => handleCardSave('intercompany')}
              onRevert={() => handleCardRevert('intercompany')}
              saveState={cardStates.intercompany}
              footerLeft={
                <span className="text-[9px] text-zinc-600">
                  {intercompanyData.totalPairs -
                    intercompanyData.pairsConfigured}{' '}
                  not configured
                </span>
              }
            >
              <div className="space-y-1 text-[10px]">
                {intercompanyData.matrix.map((pair, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="font-mono text-zinc-500">
                      {pair.from} → {pair.to}
                    </span>
                    <NexusBadge
                      variant={pair.status === 'On' ? 'success' : 'neutral'}
                      size="sm"
                    >
                      {pair.status}
                    </NexusBadge>
                  </div>
                ))}
              </div>
            </CardSection>

            {/* CARD D: LOCALIZATION */}
            <CardSection
              className="col-span-12 md:col-span-4"
              icon={Globe}
              title="Localization"
              compact
              badge={
                <NexusBadge variant="neutral" size="sm">
                  {localizationData.profiles.length} Regions
                </NexusBadge>
              }
              onSave={() => handleCardSave('localization')}
              onRevert={() => handleCardRevert('localization')}
              saveState={cardStates.localization}
            >
              <div className="space-y-1.5">
                {localizationData.profiles.map((profile, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between border border-[#1F1F1F] p-2 transition-colors hover:bg-[#0A0A0A]"
                  >
                    <div className="text-[11px]">
                      <div className="tracking-tight text-white">
                        {profile.region}
                      </div>
                      <div className="font-mono text-[9px] text-zinc-600">
                        {profile.entityCount} entities
                      </div>
                    </div>
                    <button
                      onClick={() => markCardChanged('localization')}
                      className="font-mono text-[9px] uppercase tracking-wider text-emerald-500 hover:text-emerald-400 focus-visible:text-emerald-400 focus-visible:outline-none"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </CardSection>

            {/* ============================================================ */}
            {/* CARD E: BRANDING (Full Width, Compact) */}
            {/* ============================================================ */}
            <CardSection
              className="col-span-12"
              icon={Palette}
              title="Branding & Document Pack"
              compact
              badge={
                <NexusBadge variant="neutral" size="sm">
                  {brandingData.usedByEntities} entities
                </NexusBadge>
              }
              onSave={() => handleCardSave('branding')}
              onRevert={() => handleCardRevert('branding')}
              saveState={cardStates.branding}
            >
              <div className="grid grid-cols-4 gap-4">
                <div className="flex items-center justify-center border border-[#1F1F1F] bg-[#050505] p-4">
                  <Building2 className="h-8 w-8 text-zinc-700" />
                </div>
                <div className="col-span-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px]">
                  <div className="flex justify-between py-1">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                      Mode
                    </span>
                    <span className="text-white">{brandingData.brandMode}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                      Color Pack
                    </span>
                    <span className="text-white">{brandingData.colorPack}</span>
                  </div>
                  <div className="col-span-2 flex justify-between py-1">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                      Templates
                    </span>
                    <span className="font-mono text-[10px] text-white">
                      {brandingData.documentTemplates}
                    </span>
                  </div>
                </div>
              </div>
            </CardSection>

            {/* ============================================================ */}
            {/* CARD F: OWNERSHIP & GOVERNANCE (NEW - 6th Card) */}
            {/* ============================================================ */}
            <CardSection
              className="col-span-12 md:col-span-6"
              icon={Users}
              title="Ownership & Governance"
              subtitle="MY01 · Nexus Farming MY"
              compact
              badge={
                MOCK_ENTITY_GOVERNANCE['nexus-my'].validation.status ===
                'VERIFIED' ? (
                  <NexusBadge variant="success" size="sm">
                    VERIFIED
                  </NexusBadge>
                ) : (
                  <NexusBadge variant="warning" size="sm">
                    PENDING
                  </NexusBadge>
                )
              }
              headerActions={
                <button
                  onClick={() => navigate('/entity-master/nexus-my')}
                  className="flex h-7 items-center gap-1 border border-[#1F1F1F] bg-[#050505] px-2.5 font-mono text-[9px] uppercase tracking-wider text-emerald-500 transition-colors hover:border-emerald-900/40 hover:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                >
                  Deep Form
                  <ExternalLink className="h-2.5 w-2.5" />
                </button>
              }
            >
              {(() => {
                const entity = MOCK_ENTITY_GOVERNANCE['nexus-my']
                return (
                  <div className="space-y-2.5">
                    {/* Consolidation Profile */}
                    <div className="border border-[#1F1F1F] bg-[#050505] p-2.5">
                      <div className="mb-1.5 font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                        Consolidation
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-white">
                          Method:{' '}
                          <span className="text-emerald-500">
                            {entity.consolidation.actualMethod}
                          </span>
                        </span>
                        <span className="text-zinc-500">
                          NCI: {entity.consolidation.nciPercent}%
                        </span>
                      </div>
                    </div>

                    {/* Shareholding Summary */}
                    <div className="space-y-1">
                      <div className="mb-1 font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                        Shareholders ({entity.shareholders.length})
                      </div>
                      {entity.shareholders.slice(0, 3).map((sh, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[10px] text-zinc-500"
                        >
                          <span className="max-w-[180px] truncate">
                            {sh.name}
                          </span>
                          <span className="font-mono text-white">
                            {sh.ownershipPercent}%
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Governance Status */}
                    <div className="flex items-center justify-between border-t border-[#1F1F1F] pt-2">
                      <span className="text-[9px] text-zinc-600">
                        Legal Rep, Board (
                        {entity.board.filter((b) => b.isActive).length}), CFO,
                        Bank ✓
                      </span>
                      <NexusBadge variant="success" size="sm">
                        {entity.computed.governanceCompleteness}%
                      </NexusBadge>
                    </div>
                  </div>
                )
              })()}
            </CardSection>

            {/* ============================================================ */}
            {/* CARD G: ENTITY GOVERNANCE ALERTS (Right Side) */}
            {/* ============================================================ */}
            <CardSection
              className="col-span-12 md:col-span-6"
              icon={AlertCircle}
              title="Governance Alerts"
              subtitle="Entities requiring attention"
              compact
              badge={
                <NexusBadge variant="warning" size="sm">
                  1 Issue
                </NexusBadge>
              }
            >
              {(() => {
                const sgEntity = MOCK_ENTITY_GOVERNANCE['nexus-sg']
                return (
                  <div className="space-y-2">
                    {/* SG Entity Alert */}
                    <div className="border border-amber-500/40 bg-amber-950/10 p-2.5">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[11px] tracking-tight text-white">
                          {sgEntity.profile.entityCode} ·{' '}
                          {sgEntity.profile.tradingName}
                        </span>
                        <NexusBadge variant="warning" size="sm">
                          {sgEntity.validation.status}
                        </NexusBadge>
                      </div>
                      <div className="mb-2 text-[9px] text-amber-500">
                        Governance: {sgEntity.computed.governanceCompleteness}%
                        complete
                      </div>
                      <div className="space-y-0.5 text-[9px] text-zinc-600">
                        <div>
                          ❌ Missing:{' '}
                          {sgEntity.computed.missingGovernanceItems.join(', ')}
                        </div>
                        <div className="border-t border-[#1F1F1F] pt-1.5 text-amber-400">
                          ⚠️ Cannot consolidate until verified
                        </div>
                      </div>
                      <button
                        onClick={() => navigate('/entity-master/nexus-sg')}
                        className="mt-2 h-7 w-full border border-amber-500/40 bg-[#050505] px-2.5 font-mono text-[9px] uppercase tracking-wider text-amber-500 transition-colors hover:bg-amber-950/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
                      >
                        Complete Governance →
                      </button>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-2 border-t border-[#1F1F1F] pt-2">
                      <div className="text-center">
                        <div className="font-mono text-[10px] text-emerald-500">
                          2
                        </div>
                        <div className="text-[9px] text-zinc-600">Verified</div>
                      </div>
                      <div className="text-center">
                        <div className="font-mono text-[10px] text-amber-500">
                          1
                        </div>
                        <div className="text-[9px] text-zinc-600">Pending</div>
                      </div>
                      <div className="text-center">
                        <div className="font-mono text-[10px] text-zinc-500">
                          0
                        </div>
                        <div className="text-[9px] text-zinc-600">Rejected</div>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </CardSection>
          </div>
        </div>
      </div>
    </MetaAppShell>
  )
}
