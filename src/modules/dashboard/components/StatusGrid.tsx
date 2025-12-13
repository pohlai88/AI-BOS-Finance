import { ArrowUpRight, Activity, Shield, Users, Database } from 'lucide-react'
import { NexusCard } from '@/components/nexus/NexusCard'
import { cn } from '@aibos/ui'

interface StatusCardProps {
  label: string
  value: string
  trend?: string
  trendDirection?: 'up' | 'down' | 'neutral'
  icon: React.ElementType
  code: string
}

const StatusCard = ({
  label,
  value,
  trend,
  trendDirection,
  icon: Icon,
  code,
}: StatusCardProps) => (
  <NexusCard className="h-full p-0">
    <div className="flex h-full flex-col justify-between p-5">
      {/* Header: Icon + Code */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-nexus-void border-nexus-structure text-nexus-noise group-hover:text-nexus-green rounded-sm border p-1.5 transition-colors">
            <Icon size={14} />
          </div>
          <span className="nexus-label">{code}</span>
        </div>

        {/* Trend Indicator */}
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[10px]',
              trendDirection === 'up'
                ? 'text-nexus-green border-nexus-green/20 bg-nexus-green/5'
                : 'text-nexus-noise border-nexus-structure bg-nexus-void'
            )}
          >
            {trend}
            {trendDirection === 'up' && <ArrowUpRight size={10} />}
          </div>
        )}
      </div>

      {/* Value Block */}
      <div>
        <div className="text-nexus-signal mb-1 text-2xl font-medium tracking-tighter">
          {value}
        </div>
        <div className="text-nexus-noise font-mono text-xs">{label}</div>
      </div>
    </div>
  </NexusCard>
)

export function StatusGrid() {
  const metrics = [
    {
      label: 'System Health',
      value: '98.4%',
      trend: '+0.2%',
      trendDirection: 'up',
      icon: Activity,
      code: 'SYS_01',
    },
    {
      label: 'Active Protocols',
      value: '1,248',
      trend: '+12',
      trendDirection: 'up',
      icon: Shield,
      code: 'PRO_04',
    },
    {
      label: 'Data Objects',
      value: '84.2K',
      trend: '+5.4%',
      trendDirection: 'up',
      icon: Database,
      code: 'DAT_09',
    },
    {
      label: 'Auth Sessions',
      value: '342',
      trend: 'Stable',
      trendDirection: 'neutral',
      icon: Users,
      code: 'AUT_02',
    },
  ] as const

  return (
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <StatusCard key={metric.code} {...metric} />
      ))}
    </div>
  )
}
