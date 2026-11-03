import { CSSProperties } from 'react';
import { T } from './Theme';
import { UI } from './Styles';

export const APP_STATUS_STYLES = {
  page: { minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, background: T.bg, color: T.text } as CSSProperties,
  embedded: { minHeight: 0, width: '100%', display: 'grid', placeItems: 'center', padding: 24, background: T.bg, color: T.text } as CSSProperties,
  content: { width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 16 } as CSSProperties,
  title: { fontSize: 22, lineHeight: 1.3, fontWeight: 600 } as CSSProperties,
  text: { color: T.text2, fontSize: 14, lineHeight: 1.6 } as CSSProperties,
  actions: { display: 'flex', flexWrap: 'wrap', gap: 8 } as CSSProperties,
  searchRow: (active: boolean): CSSProperties => ({ ...UI.modal.searchResult, background: active ? T.cardActive : 'transparent' }),
  notice: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '10px 24px', borderBottom: `1px solid ${T.border}`, background: T.card, color: T.text2, fontSize: 13 } as CSSProperties,
};
