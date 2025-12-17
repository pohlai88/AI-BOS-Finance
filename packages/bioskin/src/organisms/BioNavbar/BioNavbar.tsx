/**
 * BioNavbar - Top Navigation Bar
 *
 * Enterprise-grade top navbar with:
 * - Logo/brand area
 * - Search trigger (for command palette)
 * - Action buttons
 * - User menu
 * - Notifications
 * - Mobile responsive
 *
 * @example
 * <BioNavbar
 *   logo={<Logo />}
 *   onSearch={() => openCommandPalette()}
 *   user={{ name: 'John', avatar: '/avatar.jpg' }}
 *   notifications={5}
 * />
 */

'use client';

import * as React from 'react';
import { Search, Bell, Settings, LogOut, User, ChevronDown, Menu } from 'lucide-react';
import { cn } from '../../atoms/utils';
import { Btn } from '../../atoms/Btn';
import { Txt } from '../../atoms/Txt';
import { Surface } from '../../atoms/Surface';

// ============================================================
// Types
// ============================================================

export interface BioNavbarUser {
  /** User display name */
  name: string;
  /** User email */
  email?: string;
  /** Avatar URL */
  avatar?: string;
  /** User role/title */
  role?: string;
}

export interface BioNavbarAction {
  /** Unique identifier */
  id: string;
  /** Action label */
  label: string;
  /** Icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Click handler */
  onClick?: () => void;
  /** Href for link actions */
  href?: string;
}

export interface BioNavbarProps {
  /** Logo/brand element */
  logo?: React.ReactNode;
  /** Search click handler (opens command palette) */
  onSearch?: () => void;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Current user */
  user?: BioNavbarUser;
  /** Notification count */
  notifications?: number;
  /** Notification click handler */
  onNotifications?: () => void;
  /** User menu actions */
  userMenuActions?: BioNavbarAction[];
  /** Custom actions for navbar */
  actions?: React.ReactNode;
  /** Sign out handler */
  onSignOut?: () => void;
  /** Mobile menu toggle */
  onMobileMenuToggle?: () => void;
  /** Show mobile menu button */
  showMobileMenu?: boolean;
  /** Fixed/sticky position */
  position?: 'fixed' | 'sticky' | 'static';
  /** Additional className */
  className?: string;
}

// ============================================================
// Sub-components
// ============================================================

interface UserMenuProps {
  user: BioNavbarUser;
  actions?: BioNavbarAction[];
  onSignOut?: () => void;
}

function UserMenu({ user, actions, onSignOut }: UserMenuProps) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors',
          'hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent-primary/50'
        )}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center">
            <User className="w-4 h-4 text-accent-primary" />
          </div>
        )}
        <div className="hidden md:block text-left">
          <Txt variant="label" className="block leading-tight">{user.name}</Txt>
          {user.role && (
            <Txt variant="caption" color="secondary" className="block leading-tight">{user.role}</Txt>
          )}
        </div>
        <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {open && (
        <Surface
          variant="card"
          className="absolute right-0 top-full mt-2 w-56 py-2 z-50 shadow-lg"
        >
          {/* User info */}
          <div className="px-4 py-2 border-b border-border-default">
            <Txt variant="label" className="block">{user.name}</Txt>
            {user.email && <Txt variant="caption" color="secondary">{user.email}</Txt>}
          </div>

          {/* Custom actions */}
          {actions?.map((action) => (
            <button
              key={action.id}
              onClick={() => {
                action.onClick?.();
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-hover transition-colors"
            >
              {action.icon && <action.icon className="w-4 h-4" />}
              <span>{action.label}</span>
            </button>
          ))}

          {/* Settings */}
          <button
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-hover transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>

          {/* Sign out */}
          {onSignOut && (
            <>
              <div className="h-px bg-border-default my-1" />
              <button
                onClick={() => {
                  onSignOut();
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-status-error hover:bg-surface-hover transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </>
          )}
        </Surface>
      )}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function BioNavbar({
  logo,
  onSearch,
  searchPlaceholder = 'Search... (⌘K)',
  user,
  notifications = 0,
  onNotifications,
  userMenuActions,
  actions,
  onSignOut,
  onMobileMenuToggle,
  showMobileMenu = true,
  position = 'sticky',
  className,
}: BioNavbarProps) {
  return (
    <header
      className={cn(
        'top-0 z-40 w-full',
        'bg-surface-card/80 backdrop-blur-sm border-b border-border-default',
        position === 'fixed' && 'fixed',
        position === 'sticky' && 'sticky',
        className
      )}
      data-testid="bio-navbar"
    >
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left: Mobile menu + Logo */}
        <div className="flex items-center gap-3">
          {showMobileMenu && onMobileMenuToggle && (
            <Btn
              variant="ghost"
              size="sm"
              onClick={onMobileMenuToggle}
              className="md:hidden"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </Btn>
          )}

          {logo && <div className="flex-shrink-0">{logo}</div>}
        </div>

        {/* Center: Search */}
        {onSearch && (
          <button
            onClick={onSearch}
            className={cn(
              'hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md',
              'bg-surface-subtle border border-border-default',
              'text-text-secondary hover:text-text-primary hover:border-border-hover',
              'transition-colors w-64 lg:w-80'
            )}
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left text-sm">{searchPlaceholder}</span>
            <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-surface-card rounded border border-border-default">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Right: Actions + Notifications + User */}
        <div className="flex items-center gap-2">
          {/* Custom actions */}
          {actions}

          {/* Mobile search */}
          {onSearch && (
            <Btn
              variant="ghost"
              size="sm"
              onClick={onSearch}
              className="md:hidden"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </Btn>
          )}

          {/* Notifications */}
          {onNotifications && (
            <Btn
              variant="ghost"
              size="sm"
              onClick={onNotifications}
              className="relative"
              aria-label={`${notifications} notifications`}
            >
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-xs bg-status-error text-white rounded-full flex items-center justify-center">
                  {notifications > 9 ? '9+' : notifications}
                </span>
              )}
            </Btn>
          )}

          {/* User menu */}
          {user && (
            <UserMenu
              user={user}
              actions={userMenuActions}
              onSignOut={onSignOut}
            />
          )}
        </div>
      </div>
    </header>
  );
}

// ============================================================
// Component Meta
// ============================================================

export const COMPONENT_META = {
  code: 'NAVBAR01',
  version: '1.0.0',
  family: 'LAYOUT',
  purpose: 'NAVIGATION',
  status: 'active',
} as const;
