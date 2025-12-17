'use client';

/**
 * BioPrintTemplate - Accounting print layouts
 * @see FINANCE_ERP_GAP_ANALYSIS.md - Requirement #10
 */

import * as React from 'react';
import { cn } from '../atoms/utils';
import { useLocale } from '../providers/BioLocaleProvider';

// ============================================================
// Types
// ============================================================

export type PrintTemplateType = 'invoice' | 'payment_voucher' | 'journal_entry' | 'trial_balance' | 'general_ledger' | 'aging_report' | 'bank_reconciliation' | 'statement_of_account';

export interface CompanyInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  logo?: string;
}

export interface PrintConfig {
  header?: { company?: CompanyInfo; logo?: boolean; title?: string; subtitle?: string };
  footer?: { signatures?: string[]; notes?: string; pageNumbers?: boolean };
  pageBreaks?: 'auto' | 'manual' | 'none';
  orientation?: 'portrait' | 'landscape';
  paperSize?: 'A4' | 'Letter' | 'Legal';
  dateFormat?: string;
}

export interface BioPrintTemplateProps {
  type: PrintTemplateType;
  data: Record<string, unknown>;
  config?: PrintConfig;
  className?: string;
  printable?: boolean;
  children?: React.ReactNode;
}

const PRINT_STYLES = `
@media print {
  @page { size: A4; margin: 15mm; }
  .print-template { font-family: 'Arial', sans-serif; font-size: 10pt; color: black; background: white; }
  .print-header { border-bottom: 2px solid #333; padding-bottom: 10mm; margin-bottom: 5mm; }
  .print-footer { position: fixed; bottom: 0; left: 0; right: 0; border-top: 1px solid #333; padding-top: 5mm; }
  .print-table { width: 100%; border-collapse: collapse; }
  .print-table th, .print-table td { border: 1px solid #ddd; padding: 4px 8px; text-align: left; }
  .print-table th { background: #f5f5f5; font-weight: bold; }
  .print-table .amount { text-align: right; font-family: 'Courier New', monospace; }
  .page-break { page-break-before: always; }
  .no-print { display: none !important; }
}
`;

export const BioPrintTemplate = React.memo(function BioPrintTemplate({
  type,
  data,
  config = {},
  className,
  printable = true,
  children,
}: BioPrintTemplateProps) {
  const locale = useLocale();

  const formatCurrency = React.useCallback((value: number, currency: string = 'USD') => locale.formatCurrency(value, currency), [locale]);
  const formatDate = React.useCallback((date: Date | string) => locale.formatDate(typeof date === 'string' ? new Date(date) : date), [locale]);

  React.useEffect(() => {
    if (printable) {
      const styleId = 'bio-print-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = PRINT_STYLES;
        document.head.appendChild(style);
      }
    }
  }, [printable]);

  return (
    <div className={cn('print-template bg-white text-black p-8', printable && 'min-h-[297mm]', className)}>
      {config.header && (
        <div className="print-header flex items-start justify-between mb-6 pb-4 border-b-2 border-gray-800">
          <div>
            {config.header.logo && config.header.company?.logo && <img src={config.header.company.logo} alt={config.header.company.name} className="h-12 mb-2" />}
            {config.header.company && (
              <div>
                <div className="text-xl font-bold">{config.header.company.name}</div>
                {config.header.company.address && <div className="text-sm text-gray-600">{config.header.company.address}</div>}
                {config.header.company.phone && <div className="text-sm text-gray-600">Tel: {config.header.company.phone}</div>}
                {config.header.company.taxId && <div className="text-sm text-gray-600">Tax ID: {config.header.company.taxId}</div>}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold uppercase">{config.header.title || type.replace(/_/g, ' ')}</div>
            {config.header.subtitle && <div className="text-sm text-gray-600">{config.header.subtitle}</div>}
            {(data.documentNo ?? data.invoiceNo ?? data.voucherNo ?? data.jeNo) != null && (
              <div className="text-lg font-mono mt-2">#{String(data.documentNo ?? data.invoiceNo ?? data.voucherNo ?? data.jeNo)}</div>
            )}
          </div>
        </div>
      )}

      <div className="print-content">{children || renderDefaultContent(type, data, formatCurrency, formatDate)}</div>

      {config.footer && (
        <div className="print-footer mt-8 pt-4 border-t border-gray-300">
          {config.footer.signatures && config.footer.signatures.length > 0 && (
            <div className="flex justify-between mt-8">
              {config.footer.signatures.map((sig, idx) => (
                <div key={idx} className="text-center"><div className="w-40 border-b border-gray-400 mb-2" /><div className="text-sm text-gray-600">{sig}</div></div>
              ))}
            </div>
          )}
          {config.footer.notes && <div className="mt-4 text-sm text-gray-600 italic">{config.footer.notes}</div>}
          {config.footer.pageNumbers && <div className="text-center text-xs text-gray-500 mt-4">Page <span className="page-number" /> of <span className="page-count" /></div>}
        </div>
      )}
    </div>
  );
});

function renderDefaultContent(type: PrintTemplateType, data: Record<string, unknown>, formatCurrency: (v: number, c?: string) => string, formatDate: (d: Date | string) => string): React.ReactNode {
  switch (type) {
    case 'invoice': return renderInvoice(data, formatCurrency, formatDate);
    case 'journal_entry': return renderJournalEntry(data, formatCurrency, formatDate);
    case 'trial_balance': return renderTrialBalance(data, formatCurrency);
    default: return <div className="text-center text-gray-500 py-8">Custom content renderer needed for {type}</div>;
  }
}

function renderInvoice(data: Record<string, unknown>, formatCurrency: (v: number, c?: string) => string, formatDate: (d: Date | string) => string): React.ReactNode {
  const inv = data as { invoiceNo?: string; invoiceDate?: Date; dueDate?: Date; customerName?: string; customerAddress?: string; lines?: Array<{ description: string; quantity: number; unitPrice: number; amount: number }>; subtotal?: number; taxTotal?: number; total?: number; currency?: string };
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div><div className="font-bold mb-1">Bill To:</div><div>{inv.customerName}</div>{inv.customerAddress && <div className="text-sm text-gray-600">{inv.customerAddress}</div>}</div>
        <div className="text-right"><div><span className="text-gray-600">Invoice Date:</span> {inv.invoiceDate ? formatDate(inv.invoiceDate) : '-'}</div><div><span className="text-gray-600">Due Date:</span> {inv.dueDate ? formatDate(inv.dueDate) : '-'}</div></div>
      </div>
      <table className="print-table w-full">
        <thead><tr><th>Description</th><th className="text-right">Qty</th><th className="text-right">Unit Price</th><th className="text-right">Amount</th></tr></thead>
        <tbody>{inv.lines?.map((line, idx) => <tr key={idx}><td>{line.description}</td><td className="text-right">{line.quantity}</td><td className="text-right amount">{formatCurrency(line.unitPrice, inv.currency)}</td><td className="text-right amount">{formatCurrency(line.amount, inv.currency)}</td></tr>)}</tbody>
        <tfoot>
          <tr><td colSpan={3} className="text-right font-bold">Subtotal</td><td className="text-right amount">{formatCurrency(inv.subtotal || 0, inv.currency)}</td></tr>
          <tr><td colSpan={3} className="text-right">Tax</td><td className="text-right amount">{formatCurrency(inv.taxTotal || 0, inv.currency)}</td></tr>
          <tr className="font-bold text-lg"><td colSpan={3} className="text-right">Total</td><td className="text-right amount">{formatCurrency(inv.total || 0, inv.currency)}</td></tr>
        </tfoot>
      </table>
    </div>
  );
}

function renderJournalEntry(data: Record<string, unknown>, formatCurrency: (v: number, c?: string) => string, formatDate: (d: Date | string) => string): React.ReactNode {
  const je = data as { documentNo?: string; postingDate?: Date; description?: string; lines?: Array<{ account: string; accountName?: string; debit: number; credit: number; description?: string }>; currency?: string };
  const totalDebits = je.lines?.reduce((s, l) => s + l.debit, 0) || 0;
  const totalCredits = je.lines?.reduce((s, l) => s + l.credit, 0) || 0;
  return (
    <div className="space-y-6">
      <div className="flex justify-between"><div><span className="text-gray-600">Description:</span> {je.description || '-'}</div><div><span className="text-gray-600">Posting Date:</span> {je.postingDate ? formatDate(je.postingDate) : '-'}</div></div>
      <table className="print-table w-full">
        <thead><tr><th>Account</th><th>Description</th><th className="text-right">Debit</th><th className="text-right">Credit</th></tr></thead>
        <tbody>{je.lines?.map((line, idx) => <tr key={idx}><td><span className="font-mono">{line.account}</span>{line.accountName && <span className="text-gray-600 ml-2">{line.accountName}</span>}</td><td>{line.description || '-'}</td><td className="text-right amount">{line.debit > 0 ? formatCurrency(line.debit, je.currency) : ''}</td><td className="text-right amount">{line.credit > 0 ? formatCurrency(line.credit, je.currency) : ''}</td></tr>)}</tbody>
        <tfoot><tr className="font-bold"><td colSpan={2} className="text-right">Total</td><td className="text-right amount">{formatCurrency(totalDebits, je.currency)}</td><td className="text-right amount">{formatCurrency(totalCredits, je.currency)}</td></tr></tfoot>
      </table>
    </div>
  );
}

function renderTrialBalance(data: Record<string, unknown>, formatCurrency: (v: number, c?: string) => string): React.ReactNode {
  const tb = data as { period?: string; accounts?: Array<{ account: string; accountName: string; debit: number; credit: number }>; currency?: string };
  const totalDebits = tb.accounts?.reduce((s, a) => s + a.debit, 0) || 0;
  const totalCredits = tb.accounts?.reduce((s, a) => s + a.credit, 0) || 0;
  return (
    <div className="space-y-6">
      <div className="text-center font-bold text-lg">Trial Balance - {tb.period || 'Current Period'}</div>
      <table className="print-table w-full">
        <thead><tr><th>Account</th><th>Account Name</th><th className="text-right">Debit</th><th className="text-right">Credit</th></tr></thead>
        <tbody>{tb.accounts?.map((acc, idx) => <tr key={idx}><td className="font-mono">{acc.account}</td><td>{acc.accountName}</td><td className="text-right amount">{acc.debit > 0 ? formatCurrency(acc.debit, tb.currency) : ''}</td><td className="text-right amount">{acc.credit > 0 ? formatCurrency(acc.credit, tb.currency) : ''}</td></tr>)}</tbody>
        <tfoot><tr className="font-bold border-t-2"><td colSpan={2} className="text-right">Total</td><td className="text-right amount">{formatCurrency(totalDebits, tb.currency)}</td><td className="text-right amount">{formatCurrency(totalCredits, tb.currency)}</td></tr></tfoot>
      </table>
    </div>
  );
}

BioPrintTemplate.displayName = 'BioPrintTemplate';
export default BioPrintTemplate;
