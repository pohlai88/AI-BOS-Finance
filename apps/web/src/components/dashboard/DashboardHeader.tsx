import { NexusIcon } from '@/components/nexus/NexusIcon';
import { Search, Bell, Settings } from 'lucide-react';

export function DashboardHeader() {
  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-[#1F1F1F] bg-[#000000]">
      <div className="flex items-center gap-4">
        {/* Breadcrumb-style location indicator */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[#888]">NEXUS</span>
          <span className="text-[#333]">//</span>
          <span className="text-[#EEE] font-medium tracking-tight">CONTROL ROOM</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Input Stub */}
        <div className="relative group hidden md:block">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666] group-focus-within:text-[#28E7A2] transition-colors"
          />
          <input
            type="text"
            placeholder="SEARCH REGISTRY..."
            className="h-9 w-64 bg-[#0A0A0A] border border-[#1F1F1F] pl-9 pr-3 text-xs text-[#FFF] placeholder-[#444] focus:outline-none focus:border-[#333] transition-colors font-mono"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center border-l border-[#1F1F1F] pl-4 gap-2">
          <button className="p-2 text-[#666] hover:text-[#FFF] transition-colors hover:bg-[#111] rounded-sm">
            <Bell size={16} />
          </button>
          <button className="p-2 text-[#666] hover:text-[#FFF] transition-colors hover:bg-[#111] rounded-sm">
            <Settings size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
