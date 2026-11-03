import React, { useEffect, useRef, useState } from 'react';
import { AiChatSession } from '../types/Schemas';
import { UI } from '../styles/Styles';
import { AI_CHAT_STYLES as styles } from '../styles/AiChatStyles';
import { Icon, Btn } from './ui/UiExports';

interface Props {
  sessions: AiChatSession[];
  activeId: string;
  title: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function ChatHistoryMenu({ sessions, activeId, title, onSelect, onNew }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const search = query.trim().toLocaleLowerCase('ru');
  const matches = sessions.filter((session) => !search || session.title.toLocaleLowerCase('ru').includes(search)
    || session.draft.toLocaleLowerCase('ru').includes(search)
    || session.messages.some((message) => message.content.toLocaleLowerCase('ru').includes(search)));
  return (
    <div ref={ref} style={styles.historyWrap} onKeyDown={(event) => {
      if (event.key === 'Escape') { setOpen(false); ref.current?.querySelector('button')?.focus(); }
    }}>
      <button type="button" style={styles.historyTrigger} className="fk-hover-subtle"
        aria-label="История диалогов" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span style={styles.historyTitle}>{title}</span><Icon name="chevD" size={14} />
      </button>
      {open && <div style={styles.historyMenu} aria-label="Прошлые обсуждения">
        <input autoFocus aria-label="Поиск по диалогам" placeholder="Найти обсуждение…" value={query}
          onChange={(event) => setQuery(event.target.value)} style={UI.control.input()} />
        <div style={styles.historyList}>
          {matches.length === 0 && <div style={styles.hint}>{search ? 'Ничего не найдено' : 'Здесь появятся ваши разговоры'}</div>}
          {matches.map((session) => <button key={session.id} type="button" aria-current={session.id === activeId ? 'true' : undefined}
            className="fk-hover-subtle" style={styles.historyItem(session.id === activeId)}
            onClick={() => { onSelect(session.id); setOpen(false); }}>
            <span style={styles.historyTitle}>{session.title}</span>
            <span style={styles.historyDate}>{new Date(session.updatedAt).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}</span>
          </button>)}
        </div>
        <Btn variant="subtle" onClick={() => { onNew(); setOpen(false); }}><Icon name="plus" size={14} />Новый разговор</Btn>
      </div>}
    </div>
  );
}
