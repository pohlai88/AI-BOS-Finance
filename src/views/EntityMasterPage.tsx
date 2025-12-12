// ============================================================================
// ENTITY MASTER :: DEEP FORM
// Enterprise Entity Governance - 4-Tab Architecture
// IFRS/MFRS Compliant Consolidation & Validation
// ============================================================================

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MetaAppShell } from '../components/shell/MetaAppShell'
import { CardSection } from '../components/nexus/CardSection'
import { NexusBadge } from '../components/nexus/NexusBadge'
import {
  ArrowLeft,
  Building2,
  Users,
  FileText,
  CheckCircle2,
  AlertCircle,
  Save,
  X,
  Plus,
  Trash2,
  Upload,
  Download,
  Shield,
  Edit2,
  ExternalLink,
} from 'lucide-react'
import {
  MOCK_ENTITY_GOVERNANCE,
  getEntityGovernance,
  computeEntityProperties,
} from '../data/mockEntityGovernance'
import type { EntityGovernance } from '../types/entity-governance'
import { motion, AnimatePresence } from 'motion/react'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type TabId = 'profile' | 'ownership' | 'officers' | 'documents'

interface TabState {
  isDirty: boolean
  isSaving: boolean
  saveSuccess: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EntityMasterPage() {
  const { entityId } = useParams<{ entityId: string }>()
  const navigate = useNavigate()

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [activeTab, setActiveTab] = useState<TabId>('profile')
  const [entity, setEntity] = useState<EntityGovernance | null>(null)
  const [pageLoading, setPageLoading] = useState(true)

  const [tabStates, setTabStates] = useState<Record<TabId, TabState>>({
    profile: { isDirty: false, isSaving: false, saveSuccess: false },
    ownership: { isDirty: false, isSaving: false, saveSuccess: false },
    officers: { isDirty: false, isSaving: false, saveSuccess: false },
    documents: { isDirty: false, isSaving: false, saveSuccess: false },
  })

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (entityId) {
      const loadedEntity = getEntityGovernance(entityId)
      if (loadedEntity) {
        setEntity(computeEntityProperties(loadedEntity))
      }
    }
    setTimeout(() => setPageLoading(false), 600)
  }, [entityId])

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const markTabDirty = (tabId: TabId) => {
    setTabStates((prev) => ({
      ...prev,
      [tabId]: { ...prev[tabId], isDirty: true, saveSuccess: false },
    }))
  }

  const handleTabSave = async (tabId: TabId) => {
    setTabStates((prev) => ({
      ...prev,
      [tabId]: { ...prev[tabId], isSaving: true },
    }))

    await new Promise((resolve) => setTimeout(resolve, 1200))

    setTabStates((prev) => ({
      ...prev,
      [tabId]: { isDirty: false, isSaving: false, saveSuccess: true },
    }))

    setTimeout(() => {
      setTabStates((prev) => ({
        ...prev,
        [tabId]: { ...prev[tabId], saveSuccess: false },
      }))
    }, 3000)
  }

  const handleTabRevert = (tabId: TabId) => {
    setTabStates((prev) => ({
      ...prev,
      [tabId]: { isDirty: false, isSaving: false, saveSuccess: false },
    }))
  }

  const handleSaveAll = async () => {
    const dirtyTabs = Object.keys(tabStates).filter(
      (key) => tabStates[key as TabId].isDirty
    ) as TabId[]

    await Promise.all(dirtyTabs.map((tab) => handleTabSave(tab)))
  }

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const hasAnyChanges = Object.values(tabStates).some((state) => state.isDirty)
  const changedTabsCount = Object.values(tabStates).filter(
    (state) => state.isDirty
  ).length

  // ============================================================================
  // LOADING SKELETON
  // ============================================================================

  if (pageLoading || !entity) {
    return (
      <MetaAppShell>
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="font-mono text-sm uppercase tracking-wider text-zinc-500">
              Loading Entity Governance
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

        {/* CONTAINER */}
        <div className="z-10 w-full max-w-[1280px] space-y-6">
          {/* ================================================================ */}
          {/* HEADER WITH BREADCRUMB */}
          {/* ================================================================ */}
          <div className="sticky top-4 z-30 border-b border-[#1F1F1F] bg-[#0A0A0A] pb-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-600">
                    <button
                      onClick={() => navigate('/sys-organization')}
                      className="flex items-center gap-1 transition-colors hover:text-emerald-500 focus-visible:text-emerald-500 focus-visible:outline-none"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      SYS_02
                    </button>
                    <span>/</span>
                    <span className="text-zinc-500">Entity Master</span>
                    <span>/</span>
                    <span className="text-white">
                      {entity.profile.entityCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <h1 className="text-4xl tracking-tight text-white">
                      {entity.profile.legalEntityName}
                    </h1>
                    <NexusBadge
                      variant={
                        entity.validation.status === 'VERIFIED'
                          ? 'success'
                          : 'warning'
                      }
                    >
                      {entity.validation.status}
                    </NexusBadge>
                  </div>

                  <p className="font-mono text-sm text-zinc-500">
                    {entity.profile.entityCode} ·{' '}
                    {entity.profile.countryOfIncorporation} ·{' '}
                    {entity.profile.status}
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
                          {changedTabsCount}{' '}
                          {changedTabsCount === 1 ? 'tab' : 'tabs'} unsaved
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={handleSaveAll}
                    disabled={!hasAnyChanges}
                    className={`relative h-10 border px-4 font-mono text-[10px] uppercase tracking-[0.15em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
                      hasAnyChanges
                        ? 'border-emerald-500 bg-emerald-950/20 text-emerald-500 hover:bg-emerald-900/20'
                        : 'cursor-not-allowed border-[#1F1F1F] bg-[#050505] text-zinc-700'
                    } `}
                  >
                    {hasAnyChanges && (
                      <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
                    )}
                    <div className="flex items-center gap-2">
                      <Save className="h-3 w-3" />
                      <span>Save All</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Governance Completeness Banner */}
              {entity.computed.governanceCompleteness < 100 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="border border-amber-500/40 bg-amber-950/10 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <div>
                        <div className="mb-0.5 font-mono text-[11px] text-amber-500">
                          Governance Incomplete (
                          {entity.computed.governanceCompleteness}%)
                        </div>
                        <div className="text-[9px] text-zinc-600">
                          Missing:{' '}
                          {entity.computed.missingGovernanceItems.join(', ')}
                        </div>
                      </div>
                    </div>
                    <div className="font-mono text-[9px] text-amber-400">
                      ⚠️ Cannot consolidate until verified
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* ================================================================ */}
          {/* TAB NAVIGATION */}
          {/* ================================================================ */}
          <div className="flex items-center gap-2 border-b border-[#1F1F1F]">
            {[
              { id: 'profile', label: 'Profile', icon: Building2 },
              { id: 'ownership', label: 'Ownership & Capital', icon: Users },
              { id: 'officers', label: 'Officers & Board', icon: Shield },
              {
                id: 'documents',
                label: 'Documents & Validation',
                icon: FileText,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`relative px-4 py-3 font-mono text-[10px] uppercase tracking-wider transition-colors focus-visible:outline-none ${activeTab === tab.id ? 'text-emerald-500' : 'text-zinc-500 hover:text-white'} `}
              >
                <div className="flex items-center gap-2">
                  <tab.icon className="h-3 w-3" />
                  <span>{tab.label}</span>
                  {tabStates[tab.id as TabId].isDirty && (
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  )}
                </div>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-500"
                  />
                )}
              </button>
            ))}
          </div>

          {/* ================================================================ */}
          {/* TAB CONTENT */}
          {/* ================================================================ */}
          <div className="pb-20">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <ProfileTab
                  key="profile"
                  entity={entity}
                  onDirty={() => markTabDirty('profile')}
                  onSave={() => handleTabSave('profile')}
                  onRevert={() => handleTabRevert('profile')}
                  tabState={tabStates.profile}
                />
              )}

              {activeTab === 'ownership' && (
                <OwnershipTab
                  key="ownership"
                  entity={entity}
                  onDirty={() => markTabDirty('ownership')}
                  onSave={() => handleTabSave('ownership')}
                  onRevert={() => handleTabRevert('ownership')}
                  tabState={tabStates.ownership}
                />
              )}

              {activeTab === 'officers' && (
                <OfficersTab
                  key="officers"
                  entity={entity}
                  onDirty={() => markTabDirty('officers')}
                  onSave={() => handleTabSave('officers')}
                  onRevert={() => handleTabRevert('officers')}
                  tabState={tabStates.officers}
                />
              )}

              {activeTab === 'documents' && (
                <DocumentsTab
                  key="documents"
                  entity={entity}
                  onDirty={() => markTabDirty('documents')}
                  onSave={() => handleTabSave('documents')}
                  onRevert={() => handleTabRevert('documents')}
                  tabState={tabStates.documents}
                />
              )}
            </AnimatePresence>
          </div>

          {/* ================================================================ */}
          {/* STICKY FOOTER */}
          {/* ================================================================ */}
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#1F1F1F] bg-[#0A0A0A]">
            <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4">
              <div className="font-mono text-[9px] text-zinc-600">
                Last modified:{' '}
                {new Date(entity.profile.lastModifiedAt).toLocaleString()} by{' '}
                {entity.profile.lastModifiedBy}
              </div>

              {hasAnyChanges && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTabRevert(activeTab)}
                    className="flex h-9 items-center gap-1 border border-[#1F1F1F] bg-[#050505] px-3 font-mono text-[9px] uppercase tracking-wider text-zinc-500 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/40"
                  >
                    <X className="h-3 w-3" />
                    Revert
                  </button>
                  <button
                    onClick={() => handleTabSave(activeTab)}
                    disabled={tabStates[activeTab].isSaving}
                    className="flex h-9 items-center gap-1 border border-emerald-500 bg-[#050505] px-3 font-mono text-[9px] uppercase tracking-wider text-emerald-500 transition-colors hover:bg-emerald-950/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                  >
                    {tabStates[activeTab].isSaving ? (
                      <>
                        <div className="h-3 w-3 animate-spin rounded-full border border-emerald-500 border-t-transparent" />
                        Saving
                      </>
                    ) : (
                      <>
                        <Save className="h-3 w-3" />
                        Save{' '}
                        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MetaAppShell>
  )
}

// ============================================================================
// TAB A: PROFILE
// ============================================================================

function ProfileTab({
  entity,
  onDirty,
  onSave,
  onRevert,
  tabState,
}: {
  entity: EntityGovernance
  onDirty: () => void
  onSave: () => void
  onRevert: () => void
  tabState: TabState
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-12 gap-6"
    >
      {/* Identity Section */}
      <CardSection
        className="col-span-12 md:col-span-6"
        icon={Building2}
        title="Identity"
        compact
        saveState={tabState}
        onSave={onSave}
        onRevert={onRevert}
      >
        <div className="space-y-2.5">
          <div>
            <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-zinc-600">
              Legal Entity Name *
            </label>
            <input
              type="text"
              defaultValue={entity.profile.legalEntityName}
              onChange={onDirty}
              className="h-9 w-full border border-[#1F1F1F] bg-[#050505] px-3 text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-zinc-600">
              Trading Name
            </label>
            <input
              type="text"
              defaultValue={entity.profile.tradingName}
              onChange={onDirty}
              className="h-9 w-full border border-[#1F1F1F] bg-[#050505] px-3 text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                Entity Code *
              </label>
              <input
                type="text"
                defaultValue={entity.profile.entityCode}
                onChange={onDirty}
                className="focus-ring-emerald-500/40 h-9 w-full border border-[#1F1F1F] bg-[#050505] px-3 font-mono text-[11px] text-white focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                Entity Type *
              </label>
              <select
                defaultValue={entity.profile.entityType}
                onChange={onDirty}
                className="h-9 w-full border border-[#1F1F1F] bg-[#050505] px-3 text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <option>Holding</option>
                <option>Subsidiary</option>
                <option>Branch</option>
                <option>JV</option>
                <option>Associate</option>
              </select>
            </div>
          </div>
        </div>
      </CardSection>

      {/* Registry Section */}
      <CardSection
        className="col-span-12 md:col-span-6"
        icon={FileText}
        title="Registry"
        compact
        saveState={tabState}
        onSave={onSave}
        onRevert={onRevert}
      >
        <div className="space-y-2.5">
          <div>
            <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-zinc-600">
              Registration Number *
            </label>
            <input
              type="text"
              defaultValue={entity.profile.registrationNumber}
              onChange={onDirty}
              className="h-9 w-full border border-[#1F1F1F] bg-[#050505] px-3 font-mono text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-zinc-600">
              Tax ID *
            </label>
            <input
              type="text"
              defaultValue={entity.profile.taxId}
              onChange={onDirty}
              className="h-9 w-full border border-[#1F1F1F] bg-[#050505] px-3 font-mono text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-zinc-600">
              Incorporation Date *
            </label>
            <input
              type="date"
              defaultValue={entity.profile.incorporationDate}
              onChange={onDirty}
              className="h-9 w-full border border-[#1F1F1F] bg-[#050505] px-3 font-mono text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
        </div>
      </CardSection>

      {/* Geography Section */}
      <CardSection
        className="col-span-12 md:col-span-6"
        icon={Building2}
        title="Geography"
        compact
        saveState={tabState}
        onSave={onSave}
        onRevert={onRevert}
      >
        <div className="space-y-2.5">
          <div>
            <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-zinc-600">
              Country of Incorporation *
            </label>
            <input
              type="text"
              defaultValue={entity.profile.countryOfIncorporation}
              onChange={onDirty}
              className="h-9 w-full border border-[#1F1F1F] bg-[#050505] px-3 text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-zinc-600">
              Country of Operations *
            </label>
            <input
              type="text"
              defaultValue={entity.profile.countryOfOperations}
              onChange={onDirty}
              className="h-9 w-full border border-[#1F1F1F] bg-[#050505] px-3 text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
        </div>
      </CardSection>

      {/* Accounting Section */}
      <CardSection
        className="col-span-12 md:col-span-6"
        icon={FileText}
        title="Currency & Accounting"
        compact
        saveState={tabState}
        onSave={onSave}
        onRevert={onRevert}
      >
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                Base Currency *
              </label>
              <input
                type="text"
                defaultValue={entity.profile.baseCurrency}
                onChange={onDirty}
                className="h-9 w-full border border-[#1F1F1F] bg-[#050505] px-3 font-mono text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                Reporting Currency *
              </label>
              <input
                type="text"
                defaultValue={entity.profile.reportingCurrency}
                onChange={onDirty}
                className="h-9 w-full border border-[#1F1F1F] bg-[#050505] px-3 font-mono text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-zinc-600">
              Accounting Framework *
            </label>
            <select
              defaultValue={entity.profile.accountingFramework}
              onChange={onDirty}
              className="h-9 w-full border border-[#1F1F1F] bg-[#050505] px-3 text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <option>IFRS</option>
              <option>MFRS</option>
              <option>US GAAP</option>
              <option>Local GAAP</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-zinc-600">
              Fiscal Year End *
            </label>
            <input
              type="text"
              defaultValue={entity.profile.fiscalYearEnd}
              onChange={onDirty}
              placeholder="e.g., 31 Dec"
              className="h-9 w-full border border-[#1F1F1F] bg-[#050505] px-3 text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
        </div>
      </CardSection>
    </motion.div>
  )
}

// ============================================================================
// TAB B: OWNERSHIP & CAPITAL
// ============================================================================

function OwnershipTab({
  entity,
  onDirty,
  onSave,
  onRevert,
  tabState,
}: {
  entity: EntityGovernance
  onDirty: () => void
  onSave: () => void
  onRevert: () => void
  tabState: TabState
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-12 gap-6"
    >
      {/* Shareholding Table */}
      <CardSection
        className="col-span-12"
        icon={Users}
        title="Shareholding Structure"
        subtitle={`${entity.shareholders.length} shareholders`}
        compact
        headerActions={
          <button
            onClick={onDirty}
            className="flex h-7 items-center gap-1 border border-[#1F1F1F] bg-[#050505] px-2.5 font-mono text-[9px] uppercase tracking-wider text-emerald-500 transition-colors hover:border-emerald-900/40 focus:ring-emerald-500/40 focus-visible:outline-none focus-visible:ring-2"
          >
            <Plus className="h-3 w-3" />
            Add Shareholder
          </button>
        }
        saveState={tabState}
        onSave={onSave}
        onRevert={onRevert}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-[#1F1F1F]">
                <th className="px-3 py-2 text-left font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                  Shareholder
                </th>
                <th className="px-3 py-2 text-left font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                  Type
                </th>
                <th className="px-3 py-2 text-left font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                  Country
                </th>
                <th className="px-3 py-2 text-right font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                  Ownership %
                </th>
                <th className="px-3 py-2 text-left font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                  Share Class
                </th>
                <th className="px-3 py-2 text-left font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                  Related Party
                </th>
                <th className="px-3 py-2 text-center font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {entity.shareholders.map((sh, idx) => (
                <tr
                  key={idx}
                  className="border-b border-[#1F1F1F] hover:bg-[#0A0A0A]"
                >
                  <td className="px-3 py-2 text-white">{sh.name}</td>
                  <td className="px-3 py-2 text-zinc-500">{sh.type}</td>
                  <td className="px-3 py-2 font-mono text-zinc-500">
                    {sh.country}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-white">
                    {sh.ownershipPercent}%
                  </td>
                  <td className="px-3 py-2 text-zinc-500">{sh.shareClass}</td>
                  <td className="px-3 py-2">
                    <NexusBadge
                      variant={sh.isRelatedParty ? 'warning' : 'neutral'}
                      size="sm"
                    >
                      {sh.isRelatedParty ? 'Yes' : 'No'}
                    </NexusBadge>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={onDirty}
                      className="p-1 text-emerald-500 hover:text-emerald-400 focus-visible:text-emerald-400 focus-visible:outline-none"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#1F1F1F]">
                <td
                  colSpan={3}
                  className="px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-zinc-600"
                >
                  Total
                </td>
                <td className="px-3 py-2 text-right font-mono text-white">
                  {entity.computed.totalOwnership}%
                </td>
                <td colSpan={3} className="px-3 py-2">
                  {entity.computed.ownershipBalance !== 0 && (
                    <span className="text-[9px] text-amber-500">
                      ⚠️ Balance: {entity.computed.ownershipBalance}%
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardSection>

      {/* Consolidation Profile */}
      <CardSection
        className="col-span-12 md:col-span-6"
        icon={Building2}
        title="Consolidation Profile"
        compact
        saveState={tabState}
        onSave={onSave}
        onRevert={onRevert}
      >
        <div className="space-y-2.5">
          <div>
            <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-zinc-600">
              Consolidation Method
            </label>
            <select
              defaultValue={entity.consolidation.actualMethod}
              onChange={onDirty}
              className="h-9 w-full border border-[#1F1F1F] bg-[#050505] px-3 text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <option>Full</option>
              <option>Equity</option>
              <option>Proportionate</option>
              <option>None</option>
            </select>
            <div className="mt-1 text-[9px] text-zinc-600">
              Suggested: {entity.consolidation.suggestedMethod} (based on{' '}
              {entity.consolidation.totalParentOwnership}% ownership)
            </div>
          </div>
          <div>
            <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-zinc-600">
              Control Basis
            </label>
            <select
              defaultValue={entity.consolidation.controlBasis}
              onChange={onDirty}
              className="h-9 w-full border border-[#1F1F1F] bg-[#050505] px-3 text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <option>Voting Rights</option>
              <option>Contractual</option>
              <option>De facto</option>
              <option>None</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                Parent Ownership
              </label>
              <input
                type="text"
                value={`${entity.consolidation.totalParentOwnership}%`}
                readOnly
                className="h-9 w-full border border-[#1F1F1F] bg-[#050505] px-3 font-mono text-[11px] text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                NCI %
              </label>
              <input
                type="text"
                value={`${entity.consolidation.nciPercent}%`}
                readOnly
                className="h-9 w-full border border-[#1F1F1F] bg-[#050505] px-3 font-mono text-[11px] text-white focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                defaultChecked={entity.consolidation.inConsolidationScope}
                onChange={onDirty}
                className="h-4 w-4 border border-[#1F1F1F] bg-[#050505] text-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
              />
              <span className="text-[10px] text-white">
                Include in Consolidation Scope
              </span>
            </label>
          </div>
        </div>
      </CardSection>

      {/* Capital Structure */}
      <CardSection
        className="col-span-12 md:col-span-6"
        icon={FileText}
        title="Capital Structure"
        compact
        saveState={tabState}
        onSave={onSave}
        onRevert={onRevert}
      >
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                Authorized Capital
              </label>
              <input
                type="number"
                defaultValue={entity.capital.authorizedCapital}
                onChange={onDirty}
                className="h-9 w-full border border-[#1F1F1F] bg-[#050505] px-3 font-mono text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                Currency
              </label>
              <input
                type="text"
                defaultValue={entity.capital.authorizedCurrency}
                onChange={onDirty}
                className="h-9 w-full border border-[#1F1F1F] bg-[#050505] px-3 font-mono text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                Paid-up Capital
              </label>
              <input
                type="number"
                defaultValue={entity.capital.paidUpCapital}
                onChange={onDirty}
                className="h-9 w-full border border-[#1F1F1F] bg-[#050505] px-3 font-mono text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                Total Shares
              </label>
              <input
                type="number"
                defaultValue={entity.capital.totalShares}
                onChange={onDirty}
                className="h-9 w-full border border-[#1F1F1F] bg-[#050505] px-3 font-mono text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
          </div>
        </div>
      </CardSection>
    </motion.div>
  )
}

// ============================================================================
// TAB C: OFFICERS & BOARD
// ============================================================================

function OfficersTab({
  entity,
  onDirty,
  onSave,
  onRevert,
  tabState,
}: {
  entity: EntityGovernance
  onDirty: () => void
  onSave: () => void
  onRevert: () => void
  tabState: TabState
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-12 gap-6"
    >
      {/* Legal Representatives */}
      <CardSection
        className="col-span-12 md:col-span-6"
        icon={Shield}
        title="Legal Representatives"
        subtitle={`${entity.legalRepresentatives.filter((r) => r.isActive).length} active`}
        compact
        headerActions={
          <button
            onClick={onDirty}
            className="flex h-7 items-center gap-1 border border-[#1F1F1F] bg-[#050505] px-2.5 font-mono text-[9px] uppercase tracking-wider text-emerald-500 transition-colors hover:border-emerald-900/40 focus:ring-emerald-500/40 focus-visible:outline-none focus-visible:ring-2"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        }
        saveState={tabState}
        onSave={onSave}
        onRevert={onRevert}
      >
        <div className="space-y-2">
          {entity.legalRepresentatives
            .filter((r) => r.isActive)
            .map((rep, idx) => (
              <div
                key={idx}
                className="border border-[#1F1F1F] bg-[#050505] p-2.5 transition-colors hover:bg-[#0A0A0A]"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] text-white">
                    {rep.personName}
                  </span>
                  <NexusBadge variant="success" size="sm">
                    Active
                  </NexusBadge>
                </div>
                <div className="text-[9px] text-zinc-600">{rep.roleTitle}</div>
                <div className="font-mono text-[9px] text-zinc-600">
                  Since: {rep.appointmentDate}
                </div>
              </div>
            ))}
        </div>
      </CardSection>

      {/* Board of Directors */}
      <CardSection
        className="col-span-12 md:col-span-6"
        icon={Users}
        title="Board of Directors"
        subtitle={`${entity.board.filter((b) => b.isActive).length} active directors`}
        compact
        headerActions={
          <button
            onClick={onDirty}
            className="flex h-7 items-center gap-1 border border-[#1F1F1F] bg-[#050505] px-2.5 font-mono text-[9px] uppercase tracking-wider text-emerald-500 transition-colors hover:border-emerald-900/40 focus:ring-emerald-500/40 focus-visible:outline-none focus-visible:ring-2"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        }
        saveState={tabState}
        onSave={onSave}
        onRevert={onRevert}
      >
        <div className="space-y-2">
          {entity.board
            .filter((b) => b.isActive)
            .map((director, idx) => (
              <div
                key={idx}
                className="border border-[#1F1F1F] bg-[#050505] p-2.5 transition-colors hover:bg-[#0A0A0A]"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] text-white">
                    {director.personName}
                  </span>
                  <div className="flex items-center gap-1">
                    <NexusBadge variant="neutral" size="sm">
                      {director.role}
                    </NexusBadge>
                    {director.isIndependent && (
                      <NexusBadge variant="success" size="sm">
                        Ind.
                      </NexusBadge>
                    )}
                  </div>
                </div>
                {director.committeeRoles.length > 0 && (
                  <div className="text-[9px] text-zinc-600">
                    Committees: {director.committeeRoles.join(', ')}
                  </div>
                )}
              </div>
            ))}
        </div>
      </CardSection>

      {/* Key Officers */}
      <CardSection
        className="col-span-12 md:col-span-6"
        icon={Users}
        title="Key Officers"
        subtitle={`${entity.keyOfficers.filter((o) => o.isActive).length} active`}
        compact
        headerActions={
          <button
            onClick={onDirty}
            className="flex h-7 items-center gap-1 border border-[#1F1F1F] bg-[#050505] px-2.5 font-mono text-[9px] uppercase tracking-wider text-emerald-500 transition-colors hover:border-emerald-900/40 focus:ring-emerald-500/40 focus-visible:outline-none focus-visible:ring-2"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        }
        saveState={tabState}
        onSave={onSave}
        onRevert={onRevert}
      >
        <div className="space-y-2">
          {entity.keyOfficers
            .filter((o) => o.isActive)
            .map((officer, idx) => (
              <div
                key={idx}
                className="border border-[#1F1F1F] bg-[#050505] p-2.5 transition-colors hover:bg-[#0A0A0A]"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] text-white">
                    {officer.personName}
                  </span>
                  <NexusBadge variant="neutral" size="sm">
                    {officer.role}
                  </NexusBadge>
                </div>
                <div className="font-mono text-[9px] text-zinc-600">
                  Since: {officer.appointmentDate}
                </div>
              </div>
            ))}
        </div>
      </CardSection>

      {/* Principal Banks */}
      <CardSection
        className="col-span-12 md:col-span-6"
        icon={Building2}
        title="Principal Banks"
        subtitle={`${entity.principalBanks.length} relationships`}
        compact
        headerActions={
          <button
            onClick={onDirty}
            className="flex h-7 items-center gap-1 border border-[#1F1F1F] bg-[#050505] px-2.5 font-mono text-[9px] uppercase tracking-wider text-emerald-500 transition-colors hover:border-emerald-900/40 focus:ring-emerald-500/40 focus-visible:outline-none focus-visible:ring-2"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        }
        saveState={tabState}
        onSave={onSave}
        onRevert={onRevert}
      >
        <div className="space-y-2">
          {entity.principalBanks.map((bank, idx) => (
            <div
              key={idx}
              className="border border-[#1F1F1F] bg-[#050505] p-2.5 transition-colors hover:bg-[#0A0A0A]"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] text-white">{bank.bankName}</span>
                <div className="flex items-center gap-1">
                  <NexusBadge variant="neutral" size="sm">
                    {bank.relationshipType}
                  </NexusBadge>
                  {bank.isPrimaryBank && (
                    <NexusBadge variant="success" size="sm">
                      Primary
                    </NexusBadge>
                  )}
                </div>
              </div>
              <div className="text-[9px] text-zinc-600">
                {bank.branch} · {bank.country}
              </div>
              {bank.accountNumber && (
                <div className="font-mono text-[9px] text-zinc-600">
                  A/C: {bank.accountNumber}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardSection>
    </motion.div>
  )
}

// ============================================================================
// TAB D: DOCUMENTS & VALIDATION
// ============================================================================

function DocumentsTab({
  entity,
  onDirty,
  onSave,
  onRevert,
  tabState,
}: {
  entity: EntityGovernance
  onDirty: () => void
  onSave: () => void
  onRevert: () => void
  tabState: TabState
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-12 gap-6"
    >
      {/* Document Repository */}
      <CardSection
        className="col-span-12 md:col-span-8"
        icon={FileText}
        title="Document Repository"
        subtitle={`${entity.documents.length} documents`}
        compact
        headerActions={
          <button
            onClick={onDirty}
            className="flex h-7 items-center gap-1 border border-[#1F1F1F] bg-[#050505] px-2.5 font-mono text-[9px] uppercase tracking-wider text-emerald-500 transition-colors hover:border-emerald-900/40 focus:ring-emerald-500/40 focus-visible:outline-none focus-visible:ring-2"
          >
            <Upload className="h-3 w-3" />
            Upload
          </button>
        }
        saveState={tabState}
        onSave={onSave}
        onRevert={onRevert}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-[#1F1F1F]">
                <th className="px-3 py-2 text-left font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                  Document Type
                </th>
                <th className="px-3 py-2 text-left font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                  Name
                </th>
                <th className="px-3 py-2 text-left font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                  Uploaded
                </th>
                <th className="px-3 py-2 text-center font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                  Verified
                </th>
                <th className="px-3 py-2 text-center font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {entity.documents.map((doc, idx) => (
                <tr
                  key={idx}
                  className="border-b border-[#1F1F1F] hover:bg-[#0A0A0A]"
                >
                  <td className="px-3 py-2 text-zinc-500">
                    {doc.documentType}
                  </td>
                  <td className="px-3 py-2 text-white">{doc.documentName}</td>
                  <td className="px-3 py-2 font-mono text-zinc-600">
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <NexusBadge
                      variant={doc.isVerified ? 'success' : 'neutral'}
                      size="sm"
                    >
                      {doc.isVerified ? '✓' : '—'}
                    </NexusBadge>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button className="p-1 text-emerald-500 hover:text-emerald-400 focus-visible:text-emerald-400 focus-visible:outline-none">
                      <Download className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardSection>

      {/* Validation Status Panel */}
      <CardSection
        className="col-span-12 md:col-span-4"
        icon={CheckCircle2}
        title="Validation Status"
        compact
        badge={
          <NexusBadge
            variant={
              entity.validation.status === 'VERIFIED' ? 'success' : 'warning'
            }
          >
            {entity.validation.status}
          </NexusBadge>
        }
        saveState={tabState}
        onSave={onSave}
        onRevert={onRevert}
      >
        <div className="space-y-3">
          <div className="border border-[#1F1F1F] bg-[#050505] p-3">
            <div className="mb-2 font-mono text-[9px] uppercase tracking-wider text-zinc-600">
              Current Status
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-600">Status</span>
                <span
                  className={`font-mono ${
                    entity.validation.status === 'VERIFIED'
                      ? 'text-emerald-500'
                      : 'text-amber-500'
                  }`}
                >
                  {entity.validation.status}
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-600">Level</span>
                <span className="font-mono text-white">
                  {entity.validation.level}
                </span>
              </div>
              {entity.validation.verifiedBy && (
                <>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-zinc-600">Verified By</span>
                    <span className="text-white">
                      {entity.validation.verifiedByName}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-zinc-600">Verified At</span>
                    <span className="font-mono text-[9px] text-white">
                      {entity.validation.verifiedAt &&
                        new Date(
                          entity.validation.verifiedAt
                        ).toLocaleDateString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Validation Actions */}
          {entity.validation.status === 'PENDING_REVIEW' && (
            <div className="space-y-2">
              <button
                onClick={onDirty}
                className="h-9 w-full border border-emerald-500 bg-[#050505] px-3 font-mono text-[10px] uppercase tracking-wider text-emerald-500 transition-colors hover:bg-emerald-950/20 focus:ring-emerald-500/40 focus-visible:outline-none focus-visible:ring-2"
              >
                Approve (L2 Verification)
              </button>
              <button
                onClick={onDirty}
                className="h-9 w-full border border-red-500 bg-[#050505] px-3 font-mono text-[10px] uppercase tracking-wider text-red-500 transition-colors hover:bg-red-950/20 focus:ring-red-500/40 focus-visible:outline-none focus-visible:ring-2"
              >
                Reject
              </button>
            </div>
          )}

          {entity.validation.status === 'VERIFIED' && (
            <div className="border border-emerald-500/40 bg-emerald-950/10 p-3">
              <div className="mb-1 text-[10px] text-emerald-500">
                ✓ Entity Verified
              </div>
              <div className="text-[9px] text-zinc-600">
                Can be included in consolidation scope
              </div>
            </div>
          )}
        </div>
      </CardSection>
    </motion.div>
  )
}
