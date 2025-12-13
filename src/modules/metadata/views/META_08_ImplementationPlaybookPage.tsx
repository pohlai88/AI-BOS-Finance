import { MetaAppShell } from '../components/shell/MetaAppShell'
import { MetaPageHeader } from '../components/MetaPageHeader'
import { SchematicBoat } from '../components/SchematicBoat'
import {
  Book,
  GitBranch,
  Users,
  Database,
  Shield,
  CheckCircle,
  ArrowRight,
} from 'lucide-react'

const phases = [
  {
    number: 1,
    title: 'Foundation',
    duration: '2-4 weeks',
    icon: Database,
    color: 'blue',
    activities: [
      'Canon Discovery Workshop',
      'Identify Group/Transaction/Cell hierarchy',
      'Map existing metadata sources',
      'Define governance ownership',
    ],
    deliverable: 'Canon Stack Blueprint',
  },
  {
    number: 2,
    title: 'Alignment',
    duration: '3-6 weeks',
    icon: Users,
    color: 'purple',
    activities: [
      'Stakeholder alignment sessions',
      'Define data ownership model',
      'Establish approval workflows',
      'Train Canon stewards',
    ],
    deliverable: 'Governance Operating Model',
  },
  {
    number: 3,
    title: 'Migration',
    duration: '4-8 weeks',
    icon: GitBranch,
    color: 'orange',
    activities: [
      'Import legacy metadata',
      'Link canon records to systems',
      'Configure binding rules',
      'Enable audit trails',
    ],
    deliverable: 'Live Canon Registry',
  },
  {
    number: 4,
    title: 'Synchronization',
    duration: 'Ongoing',
    icon: Shield,
    color: 'green',
    activities: [
      'Real-time compliance monitoring',
      'Automated drift detection',
      'Continuous health scans',
      'Evidence-based reporting',
    ],
    deliverable: 'Governed State',
  },
]

export function ImplementationPlaybookPage() {
  return (
    <MetaAppShell>
      <div className="mx-auto max-w-[1400px] px-6 py-8 md:px-12 md:py-12">
        {/* HEADER */}
        <MetaPageHeader
          variant="document"
          code="META_08"
          title="IMPLEMENTATION PLAYBOOK"
          subtitle="SYNCHRONIZED COMMITMENT"
          description="From chaos to canon: The proven path to organizational alignment through metadata governance."
        />

        {/* THE METAPHOR */}
        <div className="mt-8 rounded border border-[#1F1F1F] bg-[#0A0A0A] p-6">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded border border-[#28E7A2]/30 bg-[#28E7A2]/10">
              <Book className="h-5 w-5 text-[#28E7A2]" />
            </div>
            <div>
              <h3 className="mb-2 font-medium text-white">
                The Dragon Boat Principle
              </h3>
              <p className="text-sm leading-relaxed text-[#888]">
                Implementing NexusCanon is like getting a misaligned crew to row
                in sync. At first, teams pull in different directions (Finance
                wants IFRS, Tax wants local GAAP, IT wants &quot;whatever
                works&quot;). Through the 4 phases below, we achieve
                synchronized commitment—everyone rowing to the same beat, toward
                the same destination.
              </p>
            </div>
          </div>

          {/* DRAGON BOAT ANIMATION */}
          <div className="overflow-hidden rounded border border-[#1F1F1F] bg-black">
            <SchematicBoat />
          </div>

          <div className="mt-4 text-center text-xs text-[#666]">
            Watch the journey from discord (red) → recalibration (circular
            drift) → synchronization (green) → victory (sunrise)
          </div>
        </div>

        {/* IMPLEMENTATION PHASES */}
        <div className="mt-12">
          <h2 className="mb-6 flex items-center gap-2 font-medium text-white">
            The 4-Phase Journey
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
              12-18 Week Timeline
            </span>
          </h2>

          <div className="space-y-6">
            {phases.map((phase, idx) => {
              const Icon = phase.icon
              const isLast = idx === phases.length - 1

              return (
                <div key={phase.number} className="relative">
                  <div className="rounded border border-[#1F1F1F] bg-[#0A0A0A] p-6">
                    <div className="flex items-start gap-6">
                      {/* ICON */}
                      <div
                        className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded border ${
                          phase.color === 'blue' &&
                          'border-blue-500/30 bg-blue-500/10'
                        } ${phase.color === 'purple' && 'border-purple-500/30 bg-purple-500/10'} ${
                          phase.color === 'orange' &&
                          'border-orange-500/30 bg-orange-500/10'
                        } ${phase.color === 'green' && 'border-[#28E7A2]/30 bg-[#28E7A2]/10'}`}
                      >
                        <Icon
                          className={`h-8 w-8 ${phase.color === 'blue' && 'text-blue-400'} ${
                            phase.color === 'purple' && 'text-purple-400'
                          } ${phase.color === 'orange' && 'text-orange-400'} ${
                            phase.color === 'green' && 'text-[#28E7A2]'
                          }`}
                        />
                      </div>

                      {/* CONTENT */}
                      <div className="flex-1">
                        <div className="mb-4 flex items-start justify-between">
                          <div>
                            <div className="mb-2 flex items-center gap-3">
                              <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                                Phase {phase.number}
                              </span>
                              <h3 className="text-lg font-medium text-white">
                                {phase.title}
                              </h3>
                            </div>
                            <div className="text-sm text-[#666]">
                              {phase.duration}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 rounded border border-[#28E7A2]/30 bg-[#28E7A2]/10 px-3 py-1">
                            <CheckCircle className="h-3 w-3 text-[#28E7A2]" />
                            <span className="font-mono text-[10px] uppercase tracking-wider text-[#28E7A2]">
                              {phase.deliverable}
                            </span>
                          </div>
                        </div>

                        {/* ACTIVITIES */}
                        <div className="grid gap-3 md:grid-cols-2">
                          {phase.activities.map((activity, actIdx) => (
                            <div
                              key={actIdx}
                              className="flex items-center gap-2 rounded border border-[#1F1F1F] bg-black/50 p-3"
                            >
                              <div className="h-1 w-1 rounded-full bg-[#28E7A2]" />
                              <span className="text-sm text-[#CCC]">
                                {activity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CONNECTOR ARROW */}
                  {!isLast && (
                    <div className="my-4 flex justify-center">
                      <ArrowRight className="h-6 w-6 rotate-90 text-[#333]" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* SUCCESS METRICS */}
        <div className="mt-12">
          <h2 className="mb-6 font-medium text-white">Success Indicators</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded border border-[#1F1F1F] bg-[#0A0A0A] p-5">
              <div className="mb-2 font-mono text-2xl text-[#28E7A2]">
                Zero Drift
              </div>
              <div className="text-sm text-[#888]">
                All metadata changes propagate automatically. No manual
                copy-paste across systems.
              </div>
            </div>

            <div className="rounded border border-[#1F1F1F] bg-[#0A0A0A] p-5">
              <div className="mb-2 font-mono text-2xl text-[#28E7A2]">
                {'<'}5 Min
              </div>
              <div className="text-sm text-[#888]">
                Time to answer &quot;What does this field mean?&quot; with full
                audit trail and evidence.
              </div>
            </div>

            <div className="rounded border border-[#1F1F1F] bg-[#0A0A0A] p-5">
              <div className="mb-2 font-mono text-2xl text-[#28E7A2]">100%</div>
              <div className="text-sm text-[#888]">
                Confidence that reports, dashboards, and analytics reference the
                same canonical truth.
              </div>
            </div>
          </div>
        </div>

        {/* COMMON PITFALLS */}
        <div className="mt-12 rounded border border-red-500/20 bg-red-500/5 p-6">
          <h3 className="mb-4 font-medium text-white">
            Common Pitfalls to Avoid
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
              <div>
                <div className="mb-1 text-sm font-medium text-white">
                  Skipping Stakeholder Alignment
                </div>
                <div className="text-sm text-[#888]">
                  Canon only works if Finance, Tax, and IT agree on definitions.
                  Start with workshops, not tech.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
              <div>
                <div className="mb-1 text-sm font-medium text-white">
                  Trying to Boil the Ocean
                </div>
                <div className="text-sm text-[#888]">
                  Don&apos;t migrate 10,000 metadata records on day one. Start
                  with 10 critical fields (e.g., Revenue, COGS), prove value,
                  then scale.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
              <div>
                <div className="mb-1 text-sm font-medium text-white">
                  Ignoring Governance Ownership
                </div>
                <div className="text-sm text-[#888]">
                  Every Canon record needs an owner. Without clear
                  accountability, definitions drift back to chaos.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CALL TO ACTION */}
        <div className="mt-12 rounded border border-[#28E7A2]/20 bg-[#28E7A2]/5 p-6 text-center">
          <h3 className="mb-2 text-lg font-medium text-white">
            Ready to Start?
          </h3>
          <p className="mx-auto mb-6 max-w-2xl text-sm text-[#888]">
            The playbook above is the proven path. Most organizations achieve
            Phase 4 (Synchronized Commitment) in 12-18 weeks. Book a discovery
            workshop to map your Canon hierarchy.
          </p>
          <button className="rounded bg-[#28E7A2] px-6 py-3 font-medium text-black transition-colors hover:bg-[#28E7A2]/90">
            Schedule Discovery Workshop
          </button>
        </div>
      </div>
    </MetaAppShell>
  )
}
