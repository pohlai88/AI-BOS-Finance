import React from 'react';
import { HealthModule } from '../../data/mockHealthScan';
import { AlertTriangle, CheckCircle, AlertOctagon, ArrowRight } from 'lucide-react';

interface HealthModuleCardProps {
  module: HealthModule;
  onClick: () => void;
  isSelected?: boolean;
}

export function HealthModuleCard({ module, onClick, isSelected }: HealthModuleCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Governed': return 'text-[#28E7A2] border-[#28E7A2]';
      case 'Watch': return 'text-amber-400 border-amber-400';
      case 'Exposed': return 'text-red-500 border-red-500';
      default: return 'text-[#666] border-[#666]';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'Governed': return 'bg-[#28E7A2]/5 hover:bg-[#28E7A2]/10';
      case 'Watch': return 'bg-amber-400/5 hover:bg-amber-400/10';
      case 'Exposed': return 'bg-red-500/5 hover:bg-red-500/10';
      default: return 'bg-[#111]';
    }
  };

  const colorClass = getStatusColor(module.status);

  return (
    <button 
      onClick={onClick}
      className={`relative flex flex-col items-start p-6 text-left border transition-all duration-200 w-full group
        ${isSelected ? 'border-[#EEE] bg-[#111]' : 'border-[#1F1F1F] bg-[#0A0A0A]'}
        ${getStatusBg(module.status)}
      `}
    >
      {isSelected && (
        <div className="absolute top-0 left-0 w-1 h-full bg-white" />
      )}

      <div className="flex items-center justify-between w-full mb-4">
        <h3 className="text-white font-medium text-lg leading-tight">{module.name}</h3>
        <div className={`flex items-center gap-2 px-2 py-0.5 border text-[10px] font-mono uppercase tracking-wider rounded-sm ${colorClass}`}>
          {module.status === 'Governed' && <CheckCircle className="w-3 h-3" />}
          {module.status === 'Watch' && <AlertTriangle className="w-3 h-3" />}
          {module.status === 'Exposed' && <AlertOctagon className="w-3 h-3" />}
          <span>{module.status}</span>
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <span className={`text-4xl font-mono font-light ${colorClass.split(' ')[0]}`}>
          {module.score}
        </span>
        <span className="text-xs text-[#666] font-mono uppercase">/ 100</span>
      </div>

      <div className="mt-auto pt-4 border-t border-[#1F1F1F] w-full">
        <div className="flex items-start gap-2">
           <AlertTriangle className="w-3 h-3 text-[#666] mt-0.5 shrink-0" />
           <p className="text-xs text-[#888] leading-relaxed line-clamp-2">
             {module.keyIssue}
           </p>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="w-4 h-4 text-[#666]" />
      </div>
    </button>
  );
}
