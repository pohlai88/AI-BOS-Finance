'use client';

/**
 * BioSavedViews - Save and load filter views
 * @see FINANCE_ERP_GAP_ANALYSIS.md - Requirement #6
 */

import * as React from 'react';
import { motion as Motion, AnimatePresence } from 'motion/react';
import { Bookmark, BookmarkCheck, Plus, Trash2, Edit2, Check, X, Star, StarOff, ChevronDown } from 'lucide-react';
import { cn } from '../atoms/utils';
import { Btn } from '../atoms/Btn';

// ============================================================
// Types
// ============================================================

export interface SavedView {
  id: string;
  name: string;
  entityType: string;
  filters: Record<string, unknown>;
  isDefault?: boolean;
  isShared?: boolean;
  createdBy?: string;
  createdAt?: Date;
  lastUsedAt?: Date;
}

export interface BioSavedViewsProps {
  entityType: string;
  currentFilters: Record<string, unknown>;
  views?: SavedView[];
  activeViewId?: string;
  onLoad?: (view: SavedView) => void;
  onSave?: (name: string, filters: Record<string, unknown>) => void;
  onUpdate?: (viewId: string, updates: Partial<SavedView>) => void;
  onDelete?: (viewId: string) => void;
  onSetDefault?: (viewId: string) => void;
  className?: string;
  compact?: boolean;
}

const DROPDOWN_ANIMATION = {
  initial: { opacity: 0, y: -10, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.95 },
  transition: { duration: 0.15 },
};

export const BioSavedViews = React.memo(function BioSavedViews({
  entityType,
  currentFilters,
  views = [],
  activeViewId,
  onLoad,
  onSave,
  onUpdate,
  onDelete,
  onSetDefault,
  className,
  compact = false,
}: BioSavedViewsProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);
  const [newViewName, setNewViewName] = React.useState('');
  const [editingViewId, setEditingViewId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const entityViews = React.useMemo(() => views.filter((v) => v.entityType === entityType), [views, entityType]);
  const activeView = React.useMemo(() => entityViews.find((v) => v.id === activeViewId), [entityViews, activeViewId]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = React.useCallback(() => {
    if (!newViewName.trim()) return;
    onSave?.(newViewName.trim(), currentFilters);
    setNewViewName('');
    setShowSaveDialog(false);
  }, [newViewName, currentFilters, onSave]);

  const handleRename = React.useCallback(
    (viewId: string) => {
      if (!editingName.trim()) return;
      onUpdate?.(viewId, { name: editingName.trim() });
      setEditingViewId(null);
      setEditingName('');
    },
    [editingName, onUpdate]
  );

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <Btn variant="outline" size={compact ? 'sm' : 'md'} onClick={() => setIsOpen(!isOpen)}>
        {activeView ? <BookmarkCheck size={14} className="mr-2" /> : <Bookmark size={14} className="mr-2" />}
        {activeView ? activeView.name : 'Saved Views'}
        <ChevronDown size={14} className={cn('ml-2 transition-transform', isOpen && 'rotate-180')} />
      </Btn>

      <AnimatePresence>
        {isOpen && (
          <Motion.div {...DROPDOWN_ANIMATION} className={cn('absolute top-full left-0 mt-2 z-50 min-w-[280px] rounded-lg border bg-popover shadow-lg overflow-hidden')}>
            <div className="max-h-[300px] overflow-y-auto">
              {entityViews.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">No saved views yet</div>
              ) : (
                entityViews.map((view) => (
                  <div key={view.id} className={cn('flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-b-0', view.id === activeViewId && 'bg-primary/5')}>
                    {editingViewId === view.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border rounded"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(view.id);
                            if (e.key === 'Escape') setEditingViewId(null);
                          }}
                        />
                        <button onClick={() => handleRename(view.id)} className="p-1 hover:bg-muted rounded"><Check size={14} className="text-green-600" /></button>
                        <button onClick={() => setEditingViewId(null)} className="p-1 hover:bg-muted rounded"><X size={14} className="text-muted-foreground" /></button>
                      </div>
                    ) : (
                      <>
                        <div
                          className="flex-1"
                          onClick={() => {
                            onLoad?.(view);
                            setIsOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{view.name}</span>
                            {view.isDefault && <Star size={12} className="text-amber-500 fill-amber-500" />}
                            {view.isShared && <span className="text-xs text-muted-foreground">(shared)</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {onSetDefault && (
                            <button onClick={(e) => { e.stopPropagation(); onSetDefault(view.id); }} className="p-1 hover:bg-muted rounded" title={view.isDefault ? 'Remove default' : 'Set as default'}>
                              {view.isDefault ? <StarOff size={14} className="text-muted-foreground" /> : <Star size={14} className="text-muted-foreground" />}
                            </button>
                          )}
                          {onUpdate && (
                            <button onClick={(e) => { e.stopPropagation(); setEditingViewId(view.id); setEditingName(view.name); }} className="p-1 hover:bg-muted rounded">
                              <Edit2 size={14} className="text-muted-foreground" />
                            </button>
                          )}
                          {onDelete && !view.isDefault && (
                            <button onClick={(e) => { e.stopPropagation(); onDelete(view.id); }} className="p-1 hover:bg-muted rounded">
                              <Trash2 size={14} className="text-red-500" />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
            {onSave && (
              <div className="border-t p-2">
                {showSaveDialog ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newViewName}
                      onChange={(e) => setNewViewName(e.target.value)}
                      placeholder="View name..."
                      className="flex-1 px-2 py-1.5 text-sm border rounded"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave();
                        if (e.key === 'Escape') setShowSaveDialog(false);
                      }}
                    />
                    <Btn size="sm" onClick={handleSave} disabled={!newViewName.trim()}>Save</Btn>
                    <Btn size="sm" variant="ghost" onClick={() => { setShowSaveDialog(false); setNewViewName(''); }}>Cancel</Btn>
                  </div>
                ) : (
                  <Btn variant="ghost" size="sm" className="w-full justify-start" onClick={() => setShowSaveDialog(true)}>
                    <Plus size={14} className="mr-2" /> Save current view
                  </Btn>
                )}
              </div>
            )}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

BioSavedViews.displayName = 'BioSavedViews';
export default BioSavedViews;
