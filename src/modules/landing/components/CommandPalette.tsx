import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
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
} from 'lucide-react'

// --- MOCK DATA FOR THE TERMINAL ---
const COMMANDS = [
  {
    id: 'cmd_1',
    type: 'ACTION',
    label: 'Initiate Forensic Scan',
    icon: <Zap className="h-4 w-4" />,
    shortcut: 'S',
  },
  {
    id: 'cmd_2',
    type: 'ACTION',
    label: 'Crystallize Current Period',
    icon: <ShieldCheck className="h-4 w-4" />,
    shortcut: 'C',
  },
  {
    id: 'nav_1',
    type: 'GO',
    label: 'Go to Settings',
    icon: <Settings className="h-4 w-4" />,
  },
]

const RECENT_HASHES = [
  {
    id: 'tx_1',
    type: 'HASH',
    label: '#AR_2024_Q4',
    sub: 'Critical Risk Found',
  },
  { id: 'tx_2', type: 'HASH', label: '#PO-8821', sub: 'Verified' },
  { id: 'tx_3', type: 'HASH', label: '#INV-9920', sub: 'Pending Match' },
]

interface CommandPaletteProps {
  isOpen?: boolean
  onClose?: () => void
}

export const CommandPalette = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
}: CommandPaletteProps = {}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Use controlled state if provided, otherwise use internal state
  const isOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen
  const setIsOpen = controlledOnClose ? controlledOnClose : setInternalIsOpen

  // Toggle Logic (Cmd+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (controlledOnClose) {
          // If controlled, just toggle
          if (controlledIsOpen) {
            controlledOnClose()
          } else {
            // Can't open from here in controlled mode
          }
        } else {
          setInternalIsOpen((open) => !open)
        }
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [controlledIsOpen, controlledOnClose])

  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose()
    } else {
      setInternalIsOpen(false)
    }
  }

  const handleOpen = () => {
    if (controlledOnClose) {
      // In controlled mode, can't open directly - parent controls this
      return
    }
    setInternalIsOpen(true)
  }

  return (
    <>
      {/* 1. THE TRIGGER (Sits in Header) - Only show if not controlled */}
      {controlledIsOpen === undefined && (
        <button
          onClick={handleOpen}
          className="group flex w-full max-w-md cursor-text items-center gap-3 rounded-lg border border-white/10 bg-zinc-950/80 px-4 py-2 shadow-lg transition-all duration-300 hover:border-emerald-500/50 hover:bg-zinc-900/80 hover:shadow-emerald-500/10"
        >
          <Search className="h-3.5 w-3.5 flex-shrink-0 text-zinc-500 transition-colors group-hover:text-emerald-400" />
          <span className="flex-1 text-left font-mono text-[10px] uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300">
            Search Canon...
          </span>
          <div className="flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5">
            <Command className="h-2.5 w-2.5 text-zinc-500" />
            <span className="font-mono text-[9px] tracking-wider text-zinc-400">
              K
            </span>
          </div>
        </button>
      )}

      {/* 2. THE MODAL (The Terminal) */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[20vh]">
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
              className="font-inter relative flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A] shadow-2xl"
            >
              {/* Header / Input */}
              <div className="relative flex items-center gap-4 border-b border-white/5 px-4 py-4">
                <Search className="h-5 w-5 text-emerald-500" />
                <input
                  autoFocus
                  placeholder="Type a command or search assets..."
                  className="flex-1 bg-transparent text-lg font-light text-white placeholder-zinc-600 focus:outline-none"
                  onChange={(e) => setQuery(e.target.value)}
                  value={query}
                />
                <button
                  onClick={handleClose}
                  className="rounded p-1 text-zinc-500 transition-colors hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body / Results */}
              <div className="custom-scrollbar max-h-[400px] space-y-1 overflow-y-auto p-2">
                {/* Section: System */}
                <div className="flex items-center gap-2 px-2 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  <div className="h-1 w-1 rounded-full bg-emerald-500" /> System
                  Commands
                </div>
                {COMMANDS.map((item, i) => (
                  <CommandItem
                    key={item.id}
                    item={item}
                    selected={i === selectedIndex}
                  />
                ))}

                {/* Section: Recent */}
                <div className="mt-4 flex items-center gap-2 px-2 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  <div className="h-1 w-1 rounded-full bg-purple-500" /> Recent
                  Forensic Scans
                </div>
                {RECENT_HASHES.map((item, i) => (
                  <CommandItem key={item.id} item={item} selected={false} />
                ))}
              </div>

              {/* Footer / Hints */}
              <div className="flex items-center justify-between border-t border-white/5 bg-zinc-950 px-4 py-2 font-mono text-[10px] text-zinc-500">
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
  )
}

// --- SUB-COMPONENT ---
const CommandItem = ({ item, selected }: any) => {
  return (
    <div
      className={`group flex cursor-pointer items-center justify-between rounded-lg px-3 py-3 transition-all duration-200 ${selected ? 'border border-emerald-500/20 bg-emerald-500/10' : 'border border-transparent hover:bg-white/5'} `}
    >
      <div className="flex items-center gap-3">
        <div
          className={`rounded-md p-1.5 ${selected ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}
        >
          {item.type === 'HASH' ? <Hash className="h-4 w-4" /> : item.icon}
        </div>
        <div className="flex flex-col">
          <span
            className={`text-sm ${selected ? 'text-white' : 'text-zinc-300'}`}
          >
            {item.label}
          </span>
          {item.sub && (
            <span className="mt-0.5 font-mono text-xs text-zinc-500">
              {item.sub}
            </span>
          )}
        </div>
      </div>

      {item.shortcut && (
        <div className="flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
          <span>⌘</span>
          <span>{item.shortcut}</span>
        </div>
      )}

      {item.type === 'HASH' && (
        <ArrowRight className="h-3 w-3 text-zinc-600 opacity-0 transition-colors group-hover:text-white group-hover:opacity-100" />
      )}
    </div>
  )
}
