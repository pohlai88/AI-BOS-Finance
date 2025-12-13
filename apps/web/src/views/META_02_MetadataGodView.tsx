// ============================================================================
// META_02 - REGISTRY // GOD VIEW
// WHERE AM I? Global search & metadata hunting
// Keyboard Shortcut: Cmd+2 / Ctrl+2
// Route: /meta-registry
// ============================================================================
// 🎯 DOGFOODING MOMENT:
// This view displays metadata records using columns GENERATED from a schema.
// The table showing schemas is built USING a schema. It's self-describing.
// ============================================================================
// PHILOSOPHY: "Protect. Correct. React."
// - If we add a field to REGISTRY_SCHEMA, the table updates automatically
// - Zero UI maintenance for column changes
// - Visual consistency across all modules via Kernel definitions
// ============================================================================

import { useState, useMemo } from 'react';
import { MetaAppShell } from '@/components/shell/MetaAppShell';
import { MetaPageHeader } from '@/components/MetaPageHeader';
import { SuperTable } from '@/components/metadata/SuperTable';
import { FlexibleFilterBar } from '@/components/metadata/FlexibleFilterBar';
import { DetailDrawer } from '@/components/metadata/DetailDrawer';
import { MetadataRequestForm } from '@/components/metadata/MetadataRequestForm';
import { BackendStatus } from '@/components/kernel/BackendStatus';
import { mockMetadataRecords } from '@/data/mockMetadata';
import { MetadataRecord } from '@/types/metadata';
import { Database, Filter, Shield, Zap, Plus } from 'lucide-react';

// ⚙️ THE KERNEL MAGIC
import {
  generateColumnsFromSchema,
  MetadataField,
  STATUS_PRESETS
} from '@/kernel';

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
      'TIMESTAMP': 'bg-orange-900/30 text-orange-400 border-orange-800',
      'BOOLEAN': 'bg-purple-900/30 text-purple-400 border-purple-800',
      'INTEGER': 'bg-cyan-900/30 text-cyan-400 border-cyan-800',
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
];

// ============================================================================
// 2. FILTER DIMENSION TYPE (for FlexibleFilterBar)
// ============================================================================

interface FilterDimension {
  id: string;
  field: {
    key: keyof MetadataRecord;
    label: string;
    type: 'select' | 'text' | 'multi';
  };
  selectedValues: string[];
}

// ============================================================================
// 3. MAIN COMPONENT
// ============================================================================

export function MetadataGodView() {
  // === STATE MANAGEMENT ===
  const [activeDimensions, setActiveDimensions] = useState<FilterDimension[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MetadataRecord | null>(null);
  const [selectedRows, setSelectedRows] = useState<MetadataRecord[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);  // Governance Request Mode

  // === THE GENERATOR (The Holy Grail) ===
  // Columns are auto-generated from schema - no hardcoding!
  const schemaColumns = useMemo(
    () => generateColumnsFromSchema<MetadataRecord>(REGISTRY_SCHEMA),
    []
  );

  // === FILTER LOGIC ===
  const filteredData = useMemo(() => {
    let result = [...mockMetadataRecords];

    activeDimensions.forEach((dimension) => {
      if (dimension.selectedValues.length === 0) return;

      result = result.filter((record) => {
        const value = record[dimension.field.key];

        // Handle array values (like tags)
        if (Array.isArray(value)) {
          return dimension.selectedValues.some((filterVal) =>
            value.join(', ').includes(filterVal)
          );
        }

        // Handle single values
        const stringValue = String(value);
        return dimension.selectedValues.includes(stringValue);
      });
    });

    return result;
  }, [activeDimensions]);

  // === STATISTICS ===
  const stats = useMemo(() => ({
    total: mockMetadataRecords.length,
    filtered: filteredData.length,
    locked: filteredData.filter((r) => r.canon_status === 'LOCKED').length,
    critical: filteredData.filter((r) => r.criticality === 'CRITICAL').length,
  }), [filteredData]);

  // === EVENT HANDLERS ===
  const handleRowClick = (record: MetadataRecord) => {
    setSelectedRecord(record);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleClearAllFilters = () => {
    setActiveDimensions([]);
  };

  // === RENDER ===
  return (
    <MetaAppShell>
      <div className="px-6 py-8 md:px-12 md:py-12 max-w-[1600px] mx-auto">

        {/* PAGE HEADER */}
        <MetaPageHeader
          variant="document"
          code="META_02"
          title="REGISTRY // GOD VIEW"
          subtitle="UNIVERSAL SEARCH"
          description="Complete inventory of all metadata objects, schemas, and relationships. This view is schema-driven."
        />

        {/* BACKEND STATUS - The "Handshake" Component */}
        <div className="mt-4">
          <BackendStatus />
        </div>

        {/* SCHEMA-DRIVEN BADGE + REGISTER BUTTON */}
        <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#28E7A2]/10 border border-[#28E7A2]/30 rounded">
            <Zap className="w-3.5 h-3.5 text-[#28E7A2]" />
            <span className="text-[10px] font-mono text-[#28E7A2] uppercase tracking-wider">
              Schema-Driven • {REGISTRY_SCHEMA.length} Columns Auto-Generated
            </span>
          </div>

          {/* GOVERNANCE: Register New Metadata */}
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#28E7A2] text-black font-mono font-bold text-xs rounded-lg hover:bg-[#28E7A2]/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Register Metadata</span>
          </button>
        </div>

        {/* STATISTICS BAR */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-[#666]" />
              <span className="text-[10px] uppercase tracking-wider text-[#666] font-mono">
                Total Records
              </span>
            </div>
            <div className="text-2xl text-white font-mono">{stats.total}</div>
          </div>

          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-[#666]" />
              <span className="text-[10px] uppercase tracking-wider text-[#666] font-mono">
                Filtered View
              </span>
            </div>
            <div className="text-2xl text-white font-mono">{stats.filtered}</div>
          </div>

          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#28E7A2]" />
              <span className="text-[10px] uppercase tracking-wider text-[#666] font-mono">
                Locked
              </span>
            </div>
            <div className="text-2xl text-[#28E7A2] font-mono">{stats.locked}</div>
          </div>

          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-[#FF4D4D]" />
              <span className="text-[10px] uppercase tracking-wider text-[#666] font-mono">
                Critical
              </span>
            </div>
            <div className="text-2xl text-[#FF4D4D] font-mono">{stats.critical}</div>
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
            enableColumnFilters={false}  // Using FlexibleFilterBar instead
            enableGlobalFilter={true}

            // Selection Handler
            onSelectionChange={setSelectedRows}
          />
        </div>

        {/* BULK ACTION INDICATOR */}
        {selectedRows.length > 0 && (
          <div className="mt-4 p-4 bg-[#28E7A2]/10 border border-[#28E7A2]/30 rounded flex items-center justify-between">
            <span className="text-[#28E7A2] font-mono text-sm">
              {selectedRows.length} record{selectedRows.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-[#28E7A2] text-black font-mono text-xs rounded hover:bg-[#28E7A2]/80 transition-colors">
                EXPORT SELECTED
              </button>
              <button className="px-3 py-1.5 border border-[#28E7A2] text-[#28E7A2] font-mono text-xs rounded hover:bg-[#28E7A2]/10 transition-colors">
                LOCK SELECTED
              </button>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {filteredData.length === 0 && activeDimensions.length > 0 && (
          <div className="mt-6 p-6 border border-dashed border-[#1F1F1F] bg-[#0A0A0A]/50 rounded text-center">
            <p className="text-[#666] text-sm">
              No records match the current filter criteria. Try adjusting your filters.
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
          <div className="relative ml-auto w-full max-w-xl h-full bg-[#050505] border-l border-[#1F1F1F] shadow-2xl">
            <MetadataRequestForm
              onCancel={() => setIsCreating(false)}
              onSubmit={(data) => {
                // TODO: Send to governance API
                console.log('📋 Governance Request Submitted:', data);
                alert(`✅ Request submitted for "${data.business_term}"\n\nThis would be routed to the Governance Council for approval.`);
                setIsCreating(false);
              }}
            />
          </div>
        </div>
      )}
    </MetaAppShell>
  );
}

// Default export for route compatibility
export default MetadataGodView;
