/**
 * BioCommandPalette - Global Search & Actions
 *
 * Enterprise-grade command palette (Cmd+K) with:
 * - Fuzzy search
 * - Categorized commands
 * - Recent searches
 * - Keyboard navigation
 * - Action shortcuts
 *
 * @example
 * <BioCommandPalette
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   commands={commands}
 *   onSelect={(cmd) => handleCommand(cmd)}
 * />
 */

'use client';

import * as React from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'motion/react';
import { Search, FileText, Settings, User, LayoutDashboard, X, ArrowRight, Clock } from 'lucide-react';
import { cn } from '../../atoms/utils';
import { Txt } from '../../atoms/Txt';
import { Btn } from '../../atoms/Btn';

// ============================================================
// Types
// ============================================================

export interface BioCommand {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Search keywords */
  keywords?: string[];
  /** Category/group */
  category?: string;
  /** Icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Keyboard shortcut */
  shortcut?: string;
  /** Action handler */
  onSelect?: () => void;
  /** Navigation href */
  href?: string;
  /** Disabled state */
  disabled?: boolean;
}

export interface BioCommandPaletteProps {
  /** Open state */
  open: boolean;
  /** Open change handler */
  onOpenChange: (open: boolean) => void;
  /** Available commands */
  commands: BioCommand[];
  /** Command selection handler */
  onSelect?: (command: BioCommand) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Show recent searches */
  showRecent?: boolean;
  /** Recent searches (controlled) */
  recentSearches?: string[];
  /** Max recent to show */
  maxRecent?: number;
  /** Footer content */
  footer?: React.ReactNode;
  /** Additional className */
  className?: string;
}

// ============================================================
// Default Icons for Categories
// ============================================================

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pages: LayoutDashboard,
  actions: ArrowRight,
  settings: Settings,
  users: User,
  documents: FileText,
};

// ============================================================
// Main Component
// ============================================================

export function BioCommandPalette({
  open,
  onOpenChange,
  commands,
  onSelect,
  placeholder = 'Type a command or search...',
  showRecent = true,
  recentSearches = [],
  maxRecent = 5,
  footer,
  className,
}: BioCommandPaletteProps) {
  const [search, setSearch] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Focus input when opened
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setSearch('');
    }
  }, [open]);

  // Global keyboard shortcut (Cmd+K / Ctrl+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  // Group commands by category
  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, BioCommand[]> = {};

    for (const cmd of commands) {
      const category = cmd.category || 'General';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(cmd);
    }

    return groups;
  }, [commands]);

  const handleSelect = (command: BioCommand) => {
    command.onSelect?.();
    onSelect?.(command);
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => onOpenChange(false)}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed top-[20%] left-1/2 -translate-x-1/2 z-50',
              'w-full max-w-xl',
              className
            )}
            data-testid="bio-command-palette"
          >
            <Command
              className="bg-surface-card border border-border-default rounded-lg shadow-2xl overflow-hidden"
              loop
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border-default">
                <Search className="w-5 h-5 text-text-muted flex-shrink-0" />
                <Command.Input
                  ref={inputRef}
                  value={search}
                  onValueChange={setSearch}
                  placeholder={placeholder}
                  className="flex-1 bg-transparent outline-none text-text-primary placeholder:text-text-muted"
                />
                {search && (
                  <Btn
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearch('')}
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </Btn>
                )}
              </div>

              {/* Results */}
              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center">
                  <Txt variant="body" color="muted">No results found.</Txt>
                </Command.Empty>

                {/* Recent searches */}
                {showRecent && !search && recentSearches.length > 0 && (
                  <Command.Group heading="Recent">
                    {recentSearches.slice(0, maxRecent).map((recent, i) => (
                      <Command.Item
                        key={`recent-${i}`}
                        value={recent}
                        onSelect={() => setSearch(recent)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer',
                          'hover:bg-surface-hover aria-selected:bg-surface-hover'
                        )}
                      >
                        <Clock className="w-4 h-4 text-text-muted" />
                        <span>{recent}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* Command groups */}
                {Object.entries(groupedCommands).map(([category, cmds]) => (
                  <Command.Group key={category} heading={category}>
                    {cmds.map((cmd) => {
                      const Icon = cmd.icon || categoryIcons[category.toLowerCase()] || FileText;

                      return (
                        <Command.Item
                          key={cmd.id}
                          value={[cmd.label, ...(cmd.keywords || [])].join(' ')}
                          onSelect={() => handleSelect(cmd)}
                          disabled={cmd.disabled}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer',
                            'hover:bg-surface-hover aria-selected:bg-surface-hover',
                            cmd.disabled && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <Icon className="w-4 h-4 text-text-muted flex-shrink-0" />
                          <span className="flex-1">{cmd.label}</span>
                          {cmd.shortcut && (
                            <kbd className="px-1.5 py-0.5 text-xs bg-surface-subtle rounded border border-border-default">
                              {cmd.shortcut}
                            </kbd>
                          )}
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                ))}
              </Command.List>

              {/* Footer */}
              {footer && (
                <div className="px-4 py-2 border-t border-border-default bg-surface-subtle">
                  {footer}
                </div>
              )}

              {/* Default footer with hints */}
              {!footer && (
                <div className="px-4 py-2 border-t border-border-default bg-surface-subtle flex items-center justify-between text-xs text-text-muted">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1 bg-surface-card rounded border border-border-default">↑↓</kbd>
                      navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1 bg-surface-card rounded border border-border-default">↵</kbd>
                      select
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1 bg-surface-card rounded border border-border-default">esc</kbd>
                      close
                    </span>
                  </div>
                </div>
              )}
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// Component Meta
// ============================================================

export const COMPONENT_META = {
  code: 'CMDPALETTE01',
  version: '1.0.0',
  family: 'NAVIGATION',
  purpose: 'SEARCH',
  status: 'active',
} as const;
