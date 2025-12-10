import { useEffect, useState, useMemo } from 'react';
import { SuperTable } from '@/components/metadata/SuperTable';
import { createColumnHelper } from '@tanstack/react-table';
import { NexusButton } from '@/components/nexus/NexusButton';
import { cn } from '@/lib/utils';

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

  const columnHelper = createColumnHelper<LedgerRecord>();

  // 3. Define Columns (Mapped to Real DB Fields)
  const columns = useMemo(
    () => [
      columnHelper.accessor('ID', {
        header: 'RECORD_ID',
        cell: (info) => <span className="text-nexus-signal font-bold">{info.getValue()}</span>,
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
    ],
    [],
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
