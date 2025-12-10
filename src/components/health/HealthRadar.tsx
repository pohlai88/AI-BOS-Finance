import React from 'react';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';

interface HealthRadarProps {
  data: {
    subject: string;
    A: number; // Current Score
    fullMark: number;
  }[];
  color?: string;
}

export function HealthRadar({ data, color = "#28E7A2" }: HealthRadarProps) {
  return (
    <div className="w-full h-[300px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#333" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Health"
            dataKey="A"
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity={0.2}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#000', border: '1px solid #333', color: '#fff' }}
            itemStyle={{ color: color }}
          />
        </RadarChart>
      </ResponsiveContainer>
      
      {/* Decorative Corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#333]" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#333]" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#333]" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#333]" />
    </div>
  );
}
