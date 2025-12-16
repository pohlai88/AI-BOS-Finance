/**
 * BioTree - Hierarchical tree view component
 *
 * Sprint 5 per BIOSKIN 2.1 PRD - ERPNext Expansion
 * Production-grade tree for Chart of Accounts, BOM, etc.
 *
 * @example
 * // Basic usage
 * <BioTree nodes={treeData} />
 *
 * @example
 * // Full featured
 * <BioTree
 *   nodes={treeData}
 *   defaultExpanded={['root']}
 *   onSelect={handleSelect}
 *   multiSelect
 * />
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronRight, Expand, Minimize2, Search } from 'lucide-react';
import { cn } from '../../atoms/utils';
import { Surface } from '../../atoms/Surface';
import { Txt } from '../../atoms/Txt';
import { Btn } from '../../atoms/Btn';
import { useBioTree, type TreeNode, type UseBioTreeOptions } from './useBioTree';
import { BioTreeNode } from './BioTreeNode';

// ============================================================
// Types
// ============================================================

export interface BioTreeProps<T = Record<string, unknown>>
  extends UseBioTreeOptions<T> {
  /** Tree title */
  title?: string;
  /** Show search */
  showSearch?: boolean;
  /** Show expand/collapse all buttons */
  showControls?: boolean;
  /** Show icons */
  showIcons?: boolean;
  /** Indent size */
  indentSize?: number;
  /** Custom node renderer */
  renderNode?: (node: TreeNode<T>, props: { isExpanded: boolean; isSelected: boolean }) => React.ReactNode;
  /** Custom icon renderer */
  renderIcon?: (node: TreeNode<T>, props: { isExpanded: boolean }) => React.ReactNode;
  /** Max height with scroll */
  maxHeight?: string | number;
  /** Additional className */
  className?: string;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: Error | null;
}

// ============================================================
// Component Meta
// ============================================================

export const COMPONENT_META = {
  code: 'TREE01',
  version: '1.0.0',
  name: 'BioTree',
  family: 'TREE',
  purpose: 'ORGANIZE',
  poweredBy: 'jotai',
  status: 'active',
} as const;

// ============================================================
// Component
// ============================================================

export function BioTree<T = Record<string, unknown>>({
  nodes,
  defaultExpanded,
  defaultSelected,
  multiSelect,
  onSelect,
  onToggle,
  onDoubleClick,
  title,
  showSearch = false,
  showControls = true,
  showIcons = true,
  indentSize = 20,
  renderNode,
  renderIcon,
  maxHeight,
  className,
  loading = false,
  error = null,
}: BioTreeProps<T>) {
  const {
    flatNodes,
    isExpanded,
    isSelected,
    focusedId,
    toggleExpand,
    select,
    expandAll,
    collapseAll,
    setFocus,
  } = useBioTree<T>({
    nodes,
    defaultExpanded,
    defaultSelected,
    multiSelect,
    onSelect,
    onToggle,
    onDoubleClick,
  });

  // Search state
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filter nodes by search
  const filteredNodes = React.useMemo(() => {
    if (!searchQuery.trim()) return flatNodes;

    const query = searchQuery.toLowerCase();
    return flatNodes.filter(node =>
      node.label.toLowerCase().includes(query)
    );
  }, [flatNodes, searchQuery]);

  // Keyboard navigation
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = filteredNodes.findIndex(n => n.id === focusedId);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < filteredNodes.length - 1) {
            setFocus(filteredNodes[currentIndex + 1].id);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            setFocus(filteredNodes[currentIndex - 1].id);
          }
          break;
        case 'Home':
          e.preventDefault();
          if (filteredNodes.length > 0) {
            setFocus(filteredNodes[0].id);
          }
          break;
        case 'End':
          e.preventDefault();
          if (filteredNodes.length > 0) {
            setFocus(filteredNodes[filteredNodes.length - 1].id);
          }
          break;
      }
    },
    [filteredNodes, focusedId, setFocus]
  );

  // Error state
  if (error) {
    return (
      <Surface padding="lg" className={className}>
        <div className="text-center py-8">
          <Txt variant="body" color="danger">
            Error: {error.message}
          </Txt>
        </div>
      </Surface>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Surface padding="lg" className={cn('overflow-hidden', className)}>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="h-8 bg-surface-subtle rounded animate-pulse"
              style={{ marginLeft: (i % 3) * 20 }}
            />
          ))}
        </div>
      </Surface>
    );
  }

  return (
    <Surface padding="none" className={cn('overflow-hidden', className)} data-testid="bio-tree">
      {/* Header */}
      {(title || showControls || showSearch) && (
        <div className="px-4 py-3 border-b border-default space-y-3">
          {/* Title and controls */}
          <div className="flex items-center justify-between">
            {title && (
              <Txt variant="label" weight="medium">
                {title}
              </Txt>
            )}
            {showControls && (
              <div className="flex items-center gap-1">
                <Btn
                  variant="ghost"
                  size="sm"
                  onClick={expandAll}
                  className="h-7 px-2"
                >
                  <Expand className="h-3.5 w-3.5 mr-1" />
                  <span className="text-caption">Expand All</span>
                </Btn>
                <Btn
                  variant="ghost"
                  size="sm"
                  onClick={collapseAll}
                  className="h-7 px-2"
                >
                  <Minimize2 className="h-3.5 w-3.5 mr-1" />
                  <span className="text-caption">Collapse</span>
                </Btn>
              </div>
            )}
          </div>

          {/* Search */}
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full pl-9 pr-3 py-1.5 rounded-md',
                  'bg-surface-subtle border border-default',
                  'text-body text-text-primary placeholder:text-text-muted',
                  'focus:outline-none focus:ring-2 focus:ring-accent-primary/30'
                )}
              />
            </div>
          )}
        </div>
      )}

      {/* Tree */}
      <div
        role="tree"
        aria-label={title || 'Tree'}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        className={cn(
          'p-2 focus:outline-none overflow-y-auto',
          maxHeight && 'overflow-y-auto'
        )}
        style={{ maxHeight }}
      >
        <AnimatePresence>
          {filteredNodes.length > 0 ? (
            filteredNodes.map(node => (
              <BioTreeNode
                key={node.id}
                node={node}
                isExpanded={isExpanded(node.id)}
                isSelected={isSelected(node.id)}
                isFocused={focusedId === node.id}
                onToggle={toggleExpand}
                onSelect={select}
                onDoubleClick={onDoubleClick}
                renderNode={renderNode}
                renderIcon={renderIcon}
                showIcons={showIcons}
                indentSize={indentSize}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <Txt variant="body" color="tertiary">
                {searchQuery ? 'No matching items' : 'No items'}
              </Txt>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Surface>
  );
}

BioTree.displayName = 'BioTree';
