import React from 'react';
import { PALETTE } from '../../lib/Constants';
import { UI } from '../../styles/Styles';

export const SI = (overrides?: React.CSSProperties): React.CSSProperties => UI.control.input(overrides);

interface ToggleProps {
  on: boolean;
  onChange: () => void;
}

export function Toggle({ on, onChange }: ToggleProps) {
  return (
    <div onClick={onChange} style={UI.control.toggleTrack(on)}>
      <div style={UI.control.toggleThumb(on)} />
    </div>
  );
}

interface ColorPickProps {
  value: string;
  onChange: (c: string) => void;
  colors?: string[];
}

export function ColorPick({ value, onChange, colors = PALETTE }: ColorPickProps) {
  return (
    <div style={UI.form.colorGrid}>
      {colors.map((c: string) => <button key={c} className="fk-color-swatch" onClick={() => onChange(c)} style={UI.control.colorSwatch(c, value === c)} />)}
    </div>
  );
}

export { FillPicker } from './FillPicker';
