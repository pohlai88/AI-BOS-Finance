import { useState } from 'react';
import { MetaAppShell } from '../components/shell/MetaAppShell';
import { MetaPageHeader } from '../components/MetaPageHeader';
import { AlertTriangle, Shield, FileText, Scale, TrendingDown, TrendingUp, X, AlertCircle, Info } from 'lucide-react';
import clsx from 'clsx';

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
        description: 'Revenue logic differs between SALES_US and SALES_EMEA ledgers.',
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
        description: 'Customer email addresses stored in clear text in analytics warehouse.',
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
];

export function MetaRiskRadarPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const totalIssues = riskCategories.reduce((sum, cat) => sum + cat.issues.length, 0);
  const activeIssues = riskCategories.reduce(
    (sum, cat) => sum + cat.issues.filter((i) => i.status === 'ACTIVE').length,
    0
  );
  const criticalIssues = riskCategories.filter((cat) => cat.severity === 'CRITICAL').length;

  return (
    <MetaAppShell>
      <div className="px-6 py-8 md:px-12 md:py-12 max-w-[1400px] mx-auto">
        {/* HEADER */}
        <MetaPageHeader
          variant="document"
          code="META_04"
          title="RISK RADAR"
          subtitle="STAY OUT OF JAIL"
          description="Real-time monitoring of legal, financial, and governance risks across the metadata estate."
        />

        {/* RISK SUMMARY */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-[#666]" />
              <span className="text-[10px] uppercase tracking-wider text-[#666] font-mono">Total Issues</span>
            </div>
            <div className="text-3xl text-white font-mono">{totalIssues}</div>
            <div className="text-xs text-[#666] mt-1">Across all categories</div>
          </div>

          <div className="bg-[#0A0A0A] border border-red-500/30 rounded p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-[10px] uppercase tracking-wider text-red-400 font-mono">Active</span>
            </div>
            <div className="text-3xl text-red-500 font-mono">{activeIssues}</div>
            <div className="text-xs text-[#666] mt-1">Require immediate action</div>
          </div>

          <div className="bg-[#0A0A0A] border border-orange-500/30 rounded p-5">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-orange-500" />
              <span className="text-[10px] uppercase tracking-wider text-orange-400 font-mono">Critical</span>
            </div>
            <div className="text-3xl text-orange-500 font-mono">{criticalIssues}</div>
            <div className="text-xs text-[#666] mt-1">Severity level</div>
          </div>

          <div className="bg-[#0A0A0A] border border-[#28E7A2]/30 rounded p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-[#28E7A2]" />
              <span className="text-[10px] uppercase tracking-wider text-[#28E7A2] font-mono">Trend</span>
            </div>
            <div className="text-3xl text-[#28E7A2] font-mono">-23%</div>
            <div className="text-xs text-[#666] mt-1">vs last quarter</div>
          </div>
        </div>

        {/* CATEGORY CARDS */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {riskCategories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(isSelected ? null : category.id)}
                className={clsx(
                  'bg-[#0A0A0A] border rounded p-6 text-left transition-all',
                  isSelected
                    ? `border-${category.color}-500 bg-${category.color}-500/5`
                    : 'border-[#1F1F1F] hover:border-[#333]'
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={clsx(
                        'w-10 h-10 rounded border flex items-center justify-center',
                        category.color === 'red' && 'bg-red-500/10 border-red-500/30',
                        category.color === 'orange' && 'bg-orange-500/10 border-orange-500/30',
                        category.color === 'yellow' && 'bg-yellow-500/10 border-yellow-500/30',
                        category.color === 'blue' && 'bg-blue-500/10 border-blue-500/30'
                      )}
                    >
                      <Icon
                        className={clsx(
                          'w-5 h-5',
                          category.color === 'red' && 'text-red-500',
                          category.color === 'orange' && 'text-orange-500',
                          category.color === 'yellow' && 'text-yellow-500',
                          category.color === 'blue' && 'text-blue-500'
                        )}
                      />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{category.title}</h3>
                      <div className="text-xs text-[#666] mt-1">{category.issues.length} issues detected</div>
                    </div>
                  </div>

                  <span
                    className={clsx(
                      'px-2 py-1 border text-[10px] font-mono uppercase tracking-wider rounded',
                      category.severity === 'CRITICAL' && 'border-red-500/30 bg-red-500/10 text-red-400',
                      category.severity === 'HIGH' && 'border-orange-500/30 bg-orange-500/10 text-orange-400',
                      category.severity === 'MEDIUM' && 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                    )}
                  >
                    {category.severity}
                  </span>
                </div>

                {/* Issue Preview */}
                <div className="space-y-2">
                  {category.issues.slice(0, 2).map((issue) => (
                    <div key={issue.id} className="bg-black/30 border border-[#1F1F1F] rounded p-3">
                      <div className="flex items-start justify-between mb-1">
                        <div className="text-sm text-white font-medium">{issue.title}</div>
                        <span
                          className={clsx(
                            'px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded',
                            issue.status === 'ACTIVE' && 'bg-red-500/20 text-red-400',
                            issue.status === 'MONITORING' && 'bg-orange-500/20 text-orange-400',
                            issue.status === 'REMEDIATED' && 'bg-[#28E7A2]/20 text-[#28E7A2]'
                          )}
                        >
                          {issue.status}
                        </span>
                      </div>
                      <div className="text-xs text-[#666]">{issue.description}</div>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* DETAILED VIEW */}
        {selectedCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
            <div className="bg-[#050505] border border-[#1F1F1F] rounded-lg max-w-[900px] w-full max-h-[80vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-[#1F1F1F] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(() => {
                    const category = riskCategories.find((c) => c.id === selectedCategory)!;
                    const Icon = category.icon;
                    return (
                      <>
                        <Icon className="w-6 h-6 text-[#28E7A2]" />
                        <div>
                          <h2 className="text-white font-medium text-lg">{category.title}</h2>
                          <div className="text-xs text-[#666]">{category.issues.length} issues</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="p-2 hover:bg-[#111] rounded transition-colors"
                >
                  <X className="w-5 h-5 text-[#666]" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {riskCategories
                    .find((c) => c.id === selectedCategory)
                    ?.issues.map((issue) => (
                      <div key={issue.id} className="bg-[#0A0A0A] border border-[#1F1F1F] rounded p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-[10px] text-[#666]">{issue.id}</span>
                              <span
                                className={clsx(
                                  'px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded',
                                  issue.status === 'ACTIVE' && 'bg-red-500/20 text-red-400',
                                  issue.status === 'MONITORING' && 'bg-orange-500/20 text-orange-400',
                                  issue.status === 'REMEDIATED' && 'bg-[#28E7A2]/20 text-[#28E7A2]'
                                )}
                              >
                                {issue.status}
                              </span>
                            </div>
                            <h3 className="text-white font-medium text-lg mb-2">{issue.title}</h3>
                            <p className="text-[#888] text-sm">{issue.description}</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="bg-red-500/5 border border-red-500/20 rounded p-3">
                            <div className="text-[10px] font-mono text-red-400 uppercase tracking-wider mb-1">
                              Business Impact
                            </div>
                            <div className="text-sm text-[#CCC]">{issue.impact}</div>
                          </div>

                          <div className="bg-black/50 border border-[#1F1F1F] rounded p-3">
                            <div className="text-[10px] font-mono text-[#666] uppercase tracking-wider mb-1">
                              Affected Systems
                            </div>
                            <div className="text-sm text-[#CCC] font-mono">{issue.affected}</div>
                          </div>

                          <div className="bg-[#28E7A2]/5 border border-[#28E7A2]/20 rounded p-3">
                            <div className="text-[10px] font-mono text-[#28E7A2] uppercase tracking-wider mb-1">
                              Recommended Action
                            </div>
                            <div className="text-sm text-[#CCC]">{issue.remediation}</div>
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
        <div className="mt-12 bg-blue-500/5 border border-blue-500/20 rounded p-5">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm text-white font-medium mb-1">Continuous Monitoring</div>
              <div className="text-sm text-[#888]">
                Risk Radar runs automated scans every 15 minutes against 200+ compliance rules. Issues are surfaced in
                real-time with actionable remediation steps tied to your Canon governance hierarchy.
              </div>
            </div>
          </div>
        </div>
      </div>
    </MetaAppShell>
  );
}
