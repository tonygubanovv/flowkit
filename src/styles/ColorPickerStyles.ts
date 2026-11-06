import { CSSProperties } from 'react';
import { FONT_MONO, T, readableTextOn } from './Theme';
import { UI } from './Styles';

export const COLOR_PICKER_STYLES = {
  shell: (compact: boolean): CSSProperties => ({ display: 'flex', flexDirection: 'column', gap: compact ? 8 : 10, width: '100%', minWidth: 0 }),
  group: { display: 'grid', gap: 4 } as CSSProperties,
  grid: { display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 6 } as CSSProperties,
  swatch: (color: string, selected: boolean, compact = false): CSSProperties => ({
    width: '100%', minWidth: 0, height: compact ? 22 : 28, padding: 0, display: 'grid', placeItems: 'center',
    background: color, color: readableTextOn(color), borderRadius: 6,
    border: 'none', cursor: 'pointer',
  }),
  label: { color: T.muted, fontSize: 11, fontWeight: 500 } as CSSProperties,
  more: { color: T.text2, fontSize: 12, cursor: 'pointer' } as CSSProperties,
  moreGroups: { display: 'grid', gap: 8, marginTop: 8 } as CSSProperties,
  inputRow: { display: 'grid', gridTemplateColumns: '28px minmax(0, 1fr)', gap: 8, alignItems: 'center' } as CSSProperties,
  preview: (color: string): CSSProperties => ({ width: 28, height: 28, borderRadius: 6, background: color, border: `1px solid ${T.border}` }),
  input: (error: boolean): CSSProperties => UI.control.input({ height: 32, minWidth: 0, padding: '0 10px', fontSize: 12, fontFamily: FONT_MONO, borderColor: error ? T.danger : T.border }),
  error: { color: T.danger, fontSize: 11, lineHeight: 1.4 } as CSSProperties,
};
