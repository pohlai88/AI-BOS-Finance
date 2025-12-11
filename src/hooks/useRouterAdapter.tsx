/**
 * Router Adapter Hook
 * 
 * Provides a unified routing API that works in both:
 * - Next.js App Router (native pages)
 * - React Router (catch-all legacy pages)
 * 
 * This enables incremental migration without breaking either environment.
 * 
 * @see REF_039_RouteMigrationStrategy.md - Wave 3
 */

'use client';

import React, { useCallback, useMemo, createContext, useContext, ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export interface RouterAdapterResult {
  /** Current pathname (e.g., '/dashboard') */
  pathname: string;
  /** Navigate to a new path */
  navigate: (path: string) => void;
  /** Check if a path is active */
  isActive: (path: string) => boolean;
  /** Search params as URLSearchParams (read-only snapshot) */
  searchParams: URLSearchParams;
  /** Update search params (similar to React Router's setSearchParams) */
  setSearchParams: (params: URLSearchParams, options?: { replace?: boolean }) => void;
}

/**
 * Next.js native router adapter
 * Use this in native App Router pages
 */
export function useNextRouter(): RouterAdapterResult {
  const pathname = usePathname();
  const router = useRouter();
  const searchParamsObj = useSearchParams();
  
  const searchParams = useMemo(() => {
    return new URLSearchParams(searchParamsObj.toString());
  }, [searchParamsObj]);

  const navigate = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  const isActive = useCallback((path: string) => {
    return pathname === path;
  }, [pathname]);

  const setSearchParams = useCallback((params: URLSearchParams, options?: { replace?: boolean }) => {
    const newUrl = `${pathname}?${params.toString()}`;
    if (options?.replace) {
      router.replace(newUrl);
    } else {
      router.push(newUrl);
    }
  }, [pathname, router]);

  return {
    pathname,
    navigate,
    isActive,
    searchParams,
    setSearchParams,
  };
}

// Context to provide router adapter from parent
const RouterAdapterContext = createContext<RouterAdapterResult | null>(null);

/**
 * Provider to inject router adapter into component tree
 * Used in app/providers.tsx to make Next.js router available to all components
 */
export function RouterAdapterProvider({ children }: { children: ReactNode }) {
  const adapter = useNextRouter();
  
  return (
    <RouterAdapterContext.Provider value={adapter}>
      {children}
    </RouterAdapterContext.Provider>
  );
}

/**
 * Universal router hook
 * Uses context-provided adapter (works in both Next.js and React Router)
 */
export function useRouterAdapter(): RouterAdapterResult {
  const contextAdapter = useContext(RouterAdapterContext);
  
  if (!contextAdapter) {
    throw new Error(
      'useRouterAdapter must be used within RouterAdapterProvider. ' +
      'Make sure RouterAdapterProvider is in your app/providers.tsx'
    );
  }
  
  return contextAdapter;
}

/**
 * Universal Link component that works in both Next.js and React Router
 * Replaces react-router-dom's Link for router-agnostic navigation
 */
interface RouterLinkProps {
  to: string;
  children: ReactNode;
  className?: string;
  title?: string;
  'aria-label'?: string;
}

export function RouterLink({ to, children, className, title, 'aria-label': ariaLabel }: RouterLinkProps) {
  const { navigate } = useRouterAdapter();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(to);
  };
  
  return (
    <a 
      href={to} 
      onClick={handleClick} 
      className={className} 
      title={title}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
}
