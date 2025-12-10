// ============================================================================
// SYSTEM TYPES - SYS_01 Mission Control
// ============================================================================

export interface SystemAnnouncement {
  id: string;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  category: 'UPGRADE' | 'SECURITY' | 'FEATURE' | 'MAINTENANCE' | 'DEPRECATION';
  title: string;
  message: string;
  actionLabel?: string;
  actionRoute?: string;
  publishedAt: string; // ISO date
  dismissible: boolean;
  dismissed?: boolean;
}

export interface ConfigurationGap {
  id: string;
  severity: 'ERROR' | 'WARNING' | 'SUGGESTION';
  area: 'SYS_02' | 'SYS_03' | 'SYS_04' | 'SCHEMA' | 'INTEGRATION';
  title: string;
  description: string;
  actionLabel: string;
  actionRoute: string;
  impact?: string; // What functionality is limited without this
}

export interface SystemHealthMetric {
  id: string;
  label: string;
  value: string | number;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  trend?: 'UP' | 'DOWN' | 'STABLE';
  lastChecked: string;
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  route: string;
  sysCode: string;
}

export interface SystemState {
  setupComplete: boolean;
  completionPercentage: number;
  lastConfigUpdate: string;
  version: string;
  announcements: SystemAnnouncement[];
  configGaps: ConfigurationGap[];
  healthMetrics: SystemHealthMetric[];
}
