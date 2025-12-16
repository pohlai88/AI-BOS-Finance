/**
 * BioKanbanCard - Draggable card component
 *
 * Sprint 5 per BIOSKIN 2.1 PRD - ERPNext Expansion
 */

'use client';

import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { GripVertical, Calendar, Tag, User } from 'lucide-react';
import { cn } from '../../atoms/utils';
import { Txt } from '../../atoms/Txt';
import { StatusBadge } from '../../molecules/StatusBadge';
import type { KanbanCard } from './useBioKanban';

// ============================================================
// Types
// ============================================================

export interface BioKanbanCardProps<T = Record<string, unknown>> {
  /** Card data */
  card: KanbanCard<T>;
  /** Is card being dragged */
  isDragging?: boolean;
  /** Called when card is clicked */
  onClick?: (card: KanbanCard<T>) => void;
  /** Custom card renderer */
  renderCard?: (card: KanbanCard<T>) => React.ReactNode;
  /** Show drag handle */
  showDragHandle?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================================
// Color mapping
// ============================================================

const colorStyles: Record<string, string> = {
  default: 'border-l-border-default',
  primary: 'border-l-accent-primary',
  success: 'border-l-status-success',
  warning: 'border-l-status-warning',
  danger: 'border-l-status-danger',
};

// ============================================================
// Component
// ============================================================

export function BioKanbanCard<T = Record<string, unknown>>({
  card,
  isDragging = false,
  onClick,
  renderCard,
  showDragHandle = true,
  className,
}: BioKanbanCardProps<T>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      card,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCurrentlyDragging = isDragging || isSortableDragging;

  // Custom renderer
  if (renderCard) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={cn(
          'touch-none',
          isCurrentlyDragging && 'opacity-50',
          className
        )}
      >
        <div {...listeners}>{renderCard(card)}</div>
      </div>
    );
  }

  // Default card render
  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'group relative bg-surface-card rounded-lg border border-default',
        'border-l-4 shadow-sm hover:shadow-md transition-shadow',
        'cursor-pointer select-none touch-none',
        colorStyles[card.color || 'default'],
        isCurrentlyDragging && 'opacity-50 shadow-lg rotate-2',
        className
      )}
      onClick={() => onClick?.(card)}
      data-testid="kanban-card"
    >
      {/* Drag Handle */}
      {showDragHandle && (
        <div
          {...listeners}
          className={cn(
            'absolute left-1 top-1/2 -translate-y-1/2 p-1 rounded',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'cursor-grab active:cursor-grabbing hover:bg-surface-hover'
          )}
        >
          <GripVertical className="h-4 w-4 text-text-muted" />
        </div>
      )}

      <div className={cn('p-3', showDragHandle && 'pl-7')}>
        {/* Title */}
        <Txt variant="body" weight="medium" className="line-clamp-2">
          {card.title}
        </Txt>

        {/* Description */}
        {card.description && (
          <Txt variant="caption" color="tertiary" className="mt-1 line-clamp-2">
            {card.description}
          </Txt>
        )}

        {/* Meta info */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {/* Due date */}
          {card.dueDate && (
            <div className="flex items-center gap-1 text-text-muted">
              <Calendar className="h-3 w-3" />
              <Txt variant="caption" color="tertiary">
                {new Date(card.dueDate).toLocaleDateString()}
              </Txt>
            </div>
          )}

          {/* Tags */}
          {card.tags && card.tags.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag className="h-3 w-3 text-text-muted" />
              {card.tags.slice(0, 2).map(tag => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 text-caption bg-surface-subtle rounded text-text-secondary"
                >
                  {tag}
                </span>
              ))}
              {card.tags.length > 2 && (
                <span className="text-caption text-text-muted">
                  +{card.tags.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Assignees */}
          {card.assignees && card.assignees.length > 0 && (
            <div className="flex items-center gap-1 ml-auto">
              <User className="h-3 w-3 text-text-muted" />
              <Txt variant="caption" color="tertiary">
                {card.assignees.length}
              </Txt>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

BioKanbanCard.displayName = 'BioKanbanCard';
