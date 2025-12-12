import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Terminal, AlertCircle, CheckCircle2 } from 'lucide-react';
import { NexusCard } from '@/components/nexus/NexusCard';

interface ActivityItem {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: string;
  user: string;
  code: string;
}

const mockActivity: ActivityItem[] = [
  {
    id: '1',
    type: 'success',
    message: 'Schema validation complete: UserRegistry_v2',
    timestamp: '09:42:12',
    user: 'SYS_ADMIN',
    code: 'VAL_01',
  },
  {
    id: '2',
    type: 'info',
    message: 'Migration batch initiated: Legacy_CRM_Export',
    timestamp: '09:38:05',
    user: 'MIG_BOT',
    code: 'MIG_04',
  },
  {
    id: '3',
    type: 'warning',
    message: 'Latency spike detected in Region US-EAST-1',
    timestamp: '09:15:22',
    user: 'WATCHDOG',
    code: 'NET_09',
  },
  {
    id: '4',
    type: 'info',
    message: 'New metadata definition approved',
    timestamp: '08:55:00',
    user: 'USER_88',
    code: 'MET_02',
  },
  {
    id: '5',
    type: 'error',
    message: 'Failed login attempt: IP 192.168.1.105',
    timestamp: '08:12:44',
    user: 'AUTH_SYS',
    code: 'SEC_01',
  },
  {
    id: '6',
    type: 'success',
    message: 'System backup completed successfully',
    timestamp: '04:00:00',
    user: 'SYS_DAEMON',
    code: 'BKP_01',
  },
];

const ActivityRow = ({ item }: { item: ActivityItem }) => {
  const getIcon = () => {
    switch (item.type) {
      case 'success':
        return <CheckCircle2 size={14} className="text-nexus-green" />;
      case 'warning':
        return <AlertCircle size={14} className="text-amber-500" />;
      case 'error':
        return <AlertCircle size={14} className="text-red-500" />;
      default:
        return <Terminal size={14} className="text-nexus-noise" />;
    }
  };

  return (
    <div className="group flex items-center gap-4 p-3 border-b border-nexus-structure last:border-0 hover:bg-nexus-subtle/10 transition-colors text-sm">
      <div className="w-16 font-mono text-[10px] text-nexus-noise tabular-nums shrink-0">
        {item.timestamp}
      </div>
      <div className="shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="font-mono text-[10px] text-nexus-green opacity-80">{item.code}</span>
          <span className="text-nexus-signal/80 truncate text-xs">{item.message}</span>
        </div>
      </div>
      <div className="shrink-0 font-mono text-[10px] text-nexus-noise px-1.5 py-0.5 border border-nexus-structure rounded-sm">
        {item.user}
      </div>
    </div>
  );
};

export function ActivityFeed() {
  return (
    <NexusCard
      title="SYSTEM LOG"
      className="h-full flex flex-col p-0"
      action={
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-nexus-green animate-pulse" />
          <span className="nexus-label text-nexus-green">LIVE</span>
        </div>
      }
    >
      <ScrollArea className="flex-1 h-[300px]">
        <div className="flex flex-col">
          {mockActivity.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </div>
      </ScrollArea>
    </NexusCard>
  );
}
