import { useEffect, useState, useMemo, useCallback } from 'react';
import { SuperTable } from '@/components/metadata/SuperTable';
import { createColumnHelper } from '@tanstack/react-table';
import { NexusButton } from '@/components/nexus/NexusButton';
import { cn } from '@/lib/utils';
import { Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

// 1. Define the Shape of the Backend Data
type LedgerRecord = {
  ID: string;
  entity_code: string;
  class: string;
  amount: number;
  currency: string;
  status: 'LOCKED' | 'PENDING' | 'FLAGGED';
  block_hash: string;
};

export const MetadataGodView = () => {
  const [data, setData] = useState<LedgerRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. The Synapse: Fetch from the Proxy
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/odata/v4/forensic/MasterLedger');
        const json = await response.json();
        setData(json.value); // OData returns records in 'value' array
      } catch (error) {
        console.error('Neural Link Failed:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 3. The Crystalize Protocol: Lock a Record
  const handleLock = useCallback(async (id: string) => {
    try {
      // Call the OData Action
      const response = await fetch('/odata/v4/forensic/lockPeriod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });

      if (!response.ok) throw new Error('Lock Failed');

      // Optimistic UI Update (Update local state instantly)
      setData((prev) => prev.map((row) => (row.ID === id ? { ...row, status: 'LOCKED' } : row)));

      toast.success('RECORD CRYSTALIZED', {
        description: `ID: ${id.substring(0, 8)}... has been cryptographically sealed.`,
      });
    } catch (e) {
      console.error('Crystalize failed:', e);
      toast.error('ENCRYPTION FAILED', {
        description: 'Could not lock record. Check backend connection.',
      });
    }
  }, []);

  const columnHelper = createColumnHelper<LedgerRecord>();

  // 4. Define Columns (Mapped to Real DB Fields)
  const columns = useMemo(
    () => [
      columnHelper.accessor('ID', {
        header: 'RECORD_ID',
        cell: (info) => (
          <span className="text-nexus-signal font-bold">{info.getValue().substring(0, 8)}...</span>
        ),
      }),
      columnHelper.accessor('entity_code', {
        header: 'LEGAL_ENTITY',
      }),
      columnHelper.accessor('class', {
        header: 'CLASS',
      }),
      columnHelper.accessor('amount', {
        header: 'NOTIONAL_VALUE',
        cell: (info) => {
          const row = info.row.original;
          return (
            <span className="text-nexus-signal">
              {row.currency} {info.getValue().toLocaleString()}
            </span>
          );
        },
      }),
      columnHelper.accessor('status', {
        header: 'STATE',
        cell: (info) => {
          const status = info.getValue();
          return (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  status === 'LOCKED' && 'bg-nexus-green shadow-[0_0_8px_#28E7A2]',
                  status === 'PENDING' && 'bg-yellow-500',
                  status === 'FLAGGED' && 'bg-red-500 animate-pulse',
                )}
              />
              <span
                className={cn(
                  status === 'LOCKED' && 'text-nexus-green',
                  status === 'FLAGGED' && 'text-red-500',
                )}
              >
                {status}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor('block_hash', {
        header: 'BLOCK_HASH',
        cell: (info) => (
          <span className="text-[10px] opacity-50 font-mono">{info.getValue().substring(0, 10)}...</span>
        ),
      }),
      // 5. THE ACTION COLUMN: Crystalize Button
      columnHelper.display({
        id: 'actions',
        header: 'ACTION',
        cell: (info) => {
          const status = info.row.original.status;
          const id = info.row.original.ID;

          if (status === 'LOCKED') {
            return (
              <div className="flex items-center gap-1.5 text-nexus-green">
                <ShieldCheck className="w-3 h-3" />
                <span className="text-[10px] font-mono">SEALED</span>
              </div>
            );
          }

          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLock(id);
              }}
              className="group flex items-center gap-1.5 text-nexus-noise hover:text-nexus-green transition-colors"
              title="Crystalize Record"
            >
              <Lock className="w-3 h-3 group-hover:animate-pulse" />
              <span className="text-[10px] font-mono uppercase">LOCK</span>
            </button>
          );
        },
      }),
    ],
    [handleLock],
  );

  if (loading)
    return (
      <div className="min-h-screen bg-nexus-void flex items-center justify-center">
        <div className="text-nexus-green animate-pulse font-mono text-xs tracking-widest">
          ESTABLISHING NEURAL LINK...
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-nexus-void p-8 space-y-8">
      <div className="flex items-end justify-between border-b border-nexus-structure pb-6">
        <div>
          <span className="nexus-label text-nexus-green">System Registry</span>
          <h1 className="text-3xl text-white font-medium tracking-tight mt-1">
            Global Metadata Index
          </h1>
        </div>
        <NexusButton variant="primary">EXPORT AUDIT LOG</NexusButton>
      </div>

      {/* Live Data Injection */}
      <SuperTable data={data} columns={columns} title="LIVE_LEDGER_FEED" mobileKey="entity_code" />
    </div>
  );
};
