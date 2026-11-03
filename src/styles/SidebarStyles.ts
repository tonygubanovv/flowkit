import { CSSProperties } from 'react';
import { UI } from './Styles';

export const SIDEBAR_STYLES = {
  projectActions: (): CSSProperties => UI.control.iconButton(false, 26, {
    flexShrink: 0, marginRight: 4, border: 'none', color: 'var(--muted)',
  }),
  projectTotal: { marginLeft: 'auto', color: 'var(--muted)', fontSize: 11, fontWeight: 500 } as CSSProperties,
};
