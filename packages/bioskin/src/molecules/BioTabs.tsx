/**
 * BioTabs - Browser-like tab system
 *
 * Features:
 * - Closable tabs
 * - Tab overflow with scroll
 * - Drag to reorder
 * - Context menu
 * - Keyboard shortcuts
 * - Tab persistence
 */

'use client';

import * as React from 'react';
import { X, Plus, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '../atoms/utils';
import { Txt } from '../atoms/Txt';
import { type LucideIcon } from 'lucide-react';

// ============================================================
// Types
// ============================================================

export interface BioTab {
  /** Unique tab ID */
  id: string;
  /** Tab label */
  label: string;
  /** Tab icon */
  icon?: LucideIcon;
  /** Tab href/route */
  href?: string;
  /** Is tab closable */
  closable?: boolean;
  /** Is tab dirty (unsaved changes) */
  isDirty?: boolean;
  /** Tab metadata */
  meta?: Record<string, unknown>;
}

export interface BioTabsProps {
  /** Array of tabs */
  tabs: BioTab[];
  /** Active tab ID */
  activeTabId: string;
  /** Called when tab is selected */
  onTabSelect: (tabId: string) => void;
  /** Called when tab is closed */
  onTabClose?: (tabId: string) => void;
  /** Called when new tab is requested */
  onNewTab?: () => void;
  /** Called when tabs are reordered */
  onTabsReorder?: (tabs: BioTab[]) => void;
  /** Show new tab button */
  showNewTabButton?: boolean;
  /** Maximum number of tabs */
  maxTabs?: number;
  /** Persist tabs to localStorage */
  persistKey?: string;
  /** Additional className */
  className?: string;
}

// ============================================================
// Component
// ============================================================

export function BioTabs({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onNewTab,
  onTabsReorder,
  showNewTabButton = true,
  maxTabs = 20,
  persistKey,
  className,
}: BioTabsProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const [draggedTab, setDraggedTab] = React.useState<string | null>(null);
  const [contextMenu, setContextMenu] = React.useState<{ tabId: string; x: number; y: number } | null>(null);

  // Check scroll state
  const updateScrollState = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  }, []);

  React.useEffect(() => {
    updateScrollState();
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollState);
      window.addEventListener('resize', updateScrollState);
    }
    return () => {
      container?.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, tabs]);

  // Scroll handlers
  const scrollLeft = () => {
    containerRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = () => {
    containerRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  };

  // Scroll active tab into view
  React.useEffect(() => {
    const container = containerRef.current;
    const activeTab = container?.querySelector(`[data-tab-id="${activeTabId}"]`);
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTabId]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTab(tabId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedTab || draggedTab === targetId || !onTabsReorder) return;

    const draggedIndex = tabs.findIndex(t => t.id === draggedTab);
    const targetIndex = tabs.findIndex(t => t.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newTabs = [...tabs];
    const [removed] = newTabs.splice(draggedIndex, 1);
    newTabs.splice(targetIndex, 0, removed);

    onTabsReorder(newTabs);
    setDraggedTab(null);
  };

  const handleDragEnd = () => {
    setDraggedTab(null);
  };

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({ tabId, x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => setContextMenu(null);

  // Close tab with middle click
  const handleMouseDown = (e: React.MouseEvent, tabId: string) => {
    if (e.button === 1 && onTabClose) {
      e.preventDefault();
      onTabClose(tabId);
    }
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;

      // Ctrl+W to close current tab
      if (isCtrl && e.key === 'w' && onTabClose) {
        e.preventDefault();
        const activeTab = tabs.find(t => t.id === activeTabId);
        if (activeTab?.closable !== false) {
          onTabClose(activeTabId);
        }
      }

      // Ctrl+T to open new tab
      if (isCtrl && e.key === 't' && onNewTab && tabs.length < maxTabs) {
        e.preventDefault();
        onNewTab();
      }

      // Ctrl+Tab to switch tabs
      if (isCtrl && e.key === 'Tab') {
        e.preventDefault();
        const currentIndex = tabs.findIndex(t => t.id === activeTabId);
        const nextIndex = e.shiftKey
          ? (currentIndex - 1 + tabs.length) % tabs.length
          : (currentIndex + 1) % tabs.length;
        onTabSelect(tabs[nextIndex].id);
      }

      // Ctrl+1-9 to select tab by number
      if (isCtrl && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (index < tabs.length) {
          onTabSelect(tabs[index].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTabId, onTabSelect, onTabClose, onNewTab, maxTabs]);

  // Close context menu on outside click
  React.useEffect(() => {
    if (contextMenu) {
      const handler = () => closeContextMenu();
      window.addEventListener('click', handler);
      return () => window.removeEventListener('click', handler);
    }
  }, [contextMenu]);

  // Persist tabs
  React.useEffect(() => {
    if (persistKey && tabs.length > 0) {
      try {
        localStorage.setItem(`bioskin_tabs_${persistKey}`, JSON.stringify({ tabs, activeTabId }));
      } catch (error) {
        console.error('Failed to persist tabs:', error);
      }
    }
  }, [tabs, activeTabId, persistKey]);

  return (
    <div className={cn('flex items-center bg-surface-subtle border-b border-default', className)}>
      {/* Scroll Left Button */}
      {canScrollLeft && (
        <button
          onClick={scrollLeft}
          className="flex-shrink-0 p-2 hover:bg-surface-hover transition-colors"
          aria-label="Scroll tabs left"
        >
          <ChevronLeft className="h-4 w-4 text-text-secondary" />
        </button>
      )}

      {/* Tabs Container */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTabId;
          const Icon = tab.icon;

          return (
            <div
              key={tab.id}
              data-tab-id={tab.id}
              draggable={!!onTabsReorder}
              onDragStart={(e) => handleDragStart(e, tab.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, tab.id)}
              onDragEnd={handleDragEnd}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              onMouseDown={(e) => handleMouseDown(e, tab.id)}
              onClick={() => onTabSelect(tab.id)}
              className={cn(
                'group relative flex items-center gap-2 px-4 py-2.5 border-r border-default',
                'cursor-pointer select-none transition-colors min-w-[120px] max-w-[200px]',
                isActive
                  ? 'bg-surface-base border-b-2 border-b-accent-primary -mb-px'
                  : 'hover:bg-surface-hover',
                draggedTab === tab.id && 'opacity-50'
              )}
            >
              {/* Tab Icon */}
              {Icon && (
                <Icon className={cn(
                  'h-4 w-4 flex-shrink-0',
                  isActive ? 'text-accent-primary' : 'text-text-tertiary'
                )} />
              )}

              {/* Tab Label */}
              <Txt
                variant="small"
                color={isActive ? 'primary' : 'secondary'}
                className="truncate flex-1"
              >
                {tab.label}
              </Txt>

              {/* Dirty Indicator */}
              {tab.isDirty && (
                <div className="w-2 h-2 rounded-full bg-status-warning flex-shrink-0" />
              )}

              {/* Close Button */}
              {tab.closable !== false && onTabClose && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  className={cn(
                    'p-0.5 rounded hover:bg-surface-nested transition-colors',
                    'opacity-0 group-hover:opacity-100',
                    isActive && 'opacity-100'
                  )}
                  aria-label={`Close ${tab.label}`}
                >
                  <X className="h-3.5 w-3.5 text-text-tertiary hover:text-text-primary" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      {canScrollRight && (
        <button
          onClick={scrollRight}
          className="flex-shrink-0 p-2 hover:bg-surface-hover transition-colors"
          aria-label="Scroll tabs right"
        >
          <ChevronRight className="h-4 w-4 text-text-secondary" />
        </button>
      )}

      {/* New Tab Button */}
      {showNewTabButton && onNewTab && tabs.length < maxTabs && (
        <button
          onClick={onNewTab}
          className="flex-shrink-0 p-2 hover:bg-surface-hover transition-colors border-l border-default"
          aria-label="New tab"
        >
          <Plus className="h-4 w-4 text-text-secondary" />
        </button>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-surface-base border border-default rounded-lg shadow-lg py-1 min-w-[150px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              if (onTabClose) onTabClose(contextMenu.tabId);
              closeContextMenu();
            }}
            className="w-full px-3 py-1.5 text-left text-small hover:bg-surface-hover transition-colors"
          >
            Close Tab
          </button>
          <button
            onClick={() => {
              tabs.filter(t => t.id !== contextMenu.tabId && t.closable !== false)
                .forEach(t => onTabClose?.(t.id));
              closeContextMenu();
            }}
            className="w-full px-3 py-1.5 text-left text-small hover:bg-surface-hover transition-colors"
          >
            Close Other Tabs
          </button>
          <button
            onClick={() => {
              const index = tabs.findIndex(t => t.id === contextMenu.tabId);
              tabs.slice(index + 1)
                .filter(t => t.closable !== false)
                .forEach(t => onTabClose?.(t.id));
              closeContextMenu();
            }}
            className="w-full px-3 py-1.5 text-left text-small hover:bg-surface-hover transition-colors"
          >
            Close Tabs to the Right
          </button>
        </div>
      )}
    </div>
  );
}

BioTabs.displayName = 'BioTabs';

// ============================================================
// Hook for managing tabs
// ============================================================

export interface UseTabsOptions {
  /** Initial tabs */
  initialTabs?: BioTab[];
  /** Initial active tab ID */
  initialActiveId?: string;
  /** Called when navigating to a tab */
  onNavigate?: (tab: BioTab) => void;
  /** Persist to localStorage */
  persistKey?: string;
}

export interface UseTabsReturn {
  tabs: BioTab[];
  activeTabId: string;
  openTab: (tab: BioTab) => void;
  closeTab: (tabId: string) => void;
  selectTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<BioTab>) => void;
  reorderTabs: (tabs: BioTab[]) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (keepTabId: string) => void;
}

export function useTabs({
  initialTabs = [],
  initialActiveId,
  onNavigate,
  persistKey,
}: UseTabsOptions = {}): UseTabsReturn {
  const [tabs, setTabs] = React.useState<BioTab[]>(initialTabs);
  const [activeTabId, setActiveTabId] = React.useState<string>(
    initialActiveId || initialTabs[0]?.id || ''
  );

  // Load persisted tabs
  React.useEffect(() => {
    if (persistKey) {
      try {
        const stored = localStorage.getItem(`bioskin_tabs_${persistKey}`);
        if (stored) {
          const { tabs: storedTabs, activeTabId: storedActive } = JSON.parse(stored);
          if (storedTabs?.length) {
            setTabs(storedTabs);
            setActiveTabId(storedActive || storedTabs[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to load tabs:', error);
      }
    }
  }, [persistKey]);

  const openTab = React.useCallback((tab: BioTab) => {
    setTabs(prev => {
      const existing = prev.find(t => t.id === tab.id);
      if (existing) {
        setActiveTabId(tab.id);
        onNavigate?.(tab);
        return prev;
      }
      return [...prev, tab];
    });
    setActiveTabId(tab.id);
    onNavigate?.(tab);
  }, [onNavigate]);

  const closeTab = React.useCallback((tabId: string) => {
    setTabs(prev => {
      const index = prev.findIndex(t => t.id === tabId);
      if (index === -1) return prev;

      const newTabs = prev.filter(t => t.id !== tabId);

      // If closing active tab, select adjacent tab
      if (tabId === activeTabId && newTabs.length > 0) {
        const newIndex = Math.min(index, newTabs.length - 1);
        setActiveTabId(newTabs[newIndex].id);
        onNavigate?.(newTabs[newIndex]);
      }

      return newTabs;
    });
  }, [activeTabId, onNavigate]);

  const selectTab = React.useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setActiveTabId(tabId);
      onNavigate?.(tab);
    }
  }, [tabs, onNavigate]);

  const updateTab = React.useCallback((tabId: string, updates: Partial<BioTab>) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, ...updates } : t));
  }, []);

  const reorderTabs = React.useCallback((newTabs: BioTab[]) => {
    setTabs(newTabs);
  }, []);

  const closeAllTabs = React.useCallback(() => {
    setTabs(prev => prev.filter(t => t.closable === false));
  }, []);

  const closeOtherTabs = React.useCallback((keepTabId: string) => {
    setTabs(prev => prev.filter(t => t.id === keepTabId || t.closable === false));
    setActiveTabId(keepTabId);
  }, []);

  return {
    tabs,
    activeTabId,
    openTab,
    closeTab,
    selectTab,
    updateTab,
    reorderTabs,
    closeAllTabs,
    closeOtherTabs,
  };
}
