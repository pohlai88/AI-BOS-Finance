import { useState } from 'react';
import { RadarPoint } from './RadarDisplay';
import { Plus, Edit2, Trash2, Target, X } from 'lucide-react';

interface PointManagerProps {
  points: RadarPoint[];
  onPointsChange: (points: RadarPoint[]) => void;
  selectedPoint: RadarPoint | null;
  onSelectPoint: (point: RadarPoint | null) => void;
}

export default function PointManager({ points, onPointsChange, selectedPoint, onSelectPoint }: PointManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    angle: 0,
    distance: 0.5,
    color: '#95C7FD',
    size: 6
  });

  const handleAdd = () => {
    const newPoint: RadarPoint = {
      id: Date.now().toString(),
      ...formData
    };
    onPointsChange([...points, newPoint]);
    setIsAdding(false);
    resetForm();
  };

  const handleEdit = (point: RadarPoint) => {
    setEditingId(point.id);
    setFormData({
      label: point.label || '',
      angle: point.angle,
      distance: point.distance,
      color: point.color || '#95C7FD',
      size: point.size || 6
    });
  };

  const handleUpdate = () => {
    if (!editingId) return;
    
    const updatedPoints = points.map(p => 
      p.id === editingId 
        ? { ...p, ...formData }
        : p
    );
    onPointsChange(updatedPoints);
    setEditingId(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    onPointsChange(points.filter(p => p.id !== id));
    if (selectedPoint?.id === id) {
      onSelectPoint(null);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      label: '',
      angle: 0,
      distance: 0.5,
      color: '#95C7FD',
      size: 6
    });
  };

  const randomizePoints = () => {
    const count = Math.floor(Math.random() * 8) + 5;
    const newPoints: RadarPoint[] = [];
    const labels = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliet', 'Kilo', 'Lima'];
    
    for (let i = 0; i < count; i++) {
      newPoints.push({
        id: `${Date.now()}-${i}`,
        label: labels[i % labels.length],
        angle: Math.floor(Math.random() * 360),
        distance: Math.random() * 0.8 + 0.2,
        color: ['#95C7FD', '#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF'][Math.floor(Math.random() * 5)],
        size: Math.floor(Math.random() * 4) + 5
      });
    }
    onPointsChange(newPoints);
  };

  return (
    <div className="bg-gradient-to-br from-[#0F1419] to-[#0A0E17] rounded-xl p-6 space-y-4 border border-[#95C7FD]/10 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between pb-3 border-b border-[#95C7FD]/10">
        <div className="flex items-center gap-2">
          <Target className="size-5 text-[#95C7FD]" strokeWidth={1.5} />
          <h3 className="text-[#95C7FD] tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>Radar Points ({points.length})</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={randomizePoints}
            className="px-3 py-1.5 bg-[#1E2433]/50 text-[#95C7FD]/90 rounded-lg hover:bg-[#95C7FD]/10 hover:text-[#95C7FD] transition-all border border-[#95C7FD]/20 tracking-wide"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            Randomize
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="px-3 py-1.5 bg-[#95C7FD] text-[#0A0E17] rounded-lg hover:bg-[#B5D7FD] transition-all flex items-center gap-1.5 shadow-lg shadow-[#95C7FD]/20 tracking-wide"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            <Plus className="size-4" />
            Add Point
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="p-4 bg-[#1E2433]/30 rounded-lg space-y-3 border border-[#95C7FD]/20 shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[#95C7FD] tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>{editingId ? 'Edit Point' : 'New Point'}</h4>
            <button
              onClick={handleCancel}
              className="text-[#95C7FD]/40 hover:text-[#95C7FD] transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          <div>
            <label className="block mb-1.5 text-[#95C7FD]/70 tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>Label</label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-3 py-2 bg-[#0A0E17]/50 border border-[#95C7FD]/20 rounded-lg text-white tracking-wider focus:border-[#95C7FD]/50 focus:outline-none focus:ring-2 focus:ring-[#95C7FD]/20"
              placeholder="Point name"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            />
          </div>

          <div>
            <label className="block mb-1.5 text-[#95C7FD]/70 tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              Angle: {formData.angle}°
            </label>
            <input
              type="range"
              min="0"
              max="359"
              value={formData.angle}
              onChange={(e) => setFormData({ ...formData, angle: Number(e.target.value) })}
              className="w-full h-2 bg-[#0A0E17]/50 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <div>
            <label className="block mb-1.5 text-[#95C7FD]/70 tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              Distance: {(formData.distance * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={formData.distance}
              onChange={(e) => setFormData({ ...formData, distance: Number(e.target.value) })}
              className="w-full h-2 bg-[#0A0E17]/50 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <div>
            <label className="block mb-1.5 text-[#95C7FD]/70 tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              Size: {formData.size}px
            </label>
            <input
              type="range"
              min="3"
              max="12"
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: Number(e.target.value) })}
              className="w-full h-2 bg-[#0A0E17]/50 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <div>
            <label className="block mb-1.5 text-[#95C7FD]/70 tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-12 h-10 rounded border border-[#95C7FD]/20 cursor-pointer bg-[#0A0E17]/50"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="flex-1 px-3 py-2 bg-[#0A0E17]/50 border border-[#95C7FD]/20 rounded-lg text-white tracking-wider focus:border-[#95C7FD]/50 focus:outline-none focus:ring-2 focus:ring-[#95C7FD]/20"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={editingId ? handleUpdate : handleAdd}
              className="flex-1 px-4 py-2 bg-[#95C7FD] text-[#0A0E17] rounded-lg hover:bg-[#B5D7FD] transition-all shadow-lg shadow-[#95C7FD]/20 tracking-wide"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              {editingId ? 'Update' : 'Add'}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-[#1E2433]/50 text-[#95C7FD] rounded-lg hover:bg-[#95C7FD]/10 transition-all border border-[#95C7FD]/20 tracking-wide"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Points List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
        {points.length === 0 && !isAdding && (
          <p className="text-center text-[#95C7FD]/40 py-8 tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            No points added yet. Click "Add Point" to get started.
          </p>
        )}

        {points.map((point) => (
          <div
            key={point.id}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              selectedPoint?.id === point.id
                ? 'bg-[#95C7FD]/10 border-[#95C7FD]/50 shadow-lg shadow-[#95C7FD]/10'
                : 'bg-[#1E2433]/30 border-[#95C7FD]/10 hover:border-[#95C7FD]/30 hover:bg-[#1E2433]/50'
            }`}
            onClick={() => onSelectPoint(point)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-3 h-3 rounded-full shadow-lg"
                  style={{ 
                    backgroundColor: point.color,
                    boxShadow: `0 0 8px ${point.color}80`
                  }}
                />
                <div className="flex-1">
                  <div className="text-white tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>{point.label || 'Unnamed'}</div>
                  <div className="text-[#95C7FD]/50 mt-1 tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {point.angle}° • {(point.distance * 100).toFixed(0)}% range
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(point);
                  }}
                  className="p-2 text-[#95C7FD]/70 hover:text-[#95C7FD] hover:bg-[#95C7FD]/10 rounded-lg transition-all"
                >
                  <Edit2 className="size-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(point.id);
                  }}
                  className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0A0E17;
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #95C7FD;
          border-radius: 4px;
          box-shadow: 0 0 8px rgba(149, 199, 253, 0.4);
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #B5D7FD;
          box-shadow: 0 0 12px rgba(149, 199, 253, 0.6);
        }
      `}</style>
    </div>
  );
}