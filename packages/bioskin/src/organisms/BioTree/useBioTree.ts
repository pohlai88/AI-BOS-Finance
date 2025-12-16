/**
 * useBioTree - State management for hierarchical tree
 *
 * Sprint 5 per BIOSKIN 2.1 PRD - ERPNext Expansion
 * Manages tree nodes, expansion, selection with jotai.
 */

'use client';

import * as React from 'react';
import { atom, useAtom } from 'jotai';

// ============================================================
// Types
// ============================================================

export interface TreeNode<T = Record<string, unknown>> {
  /** Unique identifier */
  id: string;
  /** Node label */
  label: string;
  /** Child nodes */
  children?: TreeNode<T>[];
  /** Custom data */
  data?: T;
  /** Icon name (from lucide-react) */
  icon?: string;
  /** Is node disabled */
  disabled?: boolean;
  /** Node level (auto-calculated) */
  level?: number;
}

export interface TreeState {
  /** Expanded node IDs */
  expandedIds: Set<string>;
  /** Selected node IDs */
  selectedIds: Set<string>;
  /** Focused node ID */
  focusedId: string | null;
}

export interface UseBioTreeOptions<T = Record<string, unknown>> {
  /** Tree nodes */
  nodes: TreeNode<T>[];
  /** Initially expanded node IDs */
  defaultExpanded?: string[];
  /** Initially selected node IDs */
  defaultSelected?: string[];
  /** Allow multiple selection */
  multiSelect?: boolean;
  /** Called when node is selected */
  onSelect?: (node: TreeNode<T>) => void;
  /** Called when node is expanded/collapsed */
  onToggle?: (nodeId: string, expanded: boolean) => void;
  /** Called when node is double-clicked */
  onDoubleClick?: (node: TreeNode<T>) => void;
}

export interface UseBioTreeReturn<T = Record<string, unknown>> {
  /** Flattened nodes with level info */
  flatNodes: (TreeNode<T> & { level: number; hasChildren: boolean })[];
  /** Expanded node IDs */
  expandedIds: Set<string>;
  /** Selected node IDs */
  selectedIds: Set<string>;
  /** Focused node ID */
  focusedId: string | null;
  /** Check if node is expanded */
  isExpanded: (nodeId: string) => boolean;
  /** Check if node is selected */
  isSelected: (nodeId: string) => boolean;
  /** Toggle node expansion */
  toggleExpand: (nodeId: string) => void;
  /** Expand node */
  expand: (nodeId: string) => void;
  /** Collapse node */
  collapse: (nodeId: string) => void;
  /** Expand all nodes */
  expandAll: () => void;
  /** Collapse all nodes */
  collapseAll: () => void;
  /** Select node */
  select: (nodeId: string) => void;
  /** Toggle node selection */
  toggleSelect: (nodeId: string) => void;
  /** Clear selection */
  clearSelection: () => void;
  /** Set focus */
  setFocus: (nodeId: string | null) => void;
  /** Get node by ID */
  getNode: (nodeId: string) => TreeNode<T> | undefined;
  /** Get parent node */
  getParent: (nodeId: string) => TreeNode<T> | undefined;
  /** Get node path (ancestors) */
  getPath: (nodeId: string) => TreeNode<T>[];
}

// ============================================================
// Helper Functions
// ============================================================

function flattenNodes<T>(
  nodes: TreeNode<T>[],
  expandedIds: Set<string>,
  level = 0,
  parentId?: string
): (TreeNode<T> & { level: number; hasChildren: boolean; parentId?: string })[] {
  const result: (TreeNode<T> & { level: number; hasChildren: boolean; parentId?: string })[] = [];

  for (const node of nodes) {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    result.push({ ...node, level, hasChildren, parentId });

    if (hasChildren && expandedIds.has(node.id)) {
      result.push(...flattenNodes(node.children!, expandedIds, level + 1, node.id));
    }
  }

  return result;
}

function getAllNodeIds<T>(nodes: TreeNode<T>[]): string[] {
  const ids: string[] = [];

  function collect(nodes: TreeNode<T>[]) {
    for (const node of nodes) {
      ids.push(node.id);
      if (node.children) {
        collect(node.children);
      }
    }
  }

  collect(nodes);
  return ids;
}

function findNode<T>(nodes: TreeNode<T>[], id: string): TreeNode<T> | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

function findParent<T>(nodes: TreeNode<T>[], id: string, parent?: TreeNode<T>): TreeNode<T> | undefined {
  for (const node of nodes) {
    if (node.id === id) return parent;
    if (node.children) {
      const found = findParent(node.children, id, node);
      if (found) return found;
    }
  }
  return undefined;
}

function getNodePath<T>(nodes: TreeNode<T>[], id: string, path: TreeNode<T>[] = []): TreeNode<T>[] {
  for (const node of nodes) {
    if (node.id === id) return [...path, node];
    if (node.children) {
      const found = getNodePath(node.children, id, [...path, node]);
      if (found.length > path.length) return found;
    }
  }
  return path;
}

// ============================================================
// Hook Implementation
// ============================================================

export function useBioTree<T = Record<string, unknown>>({
  nodes,
  defaultExpanded = [],
  defaultSelected = [],
  multiSelect = false,
  onSelect,
  onToggle,
  onDoubleClick,
}: UseBioTreeOptions<T>): UseBioTreeReturn<T> {
  // State atoms
  const expandedAtom = React.useMemo(
    () => atom<Set<string>>(new Set(defaultExpanded)),
    []
  );
  const selectedAtom = React.useMemo(
    () => atom<Set<string>>(new Set(defaultSelected)),
    []
  );
  const focusedAtom = React.useMemo(() => atom<string | null>(null), []);

  const [expandedIds, setExpandedIds] = useAtom(expandedAtom);
  const [selectedIds, setSelectedIds] = useAtom(selectedAtom);
  const [focusedId, setFocusedId] = useAtom(focusedAtom);

  // Flatten nodes for rendering
  const flatNodes = React.useMemo(
    () => flattenNodes(nodes, expandedIds),
    [nodes, expandedIds]
  );

  // Check if node is expanded
  const isExpanded = React.useCallback(
    (nodeId: string) => expandedIds.has(nodeId),
    [expandedIds]
  );

  // Check if node is selected
  const isSelected = React.useCallback(
    (nodeId: string) => selectedIds.has(nodeId),
    [selectedIds]
  );

  // Toggle expansion
  const toggleExpand = React.useCallback(
    (nodeId: string) => {
      setExpandedIds(prev => {
        const next = new Set(prev);
        const isCurrentlyExpanded = next.has(nodeId);

        if (isCurrentlyExpanded) {
          next.delete(nodeId);
        } else {
          next.add(nodeId);
        }

        onToggle?.(nodeId, !isCurrentlyExpanded);
        return next;
      });
    },
    [setExpandedIds, onToggle]
  );

  // Expand node
  const expand = React.useCallback(
    (nodeId: string) => {
      setExpandedIds(prev => {
        if (prev.has(nodeId)) return prev;
        const next = new Set(prev);
        next.add(nodeId);
        onToggle?.(nodeId, true);
        return next;
      });
    },
    [setExpandedIds, onToggle]
  );

  // Collapse node
  const collapse = React.useCallback(
    (nodeId: string) => {
      setExpandedIds(prev => {
        if (!prev.has(nodeId)) return prev;
        const next = new Set(prev);
        next.delete(nodeId);
        onToggle?.(nodeId, false);
        return next;
      });
    },
    [setExpandedIds, onToggle]
  );

  // Expand all
  const expandAll = React.useCallback(() => {
    const allIds = getAllNodeIds(nodes);
    setExpandedIds(new Set(allIds));
  }, [nodes, setExpandedIds]);

  // Collapse all
  const collapseAll = React.useCallback(() => {
    setExpandedIds(new Set());
  }, [setExpandedIds]);

  // Select node
  const select = React.useCallback(
    (nodeId: string) => {
      const node = findNode(nodes, nodeId);
      if (!node || node.disabled) return;

      setSelectedIds(prev => {
        if (multiSelect) {
          const next = new Set(prev);
          next.add(nodeId);
          return next;
        }
        return new Set([nodeId]);
      });

      onSelect?.(node);
    },
    [nodes, multiSelect, setSelectedIds, onSelect]
  );

  // Toggle selection
  const toggleSelect = React.useCallback(
    (nodeId: string) => {
      const node = findNode(nodes, nodeId);
      if (!node || node.disabled) return;

      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(nodeId)) {
          next.delete(nodeId);
        } else {
          if (!multiSelect) {
            next.clear();
          }
          next.add(nodeId);
          onSelect?.(node);
        }
        return next;
      });
    },
    [nodes, multiSelect, setSelectedIds, onSelect]
  );

  // Clear selection
  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
  }, [setSelectedIds]);

  // Set focus
  const setFocus = React.useCallback(
    (nodeId: string | null) => {
      setFocusedId(nodeId);
    },
    [setFocusedId]
  );

  // Get node by ID
  const getNode = React.useCallback(
    (nodeId: string) => findNode(nodes, nodeId),
    [nodes]
  );

  // Get parent
  const getParent = React.useCallback(
    (nodeId: string) => findParent(nodes, nodeId),
    [nodes]
  );

  // Get path
  const getPath = React.useCallback(
    (nodeId: string) => getNodePath(nodes, nodeId),
    [nodes]
  );

  return {
    flatNodes,
    expandedIds,
    selectedIds,
    focusedId,
    isExpanded,
    isSelected,
    toggleExpand,
    expand,
    collapse,
    expandAll,
    collapseAll,
    select,
    toggleSelect,
    clearSelection,
    setFocus,
    getNode,
    getParent,
    getPath,
  };
}
