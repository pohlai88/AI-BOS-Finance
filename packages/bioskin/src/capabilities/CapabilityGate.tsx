'use client';

/**
 * @fileoverview CapabilityGate Component
 *
 * React component for conditionally rendering based on capabilities.
 * Per CONT_13: BioCapabilities Feature Flag System
 *
 * @module @aibos/bioskin/capabilities
 * @version 1.0.0
 */

import React from 'react';
import { useCapability, useCapabilities } from './useCapability';
import type { CapabilityPath, CapabilityContext } from './types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../foundation/tooltip';

// ============================================================
// CAPABILITY GATE PROPS
// ============================================================

export interface CapabilityGateProps {
  /** Capability to check */
  capability: CapabilityPath;
  /** Context for evaluation */
  context?: CapabilityContext;
  /** Content to render if enabled */
  children: React.ReactNode;
  /** Fallback if disabled (optional) */
  fallback?: React.ReactNode;
  /** Show tooltip explaining why disabled */
  showReason?: boolean;
  /** Custom wrapper element */
  as?: React.ElementType;
  /** Additional class name */
  className?: string;
}

// ============================================================
// CAPABILITY GATE COMPONENT
// ============================================================

/**
 * CapabilityGate - Conditionally render based on capability
 *
 * @example
 * ```tsx
 * // Simple gate - renders nothing if disabled
 * <CapabilityGate capability="table.inlineEdit">
 *   <InlineEditButton />
 * </CapabilityGate>
 *
 * // With fallback
 * <CapabilityGate
 *   capability="table.bulkEdit"
 *   fallback={<DisabledButton>Bulk Edit</DisabledButton>}
 * >
 *   <BulkEditButton />
 * </CapabilityGate>
 *
 * // With reason tooltip
 * <CapabilityGate
 *   capability="actions.update"
 *   context={{ periodStatus: 'closed' }}
 *   fallback={<DisabledButton>Edit</DisabledButton>}
 *   showReason
 * >
 *   <EditButton />
 * </CapabilityGate>
 * ```
 */
export function CapabilityGate({
  capability,
  context,
  children,
  fallback = null,
  showReason = false,
  as: Component,
  className,
}: CapabilityGateProps): React.ReactElement | null {
  const result = useCapability(capability, context);

  // Capability is enabled - render children
  if (result.enabled) {
    if (Component) {
      return <Component className={className}>{children}</Component>;
    }
    return <>{children}</>;
  }

  // Capability is disabled - render fallback with optional tooltip
  if (fallback) {
    if (showReason && result.reason) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={className}>{fallback}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">{result.reason}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Source: {result.source}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (Component) {
      return <Component className={className}>{fallback}</Component>;
    }
    return <>{fallback}</>;
  }

  // No fallback - render nothing
  return null;
}

// ============================================================
// CAPABILITY SWITCH COMPONENT
// ============================================================

export interface CapabilitySwitchCase {
  /** Capability to check */
  capability: CapabilityPath;
  /** Content to render if this capability is enabled */
  children: React.ReactNode;
}

export interface CapabilitySwitchProps {
  /** Context for all capability checks */
  context?: CapabilityContext;
  /** Capability cases to check (first match wins) */
  cases: CapabilitySwitchCase[];
  /** Default content if no capability matches */
  fallback?: React.ReactNode;
}

/**
 * CapabilitySwitch - Render first matching capability
 *
 * @example
 * ```tsx
 * <CapabilitySwitch
 *   cases={[
 *     { capability: 'table.bulkEdit', children: <BulkEditButton /> },
 *     { capability: 'table.inlineEdit', children: <InlineEditButton /> },
 *   ]}
 *   fallback={<ViewOnlyNotice />}
 * />
 * ```
 */
export function CapabilitySwitch({
  context,
  cases,
  fallback = null,
}: CapabilitySwitchProps): React.ReactElement | null {
  // Extract all capability paths to check them in a single hook call
  const paths = cases.map((c) => c.capability);
  const results = useCapabilities(paths, context);

  // Find first enabled capability
  for (const c of cases) {
    if (results[c.capability]?.enabled) {
      return <>{c.children}</>;
    }
  }

  return <>{fallback}</>;
}

// ============================================================
// REQUIRE CAPABILITY COMPONENT
// ============================================================

export interface RequireCapabilityProps {
  /** Capabilities required (all must be enabled) */
  capabilities: CapabilityPath[];
  /** Context for evaluation */
  context?: CapabilityContext;
  /** Content to render if all enabled */
  children: React.ReactNode;
  /** Fallback if any disabled */
  fallback?: React.ReactNode;
}

/**
 * RequireCapability - Require ALL capabilities to be enabled
 *
 * @example
 * ```tsx
 * <RequireCapability
 *   capabilities={['table.inlineEdit', 'table.rowSelection']}
 *   fallback={<Notice>Editing not available</Notice>}
 * >
 *   <AdvancedEditMode />
 * </RequireCapability>
 * ```
 */
export function RequireCapability({
  capabilities,
  context,
  children,
  fallback = null,
}: RequireCapabilityProps): React.ReactElement | null {
  // Use batched hook to check all capabilities at once (avoids hooks-in-loop)
  const results = useCapabilities(capabilities, context);
  const allEnabled = Object.values(results).every((r) => r.enabled);

  if (allEnabled) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// ============================================================
// REQUIRE ANY CAPABILITY COMPONENT
// ============================================================

export interface RequireAnyCapabilityProps {
  /** Capabilities to check (at least one must be enabled) */
  capabilities: CapabilityPath[];
  /** Context for evaluation */
  context?: CapabilityContext;
  /** Content to render if any enabled */
  children: React.ReactNode;
  /** Fallback if all disabled */
  fallback?: React.ReactNode;
}

/**
 * RequireAnyCapability - Require at least ONE capability to be enabled
 *
 * @example
 * ```tsx
 * <RequireAnyCapability
 *   capabilities={['table.csvExport', 'table.excelExport']}
 *   fallback={<Notice>Export not available</Notice>}
 * >
 *   <ExportMenu />
 * </RequireAnyCapability>
 * ```
 */
export function RequireAnyCapability({
  capabilities,
  context,
  children,
  fallback = null,
}: RequireAnyCapabilityProps): React.ReactElement | null {
  // Use batched hook to check all capabilities at once (avoids hooks-in-loop)
  const results = useCapabilities(capabilities, context);
  const anyEnabled = Object.values(results).some((r) => r.enabled);

  if (anyEnabled) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
