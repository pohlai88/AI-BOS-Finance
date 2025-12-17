/**
 * BioSplitView - List + Detail split layout
 *
 * Features:
 * - Resizable split panes
 * - Collapsible panels
 * - Responsive (stacked on mobile)
 * - Keyboard navigation
 */

'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '../atoms/utils';
import { Surface } from '../atoms/Surface';

// ============================================================
// Types
// ============================================================

export interface BioSplitViewProps {
  /** Left/list panel content */
  list: React.ReactNode;
  /** Right/detail panel content */
  detail: React.ReactNode;
  /** Is detail panel visible */
  showDetail?: boolean;
  /** Called when detail visibility changes */
  onDetailVisibilityChange?: (visible: boolean) => void;
  /** Initial split ratio (0-1, default 0.4) */
  initialRatio?: number;
  /** Minimum left panel width (px) */
  minLeftWidth?: number;
  /** Minimum right panel width (px) */
  minRightWidth?: number;
  /** Enable resize */
  enableResize?: boolean;
  /** Enable collapse */
  enableCollapse?: boolean;
  /** Persist layout to localStorage */
  persistKey?: string;
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  /** Additional className */
  className?: string;
}

// ============================================================
// Component
// ============================================================

export function BioSplitView({
  list,
  detail,
  showDetail = true,
  onDetailVisibilityChange,
  initialRatio = 0.4,
  minLeftWidth = 300,
  minRightWidth = 400,
  enableResize = true,
  enableCollapse = true,
  persistKey,
  direction = 'horizontal',
  className,
}: BioSplitViewProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = React.useState(initialRatio);
  const [isResizing, setIsResizing] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  // Load persisted layout
  React.useEffect(() => {
    if (persistKey) {
      try {
        const stored = localStorage.getItem(`bioskin_split_${persistKey}`);
        if (stored) {
          const { ratio: storedRatio, collapsed } = JSON.parse(stored);
          if (storedRatio) setRatio(storedRatio);
          if (collapsed !== undefined) setIsCollapsed(collapsed);
        }
      } catch (error) {
        console.error('Failed to load split layout:', error);
      }
    }
  }, [persistKey]);

  // Save layout on change
  React.useEffect(() => {
    if (persistKey) {
      try {
        localStorage.setItem(`bioskin_split_${persistKey}`, JSON.stringify({
          ratio,
          collapsed: isCollapsed,
        }));
      } catch (error) {
        console.error('Failed to save split layout:', error);
      }
    }
  }, [ratio, isCollapsed, persistKey]);

  // Check for mobile viewport
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle resize
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!enableResize) return;
    e.preventDefault();
    setIsResizing(true);
  };

  React.useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      let newRatio: number;

      if (direction === 'horizontal') {
        const x = e.clientX - rect.left;
        newRatio = x / rect.width;
      } else {
        const y = e.clientY - rect.top;
        newRatio = y / rect.height;
      }

      // Clamp ratio based on min widths
      const containerSize = direction === 'horizontal' ? rect.width : rect.height;
      const minLeftRatio = minLeftWidth / containerSize;
      const maxLeftRatio = 1 - (minRightWidth / containerSize);

      newRatio = Math.max(minLeftRatio, Math.min(maxLeftRatio, newRatio));
      setRatio(newRatio);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, direction, minLeftWidth, minRightWidth]);

  // Toggle collapse
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    onDetailVisibilityChange?.(!isCollapsed);
  };

  // Calculate panel styles
  const leftStyle: React.CSSProperties = direction === 'horizontal'
    ? { width: isCollapsed ? '100%' : `${ratio * 100}%` }
    : { height: isCollapsed ? '100%' : `${ratio * 100}%` };

  const rightStyle: React.CSSProperties = direction === 'horizontal'
    ? { width: isCollapsed ? '0%' : `${(1 - ratio) * 100}%` }
    : { height: isCollapsed ? '0%' : `${(1 - ratio) * 100}%` };

  // Mobile: stacked layout
  if (isMobile) {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        {!showDetail ? (
          <div className="flex-1 overflow-auto">{list}</div>
        ) : (
          <div className="flex-1 overflow-auto">{detail}</div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex h-full',
        direction === 'vertical' && 'flex-col',
        isResizing && 'select-none',
        className
      )}
    >
      {/* Left/List Panel */}
      <div
        style={leftStyle}
        className={cn(
          'overflow-auto transition-all duration-200',
          isResizing && 'transition-none'
        )}
      >
        {list}
      </div>

      {/* Resize Handle */}
      {enableResize && showDetail && !isCollapsed && (
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            'flex-shrink-0 bg-border-default hover:bg-accent-primary/30 transition-colors',
            'flex items-center justify-center',
            direction === 'horizontal'
              ? 'w-1 cursor-col-resize'
              : 'h-1 cursor-row-resize',
            isResizing && 'bg-accent-primary'
          )}
        >
          {/* Visual grip */}
          <div
            className={cn(
              'rounded-full bg-text-tertiary/30',
              direction === 'horizontal' ? 'w-0.5 h-8' : 'w-8 h-0.5'
            )}
          />
        </div>
      )}

      {/* Right/Detail Panel */}
      {showDetail && (
        <div
          style={rightStyle}
          className={cn(
            'overflow-auto transition-all duration-200 relative',
            isResizing && 'transition-none',
            isCollapsed && 'hidden'
          )}
        >
          {/* Collapse Button */}
          {enableCollapse && (
            <button
              onClick={toggleCollapse}
              className="absolute top-2 left-2 z-10 p-1.5 rounded bg-surface-subtle hover:bg-surface-nested transition-colors"
              title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
              {direction === 'horizontal' ? (
                isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
              ) : (
                isCollapsed ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />
              )}
            </button>
          )}
          {detail}
        </div>
      )}

      {/* Collapsed Indicator */}
      {enableCollapse && isCollapsed && (
        <button
          onClick={toggleCollapse}
          className={cn(
            'flex-shrink-0 flex items-center justify-center bg-surface-subtle hover:bg-surface-nested transition-colors',
            direction === 'horizontal' ? 'w-8' : 'h-8'
          )}
          title="Expand panel"
        >
          {direction === 'horizontal' ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
}

BioSplitView.displayName = 'BioSplitView';
