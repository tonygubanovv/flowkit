import React, { useMemo, useRef, useState } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { UI, glass } from '../styles/Styles';
import { ALPHA_COLORS, EFFECTS } from '../styles/Theme';
import { Note } from '../types/Schemas';
import { formatRuDate } from '../lib/Helpers';

interface NotesProps {
  notes?: Note[];
  onEdit: (note: Note) => void;
  onNoteCtx: (event: React.MouseEvent, note: Note) => void;
  onReorder: (dragId: string, targetId: string, side: 'before' | 'after') => void;
}

const NoteIcon = ({
  size = 16,
  color = 'currentColor',
}: {
  size?: number;
  color?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={UI.layout.blockIcon}
  >
    <path
      d="M7 3.75H13.75L18.25 8.25V19A1.75 1.75 0 0 1 16.5 20.75H7A1.75 1.75 0 0 1 5.25 19V5.5A1.75 1.75 0 0 1 7 3.75Z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M13.5 3.75V8.5H18.25" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M8.5 11.25H15.25" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M8.5 14.75H14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
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

const formatDate = (value?: string | null) => {
  return formatRuDate(value);
};

const getPreviewClamp = (text: string) => {
  if (text.length < 80) return 4;
  if (text.length < 180) return 6;
  return 8;
};

const baseSurface = glass('08', 25);
const hoverSurface: React.CSSProperties = { background: 'var(--card-hov)' };

const getCardStyle = (): React.CSSProperties => UI.notes.card(baseSurface);

export function NotesView({ notes = [], onEdit, onNoteCtx, onReorder }: NotesProps) {
  const [notesBoardRef, setBoardAnimationsEnabled] = useAutoAnimate<HTMLDivElement>({
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
            <NoteIcon size={30} color="currentColor" />
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
        .notes-board {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
          align-items: start;
        }

        .note-card:hover {
          background: ${hoverSurface.background} !important;
          border-color: ${ALPHA_COLORS.borderCardFocus} !important;
          box-shadow: ${EFFECTS.cardShadowHover} !important;
        }

        .note-card:hover .note-menu {
          opacity: 1 !important;
        }

        .note-menu:hover {
          background: ${ALPHA_COLORS.subtleStrong} !important;
          color: var(--text) !important;
        }

        .note-placeholder {
          min-height: 148px;
          border-radius: 20px;
          background: var(--card);
          border: 1px solid ${ALPHA_COLORS.borderCardStrong};
          box-shadow: inset 0 0 0 1px ${ALPHA_COLORS.subtleCard};
        }

        .note-placeholder::before,
        .note-placeholder::after {
          content: '';
          display: block;
          margin: 18px;
          border-radius: 999px;
          background: rgba(255,255,255,0.06);
        }

        .note-placeholder::before {
          width: 42%;
          height: 14px;
          margin-bottom: 14px;
        }

        .note-placeholder::after {
          width: 78%;
          height: 10px;
        }

        .notes-board.is-dragging .note-card,
        .notes-board.is-dragging .note-placeholder {
          transition: background 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease;
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

        <div style={UI.notes.boardShell}>
          <div
            ref={notesBoardRef}
            className={`notes-board${draggingId ? ' is-dragging' : ''}`}
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
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const dx = event.clientX - centerX;
                const dy = event.clientY - centerY;
                const score = Math.abs(dx) + Math.abs(dy) * 1.15;

                if (!closest || score < closest.score) {
                  closest = {
                    id: note.id,
                    side: Math.abs(dx) > Math.abs(dy)
                      ? (dx < 0 ? 'before' : 'after')
                      : (dy < 0 ? 'before' : 'after'),
                    score,
                  };
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
              setBoardAnimationsEnabled(true);
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
                  className="note-card"
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
                    setBoardAnimationsEnabled(false);
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', note.id);

                    if (dragPreviewRef.current) {
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
                    setBoardAnimationsEnabled(true);
                    window.setTimeout(() => {
                      didDragRef.current = false;
                    }, 0);
                  }}
                  style={getCardStyle()}
                >
                  <div style={UI.notes.headerRow}>
                    <div style={UI.notes.headerMain}>
                      <div style={UI.notes.title}>
                        {note.title || 'Без названия'}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="note-menu"
                      onClick={(event) => {
                        event.stopPropagation();
                        onNoteCtx(event, note);
                      }}
                      style={UI.notes.menuButton(typeof window !== 'undefined' && window.innerWidth < 768)}
                    >
                      <MoreIcon />
                    </button>
                  </div>

                  {cleanContent ? (
                    <div style={UI.notes.preview(getPreviewClamp(cleanContent))}>
                      {cleanContent}
                    </div>
                  ) : (
                    <div style={UI.notes.emptyPreview}>
                      Пустая заметка...
                    </div>
                  )}

                  <footer style={UI.notes.footer}>
                    <NoteIcon size={13} color="currentColor" />
                    <span style={UI.notes.footerText}>
                      {formatDate(note.updatedAt)}
                    </span>
                  </footer>
                </article>
              );
            })}
          </div>
        </div>

        <div ref={dragPreviewRef} style={UI.notes.dragPreview}>
          Перемещение заметки
        </div>
      </div>
    </>
  );
}
