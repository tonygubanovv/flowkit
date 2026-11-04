import React from 'react';
import { BRAND_MARK_PATHS, FLOWKIT_ACCENT_VAR } from '../../styles/Theme';

const LOGO_VIEW_BOX = '0 0 780 180';
const LOGO_RATIO = 780 / 180;

export function BrandLogo({ height = 31 }: { height?: number }) {
  return (
    <svg
      width={height * LOGO_RATIO}
      height={height}
      viewBox={LOGO_VIEW_BOX}
      role="img"
      aria-label="FlowKit"
    >
      <g transform="translate(8 0) scale(.68)" style={{ fill: FLOWKIT_ACCENT_VAR }}>
        {BRAND_MARK_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <text
        x="206"
        y="120"
        style={{ fontFamily: 'var(--font-family)', fontSize: 99, fontWeight: 700, letterSpacing: '-3px' }}
      >
        <tspan style={{ fill: 'var(--text)' }}>Flow</tspan>
        <tspan style={{ fill: FLOWKIT_ACCENT_VAR }}>Kit</tspan>
      </text>
    </svg>
  );
}
