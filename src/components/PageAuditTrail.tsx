// ============================================================================
// PAGE AUDIT TRAIL - Document Control Footer
// Forensic version control and change tracking for META pages
// ============================================================================

import { useState } from 'react'
import { ChevronRight, X } from 'lucide-react'

export interface AuditEntry {
  timestamp: string // ISO 8601 format
  change: string
  validator?: string
}

export interface PageAuditData {
  pageCode: string
  version: string
  status: 'VERIFIED' | 'DRAFT' | 'DEPRECATED' | 'ACTIVE'
  lastUpdated: string // ISO 8601 format
  validator: string
  classification: string
  recentChanges: AuditEntry[]
  fullHistory?: AuditEntry[]
}

export interface PageAuditTrailProps {
  // Support both full data object and flat props
  data?: PageAuditData
  // Flat props for easier usage
  pageCode?: string
  pageTitle?: string // Additional prop often passed
  version?: string
  status?: string
  lastModified?: string // Maps to lastUpdated
  modifiedBy?: string // Maps to validator
  classification?: string
}

export function PageAuditTrail(props: PageAuditTrailProps) {
  const [showFullHistory, setShowFullHistory] = useState(false)

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
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
      case 'ACTIVE':
        return '#28E7A2'
      case 'DRAFT':
        return '#FFD600'
      case 'DEPRECATED':
        return '#666'
      default:
        return '#666'
    }
  }

  const formatTimestamp = (iso: string) => {
    return iso // Keep ISO format for forensic authenticity
  }

  return (
    <>
      <div className="relative border-t border-[#1F1F1F] bg-[#000000]">
        {/* Top Green Line */}
        <div className="h-[1px] bg-[#28E7A2]" />

        {/* HUD Grid Background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(#28E7A2 1px, transparent 1px), linear-gradient(90deg, #28E7A2 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative px-12 py-8">
          {/* Section Header */}
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-3">
              <div className="h-1 w-1 animate-pulse bg-[#28E7A2]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#666]">
                05 // Document Control
              </span>
            </div>
            <h3 className="font-mono text-sm tracking-wide text-white">
              VERSION AUDIT TRAIL
            </h3>
          </div>

          {/* Main Audit Panel */}
          <div className="relative border border-[#1F1F1F] bg-[#0A0A0A]">
            {/* Top Inner Glow */}
            <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#333] to-transparent" />

            <div className="p-6">
              {/* Metadata Grid */}
              <div className="mb-6 grid grid-cols-4 gap-6 border-b border-[#1F1F1F] pb-6">
                {/* Version */}
                <div>
                  <div className="mb-2 font-mono text-[9px] uppercase tracking-wider text-[#666]">
                    Version
                  </div>
                  <div className="inline-flex items-center gap-2 border border-[#28E7A2]/30 bg-[#28E7A2]/5 px-3 py-1.5">
                    <span className="font-mono text-sm tracking-wider text-[#28E7A2]">
                      {data.version}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <div className="mb-2 font-mono text-[9px] uppercase tracking-wider text-[#666]">
                    Status
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
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
                  <div className="mb-2 font-mono text-[9px] uppercase tracking-wider text-[#666]">
                    Last Updated
                  </div>
                  <div className="font-mono text-[11px] text-[#999]">
                    {formatTimestamp(data.lastUpdated)}
                  </div>
                </div>

                {/* Classification */}
                <div>
                  <div className="mb-2 font-mono text-[9px] uppercase tracking-wider text-[#666]">
                    Classification
                  </div>
                  <div className="font-mono text-[11px] uppercase tracking-wider text-[#999]">
                    {data.classification}
                  </div>
                </div>
              </div>

              {/* Validator */}
              <div className="mb-6 border-b border-[#1F1F1F] pb-6">
                <div className="mb-2 font-mono text-[9px] uppercase tracking-wider text-[#666]">
                  Validator
                </div>
                <div className="font-mono text-[11px] tracking-wider text-[#28E7A2]">
                  {data.validator}
                </div>
              </div>

              {/* Recent Changes */}
              <div>
                <div className="mb-4 font-mono text-[10px] uppercase tracking-wider text-white">
                  Recent Changes
                </div>
                <div className="space-y-2">
                  {(data.recentChanges || []).map((entry, index) => (
                    <div key={index} className="group flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0">
                        <ChevronRight className="h-3 w-3 text-[#28E7A2]" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-3">
                          <span className="font-mono text-[10px] text-[#666]">
                            {formatTimestamp(entry.timestamp)}
                          </span>
                          {entry.validator && (
                            <>
                              <div className="h-2 w-[1px] bg-[#333]" />
                              <span className="font-mono text-[9px] uppercase tracking-wider text-[#555]">
                                {entry.validator}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="font-mono text-[11px] leading-relaxed text-[#999]">
                          {entry.change}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* View Full History Button */}
              {data.fullHistory &&
                data.fullHistory.length > data.recentChanges.length && (
                  <div className="mt-6 border-t border-[#1F1F1F] pt-6">
                    <button
                      onClick={() => setShowFullHistory(true)}
                      className="group flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#666] transition-colors hover:text-[#28E7A2]"
                    >
                      <span>View Full Audit Trail</span>
                      <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                )}
            </div>

            {/* Corner Crosshairs */}
            <div className="absolute left-2 top-2 h-3 w-3 border-l border-t border-[#28E7A2]/30" />
            <div className="absolute right-2 top-2 h-3 w-3 border-r border-t border-[#28E7A2]/30" />
            <div className="absolute bottom-2 left-2 h-3 w-3 border-b border-l border-[#28E7A2]/30" />
            <div className="absolute bottom-2 right-2 h-3 w-3 border-b border-r border-[#28E7A2]/30" />

            {/* HUD Coordinates */}
            <div className="absolute left-8 top-2 font-mono text-[7px] uppercase text-[#333]">
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
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowFullHistory(false)}
          />

          {/* Modal Panel */}
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-8">
            <div className="pointer-events-auto relative max-h-[80vh] w-full max-w-3xl overflow-hidden border-2 border-[#28E7A2] bg-[#000000]">
              {/* HUD Grid Background */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage:
                    'linear-gradient(#28E7A2 1px, transparent 1px), linear-gradient(90deg, #28E7A2 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />

              {/* Header */}
              <div className="relative border-b border-[#1F1F1F]">
                <div className="h-[1px] bg-[#28E7A2]" />
                <div className="flex items-center justify-between px-8 py-6">
                  <div>
                    <h2 className="mb-1 font-mono text-lg tracking-wide text-white">
                      FULL AUDIT TRAIL
                    </h2>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                      {data.pageCode} // Complete Version History
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFullHistory(false)}
                    className="group flex h-8 w-8 items-center justify-center border border-[#333] transition-colors hover:border-[#28E7A2]"
                  >
                    <X className="h-4 w-4 text-[#666] group-hover:text-[#28E7A2]" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="relative max-h-[calc(80vh-120px)] overflow-y-auto px-8 py-6">
                <div className="space-y-3">
                  {data.fullHistory.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 border-b border-[#1F1F1F] pb-3 last:border-0"
                    >
                      <div className="mt-1 flex-shrink-0">
                        <div className="h-2 w-2 rotate-45 border border-[#28E7A2]" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-3">
                          <span className="font-mono text-[10px] text-[#28E7A2]">
                            {formatTimestamp(entry.timestamp)}
                          </span>
                          {entry.validator && (
                            <>
                              <div className="h-2 w-[1px] bg-[#333]" />
                              <span className="font-mono text-[9px] uppercase tracking-wider text-[#666]">
                                {entry.validator}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="font-mono text-[11px] leading-relaxed text-[#999]">
                          {entry.change}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Corner Crosshairs */}
              <div className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-[#28E7A2]/50" />
              <div className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-[#28E7A2]/50" />
              <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-[#28E7A2]/50" />
              <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-[#28E7A2]/50" />
            </div>
          </div>
        </>
      )}
    </>
  )
}
