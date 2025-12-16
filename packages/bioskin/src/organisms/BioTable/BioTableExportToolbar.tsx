/**
 * BioTableExportToolbar - Export toolbar for BioTable
 *
 * Sprint E4: Enterprise Export/Print
 * Provides UI for exporting table data in various formats.
 */

'use client';

import * as React from 'react';
import { Download, FileSpreadsheet, FileText, Printer, Copy, Check } from 'lucide-react';
import { cn } from '../../atoms/utils';
import { Btn } from '../../atoms/Btn';
import { Txt } from '../../atoms/Txt';
import type { UseBioTableExportReturn, ExportOptions, PrintOptions } from './useBioTableExport';

// ============================================================
// Types
// ============================================================

export interface BioTableExportToolbarProps<TData> {
  /** Export functions from useBioTableExport */
  exportFns: UseBioTableExportReturn<TData>;
  /** Default filename for exports */
  filename?: string;
  /** Available export formats */
  formats?: ('csv' | 'xlsx' | 'json' | 'print' | 'copy')[];
  /** Custom export options */
  exportOptions?: ExportOptions;
  /** Custom print options */
  printOptions?: PrintOptions;
  /** Show as dropdown or inline buttons */
  variant?: 'dropdown' | 'inline';
  /** Additional className */
  className?: string;
}

// ============================================================
// Component
// ============================================================

export function BioTableExportToolbar<TData>({
  exportFns,
  filename = 'export',
  formats = ['csv', 'xlsx', 'print', 'copy'],
  exportOptions = {},
  printOptions = {},
  variant = 'inline',
  className,
}: BioTableExportToolbarProps<TData>) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Handle copy with feedback
  const handleCopy = async () => {
    await exportFns.copyToClipboard(exportOptions);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format config
  const formatConfig = {
    csv: {
      label: 'CSV',
      icon: FileText,
      action: () => exportFns.exportCSV(filename, exportOptions),
    },
    xlsx: {
      label: 'Excel',
      icon: FileSpreadsheet,
      action: () => exportFns.exportXLSX(filename, exportOptions),
    },
    json: {
      label: 'JSON',
      icon: FileText,
      action: () => exportFns.exportJSON(filename, exportOptions),
    },
    print: {
      label: 'Print',
      icon: Printer,
      action: () => exportFns.print(printOptions),
    },
    copy: {
      label: copied ? 'Copied!' : 'Copy',
      icon: copied ? Check : Copy,
      action: handleCopy,
    },
  };

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-1', className)} data-testid="export-toolbar">
        {formats.map(format => {
          const config = formatConfig[format];
          const Icon = config.icon;
          return (
            <Btn
              key={format}
              variant="ghost"
              size="sm"
              onClick={config.action}
              className="h-8 px-2"
              aria-label={`Export as ${config.label}`}
            >
              <Icon className="h-4 w-4 mr-1" />
              <span className="text-small">{config.label}</span>
            </Btn>
          );
        })}
      </div>
    );
  }

  // Dropdown variant
  return (
    <div ref={dropdownRef} className={cn('relative', className)} data-testid="export-toolbar">
      <Btn
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <Download className="h-4 w-4 mr-1" />
        <span>Export</span>
      </Btn>

      {isOpen && (
        <div
          className={cn(
            'absolute right-0 top-full mt-1 z-50',
            'bg-surface-card border border-default rounded-lg shadow-lg',
            'py-1 min-w-[140px]'
          )}
          role="menu"
        >
          {formats.map(format => {
            const config = formatConfig[format];
            const Icon = config.icon;
            return (
              <button
                key={format}
                onClick={() => {
                  config.action();
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full px-3 py-2 text-left text-small',
                  'flex items-center gap-2',
                  'hover:bg-surface-hover transition-colors'
                )}
                role="menuitem"
              >
                <Icon className="h-4 w-4 text-text-secondary" />
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

BioTableExportToolbar.displayName = 'BioTableExportToolbar';
