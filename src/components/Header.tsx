import { motion } from 'motion/react'
import {
  Search,
  Database,
  FileText,
  BarChart3,
  LogIn,
  Hexagon,
} from 'lucide-react'

export const Header = () => {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/10 bg-zinc-950/80 px-6 py-3 backdrop-blur-md">
        {/* --- LEFT: SYSTEM CONTEXT --- */}
        <div className="flex items-center gap-8">
          {/* 1. Logo (The Core) */}
          <div className="group flex cursor-pointer items-center gap-3">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.1, rotate: 180 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            >
              <Hexagon className="h-6 w-6 fill-emerald-400/10 text-emerald-400" />
              <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-md" />
            </motion.div>
            <span className="text-sm tracking-tight text-white transition-colors group-hover:text-emerald-400">
              NexusCanon
            </span>
          </div>

          {/* 2. System Modules (Navigation) */}
          <nav className="hidden items-center gap-6 md:flex">
            <NavItem
              label="Protocol Specs"
              icon={<FileText className="h-3 w-3" />}
            />
            <NavItem
              label="Intelligence"
              icon={<BarChart3 className="h-3 w-3" />}
            />
          </nav>
        </div>

        {/* --- RIGHT: USER CONTROL --- */}
        <div className="flex items-center gap-6">
          {/* 3. Global Search (Command Line) */}
          <div className="group hidden cursor-text items-center gap-2 rounded-md border border-white/10 bg-black/50 px-3 py-1.5 transition-colors hover:border-emerald-500/50 lg:flex">
            <Search className="h-3 w-3 text-zinc-500 transition-colors group-hover:text-emerald-500" />
            <span className="font-mono text-xs text-zinc-600 group-hover:text-zinc-400">
              Search ledger hash...
            </span>
            <span className="ml-4 rounded border border-zinc-800 px-1 text-[10px] text-zinc-700">
              ⌘K
            </span>
          </div>

          {/* 4. Data Vaults */}
          <div className="hidden cursor-pointer items-center gap-2 text-zinc-400 transition-colors hover:text-white md:flex">
            <Database className="h-4 w-4" />
            <span className="font-mono text-xs uppercase tracking-widest">
              Data Vaults
            </span>
          </div>

          {/* 5. Terminal Access (Primary CTA) */}
          <button className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs uppercase tracking-wide text-black transition-colors hover:bg-emerald-400">
            <LogIn className="h-3 w-3" />
            <span>Terminal Access</span>
          </button>
        </div>
      </div>
    </header>
  )
}

// --- SUB-COMPONENT ---
const NavItem = ({ label, icon }: { label: string; icon: React.ReactNode }) => (
  <div className="group flex cursor-pointer items-center gap-2 text-zinc-400 transition-colors hover:text-white">
    <span className="text-zinc-600 transition-colors group-hover:text-emerald-500">
      {icon}
    </span>
    <span className="font-mono text-xs uppercase tracking-widest">{label}</span>
  </div>
)
