// ============================================================================
// META COMMAND PALETTE - Universal Search & Quick Actions
// Figma Best Practice: Cmd+K pattern like Linear/Notion/Raycast
// ENHANCED: Now includes recent pages tracking
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, ArrowRight, Layers, Database, Shield, 
  AlertTriangle, Activity, MessageSquare, BookOpen, Home,
  Clock, Star
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRecentPages, type RecentPage } from '../../lib/stateManager';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Command {
  id: string;
  title: string;
  subtitle?: string;
  icon: any;
  action: () => void;
  category: 'navigation' | 'action' | 'recent';
  keywords?: string[];
  timestamp?: number; // For recent pages
}

export function MetaCommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { recentPages } = useRecentPages();

  // All available commands
  const navigationCommands: Command[] = [
    // Navigation
    {
      id: 'nav-home',
      title: 'Home',
      subtitle: 'Landing Page',
      icon: Home,
      action: () => { navigate('/'); onClose(); },
      category: 'navigation',
      keywords: ['home', 'landing', 'start']
    },
    {
      id: 'nav-meta01',
      title: 'Forensic Architecture',
      subtitle: 'META_01 // System Doctrine',
      icon: Layers,
      action: () => { navigate('/meta-architecture'); onClose(); },
      category: 'navigation',
      keywords: ['meta', '01', 'architecture', 'doctrine']
    },
    {
      id: 'nav-meta02',
      title: 'Registry // God View',
      subtitle: 'META_02 // Universal Search',
      icon: Database,
      action: () => { navigate('/meta-registry'); onClose(); },
      category: 'navigation',
      keywords: ['meta', '02', 'registry', 'god view', 'search']
    },
    {
      id: 'nav-meta03',
      title: 'The Prism',
      subtitle: 'META_03 // Morphology Comparator',
      icon: Layers,
      action: () => { navigate('/meta-registry/PRISM'); onClose(); },
      category: 'navigation',
      keywords: ['meta', '03', 'prism', 'comparator', 'lemon']
    },
    {
      id: 'nav-meta04',
      title: 'Risk Radar',
      subtitle: 'META_04 // Stay Out of Jail',
      icon: AlertTriangle,
      action: () => { navigate('/meta-risk'); onClose(); },
      category: 'navigation',
      keywords: ['meta', '04', 'risk', 'radar', 'jail', 'compliance']
    },
    {
      id: 'nav-meta05',
      title: 'Canon Matrix',
      subtitle: 'META_05 // Governance Hierarchy',
      icon: Shield,
      action: () => { navigate('/meta-canon'); onClose(); },
      category: 'navigation',
      keywords: ['meta', '05', 'canon', 'matrix', 'governance']
    },
    {
      id: 'nav-meta06',
      title: 'Health Scan',
      subtitle: 'META_06 // BYOS Telemetry',
      icon: Activity,
      action: () => { navigate('/meta-health'); onClose(); },
      category: 'navigation',
      keywords: ['meta', '06', 'health', 'scan', 'byos']
    },
    {
      id: 'nav-meta07',
      title: 'Lynx Codex',
      subtitle: 'META_07 // AI Investigator',
      icon: MessageSquare,
      action: () => { navigate('/meta-lynx'); onClose(); },
      category: 'navigation',
      keywords: ['meta', '07', 'lynx', 'codex', 'ai', 'chat']
    },
    {
      id: 'nav-meta08',
      title: 'Implementation Playbook',
      subtitle: 'META_08 // Start Guide',
      icon: BookOpen,
      action: () => { navigate('/implementation-playbook'); onClose(); },
      category: 'navigation',
      keywords: ['meta', '08', 'implementation', 'playbook', 'start']
    },
  ];

  // Convert recent pages to commands
  const recentCommands: Command[] = recentPages.map(page => ({
    id: `recent-${page.path}`,
    title: page.title,
    subtitle: page.path,
    icon: Clock,
    action: () => { navigate(page.path); onClose(); },
    category: 'recent',
    timestamp: page.timestamp
  }));

  // Combine all commands
  const allCommands: Command[] = [
    ...navigationCommands,
    ...recentCommands
  ];

  // Filter commands based on search
  const filteredCommands = allCommands.filter(cmd => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(searchLower) ||
      cmd.subtitle?.toLowerCase().includes(searchLower) ||
      cmd.keywords?.some(kw => kw.toLowerCase().includes(searchLower))
    );
  });

  // Reset search when opened
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
        
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(40, 231, 162, 0.01) 2px, rgba(40, 231, 162, 0.01) 4px)'
          }}
        />

        {/* Palette */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -20 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-2xl bg-[#000000] border-2 border-[#28E7A2] overflow-hidden"
        >
          
          {/* Top Glow */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#28E7A2] to-transparent" />

          {/* Search Input */}
          <div className="relative border-b border-[#1F1F1F]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search commands, pages, and actions..."
              className="w-full bg-transparent text-white pl-12 pr-4 py-4 font-mono text-sm outline-none placeholder:text-[#666]"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#444] uppercase tracking-wider">
              ESC to close
            </div>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="py-12 text-center">
                <div className="font-mono text-sm text-[#666] mb-2">
                  No results found
                </div>
                <div className="font-mono text-xs text-[#444]">
                  Try searching for &quot;meta&quot; or &quot;registry&quot;
                </div>
              </div>
            ) : (
              filteredCommands.map((cmd, index) => {
                const Icon = cmd.icon;
                const isSelected = index === selectedIndex;

                return (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`
                      w-full flex items-center gap-4 px-4 py-3 border-b border-[#1F1F1F] transition-all
                      ${isSelected 
                        ? 'bg-[#0D1510] border-l-2 border-l-[#28E7A2]' 
                        : 'hover:bg-[#0A0A0A]'
                      }
                    `}
                  >
                    {/* Icon */}
                    <div className={`
                      w-8 h-8 border flex items-center justify-center shrink-0
                      ${isSelected ? 'border-[#28E7A2]' : 'border-[#333]'}
                    `}>
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-[#28E7A2]' : 'text-[#666]'}`} />
                    </div>

                    {/* Text */}
                    <div className="flex-1 text-left">
                      <div className={`font-mono text-sm mb-0.5 ${isSelected ? 'text-white' : 'text-[#CCC]'}`}>
                        {cmd.title}
                      </div>
                      {cmd.subtitle && (
                        <div className="font-mono text-xs text-[#666]">
                          {cmd.subtitle}
                        </div>
                      )}
                    </div>

                    {/* Arrow */}
                    {isSelected && (
                      <ArrowRight className="w-4 h-4 text-[#28E7A2]" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[#1F1F1F] px-4 py-3 flex items-center justify-between bg-[#0A0A0A]">
            <div className="font-mono text-[9px] text-[#444] uppercase tracking-wider">
              {filteredCommands.length} result{filteredCommands.length !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-4 font-mono text-[9px] text-[#444] uppercase tracking-wider">
              <span><kbd className="px-1.5 py-0.5 bg-[#1F1F1F] border border-[#333] text-[#666]">↑↓</kbd> Navigate</span>
              <span><kbd className="px-1.5 py-0.5 bg-[#1F1F1F] border border-[#333] text-[#666]">↵</kbd> Select</span>
            </div>
          </div>

        </motion.div>

      </div>
    </AnimatePresence>
  );
}