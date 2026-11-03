import { CSSProperties } from 'react';
import type { Theme } from 'mind-elixir';
import { UI } from './Styles';
import { BRAND_COLORS, FONT_FAMILY } from './Theme';

export const MIND_MAP_THEME: Theme = {
  name: 'FlowKit', type: 'dark',
  palette: [BRAND_COLORS.teal, BRAND_COLORS.blue, BRAND_COLORS.violet, BRAND_COLORS.amber, BRAND_COLORS.rose, BRAND_COLORS.emerald],
  cssVar: {
    '--bgcolor': 'var(--bg)', '--color': 'var(--text2)', '--main-color': 'var(--text)',
    '--main-bgcolor': 'var(--card)', '--main-bgcolor-transparent': 'var(--card)',
    '--main-border': '1px solid var(--border)', '--selected': 'var(--accent)',
    '--accent-color': 'var(--accent)', '--root-color': 'var(--text)', '--root-bgcolor': 'var(--card-act)',
    '--root-border-color': 'var(--border-strong)', '--root-radius': '8px', '--main-radius': '8px',
    '--topic-padding': '10px 14px', '--panel-color': 'var(--text2)', '--panel-bgcolor': 'var(--card)',
    '--panel-border-color': 'var(--border)', '--node-gap-x': '48px', '--node-gap-y': '18px',
  },
};

export const MIND_MAP_STYLES = {
  shell: { display: 'flex', flex: 1, minWidth: 0, height: '100%', minHeight: 0, overflow: 'hidden', fontFamily: FONT_FAMILY } as CSSProperties,
  input: UI.control.input({ fontSize: 12, padding: '8px 10px' }),
  truncate: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' } as CSSProperties,
  muted: { color: 'var(--muted)', fontSize: 12, lineHeight: 1.6 } as CSSProperties,
  label: { color: 'var(--muted)', fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase' } as CSSProperties,
  workspace: { flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' } as CSSProperties,
  toolbar: { minHeight: 53, display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderBottom: '1px solid var(--border)' } as CSSProperties,
  popup: (x: number, y: number): CSSProperties => ({ ...UI.modal.popover({}), position: 'fixed',
    left: `clamp(16px, ${x}px, calc(100vw - 316px))`, top: `clamp(72px, ${y}px, calc(100dvh - 420px))`,
    width: 300, maxHeight: 'min(480px, calc(100dvh - 96px))', overflowY: 'auto', zIndex: 1500,
    padding: 16, display: 'flex', flexDirection: 'column', gap: 14, animation: 'none' }),
  spacer: { marginLeft: 'auto' } as CSSProperties,
  title: UI.control.input({ flex: 1, minWidth: 80, width: 'auto', padding: '4px 0', background: 'transparent', border: 'none', fontSize: 14, fontWeight: 600 }),
  row: { display: 'flex', alignItems: 'center', gap: 8 } as CSSProperties,
  canvas: { position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' } as CSSProperties,
  canvasControls: { position: 'absolute', left: 16, bottom: 14, display: 'flex', alignItems: 'center', padding: 3, gap: 2, borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border)' } as CSSProperties,
  host: { width: '100%', height: '100%', position: 'absolute', inset: 0 } as CSSProperties,
  help: { position: 'absolute', bottom: 12, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none', color: 'var(--muted)', fontSize: 11 } as CSSProperties,
  section: { display: 'flex', flexDirection: 'column', gap: 8 } as CSSProperties,
  linked: { display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 6, padding: 10, borderRadius: 8, background: 'var(--card)' } as CSSProperties,
  fullButton: { width: '100%', justifyContent: 'flex-start', textAlign: 'left', overflow: 'hidden' } as CSSProperties,
  attachment: { display: 'flex', flexDirection: 'column', gap: 5, padding: 10, borderRadius: 8, background: 'var(--card)' } as CSSProperties,
  link: { color: 'var(--text2)', fontSize: 12, textDecoration: 'none', overflowWrap: 'anywhere' } as CSSProperties,
  empty: { margin: 'auto', maxWidth: 390, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 } as CSSProperties,
  emptyTitle: { color: 'var(--text)', fontSize: 18, fontWeight: 600, margin: 0 } as CSSProperties,
  error: { color: 'var(--danger)', fontSize: 12, lineHeight: 1.6 } as CSSProperties,
  image: { width: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: 8 } as CSSProperties,
  hidden: UI.layout.hidden,
};

export const MIND_MAP_CSS = `
.fk-mind-map .map-container, .fk-mind-map me-tpc, .fk-mind-map .context-menu,
.fk-mind-map #input-box { font-family: var(--font-family) !important; }
.fk-mind-map me-root me-tpc { font-size: 19px; font-weight: 600; }
.fk-mind-map me-tpc { font-size: 13px; box-shadow: none; }
.fk-mind-map .map-container { cursor: grab; }
.fk-mind-map .map-container:active { cursor: grabbing; }
.fk-mind-map me-tpc { cursor: pointer; }
.fk-mind-map me-tpc.selected { outline: none; box-shadow: 0 0 0 1px var(--accent); border-color: transparent !important; }
.fk-mind-map me-tpc:focus-visible { outline: none; }
.fk-mind-map .context-menu { font-size: 12px; }
.fk-mind-map .context-menu .menu-list { border-radius: 8px; border: 1px solid var(--border); box-shadow: none; }
.fk-mind-map .context-menu .menu-list li:hover { background: var(--card-hov); filter: none; }
.fk-mind-map .context-menu .key { background: var(--card-hov); color: var(--muted); }
.fk-mind-map me-tpc .tags { color: var(--muted); font-size: 10px; }
.fk-mind-map me-tpc .tags span { color: var(--text2); background: var(--card-hov); border: none; border-radius: 4px; }
.fk-mind-map me-tpc a { color: var(--text2); }
`;
