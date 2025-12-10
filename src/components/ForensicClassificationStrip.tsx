import React from 'react';
import { Link } from 'react-router-dom';
import { NexusCanonLogoCircular } from '../NexusCanonLogoCircular';

interface ForensicStripProps {
  code: string;
  status?: string;
}

export function ForensicClassificationStrip({ code, status = 'ACTIVE' }: ForensicStripProps) {
  return (
    <div className="border-b border-[#1F1F1F] bg-[#000000]">
      {/* Top Green Line */}
      <div className="h-[1px] bg-[#28E7A2]" />

      {/* Content */}
      <div className="flex items-center justify-between px-6 md:px-12 h-12">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
            title="Return to Home"
          >
            <NexusCanonLogoCircular size="sm" />
          </Link>
          <div className="w-[1px] h-3 bg-[#333]" />
          <span className="font-mono text-[10px] md:text-[12px] tracking-[0.15em] text-[#666] uppercase">
            Classified // Forensic Metadata
          </span>
          <div className="w-[1px] h-3 bg-[#333]" />
          <span className="font-mono text-[10px] md:text-[12px] tracking-[0.15em] text-[#28E7A2] uppercase">
            {code}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-1.5 h-1.5 rounded-full ${status === 'CRITICAL' ? 'bg-[#FF3333]' : 'bg-[#28E7A2]'} animate-pulse`}
          />
          <span
            className={`font-mono text-[10px] md:text-[12px] tracking-[0.15em] ${status === 'CRITICAL' ? 'text-[#FF3333]' : 'text-[#666]'} uppercase`}
          >
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}
