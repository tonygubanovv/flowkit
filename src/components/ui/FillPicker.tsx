import React, { useEffect, useId, useState } from 'react';
import { FILL_PRESET_GROUPS, isValidFill, normalizeHexColor } from '../../styles/Theme';
import { COLOR_PICKER_STYLES as styles } from '../../styles/ColorPickerStyles';
import { Icon } from './Icon';

interface FillPickerProps {
  value: string;
  onChange: (color: string) => void;
  compact?: boolean;
  statusPresets?: readonly { name: string; value: string }[];
}

export function FillPicker({ value, onChange, compact = false, statusPresets }: FillPickerProps) {
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
  const selectedColor = normalizeHexColor(value);
  const palette = (name: string, presets: readonly { name: string; value: string }[]) => (
    <div key={name} role="group" aria-label={name} style={styles.group}>
      <span style={styles.label}>{name}</span>
      <div style={styles.grid}>
        {presets.map((preset) => {
          const selected = selectedColor === preset.value;
          return <button key={preset.value} type="button" title={preset.name} aria-label={preset.name}
            aria-pressed={selected} className="fk-color-swatch" style={styles.swatch(preset.value, selected, compact)}
            onClick={() => { setDraft(preset.value); setError(false); onChange(preset.value); }}>
            {selected && <Icon name="check" size={15} />}
          </button>;
        })}
      </div>
    </div>
  );
  const generalPalette = FILL_PRESET_GROUPS.map(({ name, presets }) =>
    palette(name, presets.filter((item) => !statusPresets?.some((status) => status.value === item.value))));

  return (
    <div style={styles.shell(compact)}>
      {statusPresets ? (
        <>
          {palette('Цвета статусов', statusPresets)}
          <details>
            <summary style={styles.more}>Все цвета</summary>
            <div style={styles.moreGroups}>{generalPalette}</div>
          </details>
        </>
      ) : generalPalette}
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
