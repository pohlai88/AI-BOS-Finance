import { useState } from 'react';
import RadarDisplay, { RadarConfig, RadarPoint } from './components/RadarDisplay';
import RadarDecorations from './components/RadarDecorations';
import ControlPanel from './components/ControlPanel';
import PointManager from './components/PointManager';
import PresetManager from './components/PresetManager';
import { Radio } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<RadarConfig>({
    size: 600,
    rings: 4,
    sweepSpeed: 3,
    sweepColor: '#95C7FD',
    ringColor: '#95C7FD',
    backgroundColor: '#0A0E17',
    gridColor: '#1E2433',
    angleMarkers: true,
    showLabels: true,
    fadeTrail: true
  });

  const [points, setPoints] = useState<RadarPoint[]>([
    { id: '1', angle: 45, distance: 0.7, label: 'Alpha', color: '#95C7FD', size: 6 },
    { id: '2', angle: 135, distance: 0.5, label: 'Beta', color: '#4ECDC4', size: 6 },
    { id: '3', angle: 225, distance: 0.8, label: 'Gamma', color: '#FFE66D', size: 7 },
    { id: '4', angle: 315, distance: 0.4, label: 'Delta', color: '#FF6B6B', size: 5 }
  ]);

  const [selectedPoint, setSelectedPoint] = useState<RadarPoint | null>(null);

  const handleConfigChange = (newConfig: Partial<RadarConfig>) => {
    setConfig({ ...config, ...newConfig });
  };

  const handlePointClick = (point: RadarPoint) => {
    setSelectedPoint(point);
  };

  const handleLoadPreset = (preset: { config: RadarConfig; points: RadarPoint[] }) => {
    setConfig(preset.config);
    setPoints(preset.points);
    setSelectedPoint(null);
  };

  return (
    <div className="min-h-screen bg-[#0A0E17] p-6 md:p-8">
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&display=swap" rel="stylesheet" />
      
      <div className="max-w-[1800px] mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 py-4">
          <div className="flex items-center justify-center gap-4">
            <div className="relative">
              <Radio className="size-14 text-[#95C7FD]" strokeWidth={1.5} />
              <div className="absolute inset-0 blur-xl bg-[#95C7FD] opacity-30 animate-pulse" />
            </div>
            <h1 
              className="text-[#95C7FD] tracking-[0.15em]"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              RADAR SYSTEM
            </h1>
          </div>
          <p 
            className="text-[#95C7FD]/50 tracking-wider"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            Real-Time Tracking &amp; Analysis Platform
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
          {/* Radar Display */}
          <div className="relative flex items-center justify-center rounded-2xl p-8 border border-[#95C7FD]/10">
            {/* Transparent radial gradient overlay - 90-99% transparency */}
            <div 
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: 'radial-gradient(circle at center, rgba(149, 199, 253, 0.10) 0%, rgba(149, 199, 253, 0.05) 30%, rgba(149, 199, 253, 0.02) 50%, rgba(149, 199, 253, 0.01) 70%, transparent 90%)'
              }}
            />
            {/* Secondary glow layer - subtle atmospheric effect */}
            <div 
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(149, 199, 253, 0.08) 0%, rgba(149, 199, 253, 0.03) 40%, transparent 60%)',
                filter: 'blur(80px)'
              }}
            />
            {/* Radar container - ensures canvas and SVG are perfectly aligned */}
            <div className="relative" style={{ width: config.size, height: config.size }}>
              <RadarDisplay 
                config={config} 
                points={points} 
                onPointClick={handlePointClick}
              />
              <RadarDecorations size={config.size} />
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <ControlPanel 
              config={config} 
              onConfigChange={handleConfigChange}
            />
            
            <PointManager
              points={points}
              onPointsChange={setPoints}
              selectedPoint={selectedPoint}
              onSelectPoint={setSelectedPoint}
            />

            <PresetManager
              config={config}
              points={points}
              onLoadPreset={handleLoadPreset}
            />
          </div>
        </div>

        {/* Info Panel */}
        {selectedPoint && (
          <div className="bg-gradient-to-br from-[#0F1419] to-[#0A0E17] rounded-2xl p-6 border border-[#95C7FD]/30 shadow-2xl animate-fade-in backdrop-blur-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 
                  className="text-[#95C7FD] mb-4 tracking-wider"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  TARGET: {selectedPoint.label?.toUpperCase() || 'UNNAMED'}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <div 
                      className="text-[#95C7FD]/50 tracking-wider"
                      style={{ fontFamily: "'Orbitron', sans-serif" }}
                    >
                      BEARING
                    </div>
                    <div 
                      className="text-white tracking-wider"
                      style={{ fontFamily: "'Orbitron', sans-serif" }}
                    >
                      {selectedPoint.angle.toString().padStart(3, '0')}°
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div 
                      className="text-[#95C7FD]/50 tracking-wider"
                      style={{ fontFamily: "'Orbitron', sans-serif" }}
                    >
                      RANGE
                    </div>
                    <div 
                      className="text-white tracking-wider"
                      style={{ fontFamily: "'Orbitron', sans-serif" }}
                    >
                      {(selectedPoint.distance * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div 
                      className="text-[#95C7FD]/50 tracking-wider"
                      style={{ fontFamily: "'Orbitron', sans-serif" }}
                    >
                      SIGNATURE
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-5 h-5 rounded-sm border border-[#95C7FD]/20 shadow-lg"
                        style={{ 
                          backgroundColor: selectedPoint.color,
                          boxShadow: `0 0 12px ${selectedPoint.color}60`
                        }}
                      />
                      <span 
                        className="text-white tracking-wider"
                        style={{ fontFamily: "'Orbitron', sans-serif" }}
                      >
                        {selectedPoint.color}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div 
                      className="text-[#95C7FD]/50 tracking-wider"
                      style={{ fontFamily: "'Orbitron', sans-serif" }}
                    >
                      MAGNITUDE
                    </div>
                    <div 
                      className="text-white tracking-wider"
                      style={{ fontFamily: "'Orbitron', sans-serif" }}
                    >
                      {selectedPoint.size}px
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedPoint(null)}
                className="text-[#95C7FD]/40 hover:text-[#95C7FD] transition-colors ml-4 p-1"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div 
          className="text-center text-[#95C7FD]/30 pt-6 border-t border-[#95C7FD]/5 tracking-wider"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          <p>INTERACTIVE TRACKING • REAL-TIME ANALYSIS • EXPORT CONFIGURATIONS</p>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .animate-pulse {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}