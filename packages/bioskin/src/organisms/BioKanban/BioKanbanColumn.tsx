/**
 * BioKanbanColumn - Column container with droppable zone
 *
 * Sprint 5 per BIOSKIN 2.1 PRD - ERPNext Expansion
 */

'use client';

import * as React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronRight, Plus, MoreHorizontal } from 'lucide-react';
import { cn } from '../../atoms/utils';
import { Txt } from '../../atoms/Txt';
import { Btn } from '../../atoms/Btn';
import { BioKanbanCard } from './BioKanbanCard';
import type { KanbanColumn, KanbanCard } from './useBioKanban';

// ============================================================
// Types
// ============================================================

export interface BioKanbanColumnProps<T = Record<string, unknown>> {
  /** Column data */
  column: KanbanColumn;
  /** Cards in this column */
  cards: KanbanCard<T>[];
  /** Called when card is clicked */
  onCardClick?: (card: KanbanCard<T>) => void;
  /** Called when add button is clicked */
  onAddCard?: (columnId: string) => void;
  /** Called when column header actions clicked */
  onColumnAction?: (columnId: string, action: string) => void;
  /** Toggle column collapse */
  onToggleCollapse?: (columnId: string) => void;
  /** Custom card renderer */
  renderCard?: (card: KanbanCard<T>) => React.ReactNode;
  /** Currently dragging card ID */
  activeCardId?: string | null;
  /** Show add button */
  showAddButton?: boolean;
  /** Show card count */
  showCount?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================================
// Color mapping
// ============================================================

const headerColorStyles: Record<string, string> = {
  default: 'bg-surface-subtle',
  primary: 'bg-accent-primary/10',
  success: 'bg-status-success/10',
  warning: 'bg-status-warning/10',
  danger: 'bg-status-danger/10',
  info: 'bg-status-info/10',
};

const dotColorStyles: Record<string, string> = {
  default: 'bg-text-muted',
  primary: 'bg-accent-primary',
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  danger: 'bg-status-danger',
  info: 'bg-status-info',
};

// ============================================================
// Component
// ============================================================

export function BioKanbanColumn<T = Record<string, unknown>>({
  column,
  cards,
  onCardClick,
  onAddCard,
  onColumnAction,
  onToggleCollapse,
  renderCard,
  activeCardId,
  showAddButton = true,
  showCount = true,
  className,
}: BioKanbanColumnProps<T>) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  });

  const cardIds = cards.map(card => card.id);
  const isAtLimit = column.limit && cards.length >= column.limit;

  return (
    <div
      className={cn(
        'flex flex-col w-72 flex-shrink-0 rounded-lg bg-surface-base',
        'border border-default',
        className
      )}
      data-testid="kanban-column"
    >
      {/* Column Header */}
      <div
        className={cn(
          'px-3 py-2 rounded-t-lg border-b border-default',
          headerColorStyles[column.color || 'default']
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Collapse toggle */}
            <button
              onClick={() => onToggleCollapse?.(column.id)}
              className="p-0.5 hover:bg-surface-hover rounded transition-colors"
            >
              {column.collapsed ? (
                <ChevronRight className="h-4 w-4 text-text-secondary" />
              ) : (
                <ChevronDown className="h-4 w-4 text-text-secondary" />
              )}
            </button>

            {/* Color dot */}
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                dotColorStyles[column.color || 'default']
              )}
            />

            {/* Title */}
            <Txt variant="label" weight="medium">
              {column.title}
            </Txt>

            {/* Count */}
            {showCount && (
              <span
                className={cn(
                  'px-1.5 py-0.5 text-caption rounded-full',
                  'bg-surface-card text-text-secondary',
                  isAtLimit && 'bg-status-warning/20 text-status-warning'
                )}
              >
                {cards.length}
                {column.limit && `/${column.limit}`}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {showAddButton && !column.collapsed && (
              <Btn
                variant="ghost"
                size="sm"
                onClick={() => onAddCard?.(column.id)}
                disabled={Boolean(isAtLimit)}
                className="h-6 w-6 p-0"
              >
                <Plus className="h-4 w-4" />
              </Btn>
            )}
            <Btn
              variant="ghost"
              size="sm"
              onClick={() => onColumnAction?.(column.id, 'menu')}
              className="h-6 w-6 p-0"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Btn>
          </div>
        </div>
      </div>

      {/* Cards Container */}
      <AnimatePresence>
        {!column.collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              ref={setNodeRef}
              className={cn(
                'flex-1 p-2 space-y-2 min-h-[100px] max-h-[calc(100vh-200px)] overflow-y-auto',
                isOver && 'bg-accent-primary/5 ring-2 ring-accent-primary/20 ring-inset',
                'transition-colors duration-150'
              )}
            >
              <SortableContext
                items={cardIds}
                strategy={verticalListSortingStrategy}
              >
                {cards.map(card => (
                  <BioKanbanCard
                    key={card.id}
                    card={card}
                    onClick={onCardClick}
                    renderCard={renderCard}
                    isDragging={activeCardId === card.id}
                  />
                ))}
              </SortableContext>

              {/* Empty state */}
              {cards.length === 0 && (
                <div className="flex items-center justify-center h-20 text-text-muted">
                  <Txt variant="caption">No cards</Txt>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

BioKanbanColumn.displayName = 'BioKanbanColumn';
