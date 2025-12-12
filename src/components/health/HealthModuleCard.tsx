import React from 'react'
import { HealthModule } from '../../data/mockHealthScan'
import {
  AlertTriangle,
  CheckCircle,
  AlertOctagon,
  ArrowRight,
} from 'lucide-react'

interface HealthModuleCardProps {
  module: HealthModule
  onClick: () => void
  isSelected?: boolean
}

export function HealthModuleCard({
  module,
  onClick,
  isSelected,
}: HealthModuleCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Governed':
        return 'text-[#28E7A2] border-[#28E7A2]'
      case 'Watch':
        return 'text-amber-400 border-amber-400'
      case 'Exposed':
        return 'text-red-500 border-red-500'
      default:
        return 'text-[#666] border-[#666]'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'Governed':
        return 'bg-[#28E7A2]/5 hover:bg-[#28E7A2]/10'
      case 'Watch':
        return 'bg-amber-400/5 hover:bg-amber-400/10'
      case 'Exposed':
        return 'bg-red-500/5 hover:bg-red-500/10'
      default:
        return 'bg-[#111]'
    }
  }

  const colorClass = getStatusColor(module.status)

  return (
    <button
      onClick={onClick}
      className={`group relative flex w-full flex-col items-start border p-6 text-left transition-all duration-200 ${isSelected ? 'border-[#EEE] bg-[#111]' : 'border-[#1F1F1F] bg-[#0A0A0A]'} ${getStatusBg(module.status)} `}
    >
      {isSelected && (
        <div className="absolute left-0 top-0 h-full w-1 bg-white" />
      )}

      <div className="mb-4 flex w-full items-center justify-between">
        <h3 className="text-lg font-medium leading-tight text-white">
          {module.name}
        </h3>
        <div
          className={`flex items-center gap-2 rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${colorClass}`}
        >
          {module.status === 'Governed' && <CheckCircle className="h-3 w-3" />}
          {module.status === 'Watch' && <AlertTriangle className="h-3 w-3" />}
          {module.status === 'Exposed' && <AlertOctagon className="h-3 w-3" />}
          <span>{module.status}</span>
        </div>
      </div>

      <div className="mb-4 flex items-baseline gap-2">
        <span
          className={`font-mono text-4xl font-light ${colorClass.split(' ')[0]}`}
        >
          {module.score}
        </span>
        <span className="font-mono text-xs uppercase text-[#666]">/ 100</span>
      </div>

      <div className="mt-auto w-full border-t border-[#1F1F1F] pt-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-[#666]" />
          <p className="line-clamp-2 text-xs leading-relaxed text-[#888]">
            {module.keyIssue}
          </p>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
        <ArrowRight className="h-4 w-4 text-[#666]" />
      </div>
    </button>
  )
}
