import React, { useMemo, useRef, useState } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { UI, glass } from '../styles/Styles';
import { Note } from '../types/Schemas';
import { formatNoteDate } from '../lib/Helpers';

interface NotesProps {
  notes?: Note[];
  onEdit: (note: Note) => void;
  onNoteCtx: (event: React.MouseEvent, note: Note) => void;
  onReorder: (dragId: string, targetId: string, side: 'before' | 'after') => void;
}

const NoteIcon = ({ size = 30 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={UI.layout.blockIcon}
  >
    <path
      d="M7 3.75H13.75L18.25 8.25V19A1.75 1.75 0 0 1 16.5 20.75H7A1.75 1.75 0 0 1 5.25 19V5.5A1.75 1.75 0 0 1 7 3.75Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M13.5 3.75V8.5H18.25" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M8.5 11.25H15.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M8.5 14.75H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const MoreIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

const stripHtml = (value?: string | null) => {
  if (!value) return '';

  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const baseSurface = glass('08', 25);

export function NotesView({ notes = [], onEdit, onNoteCtx, onReorder }: NotesProps) {
  const [notesListRef, setListAnimationsEnabled] = useAutoAnimate<HTMLDivElement>({
    duration: 150,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; side: 'before' | 'after' } | null>(null);
  const didDragRef = useRef(false);
  const dragPreviewRef = useRef<HTMLDivElement>(null);
  const noteRefs = useRef<Record<string, HTMLElement | null>>({});

  const renderItems = useMemo(() => {
    const items: Array<{ kind: 'note'; note: Note } | { kind: 'placeholder'; key: string }> = [];

    for (const note of notes) {
      if (note.id === draggingId) continue;

      if (dropTarget?.id === note.id && dropTarget.side === 'before') {
        items.push({ kind: 'placeholder', key: `placeholder-before-${note.id}` });
      }

      items.push({ kind: 'note', note });

      if (dropTarget?.id === note.id && dropTarget.side === 'after') {
        items.push({ kind: 'placeholder', key: `placeholder-after-${note.id}` });
      }
    }

    return items;
  }, [draggingId, dropTarget, notes]);

  if (!notes.length) {
    return (
      <div style={UI.notes.emptyShell}>
        <div style={UI.notes.emptyPanel(baseSurface)}>
          <div style={UI.notes.emptyIcon}>
            <NoteIcon size={30} />
          </div>

          <div style={UI.notes.emptyTitle}>Заметок пока нет</div>

          <div style={UI.notes.emptyText}>
            Создай первую заметку — она появится здесь.
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .notes-list {
          display: flex;
          flex-direction: column;
        }

        .note-row:hover {
          background: var(--card-hov);
        }

        .note-row:hover .note-menu,
        .note-row:focus-within .note-menu {
          opacity: 1 !important;
        }

        .note-menu:hover {
          background: var(--card-hov) !important;
          color: var(--text) !important;
        }

        .note-row:last-child {
          border-bottom: none !important;
        }

        .note-row-preview {
          -webkit-mask-image: linear-gradient(to bottom, currentColor 26px, transparent 41px);
          mask-image: linear-gradient(to bottom, currentColor 26px, transparent 41px);
        }

        .note-placeholder {
          height: 2px;
          margin: 4px 0;
          border-radius: 999px;
          background: color-mix(in srgb, var(--accent) 62%, transparent);
        }

        .notes-list.is-dragging .note-row,
        .notes-list.is-dragging .note-placeholder {
          transition: background 0.12s ease, border-color 0.12s ease, opacity 0.12s ease;
        }
      `}</style>

      <div style={UI.notes.shell}>
        <div style={UI.notes.topbar}>
          <div style={UI.notes.topbarTitleWrap}>
            <div style={UI.notes.topbarCount}>
              {notes.length} {notes.length === 1 ? 'заметка' : notes.length < 5 ? 'заметки' : 'заметок'}
            </div>
          </div>
        </div>

        <div style={UI.notes.listShell}>
          <div style={UI.notes.listPanel}>
            <div
              ref={notesListRef}
              className={`notes-list${draggingId ? ' is-dragging' : ''}`}
              onDragOver={(event) => {
                event.preventDefault();

                if (!draggingId) return;

                event.dataTransfer.dropEffect = 'move';

                let closest: { id: string; side: 'before' | 'after'; score: number } | null = null;

                for (const note of notes) {
                  if (note.id === draggingId) continue;

                  const element = noteRefs.current[note.id];
                  if (!element) continue;

                  const rect = element.getBoundingClientRect();
                  const dy = event.clientY - (rect.top + rect.height / 2);
                  const score = Math.abs(dy);

                  if (!closest || score < closest.score) {
                    closest = { id: note.id, side: dy < 0 ? 'before' : 'after', score };
                  }
                }

              if (!closest) return;

              setDropTarget((current) => (
                current?.id === closest.id && current.side === closest.side
                  ? current
                  : { id: closest.id, side: closest.side }
              ));
            }}
            onDrop={(event) => {
              event.preventDefault();

              const dragId = event.dataTransfer.getData('text/plain') || draggingId;

              if (dragId && dropTarget && dragId !== dropTarget.id) {
                onReorder(dragId, dropTarget.id, dropTarget.side);
              }

              setDraggingId(null);
              setDropTarget(null);
              setListAnimationsEnabled(true);
            }}
          >
            {renderItems.map((item) => {
              if (item.kind === 'placeholder') {
                return <div key={item.key} className="note-placeholder" />;
              }

              const note = item.note;
              const cleanContent = stripHtml(note.content);

              return (
                <article
                  key={note.id}
                  ref={(element) => {
                    noteRefs.current[note.id] = element;
                  }}
                  className="note-row"
                  draggable
                  onClick={(event) => {
                    if (didDragRef.current) {
                      event.preventDefault();
                      didDragRef.current = false;
                      return;
                    }

                    onEdit(note);
                  }}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    onNoteCtx(event, note);
                  }}
                  onDragStart={(event) => {
                    didDragRef.current = true;
                    setListAnimationsEnabled(false);
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', note.id);

                    if (dragPreviewRef.current) {
                      dragPreviewRef.current.textContent = note.title || 'Без названия';
                      event.dataTransfer.setDragImage(dragPreviewRef.current, 12, 12);
                    }

                    window.setTimeout(() => {
                      setDraggingId(note.id);
                      setDropTarget(null);
                    }, 0);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDropTarget(null);
                    setListAnimationsEnabled(true);
                    window.setTimeout(() => {
                      didDragRef.current = false;
                    }, 0);
                  }}
                  style={UI.notes.row}
                >
                  <div style={UI.notes.rowHead}>
                    <div style={UI.notes.rowTitle}>
                      {note.title || 'Без названия'}
                    </div>

                    <div style={UI.notes.rowMeta}>
                      <span style={UI.notes.rowDate}>
                        {formatNoteDate(note.updatedAt)}
                      </span>

                      <button
                        type="button"
                        className="note-menu"
                        onClick={(event) => {
                          event.stopPropagation();
                          onNoteCtx(event, note);
                        }}
                        style={UI.notes.rowMenu}
                        aria-label="Действия с заметкой"
                        title="Действия с заметкой"
                      >
                        <MoreIcon />
                      </button>
                    </div>
                  </div>

                  {cleanContent ? (
                    <div className="note-row-preview" style={UI.notes.rowPreview}>
                      {cleanContent}
                    </div>
                  ) : (
                    <div style={UI.notes.rowPreviewEmpty}>
                      Пустая заметка
                    </div>
                  )}
                </article>
              );
            })}
            </div>
          </div>
        </div>

        <div ref={dragPreviewRef} style={UI.notes.dragPreview}>
          Перемещение заметки
        </div>
      </div>
    </>
  );
}
