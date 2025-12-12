import { useState } from 'react'
import { MetaAppShell } from '../components/shell/MetaAppShell'
import { MetaPageHeader } from '../components/MetaPageHeader'
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  GitBranch,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  Lock,
  Unlock,
  ChevronRight,
  AlertCircle,
  Network,
  Eye,
  Play,
} from 'lucide-react'
import { AgriMetadataLifecycle } from '../components/AgriMetadataLifecycle'

// Mock real-time data
const SCHEMA_SYSTEMS = [
  {
    id: 'sap-erp',
    name: 'SAP ERP',
    status: 'healthy',
    schemas: 847,
    validated: 847,
    drift: 0,
    lastSync: '2m ago',
    compliance: 100,
    tables: ['VBAK', 'VBAP', 'KNA1', 'MARA'],
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    status: 'warning',
    schemas: 234,
    validated: 231,
    drift: 3,
    lastSync: '5m ago',
    compliance: 98.7,
    tables: ['Account', 'Opportunity', 'Contact', 'Lead'],
    violations: [
      {
        field: 'Account.AnnualRevenue',
        issue: 'Type mismatch: Expected DECIMAL(18,2), found DECIMAL(20,4)',
        severity: 'medium',
        impactedSystems: 3,
        downstreamTables: 12,
      },
    ],
  },
  {
    id: 'snowflake',
    name: 'Snowflake DW',
    status: 'critical',
    schemas: 1203,
    validated: 1189,
    drift: 14,
    lastSync: '12m ago',
    compliance: 98.8,
    tables: ['FACT_SALES', 'DIM_CUSTOMER', 'DIM_PRODUCT'],
    violations: [
      {
        field: 'FACT_SALES.REVENUE_AMT',
        issue: 'Canon violation: Precision changed from (18,2) to (18,4)',
        severity: 'critical',
        impactedSystems: 7,
        downstreamTables: 34,
      },
      {
        field: 'DIM_CUSTOMER.EMAIL',
        issue: 'Missing NOT NULL constraint',
        severity: 'high',
        impactedSystems: 2,
        downstreamTables: 8,
      },
    ],
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    status: 'healthy',
    schemas: 412,
    validated: 412,
    drift: 0,
    lastSync: '1m ago',
    compliance: 100,
    tables: ['orders', 'customers', 'products', 'invoices'],
  },
]

const LIVE_METRICS = {
  totalSchemas: 2696,
  validated: 2679,
  violations: 17,
  systemsMonitored: 4,
  avgCompliance: 99.4,
  lastIncident: '3h ago',
  uptimePercent: 99.97,
}

const RECENT_EVENTS = [
  {
    time: '2m ago',
    system: 'SAP ERP',
    event: 'Schema validation passed',
    severity: 'info',
    table: 'VBAK',
  },
  {
    time: '5m ago',
    system: 'Salesforce',
    event: 'Type drift detected',
    severity: 'warning',
    table: 'Account.AnnualRevenue',
  },
  {
    time: '12m ago',
    system: 'Snowflake DW',
    event: 'Canon violation detected',
    severity: 'critical',
    table: 'FACT_SALES.REVENUE_AMT',
  },
  {
    time: '18m ago',
    system: 'PostgreSQL',
    event: 'Schema validation passed',
    severity: 'info',
    table: 'orders',
  },
  {
    time: '23m ago',
    system: 'Snowflake DW',
    event: 'Constraint violation detected',
    severity: 'high',
    table: 'DIM_CUSTOMER.EMAIL',
  },
]

export function MetadataArchitecturePage() {
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null)
  const [selectedViolation, setSelectedViolation] = useState<{
    system: string
    field: string
  } | null>(null)
  const selected = SCHEMA_SYSTEMS.find((s) => s.id === selectedSystem)

  const violation = selectedViolation
    ? SCHEMA_SYSTEMS.find(
        (s) => s.id === selectedViolation.system
      )?.violations?.find((v) => v.field === selectedViolation.field)
    : null

  return (
    <MetaAppShell>
      <div className="mx-auto max-w-[1800px] px-6 py-8 md:px-12 md:py-12">
        {/* PAGE HEADER */}
        <MetaPageHeader
          variant="document"
          code="META_01"
          title="SCHEMA GOVERNANCE"
          subtitle="CONTROL CENTER"
          description="Real-time monitoring and enforcement of canonical schema definitions across all connected systems."
        />

        {/* LIVE METRICS BAR */}
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          {/* Total Schemas */}
          <div className="rounded border border-[#1F1F1F] bg-[#0A0A0A] p-4">
            <div className="mb-1 flex items-center gap-2">
              <Database className="h-3 w-3 text-[#666]" />
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                Schemas
              </div>
            </div>
            <div className="font-mono text-2xl text-white">
              {LIVE_METRICS.totalSchemas.toLocaleString()}
            </div>
          </div>

          {/* Validated */}
          <div className="rounded border border-[#1F1F1F] bg-[#0A0A0A] p-4">
            <div className="mb-1 flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-[#28E7A2]" />
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                Validated
              </div>
            </div>
            <div className="font-mono text-2xl text-[#28E7A2]">
              {LIVE_METRICS.validated.toLocaleString()}
            </div>
          </div>

          {/* Violations */}
          <div className="rounded border border-[#1F1F1F] bg-[#0A0A0A] p-4">
            <div className="mb-1 flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 text-red-500" />
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                Violations
              </div>
            </div>
            <div className="font-mono text-2xl text-red-500">
              {LIVE_METRICS.violations}
            </div>
          </div>

          {/* Systems */}
          <div className="rounded border border-[#1F1F1F] bg-[#0A0A0A] p-4">
            <div className="mb-1 flex items-center gap-2">
              <Activity className="h-3 w-3 text-blue-500" />
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                Systems
              </div>
            </div>
            <div className="font-mono text-2xl text-blue-400">
              {LIVE_METRICS.systemsMonitored}
            </div>
          </div>

          {/* Compliance */}
          <div className="rounded border border-[#1F1F1F] bg-[#0A0A0A] p-4">
            <div className="mb-1 flex items-center gap-2">
              <Shield className="h-3 w-3 text-[#28E7A2]" />
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                Compliance
              </div>
            </div>
            <div className="font-mono text-2xl text-[#28E7A2]">
              {LIVE_METRICS.avgCompliance}%
            </div>
          </div>

          {/* Uptime */}
          <div className="rounded border border-[#1F1F1F] bg-[#0A0A0A] p-4">
            <div className="mb-1 flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-[#28E7A2]" />
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                Uptime
              </div>
            </div>
            <div className="font-mono text-2xl text-white">
              {LIVE_METRICS.uptimePercent}%
            </div>
          </div>

          {/* Last Incident */}
          <div className="rounded border border-[#1F1F1F] bg-[#0A0A0A] p-4">
            <div className="mb-1 flex items-center gap-2">
              <Clock className="h-3 w-3 text-[#666]" />
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                Last Event
              </div>
            </div>
            <div className="font-mono text-sm text-[#888]">
              {LIVE_METRICS.lastIncident}
            </div>
          </div>
        </div>

        {/* MAIN GRID: Systems + Lifecycle */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* LEFT: SYSTEM BINDINGS */}
          <div className="rounded border border-[#1F1F1F] bg-[#0A0A0A]">
            <div className="border-b border-[#1F1F1F] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GitBranch className="h-4 w-4 text-[#28E7A2]" />
                  <h3 className="font-mono text-sm uppercase tracking-wider text-white">
                    System Bindings
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-[#28E7A2]" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                    Live
                  </span>
                </div>
              </div>
            </div>

            <div className="divide-y divide-[#1F1F1F]">
              {SCHEMA_SYSTEMS.map((system) => (
                <button
                  key={system.id}
                  onClick={() =>
                    setSelectedSystem(
                      system.id === selectedSystem ? null : system.id
                    )
                  }
                  className="w-full p-4 text-left transition-colors hover:bg-[#0F0F0F]"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {system.status === 'healthy' && (
                        <CheckCircle className="h-4 w-4 flex-shrink-0 text-[#28E7A2]" />
                      )}
                      {system.status === 'warning' && (
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-yellow-500" />
                      )}
                      {system.status === 'critical' && (
                        <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
                      )}
                      <div>
                        <div className="font-mono text-sm text-white">
                          {system.name}
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] text-[#666]">
                          {system.validated}/{system.schemas} schemas validated
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-mono text-xs text-[#888]">
                          {system.compliance}%
                        </div>
                        <div className="font-mono text-[10px] text-[#666]">
                          {system.lastSync}
                        </div>
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 text-[#666] transition-transform ${selectedSystem === system.id ? 'rotate-90' : ''}`}
                      />
                    </div>
                  </div>

                  {/* Drift indicator */}
                  {system.drift > 0 && (
                    <div className="mb-2 flex items-center gap-2">
                      <TrendingDown className="h-3 w-3 text-red-500" />
                      <span className="font-mono text-xs text-red-500">
                        {system.drift} schema{system.drift > 1 ? 's' : ''}{' '}
                        drifted from Canon
                      </span>
                    </div>
                  )}

                  {/* Sample tables */}
                  <div className="flex flex-wrap items-center gap-2">
                    {system.tables.slice(0, 4).map((table) => (
                      <div
                        key={table}
                        className="rounded border border-[#1F1F1F] bg-black/50 px-2 py-0.5 font-mono text-[10px] text-[#666]"
                      >
                        {table}
                      </div>
                    ))}
                    {system.tables.length > 4 && (
                      <div className="font-mono text-[10px] text-[#666]">
                        +{system.tables.length - 4} more
                      </div>
                    )}
                  </div>

                  {/* Expanded violations */}
                  {selectedSystem === system.id && system.violations && (
                    <div className="mt-4 space-y-2 border-t border-[#1F1F1F] pt-4">
                      {system.violations.map((violation, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedViolation(
                              selectedViolation?.field === violation.field
                                ? null
                                : { system: system.id, field: violation.field }
                            )
                          }}
                          className={`w-full rounded border p-3 text-left ${
                            violation.severity === 'critical'
                              ? 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10'
                              : violation.severity === 'high'
                                ? 'border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10'
                                : 'border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10'
                          } transition-colors`}
                        >
                          <div className="mb-1 flex items-start gap-2">
                            <AlertTriangle
                              className={`mt-0.5 h-3 w-3 flex-shrink-0 ${
                                violation.severity === 'critical'
                                  ? 'text-red-500'
                                  : violation.severity === 'high'
                                    ? 'text-orange-500'
                                    : 'text-yellow-500'
                              }`}
                            />
                            <div className="flex-1">
                              <div className="mb-1 font-mono text-xs text-white">
                                {violation.field}
                              </div>
                              <div className="text-[11px] leading-relaxed text-[#888]">
                                {violation.issue}
                              </div>

                              {/* Impact metrics */}
                              <div className="mt-2 flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <Network className="h-3 w-3 text-[#666]" />
                                  <span className="font-mono text-[10px] text-[#666]">
                                    {violation.impactedSystems} systems
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Database className="h-3 w-3 text-[#666]" />
                                  <span className="font-mono text-[10px] text-[#666]">
                                    {violation.downstreamTables} tables
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                                violation.severity === 'critical'
                                  ? 'border border-red-500/30 bg-red-500/10 text-red-500'
                                  : violation.severity === 'high'
                                    ? 'border border-orange-500/30 bg-orange-500/10 text-orange-500'
                                    : 'border border-yellow-500/30 bg-yellow-500/10 text-yellow-500'
                              }`}
                            >
                              {violation.severity}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedViolation({
                                  system: system.id,
                                  field: violation.field,
                                })
                              }}
                              className="ml-auto flex items-center gap-1 rounded border border-[#333] bg-[#1F1F1F] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#888] transition-colors hover:bg-[#2F2F2F]"
                            >
                              <Eye className="h-3 w-3" />
                              Impact
                            </button>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: LIFECYCLE VISUALIZATION */}
          <div className="overflow-hidden rounded border border-[#1F1F1F] bg-[#0A0A0A]">
            <div className="border-b border-[#1F1F1F] p-4">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-[#28E7A2]" />
                <h3 className="font-mono text-sm uppercase tracking-wider text-white">
                  Canonical Data Flow
                </h3>
              </div>
              <p className="mt-2 text-xs text-[#666]">
                Living metadata propagation from genesis to immutable truth
              </p>
            </div>
            <AgriMetadataLifecycle />
          </div>
        </div>

        {/* LIVE EVENT STREAM */}
        <div className="mt-6 rounded border border-[#1F1F1F] bg-[#0A0A0A]">
          <div className="border-b border-[#1F1F1F] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-[#28E7A2]" />
                <h3 className="font-mono text-sm uppercase tracking-wider text-white">
                  Event Stream
                </h3>
              </div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                Last 30 minutes
              </div>
            </div>
          </div>

          <div className="divide-y divide-[#1F1F1F]">
            {RECENT_EVENTS.map((event, idx) => (
              <div
                key={idx}
                className="p-4 transition-colors hover:bg-[#0F0F0F]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex min-w-[70px] items-center gap-2">
                    <Clock className="h-3 w-3 text-[#666]" />
                    <span className="font-mono text-xs text-[#666]">
                      {event.time}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-mono text-xs text-white">
                        {event.system}
                      </span>
                      <ChevronRight className="h-3 w-3 text-[#666]" />
                      <span className="font-mono text-xs text-[#888]">
                        {event.table}
                      </span>
                    </div>
                    <div className="text-xs text-[#888]">{event.event}</div>
                  </div>

                  <div
                    className={`rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                      event.severity === 'critical'
                        ? 'border border-red-500/30 bg-red-500/10 text-red-500'
                        : event.severity === 'high'
                          ? 'border border-orange-500/30 bg-orange-500/10 text-orange-500'
                          : event.severity === 'warning'
                            ? 'border border-yellow-500/30 bg-yellow-500/10 text-yellow-500'
                            : 'border border-[#28E7A2]/30 bg-[#28E7A2]/10 text-[#28E7A2]'
                    }`}
                  >
                    {event.severity}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* IMPACT ANALYSIS MODAL */}
        {selectedViolation && violation && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
            onClick={() => setSelectedViolation(null)}
          >
            <div
              className="max-h-[80vh] w-full max-w-4xl overflow-hidden rounded-lg border border-[#1F1F1F] bg-[#0A0A0A]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="border-b border-[#1F1F1F] p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Network className="mt-1 h-5 w-5 flex-shrink-0 text-red-500" />
                    <div>
                      <h3 className="font-mono text-lg text-white">
                        Impact Analysis
                      </h3>
                      <p className="mt-1 font-mono text-xs text-[#666]">
                        {violation.field}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedViolation(null)}
                    className="rounded border border-[#333] bg-[#1F1F1F] px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-[#888] transition-colors hover:bg-[#2F2F2F]"
                  >
                    Close
                  </button>
                </div>

                {/* Violation details */}
                <div
                  className={`rounded border p-4 ${
                    violation.severity === 'critical'
                      ? 'border-red-500/20 bg-red-500/5'
                      : violation.severity === 'high'
                        ? 'border-orange-500/20 bg-orange-500/5'
                        : 'border-yellow-500/20 bg-yellow-500/5'
                  }`}
                >
                  <div className="text-xs leading-relaxed text-[#888]">
                    {violation.issue}
                  </div>
                </div>
              </div>

              {/* Impact metrics */}
              <div className="border-b border-[#1F1F1F] p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded border border-[#1F1F1F] bg-black/50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Network className="h-4 w-4 text-[#666]" />
                      <div className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                        Impacted Systems
                      </div>
                    </div>
                    <div className="font-mono text-3xl text-white">
                      {violation.impactedSystems}
                    </div>
                  </div>
                  <div className="rounded border border-[#1F1F1F] bg-black/50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Database className="h-4 w-4 text-[#666]" />
                      <div className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                        Downstream Tables
                      </div>
                    </div>
                    <div className="font-mono text-3xl text-white">
                      {violation.downstreamTables}
                    </div>
                  </div>
                </div>
              </div>

              {/* Affected systems & tables */}
              <div className="max-h-[400px] overflow-y-auto p-6">
                <h4 className="mb-4 font-mono text-sm uppercase tracking-wider text-white">
                  Downstream Dependencies
                </h4>

                <div className="space-y-3">
                  {/* Example downstream dependencies */}
                  {[
                    {
                      system: 'Tableau Analytics',
                      tables: [
                        'Revenue Dashboard',
                        'Executive Summary',
                        'Sales Forecast',
                      ],
                    },
                    {
                      system: 'Power BI',
                      tables: ['Monthly Reports', 'KPI Tracker'],
                    },
                    {
                      system: 'Custom Reports API',
                      tables: ['Financial Export', 'Audit Trail'],
                    },
                  ].map((dep, idx) => (
                    <div
                      key={idx}
                      className="rounded border border-[#1F1F1F] bg-black/50 p-4"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <div className="font-mono text-sm text-white">
                          {dep.system}
                        </div>
                      </div>
                      <div className="ml-6 flex flex-wrap gap-2">
                        {dep.tables.map((table) => (
                          <div
                            key={table}
                            className="rounded border border-[#1F1F1F] bg-[#0A0A0A] px-2 py-1 font-mono text-[10px] text-[#666]"
                          >
                            {table}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recommended action */}
                <div className="mt-6 rounded border border-[#28E7A2]/20 bg-[#28E7A2]/5 p-4">
                  <div className="flex items-start gap-2">
                    <Play className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#28E7A2]" />
                    <div>
                      <div className="mb-1 font-mono text-xs uppercase tracking-wider text-[#28E7A2]">
                        Recommended Action
                      </div>
                      <div className="text-xs leading-relaxed text-[#888]">
                        Update {violation.field} in source system to match Canon
                        specification, or update Canon if the business logic has
                        changed. Run validation after changes to verify
                        propagation across all {violation.downstreamTables}{' '}
                        dependent tables.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MetaAppShell>
  )
}
