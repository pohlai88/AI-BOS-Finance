/**
 * useRoleBasedSuggestions - Role-aware smart suggestions
 *
 * Features:
 * - Suggestions based on user role
 * - Context-aware recommendations
 * - Template suggestions for first records
 * - Learning from user behavior
 */

'use client';

import * as React from 'react';

// ============================================================
// Types
// ============================================================

export interface UserRole {
  id: string;
  name: string;
  permissions?: string[];
}

export interface Suggestion {
  id: string;
  type: 'action' | 'template' | 'tip' | 'shortcut' | 'module';
  title: string;
  description?: string;
  icon?: string;
  priority: number;
  /** Target module/page */
  target?: string;
  /** Action to perform */
  action?: () => void;
  /** URL to navigate to */
  href?: string;
  /** Template data if type is 'template' */
  templateData?: Record<string, unknown>;
  /** Conditions for showing */
  conditions?: {
    roles?: string[];
    modules?: string[];
    firstTime?: boolean;
    hasData?: boolean;
  };
}

export interface SuggestionConfig {
  role: string;
  module?: string;
  suggestions: Suggestion[];
}

export interface UseRoleBasedSuggestionsOptions {
  /** Current user role */
  role?: UserRole;
  /** Current module/page context */
  module?: string;
  /** Custom suggestions config */
  config?: SuggestionConfig[];
  /** Max suggestions to return */
  maxSuggestions?: number;
  /** Track interaction with suggestions */
  onInteraction?: (suggestion: Suggestion, action: 'view' | 'click' | 'dismiss') => void;
  /** Storage key for persistence */
  storageKey?: string;
}

export interface UseRoleBasedSuggestionsReturn {
  /** Filtered suggestions for current context */
  suggestions: Suggestion[];
  /** Get suggestions for a specific module */
  getSuggestionsForModule: (module: string) => Suggestion[];
  /** Mark suggestion as seen */
  markAsSeen: (suggestionId: string) => void;
  /** Mark suggestion as dismissed */
  dismiss: (suggestionId: string) => void;
  /** Check if suggestion was dismissed */
  isDismissed: (suggestionId: string) => boolean;
  /** Reset dismissed suggestions */
  resetDismissed: () => void;
  /** Get first-time hints for module */
  getFirstTimeHints: (module: string) => string[];
  /** Template suggestions for module */
  templateSuggestions: Suggestion[];
}

// ============================================================
// Default Suggestions
// ============================================================

const defaultSuggestions: SuggestionConfig[] = [
  // Controller role
  {
    role: 'controller',
    suggestions: [
      {
        id: 'ctrl-period-close',
        type: 'action',
        title: 'Review Period Close',
        description: 'Check the status of your month-end close process',
        priority: 1,
        target: '/period-close',
        conditions: { roles: ['controller', 'admin'] },
      },
      {
        id: 'ctrl-reconciliation',
        type: 'action',
        title: 'Bank Reconciliation',
        description: 'Match bank transactions with GL entries',
        priority: 2,
        target: '/reconciliation',
        conditions: { roles: ['controller', 'admin'] },
      },
      {
        id: 'ctrl-reports',
        type: 'tip',
        title: 'Generate Financial Statements',
        description: 'Create P&L, Balance Sheet, and Cash Flow reports',
        priority: 3,
        target: '/reports',
        conditions: { roles: ['controller', 'admin'] },
      },
    ],
  },
  // AP Clerk role
  {
    role: 'ap_clerk',
    suggestions: [
      {
        id: 'ap-pending-invoices',
        type: 'action',
        title: 'Process Pending Invoices',
        description: 'You have invoices waiting for review',
        priority: 1,
        target: '/ap/invoices?status=pending',
        conditions: { roles: ['ap_clerk', 'ap_manager', 'admin'] },
      },
      {
        id: 'ap-payment-run',
        type: 'action',
        title: 'Create Payment Run',
        description: 'Schedule payments for approved invoices',
        priority: 2,
        target: '/payments/new',
        conditions: { roles: ['ap_clerk', 'ap_manager', 'admin'] },
      },
      {
        id: 'ap-vendor-setup',
        type: 'tip',
        title: 'Set Up New Vendor',
        description: 'Add vendor details for faster invoice processing',
        priority: 4,
        target: '/vendors/new',
        conditions: { roles: ['ap_clerk', 'ap_manager', 'admin'], firstTime: true },
      },
    ],
  },
  // AR Clerk role
  {
    role: 'ar_clerk',
    suggestions: [
      {
        id: 'ar-overdue',
        type: 'action',
        title: 'Review Overdue Invoices',
        description: 'Follow up on past-due customer invoices',
        priority: 1,
        target: '/ar/invoices?status=overdue',
        conditions: { roles: ['ar_clerk', 'ar_manager', 'admin'] },
      },
      {
        id: 'ar-apply-payments',
        type: 'action',
        title: 'Apply Customer Payments',
        description: 'Match received payments to open invoices',
        priority: 2,
        target: '/ar/payments',
        conditions: { roles: ['ar_clerk', 'ar_manager', 'admin'] },
      },
    ],
  },
  // Admin role
  {
    role: 'admin',
    suggestions: [
      {
        id: 'admin-users',
        type: 'action',
        title: 'Manage Users',
        description: 'Add or modify user accounts and permissions',
        priority: 1,
        target: '/admin/users',
        conditions: { roles: ['admin'] },
      },
      {
        id: 'admin-integrations',
        type: 'action',
        title: 'Configure Integrations',
        description: 'Connect your accounting system with other tools',
        priority: 2,
        target: '/admin/integrations',
        conditions: { roles: ['admin'] },
      },
    ],
  },
];

// Module-specific first-time hints
const firstTimeHints: Record<string, string[]> = {
  'ap': [
    'Start by setting up your vendors in the Vendor Master',
    'Use templates to speed up invoice entry',
    'Set up approval workflows for spending controls',
  ],
  'ar': [
    'Add your customers to the Customer Master first',
    'Configure payment terms for automatic due date calculation',
    'Enable email reminders for overdue invoices',
  ],
  'gl': [
    'Set up your Chart of Accounts before creating entries',
    'Use recurring entries for monthly accruals',
    'Configure period close checklists for compliance',
  ],
  'payments': [
    'Connect your bank accounts for faster payments',
    'Set up payment approval workflows',
    'Configure payment batching for efficiency',
  ],
};

// ============================================================
// Hook
// ============================================================

export function useRoleBasedSuggestions({
  role,
  module,
  config = defaultSuggestions,
  maxSuggestions = 5,
  onInteraction,
  storageKey = 'default',
}: UseRoleBasedSuggestionsOptions): UseRoleBasedSuggestionsReturn {
  const [dismissedIds, setDismissedIds] = React.useState<Set<string>>(new Set());
  const [seenIds, setSeenIds] = React.useState<Set<string>>(new Set());

  // Load dismissed state
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(`bioskin_dismissed_suggestions_${storageKey}`);
      if (stored) {
        setDismissedIds(new Set(JSON.parse(stored)));
      }
    } catch (e) {
      // Ignore
    }
  }, [storageKey]);

  // Save dismissed state
  const saveDismissed = React.useCallback((ids: Set<string>) => {
    try {
      localStorage.setItem(
        `bioskin_dismissed_suggestions_${storageKey}`,
        JSON.stringify([...ids])
      );
    } catch (e) {
      // Ignore
    }
  }, [storageKey]);

  // Filter suggestions based on role and context
  const filterSuggestions = React.useCallback((
    suggestions: Suggestion[],
    targetModule?: string
  ): Suggestion[] => {
    return suggestions
      .filter(s => {
        // Skip dismissed
        if (dismissedIds.has(s.id)) return false;

        // Check role conditions
        if (s.conditions?.roles && role) {
          if (!s.conditions.roles.includes(role.id) && !s.conditions.roles.includes(role.name)) {
            return false;
          }
        }

        // Check module conditions
        if (s.conditions?.modules && targetModule) {
          if (!s.conditions.modules.includes(targetModule)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => a.priority - b.priority)
      .slice(0, maxSuggestions);
  }, [dismissedIds, role, maxSuggestions]);

  // Get all suggestions for current context
  const suggestions = React.useMemo(() => {
    const allSuggestions: Suggestion[] = [];

    // Get suggestions from config matching role
    for (const configItem of config) {
      if (!role || configItem.role === role.id || configItem.role === role.name || configItem.role === '*') {
        allSuggestions.push(...configItem.suggestions);
      }
    }

    return filterSuggestions(allSuggestions, module);
  }, [config, role, module, filterSuggestions]);

  // Get suggestions for specific module
  const getSuggestionsForModule = React.useCallback((targetModule: string): Suggestion[] => {
    const allSuggestions: Suggestion[] = [];

    for (const configItem of config) {
      if (!role || configItem.role === role.id || configItem.role === role.name || configItem.role === '*') {
        if (!configItem.module || configItem.module === targetModule) {
          allSuggestions.push(...configItem.suggestions);
        }
      }
    }

    return filterSuggestions(allSuggestions, targetModule);
  }, [config, role, filterSuggestions]);

  // Mark as seen
  const markAsSeen = React.useCallback((suggestionId: string) => {
    setSeenIds(prev => new Set([...prev, suggestionId]));
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      onInteraction?.(suggestion, 'view');
    }
  }, [suggestions, onInteraction]);

  // Dismiss suggestion
  const dismiss = React.useCallback((suggestionId: string) => {
    setDismissedIds(prev => {
      const updated = new Set([...prev, suggestionId]);
      saveDismissed(updated);
      return updated;
    });
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      onInteraction?.(suggestion, 'dismiss');
    }
  }, [suggestions, onInteraction, saveDismissed]);

  // Check if dismissed
  const isDismissed = React.useCallback((suggestionId: string): boolean => {
    return dismissedIds.has(suggestionId);
  }, [dismissedIds]);

  // Reset dismissed
  const resetDismissed = React.useCallback(() => {
    setDismissedIds(new Set());
    localStorage.removeItem(`bioskin_dismissed_suggestions_${storageKey}`);
  }, [storageKey]);

  // Get first-time hints
  const getFirstTimeHints = React.useCallback((targetModule: string): string[] => {
    return firstTimeHints[targetModule] || [];
  }, []);

  // Template suggestions
  const templateSuggestions = React.useMemo(() => {
    return suggestions.filter(s => s.type === 'template');
  }, [suggestions]);

  return {
    suggestions,
    getSuggestionsForModule,
    markAsSeen,
    dismiss,
    isDismissed,
    resetDismissed,
    getFirstTimeHints,
    templateSuggestions,
  };
}
