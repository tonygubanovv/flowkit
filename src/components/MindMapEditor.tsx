import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import MindElixir, { MindElixirData, NodeObj, Topic } from 'mind-elixir';
import { ru } from 'mind-elixir/i18n';
import 'mind-elixir/style.css';
import { MindMap, MindMapNodeMeta, Note, Project, Task } from '../types/Schemas';
import { getMindMapMeta, projectMindMapData, walkMindMap } from '../lib/MindMaps';
import { MIND_MAP_CSS, MIND_MAP_STYLES as S, MIND_MAP_THEME } from '../styles/MindMapStyles';

export interface MindMapEditorHandle {
  addNode: (node?: NodeObj) => void;
  patchNode: (id: string, patch: Partial<NodeObj>) => void;
  undo: () => void;
  redo: () => void;
  center: () => void;
  fit: () => void;
  setAllExpanded: (expanded: boolean) => void;
  setColor: (ids: string[], color: string | null) => void;
  removeNodes: (ids: string[]) => void;
  clearSelection: () => void;
  exportSvg: () => Blob | null;
}

export type MindMapNodeAction = 'task' | 'note' | 'link' | 'files' | 'color';

interface Props {
  map: MindMap;
  tasks: Task[];
  notes: Note[];
  projects: Project[];
  onChange: (data: MindElixirData) => void;
  onSelect: (node: NodeObj | null) => void;
  onSelection: (nodes: NodeObj[]) => void;
  onNodeAction: (node: NodeObj, action: MindMapNodeAction, point: { x: number; y: number }) => void;
  onOpenEntity: (entity: NonNullable<MindMapNodeMeta['entity']>) => void;
  onCanvasContext: (point: { x: number; y: number }) => void;
}

const COLLAPSE_ITEM = 'Свернуть ветвь';

const emitSelection = (mind: MindElixir, props: Props) => {
  const nodes = (mind.currentNodes || []).map((element) => ({ ...element.nodeObj }));
  props.onSelect(nodes.length === 1 ? nodes[0] : null);
  props.onSelection(nodes);
};

const findTopics = (mind: MindElixir, ids: string[]): Topic[] =>
  ids.filter((id) => mind.getObjById(id, mind.nodeData)).map((id) => mind.findEle(id));

const syncEntities = (mind: MindElixir, props: Props) => {
  const ids = mind.currentNodes.map((element) => element.nodeObj.id);
  mind.refresh(projectMindMapData(mind.getData(), props.tasks, props.notes, props.projects));
  mind.selectNodes(findTopics(mind, ids));
  emitSelection(mind, props);
};

export const MindMapEditor = forwardRef<MindMapEditorHandle, Props>(function MindMapEditor(props, ref) {
  const host = useRef<HTMLDivElement>(null);
  const instance = useRef<MindElixir | null>(null);
  const latest = useRef(props);
  latest.current = props;
  const saveRef = useRef<() => void>(() => {});
  const [error, setError] = useState(false);
  const [scale, setScale] = useState(100);

  useImperativeHandle(ref, () => ({
    addNode: (node) => { void instance.current?.addChild(undefined, node); },
    patchNode: (id, patch) => {
      const mind = instance.current;
      if (!mind) return;
      const element = mind.findEle(id);
      if (element) {
        const data = projectMindMapData({ nodeData: { ...element.nodeObj, ...patch } }, latest.current.tasks, latest.current.notes, latest.current.projects);
        void mind.reshapeNode(element, { ...patch, topic: data.nodeData.topic, tags: data.nodeData.tags });
      }
    },
    undo: () => { instance.current?.undo(); },
    redo: () => { instance.current?.redo(); },
    center: () => { instance.current?.toCenter(); },
    fit: () => { instance.current?.scaleFit(); },
    setAllExpanded: (expanded) => {
      const mind = instance.current;
      if (!mind) return;
      mind.nodeData.expanded = true;
      mind.nodeData.children?.forEach((child) => walkMindMap(child, (node) => {
        if (node.children?.length) node.expanded = expanded;
      }));
      mind.refresh();
      saveRef.current();
    },
    setColor: (ids, color) => {
      const mind = instance.current;
      if (!mind) return;
      const topics = findTopics(mind, ids);
      if (!topics.length) return;
      topics.forEach((topic) => {
        if (color) topic.nodeObj.branchColor = color;
        else delete topic.nodeObj.branchColor;
      });
      syncEntities(mind, latest.current);
      saveRef.current();
    },
    removeNodes: (ids) => {
      const mind = instance.current;
      if (!mind) return;
      const topics = findTopics(mind, ids.filter((id) => id !== mind.nodeData.id));
      if (topics.length) void mind.removeNodes(topics);
    },
    clearSelection: () => { instance.current?.clearSelection(); },
    exportSvg: () => {
      const mind = instance.current;
      if (!mind) return null;
      const current = mind.getData();
      const ids = mind.currentNodes.map((element) => element.nodeObj.id);
      const expanded = JSON.parse(JSON.stringify(current)) as MindElixirData;
      walkMindMap(expanded.nodeData, (node) => { if (node.children?.length) node.expanded = true; });
      mind.refresh(expanded);
      try {
        return mind.exportSvg(true);
      } finally {
        mind.refresh(current);
        mind.selectNodes(findTopics(mind, ids));
        emitSelection(mind, latest.current);
      }
    },
  }), []);

  useEffect(() => {
    if (!host.current) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending: MindElixirData | null = null;
    const flush = () => {
      if (timer) clearTimeout(timer);
      if (pending) { latest.current.onChange(pending); pending = null; }
    };
    const requestAction = (action: MindMapNodeAction) => (event: MouseEvent) => {
      const node = mind.currentNodes[0]?.nodeObj || mind.nodeData;
      const menu = mind.container.querySelector<HTMLElement>('.context-menu');
      if (menu) menu.hidden = true;
      latest.current.onNodeAction({ ...node }, action, { x: event.clientX, y: event.clientY });
    };
    const zoomByWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        event.preventDefault();
        mind.move(-event.deltaX, 0);
        return;
      }
      const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 40
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? event.deltaY * mind.container.clientHeight
        : event.deltaY;
      const step = Math.max(-mind.scaleSensitivity, Math.min(mind.scaleSensitivity, -(unit / 10) * mind.scaleSensitivity));
      if (!step) return;
      event.preventDefault();
      mind.scale(mind.scaleVal + step, { x: event.clientX, y: event.clientY });
    };
    const mind: MindElixir = new MindElixir({
      el: host.current, theme: MIND_MAP_THEME, direction: 2, newTopicName: 'Новая мысль',
      contextMenu: { locale: { ...ru, addChild: 'Добавить ветвь', addSibling: 'Добавить соседний узел',
        link: 'Соединить узлы', linkBidirectional: 'Двусторонняя связь', summary: 'Объединить скобкой', clickTips: 'Выберите второй узел' }, focus: false, link: true, extend: [
        { name: COLLAPSE_ITEM, onclick: () => {
          const topic = mind.currentNodes[0];
          const menu = mind.container.querySelector<HTMLElement>('.context-menu');
          if (menu) menu.hidden = true;
          if (topic) mind.expandNode(topic);
        } },
        { name: 'Цвет ветви', onclick: requestAction('color') },
        { name: 'Связать задачу', onclick: requestAction('task') },
        { name: 'Связать заметку', onclick: requestAction('note') },
        { name: 'Ссылка', onclick: requestAction('link') },
        { name: 'Изображение и PDF', onclick: requestAction('files') },
      ] }, toolBar: false,
      allowUndo: true, keypress: true, handleWheel: zoomByWheel, scaleMin: .2, scaleMax: 2,
      before: { beginEdit: (element) => !getMindMapMeta(element?.nodeObj || mind.currentNodes[0]?.nodeObj || mind.nodeData).entity },
    });
    instance.current = mind;
    try {
      mind.init(projectMindMapData(latest.current.map.data, latest.current.tasks, latest.current.notes, latest.current.projects));
      mind.move = (dx, dy) => {
        const matrix = new DOMMatrixReadOnly(mind.map.style.transform);
        mind.map.style.transform = `translate3d(${matrix.m41 + dx}px, ${matrix.m42 + dy}px, 0) scale(${mind.scaleVal})`;
        mind.bus.fire('move', { dx, dy });
        return true;
      };
      mind.selectNode(mind.findEle(mind.nodeData.id));
      emitSelection(mind, latest.current);
      const save = (defer = false) => {
        pending = mind.getData();
        if (timer) clearTimeout(timer);
        if (defer) timer = setTimeout(flush, 300);
        else flush();
        emitSelection(mind, latest.current);
      };
      const undo = mind.undo.bind(mind);
      const redo = mind.redo.bind(mind);
      mind.undo = () => { undo(); syncEntities(mind, latest.current); save(); };
      mind.redo = () => { redo(); syncEntities(mind, latest.current); save(); };
      mind.bus.addListener('operation', (operation) => { if (operation.name !== 'beginEdit') save(); });
      mind.bus.addListener('expandNode', () => save());
      mind.bus.addListener('changeDirection', () => save());
      mind.bus.addListener('selectNodes', () => emitSelection(mind, latest.current));
      mind.bus.addListener('selectNewNode', () => emitSelection(mind, latest.current));
      mind.bus.addListener('unselectNodes', () => emitSelection(mind, latest.current));
      mind.bus.addListener('scale', (value) => setScale(Math.round(value * 100)));
      mind.bus.addListener('updateArrowDelta', () => save(true));
      saveRef.current = save;
      mind.bus.addListener('showContextMenu', () => {
        const node = mind.currentNodes[0]?.nodeObj || mind.nodeData;
        const item = mind.container.querySelector<HTMLElement>(`[id="${COLLAPSE_ITEM}"]`);
        if (!item?.children.length) return;
        item.hidden = node.id === mind.nodeData.id || !node.children?.length;
        item.children[0].textContent = node.expanded === false ? 'Раскрыть ветвь' : COLLAPSE_ITEM;
      });
      const expandAll = (event: MouseEvent) => {
        if ((event.target as Element | null)?.tagName === 'ME-EPD' && (event.ctrlKey || event.metaKey)) save();
      };
      mind.container.addEventListener('click', expandAll);
      mind.disposable.push(() => mind.container.removeEventListener('click', expandAll));
    } catch {
      setError(true);
    }
    window.addEventListener('pagehide', flush);
    window.addEventListener('blur', flush);
    return () => {
      flush();
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('blur', flush);
      mind.destroy();
      instance.current = null;
    };
  }, [props.map.id]);

  useEffect(() => {
    const mind = instance.current;
    if (!mind) return;
    syncEntities(mind, props);
  }, [props.tasks, props.notes, props.projects]);

  return <div className="fk-mind-map" data-mind-map style={S.canvas}>
    <style>{MIND_MAP_CSS}</style>
    <div ref={host} style={S.host} aria-label="Полотно доски" onDoubleClickCapture={(event) => {
      const topic = event.target instanceof Element ? event.target.closest('me-tpc') as Topic | null : null;
      const entity = topic && getMindMapMeta(topic.nodeObj).entity;
      if (entity) { event.stopPropagation(); event.preventDefault(); latest.current.onOpenEntity(entity); }
    }} onContextMenuCapture={(event) => {
      const mind = instance.current;
      if (!mind || !(event.target instanceof Element) || event.nativeEvent.defaultPrevented) return;
      event.preventDefault();
      event.stopPropagation();
      const element = event.target;
      const topic = element?.closest<HTMLElement>('me-tpc')
        ?? element?.closest<HTMLElement>('me-epd')?.parentElement?.querySelector<HTMLElement>('me-tpc') ?? null;
      if (!topic) {
        const menu = mind.container.querySelector<HTMLElement>('.context-menu');
        if (menu) menu.hidden = true;
        latest.current.onCanvasContext({ x: event.clientX, y: event.clientY });
        return;
      }
      mind.selectNode(topic as Topic);
      const menuEvent = new MouseEvent('contextmenu', { clientX: event.clientX, clientY: event.clientY });
      Object.defineProperty(menuEvent, 'target', { value: topic });
      mind.bus.fire('showContextMenu', menuEvent);
    }} />
    {error ? <div role="alert" style={S.empty}>Не удалось открыть карту. Данные сохранены — выберите другую карту или обновите страницу.</div> :
      <div style={S.help}><span /><span>{scale}%</span></div>}
  </div>;
});
