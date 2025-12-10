import { HeroSection } from '@/components/landing/HeroSection';
import { Header } from '@/components/nexus/Header';
import StabilitySimulation from '@/components/landing/StabilitySimulation';
import { NexusCard } from '@/components/nexus/NexusCard';
import { NexusButton } from '@/components/nexus/NexusButton';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { ArrowRight, ShieldCheck, Activity, Terminal } from 'lucide-react';

export const LandingPage = ({ onTryIt, onCanonClick }: { onTryIt: () => void; onCanonClick: () => void }) => {
  return (
    <div className="relative min-h-screen bg-nexus-void selection:bg-nexus-green/30">
      
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
              <span className="nexus-label text-nexus-green">Structural Integrity Protocol</span>
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
        <section id="logic" className="py-32 px-6 border-t border-nexus-structure bg-nexus-matter/50">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16">
              <span className="nexus-label">Core Capabilities</span>
              <h2 className="text-4xl font-medium tracking-tighter text-white mt-2">Forensic Architecture</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <NexusCard title="CRYSTALLIZATION" variant="default" className="min-h-[300px]">
                <ShieldCheck className="w-8 h-8 text-nexus-green mb-6" />
                <h3 className="text-xl text-white mb-3">Immutable Period Control</h3>
                <p className="text-sm text-nexus-noise leading-relaxed">
                  Cryptographically freeze your data state. Once a period is locked, the numbers never move again without a digital signature trace.
                </p>
              </NexusCard>

              {/* Feature 2 */}
              <NexusCard title="INTERROGATION" variant="default" className="min-h-[300px]">
                <Activity className="w-8 h-8 text-nexus-green mb-6" />
                <h3 className="text-xl text-white mb-3">Active Living Lens</h3>
                <p className="text-sm text-nexus-noise leading-relaxed">
                  Standard audits are passive. NexusCanon proactively dismantles transactions against IFRS and Tax Pillars in real-time.
                </p>
              </NexusCard>

              {/* Feature 3 */}
              <NexusCard title="GOVERNANCE" variant="default" className="min-h-[300px]">
                <Terminal className="w-8 h-8 text-nexus-green mb-6" />
                <h3 className="text-xl text-white mb-3">Schema Enforcement</h3>
                <p className="text-sm text-nexus-noise leading-relaxed">
                  Data cannot enter the system unless it matches the strict schema definitions. Zero tolerance for "bad data."
                </p>
              </NexusCard>
            </div>
          </div>
        </section>

        {/* SECTION 3: FINAL CTA */}
        <section className="py-32 px-6 border-t border-nexus-structure relative overflow-hidden">
          <div className="absolute inset-0 bg-nexus-green/5 opacity-20" /> {/* Subtle Green tint */}
          <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
            <h2 className="text-5xl md:text-7xl font-medium tracking-tighter text-white">
              Ready to <span className="text-nexus-noise">Initialize?</span>
            </h2>
            <p className="text-nexus-noise max-w-xl mx-auto text-lg">
              Deploy the forensic architecture today. Stop guessing. Start verifying.
            </p>
            <div className="flex justify-center gap-4 pt-8">
              <NexusButton variant="primary" onClick={onTryIt}>
                LAUNCH SYSTEM
              </NexusButton>
              <NexusButton variant="secondary" onClick={onCanonClick} icon={<ArrowRight />}>
                VIEW DOCUMENTATION
              </NexusButton>
            </div>
          </div>
        </section>

        <LandingFooter />
      </main>
    </div>
  );
};