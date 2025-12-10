import { useState, useEffect } from "react";
import { NexusCanonLogo } from "@/components/NexusCanonLogo";
import { NexusButton } from "@/components/nexus/NexusButton";
import { cn } from "@/lib/utils";

export const Header = ({ onGetStarted, onCanonClick }: { onGetStarted: () => void; onCanonClick: () => void }) => {
  const [scrolled, setScrolled] = useState(false);

  // Detect Scroll for Glass Effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-20 transition-all duration-300 flex items-center px-6 md:px-12",
        // Apply the Glass Effect only when scrolled
        scrolled ? "bg-nexus-void/80 backdrop-blur-md border-b border-nexus-structure" : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
        
        {/* BRAND IDENTITY */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={onCanonClick}>
           {/* Logo Component */}
           <NexusCanonLogo variant="icon" size="sm" />
           <div className="hidden md:block">
             <h1 className="text-sm font-medium text-white tracking-tight group-hover:text-nexus-green transition-colors">
               NexusCanon
             </h1>
             <p className="text-[9px] font-mono text-nexus-noise uppercase tracking-widest">
               Forensic v2.4
             </p>
           </div>
        </div>

        {/* NAVIGATION (Desktop) */}
        <nav className="hidden md:flex items-center gap-8">
           <a href="#lineage" className="text-xs font-mono text-nexus-noise hover:text-nexus-green uppercase tracking-widest transition-colors">
             Simulation
           </a>
           <a href="#logic" className="text-xs font-mono text-nexus-noise hover:text-nexus-green uppercase tracking-widest transition-colors">
             Capabilities
           </a>
           <a href="#registry" className="text-xs font-mono text-nexus-noise hover:text-nexus-green uppercase tracking-widest transition-colors">
             Registry
           </a>
        </nav>

        {/* ACTIONS */}
        <div className="flex items-center gap-4">
           <button 
             onClick={onCanonClick}
             className="hidden md:block text-xs font-mono text-nexus-signal hover:text-nexus-green uppercase tracking-widest transition-colors"
           >
             Sign In
           </button>
           <NexusButton variant="secondary" className="h-9 px-4" onClick={onGetStarted}>
             GET STARTED
           </NexusButton>
        </div>

      </div>
    </header>
  );
};