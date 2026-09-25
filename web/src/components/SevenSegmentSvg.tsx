import React from 'react';

interface SevenSegmentSvgProps {
  val: number; // 0..15 (Hex 0-F)
  width?: number;
  height?: number;
}

// 7-segment decoding map for hex digits 0-F: [a, b, c, d, e, f, g]
const SEGMENT_MAP: Record<number, boolean[]> = {
  0:  [true,  true,  true,  true,  true,  true,  false],
  1:  [false, true,  true,  false, false, false, false],
  2:  [true,  true,  false, true,  true,  false, true ],
  3:  [true,  true,  true,  true,  false, false, true ],
  4:  [false, true,  true,  false, false, true,  true ],
  5:  [true,  false, true,  true,  false, true,  true ],
  6:  [true,  false, true,  true,  true,  true,  true ],
  7:  [true,  true,  true,  false, false, false, false],
  8:  [true,  true,  true,  true,  true,  true,  true ],
  9:  [true,  true,  true,  true,  false, true,  true ],
  10: [true,  true,  true,  false, true,  true,  true ], // A
  11: [false, false, true,  true,  true,  true,  true ], // b
  12: [true,  false, false, true,  true,  true,  false], // C
  13: [false, true,  true,  true,  true,  false, true ], // d
  14: [true,  false, false, true,  true,  true,  true ], // E
  15: [true,  false, false, false, true,  true,  true ], // F
};

export const SevenSegmentSvg: React.FC<SevenSegmentSvgProps> = ({ val, width = 60, height = 80 }) => {
  const safeVal = Math.max(0, Math.min(15, val));
  const [a, b, c, d, e, f, g] = SEGMENT_MAP[safeVal] || [false, false, false, false, false, false, false];

  const onColor = '#22c55e'; // vivid green
  const offColor = 'rgba(71, 85, 105, 0.25)'; // dim slate
  const glow = 'drop-shadow(0 0 4px rgba(34, 197, 94, 0.7))';

  return (
    <svg viewBox="0 0 50 74" width={width} height={height} className="overflow-visible select-none">
      {/* Background backing */}
      <rect x="2" y="2" width="46" height="70" rx="4" fill="#090d16" stroke="#1e293b" strokeWidth="1.5" />

      {/* Segment A (top) */}
      <polygon
        points="13,8 37,8 33,13 17,13"
        fill={a ? onColor : offColor}
        style={{ filter: a ? glow : undefined }}
      />

      {/* Segment B (top-right) */}
      <polygon
        points="38,9 43,14 39,34 35,31 38,15"
        fill={b ? onColor : offColor}
        style={{ filter: b ? glow : undefined }}
      />

      {/* Segment C (bottom-right) */}
      <polygon
        points="39,38 43,42 39,62 34,57 35,41"
        fill={c ? onColor : offColor}
        style={{ filter: c ? glow : undefined }}
      />

      {/* Segment D (bottom) */}
      <polygon
        points="17,60 33,60 37,65 13,65"
        fill={d ? onColor : offColor}
        style={{ filter: d ? glow : undefined }}
      />

      {/* Segment E (bottom-left) */}
      <polygon
        points="11,42 15,38 15,57 11,62 7,57"
        fill={e ? onColor : offColor}
        style={{ filter: e ? glow : undefined }}
      />

      {/* Segment F (top-left) */}
      <polygon
        points="11,14 15,18 15,31 11,35 7,31"
        fill={f ? onColor : offColor}
        style={{ filter: f ? glow : undefined }}
      />

      {/* Segment G (middle) */}
      <polygon
        points="16,34 34,34 37,36 34,38 16,38 13,36"
        fill={g ? onColor : offColor}
        style={{ filter: g ? glow : undefined }}
      />

      {/* Small decimal/hex indicator in corner */}
      <text
        x="42"
        y="68"
        fontSize="6"
        fontFamily="monospace"
        fill={onColor}
        opacity={0.8}
        textAnchor="end"
      >
        {safeVal.toString(16).toUpperCase()}
      </text>
    </svg>
  );
};
