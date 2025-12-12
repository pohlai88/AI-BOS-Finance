/**
 * FieldContextSidebar - The "Silent Killer" UI
 * 
 * Displays complete field context fetched from Kernel API.
 * Shows field definition, lineage summary, AI suggestions, and quality signals.
 * 
 * @see GET /metadata/context/field/{dict_id}
 * @see useFieldContext hook
 */

'use client';

import React from 'react';
import { useFieldContext } from '@/hooks/useFieldContext';
import {
  Layers,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  TrendingUp,
  Shield,
  Link2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FieldContextResponse } from '@aibos/schemas/kernel';

interface FieldContextSidebarProps {
  dictId: string | null;
  onClose?: () => void;
}

export function FieldContextSidebar({ dictId, onClose }: FieldContextSidebarProps) {
  const { data, isLoading, error, refetch } = useFieldContext({ dictId });

  // Empty state
  if (!dictId) {
    return (
      <div className="h-full border-l border-[#1F1F1F] bg-[#050505] p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-[#111] border border-[#333] flex items-center justify-center mb-4">
          <Layers className="w-6 h-6 text-[#666]" />
        </div>
        <h3 className="text-[#888] font-mono text-sm uppercase tracking-wider mb-2">
          No Field Selected
        </h3>
        <p className="text-[#666] text-xs max-w-[200px]">
          Select a metadata field to view its complete context from the Kernel.
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full border-l border-[#1F1F1F] bg-[#050505] p-8 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#28E7A2] animate-spin mb-4" />
        <p className="text-[#888] text-sm font-mono">Consulting Kernel...</p>
        <p className="text-[#666] text-xs mt-2">Fetching field context</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full border-l border-[#1F1F1F] bg-[#050505] p-8 flex flex-col items-center justify-center text-center">
        <XCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-red-400 font-mono text-sm uppercase tracking-wider mb-2">
          Connection Failed
        </h3>
        <p className="text-[#666] text-xs max-w-[200px] mb-4">
          {error.message || 'Could not connect to Kernel'}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-[#1F1F1F] border border-[#333] text-[#CCC] text-xs font-mono hover:bg-[#2A2A2A] transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // No data state
  if (!data || !data.field) {
    return (
      <div className="h-full border-l border-[#1F1F1F] bg-[#050505] p-8 flex flex-col items-center justify-center text-center">
        <FileText className="w-12 h-12 text-[#666] mb-4" />
        <h3 className="text-[#888] font-mono text-sm uppercase tracking-wider mb-2">
          Field Not Found
        </h3>
        <p className="text-[#666] text-xs max-w-[200px]">
          Field {dictId} not found in Kernel database.
        </p>
      </div>
    );
  }

  const { field, lineage_summary, ai_suggestions, quality_signals } = data;

  return (
    <div className="h-full border-l border-[#1F1F1F] bg-[#050505] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[#1F1F1F] bg-[#0A0A0A] shrink-0">
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-[10px] text-[#28E7A2] uppercase tracking-widest">
            {field.dict_id || dictId}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#1F1F1F] rounded text-[#666] hover:text-white transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
        <h2 className="text-xl text-white font-medium leading-tight mb-2">
          {field.label || field.dict_id}
        </h2>
        {field.business_definition && (
          <p className="text-[#888] text-xs leading-relaxed border-l-2 border-[#333] pl-3 mt-3">
            {field.business_definition}
          </p>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Field Metadata */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-mono text-[#666] uppercase tracking-widest flex items-center gap-2">
            <FileText className="w-3 h-3" /> Field Definition
          </h3>
          <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-sm p-4 space-y-3">
            <div>
              <div className="text-[10px] text-[#666] uppercase mb-1">Canonical Key</div>
              <div className="text-sm text-[#28E7A2] font-mono">{field.canonical_key || '—'}</div>
            </div>
            {field.domain && (
              <div>
                <div className="text-[10px] text-[#666] uppercase mb-1">Domain</div>
                <div className="text-xs text-white">{field.domain}</div>
              </div>
            )}
            {field.entity_group && (
              <div>
                <div className="text-[10px] text-[#666] uppercase mb-1">Entity Group</div>
                <div className="text-xs text-white">{field.entity_group}</div>
              </div>
            )}
            {field.classification && (
              <div>
                <div className="text-[10px] text-[#666] uppercase mb-1">Classification</div>
                <div className="text-xs text-white">{field.classification}</div>
              </div>
            )}
          </div>
        </div>

        {/* Lineage Summary */}
        {lineage_summary && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-mono text-[#666] uppercase tracking-widest flex items-center gap-2">
              <Link2 className="w-3 h-3" /> Data Lineage
            </h3>
            <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-sm p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-[#666] uppercase mb-1">Upstream</div>
                  <div className="text-lg text-white font-mono">
                    {lineage_summary.upstream_count || 0}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[#666] uppercase mb-1">Downstream</div>
                  <div className="text-lg text-white font-mono">
                    {lineage_summary.downstream_count || 0}
                  </div>
                </div>
              </div>
              {lineage_summary.critical_paths && lineage_summary.critical_paths.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#1F1F1F]">
                  <div className="text-[10px] text-[#666] uppercase mb-2">Critical Paths</div>
                  <div className="space-y-1">
                    {lineage_summary.critical_paths.map((path, i) => (
                      <div key={i} className="text-xs text-[#888] font-mono">{path}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quality Signals */}
        {quality_signals && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-mono text-[#666] uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-3 h-3" /> Quality Signals
            </h3>
            <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-sm p-4">
              <div className="mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-[#666] uppercase">Completeness</span>
                  <span className="text-xs font-mono text-[#28E7A2]">
                    {quality_signals.completeness_score
                      ? `${Math.round(quality_signals.completeness_score * 100)}%`
                      : '—'}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#1F1F1F] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#28E7A2] transition-all"
                    style={{
                      width: `${(quality_signals.completeness_score || 0) * 100}%`,
                    }}
                  />
                </div>
              </div>
              {quality_signals.freshness && (
                <div className="mb-2">
                  <div className="text-[10px] text-[#666] uppercase mb-1">Last Updated</div>
                  <div className="text-xs text-white font-mono">
                    {new Date(quality_signals.freshness).toLocaleDateString()}
                  </div>
                </div>
              )}
              {quality_signals.anomalies && quality_signals.anomalies.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#1F1F1F]">
                  <div className="text-[10px] text-[#666] uppercase mb-2">Anomalies</div>
                  <div className="space-y-1">
                    {quality_signals.anomalies.map((anomaly, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs text-amber-400"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {anomaly}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Suggestions */}
        {ai_suggestions && ai_suggestions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-mono text-[#666] uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> AI Suggestions
            </h3>
            <div className="space-y-2">
              {ai_suggestions.map((suggestion, i) => (
                <div
                  key={i}
                  className={cn(
                    'bg-[#0F0F0F] border rounded-sm p-3',
                    suggestion.type === 'mapping' && 'border-blue-900/30',
                    suggestion.type === 'quality' && 'border-amber-900/30',
                    suggestion.type === 'compliance' && 'border-red-900/30',
                    suggestion.type === 'optimization' && 'border-[#28E7A2]/30'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase text-[#666]">
                      {suggestion.type}
                    </span>
                    <span className="text-[10px] text-[#888]">
                      {Math.round(suggestion.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-xs text-white">{suggestion.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Owner Information */}
        {data.owner && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-mono text-[#666] uppercase tracking-widest flex items-center gap-2">
              <Shield className="w-3 h-3" /> Ownership
            </h3>
            <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-sm p-4">
              <div className="text-sm text-white font-medium">{data.owner.name}</div>
              {data.owner.email && (
                <div className="text-xs text-[#888] mt-1">{data.owner.email}</div>
              )}
              {data.owner.role && (
                <div className="text-[10px] text-[#666] uppercase mt-2">{data.owner.role}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FieldContextSidebar;
