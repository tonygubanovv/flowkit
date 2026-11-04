import React, { useEffect, useRef, useState } from 'react';
import type { MindMapObject } from '../types/Schemas';
import { Icon } from './ui/UiExports';
import { MIND_MAP_STYLES as S } from '../styles/MindMapStyles';

export type MindMapTool = 'select' | 'text' | 'rect' | 'ellipse' | 'comment';

export const MIND_MAP_TOOLS: { id: MindMapTool; label: string; icon: string }[] = [
  { id: 'select', label: 'Указатель', icon: 'pointer' },
  { id: 'text', label: 'Текст', icon: 'type' },
  { id: 'rect', label: 'Прямоугольник', icon: 'rect' },
  { id: 'ellipse', label: 'Эллипс', icon: 'ellipse' },
  { id: 'comment', label: 'Комментарий', icon: 'message' },
];

interface Props {
  objects: MindMapObject[];
  scale: number;
  selectedId: string | null;
  editingId: string | null;
  onSelect: (id: string | null) => void;
  onEdit: (id: string | null) => void;
  onCommit: (objects: MindMapObject[]) => void;
  onObjectContext: (id: string, point: { x: number; y: number }) => void;
}

const lineHeightOf = (object: MindMapObject): number => {
  const size = object.kind === 'comment' ? 12 : (object.size || 15);
  return Math.round(size * (object.kind === 'comment' ? 1.45 : 1.4));
};

const typeStyle = (object: MindMapObject) => ({
  fontSize: object.kind === 'comment' ? 12 : (object.size || 15),
  lineHeight: `${lineHeightOf(object)}px`,
  whiteSpace: (object.kind === 'text' ? 'pre' : 'pre-wrap') as React.CSSProperties['whiteSpace'],
  overflowWrap: 'anywhere' as const,
});

const objectStyle = (object: MindMapObject): React.CSSProperties => {
  if (object.kind === 'shape') {
    return { width: object.w || 220, height: object.h || 130, borderRadius: object.shape === 'ellipse' ? '50%' : 10,
      background: object.color ? `color-mix(in srgb, ${object.color} 14%, var(--card-act))` : 'var(--card-act)',
      border: `1px solid ${object.color || 'var(--border-strong)'}` };
  }
  if (object.kind === 'comment') {
    return { width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: '50% 50% 50% 0', background: object.color || 'var(--accent)', color: '#ffffff',
      boxShadow: '0 2px 10px rgba(0,0,0,.35)' };
  }
  return { ...typeStyle(object), width: 'max-content', padding: '2px 0', color: object.color || 'var(--text)' };
};

const editorStyle = (object: MindMapObject): React.CSSProperties => ({
  ...S.objectEditor, ...typeStyle(object),
  caretColor: object.color || 'var(--text)',
  padding: object.kind === 'comment' ? 0 : '2px 0',
});

export function MindMapObjects(props: Props) {
  const [draft, setDraft] = useState<MindMapObject[]>(props.objects);
  const [editText, setEditText] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; startX: number; startY: number; x: number; y: number } | null>(null);
  const draftRef = useRef<MindMapObject[]>(props.objects);
  const editTextRef = useRef('');
  const propsRef = useRef(props);
  propsRef.current = props;
  editTextRef.current = editText;

  useEffect(() => {
    draftRef.current = props.objects;
    setDraft(props.objects);
  }, [props.objects]);

  useEffect(() => {
    const id = propsRef.current.editingId;
    if (!id) return;
    const object = propsRef.current.objects.find((item) => item.id === id);
    if (object) { setEditText(object.text); editTextRef.current = object.text; }
  }, [props.editingId]);

  const commit = (next: MindMapObject[]) => {
    draftRef.current = next;
    setDraft(next);
    propsRef.current.onCommit(next);
  };

  const finishEdit = () => {
    const id = propsRef.current.editingId;
    if (!id) return;
    const text = editTextRef.current;
    const next = draftRef.current
      .filter((item) => item.id !== id || text.trim())
      .map((item) => item.id === id ? { ...item, text } : item);
    commit(next);
    propsRef.current.onEdit(null);
  };

  const removeSelected = () => {
    const id = propsRef.current.selectedId;
    if (!id) return;
    commit(draftRef.current.filter((item) => item.id !== id));
    propsRef.current.onSelect(null);
  };

  const finishEditRef = useRef(finishEdit);
  const removeSelectedRef = useRef(removeSelected);
  finishEditRef.current = finishEdit;
  removeSelectedRef.current = removeSelected;

  useEffect(() => {
    const layer = root.current;
    if (!layer) return;
    const stop = (event: Event) => event.stopPropagation();
    const onContext = (event: MouseEvent) => {
      event.stopPropagation();
      const target = event.target as HTMLElement | null;
      // Во время ввода оставляем системное меню текста: вырезать, копировать, вставить.
      if (target?.tagName === 'TEXTAREA') return;
      event.preventDefault();
      const id = target?.closest('[data-object-id]')?.getAttribute('data-object-id');
      if (id) propsRef.current.onObjectContext(id, { x: event.clientX, y: event.clientY });
    };
    // Клавиши не должны доходить до движка: он трактует Delete/Backspace/Enter как команды карты.
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editing = target?.tagName === 'TEXTAREA' || target?.tagName === 'INPUT' || target?.isContentEditable;
      if (editing) {
        if (event.key === 'Escape') { event.preventDefault(); finishEditRef.current(); }
        else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); finishEditRef.current(); }
      } else if ((event.key === 'Delete' || event.key === 'Backspace') && propsRef.current.selectedId) {
        event.preventDefault();
        removeSelectedRef.current();
      }
      event.stopPropagation();
    };
    layer.addEventListener('mousedown', stop);
    layer.addEventListener('contextmenu', onContext);
    layer.addEventListener('keydown', onKeyDown);
    return () => {
      layer.removeEventListener('mousedown', stop);
      layer.removeEventListener('contextmenu', onContext);
      layer.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const state = propsRef.current;
      if (!state.selectedId || state.editingId) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA'].includes(target.tagName))) return;
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;
      event.preventDefault();
      removeSelectedRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const startDrag = (event: React.PointerEvent<HTMLDivElement>, object: MindMapObject) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    props.onSelect(object.id);
    drag.current = { id: object.id, startX: event.clientX, startY: event.clientY, x: object.x, y: object.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    if (!active) return;
    const dx = Math.round((event.clientX - active.startX) / props.scale);
    const dy = Math.round((event.clientY - active.startY) / props.scale);
    const next = draftRef.current.map((item) => item.id === active.id ? { ...item, x: active.x + dx, y: active.y + dy } : item);
    draftRef.current = next;
    setDraft(next);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    drag.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    commit(draftRef.current);
  };

  const beginEdit = (object: MindMapObject) => {
    setEditText(object.text);
    editTextRef.current = object.text;
    props.onEdit(object.id);
  };

  return <div ref={root} className="fk-mind-layer">
    {draft.map((object) => {
      const selected = object.id === props.selectedId;
      const editing = object.id === props.editingId;
      const editable = object.kind !== 'shape';
      const editor = editing ? <textarea className="fk-mind-editor" aria-label="Текст на доске" value={editText}
        ref={(element) => {
          if (!element) return;
          element.focus();
          const end = element.value.length;
          element.setSelectionRange(end, end);
        }}
        onChange={(event) => { setEditText(event.target.value); editTextRef.current = event.target.value; }}
        onBlur={finishEdit}
        style={editorStyle(object)} /> : null;

      if (object.kind === 'comment') {
        if (editing) {
          return <div key={object.id} className="fk-mind-pin-edit" style={{ position: 'absolute', left: object.x, top: object.y }}>
            <div style={{ ...S.object, ...objectStyle(object), position: 'absolute', left: 0, top: 0, cursor: 'default' }}><Icon name="message" size={14} /></div>
            <div className="fk-mind-pin-card" style={S.pinCard}>
              <div style={{ position: 'relative' }}>
                <div style={{ ...typeStyle(object), color: 'var(--text)', minWidth: 8, minHeight: lineHeightOf(object) }}>{editText}</div>
                {editor}
              </div>
            </div>
          </div>;
        }
        return <div key={object.id} className="fk-mind-object fk-mind-pin" data-open={selected || undefined}
          data-object-id={object.id}
          role="button" tabIndex={-1}
          aria-label={object.text.slice(0, 80) || 'Пустой комментарий'}
          style={{ ...S.object, left: object.x, top: object.y, ...objectStyle(object), ...(selected ? { outline: '2px solid var(--accent)', outlineOffset: 2 } : {}) }}
          onPointerDown={(event) => startDrag(event, object)}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onDoubleClick={(event) => { event.stopPropagation(); beginEdit(object); }}>
          <Icon name="message" size={14} />
          <div className="fk-mind-pin-card" style={S.pinCard}>{object.text}</div>
        </div>;
      }

      if (editing) {
        return <div key={object.id} style={{ position: 'absolute', left: object.x, top: object.y,
          outline: '1px solid var(--accent)', outlineOffset: 2 }}>
          <div style={{ ...objectStyle(object), minWidth: 8, minHeight: lineHeightOf(object) + 4 }}>{editText}</div>
          {editor}
        </div>;
      }
      return <div key={object.id} className="fk-mind-object"
        data-object-id={object.id}
        role={editable ? 'button' : undefined} tabIndex={-1}
        aria-label={editable ? (object.text.slice(0, 80) || 'Пустой текст') : 'Фигура на доске'}
        style={{ ...S.object, left: object.x, top: object.y, ...objectStyle(object), ...(selected ? { outline: '2px solid var(--accent)', outlineOffset: 2 } : {}) }}
        onPointerDown={(event) => startDrag(event, object)}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onDoubleClick={(event) => { event.stopPropagation(); if (editable) beginEdit(object); }}>
        {object.text}
      </div>;
    })}
  </div>;
}
