/**
 * BioSidebar - Collapsible Navigation Sidebar
 *
 * Enterprise-grade sidebar with:
 * - Collapsible/expandable state
 * - Nested navigation groups
 * - Active route highlighting
 * - Icon + label support
 * - Keyboard navigation
 * - Mobile responsive (drawer mode)
 *
 * @example
 * <BioSidebar
 *   items={navItems}
 *   collapsed={isCollapsed}
 *   onCollapsedChange={setIsCollapsed}
 *   activeHref="/dashboard"
 * />
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ChevronDown, Menu, X } from 'lucide-react';
import { cn } from '../../atoms/utils';
import { Btn } from '../../atoms/Btn';
import { Txt } from '../../atoms/Txt';
import { Surface } from '../../atoms/Surface';

// ============================================================
// Types
// ============================================================

export interface BioNavItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Route href */
  href?: string;
  /** Lucide icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Nested children (for groups) */
  children?: BioNavItem[];
  /** Badge content (e.g., count) */
  badge?: string | number;
  /** Disabled state */
  disabled?: boolean;
  /** Section divider before this item */
  divider?: boolean;
}

export interface BioSidebarProps {
  /** Navigation items */
  items: BioNavItem[];
  /** Current active href */
  activeHref?: string;
  /** Collapsed state */
  collapsed?: boolean;
  /** Callback when collapsed changes */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Logo/brand element for header */
  logo?: React.ReactNode;
  /** Footer element */
  footer?: React.ReactNode;
  /** Navigation handler */
  onNavigate?: (href: string) => void;
  /** Width when expanded */
  width?: number;
  /** Width when collapsed */
  collapsedWidth?: number;
  /** Enable mobile drawer mode */
  mobileBreakpoint?: number;
  /** Additional className */
  className?: string;
}

// ============================================================
// Sub-components
// ============================================================

interface NavItemProps {
  item: BioNavItem;
  collapsed: boolean;
  isActive: boolean;
  depth: number;
  onNavigate?: (href: string) => void;
}

function NavItem({ item, collapsed, isActive, depth, onNavigate }: NavItemProps) {
  const [expanded, setExpanded] = React.useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;

  const handleClick = () => {
    if (hasChildren) {
      setExpanded(!expanded);
    } else if (item.href && onNavigate) {
      onNavigate(item.href);
    }
  };

  return (
    <div>
      {item.divider && <div className="h-px bg-border-default my-2 mx-3" />}
      
      <button
        onClick={handleClick}
        disabled={item.disabled}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
          'hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent-primary/50',
          isActive && 'bg-accent-primary/10 text-accent-primary',
          item.disabled && 'opacity-50 cursor-not-allowed',
          depth > 0 && 'ml-4 text-sm',
          collapsed && 'justify-center px-2'
        )}
        aria-current={isActive ? 'page' : undefined}
        title={collapsed ? item.label : undefined}
      >
        {Icon && (
          <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-accent-primary')} />
        )}
        
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex-1 text-left truncate"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {!collapsed && item.badge && (
          <span className="px-2 py-0.5 text-xs rounded-full bg-accent-primary/20 text-accent-primary">
            {item.badge}
          </span>
        )}

        {!collapsed && hasChildren && (
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform',
              expanded && 'rotate-180'
            )}
          />
        )}
      </button>

      {/* Nested items */}
      <AnimatePresence>
        {hasChildren && expanded && !collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {item.children!.map((child) => (
              <NavItem
                key={child.id}
                item={child}
                collapsed={collapsed}
                isActive={child.href === onNavigate?.toString()}
                depth={depth + 1}
                onNavigate={onNavigate}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function BioSidebar({
  items,
  activeHref,
  collapsed = false,
  onCollapsedChange,
  logo,
  footer,
  onNavigate,
  width = 256,
  collapsedWidth = 64,
  mobileBreakpoint = 768,
  className,
}: BioSidebarProps) {
  const [isMobile, setIsMobile] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Detect mobile
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [mobileBreakpoint]);

  // Close mobile drawer on navigation
  const handleNavigate = (href: string) => {
    onNavigate?.(href);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-default">
        <AnimatePresence mode="wait">
          {!collapsed && logo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {logo}
            </motion.div>
          )}
        </AnimatePresence>
        
        {!isMobile && (
          <Btn
            variant="ghost"
            size="sm"
            onClick={() => onCollapsedChange?.(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Btn>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2" aria-label="Main navigation">
        {items.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            collapsed={collapsed}
            isActive={item.href === activeHref}
            depth={0}
            onNavigate={handleNavigate}
          />
        ))}
      </nav>

      {/* Footer */}
      {footer && (
        <div className="p-4 border-t border-border-default">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {footer}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </>
  );

  // Mobile: Drawer mode
  if (isMobile) {
    return (
      <>
        {/* Mobile trigger */}
        <Btn
          variant="ghost"
          size="sm"
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 md:hidden"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </Btn>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setMobileOpen(false)}
              />

              {/* Drawer */}
              <motion.aside
                initial={{ x: -width }}
                animate={{ x: 0 }}
                exit={{ x: -width }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={cn(
                  'fixed top-0 left-0 h-full z-50 flex flex-col',
                  'bg-surface-card border-r border-border-default',
                  className
                )}
                style={{ width }}
              >
                <div className="absolute top-4 right-4">
                  <Btn
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close navigation"
                  >
                    <X className="w-5 h-5" />
                  </Btn>
                </div>
                {sidebarContent}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop: Regular sidebar
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? collapsedWidth : width }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={cn(
        'h-screen flex flex-col sticky top-0',
        'bg-surface-card border-r border-border-default',
        className
      )}
      data-testid="bio-sidebar"
    >
      {sidebarContent}
    </motion.aside>
  );
}

// ============================================================
// Component Meta
// ============================================================

export const COMPONENT_META = {
  code: 'SIDEBAR01',
  version: '1.0.0',
  family: 'LAYOUT',
  purpose: 'NAVIGATION',
  status: 'active',
} as const;
