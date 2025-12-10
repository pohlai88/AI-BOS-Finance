import { HeroSection } from '@/components/landing/HeroSection';
import { Header } from '@/components/landing/Header';
import { BackgroundGrid } from '@/components/landing/BackgroundGrid';
import { CrystallizationSphere } from '@/components/landing/CrystallizationSphere';
import { StabilitySimulation } from '@/components/simulation';
import { LivingLens } from '@/components/landing/LivingLens';
import { TruthBar } from '@/components/landing/TruthBar';
import { LinearFeatureCard } from '@/components/landing/LinearFeatureCard';
import { CrystallizationVisual, InterrogationVisual, GovernanceVisual } from '@/components/landing/FeatureVisuals';
import { NexusCard } from '@/components/nexus/NexusCard';
import { NexusButton } from '@/components/nexus/NexusButton';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { ArrowRight, ShieldCheck, Activity, Terminal, GitBranch, Zap, Layers, Search } from 'lucide-react';

export const LandingPage = ({
  onTryIt,
  onCanonClick,
}: {
  onTryIt: () => void;
  onCanonClick: () => void;
}) => {
  return (
    <div className="relative min-h-screen bg-nexus-void selection:bg-nexus-green/30">
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
        <section id="lineage" className="py-32 px-6">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <span className="nexus-label text-nexus-green flex items-center justify-center gap-2">
                <Layers className="w-3 h-3" />
                Structural Integrity Protocol
              </span>
              <h2 className="text-4xl md:text-5xl font-medium tracking-tighter text-white">
                The Inevitable{' '}
                <span className="text-transparent bg-gradient-to-b from-white to-white/50 bg-clip-text">
                  Divergence
                </span>
              </h2>
            </div>

            {/* The Simulation Component (Now framed in a NexusCard) */}
            <NexusCard variant="glass" className="p-0 border-nexus-subtle/50">
              <StabilitySimulation />
            </NexusCard>
          </div>
        </section>

        {/* SECTION 2: THE TRIPLE THREAT (Linear Style) */}
        <section id="logic" className="py-32 px-6 border-t border-nexus-structure bg-[#020403]">
          <div className="max-w-7xl mx-auto">
            <div className="mb-20 text-center md:text-left">
              <span className="nexus-label text-nexus-green flex items-center justify-center md:justify-start gap-2">
                <ShieldCheck className="w-3 h-3" />
                Core Capabilities
              </span>
              <h2 className="text-4xl md:text-5xl font-medium tracking-tighter text-white mt-4">
                Forensic{' '}
                <span className="text-transparent bg-gradient-to-b from-white to-white/50 bg-clip-text">
                  Architecture
                </span>
              </h2>
              <p className="mt-4 text-nexus-noise max-w-xl text-lg">
                Built on first principles of cryptographic verification. We don't just audit data; we anchor it to mathematical truth.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
        <section id="engine" className="py-32 px-6 border-t border-nexus-structure">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <span className="nexus-label text-nexus-green flex items-center justify-center gap-2">
                <GitBranch className="w-3 h-3" />
                Deterministic Logic Processor
              </span>
              <h2 className="text-4xl md:text-5xl font-medium tracking-tighter text-white">
                The Truth{' '}
                <span className="text-transparent bg-gradient-to-b from-white to-white/50 bg-clip-text">
                  Engine
                </span>
              </h2>
              <p className="text-nexus-noise max-w-2xl mx-auto text-base">
                Watch transactions flow through our Glass Box audit system. 
                Every decision is traced. Every rule is visible. Zero hallucinations.
              </p>
            </div>

            {/* Living Lens Demo */}
            <LivingLens />
          </div>
        </section>

        {/* SECTION 4: INTERACTIVE TRUTH BAR */}
        <section id="query" className="py-32 px-6 border-t border-nexus-structure bg-nexus-matter/30">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <span className="nexus-label text-nexus-green flex items-center justify-center gap-2">
                <Search className="w-3 h-3" />
                Interactive Query Interface
              </span>
              <h2 className="text-4xl md:text-5xl font-medium tracking-tighter text-white">
                Ask the{' '}
                <span className="text-transparent bg-gradient-to-b from-white to-white/50 bg-clip-text">
                  System
                </span>
              </h2>
              <p className="text-nexus-noise max-w-2xl mx-auto text-base">
                Select a transaction and see the full logic traversal path. 
                Click "Show Proof" to reveal exactly how the verdict was reached.
              </p>
            </div>

            {/* Truth Bar */}
            <TruthBar />
          </div>
        </section>

        {/* SECTION 5: FINAL CTA - The Crystallization Event */}
        <section className="py-24 px-6 border-t border-nexus-structure relative overflow-hidden bg-nexus-void">
          {/* Background Radial for Depth */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,transparent_70%)]" />

          {/* Header */}
          <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10 mb-12">
            <span className="nexus-label text-nexus-green flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" />
              State Transformation Event
            </span>
            <h2 className="text-4xl md:text-7xl font-medium tracking-tighter text-white">
              Freeze Your <br/>
              <span className="text-transparent bg-gradient-to-b from-white to-white/50 bg-clip-text">
                Financial Truth.
              </span>
            </h2>
            <p className="text-nexus-noise max-w-xl mx-auto text-lg leading-relaxed">
              Drifting data is a liability. NexusCanon locks your ledger into an 
              immutable crystalline state, ready for instant audit.
            </p>
          </div>

          {/* THE CRYSTALLIZATION SPHERE */}
          <div className="relative z-10 -my-12 scale-90 md:scale-100">
            <CrystallizationSphere />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-12 relative z-10">
            <NexusButton variant="primary" size="lg" onClick={onTryIt}>
              Get Started
            </NexusButton>
            <NexusButton variant="secondary" size="lg" onClick={onCanonClick} icon={<ArrowRight className="w-4 h-4" />}>
              Read the Canon
            </NexusButton>
          </div>
        </section>

        <LandingFooter />
      </main>
    </div>
  );
};
