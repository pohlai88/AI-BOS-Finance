/**
 * BioTemplateSelector - Template selection UI
 * 
 * Displays available templates and allows selection.
 */

'use client';

import * as React from 'react';
import { Search, FileText, Star, Clock, Trash2 } from 'lucide-react';
import { cn } from '../atoms/utils';
import { Surface } from '../atoms/Surface';
import { Txt } from '../atoms/Txt';
import { Btn } from '../atoms/Btn';
import { useTemplates, type Template } from '../providers/BioTemplateProvider';

// ============================================================
// Types
// ============================================================

export interface BioTemplateSelectorProps {
  /** Called when template is selected */
  onSelect: (template: Template) => void;
  /** Called when dialog should close */
  onClose?: () => void;
  /** Filter by category */
  category?: string;
  /** Show only shared templates */
  sharedOnly?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================================
// Component
// ============================================================

export function BioTemplateSelector({
  onSelect,
  onClose,
  category,
  sharedOnly,
  className,
}: BioTemplateSelectorProps) {
  const { listTemplates, deleteTemplate, templates } = useTemplates();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filteredTemplates, setFilteredTemplates] = React.useState<Template[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Load templates
  React.useEffect(() => {
    setLoading(true);
    listTemplates({ category, shared: sharedOnly }).then((templates) => {
      setFilteredTemplates(templates);
      setLoading(false);
    });
  }, [listTemplates, category, sharedOnly]);

  // Filter by search
  const displayTemplates = React.useMemo(() => {
    if (!searchQuery.trim()) return filteredTemplates;

    const query = searchQuery.toLowerCase();
    return filteredTemplates.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.category?.toLowerCase().includes(query)
    );
  }, [filteredTemplates, searchQuery]);

  const handleDelete = async (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate(templateId);
      const updated = await listTemplates({ category, shared: sharedOnly });
      setFilteredTemplates(updated);
    }
  };

  if (loading) {
    return (
      <Surface padding="lg" className={className}>
        <div className="flex items-center justify-center py-8">
          <Txt variant="body" color="tertiary">
            Loading templates...
          </Txt>
        </div>
      </Surface>
    );
  }

  return (
    <Surface padding="lg" className={cn('space-y-4', className)}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-surface-base border border-default text-body focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
        />
      </div>

      {/* Templates List */}
      {displayTemplates.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-text-tertiary mx-auto mb-2" />
          <Txt variant="body" color="tertiary">
            {searchQuery ? 'No templates match your search' : 'No templates available'}
          </Txt>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {displayTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelect(template)}
              className="w-full text-left p-4 rounded-lg border border-default hover:border-accent-primary hover:bg-surface-nested transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-text-tertiary flex-shrink-0" />
                    <Txt variant="label" color="primary" className="truncate">
                      {template.name}
                    </Txt>
                    {template.shared && (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-accent-primary/10 text-accent-primary">
                        Shared
                      </span>
                    )}
                  </div>
                  {template.description && (
                    <Txt variant="caption" color="secondary" className="line-clamp-2">
                      {template.description}
                    </Txt>
                  )}
                  {template.category && (
                    <Txt variant="caption" color="tertiary" className="mt-1">
                      {template.category}
                    </Txt>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-text-tertiary">
                    {template.lastUsedAt && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Used {formatRelativeTime(template.lastUsedAt)}
                      </div>
                    )}
                    {template.usageCount !== undefined && template.usageCount > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {template.usageCount} uses
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(e, template.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-status-danger/10 text-status-danger transition-opacity"
                  title="Delete template"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Actions */}
      {onClose && (
        <div className="flex justify-end pt-4 border-t border-default">
          <Btn variant="secondary" onClick={onClose}>
            Cancel
          </Btn>
        </div>
      )}
    </Surface>
  );
}

// Helper to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

BioTemplateSelector.displayName = 'BioTemplateSelector';
