import { useState, useEffect } from 'react';
import { Search, Database, Settings as SettingsIcon } from 'lucide-react';
import { useRouterAdapter } from '@/hooks/useRouterAdapter';
import { NexusIcon } from '@/components/icons/NexusIcon';
import { CommandPalette } from '../landing/CommandPalette';
import { MiniSidebar } from './MiniSidebar';
import { AppFooter } from './AppFooter';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const { navigate, pathname } = useRouterAdapter();

  // Keyboard shortcut: ⌘K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      // ESC to close
      if (e.key === 'Escape' && showCommandPalette) {
        setShowCommandPalette(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCommandPalette]);

  // Check if we're on the landing page (no app chrome)
  const isLandingPage = pathname === '/';

  // Don't show app shell on landing page
  if (isLandingPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* MINI SIDEBAR - LEFT (Fixed, 64px wide) */}
      <MiniSidebar />

      {/* MAIN CONTENT AREA - Offset by sidebar width (ml-16 = 64px) */}
      <div className="ml-16 flex flex-col min-h-screen">
        {/* TOP NAV BAR - STICKY */}
        <header className="sticky top-0 z-50 border-b border-[#1F1F1F] bg-black">
          <div className="flex items-center justify-between px-6 py-3">
            {/* LEFT: Logo (no nav links, they're in sidebar now) */}
            <button onClick={() => navigate('/')} className="flex items-center gap-3 group">
              <NexusIcon size="sm" />
              <span className="font-mono text-[#888] group-hover:text-[#28E7A2] text-[11px] tracking-widest uppercase transition-colors">
                NexusCanon
              </span>
            </button>

            {/* CENTER: Command Palette Trigger (THE primary search) */}
            <button
              onClick={() => setShowCommandPalette(true)}
              className="flex items-center gap-3 px-4 py-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded hover:border-[#28E7A2] transition-colors group min-w-[400px]"
            >
              <Search className="w-4 h-4 text-[#666] group-hover:text-[#28E7A2]" />
              <span className="font-mono text-[#888] group-hover:text-[#28E7A2] text-[12px]">
                Search metadata...
              </span>
              <kbd className="ml-auto px-2 py-1 bg-black border border-[#1F1F1F] rounded font-mono text-[#666] text-[10px]">
                ⌘K
              </kbd>
            </button>

            {/* RIGHT: User Menu */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end">
                <span className="font-mono text-[#888] text-[12px]">Admin</span>
                <span className="font-mono text-[#444] text-[12px]">Data Steward</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#1F1F1F] border border-[#333] flex items-center justify-center">
                <span className="font-mono text-[#666] text-[11px]">AS</span>
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
      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} />
    </div>
  );
}
