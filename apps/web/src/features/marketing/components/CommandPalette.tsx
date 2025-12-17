import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Command,
  FileText,
  Settings,
  ShieldCheck,
  ArrowRight,
  Calculator,
  Hash,
  Zap,
  X,
} from 'lucide-react';

// --- MOCK DATA FOR THE TERMINAL ---
const COMMANDS = [
  {
    id: 'cmd_1',
    type: 'ACTION',
    label: 'Initiate Forensic Scan',
    icon: <Zap className="w-4 h-4" />,
    shortcut: 'S',
  },
  {
    id: 'cmd_2',
    type: 'ACTION',
    label: 'Crystallize Current Period',
    icon: <ShieldCheck className="w-4 h-4" />,
    shortcut: 'C',
  },
  { id: 'nav_1', type: 'GO', label: 'Go to Settings', icon: <Settings className="w-4 h-4" /> },
];

const RECENT_HASHES = [
  { id: 'tx_1', type: 'HASH', label: '#AR_2024_Q4', sub: 'Critical Risk Found' },
  { id: 'tx_2', type: 'HASH', label: '#PO-8821', sub: 'Verified' },
  { id: 'tx_3', type: 'HASH', label: '#INV-9920', sub: 'Pending Match' },
];

interface CommandPaletteProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const CommandPalette = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
}: CommandPaletteProps = {}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = controlledOnClose ? controlledOnClose : setInternalIsOpen;

  // Toggle Logic (Cmd+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (controlledOnClose) {
          // If controlled, just toggle
          if (controlledIsOpen) {
            controlledOnClose();
          } else {
            // Can't open from here in controlled mode
          }
        } else {
          setInternalIsOpen((open) => !open);
        }
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [controlledIsOpen, controlledOnClose]);

  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleOpen = () => {
    if (controlledOnClose) {
      // In controlled mode, can't open directly - parent controls this
      return;
    }
    setInternalIsOpen(true);
  };

  return (
    <>
      {/* 1. THE TRIGGER (Sits in Header) - Only show if not controlled */}
      {controlledIsOpen === undefined && (
        <button
          onClick={handleOpen}
          className="flex items-center gap-3 px-4 py-2 bg-zinc-950/80 border border-white/10 rounded-lg group hover:border-emerald-500/50 hover:bg-zinc-900/80 transition-all duration-300 cursor-text w-full max-w-md shadow-lg hover:shadow-emerald-500/10"
        >
          <Search className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
          <span className="text-[10px] text-zinc-500 font-mono group-hover:text-zinc-300 uppercase tracking-widest text-left flex-1">
            Search Canon...
          </span>
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
            <Command className="w-2.5 h-2.5 text-zinc-500" />
            <span className="text-[9px] font-mono text-zinc-400 tracking-wider">K</span>
          </div>
        </button>
      )}

      {/* 2. THE MODAL (The Terminal) */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-2xl bg-background border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans"
            >
              {/* Header / Input */}
              <div className="flex items-center gap-4 px-4 py-4 border-b border-white/5 relative">
                <Search className="w-5 h-5 text-emerald-500" />
                <input
                  autoFocus
                  placeholder="Type a command or search assets..."
                  className="flex-1 bg-transparent text-lg text-white placeholder-zinc-600 focus:outline-none font-light"
                  onChange={(e) => setQuery(e.target.value)}
                  value={query}
                />
                <button
                  onClick={handleClose}
                  className="p-1 rounded hover:bg-white/10 text-zinc-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body / Results */}
              <div className="max-h-[400px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {/* Section: System */}
                <div className="px-2 py-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full" /> System Commands
                </div>
                {COMMANDS.map((item, i) => (
                  <CommandItem key={item.id} item={item} selected={i === selectedIndex} />
                ))}

                {/* Section: Recent */}
                <div className="mt-4 px-2 py-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1 h-1 bg-purple-500 rounded-full" /> Recent Forensic Scans
                </div>
                {RECENT_HASHES.map((item, i) => (
                  <CommandItem key={item.id} item={item} selected={false} />
                ))}
              </div>

              {/* Footer / Hints */}
              <div className="px-4 py-2 bg-zinc-950 border-t border-white/5 flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                <div className="flex gap-4">
                  <span>
                    <span className="text-zinc-300">↑↓</span> to navigate
                  </span>
                  <span>
                    <span className="text-zinc-300">↵</span> to execute
                  </span>
                </div>
                <span className="opacity-50">NexusCanon Terminal v2.4</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

// --- SUB-COMPONENT ---
const CommandItem = ({ item, selected }: any) => {
  return (
    <div
      className={`
       flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 group
       ${selected ? 'bg-emerald-500/10 border border-emerald-500/20' : 'hover:bg-white/5 border border-transparent'}
    `}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-1.5 rounded-md ${selected ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}
        >
          {item.type === 'HASH' ? <Hash className="w-4 h-4" /> : item.icon}
        </div>
        <div className="flex flex-col">
          <span className={`text-sm ${selected ? 'text-white' : 'text-zinc-300'}`}>
            {item.label}
          </span>
          {item.sub && <span className="text-xs text-zinc-500 font-mono mt-0.5">{item.sub}</span>}
        </div>
      </div>

      {item.shortcut && (
        <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 border border-zinc-800 rounded px-1.5 py-0.5 bg-zinc-900">
          <span>⌘</span>
          <span>{item.shortcut}</span>
        </div>
      )}

      {item.type === 'HASH' && (
        <ArrowRight className="w-3 h-3 text-zinc-600 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100" />
      )}
    </div>
  );
};
