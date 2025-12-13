// ============================================================================
// MISSION CONTROL - Post-Setup SYS_01 Dashboard
// Ongoing system health, announcements, and configuration management
// ============================================================================

import { useState } from 'react'
import { useRouterAdapter } from '@/hooks/useRouterAdapter'
import { NexusCard } from '../nexus/NexusCard'
import { NexusButton } from '../nexus/NexusButton'
import { NexusBadge } from '../nexus/NexusBadge'
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
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import type {
  SystemAnnouncement,
  ConfigurationGap,
  SystemHealthMetric,
} from '@/modules/system/types/system'

interface MissionControlProps {
  announcements: SystemAnnouncement[]
  configGaps: ConfigurationGap[]
  healthMetrics: SystemHealthMetric[]
  systemVersion: string
  lastConfigUpdate: string
}

export function MissionControl({
  announcements,
  configGaps,
  healthMetrics,
  systemVersion,
  lastConfigUpdate,
}: MissionControlProps) {
  const { navigate } = useRouterAdapter()
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<
    string[]
  >([])

  const visibleAnnouncements = announcements.filter(
    (a) => !dismissedAnnouncements.includes(a.id)
  )

  const dismissAnnouncement = (id: string) => {
    setDismissedAnnouncements((prev) => [...prev, id])
  }

  const getPriorityColor = (priority: SystemAnnouncement['priority']) => {
    switch (priority) {
      case 'CRITICAL':
        return 'text-red-500 border-red-900/40'
      case 'HIGH':
        return 'text-amber-500 border-amber-900/40'
      case 'NORMAL':
        return 'text-blue-500 border-blue-900/40'
      case 'LOW':
        return 'text-zinc-500 border-zinc-800/40'
    }
  }

  const getSeverityIcon = (severity: ConfigurationGap['severity']) => {
    switch (severity) {
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case 'SUGGESTION':
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getHealthIcon = (status: SystemHealthMetric['status']) => {
    switch (status) {
      case 'HEALTHY':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case 'CRITICAL':
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getTrendIcon = (trend?: SystemHealthMetric['trend']) => {
    switch (trend) {
      case 'UP':
        return <TrendingUp className="h-3 w-3 text-emerald-500" />
      case 'DOWN':
        return <TrendingDown className="h-3 w-3 text-red-500" />
      case 'STABLE':
        return <Minus className="h-3 w-3 text-zinc-500" />
      default:
        return null
    }
  }

  const quickActions = [
    {
      label: 'Company Configuration',
      sysCode: 'SYS_02',
      icon: <Building2 className="h-4 w-4" />,
      route: '/sys-organization',
    },
    {
      label: 'Access Management',
      sysCode: 'SYS_03',
      icon: <Users className="h-4 w-4" />,
      route: '/sys-access',
    },
    {
      label: 'Employee Profile',
      sysCode: 'SYS_04',
      icon: <UserCircle className="h-4 w-4" />,
      route: '/sys-profile',
    },
  ]

  return (
    <div className="grid auto-rows-[200px] grid-cols-1 gap-4 md:grid-cols-6">
      {/* PANEL 1: System Status - Large Hero (col-span-4, row-span-2) */}
      <NexusCard className="relative overflow-hidden p-6 md:col-span-4 md:row-span-2">
        {/* Subtle gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-950/5 via-transparent to-transparent" />

        <div className="relative flex h-full flex-col">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                <h3 className="text-xl tracking-tight text-white">
                  System Operational
                </h3>
              </div>
              <p className="font-mono text-sm text-zinc-500">
                All services running nominally
              </p>
            </div>
            <div className="text-right">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                Version
              </div>
              <div className="font-mono text-lg tracking-tight text-emerald-500">
                {systemVersion}
              </div>
            </div>
          </div>

          {/* Health Metrics Grid */}
          <div className="mt-auto grid grid-cols-2 gap-3 md:grid-cols-4">
            {healthMetrics.map((metric) => (
              <div
                key={metric.id}
                className="group relative border border-[#1F1F1F] bg-[#050505] p-3 transition-colors hover:border-zinc-700"
              >
                {/* Top highlight */}
                <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#333] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="mb-2 flex items-center justify-between">
                  {getHealthIcon(metric.status)}
                  {getTrendIcon(metric.trend)}
                </div>

                <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-zinc-600">
                  {metric.label}
                </div>
                <div className="font-mono text-xl tracking-tight text-white">
                  {metric.value}
                </div>
              </div>
            ))}
          </div>

          {/* Footer timestamp */}
          <div className="mt-4 border-t border-[#1F1F1F] pt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-700">
            Last Config Update:{' '}
            {new Date(lastConfigUpdate).toLocaleDateString()}{' '}
            {new Date(lastConfigUpdate).toLocaleTimeString()}
          </div>
        </div>
      </NexusCard>

      {/* PANEL 2: Quick Actions - Vertical Stack (col-span-2, row-span-2) */}
      <div className="space-y-4 md:col-span-2 md:row-span-2">
        {/* Header */}
        <div className="flex items-center gap-2 px-1">
          <div className="h-[1px] w-4 bg-zinc-700" />
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            Quick Actions
          </h3>
        </div>

        {/* Action Cards - Stacked */}
        {quickActions.map((action) => (
          <NexusCard
            key={action.sysCode}
            className="group h-[calc((100%-3rem)/3)] cursor-pointer p-4 transition-all hover:border-emerald-900/40"
            onClick={() => navigate(action.route)}
          >
            <div className="flex h-full flex-col">
              <div className="mb-3 flex items-center justify-between">
                <div className="border border-[#1F1F1F] bg-[#050505] p-2 text-zinc-500 transition-all group-hover:border-emerald-900/40 group-hover:text-emerald-500">
                  {action.icon}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-700">
                  {action.sysCode}
                </div>
              </div>
              <div className="text-sm tracking-tight text-white transition-colors group-hover:text-emerald-50">
                {action.label}
              </div>
            </div>
          </NexusCard>
        ))}
      </div>

      {/* PANEL 3: Announcements - Wide (col-span-4, row-span-1) */}
      <NexusCard className="relative overflow-hidden p-5 md:col-span-4 md:row-span-1">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-zinc-500" />
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
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
          <div className="scrollbar-thin scrollbar-track-[#050505] scrollbar-thumb-[#1F1F1F] flex gap-3 overflow-x-auto pb-2">
            {visibleAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className={`w-[320px] flex-shrink-0 border-l-2 bg-[#050505] p-3 ${getPriorityColor(announcement.priority)} group relative`}
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <NexusBadge
                    variant="neutral"
                    className="text-[9px] uppercase"
                  >
                    {announcement.category}
                  </NexusBadge>
                  {announcement.dismissible && (
                    <button
                      onClick={() => dismissAnnouncement(announcement.id)}
                      className="p-1 transition-colors hover:bg-[#1F1F1F]"
                    >
                      <X className="h-3 w-3 text-zinc-600 hover:text-white" />
                    </button>
                  )}
                </div>

                <h4 className="mb-2 line-clamp-1 text-sm tracking-tight text-white">
                  {announcement.title}
                </h4>

                <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500">
                  {announcement.message}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="font-mono text-sm text-zinc-600">
              No active announcements
            </p>
          </div>
        )}
      </NexusCard>

      {/* PANEL 4: Configuration Audit - Tall (col-span-2, row-span-2) */}
      <NexusCard className="relative flex flex-col overflow-hidden p-5 md:col-span-2 md:row-span-2">
        {/* Header */}
        <div className="mb-4 flex flex-shrink-0 items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-zinc-500" />
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
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
          <div className="flex flex-1 flex-col items-center justify-center">
            <CheckCircle2 className="mb-3 h-8 w-8 text-emerald-500" />
            <p className="text-center text-sm text-zinc-500">
              No issues detected
            </p>
          </div>
        ) : (
          <div className="scrollbar-thin scrollbar-track-[#050505] scrollbar-thumb-[#1F1F1F] flex-1 space-y-2 overflow-y-auto">
            {configGaps.map((gap) => (
              <div
                key={gap.id}
                className="cursor-pointer border border-[#1F1F1F] bg-[#050505] p-3 transition-colors hover:border-zinc-700"
                onClick={() => navigate(gap.actionRoute)}
              >
                <div className="mb-2 flex items-start gap-2">
                  {getSeverityIcon(gap.severity)}
                  <h4 className="flex-1 text-xs leading-tight tracking-tight text-white">
                    {gap.title}
                  </h4>
                </div>

                <p className="mb-2 line-clamp-2 text-[10px] leading-relaxed text-zinc-600">
                  {gap.description}
                </p>

                <div className="flex items-center font-mono text-[9px] uppercase tracking-wider text-amber-500">
                  {gap.actionLabel} <ArrowRight className="ml-1 h-3 w-3" />
                </div>
              </div>
            ))}
          </div>
        )}
      </NexusCard>
    </div>
  )
}
