import { NexusIcon } from '@/components/nexus/NexusIcon'
import { Search, Bell, Settings } from 'lucide-react'

export function DashboardHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-[#1F1F1F] bg-[#000000] px-6">
      <div className="flex items-center gap-4">
        {/* Breadcrumb-style location indicator */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[#888]">NEXUS</span>
          <span className="text-[#333]">//</span>
          <span className="font-medium tracking-tight text-[#EEE]">
            CONTROL ROOM
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Input Stub */}
        <div className="group relative hidden md:block">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666] transition-colors group-focus-within:text-[#28E7A2]"
          />
          <input
            type="text"
            placeholder="SEARCH REGISTRY..."
            className="h-9 w-64 border border-[#1F1F1F] bg-[#0A0A0A] pl-9 pr-3 font-mono text-xs text-[#FFF] placeholder-[#444] transition-colors focus:border-[#333] focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 border-l border-[#1F1F1F] pl-4">
          <button className="rounded-sm p-2 text-[#666] transition-colors hover:bg-[#111] hover:text-[#FFF]">
            <Bell size={16} />
          </button>
          <button className="rounded-sm p-2 text-[#666] transition-colors hover:bg-[#111] hover:text-[#FFF]">
            <Settings size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}
