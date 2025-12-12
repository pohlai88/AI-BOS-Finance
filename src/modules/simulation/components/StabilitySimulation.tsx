// ============================================================================
// STABILITY SIMULATION - Refactored with proper architecture
// Pure presentation component - logic extracted to useSimulationController
// Data decoupled and passed via config
// ============================================================================

'use client';

import { useSimulationController } from './useSimulationController';
import { ForensicHeader, LegacyStack, NexusStack } from './primitives';
import type { LegacyStackItem, NexusStackItem, SimulationConfig } from './types';

// --- DEFAULT CONFIGURATION ---
const DEFAULT_LEGACY_STACK: LegacyStackItem[] = [
  { id: 'L01', label: 'LEGACY_ERP_CORE', risk: 'HIGH' },
  { id: 'L02', label: 'UNPATCHED_MIDDLEWARE', risk: 'CRITICAL' },
  { id: 'L03', label: 'V1_API_GATEWAY', risk: 'MODERATE' },
  { id: 'L04', label: 'ON_PREM_DATABASE', risk: 'LOW' },
  { id: 'L05', label: 'CUSTOM_GL_SCRIPTS', risk: 'CRITICAL' },
  { id: 'L06', label: 'BATCH_PROCESS_DAEMON', risk: 'HIGH' },
];

const DEFAULT_NEXUS_STACK: NexusStackItem[] = [
  { id: 'N01', label: 'IMMUTABLE_LEDGER', status: 'LOCKED' },
  { id: 'N02', label: 'SMART_CONTRACT_V2', status: 'ACTIVE' },
  { id: 'N03', label: 'REAL_TIME_AUDIT', status: 'LIVE' },
  { id: 'N04', label: 'ZERO_TRUST_AUTH', status: 'SECURE' },
  { id: 'N05', label: 'AUTO_RECONCILIATION', status: 'OPTIMAL' },
  { id: 'N06', label: 'TAX_COMPLIANCE_BOT', status: 'SYNCED' },
];

// --- COMPONENT PROPS ---
interface StabilitySimulationProps {
  config?: Partial<SimulationConfig>;
  legacyStack?: LegacyStackItem[];
  nexusStack?: NexusStackItem[];
  title?: string;
  subtitle?: string;
}

// --- MAIN COMPONENT ---
export default function StabilitySimulation({
  config = {},
  legacyStack = DEFAULT_LEGACY_STACK,
  nexusStack = DEFAULT_NEXUS_STACK,
  title = 'Structural',
  subtitle = 'Divergence.',
}: StabilitySimulationProps) {
  // Logic is now encapsulated in the hook
  const { stage, shakeLevel, isCollapsed } = useSimulationController({
    maxStages: config.maxStages ?? legacyStack.length,
    cycleTimeMs: config.cycleTimeMs ?? 2000,
    collapseDelayMs: config.collapseDelayMs ?? 1500,
    autoPlay: true,
  });

  // Derive status from state
  const legacyStatus = isCollapsed ? 'FAILED' : shakeLevel !== 'none' ? 'DEGRADING' : 'ACTIVE';
  const nexusStatus = 'OPTIMAL';

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
      {/* 1. FORENSIC HEADER */}
      <ForensicHeader
        title={title}
        subtitle={subtitle}
        legacyStatus={legacyStatus}
        nexusStatus={nexusStatus}
      />

      {/* 2. THE SIMULATION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 w-full relative min-h-[500px]">
        {/* LEFT: The Decay (Monolith) */}
        <LegacyStack
          data={legacyStack}
          stage={stage}
          shakeLevel={shakeLevel}
          isCollapsed={isCollapsed}
        />

        {/* RIGHT: The Crystal (Nexus) */}
        <NexusStack
          data={nexusStack}
          stage={stage}
        />
      </div>
    </div>
  );
}

// Named export for flexibility
export { StabilitySimulation };
