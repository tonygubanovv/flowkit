import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './ui/UiExports';
import { UI } from '../styles/Styles';
import { AI_ACTION_STYLES as styles } from '../styles/AiActionStyles';

export function AiActionsMenu({ onChat, onSuggest, canSuggest }: { onChat: () => void; onSuggest: () => void; canSuggest: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  return <div ref={ref} style={UI.app.popoverWrap()} onKeyDown={(event) => { if (event.key === 'Escape') { setOpen(false); ref.current?.querySelector('button')?.focus(); } }}>
    <button type="button" aria-expanded={open} aria-label="AI-помощник" onClick={() => setOpen(!open)} style={styles.trigger()} className="fk-hover-subtle"><Icon name="spark" size={18} />AI<Icon name="chevD" size={12} /></button>
    {open && <div style={styles.menu}>
      <button type="button" style={UI.control.menuItem(false)} className="fk-hover-subtle" onClick={() => { onChat(); setOpen(false); }}><Icon name="message" size={16} />Открыть чат</button>
      {canSuggest && <button type="button" style={UI.control.menuItem(false)} className="fk-hover-subtle" onClick={() => { onSuggest(); setOpen(false); }}><Icon name="spark" size={16} />Предложить задачи</button>}
    </div>}
  </div>;
}
