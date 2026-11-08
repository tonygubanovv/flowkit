import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { MindMapObject } from '../types/Schemas';
import { Icon } from './ui/UiExports';
import { MIND_MAP_STYLES as S } from '../styles/MindMapStyles';
import { BoardLinkText, createLinkOpener } from './MindMapLinks';

export type MindMapTool = 'select' | 'text' | 'rect' | 'comment';

export const MIND_MAP_TOOLS: { id: MindMapTool; label: string; icon: string }[] = [
  { id: 'text', label: 'Текст', icon: 'type' },
  { id: 'rect', label: 'Прямоугольник', icon: 'rect' },
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
  onObjectAction: (id: string) => void;
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

const SHAPE_MIN = { w: 60, h: 40 };
const SHAPE_PADDING = '8px 12px';

const objectStyle = (object: MindMapObject): React.CSSProperties => {
  if (object.kind === 'shape') {
    return { ...typeStyle(object), boxSizing: 'border-box', width: object.w || 220, height: object.h || 130,
      padding: SHAPE_PADDING, textAlign: 'center', color: 'var(--text)',
      borderRadius: object.shape === 'ellipse' ? '50%' : 10,
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
  ...S.objectEditor, ...typeStyle(object), boxSizing: 'border-box', pointerEvents: 'auto',
  caretColor: object.color || 'var(--text)',
  textAlign: object.kind === 'shape' ? 'center' : undefined,
  padding: object.kind === 'comment' ? 0 : object.kind === 'shape' ? SHAPE_PADDING : '2px 0',
});

export function MindMapObjects(props: Props) {
  const [draft, setDraft] = useState<MindMapObject[]>(props.objects);
  const [editText, setEditText] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const focusedEditingId = useRef<string | null>(null);
  const restoreFocusId = useRef<string | null>(null);
  const gesture = useRef<{
    kind: 'drag' | 'resize'; object: MindMapObject; pointerId: number;
    startX: number; startY: number; scale: number; moved: boolean;
  } | null>(null);
  const draftRef = useRef<MindMapObject[]>(props.objects);
  const editTextRef = useRef('');
  const editSession = useRef<{ id: string; initialText: string } | null>(null);
  const editGeneration = useRef(0);
  const dragClickBlock = useRef(false);
  const downLink = useRef<string | null>(null);
  const linkOpener = useRef<ReturnType<typeof createLinkOpener> | null>(null);
  if (!linkOpener.current) linkOpener.current = createLinkOpener();
  const propsRef = useRef(props);

  useEffect(() => () => linkOpener.current?.cancel(), []);

  // Cleanup редакции использует последний зафиксированный снимок старой доски.
  useLayoutEffect(() => { propsRef.current = props; });

  useLayoutEffect(() => {
    gesture.current = null;
    draftRef.current = props.objects;
    setDraft(props.objects);
  }, [props.objects]);

  const commit = (next: MindMapObject[]) => {
    draftRef.current = next;
    setDraft(next);
    propsRef.current.onCommit(next);
  };

  const finishEdit = (close = true, cleanup = false) => {
    const session = editSession.current;
    if (!session) return;
    editSession.current = null;
    const text = editTextRef.current;
    const objects = draftRef.current;
    const object = objects.find((item) => item.id === session.id);
    const remove = object && object.kind !== 'shape' && !text.trim();
    if (object && (remove || object.text !== text)) {
      const next = remove ? objects.filter((item) => item.id !== session.id)
        : objects.map((item) => item.id === session.id ? { ...item, text } : item);
      if (cleanup && remove && text === session.initialText) {
        const generation = editGeneration.current;
        const onCommit = propsRef.current.onCommit;
        // Повторный setup StrictMode не должен удалять только что открытый пустой объект.
        queueMicrotask(() => {
          if (editGeneration.current === generation || propsRef.current.editingId !== session.id) onCommit(next);
        });
      } else {
        draftRef.current = next;
        if (!cleanup) setDraft(next);
        propsRef.current.onCommit(next);
      }
    }
    if (close) propsRef.current.onEdit(null);
  };

  const removeSelected = () => {
    const id = propsRef.current.selectedId;
    if (!id || !draftRef.current.some((item) => item.id === id)) return;
    commit(draftRef.current.filter((item) => item.id !== id));
    propsRef.current.onSelect(null);
  };

  const finishEditRef = useRef(finishEdit);
  const removeSelectedRef = useRef(removeSelected);
  finishEditRef.current = finishEdit;
  removeSelectedRef.current = removeSelected;

  useLayoutEffect(() => {
    editGeneration.current += 1;
    const object = draftRef.current.find((item) => item.id === props.editingId);
    focusedEditingId.current = null;
    if (object) {
      editSession.current = { id: object.id, initialText: object.text };
      editTextRef.current = object.text;
      setEditText(object.text);
    }
    return () => { finishEditRef.current(false, true); };
  }, [props.editingId]);

  useLayoutEffect(() => {
    const element = editorRef.current;
    const id = props.editingId;
    if (id && element && editSession.current?.id === id && focusedEditingId.current !== id
      && editText === editTextRef.current) {
      focusedEditingId.current = id;
      element.focus({ preventScroll: true });
      element.setSelectionRange(element.value.length, element.value.length);
    }
    if (!id && restoreFocusId.current) {
      const targetId = restoreFocusId.current;
      restoreFocusId.current = null;
      root.current?.querySelectorAll<HTMLElement>('[data-object-id]').forEach((target) => {
        if (target.dataset.objectId === targetId) target.focus({ preventScroll: true });
      });
    }
  });

  useEffect(() => {
    const layer = root.current;
    if (!layer) return;
    const stop = (event: Event) => event.stopPropagation();
    // Браузер иначе начинает native drag ссылки и отменяет жест переноса объекта.
    const onDragStart = (event: Event) => event.preventDefault();
    const onContext = (event: MouseEvent) => {
      event.stopPropagation();
      const target = event.target as HTMLElement | null;
      // Во время ввода оставляем системное меню текста: вырезать, копировать, вставить.
      if (target?.tagName === 'TEXTAREA') return;
      event.preventDefault();
      const id = target?.closest('[data-object-id]')?.getAttribute('data-object-id');
      if (id) propsRef.current.onObjectAction(id);
    };
    // Клавиши не должны доходить до движка: он трактует Delete/Backspace/Enter как команды карты.
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editing = target?.tagName === 'TEXTAREA' || target?.tagName === 'INPUT' || target?.isContentEditable;
      event.stopPropagation();
      if (event.isComposing || gesture.current) return;
      if (editing) {
        if (event.key === 'Escape' || (event.key === 'Enter' && (event.ctrlKey || event.metaKey))) {
          event.preventDefault();
          restoreFocusId.current = editSession.current?.id || null;
          finishEditRef.current();
        }
      } else if (propsRef.current.selectedId) {
        if (event.key === 'Delete' || event.key === 'Backspace') {
          event.preventDefault();
          removeSelectedRef.current();
        } else if ((event.key === 'F2' || event.key === 'Enter') && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          if (!event.repeat) propsRef.current.onEdit(propsRef.current.selectedId);
        }
      }
    };
    layer.addEventListener('mousedown', stop);
    layer.addEventListener('dragstart', onDragStart);
    layer.addEventListener('contextmenu', onContext);
    layer.addEventListener('keydown', onKeyDown);
    return () => {
      layer.removeEventListener('mousedown', stop);
      layer.removeEventListener('dragstart', onDragStart);
      layer.removeEventListener('contextmenu', onContext);
      layer.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const startGesture = (event: React.PointerEvent<HTMLElement>, object: MindMapObject, kind: 'drag' | 'resize') => {
    if (event.button !== 0 || !event.isPrimary || gesture.current) return;
    event.stopPropagation();
    event.currentTarget.closest<HTMLElement>('[data-object-id]')?.focus({ preventScroll: true });
    propsRef.current.onSelect(object.id);
    dragClickBlock.current = false;
    downLink.current = (event.target as HTMLElement).closest('a.fk-board-link')?.getAttribute('href') || null;
    gesture.current = { kind, object, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
      scale: propsRef.current.scale, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveGesture = (event: React.PointerEvent<HTMLElement>) => {
    const active = gesture.current;
    if (!active || active.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const dx = event.clientX - active.startX;
    const dy = event.clientY - active.startY;
    if (!active.moved && Math.hypot(dx, dy) <= 4) return;
    active.moved = true;
    const original = active.object;
    const next = draftRef.current.map((item) => {
      if (item.id !== original.id) return item;
      if (active.kind === 'drag') {
        const x = original.x + Math.round(dx / active.scale);
        const y = original.y + Math.round(dy / active.scale);
        return item.x === x && item.y === y ? item : { ...item, x, y };
      }
      const w = Math.max(SHAPE_MIN.w, Math.round((original.w || 220) + dx / active.scale));
      const h = Math.max(SHAPE_MIN.h, Math.round((original.h || 130) + dy / active.scale));
      return (item.w || 220) === w && (item.h || 130) === h ? item : { ...item, w, h };
    });
    draftRef.current = next;
    setDraft(next);
  };

  const endGesture = (event: React.PointerEvent<HTMLElement>, cancel = false) => {
    const active = gesture.current;
    if (!active || active.pointerId !== event.pointerId) return;
    event.stopPropagation();
    if (!cancel) moveGesture(event);
    gesture.current = null;
    dragClickBlock.current = active.moved;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const original = active.object;
    const current = draftRef.current.find((item) => item.id === original.id);
    const changed = current && (active.kind === 'drag' ? current.x !== original.x || current.y !== original.y
      : (current.w || 220) !== (original.w || 220) || (current.h || 130) !== (original.h || 130));
    if (!cancel && active.moved && changed) {
      commit(draftRef.current);
    } else {
      const next = draftRef.current.map((item) => item.id !== original.id ? item : active.kind === 'drag'
        ? { ...item, x: original.x, y: original.y } : { ...item, w: original.w, h: original.h });
      draftRef.current = next;
      setDraft(next);
    }
  };

  const takeDragClickBlock = () => {
    const blocked = dragClickBlock.current;
    dragClickBlock.current = false;
    return blocked;
  };

  // Захват указателя перенаправляет click на блок: ссылку открываем и на этом уровне.
  const openLinkAfterClick = (event: React.MouseEvent) => {
    const href = downLink.current;
    downLink.current = null;
    if (takeDragClickBlock()) { event.preventDefault(); return; }
    if (href) {
      event.preventDefault();
      event.stopPropagation();
      linkOpener.current?.open(href);
    }
  };

  const beginEdit = (object: MindMapObject) => {
    linkOpener.current?.cancel();
    propsRef.current.onSelect(object.id);
    propsRef.current.onEdit(object.id);
  };

  const mirrorText = `${editText}\u200b`;
  return <div ref={root} className="fk-mind-layer">
    {draft.map((object) => {
      const selected = object.id === props.selectedId;
      const editing = object.id === props.editingId;
      const editor = editing ? <textarea className="fk-mind-editor" aria-label="Текст на доске" value={editText}
        ref={editorRef} maxLength={4000}
        onChange={(event) => { setEditText(event.target.value); editTextRef.current = event.target.value; }}
        onBlur={() => finishEdit()}
        style={editorStyle(object)} /> : null;

      if (object.kind === 'comment') {
        if (editing) {
          return <div key={object.id} className="fk-mind-pin-edit" style={{ position: 'absolute', left: object.x, top: object.y }}>
            <div style={{ ...S.object, ...objectStyle(object), position: 'absolute', left: 0, top: 0, cursor: 'default' }}><Icon name="message" size={14} /></div>
            <div className="fk-mind-pin-card" style={S.pinCard}>
              <div style={{ position: 'relative' }}>
                <div aria-hidden="true" style={{ ...typeStyle(object), color: 'var(--text)', minWidth: 8, minHeight: lineHeightOf(object) }}>{mirrorText}</div>
                {editor}
              </div>
            </div>
          </div>;
        }
        return <div key={object.id} className="fk-mind-object fk-mind-pin" data-open={selected || undefined}
          data-object-id={object.id}
          role="button" tabIndex={0}
          onFocus={() => propsRef.current.onSelect(object.id)}
          aria-label={object.text.slice(0, 80) || 'Пустой комментарий'}
          style={{ ...S.object, left: object.x, top: object.y, ...objectStyle(object), ...(selected ? { outline: '2px solid var(--accent)', outlineOffset: 2 } : {}) }}
          onPointerDown={(event) => startGesture(event, object, 'drag')}
          onPointerMove={moveGesture}
          onPointerUp={(event) => endGesture(event)}
          onPointerCancel={(event) => endGesture(event, true)}
          onLostPointerCapture={(event) => endGesture(event, true)}
          onClick={openLinkAfterClick}
          onDoubleClick={(event) => { event.stopPropagation(); beginEdit(object); }}>
          <Icon name="message" size={14} />
          <div className="fk-mind-pin-card" style={S.pinCard}><BoardLinkText text={object.text} onNavigate={(href) => linkOpener.current?.open(href)} onEdit={() => beginEdit(object)} blockClick={takeDragClickBlock} /></div>
        </div>;
      }

      if (editing) {
        return <div key={object.id} style={{ position: 'absolute', left: object.x, top: object.y,
          outline: '1px solid var(--accent)', outlineOffset: 2 }}>
          <div aria-hidden="true" style={{ ...objectStyle(object), ...(object.kind === 'shape' ? {} : { minWidth: 8, minHeight: lineHeightOf(object) + 4 }) }}>{mirrorText}</div>
          {editor}
        </div>;
      }
      return <div key={object.id} className="fk-mind-object"
        data-object-id={object.id}
        role="button" tabIndex={0}
        onFocus={() => propsRef.current.onSelect(object.id)}
        aria-label={object.text.slice(0, 80) || (object.kind === 'shape' ? 'Фигура на доске' : 'Пустой текст')}
        style={{ ...S.object, left: object.x, top: object.y, ...objectStyle(object), ...(selected ? { outline: '2px solid var(--accent)', outlineOffset: 2 } : {}) }}
        onPointerDown={(event) => startGesture(event, object, 'drag')}
        onPointerMove={moveGesture}
        onPointerUp={(event) => endGesture(event)}
        onPointerCancel={(event) => endGesture(event, true)}
        onLostPointerCapture={(event) => endGesture(event, true)}
        onClick={openLinkAfterClick}
        onDoubleClick={(event) => { event.stopPropagation(); beginEdit(object); }}>
        <BoardLinkText text={object.text} onNavigate={(href) => linkOpener.current?.open(href)} onEdit={() => beginEdit(object)} blockClick={takeDragClickBlock} />
        {object.kind === 'shape' && selected && <span style={S.shapeHandle} title="Изменить размер" aria-label="Изменить размер фигуры"
          onPointerDown={(event) => startGesture(event, object, 'resize')} onPointerMove={moveGesture}
          onPointerUp={(event) => endGesture(event)} onPointerCancel={(event) => endGesture(event, true)}
          onLostPointerCapture={(event) => endGesture(event, true)} />}
      </div>;
    })}
  </div>;
}
