import { searchTasks } from '../../lib/TaskSearch';
import { isDoneTask } from '../../lib/TaskDomain';
import { APP_STATUS_STYLES } from '../../styles/AppStatusStyles';
﻿import React, { useEffect, useRef, useState } from 'react';
import { UI } from '../../styles/Styles';
import { AppData, Task } from '../../types/Schemas';
import { Icon, DateBadge } from '../ui/UiExports';
import { innerDesk, innerMob, wrapDesk, wrapMob } from './Shared';
interface SearchModalProps {
  data: AppData;
  onClose: () => void;
  onSelect: (t: Task) => void;
  isMobile?: boolean;
}

export function SearchModal({ data, onClose, onSelect, isMobile }: SearchModalProps) {
  const [q, setQ] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  useEffect(() => { setSelectedIndex(0); }, [q]);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const matches = searchTasks(data.tasks, q);
  const results = matches.slice(0, 8);


  return (
    <div style={isMobile ? wrapMob : UI.modal.searchOverlay(wrapDesk)} onMouseDown={!isMobile ? e => e.target === e.currentTarget && onClose() : undefined}>
      <div style={UI.modal.searchShell(!!isMobile, isMobile ? innerMob : innerDesk)} onMouseDown={e => e.stopPropagation()}>
        <div style={UI.modal.searchHeader(results.length > 0)}>
          <Icon name="search" size={20} color={'var(--muted)'} />
          <input ref={ref} value={q} aria-label="Поиск задач" onChange={e => setQ(e.target.value)} onKeyDown={(event) => {
            if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && results.length) {
              event.preventDefault();
              setSelectedIndex((index) => (index + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length);
            }
            if (event.key === 'Enter' && results.length) { event.preventDefault(); onSelect(results[Math.min(selectedIndex, results.length - 1)]); onClose(); }
          }} placeholder="Найти задачу..." style={UI.modal.searchInput} />
          <span style={UI.modal.shortcutBadge}>ESC</span>
        </div>

        <div role="status" style={UI.modal.searchResultMeta}>
          <div style={APP_STATUS_STYLES.notice}>{q.trim().length < 2 ? 'Введите хотя бы 2 символа' : matches.length === 0 ? 'Ничего не найдено' : `Результатов: ${matches.length}. Показано: ${results.length}`}</div>
        </div>
        {results.length > 0 && <div style={UI.modal.searchResults}>{results.map((task: Task, index) => (
          <button key={task.id} onClick={() => { onSelect(task); onClose(); }} className="fk-hover-subtle" onMouseEnter={() => setSelectedIndex(index)} style={APP_STATUS_STYLES.searchRow(index === selectedIndex)}>
            <div style={UI.modal.searchResultBody}>
              <div style={UI.modal.searchResultTitle(isDoneTask(task, data.projects))}>{task.title}</div>
              <div style={UI.modal.searchResultMeta}>{data.projects.find((p) => p.id === task.projectId)?.name}</div>
            </div>
            <DateBadge deadline={task.deadline} isDone={isDoneTask(task, data.projects)} />
          </button>
        ))}</div>}
      </div>
    </div>
  );
}

