import React from 'react';
import { UI } from '../../styles/Styles';

interface BtnProps {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'subtle' | 'outline' | 'danger';
  size?: 'sm' | 'md';
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
  title?: string;
  'aria-label'?: string;
  disabled?: boolean;
  className?: string;
}

export function Btn({ children, variant = 'ghost', size = 'md', onClick, style, title, disabled, className, ...rest }: BtnProps) {
  return (
    <button onClick={onClick} title={title} disabled={disabled} aria-label={rest['aria-label']}
      className={UI.control.buttonClass(variant, className)}
      style={UI.control.button(variant, size, disabled, style)}
    >
      {children}
    </button>
  );
}

