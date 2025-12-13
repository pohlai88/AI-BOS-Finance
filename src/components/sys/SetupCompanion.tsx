import { useState, useEffect, useMemo } from 'react'
import { useRouterAdapter } from '@/hooks/useRouterAdapter'
import { useSysConfig } from '@/modules/system'
import {
  Check,
  ChevronUp,
  ChevronDown,
  Building2,
  Users,
  User,
  Zap,
  ArrowRight,
  Clock,
  ListTodo,
} from 'lucide-react'

// 1. DATA MODEL WITH TIME & EFFORT METADATA
const SETUP_TASKS = [
  {
    id: 'profile',
    label: 'Personal Profile',
    sub: 'Avatar & Security',
    icon: <User className="h-4 w-4" />,
    status: 'pending',
    route: '/sys-profile',
    span: 'col-span-1',
    estTime: 3, // Minutes
    steps: 4, // Number of inputs
  },
  {
    id: 'org',
    label: 'Organization',
    sub: 'Legal, Currency, Tax',
    icon: <Building2 className="h-4 w-4" />,
    status: 'pending',
    route: '/sys-organization',
    span: 'col-span-1',
    estTime: 5,
    steps: 8,
  },
  {
    id: 'team',
    label: 'Team Manifest',
    sub: 'Invite Admins',
    icon: <Users className="h-4 w-4" />,
    status: 'optional',
    route: '/sys-access',
    span: 'col-span-2',
    estTime: 2,
    steps: 2,
  },
]

export function SetupCompanion() {
  const [isOpen, setIsOpen] = useState(false)
  const { steps, applyDefaults } = useSysConfig()
  const { navigate } = useRouterAdapter()

  // 1. MAP CONTEXT STATE TO TASKS
  const tasks = useMemo(
    () => [
      {
        id: 'profile',
        label: 'Personal Profile',
        sub: 'Avatar & Security',
        icon: <User className="h-4 w-4" />,
        status: steps.profile ? 'completed' : 'pending',
        route: '/sys-profile',
        span: 'col-span-1',
        estTime: 3,
        steps: 4,
      },
      {
        id: 'org',
        label: 'Organization',
        sub: 'Legal, Currency, Tax',
        icon: <Building2 className="h-4 w-4" />,
        status: steps.organization ? 'completed' : 'pending',
        route: '/sys-organization',
        span: 'col-span-1',
        estTime: 5,
        steps: 8,
      },
      {
        id: 'team',
        label: 'Team Manifest',
        sub: 'Invite Admins',
        icon: <Users className="h-4 w-4" />,
        status: steps.team ? 'completed' : 'optional',
        route: '/sys-access',
        span: 'col-span-2',
        estTime: 2,
        steps: 2,
      },
    ],
    [steps]
  )

  // 2. CALCULATE PROGRESS & TOTAL TIME REMAINING
  const stats = useMemo(() => {
    const completed = tasks.filter((t) => t.status === 'completed').length
    const total = tasks.filter((t) => t.status !== 'optional').length
    const pct = Math.round((completed / total) * 100)

    // Calculate remaining minutes only for pending tasks
    const remainingMins = tasks
      .filter((t) => t.status === 'pending')
      .reduce((acc, curr) => acc + curr.estTime, 0)

    return {
      pct: pct > 100 ? 100 : pct,
      remainingMins,
    }
  }, [tasks])

  const isAllDone = stats.pct === 100

  if (isAllDone && !isOpen) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 font-sans">
      {/* MAXIMIZED STATE */}
      {isOpen && (
        <div className="w-[380px] overflow-hidden rounded-2xl border border-[#1F1F1F] bg-[#0A0A0A]/95 shadow-2xl shadow-black backdrop-blur-xl duration-300 animate-in slide-in-from-bottom-5">
          {/* Header with Time Estimate */}
          <div className="border-b border-[#1F1F1F] bg-black/40 p-5">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold tracking-wide text-white">
                  SYSTEM SETUP
                </h3>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  {stats.pct === 100
                    ? 'System configuration complete.'
                    : `Est. time remaining: ~${stats.remainingMins} minutes`}
                </p>
              </div>
              <div className="rounded bg-emerald-500/10 px-2 py-1 font-mono text-xs text-emerald-500">
                {stats.pct}% READY
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#1F1F1F]">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${stats.pct}%` }}
              />
            </div>
          </div>

          {/* The Grid */}
          <div className="grid grid-cols-2 gap-3 p-4">
            {tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => navigate(task.route)}
                className={` ${task.span} group relative rounded-xl border p-3 text-left transition-all ${task.status === 'completed'
                    ? 'border-[#1F1F1F] bg-[#111] opacity-60'
                    : 'border-zinc-800 bg-[#0F0F0F] hover:border-zinc-600 hover:bg-[#151515]'
                  } `}
              >
                {/* Completion Checkmark */}
                <div
                  className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${task.status === 'completed'
                      ? 'border-emerald-500 bg-emerald-500 text-black'
                      : 'border-zinc-700 bg-transparent text-transparent'
                    }`}
                >
                  <Check className="h-3 w-3" />
                </div>

                <div
                  className={`mb-3 ${task.status === 'completed' ? 'text-emerald-500' : 'text-zinc-400 group-hover:text-emerald-400'}`}
                >
                  {task.icon}
                </div>

                <div className="text-sm font-medium text-zinc-200">
                  {task.label}
                </div>

                {/* THE KEY UPDATE: Time & Step Badges */}
                {task.status !== 'completed' && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-500">
                      <Clock className="h-3 w-3" />
                      <span>{task.estTime}m</span>
                    </div>
                    <div className="flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-500">
                      <ListTodo className="h-3 w-3" />
                      <span>{task.steps} steps</span>
                    </div>
                  </div>
                )}
                {task.status === 'completed' && (
                  <div className="mt-2 font-mono text-[10px] text-emerald-500">
                    Configured
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col gap-3 p-4 pt-0">
            {/* THE LAZY BUTTON: APPLY DEFAULTS */}
            {!isAllDone && !steps.organization && (
              <button
                onClick={applyDefaults}
                className="group flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-[#111] py-2.5 text-xs text-zinc-400 transition-all hover:border-zinc-700 hover:bg-[#1A1A1A] hover:text-white"
              >
                <Zap className="h-3.5 w-3.5 text-yellow-500 group-hover:animate-pulse" />
                <span>Apply Recommended Defaults</span>
                <span className="ml-1 text-[10px] text-zinc-600">
                  (Save 5m)
                </span>
              </button>
            )}

            <button
              disabled={!isAllDone}
              onClick={() => navigate('/dashboard')}
              className={`flex w-full items-center justify-center gap-2 rounded-lg border py-3 text-xs font-bold tracking-widest transition-all ${isAllDone
                  ? 'border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-500'
                  : 'cursor-not-allowed border-zinc-800 bg-zinc-900 text-zinc-600'
                } `}
            >
              {isAllDone ? 'INITIALIZE SYSTEM' : 'COMPLETE SETUP TO START'}
              {isAllDone && <ArrowRight className="h-3 w-3" />}
            </button>
          </div>
        </div>
      )}

      {/* MINIMIZED PILL */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex h-12 items-center gap-3 rounded-full border border-[#1F1F1F] bg-[#0A0A0A] pl-1 pr-5 shadow-2xl transition-all hover:border-zinc-600 active:scale-95"
      >
        <div className="relative flex h-10 w-10 items-center justify-center">
          <svg className="h-10 w-10 -rotate-90">
            <circle
              cx="20"
              cy="20"
              r="16"
              className="stroke-[#222]"
              strokeWidth="3"
              fill="transparent"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              className="stroke-emerald-500 transition-all duration-1000 ease-out"
              strokeWidth="3"
              fill="transparent"
              strokeDasharray={100}
              strokeDashoffset={100 - stats.pct}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {isOpen ? (
              <ChevronDown className="h-3 w-3 text-white" />
            ) : (
              <ChevronUp className="h-3 w-3 text-white" />
            )}
          </div>
        </div>

        <div className="text-left">
          <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 transition-colors group-hover:text-zinc-300">
            {stats.pct === 100 ? 'Ready' : 'Quick Setup'}
          </div>
          <div className="text-xs font-bold text-white">
            {stats.pct === 100
              ? 'Launch OS'
              : `${stats.remainingMins} min left`}
          </div>
        </div>
      </button>
    </div>
  )
}
