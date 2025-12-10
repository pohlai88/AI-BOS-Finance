import { RadarConfig } from './RadarDisplay';
import { Settings, Palette, Zap, Grid, Eye } from 'lucide-react';

interface ControlPanelProps {
  config: RadarConfig;
  onConfigChange: (config: Partial<RadarConfig>) => void;
}

export default function ControlPanel({ config, onConfigChange }: ControlPanelProps) {
  return (
    <div className="bg-gradient-to-br from-[#0F1419] to-[#0A0E17] rounded-xl p-6 space-y-6 border border-[#95C7FD]/10 shadow-xl backdrop-blur-sm">
      {/* Display Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#95C7FD]/10">
          <Settings className="size-5 text-[#95C7FD]" strokeWidth={1.5} />
          <h3 className="text-[#95C7FD] tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>Display Settings</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-[#95C7FD]/70 tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              Radar Size: {config.size}px
            </label>
            <input
              type="range"
              min="400"
              max="800"
              step="50"
              value={config.size}
              onChange={(e) => onConfigChange({ size: Number(e.target.value) })}
              className="w-full h-2 bg-[#1E2433]/50 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <div>
            <label className="block mb-2 text-[#95C7FD]/70 tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              Number of Rings: {config.rings}
            </label>
            <input
              type="range"
              min="3"
              max="8"
              step="1"
              value={config.rings}
              onChange={(e) => onConfigChange({ rings: Number(e.target.value) })}
              className="w-full h-2 bg-[#1E2433]/50 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <div>
            <label className="block mb-2 text-[#95C7FD]/70 tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              Sweep Speed: {config.sweepSpeed.toFixed(1)}s
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={config.sweepSpeed}
              onChange={(e) => onConfigChange({ sweepSpeed: Number(e.target.value) })}
              className="w-full h-2 bg-[#1E2433]/50 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>
      </div>

      {/* Color Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#95C7FD]/10">
          <Palette className="size-5 text-[#95C7FD]" strokeWidth={1.5} />
          <h3 className="text-[#95C7FD] tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>Colors</h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block mb-2 text-[#95C7FD]/70 tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>Background</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.backgroundColor}
                onChange={(e) => onConfigChange({ backgroundColor: e.target.value })}
                className="w-12 h-10 rounded border border-[#95C7FD]/20 cursor-pointer bg-[#1E2433]/30"
              />
              <input
                type="text"
                value={config.backgroundColor}
                onChange={(e) => onConfigChange({ backgroundColor: e.target.value })}
                className="flex-1 px-3 py-2 bg-[#1E2433]/30 border border-[#95C7FD]/20 rounded text-white tracking-wider"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-[#95C7FD]/70 tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>Grid &amp; Rings</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.ringColor}
                onChange={(e) => onConfigChange({ ringColor: e.target.value })}
                className="w-12 h-10 rounded border border-[#95C7FD]/20 cursor-pointer bg-[#1E2433]/30"
              />
              <input
                type="text"
                value={config.ringColor}
                onChange={(e) => onConfigChange({ ringColor: e.target.value })}
                className="flex-1 px-3 py-2 bg-[#1E2433]/30 border border-[#95C7FD]/20 rounded text-white tracking-wider"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-[#95C7FD]/70 tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>Grid Lines</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.gridColor}
                onChange={(e) => onConfigChange({ gridColor: e.target.value })}
                className="w-12 h-10 rounded border border-[#95C7FD]/20 cursor-pointer bg-[#1E2433]/30"
              />
              <input
                type="text"
                value={config.gridColor}
                onChange={(e) => onConfigChange({ gridColor: e.target.value })}
                className="flex-1 px-3 py-2 bg-[#1E2433]/30 border border-[#95C7FD]/20 rounded text-white tracking-wider"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-[#95C7FD]/70 tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>Sweep</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.sweepColor}
                onChange={(e) => onConfigChange({ sweepColor: e.target.value })}
                className="w-12 h-10 rounded border border-[#95C7FD]/20 cursor-pointer bg-[#1E2433]/30"
              />
              <input
                type="text"
                value={config.sweepColor}
                onChange={(e) => onConfigChange({ sweepColor: e.target.value })}
                className="flex-1 px-3 py-2 bg-[#1E2433]/30 border border-[#95C7FD]/20 rounded text-white tracking-wider"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Visual Options */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#95C7FD]/10">
          <Eye className="size-5 text-[#95C7FD]" strokeWidth={1.5} />
          <h3 className="text-[#95C7FD] tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>Visual Options</h3>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer group py-2 px-3 rounded-lg hover:bg-[#95C7FD]/5 transition-colors">
            <span className="text-[#95C7FD]/70 group-hover:text-[#95C7FD] tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>Show Angle Markers</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={config.angleMarkers}
                onChange={(e) => onConfigChange({ angleMarkers: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#1E2433]/50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#95C7FD]/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#95C7FD] after:shadow-lg"></div>
            </div>
          </label>

          <label className="flex items-center justify-between cursor-pointer group py-2 px-3 rounded-lg hover:bg-[#95C7FD]/5 transition-colors">
            <span className="text-[#95C7FD]/70 group-hover:text-[#95C7FD] tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>Show Point Labels</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={config.showLabels}
                onChange={(e) => onConfigChange({ showLabels: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#1E2433]/50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#95C7FD]/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#95C7FD] after:shadow-lg"></div>
            </div>
          </label>

          <label className="flex items-center justify-between cursor-pointer group py-2 px-3 rounded-lg hover:bg-[#95C7FD]/5 transition-colors">
            <span className="text-[#95C7FD]/70 group-hover:text-[#95C7FD] tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>Fade Trail Effect</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={config.fadeTrail}
                onChange={(e) => onConfigChange({ fadeTrail: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#1E2433]/50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#95C7FD]/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#95C7FD] after:shadow-lg"></div>
            </div>
          </label>
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          background: #95C7FD;
          cursor: pointer;
          border-radius: 50%;
          box-shadow: 0 0 12px rgba(149, 199, 253, 0.6), 0 0 24px rgba(149, 199, 253, 0.3);
          transition: all 0.2s ease;
        }

        .slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: #95C7FD;
          cursor: pointer;
          border-radius: 50%;
          border: none;
          box-shadow: 0 0 12px rgba(149, 199, 253, 0.6), 0 0 24px rgba(149, 199, 253, 0.3);
          transition: all 0.2s ease;
        }

        .slider::-webkit-slider-thumb:hover {
          background: #B5D7FD;
          box-shadow: 0 0 16px rgba(149, 199, 253, 0.8), 0 0 32px rgba(149, 199, 253, 0.4);
          transform: scale(1.1);
        }

        .slider::-moz-range-thumb:hover {
          background: #B5D7FD;
          box-shadow: 0 0 16px rgba(149, 199, 253, 0.8), 0 0 32px rgba(149, 199, 253, 0.4);
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}