// ============================================================================
// COM_PAY_02: TREASURY HEADER - The "100 Logins" Solution
// ============================================================================
// Group CFO needs to see subsidiary liquidity at a glance
// without logging into 15 different bank portals.
// ============================================================================

import React from 'react';
import { 
  Building2, 
  Wallet, 
  TrendingDown, 
  TrendingUp,
  Calendar,
  ArrowRightLeft,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  TREASURY_DATA, 
  ENTITY_OPTIONS,
  type TreasuryContext,
  type EntityOption,
} from '../data';

// ============================================================================
// TYPES
// ============================================================================

interface TreasuryHeaderProps {
  selectedEntityId: string;
  onEntityChange: (entityId: string) => void;
  onRefresh?: () => void;
  className?: string;
}

// ============================================================================
// ENTITY SELECTOR COMPONENT
// ============================================================================

interface EntitySelectorProps {
  options: EntityOption[];
  selectedId: string;
  onChange: (id: string) => void;
}

function EntitySelector({ options, selectedId, onChange }: EntitySelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const selected = options.find(o => o.id === selectedId);
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-[#111] border border-[#1F1F1F] rounded hover:border-[#333] transition-colors min-w-[220px]"
      >
        <Building2 className="w-4 h-4 text-[#666]" />
        <span className="flex-1 text-left text-sm text-white truncate">
          {selected?.name || 'Select Entity'}
        </span>
        {selected && (
          <span className={cn(
            'w-2 h-2 rounded-full',
            selected.cash_status === 'healthy' && 'bg-emerald-500',
            selected.cash_status === 'low' && 'bg-amber-500',
            selected.cash_status === 'critical' && 'bg-red-500',
          )} />
        )}
        <ChevronDown className={cn(
          'w-4 h-4 text-[#666] transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full left-0 mt-1 w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded shadow-lg z-50 overflow-hidden">
            {options.map(option => (
              <button
                key={option.id}
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#1F1F1F] transition-colors',
                  option.id === selectedId && 'bg-[#1F1F1F]'
                )}
              >
                <span className={cn(
                  'w-2 h-2 rounded-full shrink-0',
                  option.cash_status === 'healthy' && 'bg-emerald-500',
                  option.cash_status === 'low' && 'bg-amber-500',
                  option.cash_status === 'critical' && 'bg-red-500',
                )} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{option.name}</div>
                  <div className="text-[10px] text-[#666] font-mono">{option.code}</div>
                </div>
                {option.id === selectedId && (
                  <CheckCircle2 className="w-4 h-4 text-[#28E7A2]" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// METRIC CARD COMPONENT
// ============================================================================

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  status?: 'positive' | 'negative' | 'warning' | 'neutral';
  trend?: 'up' | 'down';
}

function MetricCard({ icon: Icon, label, value, subValue, status = 'neutral', trend }: MetricCardProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-r border-[#1F1F1F] last:border-r-0">
      <div className={cn(
        'p-2 rounded',
        status === 'positive' && 'bg-emerald-900/20 text-emerald-400',
        status === 'negative' && 'bg-red-900/20 text-red-400',
        status === 'warning' && 'bg-amber-900/20 text-amber-400',
        status === 'neutral' && 'bg-[#1F1F1F] text-[#666]',
      )}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className={cn(
            'text-lg font-mono font-bold',
            status === 'positive' && 'text-[#28E7A2]',
            status === 'negative' && 'text-red-400',
            status === 'warning' && 'text-amber-400',
            status === 'neutral' && 'text-white',
          )}>
            {value}
          </span>
          {trend && (
            trend === 'up' 
              ? <TrendingUp className="w-3.5 h-3.5 text-[#28E7A2]" />
              : <TrendingDown className="w-3.5 h-3.5 text-red-400" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#666] font-mono uppercase tracking-wider">{label}</span>
          {subValue && (
            <span className={cn(
              'text-[10px] font-mono',
              status === 'warning' && 'text-amber-400',
              status === 'negative' && 'text-red-400',
              (status === 'positive' || status === 'neutral') && 'text-[#888]',
            )}>
              {subValue}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TreasuryHeader({ 
  selectedEntityId, 
  onEntityChange,
  onRefresh,
  className,
}: TreasuryHeaderProps) {
  const treasury = TREASURY_DATA[selectedEntityId] as TreasuryContext | undefined;
  
  if (!treasury) {
    return (
      <div className={cn('p-4 bg-[#0A0A0A] border border-[#1F1F1F] rounded', className)}>
        <p className="text-[#666] text-sm">Select an entity to view treasury data</p>
      </div>
    );
  }

  // Formatters
  const formatCurrency = (amount: number, compact = false) => {
    if (compact && Math.abs(amount) >= 1000) {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(amount);
    }
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(0)}%`;
  };

  // Derived status
  const cashStatus = treasury.cash_status === 'healthy' ? 'positive' 
                   : treasury.cash_status === 'critical' ? 'negative' 
                   : 'warning';
  
  const budgetStatus = treasury.budget_used_pct > 1 ? 'negative'
                     : treasury.budget_used_pct > 0.9 ? 'warning'
                     : 'neutral';
  
  const icStatus = treasury.ic_status === 'lender' ? 'positive'
                 : treasury.ic_status === 'borrower' ? 'warning'
                 : 'neutral';

  const runwayStatus = treasury.runway_months < 1 ? 'negative'
                     : treasury.runway_months < 3 ? 'warning'
                     : 'positive';

  return (
    <div className={cn(
      'bg-[#0A0A0A] border border-[#1F1F1F] rounded overflow-hidden',
      className
    )}>
      {/* Top Row: Entity Selector + Bank Info */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F1F1F] bg-[#050505]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#666] font-mono uppercase tracking-wider">Entity</span>
            <EntitySelector 
              options={ENTITY_OPTIONS}
              selectedId={selectedEntityId}
              onChange={onEntityChange}
            />
          </div>
          
          <div className="flex items-center gap-2 text-[#666]">
            <span className="text-[10px] font-mono">Bank:</span>
            <span className="text-sm text-[#888]">{treasury.bank_name}</span>
            <span className="text-[11px] font-mono text-[#555]">{treasury.bank_account_masked}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-[#555] font-mono">
            Last sync: {new Date(treasury.last_sync).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {onRefresh && (
            <button 
              onClick={onRefresh}
              className="p-1.5 hover:bg-[#1F1F1F] rounded text-[#666] hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Metrics */}
      <div className="flex items-center">
        {/* Cash Position */}
        <MetricCard 
          icon={Wallet}
          label="Cash"
          value={formatCurrency(treasury.cash_balance, true)}
          subValue={treasury.cash_status === 'critical' ? '⚠️ LOW' : undefined}
          status={cashStatus}
        />
        
        {/* Budget Burn */}
        <MetricCard 
          icon={treasury.budget_used_pct > 1 ? TrendingUp : TrendingDown}
          label="Burn"
          value={formatPercent(treasury.budget_used_pct)}
          subValue="of Budget"
          status={budgetStatus}
          trend={treasury.budget_used_pct > 1 ? 'up' : undefined}
        />
        
        {/* IC Position */}
        <MetricCard 
          icon={ArrowRightLeft}
          label="IC Position"
          value={formatCurrency(treasury.ic_net_position, true)}
          subValue={
            treasury.ic_status === 'lender' ? 'Net Lender' 
            : treasury.ic_status === 'borrower' ? 'Net Borrower'
            : 'Balanced'
          }
          status={icStatus}
        />
        
        {/* Runway */}
        <MetricCard 
          icon={Calendar}
          label="Runway"
          value={treasury.runway_months < 1 ? '< 1' : treasury.runway_months.toFixed(1)}
          subValue={treasury.runway_months === 1 ? 'Month' : 'Months'}
          status={runwayStatus}
        />

        {/* Pending Actions */}
        {treasury.pending_payments_count > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 ml-auto">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-sm font-mono text-amber-400">
                {treasury.pending_payments_count}
              </span>
              <span className="text-[10px] text-[#666] ml-1.5">
                pending ({formatCurrency(treasury.pending_payments_amount, true)})
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TreasuryHeader;

