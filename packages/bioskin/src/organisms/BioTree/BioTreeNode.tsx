/**
 * BioTreeNode - Individual tree node component
 *
 * Sprint 5 per BIOSKIN 2.1 PRD - ERPNext Expansion
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  File,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../atoms/utils';
import { Txt } from '../../atoms/Txt';
import type { TreeNode } from './useBioTree';

// ============================================================
// Types
// ============================================================

export interface BioTreeNodeProps<T = Record<string, unknown>> {
  /** Node data */
  node: TreeNode<T> & { level: number; hasChildren: boolean };
  /** Is node expanded */
  isExpanded: boolean;
  /** Is node selected */
  isSelected: boolean;
  /** Is node focused */
  isFocused: boolean;
  /** Toggle expansion */
  onToggle: (nodeId: string) => void;
  /** Select node */
  onSelect: (nodeId: string) => void;
  /** Double click handler */
  onDoubleClick?: (node: TreeNode<T>) => void;
  /** Custom node renderer */
  renderNode?: (node: TreeNode<T>, props: { isExpanded: boolean; isSelected: boolean }) => React.ReactNode;
  /** Custom icon renderer */
  renderIcon?: (node: TreeNode<T>, props: { isExpanded: boolean }) => React.ReactNode;
  /** Show icons */
  showIcons?: boolean;
  /** Indent size in pixels */
  indentSize?: number;
  /** Additional className */
  className?: string;
}

// ============================================================
// Component
// ============================================================

export function BioTreeNode<T = Record<string, unknown>>({
  node,
  isExpanded,
  isSelected,
  isFocused,
  onToggle,
  onSelect,
  onDoubleClick,
  renderNode,
  renderIcon,
  showIcons = true,
  indentSize = 20,
  className,
}: BioTreeNodeProps<T>) {
  const handleClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(node.id);
    },
    [node.id, onSelect]
  );

  const handleDoubleClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (node.hasChildren) {
        onToggle(node.id);
      }
      onDoubleClick?.(node);
    },
    [node, onToggle, onDoubleClick]
  );

  const handleToggle = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggle(node.id);
    },
    [node.id, onToggle]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect(node.id);
          break;
        case 'ArrowRight':
          if (node.hasChildren && !isExpanded) {
            e.preventDefault();
            onToggle(node.id);
          }
          break;
        case 'ArrowLeft':
          if (node.hasChildren && isExpanded) {
            e.preventDefault();
            onToggle(node.id);
          }
          break;
      }
    },
    [node, isExpanded, onSelect, onToggle]
  );

  // Default icon
  const DefaultIcon = React.useMemo(() => {
    if (node.hasChildren) {
      return isExpanded ? FolderOpen : Folder;
    }
    return File;
  }, [node.hasChildren, isExpanded]);

  // Custom node render
  if (renderNode) {
    return (
      <div
        style={{ paddingLeft: node.level * indentSize }}
        className={className}
      >
        {renderNode(node, { isExpanded, isSelected })}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      role="treeitem"
      aria-expanded={node.hasChildren ? isExpanded : undefined}
      aria-selected={isSelected}
      tabIndex={isFocused ? 0 : -1}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      style={{ paddingLeft: node.level * indentSize }}
      className={cn(
        'flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer',
        'transition-colors duration-100',
        'hover:bg-surface-hover',
        isSelected && 'bg-accent-primary/10 text-accent-primary',
        isFocused && 'ring-2 ring-accent-primary/30 ring-inset',
        node.disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      data-testid="tree-node"
    >
      {/* Expand/Collapse Toggle */}
      <button
        onClick={handleToggle}
        className={cn(
          'flex items-center justify-center w-5 h-5 rounded',
          'hover:bg-surface-subtle transition-colors',
          !node.hasChildren && 'invisible'
        )}
        tabIndex={-1}
        aria-label={isExpanded ? 'Collapse' : 'Expand'}
      >
        {node.hasChildren && (
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronRight className="h-4 w-4 text-text-secondary" />
          </motion.div>
        )}
      </button>

      {/* Icon */}
      {showIcons && (
        <div className="flex items-center justify-center w-5 h-5">
          {renderIcon ? (
            renderIcon(node, { isExpanded })
          ) : (
            <DefaultIcon
              className={cn(
                'h-4 w-4',
                isSelected ? 'text-accent-primary' : 'text-text-secondary'
              )}
            />
          )}
        </div>
      )}

      {/* Label */}
      <Txt
        variant="body"
        weight={isSelected ? 'medium' : 'normal'}
        color={isSelected ? 'brand' : 'primary'}
        className="truncate flex-1"
      >
        {node.label}
      </Txt>
    </motion.div>
  );
}

BioTreeNode.displayName = 'BioTreeNode';
