import React from 'react';
import { BRAND_MARK_PATHS, BRAND_MARK_VIEW_BOX, FLOWKIT_ACCENT_VAR } from '../../styles/Theme';

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={BRAND_MARK_VIEW_BOX}
      fill="currentColor"
      role="img"
      aria-label="FlowKit"
    >
      <g style={{ fill: FLOWKIT_ACCENT_VAR }}>
        {BRAND_MARK_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}
