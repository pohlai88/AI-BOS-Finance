import { useMemo } from "react";
import { SuperTable } from "@/components/metadata/SuperTable";
import { createColumnHelper } from "@tanstack/react-table";
import { NexusButton } from "@/components/nexus/NexusButton";
import { cn } from "@/lib/utils";

// 1. Define the Schema (Forensic Record)
type ForensicRecord = {
  id: string;
  entity: string;
  type: "TRANSACTION" | "ADJUSTMENT" | "VALUATION";
  value: number;
  status: "LOCKED" | "PENDING" | "FLAGGED";
  hash: string;
};

// 2. Generate Mock Data
const DATA: ForensicRecord[] = Array.from({ length: 20 }).map((_, i) => ({
  id: `REC-${1000 + i}`,
  entity: i % 3 === 0 ? "US_HOLDING_CORP" : "EU_SUBSIDIARY_LTD",
  type: i % 4 === 0 ? "VALUATION" : "TRANSACTION",
  value: Math.floor(Math.random() * 10000000),
  status: i % 5 === 0 ? "FLAGGED" : i % 2 === 0 ? "LOCKED" : "PENDING",
  hash: Math.random().toString(36).substring(7).toUpperCase(),
}));

export const MetadataGodView = () => {
  const columnHelper = createColumnHelper<ForensicRecord>();

  // 3. Define Columns (Schema-First)
  const columns = useMemo(() => [
    columnHelper.accessor("id", {
      header: "RECORD_ID",
      cell: info => <span className="text-nexus-signal font-bold">{info.getValue()}</span>
    }),
    columnHelper.accessor("entity", {
      header: "LEGAL_ENTITY",
    }),
    columnHelper.accessor("type", {
      header: "CLASS",
    }),
    columnHelper.accessor("value", {
      header: "NOTIONAL_VALUE",
      cell: info => (
         <span className="text-nexus-signal">
            ${info.getValue().toLocaleString()}
         </span>
      )
    }),
    columnHelper.accessor("status", {
      header: "STATE",
      cell: info => {
         const status = info.getValue();
         return (
            <div className="flex items-center gap-2">
               <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  status === "LOCKED" && "bg-nexus-green shadow-[0_0_8px_#28E7A2]",
                  status === "PENDING" && "bg-yellow-500",
                  status === "FLAGGED" && "bg-red-500 animate-pulse"
               )} />
               <span className={cn(
                  status === "LOCKED" && "text-nexus-green",
                  status === "FLAGGED" && "text-red-500"
               )}>
                  {status}
               </span>
            </div>
         )
      }
    }),
    columnHelper.accessor("hash", {
      header: "BLOCK_HASH",
      cell: info => <span className="text-[10px] opacity-50">{info.getValue()}</span>
    }),
  ], []);

  return (
    <div className="min-h-screen bg-nexus-void p-8 space-y-8">
       {/* Page Header */}
       <div className="flex items-end justify-between border-b border-nexus-structure pb-6">
          <div>
             <span className="nexus-label text-nexus-green">System Registry</span>
             <h1 className="text-3xl text-white font-medium tracking-tight mt-1">Global Metadata Index</h1>
          </div>
          <NexusButton variant="primary">EXPORT AUDIT LOG</NexusButton>
       </div>

       {/* The Forensic Table */}
       <SuperTable data={DATA} columns={columns} title="MASTER_LEDGER_V1" />
    </div>
  );
};