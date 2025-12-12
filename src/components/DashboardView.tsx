import { useState } from 'react'
import { motion } from 'motion/react'
import {
  FileText,
  Download,
  Search,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  RotateCcw,
} from 'lucide-react'

export const DashboardView = ({ onReset }: { onReset: () => void }) => {
  const [selectedReport, setSelectedReport] = useState<string | null>(null)

  return (
    <div className="min-h-screen">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0A]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-medium">NexusCanon</h1>
            <div className="flex items-center gap-4 text-sm">
              <button className="text-gray-400 transition-colors hover:text-white">
                Reports
              </button>
              <button className="text-gray-400 transition-colors hover:text-white">
                Registry
              </button>
              <button className="text-gray-400 transition-colors hover:text-white">
                Settings
              </button>
            </div>
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm transition-all duration-300 hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4" />
            Start Over
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Success Message - Clear Outcome */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 rounded-2xl border border-green-500/20 bg-gradient-to-r from-green-500/10 to-violet-500/10 p-6"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-green-500/20">
              <FileText className="h-6 w-6 text-green-400" />
            </div>
            <div className="flex-1">
              <h2 className="mb-2 text-2xl font-medium text-green-400">
                Your Reports Are Ready!
              </h2>
              <p className="mb-4 text-gray-400">
                We&apos;ve processed your data and generated IFRS-compliant
                reports. All numbers are traced to their source and ready for
                audit.
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-gray-400">3 Reports Generated</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-gray-400">
                    1,247 Data Points Mapped
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-gray-400">100% Lineage Traced</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Quick Actions - Clear CTAs */}
            <div>
              <h3 className="mb-4 text-sm uppercase tracking-widest text-gray-500">
                What would you like to do?
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <ActionCard
                  icon={<Download className="h-5 w-5" />}
                  title="Download All Reports"
                  description="Get PDF or Excel exports"
                  onClick={() => alert('Downloading reports...')}
                />
                <ActionCard
                  icon={<Search className="h-5 w-5" />}
                  title="Trace a Number"
                  description="See the full lineage of any figure"
                  onClick={() => alert('Opening lineage tracer...')}
                />
              </div>
            </div>

            {/* Available Reports - Clear Empty State Alternative */}
            <div>
              <h3 className="mb-4 text-sm uppercase tracking-widest text-gray-500">
                Your Reports
              </h3>
              <div className="space-y-4">
                <ReportCard
                  title="Q4 2024 Revenue Recognition"
                  standard="IFRS 15"
                  lastUpdated="2 minutes ago"
                  status="ready"
                  onClick={() => setSelectedReport('revenue')}
                  isSelected={selectedReport === 'revenue'}
                />
                <ReportCard
                  title="Accounts Receivable Aging"
                  standard="IFRS 9"
                  lastUpdated="2 minutes ago"
                  status="ready"
                  onClick={() => setSelectedReport('ar')}
                  isSelected={selectedReport === 'ar'}
                />
                <ReportCard
                  title="Year-End Inventory Valuation"
                  standard="IAS 2"
                  lastUpdated="2 minutes ago"
                  status="ready"
                  onClick={() => setSelectedReport('inventory')}
                  isSelected={selectedReport === 'inventory'}
                />
              </div>
            </div>
          </div>

          {/* Sidebar - Insights */}
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-6">
              <h3 className="mb-6 text-sm uppercase tracking-widest text-gray-500">
                Key Metrics
              </h3>
              <div className="space-y-4">
                <MetricCard
                  label="Total Revenue"
                  value="$2.4M"
                  change="+12.5%"
                  isPositive={true}
                />
                <MetricCard
                  label="Outstanding AR"
                  value="$483K"
                  change="-3.2%"
                  isPositive={true}
                />
                <MetricCard
                  label="Inventory Value"
                  value="$1.1M"
                  change="+5.8%"
                  isPositive={true}
                />
              </div>
            </div>

            {/* AI Insights */}
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6">
              <div className="mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-violet-400" />
                <h3 className="text-sm uppercase tracking-widest text-violet-400">
                  AI Insight
                </h3>
              </div>
              <p className="mb-4 text-sm text-gray-300">
                Your AR aging shows 15% of receivables are 60+ days overdue.
                This may impact your working capital ratio.
              </p>
              <button className="flex items-center gap-1 text-sm text-violet-400 transition-colors hover:text-violet-300">
                View Details
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Next Steps */}
            <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-6">
              <h3 className="mb-4 text-sm uppercase tracking-widest text-gray-500">
                Suggested Next Steps
              </h3>
              <div className="space-y-3">
                <NextStepItem
                  title="Share with auditors"
                  description="Generate shareable link"
                />
                <NextStepItem
                  title="Schedule auto-refresh"
                  description="Keep data up to date"
                />
                <NextStepItem
                  title="Add more data sources"
                  description="Connect additional ERPs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ActionCard = ({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className="group rounded-xl border border-white/10 bg-[#0A0A0A] p-6 text-left transition-all duration-300 hover:border-white/20 hover:bg-white/5"
  >
    <div className="mb-4 inline-flex rounded-lg bg-green-500/10 p-3 text-green-400 transition-colors group-hover:bg-green-500/20">
      {icon}
    </div>
    <h4 className="mb-1 font-medium">{title}</h4>
    <p className="text-sm text-gray-500">{description}</p>
  </button>
)

const ReportCard = ({
  title,
  standard,
  lastUpdated,
  status,
  onClick,
  isSelected,
}: {
  title: string
  standard: string
  lastUpdated: string
  status: 'ready' | 'processing' | 'error'
  onClick: () => void
  isSelected: boolean
}) => (
  <button
    onClick={onClick}
    className={`group w-full rounded-xl border p-6 text-left transition-all duration-300 ${
      isSelected
        ? 'border-green-500/50 bg-green-500/10'
        : 'border-white/10 bg-[#0A0A0A] hover:border-white/20 hover:bg-white/5'
    } `}
  >
    <div className="mb-4 flex items-start justify-between">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${isSelected ? 'bg-green-500/20' : 'bg-white/5'} `}
        >
          <FileText
            className={`h-6 w-6 ${isSelected ? 'text-green-400' : 'text-gray-400'}`}
          />
        </div>
        <div>
          <h4 className="mb-1 font-medium">{title}</h4>
          <p className="mb-2 text-sm text-gray-500">{standard}</p>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span>Updated {lastUpdated}</span>
            <div className="flex items-center gap-1">
              <div
                className={`h-2 w-2 rounded-full ${
                  status === 'ready'
                    ? 'bg-green-500'
                    : status === 'processing'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
              />
              <span className="capitalize">{status}</span>
            </div>
          </div>
        </div>
      </div>
      <ChevronRight
        className={`h-5 w-5 transition-all ${isSelected ? 'text-green-400' : 'text-gray-600 group-hover:translate-x-1'}`}
      />
    </div>

    {isSelected && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        className="flex gap-3 border-t border-white/10 pt-4"
      >
        <button className="flex-1 rounded-lg bg-green-500/20 px-4 py-2 text-sm text-green-400 transition-colors hover:bg-green-500/30">
          View Report
        </button>
        <button className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm transition-colors hover:bg-white/10">
          Download PDF
        </button>
      </motion.div>
    )}
  </button>
)

const MetricCard = ({
  label,
  value,
  change,
  isPositive,
}: {
  label: string
  value: string
  change: string
  isPositive: boolean
}) => (
  <div>
    <div className="mb-1 text-sm text-gray-500">{label}</div>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-medium">{value}</span>
      <span
        className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}
      >
        <TrendingUp className="h-3 w-3" />
        {change}
      </span>
    </div>
  </div>
)

const NextStepItem = ({
  title,
  description,
}: {
  title: string
  description: string
}) => (
  <button className="group w-full rounded-lg p-3 text-left transition-colors hover:bg-white/5">
    <div className="flex items-center justify-between">
      <div>
        <div className="mb-1 text-sm font-medium transition-colors group-hover:text-green-400">
          {title}
        </div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-600 transition-all group-hover:translate-x-1 group-hover:text-green-400" />
    </div>
  </button>
)
