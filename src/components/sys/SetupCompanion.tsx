import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSysConfig } from '../../context/SysConfigContext';
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
} from 'lucide-react';

// 1. DATA MODEL WITH TIME & EFFORT METADATA
const SETUP_TASKS = [
  {
    id: 'profile',
    label: 'Personal Profile',
    sub: 'Avatar & Security',
    icon: <User className="w-4 h-4" />,
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
    icon: <Building2 className="w-4 h-4" />,
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
    icon: <Users className="w-4 h-4" />,
    status: 'optional',
    route: '/sys-access',
    span: 'col-span-2',
    estTime: 2,
    steps: 2,
  },
];

export function SetupCompanion() {
  const [isOpen, setIsOpen] = useState(false);
  const { steps, applyDefaults } = useSysConfig();
  const navigate = useNavigate();

  // 1. MAP CONTEXT STATE TO TASKS
  const tasks = useMemo(
    () => [
      {
        id: 'profile',
        label: 'Personal Profile',
        sub: 'Avatar & Security',
        icon: <User className="w-4 h-4" />,
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
        icon: <Building2 className="w-4 h-4" />,
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
        icon: <Users className="w-4 h-4" />,
        status: steps.team ? 'completed' : 'optional',
        route: '/sys-access',
        span: 'col-span-2',
        estTime: 2,
        steps: 2,
      },
    ],
    [steps],
  );

  // 2. CALCULATE PROGRESS & TOTAL TIME REMAINING
  const stats = useMemo(() => {
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const total = tasks.filter((t) => t.status !== 'optional').length;
    const pct = Math.round((completed / total) * 100);

    // Calculate remaining minutes only for pending tasks
    const remainingMins = tasks
      .filter((t) => t.status === 'pending')
      .reduce((acc, curr) => acc + curr.estTime, 0);

    return {
      pct: pct > 100 ? 100 : pct,
      remainingMins,
    };
  }, [tasks]);

  const isAllDone = stats.pct === 100;

  if (isAllDone && !isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 font-sans">
      {/* MAXIMIZED STATE */}
      {isOpen && (
        <div className="w-[380px] bg-[#0A0A0A]/95 backdrop-blur-xl border border-[#1F1F1F] rounded-2xl shadow-2xl shadow-black overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header with Time Estimate */}
          <div className="p-5 border-b border-[#1F1F1F] bg-black/40">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">SYSTEM SETUP</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {stats.pct === 100
                    ? 'System configuration complete.'
                    : `Est. time remaining: ~${stats.remainingMins} minutes`}
                </p>
              </div>
              <div className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
                {stats.pct}% READY
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="h-1 w-full bg-[#1F1F1F] rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${stats.pct}%` }}
              />
            </div>
          </div>

          {/* The Grid */}
          <div className="p-4 grid grid-cols-2 gap-3">
            {tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => navigate(task.route)}
                className={`
                  ${task.span} relative group p-3 rounded-xl border text-left transition-all
                  ${
                    task.status === 'completed'
                      ? 'bg-[#111] border-[#1F1F1F] opacity-60'
                      : 'bg-[#0F0F0F] border-zinc-800 hover:border-zinc-600 hover:bg-[#151515]'
                  }
                `}
              >
                {/* Completion Checkmark */}
                <div
                  className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                    task.status === 'completed'
                      ? 'bg-emerald-500 border-emerald-500 text-black'
                      : 'bg-transparent border-zinc-700 text-transparent'
                  }`}
                >
                  <Check className="w-3 h-3" />
                </div>

                <div
                  className={`mb-3 ${task.status === 'completed' ? 'text-emerald-500' : 'text-zinc-400 group-hover:text-emerald-400'}`}
                >
                  {task.icon}
                </div>

                <div className="text-sm font-medium text-zinc-200">{task.label}</div>

                {/* THE KEY UPDATE: Time & Step Badges */}
                {task.status !== 'completed' && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                      <Clock className="w-3 h-3" />
                      <span>{task.estTime}m</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                      <ListTodo className="w-3 h-3" />
                      <span>{task.steps} steps</span>
                    </div>
                  </div>
                )}
                {task.status === 'completed' && (
                  <div className="text-[10px] text-emerald-500 mt-2 font-mono">Configured</div>
                )}
              </button>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="p-4 pt-0 flex flex-col gap-3">
            {/* THE LAZY BUTTON: APPLY DEFAULTS */}
            {!isAllDone && !steps.organization && (
              <button
                onClick={applyDefaults}
                className="w-full py-2.5 rounded-lg border border-zinc-800 bg-[#111] hover:bg-[#1A1A1A] hover:border-zinc-700 text-xs text-zinc-400 hover:text-white transition-all flex items-center justify-center gap-2 group"
              >
                <Zap className="w-3.5 h-3.5 text-yellow-500 group-hover:animate-pulse" />
                <span>Apply Recommended Defaults</span>
                <span className="text-[10px] text-zinc-600 ml-1">(Save 5m)</span>
              </button>
            )}

            <button
              disabled={!isAllDone}
              onClick={() => navigate('/dashboard')}
              className={`w-full py-3 rounded-lg border text-xs font-bold tracking-widest flex items-center justify-center gap-2 transition-all
                ${
                  isAllDone
                    ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20'
                    : 'bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed'
                }
              `}
            >
              {isAllDone ? 'INITIALIZE SYSTEM' : 'COMPLETE SETUP TO START'}
              {isAllDone && <ArrowRight className="w-3 h-3" />}
            </button>
          </div>
        </div>
      )}

      {/* MINIMIZED PILL */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group h-12 bg-[#0A0A0A] border border-[#1F1F1F] hover:border-zinc-600 rounded-full pl-1 pr-5 flex items-center gap-3 shadow-2xl transition-all active:scale-95"
      >
        <div className="relative w-10 h-10 flex items-center justify-center">
          <svg className="w-10 h-10 -rotate-90">
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
              <ChevronDown className="w-3 h-3 text-white" />
            ) : (
              <ChevronUp className="w-3 h-3 text-white" />
            )}
          </div>
        </div>

        <div className="text-left">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider group-hover:text-zinc-300 transition-colors">
            {stats.pct === 100 ? 'Ready' : 'Quick Setup'}
          </div>
          <div className="text-xs font-bold text-white">
            {stats.pct === 100 ? 'Launch OS' : `${stats.remainingMins} min left`}
          </div>
        </div>
      </button>
    </div>
  );
}
