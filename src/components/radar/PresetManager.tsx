import { useState } from 'react';
import { RadarConfig, RadarPoint } from './RadarDisplay';
import { Save, FolderOpen, Download, Upload, Star, Trash2 } from 'lucide-react';

interface RadarPreset {
  id: string;
  name: string;
  config: RadarConfig;
  points: RadarPoint[];
  timestamp: number;
}

interface PresetManagerProps {
  config: RadarConfig;
  points: RadarPoint[];
  onLoadPreset: (preset: RadarPreset) => void;
}

const DEFAULT_PRESETS: RadarPreset[] = [
  {
    id: 'default-1',
    name: 'Classic Blue',
    timestamp: Date.now(),
    config: {
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
    },
    points: [
      { id: '1', angle: 45, distance: 0.7, label: 'Target Alpha', color: '#95C7FD', size: 6 },
      { id: '2', angle: 120, distance: 0.5, label: 'Target Beta', color: '#95C7FD', size: 6 },
      { id: '3', angle: 280, distance: 0.8, label: 'Target Gamma', color: '#95C7FD', size: 6 }
    ]
  },
  {
    id: 'default-2',
    name: 'Military Green',
    timestamp: Date.now(),
    config: {
      size: 600,
      rings: 5,
      sweepSpeed: 4,
      sweepColor: '#4ECDC4',
      ringColor: '#4ECDC4',
      backgroundColor: '#0d1f1a',
      gridColor: '#1a3a2e',
      angleMarkers: true,
      showLabels: true,
      fadeTrail: true
    },
    points: [
      { id: '1', angle: 30, distance: 0.6, label: 'Hostile', color: '#FF6B6B', size: 7 },
      { id: '2', angle: 150, distance: 0.4, label: 'Friendly', color: '#4ECDC4', size: 6 },
      { id: '3', angle: 200, distance: 0.75, label: 'Unknown', color: '#FFE66D', size: 6 },
      { id: '4', angle: 315, distance: 0.9, label: 'Neutral', color: '#A8E6CF', size: 5 }
    ]
  },
  {
    id: 'default-3',
    name: 'High Contrast',
    timestamp: Date.now(),
    config: {
      size: 600,
      rings: 6,
      sweepSpeed: 2,
      sweepColor: '#00ff00',
      ringColor: '#00ff00',
      backgroundColor: '#000000',
      gridColor: '#003300',
      angleMarkers: false,
      showLabels: true,
      fadeTrail: false
    },
    points: [
      { id: '1', angle: 0, distance: 0.5, label: 'N', color: '#00ff00', size: 8 },
      { id: '2', angle: 90, distance: 0.5, label: 'E', color: '#00ff00', size: 8 },
      { id: '3', angle: 180, distance: 0.5, label: 'S', color: '#00ff00', size: 8 },
      { id: '4', angle: 270, distance: 0.5, label: 'W', color: '#00ff00', size: 8 }
    ]
  }
];

export default function PresetManager({ config, points, onLoadPreset }: PresetManagerProps) {
  const [savedPresets, setSavedPresets] = useState<RadarPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleSavePreset = () => {
    if (!presetName.trim()) return;

    const newPreset: RadarPreset = {
      id: Date.now().toString(),
      name: presetName,
      config: { ...config },
      points: [...points],
      timestamp: Date.now()
    };

    setSavedPresets([...savedPresets, newPreset]);
    setPresetName('');
    setShowSaveDialog(false);

    // Also save to localStorage
    const stored = localStorage.getItem('radarPresets');
    const existing = stored ? JSON.parse(stored) : [];
    localStorage.setItem('radarPresets', JSON.stringify([...existing, newPreset]));
  };

  const handleDeletePreset = (id: string) => {
    const updated = savedPresets.filter(p => p.id !== id);
    setSavedPresets(updated);
    
    // Update localStorage
    const stored = localStorage.getItem('radarPresets');
    if (stored) {
      const existing = JSON.parse(stored);
      const filtered = existing.filter((p: RadarPreset) => p.id !== id);
      localStorage.setItem('radarPresets', JSON.stringify(filtered));
    }
  };

  const handleExport = () => {
    const exportData = {
      config,
      points,
      timestamp: Date.now()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `radar-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.config && data.points) {
          onLoadPreset({
            id: Date.now().toString(),
            name: 'Imported',
            config: data.config,
            points: data.points,
            timestamp: data.timestamp || Date.now()
          });
        }
      } catch (error) {
        alert('Invalid file format');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Load presets from localStorage on mount
  useState(() => {
    const stored = localStorage.getItem('radarPresets');
    if (stored) {
      try {
        setSavedPresets(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load presets:', e);
      }
    }
  });

  return (
    <div className="bg-gradient-to-br from-[#0F1419] to-[#0A0E17] rounded-xl p-6 space-y-4 border border-[#95C7FD]/10 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between pb-3 border-b border-[#95C7FD]/10">
        <div className="flex items-center gap-2">
          <FolderOpen className="size-5 text-[#95C7FD]" strokeWidth={1.5} />
          <h3 className="text-[#95C7FD] tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>Presets &amp; Export</h3>
        </div>
      </div>

      {/* Save/Export/Import Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setShowSaveDialog(true)}
          className="px-4 py-2.5 bg-[#95C7FD] text-[#0A0E17] rounded-lg hover:bg-[#B5D7FD] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#95C7FD]/20 tracking-wide"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          <Save className="size-4" />
          Save Current
        </button>
        <button
          onClick={handleExport}
          className="px-4 py-2.5 bg-[#1E2433]/50 text-[#95C7FD] rounded-lg hover:bg-[#95C7FD]/10 transition-all flex items-center justify-center gap-2 border border-[#95C7FD]/20 tracking-wide"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          <Download className="size-4" />
          Export
        </button>
        <label className="col-span-2 px-4 py-2.5 bg-[#1E2433]/50 text-[#95C7FD] rounded-lg hover:bg-[#95C7FD]/10 transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#95C7FD]/20 tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          <Upload className="size-4" />
          Import
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="p-4 bg-[#1E2433]/30 rounded-lg space-y-3 border border-[#95C7FD]/20 shadow-inner">
          <h4 className="text-[#95C7FD] tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>Save Preset</h4>
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Enter preset name"
            className="w-full px-3 py-2 bg-[#0A0E17]/50 border border-[#95C7FD]/20 rounded-lg text-white tracking-wider focus:border-[#95C7FD]/50 focus:outline-none focus:ring-2 focus:ring-[#95C7FD]/20"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
            onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSavePreset}
              disabled={!presetName.trim()}
              className="flex-1 px-4 py-2 bg-[#95C7FD] text-[#0A0E17] rounded-lg hover:bg-[#B5D7FD] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#95C7FD]/20 tracking-wide"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowSaveDialog(false);
                setPresetName('');
              }}
              className="px-4 py-2 bg-[#1E2433]/50 text-[#95C7FD] rounded-lg hover:bg-[#95C7FD]/10 transition-all border border-[#95C7FD]/20 tracking-wide"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Default Presets */}
      <div className="space-y-2">
        <h4 className="text-[#95C7FD]/70 flex items-center gap-2 tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          <Star className="size-4" />
          Default Presets
        </h4>
        {DEFAULT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onLoadPreset(preset)}
            className="w-full p-3 bg-[#1E2433]/30 rounded-lg text-left hover:bg-[#95C7FD]/10 transition-all border border-[#95C7FD]/10 hover:border-[#95C7FD]/30 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white group-hover:text-[#95C7FD] tracking-wide transition-colors" style={{ fontFamily: "'Orbitron', sans-serif" }}>{preset.name}</div>
                <div className="text-[#95C7FD]/50 mt-1 tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  {preset.points.length} points • {preset.config.rings} rings
                </div>
              </div>
              <div
                className="w-4 h-4 rounded-full shadow-lg"
                style={{ 
                  backgroundColor: preset.config.sweepColor,
                  boxShadow: `0 0 8px ${preset.config.sweepColor}60`
                }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Saved Presets */}
      {savedPresets.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[#95C7FD]/70 tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>Your Saved Presets</h4>
          {savedPresets.map((preset) => (
            <div
              key={preset.id}
              className="p-3 bg-[#1E2433]/30 rounded-lg border border-[#95C7FD]/10 hover:border-[#95C7FD]/30 transition-all"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onLoadPreset(preset)}
                  className="flex-1 text-left"
                >
                  <div className="text-white hover:text-[#95C7FD] tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>{preset.name}</div>
                  <div className="text-[#95C7FD]/50 mt-1 tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {preset.points.length} points • {new Date(preset.timestamp).toLocaleDateString()}
                  </div>
                </button>
                <button
                  onClick={() => handleDeletePreset(preset.id)}
                  className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}