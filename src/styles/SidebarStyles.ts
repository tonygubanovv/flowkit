import { CSSProperties } from 'react';
import { UI } from './Styles';

export const SIDEBAR_STYLES = {
  search: (): CSSProperties => UI.control.button('subtle', 'sm', false, {
    width: '100%', minHeight: 32, marginBottom: 12, padding: '6px 11px',
    justifyContent: 'flex-start', gap: 10, fontSize: 12, fontWeight: 500,
    background: 'var(--card)', border: '1px solid var(--border-input)',
  }),
  projectActions: (): CSSProperties => UI.control.iconButton(false, 26, {
    flexShrink: 0, marginRight: 4, border: 'none', color: 'var(--muted)',
  }),
  projectTotal: { marginLeft: 'auto', color: 'var(--muted)', fontSize: 11, fontWeight: 500 } as CSSProperties,
};
