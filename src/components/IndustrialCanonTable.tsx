import React from 'react'
import { IndustrialCanonRecord } from '../mock-data'/industrialCanon'

interface IndustrialCanonTableProps {
  data: IndustrialCanonRecord[]
}

export function IndustrialCanonTable({ data }: IndustrialCanonTableProps) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-[#1F1F1F] bg-[#0A0A0A]">
      <div className="flex items-center justify-between border-b border-[#1F1F1F] bg-[#0F0F0F] p-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-[#28E7A2]" />
          <h3 className="font-mono text-sm uppercase tracking-widest text-[#EEE]">
            Industrial Canon Registry
          </h3>
        </div>
        <div className="font-mono text-[10px] text-[#666]">REF_ARCH_v1.0</div>
      </div>

      <table className="w-full table-fixed border-collapse text-left">
        <thead>
          <tr className="border-b border-[#1F1F1F] bg-[#111]">
            <th className="w-24 px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-[#666]">
              ID
            </th>
            <th className="w-40 px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-[#666]">
              System
            </th>
            <th className="w-32 px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-[#666]">
              Type
            </th>
            <th className="w-1/4 px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-[#666]">
              Domain Strength
            </th>
            <th className="w-32 px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-[#666]">
              Access
            </th>
            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-[#28E7A2]">
              NexusCanon Usage
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1F1F1F]">
          {data.map((record) => (
            <tr
              key={record.id}
              className="group transition-colors hover:bg-[#151515]"
            >
              <td className="px-4 py-3 font-mono text-xs text-[#28E7A2] opacity-70 group-hover:opacity-100">
                {record.id}
              </td>
              <td className="px-4 py-3 text-sm font-medium text-[#EEE] group-hover:text-white">
                {record.system}
              </td>
              <td className="px-4 py-3 text-xs text-[#CCC]">
                <span className="inline-block rounded border border-[#333] bg-[#111] px-2 py-0.5 font-mono text-[10px]">
                  {record.type}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-[#888] group-hover:text-[#AAA]">
                {record.domain_strength}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-[#666]">
                {record.access_level}
              </td>
              <td className="border-l border-[#1F1F1F] bg-[#0C0C0C] px-4 py-3 text-xs text-[#EEE] group-hover:bg-[#111]">
                {record.nexus_usage}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
