'use client';

/**
 * @aibos/bioskin/layout - Granular entry point for layout components
 *
 * Use this for better tree-shaking when you need app shell components.
 *
 * @example
 * import { BioAppShell, BioSidebar, BioNavbar } from '@aibos/bioskin/layout';
 *
 * @see PERFORMANCE.md for optimization guide
 */

// Layout Components
export { BioAppShell, useAppShell, type BioAppShellProps } from './organisms/BioAppShell';
export { BioSidebar, type BioSidebarProps, type BioNavItem } from './organisms/BioSidebar';
export { BioNavbar, type BioNavbarProps, type BioNavbarUser, type BioNavbarAction } from './organisms/BioNavbar';
export { BioCommandPalette, type BioCommandPaletteProps, type BioCommand } from './organisms/BioCommandPalette';
export { BioBreadcrumb, generateBreadcrumbs, type BioBreadcrumbProps, type BioBreadcrumbItem } from './molecules/BioBreadcrumb';
export { BioToastProvider, bioToast, type BioToastProviderProps, type BioToastPosition } from './molecules/BioToast';
