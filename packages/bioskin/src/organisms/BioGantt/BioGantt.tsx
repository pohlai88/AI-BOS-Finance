/**
 * BioGantt - Gantt chart component for project timelines
 *
 * Sprint 5 per BIOSKIN 2.1 PRD - ERPNext Expansion
 * Production-grade Gantt chart for project planning.
 *
 * @example
 * // Basic usage
 * <BioGantt tasks={tasks} />
 */

'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '../../atoms/utils';
import { Surface } from '../../atoms/Surface';
import { Txt } from '../../atoms/Txt';
import { Btn } from '../../atoms/Btn';

// ============================================================
// Types
// ============================================================

export type GanttTaskStatus = 'pending' | 'in_progress' | 'completed' | 'delayed';

export interface GanttTask<T = Record<string, unknown>> {
  /** Unique identifier */
  id: string;
  /** Task name */
  name: string;
  /** Start date */
  start: Date | string;
  /** End date */
  end: Date | string;
  /** Progress (0-100) */
  progress?: number;
  /** Task status */
  status?: GanttTaskStatus;
  /** Parent task ID */
  parentId?: string;
  /** Custom data */
  data?: T;
  /** Task color */
  color?: string;
}

export interface BioGanttProps<T = Record<string, unknown>> {
  /** Gantt tasks */
  tasks: GanttTask<T>[];
  /** View start date */
  startDate?: Date;
  /** View end date */
  endDate?: Date;
  /** Called when task is clicked */
  onTaskClick?: (task: GanttTask<T>) => void;
  /** Called when task progress changes */
  onProgressChange?: (taskId: string, progress: number) => void;
  /** Show task names column */
  showTaskList?: boolean;
  /** Row height */
  rowHeight?: number;
  /** Additional className */
  className?: string;
  /** Loading state */
  loading?: boolean;
}

// ============================================================
// Component Meta
// ============================================================

export const COMPONENT_META = {
  code: 'GNTT01',
  version: '1.0.0',
  name: 'BioGantt',
  family: 'GANTT',
  purpose: 'PLAN',
  poweredBy: 'native',
  status: 'active',
} as const;

// ============================================================
// Helper Functions
// ============================================================

function daysBetween(start: Date, end: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((end.getTime() - start.getTime()) / msPerDay);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================================
// Status Colors
// ============================================================

const statusColors: Record<GanttTaskStatus, string> = {
  pending: 'bg-surface-subtle',
  in_progress: 'bg-accent-primary',
  completed: 'bg-status-success',
  delayed: 'bg-status-danger',
};

const statusBgColors: Record<GanttTaskStatus, string> = {
  pending: 'bg-surface-subtle/30',
  in_progress: 'bg-accent-primary/20',
  completed: 'bg-status-success/20',
  delayed: 'bg-status-danger/20',
};

// ============================================================
// Component
// ============================================================

export function BioGantt<T = Record<string, unknown>>({
  tasks,
  startDate: propStartDate,
  endDate: propEndDate,
  onTaskClick,
  onProgressChange,
  showTaskList = true,
  rowHeight = 40,
  className,
  loading = false,
}: BioGanttProps<T>) {
  // Calculate date range from tasks
  const dateRange = React.useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date();
      return {
        start: today,
        end: addDays(today, 30),
      };
    }

    const dates = tasks.flatMap(t => [new Date(t.start), new Date(t.end)]);
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    // Add padding
    return {
      start: propStartDate || addDays(minDate, -7),
      end: propEndDate || addDays(maxDate, 7),
    };
  }, [tasks, propStartDate, propEndDate]);

  const totalDays = daysBetween(dateRange.start, dateRange.end);
  const dayWidth = 30; // pixels per day

  // Generate date headers
  const dateHeaders = React.useMemo(() => {
    const headers: Date[] = [];
    let current = new Date(dateRange.start);
    while (current <= dateRange.end) {
      headers.push(new Date(current));
      current = addDays(current, 1);
    }
    return headers;
  }, [dateRange]);

  // Calculate task position and width
  const getTaskStyle = (task: GanttTask<T>) => {
    const start = new Date(task.start);
    const end = new Date(task.end);
    const startOffset = daysBetween(dateRange.start, start);
    const duration = daysBetween(start, end) + 1;

    return {
      left: startOffset * dayWidth,
      width: duration * dayWidth,
    };
  };

  // Loading state
  if (loading) {
    return (
      <Surface padding="lg" className={cn('overflow-hidden', className)}>
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex gap-4">
              <div className="w-40 h-8 bg-surface-subtle rounded animate-pulse" />
              <div className="flex-1 h-8 bg-surface-subtle rounded animate-pulse" />
            </div>
          ))}
        </div>
      </Surface>
    );
  }

  return (
    <Surface padding="none" className={cn('overflow-hidden', className)} data-testid="bio-gantt">
      {/* Header Controls */}
      <div className="px-4 py-3 border-b border-default flex items-center justify-between">
        <Txt variant="label" weight="semibold">
          Project Timeline
        </Txt>
        <div className="flex items-center gap-2">
          <Btn variant="ghost" size="sm">
            <ZoomOut className="h-4 w-4" />
          </Btn>
          <Btn variant="ghost" size="sm">
            <ZoomIn className="h-4 w-4" />
          </Btn>
        </div>
      </div>

      <div className="flex overflow-x-auto">
        {/* Task List */}
        {showTaskList && (
          <div className="flex-shrink-0 w-48 border-r border-default bg-surface-subtle">
            {/* Header */}
            <div
              className="px-3 py-2 border-b border-default font-medium text-small"
              style={{ height: rowHeight }}
            >
              Task
            </div>
            {/* Task names */}
            {tasks.map(task => (
              <div
                key={task.id}
                className={cn(
                  'px-3 flex items-center border-b border-default',
                  'cursor-pointer hover:bg-surface-hover transition-colors'
                )}
                style={{ height: rowHeight }}
                onClick={() => onTaskClick?.(task)}
              >
                <Txt variant="small" className="truncate">
                  {task.name}
                </Txt>
              </div>
            ))}
          </div>
        )}

        {/* Gantt Chart */}
        <div className="flex-1 overflow-x-auto">
          {/* Date headers */}
          <div
            className="flex border-b border-default bg-surface-subtle"
            style={{ height: rowHeight, width: totalDays * dayWidth }}
          >
            {dateHeaders.map((date, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex-shrink-0 flex items-center justify-center',
                  'border-r border-default text-micro text-text-secondary',
                  date.getDay() === 0 || date.getDay() === 6
                    ? 'bg-surface-subtle/50'
                    : ''
                )}
                style={{ width: dayWidth }}
              >
                {date.getDate()}
              </div>
            ))}
          </div>

          {/* Task bars */}
          <div style={{ width: totalDays * dayWidth }}>
            {tasks.map(task => {
              const style = getTaskStyle(task);
              const status = task.status || 'pending';
              const progress = task.progress || 0;

              return (
                <div
                  key={task.id}
                  className="relative border-b border-default"
                  style={{ height: rowHeight }}
                  data-testid="gantt-task"
                >
                  {/* Background grid */}
                  <div className="absolute inset-0 flex">
                    {dateHeaders.map((date, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'flex-shrink-0 border-r border-default',
                          date.getDay() === 0 || date.getDay() === 6
                            ? 'bg-surface-subtle/30'
                            : ''
                        )}
                        style={{ width: dayWidth }}
                      />
                    ))}
                  </div>

                  {/* Task bar */}
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    className={cn(
                      'absolute top-1/2 -translate-y-1/2 h-6 rounded cursor-pointer',
                      'transition-colors hover:opacity-90',
                      statusBgColors[status]
                    )}
                    style={{
                      left: style.left,
                      width: style.width,
                      transformOrigin: 'left',
                    }}
                    onClick={() => onTaskClick?.(task)}
                  >
                    {/* Progress bar */}
                    <div
                      className={cn(
                        'h-full rounded transition-all',
                        statusColors[status]
                      )}
                      style={{ width: `${progress}%` }}
                    />

                    {/* Task label */}
                    <div className="absolute inset-0 flex items-center px-2">
                      <Txt
                        variant="micro"
                        weight="medium"
                        className="truncate text-text-primary"
                      >
                        {task.name}
                      </Txt>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="p-8 text-center">
          <Txt variant="body" color="tertiary">
            No tasks to display
          </Txt>
        </div>
      )}
    </Surface>
  );
}

BioGantt.displayName = 'BioGantt';
