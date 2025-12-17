/**
 * Module-Specific Empty States
 *
 * Pre-configured empty states for common finance/ERP modules:
 * - Accounts Payable (AP)
 * - Accounts Receivable (AR)
 * - General Ledger (GL)
 * - Payments
 * - Inventory
 * - Purchasing
 */

'use client';

import * as React from 'react';
import {
  FileText,
  Receipt,
  Book,
  CreditCard,
  Package,
  ShoppingCart,
  Plus,
  Upload,
  FileSpreadsheet,
  Play,
  HelpCircle,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../atoms/utils';
import { EmptyState, type EmptyStateProps } from './EmptyState';

// ============================================================
// Types
// ============================================================

export interface ModuleEmptyStateProps extends Omit<EmptyStateProps, 'icon' | 'title' | 'description'> {
  /** Override title */
  title?: string;
  /** Override description */
  description?: string;
  /** Override icon */
  icon?: LucideIcon;
  /** Show create button */
  onCreateClick?: () => void;
  /** Show import button */
  onImportClick?: () => void;
  /** Show template button */
  onUseTemplateClick?: () => void;
  /** Show tutorial button */
  onWatchTutorialClick?: () => void;
  /** Custom action label */
  createLabel?: string;
}

// ============================================================
// Accounts Payable Empty State
// ============================================================

export function EmptyStateAP({
  title = 'No invoices yet',
  description = 'Create your first vendor invoice to start managing accounts payable.',
  icon = Receipt,
  onCreateClick,
  onImportClick,
  onUseTemplateClick,
  onWatchTutorialClick,
  createLabel = 'Create Invoice',
  ...props
}: ModuleEmptyStateProps) {
  const hints = [
    'Tip: Use templates to speed up invoice creation',
    'You can import invoices from CSV or Excel',
    'Set up recurring invoices for regular vendors',
  ];

  const quickActions = [];

  if (onImportClick) {
    quickActions.push({
      label: 'Import CSV',
      icon: Upload,
      onClick: onImportClick,
    });
  }

  if (onUseTemplateClick) {
    quickActions.push({
      label: 'Use Template',
      icon: FileSpreadsheet,
      onClick: onUseTemplateClick,
    });
  }

  if (onWatchTutorialClick) {
    quickActions.push({
      label: 'Watch Tutorial',
      icon: Play,
      onClick: onWatchTutorialClick,
    });
  }

  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      action={onCreateClick ? {
        label: createLabel,
        onClick: onCreateClick,
        variant: 'primary',
      } : undefined}
      hints={hints}
      quickActions={quickActions.length > 0 ? quickActions : undefined}
      {...props}
    />
  );
}

EmptyStateAP.displayName = 'EmptyStateAP';

// ============================================================
// Accounts Receivable Empty State
// ============================================================

export function EmptyStateAR({
  title = 'No receivables yet',
  description = 'Create your first customer invoice to start tracking accounts receivable.',
  icon = FileText,
  onCreateClick,
  onImportClick,
  onUseTemplateClick,
  onWatchTutorialClick,
  createLabel = 'Create Invoice',
  ...props
}: ModuleEmptyStateProps) {
  const hints = [
    'Set up payment terms for faster collections',
    'Enable automated reminders for overdue invoices',
    'Connect your bank for automatic payment matching',
  ];

  const quickActions = [];

  if (onImportClick) {
    quickActions.push({
      label: 'Import Invoices',
      icon: Upload,
      onClick: onImportClick,
    });
  }

  if (onUseTemplateClick) {
    quickActions.push({
      label: 'Use Template',
      icon: FileSpreadsheet,
      onClick: onUseTemplateClick,
    });
  }

  if (onWatchTutorialClick) {
    quickActions.push({
      label: 'Setup Guide',
      icon: HelpCircle,
      onClick: onWatchTutorialClick,
    });
  }

  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      action={onCreateClick ? {
        label: createLabel,
        onClick: onCreateClick,
        variant: 'primary',
      } : undefined}
      hints={hints}
      quickActions={quickActions.length > 0 ? quickActions : undefined}
      {...props}
    />
  );
}

EmptyStateAR.displayName = 'EmptyStateAR';

// ============================================================
// General Ledger Empty State
// ============================================================

export function EmptyStateGL({
  title = 'No journal entries',
  description = 'Start with your chart of accounts and create your first journal entry.',
  icon = Book,
  onCreateClick,
  onImportClick,
  onUseTemplateClick,
  onWatchTutorialClick,
  createLabel = 'Create Entry',
  ...props
}: ModuleEmptyStateProps) {
  const hints = [
    'Set up your chart of accounts before creating entries',
    'Use recurring entries for monthly accruals',
    'Import historical data to get started quickly',
  ];

  const quickActions = [];

  if (onImportClick) {
    quickActions.push({
      label: 'Import Chart of Accounts',
      icon: Upload,
      onClick: onImportClick,
    });
  }

  if (onUseTemplateClick) {
    quickActions.push({
      label: 'Standard Chart',
      icon: FileSpreadsheet,
      onClick: onUseTemplateClick,
    });
  }

  if (onWatchTutorialClick) {
    quickActions.push({
      label: 'GL Setup Guide',
      icon: Play,
      onClick: onWatchTutorialClick,
    });
  }

  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      action={onCreateClick ? {
        label: createLabel,
        onClick: onCreateClick,
        variant: 'primary',
      } : undefined}
      hints={hints}
      quickActions={quickActions.length > 0 ? quickActions : undefined}
      {...props}
    />
  );
}

EmptyStateGL.displayName = 'EmptyStateGL';

// ============================================================
// Payments Empty State
// ============================================================

export function EmptyStatePay({
  title = 'No payments yet',
  description = 'Process your first payment or set up bank connections for automated payments.',
  icon = CreditCard,
  onCreateClick,
  onImportClick,
  onUseTemplateClick,
  onWatchTutorialClick,
  createLabel = 'Create Payment',
  ...props
}: ModuleEmptyStateProps) {
  const hints = [
    'Connect your bank for faster payment processing',
    'Set up payment batches for efficient processing',
    'Enable approval workflows for payment security',
  ];

  const quickActions = [];

  if (onImportClick) {
    quickActions.push({
      label: 'Import Payments',
      icon: Upload,
      onClick: onImportClick,
    });
  }

  if (onUseTemplateClick) {
    quickActions.push({
      label: 'Connect Bank',
      icon: ArrowRight,
      onClick: onUseTemplateClick,
    });
  }

  if (onWatchTutorialClick) {
    quickActions.push({
      label: 'Payment Guide',
      icon: HelpCircle,
      onClick: onWatchTutorialClick,
    });
  }

  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      action={onCreateClick ? {
        label: createLabel,
        onClick: onCreateClick,
        variant: 'primary',
      } : undefined}
      hints={hints}
      quickActions={quickActions.length > 0 ? quickActions : undefined}
      {...props}
    />
  );
}

EmptyStatePay.displayName = 'EmptyStatePay';

// ============================================================
// Inventory Empty State
// ============================================================

export function EmptyStateInventory({
  title = 'No inventory items',
  description = 'Add your first product or item to start tracking inventory levels.',
  icon = Package,
  onCreateClick,
  onImportClick,
  onUseTemplateClick,
  onWatchTutorialClick,
  createLabel = 'Add Item',
  ...props
}: ModuleEmptyStateProps) {
  const hints = [
    'Set up item categories for better organization',
    'Configure reorder points for low stock alerts',
    'Enable barcode scanning for faster operations',
  ];

  const quickActions = [];

  if (onImportClick) {
    quickActions.push({
      label: 'Import Items',
      icon: Upload,
      onClick: onImportClick,
    });
  }

  if (onUseTemplateClick) {
    quickActions.push({
      label: 'Item Template',
      icon: FileSpreadsheet,
      onClick: onUseTemplateClick,
    });
  }

  if (onWatchTutorialClick) {
    quickActions.push({
      label: 'Inventory Guide',
      icon: Play,
      onClick: onWatchTutorialClick,
    });
  }

  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      action={onCreateClick ? {
        label: createLabel,
        onClick: onCreateClick,
        variant: 'primary',
      } : undefined}
      hints={hints}
      quickActions={quickActions.length > 0 ? quickActions : undefined}
      {...props}
    />
  );
}

EmptyStateInventory.displayName = 'EmptyStateInventory';

// ============================================================
// Purchasing Empty State
// ============================================================

export function EmptyStatePurchasing({
  title = 'No purchase orders',
  description = 'Create your first purchase order to start managing procurement.',
  icon = ShoppingCart,
  onCreateClick,
  onImportClick,
  onUseTemplateClick,
  onWatchTutorialClick,
  createLabel = 'Create PO',
  ...props
}: ModuleEmptyStateProps) {
  const hints = [
    'Set up vendor master data before creating POs',
    'Configure approval workflows for spending controls',
    'Link to inventory for automatic reordering',
  ];

  const quickActions = [];

  if (onImportClick) {
    quickActions.push({
      label: 'Import Vendors',
      icon: Upload,
      onClick: onImportClick,
    });
  }

  if (onUseTemplateClick) {
    quickActions.push({
      label: 'PO Template',
      icon: FileSpreadsheet,
      onClick: onUseTemplateClick,
    });
  }

  if (onWatchTutorialClick) {
    quickActions.push({
      label: 'Procurement Guide',
      icon: HelpCircle,
      onClick: onWatchTutorialClick,
    });
  }

  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      action={onCreateClick ? {
        label: createLabel,
        onClick: onCreateClick,
        variant: 'primary',
      } : undefined}
      hints={hints}
      quickActions={quickActions.length > 0 ? quickActions : undefined}
      {...props}
    />
  );
}

EmptyStatePurchasing.displayName = 'EmptyStatePurchasing';
