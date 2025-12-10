// ============================================================================
// PAGE AUDIT TRAIL - Document Control Footer
// Forensic version control and change tracking for META pages
// ============================================================================

import { useState } from 'react';
import { ChevronRight, X } from 'lucide-react';

export interface AuditEntry {
  timestamp: string; // ISO 8601 format
  change: string;
  validator?: string;
}

export interface PageAuditData {
  pageCode: string;
  version: string;
  status: 'VERIFIED' | 'DRAFT' | 'DEPRECATED' | 'ACTIVE';
  lastUpdated: string; // ISO 8601 format
  validator: string;
  classification: string;
  recentChanges: AuditEntry[];
  fullHistory?: AuditEntry[];
}

export interface PageAuditTrailProps {
  // Support both full data object and flat props
  data?: PageAuditData;
  // Flat props for easier usage
  pageCode?: string;
  pageTitle?: string; // Additional prop often passed
  version?: string;
  status?: string;
  lastModified?: string; // Maps to lastUpdated
  modifiedBy?: string; // Maps to validator
  classification?: string;
}

export function PageAuditTrail(props: PageAuditTrailProps) {
  const [showFullHistory, setShowFullHistory] = useState(false);

  // Normalize props into a data object
  const data: PageAuditData = props.data || {
    pageCode: props.pageCode || 'UNKNOWN',
    version: props.version || '0.0.0',
    status: (props.status as any) || 'ACTIVE',
    lastUpdated: props.lastModified || new Date().toISOString(),
    validator: props.modifiedBy || 'SYSTEM',
    classification: props.classification || 'UNCLASSIFIED',
    recentChanges: [
      {
        timestamp: props.lastModified || new Date().toISOString(),
        change: 'System automated build',
        validator: props.modifiedBy || 'SYSTEM',
      },
    ],
    fullHistory: [],
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
      case 'ACTIVE':
        return '#28E7A2';
      case 'DRAFT':
        return '#FFD600';
      case 'DEPRECATED':
        return '#666';
      default:
        return '#666';
    }
  };

  const formatTimestamp = (iso: string) => {
    return iso; // Keep ISO format for forensic authenticity
  };

  return (
    <>
      <div className="border-t border-[#1F1F1F] bg-[#000000] relative">
        {/* Top Green Line */}
        <div className="h-[1px] bg-[#28E7A2]" />

        {/* HUD Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(#28E7A2 1px, transparent 1px), linear-gradient(90deg, #28E7A2 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative px-12 py-8">
          {/* Section Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-1 bg-[#28E7A2] animate-pulse" />
              <span className="font-mono text-[10px] tracking-[0.15em] text-[#666] uppercase">
                05 // Document Control
              </span>
            </div>
            <h3 className="font-mono text-sm text-white tracking-wide">VERSION AUDIT TRAIL</h3>
          </div>

          {/* Main Audit Panel */}
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] relative">
            {/* Top Inner Glow */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#333] to-transparent" />

            <div className="p-6">
              {/* Metadata Grid */}
              <div className="grid grid-cols-4 gap-6 mb-6 pb-6 border-b border-[#1F1F1F]">
                {/* Version */}
                <div>
                  <div className="font-mono text-[9px] text-[#666] uppercase tracking-wider mb-2">
                    Version
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#28E7A2]/30 bg-[#28E7A2]/5">
                    <span className="font-mono text-sm text-[#28E7A2] tracking-wider">
                      {data.version}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <div className="font-mono text-[9px] text-[#666] uppercase tracking-wider mb-2">
                    Status
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: getStatusColor(data.status),
                        animation:
                          data.status === 'VERIFIED' || data.status === 'ACTIVE'
                            ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                            : 'none',
                      }}
                    />
                    <span
                      className="font-mono text-sm tracking-wider"
                      style={{ color: getStatusColor(data.status) }}
                    >
                      {data.status}
                    </span>
                  </div>
                </div>

                {/* Last Updated */}
                <div>
                  <div className="font-mono text-[9px] text-[#666] uppercase tracking-wider mb-2">
                    Last Updated
                  </div>
                  <div className="font-mono text-[11px] text-[#999]">
                    {formatTimestamp(data.lastUpdated)}
                  </div>
                </div>

                {/* Classification */}
                <div>
                  <div className="font-mono text-[9px] text-[#666] uppercase tracking-wider mb-2">
                    Classification
                  </div>
                  <div className="font-mono text-[11px] text-[#999] uppercase tracking-wider">
                    {data.classification}
                  </div>
                </div>
              </div>

              {/* Validator */}
              <div className="mb-6 pb-6 border-b border-[#1F1F1F]">
                <div className="font-mono text-[9px] text-[#666] uppercase tracking-wider mb-2">
                  Validator
                </div>
                <div className="font-mono text-[11px] text-[#28E7A2] tracking-wider">
                  {data.validator}
                </div>
              </div>

              {/* Recent Changes */}
              <div>
                <div className="font-mono text-[10px] text-white uppercase tracking-wider mb-4">
                  Recent Changes
                </div>
                <div className="space-y-2">
                  {(data.recentChanges || []).map((entry, index) => (
                    <div key={index} className="flex items-start gap-3 group">
                      <div className="flex-shrink-0 mt-1">
                        <ChevronRight className="w-3 h-3 text-[#28E7A2]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono text-[10px] text-[#666]">
                            {formatTimestamp(entry.timestamp)}
                          </span>
                          {entry.validator && (
                            <>
                              <div className="w-[1px] h-2 bg-[#333]" />
                              <span className="font-mono text-[9px] text-[#555] uppercase tracking-wider">
                                {entry.validator}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-[#999] leading-relaxed">
                          {entry.change}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* View Full History Button */}
              {data.fullHistory && data.fullHistory.length > data.recentChanges.length && (
                <div className="mt-6 pt-6 border-t border-[#1F1F1F]">
                  <button
                    onClick={() => setShowFullHistory(true)}
                    className="group flex items-center gap-2 font-mono text-[10px] text-[#666] uppercase tracking-wider hover:text-[#28E7A2] transition-colors"
                  >
                    <span>View Full Audit Trail</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
            </div>

            {/* Corner Crosshairs */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-[#28E7A2]/30" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-[#28E7A2]/30" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-[#28E7A2]/30" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-[#28E7A2]/30" />

            {/* HUD Coordinates */}
            <div className="absolute top-2 left-8 font-mono text-[7px] text-[#333] uppercase">
              AUDIT_{data.pageCode}
            </div>
          </div>
        </div>
      </div>

      {/* Full History Modal */}
      {showFullHistory && data.fullHistory && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={() => setShowFullHistory(false)}
          />

          {/* Modal Panel */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-8 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-3xl max-h-[80vh] bg-[#000000] border-2 border-[#28E7A2] relative overflow-hidden">
              {/* HUD Grid Background */}
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(#28E7A2 1px, transparent 1px), linear-gradient(90deg, #28E7A2 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />

              {/* Header */}
              <div className="relative border-b border-[#1F1F1F]">
                <div className="h-[1px] bg-[#28E7A2]" />
                <div className="px-8 py-6 flex items-center justify-between">
                  <div>
                    <h2 className="font-mono text-lg text-white tracking-wide mb-1">
                      FULL AUDIT TRAIL
                    </h2>
                    <div className="font-mono text-[10px] text-[#666] uppercase tracking-wider">
                      {data.pageCode} // Complete Version History
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFullHistory(false)}
                    className="w-8 h-8 border border-[#333] hover:border-[#28E7A2] flex items-center justify-center transition-colors group"
                  >
                    <X className="w-4 h-4 text-[#666] group-hover:text-[#28E7A2]" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="relative overflow-y-auto max-h-[calc(80vh-120px)] px-8 py-6">
                <div className="space-y-3">
                  {data.fullHistory.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 pb-3 border-b border-[#1F1F1F] last:border-0"
                    >
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-2 h-2 border border-[#28E7A2] rotate-45" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono text-[10px] text-[#28E7A2]">
                            {formatTimestamp(entry.timestamp)}
                          </span>
                          {entry.validator && (
                            <>
                              <div className="w-[1px] h-2 bg-[#333]" />
                              <span className="font-mono text-[9px] text-[#666] uppercase tracking-wider">
                                {entry.validator}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-[#999] leading-relaxed">
                          {entry.change}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Corner Crosshairs */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#28E7A2]/50" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#28E7A2]/50" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#28E7A2]/50" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#28E7A2]/50" />
            </div>
          </div>
        </>
      )}
    </>
  );
}
