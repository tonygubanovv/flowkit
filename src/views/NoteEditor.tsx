import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { UI } from '../styles/Styles';
import { typographize } from '../lib/Typograf';
import { Note, ID } from '../types/Schemas';
import { Btn, Icon } from '../components/ui/UiExports';
import { RichEditor } from '../components/RichEditor';

interface NoteEditorProps {
  note: Note;
  isNew: boolean;
  onSave: (n: Note) => void;
  onDelete: (id: ID) => void;
  onClose: () => void;
}

export interface NoteEditorHandle {
  requestClose: (afterClose?: () => void) => void;
}

export const NoteEditor = forwardRef<NoteEditorHandle, NoteEditorProps>(function NoteEditor(
  { note: init, isNew, onClose, onSave, onDelete },
  ref,
) {
  const [note, setNote] = useState<Note>(init);
  const [pendingClose, setPendingClose] = useState<{ afterClose?: () => void } | null>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  }, [note.title]);

  const close = (afterClose?: () => void) => {
    onClose();
    afterClose?.();
  };

  const requestClose = (afterClose?: () => void) => {
    if (note.title !== init.title || note.content !== init.content) setPendingClose({ afterClose });
    else close(afterClose);
  };

  useImperativeHandle(ref, () => ({ requestClose }));

  return (
    <section aria-label="Редактор заметки" style={UI.notes.editorShell}>
      <header style={UI.notes.editorHeader(UI.app.header())}>
        <div style={UI.app.titleArea}>
          <Btn aria-label="Вернуться назад" title="Вернуться назад" onClick={() => requestClose()}>
            <Icon name="chevL" size={18} />
          </Btn>
          <h1 style={UI.app.title()}>{isNew ? 'Новая заметка' : 'Заметка'}</h1>
        </div>
        <div style={UI.modal.actions()}>
          {!isNew && (
            <Btn aria-label="Удалить заметку" title="Удалить заметку" className="fk-modal-icon-danger" onClick={() => onDelete(note.id)} style={UI.settings.deleteButton}>
              <Icon name="trash" size={16} />
            </Btn>
          )}
          <Btn variant="primary" onClick={() => onSave({ ...note, title: typographize(note.title), content: typographize(note.content || '') })}>
            Сохранить
          </Btn>
        </div>
      </header>
      {pendingClose && (
        <div style={UI.notes.editorConfirm} role="status">
          <span>Закрыть без сохранения?</span>
          <div style={UI.modal.actions()}>
            <Btn variant="subtle" onClick={() => setPendingClose(null)}>Продолжить правку</Btn>
            <Btn variant="danger" onClick={() => close(pendingClose.afterClose)}>Закрыть</Btn>
          </div>
        </div>
      )}
      <div style={UI.notes.editorScroll}>
        <div style={UI.notes.editorPage}>
          <RichEditor
            variant="page"
            content={note.content || ''}
            onChange={(html) => setNote((current) => ({ ...current, content: html }))}
            placeholder="Начни писать регламент, идею или ТЗ..."
          >
            <textarea
              ref={titleRef}
              aria-label="Название заметки"
              autoFocus={isNew}
              placeholder="Без названия..."
              value={note.title}
              rows={1}
              onChange={(e) => setNote((current) => ({ ...current, title: e.target.value }))}
              style={UI.richEditor.pageTitle}
            />
          </RichEditor>
        </div>
      </div>
    </section>
  );
});
