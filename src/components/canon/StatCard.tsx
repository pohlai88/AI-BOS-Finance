/**
 * StatCard - Canon Component
 * 
 * Displays statistics with icon, value, and label.
 * Built on shadcn/ui Card with Canon styling.
 * 
 * @component COMP_StatCard
 * @version 1.0.0
 * @see REF_037 - Phase 3: Canon Page System
 */

import { Card } from '@/components/ui/card'
import { cn } from '@/components/ui/utils'
import { type LucideIcon } from 'lucide-react'

export interface StatCardProps {
  icon: LucideIcon
  value: number | string
  label: string
  valueClassName?: string
  className?: string
}

export function StatCard({ 
  icon: Icon, 
  value, 
  label, 
  valueClassName,
  className 
}: StatCardProps) {
  return (
    <Card 
      className={cn(
        'border-nexus-border/30 bg-nexus-surface/10 p-4 text-center',
        className
      )}
    >
      <Icon className="w-5 h-5 text-nexus-signal/40 mx-auto mb-2" />
      <div className={cn('text-xl font-bold text-nexus-signal', valueClassName)}>
        {value}
      </div>
      <div className="text-xs text-nexus-signal/50">{label}</div>
    </Card>
  )
}

export const COMPONENT_META = {
  code: 'COMP_StatCard',
  version: '1.0.0',
  family: 'CARD',
  purpose: 'METRICS',
  status: 'active',
} as const
