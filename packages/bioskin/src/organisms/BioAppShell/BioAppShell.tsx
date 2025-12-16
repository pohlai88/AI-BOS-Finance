/**
 * BioAppShell - Root Layout Wrapper
 *
 * Enterprise-grade application shell that composes:
 * - BioSidebar (left navigation)
 * - BioNavbar (top bar)
 * - Main content area
 * - Optional footer
 *
 * Handles responsive layout, sidebar state, and provides context.
 *
 * @example
 * <BioAppShell
 *   navItems={navigation}
 *   logo={<Logo />}
 *   user={currentUser}
 * >
 *   <YourPageContent />
 * </BioAppShell>
 */

'use client';

import * as React from 'react';
import { cn } from '../../atoms/utils';
import { BioSidebar, type BioNavItem } from '../BioSidebar';
import { BioNavbar, type BioNavbarUser, type BioNavbarAction } from '../BioNavbar';

// ============================================================
// Types
// ============================================================

export interface BioAppShellProps {
  /** Navigation items for sidebar */
  navItems: BioNavItem[];
  /** Current active route */
  activeHref?: string;
  /** Logo element */
  logo?: React.ReactNode;
  /** Logo for collapsed sidebar (icon only) */
  logoIcon?: React.ReactNode;
  /** Current user */
  user?: BioNavbarUser;
  /** User menu actions */
  userMenuActions?: BioNavbarAction[];
  /** Notification count */
  notifications?: number;
  /** Notification click handler */
  onNotifications?: () => void;
  /** Search click handler */
  onSearch?: () => void;
  /** Sign out handler */
  onSignOut?: () => void;
  /** Navigation handler */
  onNavigate?: (href: string) => void;
  /** Sidebar footer content */
  sidebarFooter?: React.ReactNode;
  /** Main footer content */
  footer?: React.ReactNode;
  /** Default sidebar collapsed state */
  defaultCollapsed?: boolean;
  /** Persist sidebar state to localStorage */
  persistState?: boolean;
  /** localStorage key for state */
  storageKey?: string;
  /** Additional navbar actions */
  navbarActions?: React.ReactNode;
  /** Hide navbar */
  hideNavbar?: boolean;
  /** Hide sidebar */
  hideSidebar?: boolean;
  /** Page content */
  children: React.ReactNode;
  /** Additional className for main content */
  className?: string;
}

// ============================================================
// Context
// ============================================================

interface AppShellContextValue {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isMobile: boolean;
}

const AppShellContext = React.createContext<AppShellContextValue | null>(null);

export function useAppShell() {
  const context = React.useContext(AppShellContext);
  if (!context) {
    throw new Error('useAppShell must be used within BioAppShell');
  }
  return context;
}

// ============================================================
// Main Component
// ============================================================

export function BioAppShell({
  navItems,
  activeHref,
  logo,
  logoIcon,
  user,
  userMenuActions,
  notifications,
  onNotifications,
  onSearch,
  onSignOut,
  onNavigate,
  sidebarFooter,
  footer,
  defaultCollapsed = false,
  persistState = true,
  storageKey = 'bio-sidebar-collapsed',
  navbarActions,
  hideNavbar = false,
  hideSidebar = false,
  children,
  className,
}: BioAppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(defaultCollapsed);
  const [isMobile, setIsMobile] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Hydration-safe initialization
  React.useEffect(() => {
    setMounted(true);

    // Load persisted state
    if (persistState && typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        setSidebarCollapsed(stored === 'true');
      }
    }

    // Check mobile
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [persistState, storageKey]);

  // Persist sidebar state
  const handleCollapsedChange = React.useCallback(
    (collapsed: boolean) => {
      setSidebarCollapsed(collapsed);
      if (persistState && typeof window !== 'undefined') {
        localStorage.setItem(storageKey, String(collapsed));
      }
    },
    [persistState, storageKey]
  );

  // Context value
  const contextValue = React.useMemo(
    () => ({
      sidebarCollapsed,
      setSidebarCollapsed: handleCollapsedChange,
      isMobile,
    }),
    [sidebarCollapsed, handleCollapsedChange, isMobile]
  );

  // Don't render layout until mounted (avoid hydration mismatch)
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="animate-pulse p-8">Loading...</div>
      </div>
    );
  }

  return (
    <AppShellContext.Provider value={contextValue}>
      <div className="min-h-screen bg-background flex" data-testid="bio-app-shell">
        {/* Sidebar */}
        {!hideSidebar && (
          <BioSidebar
            items={navItems}
            activeHref={activeHref}
            collapsed={sidebarCollapsed}
            onCollapsedChange={handleCollapsedChange}
            logo={sidebarCollapsed ? logoIcon : logo}
            footer={sidebarFooter}
            onNavigate={onNavigate}
          />
        )}

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Navbar */}
          {!hideNavbar && (
            <BioNavbar
              logo={hideSidebar ? logo : undefined}
              onSearch={onSearch}
              user={user}
              notifications={notifications}
              onNotifications={onNotifications}
              userMenuActions={userMenuActions}
              onSignOut={onSignOut}
              actions={navbarActions}
              showMobileMenu={!hideSidebar}
              onMobileMenuToggle={() => handleCollapsedChange(!sidebarCollapsed)}
            />
          )}

          {/* Content */}
          <main className={cn('flex-1 overflow-auto', className)}>
            {children}
          </main>

          {/* Footer */}
          {footer && (
            <footer className="border-t border-border-default bg-surface-card p-4">
              {footer}
            </footer>
          )}
        </div>
      </div>
    </AppShellContext.Provider>
  );
}

// ============================================================
// Component Meta
// ============================================================

export const COMPONENT_META = {
  code: 'SHELL01',
  version: '1.0.0',
  family: 'LAYOUT',
  purpose: 'SHELL',
  status: 'active',
} as const;
