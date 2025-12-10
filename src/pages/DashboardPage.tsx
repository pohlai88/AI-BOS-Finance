import { NexusCard } from '@/components/nexus/NexusCard';
import { NexusButton } from '@/components/nexus/NexusButton';
import { StatusGrid } from '@/components/dashboard/StatusGrid';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { Download, RefreshCw, Cpu, HardDrive, Wifi } from 'lucide-react';

// Sub-Component: Forensic Throughput Monitor (Replaces the circular radar)
const ThroughputMonitor = () => {
  const metrics = [
    { label: 'INGEST_PIPE_01', value: 84, icon: Wifi },
    { label: 'VALIDATION_CORE', value: 62, icon: Cpu },
    { label: 'LEDGER_WRITE', value: 91, icon: HardDrive },
  ];

  return (
    <NexusCard title="THROUGHPUT_VELOCITY" className="h-full">
      <div className="space-y-8 mt-4">
        {metrics.map((m, i) => (
          <div key={i} className="space-y-2 group">
            <div className="flex justify-between text-xs font-mono text-nexus-noise">
              <div className="flex items-center gap-2">
                <m.icon className="w-3 h-3 text-nexus-structure group-hover:text-nexus-green transition-colors" />
                <span>{m.label}</span>
              </div>
              <span className="text-nexus-green">{m.value}%</span>
            </div>
            {/* The Bar: Sharp, Rectangular, Segmented */}
            <div className="h-2 w-full bg-nexus-structure/50 relative overflow-hidden">
              {/* Grid lines on top of the bar for 'ruler' effect */}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_2px,#000_2px)] bg-[size:10%_100%] z-10 opacity-30" />

              <div
                className="h-full bg-nexus-green shadow-[0_0_10px_rgba(40,231,162,0.3)] transition-all duration-1000 ease-out"
                style={{ width: `${m.value}%` }}
              />
            </div>
          </div>
        ))}

        {/* Forensic Footer */}
        <div className="pt-6 mt-6 border-t border-nexus-structure flex justify-between items-center text-[10px] font-mono text-nexus-noise">
          <span>BUFFER: OPTIMAL</span>
          <span>LATENCY: 12ms</span>
        </div>
      </div>
    </NexusCard>
  );
};

export const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-nexus-void p-6 md:p-12 space-y-8">
      {/* 1. COMMAND DECK HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-nexus-structure pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-nexus-green animate-pulse" />
            <span className="nexus-label text-nexus-green">LIVE ENVIRONMENT</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-medium tracking-tighter text-white">Command Deck</h1>
        </div>

        <div className="flex items-center gap-3">
          <NexusButton variant="secondary" icon={<RefreshCw className="w-3 h-3" />}>
            SYNC
          </NexusButton>
          <NexusButton variant="primary" icon={<Download className="w-3 h-3" />}>
            EXPORT REPORT
          </NexusButton>
        </div>
      </div>

      {/* 2. STATUS GRID (Top Row) */}
      <section>
        <StatusGrid />
      </section>

      {/* 3. MAIN INTELLIGENCE GRID (Split View) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        {/* Left: Activity Feed (Takes 2 columns) */}
        <div className="lg:col-span-2 h-full">
          <ActivityFeed />
        </div>

        {/* Right: Throughput Monitor (Takes 1 column) */}
        <div className="h-full">
          <ThroughputMonitor />
        </div>
      </section>

      {/* 4. SYSTEM FOOTER */}
      <footer className="flex justify-between items-center pt-8 border-t border-nexus-structure text-[10px] font-mono text-nexus-structure">
        <div>SECURE_CONNECTION // TLS_1.3</div>
        <div>NEXUS_CANON_v2.4.1</div>
      </footer>
    </div>
  );
};
