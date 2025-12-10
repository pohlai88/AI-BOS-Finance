import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, Search, Filter, ChevronRight } from 'lucide-react';
import { NexusCard } from '../nexus/NexusCard';

interface SuperTableProps<T> {
  data: T[];
  columns: any[];
  title?: string;
  onRowClick?: (row: T) => void;
  // Optional: Identifying field for the mobile card title (e.g., 'id' or 'name')
  mobileKey?: keyof T;
}

export function SuperTable<T>({
  data,
  columns,
  title,
  onRowClick,
  mobileKey,
}: SuperTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <NexusCard variant="default" className="p-0 overflow-hidden flex flex-col h-full min-h-[500px]">
      {/* 1. UNIVERSAL HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-nexus-structure bg-nexus-matter gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-nexus-green rounded-full animate-pulse" />
          <span className="nexus-label text-nexus-signal text-xs">{title || 'DATA_REGISTRY'}</span>
          <span className="nexus-label text-nexus-structure">// {data.length} RECORDS</span>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-nexus-noise" />
            <input
              type="text"
              placeholder="FILTER_SCOPE..."
              className="bg-nexus-void border border-nexus-structure h-8 pl-8 pr-3 text-[10px] font-mono text-white focus:border-nexus-green focus:outline-none w-full md:w-48 transition-colors placeholder:text-nexus-structure"
            />
          </div>
          <button className="h-8 w-8 flex items-center justify-center border border-nexus-structure hover:border-nexus-green text-nexus-noise hover:text-nexus-green transition-colors">
            <Filter className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. DESKTOP VIEW (The Spreadsheet) - Hidden on Mobile */}
      <div className="hidden md:block flex-1 overflow-auto relative bg-nexus-matter">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-nexus-void shadow-[0_1px_0_0_#1f1f1f]">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="h-10 px-4 border-b border-r border-nexus-structure last:border-r-0"
                  >
                    <button
                      onClick={header.column.getToggleSortingHandler()}
                      className="flex items-center gap-2 w-full hover:text-nexus-signal transition-colors group"
                    >
                      <span className="nexus-label text-[9px] group-hover:text-nexus-green">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </span>
                      <ArrowUpDown className="w-3 h-3 text-nexus-structure group-hover:text-nexus-green opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                onClick={() => onRowClick && onRowClick(row.original as T)}
                className="group transition-colors cursor-pointer hover:bg-nexus-subtle/20 border-b border-nexus-structure/50"
              >
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    className="h-12 px-4 border-r border-nexus-structure/30 last:border-r-0"
                  >
                    <div className="font-mono text-xs text-nexus-noise group-hover:text-nexus-signal truncate transition-colors">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. MOBILE VIEW (The Card Stack) - Visible only on Mobile */}
      <div className="md:hidden flex-1 overflow-auto bg-nexus-void p-4 space-y-3">
        {table.getRowModel().rows.map(row => (
          <div
            key={row.id}
            onClick={() => onRowClick && onRowClick(row.original as T)}
            className="bg-nexus-matter border border-nexus-structure p-4 active:border-nexus-green transition-colors"
          >
            {/* Mobile Card Header */}
            <div className="flex justify-between items-start mb-3 border-b border-nexus-structure pb-2">
              <div className="font-mono text-sm text-white font-medium">
                {/* Try to find a good title, fallback to ID */}
                {mobileKey ? String((row.original as any)[mobileKey]) : row.id}
              </div>
              <ChevronRight className="w-4 h-4 text-nexus-noise" />
            </div>

            {/* Mobile Card Key-Value Pairs */}
            <div className="space-y-2">
              {row.getVisibleCells().map(cell => {
                // Skip the ID or Title field if we used it in the header to avoid duplication
                if (cell.column.id === mobileKey) return null;

                return (
                  <div key={cell.id} className="flex justify-between items-center text-xs">
                    <span className="text-nexus-noise font-mono uppercase text-[10px] tracking-wider">
                      {cell.column.columnDef.header as string}
                    </span>
                    <div className="text-nexus-signal font-mono text-right">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 4. FOOTER */}
      <div className="p-2 border-t border-nexus-structure bg-nexus-void flex justify-between items-center text-[9px] font-mono text-nexus-structure">
        <span>SYNC_ID: {Math.random().toString(16).slice(2, 8).toUpperCase()}</span>
        <span className="text-nexus-green">LIVE_CONNECTION</span>
      </div>
    </NexusCard>
  );
}
