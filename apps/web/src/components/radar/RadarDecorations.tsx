/**
 * RadarDecorations - Professional Radar UI Overlay
 * Precision-engineered coordinate system matching RadarDisplay.tsx
 */

interface RadarDecorationsProps {
  size: number;
}

export default function RadarDecorations({ size }: RadarDecorationsProps) {
  // ============================================================================
  // COORDINATE SYSTEM (Matches RadarDisplay.tsx exactly)
  // ============================================================================
  const center = size / 2;
  const radarRadius = size / 2 - 40; // Main radar boundary
  
  // Layered ring system
  const rings = {
    inner1: radarRadius + 10,
    inner2: radarRadius + 18,
    precisionInner: radarRadius + 40,
    precisionOuter: radarRadius + 60,
    labels: radarRadius + 82,
  };

  // ============================================================================
  // SEGMENTED OUTER RING (Professional arc segments with gaps)
  // ============================================================================
  const SegmentedRing = ({ radius, strokeWidth = 2, opacity = 0.7 }: {
    radius: number;
    strokeWidth?: number;
    opacity?: number;
  }) => {
    const segments = [];
    const gapDegrees = 10;
    
    for (let i = 0; i < 4; i++) {
      const start = i * 90 + gapDegrees;
      const end = (i + 1) * 90 - gapDegrees;
      const startRad = (start - 90) * Math.PI / 180;
      const endRad = (end - 90) * Math.PI / 180;
      
      const x1 = center + Math.cos(startRad) * radius;
      const y1 = center + Math.sin(startRad) * radius;
      const x2 = center + Math.cos(endRad) * radius;
      const y2 = center + Math.sin(endRad) * radius;
      
      segments.push(
        <path
          key={i}
          d={`M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`}
          fill="none"
          stroke="#95C7FD"
          strokeWidth={strokeWidth}
          opacity={opacity}
          strokeLinecap="round"
        />
      );
    }
    return <>{segments}</>;
  };

  // ============================================================================
  // DEGREE TICKS (360° precision measurement system)
  // ============================================================================
  const DegreeTicks = () => {
    const ticks = [];
    
    for (let deg = 0; deg < 360; deg++) {
      const angle = (deg - 90) * Math.PI / 180;
      const isMajor = deg % 10 === 0;
      const isMedium = deg % 5 === 0;
      
      let r1, r2, width, opacity;
      if (isMajor) {
        r1 = rings.precisionInner;
        r2 = rings.precisionOuter;
        width = 1.5;
        opacity = 0.6;
      } else if (isMedium) {
        r1 = rings.precisionInner + 6;
        r2 = rings.precisionOuter - 6;
        width = 1;
        opacity = 0.4;
      } else {
        r1 = rings.precisionInner + 8;
        r2 = rings.precisionOuter - 8;
        width = 0.5;
        opacity = 0.25;
      }
      
      const x1 = center + Math.cos(angle) * r1;
      const y1 = center + Math.sin(angle) * r1;
      const x2 = center + Math.cos(angle) * r2;
      const y2 = center + Math.sin(angle) * r2;
      
      ticks.push(
        <line
          key={deg}
          x1={x1} y1={y1}
          x2={x2} y2={y2}
          stroke="#95C7FD"
          strokeWidth={width}
          opacity={opacity}
          strokeLinecap="round"
        />
      );
    }
    return <>{ticks}</>;
  };

  // ============================================================================
  // DEGREE LABELS (Every 10 degrees)
  // ============================================================================
  const DegreeLabels = () => {
    const labels = [];
    
    for (let deg = 0; deg < 360; deg += 10) {
      const angle = (deg - 90) * Math.PI / 180;
      const x = center + Math.cos(angle) * rings.labels;
      const y = center + Math.sin(angle) * rings.labels;
      const isCardinal = deg % 90 === 0;
      
      labels.push(
        <text
          key={deg}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="select-none"
          style={{
            fontSize: isCardinal ? '13px' : '10px',
            fontFamily: '"Orbitron", monospace',
            fill: '#95C7FD',
            opacity: isCardinal ? 0.85 : 0.55,
            fontWeight: isCardinal ? 600 : 400,
          }}
        >
          {deg}
        </text>
      );
    }
    return <>{labels}</>;
  };

  // ============================================================================
  // CARDINAL INDICATORS (N, E, S, W badges)
  // ============================================================================
  const CardinalBadges = () => {
    const cardinals = [
      { deg: 0, label: 'N' },
      { deg: 90, label: 'E' },
      { deg: 180, label: 'S' },
      { deg: 270, label: 'W' },
    ];
    
    return (
      <>
        {cardinals.map(({ deg, label }) => {
          const angle = (deg - 90) * Math.PI / 180;
          const radius = (rings.precisionInner + rings.precisionOuter) / 2;
          const x = center + Math.cos(angle) * radius;
          const y = center + Math.sin(angle) * radius;
          
          return (
            <g key={deg}>
              <circle
                cx={x} cy={y} r={11}
                fill="#1a1d29"
                stroke="#95C7FD"
                strokeWidth={1.5}
                opacity={0.9}
              />
              <text
                x={x} y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="select-none"
                style={{
                  fontSize: '11px',
                  fontFamily: '"Orbitron", monospace',
                  fill: '#95C7FD',
                  fontWeight: 700,
                }}
              >
                {label}
              </text>
            </g>
          );
        })}
      </>
    );
  };

  // ============================================================================
  // CORNER BRACKETS
  // ============================================================================
  const CornerBrackets = () => {
    const size = 30;
    const offset = 12;
    const corners = [
      { x: offset, y: offset, rotate: 0 },
      { x: center * 2 - offset, y: offset, rotate: 90 },
      { x: center * 2 - offset, y: center * 2 - offset, rotate: 180 },
      { x: offset, y: center * 2 - offset, rotate: 270 },
    ];
    
    return (
      <>
        {corners.map((corner, i) => (
          <g key={i} transform={`translate(${corner.x}, ${corner.y}) rotate(${corner.rotate})`}>
            <path
              d={`M 0 0 L ${size} 0 M 0 0 L 0 ${size}`}
              stroke="#95C7FD"
              strokeWidth={2.5}
              opacity={0.7}
              strokeLinecap="round"
            />
            <path
              d={`M 3 3 L 3 ${size - 8} M 3 3 L ${size - 8} 3`}
              stroke="#95C7FD"
              strokeWidth={1.2}
              opacity={0.4}
            />
          </g>
        ))}
      </>
    );
  };

  // ============================================================================
  // STATUS LABELS
  // ============================================================================
  const StatusLabels = () => (
    <>
      {/* SCANNING - Top Center */}
      <g transform={`translate(${center}, 35)`}>
        <rect
          x={-42} y={-9}
          width={84} height={18}
          fill="none"
          stroke="#95C7FD"
          strokeWidth={1}
          opacity={0.5}
          rx={3}
        />
        <text
          x={0} y={0}
          textAnchor="middle"
          dominantBaseline="middle"
          className="select-none"
          style={{
            fontSize: '10px',
            fontFamily: '"Orbitron", monospace',
            fill: '#95C7FD',
            opacity: 0.8,
            letterSpacing: '2px',
            fontWeight: 500,
          }}
        >
          SCANNING
        </text>
      </g>
      
      {/* LAT - Left side */}
      <text
        x={25} y={center - 50}
        textAnchor="start"
        dominantBaseline="middle"
        className="select-none"
        style={{
          fontSize: '9px',
          fontFamily: '"Orbitron", monospace',
          fill: '#95C7FD',
          opacity: 0.5,
          letterSpacing: '1.5px',
        }}
      >
        LAT
      </text>
      
      {/* LAT - Left side lower */}
      <text
        x={25} y={center + 50}
        textAnchor="start"
        dominantBaseline="middle"
        className="select-none"
        style={{
          fontSize: '9px',
          fontFamily: '"Orbitron", monospace',
          fill: '#95C7FD',
          opacity: 0.5,
          letterSpacing: '1.5px',
        }}
      >
        LAT
      </text>
    </>
  );

  // ============================================================================
  // INNER DECORATIVE RINGS
  // ============================================================================
  const InnerRings = () => (
    <>
      <circle
        cx={center} cy={center}
        r={rings.inner1}
        fill="none"
        stroke="#95C7FD"
        strokeWidth={0.5}
        opacity={0.25}
      />
      <circle
        cx={center} cy={center}
        r={rings.inner2}
        fill="none"
        stroke="#95C7FD"
        strokeWidth={1}
        strokeDasharray="3 6"
        opacity={0.3}
      />
    </>
  );

  // ============================================================================
  // CARDINAL CROSSHAIRS
  // ============================================================================
  const CardinalCrosshairs = () => {
    const crosshairs = [];
    
    for (let deg of [0, 90, 180, 270]) {
      const angle = (deg - 90) * Math.PI / 180;
      const r1 = radarRadius - 5;
      const r2 = radarRadius + 8;
      
      crosshairs.push(
        <line
          key={deg}
          x1={center + Math.cos(angle) * r1}
          y1={center + Math.sin(angle) * r1}
          x2={center + Math.cos(angle) * r2}
          y2={center + Math.sin(angle) * r2}
          stroke="#95C7FD"
          strokeWidth={2}
          opacity={0.6}
          strokeLinecap="round"
        />
      );
    }
    return <>{crosshairs}</>;
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  return (
    <svg
      width={size}
      height={size}
      className="absolute top-0 left-0 pointer-events-none"
      style={{ filter: 'drop-shadow(0 0 3px rgba(149, 199, 253, 0.25))' }}
    >
      {/* Layer 1: Inner decorative rings */}
      <InnerRings />
      
      {/* Layer 2: Cardinal crosshairs */}
      <CardinalCrosshairs />
      
      {/* Layer 3: Segmented precision rings */}
      <SegmentedRing radius={rings.precisionInner} strokeWidth={1.5} opacity={0.6} />
      <SegmentedRing radius={rings.precisionOuter} strokeWidth={2} opacity={0.7} />
      
      {/* Layer 4: Degree tick marks */}
      <DegreeTicks />
      
      {/* Layer 5: Cardinal badges */}
      <CardinalBadges />
      
      {/* Layer 6: Degree labels */}
      <DegreeLabels />
      
      {/* Layer 7: Corner brackets */}
      <CornerBrackets />
      
      {/* Layer 8: Status labels */}
      <StatusLabels />
    </svg>
  );
}
