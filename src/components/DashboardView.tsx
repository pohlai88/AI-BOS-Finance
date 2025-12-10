import { useState } from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  Download,
  Search,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

export const DashboardView = ({ onReset }: { onReset: () => void }) => {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  return (
    <div className="min-h-screen">
      {/* Top Navigation */}
      <nav className="border-b border-white/10 bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-medium">NexusCanon</h1>
            <div className="flex items-center gap-4 text-sm">
              <button className="text-gray-400 hover:text-white transition-colors">Reports</button>
              <button className="text-gray-400 hover:text-white transition-colors">Registry</button>
              <button className="text-gray-400 hover:text-white transition-colors">Settings</button>
            </div>
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Start Over
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Success Message - Clear Outcome */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 p-6 rounded-2xl bg-gradient-to-r from-green-500/10 to-violet-500/10 border border-green-500/20"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-medium mb-2 text-green-400">Your Reports Are Ready!</h2>
              <p className="text-gray-400 mb-4">
                We&apos;ve processed your data and generated IFRS-compliant reports. All numbers are
                traced to their source and ready for audit.
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-gray-400">3 Reports Generated</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-gray-400">1,247 Data Points Mapped</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-gray-400">100% Lineage Traced</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions - Clear CTAs */}
            <div>
              <h3 className="text-sm text-gray-500 uppercase tracking-widest mb-4">
                What would you like to do?
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <ActionCard
                  icon={<Download className="w-5 h-5" />}
                  title="Download All Reports"
                  description="Get PDF or Excel exports"
                  onClick={() => alert('Downloading reports...')}
                />
                <ActionCard
                  icon={<Search className="w-5 h-5" />}
                  title="Trace a Number"
                  description="See the full lineage of any figure"
                  onClick={() => alert('Opening lineage tracer...')}
                />
              </div>
            </div>

            {/* Available Reports - Clear Empty State Alternative */}
            <div>
              <h3 className="text-sm text-gray-500 uppercase tracking-widest mb-4">Your Reports</h3>
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
            <div className="p-6 rounded-2xl border border-white/10 bg-[#0A0A0A]">
              <h3 className="text-sm text-gray-500 uppercase tracking-widest mb-6">Key Metrics</h3>
              <div className="space-y-4">
                <MetricCard label="Total Revenue" value="$2.4M" change="+12.5%" isPositive={true} />
                <MetricCard label="Outstanding AR" value="$483K" change="-3.2%" isPositive={true} />
                <MetricCard
                  label="Inventory Value"
                  value="$1.1M"
                  change="+5.8%"
                  isPositive={true}
                />
              </div>
            </div>

            {/* AI Insights */}
            <div className="p-6 rounded-2xl border border-violet-500/20 bg-violet-500/5">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-violet-400" />
                <h3 className="text-sm uppercase tracking-widest text-violet-400">AI Insight</h3>
              </div>
              <p className="text-sm text-gray-300 mb-4">
                Your AR aging shows 15% of receivables are 60+ days overdue. This may impact your
                working capital ratio.
              </p>
              <button className="text-sm text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">
                View Details
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Next Steps */}
            <div className="p-6 rounded-2xl border border-white/10 bg-[#0A0A0A]">
              <h3 className="text-sm text-gray-500 uppercase tracking-widest mb-4">
                Suggested Next Steps
              </h3>
              <div className="space-y-3">
                <NextStepItem title="Share with auditors" description="Generate shareable link" />
                <NextStepItem title="Schedule auto-refresh" description="Keep data up to date" />
                <NextStepItem title="Add more data sources" description="Connect additional ERPs" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActionCard = ({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="p-6 rounded-xl border border-white/10 bg-[#0A0A0A] hover:bg-white/5 hover:border-white/20 transition-all duration-300 text-left group"
  >
    <div className="inline-flex p-3 rounded-lg bg-green-500/10 text-green-400 mb-4 group-hover:bg-green-500/20 transition-colors">
      {icon}
    </div>
    <h4 className="font-medium mb-1">{title}</h4>
    <p className="text-sm text-gray-500">{description}</p>
  </button>
);

const ReportCard = ({
  title,
  standard,
  lastUpdated,
  status,
  onClick,
  isSelected,
}: {
  title: string;
  standard: string;
  lastUpdated: string;
  status: 'ready' | 'processing' | 'error';
  onClick: () => void;
  isSelected: boolean;
}) => (
  <button
    onClick={onClick}
    className={`
      w-full p-6 rounded-xl border text-left transition-all duration-300 group
      ${
        isSelected
          ? 'border-green-500/50 bg-green-500/10'
          : 'border-white/10 bg-[#0A0A0A] hover:border-white/20 hover:bg-white/5'
      }
    `}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-start gap-4">
        <div
          className={`
          w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
          ${isSelected ? 'bg-green-500/20' : 'bg-white/5'}
        `}
        >
          <FileText className={`w-6 h-6 ${isSelected ? 'text-green-400' : 'text-gray-400'}`} />
        </div>
        <div>
          <h4 className="font-medium mb-1">{title}</h4>
          <p className="text-sm text-gray-500 mb-2">{standard}</p>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span>Updated {lastUpdated}</span>
            <div className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${
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
        className={`w-5 h-5 transition-all ${isSelected ? 'text-green-400' : 'text-gray-600 group-hover:translate-x-1'}`}
      />
    </div>

    {isSelected && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        className="pt-4 border-t border-white/10 flex gap-3"
      >
        <button className="flex-1 px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm">
          View Report
        </button>
        <button className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm">
          Download PDF
        </button>
      </motion.div>
    )}
  </button>
);

const MetricCard = ({
  label,
  value,
  change,
  isPositive,
}: {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}) => (
  <div>
    <div className="text-sm text-gray-500 mb-1">{label}</div>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-medium">{value}</span>
      <span
        className={`text-sm flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}
      >
        <TrendingUp className="w-3 h-3" />
        {change}
      </span>
    </div>
  </div>
);

const NextStepItem = ({ title, description }: { title: string; description: string }) => (
  <button className="w-full text-left p-3 rounded-lg hover:bg-white/5 transition-colors group">
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium text-sm mb-1 group-hover:text-green-400 transition-colors">
          {title}
        </div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
    </div>
  </button>
);
