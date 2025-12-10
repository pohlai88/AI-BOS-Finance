import { motion } from 'motion/react';
import { Search, Database, FileText, BarChart3, LogIn, Hexagon } from 'lucide-react';

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between bg-zinc-950/80 backdrop-blur-md border border-white/10 rounded-full px-6 py-3">
        
        {/* --- LEFT: SYSTEM CONTEXT --- */}
        <div className="flex items-center gap-8">
          
          {/* 1. Logo (The Core) */}
          <div className="flex items-center gap-3 cursor-pointer group">
             <motion.div 
               className="relative"
               whileHover={{ scale: 1.1, rotate: 180 }}
               transition={{ duration: 0.6, ease: "easeInOut" }}
             >
                <Hexagon className="w-6 h-6 text-emerald-400 fill-emerald-400/10" />
                <div className="absolute inset-0 bg-emerald-400/20 blur-md rounded-full" />
             </motion.div>
             <span className="text-sm tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                NexusCanon
             </span>
          </div>

          {/* 2. System Modules (Navigation) */}
          <nav className="hidden md:flex items-center gap-6">
             <NavItem label="Protocol Specs" icon={<FileText className="w-3 h-3" />} />
             <NavItem label="Intelligence" icon={<BarChart3 className="w-3 h-3" />} />
          </nav>

        </div>

        {/* --- RIGHT: USER CONTROL --- */}
        <div className="flex items-center gap-6">
           
           {/* 3. Global Search (Command Line) */}
           <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-black/50 border border-white/10 rounded-md group hover:border-emerald-500/50 transition-colors cursor-text">
              <Search className="w-3 h-3 text-zinc-500 group-hover:text-emerald-500 transition-colors" />
              <span className="text-xs text-zinc-600 font-mono group-hover:text-zinc-400">Search ledger hash...</span>
              <span className="ml-4 text-[10px] text-zinc-700 border border-zinc-800 px-1 rounded">⌘K</span>
           </div>

           {/* 4. Data Vaults */}
           <div className="hidden md:flex items-center gap-2 cursor-pointer hover:text-white transition-colors text-zinc-400">
              <Database className="w-4 h-4" />
              <span className="text-xs font-mono uppercase tracking-widest">Data Vaults</span>
           </div>

           {/* 5. Terminal Access (Primary CTA) */}
           <button className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-emerald-400 transition-colors rounded-full text-xs tracking-wide uppercase">
              <LogIn className="w-3 h-3" />
              <span>Terminal Access</span>
           </button>

        </div>

      </div>
    </header>
  );
};

// --- SUB-COMPONENT ---
const NavItem = ({ label, icon }: { label: string; icon: React.ReactNode }) => (
  <div className="flex items-center gap-2 text-zinc-400 hover:text-white cursor-pointer transition-colors group">
     <span className="text-zinc-600 group-hover:text-emerald-500 transition-colors">{icon}</span>
     <span className="text-xs font-mono uppercase tracking-widest">{label}</span>
  </div>
);
