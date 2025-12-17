import { MetaAppShell } from '../components/shell/MetaAppShell';
import { MetaPageHeader } from '../components/MetaPageHeader';
import { SchematicBoat } from '../components/SchematicBoat';
import { Book, GitBranch, Users, Database, Shield, CheckCircle, ArrowRight } from 'lucide-react';

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
];

export function ImplementationPlaybookPage() {
  return (
    <MetaAppShell>
      <div className="px-6 py-8 md:px-12 md:py-12 max-w-[1400px] mx-auto">
        {/* HEADER */}
        <MetaPageHeader
          variant="document"
          code="META_08"
          title="IMPLEMENTATION PLAYBOOK"
          subtitle="SYNCHRONIZED COMMITMENT"
          description="From chaos to canon: The proven path to organizational alignment through metadata governance."
        />

        {/* THE METAPHOR */}
        <div className="mt-8 bg-[#0A0A0A] border border-[#1F1F1F] rounded p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 bg-[#28E7A2]/10 border border-[#28E7A2]/30 rounded flex items-center justify-center flex-shrink-0">
              <Book className="w-5 h-5 text-[#28E7A2]" />
            </div>
            <div>
              <h3 className="text-white font-medium mb-2">The Dragon Boat Principle</h3>
              <p className="text-[#888] text-sm leading-relaxed">
                Implementing NexusCanon is like getting a misaligned crew to row in sync. At first,
                teams pull in different directions (Finance wants IFRS, Tax wants local GAAP, IT
                wants &quot;whatever works&quot;). Through the 4 phases below, we achieve
                synchronized commitment—everyone rowing to the same beat, toward the same
                destination.
              </p>
            </div>
          </div>

          {/* DRAGON BOAT ANIMATION */}
          <div className="bg-black rounded border border-[#1F1F1F] overflow-hidden">
            <SchematicBoat />
          </div>

          <div className="mt-4 text-xs text-[#666] text-center">
            Watch the journey from discord (red) → recalibration (circular drift) → synchronization
            (green) → victory (sunrise)
          </div>
        </div>

        {/* IMPLEMENTATION PHASES */}
        <div className="mt-12">
          <h2 className="text-white font-medium mb-6 flex items-center gap-2">
            The 4-Phase Journey
            <span className="text-[10px] font-mono text-[#666] uppercase tracking-wider">
              12-18 Week Timeline
            </span>
          </h2>

          <div className="space-y-6">
            {phases.map((phase, idx) => {
              const Icon = phase.icon;
              const isLast = idx === phases.length - 1;

              return (
                <div key={phase.number} className="relative">
                  <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded p-6">
                    <div className="flex items-start gap-6">
                      {/* ICON */}
                      <div
                        className={`w-16 h-16 rounded border flex items-center justify-center flex-shrink-0 ${
                          phase.color === 'blue' && 'bg-blue-500/10 border-blue-500/30'
                        } ${phase.color === 'purple' && 'bg-purple-500/10 border-purple-500/30'} ${
                          phase.color === 'orange' && 'bg-orange-500/10 border-orange-500/30'
                        } ${phase.color === 'green' && 'bg-[#28E7A2]/10 border-[#28E7A2]/30'}`}
                      >
                        <Icon
                          className={`w-8 h-8 ${phase.color === 'blue' && 'text-blue-400'} ${
                            phase.color === 'purple' && 'text-purple-400'
                          } ${phase.color === 'orange' && 'text-orange-400'} ${
                            phase.color === 'green' && 'text-[#28E7A2]'
                          }`}
                        />
                      </div>

                      {/* CONTENT */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-[10px] font-mono text-[#666] uppercase tracking-wider">
                                Phase {phase.number}
                              </span>
                              <h3 className="text-white font-medium text-lg">{phase.title}</h3>
                            </div>
                            <div className="text-sm text-[#666]">{phase.duration}</div>
                          </div>

                          <div className="flex items-center gap-2 px-3 py-1 bg-[#28E7A2]/10 border border-[#28E7A2]/30 rounded">
                            <CheckCircle className="w-3 h-3 text-[#28E7A2]" />
                            <span className="text-[10px] font-mono uppercase tracking-wider text-[#28E7A2]">
                              {phase.deliverable}
                            </span>
                          </div>
                        </div>

                        {/* ACTIVITIES */}
                        <div className="grid md:grid-cols-2 gap-3">
                          {phase.activities.map((activity, actIdx) => (
                            <div
                              key={actIdx}
                              className="flex items-center gap-2 bg-black/50 border border-[#1F1F1F] rounded p-3"
                            >
                              <div className="w-1 h-1 rounded-full bg-[#28E7A2]" />
                              <span className="text-sm text-[#CCC]">{activity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CONNECTOR ARROW */}
                  {!isLast && (
                    <div className="flex justify-center my-4">
                      <ArrowRight className="w-6 h-6 text-[#333] rotate-90" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SUCCESS METRICS */}
        <div className="mt-12">
          <h2 className="text-white font-medium mb-6">Success Indicators</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded p-5">
              <div className="text-2xl text-[#28E7A2] font-mono mb-2">Zero Drift</div>
              <div className="text-sm text-[#888]">
                All metadata changes propagate automatically. No manual copy-paste across systems.
              </div>
            </div>

            <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded p-5">
              <div className="text-2xl text-[#28E7A2] font-mono mb-2">{'<'}5 Min</div>
              <div className="text-sm text-[#888]">
                Time to answer &quot;What does this field mean?&quot; with full audit trail and
                evidence.
              </div>
            </div>

            <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded p-5">
              <div className="text-2xl text-[#28E7A2] font-mono mb-2">100%</div>
              <div className="text-sm text-[#888]">
                Confidence that reports, dashboards, and analytics reference the same canonical
                truth.
              </div>
            </div>
          </div>
        </div>

        {/* COMMON PITFALLS */}
        <div className="mt-12 bg-red-500/5 border border-red-500/20 rounded p-6">
          <h3 className="text-white font-medium mb-4">Common Pitfalls to Avoid</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
              <div>
                <div className="text-sm text-white font-medium mb-1">
                  Skipping Stakeholder Alignment
                </div>
                <div className="text-sm text-[#888]">
                  Canon only works if Finance, Tax, and IT agree on definitions. Start with
                  workshops, not tech.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
              <div>
                <div className="text-sm text-white font-medium mb-1">Trying to Boil the Ocean</div>
                <div className="text-sm text-[#888]">
                  Don&apos;t migrate 10,000 metadata records on day one. Start with 10 critical
                  fields (e.g., Revenue, COGS), prove value, then scale.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
              <div>
                <div className="text-sm text-white font-medium mb-1">
                  Ignoring Governance Ownership
                </div>
                <div className="text-sm text-[#888]">
                  Every Canon record needs an owner. Without clear accountability, definitions drift
                  back to chaos.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CALL TO ACTION */}
        <div className="mt-12 bg-[#28E7A2]/5 border border-[#28E7A2]/20 rounded p-6 text-center">
          <h3 className="text-white font-medium text-lg mb-2">Ready to Start?</h3>
          <p className="text-[#888] text-sm mb-6 max-w-2xl mx-auto">
            The playbook above is the proven path. Most organizations achieve Phase 4 (Synchronized
            Commitment) in 12-18 weeks. Book a discovery workshop to map your Canon hierarchy.
          </p>
          <button className="px-6 py-3 bg-[#28E7A2] text-black font-medium rounded hover:bg-[#28E7A2]/90 transition-colors">
            Schedule Discovery Workshop
          </button>
        </div>
      </div>
    </MetaAppShell>
  );
}
