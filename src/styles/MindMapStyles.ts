import { CSSProperties } from 'react';
import type { Theme } from 'mind-elixir';
import { MIND_MAP_COMMENT_WIDTH } from '../lib/MindMaps';
import { UI, boardDotGrid } from './Styles';
import { BRAND_COLORS, FILL_PRESETS, FONT_FAMILY } from './Theme';

export const MIND_MAP_BRANCH_COLORS = FILL_PRESETS;

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
  muted: { color: 'var(--muted)', fontSize: 12, lineHeight: 1.6 } as CSSProperties,
  workspace: { flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' } as CSSProperties,
  toolbar: { minHeight: 53, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, padding: '10px 16px', borderBottom: '1px solid var(--border)' } as CSSProperties,
  help: { position: 'absolute', right: 16, bottom: 60, width: 'min(340px, calc(100% - 32px))', boxSizing: 'border-box', maxHeight: 'calc(100% - 80px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: 16, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text2)', fontSize: 12, lineHeight: 1.6, zIndex: 14 } as CSSProperties,
  spacer: { marginLeft: 'auto' } as CSSProperties,
  title: UI.control.input({ flex: 1, minWidth: 80, width: 'auto', padding: '4px 0', background: 'transparent', border: 'none', fontSize: 14, fontWeight: 600 }),
  row: { display: 'flex', alignItems: 'center', gap: 8 } as CSSProperties,
  canvas: { position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' } as CSSProperties,
  canvasControls: { position: 'absolute', right: 16, bottom: 14, display: 'flex', alignItems: 'center', gap: 2, padding: 3, borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border)', zIndex: 12 } as CSSProperties,
  zoom: { minWidth: 42, textAlign: 'center', color: 'var(--text2)', fontSize: 11, fontVariantNumeric: 'tabular-nums' } as CSSProperties,
  notice: { position: 'absolute', left: '50%', bottom: 56, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8, maxWidth: 380, padding: '7px 8px 7px 12px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--danger)', color: 'var(--text)', fontSize: 12, zIndex: 12 } as CSSProperties,
  host: { width: '100%', height: '100%', position: 'absolute', inset: 0 } as CSSProperties,
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
  object: { position: 'absolute', cursor: 'grab', userSelect: 'none', touchAction: 'none' } as CSSProperties,
  shapeHandle: { position: 'absolute', right: -5, bottom: -5, width: 10, height: 10, borderRadius: 3,
    background: 'var(--card)', border: '1px solid var(--accent)', cursor: 'nwse-resize', touchAction: 'none' } as CSSProperties,
  objectEditor: { position: 'absolute', inset: 0, margin: 0, fontFamily: 'inherit', background: 'transparent',
    border: 'none', outline: 'none', color: 'transparent', caretColor: 'var(--text)', resize: 'none', overflow: 'hidden' } as CSSProperties,
  pinCard: { position: 'absolute', left: 34, top: 0, width: 'max-content', maxWidth: MIND_MAP_COMMENT_WIDTH,
    boxSizing: 'border-box', padding: '8px 10px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border)',
    boxShadow: '0 10px 28px rgba(0,0,0,.28)', fontSize: 12, lineHeight: '17px', color: 'var(--text)',
    whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' } as CSSProperties,
  toolHint: { position: 'absolute', left: '50%', bottom: 14, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
    borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text2)', fontSize: 12, zIndex: 12 } as CSSProperties,
};

export const MIND_MAP_CSS = `
.fk-mind-map .map-container, .fk-mind-map me-tpc, .fk-mind-map .context-menu,
.fk-mind-map #input-box { font-family: var(--font-family) !important; }
/* Точечная плоскость внутри .map-canvas: движок сам двигает и масштабирует этот слой, поэтому точки едут за доской. */
.fk-mind-map .map-canvas::before { content: ''; position: absolute; left: -2000px; top: -2000px; right: -2000px; bottom: -2000px;
  background: ${boardDotGrid('var(--border)')}; pointer-events: none; }
.fk-mind-map me-root me-tpc { font-size: 19px; font-weight: 600; }
.fk-mind-map me-tpc { font-size: 13px; box-shadow: none; }
.fk-mind-map me-tpc { cursor: pointer; }
.fk-mind-map me-tpc > .text { line-height: 19px; }
.fk-mind-map me-root me-tpc > .text { line-height: 28px; }
.fk-mind-map me-tpc.selected { outline: 2px solid var(--accent); outline-offset: 1px; box-shadow: none; }
.fk-mind-map me-tpc:focus-visible { outline: none; }
.fk-mind-map .map-container .selection-area { background: var(--accent-dim) !important; border: 1px solid var(--accent) !important; border-radius: 3px; }
.fk-mind-map .map-container me-tpc .show { background: var(--accent-mid); opacity: 1; }
.fk-mind-map .context-menu { font-size: 12px; }
.fk-mind-map .context-menu .menu-list { border-radius: 8px; border: 1px solid var(--border); box-shadow: none; }
.fk-mind-map .context-menu .menu-list li:hover { background: var(--card-hov); filter: none; }
.fk-mind-map .context-menu .key { background: var(--card-hov); color: var(--muted); }
.fk-mind-map me-tpc .tags { color: var(--muted); font-size: 10px; }
.fk-mind-map me-tpc .tags span { color: var(--text2); background: var(--card-hov); border: none; border-radius: 4px; }
.fk-mind-map me-tpc a { color: var(--text2); }
.fk-mind-map .fk-board-link, .fk-mind-layer .fk-board-link { color: var(--accent); cursor: pointer; text-decoration: underline; text-decoration-thickness: 1px; text-decoration-color: color-mix(in srgb, var(--accent) 45%, transparent); text-underline-offset: 3px; }
.fk-mind-map .fk-board-link:hover, .fk-mind-layer .fk-board-link:hover { color: color-mix(in srgb, var(--accent) 82%, #000); text-decoration-color: var(--accent); }
.fk-mind-map .fk-board-link:visited, .fk-mind-layer .fk-board-link:visited { color: color-mix(in srgb, var(--accent) 88%, var(--muted)); }
.fk-mind-map[data-navigation="grab"], .fk-mind-map[data-navigation="grab"] * { cursor: grab !important; }
.fk-mind-map[data-navigation="grabbing"], .fk-mind-map[data-navigation="grabbing"] * { cursor: grabbing !important; user-select: none; }
.fk-mind-map[data-tool] .map-container { cursor: crosshair; }
.fk-mind-map[data-tool] me-tpc { cursor: crosshair; }
.fk-mind-layer { position: absolute; left: 0; top: 0; width: 0; height: 0; pointer-events: none; z-index: 30; }
.fk-mind-object { pointer-events: auto; }
.fk-mind-editor::selection { background: var(--accent-dim); }
.fk-mind-pin-card { opacity: 0; pointer-events: none; }
.fk-mind-pin:hover > .fk-mind-pin-card, .fk-mind-pin[data-open] > .fk-mind-pin-card, .fk-mind-pin-edit .fk-mind-pin-card { opacity: 1; pointer-events: auto; }
.fk-mind-layer .fk-mind-object:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.fk-mind-map .map-container me-parent me-epd,
.fk-mind-map .map-container me-parent me-epd.minus { opacity: 1; border-radius: 50%; background-image: none !important; background-color: var(--card-act); border: 1px solid var(--border-strong); }
.fk-mind-map .map-container me-parent me-epd.minus { background-color: var(--card); border-color: var(--border); }
.fk-mind-map .map-container me-parent me-epd::before { content: '+'; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 13px; line-height: 1; color: var(--text); }
.fk-mind-map .map-container me-parent me-epd.minus::before { content: '−'; color: var(--text2); }
.fk-mind-map .map-container me-parent me-epd:hover,
.fk-mind-map .map-container me-parent me-epd.minus:hover { opacity: 1; background-color: var(--card-hov); border-color: var(--border-strong); }
`;
