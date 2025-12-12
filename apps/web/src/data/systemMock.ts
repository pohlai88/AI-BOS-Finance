// ============================================================================
// MOCK SYSTEM DATA - For SYS_01 Mission Control
// ============================================================================

import { SystemAnnouncement, ConfigurationGap, SystemHealthMetric } from '../types/system';

export const MOCK_ANNOUNCEMENTS: SystemAnnouncement[] = [
  {
    id: 'ann-001',
    priority: 'HIGH',
    category: 'FEATURE',
    title: 'NexusCanon v2.4 Available',
    message:
      'New PRISM filter engine with 3x faster queries. Advanced reconciliation matching algorithm now supports fuzzy logic.',
    actionLabel: 'View Changelog',
    actionRoute: '/meta-architecture',
    publishedAt: '2025-12-08T14:30:00Z',
    dismissible: true,
    dismissed: false,
  },
  {
    id: 'ann-002',
    priority: 'NORMAL',
    category: 'UPGRADE',
    title: 'Schema Migration Available',
    message:
      'Custom field types for financial instruments now support multi-currency configuration. Backwards compatible.',
    actionLabel: 'Review Migration',
    actionRoute: '/sys-organization',
    publishedAt: '2025-12-07T09:15:00Z',
    dismissible: true,
    dismissed: false,
  },
  {
    id: 'ann-003',
    priority: 'CRITICAL',
    category: 'SECURITY',
    title: 'Security Patch Required',
    message:
      'MFA configuration recommended for all admin users. New session timeout policy enforced for compliance.',
    actionLabel: 'Configure MFA',
    actionRoute: '/sys-access',
    publishedAt: '2025-12-06T16:45:00Z',
    dismissible: false,
    dismissed: false,
  },
];

export const MOCK_CONFIG_GAPS: ConfigurationGap[] = [
  {
    id: 'gap-001',
    severity: 'WARNING',
    area: 'SYS_03',
    title: 'No Backup Admin Configured',
    description:
      'Only one administrator account detected. Add backup admin to prevent lockout scenarios.',
    actionLabel: 'Add Admin User',
    actionRoute: '/sys-access',
    impact: 'Account recovery risk if primary admin is unavailable',
  },
  {
    id: 'gap-002',
    severity: 'SUGGESTION',
    area: 'SYS_02',
    title: 'Custom Field Schema Incomplete',
    description:
      'You have 12 metadata records but only 8 custom fields defined. Consider adding fields for better data capture.',
    actionLabel: 'Configure Schema',
    actionRoute: '/sys-organization',
    impact: 'Limited data richness for reporting and analysis',
  },
  {
    id: 'gap-003',
    severity: 'ERROR',
    area: 'INTEGRATION',
    title: 'API Key Expiring Soon',
    description:
      'External data source API key expires in 7 days. Renewal required to maintain data sync.',
    actionLabel: 'Renew Key',
    actionRoute: '/sys-organization',
    impact: 'Data synchronization will fail after expiration',
  },
];

export const MOCK_HEALTH_METRICS: SystemHealthMetric[] = [
  {
    id: 'health-001',
    label: 'Schema Coverage',
    value: '87%',
    status: 'HEALTHY',
    trend: 'UP',
    lastChecked: '2025-12-09T08:00:00Z',
  },
  {
    id: 'health-002',
    label: 'Active Users',
    value: 12,
    status: 'HEALTHY',
    trend: 'STABLE',
    lastChecked: '2025-12-09T08:00:00Z',
  },
  {
    id: 'health-003',
    label: 'Data Quality Score',
    value: '92%',
    status: 'HEALTHY',
    trend: 'UP',
    lastChecked: '2025-12-09T08:00:00Z',
  },
  {
    id: 'health-004',
    label: 'Pending Reconciliations',
    value: 3,
    status: 'WARNING',
    trend: 'STABLE',
    lastChecked: '2025-12-09T08:00:00Z',
  },
  {
    id: 'health-005',
    label: 'API Response Time',
    value: '124ms',
    status: 'HEALTHY',
    trend: 'DOWN',
    lastChecked: '2025-12-09T08:00:00Z',
  },
  {
    id: 'health-006',
    label: 'Compliance Status',
    value: 'PASS',
    status: 'HEALTHY',
    trend: 'STABLE',
    lastChecked: '2025-12-09T08:00:00Z',
  },
];
