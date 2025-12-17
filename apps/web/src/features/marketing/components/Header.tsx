/**
 * Header
 *
 * DESIGN PRINCIPLES:
 * - Fixed position, glass morphism effect
 * - Logo left, nav center, actions right (balanced)
 * - Consistent spacing using design tokens
 * - Refined hover states with primary accent
 */

'use client';

import { useState, useEffect } from 'react';
import { RouterLink } from '@/hooks/useRouterAdapter';
import { cn } from '@/lib/utils';
import { NexusIcon } from '@/components/icons/NexusIcon';

export const Header = ({
  onGetStarted,
}: {
  onGetStarted: () => void;
  onCanonClick?: () => void;
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-background/80 backdrop-blur-xl border-b border-border-subtle'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-layout-lg py-layout-sm">
        <div className="flex items-center justify-between h-14">
          {/* Logo — Left anchor */}
          <RouterLink to="/" className="flex items-center gap-3 group">
            <NexusIcon size="md" animated={false} />
            <span className="text-body font-medium text-white tracking-tight">
              NexusCanon
            </span>
          </RouterLink>

          {/* Navigation — Center */}
          <nav className="hidden md:flex items-center gap-8">
            <NavLink href="/product">Product</NavLink>
            <NavLink href="/pricing">Pricing</NavLink>
            <NavLink href="/docs">Documentation</NavLink>
            <NavLink href="/changelog">Changelog</NavLink>
          </nav>

          {/* Actions — Right anchor */}
          <div className="flex items-center gap-4">
            <RouterLink
              to="/login"
              className="text-small text-text-secondary hover:text-white transition-colors"
            >
              Sign in
            </RouterLink>
            <button
              onClick={onGetStarted}
              className="px-5 py-2 bg-white text-background text-small font-medium rounded-lg hover:bg-primary hover:text-white transition-all duration-200"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <RouterLink
    to={href}
    className="text-small text-text-secondary hover:text-white transition-colors relative group"
  >
    {children}
    <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-200" />
  </RouterLink>
);
