/**
 * Canon Components Index
 * 
 * Governed UI components for the Canon system.
 * All components follow PAGE_META/COMPONENT_META patterns.
 * 
 * @see REF_037 - Phase 3: Canon Page System
 */

// Status Components
export { StatusBadge, type StatusBadgeProps } from './StatusBadge'
export { StatusCard, type StatusCardProps } from './StatusCard'

// Metric Components  
export { StatCard, type StatCardProps } from './StatCard'
export { HealthScoreRing, type HealthScoreRingProps } from './HealthScoreRing'

// Layout Components (migrated from nexus/)
export { CardSection, type CardSectionProps, COMPONENT_META as CardSectionMeta } from './CardSection'
