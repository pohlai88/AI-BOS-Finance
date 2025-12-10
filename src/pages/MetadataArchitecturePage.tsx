import { useState } from 'react';
import { MetaAppShell } from '../components/shell/MetaAppShell';
import { MetaPageHeader } from '../components/MetaPageHeader';
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
} from 'lucide-react';
import { AgriMetadataLifecycle } from '../components/AgriMetadataLifecycle';

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
];

const LIVE_METRICS = {
  totalSchemas: 2696,
  validated: 2679,
  violations: 17,
  systemsMonitored: 4,
  avgCompliance: 99.4,
  lastIncident: '3h ago',
  uptimePercent: 99.97,
};

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
];

export function MetadataArchitecturePage() {
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [selectedViolation, setSelectedViolation] = useState<{
    system: string;
    field: string;
  } | null>(null);
  const selected = SCHEMA_SYSTEMS.find((s) => s.id === selectedSystem);

  const violation = selectedViolation
    ? SCHEMA_SYSTEMS.find((s) => s.id === selectedViolation.system)?.violations?.find(
        (v) => v.field === selectedViolation.field,
      )
    : null;

  return (
    <MetaAppShell>
      <div className="px-6 py-8 md:px-12 md:py-12 max-w-[1800px] mx-auto">
        {/* PAGE HEADER */}
        <MetaPageHeader
          variant="document"
          code="META_01"
          title="SCHEMA GOVERNANCE"
          subtitle="CONTROL CENTER"
          description="Real-time monitoring and enforcement of canonical schema definitions across all connected systems."
        />

        {/* LIVE METRICS BAR */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Total Schemas */}
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded p-4">
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-3 h-3 text-[#666]" />
              <div className="text-[10px] font-mono text-[#666] uppercase tracking-wider">
                Schemas
              </div>
            </div>
            <div className="text-white font-mono text-2xl">
              {LIVE_METRICS.totalSchemas.toLocaleString()}
            </div>
          </div>

          {/* Validated */}
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-3 h-3 text-[#28E7A2]" />
              <div className="text-[10px] font-mono text-[#666] uppercase tracking-wider">
                Validated
              </div>
            </div>
            <div className="text-[#28E7A2] font-mono text-2xl">
              {LIVE_METRICS.validated.toLocaleString()}
            </div>
          </div>

          {/* Violations */}
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-3 h-3 text-red-500" />
              <div className="text-[10px] font-mono text-[#666] uppercase tracking-wider">
                Violations
              </div>
            </div>
            <div className="text-red-500 font-mono text-2xl">{LIVE_METRICS.violations}</div>
          </div>

          {/* Systems */}
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-3 h-3 text-blue-500" />
              <div className="text-[10px] font-mono text-[#666] uppercase tracking-wider">
                Systems
              </div>
            </div>
            <div className="text-blue-400 font-mono text-2xl">{LIVE_METRICS.systemsMonitored}</div>
          </div>

          {/* Compliance */}
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded p-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-3 h-3 text-[#28E7A2]" />
              <div className="text-[10px] font-mono text-[#666] uppercase tracking-wider">
                Compliance
              </div>
            </div>
            <div className="text-[#28E7A2] font-mono text-2xl">{LIVE_METRICS.avgCompliance}%</div>
          </div>

          {/* Uptime */}
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3 h-3 text-[#28E7A2]" />
              <div className="text-[10px] font-mono text-[#666] uppercase tracking-wider">
                Uptime
              </div>
            </div>
            <div className="text-white font-mono text-2xl">{LIVE_METRICS.uptimePercent}%</div>
          </div>

          {/* Last Incident */}
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3 h-3 text-[#666]" />
              <div className="text-[10px] font-mono text-[#666] uppercase tracking-wider">
                Last Event
              </div>
            </div>
            <div className="text-[#888] font-mono text-sm">{LIVE_METRICS.lastIncident}</div>
          </div>
        </div>

        {/* MAIN GRID: Systems + Lifecycle */}
        <div className="mt-8 grid lg:grid-cols-2 gap-6">
          {/* LEFT: SYSTEM BINDINGS */}
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded">
            <div className="border-b border-[#1F1F1F] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GitBranch className="w-4 h-4 text-[#28E7A2]" />
                  <h3 className="text-white font-mono uppercase tracking-wider text-sm">
                    System Bindings
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#28E7A2] animate-pulse" />
                  <span className="text-[10px] font-mono text-[#666] uppercase tracking-wider">
                    Live
                  </span>
                </div>
              </div>
            </div>

            <div className="divide-y divide-[#1F1F1F]">
              {SCHEMA_SYSTEMS.map((system) => (
                <button
                  key={system.id}
                  onClick={() => setSelectedSystem(system.id === selectedSystem ? null : system.id)}
                  className="w-full p-4 hover:bg-[#0F0F0F] transition-colors text-left"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {system.status === 'healthy' && (
                        <CheckCircle className="w-4 h-4 text-[#28E7A2] flex-shrink-0" />
                      )}
                      {system.status === 'warning' && (
                        <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      )}
                      {system.status === 'critical' && (
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      )}
                      <div>
                        <div className="text-white font-mono text-sm">{system.name}</div>
                        <div className="text-[10px] font-mono text-[#666] mt-0.5">
                          {system.validated}/{system.schemas} schemas validated
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-mono text-[#888]">{system.compliance}%</div>
                        <div className="text-[10px] font-mono text-[#666]">{system.lastSync}</div>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 text-[#666] transition-transform ${selectedSystem === system.id ? 'rotate-90' : ''}`}
                      />
                    </div>
                  </div>

                  {/* Drift indicator */}
                  {system.drift > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-3 h-3 text-red-500" />
                      <span className="text-xs font-mono text-red-500">
                        {system.drift} schema{system.drift > 1 ? 's' : ''} drifted from Canon
                      </span>
                    </div>
                  )}

                  {/* Sample tables */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {system.tables.slice(0, 4).map((table) => (
                      <div
                        key={table}
                        className="px-2 py-0.5 bg-black/50 border border-[#1F1F1F] rounded text-[10px] font-mono text-[#666]"
                      >
                        {table}
                      </div>
                    ))}
                    {system.tables.length > 4 && (
                      <div className="text-[10px] font-mono text-[#666]">
                        +{system.tables.length - 4} more
                      </div>
                    )}
                  </div>

                  {/* Expanded violations */}
                  {selectedSystem === system.id && system.violations && (
                    <div className="mt-4 pt-4 border-t border-[#1F1F1F] space-y-2">
                      {system.violations.map((violation, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedViolation(
                              selectedViolation?.field === violation.field
                                ? null
                                : { system: system.id, field: violation.field },
                            );
                          }}
                          className={`w-full text-left p-3 rounded border ${
                            violation.severity === 'critical'
                              ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                              : violation.severity === 'high'
                                ? 'bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10'
                                : 'bg-yellow-500/5 border-yellow-500/20 hover:bg-yellow-500/10'
                          } transition-colors`}
                        >
                          <div className="flex items-start gap-2 mb-1">
                            <AlertTriangle
                              className={`w-3 h-3 flex-shrink-0 mt-0.5 ${
                                violation.severity === 'critical'
                                  ? 'text-red-500'
                                  : violation.severity === 'high'
                                    ? 'text-orange-500'
                                    : 'text-yellow-500'
                              }`}
                            />
                            <div className="flex-1">
                              <div className="text-xs font-mono text-white mb-1">
                                {violation.field}
                              </div>
                              <div className="text-[11px] text-[#888] leading-relaxed">
                                {violation.issue}
                              </div>

                              {/* Impact metrics */}
                              <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-1">
                                  <Network className="w-3 h-3 text-[#666]" />
                                  <span className="text-[10px] font-mono text-[#666]">
                                    {violation.impactedSystems} systems
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Database className="w-3 h-3 text-[#666]" />
                                  <span className="text-[10px] font-mono text-[#666]">
                                    {violation.downstreamTables} tables
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider ${
                                violation.severity === 'critical'
                                  ? 'bg-red-500/10 border border-red-500/30 text-red-500'
                                  : violation.severity === 'high'
                                    ? 'bg-orange-500/10 border border-orange-500/30 text-orange-500'
                                    : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-500'
                              }`}
                            >
                              {violation.severity}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedViolation({ system: system.id, field: violation.field });
                              }}
                              className="ml-auto px-2 py-0.5 bg-[#1F1F1F] hover:bg-[#2F2F2F] border border-[#333] rounded text-[9px] font-mono text-[#888] uppercase tracking-wider transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
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
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded overflow-hidden">
            <div className="border-b border-[#1F1F1F] p-4">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-[#28E7A2]" />
                <h3 className="text-white font-mono uppercase tracking-wider text-sm">
                  Canonical Data Flow
                </h3>
              </div>
              <p className="text-xs text-[#666] mt-2">
                Living metadata propagation from genesis to immutable truth
              </p>
            </div>
            <AgriMetadataLifecycle />
          </div>
        </div>

        {/* LIVE EVENT STREAM */}
        <div className="mt-6 bg-[#0A0A0A] border border-[#1F1F1F] rounded">
          <div className="border-b border-[#1F1F1F] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-[#28E7A2]" />
                <h3 className="text-white font-mono uppercase tracking-wider text-sm">
                  Event Stream
                </h3>
              </div>
              <div className="text-[10px] font-mono text-[#666] uppercase tracking-wider">
                Last 30 minutes
              </div>
            </div>
          </div>

          <div className="divide-y divide-[#1F1F1F]">
            {RECENT_EVENTS.map((event, idx) => (
              <div key={idx} className="p-4 hover:bg-[#0F0F0F] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 min-w-[70px]">
                    <Clock className="w-3 h-3 text-[#666]" />
                    <span className="text-xs font-mono text-[#666]">{event.time}</span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-white">{event.system}</span>
                      <ChevronRight className="w-3 h-3 text-[#666]" />
                      <span className="text-xs font-mono text-[#888]">{event.table}</span>
                    </div>
                    <div className="text-xs text-[#888]">{event.event}</div>
                  </div>

                  <div
                    className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider ${
                      event.severity === 'critical'
                        ? 'bg-red-500/10 border border-red-500/30 text-red-500'
                        : event.severity === 'high'
                          ? 'bg-orange-500/10 border border-orange-500/30 text-orange-500'
                          : event.severity === 'warning'
                            ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-500'
                            : 'bg-[#28E7A2]/10 border border-[#28E7A2]/30 text-[#28E7A2]'
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setSelectedViolation(null)}
          >
            <div
              className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="border-b border-[#1F1F1F] p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <Network className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-white font-mono text-lg">Impact Analysis</h3>
                      <p className="text-xs text-[#666] mt-1 font-mono">{violation.field}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedViolation(null)}
                    className="px-3 py-1.5 bg-[#1F1F1F] hover:bg-[#2F2F2F] border border-[#333] rounded text-xs font-mono text-[#888] uppercase tracking-wider transition-colors"
                  >
                    Close
                  </button>
                </div>

                {/* Violation details */}
                <div
                  className={`p-4 rounded border ${
                    violation.severity === 'critical'
                      ? 'bg-red-500/5 border-red-500/20'
                      : violation.severity === 'high'
                        ? 'bg-orange-500/5 border-orange-500/20'
                        : 'bg-yellow-500/5 border-yellow-500/20'
                  }`}
                >
                  <div className="text-xs text-[#888] leading-relaxed">{violation.issue}</div>
                </div>
              </div>

              {/* Impact metrics */}
              <div className="p-6 border-b border-[#1F1F1F]">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/50 border border-[#1F1F1F] rounded p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Network className="w-4 h-4 text-[#666]" />
                      <div className="text-[10px] font-mono text-[#666] uppercase tracking-wider">
                        Impacted Systems
                      </div>
                    </div>
                    <div className="text-white font-mono text-3xl">{violation.impactedSystems}</div>
                  </div>
                  <div className="bg-black/50 border border-[#1F1F1F] rounded p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-4 h-4 text-[#666]" />
                      <div className="text-[10px] font-mono text-[#666] uppercase tracking-wider">
                        Downstream Tables
                      </div>
                    </div>
                    <div className="text-white font-mono text-3xl">
                      {violation.downstreamTables}
                    </div>
                  </div>
                </div>
              </div>

              {/* Affected systems & tables */}
              <div className="p-6 overflow-y-auto max-h-[400px]">
                <h4 className="text-white font-mono uppercase tracking-wider text-sm mb-4">
                  Downstream Dependencies
                </h4>

                <div className="space-y-3">
                  {/* Example downstream dependencies */}
                  {[
                    {
                      system: 'Tableau Analytics',
                      tables: ['Revenue Dashboard', 'Executive Summary', 'Sales Forecast'],
                    },
                    { system: 'Power BI', tables: ['Monthly Reports', 'KPI Tracker'] },
                    { system: 'Custom Reports API', tables: ['Financial Export', 'Audit Trail'] },
                  ].map((dep, idx) => (
                    <div key={idx} className="bg-black/50 border border-[#1F1F1F] rounded p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        <div className="text-white font-mono text-sm">{dep.system}</div>
                      </div>
                      <div className="flex flex-wrap gap-2 ml-6">
                        {dep.tables.map((table) => (
                          <div
                            key={table}
                            className="px-2 py-1 bg-[#0A0A0A] border border-[#1F1F1F] rounded text-[10px] font-mono text-[#666]"
                          >
                            {table}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recommended action */}
                <div className="mt-6 p-4 bg-[#28E7A2]/5 border border-[#28E7A2]/20 rounded">
                  <div className="flex items-start gap-2">
                    <Play className="w-4 h-4 text-[#28E7A2] flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-mono text-[#28E7A2] uppercase tracking-wider mb-1">
                        Recommended Action
                      </div>
                      <div className="text-xs text-[#888] leading-relaxed">
                        Update {violation.field} in source system to match Canon specification, or
                        update Canon if the business logic has changed. Run validation after changes
                        to verify propagation across all {violation.downstreamTables} dependent
                        tables.
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
  );
}
