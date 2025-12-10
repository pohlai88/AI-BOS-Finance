import { useState } from "react";
import { 
  flexRender, 
  getCoreRowModel, 
  useReactTable,
  getSortedRowModel,
  SortingState
} from "@tanstack/react-table";
import { ArrowUpDown, Search, Filter } from "lucide-react";
import { NexusCard } from "../nexus/NexusCard"; // Uses your new Card component
import { cn } from "@/lib/utils";

// Generic Props to make this reusable for ANY data
interface SuperTableProps<T> {
  data: T[];
  columns: any[]; // In a real TS setup, infer this from T
  title?: string;
  onRowClick?: (row: T) => void;
}

export function SuperTable<T>({ data, columns, title, onRowClick }: SuperTableProps<T>) {
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
      
      {/* 1. TABLE HEADER (Controls) */}
      <div className="flex items-center justify-between p-4 border-b border-nexus-structure bg-nexus-matter">
         <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-nexus-green rounded-full animate-pulse" />
            <span className="nexus-label text-nexus-signal text-xs">
               {title || "DATA_REGISTRY_V1"}
            </span>
            <span className="nexus-label text-nexus-structure">
               // {data.length} RECORDS
            </span>
         </div>
         
         <div className="flex items-center gap-2">
            <div className="relative">
               <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-nexus-noise" />
               <input 
                  type="text" 
                  placeholder="FILTER_SCOPE..." 
                  className="bg-nexus-void border border-nexus-structure h-7 pl-8 pr-3 text-[10px] font-mono text-white focus:border-nexus-green focus:outline-none w-48 transition-colors placeholder:text-nexus-structure"
               />
            </div>
            <button className="h-7 w-7 flex items-center justify-center border border-nexus-structure hover:border-nexus-green text-nexus-noise hover:text-nexus-green transition-colors">
               <Filter className="w-3 h-3" />
            </button>
         </div>
      </div>

      {/* 2. THE GRID (Forensic Layout) */}
      <div className="flex-1 overflow-auto relative">
         <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-nexus-void shadow-[0_1px_0_0_#1f1f1f]">
               {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                     {headerGroup.headers.map((header) => (
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
            
            <tbody className="bg-nexus-matter">
               {table.getRowModel().rows.map((row) => (
                  <tr 
                     key={row.id}
                     onClick={() => onRowClick && onRowClick(row.original as T)}
                     className={cn(
                        "group transition-colors cursor-pointer hover:bg-nexus-subtle/20",
                        "border-b border-nexus-structure/50" // Subtle separator
                     )}
                  >
                     {row.getVisibleCells().map((cell) => (
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

      {/* 3. FOOTER (Metadata) */}
      <div className="p-2 border-t border-nexus-structure bg-nexus-void flex justify-between items-center text-[9px] font-mono text-nexus-structure">
         <span>SYNC_ID: {Math.random().toString(16).slice(2,8).toUpperCase()}</span>
         <span className="text-nexus-green">LIVE_CONNECTION</span>
      </div>

    </NexusCard>
  );
}