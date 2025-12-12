// ============================================================================
// KEYBOARD SHORTCUTS OVERLAY - Help Dialog
// Figma Best Practice: Visible keyboard shortcuts like Figma/Linear
// ============================================================================

import { AnimatePresence, motion } from 'motion/react'
import { X, Command } from 'lucide-react'

interface KeyboardShortcutsProps {
  isOpen: boolean
  onClose: () => void
}

interface Shortcut {
  keys: string[]
  description: string
  category: 'navigation' | 'actions' | 'general'
}

const SHORTCUTS: Shortcut[] = [
  // Navigation
  {
    keys: ['Cmd', 'K'],
    description: 'Open command palette',
    category: 'navigation',
  },
  {
    keys: ['Cmd', '.'],
    description: 'Toggle Meta navigation',
    category: 'navigation',
  },
  {
    keys: ['Cmd', '1'],
    description: 'Jump to META_01',
    category: 'navigation',
  },
  {
    keys: ['Cmd', '2'],
    description: 'Jump to META_02',
    category: 'navigation',
  },
  {
    keys: ['Cmd', '3'],
    description: 'Jump to META_03',
    category: 'navigation',
  },
  {
    keys: ['Cmd', '4'],
    description: 'Jump to META_04',
    category: 'navigation',
  },
  {
    keys: ['Cmd', '5'],
    description: 'Jump to META_05',
    category: 'navigation',
  },
  {
    keys: ['Cmd', '6'],
    description: 'Jump to META_06',
    category: 'navigation',
  },
  {
    keys: ['Cmd', '7'],
    description: 'Jump to META_07',
    category: 'navigation',
  },
  {
    keys: ['Cmd', '8'],
    description: 'Jump to META_08',
    category: 'navigation',
  },

  // Actions (META_03 specific)
  {
    keys: ['Cmd', 'D'],
    description: 'Toggle table density',
    category: 'actions',
  },
  {
    keys: ['Cmd', 'F'],
    description: 'Focus search/filter',
    category: 'actions',
  },

  // General
  {
    keys: ['Cmd', '/'],
    description: 'Show keyboard shortcuts',
    category: 'general',
  },
  { keys: ['Esc'], description: 'Close overlay/dialog', category: 'general' },
]

export function MetaKeyboardShortcuts({
  isOpen,
  onClose,
}: KeyboardShortcutsProps) {
  const isMac =
    typeof navigator !== 'undefined' &&
    navigator.platform.toUpperCase().indexOf('MAC') >= 0

  const renderKey = (key: string) => {
    // Replace Cmd with Ctrl on Windows
    const displayKey = !isMac && key === 'Cmd' ? 'Ctrl' : key

    return (
      <kbd className="inline-flex h-7 min-w-[28px] items-center justify-center border border-[#333] bg-[#0A0A0A] px-2 font-mono text-xs text-[#CCC]">
        {displayKey === 'Cmd' ? <Command className="h-3 w-3" /> : displayKey}
      </kbd>
    )
  }

  const groupedShortcuts = {
    navigation: SHORTCUTS.filter((s) => s.category === 'navigation'),
    actions: SHORTCUTS.filter((s) => s.category === 'actions'),
    general: SHORTCUTS.filter((s) => s.category === 'general'),
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(40, 231, 162, 0.01) 2px, rgba(40, 231, 162, 0.01) 4px)',
          }}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-3xl border-2 border-[#28E7A2] bg-[#000000]"
        >
          {/* Top Glow */}
          <div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#28E7A2] to-transparent" />

          {/* Header */}
          <div className="border-b border-[#1F1F1F] px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="mb-1 text-lg tracking-wide text-white">
                  Keyboard Shortcuts
                </h2>
                <p className="font-mono text-xs uppercase tracking-wider text-[#666]">
                  Meta Navigation System
                </p>
              </div>
              <button
                onClick={onClose}
                className="group flex h-8 w-8 items-center justify-center border border-[#333] transition-colors hover:border-[#28E7A2]"
              >
                <X className="h-4 w-4 text-[#666] group-hover:text-[#28E7A2]" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[600px] overflow-y-auto p-6">
            {/* Navigation Shortcuts */}
            <div className="mb-8">
              <h3 className="mb-4 font-mono text-xs uppercase tracking-wider text-[#28E7A2]">
                Navigation
              </h3>
              <div className="space-y-3">
                {groupedShortcuts.navigation.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-[#1F1F1F] py-2"
                  >
                    <span className="text-sm text-[#CCC]">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {shortcut.keys.map((key, i) => (
                        <span key={i} className="flex items-center gap-1.5">
                          {renderKey(key)}
                          {i < shortcut.keys.length - 1 && (
                            <span className="text-xs text-[#666]">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Shortcuts */}
            <div className="mb-8">
              <h3 className="mb-4 font-mono text-xs uppercase tracking-wider text-[#28E7A2]">
                Actions
              </h3>
              <div className="space-y-3">
                {groupedShortcuts.actions.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-[#1F1F1F] py-2"
                  >
                    <span className="text-sm text-[#CCC]">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {shortcut.keys.map((key, i) => (
                        <span key={i} className="flex items-center gap-1.5">
                          {renderKey(key)}
                          {i < shortcut.keys.length - 1 && (
                            <span className="text-xs text-[#666]">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* General Shortcuts */}
            <div>
              <h3 className="mb-4 font-mono text-xs uppercase tracking-wider text-[#28E7A2]">
                General
              </h3>
              <div className="space-y-3">
                {groupedShortcuts.general.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-[#1F1F1F] py-2"
                  >
                    <span className="text-sm text-[#CCC]">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {shortcut.keys.map((key, i) => (
                        <span key={i} className="flex items-center gap-1.5">
                          {renderKey(key)}
                          {i < shortcut.keys.length - 1 && (
                            <span className="text-xs text-[#666]">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-[#1F1F1F] bg-[#0A0A0A] px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[9px] uppercase tracking-wider text-[#444]">
                {isMac ? 'macOS' : 'Windows/Linux'} Shortcuts
              </div>
              <div className="font-mono text-[9px] uppercase tracking-wider text-[#444]">
                Press{' '}
                <kbd className="border border-[#333] bg-[#1F1F1F] px-1.5 py-0.5 text-[#666]">
                  Esc
                </kbd>{' '}
                to close
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
