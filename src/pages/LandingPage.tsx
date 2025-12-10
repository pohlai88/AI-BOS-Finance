import { HeroSection } from '@/components/landing/HeroSection';
import { Header } from '@/components/landing/Header';
import { BackgroundGrid } from '@/components/landing/BackgroundGrid';
import { CrystallizationSphere } from '@/components/landing/CrystallizationSphere';
import { StabilitySimulation } from '@/components/simulation';
import { LivingLens } from '@/components/landing/LivingLens';
import { TruthBar } from '@/components/landing/TruthBar';
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
                The Inevitable Divergence
              </h2>
            </div>

            {/* The Simulation Component (Now framed in a NexusCard) */}
            <NexusCard variant="glass" className="p-0 border-nexus-subtle/50">
              <StabilitySimulation />
            </NexusCard>
          </div>
        </section>

        {/* SECTION 2: THE TRIPLE THREAT (Bento Grid) */}
        <section
          id="logic"
          className="py-32 px-6 border-t border-nexus-structure bg-nexus-matter/50"
        >
          <div className="max-w-7xl mx-auto">
            <div className="mb-16">
              <span className="nexus-label text-nexus-green flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" />
                Core Capabilities
              </span>
              <h2 className="text-4xl md:text-5xl font-medium tracking-tighter text-white mt-2">
                Forensic Architecture
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <NexusCard title="CRYSTALLIZATION" variant="default" className="min-h-[300px]">
                <ShieldCheck className="w-8 h-8 text-nexus-green mb-6" />
                <h3 className="text-xl text-white mb-3">Immutable Period Control</h3>
                <p className="text-sm text-nexus-noise leading-relaxed">
                  Cryptographically freeze your data state. Once a period is locked, the numbers
                  never move again without a digital signature trace.
                </p>
              </NexusCard>

              {/* Feature 2 */}
              <NexusCard title="INTERROGATION" variant="default" className="min-h-[300px]">
                <Activity className="w-8 h-8 text-nexus-green mb-6" />
                <h3 className="text-xl text-white mb-3">Active Living Lens</h3>
                <p className="text-sm text-nexus-noise leading-relaxed">
                  Standard audits are passive. NexusCanon proactively dismantles transactions
                  against IFRS and Tax Pillars in real-time.
                </p>
              </NexusCard>

              {/* Feature 3 */}
              <NexusCard title="GOVERNANCE" variant="default" className="min-h-[300px]">
                <Terminal className="w-8 h-8 text-nexus-green mb-6" />
                <h3 className="text-xl text-white mb-3">Schema Enforcement</h3>
                <p className="text-sm text-nexus-noise leading-relaxed">
                  Data cannot enter the system unless it matches the strict schema definitions. Zero
                  tolerance for "bad data."
                </p>
              </NexusCard>
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
                The Truth Engine
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
                Ask the System
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
              <span className="text-nexus-noise">Financial Truth.</span>
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
          <div className="flex flex-col md:flex-row justify-center gap-6 pt-12 relative z-10">
            <NexusButton variant="primary" onClick={onTryIt} className="w-full md:w-auto h-12 text-base">
              INITIALIZE PROTOCOL
            </NexusButton>
            <NexusButton variant="secondary" onClick={onCanonClick} icon={<ArrowRight />} className="w-full md:w-auto h-12">
              READ THE CANON
            </NexusButton>
          </div>
        </section>

        <LandingFooter />
      </main>
    </div>
  );
};
