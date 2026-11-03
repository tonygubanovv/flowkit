import { CSSProperties } from 'react';
import { TaskChatMessage } from '../lib/AiTaskSuggestions';
import { UI } from './Styles';
import { T } from './Theme';

export const AI_CHAT_STYLES = {
  suggestAction: { gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-start' } as CSSProperties,
  backdrop: {
    position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
    backgroundImage: 'radial-gradient(circle, color-mix(in srgb, var(--muted) 14%, transparent) .7px, transparent .9px)',
    backgroundSize: '12px 12px',
  } as CSSProperties,
  historyWrap: { position: 'relative', minWidth: 0, flex: 1 } as CSSProperties,
  historyTrigger: {
    display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, maxWidth: '100%',
    padding: '6px 4px', border: 'none', borderRadius: 6, background: 'transparent',
    color: T.text, fontSize: 13, fontWeight: 600, cursor: 'pointer',
  } as CSSProperties,
  historyTitle: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as CSSProperties,
  historyMenu: {
    ...UI.modal.popover({}), position: 'absolute', top: 'calc(100% + 24px)', left: 0,
    width: 'min(260px, calc(100vw - 80px))', padding: 10, zIndex: 1000,
    display: 'flex', flexDirection: 'column', gap: 8,
  } as CSSProperties,
  historyList: { display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 'min(320px, 45dvh)', overflowY: 'auto' } as CSSProperties,
  historyItem: (active: boolean): CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 8px',
    border: 'none', borderRadius: 6, textAlign: 'left', cursor: 'pointer',
    background: active ? 'var(--card-act)' : 'transparent', color: T.text2, fontSize: 12,
  }),
  historyDate: { flexShrink: 0, marginLeft: 'auto', color: T.muted, fontSize: 11 } as CSSProperties,
  shell: (mobile = false): CSSProperties => ({
    position: mobile ? 'fixed' : 'relative',
    inset: mobile ? 0 : undefined,
    zIndex: mobile ? 4200 : undefined,
    width: mobile ? '100%' : 'clamp(340px, 28vw, 400px)',
    flexShrink: 0,
    height: mobile ? '100dvh' : '100%',
    minHeight: 0,
    isolation: 'isolate',
    display: 'grid',
    gridTemplateRows: 'auto minmax(0, 1fr) auto',
    gridTemplateColumns: 'minmax(0, 1fr)',
    overflow: 'hidden',
    borderLeft: '1px solid var(--border-strong)',
    background: 'var(--card)',
  }),
  header: {
    position: 'relative', zIndex: 2, background: 'var(--card)',
    height: 57,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '0 14px 0 16px',
    borderBottom: '1px solid var(--border2)',
  } as CSSProperties,
  titleBody: { minWidth: 0, flex: 1 } as CSSProperties,
  titleWrap: {
    minWidth: 0,
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  } as CSSProperties,
  titleIcon: {
    width: 30,
    height: 30,
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    borderRadius: 8,
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
  } as CSSProperties,
  title: {
    color: T.text,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.1,
    fontFamily: 'inherit',
  } as CSSProperties,
  subtitle: {
    marginTop: 3,
    color: T.muted,
    fontSize: 11.5,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  } as CSSProperties,
  messages: {
    position: 'relative', zIndex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: 14,
    overflowY: 'auto',
  } as CSSProperties,
  empty: {
    margin: 'auto 0',
    padding: '24px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    color: T.text2,
    fontSize: 13,
    lineHeight: 1.45,
  } as CSSProperties,
  exampleGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  } as CSSProperties,
  example: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border2)',
    borderRadius: 8,
    background: 'var(--bg)',
    color: T.text2,
    fontSize: 12.5,
    fontWeight: 500,
    textAlign: 'left',
    cursor: 'pointer',
  } as CSSProperties,
  row: (role: TaskChatMessage['role']): CSSProperties => ({
    display: 'flex',
    justifyContent: role === 'user' ? 'flex-end' : 'flex-start',
  }),
  bubble: (role: TaskChatMessage['role'], pending = false): CSSProperties => ({
    maxWidth: role === 'user' ? '86%' : '94%',
    padding: role === 'user' ? '10px 12px' : '11px 12px',
    borderRadius: role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
    border: role === 'user' ? '1px solid transparent' : '1px solid var(--border2)',
    background: role === 'user' ? 'var(--accent-fill)' : 'var(--card)',
    color: role === 'user' ? 'var(--accent-text)' : pending ? T.muted : T.text,
    fontSize: 13,
    lineHeight: 1.45,
    overflowWrap: 'anywhere',
  }),
  composer: {
    position: 'relative', zIndex: 1,
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: 10,
    margin: 12,
    padding: 12,
    borderRadius: 12,
    border: '1px solid var(--border-input)',
    background: 'var(--card)',
  } as CSSProperties,
  input: {
    minWidth: 0,
    minHeight: 42,
    maxHeight: 120,
    resize: 'none',
    lineHeight: 1.35,
  } as CSSProperties,
  sendButton: {
    width: 42,
    height: 42,
    padding: 0,
    borderRadius: 8,
  } as CSSProperties,
  status: (tone: 'danger' | 'muted' = 'muted'): CSSProperties => ({
    gridColumn: '1 / -1',
    marginTop: -2,
    color: tone === 'danger' ? T.danger : T.muted,
    fontSize: 11.5,
    lineHeight: 1.35,
  }),
  mentionMenu: {
    ...UI.modal.dropdownMenu(false, 240, 260),
    left: 14,
    right: 14,
    top: 'auto',
    bottom: 'calc(100% + 6px)',
    minWidth: 0,
  } as CSSProperties,
  mentionOption: {
    width: '100%',
    minWidth: 0,
  } as CSSProperties,
  mentionTitle: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as CSSProperties,
  mentionProject: {
    marginLeft: 'auto',
    flexShrink: 0,
    color: T.muted,
    fontSize: 11.5,
    fontWeight: 700,
  } as CSSProperties,
  contextRow: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: -4,
  } as CSSProperties,
  contextChip: {
    ...UI.taskSuggestion.taskBadge('accent'),
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    maxWidth: 240,
    padding: '5px 6px 5px 10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  } as CSSProperties,
  contextChipText: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as CSSProperties,
  hint: {
    color: T.muted,
    fontSize: 12,
    lineHeight: 1.45,
  } as CSSProperties,
};

export const CHAT_BACKGROUND_CSS = `
.fk-chat-dotfield::after {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background-image: radial-gradient(circle, color-mix(in srgb, var(--accent) 45%, var(--muted)) 1px, transparent 1.3px);
  background-size: 12px 12px;
  mask-image: radial-gradient(circle 65px at var(--chat-pointer-x, -200px) var(--chat-pointer-y, -200px), black, transparent);
  opacity: var(--chat-pointer-visible, 0);
}
@media (prefers-reduced-motion: reduce) {
  .fk-chat-dotfield::after { display: none; }
}
`;
