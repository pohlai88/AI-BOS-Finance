/**
 * BioTimeline - Activity timeline component
 *
 * Sprint 5 per BIOSKIN 2.1 PRD - ERPNext Expansion
 * Production-grade timeline for activity logs, audit trails.
 *
 * @example
 * // Basic usage
 * <BioTimeline items={activities} />
 *
 * @example
 * // Full featured
 * <BioTimeline
 *   items={activities}
 *   title="Activity Log"
 *   showDates
 *   groupByDate
 * />
 */

'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import {
  Circle,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  FileText,
  Edit,
  Trash2,
  Plus,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../atoms/utils';
import { Surface } from '../../atoms/Surface';
import { Txt } from '../../atoms/Txt';
import { StatusBadge } from '../../molecules/StatusBadge';
import { useLocale } from '../../providers';

// ============================================================
// Types
// ============================================================

export type TimelineItemType =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'create'
  | 'update'
  | 'delete'
  | 'comment';

export interface TimelineItem<T = Record<string, unknown>> {
  /** Unique identifier */
  id: string;
  /** Item title */
  title: string;
  /** Item description */
  description?: string;
  /** Timestamp */
  timestamp: Date | string;
  /** Item type/variant */
  type?: TimelineItemType;
  /** User/actor info */
  user?: {
    name: string;
    avatar?: string;
  };
  /** Custom icon (lucide name or component) */
  icon?: string | LucideIcon;
  /** Custom data */
  data?: T;
  /** Is item highlighted */
  highlighted?: boolean;
}

export interface BioTimelineProps<T = Record<string, unknown>> {
  /** Timeline items */
  items: TimelineItem<T>[];
  /** Timeline title */
  title?: string;
  /** Show timestamps */
  showTimestamps?: boolean;
  /** Group items by date */
  groupByDate?: boolean;
  /** Show connecting line */
  showLine?: boolean;
  /** Called when item is clicked */
  onItemClick?: (item: TimelineItem<T>) => void;
  /** Custom item renderer */
  renderItem?: (item: TimelineItem<T>) => React.ReactNode;
  /** Max height with scroll */
  maxHeight?: string | number;
  /** Additional className */
  className?: string;
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
}

// ============================================================
// Component Meta
// ============================================================

export const COMPONENT_META = {
  code: 'TMLN01',
  version: '1.0.0',
  name: 'BioTimeline',
  family: 'TIMELINE',
  purpose: 'AUDIT',
  poweredBy: 'motion',
  status: 'active',
} as const;

// ============================================================
// Icon mapping
// ============================================================

const typeIcons: Record<TimelineItemType, LucideIcon> = {
  default: Circle,
  success: CheckCircle2,
  warning: AlertCircle,
  danger: AlertCircle,
  info: Circle,
  create: Plus,
  update: Edit,
  delete: Trash2,
  comment: MessageSquare,
};

const typeColors: Record<TimelineItemType, string> = {
  default: 'text-text-secondary bg-surface-subtle',
  success: 'text-status-success bg-status-success/10',
  warning: 'text-status-warning bg-status-warning/10',
  danger: 'text-status-danger bg-status-danger/10',
  info: 'text-status-info bg-status-info/10',
  create: 'text-status-success bg-status-success/10',
  update: 'text-accent-primary bg-accent-primary/10',
  delete: 'text-status-danger bg-status-danger/10',
  comment: 'text-text-secondary bg-surface-subtle',
};

// ============================================================
// Helper Functions (locale-independent)
// ============================================================

function groupByDateFn<T>(items: TimelineItem<T>[]): Map<string, TimelineItem<T>[]> {
  const groups = new Map<string, TimelineItem<T>[]>();

  for (const item of items) {
    const date = new Date(item.timestamp).toDateString();
    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(item);
  }

  return groups;
}

// ============================================================
// TimelineItemComponent
// ============================================================

interface TimelineItemComponentProps<T> {
  item: TimelineItem<T>;
  showTimestamps: boolean;
  showLine: boolean;
  isLast: boolean;
  onClick?: (item: TimelineItem<T>) => void;
  renderItem?: (item: TimelineItem<T>) => React.ReactNode;
  formatRelativeTime: (date: Date | string) => string;
}

function TimelineItemComponent<T>({
  item,
  showTimestamps,
  showLine,
  isLast,
  onClick,
  renderItem,
  formatRelativeTime,
}: TimelineItemComponentProps<T>) {
  const type = item.type || 'default';
  const Icon = typeof item.icon === 'function' ? item.icon : typeIcons[type];

  // Custom renderer
  if (renderItem) {
    return (
      <div className="relative flex gap-3 pb-6">
        {showLine && !isLast && (
          <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-border-default" />
        )}
        {renderItem(item)}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative flex gap-3 pb-6',
        onClick && 'cursor-pointer group'
      )}
      onClick={() => onClick?.(item)}
      data-testid="timeline-item"
    >
      {/* Connecting line */}
      {showLine && !isLast && (
        <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-border-default" />
      )}

      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          'transition-transform duration-200',
          onClick && 'group-hover:scale-110',
          typeColors[type],
          item.highlighted && 'ring-2 ring-accent-primary ring-offset-2'
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Txt
              variant="body"
              weight="medium"
              className={cn(
                'truncate',
                onClick && 'group-hover:text-accent-primary transition-colors'
              )}
            >
              {item.title}
            </Txt>

            {item.description && (
              <Txt variant="caption" color="tertiary" className="mt-0.5 line-clamp-2">
                {item.description}
              </Txt>
            )}

            {/* User info */}
            {item.user && (
              <div className="flex items-center gap-1.5 mt-1.5">
                {item.user.avatar ? (
                  <img
                    src={item.user.avatar}
                    alt={item.user.name}
                    className="w-4 h-4 rounded-full"
                  />
                ) : (
                  <User className="w-3 h-3 text-text-muted" />
                )}
                <Txt variant="caption" color="tertiary">
                  {item.user.name}
                </Txt>
              </div>
            )}
          </div>

          {/* Timestamp */}
          {showTimestamps && (
            <div className="flex items-center gap-1 text-text-muted flex-shrink-0">
              <Clock className="w-3 h-3" />
              <Txt variant="micro" color="tertiary">
                {formatRelativeTime(item.timestamp)}
              </Txt>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Component
// ============================================================

export function BioTimeline<T = Record<string, unknown>>({
  items,
  title,
  showTimestamps = true,
  groupByDate = false,
  showLine = true,
  onItemClick,
  renderItem,
  maxHeight,
  className,
  loading = false,
  emptyMessage = 'No activity yet',
}: BioTimelineProps<T>) {
  // i18n support
  const locale = useLocale();

  // Locale-aware formatters
  const formatRelativeTime = React.useCallback(
    (date: Date | string): string => locale.formatRelativeTime(date),
    [locale]
  );

  const formatDateGroup = React.useCallback(
    (date: Date | string): string => {
      const d = new Date(date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (d.toDateString() === today.toDateString()) return 'Today';
      if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

      return locale.formatDate(d, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    },
    [locale]
  );

  // Group by date if enabled
  const groupedItems = React.useMemo(() => {
    if (!groupByDate) return null;
    return groupByDateFn(items);
  }, [items, groupByDate]);

  // Loading state
  if (loading) {
    return (
      <Surface padding="lg" className={cn('overflow-hidden', className)}>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-subtle animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-surface-subtle rounded animate-pulse" />
                <div className="h-3 w-48 bg-surface-subtle rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </Surface>
    );
  }

  return (
    <Surface padding="none" className={cn('overflow-hidden', className)} data-testid="bio-timeline">
      {/* Header */}
      {title && (
        <div className="px-4 py-3 border-b border-default">
          <Txt variant="label" weight="medium">
            {title}
          </Txt>
        </div>
      )}

      {/* Timeline */}
      <div
        className={cn('p-4', maxHeight && 'overflow-y-auto')}
        style={{ maxHeight }}
      >
        {items.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 mx-auto text-text-muted mb-2" />
            <Txt variant="body" color="tertiary">
              {emptyMessage}
            </Txt>
          </div>
        ) : groupByDate && groupedItems ? (
          // Grouped by date
          Array.from(groupedItems.entries()).map(([dateStr, dateItems], groupIdx) => (
            <div key={dateStr} className="mb-6 last:mb-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-border-default" />
                <Txt variant="caption" weight="medium" color="tertiary">
                  {formatDateGroup(dateStr)}
                </Txt>
                <div className="h-px flex-1 bg-border-default" />
              </div>
              {dateItems.map((item, idx) => (
                <TimelineItemComponent
                  key={item.id}
                  item={item}
                  showTimestamps={showTimestamps}
                  showLine={showLine}
                  isLast={idx === dateItems.length - 1}
                  onClick={onItemClick}
                  renderItem={renderItem}
                  formatRelativeTime={formatRelativeTime}
                />
              ))}
            </div>
          ))
        ) : (
          // Flat list
          items.map((item, idx) => (
            <TimelineItemComponent
              key={item.id}
              item={item}
              showTimestamps={showTimestamps}
              showLine={showLine}
              isLast={idx === items.length - 1}
              onClick={onItemClick}
              renderItem={renderItem}
              formatRelativeTime={formatRelativeTime}
            />
          ))
        )}
      </div>
    </Surface>
  );
}

BioTimeline.displayName = 'BioTimeline';
