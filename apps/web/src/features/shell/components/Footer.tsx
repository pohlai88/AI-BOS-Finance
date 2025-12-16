// ============================================================================
// FOOTER
// Global footer with version, status, and legal
// ============================================================================

export function Footer() {
  return (
    <footer className="border-t border-[#1F1F1F] bg-black">
      <div className="max-w-[1800px] mx-auto px-8 py-4">
        <div className="flex items-center justify-between text-xs text-[#666]">
          <div className="flex items-center gap-4">
            <span>© 2025 NexusCanon</span>
            <span className="w-px h-3 bg-[#222]" />
            <span className="font-mono">v2.1.0</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>System:</span>
              <span className="text-[#28E7A2] font-mono">OPERATIONAL</span>
            </div>
            <span className="w-px h-3 bg-[#222]" />
            <div className="flex items-center gap-2">
              <span>Latency:</span>
              <span className="font-mono text-[#888]">12ms</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
