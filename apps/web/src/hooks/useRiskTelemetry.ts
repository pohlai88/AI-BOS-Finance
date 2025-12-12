// ============================================================================
// USE RISK TELEMETRY - Bridge between Truth Engine (Brain) and Radar (Face)
// Converts Verdicts into Blips and Terminal Events
// ============================================================================

import { useState, useEffect } from 'react';

// Types for the Telemetry System
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Layer = 'IFRS' | 'SOX' | 'TAX' | 'COSO';

export type TelemetryEvent = {
  id: string;
  time: string;
  severity: Severity;
  message: string;
  layer: Layer;
};

export type RadarBlip = {
  id: string;
  angle: number;      // 0-360 degrees
  radius: number;     // Distance from center (0-200)
  severity: Severity;
  label: string;
  layer: Layer;
};

export type TelemetryState = {
  events: TelemetryEvent[];
  blips: RadarBlip[];
  activeRisks: number;
  systemStatus: 'SCANNING' | 'LOCKED' | 'ALERT';
  lastScanTime: string;
};

// Risk scenarios that simulate Truth Engine output
const RISK_SCENARIOS = [
  { msg: 'Rev Rec variance detected (ASC-606)', sev: 'medium' as Severity, layer: 'IFRS' as Layer },
  { msg: 'Vendor drift > 2.5% vs PO', sev: 'low' as Severity, layer: 'COSO' as Layer },
  { msg: 'CRITICAL: Shadow Ledger anomaly', sev: 'critical' as Severity, layer: 'SOX' as Layer },
  { msg: 'Tax jurisdiction mismatch (EU/US)', sev: 'high' as Severity, layer: 'TAX' as Layer },
  { msg: 'Canon hash verified: Block #9921', sev: 'low' as Severity, layer: 'SOX' as Layer },
  { msg: 'IFRS 15 timing violation flagged', sev: 'high' as Severity, layer: 'IFRS' as Layer },
  { msg: 'Control test passed: AP-003', sev: 'low' as Severity, layer: 'COSO' as Layer },
  { msg: 'Materiality threshold exceeded', sev: 'medium' as Severity, layer: 'TAX' as Layer },
  { msg: 'Circular revenue pattern detected', sev: 'critical' as Severity, layer: 'IFRS' as Layer },
  { msg: 'SOX 404 control gap resolved', sev: 'low' as Severity, layer: 'SOX' as Layer },
];

// Map layers to angles on the radar
const LAYER_ANGLES: Record<Layer, number> = {
  IFRS: 0,
  SOX: 90,
  TAX: 180,
  COSO: 270,
};

export const useRiskTelemetry = () => {
  const [state, setState] = useState<TelemetryState>({
    events: [],
    blips: [],
    activeRisks: 4,
    systemStatus: 'SCANNING',
    lastScanTime: new Date().toISOString(),
  });

  useEffect(() => {
    // Simulate Truth Engine emitting events
    const interval = setInterval(() => {
      const scenario = RISK_SCENARIOS[Math.floor(Math.random() * RISK_SCENARIOS.length)];
      const now = new Date();
      
      // Create new event
      const newEvent: TelemetryEvent = {
        id: Math.random().toString(36).slice(2, 10),
        time: now.toLocaleTimeString('en-US', { hour12: false }),
        severity: scenario.sev,
        message: scenario.msg,
        layer: scenario.layer,
      };

      // Create radar blip for non-low severity
      const newBlip: RadarBlip | null = scenario.sev !== 'low' ? {
        id: newEvent.id,
        angle: LAYER_ANGLES[scenario.layer] + (Math.random() - 0.5) * 60, // Spread within quadrant
        radius: 80 + Math.random() * 100, // Random distance
        severity: scenario.sev,
        label: scenario.msg.split(':')[0].slice(0, 12), // Short label
        layer: scenario.layer,
      } : null;

      setState(prev => {
        // Update active risks based on severity
        let newActiveRisks = prev.activeRisks;
        let newStatus = prev.systemStatus;
        
        if (scenario.sev === 'critical') {
          newActiveRisks = Math.min(prev.activeRisks + 1, 12);
          newStatus = 'ALERT';
        } else if (scenario.sev === 'low' && prev.activeRisks > 2) {
          newActiveRisks = prev.activeRisks - 1;
          newStatus = 'SCANNING';
        }

        return {
          events: [newEvent, ...prev.events].slice(0, 8), // Keep last 8
          blips: newBlip 
            ? [newBlip, ...prev.blips].slice(0, 6) // Keep last 6 blips
            : prev.blips,
          activeRisks: newActiveRisks,
          systemStatus: newStatus,
          lastScanTime: now.toISOString(),
        };
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return state;
};

