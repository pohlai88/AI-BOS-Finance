// ============================================================================
// RULE_PAY_03: BATCH APPROVAL LOGIC
// ============================================================================
// Controls batch approval for functional clusters
// Enforces: zero anomalies, no IC, max amount
// ============================================================================

import { useMemo, useCallback, useState } from 'react';
import { 
  PAYMENT_CONFIG, 
  MOCK_PAYMENTS,
  aggregateFunctionalClusters,
  type Payment,
  type FunctionalCluster,
} from '../data';
import type { FunctionalClusterData } from '../components/FunctionalCard';

// ============================================================================
// TYPES
// ============================================================================

export interface BatchValidationResult {
  canBatchApprove: boolean;
  blockReasons: string[];
  anomalyCount: number;
  hasHighValue: boolean;
  hasIC: boolean;
  totalAmount: number;
  paymentCount: number;
}

export interface BatchApprovalState {
  isProcessing: boolean;
  processedCount: number;
  totalCount: number;
  errors: string[];
}

// ============================================================================
// RULE_PAY_03: BATCH VALIDATION FUNCTION
// ============================================================================

export function validateBatchApproval(
  payments: Payment[],
  clusterId: FunctionalCluster,
): BatchValidationResult {
  const { batch_rules, risk_levels } = PAYMENT_CONFIG;
  
  // Filter to cluster payments that are pending
  const clusterPayments = payments.filter(
    p => p.functional_cluster === clusterId && p.status === 'pending'
  );
  
  const blockReasons: string[] = [];
  
  // Check for anomalies (high risk)
  const anomalyCount = clusterPayments.filter(
    p => p.risk_score > risk_levels.medium
  ).length;
  
  if (batch_rules.require_zero_anomalies && anomalyCount > 0) {
    blockReasons.push(`${anomalyCount} anomal${anomalyCount === 1 ? 'y' : 'ies'} require individual review`);
  }
  
  // Check for IC transactions
  const hasIC = clusterPayments.some(p => p.tx_type === 'intercompany');
  if (batch_rules.block_ic_batch && hasIC) {
    blockReasons.push('IC transactions require individual settlement');
  }
  
  // Check for high value items
  const hasHighValue = clusterPayments.some(
    p => p.amount > batch_rules.max_batch_amount
  );
  if (hasHighValue) {
    blockReasons.push(`Items over $${batch_rules.max_batch_amount.toLocaleString()} require individual approval`);
  }
  
  // Calculate totals
  const totalAmount = clusterPayments.reduce((sum, p) => sum + p.amount, 0);
  
  return {
    canBatchApprove: blockReasons.length === 0,
    blockReasons,
    anomalyCount,
    hasHighValue,
    hasIC,
    totalAmount,
    paymentCount: clusterPayments.length,
  };
}

// ============================================================================
// BATCH APPROVAL HOOK
// ============================================================================

export function useBatchApproval(
  payments: Payment[],
  onApprovePayment: (id: string) => void,
) {
  const [state, setState] = useState<BatchApprovalState>({
    isProcessing: false,
    processedCount: 0,
    totalCount: 0,
    errors: [],
  });

  // Get cluster data
  const clusters = useMemo<FunctionalClusterData[]>(() => {
    const raw = aggregateFunctionalClusters();
    return raw.map(c => ({
      cluster_id: c.cluster_id as FunctionalCluster,
      cluster_name: c.cluster_name,
      invoice_count: c.invoice_count,
      total_amount: c.total_amount,
      anomaly_count: c.anomaly_count,
      status: c.status as 'clean' | 'anomalies' | 'blocked',
      can_batch_approve: c.can_batch_approve,
      block_reason: c.can_batch_approve ? undefined : 
        c.anomaly_count > 0 ? `${c.anomaly_count} anomalies require review` :
        c.cluster_id === 'intercompany' ? 'IC transactions require settlement' :
        undefined,
    }));
  }, []);

  // Validate a specific cluster
  const validateCluster = useCallback((clusterId: FunctionalCluster) => {
    return validateBatchApproval(payments, clusterId);
  }, [payments]);

  // Execute batch approval
  const executeBatchApproval = useCallback(async (clusterId: FunctionalCluster) => {
    const validation = validateBatchApproval(payments, clusterId);
    
    if (!validation.canBatchApprove) {
      return {
        success: false,
        errors: validation.blockReasons,
      };
    }
    
    const clusterPayments = payments.filter(
      p => p.functional_cluster === clusterId && p.status === 'pending'
    );
    
    setState({
      isProcessing: true,
      processedCount: 0,
      totalCount: clusterPayments.length,
      errors: [],
    });
    
    const errors: string[] = [];
    
    // Process each payment
    for (let i = 0; i < clusterPayments.length; i++) {
      try {
        onApprovePayment(clusterPayments[i].id);
        setState(prev => ({
          ...prev,
          processedCount: i + 1,
        }));
        // Small delay for UX (shows progress)
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        errors.push(`Failed to approve ${clusterPayments[i].tx_id}`);
      }
    }
    
    setState({
      isProcessing: false,
      processedCount: clusterPayments.length,
      totalCount: clusterPayments.length,
      errors,
    });
    
    return {
      success: errors.length === 0,
      processedCount: clusterPayments.length - errors.length,
      errors,
    };
  }, [payments, onApprovePayment]);

  return {
    clusters,
    state,
    validateCluster,
    executeBatchApproval,
  };
}

// ============================================================================
// CLUSTER SUMMARY HOOK
// ============================================================================

export function useClusterSummary(payments: Payment[]) {
  return useMemo(() => {
    const pending = payments.filter(p => p.status === 'pending');
    
    const summary = {
      total: pending.length,
      totalAmount: pending.reduce((sum, p) => sum + p.amount, 0),
      byCluster: {} as Record<FunctionalCluster, { count: number; amount: number; anomalies: number }>,
      cleanClusters: 0,
      anomalousClusters: 0,
    };
    
    const clusters: FunctionalCluster[] = ['utilities', 'logistics', 'professional', 'intercompany', 'other'];
    
    clusters.forEach(cluster => {
      const clusterPayments = pending.filter(p => p.functional_cluster === cluster);
      const anomalies = clusterPayments.filter(p => p.risk_score > PAYMENT_CONFIG.risk_levels.medium).length;
      
      summary.byCluster[cluster] = {
        count: clusterPayments.length,
        amount: clusterPayments.reduce((sum, p) => sum + p.amount, 0),
        anomalies,
      };
      
      if (clusterPayments.length > 0) {
        if (anomalies === 0 && cluster !== 'intercompany') {
          summary.cleanClusters++;
        } else {
          summary.anomalousClusters++;
        }
      }
    });
    
    return summary;
  }, [payments]);
}

