import React from 'react';

// Logo
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`flow_ui_grad_${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--logo-start)" />
          <stop offset="100%" stopColor="var(--logo-end)" />
        </linearGradient>
      </defs>
      <path d="M9 18.5C9 18.5 11.5 21.5 14.5 21.5C17.5 21.5 19 11.5 22.5 11.5C26 11.5 26 14.5 26 14.5" stroke={`url(#flow_ui_grad_${size})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="15" r="3" fill="var(--logo-dot)" />
    </svg>
  );
}

