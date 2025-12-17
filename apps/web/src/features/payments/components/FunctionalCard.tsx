// ============================================================================
// COM_PAY_03: FUNCTIONAL CARD - Batch Processing Clusters
// ============================================================================
// Visual representation of functional payment clusters
// Distinguishes: Clean (Green/Approve) vs Anomalies (Yellow/Review)
// ============================================================================

import React from 'react';
import { 
  Zap, 
  Truck, 
  Briefcase, 
  Building2, 
  Package,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Search,
  ArrowRightLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export type ClusterStatus = 'clean' | 'anomalies' | 'blocked';
export type ClusterType = 'utilities' | 'logistics' | 'professional' | 'intercompany' | 'other';

export interface FunctionalClusterData {
  cluster_id: ClusterType;
  cluster_name: string;
  invoice_count: number;
  total_amount: number;
  anomaly_count: number;
  status: ClusterStatus;
  can_batch_approve: boolean;
  block_reason?: string;
}

interface FunctionalCardProps {
  cluster: FunctionalClusterData;
  onApprove: (clusterId: string) => void;
  onReview: (clusterId: string) => void;
  onSettle?: (clusterId: string) => void;
  className?: string;
}

// ============================================================================
// CLUSTER ICONS
// ============================================================================

const CLUSTER_ICONS: Record<ClusterType, React.ElementType> = {
  utilities: Zap,
  logistics: Truck,
  professional: Briefcase,
  intercompany: Building2,
  other: Package,
};

const CLUSTER_COLORS: Record<ClusterType, { bg: string; text: string; border: string }> = {
  utilities: { bg: 'bg-yellow-900/20', text: 'text-yellow-400', border: 'border-yellow-800/50' },
  logistics: { bg: 'bg-blue-900/20', text: 'text-blue-400', border: 'border-blue-800/50' },
  professional: { bg: 'bg-purple-900/20', text: 'text-purple-400', border: 'border-purple-800/50' },
  intercompany: { bg: 'bg-pink-900/20', text: 'text-pink-400', border: 'border-pink-800/50' },
  other: { bg: 'bg-gray-900/20', text: 'text-gray-400', border: 'border-gray-700/50' },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FunctionalCard({ 
  cluster, 
  onApprove, 
  onReview,
  onSettle,
  className,
}: FunctionalCardProps) {
  const Icon = CLUSTER_ICONS[cluster.cluster_id];
  const colors = CLUSTER_COLORS[cluster.cluster_id];
  
  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(amount);
    }
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Status styling
  const getStatusStyle = () => {
    switch (cluster.status) {
      case 'clean':
        return {
          bg: 'bg-emerald-900/10',
          border: 'border-emerald-800/30',
          icon: CheckCircle2,
          iconColor: 'text-emerald-400',
          text: 'CLEAN',
          textColor: 'text-emerald-400',
        };
      case 'anomalies':
        return {
          bg: 'bg-amber-900/10',
          border: 'border-amber-800/30',
          icon: AlertTriangle,
          iconColor: 'text-amber-400',
          text: `${cluster.anomaly_count} ANOMAL${cluster.anomaly_count === 1 ? 'Y' : 'IES'}`,
          textColor: 'text-amber-400',
        };
      case 'blocked':
        return {
          bg: 'bg-red-900/10',
          border: 'border-red-800/30',
          icon: Ban,
          iconColor: 'text-red-400',
          text: 'BLOCKED',
          textColor: 'text-red-400',
        };
    }
  };

  const statusStyle = getStatusStyle();
  const StatusIcon = statusStyle.icon;

  return (
    <div className={cn(
      'flex flex-col bg-[#0A0A0A] border border-[#1F1F1F] rounded overflow-hidden hover:border-[#333] transition-colors',
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-[#1F1F1F]">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded', colors.bg)}>
            <Icon className={cn('w-5 h-5', colors.text)} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{cluster.cluster_name}</h3>
            <p className="text-[10px] text-[#666] font-mono uppercase tracking-wider">
              Global
            </p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="p-4 border-b border-[#1F1F1F]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#666]">📄</span>
            <span className="text-lg font-mono font-bold text-white">
              {cluster.invoice_count}
            </span>
            <span className="text-[11px] text-[#666]">Invoices</span>
          </div>
          
          <div className="w-px h-4 bg-[#1F1F1F]" />
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#666]">💰</span>
            <span className="text-lg font-mono font-bold text-[#28E7A2]">
              {formatCurrency(cluster.total_amount)}
            </span>
          </div>
        </div>
      </div>

      {/* Status Section */}
      <div className={cn(
        'px-4 py-3 border-b border-[#1F1F1F]',
        statusStyle.bg
      )}>
        <div className="flex items-center gap-2">
          <StatusIcon className={cn('w-4 h-4', statusStyle.iconColor)} />
          <span className={cn(
            'text-[11px] font-mono font-bold uppercase tracking-wider',
            statusStyle.textColor
          )}>
            Status: {statusStyle.text}
          </span>
        </div>
        {cluster.block_reason && (
          <p className="text-[10px] text-[#888] mt-1 pl-6">
            {cluster.block_reason}
          </p>
        )}
        {cluster.status === 'clean' && (
          <p className="text-[10px] text-[#666] mt-1 pl-6">
            0 Anomalies found.
          </p>
        )}
      </div>

      {/* Action Button */}
      <div className="p-4 mt-auto">
        {cluster.cluster_id === 'intercompany' ? (
          // Special IC settlement action
          <button
            onClick={() => onSettle?.(cluster.cluster_id)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded border border-purple-900/50 text-purple-400 hover:bg-purple-900/10 font-medium text-sm transition-all"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Settle IC
          </button>
        ) : cluster.can_batch_approve ? (
          // Clean - can batch approve
          <button
            onClick={() => onApprove(cluster.cluster_id)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded bg-[#28E7A2] text-black font-bold text-sm hover:bg-[#20b881] shadow-[0_0_15px_rgba(40,231,162,0.2)] transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Approve Batch
          </button>
        ) : (
          // Anomalies - must review
          <button
            onClick={() => onReview(cluster.cluster_id)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded border border-amber-900/50 text-amber-400 hover:bg-amber-900/10 font-medium text-sm transition-all"
          >
            <Search className="w-4 h-4" />
            Review Risks
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// FUNCTIONAL CARD GRID COMPONENT
// ============================================================================

interface FunctionalCardGridProps {
  clusters: FunctionalClusterData[];
  onApprove: (clusterId: string) => void;
  onReview: (clusterId: string) => void;
  onSettle?: (clusterId: string) => void;
  className?: string;
}

export function FunctionalCardGrid({
  clusters,
  onApprove,
  onReview,
  onSettle,
  className,
}: FunctionalCardGridProps) {
  return (
    <div className={cn(
      'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
      className
    )}>
      {clusters.map(cluster => (
        <FunctionalCard
          key={cluster.cluster_id}
          cluster={cluster}
          onApprove={onApprove}
          onReview={onReview}
          onSettle={onSettle}
        />
      ))}
    </div>
  );
}

export default FunctionalCard;

