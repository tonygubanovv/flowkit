import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { MindElixirData, NodeObj } from 'mind-elixir';
import { MindMap, MindMapObject, Note, Project, Task } from '../types/Schemas';
import { getMindMapBytes, getMindMapMeta, mindMapToMarkdown, walkMindMap } from '../lib/MindMaps';
import { genId } from '../lib/Helpers';
import { isDoneTask } from '../lib/TaskDomain';
import { downloadMindMapFile, mindMapPngBlob, mindMapSvgBlob } from '../data/MindMapFiles';
import { Btn, ContextMenu, Icon } from '../components/ui/UiExports';
import { CustomDropdown } from '../components/modals/Shared';
import { MindMapEditor, MindMapEditorHandle, MindMapNodeAction } from '../components/MindMapEditor';
import { MindMapNodePanel } from '../components/MindMapNodePanel';
import { MIND_MAP_TOOLS, MindMapTool } from '../components/MindMapObjects';
import { MIND_MAP_BRANCH_COLORS, MIND_MAP_STYLES as S } from '../styles/MindMapStyles';

interface Props {
  maps: MindMap[];
  selectedId: string | null;
  projectFilter: string | null;
  tasks: Task[];
  notes: Note[];
  projects: Project[];
  onSelect: (id: string) => void;
  onCreate: () => void;
  onSave: (map: MindMap) => void;
  onDelete: (id: string) => void;
  onOpenTask: (task: Task) => void;
  onOpenNote: (note: Note) => void;
}

const OBJECT_LABELS: Record<MindMapObject['kind'], string> = { text: 'Текст', shape: 'Фигура', comment: 'Комментарий' };
const OBJECT_HISTORY_LIMIT = 40;
const NO_OBJECTS: MindMapObject[] = [];

function MapWorkspace({ map, ...props }: Props & { map: MindMap }) {
  const editor = useRef<MindMapEditorHandle>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const clipboard = useRef<MindMapObject | null>(null);
  const past = useRef<MindMapObject[][]>([]);
  const future = useRef<MindMapObject[][]>([]);
  const applying = useRef(false);
  const lastEdit = useRef<'nodes' | 'objects'>('nodes');
  const [node, setNode] = useState<NodeObj | null>(null);
  const [action, setAction] = useState<{ kind: MindMapNodeAction; x: number; y: number } | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(map.title);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [selection, setSelection] = useState<NodeObj[]>([]);
  const [notice, setNotice] = useState('');
  const [tool, setTool] = useState<MindMapTool>('select');
  const [zoom, setZoom] = useState(100);
  const [objectId, setObjectId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const objects = map.objects || NO_OBJECTS;
  const selectedObject = objects.find((item) => item.id === objectId) || null;
  const usedBytes = useMemo(() => getMindMapBytes(map.data), [map.data]);
  const saveData = (data: MindElixirData) => { lastEdit.current = 'nodes'; props.onSave({ ...map, data, updatedAt: new Date().toISOString() }); };
  const writeObjects = (next: MindMapObject[]) => props.onSave({ ...map, objects: next, updatedAt: new Date().toISOString() });
  const saveObjects = (next: MindMapObject[]) => {
    if (!applying.current) {
      lastEdit.current = 'objects';
      future.current = [];
      past.current.push(objects);
      if (past.current.length > OBJECT_HISTORY_LIMIT) past.current.shift();
    }
    writeObjects(next);
  };
  const undoObjects = () => {
    const previous = past.current.pop();
    if (!previous) return false;
    future.current.push(objects);
    applying.current = true;
    writeObjects(previous);
    applying.current = false;
    return true;
  };
  const redoObjects = () => {
    const next = future.current.pop();
    if (!next) return false;
    past.current.push(objects);
    applying.current = true;
    writeObjects(next);
    applying.current = false;
    return true;
  };
  const runUndo = () => { if (lastEdit.current === 'objects' && past.current.length) undoObjects(); else editor.current?.undo(); };
  const runRedo = () => { if (lastEdit.current === 'objects' && future.current.length) redoObjects(); else editor.current?.redo(); };
  const pasteObject = (source: MindMapObject) => {
    const canvas = pointer.current ? editor.current?.toCanvas(pointer.current.x, pointer.current.y) : null;
    const copy: MindMapObject = { ...source, id: genId(), x: canvas?.x ?? source.x + 24, y: canvas?.y ?? source.y + 24 };
    saveObjects([...objects, copy]);
    setObjectId(copy.id);
    setMore(false);
    if (copy.kind !== 'shape') setEditingId(copy.id);
  };
  const removeObject = (id: string) => {
    saveObjects(objects.filter((item) => item.id !== id));
    setObjectId((current) => current === id ? null : current);
    setEditingId((current) => current === id ? null : current);
  };
  const editObject = (id: string) => { setObjectId(id); setEditingId(id); };
  const selectObject = (id: string | null) => { setObjectId(id); setMore(false); };
  const duplicateObject = (object: MindMapObject) => {
    const copy: MindMapObject = { ...object, id: genId(), x: object.x + 20, y: object.y + 20 };
    saveObjects([...objects, copy]);
    setObjectId(copy.id);
    setMore(false);
  };
  const reorderObject = (id: string, front: boolean) => {
    const target = objects.find((item) => item.id === id);
    if (!target) return;
    const rest = objects.filter((item) => item.id !== id);
    saveObjects(front ? [...rest, target] : [target, ...rest]);
  };
  const project = props.projects.find((item) => item.id === map.projectId);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && tool !== 'select') setTool('select');
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [tool]);

  const canvasHost = useRef<HTMLDivElement>(null);
  useEffect(() => {
    past.current = [];
    future.current = [];
    lastEdit.current = 'nodes';
  }, [map.id]);

  useEffect(() => {
    const host = canvasHost.current;
    if (!host) return;
    // Захват, а не всплытие: слои ниже (полотно движка, слой объектов) глушат клавиши, а Ctrl+Z движок слушает сам.
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable="true"]')) return;
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === 'z' || key === 'y') {
        event.preventDefault();
        event.stopPropagation();
        if (key === 'y' || (key === 'z' && event.shiftKey)) runRedo(); else runUndo();
      } else if (key === 'c' || key === 'x') {
        // Ветви копирует и вставляет сам движок через системный буфер; как только скобирована ветвь, буфер объектов больше не в дело.
        if (!selectedObject) { clipboard.current = null; return; }
        event.preventDefault();
        event.stopPropagation();
        clipboard.current = selectedObject;
        if (key === 'x') removeObject(selectedObject.id);
      } else if (key === 'v' && clipboard.current) {
        event.preventDefault();
        event.stopPropagation();
        pasteObject(clipboard.current);
      }
    };
    host.addEventListener('keydown', onKeyDown, true);
    return () => host.removeEventListener('keydown', onKeyDown, true);
  }, [selectedObject, objects]);

  const importProject = () => {
    if (!project) return;
    const linkedIds = new Set<string>();
    walkMindMap(map.data.nodeData, (item) => {
      const entity = getMindMapMeta(item).entity;
      if (entity?.kind === 'task') linkedIds.add(entity.id);
    });
    const tasks = props.tasks.filter((task) => task.projectId === project.id && !linkedIds.has(task.id));
    if (!tasks.length) return;
    editor.current?.addNode({ id: genId(), topic: project.name, children: tasks.map((task) => ({
      id: genId(), topic: task.title, tags: [isDoneTask(task, props.projects) ? 'Выполнена' : 'Задача'], metadata: { entity: { kind: 'task', id: task.id } },
    })) });
  };
  const fileBase = map.title.trim().replace(/[\\/:*?"<>|]+/g, '-').slice(0, 60) || 'board';
  const runExport = async (kind: 'png' | 'svg' | 'md') => {
    setMenu(null);
    setNotice('');
    try {
      if (kind === 'md') {
        downloadMindMapFile(`${fileBase}.md`, new Blob([mindMapToMarkdown(map, props.tasks, props.notes, props.projects)], { type: 'text/markdown;charset=utf-8' }));
        return;
      }
      const svg = await editor.current?.exportSvg();
      if (!svg) throw new Error('Доска ещё не открылась.');
      downloadMindMapFile(`${fileBase}.${kind}`, kind === 'svg' ? await mindMapSvgBlob(svg) : await mindMapPngBlob(svg));
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : 'Не удалось выгрузить доску.');
    }
  };
  const activeTool = MIND_MAP_TOOLS.find((item) => item.id === tool);
  return <section style={S.workspace} aria-label={`Доска «${map.title}»`}>
    <div style={S.toolbar}>
      {renaming ? <input autoFocus aria-label="Название доски" value={title} onChange={(event) => setTitle(event.target.value)}
        onBlur={() => { if (title.trim()) props.onSave({ ...map, title: title.trim(), updatedAt: new Date().toISOString() }); else setTitle(map.title); setRenaming(false); }}
        onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); if (event.key === 'Escape') { setTitle(map.title); setRenaming(false); } }} style={S.title} /> :
        <CustomDropdown value={map.id} placeholder="Выбрать доску" options={props.maps.map((item) => ({ id: item.id, name: item.title }))} onChange={(id: string) => props.onSelect(id)} />}
      <div style={S.toolGroup} role="toolbar" aria-label="Инструменты доски">
        {MIND_MAP_TOOLS.map((item) => <Btn key={item.id} size="sm" title={item.label} aria-label={item.label}
          onClick={() => setTool((current) => current === item.id ? 'select' : item.id)}
          style={tool === item.id ? { background: 'var(--accent-dim)', color: 'var(--accent)' } : undefined}>
          <Icon name={item.icon} size={15} />
        </Btn>)}
      </div>
      <span style={S.divider} />
      <Btn size="sm" onClick={() => editor.current?.addNode()} title="Добавить ветвь" aria-label="Добавить ветвь"><Icon name="plus" size={15} /></Btn>
      <Btn size="sm" onClick={runUndo} title="Отменить · Ctrl+Z"><Icon name="undo" size={15} /></Btn>
      <Btn size="sm" onClick={runRedo} title="Повторить · Ctrl+Shift+Z"><Icon name="history" size={15} /></Btn>
      <span style={S.spacer} />
      <CustomDropdown alignRight value={map.projectId} placeholder="Без проекта" options={[{ id: null, name: 'Без проекта' }, ...props.projects]} onChange={(id: string | null) => props.onSave({ ...map, projectId: id, updatedAt: new Date().toISOString() })} icon={<Icon name="folder" size={13} />} />
      <Btn size="sm" title="Действия с доской" onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setMenu({ x: rect.right, y: rect.bottom + 6 }); }}><Icon name="menu" size={15} /></Btn>
    </div>
    <div style={S.canvas} ref={canvasHost} onPointerMove={(event) => { pointer.current = { x: event.clientX, y: event.clientY }; }}>
      <MindMapEditor ref={editor} map={map} tasks={props.tasks} notes={props.notes} projects={props.projects}
        objects={objects} tool={tool} selectedObjectId={objectId} editingObjectId={editingId}
        onChange={saveData} onObjectsChange={saveObjects} onSelect={setNode} onSelection={setSelection}
        onSelectObject={selectObject} onEditObject={setEditingId} onToolUse={() => setTool('select')} onScaleChange={setZoom}
        onOpenEntity={(entity) => {
          const task = entity.kind === 'task' ? props.tasks.find((item) => item.id === entity.id) : undefined;
          const note = entity.kind === 'note' ? props.notes.find((item) => item.id === entity.id) : undefined;
          if (task) props.onOpenTask(task);
          if (note) props.onOpenNote(note);
        }}
        onNodeAction={(selected, kind, point) => { setNode(selected); setAction({ kind, ...point }); }}
        onObjectAction={selectObject} />
      <div style={S.canvasControls} role="toolbar" aria-label="Масштаб доски">
        <Btn size="sm" style={S.zoom} onClick={() => editor.current?.resetZoom()} title="Сбросить масштаб">{zoom}%</Btn>
        <Btn size="sm" onClick={() => editor.current?.fit()} title="Вписать доску в окно"><Icon name="maximize" size={14} /></Btn>
        <Btn size="sm" onClick={() => editor.current?.center()} title="По центру"><Icon name="grid" size={14} /></Btn>
      </div>
      {selectedObject && tool === 'select' && <div style={S.selectionBar} role="toolbar" aria-label="Действия с элементом доски">
        <span style={S.selectionCount}>{OBJECT_LABELS[selectedObject.kind]}</span>
        <span style={S.divider} />
        {MIND_MAP_BRANCH_COLORS.map((item) => <button key={item.value} type="button" title={item.name} aria-label={`Цвет: ${item.name}`}
          style={S.swatch(item.value, selectedObject.color === item.value)}
          onClick={() => saveObjects(objects.map((object) => object.id === selectedObject.id
            ? { ...object, color: object.color === item.value ? undefined : item.value } : object))} />)}
        <span style={S.divider} />
        <Btn size="sm" onClick={() => editObject(selectedObject.id)} title="Править текст"><Icon name="edit" size={14} /></Btn>
        <Btn size="sm" onClick={() => removeObject(selectedObject.id)} title="Удалить с доски"><Icon name="trash" size={14} /></Btn>
        <Btn size="sm" onClick={() => setMore((current) => !current)} aria-pressed={more} title="Дополнительные действия"
          style={more ? { background: 'var(--accent-dim)', color: 'var(--accent)' } : undefined}>Ещё</Btn>
        {more && <>
          <span style={S.divider} />
          <Btn size="sm" onClick={() => duplicateObject(selectedObject)} title="Копия рядом"><Icon name="copy" size={14} /></Btn>
          <Btn size="sm" onClick={() => reorderObject(selectedObject.id, true)} title="На передний план"><Icon name="chevT" size={14} /></Btn>
          <Btn size="sm" onClick={() => reorderObject(selectedObject.id, false)} title="На задний план"><Icon name="chevD" size={14} /></Btn>
        </>}
      </div>}
      {selection.length > 1 && !selectedObject && tool === 'select' && <div style={S.selectionBar} role="toolbar" aria-label="Действия с выделенными ветвями">
        <span style={S.selectionCount}>Выбрано ветвей: {selection.length} · перетащите, чтобы перенести</span>
        <span style={S.divider} />
        {MIND_MAP_BRANCH_COLORS.map((item) => <button key={item.value} type="button" title={item.name} aria-label={`Цвет ветвей: ${item.name}`}
          style={S.swatch(item.value, false)} onClick={() => editor.current?.setColor(selection.map((node) => node.id), item.value)} />)}
        <span style={S.divider} />
        <Btn size="sm" onClick={() => editor.current?.removeNodes(selection.map((node) => node.id))} title="Удалить выбранные ветви"><Icon name="trash" size={14} /></Btn>
        <Btn size="sm" onClick={() => editor.current?.clearSelection()} title="Снять выделение"><Icon name="x" size={14} /></Btn>
      </div>}
      {tool !== 'select' && <div style={S.toolHint} role="status">
        <Icon name={activeTool?.icon || 'pointer'} size={13} />
        <span>Кликните по доске, чтобы добавить {activeTool?.label.toLowerCase()}. Esc — отмена.</span>
      </div>}
      {notice && <div role="alert" style={S.notice}><span>{notice}</span><Btn size="sm" onClick={() => setNotice('')} title="Закрыть сообщение"><Icon name="x" size={13} /></Btn></div>}
    </div>
    {node && action && <MindMapNodePanel key={`${node.id}-${action.kind}`} node={node} tasks={props.tasks} notes={props.notes} projects={props.projects} usedBytes={usedBytes}
      action={action.kind} point={action} onClose={() => setAction(null)}
      onPatch={(patch) => editor.current?.patchNode(node.id, patch)} onOpenTask={(task) => { setAction(null); props.onOpenTask(task); }} onOpenNote={(note) => { setAction(null); props.onOpenNote(note); }} />}
    {menu && <ContextMenu x={menu.x} y={menu.y} onClose={() => setMenu(null)} items={[
      { icon: 'edit', label: 'Переименовать', onClick: () => { setTitle(map.title); setRenaming(true); } },
      ...(project ? [{ icon: 'list', label: 'Добавить задачи проекта', onClick: importProject }] : []),
      '---',
      { icon: 'expand', label: 'Раскрыть все ветви', onClick: () => editor.current?.setAllExpanded(true) },
      { icon: 'collapse', label: 'Свернуть все ветви', onClick: () => editor.current?.setAllExpanded(false) },
      '---', { icon: 'export', label: 'Выгрузить', children: [
        { icon: 'image', label: 'PNG', onClick: () => { void runExport('png'); } },
        { icon: 'file', label: 'SVG', onClick: () => { void runExport('svg'); } },
        { icon: 'list', label: 'Markdown', onClick: () => { void runExport('md'); } },
      ] },
      '---', { icon: 'trash', label: 'Удалить доску', danger: true, onClick: () => {
        if (window.confirm(`Удалить доску «${map.title}» и её вложения? Задачи и заметки сохранятся.`)) props.onDelete(map.id);
      } },
    ]} />}
  </section>;
}

export function MindMapsView(props: Props) {
  const maps = props.maps.filter((map) => !props.projectFilter || map.projectId === props.projectFilter);
  const selected = maps.find((map) => map.id === props.selectedId) || maps[0];
  return <div style={S.shell}>
    {selected ? <MapWorkspace key={selected.id} {...props} maps={maps} map={selected} /> :
      <div style={S.empty}>
        <Icon name="mindMap" size={32} color="var(--muted)" />
        <h2 style={S.emptyTitle}>Место для ваших идей</h2>
        <span style={S.muted}>Собирайте мысли в ветви, связывайте с задачами и заметками. Ссылки, картинки и PDF — в меню узла.</span>
        <Btn variant="primary" onClick={props.onCreate}><Icon name="plus" size={16} />Создать доску</Btn>
      </div>}
  </div>;
}
