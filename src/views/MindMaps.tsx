import React, { useEffect, useRef, useState } from 'react';
import type { MindElixirData, NodeObj } from 'mind-elixir';
import { MindMap, MindMapObject, Note, Project, Task } from '../types/Schemas';
import { getMindMapMeta, mindMapToMarkdown, walkMindMap } from '../lib/MindMaps';
import { parseBoardMarkdown } from '../lib/MindMapImport';
import { genId } from '../lib/Helpers';
import { BoardSnapshot, createBoardHistory, recordBoardChange, undoBoardChange, redoBoardChange } from '../lib/MindMapHistory';
import { isDoneTask } from '../lib/TaskDomain';
import { downloadMindMapFile, mindMapPngBlob, mindMapSvgBlob } from '../data/MindMapFiles';
import { Btn, ContextMenu, Icon, type ContextMenuItem } from '../components/ui/UiExports';
import { CustomDropdown } from '../components/modals/Shared';
import { MindMapEditor, MindMapEditorHandle } from '../components/MindMapEditor';
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
  onImport?: () => void;
  onSave: (map: MindMap) => void;
  onDelete: (id: string) => void;
  onOpenTask: (task: Task) => void;
  onOpenNote: (note: Note) => void;
}

const NO_OBJECTS: MindMapObject[] = [];

type Clipboard = { kind: 'nodes'; nodes: NodeObj[] } | { kind: 'object'; object: MindMapObject };
type MenuState = { kind: 'board' | 'canvas' | 'node' | 'object'; x: number; y: number };

function MapWorkspace({ map, ...props }: Props & { map: MindMap }) {
  const editor = useRef<MindMapEditorHandle>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const clipboard = useRef<Clipboard | null>(null);
  const history = useRef(createBoardHistory({ data: map.data, objects: map.objects || NO_OBJECTS }));
  const mapRef = useRef(map);
  mapRef.current = map;
  const [historyState, setHistoryState] = useState({ undo: false, redo: false });
  const [node, setNode] = useState<NodeObj | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(map.title);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [selection, setSelection] = useState<NodeObj[]>([]);
  const [notice, setNotice] = useState('');
  const [tool, setTool] = useState<MindMapTool>('select');
  const [navigationMode, setNavigationMode] = useState<'select' | 'pan'>('select');
  const [zoom, setZoom] = useState(100);
  const [objectId, setObjectId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const objects = map.objects || NO_OBJECTS;
  const selectedObject = objects.find((item) => item.id === objectId) || null;
  const persistSnapshot = (snapshot: BoardSnapshot) => {
    const next = { ...mapRef.current, ...snapshot, updatedAt: new Date().toISOString() };
    mapRef.current = next;
    props.onSave(next);
    setHistoryState({ undo: history.current.past.length > 0, redo: history.current.future.length > 0 });
  };
  const saveSnapshot = (snapshot: BoardSnapshot) => {
    const next = recordBoardChange(history.current, snapshot);
    if (next === history.current) return;
    history.current = next;
    persistSnapshot(next.present);
  };
  const saveData = (data: MindElixirData) => saveSnapshot({ ...history.current.present, data });
  const saveObjects = (next: MindMapObject[]) => {
    editor.current?.flush();
    saveSnapshot({ ...history.current.present, objects: next });
  };
  const travelHistory = (redo: boolean) => {
    editor.current?.flush();
    const next = redo ? redoBoardChange(history.current) : undoBoardChange(history.current);
    if (next === history.current) return;
    const dataChanged = next.present.data !== history.current.present.data;
    history.current = next;
    setEditingId(null);
    setObjectId(null);
    setMenu(null);
    if (dataChanged) editor.current?.replaceData(next.present.data);
    persistSnapshot(next.present);
    editor.current?.focus();
  };
  const runUndo = () => travelHistory(false);
  const runRedo = () => travelHistory(true);
  const pasteObject = (source: MindMapObject, point?: { x: number; y: number }) => {
    const anchor = point || pointer.current;
    const canvas = anchor ? editor.current?.toCanvas(anchor.x, anchor.y) : null;
    const copy: MindMapObject = { ...source, id: genId(), x: canvas?.x ?? source.x + 24, y: canvas?.y ?? source.y + 24 };
    saveObjects([...objects, copy]);
    setObjectId(copy.id);
    if (copy.kind !== 'shape') setEditingId(copy.id);
  };
  const removeObject = (id: string) => {
    saveObjects(objects.filter((item) => item.id !== id));
    setObjectId((current) => current === id ? null : current);
    setEditingId((current) => current === id ? null : current);
  };
  const editObject = (id: string) => { setObjectId(id); setEditingId(id); };
  const selectObject = (id: string | null) => { setObjectId(id); };
  const duplicateObject = (object: MindMapObject) => {
    const copy: MindMapObject = { ...object, id: genId(), x: object.x + 20, y: object.y + 20 };
    saveObjects([...objects, copy]);
    setObjectId(copy.id);
  };
  const reorderObject = (id: string, front: boolean) => {
    const target = objects.find((item) => item.id === id);
    if (!target) return;
    const rest = objects.filter((item) => item.id !== id);
    saveObjects(front ? [...rest, target] : [target, ...rest]);
  };
  const copyNodes = () => {
    const nodes = editor.current?.copySelection() || [];
    if (nodes.length) clipboard.current = { kind: 'nodes', nodes };
    return nodes.length > 0;
  };
  const copyCurrent = () => {
    if (selectedObject) {
      clipboard.current = { kind: 'object', object: selectedObject };
      return true;
    }
    return copyNodes();
  };
  const pasteClipboard = (point?: { x: number; y: number }) => {
    const data = clipboard.current;
    if (!data) return;
    if (data.kind === 'object') pasteObject(data.object, point);
    else editor.current?.pasteNodes(data.nodes);
  };
  const deleteNodes = (ids: string[]) => {
    if (ids.length) editor.current?.removeNodes(ids);
  };
  const duplicateCurrent = () => {
    if (selectedObject) duplicateObject(selectedObject);
    else editor.current?.duplicateSelection();
  };
  const colorObject = (object: MindMapObject, color: string | null) => {
    saveObjects(objects.map((item) => item.id === object.id ? { ...item, color: color || undefined } : item));
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
    // Захват на документе: после клика по пункту меню фокус уходит в body, а слои полотна глушат клавиши.
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.isComposing || target?.closest('input, textarea, [contenteditable]:not([contenteditable="false"]), [role="dialog"]')) return;
      if (event.key === 'Escape') {
        setTool('select'); setNavigationMode('select'); setShowHelp(false); setMenu(null);
        setObjectId(null); editor.current?.clearSelection();
        return;
      }
      if (!(event.ctrlKey || event.metaKey)) {
        if (target?.closest('button, a, select')) return;
        if (event.altKey || event.shiftKey) return;
        if (event.code === 'KeyH' || event.code === 'KeyV') {
          event.preventDefault(); event.stopPropagation();
          setNavigationMode(event.code === 'KeyH' ? 'pan' : 'select'); setTool('select');
          return;
        }
        const nextTool = { KeyT: 'text', KeyR: 'rect', KeyC: 'comment' }[event.code] as MindMapTool | undefined;
        if (nextTool) {
          setNavigationMode('select');
          event.preventDefault(); event.stopPropagation();
          setTool((current) => current === nextTool ? 'select' : nextTool);
        } else if (event.key === 'F2' && selectedObject) {
          event.preventDefault(); event.stopPropagation(); editObject(selectedObject.id);
        }
        return;
      }
      if (event.altKey) return;
      const key = ({ KeyZ: 'z', KeyY: 'y', KeyC: 'c', KeyX: 'x', KeyV: 'v', KeyD: 'd' }[event.code] || event.key).toLowerCase();
      if (key === 'z' || key === 'y') {
        event.preventDefault();
        event.stopPropagation();
        if (key === 'y' || (key === 'z' && event.shiftKey)) runRedo(); else runUndo();
      } else if (key === 'c') {
        if (copyCurrent()) { event.preventDefault(); event.stopPropagation(); }
      } else if (key === 'x') {
        if (!copyCurrent()) return;
        event.preventDefault();
        event.stopPropagation();
        if (selectedObject) removeObject(selectedObject.id);
        else deleteNodes(selection.map((item) => item.id));
      } else if (key === 'd') {
        if (!selectedObject && !selection.some((item) => item.id !== map.data.nodeData.id)) return;
        event.preventDefault();
        event.stopPropagation();
        duplicateCurrent();
      } else if (key === 'v' && clipboard.current) {
        event.preventDefault();
        event.stopPropagation();
        pasteClipboard();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [selectedObject, objects, selection, map.data.nodeData.id]);

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
    editor.current?.flush();
    try {
      if (kind === 'md') {
        downloadMindMapFile(`${fileBase}.md`, new Blob([mindMapToMarkdown(mapRef.current, props.tasks, props.notes, props.projects)], { type: 'text/markdown;charset=utf-8' }));
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

  const boardItems: (ContextMenuItem | '---')[] = [
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
    { icon: 'import', label: 'Импортировать доску', onClick: () => { editor.current?.flush(); props.onImport?.(); } },
    '---', { icon: 'trash', label: 'Удалить доску', danger: true, onClick: () => {
      if (window.confirm(`Удалить доску «${map.title}» и её вложения? Задачи и заметки сохранятся.`)) props.onDelete(map.id);
    } },
  ];

  const canvasItems = (point: { x: number; y: number }): (ContextMenuItem | '---')[] => [
    { icon: 'type', label: 'Текст', onClick: () => editor.current?.placeObject('text', point.x, point.y) },
    { icon: 'rect', label: 'Прямоугольник', onClick: () => editor.current?.placeObject('rect', point.x, point.y) },
    { icon: 'message', label: 'Комментарий', onClick: () => editor.current?.placeObject('comment', point.x, point.y) },
    ...(clipboard.current ? ['---' as const, { icon: 'paste', label: 'Вставить', onClick: () => pasteClipboard(point) }] : []),
  ];

  const nodeColorItems = (targets: NodeObj[]): (ContextMenuItem | '---')[] => [
    ...MIND_MAP_BRANCH_COLORS.map((item) => ({
      label: item.name,
      swatch: item.value,
      active: targets.every((target) => target.branchColor === item.value),
      onClick: () => editor.current?.setColor(targets.map((target) => target.id), item.value),
    })),
    '---',
    { label: 'Цвет темы', active: targets.every((target) => !target.branchColor),
      onClick: () => editor.current?.setColor(targets.map((target) => target.id), null) },
  ];

  const nodeItems = (target: NodeObj): (ContextMenuItem | '---')[] => {
    const isRoot = target.id === map.data.nodeData.id;
    const entity = getMindMapMeta(target).entity;
    const multi = selection.length > 1 && selection.some((item) => item.id === target.id);
    const pasted = clipboard.current;
    const paste = pasted?.kind === 'nodes'
      ? { icon: 'paste', label: 'Вставить внутрь', onClick: () => editor.current?.pasteNodes(pasted.nodes) } : null;
    if (multi) {
      const ids = selection.map((item) => item.id);
      return [
        { label: `Выбрано ветвей: ${selection.length}`, disabled: true },
        '---',
        { label: 'Цвет ветвей', children: nodeColorItems(selection) },
        { icon: 'copy', label: `Копировать (${selection.length})`, onClick: copyNodes },
        { icon: 'scissors', label: `Вырезать (${selection.length})`, onClick: () => { if (copyNodes()) deleteNodes(ids); } },
        '---',
        { icon: 'trash', label: `Удалить (${selection.length})`, danger: true, onClick: () => deleteNodes(ids) },
      ];
    }
    return [
      entity
        ? { icon: 'link', label: 'Открыть оригинал', onClick: () => editor.current?.editNode(target.id) }
        : { icon: 'edit', label: 'Править текст', onClick: () => editor.current?.editNode(target.id) },
      { label: 'Цвет ветви', children: nodeColorItems([target]) },
      ...(paste ? ['---' as const, paste] : []),
      ...(isRoot ? [] : ['---' as const,
        { icon: 'copy', label: 'Копировать', onClick: copyNodes },
        { icon: 'scissors', label: 'Вырезать', onClick: () => { if (copyNodes()) deleteNodes([target.id]); } },
        { icon: 'plus', label: 'Дублировать', onClick: () => editor.current?.duplicateSelection() },
        ...(target.children?.length ? [{ icon: target.expanded === false ? 'expand' : 'collapse', label: target.expanded === false ? 'Раскрыть ветвь' : 'Свернуть ветвь', onClick: () => editor.current?.toggleBranch() }] : []),
        '---' as const,
        { icon: 'trash', label: 'Удалить ветвь', danger: true, onClick: () => deleteNodes([target.id]) },
      ]),
    ];
  };

  const objectItems = (target: MindMapObject): (ContextMenuItem | '---')[] => [
    { icon: 'edit', label: 'Править текст', onClick: () => editObject(target.id) },
    { label: 'Цвет', children: [
      ...MIND_MAP_BRANCH_COLORS.map((item) => ({ label: item.name, swatch: item.value, active: target.color === item.value,
        onClick: () => colorObject(target, item.value) })),
      '---',
      { label: 'Цвет темы', active: !target.color, onClick: () => colorObject(target, null) },
    ] },
    '---',
    { icon: 'copy', label: 'Копия рядом', onClick: () => duplicateObject(target) },
    { label: 'На передний план', onClick: () => reorderObject(target.id, true) },
    { label: 'На задний план', onClick: () => reorderObject(target.id, false) },
    '---',
    { icon: 'trash', label: 'Удалить с доски', danger: true, onClick: () => removeObject(target.id) },
  ];

  const menuItems = !menu ? [] : menu.kind === 'board' ? boardItems
    : menu.kind === 'canvas' ? canvasItems(menu)
    : menu.kind === 'node' ? (node ? nodeItems(node) : []) : (selectedObject ? objectItems(selectedObject) : []);

  return <section style={S.workspace} aria-label={`Доска «${map.title}»`}>
    <div style={S.toolbar}>
      {renaming ? <input autoFocus aria-label="Название доски" value={title} onChange={(event) => setTitle(event.target.value)}
        onBlur={() => { if (title.trim()) props.onSave({ ...map, title: title.trim(), updatedAt: new Date().toISOString() }); else setTitle(map.title); setRenaming(false); }}
        onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); if (event.key === 'Escape') { setTitle(map.title); setRenaming(false); } }} style={S.title} /> :
        <CustomDropdown value={map.id} placeholder="Выбрать доску" options={props.maps.map((item) => ({ id: item.id, name: item.title }))} onChange={(id: string) => props.onSelect(id)} />}
      <Btn size="sm" disabled={!historyState.undo} onClick={runUndo} title="Отменить · Ctrl+Z" aria-label="Отменить"><Icon name="undo" size={15} /></Btn>
      <Btn size="sm" disabled={!historyState.redo} onClick={runRedo} title="Повторить · Ctrl+Shift+Z" aria-label="Повторить"><Icon name="history" size={15} /></Btn>
      <Btn size="sm" variant={navigationMode === 'select' ? 'subtle' : 'ghost'} aria-pressed={navigationMode === 'select'} title="Выбор ветвей и объектов · V" onClick={() => { setNavigationMode('select'); setTool('select'); }}><Icon name="pointer" size={14} />Выбор</Btn>
      <Btn size="sm" variant={navigationMode === 'pan' ? 'subtle' : 'ghost'} aria-pressed={navigationMode === 'pan'} title="Тяните доску левой кнопкой мыши · H" onClick={() => { editor.current?.flush(); setEditingId(null); setNavigationMode('pan'); setTool('select'); }}><Icon name="hand" size={14} />Перемещение</Btn>
      <span style={S.spacer} />
      <CustomDropdown alignRight value={map.projectId} placeholder="Без проекта" options={[{ id: null, name: 'Без проекта' }, ...props.projects]} onChange={(id: string | null) => props.onSave({ ...map, projectId: id, updatedAt: new Date().toISOString() })} icon={<Icon name="folder" size={13} />} />
      <Btn size="sm" title="Действия с доской" onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setMenu({ kind: 'board', x: rect.right, y: rect.bottom + 6 }); }}><Icon name="menu" size={15} /></Btn>
    </div>
    <div style={S.canvas} ref={canvasHost} onPointerMove={(event) => { pointer.current = { x: event.clientX, y: event.clientY }; }}>
      <MindMapEditor ref={editor} map={map} tasks={props.tasks} notes={props.notes} projects={props.projects}
        objects={objects} tool={tool} navigationMode={navigationMode} selectedObjectId={objectId} editingObjectId={editingId}
        onChange={saveData} onObjectsChange={saveObjects} onSelect={setNode} onSelection={setSelection} onUndo={runUndo} onRedo={runRedo}
        onSelectObject={selectObject} onEditObject={setEditingId} onToolUse={() => setTool('select')} onScaleChange={setZoom}
        onOpenEntity={(entity) => {
          const task = entity.kind === 'task' ? props.tasks.find((item) => item.id === entity.id) : undefined;
          const note = entity.kind === 'note' ? props.notes.find((item) => item.id === entity.id) : undefined;
          if (task) props.onOpenTask(task);
          if (note) props.onOpenNote(note);
        }}
        onNodeMenu={(target, point) => { setObjectId(null); setNode(target); setMenu({ kind: 'node', ...point }); }}
        onCanvasMenu={(point) => { setObjectId(null); setMenu({ kind: 'canvas', ...point }); }}
        onObjectMenu={(id, point) => { setObjectId(id); setMenu({ kind: 'object', ...point }); }} />
      <div style={S.canvasControls} role="toolbar" aria-label="Масштаб доски">
        <Btn size="sm" style={S.zoom} onClick={() => editor.current?.resetZoom()} title="Сбросить масштаб">{zoom}%</Btn>
        <Btn size="sm" onClick={() => editor.current?.fit()} title="Вписать доску в окно"><Icon name="maximize" size={14} /></Btn>
        <Btn size="sm" onClick={() => editor.current?.center()} title="По центру" aria-label="По центру"><Icon name="grid" size={14} /></Btn>
        <Btn size="sm" onClick={() => setShowHelp((current) => !current)} title="Клавиши и управление" aria-label="Клавиши и управление" aria-pressed={showHelp}>?</Btn>
      </div>
      {showHelp && <aside style={S.help} aria-label="Клавиши и управление">
        <div style={S.row}><strong>Управление доской</strong><span style={S.spacer} /><Btn size="sm" onClick={() => setShowHelp(false)} aria-label="Закрыть справку"><Icon name="x" size={14} /></Btn></div>
        <div>Правый клик — действия с ветвью, объектом и доской</div>
        <div>Двойной клик или F2 — править текст</div>
        <div>Ссылка в тексте: клик — открыть сайт,<br />двойной клик — править текст</div>
        <div>Tab — дочерняя ветвь · Enter — соседняя</div>
        <div>T / R / C — текст, прямоугольник, комментарий</div>
        <div>Перетащите ветвь на другую — она станет её дочерней</div>
        <div>В тексте объекта: Enter — новая строка;<br />Esc или Ctrl+Enter — закончить правку</div>
        <div>Ctrl+C / X / V — копировать, вырезать, вставить ветви или объект</div>
        <div>Ctrl+D — копия рядом · Ctrl+Z — отменить</div>
        <div>H — перемещение левой кнопкой · V — выбор</div>
        <div>Пробел + перетаскивание или зажатое колёсико — двигать полотно</div>
        <div>Колесо — масштаб · Ctrl+клик — выбор ветвей</div>
        <span style={S.muted}>На Mac вместо Ctrl используйте ⌘.</span>
      </aside>}
      {tool !== 'select' && <div style={S.toolHint} role="status">
        <Icon name={activeTool?.icon || 'pointer'} size={13} />
        <span>Кликните по доске, чтобы добавить {activeTool?.label.toLowerCase()}. Esc — отмена.</span>
      </div>}
      {notice && <div role="alert" style={S.notice}><span>{notice}</span><Btn size="sm" onClick={() => setNotice('')} title="Закрыть сообщение"><Icon name="x" size={13} /></Btn></div>}
    </div>
    {menu && menuItems.length > 0 && <ContextMenu x={menu.x} y={menu.y} onClose={() => setMenu(null)} items={menuItems} />}
  </section>;
}

export function MindMapsView(props: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState('');
  const importFile = async (file: File) => {
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('Файл доски превышает 10 МБ.');
      const { map, legacy } = parseBoardMarkdown(await file.text(), props.maps, props.projectFilter);
      if (legacy && !window.confirm(`В файле нет ID. Обновить доску «${map.title}» по совпадению названия?`)) return;
      props.onSave(map);
      props.onSelect(map.id);
      setRevision((value) => value + 1);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось импортировать доску.');
    }
  };
  const maps = props.maps.filter((map) => !props.projectFilter || map.projectId === props.projectFilter);
  const selected = maps.find((map) => map.id === props.selectedId) || maps[0];
  return <div style={S.shell}>
    <input ref={input} type="file" accept=".md,.markdown,text/markdown,text/plain" hidden aria-label="Импортировать доску" onChange={(event) => {
      const file = event.target.files?.[0]; event.target.value = ''; if (file) void importFile(file);
    }} />
    {error && <div role="alert" style={S.notice}><span>{error}</span><Btn size="sm" onClick={() => setError('')}>Закрыть</Btn></div>}
    {selected ? <MapWorkspace key={`${selected.id}:${revision}`} {...props} maps={maps} map={selected} onImport={() => input.current?.click()} /> :
      <div style={S.empty}>
        <Icon name="mindMap" size={32} color="var(--muted)" />
        <h2 style={S.emptyTitle}>Место для ваших идей</h2>
        <span style={S.muted}>Ветви растут по Tab, правый клик по доске добавляет текст, фигуру и комментарий. Перетащите ветвь на другую — она станет её дочерней.</span>
        <Btn variant="primary" onClick={props.onCreate}><Icon name="plus" size={16} />Создать доску</Btn>
        <Btn onClick={() => input.current?.click()}>Импортировать доску</Btn>
      </div>}
  </div>;
}
