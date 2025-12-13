import { useState, useEffect } from 'react'
import { NexusIcon } from '@/components/nexus/NexusIcon'
import { NexusButton } from '@/components/nexus/NexusButton'
import { cn } from '@aibos/ui'

export const Header = ({
  onGetStarted,
  onCanonClick,
}: {
  onGetStarted: () => void
  onCanonClick: () => void
}) => {
  const [scrolled, setScrolled] = useState(false)

  // Detect Scroll for Glass Effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed left-0 right-0 top-0 z-50 flex h-20 items-center px-6 transition-all duration-300 md:px-12',
        // Apply the Glass Effect only when scrolled
        scrolled
          ? 'bg-nexus-void/80 border-nexus-structure border-b backdrop-blur-md'
          : 'border-b border-transparent bg-transparent'
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
        {/* BRAND IDENTITY */}
        <div
          className="group flex cursor-pointer items-center gap-3"
          onClick={onCanonClick}
        >
          {/* Logo Component */}
          <NexusIcon size="sm" />
          <div className="hidden md:block">
            <h1 className="group-hover:text-nexus-green text-sm font-medium tracking-tight text-white transition-colors">
              NexusCanon
            </h1>
            <p className="text-nexus-noise font-mono text-[9px] uppercase tracking-widest">
              Forensic v2.4
            </p>
          </div>
        </div>

        {/* NAVIGATION (Desktop) */}
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#lineage"
            className="text-nexus-noise hover:text-nexus-green font-mono text-xs uppercase tracking-widest transition-colors"
          >
            Simulation
          </a>
          <a
            href="#logic"
            className="text-nexus-noise hover:text-nexus-green font-mono text-xs uppercase tracking-widest transition-colors"
          >
            Capabilities
          </a>
          <a
            href="#registry"
            className="text-nexus-noise hover:text-nexus-green font-mono text-xs uppercase tracking-widest transition-colors"
          >
            Registry
          </a>
        </nav>

        {/* ACTIONS */}
        <div className="flex items-center gap-4">
          <button
            onClick={onCanonClick}
            className="text-nexus-signal hover:text-nexus-green hidden font-mono text-xs uppercase tracking-widest transition-colors md:block"
          >
            Sign In
          </button>
          <NexusButton
            variant="secondary"
            className="h-9 px-4"
            onClick={onGetStarted}
          >
            GET STARTED
          </NexusButton>
        </div>
      </div>
    </header>
  )
}
