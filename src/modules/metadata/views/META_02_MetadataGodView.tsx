// ============================================================================
// META_02 - REGISTRY // GOD VIEW
// WHERE AM I? Global search & metadata hunting
// Keyboard Shortcut: Cmd+2 / Ctrl+2
// Route: /meta-registry
// ============================================================================
// ðŸŽ¯ DOGFOODING MOMENT:
// This view displays metadata records using columns GENERATED from a schema.
// The table showing schemas is built USING a schema. It's self-describing.
// ============================================================================
// PHILOSOPHY: "Protect. Correct. React."
// - If we add a field to REGISTRY_SCHEMA, the table updates automatically
// - Zero UI maintenance for column changes
// - Visual consistency across all modules via Kernel definitions
// ============================================================================

import { useState, useMemo } from 'react'
import { MetaAppShell } from '@/components/shell/MetaAppShell'
import { MetaPageHeader } from '@/components/MetaPageHeader'
import { SuperTable } from '@/modules/metadata/components/SuperTable'
import { FlexibleFilterBar } from '@/modules/metadata/components/FlexibleFilterBar'
import { DetailDrawer } from '@/modules/metadata/components/DetailDrawer'
import { MetadataRequestForm } from '@/modules/metadata/components/MetadataRequestForm'
import { mockMetadataRecords } from '@/mock-data/mockMetadata'
import { MetadataRecord } from '@/modules/metadata/types/metadata'
import { Database, Filter, Shield, Zap, Plus } from 'lucide-react'

// âš™ï¸ THE KERNEL MAGIC
import {
  generateColumnsFromSchema,
  MetadataField,
  STATUS_PRESETS,
} from '@/modules/metadata/kernel'

// ============================================================================
// 1. THE META-SCHEMA (Defining the Registry Table)
// ============================================================================
// This describes the columns for the "God View" itself.
// The table showing metadata is built USING metadata. Self-describing!
// ============================================================================

const REGISTRY_SCHEMA: MetadataField[] = [
  {
    technical_name: 'dict_id',
    business_term: 'ID',
    data_type: 'code',
    is_critical: true,
    width: 100,
    description: 'Unique metadata identifier',
    canon_id: 'META_DICT_ID',
  },
  {
    technical_name: 'business_term',
    business_term: 'Business Term',
    data_type: 'text',
    width: 180,
    description: 'Human-readable name for the metadata entry',
    canon_id: 'META_BIZ_TERM',
  },
  {
    technical_name: 'technical_name',
    business_term: 'Tech Name',
    data_type: 'code',
    width: 160,
    description: 'System/database identifier',
    canon_id: 'META_TECH_NAME',
  },
  {
    technical_name: 'data_type_tech',
    business_term: 'Type',
    data_type: 'status',
    width: 100,
    description: 'Technical data type',
    status_config: {
      'VARCHAR(255)': 'bg-blue-900/30 text-blue-400 border-blue-800',
      'DECIMAL(18,2)': 'bg-emerald-900/30 text-emerald-400 border-emerald-800',
      TIMESTAMP: 'bg-orange-900/30 text-orange-400 border-orange-800',
      BOOLEAN: 'bg-purple-900/30 text-purple-400 border-purple-800',
      INTEGER: 'bg-cyan-900/30 text-cyan-400 border-cyan-800',
    },
  },
  {
    technical_name: 'domain',
    business_term: 'Domain',
    data_type: 'text',
    width: 100,
    description: 'Business domain this metadata belongs to',
  },
  {
    technical_name: 'entity_group',
    business_term: 'Entity Group',
    data_type: 'text',
    width: 120,
    description: 'Category of data entity',
  },
  {
    technical_name: 'canon_status',
    business_term: 'Status',
    data_type: 'status',
    width: 100,
    description: 'Canon lock state',
    status_config: STATUS_PRESETS.canonStatus,
  },
  {
    technical_name: 'data_owner',
    business_term: 'Owner',
    data_type: 'text',
    width: 120,
    description: 'Business owner responsible for this metadata',
  },
  {
    technical_name: 'criticality',
    business_term: 'Criticality',
    data_type: 'status',
    is_critical: true,
    width: 100,
    description: 'Business impact level',
    status_config: STATUS_PRESETS.criticality,
  },
]

// ============================================================================
// 2. FILTER DIMENSION TYPE (for FlexibleFilterBar)
// ============================================================================

interface FilterDimension {
  id: string
  field: {
    key: keyof MetadataRecord
    label: string
    type: 'select' | 'text' | 'multi'
  }
  selectedValues: string[]
}

// ============================================================================
// 3. MAIN COMPONENT
// ============================================================================

export function MetadataGodView() {
  // === STATE MANAGEMENT ===
  const [activeDimensions, setActiveDimensions] = useState<FilterDimension[]>(
    []
  )
  const [selectedRecord, setSelectedRecord] = useState<MetadataRecord | null>(
    null
  )
  const [selectedRows, setSelectedRows] = useState<MetadataRecord[]>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false) // Governance Request Mode

  // === THE GENERATOR (The Holy Grail) ===
  // Columns are auto-generated from schema - no hardcoding!
  const schemaColumns = useMemo(
    () => generateColumnsFromSchema<MetadataRecord>(REGISTRY_SCHEMA),
    []
  )

  // === FILTER LOGIC ===
  const filteredData = useMemo(() => {
    let result = [...mockMetadataRecords]

    activeDimensions.forEach((dimension) => {
      if (dimension.selectedValues.length === 0) return

      result = result.filter((record) => {
        const value = record[dimension.field.key]

        // Handle array values (like tags)
        if (Array.isArray(value)) {
          return dimension.selectedValues.some((filterVal) =>
            value.join(', ').includes(filterVal)
          )
        }

        // Handle single values
        const stringValue = String(value)
        return dimension.selectedValues.includes(stringValue)
      })
    })

    return result
  }, [activeDimensions])

  // === STATISTICS ===
  const stats = useMemo(
    () => ({
      total: mockMetadataRecords.length,
      filtered: filteredData.length,
      locked: filteredData.filter((r) => r.canon_status === 'LOCKED').length,
      critical: filteredData.filter((r) => r.criticality === 'CRITICAL').length,
    }),
    [filteredData]
  )

  // === EVENT HANDLERS ===
  const handleRowClick = (record: MetadataRecord) => {
    setSelectedRecord(record)
    setIsDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
  }

  const handleClearAllFilters = () => {
    setActiveDimensions([])
  }

  // === RENDER ===
  return (
    <MetaAppShell>
      <div className="mx-auto max-w-[1600px] px-6 py-8 md:px-12 md:py-12">
        {/* PAGE HEADER */}
        <MetaPageHeader
          variant="document"
          code="META_02"
          title="REGISTRY // GOD VIEW"
          subtitle="UNIVERSAL SEARCH"
          description="Complete inventory of all metadata objects, schemas, and relationships. This view is schema-driven."
        />

        {/* SCHEMA-DRIVEN BADGE + REGISTER BUTTON */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 rounded border border-[#28E7A2]/30 bg-[#28E7A2]/10 px-3 py-1.5">
            <Zap className="h-3.5 w-3.5 text-[#28E7A2]" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#28E7A2]">
              Schema-Driven â€¢ {REGISTRY_SCHEMA.length} Columns Auto-Generated
            </span>
          </div>

          {/* GOVERNANCE: Register New Metadata */}
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 rounded-lg bg-[#28E7A2] px-4 py-2 font-mono text-xs font-bold text-black transition-colors hover:bg-[#28E7A2]/80"
          >
            <Plus className="h-4 w-4" />
            <span>Register Metadata</span>
          </button>
        </div>

        {/* STATISTICS BAR */}
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded border border-[#1F1F1F] bg-[#0A0A0A] p-4">
            <div className="mb-2 flex items-center gap-2">
              <Database className="h-4 w-4 text-[#666]" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                Total Records
              </span>
            </div>
            <div className="font-mono text-2xl text-white">{stats.total}</div>
          </div>

          <div className="rounded border border-[#1F1F1F] bg-[#0A0A0A] p-4">
            <div className="mb-2 flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#666]" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                Filtered View
              </span>
            </div>
            <div className="font-mono text-2xl text-white">
              {stats.filtered}
            </div>
          </div>

          <div className="rounded border border-[#1F1F1F] bg-[#0A0A0A] p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#28E7A2]" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                Locked
              </span>
            </div>
            <div className="font-mono text-2xl text-[#28E7A2]">
              {stats.locked}
            </div>
          </div>

          <div className="rounded border border-[#1F1F1F] bg-[#0A0A0A] p-4">
            <div className="mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#FF4D4D]" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                Critical
              </span>
            </div>
            <div className="font-mono text-2xl text-[#FF4D4D]">
              {stats.critical}
            </div>
          </div>
        </div>

        {/* FLEXIBLE FILTER BAR */}
        <div className="mt-8">
          <FlexibleFilterBar
            data={mockMetadataRecords}
            activeDimensions={activeDimensions}
            onDimensionsChange={setActiveDimensions}
            onClearAll={handleClearAllFilters}
          />
        </div>

        {/* SUPER TABLE - Now with Schema-Generated Columns! */}
        <div className="mt-6">
          <SuperTable<MetadataRecord>
            data={filteredData}
            columns={schemaColumns}
            title="METADATA_REGISTRY"
            mobileKey="business_term"
            onRowClick={handleRowClick}
            // Feature Flags
            enableSelection={true}
            enablePagination={true}
            enableColumnVisibility={true}
            enableColumnFilters={false} // Using FlexibleFilterBar instead
            enableGlobalFilter={true}
            // Selection Handler
            onSelectionChange={setSelectedRows}
          />
        </div>

        {/* BULK ACTION INDICATOR */}
        {selectedRows.length > 0 && (
          <div className="mt-4 flex items-center justify-between rounded border border-[#28E7A2]/30 bg-[#28E7A2]/10 p-4">
            <span className="font-mono text-sm text-[#28E7A2]">
              {selectedRows.length} record{selectedRows.length > 1 ? 's' : ''}{' '}
              selected
            </span>
            <div className="flex gap-2">
              <button className="rounded bg-[#28E7A2] px-3 py-1.5 font-mono text-xs text-black transition-colors hover:bg-[#28E7A2]/80">
                EXPORT SELECTED
              </button>
              <button className="rounded border border-[#28E7A2] px-3 py-1.5 font-mono text-xs text-[#28E7A2] transition-colors hover:bg-[#28E7A2]/10">
                LOCK SELECTED
              </button>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {filteredData.length === 0 && activeDimensions.length > 0 && (
          <div className="mt-6 rounded border border-dashed border-[#1F1F1F] bg-[#0A0A0A]/50 p-6 text-center">
            <p className="text-sm text-[#666]">
              No records match the current filter criteria. Try adjusting your
              filters.
            </p>
          </div>
        )}
      </div>

      {/* DETAIL DRAWER - View Mode */}
      <DetailDrawer
        record={selectedRecord}
        isOpen={isDrawerOpen && !isCreating}
        onClose={handleCloseDrawer}
      />

      {/* GOVERNANCE REQUEST DRAWER - Create/Edit Mode */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCreating(false)}
          />

          {/* Drawer Panel */}
          <div className="relative ml-auto h-full w-full max-w-xl border-l border-[#1F1F1F] bg-[#050505] shadow-2xl">
            <MetadataRequestForm
              onCancel={() => setIsCreating(false)}
              onSubmit={(data) => {
                // TODO: Send to governance API
                console.log('ðŸ“‹ Governance Request Submitted:', data)
                alert(
                  `âœ… Request submitted for "${data.business_term}"\n\nThis would be routed to the Governance Council for approval.`
                )
                setIsCreating(false)
              }}
            />
          </div>
        </div>
      )}
    </MetaAppShell>
  )
}

// Default export for route compatibility
export default MetadataGodView
