import React, { useEffect, useId, useState } from 'react';
import { FILL_PRESETS, isValidFill, normalizeHexColor } from '../../styles/Theme';
import { COLOR_PICKER_STYLES as styles } from '../../styles/ColorPickerStyles';
import { Icon } from './Icon';

interface FillPickerProps {
  value: string;
  onChange: (color: string) => void;
  compact?: boolean;
}

export function FillPicker({ value, onChange, compact = false }: FillPickerProps) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState(false);
  const id = useId();
  useEffect(() => { setDraft(value); setError(false); }, [value]);
  const apply = () => {
    const color = normalizeHexColor(draft);
    if (color) { setDraft(color); setError(false); onChange(color); }
    else if (draft.trim() === value.trim() && isValidFill(value)) setError(false);
    else setError(true);
  };
  return (
    <div style={styles.shell(compact)}>
      <div role="group" aria-label="Палитра: 12 цветов" style={styles.grid}>
        {FILL_PRESETS.map((preset) => {
          const selected = normalizeHexColor(value) === preset.value;
          return <button key={preset.value} type="button" title={preset.name} aria-label={preset.name}
            aria-pressed={selected} className="fk-color-swatch" style={styles.swatch(preset.value, selected)}
            onClick={() => { setDraft(preset.value); setError(false); onChange(preset.value); }}>
            {selected && <Icon name="check" size={15} />}
          </button>;
        })}
      </div>
      <label htmlFor={id} style={styles.label}>Свой цвет</label>
      <div style={styles.inputRow}>
        <span style={styles.preview(value)} title="Текущий цвет" aria-hidden="true" />
        <input id={id} value={draft} aria-label="Свой цвет: HEX" aria-invalid={error}
          aria-describedby={error ? `${id}-error` : undefined} spellCheck={false}
          autoComplete="off" placeholder="#2dd4bf" style={styles.input(error)}
          onChange={(event) => { setDraft(event.target.value); setError(false); }} onBlur={apply}
          onKeyDown={(event) => {
            if (event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); apply(); }
            if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setDraft(value); setError(false); }
          }} />
      </div>
      {error && <div id={`${id}-error`} role="status" style={styles.error}>Цвет не изменён. Введите HEX, например #2dd4bf.</div>}
    </div>
  );
}
