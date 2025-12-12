import { HeroSection } from '@/modules/landing/components/HeroSection'
import { Header } from '@/modules/landing/components/Header'
import { BackgroundGrid } from '@/modules/landing/components/BackgroundGrid'
import { CrystallizationSphere } from '@/modules/landing/components/CrystallizationSphere'
import { StabilitySimulation } from '@/modules/simulation'
import { LivingLens } from '@/modules/landing/components/LivingLens'
import { TruthBar } from '@/modules/landing/components/TruthBar'
import { LinearFeatureCard } from '@/modules/landing/components/LinearFeatureCard'
import {
  CrystallizationVisual,
  InterrogationVisual,
  GovernanceVisual,
} from '@/modules/landing/components/FeatureVisuals'
import { NexusCard } from '@/components/nexus/NexusCard'
import { NexusButton } from '@/components/nexus/NexusButton'
import { LandingFooter } from '@/modules/landing/components/LandingFooter'
import {
  ArrowRight,
  ShieldCheck,
  Activity,
  Terminal,
  GitBranch,
  Zap,
  Layers,
  Search,
} from 'lucide-react'

export const LandingPage = ({
  onTryIt,
  onCanonClick,
}: {
  onTryIt: () => void
  onCanonClick: () => void
}) => {
  return (
    <div className="bg-nexus-void selection:bg-nexus-green/30 relative min-h-screen">
      {/* 0. LIVING BACKGROUND (Z-Layer 0) */}
      <BackgroundGrid />

      {/* 1. Header (Fixed Z-Layer 50) */}
      <Header onGetStarted={onTryIt} onCanonClick={onCanonClick} />

      {/* 2. Main Scrollable Content */}
      <main className="relative z-10">
        {/* HERO SECTION */}
        <div className="pt-20">
          <HeroSection onGetStarted={onTryIt} />
        </div>

        {/* SECTION 1: STABILITY (The Hook) */}
        <section id="lineage" className="px-6 py-32">
          <div className="mx-auto max-w-7xl space-y-12">
            <div className="space-y-4 text-center">
              <span className="nexus-label text-nexus-green flex items-center justify-center gap-2">
                <Layers className="h-3 w-3" />
                Structural Integrity Protocol
              </span>
              <h2 className="text-4xl font-medium tracking-tighter text-white md:text-7xl">
                The Inevitable <span className="text-zinc-400">Divergence</span>
              </h2>
            </div>

            {/* The Simulation Component (Now framed in a NexusCard) */}
            <NexusCard variant="glass" className="border-nexus-subtle/50 p-0">
              <StabilitySimulation />
            </NexusCard>
          </div>
        </section>

        {/* SECTION 2: THE TRIPLE THREAT (Linear Style) */}
        <section
          id="logic"
          className="border-nexus-structure border-t bg-[#020403] px-6 py-32"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-20 text-center md:text-left">
              <span className="nexus-label text-nexus-green flex items-center justify-center gap-2 md:justify-start">
                <ShieldCheck className="h-3 w-3" />
                Core Capabilities
              </span>
              <h2 className="mt-4 text-4xl font-medium tracking-tighter text-white md:text-7xl">
                Forensic <span className="text-zinc-400">Architecture</span>
              </h2>
              <p className="text-nexus-noise mt-4 max-w-xl text-lg">
                Built on first principles of cryptographic verification. We
                don't just audit data; we anchor it to mathematical truth.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Feature 1: Crystallization */}
              <LinearFeatureCard
                icon={ShieldCheck}
                title="Immutable Period Control"
                description="Cryptographically freeze your data state. Once a period is locked, the numbers never move again without a digital signature trace."
              >
                <CrystallizationVisual />
              </LinearFeatureCard>

              {/* Feature 2: Interrogation */}
              <LinearFeatureCard
                icon={Activity}
                title="Active Living Lens"
                description="Standard audits are passive. NexusCanon proactively dismantles transactions against IFRS and Tax Pillars in real-time."
              >
                <InterrogationVisual />
              </LinearFeatureCard>

              {/* Feature 3: Governance */}
              <LinearFeatureCard
                icon={Terminal}
                title="Schema Enforcement"
                description="Data cannot enter the system unless it matches the strict schema definitions. Zero tolerance for 'bad data'."
              >
                <GovernanceVisual />
              </LinearFeatureCard>
            </div>
          </div>
        </section>

        {/* SECTION 3: THE TRUTH ENGINE (Live Demo) */}
        <section
          id="engine"
          className="border-nexus-structure border-t px-6 py-32"
        >
          <div className="mx-auto max-w-7xl space-y-12">
            <div className="space-y-4 text-center">
              <span className="nexus-label text-nexus-green flex items-center justify-center gap-2">
                <GitBranch className="h-3 w-3" />
                Deterministic Logic Processor
              </span>
              <h2 className="text-4xl font-medium tracking-tighter text-white md:text-7xl">
                The Truth <span className="text-zinc-400">Engine</span>
              </h2>
              <p className="text-nexus-noise mx-auto max-w-2xl text-base">
                Watch transactions flow through our Glass Box audit system.
                Every decision is traced. Every rule is visible. Zero
                hallucinations.
              </p>
            </div>

            {/* Living Lens Demo */}
            <LivingLens />
          </div>
        </section>

        {/* SECTION 4: INTERACTIVE TRUTH BAR */}
        <section
          id="query"
          className="border-nexus-structure bg-nexus-matter/30 border-t px-6 py-32"
        >
          <div className="mx-auto max-w-7xl space-y-12">
            <div className="space-y-4 text-center">
              <span className="nexus-label text-nexus-green flex items-center justify-center gap-2">
                <Search className="h-3 w-3" />
                Interactive Query Interface
              </span>
              <h2 className="text-4xl font-medium tracking-tighter text-white md:text-7xl">
                Ask the <span className="text-zinc-400">System</span>
              </h2>
              <p className="text-nexus-noise mx-auto max-w-2xl text-base">
                Select a transaction and see the full logic traversal path.
                Click "Show Proof" to reveal exactly how the verdict was
                reached.
              </p>
            </div>

            {/* Truth Bar */}
            <TruthBar />
          </div>
        </section>

        {/* SECTION 5: FINAL CTA - The Crystallization Event */}
        <section className="border-nexus-structure bg-nexus-void relative overflow-hidden border-t px-6 py-24">
          {/* Background Radial for Depth */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,transparent_70%)]" />

          {/* Header */}
          <div className="relative z-10 mx-auto mb-12 max-w-4xl space-y-6 text-center">
            <span className="nexus-label text-nexus-green flex items-center justify-center gap-2">
              <Zap className="h-4 w-4" />
              State Transformation Event
            </span>
            <h2 className="text-4xl font-medium tracking-tighter text-white md:text-7xl">
              Freeze Your <br />
              <span className="text-zinc-400">Financial Truth.</span>
            </h2>
            <p className="text-nexus-noise mx-auto max-w-xl text-lg leading-relaxed">
              Drifting data is a liability. NexusCanon locks your ledger into an
              immutable crystalline state, ready for instant audit.
            </p>
          </div>

          {/* THE CRYSTALLIZATION SPHERE */}
          <div className="relative z-10 -my-12 scale-90 md:scale-100">
            <CrystallizationSphere />
          </div>

          {/* CTA Buttons */}
          <div className="relative z-10 flex flex-col justify-center gap-4 pt-16 sm:flex-row">
            <NexusButton variant="primary" size="lg" onClick={onTryIt}>
              Crystallize Now
            </NexusButton>
            <NexusButton
              variant="secondary"
              size="lg"
              onClick={onCanonClick}
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Read the Canon
            </NexusButton>
          </div>
        </section>

        <LandingFooter />
      </main>
    </div>
  )
}
