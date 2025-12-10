import React from 'react';
import { IndustrialCanonRecord } from '../data/industrialCanon';

interface IndustrialCanonTableProps {
  data: IndustrialCanonRecord[];
}

export function IndustrialCanonTable({ data }: IndustrialCanonTableProps) {
  return (
    <div className="w-full overflow-hidden border border-[#1F1F1F] bg-[#0A0A0A] rounded-lg">
      <div className="border-b border-[#1F1F1F] bg-[#0F0F0F] p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#28E7A2]" />
          <h3 className="font-mono text-sm text-[#EEE] uppercase tracking-widest">Industrial Canon Registry</h3>
        </div>
        <div className="font-mono text-[10px] text-[#666]">REF_ARCH_v1.0</div>
      </div>
      
      <table className="w-full text-left border-collapse table-fixed">
        <thead>
          <tr className="bg-[#111] border-b border-[#1F1F1F]">
            <th className="py-3 px-4 font-mono text-[10px] text-[#666] uppercase tracking-wider w-24">ID</th>
            <th className="py-3 px-4 font-mono text-[10px] text-[#666] uppercase tracking-wider w-40">System</th>
            <th className="py-3 px-4 font-mono text-[10px] text-[#666] uppercase tracking-wider w-32">Type</th>
            <th className="py-3 px-4 font-mono text-[10px] text-[#666] uppercase tracking-wider w-1/4">Domain Strength</th>
            <th className="py-3 px-4 font-mono text-[10px] text-[#666] uppercase tracking-wider w-32">Access</th>
            <th className="py-3 px-4 font-mono text-[10px] text-[#28E7A2] uppercase tracking-wider">NexusCanon Usage</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1F1F1F]">
          {data.map((record) => (
            <tr key={record.id} className="group hover:bg-[#151515] transition-colors">
              <td className="py-3 px-4 font-mono text-xs text-[#28E7A2] opacity-70 group-hover:opacity-100">
                {record.id}
              </td>
              <td className="py-3 px-4 font-medium text-sm text-[#EEE] group-hover:text-white">
                {record.system}
              </td>
              <td className="py-3 px-4 text-xs text-[#CCC]">
                <span className="inline-block px-2 py-0.5 rounded border border-[#333] bg-[#111] text-[10px] font-mono">
                  {record.type}
                </span>
              </td>
              <td className="py-3 px-4 text-xs text-[#888] group-hover:text-[#AAA]">
                {record.domain_strength}
              </td>
              <td className="py-3 px-4 text-xs text-[#666] font-mono">
                {record.access_level}
              </td>
              <td className="py-3 px-4 text-xs text-[#EEE] border-l border-[#1F1F1F] bg-[#0C0C0C] group-hover:bg-[#111]">
                {record.nexus_usage}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
