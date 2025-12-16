/**
 * useBioKanban - State management for Kanban board
 *
 * Sprint 5 per BIOSKIN 2.1 PRD - ERPNext Expansion
 * Manages columns, cards, drag-drop state with jotai.
 */

'use client';

import * as React from 'react';
import { atom, useAtom } from 'jotai';
import type { UniqueIdentifier } from '@dnd-kit/core';

// ============================================================
// Types
// ============================================================

export interface KanbanCard<T = Record<string, unknown>> {
  /** Unique identifier */
  id: string;
  /** Card title */
  title: string;
  /** Card description */
  description?: string;
  /** Column this card belongs to */
  columnId: string;
  /** Position within column */
  order: number;
  /** Custom data */
  data?: T;
  /** Card color/priority indicator */
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  /** Assigned user(s) */
  assignees?: string[];
  /** Due date */
  dueDate?: Date;
  /** Tags/labels */
  tags?: string[];
}

export interface KanbanColumn {
  /** Unique identifier */
  id: string;
  /** Column title */
  title: string;
  /** Column color */
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  /** Maximum cards allowed (WIP limit) */
  limit?: number;
  /** Is column collapsed */
  collapsed?: boolean;
}

export interface KanbanState<T = Record<string, unknown>> {
  columns: KanbanColumn[];
  cards: KanbanCard<T>[];
  activeCardId: string | null;
  activeColumnId: string | null;
}

export interface UseBioKanbanOptions<T = Record<string, unknown>> {
  /** Initial columns */
  columns: KanbanColumn[];
  /** Initial cards */
  cards: KanbanCard<T>[];
  /** Called when card moves between columns */
  onCardMove?: (cardId: string, fromColumn: string, toColumn: string, newOrder: number) => void;
  /** Called when card is reordered within column */
  onCardReorder?: (cardId: string, columnId: string, newOrder: number) => void;
  /** Called when card is clicked */
  onCardClick?: (card: KanbanCard<T>) => void;
  /** Called when card is added */
  onCardAdd?: (columnId: string) => void;
  /** Called when card is deleted */
  onCardDelete?: (cardId: string) => void;
}

export interface UseBioKanbanReturn<T = Record<string, unknown>> {
  /** Current columns */
  columns: KanbanColumn[];
  /** Current cards */
  cards: KanbanCard<T>[];
  /** Get cards for a specific column */
  getColumnCards: (columnId: string) => KanbanCard<T>[];
  /** Get card count for column */
  getColumnCount: (columnId: string) => number;
  /** Currently dragging card ID */
  activeCardId: string | null;
  /** Set active card (for drag) */
  setActiveCard: (id: string | null) => void;
  /** Move card to new column */
  moveCard: (cardId: string, toColumnId: string, newOrder?: number) => void;
  /** Reorder card within column */
  reorderCard: (cardId: string, newOrder: number) => void;
  /** Add new card */
  addCard: (card: Omit<KanbanCard<T>, 'order'>) => void;
  /** Update card */
  updateCard: (cardId: string, updates: Partial<KanbanCard<T>>) => void;
  /** Delete card */
  deleteCard: (cardId: string) => void;
  /** Toggle column collapse */
  toggleColumnCollapse: (columnId: string) => void;
  /** Handle drag end */
  handleDragEnd: (activeId: UniqueIdentifier, overId: UniqueIdentifier | null) => void;
}

// ============================================================
// Hook Implementation
// ============================================================

export function useBioKanban<T = Record<string, unknown>>({
  columns: initialColumns,
  cards: initialCards,
  onCardMove,
  onCardReorder,
  onCardClick,
  onCardAdd,
  onCardDelete,
}: UseBioKanbanOptions<T>): UseBioKanbanReturn<T> {
  // State atoms
  const columnsAtom = React.useMemo(() => atom<KanbanColumn[]>(initialColumns), []);
  const cardsAtom = React.useMemo(() => atom<KanbanCard<T>[]>(initialCards), []);
  const activeCardAtom = React.useMemo(() => atom<string | null>(null), []);

  const [columns, setColumns] = useAtom(columnsAtom);
  const [cards, setCards] = useAtom(cardsAtom);
  const [activeCardId, setActiveCardId] = useAtom(activeCardAtom);

  // Sync with external changes
  React.useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns, setColumns]);

  React.useEffect(() => {
    setCards(initialCards);
  }, [initialCards, setCards]);

  // Get cards for a specific column, sorted by order
  const getColumnCards = React.useCallback(
    (columnId: string): KanbanCard<T>[] => {
      return cards
        .filter(card => card.columnId === columnId)
        .sort((a, b) => a.order - b.order);
    },
    [cards]
  );

  // Get card count for column
  const getColumnCount = React.useCallback(
    (columnId: string): number => {
      return cards.filter(card => card.columnId === columnId).length;
    },
    [cards]
  );

  // Set active card for drag
  const setActiveCard = React.useCallback(
    (id: string | null) => {
      setActiveCardId(id);
    },
    [setActiveCardId]
  );

  // Move card to new column
  const moveCard = React.useCallback(
    (cardId: string, toColumnId: string, newOrder?: number) => {
      setCards(prev => {
        const card = prev.find(c => c.id === cardId);
        if (!card) return prev;

        const fromColumnId = card.columnId;
        const targetColumnCards = prev.filter(c => c.columnId === toColumnId);
        const order = newOrder ?? targetColumnCards.length;

        const updated = prev.map(c => {
          if (c.id === cardId) {
            return { ...c, columnId: toColumnId, order };
          }
          // Reorder cards in target column
          if (c.columnId === toColumnId && c.order >= order) {
            return { ...c, order: c.order + 1 };
          }
          return c;
        });

        // Callback
        onCardMove?.(cardId, fromColumnId, toColumnId, order);

        return updated;
      });
    },
    [setCards, onCardMove]
  );

  // Reorder card within column
  const reorderCard = React.useCallback(
    (cardId: string, newOrder: number) => {
      setCards(prev => {
        const card = prev.find(c => c.id === cardId);
        if (!card) return prev;

        const columnCards = prev
          .filter(c => c.columnId === card.columnId)
          .sort((a, b) => a.order - b.order);

        const oldOrder = card.order;
        if (oldOrder === newOrder) return prev;

        const updated = prev.map(c => {
          if (c.columnId !== card.columnId) return c;

          if (c.id === cardId) {
            return { ...c, order: newOrder };
          }

          // Shift other cards
          if (oldOrder < newOrder) {
            // Moving down: shift cards between old and new position up
            if (c.order > oldOrder && c.order <= newOrder) {
              return { ...c, order: c.order - 1 };
            }
          } else {
            // Moving up: shift cards between new and old position down
            if (c.order >= newOrder && c.order < oldOrder) {
              return { ...c, order: c.order + 1 };
            }
          }

          return c;
        });

        onCardReorder?.(cardId, card.columnId, newOrder);
        return updated;
      });
    },
    [setCards, onCardReorder]
  );

  // Add new card
  const addCard = React.useCallback(
    (card: Omit<KanbanCard<T>, 'order'>) => {
      setCards(prev => {
        const columnCards = prev.filter(c => c.columnId === card.columnId);
        const order = columnCards.length;
        return [...prev, { ...card, order } as KanbanCard<T>];
      });
      onCardAdd?.(card.columnId);
    },
    [setCards, onCardAdd]
  );

  // Update card
  const updateCard = React.useCallback(
    (cardId: string, updates: Partial<KanbanCard<T>>) => {
      setCards(prev =>
        prev.map(c => (c.id === cardId ? { ...c, ...updates } : c))
      );
    },
    [setCards]
  );

  // Delete card
  const deleteCard = React.useCallback(
    (cardId: string) => {
      setCards(prev => prev.filter(c => c.id !== cardId));
      onCardDelete?.(cardId);
    },
    [setCards, onCardDelete]
  );

  // Toggle column collapse
  const toggleColumnCollapse = React.useCallback(
    (columnId: string) => {
      setColumns(prev =>
        prev.map(col =>
          col.id === columnId ? { ...col, collapsed: !col.collapsed } : col
        )
      );
    },
    [setColumns]
  );

  // Handle drag end from @dnd-kit
  const handleDragEnd = React.useCallback(
    (activeId: UniqueIdentifier, overId: UniqueIdentifier | null) => {
      setActiveCardId(null);

      if (!overId) return;

      const activeCard = cards.find(c => c.id === activeId);
      if (!activeCard) return;

      const overIdStr = String(overId);

      // Check if dropping on a column
      const overColumn = columns.find(col => col.id === overIdStr);
      if (overColumn) {
        // Move to end of column
        if (activeCard.columnId !== overColumn.id) {
          moveCard(String(activeId), overColumn.id);
        }
        return;
      }

      // Check if dropping on a card
      const overCard = cards.find(c => c.id === overIdStr);
      if (overCard) {
        if (activeCard.columnId === overCard.columnId) {
          // Reorder within same column
          reorderCard(String(activeId), overCard.order);
        } else {
          // Move to different column at specific position
          moveCard(String(activeId), overCard.columnId, overCard.order);
        }
      }
    },
    [cards, columns, moveCard, reorderCard, setActiveCardId]
  );

  return {
    columns,
    cards,
    getColumnCards,
    getColumnCount,
    activeCardId,
    setActiveCard,
    moveCard,
    reorderCard,
    addCard,
    updateCard,
    deleteCard,
    toggleColumnCollapse,
    handleDragEnd,
  };
}
