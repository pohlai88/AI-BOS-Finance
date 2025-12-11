/**
 * HealthScoreRing - Canon Component
 * 
 * Displays a circular progress indicator for health scores.
 * Custom SVG-based ring with animated fill.
 * 
 * @component COMP_HealthScoreRing
 * @version 1.0.0
 * @see REF_037 - Phase 3: Canon Page System
 */

import { cn } from '@/components/ui/utils'

export interface HealthScoreRingProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const SIZES = {
  sm: { ring: 'w-16 h-16', text: 'text-lg', label: 'text-[10px]' },
  md: { ring: 'w-24 h-24', text: 'text-2xl', label: 'text-xs' },
  lg: { ring: 'w-32 h-32', text: 'text-3xl', label: 'text-sm' },
}

export function HealthScoreRing({ 
  score, 
  size = 'md', 
  className,
  label = 'Health Score'
}: HealthScoreRingProps) {
  const sizeConfig = SIZES[size]
  const circumference = 251 // 2 * π * 40
  const strokeDasharray = `${score * 2.51} ${circumference}`

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className={cn('relative', sizeConfig.ring)}>
        <svg 
          className={cn(sizeConfig.ring, '-rotate-90')} 
          viewBox="0 0 100 100"
        >
          {/* Background ring */}
          <circle
            cx="50" 
            cy="50" 
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-nexus-surface/50"
          />
          {/* Progress ring */}
          <circle
            cx="50" 
            cy="50" 
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            className="text-nexus-green transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold text-nexus-signal', sizeConfig.text)}>
            {score}%
          </span>
        </div>
      </div>
      <span className={cn('text-nexus-signal/50 mt-2', sizeConfig.label)}>
        {label}
      </span>
    </div>
  )
}

export const COMPONENT_META = {
  code: 'COMP_HealthScoreRing',
  version: '1.0.0',
  family: 'CHART',
  purpose: 'METRICS',
  status: 'active',
} as const
