/**
 * BioOfflineProvider - Offline detection and sync status
 *
 * Provides offline/online detection, sync status indicator,
 * and queued action support.
 *
 * @example
 * <BioOfflineProvider>
 *   <BioOfflineBanner />
 *   <BioSyncIndicator />
 *   {children}
 * </BioOfflineProvider>
 */

'use client';

import * as React from 'react';
import { WifiOff, Wifi, RefreshCw, CloudOff, Cloud, Check } from 'lucide-react';
import { cn } from '../atoms/utils';
import { Txt } from '../atoms/Txt';
import { Btn } from '../atoms/Btn';

// ============================================================
// Types
// ============================================================

export interface QueuedAction {
  id: string;
  type: string;
  payload: unknown;
  timestamp: Date;
  retryCount: number;
}

export interface OfflineContextValue {
  /** Is the app online */
  isOnline: boolean;
  /** Is currently syncing queued actions */
  isSyncing: boolean;
  /** Number of actions waiting to sync */
  pendingCount: number;
  /** Last sync time */
  lastSyncTime: Date | null;
  /** Queue an action for later sync */
  queueAction: (type: string, payload: unknown) => string;
  /** Manually trigger sync */
  triggerSync: () => Promise<void>;
  /** Clear queued actions */
  clearQueue: () => void;
  /** Get queued actions */
  getQueuedActions: () => QueuedAction[];
}

export interface BioOfflineProviderProps {
  children: React.ReactNode;
  /** Callback to process queued actions when back online */
  onSync?: (actions: QueuedAction[]) => Promise<void>;
  /** Auto-sync when back online */
  autoSync?: boolean;
  /** Storage key for persisting queue */
  storageKey?: string;
}

// ============================================================
// Context
// ============================================================

const OfflineContext = React.createContext<OfflineContextValue | null>(null);

// ============================================================
// Provider
// ============================================================

export function BioOfflineProvider({
  children,
  onSync,
  autoSync = true,
  storageKey = 'bioskin_offline_queue',
}: BioOfflineProviderProps) {
  const [isOnline, setIsOnline] = React.useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [lastSyncTime, setLastSyncTime] = React.useState<Date | null>(null);
  const [queue, setQueue] = React.useState<QueuedAction[]>([]);

  // Load queue from storage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setQueue(
          parsed.map((a: QueuedAction) => ({
            ...a,
            timestamp: new Date(a.timestamp),
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }, [storageKey]);

  // Save queue to storage on change
  React.useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }, [queue, storageKey]);

  // Listen for online/offline events
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when back online
  React.useEffect(() => {
    if (isOnline && autoSync && queue.length > 0 && !isSyncing) {
      triggerSync();
    }
  }, [isOnline, autoSync, queue.length, isSyncing]);

  const queueAction = React.useCallback(
    (type: string, payload: unknown): string => {
      const id = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const action: QueuedAction = {
        id,
        type,
        payload,
        timestamp: new Date(),
        retryCount: 0,
      };
      setQueue((prev) => [...prev, action]);
      return id;
    },
    []
  );

  const triggerSync = React.useCallback(async () => {
    if (!onSync || queue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    try {
      await onSync(queue);
      setQueue([]);
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
      // Increment retry count for failed actions
      setQueue((prev) =>
        prev.map((a) => ({ ...a, retryCount: a.retryCount + 1 }))
      );
    } finally {
      setIsSyncing(false);
    }
  }, [onSync, queue, isSyncing]);

  const clearQueue = React.useCallback(() => {
    setQueue([]);
  }, []);

  const getQueuedActions = React.useCallback(() => queue, [queue]);

  const value: OfflineContextValue = {
    isOnline,
    isSyncing,
    pendingCount: queue.length,
    lastSyncTime,
    queueAction,
    triggerSync,
    clearQueue,
    getQueuedActions,
  };

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

// ============================================================
// Hook
// ============================================================

export function useOffline(): OfflineContextValue {
  const context = React.useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within BioOfflineProvider');
  }
  return context;
}

// ============================================================
// Components
// ============================================================

export interface BioOfflineBannerProps {
  className?: string;
}

export function BioOfflineBanner({ className }: BioOfflineBannerProps) {
  const { isOnline, pendingCount } = useOffline();

  if (isOnline) return null;

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 px-4 py-2',
        'bg-status-warning/10 border-b border-status-warning/30',
        className
      )}
    >
      <WifiOff className="h-4 w-4 text-status-warning" />
      <Txt variant="small" className="text-status-warning">
        You're offline.{' '}
        {pendingCount > 0 && (
          <span className="font-medium">
            {pendingCount} {pendingCount === 1 ? 'change' : 'changes'} will sync
            when you're back online.
          </span>
        )}
      </Txt>
    </div>
  );
}

export interface BioSyncIndicatorProps {
  className?: string;
  showWhenSynced?: boolean;
}

export function BioSyncIndicator({
  className,
  showWhenSynced = false,
}: BioSyncIndicatorProps) {
  const { isOnline, isSyncing, pendingCount, lastSyncTime, triggerSync } =
    useOffline();

  if (!isOnline) {
    return (
      <div className={cn('flex items-center gap-1.5 text-status-warning', className)}>
        <CloudOff className="h-4 w-4" />
        <Txt variant="caption" color="inherit">
          Offline
        </Txt>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className={cn('flex items-center gap-1.5 text-accent-primary', className)}>
        <RefreshCw className="h-4 w-4 animate-spin" />
        <Txt variant="caption" color="inherit">
          Syncing...
        </Txt>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <button
        onClick={() => triggerSync()}
        className={cn(
          'flex items-center gap-1.5 text-status-warning hover:text-status-warning/80 transition-colors',
          className
        )}
      >
        <Cloud className="h-4 w-4" />
        <Txt variant="caption" color="inherit">
          {pendingCount} pending
        </Txt>
      </button>
    );
  }

  if (showWhenSynced && lastSyncTime) {
    return (
      <div className={cn('flex items-center gap-1.5 text-status-success', className)}>
        <Check className="h-4 w-4" />
        <Txt variant="caption" color="inherit">
          Synced
        </Txt>
      </div>
    );
  }

  return null;
}

BioOfflineProvider.displayName = 'BioOfflineProvider';
BioOfflineBanner.displayName = 'BioOfflineBanner';
BioSyncIndicator.displayName = 'BioSyncIndicator';
