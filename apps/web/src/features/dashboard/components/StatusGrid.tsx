import { ArrowUpRight, Activity, Shield, Users, Database } from 'lucide-react';
import { ForensicCard as NexusCard } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatusCardProps {
  label: string;
  value: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  code: string;
}

const StatusCard = ({ label, value, trend, trendDirection, icon: Icon, code }: StatusCardProps) => (
  <NexusCard className="h-full p-0">
    <div className="p-5 flex flex-col h-full justify-between">
      {/* Header: Icon + Code */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-sm bg-background border border-default text-text-secondary group-hover:text-primary transition-colors">
            <Icon size={14} />
          </div>
          <span className="nexus-label">{code}</span>
        </div>

        {/* Trend Indicator */}
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 border',
              trendDirection === 'up'
                ? 'text-primary border-primary/20 bg-primary/5'
                : 'text-text-secondary border-default bg-background',
            )}
          >
            {trend}
            {trendDirection === 'up' && <ArrowUpRight size={10} />}
          </div>
        )}
      </div>

      {/* Value Block */}
      <div>
        <div className="text-2xl font-medium tracking-tighter text-text-primary mb-1">{value}</div>
        <div className="text-xs text-text-secondary font-mono">{label}</div>
      </div>
    </div>
  </NexusCard>
);

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
  ] as const;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {metrics.map((metric) => (
        <StatusCard key={metric.code} {...metric} />
      ))}
    </div>
  );
}
