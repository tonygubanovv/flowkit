import React from 'react';
import { PALETTE } from '../../lib/Constants';
import { FILL_PRESETS, getFillFallbackColor, isValidFill, normalizeHexColor } from '../../styles/Theme';
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

interface FillPickerProps {
  value: string;
  onChange: (c: string) => void;
  compact?: boolean;
}

export function FillPicker({ value, onChange, compact = false }: FillPickerProps) {
  const normalizedHex = normalizeHexColor(value);
  const pickerColor = normalizedHex || getFillFallbackColor(value);
  const isValid = isValidFill(value);

  return (
    <div style={UI.form.fillPicker(compact)}>
      <div style={UI.form.fillPresetGrid(compact)}>
        {FILL_PRESETS.map((preset) => {
          const selected = value.trim().toLowerCase() === preset.value.toLowerCase();

          return (
            <button
              key={preset.name}
              type="button"
              title={preset.name}
              className="fk-color-swatch"
              onClick={() => onChange(preset.value)}
              style={UI.control.colorSwatch(preset.value, selected)}
            />
          );
        })}
      </div>

      <div style={UI.form.fillInputRow}>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={(event) => {
            const normalized = normalizeHexColor(event.target.value);
            if (normalized) onChange(normalized);
          }}
          placeholder="linear-gradient(135deg, #2dd4bf, #60a5fa)"
          spellCheck={false}
          className="fk-fill-input"
          style={UI.form.fillInput(isValid)}
        />
        <input
          aria-label="Выбрать цвет"
          type="color"
          className="fk-native-color"
          value={pickerColor}
          onChange={(event) => onChange(event.target.value)}
          style={UI.form.nativeColorInput(value)}
        />
      </div>
    </div>
  );
}

