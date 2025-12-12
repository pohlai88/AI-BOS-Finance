import { NexusCard } from '@/components/nexus/NexusCard'
import { NexusButton } from '@/components/nexus/NexusButton'
import { StatusGrid } from '@/components/dashboard/StatusGrid'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { Download, RefreshCw, Cpu, HardDrive, Wifi } from 'lucide-react'

// Sub-Component: Forensic Throughput Monitor (Replaces the circular radar)
const ThroughputMonitor = () => {
  const metrics = [
    { label: 'INGEST_PIPE_01', value: 84, icon: Wifi },
    { label: 'VALIDATION_CORE', value: 62, icon: Cpu },
    { label: 'LEDGER_WRITE', value: 91, icon: HardDrive },
  ]

  return (
    <NexusCard title="THROUGHPUT_VELOCITY" className="h-full">
      <div className="mt-4 space-y-8">
        {metrics.map((m, i) => (
          <div key={i} className="group space-y-2">
            <div className="text-nexus-noise flex justify-between font-mono text-xs">
              <div className="flex items-center gap-2">
                <m.icon className="text-nexus-structure group-hover:text-nexus-green h-3 w-3 transition-colors" />
                <span>{m.label}</span>
              </div>
              <span className="text-nexus-green">{m.value}%</span>
            </div>
            {/* The Bar: Sharp, Rectangular, Segmented */}
            <div className="bg-nexus-structure/50 relative h-2 w-full overflow-hidden">
              {/* Grid lines on top of the bar for 'ruler' effect */}
              <div className="absolute inset-0 z-10 bg-[linear-gradient(90deg,transparent_2px,#000_2px)] bg-[size:10%_100%] opacity-30" />

              <div
                className="bg-nexus-green h-full shadow-[0_0_10px_rgba(40,231,162,0.3)] transition-all duration-1000 ease-out"
                style={{ width: `${m.value}%` }}
              />
            </div>
          </div>
        ))}

        {/* Forensic Footer */}
        <div className="border-nexus-structure text-nexus-noise mt-6 flex items-center justify-between border-t pt-6 font-mono text-[10px]">
          <span>BUFFER: OPTIMAL</span>
          <span>LATENCY: 12ms</span>
        </div>
      </div>
    </NexusCard>
  )
}

export const DashboardPage = () => {
  return (
    <div className="bg-nexus-void min-h-screen space-y-8 p-6 md:p-12">
      {/* 1. COMMAND DECK HEADER */}
      <div className="border-nexus-structure flex flex-col justify-between gap-4 border-b pb-6 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="bg-nexus-green h-2 w-2 animate-pulse" />
            <span className="nexus-label text-nexus-green">
              LIVE ENVIRONMENT
            </span>
          </div>
          <h1 className="text-3xl font-medium tracking-tighter text-white md:text-4xl">
            Command Deck
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <NexusButton
            variant="secondary"
            icon={<RefreshCw className="h-3 w-3" />}
          >
            SYNC
          </NexusButton>
          <NexusButton
            variant="primary"
            icon={<Download className="h-3 w-3" />}
          >
            EXPORT REPORT
          </NexusButton>
        </div>
      </div>

      {/* 2. STATUS GRID (Top Row) */}
      <section>
        <StatusGrid />
      </section>

      {/* 3. MAIN INTELLIGENCE GRID (Split View) */}
      <section className="grid h-[500px] grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Activity Feed (Takes 2 columns) */}
        <div className="h-full lg:col-span-2">
          <ActivityFeed />
        </div>

        {/* Right: Throughput Monitor (Takes 1 column) */}
        <div className="h-full">
          <ThroughputMonitor />
        </div>
      </section>

      {/* 4. SYSTEM FOOTER */}
      <footer className="border-nexus-structure text-nexus-structure flex items-center justify-between border-t pt-8 font-mono text-[10px]">
        <div>SECURE_CONNECTION // TLS_1.3</div>
        <div>NEXUS_CANON_v2.4.1</div>
      </footer>
    </div>
  )
}
