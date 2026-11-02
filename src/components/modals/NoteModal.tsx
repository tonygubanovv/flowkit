import React, { useEffect, useRef, useState } from 'react';
import { UI } from '../../styles/Styles';
import { typographize } from '../../lib/Typograf';
import { Note, ID } from '../../types/Schemas';
import { Btn, Icon } from '../ui/UiExports';
import { RichEditor } from '../RichEditor';
import { innerMob, noteInnerDesk, wrapDesk, wrapMob } from './Shared';

interface NoteModalProps {
  note: Note;
  isNew: boolean;
  onSave: (n: Note) => void;
  onDelete: (id: ID) => void;
  onClose: () => void;
  isMobile?: boolean;
}

export function NoteModal({ note: init, isNew, onClose, onSave, onDelete, isMobile }: NoteModalProps) {
  const [note, setNote] = useState<Note>(init);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  }, [note.title]);

  const handleSafeClose = () => {
    if (JSON.stringify(note) !== JSON.stringify(init) && !showConfirmClose) setShowConfirmClose(true);
    else onClose();
  };

  return (
    <div style={isMobile ? wrapMob : wrapDesk} onMouseDown={!isMobile ? (e) => e.target === e.currentTarget && handleSafeClose() : undefined}>
      <div style={isMobile ? innerMob : noteInnerDesk} onMouseDown={(e) => e.stopPropagation()}>
        <div style={UI.modal.header()}>
          <span style={UI.modal.headerLabel}>{isNew ? 'Новая заметка' : 'Заметка'}</span>
          <button onClick={handleSafeClose} className="fk-modal-close" style={UI.modal.closeButton}>
            <Icon name="x" size={20} />
          </button>
        </div>

        <div style={UI.modal.body()}>
          <textarea
            ref={titleRef}
            autoFocus={isNew}
            placeholder="Без названия..."
            value={note.title}
            rows={1}
            onChange={(e) => setNote((current) => ({ ...current, title: e.target.value }))}
            style={UI.modal.titleInput}
          />

          <RichEditor
            content={note.content || ''}
            onChange={(html) => setNote((current) => ({ ...current, content: html }))}
            placeholder="Начни писать регламент, идею или ТЗ..."
          />
        </div>

        <div style={UI.modal.footer()}>
          {showConfirmClose ? (
            <>
              <div style={UI.modal.confirmText}>Закрыть без сохранения?</div>
              <div style={UI.modal.actions(10)}>
                <Btn variant="subtle" onClick={() => setShowConfirmClose(false)}>Назад</Btn>
                <Btn variant="danger" onClick={onClose}>Закрыть</Btn>
              </div>
            </>
          ) : (
            <>
              <Btn variant="ghost" className="fk-modal-icon-danger" onClick={() => onDelete(note.id)} style={UI.settings.deleteButton}>
                <Icon name="trash" size={16} />
              </Btn>
              <div style={UI.modal.actions()}>
                <Btn variant="subtle" onClick={handleSafeClose}>Отмена</Btn>
                <Btn variant="primary" onClick={() => onSave({ ...note, title: typographize(note.title), content: typographize(note.content || '') })}>
                  Сохранить
                </Btn>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
