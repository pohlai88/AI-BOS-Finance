import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MetaAppShell } from '../components/shell/MetaAppShell'
import { NexusCard } from '../components/nexus/NexusCard'
import { NexusButton } from '../components/nexus/NexusButton'
import { NexusBadge } from '../components/nexus/NexusBadge'
import { Progress } from '../components/ui/progress'
import { useSysConfig } from '@/modules/system'
import {
  Building2,
  Users,
  UserCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  LayoutGrid,
  Zap,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import {
  MOCK_ANNOUNCEMENTS,
  MOCK_CONFIG_GAPS,
  MOCK_HEALTH_METRICS,
} from '../mock-data'/systemMock'
import type {
  SystemAnnouncement,
  ConfigurationGap,
  SystemHealthMetric,
} from '@/modules/system/types/system'
import { MissionControl } from '../components/sys/MissionControl'

// ============================================================================
// SYS_01 :: SETUP COMPANION
// Adaptive Mission Control - Initial Setup â†’ Ongoing System Management
// ============================================================================

interface SetupCardProps {
  title: string
  description: string
  icon: React.ReactNode
  status: 'COMPLETE' | 'PENDING' | 'OPTIONAL' | 'LOCKED'
  onClick: () => void
  colSpan?: string
  sysCode?: string
}

function SetupCard({
  title,
  description,
  icon,
  status,
  onClick,
  colSpan = 'col-span-1',
  sysCode,
}: SetupCardProps) {
  const isComplete = status === 'COMPLETE'
  const isLocked = status === 'LOCKED'

  return (
    <motion.div
      whileHover={
        !isLocked ? { scale: 1.01, transition: { duration: 0.2 } } : {}
      }
      whileTap={!isLocked ? { scale: 0.99 } : {}}
      className={`${colSpan} h-full`}
    >
      <NexusCard
        onClick={!isLocked ? onClick : undefined}
        className={`relative h-full cursor-pointer overflow-hidden p-6 transition-all duration-300 ${isComplete
          ? 'border-emerald-900/40 hover:border-emerald-500/60'
          : 'hover:border-zinc-700'
          } ${isLocked ? 'cursor-not-allowed opacity-40 grayscale' : ''} `}
      >
        {/* Subtle completion glow */}
        {isComplete && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-950/10 via-transparent to-transparent" />
        )}

        {/* Header Section - Fixed Height */}
        <div className="mb-4 flex shrink-0 items-start justify-between">
          {/* Icon */}
          <div
            className={`border p-3 transition-colors ${isComplete ? 'border-emerald-900/40 bg-emerald-950/20 text-emerald-500' : 'border-[#1F1F1F] bg-[#050505] text-zinc-500'} `}
          >
            {icon}
          </div>

          {/* Status Badge */}
          {isComplete ? (
            <NexusBadge variant="success">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              COMPLETE
            </NexusBadge>
          ) : status === 'OPTIONAL' ? (
            <NexusBadge variant="neutral">OPTIONAL</NexusBadge>
          ) : status === 'LOCKED' ? (
            <NexusBadge variant="neutral">LOCKED</NexusBadge>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse bg-amber-500" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-amber-500">
                PENDING
              </span>
            </div>
          )}
        </div>

        {/* Content Section - Flexible Height with Constraints */}
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <h3
            className={`text-lg tracking-tight ${isComplete ? 'text-emerald-50' : 'text-zinc-100'}`}
          >
            {title}
          </h3>
          <p className="line-clamp-3 text-sm leading-relaxed text-zinc-500">
            {description}
          </p>

          {/* System Code */}
          {sysCode && (
            <div className="mt-auto font-mono text-[10px] uppercase tracking-wider text-zinc-700">
              {sysCode}
            </div>
          )}
        </div>

        {/* Footer Section - Fixed Height, Natural Flow */}
        {!isComplete && !isLocked && (
          <div className="mt-4 flex shrink-0 items-center border-t border-[#1F1F1F] pt-4 font-mono text-[10px] uppercase tracking-widest text-amber-500">
            ACTION REQUIRED <ArrowRight className="ml-2 h-3 w-3" />
          </div>
        )}
      </NexusCard>
    </motion.div>
  )
}

export function SysBootloaderPage() {
  const navigate = useNavigate()
  const { steps } = useSysConfig()
  const [progress, setProgress] = useState(0)
  const [viewMode, setViewMode] = useState<'SETUP' | 'MISSION_CONTROL'>(
    'MISSION_CONTROL'
  ) // TEMP: Force Mission Control for calibration

  // Detect setup completion status
  const isSetupComplete = steps.profile && steps.organization

  // Auto-switch to Mission Control if setup is complete
  // TEMP DISABLED FOR CALIBRATION
  // useEffect(() => {
  //   if (isSetupComplete) {
  //     setViewMode('MISSION_CONTROL');
  //   } else {
  //     setViewMode('SETUP');
  //   }
  // }, [isSetupComplete]);

  // Calculate progress on mount & when steps change
  useEffect(() => {
    let completed = 0
    const total = 2 // Profile + Organization are mandatory
    if (steps.profile) completed++
    if (steps.organization) completed++
    setProgress((completed / total) * 100)
  }, [steps])

  return (
    <MetaAppShell>
      <div className="relative flex min-h-[calc(100vh-64px)] flex-col items-center justify-start overflow-hidden p-4 pt-8 md:p-6">
        {/* Ambient Background Grid */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_10%,#0A0A0A_0%,#000000_60%)]" />
        <div className="absolute left-0 top-0 h-[1px] w-full bg-gradient-to-r from-transparent via-[#1F1F1F] to-transparent" />

        <div className="z-10 w-full max-w-[1100px] space-y-6">
          {/* STICKY HEADER */}
          <div className="sticky top-4 z-30 border-b border-[#1F1F1F] bg-[#0A0A0A] pb-4">
            {/* Changed from top-16 to top-4 to reduce gap */}
            <div className="flex flex-col gap-4">
              {/* Top Row: Title + Launch Button */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2"
                  >
                    <div className="h-[1px] w-8 bg-emerald-500" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-500">
                      {viewMode === 'MISSION_CONTROL'
                        ? 'MISSION CONTROL'
                        : 'SYSTEM INITIALIZATION'}
                    </span>
                  </motion.div>

                  <h1 className="text-3xl tracking-tight text-white md:text-4xl">
                    {viewMode === 'MISSION_CONTROL'
                      ? 'System Status'
                      : 'Welcome to NexusCanon.'}
                  </h1>
                  <p className="font-mono text-sm text-zinc-500">
                    {viewMode === 'MISSION_CONTROL'
                      ? 'Monitor system health, announcements, and configuration status.'
                      : 'Complete the setup steps below to activate your workspace.'}
                  </p>
                </div>

                {/* LAUNCH CONTROL - Industrial Style - Top Right */}
                <div className="flex flex-shrink-0 items-start gap-3">
                  <button
                    onClick={() => navigate('/dashboard')}
                    disabled={!isSetupComplete}
                    className={`relative h-10 flex-shrink-0 whitespace-nowrap border px-4 font-mono text-[10px] uppercase tracking-[0.15em] transition-all duration-200 ${isSetupComplete
                      ? 'border-emerald-500/40 bg-[#0A0A0A] text-emerald-500 hover:border-emerald-500 hover:bg-emerald-950/20'
                      : 'cursor-not-allowed border-[#1F1F1F] bg-[#050505] text-zinc-700'
                      } `}
                  >
                    {/* Top highlight */}
                    {isSetupComplete && (
                      <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
                    )}

                    <div className="flex items-center justify-center gap-2">
                      <Zap
                        className={`h-3 w-3 ${isSetupComplete ? '' : 'opacity-30'}`}
                      />
                      <span>LAUNCH</span>
                      <ArrowRight
                        className={`h-3 w-3 ${isSetupComplete ? '' : 'opacity-30'}`}
                      />
                    </div>
                  </button>

                  {/* System Code */}
                  <div className="flex h-10 flex-shrink-0 items-center border border-[#1F1F1F] bg-[#050505] px-3 py-2 font-mono text-[10px] text-[rgba(95,95,106,0.96)]">
                    SYS_01
                  </div>
                </div>
              </div>

              {/* Bottom Row: Controls */}
              <div className="flex flex-col items-start gap-3 md:flex-row md:items-center">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-2 border border-[#1F1F1F] bg-[#050505] p-1">
                  <button
                    onClick={() => setViewMode('SETUP')}
                    className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${viewMode === 'SETUP'
                      ? 'bg-[#1F1F1F] text-white'
                      : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                  >
                    Setup
                  </button>
                  <button
                    onClick={() => setViewMode('MISSION_CONTROL')}
                    disabled={!isSetupComplete}
                    className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${viewMode === 'MISSION_CONTROL'
                      ? 'bg-[#1F1F1F] text-white'
                      : isSetupComplete
                        ? 'text-zinc-600 hover:text-zinc-400'
                        : 'cursor-not-allowed text-zinc-800'
                      }`}
                  >
                    Dashboard
                  </button>
                </div>

                {/* Progress Indicator - Only show in Setup mode */}
                {viewMode === 'SETUP' && (
                  <div className="w-full space-y-2 md:w-[280px]">
                    <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                      <span>COMPLETION</span>
                      <span
                        className={
                          isSetupComplete
                            ? 'text-emerald-500'
                            : 'text-amber-500'
                        }
                      >
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <Progress
                      value={progress}
                      className="h-[2px] bg-[#1F1F1F]"
                      indicatorClassName={
                        isSetupComplete ? 'bg-emerald-500' : 'bg-amber-500'
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CONDITIONAL CONTENT */}
          <AnimatePresence mode="wait">
            {viewMode === 'SETUP' ? (
              <motion.div
                key="setup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* BENTO GRID */}
                <div className="grid auto-rows-[260px] grid-cols-1 gap-4 md:grid-cols-3">
                  {/* Card 1: Profile (SYS_04) */}
                  <SetupCard
                    title="Employee Profile"
                    description="Configure your personal information, security settings, and preferences."
                    icon={<UserCircle className="h-6 w-6" />}
                    status={steps.profile ? 'COMPLETE' : 'PENDING'}
                    onClick={() => navigate('/sys-profile')}
                    sysCode="SYS_04"
                  />

                  {/* Card 2: Organization (SYS_02) - Spans 2 cols */}
                  <SetupCard
                    colSpan="md:col-span-2"
                    title="Company Configuration"
                    description="Set up global entity variables including fiscal year, currency, timezone, and organizational structure."
                    icon={<Building2 className="h-6 w-6" />}
                    status={steps.organization ? 'COMPLETE' : 'PENDING'}
                    onClick={() => navigate('/sys-organization')}
                    sysCode="SYS_02"
                  />

                  {/* Card 3: Access Control (SYS_03) - Spans 2 cols */}
                  <SetupCard
                    colSpan="md:col-span-2"
                    title="Access Management"
                    description="Invite team members, assign roles, and configure security permissions for your workspace."
                    icon={<Users className="h-6 w-6" />}
                    status={steps.team ? 'COMPLETE' : 'OPTIONAL'}
                    onClick={() => navigate('/sys-access')}
                    sysCode="SYS_03"
                  />

                  {/* Card 4: Applications (Future) */}
                  <SetupCard
                    title="Applications"
                    description="Install and configure third-party integrations."
                    icon={<LayoutGrid className="h-6 w-6" />}
                    status="LOCKED"
                    onClick={() => { }}
                    sysCode="SYS_05"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="mission-control"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <MissionControl
                  announcements={MOCK_ANNOUNCEMENTS}
                  configGaps={MOCK_CONFIG_GAPS}
                  healthMetrics={MOCK_HEALTH_METRICS}
                  systemVersion="v2.4.0"
                  lastConfigUpdate="2025-12-09T08:00:00Z"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MetaAppShell>
  )
}
