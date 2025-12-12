// ============================================================================
// COM_PAY_02: TREASURY HEADER - The "100 Logins" Solution
// ============================================================================
// Group CFO needs to see subsidiary liquidity at a glance
// without logging into 15 different bank portals.
// 🛡️ GOVERNANCE: Uses Surface, Txt, StatusDot components (no hardcoded colors)
// ============================================================================

import React from 'react'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Surface, Txt, StatusDot, Btn } from '@aibos/ui'
import {
  TREASURY_DATA,
  ENTITY_OPTIONS,
  type TreasuryContext,
  type EntityOption,
} from '../data'

// ============================================================================
// TYPES
// ============================================================================

interface TreasuryHeaderProps {
  selectedEntityId: string
  onEntityChange: (entityId: string) => void
  onRefresh?: () => void
  className?: string
}

// ============================================================================
// ENTITY SELECTOR COMPONENT
// ============================================================================

interface EntitySelectorProps {
  options: EntityOption[]
  selectedId: string
  onChange: (id: string) => void
}

function EntitySelector({
  options,
  selectedId,
  onChange,
}: EntitySelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const selected = options.find((o) => o.id === selectedId)

  return (
    <div className="relative">
      {/* 🛡️ GOVERNANCE: Uses Surface + StatusDot + Txt components */}
      <Surface
        variant="flat"
        className="hover:border-border-surface-base flex min-w-[220px] cursor-pointer items-center gap-2 border px-3 py-2 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Building2 className="h-4 w-4 text-text-tertiary" />
        <Txt variant="body" className="flex-1 truncate text-left">
          {selected?.name || 'Select Entity'}
        </Txt>
        {selected && (
          <StatusDot
            variant={
              selected.cash_status === 'healthy'
                ? 'success'
                : selected.cash_status === 'low'
                  ? 'warning'
                  : 'error'
            }
            size="sm"
          />
        )}
        <ChevronDown
          className={cn(
            'h-4 w-4 text-text-tertiary transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </Surface>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          {/* 🛡️ GOVERNANCE: Uses Surface component for dropdown */}
          <Surface
            variant="base"
            className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden shadow-lg"
          >
            {options.map((option) => (
              <Surface
                key={option.id}
                variant={option.id === selectedId ? 'flat' : 'ghost'}
                className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-flat"
                onClick={() => {
                  onChange(option.id)
                  setIsOpen(false)
                }}
              >
                {/* 🛡️ GOVERNANCE: Uses StatusDot component */}
                <StatusDot
                  variant={
                    option.cash_status === 'healthy'
                      ? 'success'
                      : option.cash_status === 'low'
                        ? 'warning'
                        : 'error'
                  }
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <Txt variant="body" className="truncate">
                    {option.name}
                  </Txt>
                  <Txt variant="small" className="font-mono text-text-tertiary">
                    {option.code}
                  </Txt>
                </div>
                {option.id === selectedId && (
                  <CheckCircle2 className="h-4 w-4 text-action-primary" />
                )}
              </Surface>
            ))}
          </Surface>
        </>
      )}
    </div>
  )
}

// ============================================================================
// METRIC CARD COMPONENT
// ============================================================================

interface MetricCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  subValue?: string
  status?: 'positive' | 'negative' | 'warning' | 'neutral'
  trend?: 'up' | 'down'
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subValue,
  status = 'neutral',
  trend,
}: MetricCardProps) {
  // 🛡️ GOVERNANCE: Maps status to StatusDot variants
  const statusVariant =
    status === 'positive'
      ? 'success'
      : status === 'negative'
        ? 'error'
        : status === 'warning'
          ? 'warning'
          : 'neutral'

  return (
    <div className="border-border-surface-base flex items-center gap-3 border-r px-4 py-3 last:border-r-0">
      {/* 🛡️ GOVERNANCE: Uses Surface + StatusDot for icon background */}
      <Surface
        variant="flat"
        className={cn(
          'rounded p-2',
          status === 'positive' && 'bg-status-success/20',
          status === 'negative' && 'bg-status-error/20',
          status === 'warning' && 'bg-status-warning/20'
        )}
      >
        <Icon
          className={cn(
            'h-4 w-4',
            status === 'positive' && 'text-status-success',
            status === 'negative' && 'text-status-error',
            status === 'warning' && 'text-status-warning',
            status === 'neutral' && 'text-text-tertiary'
          )}
        />
      </Surface>
      <div>
        <div className="flex items-center gap-1.5">
          {/* 🛡️ GOVERNANCE: Uses Txt component */}
          <Txt
            variant="h3"
            className={cn(
              'font-mono',
              status === 'positive' && 'text-action-primary',
              status === 'negative' && 'text-status-error',
              status === 'warning' && 'text-status-warning',
              status === 'neutral' && 'text-text-primary'
            )}
          >
            {value}
          </Txt>
          {trend &&
            (trend === 'up' ? (
              <TrendingUp className="h-3.5 w-3.5 text-action-primary" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-status-error" />
            ))}
        </div>
        <div className="flex items-center gap-2">
          {/* 🛡️ GOVERNANCE: Uses Txt component */}
          <Txt
            variant="small"
            className="font-mono uppercase tracking-wider text-text-tertiary"
          >
            {label}
          </Txt>
          {subValue && (
            <Txt
              variant="small"
              className={cn(
                'font-mono',
                status === 'warning' && 'text-status-warning',
                status === 'negative' && 'text-status-error',
                (status === 'positive' || status === 'neutral') &&
                  'text-text-secondary'
              )}
            >
              {subValue}
            </Txt>
          )}
        </div>
      </div>
    </div>
  )
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
  const treasury = TREASURY_DATA[selectedEntityId] as
    | TreasuryContext
    | undefined

  if (!treasury) {
    return (
      <Surface variant="base" className={cn('p-4', className)}>
        <Txt variant="body" className="text-text-tertiary">
          Select an entity to view treasury data
        </Txt>
      </Surface>
    )
  }

  // Formatters
  const formatCurrency = (amount: number, compact = false) => {
    if (compact && Math.abs(amount) >= 1000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(amount)
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(0)}%`
  }

  // Derived status
  const cashStatus =
    treasury.cash_status === 'healthy'
      ? 'positive'
      : treasury.cash_status === 'critical'
        ? 'negative'
        : 'warning'

  const budgetStatus =
    treasury.budget_used_pct > 1
      ? 'negative'
      : treasury.budget_used_pct > 0.9
        ? 'warning'
        : 'neutral'

  const icStatus =
    treasury.ic_status === 'lender'
      ? 'positive'
      : treasury.ic_status === 'borrower'
        ? 'warning'
        : 'neutral'

  const runwayStatus =
    treasury.runway_months < 1
      ? 'negative'
      : treasury.runway_months < 3
        ? 'warning'
        : 'positive'

  return (
    <Surface variant="base" className={cn('overflow-hidden', className)}>
      {/* Top Row: Entity Selector + Bank Info */}
      {/* 🛡️ GOVERNANCE: Uses Surface component */}
      <Surface
        variant="flat"
        className="flex items-center justify-between border-b px-4 py-3"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Txt
              variant="small"
              className="font-mono uppercase tracking-wider text-text-tertiary"
            >
              Entity
            </Txt>
            <EntitySelector
              options={ENTITY_OPTIONS}
              selectedId={selectedEntityId}
              onChange={onEntityChange}
            />
          </div>

          {/* 🛡️ GOVERNANCE: Uses Txt component */}
          <div className="flex items-center gap-2">
            <Txt variant="small" className="font-mono text-text-tertiary">
              Bank:
            </Txt>
            <Txt variant="body" className="text-text-secondary">
              {treasury.bank_name}
            </Txt>
            <Txt variant="small" className="font-mono text-text-tertiary">
              {treasury.bank_account_masked}
            </Txt>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Txt variant="small" className="font-mono text-text-tertiary">
            Last sync:{' '}
            {new Date(treasury.last_sync).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Txt>
          {/* 🛡️ GOVERNANCE: Uses Btn component */}
          {onRefresh && (
            <Btn variant="secondary" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Btn>
          )}
        </div>
      </Surface>

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
            treasury.ic_status === 'lender'
              ? 'Net Lender'
              : treasury.ic_status === 'borrower'
                ? 'Net Borrower'
                : 'Balanced'
          }
          status={icStatus}
        />

        {/* Runway */}
        <MetricCard
          icon={Calendar}
          label="Runway"
          value={
            treasury.runway_months < 1
              ? '< 1'
              : treasury.runway_months.toFixed(1)
          }
          subValue={treasury.runway_months === 1 ? 'Month' : 'Months'}
          status={runwayStatus}
        />

        {/* Pending Actions */}
        {/* 🛡️ GOVERNANCE: Uses StatusDot + Txt components */}
        {treasury.pending_payments_count > 0 && (
          <div className="ml-auto flex items-center gap-2 px-4 py-3">
            <StatusDot variant="warning" size="sm" />
            <div>
              <Txt variant="body" className="font-mono text-status-warning">
                {treasury.pending_payments_count}
              </Txt>
              <Txt variant="small" className="ml-1.5 text-text-tertiary">
                pending (
                {formatCurrency(treasury.pending_payments_amount, true)})
              </Txt>
            </div>
          </div>
        )}
      </div>
    </Surface>
  )
}

export default TreasuryHeader
