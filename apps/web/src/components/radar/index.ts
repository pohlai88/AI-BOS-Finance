/**
 * Radar Components Collection
 * 
 * Canvas-Based (High Performance):
 * - RadarDisplay: Configurable canvas radar with sweep animation
 * - ControlPanel: Configuration UI for RadarDisplay
 * - PointManager: Manage radar targets/points
 * - PresetManager: Save/load radar presets
 * - RadarDecorations: Corner brackets and HUD elements
 * 
 * SVG-Based:
 * - TacticalRadar: Military HUD style with degree markings
 * - MagicUIRadar: Premium with Magic UI components (orbiting circles, ripple)
 * - HybridRadar: Image-based with code overlay
 * - RiskRadar: Full SVG with 3-stage threat system
 * - ForensicRadarEnhanced: Maximum visual fidelity
 */

// Canvas-based radar system (from reference design)
export { default as RadarDisplay } from './RadarDisplay';
export type { RadarPoint, RadarConfig } from './RadarDisplay';
export { default as ControlPanel } from './ControlPanel';
export { default as PointManager } from './PointManager';
export { default as PresetManager } from './PresetManager';
export { default as RadarDecorations } from './RadarDecorations';

// ThreatRadar: RadarDisplay + threat logic + system log (matches screenshot)
export { ThreatRadar } from './ThreatRadar';

// SVG-based radar components
export { TacticalRadar } from './TacticalRadar';

// Re-export from marketing feature for backwards compatibility
export { MagicUIRadar } from '@/features/marketing/components/MagicUIRadar';
export { HybridRadar } from '@/features/marketing/components/HybridRadar';
export { RiskRadar } from '@/features/marketing/components/RiskRadar';
export { ForensicRadarEnhanced } from '@/features/marketing/components/ForensicRadarEnhanced';

