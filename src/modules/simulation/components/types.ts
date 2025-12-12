// ============================================================================
// SIMULATION TYPES - Shared type definitions
// ============================================================================

export type ShakeLevel = 'none' | 'light' | 'moderate' | 'critical';

export type LegacyStackItem = {
  id: string;
  label: string;
  risk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
};

export type NexusStackItem = {
  id: string;
  label: string;
  status: 'LOCKED' | 'ACTIVE' | 'LIVE' | 'SECURE' | 'OPTIMAL' | 'SYNCED';
};

export type SimulationState = {
  stage: number;
  shakeLevel: ShakeLevel;
  isCollapsed: boolean;
};

export type SimulationConfig = {
  maxStages: number;
  cycleTimeMs: number;
  collapseDelayMs: number;
  legacyStack: LegacyStackItem[];
  nexusStack: NexusStackItem[];
};
