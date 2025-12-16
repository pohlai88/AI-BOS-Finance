/**
 * BioBreadcrumb - Route-Aware Breadcrumbs
 *
 * Enterprise-grade breadcrumb navigation with:
 * - Auto-generation from route segments
 * - Custom label mapping
 * - Icon support
 * - Responsive collapse
 * - Keyboard navigation
 *
 * @example
 * <BioBreadcrumb
 *   items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Payments', href: '/payments' },
 *     { label: 'PAY-001' }
 *   ]}
 * />
 */

'use client';

import * as React from 'react';
import { ChevronRight, Home, MoreHorizontal } from 'lucide-react';
import { cn } from '../atoms/utils';
import { Txt } from '../atoms/Txt';

// ============================================================
// Types
// ============================================================

export interface BioBreadcrumbItem {
  /** Display label */
  label: string;
  /** Navigation href (optional for current page) */
  href?: string;
  /** Icon component */
  icon?: React.ComponentType<{ className?: string }>;
}

export interface BioBreadcrumbProps {
  /** Breadcrumb items */
  items: BioBreadcrumbItem[];
  /** Navigation handler */
  onNavigate?: (href: string) => void;
  /** Show home icon for first item */
  showHomeIcon?: boolean;
  /** Max items to show before collapsing */
  maxItems?: number;
  /** Separator element */
  separator?: React.ReactNode;
  /** Additional className */
  className?: string;
}

// ============================================================
// Helper: Generate breadcrumbs from pathname
// ============================================================

export interface BreadcrumbConfig {
  /** Map route segments to labels */
  labels?: Record<string, string>;
  /** Home label */
  homeLabel?: string;
}

export function generateBreadcrumbs(
  pathname: string,
  config: BreadcrumbConfig = {}
): BioBreadcrumbItem[] {
  const { labels = {}, homeLabel = 'Home' } = config;

  const segments = pathname.split('/').filter(Boolean);
  const items: BioBreadcrumbItem[] = [
    { label: homeLabel, href: '/', icon: Home },
  ];

  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = labels[segment] || labels[currentPath] || formatSegment(segment);
    items.push({ label, href: currentPath });
  }

  // Last item shouldn't have href (current page)
  if (items.length > 1) {
    delete items[items.length - 1].href;
  }

  return items;
}

function formatSegment(segment: string): string {
  // Handle dynamic segments like [id]
  if (segment.startsWith('[') && segment.endsWith(']')) {
    return segment.slice(1, -1).toUpperCase();
  }

  // Convert kebab-case to Title Case
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ============================================================
// Main Component
// ============================================================

export function BioBreadcrumb({
  items,
  onNavigate,
  showHomeIcon = true,
  maxItems = 4,
  separator = <ChevronRight className="w-4 h-4 text-text-muted" />,
  className,
}: BioBreadcrumbProps) {
  const [expanded, setExpanded] = React.useState(false);

  // Determine if we need to collapse
  const shouldCollapse = items.length > maxItems && !expanded;

  let displayItems = items;
  if (shouldCollapse) {
    // Show first, ellipsis, and last (maxItems - 2) items
    displayItems = [
      items[0],
      { label: '...', href: undefined } as BioBreadcrumbItem,
      ...items.slice(-(maxItems - 2)),
    ];
  }

  const handleClick = (item: BioBreadcrumbItem, e: React.MouseEvent) => {
    if (item.label === '...') {
      e.preventDefault();
      setExpanded(true);
      return;
    }

    if (item.href && onNavigate) {
      e.preventDefault();
      onNavigate(item.href);
    }
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center', className)}
      data-testid="bio-breadcrumb"
    >
      <ol className="flex items-center gap-1">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isEllipsis = item.label === '...';
          const Icon = item.icon;
          const showIcon = index === 0 && showHomeIcon && Icon;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && <span className="mx-1">{separator}</span>}

              {isEllipsis ? (
                <button
                  onClick={(e) => handleClick(item, e)}
                  className="p-1 hover:bg-surface-hover rounded transition-colors"
                  aria-label="Show all breadcrumbs"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              ) : item.href ? (
                <a
                  href={item.href}
                  onClick={(e) => handleClick(item, e)}
                  className={cn(
                    'flex items-center gap-1 px-1 py-0.5 rounded transition-colors',
                    'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  )}
                >
                  {showIcon && <Icon className="w-4 h-4" />}
                  {(!showIcon || item.label !== 'Home') && (
                    <Txt variant="small">{item.label}</Txt>
                  )}
                </a>
              ) : (
                <span className="flex items-center gap-1 px-1 py-0.5">
                  {showIcon && <Icon className="w-4 h-4" />}
                  <Txt
                    variant="small"
                    className={cn(isLast && 'font-medium text-text-primary')}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.label}
                  </Txt>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ============================================================
// Component Meta
// ============================================================

export const BREADCRUMB_META = {
  code: 'BREADCRUMB01',
  version: '1.0.0',
  family: 'NAVIGATION',
  purpose: 'BREADCRUMB',
  status: 'active',
} as const;
