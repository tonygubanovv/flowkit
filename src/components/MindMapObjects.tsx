import React, { useEffect, useRef, useState } from 'react';
import type { MindMapObject } from '../types/Schemas';
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
}

const objectStyle = (object: MindMapObject): React.CSSProperties => {
  const base: React.CSSProperties = { left: object.x, top: object.y, width: object.w };
  if (object.kind === 'shape') {
    return { ...base, height: object.h || 120, borderRadius: object.shape === 'ellipse' ? '50%' : 10,
      background: object.color ? `color-mix(in srgb, ${object.color} 14%, var(--card-act))` : 'var(--card-act)',
      border: `1px solid ${object.color || 'var(--border-strong)'}` };
  }
  if (object.kind === 'comment') {
    return { ...base, padding: '8px 10px', borderRadius: 8, background: 'var(--card)',
      border: '1px solid var(--border)', borderLeft: `3px solid ${object.color || 'var(--accent)'}`,
      fontSize: 12, lineHeight: 1.45, color: 'var(--text)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' };
  }
  return { ...base, padding: '2px 0', fontSize: object.size || 15, lineHeight: 1.4, color: object.color || 'var(--text)',
    whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' };
};

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
    layer.addEventListener('contextmenu', stop);
    layer.addEventListener('keydown', onKeyDown);
    return () => {
      layer.removeEventListener('mousedown', stop);
      layer.removeEventListener('contextmenu', stop);
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
      if (editing) {
        return <textarea key={object.id} aria-label="Текст на доске" value={editText}
          ref={(element) => {
            if (!element) return;
            element.focus();
            const end = element.value.length;
            element.setSelectionRange(end, end);
          }}
          onChange={(event) => { setEditText(event.target.value); editTextRef.current = event.target.value; }}
          onBlur={finishEdit}
          style={{ ...S.objectEdit, ...objectStyle({ ...object, text: '' }) }} />;
      }
      return <div key={object.id} className="fk-mind-object"
        role={editable ? 'button' : undefined} tabIndex={-1}
        aria-label={editable ? (object.text.slice(0, 80) || 'Пустой текст') : 'Фигура на доске'}
        style={{ ...S.object, ...objectStyle(object), ...(selected ? { outline: '2px solid var(--accent)', outlineOffset: 2 } : {}) }}
        onPointerDown={(event) => startDrag(event, object)}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onDoubleClick={(event) => { event.stopPropagation(); if (editable) beginEdit(object); }}>
        {object.text}
      </div>;
    })}
  </div>;
}
