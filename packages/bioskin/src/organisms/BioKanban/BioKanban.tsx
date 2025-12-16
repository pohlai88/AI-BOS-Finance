/**
 * BioKanban - Schema-driven Kanban board powered by @dnd-kit
 *
 * Sprint 5 per BIOSKIN 2.1 PRD - ERPNext Expansion
 * Production-grade Kanban with drag-drop, columns, cards.
 *
 * @example
 * // Basic usage
 * <BioKanban columns={columns} cards={cards} />
 *
 * @example
 * // Full featured
 * <BioKanban
 *   columns={columns}
 *   cards={cards}
 *   onCardMove={handleMove}
 *   onCardClick={handleClick}
 *   onCardAdd={handleAdd}
 * />
 */

'use client';

import * as React from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { motion } from 'motion/react';
import { cn } from '../../atoms/utils';
import { Surface } from '../../atoms/Surface';
import { Txt } from '../../atoms/Txt';
import { useBioKanban, type KanbanColumn, type KanbanCard, type UseBioKanbanOptions } from './useBioKanban';
import { BioKanbanColumn } from './BioKanbanColumn';
import { BioKanbanCard } from './BioKanbanCard';

// ============================================================
// Types
// ============================================================

export interface BioKanbanProps<T = Record<string, unknown>>
  extends UseBioKanbanOptions<T> {
  /** Board title */
  title?: string;
  /** Board description */
  description?: string;
  /** Custom card renderer */
  renderCard?: (card: KanbanCard<T>) => React.ReactNode;
  /** Show add buttons on columns */
  showAddButton?: boolean;
  /** Show card counts */
  showCount?: boolean;
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
  code: 'KBNM01',
  version: '1.0.0',
  name: 'BioKanban',
  family: 'KANBAN',
  purpose: 'ORGANIZE',
  poweredBy: '@dnd-kit',
  status: 'active',
} as const;

// ============================================================
// Component
// ============================================================

export function BioKanban<T = Record<string, unknown>>({
  columns: initialColumns,
  cards: initialCards,
  onCardMove,
  onCardReorder,
  onCardClick,
  onCardAdd,
  onCardDelete,
  title,
  description,
  renderCard,
  showAddButton = true,
  showCount = true,
  className,
  loading = false,
  error = null,
}: BioKanbanProps<T>) {
  const {
    columns,
    cards,
    getColumnCards,
    activeCardId,
    setActiveCard,
    handleDragEnd,
    toggleColumnCollapse,
  } = useBioKanban<T>({
    columns: initialColumns,
    cards: initialCards,
    onCardMove,
    onCardReorder,
    onCardClick,
    onCardAdd,
    onCardDelete,
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Active card for overlay
  const activeCard = React.useMemo(() => {
    if (!activeCardId) return null;
    return cards.find(c => c.id === activeCardId);
  }, [activeCardId, cards]);

  // Drag handlers
  const handleDragStart = React.useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      setActiveCard(String(active.id));
    },
    [setActiveCard]
  );

  const handleDragOver = React.useCallback((event: DragOverEvent) => {
    // Could implement preview here
  }, []);

  const onDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      handleDragEnd(active.id, over?.id ?? null);
    },
    [handleDragEnd]
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
        <div className="flex gap-4">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="w-72 h-96 bg-surface-subtle rounded-lg animate-pulse"
            />
          ))}
        </div>
      </Surface>
    );
  }

  return (
    <Surface padding="none" className={cn('overflow-hidden', className)} data-testid="bio-kanban">
      {/* Header */}
      {(title || description) && (
        <div className="px-6 py-4 border-b border-default">
          {title && (
            <Txt variant="heading" as="h3" weight="semibold">
              {title}
            </Txt>
          )}
          {description && (
            <Txt variant="body" color="tertiary" className="mt-1">
              {description}
            </Txt>
          )}
        </div>
      )}

      {/* Kanban Board */}
      <div className="p-4 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={onDragEnd}
        >
          <motion.div
            className="flex gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {columns.map(column => (
              <BioKanbanColumn<T>
                key={column.id}
                column={column}
                cards={getColumnCards(column.id)}
                onCardClick={onCardClick}
                onAddCard={onCardAdd}
                onToggleCollapse={toggleColumnCollapse}
                renderCard={renderCard}
                activeCardId={activeCardId}
                showAddButton={showAddButton}
                showCount={showCount}
              />
            ))}
          </motion.div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeCard && (
              <BioKanbanCard<T>
                card={activeCard}
                renderCard={renderCard}
                isDragging
                showDragHandle={false}
                className="shadow-xl rotate-3"
              />
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </Surface>
  );
}

BioKanban.displayName = 'BioKanban';
