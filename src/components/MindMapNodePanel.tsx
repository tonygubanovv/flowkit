import React, { useEffect, useRef, useState } from 'react';
import type { NodeObj } from 'mind-elixir';
import { MindMapAttachment, Note, Project, Task } from '../types/Schemas';
import { getMindMapMeta, normalizeMindMapUrl } from '../lib/MindMaps';
import { genId } from '../lib/Helpers';
import { isDoneTask } from '../lib/TaskDomain';
import { mindMapPdfBlob, readMindMapFile } from '../data/MindMapFiles';
import { Btn, Icon } from './ui/UiExports';
import { MIND_MAP_BRANCH_COLORS, MIND_MAP_STYLES as S } from '../styles/MindMapStyles';
import type { MindMapNodeAction } from './MindMapEditor';

const PdfAttachment = ({ file, onRemove }: { file: MindMapAttachment; onRemove: () => void }) => {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const objectUrl = URL.createObjectURL(mindMapPdfBlob(file.dataUrl));
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file.dataUrl]);
  return <div style={S.attachment}>
    <span style={S.truncate} title={file.name}>{file.name}</span>
    <div style={S.row}>
      <a href={url || undefined} target="_blank" rel="noopener noreferrer" style={S.link}>Открыть PDF ↗</a>
      <a href={url || undefined} download={file.name} style={S.link}>Скачать</a>
      <Btn size="sm" onClick={onRemove} title="Удалить вложение"><Icon name="x" size={13} /></Btn>
    </div>
  </div>;
};

interface Props {
  node: NodeObj;
  tasks: Task[];
  notes: Note[];
  projects: Project[];
  usedBytes: number;
  onPatch: (patch: Partial<NodeObj>) => void;
  onOpenTask: (task: Task) => void;
  onOpenNote: (note: Note) => void;
  action: MindMapNodeAction;
  point: { x: number; y: number };
  onClose: () => void;
}

export function MindMapNodePanel({ node, tasks, notes, projects, usedBytes, onPatch, onOpenTask, onOpenNote, action, point, onClose }: Props) {
  const [url, setUrl] = useState(node.hyperLink || '');
  const picker = action === 'task' || action === 'note' ? action : null;
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  const panel = useRef<HTMLDivElement>(null);
  const meta = getMindMapMeta(node);
  const task = meta.entity?.kind === 'task' ? tasks.find((item) => item.id === meta.entity?.id) : undefined;
  const note = meta.entity?.kind === 'note' ? notes.find((item) => item.id === meta.entity?.id) : undefined;
  useEffect(() => { setUrl(node.hyperLink || ''); }, [node.hyperLink]);
  useEffect(() => () => { mounted.current = false; }, []);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!panel.current?.contains(event.target as Node)) onClose(); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape); };
  }, [onClose]);

  const saveUrl = () => {
    const next = url.trim() ? normalizeMindMapUrl(url) : undefined;
    if (next === null) { setError('Введите полную ссылку с https:// или http://.'); return; }
    setError('');
    onPatch({ hyperLink: next });
  };

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    setUploading(true); setError('');
    try {
      const dataUrl = await readMindMapFile(file, usedBytes);
      if (!mounted.current) return;
      if (file.type === 'application/pdf') onPatch({ metadata: { ...meta, attachments: [...(meta.attachments || []), { id: genId(), name: file.name, dataUrl, size: file.size }] } });
      else onPatch({ image: { url: dataUrl, width: 200, height: 140, fit: 'contain' } });
    } catch (reason) {
      if (mounted.current) setError(reason instanceof Error ? reason.message : 'Не удалось добавить файл.');
    } finally { if (mounted.current) setUploading(false); }
  };

  const linkEntity = (kind: 'task' | 'note', id: string, title: string) => {
    const task = kind === 'task' ? tasks.find((item) => item.id === id) : undefined;
    onPatch({ topic: title, tags: [task && isDoneTask(task, projects) ? 'Выполнена' : kind === 'task' ? 'Задача' : 'Заметка'], metadata: { ...meta, entity: { kind, id } } });
    onClose();
  };
  const results = picker === 'task' ? tasks.map((item) => ({ id: item.id, title: item.title })) : notes.map((item) => ({ id: item.id, title: item.title || 'Без названия' }));
  const matching = results.filter((item) => item.title.toLocaleLowerCase('ru').includes(query.toLocaleLowerCase('ru')));

  return <div ref={panel} style={S.popup(point.x, point.y)} role="dialog" aria-label="Действия с узлом">
    <div style={S.row}><span style={S.truncate}>{node.topic}</span><span style={S.spacer} /><Btn size="sm" onClick={onClose} title="Закрыть действия узла"><Icon name="x" size={14} /></Btn></div>
    {picker && <div style={S.section}>
      {meta.entity ? <div style={S.linked}>
        <span style={S.muted}>{task ? (isDoneTask(task, projects) ? 'Задача выполнена' : 'Задача в работе') : note ? 'Заметка' : 'Исходная сущность удалена'}</span>
        {(task || note) && <Btn size="sm" variant="subtle" onClick={() => task ? onOpenTask(task) : note && onOpenNote(note)} style={S.fullButton}>Открыть {task ? 'задачу' : 'заметку'}<Icon name="chevR" size={13} /></Btn>}
        <Btn size="sm" onClick={() => onPatch({ metadata: { ...meta, entity: undefined }, tags: [] })} style={S.fullButton}>Убрать связь</Btn>
      </div> : <div style={S.section}>
        <input autoFocus aria-label="Найти для связи" placeholder={picker === 'task' ? 'Найти задачу…' : 'Найти заметку…'} value={query} onChange={(event) => setQuery(event.target.value)} style={S.input} />
        {matching.slice(0, 12).map((item) => <Btn key={item.id} size="sm" onClick={() => linkEntity(picker, item.id, item.title)} style={S.fullButton}><span style={S.truncate}>{item.title}</span></Btn>)}
        {!matching.length && <span style={S.muted}>Ничего не найдено.</span>}
        {matching.length > 12 && <span style={S.muted}>Уточните поиск, чтобы увидеть остальные.</span>}
      </div>}
    </div>}
    {action === 'link' && <div style={S.section}>
      <label style={S.label} htmlFor="fk-map-url">Ссылка</label>
      <div style={S.row}>
        <input id="fk-map-url" style={S.input} placeholder="https://…" value={url} onChange={(event) => setUrl(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') saveUrl(); }} />
        <Btn size="sm" onClick={saveUrl} title="Сохранить ссылку"><Icon name="check" size={14} /></Btn>
      </div>
      {node.hyperLink && <a href={node.hyperLink} target="_blank" rel="noopener noreferrer" style={S.link}>Открыть ссылку ↗</a>}
    </div>}
    {action === 'files' && <div style={S.section}>
      <span style={S.label}>Изображение и файлы</span>
      {node.image && <><img src={node.image.url} alt="Изображение узла" style={S.image} /><Btn size="sm" onClick={() => onPatch({ image: undefined })}>Убрать изображение</Btn></>}
      {(meta.attachments || []).map((file) => <PdfAttachment key={file.id} file={file} onRemove={() => onPatch({ metadata: { ...meta, attachments: meta.attachments?.filter((item) => item.id !== file.id) } })} />)}
      <Btn size="sm" variant="subtle" disabled={uploading} onClick={() => input.current?.click()} style={S.fullButton}><Icon name="plus" size={14} />{uploading ? 'Чтение файла…' : 'Картинка или PDF'}</Btn>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" onChange={upload} style={S.hidden} aria-label="Добавить изображение или PDF" />
      <span style={S.muted}>До 5 МБ на файл · до 20 МБ на карту.<br />Файлы хранятся локально и входят в резервную копию.</span>
    </div>}
    {action === 'color' && <div style={S.section}>
      <span style={S.label}>Цвет ветви</span>
      <div style={S.swatchRow}>
        {MIND_MAP_BRANCH_COLORS.map((item) => <button key={item.value} type="button" title={item.name} aria-label={item.name}
          style={S.swatch(item.value, node.branchColor === item.value)} onClick={() => onPatch({ branchColor: item.value })} />)}
      </div>
      {node.branchColor && <Btn size="sm" onClick={() => onPatch({ branchColor: undefined })} style={S.fullButton}>Вернуть цвет темы</Btn>}
      <span style={S.muted}>Цвет переходит на все ветви от этой.</span>
    </div>}
    {error && <span role="alert" style={S.error}>{error}</span>}
  </div>;
}
