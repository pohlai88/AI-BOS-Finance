'use client';

/**
 * BioExplainer - "Explain this number" popover
 * @see FINANCE_ERP_GAP_ANALYSIS.md - Requirement #9
 */

import * as React from 'react';
import { motion as Motion, AnimatePresence } from 'motion/react';
import { Info, Calculator, DollarSign, Calendar, Hash, ChevronRight } from 'lucide-react';
import { cn } from '../atoms/utils';
import { useLocale } from '../providers/BioLocaleProvider';

// ============================================================
// Types
// ============================================================

export interface FxRateInfo {
  source: string;
  rate: number;
  date: string | Date;
  fromCurrency?: string;
  toCurrency?: string;
}

export interface NumberExplanation {
  formula?: string;
  accounts?: string[];
  currency?: string;
  fxRate?: FxRateInfo;
  rounding?: string;
  period?: string;
  source?: string;
  lastUpdated?: Date;
  notes?: string;
  drilldownLink?: string;
}

export interface BioExplainerProps {
  value: number;
  format?: 'currency' | 'number' | 'percent';
  currency?: string;
  explanation: NumberExplanation;
  onAccountClick?: (account: string) => void;
  onDrilldown?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

const SIZE_CLASSES = { sm: 'text-sm', md: 'text-base', lg: 'text-lg font-semibold' } as const;

const POPOVER_ANIMATION = {
  initial: { opacity: 0, scale: 0.95, y: 5 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 5 },
  transition: { duration: 0.15 },
};

export const BioExplainer = React.memo(function BioExplainer({
  value,
  format = 'number',
  currency = 'USD',
  explanation,
  onAccountClick,
  onDrilldown,
  size = 'md',
  className,
  showIcon = true,
}: BioExplainerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const locale = useLocale();

  const formattedValue = React.useMemo(() => {
    switch (format) {
      case 'currency': return locale.formatCurrency(value, explanation.currency || currency);
      case 'percent': return locale.formatPercent(value / 100);
      default: return locale.formatNumber(value);
    }
  }, [value, format, currency, explanation.currency, locale]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node) && triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fxDateFormatted = React.useMemo(() => {
    if (!explanation.fxRate?.date) return null;
    const date = typeof explanation.fxRate.date === 'string' ? new Date(explanation.fxRate.date) : explanation.fxRate.date;
    return locale.formatDate(date);
  }, [explanation.fxRate?.date, locale]);

  return (
    <div className={cn('relative inline-flex items-center gap-1', className)}>
      <span className={cn('font-mono tabular-nums', SIZE_CLASSES[size], value < 0 && 'text-red-600')}>{formattedValue}</span>
      {showIcon && (
        <button ref={triggerRef} type="button" onClick={() => setIsOpen(!isOpen)} className="p-0.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20" aria-label="Explain this number">
          <Info size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} />
        </button>
      )}
      <AnimatePresence>
        {isOpen && (
          <Motion.div ref={popoverRef} {...POPOVER_ANIMATION} className="absolute z-50 top-full left-0 mt-2 w-80 rounded-lg border bg-popover shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30 flex items-center gap-2">
              <Calculator size={16} className="text-primary" /><span className="font-semibold">Number Explanation</span>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Value</span><span className="font-mono font-semibold">{formattedValue}</span></div>
              {explanation.formula && (<div><div className="text-muted-foreground mb-1">Formula</div><code className="block px-2 py-1 bg-muted rounded text-xs font-mono">{explanation.formula}</code></div>)}
              {explanation.accounts && explanation.accounts.length > 0 && (
                <div><div className="text-muted-foreground mb-1">Accounts Included</div><div className="space-y-1">
                  {explanation.accounts.map((account, idx) => (
                    <button key={idx} onClick={() => onAccountClick?.(account)} className={cn('flex items-center gap-1 text-xs hover:text-primary transition-colors', onAccountClick && 'cursor-pointer')}>
                      <Hash size={10} className="text-muted-foreground" /><span>{account}</span>{onAccountClick && <ChevronRight size={10} />}
                    </button>
                  ))}
                </div></div>
              )}
              {(explanation.currency || explanation.fxRate) && (
                <div className="flex items-center gap-4">
                  {explanation.currency && <div className="flex items-center gap-1"><DollarSign size={12} className="text-muted-foreground" /><span>{explanation.currency}</span></div>}
                  {explanation.fxRate && <div className="flex items-center gap-1 text-xs text-muted-foreground"><span>Rate: {explanation.fxRate.rate.toFixed(4)}</span><span>({explanation.fxRate.source}, {fxDateFormatted})</span></div>}
                </div>
              )}
              {explanation.period && <div className="flex items-center gap-1"><Calendar size={12} className="text-muted-foreground" /><span>{explanation.period}</span></div>}
              {explanation.rounding && <div className="text-xs text-muted-foreground">Rounding: {explanation.rounding}</div>}
              {explanation.notes && <div className="text-xs text-muted-foreground italic">{explanation.notes}</div>}
              {onDrilldown && (
                <button onClick={() => { onDrilldown(); setIsOpen(false); }} className="flex items-center gap-1 w-full justify-center mt-2 py-2 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium">
                  <span>View Details</span><ChevronRight size={14} />
                </button>
              )}
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

BioExplainer.displayName = 'BioExplainer';
export default BioExplainer;
