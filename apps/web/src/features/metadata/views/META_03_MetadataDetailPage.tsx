'use client';

// ============================================================================
// META_03 - METADATA DETAIL PAGE // THE PRISM
// Full forensic profile of a single metadata record
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Database,
  Key,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Layers,
  ChevronRight,
  ExternalLink,
  Copy,
  Download,
} from 'lucide-react';
import { MetaAppShell } from '@/components/shell/MetaAppShell';
import { MetaPageHeader } from '@/components/MetaPageHeader';
import { kernelClient } from '@/lib/kernel-client';
import type { MetadataRecord } from '@/types/metadata';
import clsx from 'clsx';

interface MetadataDetailPageProps {
  dictId: string;
}

interface HierarchyData {
  record: MetadataRecord;
  parent: MetadataRecord | null;
  children: MetadataRecord[];
  depth: number;
  hierarchy_type?: 'group' | 'transaction' | 'cell'; // Optional - calculated in frontend if missing
}

export function MetadataDetailPage({ dictId }: MetadataDetailPageProps) {
  const router = useRouter();
  const [record, setRecord] = useState<MetadataRecord | null>(null);
  const [hierarchy, setHierarchy] = useState<HierarchyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch metadata record
        const fieldResponse = await kernelClient.getMetadataField(dictId);
        // MetadataFieldResponse is MdmGlobalMetadata directly, need to transform to MetadataRecord
        setRecord(fieldResponse as unknown as MetadataRecord);

        // Fetch hierarchy data
        try {
          const hierarchyResponse = await kernelClient.getMetadataHierarchy(dictId);
          setHierarchy(hierarchyResponse as HierarchyData);
        } catch (hierarchyError) {
          // Hierarchy endpoint might not be available yet, continue without it
          console.warn('Hierarchy data not available:', hierarchyError);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metadata');
        console.error('Error fetching metadata:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (dictId) {
      fetchData();
    }
  }, [dictId]);

  const getHierarchyBadge = (type: string | undefined, record?: MetadataRecord | null) => {
    // Calculate hierarchy type if not provided
    if (!type && record) {
      if (record.is_group) {
        type = 'group';
      } else if (record.parent_dict_id) {
        type = 'cell';
      } else {
        type = 'transaction';
      }
    }

    if (!type) return null;

    const styles = {
      group: 'bg-purple-900/30 text-purple-400 border-purple-800',
      transaction: 'bg-blue-900/30 text-blue-400 border-blue-800',
      cell: 'bg-emerald-900/30 text-emerald-400 border-emerald-800',
    };
    return (
      <span
        className={clsx(
          'px-2 py-1 rounded text-xs font-medium border',
          styles[type as keyof typeof styles] || styles.cell
        )}
      >
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return null;
    const styles = {
      LOCKED: 'bg-red-900/30 text-red-400 border-red-800',
      ACTIVE: 'bg-green-900/30 text-green-400 border-green-800',
      DEPRECATED: 'bg-gray-900/30 text-gray-400 border-gray-800',
    };
    return (
      <span
        className={clsx(
          'px-2 py-1 rounded text-xs font-medium border',
          styles[status as keyof typeof styles] || styles.ACTIVE
        )}
      >
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <MetaAppShell>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#28E7A2] mx-auto mb-4"></div>
            <p className="text-[#666]">Loading metadata record...</p>
          </div>
        </div>
      </MetaAppShell>
    );
  }

  if (error || !record) {
    return (
      <MetaAppShell>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Error Loading Record</h2>
            <p className="text-[#666] mb-4">{error || 'Record not found'}</p>
            <button
              onClick={() => router.push('/meta-registry')}
              className="px-4 py-2 bg-[#28E7A2] text-black rounded hover:bg-[#20D892] transition-colors"
            >
              Back to Registry
            </button>
          </div>
        </div>
      </MetaAppShell>
    );
  }

  return (
    <MetaAppShell>
      <MetaPageHeader
        title={record.business_term}
        subtitle={`${record.dict_id} • ${record.technical_name}`}
        code="META_03"
        variant="default"
      />

      {/* Breadcrumb Navigation */}
      <div className="px-6 py-4 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2 text-sm text-[#666]">
          <button
            onClick={() => router.push('/meta-registry')}
            className="hover:text-[#28E7A2] transition-colors"
          >
            META_02 Registry
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">{record.dict_id}</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{record.business_term}</h1>
                <div className="flex items-center gap-3 flex-wrap">
                  {getHierarchyBadge(hierarchy?.hierarchy_type, record)}
                  {getStatusBadge(record.canon_status)}
                  {record.is_bindable && (
                    <span className="px-2 py-1 rounded text-xs font-medium border bg-blue-900/30 text-blue-400 border-blue-800">
                      Bindable
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/meta-registry')}
                  className="px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded hover:bg-[#222] transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Registry
                </button>
              </div>
            </div>
            <p className="text-[#999] text-sm">{record.definition_full || record.definition_short}</p>
          </div>

          {/* Hierarchy Context */}
          {hierarchy && (hierarchy.parent || hierarchy.children.length > 0) && (
            <div className="mb-8 p-6 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Hierarchy Context
              </h2>
              <div className="space-y-4">
                {hierarchy.parent && (
                  <div>
                    <p className="text-sm text-[#666] mb-2">Parent</p>
                    <button
                      onClick={() => router.push(`/meta-registry/${hierarchy.parent!.dict_id}`)}
                      className="text-[#28E7A2] hover:underline flex items-center gap-2"
                    >
                      {hierarchy.parent.business_term} ({hierarchy.parent.dict_id})
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {hierarchy.children.length > 0 && (
                  <div>
                    <p className="text-sm text-[#666] mb-2">Children ({hierarchy.children.length})</p>
                    <div className="space-y-2">
                      {hierarchy.children.map((child) => (
                        <button
                          key={child.dict_id}
                          onClick={() => router.push(`/meta-registry/${child.dict_id}`)}
                          className="block text-[#28E7A2] hover:underline flex items-center gap-2"
                        >
                          {child.business_term} ({child.dict_id})
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Identity Section */}
            <div className="p-6 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Key className="w-5 h-5" />
                Identity
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-[#666] mb-1">Dictionary ID</dt>
                  <dd className="text-white font-mono">{record.dict_id}</dd>
                </div>
                <div>
                  <dt className="text-sm text-[#666] mb-1">Technical Name</dt>
                  <dd className="text-white font-mono">{record.technical_name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-[#666] mb-1">Version</dt>
                  <dd className="text-white">{record.version}</dd>
                </div>
                <div>
                  <dt className="text-sm text-[#666] mb-1">Business Term</dt>
                  <dd className="text-white">{record.business_term}</dd>
                </div>
              </dl>
            </div>

            {/* Classification Section */}
            <div className="p-6 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Classification
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-[#666] mb-1">Domain</dt>
                  <dd className="text-white">{record.domain}</dd>
                </div>
                <div>
                  <dt className="text-sm text-[#666] mb-1">Entity Group</dt>
                  <dd className="text-white">{record.entity_group}</dd>
                </div>
                <div>
                  <dt className="text-sm text-[#666] mb-1">Classification</dt>
                  <dd className="text-white">{record.classification}</dd>
                </div>
                <div>
                  <dt className="text-sm text-[#666] mb-1">Criticality</dt>
                  <dd className="text-white">{record.criticality}</dd>
                </div>
              </dl>
            </div>

            {/* Governance Section */}
            <div className="p-6 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Governance
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-[#666] mb-1">Canon Status</dt>
                  <dd>{getStatusBadge(record.canon_status)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-[#666] mb-1">Data Owner</dt>
                  <dd className="text-white">{record.data_owner}</dd>
                </div>
                <div>
                  <dt className="text-sm text-[#666] mb-1">Data Steward</dt>
                  <dd className="text-white">{record.data_steward}</dd>
                </div>
                <div>
                  <dt className="text-sm text-[#666] mb-1">Source of Truth</dt>
                  <dd className="text-white">{record.source_of_truth}</dd>
                </div>
                {record.upstream_src && (
                  <div>
                    <dt className="text-sm text-[#666] mb-1">Upstream Source</dt>
                    <dd className="text-white">{record.upstream_src}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Compliance Section */}
            {record.compliance_tags && record.compliance_tags.length > 0 && (
              <div className="p-6 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Compliance
                </h2>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm text-[#666] mb-2">Compliance Tags</dt>
                    <dd className="flex flex-wrap gap-2">
                      {record.compliance_tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 rounded text-xs font-medium border bg-yellow-900/30 text-yellow-400 border-yellow-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </dd>
                  </div>
                  {record.approval_required && (
                    <div>
                      <dt className="text-sm text-[#666] mb-1">Approval Required</dt>
                      <dd>
                        <span className="px-2 py-1 rounded text-xs font-medium border bg-red-900/30 text-red-400 border-red-800">
                          Yes
                        </span>
                      </dd>
                    </div>
                  )}
                  {record.errors_if_wrong && (
                    <div>
                      <dt className="text-sm text-[#666] mb-1">Errors If Wrong</dt>
                      <dd className="text-white text-sm">{record.errors_if_wrong}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>

          {/* Definitions Section */}
          <div className="mt-6 p-6 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
            <h2 className="text-lg font-semibold text-white mb-4">Definitions</h2>
            <dl className="space-y-4">
              {record.definition_short && (
                <div>
                  <dt className="text-sm text-[#666] mb-2">Short Definition</dt>
                  <dd className="text-white">{record.definition_short}</dd>
                </div>
              )}
              {record.definition_full && (
                <div>
                  <dt className="text-sm text-[#666] mb-2">Full Definition</dt>
                  <dd className="text-white whitespace-pre-wrap">{record.definition_full}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </MetaAppShell>
  );
}
