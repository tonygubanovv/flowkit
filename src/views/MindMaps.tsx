import React, { useMemo, useRef, useState } from 'react';
import type { MindElixirData, NodeObj } from 'mind-elixir';
import { MindMap, Note, Project, Task } from '../types/Schemas';
import { getMindMapBytes, getMindMapMeta, mindMapToMarkdown, walkMindMap } from '../lib/MindMaps';
import { genId } from '../lib/Helpers';
import { isDoneTask } from '../lib/TaskDomain';
import { downloadMindMapFile, mindMapPngBlob, mindMapSvgBlob } from '../data/MindMapFiles';
import { Btn, ContextMenu, Icon } from '../components/ui/UiExports';
import { CustomDropdown } from '../components/modals/Shared';
import { MindMapEditor, MindMapEditorHandle, MindMapNodeAction } from '../components/MindMapEditor';
import { MindMapNodePanel } from '../components/MindMapNodePanel';
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

function MapWorkspace({ map, ...props }: Props & { map: MindMap }) {
  const editor = useRef<MindMapEditorHandle>(null);
  const [node, setNode] = useState<NodeObj | null>(null);
  const [action, setAction] = useState<{ kind: MindMapNodeAction; x: number; y: number } | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(map.title);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [canvasMenu, setCanvasMenu] = useState<{ x: number; y: number } | null>(null);
  const [selection, setSelection] = useState<NodeObj[]>([]);
  const [notice, setNotice] = useState('');
  const usedBytes = useMemo(() => getMindMapBytes(map.data), [map.data]);
  const saveData = (data: MindElixirData) => props.onSave({ ...map, data, updatedAt: new Date().toISOString() });
  const project = props.projects.find((item) => item.id === map.projectId);
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
      const svg = editor.current?.exportSvg();
      if (!svg) throw new Error('Доска ещё не открылась.');
      downloadMindMapFile(`${fileBase}.${kind}`, kind === 'svg' ? await mindMapSvgBlob(svg) : await mindMapPngBlob(svg));
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : 'Не удалось выгрузить доску.');
    }
  };
  return <section style={S.workspace} aria-label={`Доска «${map.title}»`}>
    <div style={S.toolbar}>
      {renaming ? <input autoFocus aria-label="Название доски" value={title} onChange={(event) => setTitle(event.target.value)}
        onBlur={() => { if (title.trim()) props.onSave({ ...map, title: title.trim(), updatedAt: new Date().toISOString() }); else setTitle(map.title); setRenaming(false); }}
        onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); if (event.key === 'Escape') { setTitle(map.title); setRenaming(false); } }} style={S.title} /> :
        <CustomDropdown value={map.id} placeholder="Выбрать доску" options={props.maps.map((item) => ({ id: item.id, name: item.title }))} onChange={(id: string) => props.onSelect(id)} />}
      <Btn size="sm" variant="subtle" onClick={() => editor.current?.addNode()}><Icon name="plus" size={14} />Ветвь</Btn>
      <Btn size="sm" onClick={() => editor.current?.undo()} title="Отменить · Ctrl+Z"><Icon name="undo" size={15} /></Btn>
      <Btn size="sm" onClick={() => editor.current?.redo()} title="Повторить · Ctrl+Shift+Z"><Icon name="history" size={15} /></Btn>
      <span style={S.spacer} />
      <CustomDropdown alignRight value={map.projectId} placeholder="Без проекта" options={[{ id: null, name: 'Без проекта' }, ...props.projects]} onChange={(id: string | null) => props.onSave({ ...map, projectId: id, updatedAt: new Date().toISOString() })} icon={<Icon name="folder" size={13} />} />
      <Btn size="sm" title="Действия с доской" onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setMenu({ x: rect.right, y: rect.bottom + 6 }); }}><Icon name="menu" size={15} /></Btn>
    </div>
    <div style={S.canvas}>
      <MindMapEditor ref={editor} map={map} tasks={props.tasks} notes={props.notes} projects={props.projects} onChange={saveData} onSelect={setNode} onSelection={setSelection}
        onOpenEntity={(entity) => {
          const task = entity.kind === 'task' ? props.tasks.find((item) => item.id === entity.id) : undefined;
          const note = entity.kind === 'note' ? props.notes.find((item) => item.id === entity.id) : undefined;
          if (task) props.onOpenTask(task);
          if (note) props.onOpenNote(note);
        }}
        onNodeAction={(selected, kind, point) => { setNode(selected); setAction({ kind, ...point }); }}
        onCanvasContext={(point) => setCanvasMenu(point)} />
      <div style={S.canvasControls}>
        <Btn size="sm" onClick={() => editor.current?.fit()} title="Вписать доску в окно"><Icon name="maximize" size={14} /></Btn>
        <Btn size="sm" onClick={() => editor.current?.center()} title="По центру"><Icon name="grid" size={14} /></Btn>
      </div>
      {selection.length > 1 && <div style={S.selectionBar} role="toolbar" aria-label="Действия с выделенными ветвями">
        <span style={S.selectionCount}>{selection.length} выбрано · перетащите, чтобы перенести</span>
        <span style={S.divider} />
        {MIND_MAP_BRANCH_COLORS.map((item) => <button key={item.value} type="button" title={item.name} aria-label={`Цвет ветвей: ${item.name}`}
          style={S.swatch(item.value, false)} onClick={() => editor.current?.setColor(selection.map((node) => node.id), item.value)} />)}
        <span style={S.divider} />
        <Btn size="sm" onClick={() => editor.current?.removeNodes(selection.map((node) => node.id))} title="Удалить выбранные ветви"><Icon name="trash" size={14} /></Btn>
        <Btn size="sm" onClick={() => editor.current?.clearSelection()} title="Снять выделение"><Icon name="x" size={14} /></Btn>
      </div>}
      {notice && <div role="alert" style={S.notice}><span>{notice}</span><Btn size="sm" onClick={() => setNotice('')} title="Закрыть сообщение"><Icon name="x" size={13} /></Btn></div>}
      {canvasMenu && <ContextMenu x={canvasMenu.x} y={canvasMenu.y} onClose={() => setCanvasMenu(null)} items={[
        { icon: 'plus', label: 'Добавить ветвь', onClick: () => editor.current?.addNode() },
        { icon: 'expand', label: 'Раскрыть все ветви', onClick: () => editor.current?.setAllExpanded(true) },
        { icon: 'collapse', label: 'Свернуть все ветви', onClick: () => editor.current?.setAllExpanded(false) },
        '---', { icon: 'maximize', label: 'Вписать доску', onClick: () => editor.current?.fit() },
      ]} />}
    </div>
    {node && action && <MindMapNodePanel key={`${node.id}-${action.kind}`} node={node} tasks={props.tasks} notes={props.notes} projects={props.projects} usedBytes={usedBytes}
      action={action.kind} point={action} onClose={() => setAction(null)}
      onPatch={(patch) => editor.current?.patchNode(node.id, patch)} onOpenTask={(task) => { setAction(null); props.onOpenTask(task); }} onOpenNote={(note) => { setAction(null); props.onOpenNote(note); }} />}
    {menu && <ContextMenu x={menu.x} y={menu.y} onClose={() => setMenu(null)} items={[
      { icon: 'edit', label: 'Переименовать', onClick: () => { setTitle(map.title); setRenaming(true); } },
      ...(project ? [{ icon: 'list', label: 'Добавить задачи проекта', onClick: importProject }] : []),
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
