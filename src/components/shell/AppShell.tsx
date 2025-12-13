import { useState, useEffect } from 'react'
import { Search, Database, Settings as SettingsIcon } from 'lucide-react'
import { useRouterAdapter } from '@/hooks/useRouterAdapter'
import { NexusIcon } from '@/components/nexus/NexusIcon'
import { MetaCommandPalette } from './MetaCommandPalette'
import { MiniSidebar } from './MiniSidebar'
import { AppFooter } from './AppFooter'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const { navigate, pathname } = useRouterAdapter()

  // Keyboard shortcut: ⌘K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette(true)
      }
      // ESC to close
      if (e.key === 'Escape' && showCommandPalette) {
        setShowCommandPalette(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showCommandPalette])

  // Check if we're on the landing page (no app chrome)
  const isLandingPage = pathname === '/'

  // Don't show app shell on landing page
  if (isLandingPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-black">
      {/* MINI SIDEBAR - LEFT (Fixed, 64px wide) */}
      <MiniSidebar />

      {/* MAIN CONTENT AREA - Offset by sidebar width (ml-16 = 64px) */}
      <div className="ml-16 flex min-h-screen flex-col">
        {/* TOP NAV BAR - STICKY */}
        <header className="sticky top-0 z-50 border-b border-[#1F1F1F] bg-black">
          <div className="flex items-center justify-between px-6 py-3">
            {/* LEFT: Logo (no nav links, they're in sidebar now) */}
            <button
              onClick={() => navigate('/')}
              className="group flex items-center gap-3"
            >
              <NexusIcon size="sm" />
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#888] transition-colors group-hover:text-[#28E7A2]">
                NexusCanon
              </span>
            </button>

            {/* CENTER: Command Palette Trigger (THE primary search) */}
            <button
              onClick={() => setShowCommandPalette(true)}
              className="group flex min-w-[400px] items-center gap-3 rounded border border-[#1F1F1F] bg-[#0A0A0A] px-4 py-2 transition-colors hover:border-[#28E7A2]"
            >
              <Search className="h-4 w-4 text-[#666] group-hover:text-[#28E7A2]" />
              <span className="font-mono text-[12px] text-[#888] group-hover:text-[#28E7A2]">
                Search metadata...
              </span>
              <kbd className="ml-auto rounded border border-[#1F1F1F] bg-black px-2 py-1 font-mono text-[10px] text-[#666]">
                ⌘K
              </kbd>
            </button>

            {/* RIGHT: User Menu */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end">
                <span className="font-mono text-[12px] text-[#888]">Admin</span>
                <span className="font-mono text-[12px] text-[#444]">
                  Data Steward
                </span>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#333] bg-[#1F1F1F]">
                <span className="font-mono text-[11px] text-[#666]">AS</span>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT - Flex 1 to push footer down */}
        <main className="flex-1">{children}</main>

        {/* APP FOOTER - Always at bottom */}
        <AppFooter />
      </div>

      {/* GLOBAL COMMAND PALETTE */}
      <MetaCommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />
    </div>
  )
}
