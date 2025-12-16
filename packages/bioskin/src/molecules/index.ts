/**
 * @aibos/bioskin - Molecules (Layer 2)
 * 
 * Composed components per CONT_10 BioSkin Architecture v2.1
 * Built from atoms, providing higher-level UI patterns.
 */

// Status & Feedback
export { StatusBadge, PulsingDot, type StatusBadgeProps, COMPONENT_META as STATUS_BADGE_META } from './StatusBadge';
export { Spinner, type SpinnerProps, type SpinnerVariant, type SpinnerSize, type SpinnerColor, COMPONENT_META as SPINNER_META } from './Spinner';
export { EmptyState, type EmptyStateProps, COMPONENT_META as EMPTY_STATE_META } from './EmptyState';
export { LoadingState, type LoadingStateProps, COMPONENT_META as LOADING_STATE_META } from './LoadingState';
export { ErrorState, type ErrorStateProps, COMPONENT_META as ERROR_STATE_META } from './ErrorState';

// Animation
export {
  MotionEffect,
  StaggerContainer,
  StaggerItem,
  type MotionEffectProps,
  type MotionPreset,
  type StaggerContainerProps,
  type StaggerItemProps,
  COMPONENT_META as MOTION_EFFECT_META,
} from './MotionEffect';

// Cards & Layout
export { StatCard, type StatCardProps, COMPONENT_META as STAT_CARD_META } from './StatCard';

// Overlays & Navigation
export { DetailSheet, type DetailSheetProps, COMPONENT_META as DETAIL_SHEET_META } from './DetailSheet';
export { ActionMenu, type ActionMenuProps, type ActionMenuItem, COMPONENT_META as ACTION_MENU_META } from './ActionMenu';
