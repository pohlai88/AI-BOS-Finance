import { useState } from 'react'
import { MetaAppShell } from '../components/shell/MetaAppShell'
import { MetaPageHeader } from '../components/MetaPageHeader'
import {
  AlertTriangle,
  Shield,
  FileText,
  Scale,
  TrendingDown,
  TrendingUp,
  X,
  AlertCircle,
  Info,
} from 'lucide-react'
import clsx from 'clsx'

// Risk categories with examples
const riskCategories = [
  {
    id: 'sox',
    title: 'SOX Compliance',
    icon: Shield,
    color: 'red',
    severity: 'CRITICAL',
    issues: [
      {
        id: 'sox-001',
        title: 'Unapproved Chart of Accounts Changes',
        description: 'Revenue account 4000 modified without CFO approval.',
        impact: 'Material weakness in financial reporting controls',
        affected: 'Finance Domain → 47 downstream reports',
        remediation: 'Require approval workflow for all GL account changes',
        status: 'ACTIVE',
      },
      {
        id: 'sox-002',
        title: 'Missing Segregation of Duties',
        description: 'Same user can create AND approve journal entries.',
        impact: 'Control deficiency flagged by external auditors',
        affected: 'JE_APPROVAL process',
        remediation: 'Implement dual-approval requirement',
        status: 'ACTIVE',
      },
    ],
  },
  {
    id: 'gaap',
    title: 'GAAP/IFRS Violations',
    icon: Scale,
    color: 'orange',
    severity: 'HIGH',
    issues: [
      {
        id: 'gaap-001',
        title: 'Inconsistent Revenue Recognition',
        description:
          'Revenue logic differs between SALES_US and SALES_EMEA ledgers.',
        impact: 'Revenue misstatement risk across regions',
        affected: 'Group_Finance → Transaction_Sales',
        remediation: 'Standardize revenue canon across all sales entities',
        status: 'MONITORING',
      },
    ],
  },
  {
    id: 'gdpr',
    title: 'Data Privacy (GDPR)',
    icon: FileText,
    color: 'yellow',
    severity: 'MEDIUM',
    issues: [
      {
        id: 'gdpr-001',
        title: 'PII in Unencrypted Fields',
        description:
          'Customer email addresses stored in clear text in analytics warehouse.',
        impact: 'Regulatory fine up to €20M or 4% global revenue',
        affected: 'CUSTOMER_EMAIL field in DWH_ANALYTICS',
        remediation: 'Apply AES-256 encryption or tokenization',
        status: 'REMEDIATED',
      },
    ],
  },
  {
    id: 'audit',
    title: 'Audit Trail Gaps',
    icon: AlertCircle,
    color: 'blue',
    severity: 'MEDIUM',
    issues: [
      {
        id: 'audit-001',
        title: 'Missing Change History',
        description: 'No audit log for metadata changes made in Q3 2024.',
        impact: 'Cannot prove compliance with change management policy',
        affected: 'Metadata Registry',
        remediation: 'Enable immutable audit trail with blockchain anchoring',
        status: 'ACTIVE',
      },
    ],
  },
]

export function MetaRiskRadarPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const totalIssues = riskCategories.reduce(
    (sum, cat) => sum + cat.issues.length,
    0
  )
  const activeIssues = riskCategories.reduce(
    (sum, cat) => sum + cat.issues.filter((i) => i.status === 'ACTIVE').length,
    0
  )
  const criticalIssues = riskCategories.filter(
    (cat) => cat.severity === 'CRITICAL'
  ).length

  return (
    <MetaAppShell>
      <div className="mx-auto max-w-[1400px] px-6 py-8 md:px-12 md:py-12">
        {/* HEADER */}
        <MetaPageHeader
          variant="document"
          code="META_04"
          title="RISK RADAR"
          subtitle="STAY OUT OF JAIL"
          description="Real-time monitoring of legal, financial, and governance risks across the metadata estate."
        />

        {/* RISK SUMMARY */}
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded border border-[#1F1F1F] bg-[#0A0A0A] p-5">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#666]" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                Total Issues
              </span>
            </div>
            <div className="font-mono text-3xl text-white">{totalIssues}</div>
            <div className="mt-1 text-xs text-[#666]">
              Across all categories
            </div>
          </div>

          <div className="rounded border border-red-500/30 bg-[#0A0A0A] p-5">
            <div className="mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-red-400">
                Active
              </span>
            </div>
            <div className="font-mono text-3xl text-red-500">
              {activeIssues}
            </div>
            <div className="mt-1 text-xs text-[#666]">
              Require immediate action
            </div>
          </div>

          <div className="rounded border border-orange-500/30 bg-[#0A0A0A] p-5">
            <div className="mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4 text-orange-500" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-orange-400">
                Critical
              </span>
            </div>
            <div className="font-mono text-3xl text-orange-500">
              {criticalIssues}
            </div>
            <div className="mt-1 text-xs text-[#666]">Severity level</div>
          </div>

          <div className="rounded border border-[#28E7A2]/30 bg-[#0A0A0A] p-5">
            <div className="mb-2 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-[#28E7A2]" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#28E7A2]">
                Trend
              </span>
            </div>
            <div className="font-mono text-3xl text-[#28E7A2]">-23%</div>
            <div className="mt-1 text-xs text-[#666]">vs last quarter</div>
          </div>
        </div>

        {/* CATEGORY CARDS */}
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {riskCategories.map((category) => {
            const Icon = category.icon
            const isSelected = selectedCategory === category.id

            return (
              <button
                key={category.id}
                onClick={() =>
                  setSelectedCategory(isSelected ? null : category.id)
                }
                className={clsx(
                  'rounded border bg-[#0A0A0A] p-6 text-left transition-all',
                  isSelected
                    ? `border-${category.color}-500 bg-${category.color}-500/5`
                    : 'border-[#1F1F1F] hover:border-[#333]'
                )}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={clsx(
                        'flex h-10 w-10 items-center justify-center rounded border',
                        category.color === 'red' &&
                          'border-red-500/30 bg-red-500/10',
                        category.color === 'orange' &&
                          'border-orange-500/30 bg-orange-500/10',
                        category.color === 'yellow' &&
                          'border-yellow-500/30 bg-yellow-500/10',
                        category.color === 'blue' &&
                          'border-blue-500/30 bg-blue-500/10'
                      )}
                    >
                      <Icon
                        className={clsx(
                          'h-5 w-5',
                          category.color === 'red' && 'text-red-500',
                          category.color === 'orange' && 'text-orange-500',
                          category.color === 'yellow' && 'text-yellow-500',
                          category.color === 'blue' && 'text-blue-500'
                        )}
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">
                        {category.title}
                      </h3>
                      <div className="mt-1 text-xs text-[#666]">
                        {category.issues.length} issues detected
                      </div>
                    </div>
                  </div>

                  <span
                    className={clsx(
                      'rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-wider',
                      category.severity === 'CRITICAL' &&
                        'border-red-500/30 bg-red-500/10 text-red-400',
                      category.severity === 'HIGH' &&
                        'border-orange-500/30 bg-orange-500/10 text-orange-400',
                      category.severity === 'MEDIUM' &&
                        'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                    )}
                  >
                    {category.severity}
                  </span>
                </div>

                {/* Issue Preview */}
                <div className="space-y-2">
                  {category.issues.slice(0, 2).map((issue) => (
                    <div
                      key={issue.id}
                      className="rounded border border-[#1F1F1F] bg-black/30 p-3"
                    >
                      <div className="mb-1 flex items-start justify-between">
                        <div className="text-sm font-medium text-white">
                          {issue.title}
                        </div>
                        <span
                          className={clsx(
                            'rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider',
                            issue.status === 'ACTIVE' &&
                              'bg-red-500/20 text-red-400',
                            issue.status === 'MONITORING' &&
                              'bg-orange-500/20 text-orange-400',
                            issue.status === 'REMEDIATED' &&
                              'bg-[#28E7A2]/20 text-[#28E7A2]'
                          )}
                        >
                          {issue.status}
                        </span>
                      </div>
                      <div className="text-xs text-[#666]">
                        {issue.description}
                      </div>
                    </div>
                  ))}
                </div>
              </button>
            )
          })}
        </div>

        {/* DETAILED VIEW */}
        {selectedCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
            <div className="flex max-h-[80vh] w-full max-w-[900px] flex-col overflow-hidden rounded-lg border border-[#1F1F1F] bg-[#050505]">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#1F1F1F] p-6">
                <div className="flex items-center gap-3">
                  {(() => {
                    const category = riskCategories.find(
                      (c) => c.id === selectedCategory
                    )!
                    const Icon = category.icon
                    return (
                      <>
                        <Icon className="h-6 w-6 text-[#28E7A2]" />
                        <div>
                          <h2 className="text-lg font-medium text-white">
                            {category.title}
                          </h2>
                          <div className="text-xs text-[#666]">
                            {category.issues.length} issues
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="rounded p-2 transition-colors hover:bg-[#111]"
                >
                  <X className="h-5 w-5 text-[#666]" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {riskCategories
                    .find((c) => c.id === selectedCategory)
                    ?.issues.map((issue) => (
                      <div
                        key={issue.id}
                        className="rounded border border-[#1F1F1F] bg-[#0A0A0A] p-5"
                      >
                        <div className="mb-4 flex items-start justify-between">
                          <div>
                            <div className="mb-2 flex items-center gap-2">
                              <span className="font-mono text-[10px] text-[#666]">
                                {issue.id}
                              </span>
                              <span
                                className={clsx(
                                  'rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider',
                                  issue.status === 'ACTIVE' &&
                                    'bg-red-500/20 text-red-400',
                                  issue.status === 'MONITORING' &&
                                    'bg-orange-500/20 text-orange-400',
                                  issue.status === 'REMEDIATED' &&
                                    'bg-[#28E7A2]/20 text-[#28E7A2]'
                                )}
                              >
                                {issue.status}
                              </span>
                            </div>
                            <h3 className="mb-2 text-lg font-medium text-white">
                              {issue.title}
                            </h3>
                            <p className="text-sm text-[#888]">
                              {issue.description}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="rounded border border-red-500/20 bg-red-500/5 p-3">
                            <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-red-400">
                              Business Impact
                            </div>
                            <div className="text-sm text-[#CCC]">
                              {issue.impact}
                            </div>
                          </div>

                          <div className="rounded border border-[#1F1F1F] bg-black/50 p-3">
                            <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-[#666]">
                              Affected Systems
                            </div>
                            <div className="font-mono text-sm text-[#CCC]">
                              {issue.affected}
                            </div>
                          </div>

                          <div className="rounded border border-[#28E7A2]/20 bg-[#28E7A2]/5 p-3">
                            <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-[#28E7A2]">
                              Recommended Action
                            </div>
                            <div className="text-sm text-[#CCC]">
                              {issue.remediation}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER NOTE */}
        <div className="mt-12 rounded border border-blue-500/20 bg-blue-500/5 p-5">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" />
            <div>
              <div className="mb-1 text-sm font-medium text-white">
                Continuous Monitoring
              </div>
              <div className="text-sm text-[#888]">
                Risk Radar runs automated scans every 15 minutes against 200+
                compliance rules. Issues are surfaced in real-time with
                actionable remediation steps tied to your Canon governance
                hierarchy.
              </div>
            </div>
          </div>
        </div>
      </div>
    </MetaAppShell>
  )
}
