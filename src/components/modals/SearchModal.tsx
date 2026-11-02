import React, { useEffect, useRef, useState } from 'react';
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
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const isTaskDone = (task: Task) => {
    if (task.completed) return true;

    const project = data.projects.find((project) => project.id === task.projectId);
    return project?.columns.find((column) => column.id === task.columnId)?.isDone === true;
  };

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

  const results = q.trim().length < 2 ? [] : data.tasks.filter((t: Task) => t.title.toLowerCase().includes(q.toLowerCase()) || t.description?.toLowerCase().includes(q.toLowerCase())).slice(0, 8);

  return (
    <div style={isMobile ? wrapMob : UI.modal.searchOverlay(wrapDesk)} onMouseDown={!isMobile ? e => e.target === e.currentTarget && onClose() : undefined}>
      <div style={UI.modal.searchShell(!!isMobile, isMobile ? innerMob : innerDesk)} onMouseDown={e => e.stopPropagation()}>
        <div style={UI.modal.searchHeader(results.length > 0)}>
          <Icon name="search" size={20} color={'var(--muted)'} />
          <input ref={ref} value={q} onChange={e => setQ(e.target.value)} placeholder="Найти задачу..." style={UI.modal.searchInput} />
          <span style={UI.modal.shortcutBadge}>ESC</span>
        </div>

        {results.length > 0 && <div style={UI.modal.searchResults}>{results.map((task: Task) => (
          <button key={task.id} onClick={() => { onSelect(task); onClose(); }} className="fk-hover-subtle" style={UI.modal.searchResult}>
            <div style={UI.modal.searchResultBody}>
              <div style={UI.modal.searchResultTitle(isTaskDone(task))}>{task.title}</div>
              <div style={UI.modal.searchResultMeta}>{data.projects.find((p) => p.id === task.projectId)?.name}</div>
            </div>
            <DateBadge deadline={task.deadline} isDone={isTaskDone(task)} />
          </button>
        ))}</div>}
      </div>
    </div>
  );
}

