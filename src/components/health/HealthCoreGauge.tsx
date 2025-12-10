import React from 'react';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis, Tooltip } from 'recharts';

interface HealthCoreGaugeProps {
  data: {
    subject: string;
    A: number;
    fullMark: number;
  }[];
  color?: string;
}

export function HealthCoreGauge({ data, color = '#28E7A2' }: HealthCoreGaugeProps) {
  // TRANSFORM DATA: Military / Forensic styling
  // We use thin bars and strict coloring
  const formattedData = data.map((d, i) => {
    // Semantic Coloring Logic
    let ringColor = '#28E7A2'; // Default: Secure (Green)
    if (d.A < 60)
      ringColor = '#EF4444'; // Critical (Red)
    else if (d.A < 85) ringColor = '#FBBF24'; // Warning (Amber)

    // Override for specific types if needed, but semantic is more "Military"
    return {
      name: d.subject,
      value: d.A,
      fill: ringColor,
      // Add a "track" value for the full circle background?
      // Recharts handles background prop on RadialBar
    };
  });

  return (
    <div className="w-full h-[320px] relative flex items-center justify-center bg-[#050505] overflow-hidden">
      {/* =========================================================================
          LAYER 0: STATIC HUD ELEMENTS (The "Reticle")
          ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Crosshairs */}
        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-[#111]" />
        <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-[#111]" />

        {/* Outer Ring Ticks */}
        <svg className="absolute inset-0 w-full h-full opacity-30">
          <circle
            cx="50%"
            cy="50%"
            r="48%"
            fill="none"
            stroke="#28E7A2"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <circle cx="50%" cy="50%" r="32%" fill="none" stroke="#333" strokeWidth="1" />
        </svg>

        {/* Corner Brackets */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-[#28E7A2]" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-[#28E7A2]" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-[#28E7A2]" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-[#28E7A2]" />
      </div>

      {/* =========================================================================
          LAYER 1: DATA VISUALIZATION (Recharts)
          ========================================================================= */}
      <div className="w-full h-full relative z-10">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minHeight={300}
          minWidth={100}
          debounce={200}
        >
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="35%"
            outerRadius="90%"
            barSize={6}
            data={formattedData}
            startAngle={180}
            endAngle={-180}
          >
            {/* The PolarAngleAxis is tricky in RadialBar, often invisible. We simulate scale via SVG above. */}
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />

            <RadialBar
              background={{ fill: '#111' }} // Dark tracks
              clockWise
              dataKey="value"
              cornerRadius={0} // SHARP EDGES = MILITARY
              nameKey="name"
              label={false}
            />

            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-black/90 border border-[#28E7A2] p-2 shadow-[0_0_10px_rgba(40,231,162,0.2)]">
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <span className="font-mono text-[10px] text-[#28E7A2] uppercase tracking-widest">
                          {data.name}
                        </span>
                        <span className="font-mono text-[10px] text-white">{data.value}%</span>
                      </div>
                      <div className="h-[2px] w-full bg-[#111]">
                        <div
                          className="h-full"
                          style={{ width: `${data.value}%`, backgroundColor: data.fill }}
                        />
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>

      {/* =========================================================================
          LAYER 2: DATA LABELS (Absolute Positioning for Precision)
          ========================================================================= */}
      {/* We list the metrics on the side or overlay them, but let's do a "List Overlay" style for clarity */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
        <div className="flex flex-col gap-1">
          {formattedData.slice(0, 3).map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5" style={{ backgroundColor: d.fill }} />
              <span className="font-mono text-[9px] text-[#666] uppercase tracking-wide">
                {d.name}
              </span>
              <span className="font-mono text-[9px] text-white">{d.value}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1 items-end">
          {formattedData.slice(3).map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-white">{d.value}</span>
              <span className="font-mono text-[9px] text-[#666] uppercase tracking-wide">
                {d.name}
              </span>
              <div className="w-1.5 h-1.5" style={{ backgroundColor: d.fill }} />
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          LAYER 3: CORE READOUT
          ========================================================================= */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none z-0">
        {/* Decorative brackets */}
        <div className="absolute -left-6 h-8 border-l border-[#28E7A2] opacity-50" />
        <div className="absolute -right-6 h-8 border-r border-[#28E7A2] opacity-50" />

        <span className="text-4xl font-mono text-white font-medium tracking-tighter tabular-nums text-shadow-glow">
          {Math.round(data.reduce((acc, curr) => acc + curr.A, 0) / data.length)}
        </span>
        <span className="text-[7px] text-[#28E7A2] font-mono uppercase tracking-[0.2em] mt-1 bg-[#28E7A2]/10 px-1">
          INTEGRITY
        </span>
      </div>

      {/* SCAN LINE ANIMATION */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background: 'linear-gradient(transparent 50%, rgba(40, 231, 162, 0.2) 50%)',
          backgroundSize: '100% 4px',
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-[#28E7A2] opacity-20 animate-[scanVertical_4s_linear_infinite]" />
      <style>{`
        @keyframes scanVertical {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 0.5; }
          90% { opacity: 0.5; }
          100% { transform: translateY(320px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
