// ============================================================================
// MISSION CONTROL - Post-Setup SYS_01 Dashboard
// Ongoing system health, announcements, and configuration management
// ============================================================================

import { useState } from 'react';
import { useRouterAdapter } from '@/hooks/useRouterAdapter';
import { NexusCard } from '../nexus/NexusCard';
import { NexusButton } from '../nexus/NexusButton';
import { NexusBadge } from '../nexus/NexusBadge';
import {
  Bell,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  ExternalLink,
  ArrowRight,
  Settings,
  Users,
  Building2,
  UserCircle,
  Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { SystemAnnouncement, ConfigurationGap, SystemHealthMetric } from '../../types/system';

interface MissionControlProps {
  announcements: SystemAnnouncement[];
  configGaps: ConfigurationGap[];
  healthMetrics: SystemHealthMetric[];
  systemVersion: string;
  lastConfigUpdate: string;
}

export function MissionControl({
  announcements,
  configGaps,
  healthMetrics,
  systemVersion,
  lastConfigUpdate,
}: MissionControlProps) {
  const { navigate } = useRouterAdapter();
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([]);

  const visibleAnnouncements = announcements.filter((a) => !dismissedAnnouncements.includes(a.id));

  const dismissAnnouncement = (id: string) => {
    setDismissedAnnouncements((prev) => [...prev, id]);
  };

  const getPriorityColor = (priority: SystemAnnouncement['priority']) => {
    switch (priority) {
      case 'CRITICAL':
        return 'text-red-500 border-red-900/40';
      case 'HIGH':
        return 'text-amber-500 border-amber-900/40';
      case 'NORMAL':
        return 'text-blue-500 border-blue-900/40';
      case 'LOW':
        return 'text-zinc-500 border-zinc-800/40';
    }
  };

  const getSeverityIcon = (severity: ConfigurationGap['severity']) => {
    switch (severity) {
      case 'ERROR':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'SUGGESTION':
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getHealthIcon = (status: SystemHealthMetric['status']) => {
    switch (status) {
      case 'HEALTHY':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'CRITICAL':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getTrendIcon = (trend?: SystemHealthMetric['trend']) => {
    switch (trend) {
      case 'UP':
        return <TrendingUp className="w-3 h-3 text-emerald-500" />;
      case 'DOWN':
        return <TrendingDown className="w-3 h-3 text-red-500" />;
      case 'STABLE':
        return <Minus className="w-3 h-3 text-zinc-500" />;
      default:
        return null;
    }
  };

  const quickActions = [
    {
      label: 'Company Configuration',
      sysCode: 'SYS_02',
      icon: <Building2 className="w-4 h-4" />,
      route: '/sys-organization',
    },
    {
      label: 'Access Management',
      sysCode: 'SYS_03',
      icon: <Users className="w-4 h-4" />,
      route: '/sys-access',
    },
    {
      label: 'Employee Profile',
      sysCode: 'SYS_04',
      icon: <UserCircle className="w-4 h-4" />,
      route: '/sys-profile',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[200px]">
      {/* PANEL 1: System Status - Large Hero (col-span-4, row-span-2) */}
      <NexusCard className="md:col-span-4 md:row-span-2 p-6 relative overflow-hidden">
        {/* Subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                <h3 className="text-xl tracking-tight text-white">System Operational</h3>
              </div>
              <p className="text-sm text-zinc-500 font-mono">All services running nominally</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em] mb-1">
                Version
              </div>
              <div className="text-lg font-mono text-emerald-500 tracking-tight">
                {systemVersion}
              </div>
            </div>
          </div>

          {/* Health Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-auto">
            {healthMetrics.map((metric) => (
              <div
                key={metric.id}
                className="p-3 bg-[#050505] border border-[#1F1F1F] relative group hover:border-zinc-700 transition-colors"
              >
                {/* Top highlight */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#333] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-center justify-between mb-2">
                  {getHealthIcon(metric.status)}
                  {getTrendIcon(metric.trend)}
                </div>

                <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-1">
                  {metric.label}
                </div>
                <div className="text-xl tracking-tight text-white font-mono">{metric.value}</div>
              </div>
            ))}
          </div>

          {/* Footer timestamp */}
          <div className="mt-4 pt-4 border-t border-[#1F1F1F] text-[10px] font-mono text-zinc-700 uppercase tracking-[0.2em]">
            Last Config Update: {new Date(lastConfigUpdate).toLocaleDateString()}{' '}
            {new Date(lastConfigUpdate).toLocaleTimeString()}
          </div>
        </div>
      </NexusCard>

      {/* PANEL 2: Quick Actions - Vertical Stack (col-span-2, row-span-2) */}
      <div className="md:col-span-2 md:row-span-2 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 px-1">
          <div className="h-[1px] w-4 bg-zinc-700" />
          <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">
            Quick Actions
          </h3>
        </div>

        {/* Action Cards - Stacked */}
        {quickActions.map((action) => (
          <NexusCard
            key={action.sysCode}
            className="p-4 hover:border-emerald-900/40 transition-all cursor-pointer group h-[calc((100%-3rem)/3)]"
            onClick={() => navigate(action.route)}
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-[#050505] border border-[#1F1F1F] text-zinc-500 group-hover:text-emerald-500 group-hover:border-emerald-900/40 transition-all">
                  {action.icon}
                </div>
                <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-[0.2em]">
                  {action.sysCode}
                </div>
              </div>
              <div className="text-sm tracking-tight text-white group-hover:text-emerald-50 transition-colors">
                {action.label}
              </div>
            </div>
          </NexusCard>
        ))}
      </div>

      {/* PANEL 3: Announcements - Wide (col-span-4, row-span-1) */}
      <NexusCard className="md:col-span-4 md:row-span-1 p-5 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-zinc-500" />
            <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400">
              System Announcements
            </h3>
          </div>
          {visibleAnnouncements.length > 0 && (
            <NexusBadge variant="neutral" className="text-[9px]">
              {visibleAnnouncements.length}
            </NexusBadge>
          )}
        </div>

        {/* Announcements - Horizontal Scroll */}
        {visibleAnnouncements.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-[#050505] scrollbar-thumb-[#1F1F1F]">
            {visibleAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className={`flex-shrink-0 w-[320px] p-3 bg-[#050505] border-l-2 ${getPriorityColor(announcement.priority)} relative group`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <NexusBadge variant="neutral" className="text-[9px] uppercase">
                    {announcement.category}
                  </NexusBadge>
                  {announcement.dismissible && (
                    <button
                      onClick={() => dismissAnnouncement(announcement.id)}
                      className="p-1 hover:bg-[#1F1F1F] transition-colors"
                    >
                      <X className="w-3 h-3 text-zinc-600 hover:text-white" />
                    </button>
                  )}
                </div>

                <h4 className="text-sm tracking-tight text-white mb-2 line-clamp-1">
                  {announcement.title}
                </h4>

                <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
                  {announcement.message}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-zinc-600 font-mono">No active announcements</p>
          </div>
        )}
      </NexusCard>

      {/* PANEL 4: Configuration Audit - Tall (col-span-2, row-span-2) */}
      <NexusCard className="md:col-span-2 md:row-span-2 p-5 relative overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-zinc-500" />
            <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400">
              Config Audit
            </h3>
          </div>
          {configGaps.length > 0 && (
            <NexusBadge variant="warning" className="text-[9px]">
              {configGaps.length}
            </NexusBadge>
          )}
        </div>

        {/* Config Gaps - Scrollable */}
        {configGaps.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-3" />
            <p className="text-sm text-zinc-500 text-center">No issues detected</p>
          </div>
        ) : (
          <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin scrollbar-track-[#050505] scrollbar-thumb-[#1F1F1F]">
            {configGaps.map((gap) => (
              <div
                key={gap.id}
                className="p-3 bg-[#050505] border border-[#1F1F1F] hover:border-zinc-700 transition-colors cursor-pointer"
                onClick={() => navigate(gap.actionRoute)}
              >
                <div className="flex items-start gap-2 mb-2">
                  {getSeverityIcon(gap.severity)}
                  <h4 className="text-xs tracking-tight text-white flex-1 leading-tight">
                    {gap.title}
                  </h4>
                </div>

                <p className="text-[10px] text-zinc-600 leading-relaxed line-clamp-2 mb-2">
                  {gap.description}
                </p>

                <div className="flex items-center text-[9px] font-mono text-amber-500 uppercase tracking-wider">
                  {gap.actionLabel} <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </NexusCard>
    </div>
  );
}
